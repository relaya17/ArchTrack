/**
 * Monitoring API Routes
 * Construction Master App - Monitoring & Metrics Management
 */

import express from 'express'
import { authenticateToken, requirePermission, PERMISSIONS } from '../middleware/auth'
import { validate } from '../middleware/validation'
import { rateLimiters } from '../middleware/security'
import { asyncHandler } from '../middleware/errorHandler'
import monitoringService from '../services/monitoringService'
import { z } from 'zod'

const router = express.Router()

// Schemas
const monitoringSchemas = {
    getMetrics: z.object({
        query: z.object({
            name: z.string().optional(),
            tags: z.string().optional(), // JSON string
            startTime: z.string().datetime().optional(),
            endTime: z.string().datetime().optional(),
            limit: z.coerce.number().min(1).max(1000).optional()
        })
    }),

    getAlerts: z.object({
        query: z.object({
            severity: z.enum(['low', 'medium', 'high', 'critical']).optional(),
            resolved: z.coerce.boolean().optional(),
            acknowledged: z.coerce.boolean().optional(),
            limit: z.coerce.number().min(1).max(100).optional()
        })
    }),

    acknowledgeAlert: z.object({
        params: z.object({
            id: z.string().min(1, 'מזהה התראה נדרש')
        }),
        body: z.object({
            userId: z.string().min(1, 'מזהה משתמש נדרש')
        })
    }),

    resolveAlert: z.object({
        params: z.object({
            id: z.string().min(1, 'מזהה התראה נדרש')
        })
    }),

    createAlertRule: z.object({
        body: z.object({
            name: z.string().min(1, 'שם כלל נדרש').max(100, 'שם כלל ארוך מדי'),
            metric: z.string().min(1, 'מטריקה נדרשת'),
            condition: z.enum(['gt', 'lt', 'eq', 'gte', 'lte']),
            threshold: z.number(),
            duration: z.number().min(1).max(3600),
            severity: z.enum(['low', 'medium', 'high', 'critical']),
            enabled: z.boolean().optional(),
            actions: z.array(z.string()).optional()
        })
    }),

    updateAlertRule: z.object({
        params: z.object({
            id: z.string().min(1, 'מזהה כלל נדרש')
        }),
        body: z.object({
            name: z.string().min(1).max(100).optional(),
            metric: z.string().optional(),
            condition: z.enum(['gt', 'lt', 'eq', 'gte', 'lte']).optional(),
            threshold: z.number().optional(),
            duration: z.number().min(1).max(3600).optional(),
            severity: z.enum(['low', 'medium', 'high', 'critical']).optional(),
            enabled: z.boolean().optional(),
            actions: z.array(z.string()).optional()
        })
    }),

    deleteAlertRule: z.object({
        params: z.object({
            id: z.string().min(1, 'מזהה כלל נדרש')
        })
    })
}

// קבלת מטריקות
router.get('/metrics',
    authenticateToken,
    requirePermission(PERMISSIONS.USER_MANAGE),
    validate(monitoringSchemas.getMetrics),
    rateLimiters.general,
    asyncHandler(async (req: express.Request, res: express.Response) => {
        const { name, tags, startTime, endTime, limit } = req.query

        const filters: any = {}
        if (name) filters.name = name as string
        if (tags) {
            try {
                filters.tags = JSON.parse(tags as string)
            } catch (error) {
                return res.status(400).json({
                    success: false,
                    message: 'תגיות לא תקינות'
                })
            }
        }
        if (startTime) filters.startTime = new Date(startTime as string)
        if (endTime) filters.endTime = new Date(endTime as string)
        if (limit) filters.limit = Number(limit)

        const metrics = monitoringService.getMetrics(filters)

        res.json({
            success: true,
            data: {
                metrics,
                total: metrics.length,
                filters
            }
        })
    })
)

// קבלת התראות
router.get('/alerts',
    authenticateToken,
    requirePermission(PERMISSIONS.USER_MANAGE),
    validate(monitoringSchemas.getAlerts),
    rateLimiters.general,
    asyncHandler(async (req: express.Request, res: express.Response) => {
        const { severity, resolved, acknowledged, limit } = req.query

        const filters: any = {}
        if (severity) filters.severity = severity as string
        if (resolved !== undefined) filters.resolved = resolved === 'true'
        if (acknowledged !== undefined) filters.acknowledged = acknowledged === 'true'
        if (limit) filters.limit = Number(limit)

        const alerts = monitoringService.getAlerts(filters)

        res.json({
            success: true,
            data: {
                alerts,
                total: alerts.length,
                active: alerts.filter(a => !a.resolved).length,
                filters
            }
        })
    })
)

// אישור התראה
router.put('/alerts/:id/acknowledge',
    authenticateToken,
    requirePermission(PERMISSIONS.USER_MANAGE),
    validate(monitoringSchemas.acknowledgeAlert),
    rateLimiters.general,
    asyncHandler(async (req: express.Request, res: express.Response) => {
        const { id } = req.params
        const { userId } = req.body

        monitoringService.acknowledgeAlert(id, userId)

        res.json({
            success: true,
            message: 'התראה אושרה בהצלחה'
        })
    })
)

// פתרון התראה
router.put('/alerts/:id/resolve',
    authenticateToken,
    requirePermission(PERMISSIONS.USER_MANAGE),
    validate(monitoringSchemas.resolveAlert),
    rateLimiters.general,
    asyncHandler(async (req: express.Request, res: express.Response) => {
        const { id } = req.params

        monitoringService.resolveAlert(id)

        res.json({
            success: true,
            message: 'התראה נפתרה בהצלחה'
        })
    })
)

// קבלת כללי התראות
router.get('/alert-rules',
    authenticateToken,
    requirePermission(PERMISSIONS.USER_MANAGE),
    rateLimiters.general,
    asyncHandler(async (req: express.Request, res: express.Response) => {
        const rules = monitoringService.getAlertRules()

        res.json({
            success: true,
            data: {
                rules,
                total: rules.length,
                enabled: rules.filter(r => r.enabled).length
            }
        })
    })
)

// יצירת כלל התראה
router.post('/alert-rules',
    authenticateToken,
    requirePermission(PERMISSIONS.USER_MANAGE),
    validate(monitoringSchemas.createAlertRule),
    rateLimiters.general,
    asyncHandler(async (req: express.Request, res: express.Response) => {
        const ruleData = {
            name: req.body.name,
            metric: req.body.metric,
            condition: req.body.condition,
            threshold: req.body.threshold,
            duration: req.body.duration,
            severity: req.body.severity,
            enabled: req.body.enabled ?? true,
            actions: req.body.actions ?? ['email', 'in_app']
        }

        const rule = monitoringService.addAlertRule(ruleData)

        res.status(201).json({
            success: true,
            message: 'כלל התראה נוצר בהצלחה',
            data: rule
        })
    })
)

// עדכון כלל התראה
router.put('/alert-rules/:id',
    authenticateToken,
    requirePermission(PERMISSIONS.USER_MANAGE),
    validate(monitoringSchemas.updateAlertRule),
    rateLimiters.general,
    asyncHandler(async (req: express.Request, res: express.Response) => {
        const { id } = req.params
        const updates = req.body

        const rule = monitoringService.updateAlertRule(id, updates)

        if (!rule) {
            return res.status(404).json({
                success: false,
                message: 'כלל התראה לא נמצא'
            })
        }

        res.json({
            success: true,
            message: 'כלל התראה עודכן בהצלחה',
            data: rule
        })
    })
)

// מחיקת כלל התראה
router.delete('/alert-rules/:id',
    authenticateToken,
    requirePermission(PERMISSIONS.USER_MANAGE),
    validate(monitoringSchemas.deleteAlertRule),
    rateLimiters.general,
    asyncHandler(async (req: express.Request, res: express.Response) => {
        const { id } = req.params

        const deleted = monitoringService.deleteAlertRule(id)

        if (!deleted) {
            return res.status(404).json({
                success: false,
                message: 'כלל התראה לא נמצא'
            })
        }

        res.json({
            success: true,
            message: 'כלל התראה נמחק בהצלחה'
        })
    })
)

// דשבורד ניטור
router.get('/dashboard',
    authenticateToken,
    requirePermission(PERMISSIONS.USER_MANAGE),
    rateLimiters.general,
    asyncHandler(async (req: express.Request, res: express.Response) => {
        const metrics = monitoringService.getMetrics({ limit: 100 })
        const alerts = monitoringService.getAlerts({ limit: 50 })
        const alertRules = monitoringService.getAlertRules()

        // קיבוץ מטריקות לפי סוג
        const metricsByType = metrics.reduce((acc, metric) => {
            const type = metric.tags.type || 'other'
            if (!acc[type]) acc[type] = []
            acc[type].push(metric)
            return acc
        }, {} as Record<string, any[]>)

        // סטטיסטיקות התראות
        const alertStats = {
            total: alerts.length,
            active: alerts.filter(a => !a.resolved).length,
            acknowledged: alerts.filter(a => a.acknowledged).length,
            bySeverity: {
                low: alerts.filter(a => a.severity === 'low').length,
                medium: alerts.filter(a => a.severity === 'medium').length,
                high: alerts.filter(a => a.severity === 'high').length,
                critical: alerts.filter(a => a.severity === 'critical').length
            }
        }

        res.json({
            success: true,
            data: {
                metrics: metricsByType,
                alerts,
                alertRules,
                statistics: {
                    metrics: {
                        total: metrics.length,
                        byType: Object.keys(metricsByType).length
                    },
                    alerts: alertStats,
                    rules: {
                        total: alertRules.length,
                        enabled: alertRules.filter(r => r.enabled).length
                    }
                }
            }
        })
    })
)

// בדיקת בריאות מערכת
router.get('/health',
    authenticateToken,
    requirePermission(PERMISSIONS.USER_MANAGE),
    rateLimiters.general,
    asyncHandler(async (req: express.Request, res: express.Response) => {
        const health = monitoringService.getHealthStatus()

        res.status(health.status === 'healthy' ? 200 : health.status === 'warning' ? 200 : 500).json({
            success: true,
            data: health
        })
    })
)

export default router

