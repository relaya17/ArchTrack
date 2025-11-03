/**
 * Advanced Analytics Routes
 * Construction Master App - Advanced Analytics & Reporting API
 */

import express from 'express'
import { authenticateToken, requirePermission, PERMISSIONS } from '../middleware/auth'
import { rateLimiters } from '../middleware/security'
import { asyncHandler } from '../middleware/errorHandler'
import advancedAnalyticsService from '../services/advancedAnalyticsService'

const router = express.Router()

// Rate limiting for analytics endpoints
router.use(rateLimiters.analytics)

// Authentication required for all analytics endpoints
router.use(authenticateToken)

// Get comprehensive analytics
router.get('/comprehensive',
    requirePermission(PERMISSIONS.ANALYTICS_VIEW),
    asyncHandler(async (req: express.Request, res: express.Response) => {
        try {
            const { start, end } = req.query
            
            const timeRange = {
                start: start ? new Date(start as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Default: last 30 days
                end: end ? new Date(end as string) : new Date()
            }

            const analytics = await advancedAnalyticsService.getAdvancedAnalytics(timeRange)

            res.json({
                success: true,
                data: analytics,
                message: 'אנליטיקס מתקדמים התקבלו בהצלחה'
            })
        } catch (error) {
            console.error('Advanced analytics error:', error)
            res.status(500).json({
                success: false,
                message: 'שגיאה בקבלת אנליטיקס מתקדמים',
                code: 'ADVANCED_ANALYTICS_ERROR'
            })
        }
    })
)

// Get analytics overview
router.get('/overview',
    requirePermission(PERMISSIONS.ANALYTICS_VIEW),
    asyncHandler(async (req: express.Request, res: express.Response) => {
        try {
            const { start, end } = req.query
            
            const timeRange = {
                start: start ? new Date(start as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                end: end ? new Date(end as string) : new Date()
            }

            const overview = await advancedAnalyticsService.getAnalyticsOverview(timeRange)

            res.json({
                success: true,
                data: overview,
                message: 'סקירה כללית התקבלה בהצלחה'
            })
        } catch (error) {
            console.error('Analytics overview error:', error)
            res.status(500).json({
                success: false,
                message: 'שגיאה בקבלת סקירה כללית',
                code: 'ANALYTICS_OVERVIEW_ERROR'
            })
        }
    })
)

// Get performance analytics
router.get('/performance',
    requirePermission(PERMISSIONS.ANALYTICS_VIEW),
    asyncHandler(async (req: express.Request, res: express.Response) => {
        try {
            const { start, end } = req.query
            
            const timeRange = {
                start: start ? new Date(start as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                end: end ? new Date(end as string) : new Date()
            }

            const performance = await advancedAnalyticsService.getPerformanceAnalytics(timeRange)

            res.json({
                success: true,
                data: performance,
                message: 'אנליטיקס ביצועים התקבלו בהצלחה'
            })
        } catch (error) {
            console.error('Performance analytics error:', error)
            res.status(500).json({
                success: false,
                message: 'שגיאה בקבלת אנליטיקס ביצועים',
                code: 'PERFORMANCE_ANALYTICS_ERROR'
            })
        }
    })
)

// Get financial analytics
router.get('/financial',
    requirePermission(PERMISSIONS.ANALYTICS_VIEW),
    asyncHandler(async (req: express.Request, res: express.Response) => {
        try {
            const { start, end } = req.query
            
            const timeRange = {
                start: start ? new Date(start as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                end: end ? new Date(end as string) : new Date()
            }

            const financial = await advancedAnalyticsService.getFinancialAnalytics(timeRange)

            res.json({
                success: true,
                data: financial,
                message: 'אנליטיקס פיננסיים התקבלו בהצלחה'
            })
        } catch (error) {
            console.error('Financial analytics error:', error)
            res.status(500).json({
                success: false,
                message: 'שגיאה בקבלת אנליטיקס פיננסיים',
                code: 'FINANCIAL_ANALYTICS_ERROR'
            })
        }
    })
)

// Get productivity analytics
router.get('/productivity',
    requirePermission(PERMISSIONS.ANALYTICS_VIEW),
    asyncHandler(async (req: express.Request, res: express.Response) => {
        try {
            const { start, end } = req.query
            
            const timeRange = {
                start: start ? new Date(start as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                end: end ? new Date(end as string) : new Date()
            }

            const productivity = await advancedAnalyticsService.getProductivityAnalytics(timeRange)

            res.json({
                success: true,
                data: productivity,
                message: 'אנליטיקס פרודוקטיביות התקבלו בהצלחה'
            })
        } catch (error) {
            console.error('Productivity analytics error:', error)
            res.status(500).json({
                success: false,
                message: 'שגיאה בקבלת אנליטיקס פרודוקטיביות',
                code: 'PRODUCTIVITY_ANALYTICS_ERROR'
            })
        }
    })
)

// Get quality analytics
router.get('/quality',
    requirePermission(PERMISSIONS.ANALYTICS_VIEW),
    asyncHandler(async (req: express.Request, res: express.Response) => {
        try {
            const { start, end } = req.query
            
            const timeRange = {
                start: start ? new Date(start as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                end: end ? new Date(end as string) : new Date()
            }

            const quality = await advancedAnalyticsService.getQualityAnalytics(timeRange)

            res.json({
                success: true,
                data: quality,
                message: 'אנליטיקס איכות התקבלו בהצלחה'
            })
        } catch (error) {
            console.error('Quality analytics error:', error)
            res.status(500).json({
                success: false,
                message: 'שגיאה בקבלת אנליטיקס איכות',
                code: 'QUALITY_ANALYTICS_ERROR'
            })
        }
    })
)

// Get risk analytics
router.get('/risk',
    requirePermission(PERMISSIONS.ANALYTICS_VIEW),
    asyncHandler(async (req: express.Request, res: express.Response) => {
        try {
            const { start, end } = req.query
            
            const timeRange = {
                start: start ? new Date(start as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                end: end ? new Date(end as string) : new Date()
            }

            const risk = await advancedAnalyticsService.getRiskAnalytics(timeRange)

            res.json({
                success: true,
                data: risk,
                message: 'אנליטיקס סיכונים התקבלו בהצלחה'
            })
        } catch (error) {
            console.error('Risk analytics error:', error)
            res.status(500).json({
                success: false,
                message: 'שגיאה בקבלת אנליטיקס סיכונים',
                code: 'RISK_ANALYTICS_ERROR'
            })
        }
    })
)

// Get sustainability analytics
router.get('/sustainability',
    requirePermission(PERMISSIONS.ANALYTICS_VIEW),
    asyncHandler(async (req: express.Request, res: express.Response) => {
        try {
            const { start, end } = req.query
            
            const timeRange = {
                start: start ? new Date(start as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                end: end ? new Date(end as string) : new Date()
            }

            const sustainability = await advancedAnalyticsService.getSustainabilityAnalytics(timeRange)

            res.json({
                success: true,
                data: sustainability,
                message: 'אנליטיקס קיימות התקבלו בהצלחה'
            })
        } catch (error) {
            console.error('Sustainability analytics error:', error)
            res.status(500).json({
                success: false,
                message: 'שגיאה בקבלת אנליטיקס קיימות',
                code: 'SUSTAINABILITY_ANALYTICS_ERROR'
            })
        }
    })
)

// Get compliance analytics
router.get('/compliance',
    requirePermission(PERMISSIONS.ANALYTICS_VIEW),
    asyncHandler(async (req: express.Request, res: express.Response) => {
        try {
            const { start, end } = req.query
            
            const timeRange = {
                start: start ? new Date(start as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                end: end ? new Date(end as string) : new Date()
            }

            const compliance = await advancedAnalyticsService.getComplianceAnalytics(timeRange)

            res.json({
                success: true,
                data: compliance,
                message: 'אנליטיקס תאימות התקבלו בהצלחה'
            })
        } catch (error) {
            console.error('Compliance analytics error:', error)
            res.status(500).json({
                success: false,
                message: 'שגיאה בקבלת אנליטיקס תאימות',
                code: 'COMPLIANCE_ANALYTICS_ERROR'
            })
        }
    })
)

// Get predictive analytics
router.get('/predictive',
    requirePermission(PERMISSIONS.ANALYTICS_VIEW),
    asyncHandler(async (req: express.Request, res: express.Response) => {
        try {
            const { start, end } = req.query
            
            const timeRange = {
                start: start ? new Date(start as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                end: end ? new Date(end as string) : new Date()
            }

            const predictive = await advancedAnalyticsService.getPredictiveAnalytics(timeRange)

            res.json({
                success: true,
                data: predictive,
                message: 'אנליטיקס חיזוי התקבלו בהצלחה'
            })
        } catch (error) {
            console.error('Predictive analytics error:', error)
            res.status(500).json({
                success: false,
                message: 'שגיאה בקבלת אנליטיקס חיזוי',
                code: 'PREDICTIVE_ANALYTICS_ERROR'
            })
        }
    })
)

// Get analytics trends
router.get('/trends',
    requirePermission(PERMISSIONS.ANALYTICS_VIEW),
    asyncHandler(async (req: express.Request, res: express.Response) => {
        try {
            const { start, end, type } = req.query
            
            const timeRange = {
                start: start ? new Date(start as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                end: end ? new Date(end as string) : new Date()
            }

            const trends = await advancedAnalyticsService.getAnalyticsTrends(timeRange)

            res.json({
                success: true,
                data: trends,
                message: 'מגמות אנליטיקס התקבלו בהצלחה'
            })
        } catch (error) {
            console.error('Analytics trends error:', error)
            res.status(500).json({
                success: false,
                message: 'שגיאה בקבלת מגמות אנליטיקס',
                code: 'ANALYTICS_TRENDS_ERROR'
            })
        }
    })
)

// Get analytics dashboard data
router.get('/dashboard',
    requirePermission(PERMISSIONS.ANALYTICS_VIEW),
    asyncHandler(async (req: express.Request, res: express.Response) => {
        try {
            const { start, end } = req.query
            
            const timeRange = {
                start: start ? new Date(start as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                end: end ? new Date(end as string) : new Date()
            }

            const [
                overview,
                trends,
                performance,
                financial,
                productivity,
                quality,
                risk,
                sustainability,
                compliance,
                predictive
            ] = await Promise.all([
                advancedAnalyticsService.getAnalyticsOverview(timeRange),
                advancedAnalyticsService.getAnalyticsTrends(timeRange),
                advancedAnalyticsService.getPerformanceAnalytics(timeRange),
                advancedAnalyticsService.getFinancialAnalytics(timeRange),
                advancedAnalyticsService.getProductivityAnalytics(timeRange),
                advancedAnalyticsService.getQualityAnalytics(timeRange),
                advancedAnalyticsService.getRiskAnalytics(timeRange),
                advancedAnalyticsService.getSustainabilityAnalytics(timeRange),
                advancedAnalyticsService.getComplianceAnalytics(timeRange),
                advancedAnalyticsService.getPredictiveAnalytics(timeRange)
            ])

            const dashboard = {
                overview,
                trends,
                performance,
                financial,
                productivity,
                quality,
                risk,
                sustainability,
                compliance,
                predictive,
                lastUpdated: new Date()
            }

            res.json({
                success: true,
                data: dashboard,
                message: 'נתוני לוח בקרה התקבלו בהצלחה'
            })
        } catch (error) {
            console.error('Analytics dashboard error:', error)
            res.status(500).json({
                success: false,
                message: 'שגיאה בקבלת נתוני לוח בקרה',
                code: 'ANALYTICS_DASHBOARD_ERROR'
            })
        }
    })
)

// Export analytics data
router.post('/export',
    requirePermission(PERMISSIONS.ANALYTICS_EXPORT),
    asyncHandler(async (req: express.Request, res: express.Response) => {
        try {
            const { start, end, format = 'json', type = 'comprehensive' } = req.body
            
            const timeRange = {
                start: start ? new Date(start) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                end: end ? new Date(end) : new Date()
            }

            let data: any

            switch (type) {
                case 'overview':
                    data = await advancedAnalyticsService.getAnalyticsOverview(timeRange)
                    break
                case 'performance':
                    data = await advancedAnalyticsService.getPerformanceAnalytics(timeRange)
                    break
                case 'financial':
                    data = await advancedAnalyticsService.getFinancialAnalytics(timeRange)
                    break
                case 'productivity':
                    data = await advancedAnalyticsService.getProductivityAnalytics(timeRange)
                    break
                case 'quality':
                    data = await advancedAnalyticsService.getQualityAnalytics(timeRange)
                    break
                case 'risk':
                    data = await advancedAnalyticsService.getRiskAnalytics(timeRange)
                    break
                case 'sustainability':
                    data = await advancedAnalyticsService.getSustainabilityAnalytics(timeRange)
                    break
                case 'compliance':
                    data = await advancedAnalyticsService.getComplianceAnalytics(timeRange)
                    break
                case 'predictive':
                    data = await advancedAnalyticsService.getPredictiveAnalytics(timeRange)
                    break
                default:
                    data = await advancedAnalyticsService.getAdvancedAnalytics(timeRange)
            }

            let exportData: string
            let contentType: string
            let filename: string

            switch (format) {
                case 'csv':
                    exportData = this.convertToCSV(data)
                    contentType = 'text/csv'
                    filename = `analytics-${type}-${new Date().toISOString().split('T')[0]}.csv`
                    break
                case 'xml':
                    exportData = this.convertToXML(data)
                    contentType = 'application/xml'
                    filename = `analytics-${type}-${new Date().toISOString().split('T')[0]}.xml`
                    break
                default:
                    exportData = JSON.stringify(data, null, 2)
                    contentType = 'application/json'
                    filename = `analytics-${type}-${new Date().toISOString().split('T')[0]}.json`
            }

            res.setHeader('Content-Type', contentType)
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
            res.send(exportData)
        } catch (error) {
            console.error('Analytics export error:', error)
            res.status(500).json({
                success: false,
                message: 'שגיאה בייצוא נתוני אנליטיקס',
                code: 'ANALYTICS_EXPORT_ERROR'
            })
        }
    })
)

// Helper methods for data conversion
function convertToCSV(data: any): string {
    // Implementation would convert data to CSV format
    return JSON.stringify(data)
}

function convertToXML(data: any): string {
    // Implementation would convert data to XML format
    return JSON.stringify(data)
}

export default router
