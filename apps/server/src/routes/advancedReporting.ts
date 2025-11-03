/**
 * Advanced Reporting Routes
 * Construction Master App - Advanced Reporting & Analytics API
 */

import express from 'express'
import { authenticateToken, requirePermission, PERMISSIONS } from '../middleware/auth'
import { rateLimiters } from '../middleware/security'
import { asyncHandler } from '../middleware/errorHandler'
import advancedReportingService from '../services/advancedReportingService'

const router = express.Router()

// Rate limiting for reporting endpoints
router.use(rateLimiters.analytics)

// Authentication required for all reporting endpoints
router.use(authenticateToken)

// Get report templates
router.get('/templates',
    requirePermission(PERMISSIONS.ANALYTICS_VIEW),
    asyncHandler(async (req: express.Request, res: express.Response) => {
        try {
            const { category } = req.query
            const templates = await advancedReportingService.getReportTemplates(category as string)

            res.json({
                success: true,
                data: templates,
                message: 'תבניות דוחות התקבלו בהצלחה'
            })
        } catch (error) {
            console.error('Get report templates error:', error)
            res.status(500).json({
                success: false,
                message: 'שגיאה בקבלת תבניות דוחות',
                code: 'GET_REPORT_TEMPLATES_ERROR'
            })
        }
    })
)

// Get report template by ID
router.get('/templates/:templateId',
    requirePermission(PERMISSIONS.ANALYTICS_VIEW),
    asyncHandler(async (req: express.Request, res: express.Response) => {
        try {
            const { templateId } = req.params
            const template = await advancedReportingService.getReportTemplate(templateId)

            if (!template) {
                return res.status(404).json({
                    success: false,
                    message: 'תבנית דוח לא נמצאה',
                    code: 'REPORT_TEMPLATE_NOT_FOUND'
                })
            }

            res.json({
                success: true,
                data: template,
                message: 'תבנית דוח התקבלה בהצלחה'
            })
        } catch (error) {
            console.error('Get report template error:', error)
            res.status(500).json({
                success: false,
                message: 'שגיאה בקבלת תבנית דוח',
                code: 'GET_REPORT_TEMPLATE_ERROR'
            })
        }
    })
)

// Create report template
router.post('/templates',
    requirePermission(PERMISSIONS.ANALYTICS_MANAGE),
    asyncHandler(async (req: express.Request, res: express.Response) => {
        try {
            const templateData = req.body
            const template = await advancedReportingService.createReportTemplate(templateData)

            res.status(201).json({
                success: true,
                data: template,
                message: 'תבנית דוח נוצרה בהצלחה'
            })
        } catch (error) {
            console.error('Create report template error:', error)
            res.status(500).json({
                success: false,
                message: 'שגיאה ביצירת תבנית דוח',
                code: 'CREATE_REPORT_TEMPLATE_ERROR'
            })
        }
    })
)

// Update report template
router.put('/templates/:templateId',
    requirePermission(PERMISSIONS.ANALYTICS_MANAGE),
    asyncHandler(async (req: express.Request, res: express.Response) => {
        try {
            const { templateId } = req.params
            const updates = req.body
            const template = await advancedReportingService.updateReportTemplate(templateId, updates)

            if (!template) {
                return res.status(404).json({
                    success: false,
                    message: 'תבנית דוח לא נמצאה',
                    code: 'REPORT_TEMPLATE_NOT_FOUND'
                })
            }

            res.json({
                success: true,
                data: template,
                message: 'תבנית דוח עודכנה בהצלחה'
            })
        } catch (error) {
            console.error('Update report template error:', error)
            res.status(500).json({
                success: false,
                message: 'שגיאה בעדכון תבנית דוח',
                code: 'UPDATE_REPORT_TEMPLATE_ERROR'
            })
        }
    })
)

// Delete report template
router.delete('/templates/:templateId',
    requirePermission(PERMISSIONS.ANALYTICS_MANAGE),
    asyncHandler(async (req: express.Request, res: express.Response) => {
        try {
            const { templateId } = req.params
            const success = await advancedReportingService.deleteReportTemplate(templateId)

            if (!success) {
                return res.status(404).json({
                    success: false,
                    message: 'תבנית דוח לא נמצאה',
                    code: 'REPORT_TEMPLATE_NOT_FOUND'
                })
            }

            res.json({
                success: true,
                message: 'תבנית דוח נמחקה בהצלחה'
            })
        } catch (error) {
            console.error('Delete report template error:', error)
            res.status(500).json({
                success: false,
                message: 'שגיאה במחיקת תבנית דוח',
                code: 'DELETE_REPORT_TEMPLATE_ERROR'
            })
        }
    })
)

// Generate report
router.post('/generate',
    requirePermission(PERMISSIONS.ANALYTICS_EXPORT),
    asyncHandler(async (req: express.Request, res: express.Response) => {
        try {
            const { templateId, parameters } = req.body
            const userId = req.user!.id

            if (!templateId) {
                return res.status(400).json({
                    success: false,
                    message: 'נדרש מזהה תבנית דוח',
                    code: 'MISSING_TEMPLATE_ID'
                })
            }

            const report = await advancedReportingService.generateReport(templateId, parameters, userId)

            res.status(201).json({
                success: true,
                data: report,
                message: 'דוח נוצר בהצלחה'
            })
        } catch (error) {
            console.error('Generate report error:', error)
            res.status(500).json({
                success: false,
                message: 'שגיאה ביצירת דוח',
                code: 'GENERATE_REPORT_ERROR'
            })
        }
    })
)

// Get report by ID
router.get('/reports/:reportId',
    requirePermission(PERMISSIONS.ANALYTICS_VIEW),
    asyncHandler(async (req: express.Request, res: express.Response) => {
        try {
            const { reportId } = req.params
            const report = await advancedReportingService.getReport(reportId)

            if (!report) {
                return res.status(404).json({
                    success: false,
                    message: 'דוח לא נמצא',
                    code: 'REPORT_NOT_FOUND'
                })
            }

            res.json({
                success: true,
                data: report,
                message: 'דוח התקבל בהצלחה'
            })
        } catch (error) {
            console.error('Get report error:', error)
            res.status(500).json({
                success: false,
                message: 'שגיאה בקבלת דוח',
                code: 'GET_REPORT_ERROR'
            })
        }
    })
)

// Get user reports
router.get('/reports',
    requirePermission(PERMISSIONS.ANALYTICS_VIEW),
    asyncHandler(async (req: express.Request, res: express.Response) => {
        try {
            const { limit = 50, offset = 0 } = req.query
            const userId = req.user!.id

            const reports = await advancedReportingService.getUserReports(
                userId,
                parseInt(limit as string),
                parseInt(offset as string)
            )

            res.json({
                success: true,
                data: reports,
                message: 'דוחות משתמש התקבלו בהצלחה'
            })
        } catch (error) {
            console.error('Get user reports error:', error)
            res.status(500).json({
                success: false,
                message: 'שגיאה בקבלת דוחות משתמש',
                code: 'GET_USER_REPORTS_ERROR'
            })
        }
    })
)

// Delete report
router.delete('/reports/:reportId',
    requirePermission(PERMISSIONS.ANALYTICS_MANAGE),
    asyncHandler(async (req: express.Request, res: express.Response) => {
        try {
            const { reportId } = req.params
            const success = await advancedReportingService.deleteReport(reportId)

            if (!success) {
                return res.status(404).json({
                    success: false,
                    message: 'דוח לא נמצא',
                    code: 'REPORT_NOT_FOUND'
                })
            }

            res.json({
                success: true,
                message: 'דוח נמחק בהצלחה'
            })
        } catch (error) {
            console.error('Delete report error:', error)
            res.status(500).json({
                success: false,
                message: 'שגיאה במחיקת דוח',
                code: 'DELETE_REPORT_ERROR'
            })
        }
    })
)

// Export report
router.post('/reports/:reportId/export',
    requirePermission(PERMISSIONS.ANALYTICS_EXPORT),
    asyncHandler(async (req: express.Request, res: express.Response) => {
        try {
            const { reportId } = req.params
            const { format = 'pdf' } = req.body

            const export_ = await advancedReportingService.exportReport(reportId, format)

            res.status(201).json({
                success: true,
                data: export_,
                message: 'ייצוא דוח התחיל בהצלחה'
            })
        } catch (error) {
            console.error('Export report error:', error)
            res.status(500).json({
                success: false,
                message: 'שגיאה בייצוא דוח',
                code: 'EXPORT_REPORT_ERROR'
            })
        }
    })
)

// Get report categories
router.get('/categories',
    requirePermission(PERMISSIONS.ANALYTICS_VIEW),
    asyncHandler(async (req: express.Request, res: express.Response) => {
        try {
            const categories = await advancedReportingService.getReportCategories()

            res.json({
                success: true,
                data: categories,
                message: 'קטגוריות דוחות התקבלו בהצלחה'
            })
        } catch (error) {
            console.error('Get report categories error:', error)
            res.status(500).json({
                success: false,
                message: 'שגיאה בקבלת קטגוריות דוחות',
                code: 'GET_REPORT_CATEGORIES_ERROR'
            })
        }
    })
)

// Create report dashboard
router.post('/dashboards',
    requirePermission(PERMISSIONS.ANALYTICS_MANAGE),
    asyncHandler(async (req: express.Request, res: express.Response) => {
        try {
            const dashboardData = req.body
            const dashboard = await advancedReportingService.createReportDashboard(dashboardData)

            res.status(201).json({
                success: true,
                data: dashboard,
                message: 'לוח בקרה נוצר בהצלחה'
            })
        } catch (error) {
            console.error('Create report dashboard error:', error)
            res.status(500).json({
                success: false,
                message: 'שגיאה ביצירת לוח בקרה',
                code: 'CREATE_REPORT_DASHBOARD_ERROR'
            })
        }
    })
)

// Get report dashboards
router.get('/dashboards',
    requirePermission(PERMISSIONS.ANALYTICS_VIEW),
    asyncHandler(async (req: express.Request, res: express.Response) => {
        try {
            const userId = req.user!.id
            const dashboards = await advancedReportingService.getReportDashboards(userId)

            res.json({
                success: true,
                data: dashboards,
                message: 'לוחות בקרה התקבלו בהצלחה'
            })
        } catch (error) {
            console.error('Get report dashboards error:', error)
            res.status(500).json({
                success: false,
                message: 'שגיאה בקבלת לוחות בקרה',
                code: 'GET_REPORT_DASHBOARDS_ERROR'
            })
        }
    })
)

// Get report dashboard by ID
router.get('/dashboards/:dashboardId',
    requirePermission(PERMISSIONS.ANALYTICS_VIEW),
    asyncHandler(async (req: express.Request, res: express.Response) => {
        try {
            const { dashboardId } = req.params
            const dashboard = await advancedReportingService.getReportDashboard(dashboardId)

            if (!dashboard) {
                return res.status(404).json({
                    success: false,
                    message: 'לוח בקרה לא נמצא',
                    code: 'REPORT_DASHBOARD_NOT_FOUND'
                })
            }

            res.json({
                success: true,
                data: dashboard,
                message: 'לוח בקרה התקבל בהצלחה'
            })
        } catch (error) {
            console.error('Get report dashboard error:', error)
            res.status(500).json({
                success: false,
                message: 'שגיאה בקבלת לוח בקרה',
                code: 'GET_REPORT_DASHBOARD_ERROR'
            })
        }
    })
)

// Update report dashboard
router.put('/dashboards/:dashboardId',
    requirePermission(PERMISSIONS.ANALYTICS_MANAGE),
    asyncHandler(async (req: express.Request, res: express.Response) => {
        try {
            const { dashboardId } = req.params
            const updates = req.body
            const dashboard = await advancedReportingService.updateReportDashboard(dashboardId, updates)

            if (!dashboard) {
                return res.status(404).json({
                    success: false,
                    message: 'לוח בקרה לא נמצא',
                    code: 'REPORT_DASHBOARD_NOT_FOUND'
                })
            }

            res.json({
                success: true,
                data: dashboard,
                message: 'לוח בקרה עודכן בהצלחה'
            })
        } catch (error) {
            console.error('Update report dashboard error:', error)
            res.status(500).json({
                success: false,
                message: 'שגיאה בעדכון לוח בקרה',
                code: 'UPDATE_REPORT_DASHBOARD_ERROR'
            })
        }
    })
)

// Delete report dashboard
router.delete('/dashboards/:dashboardId',
    requirePermission(PERMISSIONS.ANALYTICS_MANAGE),
    asyncHandler(async (req: express.Request, res: express.Response) => {
        try {
            const { dashboardId } = req.params
            const success = await advancedReportingService.deleteReportDashboard(dashboardId)

            if (!success) {
                return res.status(404).json({
                    success: false,
                    message: 'לוח בקרה לא נמצא',
                    code: 'REPORT_DASHBOARD_NOT_FOUND'
                })
            }

            res.json({
                success: true,
                message: 'לוח בקרה נמחק בהצלחה'
            })
        } catch (error) {
            console.error('Delete report dashboard error:', error)
            res.status(500).json({
                success: false,
                message: 'שגיאה במחיקת לוח בקרה',
                code: 'DELETE_REPORT_DASHBOARD_ERROR'
            })
        }
    })
)

// Schedule report
router.post('/schedule',
    requirePermission(PERMISSIONS.ANALYTICS_MANAGE),
    asyncHandler(async (req: express.Request, res: express.Response) => {
        try {
            const { templateId, schedule } = req.body
            const userId = req.user!.id

            if (!templateId || !schedule) {
                return res.status(400).json({
                    success: false,
                    message: 'נדרשים מזהה תבנית ולוח זמנים',
                    code: 'MISSING_REQUIRED_FIELDS'
                })
            }

            const scheduledReport = await advancedReportingService.scheduleReport(templateId, schedule, userId)

            res.status(201).json({
                success: true,
                data: scheduledReport,
                message: 'דוח מתוזמן בהצלחה'
            })
        } catch (error) {
            console.error('Schedule report error:', error)
            res.status(500).json({
                success: false,
                message: 'שגיאה בתזמון דוח',
                code: 'SCHEDULE_REPORT_ERROR'
            })
        }
    })
)

// Get scheduled reports
router.get('/schedule',
    requirePermission(PERMISSIONS.ANALYTICS_VIEW),
    asyncHandler(async (req: express.Request, res: express.Response) => {
        try {
            const scheduledReports = await advancedReportingService.getScheduledReports()

            res.json({
                success: true,
                data: scheduledReports,
                message: 'דוחות מתוזמנים התקבלו בהצלחה'
            })
        } catch (error) {
            console.error('Get scheduled reports error:', error)
            res.status(500).json({
                success: false,
                message: 'שגיאה בקבלת דוחות מתוזמנים',
                code: 'GET_SCHEDULED_REPORTS_ERROR'
            })
        }
    })
)

// Run scheduled reports
router.post('/schedule/run',
    requirePermission(PERMISSIONS.ANALYTICS_MANAGE),
    asyncHandler(async (req: express.Request, res: express.Response) => {
        try {
            await advancedReportingService.runScheduledReports()

            res.json({
                success: true,
                message: 'דוחות מתוזמנים הופעלו בהצלחה'
            })
        } catch (error) {
            console.error('Run scheduled reports error:', error)
            res.status(500).json({
                success: false,
                message: 'שגיאה בהפעלת דוחות מתוזמנים',
                code: 'RUN_SCHEDULED_REPORTS_ERROR'
            })
        }
    })
)

export default router
