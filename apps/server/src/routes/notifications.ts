/**
 * Notifications API Routes
 * Construction Master App - Notification Management
 */

import express from 'express'
import { authenticateToken, requirePermission, PERMISSIONS } from '../middleware/auth'
import { validate } from '../middleware/validation'
import { rateLimiters } from '../middleware/security'
import { asyncHandler } from '../middleware/errorHandler'
import notificationService from '../services/notificationService'
import Notification from '../models/Notification'
import { z } from 'zod'

const router = express.Router()

// Schemas
const notificationSchemas = {
    create: z.object({
        body: z.object({
            title: z.string().min(1, 'כותרת נדרשת').max(200, 'כותרת ארוכה מדי'),
            message: z.string().min(1, 'תוכן נדרש').max(1000, 'תוכן ארוך מדי'),
            type: z.enum(['info', 'warning', 'error', 'success', 'project_update', 'deadline', 'team_invite', 'file_upload', 'ai_response']),
            priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
            channels: z.array(z.enum(['email', 'push', 'sms', 'in_app'])).optional(),
            recipient: z.string().regex(/^[0-9a-fA-F]{24}$/, 'מזהה נמען לא תקין'),
            projectId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'מזהה פרויקט לא תקין').optional(),
            scheduledAt: z.string().datetime().optional()
        })
    }),

    getById: z.object({
        params: z.object({
            id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'מזהה לא תקין')
        })
    }),

    list: z.object({
        query: z.object({
            page: z.coerce.number().min(1).optional(),
            limit: z.coerce.number().min(1).max(100).optional(),
            status: z.enum(['pending', 'sent', 'delivered', 'read', 'failed']).optional(),
            type: z.enum(['info', 'warning', 'error', 'success', 'project_update', 'deadline', 'team_invite', 'file_upload', 'ai_response']).optional(),
            unreadOnly: z.coerce.boolean().optional()
        })
    }),

    markAsRead: z.object({
        params: z.object({
            id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'מזהה לא תקין')
        })
    }),

    markAllAsRead: z.object({
        body: z.object({}).optional()
    }),

    delete: z.object({
        params: z.object({
            id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'מזהה לא תקין')
        })
    })
}

// יצירת התראה חדשה (אדמין בלבד)
router.post('/',
    authenticateToken,
    requirePermission(PERMISSIONS.USER_MANAGE),
    validate(notificationSchemas.create),
    rateLimiters.general,
    asyncHandler(async (req: express.Request, res: express.Response) => {
        const notificationData = {
            recipient: req.body.recipient,
            sender: req.user!.id,
            projectId: req.body.projectId,
            customData: {
                title: req.body.title,
                message: req.body.message,
                type: req.body.type,
                priority: req.body.priority,
                channels: req.body.channels
            },
            scheduledAt: req.body.scheduledAt ? new Date(req.body.scheduledAt) : undefined
        }

        const notification = await notificationService.createNotification(notificationData)

        res.status(201).json({
            success: true,
            message: 'התראה נוצרה בהצלחה',
            data: notification
        })
    })
)

// קבלת התראות של המשתמש הנוכחי
router.get('/',
    authenticateToken,
    validate(notificationSchemas.list),
    rateLimiters.general,
    asyncHandler(async (req: express.Request, res: express.Response) => {
        const { page = 1, limit = 20, status, type, unreadOnly = false } = req.query

        const result = await notificationService.getUserNotifications(req.user!.id, {
            page: Number(page),
            limit: Number(limit),
            status: status as string,
            type: type as string,
            unreadOnly: unreadOnly === 'true'
        })

        res.json({
            success: true,
            data: {
                notifications: result.notifications,
                pagination: {
                    page: Number(page),
                    limit: Number(limit),
                    total: result.total,
                    pages: Math.ceil(result.total / Number(limit))
                },
                unreadCount: result.unreadCount
            }
        })
    })
)

// קבלת התראה ספציפית
router.get('/:id',
    authenticateToken,
    validate(notificationSchemas.getById),
    rateLimiters.general,
    asyncHandler(async (req: express.Request, res: express.Response) => {
        const notification = await Notification.findOne({
            _id: req.params.id,
            recipient: req.user!.id
        }).populate('sender', 'name email')
            .populate('projectId', 'name')

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: 'התראה לא נמצאה'
            })
        }

        res.json({
            success: true,
            data: notification
        })
    })
)

// סימון התראה כנקראה
router.put('/:id/read',
    authenticateToken,
    validate(notificationSchemas.markAsRead),
    rateLimiters.general,
    asyncHandler(async (req: express.Request, res: express.Response) => {
        await notificationService.markAsRead(req.params.id, req.user!.id)

        res.json({
            success: true,
            message: 'התראה סומנה כנקראה'
        })
    })
)

// סימון כל ההתראות כנקראות
router.put('/read-all',
    authenticateToken,
    validate(notificationSchemas.markAllAsRead),
    rateLimiters.general,
    asyncHandler(async (req: express.Request, res: express.Response) => {
        await notificationService.markAllAsRead(req.user!.id)

        res.json({
            success: true,
            message: 'כל ההתראות סומנו כנקראות'
        })
    })
)

// מחיקת התראה
router.delete('/:id',
    authenticateToken,
    validate(notificationSchemas.delete),
    rateLimiters.general,
    asyncHandler(async (req: express.Request, res: express.Response) => {
        const notification = await Notification.findOneAndUpdate(
            {
                _id: req.params.id,
                recipient: req.user!.id
            },
            { isActive: false },
            { new: true }
        )

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: 'התראה לא נמצאה'
            })
        }

        res.json({
            success: true,
            message: 'התראה נמחקה בהצלחה'
        })
    })
)

// קבלת סטטיסטיקות התראות (אדמין בלבד)
router.get('/admin/stats',
    authenticateToken,
    requirePermission(PERMISSIONS.USER_MANAGE),
    rateLimiters.general,
    asyncHandler(async (req: express.Request, res: express.Response) => {
        const [
            totalNotifications,
            pendingNotifications,
            sentNotifications,
            failedNotifications,
            notificationsByType,
            notificationsByPriority
        ] = await Promise.all([
            Notification.countDocuments({ isActive: true }),
            Notification.countDocuments({ status: 'pending', isActive: true }),
            Notification.countDocuments({ status: 'sent', isActive: true }),
            Notification.countDocuments({ status: 'failed', isActive: true }),
            Notification.aggregate([
                { $match: { isActive: true } },
                { $group: { _id: '$type', count: { $sum: 1 } } },
                { $sort: { count: -1 } }
            ]),
            Notification.aggregate([
                { $match: { isActive: true } },
                { $group: { _id: '$priority', count: { $sum: 1 } } },
                { $sort: { count: -1 } }
            ])
        ])

        res.json({
            success: true,
            data: {
                total: totalNotifications,
                pending: pendingNotifications,
                sent: sentNotifications,
                failed: failedNotifications,
                byType: notificationsByType,
                byPriority: notificationsByPriority
            }
        })
    })
)

// שליחת התראות מתוזמנות (Job endpoint)
router.post('/admin/process-scheduled',
    authenticateToken,
    requirePermission(PERMISSIONS.USER_MANAGE),
    rateLimiters.general,
    asyncHandler(async (req: express.Request, res: express.Response) => {
        await notificationService.processScheduledNotifications()

        res.json({
            success: true,
            message: 'התראות מתוזמנות עובדו בהצלחה'
        })
    })
)

// ניקוי התראות ישנות (Job endpoint)
router.post('/admin/cleanup',
    authenticateToken,
    requirePermission(PERMISSIONS.USER_MANAGE),
    rateLimiters.general,
    asyncHandler(async (req: express.Request, res: express.Response) => {
        await notificationService.cleanupOldNotifications()

        res.json({
            success: true,
            message: 'התראות ישנות נוקו בהצלחה'
        })
    })
)

// יצירת התראות אוטומטיות לפרויקטים
router.post('/admin/project/:projectId',
    authenticateToken,
    requirePermission(PERMISSIONS.USER_MANAGE),
    rateLimiters.general,
    asyncHandler(async (req: express.Request, res: express.Response) => {
        const { projectId } = req.params
        const { type, additionalData } = req.body

        if (!type || !['deadline_approaching', 'project_completed', 'team_member_added'].includes(type)) {
            return res.status(400).json({
                success: false,
                message: 'סוג התראה לא תקין'
            })
        }

        await notificationService.createProjectNotifications(projectId, type, additionalData)

        res.json({
            success: true,
            message: 'התראות אוטומטיות נוצרו בהצלחה'
        })
    })
)

export default router

