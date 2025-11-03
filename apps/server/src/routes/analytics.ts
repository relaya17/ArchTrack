/**
 * Analytics Routes
 * Construction Master App - Analytics & Reporting API
 */

import express from 'express'
import { authenticateToken, requirePermission, PERMISSIONS } from '../middleware/auth'
import { validate, analyticsSchemas } from '../middleware/validation'
import { rateLimiters } from '../middleware/security'
import { asyncHandler } from '../middleware/errorHandler'
import AnalyticsService from '../services/analyticsService'
import specificAnalyticsService from '../services/specificAnalyticsService'

const router = express.Router()
const analyticsService = new AnalyticsService()

// Rate limiting for analytics endpoints
router.use(rateLimiters.analytics)

// אימות לכל הroutes
router.use(authenticateToken)

// Get dashboard analytics
router.get('/dashboard',
    requirePermission(PERMISSIONS.ANALYTICS_VIEW),
    asyncHandler(async (req: express.Request, res: express.Response) => {
        try {
            const analytics = await analyticsService.getDashboardAnalytics(
                req.user!.id,
                req.user!.role
            )

            res.json({
                success: true,
                data: analytics,
                message: 'נתוני דשבורד התקבלו בהצלחה'
            })
        } catch (error) {
            console.error('Dashboard analytics error:', error)
            res.status(500).json({
                success: false,
                message: 'שגיאה בקבלת נתוני דשבורד',
                code: 'DASHBOARD_ANALYTICS_ERROR'
            })
        }
    })
)

// Get project insights
router.get('/projects/insights',
    requirePermission(PERMISSIONS.ANALYTICS_VIEW),
    asyncHandler(async (req: express.Request, res: express.Response) => {
        try {
            const insights = await analyticsService.getProjectInsights(
                req.user!.id,
                req.user!.role
            )

            res.json({
                success: true,
                data: insights,
                message: 'תובנות פרויקטים התקבלו בהצלחה'
            })
        } catch (error) {
            console.error('Project insights error:', error)
            res.status(500).json({
                success: false,
                message: 'שגיאה בקבלת תובנות פרויקטים',
                code: 'PROJECT_INSIGHTS_ERROR'
            })
        }
    })
)

// Get trend data
router.get('/trends',
    requirePermission(PERMISSIONS.ANALYTICS_VIEW),
    validate(analyticsSchemas.getTrends),
    asyncHandler(async (req: express.Request, res: express.Response) => {
        try {
            const { period = '12m', granularity = 'monthly' } = req.query

            const trends = await analyticsService.getTrendData(
                req.user!.id,
                req.user!.role
            )

            res.json({
                success: true,
                data: trends,
                message: 'נתוני מגמות התקבלו בהצלחה'
            })
        } catch (error) {
            console.error('Trend data error:', error)
            res.status(500).json({
                success: false,
                message: 'שגיאה בקבלת נתוני מגמות',
                code: 'TREND_DATA_ERROR'
            })
        }
    })
)

// Get performance metrics
router.get('/performance',
    requirePermission(PERMISSIONS.ANALYTICS_VIEW),
    asyncHandler(async (req: express.Request, res: express.Response) => {
        try {
            const metrics = await analyticsService.getOverviewMetrics(
                req.user!.id,
                req.user!.role
            )

            res.json({
                success: true,
                data: metrics.performance,
                message: 'מדדי ביצועים התקבלו בהצלחה'
            })
        } catch (error) {
            console.error('Performance metrics error:', error)
            res.status(500).json({
                success: false,
                message: 'שגיאה בקבלת מדדי ביצועים',
                code: 'PERFORMANCE_METRICS_ERROR'
            })
        }
    })
)

// Get system alerts
router.get('/alerts',
    requirePermission(PERMISSIONS.ANALYTICS_VIEW),
    asyncHandler(async (req: express.Request, res: express.Response) => {
        try {
            const alerts = await analyticsService.getSystemAlerts(
                req.user!.id,
                req.user!.role
            )

            res.json({
                success: true,
                data: alerts,
                message: 'התראות מערכת התקבלו בהצלחה'
            })
        } catch (error) {
            console.error('System alerts error:', error)
            res.status(500).json({
                success: false,
                message: 'שגיאה בקבלת התראות מערכת',
                code: 'SYSTEM_ALERTS_ERROR'
            })
        }
    })
)

// Export analytics data
router.post('/export',
    requirePermission(PERMISSIONS.ANALYTICS_EXPORT),
    validate(analyticsSchemas.exportData),
    asyncHandler(async (req: express.Request, res: express.Response) => {
        try {
            const { format = 'json', filters = {} } = req.body

            const data = await analyticsService.exportAnalytics(
                req.user!.id,
                req.user!.role,
                format
            )

            if (format === 'csv') {
                res.setHeader('Content-Type', 'text/csv')
                res.setHeader('Content-Disposition', 'attachment; filename="analytics.csv"')
                res.send(data)
            } else {
                res.json({
                    success: true,
                    data,
                    message: 'נתונים יוצאו בהצלחה'
                })
            }
        } catch (error) {
            console.error('Export analytics error:', error)
            res.status(500).json({
                success: false,
                message: 'שגיאה בייצוא נתונים',
                code: 'EXPORT_ANALYTICS_ERROR'
            })
        }
    })
)

// Generate custom report
router.post('/reports/custom',
    requirePermission(PERMISSIONS.ANALYTICS_EXPORT),
    validate(analyticsSchemas.customReport),
    asyncHandler(async (req: express.Request, res: express.Response) => {
        try {
            const { filters, sections, dateRange } = req.body

            const report = await analyticsService.generateCustomReport(
                req.user!.id,
                req.user!.role,
                { filters, sections, dateRange }
            )

            res.json({
                success: true,
                data: report,
                message: 'דוח מותאם אישית נוצר בהצלחה'
            })
        } catch (error) {
            console.error('Custom report error:', error)
            res.status(500).json({
                success: false,
                message: 'שגיאה ביצירת דוח מותאם אישית',
                code: 'CUSTOM_REPORT_ERROR'
            })
        }
    })
)

// Get project-specific analytics
router.get('/projects/:projectId',
    requirePermission(PERMISSIONS.ANALYTICS_VIEW),
    validate(analyticsSchemas.getProjectAnalytics),
    asyncHandler(async (req: express.Request, res: express.Response) => {
        try {
            const { projectId } = req.params

            // Get project-specific analytics
            const projectAnalytics = await specificAnalyticsService.getProjectAnalytics(projectId)

            res.json({
                success: true,
                data: projectAnalytics,
                message: 'נתוני פרויקט ספציפי התקבלו בהצלחה'
            })
        } catch (error) {
            console.error('Project analytics error:', error)
            res.status(500).json({
                success: false,
                message: 'שגיאה בקבלת נתוני פרויקט',
                code: 'PROJECT_ANALYTICS_ERROR'
            })
        }
    })
)

// Get user activity analytics
router.get('/users/activity',
    requirePermission(PERMISSIONS.ANALYTICS_VIEW),
    asyncHandler(async (req: express.Request, res: express.Response) => {
        try {
            // Get user activity analytics
            const { userId } = req.query
            if (!userId) {
                return res.status(400).json({
                    success: false,
                    message: 'נדרש מזהה משתמש',
                    code: 'USER_ID_REQUIRED'
                })
            }

            const userAnalytics = await specificAnalyticsService.getUserAnalytics(userId as string)

            res.json({
                success: true,
                data: userAnalytics,
                message: 'נתוני פעילות משתמש התקבלו בהצלחה'
            })
        } catch (error) {
            console.error('User activity analytics error:', error)
            res.status(500).json({
                success: false,
                message: 'שגיאה בקבלת נתוני פעילות משתמשים',
                code: 'USER_ACTIVITY_ERROR'
            })
        }
    })
)

// Get file usage analytics
router.get('/files/usage',
    requirePermission(PERMISSIONS.ANALYTICS_VIEW),
    asyncHandler(async (req: express.Request, res: express.Response) => {
        try {
            const { period = '30d' } = req.query

            // Get file usage analytics
            const fileAnalytics = await specificAnalyticsService.getFileAnalytics(period as string)

            res.json({
                success: true,
                data: fileAnalytics,
                message: 'נתוני שימוש בקבצים התקבלו בהצלחה'
            })
        } catch (error) {
            console.error('File usage analytics error:', error)
            res.status(500).json({
                success: false,
                message: 'שגיאה בקבלת נתוני שימוש בקבצים',
                code: 'FILE_USAGE_ERROR'
            })
        }
    })
)

// Get real-time metrics
router.get('/realtime',
    requirePermission(PERMISSIONS.ANALYTICS_VIEW),
    asyncHandler(async (req: express.Request, res: express.Response) => {
        try {
            // TODO: Implement real-time metrics
            // This would return current system status, active users, etc.

            res.json({
                success: true,
                data: {
                    timestamp: new Date(),
                    activeUsers: 0,
                    activeProjects: 0,
                    systemLoad: 0,
                    memoryUsage: 0,
                    diskUsage: 0
                },
                message: 'מדדי זמן אמת התקבלו בהצלחה'
            })
        } catch (error) {
            console.error('Real-time metrics error:', error)
            res.status(500).json({
                success: false,
                message: 'שגיאה בקבלת מדדי זמן אמת',
                code: 'REALTIME_METRICS_ERROR'
            })
        }
    })
)

export default router
