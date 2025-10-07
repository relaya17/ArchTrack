/**
 * BIM Integration Routes
 * Construction Master App - BIM Tools Integration API
 */

import express from 'express'
import multer from 'multer'
import path from 'path'
import { authenticateToken, requirePermission, PERMISSIONS } from '../middleware/auth'
import { rateLimiters } from '../middleware/security'
import { asyncHandler } from '../middleware/errorHandler'
import bimService from '../services/bimService'

const router = express.Router()

// Rate limiting for BIM endpoints
router.use(rateLimiters.upload)

// Authentication required for all BIM endpoints
router.use(authenticateToken)

// Configure multer for BIM file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const projectId = req.params.projectId || 'temp'
        const uploadDir = path.join(process.cwd(), 'temp', 'bim', projectId)
        cb(null, uploadDir)
    },
    filename: (req, file, cb) => {
        const uniqueId = require('uuid').v4()
        const extension = path.extname(file.originalname)
        cb(null, `${uniqueId}${extension}`)
    }
})

const upload = multer({
    storage,
    limits: {
        fileSize: 100 * 1024 * 1024 // 100MB limit
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = [
            '.rvt', '.rfa', // Revit
            '.dwg', '.dxf', // AutoCAD
            '.ifc', // IFC
            '.skp', // SketchUp
            '.pln', '.gsm' // ArchiCAD
        ]
        const fileExtension = path.extname(file.originalname).toLowerCase()
        
        if (allowedTypes.includes(fileExtension)) {
            cb(null, true)
        } else {
            cb(new Error('סוג קובץ לא נתמך'), false)
        }
    }
})

// Upload BIM file
router.post('/upload/:projectId',
    requirePermission(PERMISSIONS.FILE_UPLOAD),
    upload.single('bimFile'),
    asyncHandler(async (req: express.Request, res: express.Response) => {
        try {
            const { projectId } = req.params
            const userId = req.user!.id

            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    message: 'נדרש קובץ BIM',
                    code: 'MISSING_BIM_FILE'
                })
            }

            const bimFile = await bimService.processBIMFile(req.file, projectId, userId)

            res.status(201).json({
                success: true,
                data: bimFile,
                message: 'קובץ BIM הועלה בהצלחה'
            })
        } catch (error) {
            console.error('BIM file upload error:', error)
            res.status(500).json({
                success: false,
                message: 'שגיאה בהעלאת קובץ BIM',
                code: 'BIM_UPLOAD_ERROR'
            })
        }
    })
)

// Get BIM files for project
router.get('/project/:projectId',
    requirePermission(PERMISSIONS.FILE_DOWNLOAD),
    asyncHandler(async (req: express.Request, res: express.Response) => {
        try {
            const { projectId } = req.params
            const bimFiles = await bimService.getProjectBIMFiles(projectId)

            res.json({
                success: true,
                data: bimFiles,
                message: 'קבצי BIM התקבלו בהצלחה'
            })
        } catch (error) {
            console.error('Get BIM files error:', error)
            res.status(500).json({
                success: false,
                message: 'שגיאה בקבלת קבצי BIM',
                code: 'GET_BIM_FILES_ERROR'
            })
        }
    })
)

// Get specific BIM file
router.get('/file/:fileId',
    requirePermission(PERMISSIONS.FILE_DOWNLOAD),
    asyncHandler(async (req: express.Request, res: express.Response) => {
        try {
            const { fileId } = req.params
            const bimFile = await bimService.getBIMFile(fileId)

            if (!bimFile) {
                return res.status(404).json({
                    success: false,
                    message: 'קובץ BIM לא נמצא',
                    code: 'BIM_FILE_NOT_FOUND'
                })
            }

            res.json({
                success: true,
                data: bimFile,
                message: 'קובץ BIM התקבל בהצלחה'
            })
        } catch (error) {
            console.error('Get BIM file error:', error)
            res.status(500).json({
                success: false,
                message: 'שגיאה בקבלת קובץ BIM',
                code: 'GET_BIM_FILE_ERROR'
            })
        }
    })
)

// Delete BIM file
router.delete('/file/:fileId',
    requirePermission(PERMISSIONS.FILE_DELETE),
    asyncHandler(async (req: express.Request, res: express.Response) => {
        try {
            const { fileId } = req.params
            const success = await bimService.deleteBIMFile(fileId)

            if (!success) {
                return res.status(404).json({
                    success: false,
                    message: 'קובץ BIM לא נמצא',
                    code: 'BIM_FILE_NOT_FOUND'
                })
            }

            res.json({
                success: true,
                message: 'קובץ BIM נמחק בהצלחה'
            })
        } catch (error) {
            console.error('Delete BIM file error:', error)
            res.status(500).json({
                success: false,
                message: 'שגיאה במחיקת קובץ BIM',
                code: 'DELETE_BIM_FILE_ERROR'
            })
        }
    })
)

// Export BIM file
router.post('/export/:fileId',
    requirePermission(PERMISSIONS.FILE_DOWNLOAD),
    asyncHandler(async (req: express.Request, res: express.Response) => {
        try {
            const { fileId } = req.params
            const { format = 'gltf', quality = 'medium', includeMaterials = true } = req.body

            const exportOptions = {
                format,
                quality,
                includeMaterials,
                includeTextures: true,
                includeAnimations: false,
                compression: true
            }

            const exportData = await bimService.exportBIMFile(fileId, exportOptions)

            // Set appropriate headers
            let contentType: string
            let filename: string

            switch (format) {
                case 'obj':
                    contentType = 'application/obj'
                    filename = `bim-export-${fileId}.obj`
                    break
                case 'gltf':
                    contentType = 'model/gltf+json'
                    filename = `bim-export-${fileId}.gltf`
                    break
                case 'glb':
                    contentType = 'model/gltf-binary'
                    filename = `bim-export-${fileId}.glb`
                    break
                case 'fbx':
                    contentType = 'application/octet-stream'
                    filename = `bim-export-${fileId}.fbx`
                    break
                case 'dae':
                    contentType = 'model/vnd.collada+xml'
                    filename = `bim-export-${fileId}.dae`
                    break
                case 'stl':
                    contentType = 'application/sla'
                    filename = `bim-export-${fileId}.stl`
                    break
                default:
                    contentType = 'application/octet-stream'
                    filename = `bim-export-${fileId}.${format}`
            }

            res.setHeader('Content-Type', contentType)
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
            res.setHeader('Content-Length', exportData.length)

            res.send(exportData)
        } catch (error) {
            console.error('Export BIM file error:', error)
            res.status(500).json({
                success: false,
                message: 'שגיאה בייצוא קובץ BIM',
                code: 'EXPORT_BIM_FILE_ERROR'
            })
        }
    })
)

// Get BIM file statistics
router.get('/file/:fileId/stats',
    requirePermission(PERMISSIONS.ANALYTICS_VIEW),
    asyncHandler(async (req: express.Request, res: express.Response) => {
        try {
            const { fileId } = req.params
            const stats = await bimService.getBIMFileStats(fileId)

            res.json({
                success: true,
                data: stats,
                message: 'סטטיסטיקות קובץ BIM התקבלו בהצלחה'
            })
        } catch (error) {
            console.error('Get BIM file stats error:', error)
            res.status(500).json({
                success: false,
                message: 'שגיאה בקבלת סטטיסטיקות קובץ BIM',
                code: 'GET_BIM_FILE_STATS_ERROR'
            })
        }
    })
)

// Search BIM elements
router.post('/file/:fileId/search',
    requirePermission(PERMISSIONS.ANALYTICS_VIEW),
    asyncHandler(async (req: express.Request, res: express.Response) => {
        try {
            const { fileId } = req.params
            const { query } = req.body

            if (!query) {
                return res.status(400).json({
                    success: false,
                    message: 'נדרש שאילתת חיפוש',
                    code: 'MISSING_SEARCH_QUERY'
                })
            }

            const elements = await bimService.searchBIMElements(fileId, query)

            res.json({
                success: true,
                data: elements,
                message: 'חיפוש אלמנטים הושלם בהצלחה'
            })
        } catch (error) {
            console.error('Search BIM elements error:', error)
            res.status(500).json({
                success: false,
                message: 'שגיאה בחיפוש אלמנטים',
                code: 'SEARCH_BIM_ELEMENTS_ERROR'
            })
        }
    })
)

// Get BIM element properties
router.get('/file/:fileId/element/:elementId/properties',
    requirePermission(PERMISSIONS.ANALYTICS_VIEW),
    asyncHandler(async (req: express.Request, res: express.Response) => {
        try {
            const { fileId, elementId } = req.params
            const properties = await bimService.getBIMElementProperties(fileId, elementId)

            res.json({
                success: true,
                data: properties,
                message: 'מאפיינים של אלמנט התקבלו בהצלחה'
            })
        } catch (error) {
            console.error('Get BIM element properties error:', error)
            res.status(500).json({
                success: false,
                message: 'שגיאה בקבלת מאפיינים של אלמנט',
                code: 'GET_BIM_ELEMENT_PROPERTIES_ERROR'
            })
        }
    })
)

// Update BIM element properties
router.put('/file/:fileId/element/:elementId/properties',
    requirePermission(PERMISSIONS.FILE_UPDATE),
    asyncHandler(async (req: express.Request, res: express.Response) => {
        try {
            const { fileId, elementId } = req.params
            const { properties } = req.body

            if (!properties) {
                return res.status(400).json({
                    success: false,
                    message: 'נדרשים מאפיינים לעדכון',
                    code: 'MISSING_PROPERTIES'
                })
            }

            const success = await bimService.updateBIMElementProperties(fileId, elementId, properties)

            if (!success) {
                return res.status(404).json({
                    success: false,
                    message: 'אלמנט לא נמצא',
                    code: 'BIM_ELEMENT_NOT_FOUND'
                })
            }

            res.json({
                success: true,
                message: 'מאפיינים של אלמנט עודכנו בהצלחה'
            })
        } catch (error) {
            console.error('Update BIM element properties error:', error)
            res.status(500).json({
                success: false,
                message: 'שגיאה בעדכון מאפיינים של אלמנט',
                code: 'UPDATE_BIM_ELEMENT_PROPERTIES_ERROR'
            })
        }
    })
)

// Get BIM materials
router.get('/file/:fileId/materials',
    requirePermission(PERMISSIONS.ANALYTICS_VIEW),
    asyncHandler(async (req: express.Request, res: express.Response) => {
        try {
            const { fileId } = req.params
            const materials = await bimService.getBIMMaterials(fileId)

            res.json({
                success: true,
                data: materials,
                message: 'חומרים התקבלו בהצלחה'
            })
        } catch (error) {
            console.error('Get BIM materials error:', error)
            res.status(500).json({
                success: false,
                message: 'שגיאה בקבלת חומרים',
                code: 'GET_BIM_MATERIALS_ERROR'
            })
        }
    })
)

// Get BIM layers
router.get('/file/:fileId/layers',
    requirePermission(PERMISSIONS.ANALYTICS_VIEW),
    asyncHandler(async (req: express.Request, res: express.Response) => {
        try {
            const { fileId } = req.params
            const layers = await bimService.getBIMLayers(fileId)

            res.json({
                success: true,
                data: layers,
                message: 'שכבות התקבלו בהצלחה'
            })
        } catch (error) {
            console.error('Get BIM layers error:', error)
            res.status(500).json({
                success: false,
                message: 'שגיאה בקבלת שכבות',
                code: 'GET_BIM_LAYERS_ERROR'
            })
        }
    })
)

// Toggle BIM layer visibility
router.put('/file/:fileId/layer/:layerId/visibility',
    requirePermission(PERMISSIONS.FILE_UPDATE),
    asyncHandler(async (req: express.Request, res: express.Response) => {
        try {
            const { fileId, layerId } = req.params
            const { visible } = req.body

            if (typeof visible !== 'boolean') {
                return res.status(400).json({
                    success: false,
                    message: 'נדרש ערך boolean עבור visible',
                    code: 'INVALID_VISIBILITY_VALUE'
                })
            }

            const success = await bimService.toggleBIMLayerVisibility(fileId, layerId, visible)

            if (!success) {
                return res.status(404).json({
                    success: false,
                    message: 'שכבה לא נמצאה',
                    code: 'BIM_LAYER_NOT_FOUND'
                })
            }

            res.json({
                success: true,
                message: 'נראות שכבה עודכנה בהצלחה'
            })
        } catch (error) {
            console.error('Toggle BIM layer visibility error:', error)
            res.status(500).json({
                success: false,
                message: 'שגיאה בעדכון נראות שכבה',
                code: 'TOGGLE_BIM_LAYER_VISIBILITY_ERROR'
            })
        }
    })
)

// Get BIM file thumbnail
router.get('/file/:fileId/thumbnail',
    requirePermission(PERMISSIONS.FILE_DOWNLOAD),
    asyncHandler(async (req: express.Request, res: express.Response) => {
        try {
            const { fileId } = req.params
            const thumbnail = await bimService.getBIMFileThumbnail(fileId)

            if (!thumbnail) {
                return res.status(404).json({
                    success: false,
                    message: 'תמונת ממוזערת לא נמצאה',
                    code: 'BIM_THUMBNAIL_NOT_FOUND'
                })
            }

            res.setHeader('Content-Type', 'image/png')
            res.setHeader('Content-Length', thumbnail.length)
            res.send(thumbnail)
        } catch (error) {
            console.error('Get BIM file thumbnail error:', error)
            res.status(500).json({
                success: false,
                message: 'שגיאה בקבלת תמונת ממוזערת',
                code: 'GET_BIM_THUMBNAIL_ERROR'
            })
        }
    })
)

// Generate BIM file preview
router.post('/file/:fileId/preview',
    requirePermission(PERMISSIONS.FILE_DOWNLOAD),
    asyncHandler(async (req: express.Request, res: express.Response) => {
        try {
            const { fileId } = req.params
            const preview = await bimService.generateBIMFilePreview(fileId)

            res.json({
                success: true,
                data: preview,
                message: 'תצוגה מקדימה נוצרה בהצלחה'
            })
        } catch (error) {
            console.error('Generate BIM file preview error:', error)
            res.status(500).json({
                success: false,
                message: 'שגיאה ביצירת תצוגה מקדימה',
                code: 'GENERATE_BIM_PREVIEW_ERROR'
            })
        }
    })
)

// Get BIM viewer configuration
router.get('/viewer/config',
    requirePermission(PERMISSIONS.ANALYTICS_VIEW),
    asyncHandler(async (req: express.Request, res: express.Response) => {
        try {
            const config = bimService.getViewerConfig()

            res.json({
                success: true,
                data: config,
                message: 'הגדרות צופה התקבלו בהצלחה'
            })
        } catch (error) {
            console.error('Get BIM viewer config error:', error)
            res.status(500).json({
                success: false,
                message: 'שגיאה בקבלת הגדרות צופה',
                code: 'GET_BIM_VIEWER_CONFIG_ERROR'
            })
        }
    })
)

// Update BIM viewer configuration
router.put('/viewer/config',
    requirePermission(PERMISSIONS.ANALYTICS_MANAGE),
    asyncHandler(async (req: express.Request, res: express.Response) => {
        try {
            const { config } = req.body
            const updatedConfig = bimService.updateViewerConfig(config)

            res.json({
                success: true,
                data: updatedConfig,
                message: 'הגדרות צופה עודכנו בהצלחה'
            })
        } catch (error) {
            console.error('Update BIM viewer config error:', error)
            res.status(500).json({
                success: false,
                message: 'שגיאה בעדכון הגדרות צופה',
                code: 'UPDATE_BIM_VIEWER_CONFIG_ERROR'
            })
        }
    })
)

export default router
