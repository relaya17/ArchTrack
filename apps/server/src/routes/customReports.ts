/**
 * Custom Reports Routes
 * Construction Master App - Advanced Report Generation API
 */

import express from 'express'
import { authenticateToken, requirePermission, PERMISSIONS } from '../middleware/auth'
import { rateLimiters } from '../middleware/security'
import { asyncHandler } from '../middleware/errorHandler'
import customReportingService from '../services/customReportingService'

const router = express.Router()

// Rate limiting for report endpoints
router.use(rateLimiters.analytics)

// Authentication required for all report endpoints
router.use(authenticateToken)

// Get all report templates
router.get('/templates',
    requirePermission(PERMISSIONS.ANALYTICS_VIEW),
    asyncHandler(async (req: express.Request, res: express.Response) => {
        try {
            const { category } = req.query
            const templates = await customReportingService.getTemplates(category as string)

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

// Get specific report template
router.get('/templates/:templateId',
    requirePermission(PERMISSIONS.ANALYTICS_VIEW),
    asyncHandler(async (req: express.Request, res: express.Response) => {
        try {
            const { templateId } = req.params
            const template = await customReportingService.getTemplate(templateId)

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

// Create new report template
router.post('/templates',
    requirePermission(PERMISSIONS.ANALYTICS_MANAGE),
    asyncHandler(async (req: express.Request, res: express.Response) => {
        try {
            const templateData = req.body

            // Validate required fields
            if (!templateData.name || !templateData.category || !templateData.sections) {
                return res.status(400).json({
                    success: false,
                    message: 'נדרשים שדות חובה: name, category, sections',
                    code: 'MISSING_REQUIRED_FIELDS'
                })
            }

            const template = await customReportingService.createTemplate({
                ...templateData,
                createdBy: req.user!.id
            })

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

            const template = await customReportingService.updateTemplate(templateId, updates)

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

            await customReportingService.deleteTemplate(templateId)

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
router.post('/generate/:templateId',
    requirePermission(PERMISSIONS.ANALYTICS_VIEW),
    asyncHandler(async (req: express.Request, res: express.Response) => {
        try {
            const { templateId } = req.params
            const { parameters = {}, options = {} } = req.body

            // Set default options
            const reportOptions = {
                format: 'pdf',
                includeCharts: true,
                includeImages: true,
                language: 'he',
                timezone: 'Asia/Jerusalem',
                ...options
            }

            // Add user ID to parameters
            parameters.userId = req.user!.id

            const reportBuffer = await customReportingService.generateReport(
                templateId,
                parameters,
                reportOptions
            )

            // Set appropriate headers based on format
            const format = reportOptions.format
            let contentType: string
            let filename: string

            switch (format) {
                case 'pdf':
                    contentType = 'application/pdf'
                    filename = `report-${Date.now()}.pdf`
                    break
                case 'excel':
                    contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                    filename = `report-${Date.now()}.xlsx`
                    break
                case 'csv':
                    contentType = 'text/csv'
                    filename = `report-${Date.now()}.csv`
                    break
                case 'json':
                    contentType = 'application/json'
                    filename = `report-${Date.now()}.json`
                    break
                default:
                    contentType = 'application/octet-stream'
                    filename = `report-${Date.now()}.${format}`
            }

            res.setHeader('Content-Type', contentType)
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
            res.setHeader('Content-Length', reportBuffer.length)

            res.send(reportBuffer)
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

// Generate report with preview (JSON format)
router.post('/preview/:templateId',
    requirePermission(PERMISSIONS.ANALYTICS_VIEW),
    asyncHandler(async (req: express.Request, res: express.Response) => {
        try {
            const { templateId } = req.params
            const { parameters = {} } = req.body

            // Add user ID to parameters
            parameters.userId = req.user!.id

            const reportBuffer = await customReportingService.generateReport(
                templateId,
                parameters,
                { format: 'json' }
            )

            const reportData = JSON.parse(reportBuffer.toString())

            res.json({
                success: true,
                data: reportData,
                message: 'תצוגה מקדימה של דוח התקבלה בהצלחה'
            })
        } catch (error) {
            console.error('Preview report error:', error)
            res.status(500).json({
                success: false,
                message: 'שגיאה בתצוגה מקדימה של דוח',
                code: 'PREVIEW_REPORT_ERROR'
            })
        }
    })
)

// Get available data sources
router.get('/data-sources',
    requirePermission(PERMISSIONS.ANALYTICS_VIEW),
    asyncHandler(async (req: express.Request, res: express.Response) => {
        try {
            const dataSources = [
                {
                    id: 'projects',
                    name: 'Projects',
                    description: 'Project data and information',
                    fields: [
                        { name: 'name', type: 'string', description: 'Project name' },
                        { name: 'status', type: 'string', description: 'Project status' },
                        { name: 'budget', type: 'number', description: 'Project budget' },
                        { name: 'startDate', type: 'date', description: 'Project start date' },
                        { name: 'endDate', type: 'date', description: 'Project end date' },
                        { name: 'ownerId.name', type: 'string', description: 'Project owner name' }
                    ]
                },
                {
                    id: 'users',
                    name: 'Users',
                    description: 'User data and activity',
                    fields: [
                        { name: 'name', type: 'string', description: 'User name' },
                        { name: 'email', type: 'string', description: 'User email' },
                        { name: 'role', type: 'string', description: 'User role' },
                        { name: 'isActive', type: 'boolean', description: 'User active status' },
                        { name: 'lastLogin', type: 'date', description: 'Last login date' }
                    ]
                },
                {
                    id: 'sheets',
                    name: 'Sheets',
                    description: 'Sheet data and information',
                    fields: [
                        { name: 'name', type: 'string', description: 'Sheet name' },
                        { name: 'type', type: 'string', description: 'Sheet type' },
                        { name: 'projectId.name', type: 'string', description: 'Project name' },
                        { name: 'metadata.lastModified', type: 'date', description: 'Last modified date' }
                    ]
                },
                {
                    id: 'files',
                    name: 'Files',
                    description: 'File data and information',
                    fields: [
                        { name: 'originalName', type: 'string', description: 'Original file name' },
                        { name: 'mimetype', type: 'string', description: 'File MIME type' },
                        { name: 'size', type: 'number', description: 'File size' },
                        { name: 'projectId.name', type: 'string', description: 'Project name' },
                        { name: 'createdAt', type: 'date', description: 'Upload date' }
                    ]
                },
                {
                    id: 'messages',
                    name: 'Messages',
                    description: 'Chat messages and communication',
                    fields: [
                        { name: 'message', type: 'string', description: 'Message content' },
                        { name: 'type', type: 'string', description: 'Message type' },
                        { name: 'userId.name', type: 'string', description: 'Sender name' },
                        { name: 'projectId.name', type: 'string', description: 'Project name' },
                        { name: 'timestamp', type: 'date', description: 'Message timestamp' }
                    ]
                },
                {
                    id: 'analytics',
                    name: 'Analytics',
                    description: 'Analytics and metrics data',
                    fields: [
                        { name: 'totalProjects', type: 'number', description: 'Total projects count' },
                        { name: 'totalUsers', type: 'number', description: 'Total users count' },
                        { name: 'totalSheets', type: 'number', description: 'Total sheets count' },
                        { name: 'totalFiles', type: 'number', description: 'Total files count' },
                        { name: 'totalMessages', type: 'number', description: 'Total messages count' }
                    ]
                }
            ]

            res.json({
                success: true,
                data: dataSources,
                message: 'מקורות נתונים זמינים התקבלו בהצלחה'
            })
        } catch (error) {
            console.error('Get data sources error:', error)
            res.status(500).json({
                success: false,
                message: 'שגיאה בקבלת מקורות נתונים',
                code: 'GET_DATA_SOURCES_ERROR'
            })
        }
    })
)

// Get report generation status
router.get('/status/:reportId',
    requirePermission(PERMISSIONS.ANALYTICS_VIEW),
    asyncHandler(async (req: express.Request, res: express.Response) => {
        try {
            const { reportId } = req.params

            // In a real implementation, this would check the status of a background job
            // For now, return a simple status
            res.json({
                success: true,
                data: {
                    reportId,
                    status: 'completed',
                    progress: 100,
                    message: 'Report generation completed'
                },
                message: 'סטטוס יצירת דוח התקבל בהצלחה'
            })
        } catch (error) {
            console.error('Get report status error:', error)
            res.status(500).json({
                success: false,
                message: 'שגיאה בקבלת סטטוס דוח',
                code: 'GET_REPORT_STATUS_ERROR'
            })
        }
    })
)

export default router
