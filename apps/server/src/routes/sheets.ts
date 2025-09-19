/**
 * Sheets Routes
 * Construction Master App - Spreadsheet Management API
 */

import express from 'express'
import Sheet from '../models/Sheet'
import Project from '../models/Project'
import { authenticateToken, requirePermission, PERMISSIONS } from '../middleware/auth'
import { validate, sheetSchemas } from '../middleware/validation'
import { rateLimiters } from '../middleware/security'
import { z } from 'zod'

const router = express.Router()

// Rate limiting
router.use(rateLimiters.general)

// אימות לכל הroutes
router.use(authenticateToken)

// קבלת רשימת גיליונות לפרויקט
router.get('/project/:projectId', validate(sheetSchemas.list), async (req, res) => {
    try {
        const { projectId } = req.params
        const { type, page = 1, limit = 20, sort = 'createdAt', order = 'desc' } = req.query

        // בדיקת הרשאות לפרויקט
        const project = await Project.findById(projectId)
        if (!project) {
            return res.status(404).json({
                success: false,
                message: 'פרויקט לא נמצא',
                code: 'PROJECT_NOT_FOUND'
            })
        }

        const hasAccess = req.user!.role === 'admin' ||
            project.ownerId.toString() === req.user!.id ||
            project.assignedUsers.includes(req.user!.id as any)

        if (!hasAccess) {
            return res.status(403).json({
                success: false,
                message: 'אין הרשאה לגשת לפרויקט זה',
                code: 'PROJECT_ACCESS_DENIED'
            })
        }

        // בניית query
        const query: any = { projectId }
        if (type) {
            query.type = type
        }

        // חישוב pagination
        const skip = (Number(page) - 1) * Number(limit)
        const total = await Sheet.countDocuments(query)

        // בניית sort object
        const sortObj: any = {}
        sortObj[sort as string] = order === 'desc' ? -1 : 1

        const sheets = await Sheet.find(query)
            .populate('createdBy', 'name email avatar')
            .sort(sortObj)
            .skip(skip)
            .limit(Number(limit))

        res.json({
            success: true,
            data: sheets,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total,
                pages: Math.ceil(total / Number(limit))
            }
        })
    } catch (error) {
        console.error('Get sheets error:', error)
        res.status(500).json({
            success: false,
            message: 'שגיאת שרת',
            code: 'GET_SHEETS_ERROR'
        })
    }
})

// קבלת גיליון לפי ID
router.get('/:id', validate(sheetSchemas.getById), async (req, res) => {
    try {
        const sheet = await Sheet.findById(req.params.id)
            .populate('createdBy', 'name email avatar')
            .populate('projectId', 'name status')

        if (!sheet) {
            return res.status(404).json({
                success: false,
                message: 'גיליון לא נמצא',
                code: 'SHEET_NOT_FOUND'
            })
        }

        // בדיקת הרשאות לפרויקט
        const project = await Project.findById(sheet.projectId)
        if (!project) {
            return res.status(404).json({
                success: false,
                message: 'פרויקט לא נמצא',
                code: 'PROJECT_NOT_FOUND'
            })
        }

        const hasAccess = req.user!.role === 'admin' ||
            project.ownerId.toString() === req.user!.id ||
            project.assignedUsers.includes(req.user!.id as any)

        if (!hasAccess) {
            return res.status(403).json({
                success: false,
                message: 'אין הרשאה לגשת לגיליון זה',
                code: 'SHEET_ACCESS_DENIED'
            })
        }

        res.json({
            success: true,
            data: sheet
        })
    } catch (error) {
        console.error('Get sheet error:', error)
        res.status(500).json({
            success: false,
            message: 'שגיאת שרת',
            code: 'GET_SHEET_ERROR'
        })
    }
})

// יצירת גיליון חדש
router.post('/',
    requirePermission(PERMISSIONS.SHEET_CREATE),
    validate(sheetSchemas.create),
    async (req, res) => {
        try {
            const { projectId } = req.body

            // בדיקת הרשאות לפרויקט
            const project = await Project.findById(projectId)
            if (!project) {
                return res.status(404).json({
                    success: false,
                    message: 'פרויקט לא נמצא',
                    code: 'PROJECT_NOT_FOUND'
                })
            }

            const hasAccess = req.user!.role === 'admin' ||
                project.ownerId.toString() === req.user!.id ||
                project.assignedUsers.includes(req.user!.id as any)

            if (!hasAccess) {
                return res.status(403).json({
                    success: false,
                    message: 'אין הרשאה ליצור גיליון בפרויקט זה',
                    code: 'SHEET_CREATE_DENIED'
                })
            }

            const sheetData = {
                ...req.body,
                createdBy: req.user!.id
            }

            const sheet = new Sheet(sheetData)
            await sheet.save()

            await sheet.populate('createdBy', 'name email avatar')
            await sheet.populate('projectId', 'name status')

            res.status(201).json({
                success: true,
                data: sheet,
                message: 'גיליון נוצר בהצלחה'
            })
        } catch (error) {
            console.error('Create sheet error:', error)
            res.status(500).json({
                success: false,
                message: 'שגיאת שרת',
                code: 'CREATE_SHEET_ERROR'
            })
        }
    })

// עדכון גיליון
router.put('/:id',
    requirePermission(PERMISSIONS.SHEET_UPDATE),
    validate(sheetSchemas.update),
    async (req, res) => {
        try {
            const sheet = await Sheet.findById(req.params.id)

            if (!sheet) {
                return res.status(404).json({
                    success: false,
                    message: 'גיליון לא נמצא',
                    code: 'SHEET_NOT_FOUND'
                })
            }

            // בדיקת הרשאות לפרויקט
            const project = await Project.findById(sheet.projectId)
            if (!project) {
                return res.status(404).json({
                    success: false,
                    message: 'פרויקט לא נמצא',
                    code: 'PROJECT_NOT_FOUND'
                })
            }

            const hasAccess = req.user!.role === 'admin' ||
                project.ownerId.toString() === req.user!.id ||
                project.assignedUsers.includes(req.user!.id as any)

            if (!hasAccess) {
                return res.status(403).json({
                    success: false,
                    message: 'אין הרשאה לעדכן גיליון זה',
                    code: 'SHEET_UPDATE_DENIED'
                })
            }

            // עדכון הגיליון
            Object.assign(sheet, req.body)
            await sheet.save()

            await sheet.populate('createdBy', 'name email avatar')

            res.json({
                success: true,
                data: sheet,
                message: 'גיליון עודכן בהצלחה'
            })
        } catch (error) {
            console.error('Update sheet error:', error)
            res.status(500).json({
                success: false,
                message: 'שגיאת שרת',
                code: 'UPDATE_SHEET_ERROR'
            })
        }
    })

// מחיקת גיליון
router.delete('/:id',
    requirePermission(PERMISSIONS.SHEET_DELETE),
    validate(sheetSchemas.getById),
    async (req, res) => {
        try {
            const sheet = await Sheet.findById(req.params.id)

            if (!sheet) {
                return res.status(404).json({
                    success: false,
                    message: 'גיליון לא נמצא',
                    code: 'SHEET_NOT_FOUND'
                })
            }

            // בדיקת הרשאות לפרויקט
            const project = await Project.findById(sheet.projectId)
            if (!project) {
                return res.status(404).json({
                    success: false,
                    message: 'פרויקט לא נמצא',
                    code: 'PROJECT_NOT_FOUND'
                })
            }

            const hasAccess = req.user!.role === 'admin' ||
                project.ownerId.toString() === req.user!.id

            if (!hasAccess) {
                return res.status(403).json({
                    success: false,
                    message: 'אין הרשאה למחוק גיליון זה',
                    code: 'SHEET_DELETE_DENIED'
                })
            }

            await Sheet.findByIdAndDelete(req.params.id)

            res.json({
                success: true,
                message: 'גיליון נמחק בהצלחה'
            })
        } catch (error) {
            console.error('Delete sheet error:', error)
            res.status(500).json({
                success: false,
                message: 'שגיאת שרת',
                code: 'DELETE_SHEET_ERROR'
            })
        }
    })

// עדכון תא בודד
router.patch('/:id/cells',
    requirePermission(PERMISSIONS.SHEET_UPDATE),
    validate(sheetSchemas.updateCell),
    async (req, res) => {
        try {
            const { row, col, value, formula, type, style } = req.body

            const sheet = await Sheet.findById(req.params.id)

            if (!sheet) {
                return res.status(404).json({
                    success: false,
                    message: 'גיליון לא נמצא',
                    code: 'SHEET_NOT_FOUND'
                })
            }

            // בדיקת הרשאות לפרויקט
            const project = await Project.findById(sheet.projectId)
            if (!project) {
                return res.status(404).json({
                    success: false,
                    message: 'פרויקט לא נמצא',
                    code: 'PROJECT_NOT_FOUND'
                })
            }

            const hasAccess = req.user!.role === 'admin' ||
                project.ownerId.toString() === req.user!.id ||
                project.assignedUsers.includes(req.user!.id as any)

            if (!hasAccess) {
                return res.status(403).json({
                    success: false,
                    message: 'אין הרשאה לעדכן גיליון זה',
                    code: 'SHEET_UPDATE_DENIED'
                })
            }

            // עדכון התא
            sheet.setCell(row, col, value, type)

            // עדכון נוסחה אם ניתנה
            if (formula) {
                sheet.setFormula(row, col, formula)
            }

            // עדכון סגנון אם ניתן
            const cell = sheet.getCell(row, col)
            if (cell && style) {
                cell.style = { ...cell.style, ...style }
            }

            await sheet.save()

            res.json({
                success: true,
                data: {
                    cell: sheet.getCell(row, col),
                    version: sheet.metadata.version
                },
                message: 'תא עודכן בהצלחה'
            })
        } catch (error) {
            console.error('Update cell error:', error)
            res.status(500).json({
                success: false,
                message: 'שגיאת שרת',
                code: 'UPDATE_CELL_ERROR'
            })
        }
    })

// עדכון תאים מרובים
router.patch('/:id/cells/batch',
    requirePermission(PERMISSIONS.SHEET_UPDATE),
    validate(sheetSchemas.batchUpdateCells),
    async (req, res) => {
        try {
            const { cells } = req.body

            const sheet = await Sheet.findById(req.params.id)

            if (!sheet) {
                return res.status(404).json({
                    success: false,
                    message: 'גיליון לא נמצא',
                    code: 'SHEET_NOT_FOUND'
                })
            }

            // בדיקת הרשאות לפרויקט
            const project = await Project.findById(sheet.projectId)
            if (!project) {
                return res.status(404).json({
                    success: false,
                    message: 'פרויקט לא נמצא',
                    code: 'PROJECT_NOT_FOUND'
                })
            }

            const hasAccess = req.user!.role === 'admin' ||
                project.ownerId.toString() === req.user!.id ||
                project.assignedUsers.includes(req.user!.id as any)

            if (!hasAccess) {
                return res.status(403).json({
                    success: false,
                    message: 'אין הרשאה לעדכן גיליון זה',
                    code: 'SHEET_UPDATE_DENIED'
                })
            }

            // עדכון תאים
            const updatedCells = []
            for (const cellData of cells) {
                const { row, col, value, formula, type, style } = cellData

                sheet.setCell(row, col, value, type)

                if (formula) {
                    sheet.setFormula(row, col, formula)
                }

                const cell = sheet.getCell(row, col)
                if (cell && style) {
                    cell.style = { ...cell.style, ...style }
                }

                updatedCells.push(cell)
            }

            await sheet.save()

            res.json({
                success: true,
                data: {
                    cells: updatedCells,
                    version: sheet.metadata.version
                },
                message: `${cells.length} תאים עודכנו בהצלחה`
            })
        } catch (error) {
            console.error('Batch update cells error:', error)
            res.status(500).json({
                success: false,
                message: 'שגיאת שרת',
                code: 'BATCH_UPDATE_CELLS_ERROR'
            })
        }
    })

// קבלת תא ספציפי
router.get('/:id/cells/:row/:col',
    validate(sheetSchemas.getById),
    async (req, res) => {
        try {
            const { row, col } = req.params
            const rowNum = parseInt(row)
            const colNum = parseInt(col)

            if (isNaN(rowNum) || isNaN(colNum)) {
                return res.status(400).json({
                    success: false,
                    message: 'קואורדינטות תא לא תקינות',
                    code: 'INVALID_CELL_COORDINATES'
                })
            }

            const sheet = await Sheet.findById(req.params.id)

            if (!sheet) {
                return res.status(404).json({
                    success: false,
                    message: 'גיליון לא נמצא',
                    code: 'SHEET_NOT_FOUND'
                })
            }

            // בדיקת הרשאות לפרויקט
            const project = await Project.findById(sheet.projectId)
            if (!project) {
                return res.status(404).json({
                    success: false,
                    message: 'פרויקט לא נמצא',
                    code: 'PROJECT_NOT_FOUND'
                })
            }

            const hasAccess = req.user!.role === 'admin' ||
                project.ownerId.toString() === req.user!.id ||
                project.assignedUsers.includes(req.user!.id as any)

            if (!hasAccess) {
                return res.status(403).json({
                    success: false,
                    message: 'אין הרשאה לגשת לגיליון זה',
                    code: 'SHEET_ACCESS_DENIED'
                })
            }

            const cell = sheet.getCell(rowNum, colNum)

            res.json({
                success: true,
                data: {
                    cell,
                    coordinates: { row: rowNum, col: colNum }
                }
            })
        } catch (error) {
            console.error('Get cell error:', error)
            res.status(500).json({
                success: false,
                message: 'שגיאת שרת',
                code: 'GET_CELL_ERROR'
            })
        }
    })

// ייבוא גיליון מקובץ
router.post('/:id/import',
    requirePermission(PERMISSIONS.SHEET_UPDATE),
    validate(sheetSchemas.getById),
    async (req, res) => {
        try {
            // TODO: Implement file import functionality
            // This would handle Excel/CSV import

            res.status(501).json({
                success: false,
                message: 'פונקציונליות ייבוא עדיין לא מיושמת',
                code: 'NOT_IMPLEMENTED'
            })
        } catch (error) {
            console.error('Import sheet error:', error)
            res.status(500).json({
                success: false,
                message: 'שגיאת שרת',
                code: 'IMPORT_SHEET_ERROR'
            })
        }
    })

// ייצוא גיליון לקובץ
router.get('/:id/export',
    validate(sheetSchemas.getById),
    async (req, res) => {
        try {
            const { format = 'xlsx' } = req.query

            const sheet = await Sheet.findById(req.params.id)
            if (!sheet) {
                return res.status(404).json({
                    success: false,
                    message: 'גיליון לא נמצא',
                    code: 'SHEET_NOT_FOUND'
                })
            }

            // בדיקת הרשאות לפרויקט
            const project = await Project.findById(sheet.projectId)
            if (!project) {
                return res.status(404).json({
                    success: false,
                    message: 'פרויקט לא נמצא',
                    code: 'PROJECT_NOT_FOUND'
                })
            }

            const hasAccess = req.user!.role === 'admin' ||
                project.ownerId.toString() === req.user!.id ||
                project.assignedUsers.includes(req.user!.id as any)

            if (!hasAccess) {
                return res.status(403).json({
                    success: false,
                    message: 'אין הרשאה לייצא גיליון זה',
                    code: 'SHEET_EXPORT_DENIED'
                })
            }

            // TODO: Implement export functionality
            // This would generate Excel/CSV/PDF files

            res.status(501).json({
                success: false,
                message: 'פונקציונליות ייצוא עדיין לא מיושמת',
                code: 'NOT_IMPLEMENTED'
            })
        } catch (error) {
            console.error('Export sheet error:', error)
            res.status(500).json({
                success: false,
                message: 'שגיאת שרת',
                code: 'EXPORT_SHEET_ERROR'
            })
        }
    })

// יצירת גיליון מתבנית
router.post('/:templateId/clone',
    requirePermission(PERMISSIONS.SHEET_CREATE),
    validate(sheetSchemas.getById),
    async (req, res) => {
        try {
            const { name, projectId } = req.body

            if (!name || !projectId) {
                return res.status(400).json({
                    success: false,
                    message: 'שם ופרויקט נדרשים',
                    code: 'MISSING_REQUIRED_FIELDS'
                })
            }

            // בדיקת קיום התבנית
            const template = await Sheet.findById(req.params.templateId)
            if (!template || !template.isTemplate) {
                return res.status(404).json({
                    success: false,
                    message: 'תבנית לא נמצאה',
                    code: 'TEMPLATE_NOT_FOUND'
                })
            }

            // בדיקת הרשאות לפרויקט
            const project = await Project.findById(projectId)
            if (!project) {
                return res.status(404).json({
                    success: false,
                    message: 'פרויקט לא נמצא',
                    code: 'PROJECT_NOT_FOUND'
                })
            }

            const hasAccess = req.user!.role === 'admin' ||
                project.ownerId.toString() === req.user!.id ||
                project.assignedUsers.includes(req.user!.id as any)

            if (!hasAccess) {
                return res.status(403).json({
                    success: false,
                    message: 'אין הרשאה ליצור גיליון בפרויקט זה',
                    code: 'SHEET_CREATE_DENIED'
                })
            }

            // יצירת גיליון חדש מהתבנית
            const sheetData = {
                name,
                projectId,
                type: template.type,
                description: template.description,
                createdBy: req.user!.id,
                templateId: template._id,
                cells: template.cells,
                metadata: {
                    ...template.metadata,
                    version: 1
                }
            }

            const sheet = new Sheet(sheetData)
            await sheet.save()

            await sheet.populate('createdBy', 'name email avatar')
            await sheet.populate('projectId', 'name status')

            res.status(201).json({
                success: true,
                data: sheet,
                message: 'גיליון נוצר מתבנית בהצלחה'
            })
        } catch (error) {
            console.error('Clone sheet error:', error)
            res.status(500).json({
                success: false,
                message: 'שגיאת שרת',
                code: 'CLONE_SHEET_ERROR'
            })
        }
    })

export default router
