/**
 * Logs Management Routes
 * Construction Master App - Advanced Logging API
 */

import express from 'express'
import { authenticateToken, requirePermission, PERMISSIONS } from '../middleware/auth'
import { rateLimiters } from '../middleware/security'
import { asyncHandler } from '../middleware/errorHandler'
import { 
    getLogStats, 
    searchLogs, 
    exportLogs,
    logUserActivity,
    logDatabaseOperation,
    logAPICall,
    logSystemEvent,
    logAudit,
    logCollaboration,
    logFileOperation,
    logAnalytics,
    logNotification,
    logBackup,
    logPerformanceMetric,
    logErrorWithContext
} from '../config/logger'

const router = express.Router()

// Rate limiting for log endpoints
router.use(rateLimiters.analytics)

// Authentication required for all log endpoints
router.use(authenticateToken)

// Get log statistics
router.get('/stats',
    requirePermission(PERMISSIONS.ANALYTICS_VIEW),
    asyncHandler(async (req: express.Request, res: express.Response) => {
        try {
            const { startDate, endDate } = req.query
            
            const timeRange = {
                start: startDate ? new Date(startDate as string) : new Date(Date.now() - 24 * 60 * 60 * 1000),
                end: endDate ? new Date(endDate as string) : new Date()
            }

            const stats = await getLogStats(timeRange)

            res.json({
                success: true,
                data: stats,
                message: 'סטטיסטיקות לוגים התקבלו בהצלחה'
            })
        } catch (error) {
            console.error('Get log stats error:', error)
            res.status(500).json({
                success: false,
                message: 'שגיאה בקבלת סטטיסטיקות לוגים',
                code: 'GET_LOG_STATS_ERROR'
            })
        }
    })
)

// Search logs
router.post('/search',
    requirePermission(PERMISSIONS.ANALYTICS_VIEW),
    asyncHandler(async (req: express.Request, res: express.Response) => {
        try {
            const { query, filters, page = 1, limit = 100 } = req.body

            const searchResults = await searchLogs(query, { ...filters, page, limit })

            res.json({
                success: true,
                data: searchResults,
                message: 'חיפוש לוגים הושלם בהצלחה'
            })
        } catch (error) {
            console.error('Search logs error:', error)
            res.status(500).json({
                success: false,
                message: 'שגיאה בחיפוש לוגים',
                code: 'SEARCH_LOGS_ERROR'
            })
        }
    })
)

// Export logs
router.post('/export',
    requirePermission(PERMISSIONS.ANALYTICS_VIEW),
    asyncHandler(async (req: express.Request, res: express.Response) => {
        try {
            const { startDate, endDate, format = 'json' } = req.body
            
            const timeRange = {
                start: new Date(startDate),
                end: new Date(endDate)
            }

            const exportData = await exportLogs(timeRange, format)

            // Set appropriate headers
            let contentType: string
            let filename: string

            switch (format) {
                case 'json':
                    contentType = 'application/json'
                    filename = `logs-${Date.now()}.json`
                    break
                case 'csv':
                    contentType = 'text/csv'
                    filename = `logs-${Date.now()}.csv`
                    break
                case 'txt':
                    contentType = 'text/plain'
                    filename = `logs-${Date.now()}.txt`
                    break
                default:
                    contentType = 'application/octet-stream'
                    filename = `logs-${Date.now()}.${format}`
            }

            res.setHeader('Content-Type', contentType)
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
            res.setHeader('Content-Length', exportData.length)

            res.send(exportData)
        } catch (error) {
            console.error('Export logs error:', error)
            res.status(500).json({
                success: false,
                message: 'שגיאה בייצוא לוגים',
                code: 'EXPORT_LOGS_ERROR'
            })
        }
    })
)

// Log user activity
router.post('/user-activity',
    requirePermission(PERMISSIONS.ANALYTICS_MANAGE),
    asyncHandler(async (req: express.Request, res: express.Response) => {
        try {
            const { userId, action, details } = req.body

            if (!userId || !action) {
                return res.status(400).json({
                    success: false,
                    message: 'נדרשים שדות חובה: userId, action',
                    code: 'MISSING_REQUIRED_FIELDS'
                })
            }

            logUserActivity(userId, action, details)

            res.json({
                success: true,
                message: 'פעילות משתמש נרשמה בהצלחה'
            })
        } catch (error) {
            console.error('Log user activity error:', error)
            res.status(500).json({
                success: false,
                message: 'שגיאה ברישום פעילות משתמש',
                code: 'LOG_USER_ACTIVITY_ERROR'
            })
        }
    })
)

// Log database operation
router.post('/database-operation',
    requirePermission(PERMISSIONS.ANALYTICS_MANAGE),
    asyncHandler(async (req: express.Request, res: express.Response) => {
        try {
            const { operation, collection, duration, success } = req.body

            if (!operation || !collection || duration === undefined || success === undefined) {
                return res.status(400).json({
                    success: false,
                    message: 'נדרשים שדות חובה: operation, collection, duration, success',
                    code: 'MISSING_REQUIRED_FIELDS'
                })
            }

            logDatabaseOperation(operation, collection, duration, success)

            res.json({
                success: true,
                message: 'פעולת מסד נתונים נרשמה בהצלחה'
            })
        } catch (error) {
            console.error('Log database operation error:', error)
            res.status(500).json({
                success: false,
                message: 'שגיאה ברישום פעולת מסד נתונים',
                code: 'LOG_DATABASE_OPERATION_ERROR'
            })
        }
    })
)

// Log API call
router.post('/api-call',
    requirePermission(PERMISSIONS.ANALYTICS_MANAGE),
    asyncHandler(async (req: express.Request, res: express.Response) => {
        try {
            const { endpoint, method, statusCode, responseTime, userId } = req.body

            if (!endpoint || !method || statusCode === undefined || responseTime === undefined) {
                return res.status(400).json({
                    success: false,
                    message: 'נדרשים שדות חובה: endpoint, method, statusCode, responseTime',
                    code: 'MISSING_REQUIRED_FIELDS'
                })
            }

            logAPICall(endpoint, method, statusCode, responseTime, userId)

            res.json({
                success: true,
                message: 'קריאת API נרשמה בהצלחה'
            })
        } catch (error) {
            console.error('Log API call error:', error)
            res.status(500).json({
                success: false,
                message: 'שגיאה ברישום קריאת API',
                code: 'LOG_API_CALL_ERROR'
            })
        }
    })
)

// Log system event
router.post('/system-event',
    requirePermission(PERMISSIONS.ANALYTICS_MANAGE),
    asyncHandler(async (req: express.Request, res: express.Response) => {
        try {
            const { event, severity, details } = req.body

            if (!event || !severity || !details) {
                return res.status(400).json({
                    success: false,
                    message: 'נדרשים שדות חובה: event, severity, details',
                    code: 'MISSING_REQUIRED_FIELDS'
                })
            }

            logSystemEvent(event, severity, details)

            res.json({
                success: true,
                message: 'אירוע מערכת נרשם בהצלחה'
            })
        } catch (error) {
            console.error('Log system event error:', error)
            res.status(500).json({
                success: false,
                message: 'שגיאה ברישום אירוע מערכת',
                code: 'LOG_SYSTEM_EVENT_ERROR'
            })
        }
    })
)

// Log audit event
router.post('/audit',
    requirePermission(PERMISSIONS.ANALYTICS_MANAGE),
    asyncHandler(async (req: express.Request, res: express.Response) => {
        try {
            const { action, resource, userId, details } = req.body

            if (!action || !resource || !userId || !details) {
                return res.status(400).json({
                    success: false,
                    message: 'נדרשים שדות חובה: action, resource, userId, details',
                    code: 'MISSING_REQUIRED_FIELDS'
                })
            }

            logAudit(action, resource, userId, details)

            res.json({
                success: true,
                message: 'אירוע ביקורת נרשם בהצלחה'
            })
        } catch (error) {
            console.error('Log audit error:', error)
            res.status(500).json({
                success: false,
                message: 'שגיאה ברישום אירוע ביקורת',
                code: 'LOG_AUDIT_ERROR'
            })
        }
    })
)

// Log collaboration event
router.post('/collaboration',
    requirePermission(PERMISSIONS.ANALYTICS_MANAGE),
    asyncHandler(async (req: express.Request, res: express.Response) => {
        try {
            const { event, projectId, userId, details } = req.body

            if (!event || !projectId || !userId || !details) {
                return res.status(400).json({
                    success: false,
                    message: 'נדרשים שדות חובה: event, projectId, userId, details',
                    code: 'MISSING_REQUIRED_FIELDS'
                })
            }

            logCollaboration(event, projectId, userId, details)

            res.json({
                success: true,
                message: 'אירוע שיתוף פעולה נרשם בהצלחה'
            })
        } catch (error) {
            console.error('Log collaboration error:', error)
            res.status(500).json({
                success: false,
                message: 'שגיאה ברישום אירוע שיתוף פעולה',
                code: 'LOG_COLLABORATION_ERROR'
            })
        }
    })
)

// Log file operation
router.post('/file-operation',
    requirePermission(PERMISSIONS.ANALYTICS_MANAGE),
    asyncHandler(async (req: express.Request, res: express.Response) => {
        try {
            const { operation, filename, size, userId, projectId } = req.body

            if (!operation || !filename || size === undefined || !userId) {
                return res.status(400).json({
                    success: false,
                    message: 'נדרשים שדות חובה: operation, filename, size, userId',
                    code: 'MISSING_REQUIRED_FIELDS'
                })
            }

            logFileOperation(operation, filename, size, userId, projectId)

            res.json({
                success: true,
                message: 'פעולת קובץ נרשמה בהצלחה'
            })
        } catch (error) {
            console.error('Log file operation error:', error)
            res.status(500).json({
                success: false,
                message: 'שגיאה ברישום פעולת קובץ',
                code: 'LOG_FILE_OPERATION_ERROR'
            })
        }
    })
)

// Log analytics metric
router.post('/analytics',
    requirePermission(PERMISSIONS.ANALYTICS_MANAGE),
    asyncHandler(async (req: express.Request, res: express.Response) => {
        try {
            const { metric, value, context } = req.body

            if (!metric || value === undefined || !context) {
                return res.status(400).json({
                    success: false,
                    message: 'נדרשים שדות חובה: metric, value, context',
                    code: 'MISSING_REQUIRED_FIELDS'
                })
            }

            logAnalytics(metric, value, context)

            res.json({
                success: true,
                message: 'מדד אנליטיקס נרשם בהצלחה'
            })
        } catch (error) {
            console.error('Log analytics error:', error)
            res.status(500).json({
                success: false,
                message: 'שגיאה ברישום מדד אנליטיקס',
                code: 'LOG_ANALYTICS_ERROR'
            })
        }
    })
)

// Log notification
router.post('/notification',
    requirePermission(PERMISSIONS.ANALYTICS_MANAGE),
    asyncHandler(async (req: express.Request, res: express.Response) => {
        try {
            const { type, recipient, subject, success } = req.body

            if (!type || !recipient || !subject || success === undefined) {
                return res.status(400).json({
                    success: false,
                    message: 'נדרשים שדות חובה: type, recipient, subject, success',
                    code: 'MISSING_REQUIRED_FIELDS'
                })
            }

            logNotification(type, recipient, subject, success)

            res.json({
                success: true,
                message: 'התראה נרשמה בהצלחה'
            })
        } catch (error) {
            console.error('Log notification error:', error)
            res.status(500).json({
                success: false,
                message: 'שגיאה ברישום התראה',
                code: 'LOG_NOTIFICATION_ERROR'
            })
        }
    })
)

// Log backup operation
router.post('/backup',
    requirePermission(PERMISSIONS.ANALYTICS_MANAGE),
    asyncHandler(async (req: express.Request, res: express.Response) => {
        try {
            const { operation, size, duration, success } = req.body

            if (!operation || size === undefined || duration === undefined || success === undefined) {
                return res.status(400).json({
                    success: false,
                    message: 'נדרשים שדות חובה: operation, size, duration, success',
                    code: 'MISSING_REQUIRED_FIELDS'
                })
            }

            logBackup(operation, size, duration, success)

            res.json({
                success: true,
                message: 'פעולת גיבוי נרשמה בהצלחה'
            })
        } catch (error) {
            console.error('Log backup error:', error)
            res.status(500).json({
                success: false,
                message: 'שגיאה ברישום פעולת גיבוי',
                code: 'LOG_BACKUP_ERROR'
            })
        }
    })
)

// Log performance metric
router.post('/performance',
    requirePermission(PERMISSIONS.ANALYTICS_MANAGE),
    asyncHandler(async (req: express.Request, res: express.Response) => {
        try {
            const { metric, value, unit, context } = req.body

            if (!metric || value === undefined || !unit || !context) {
                return res.status(400).json({
                    success: false,
                    message: 'נדרשים שדות חובה: metric, value, unit, context',
                    code: 'MISSING_REQUIRED_FIELDS'
                })
            }

            logPerformanceMetric(metric, value, unit, context)

            res.json({
                success: true,
                message: 'מדד ביצועים נרשם בהצלחה'
            })
        } catch (error) {
            console.error('Log performance error:', error)
            res.status(500).json({
                success: false,
                message: 'שגיאה ברישום מדד ביצועים',
                code: 'LOG_PERFORMANCE_ERROR'
            })
        }
    })
)

// Log error with context
router.post('/error',
    requirePermission(PERMISSIONS.ANALYTICS_MANAGE),
    asyncHandler(async (req: express.Request, res: express.Response) => {
        try {
            const { error, context, severity } = req.body

            if (!error || !context) {
                return res.status(400).json({
                    success: false,
                    message: 'נדרשים שדות חובה: error, context',
                    code: 'MISSING_REQUIRED_FIELDS'
                })
            }

            const errorObj = new Error(error.message || error)
            if (error.stack) {
                errorObj.stack = error.stack
            }

            logErrorWithContext(errorObj, context, severity || 'medium')

            res.json({
                success: true,
                message: 'שגיאה נרשמה בהצלחה'
            })
        } catch (error) {
            console.error('Log error error:', error)
            res.status(500).json({
                success: false,
                message: 'שגיאה ברישום שגיאה',
                code: 'LOG_ERROR_ERROR'
            })
        }
    })
)

export default router
