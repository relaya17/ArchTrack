/**
 * Backup API Routes
 * Construction Master App - Backup Management
 */

import express from 'express'
import { authenticateToken, requirePermission, PERMISSIONS } from '../middleware/auth'
import { validate } from '../middleware/validation'
import { rateLimiters } from '../middleware/security'
import { asyncHandler } from '../middleware/errorHandler'
import backupService from '../services/backupService'
import { z } from 'zod'

const router = express.Router()

// Schemas
const backupSchemas = {
    create: z.object({
        body: z.object({
            includeFiles: z.boolean().optional(),
            compress: z.boolean().optional()
        }).optional()
    }),

    restore: z.object({
        body: z.object({
            backupId: z.string().min(1, 'מזהה גיבוי נדרש')
        })
    }),

    getById: z.object({
        params: z.object({
            id: z.string().min(1, 'מזהה גיבוי נדרש')
        })
    }),

    updateConfig: z.object({
        body: z.object({
            enabled: z.boolean().optional(),
            schedule: z.string().optional(),
            retentionDays: z.number().min(1).max(365).optional(),
            compress: z.boolean().optional(),
            includeFiles: z.boolean().optional(),
            storageType: z.enum(['local', 's3', 'google_drive']).optional(),
            storageConfig: z.object({
                local: z.object({
                    path: z.string().optional()
                }).optional(),
                s3: z.object({
                    bucket: z.string().optional(),
                    region: z.string().optional(),
                    accessKeyId: z.string().optional(),
                    secretAccessKey: z.string().optional()
                }).optional(),
                google_drive: z.object({
                    clientId: z.string().optional(),
                    clientSecret: z.string().optional(),
                    refreshToken: z.string().optional(),
                    folderId: z.string().optional()
                }).optional()
            }).optional()
        })
    })
}

// יצירת גיבוי ידני (אדמין בלבד)
router.post('/create',
    authenticateToken,
    requirePermission(PERMISSIONS.USER_MANAGE),
    validate(backupSchemas.create),
    rateLimiters.general,
    asyncHandler(async (req: express.Request, res: express.Response) => {
        const { includeFiles, compress } = req.body

        // עדכון הגדרות זמניות
        if (includeFiles !== undefined || compress !== undefined) {
            const currentConfig = backupService.getBackupConfig()
            backupService.updateBackupConfig({
                includeFiles: includeFiles ?? currentConfig.includeFiles,
                compress: compress ?? currentConfig.compress
            })
        }

        const result = await backupService.createFullBackup()

        res.status(201).json({
            success: true,
            message: 'גיבוי נוצר בהצלחה',
            data: result
        })
    })
)

// קבלת רשימת גיבויים
router.get('/history',
    authenticateToken,
    requirePermission(PERMISSIONS.USER_MANAGE),
    rateLimiters.general,
    asyncHandler(async (req: express.Request, res: express.Response) => {
        const history = backupService.getBackupHistory()

        res.json({
            success: true,
            data: {
                backups: history,
                total: history.length,
                totalSize: history.reduce((sum, backup) => sum + backup.size, 0)
            }
        })
    })
)

// קבלת פרטי גיבוי ספציפי
router.get('/:id',
    authenticateToken,
    requirePermission(PERMISSIONS.USER_MANAGE),
    validate(backupSchemas.getById),
    rateLimiters.general,
    asyncHandler(async (req: express.Request, res: express.Response) => {
        const history = backupService.getBackupHistory()
        const backup = history.find(b => b.backupId === req.params.id)

        if (!backup) {
            return res.status(404).json({
                success: false,
                message: 'גיבוי לא נמצא'
            })
        }

        res.json({
            success: true,
            data: backup
        })
    })
)

// שחזור מגיבוי (אדמין בלבד)
router.post('/restore',
    authenticateToken,
    requirePermission(PERMISSIONS.USER_MANAGE),
    validate(backupSchemas.restore),
    rateLimiters.general,
    asyncHandler(async (req: express.Request, res: express.Response) => {
        const { backupId } = req.body

        await backupService.restoreFromBackup(backupId)

        res.json({
            success: true,
            message: 'שחזור הושלם בהצלחה'
        })
    })
)

// קבלת הגדרות גיבוי
router.get('/config',
    authenticateToken,
    requirePermission(PERMISSIONS.USER_MANAGE),
    rateLimiters.general,
    asyncHandler(async (req: express.Request, res: express.Response) => {
        const config = backupService.getBackupConfig()

        // הסרת מידע רגיש
        const safeConfig = {
            ...config,
            storageConfig: {
                ...config.storageConfig,
                s3: config.storageConfig.s3 ? {
                    bucket: config.storageConfig.s3.bucket,
                    region: config.storageConfig.s3.region,
                    accessKeyId: config.storageConfig.s3.accessKeyId ? '***' : undefined,
                    secretAccessKey: config.storageConfig.s3.secretAccessKey ? '***' : undefined
                } : undefined,
                google_drive: config.storageConfig.google_drive ? {
                    clientId: config.storageConfig.google_drive.clientId,
                    folderId: config.storageConfig.google_drive.folderId,
                    clientSecret: config.storageConfig.google_drive.clientSecret ? '***' : undefined,
                    refreshToken: config.storageConfig.google_drive.refreshToken ? '***' : undefined
                } : undefined
            }
        }

        res.json({
            success: true,
            data: safeConfig
        })
    })
)

// עדכון הגדרות גיבוי
router.put('/config',
    authenticateToken,
    requirePermission(PERMISSIONS.USER_MANAGE),
    validate(backupSchemas.updateConfig),
    rateLimiters.general,
    asyncHandler(async (req: express.Request, res: express.Response) => {
        const updates = req.body

        backupService.updateBackupConfig(updates)

        res.json({
            success: true,
            message: 'הגדרות גיבוי עודכנו בהצלחה'
        })
    })
)

// ניקוי גיבויים ישנים
router.post('/cleanup',
    authenticateToken,
    requirePermission(PERMISSIONS.USER_MANAGE),
    rateLimiters.general,
    asyncHandler(async (req: express.Request, res: express.Response) => {
        await backupService.cleanupOldBackups()

        res.json({
            success: true,
            message: 'ניקוי גיבויים ישנים הושלם'
        })
    })
)

// בדיקת סטטוס גיבוי
router.get('/status',
    authenticateToken,
    requirePermission(PERMISSIONS.USER_MANAGE),
    rateLimiters.general,
    asyncHandler(async (req: express.Request, res: express.Response) => {
        const config = backupService.getBackupConfig()
        const history = backupService.getBackupHistory()

        const lastBackup = history[0]
        const successfulBackups = history.filter(b => b.success).length
        const failedBackups = history.filter(b => !b.success).length
        const totalSize = history.reduce((sum, backup) => sum + backup.size, 0)

        res.json({
            success: true,
            data: {
                enabled: config.enabled,
                schedule: config.schedule,
                retentionDays: config.retentionDays,
                lastBackup: lastBackup ? {
                    id: lastBackup.backupId,
                    timestamp: lastBackup.timestamp,
                    success: lastBackup.success,
                    size: lastBackup.size
                } : null,
                statistics: {
                    total: history.length,
                    successful: successfulBackups,
                    failed: failedBackups,
                    successRate: history.length > 0 ? (successfulBackups / history.length * 100).toFixed(2) + '%' : '0%',
                    totalSize: totalSize
                }
            }
        })
    })
)

// יצירת גיבוי מהיר (רק מסד נתונים)
router.post('/quick',
    authenticateToken,
    requirePermission(PERMISSIONS.USER_MANAGE),
    rateLimiters.general,
    asyncHandler(async (req: express.Request, res: express.Response) => {
        // עדכון זמני של הגדרות
        const currentConfig = backupService.getBackupConfig()
        backupService.updateBackupConfig({
            includeFiles: false,
            compress: true
        })

        try {
            const result = await backupService.createFullBackup()

            res.status(201).json({
                success: true,
                message: 'גיבוי מהיר נוצר בהצלחה',
                data: result
            })
        } finally {
            // החזרת הגדרות מקוריות
            backupService.updateBackupConfig(currentConfig)
        }
    })
)

export default router

