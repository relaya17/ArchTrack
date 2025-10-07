/**
 * Real-Time Metrics Routes
 * Construction Master App - Live Performance Monitoring API
 */

import express from 'express'
import { authenticateToken, requirePermission, PERMISSIONS } from '../middleware/auth'
import { rateLimiters } from '../middleware/security'
import { asyncHandler } from '../middleware/errorHandler'
import realTimeMetricsService from '../services/realTimeMetricsService'

const router = express.Router()

// Rate limiting for metrics endpoints
router.use(rateLimiters.general)

// Authentication required for all metrics endpoints
router.use(authenticateToken)

// Get all real-time metrics
router.get('/',
    requirePermission(PERMISSIONS.ANALYTICS_VIEW),
    asyncHandler(async (req: express.Request, res: express.Response) => {
        try {
            const metrics = realTimeMetricsService.getAllMetrics()

            res.json({
                success: true,
                data: metrics,
                message: 'מדדים בזמן אמת התקבלו בהצלחה'
            })
        } catch (error) {
            console.error('Get real-time metrics error:', error)
            res.status(500).json({
                success: false,
                message: 'שגיאה בקבלת מדדים בזמן אמת',
                code: 'GET_REALTIME_METRICS_ERROR'
            })
        }
    })
)

// Get system metrics
router.get('/system',
    requirePermission(PERMISSIONS.ANALYTICS_VIEW),
    asyncHandler(async (req: express.Request, res: express.Response) => {
        try {
            const systemMetrics = realTimeMetricsService.getSystemMetrics()

            res.json({
                success: true,
                data: systemMetrics,
                message: 'מדדי מערכת התקבלו בהצלחה'
            })
        } catch (error) {
            console.error('Get system metrics error:', error)
            res.status(500).json({
                success: false,
                message: 'שגיאה בקבלת מדדי מערכת',
                code: 'GET_SYSTEM_METRICS_ERROR'
            })
        }
    })
)

// Get project metrics
router.get('/projects',
    requirePermission(PERMISSIONS.ANALYTICS_VIEW),
    asyncHandler(async (req: express.Request, res: express.Response) => {
        try {
            const projectMetrics = realTimeMetricsService.getAllProjectMetrics()

            res.json({
                success: true,
                data: projectMetrics,
                message: 'מדדי פרויקטים התקבלו בהצלחה'
            })
        } catch (error) {
            console.error('Get project metrics error:', error)
            res.status(500).json({
                success: false,
                message: 'שגיאה בקבלת מדדי פרויקטים',
                code: 'GET_PROJECT_METRICS_ERROR'
            })
        }
    })
)

// Get specific project metrics
router.get('/projects/:projectId',
    requirePermission(PERMISSIONS.ANALYTICS_VIEW),
    asyncHandler(async (req: express.Request, res: express.Response) => {
        try {
            const { projectId } = req.params
            const projectMetrics = realTimeMetricsService.getProjectMetrics(projectId)

            if (!projectMetrics) {
                return res.status(404).json({
                    success: false,
                    message: 'מדדי פרויקט לא נמצאו',
                    code: 'PROJECT_METRICS_NOT_FOUND'
                })
            }

            res.json({
                success: true,
                data: projectMetrics,
                message: 'מדדי פרויקט התקבלו בהצלחה'
            })
        } catch (error) {
            console.error('Get project metrics error:', error)
            res.status(500).json({
                success: false,
                message: 'שגיאה בקבלת מדדי פרויקט',
                code: 'GET_PROJECT_METRICS_ERROR'
            })
        }
    })
)

// Add custom metric
router.post('/custom',
    requirePermission(PERMISSIONS.ANALYTICS_MANAGE),
    asyncHandler(async (req: express.Request, res: express.Response) => {
        try {
            const { id, name, value, unit, status, trend, threshold } = req.body

            if (!id || !name || value === undefined) {
                return res.status(400).json({
                    success: false,
                    message: 'נדרשים שדות חובה: id, name, value',
                    code: 'MISSING_REQUIRED_FIELDS'
                })
            }

            realTimeMetricsService.addCustomMetric({
                id,
                name,
                value,
                unit: unit || 'count',
                status: status || 'healthy',
                trend: trend || 'stable',
                threshold
            })

            res.json({
                success: true,
                message: 'מדד מותאם אישית נוסף בהצלחה'
            })
        } catch (error) {
            console.error('Add custom metric error:', error)
            res.status(500).json({
                success: false,
                message: 'שגיאה בהוספת מדד מותאם אישית',
                code: 'ADD_CUSTOM_METRIC_ERROR'
            })
        }
    })
)

// Update custom metric
router.put('/custom/:id',
    requirePermission(PERMISSIONS.ANALYTICS_MANAGE),
    asyncHandler(async (req: express.Request, res: express.Response) => {
        try {
            const { id } = req.params
            const { value } = req.body

            if (value === undefined) {
                return res.status(400).json({
                    success: false,
                    message: 'נדרש ערך למדד',
                    code: 'MISSING_VALUE'
                })
            }

            realTimeMetricsService.updateCustomMetric(id, value)

            res.json({
                success: true,
                message: 'מדד מותאם אישית עודכן בהצלחה'
            })
        } catch (error) {
            console.error('Update custom metric error:', error)
            res.status(500).json({
                success: false,
                message: 'שגיאה בעדכון מדד מותאם אישית',
                code: 'UPDATE_CUSTOM_METRIC_ERROR'
            })
        }
    })
)

// Remove custom metric
router.delete('/custom/:id',
    requirePermission(PERMISSIONS.ANALYTICS_MANAGE),
    asyncHandler(async (req: express.Request, res: express.Response) => {
        try {
            const { id } = req.params

            realTimeMetricsService.removeCustomMetric(id)

            res.json({
                success: true,
                message: 'מדד מותאם אישית הוסר בהצלחה'
            })
        } catch (error) {
            console.error('Remove custom metric error:', error)
            res.status(500).json({
                success: false,
                message: 'שגיאה בהסרת מדד מותאם אישית',
                code: 'REMOVE_CUSTOM_METRIC_ERROR'
            })
        }
    })
)

// Get metrics history
router.get('/history/:metricId',
    requirePermission(PERMISSIONS.ANALYTICS_VIEW),
    asyncHandler(async (req: express.Request, res: express.Response) => {
        try {
            const { metricId } = req.params
            const { duration = 3600000 } = req.query // Default 1 hour

            const history = realTimeMetricsService.getMetricsHistory(
                metricId, 
                parseInt(duration as string)
            )

            res.json({
                success: true,
                data: history,
                message: 'היסטוריית מדדים התקבלה בהצלחה'
            })
        } catch (error) {
            console.error('Get metrics history error:', error)
            res.status(500).json({
                success: false,
                message: 'שגיאה בקבלת היסטוריית מדדים',
                code: 'GET_METRICS_HISTORY_ERROR'
            })
        }
    })
)

// Start metrics collection
router.post('/start',
    requirePermission(PERMISSIONS.ANALYTICS_MANAGE),
    asyncHandler(async (req: express.Request, res: express.Response) => {
        try {
            realTimeMetricsService.startMetricsCollection()

            res.json({
                success: true,
                message: 'איסוף מדדים בזמן אמת הופעל'
            })
        } catch (error) {
            console.error('Start metrics collection error:', error)
            res.status(500).json({
                success: false,
                message: 'שגיאה בהפעלת איסוף מדדים',
                code: 'START_METRICS_COLLECTION_ERROR'
            })
        }
    })
)

// Stop metrics collection
router.post('/stop',
    requirePermission(PERMISSIONS.ANALYTICS_MANAGE),
    asyncHandler(async (req: express.Request, res: express.Response) => {
        try {
            realTimeMetricsService.stopMetricsCollection()

            res.json({
                success: true,
                message: 'איסוף מדדים בזמן אמת הופסק'
            })
        } catch (error) {
            console.error('Stop metrics collection error:', error)
            res.status(500).json({
                success: false,
                message: 'שגיאה בהפסקת איסוף מדדים',
                code: 'STOP_METRICS_COLLECTION_ERROR'
            })
        }
    })
)

export default router
