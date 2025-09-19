/**
 * Files Routes
 * Construction Master App - Advanced File Management API
 */

import express from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { v4 as uuidv4 } from 'uuid'
import File from '../models/File'
import Project from '../models/Project'
import { authenticateToken, requirePermission, PERMISSIONS } from '../middleware/auth'
import { validate, fileSchemas } from '../middleware/validation'
import { rateLimiters } from '../middleware/security'
import { asyncHandler } from '../middleware/errorHandler'

const router = express.Router()

// Rate limiting
router.use(rateLimiters.upload)

// אימות לכל הroutes
router.use(authenticateToken)

// יצירת תיקיית uploads אם לא קיימת
const uploadDir = path.join(process.cwd(), 'uploads')
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true })
}

// הגדרת multer עם validation מתקדם
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const projectId = req.params.projectId
        const projectDir = path.join(uploadDir, projectId)

        if (!fs.existsSync(projectDir)) {
            fs.mkdirSync(projectDir, { recursive: true })
        }

        cb(null, projectDir)
    },
    filename: (req, file, cb) => {
        const uniqueId = uuidv4()
        const extension = path.extname(file.originalname)
        const filename = `${uniqueId}${extension}`
        cb(null, filename)
    }
})

// הגדרת סוגי קבצים מותרים
const allowedMimeTypes = [
    // Documents
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',

    // Images
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',

    // CAD/3D Files
    'application/dwg',
    'application/x-dwg',
    'application/vnd.autocad.dwg',
    'application/vnd.autocad.dxf',
    'model/step',
    'application/step',

    // Archives
    'application/zip',
    'application/x-rar-compressed',
    'application/x-7z-compressed',

    // Text files
    'text/plain',
    'text/csv'
]

const fileFilter = (req: express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    // בדיקת סוג קובץ
    if (allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true)
    } else {
        cb(new Error(`סוג קובץ לא נתמך: ${file.mimetype}`))
    }
}

const upload = multer({
    storage,
    limits: {
        fileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760'), // 10MB default
        files: 10 // מקסימום 10 קבצים בו זמנית
    },
    fileFilter
})

// העלאת קובץ יחיד
router.post('/upload/:projectId',
    requirePermission(PERMISSIONS.FILE_UPLOAD),
    upload.single('file'),
    validate(fileSchemas.upload),
    asyncHandler(async (req: express.Request, res: express.Response) => {
        try {
            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    message: 'לא נבחר קובץ להעלאה',
                    code: 'NO_FILE_UPLOADED'
                })
            }

            const { projectId } = req.params
            const { description, tags, category } = req.body

            // בדיקת הרשאות לפרויקט
            const project = await Project.findById(projectId)
            if (!project) {
                // מחיקת הקובץ שהועלה
                fs.unlinkSync(req.file.path)
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
                // מחיקת הקובץ שהועלה
                fs.unlinkSync(req.file.path)
                return res.status(403).json({
                    success: false,
                    message: 'אין הרשאה להעלות קבצים לפרויקט זה',
                    code: 'FILE_UPLOAD_DENIED'
                })
            }

            // יצירת רשומה במסד הנתונים
            const fileData = {
                filename: req.file.filename,
                originalName: req.file.originalname,
                mimeType: req.file.mimetype,
                size: req.file.size,
                path: req.file.path,
                projectId,
                uploadedBy: req.user!.id,
                description,
                tags: tags ? tags.split(',').map((tag: string) => tag.trim()) : [],
                category: category || 'general'
            }

            const file = new File(fileData)
            await file.save()

            await file.populate('uploadedBy', 'name email avatar')
            await file.populate('projectId', 'name status')

            res.status(201).json({
                success: true,
                data: file,
                message: 'קובץ הועלה בהצלחה'
            })
        } catch (error) {
            // מחיקת הקובץ במקרה של שגיאה
            if (req.file && fs.existsSync(req.file.path)) {
                fs.unlinkSync(req.file.path)
            }
            throw error
        }
    })
)

// העלאת קבצים מרובים
router.post('/upload-multiple/:projectId',
    requirePermission(PERMISSIONS.FILE_UPLOAD),
    upload.array('files', 10),
    validate(fileSchemas.uploadMultiple),
    asyncHandler(async (req: express.Request, res: express.Response) => {
        try {
            const files = req.files as Express.Multer.File[]

            if (!files || files.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'לא נבחרו קבצים להעלאה',
                    code: 'NO_FILES_UPLOADED'
                })
            }

            const { projectId } = req.params
            const { category } = req.body

            // בדיקת הרשאות לפרויקט
            const project = await Project.findById(projectId)
            if (!project) {
                // מחיקת כל הקבצים שהועלו
                files.forEach(file => {
                    if (fs.existsSync(file.path)) {
                        fs.unlinkSync(file.path)
                    }
                })
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
                // מחיקת כל הקבצים שהועלו
                files.forEach(file => {
                    if (fs.existsSync(file.path)) {
                        fs.unlinkSync(file.path)
                    }
                })
                return res.status(403).json({
                    success: false,
                    message: 'אין הרשאה להעלות קבצים לפרויקט זה',
                    code: 'FILE_UPLOAD_DENIED'
                })
            }

            // יצירת רשומות לכל קובץ
            const filePromises = files.map(file => {
                const fileData = {
                    filename: file.filename,
                    originalName: file.originalname,
                    mimeType: file.mimetype,
                    size: file.size,
                    path: file.path,
                    projectId,
                    uploadedBy: req.user!.id,
                    category: category || 'general'
                }

                const fileDoc = new File(fileData)
                return fileDoc.save()
            })

            const uploadedFiles = await Promise.all(filePromises)

            // Populate data
            await Promise.all(
                uploadedFiles.map(file =>
                    file.populate('uploadedBy', 'name email avatar')
                )
            )

            res.status(201).json({
                success: true,
                data: uploadedFiles,
                message: `${files.length} קבצים הועלו בהצלחה`
            })
        } catch (error) {
            // מחיקת כל הקבצים במקרה של שגיאה
            if (req.files) {
                const files = req.files as Express.Multer.File[]
                files.forEach(file => {
                    if (fs.existsSync(file.path)) {
                        fs.unlinkSync(file.path)
                    }
                })
            }
            throw error
        }
    })
)

// קבלת רשימת קבצים לפרויקט
router.get('/project/:projectId',
    validate(fileSchemas.list),
    asyncHandler(async (req: express.Request, res: express.Response) => {
        const { projectId } = req.params
        const { category, page = 1, limit = 20, sort = 'createdAt', order = 'desc' } = req.query

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
                message: 'אין הרשאה לגשת לקבצי הפרויקט',
                code: 'FILE_ACCESS_DENIED'
            })
        }

        // בניית query
        const query: any = { projectId }
        if (category) {
            query.category = category
        }

        // חישוב pagination
        const skip = (Number(page) - 1) * Number(limit)
        const total = await File.countDocuments(query)

        // בניית sort object
        const sortObj: any = {}
        sortObj[sort as string] = order === 'desc' ? -1 : 1

        const files = await File.find(query)
            .populate('uploadedBy', 'name email avatar')
            .sort(sortObj)
            .skip(skip)
            .limit(Number(limit))

        // חישוב סטטיסטיקות
        const stats = await File.aggregate([
            { $match: query },
            {
                $group: {
                    _id: '$category',
                    count: { $sum: 1 },
                    totalSize: { $sum: '$size' }
                }
            }
        ])

        res.json({
            success: true,
            data: files,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total,
                pages: Math.ceil(total / Number(limit))
            },
            stats: {
                byCategory: stats.reduce((acc, stat) => {
                    acc[stat._id] = {
                        count: stat.count,
                        totalSize: stat.totalSize,
                        totalSizeMB: Math.round(stat.totalSize / (1024 * 1024) * 100) / 100
                    }
                    return acc
                }, {} as any)
            }
        })
    })
)

// קבלת קובץ לפי ID
router.get('/:id',
    validate(fileSchemas.getById),
    asyncHandler(async (req: express.Request, res: express.Response) => {
        const file = await File.findById(req.params.id)
            .populate('uploadedBy', 'name email avatar')
            .populate('projectId', 'name status')

        if (!file) {
            return res.status(404).json({
                success: false,
                message: 'קובץ לא נמצא',
                code: 'FILE_NOT_FOUND'
            })
        }

        // בדיקת הרשאות לפרויקט
        const project = await Project.findById(file.projectId)
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
                message: 'אין הרשאה לגשת לקובץ זה',
                code: 'FILE_ACCESS_DENIED'
            })
        }

        res.json({
            success: true,
            data: file
        })
    })
)

// הורדת קובץ
router.get('/:id/download',
    validate(fileSchemas.getById),
    asyncHandler(async (req: express.Request, res: express.Response) => {
        const file = await File.findById(req.params.id)

        if (!file) {
            return res.status(404).json({
                success: false,
                message: 'קובץ לא נמצא',
                code: 'FILE_NOT_FOUND'
            })
        }

        // בדיקת הרשאות לפרויקט
        const project = await Project.findById(file.projectId)
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
                message: 'אין הרשאה להוריד קובץ זה',
                code: 'FILE_DOWNLOAD_DENIED'
            })
        }

        // בדיקה אם הקובץ קיים במערכת הקבצים
        if (!fs.existsSync(file.path)) {
            return res.status(404).json({
                success: false,
                message: 'הקובץ לא נמצא במערכת הקבצים',
                code: 'FILE_NOT_FOUND_ON_DISK'
            })
        }

        // עדכון מספר ההורדות
        file.downloadCount = (file.downloadCount || 0) + 1
        file.lastDownloadedAt = new Date()
        await file.save()

        // הגדרת headers להורדה
        res.setHeader('Content-Disposition', `attachment; filename="${file.originalName}"`)
        res.setHeader('Content-Type', file.mimeType)
        res.setHeader('Content-Length', file.size)

        // שליחת הקובץ
        const fileStream = fs.createReadStream(file.path)
        fileStream.pipe(res)

        fileStream.on('error', (error) => {
            console.error('File stream error:', error)
            res.status(500).json({
                success: false,
                message: 'שגיאה בהורדת הקובץ',
                code: 'FILE_DOWNLOAD_ERROR'
            })
        })
    })
)

// עדכון metadata של קובץ
router.put('/:id',
    requirePermission(PERMISSIONS.FILE_UPDATE),
    validate(fileSchemas.update),
    asyncHandler(async (req: express.Request, res: express.Response) => {
        const file = await File.findById(req.params.id)

        if (!file) {
            return res.status(404).json({
                success: false,
                message: 'קובץ לא נמצא',
                code: 'FILE_NOT_FOUND'
            })
        }

        // בדיקת הרשאות לפרויקט
        const project = await Project.findById(file.projectId)
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
                message: 'אין הרשאה לעדכן קובץ זה',
                code: 'FILE_UPDATE_DENIED'
            })
        }

        // עדכון הנתונים
        Object.assign(file, req.body)
        await file.save()

        await file.populate('uploadedBy', 'name email avatar')

        res.json({
            success: true,
            data: file,
            message: 'קובץ עודכן בהצלחה'
        })
    })
)

// מחיקת קובץ
router.delete('/:id',
    requirePermission(PERMISSIONS.FILE_DELETE),
    validate(fileSchemas.getById),
    asyncHandler(async (req: express.Request, res: express.Response) => {
        const file = await File.findById(req.params.id)

        if (!file) {
            return res.status(404).json({
                success: false,
                message: 'קובץ לא נמצא',
                code: 'FILE_NOT_FOUND'
            })
        }

        // בדיקת הרשאות לפרויקט
        const project = await Project.findById(file.projectId)
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
                message: 'אין הרשאה למחוק קובץ זה',
                code: 'FILE_DELETE_DENIED'
            })
        }

        // מחיקת הקובץ מהדיסק
        if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path)
        }

        // מחיקת הרשומה ממסד הנתונים
        await File.findByIdAndDelete(req.params.id)

        res.json({
            success: true,
            message: 'קובץ נמחק בהצלחה'
        })
    })
)

// קבלת תצוגה מקדימה של תמונה
router.get('/:id/preview',
    validate(fileSchemas.getById),
    asyncHandler(async (req: express.Request, res: express.Response) => {
        const file = await File.findById(req.params.id)

        if (!file) {
            return res.status(404).json({
                success: false,
                message: 'קובץ לא נמצא',
                code: 'FILE_NOT_FOUND'
            })
        }

        // בדיקה אם זה קובץ תמונה
        if (!file.mimeType.startsWith('image/')) {
            return res.status(400).json({
                success: false,
                message: 'תצוגה מקדימה זמינה רק לתמונות',
                code: 'PREVIEW_NOT_AVAILABLE'
            })
        }

        // בדיקת הרשאות לפרויקט
        const project = await Project.findById(file.projectId)
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
                message: 'אין הרשאה לגשת לקובץ זה',
                code: 'FILE_ACCESS_DENIED'
            })
        }

        // בדיקה אם הקובץ קיים במערכת הקבצים
        if (!fs.existsSync(file.path)) {
            return res.status(404).json({
                success: false,
                message: 'הקובץ לא נמצא במערכת הקבצים',
                code: 'FILE_NOT_FOUND_ON_DISK'
            })
        }

        // שליחת התמונה
        res.setHeader('Content-Type', file.mimeType)
        res.setHeader('Cache-Control', 'public, max-age=3600') // Cache for 1 hour

        const fileStream = fs.createReadStream(file.path)
        fileStream.pipe(res)
    })
)

export default router
