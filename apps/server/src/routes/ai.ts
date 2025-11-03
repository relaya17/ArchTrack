/**
 * AI Routes
 * Construction Master App - AI Chat & Analysis API
 */

import express from 'express'
import { authenticateToken, requirePermission, PERMISSIONS } from '../middleware/auth'
import { validate, aiSchemas } from '../middleware/validation'
import { rateLimiters } from '../middleware/security'
import { asyncHandler } from '../middleware/errorHandler'
import aiService from '../services/aiService'
import Project from '../models/Project'
import Sheet from '../models/Sheet'

const router = express.Router()

// Rate limiting for AI endpoints
router.use(rateLimiters.ai)

// אימות לכל הroutes
router.use(authenticateToken)

// Chat with AI Assistant
router.post('/chat',
    requirePermission(PERMISSIONS.AI_CHAT),
    validate(aiSchemas.chat),
    asyncHandler(async (req: express.Request, res: express.Response) => {
        try {
            const { message, assistantType = 'construction_assistant', projectId, sheetId } = req.body

            // Get context data if project/sheet specified
            let context: any = {
                userId: req.user!.id,
                userRole: req.user!.role
            }

            if (projectId) {
                const project = await Project.findById(projectId)
                if (project) {
                    context.projectData = {
                        name: project.name,
                        status: project.status,
                        budget: project.budget,
                        startDate: project.startDate,
                        endDate: project.endDate
                    }
                }
            }

            if (sheetId) {
                const sheet = await Sheet.findById(sheetId)
                if (sheet) {
                    context.sheetData = {
                        name: sheet.name,
                        type: sheet.type,
                        cellCount: sheet.cells.length
                    }
                }
            }

            const result = await aiService.generateProjectSuggestions(message, 'general')

            res.json({
                success: true,
                data: result,
                message: 'תגובת AI התקבלה בהצלחה'
            })
        } catch (error) {
            console.error('AI Chat error:', error)
            res.status(500).json({
                success: false,
                message: 'שגיאה בשירות ה-AI',
                code: 'AI_CHAT_ERROR'
            })
        }
    })
)

// Analyze project data
router.post('/analyze-project/:projectId',
    requirePermission(PERMISSIONS.ANALYTICS_VIEW),
    validate(aiSchemas.analyzeProject),
    asyncHandler(async (req: express.Request, res: express.Response) => {
        try {
            const { projectId } = req.params

            // Verify project access
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
                    message: 'אין הרשאה לנתח פרויקט זה',
                    code: 'PROJECT_ACCESS_DENIED'
                })
            }

            // Get project data for analysis
            const projectData = {
                name: project.name,
                description: project.description,
                status: project.status,
                budget: project.budget,
                startDate: project.startDate,
                endDate: project.endDate,
                assignedUsers: project.assignedUsers.length,
                // TODO: Add more metrics like sheets count, files count, etc.
            }

            const analysis = await aiService.analyzeProjectRisks(projectData)

            res.json({
                success: true,
                data: {
                    projectId,
                    analysis,
                    timestamp: new Date()
                },
                message: 'ניתוח פרויקט הושלם בהצלחה'
            })
        } catch (error) {
            console.error('AI Analysis error:', error)
            res.status(500).json({
                success: false,
                message: 'שגיאה בניתוח פרויקט',
                code: 'AI_ANALYSIS_ERROR'
            })
        }
    })
)

// Estimate project costs
router.post('/estimate-costs/:projectId',
    requirePermission(PERMISSIONS.ANALYTICS_VIEW),
    validate(aiSchemas.analyzeProject),
    asyncHandler(async (req: express.Request, res: express.Response) => {
        try {
            const { projectId } = req.params

            // Verify project access
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
                    message: 'אין הרשאה להעריך עלויות לפרויקט זה',
                    code: 'PROJECT_ACCESS_DENIED'
                })
            }

            // Get project data for cost estimation
            const projectData = {
                name: project.name,
                description: project.description,
                type: project.description, // Assuming this contains project type
                size: project.budget, // Using budget as size indicator
                location: 'Israel', // Default location
                complexity: project.assignedUsers.length > 5 ? 'high' : 'medium'
            }

            const estimation = await aiService.generateBOQSuggestions(projectData)

            res.json({
                success: true,
                data: {
                    projectId,
                    estimation,
                    timestamp: new Date()
                },
                message: 'הערכת עלויות הושלמה בהצלחה'
            })
        } catch (error) {
            console.error('AI Cost Estimation error:', error)
            res.status(500).json({
                success: false,
                message: 'שגיאה בהערכת עלויות',
                code: 'AI_COST_ESTIMATION_ERROR'
            })
        }
    })
)

// Generate safety recommendations
router.post('/safety-recommendations/:projectId',
    requirePermission(PERMISSIONS.ANALYTICS_VIEW),
    validate(aiSchemas.analyzeProject),
    asyncHandler(async (req: express.Request, res: express.Response) => {
        try {
            const { projectId } = req.params

            // Verify project access
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
                    message: 'אין הרשאה לקבל המלצות בטיחות לפרויקט זה',
                    code: 'PROJECT_ACCESS_DENIED'
                })
            }

            // Get project data for safety analysis
            const projectData = {
                name: project.name,
                description: project.description,
                type: project.description,
                duration: project.endDate ?
                    Math.ceil((new Date(project.endDate).getTime() - new Date(project.startDate).getTime()) / (1000 * 60 * 60 * 24)) :
                    365,
                teamSize: project.assignedUsers.length,
                location: 'Israel'
            }

            const safetyAnalysis = await aiService.analyzeProjectRisks(projectData)

            res.json({
                success: true,
                data: {
                    projectId,
                    safetyAnalysis,
                    timestamp: new Date()
                },
                message: 'ניתוח בטיחות הושלם בהצלחה'
            })
        } catch (error) {
            console.error('AI Safety Analysis error:', error)
            res.status(500).json({
                success: false,
                message: 'שגיאה בניתוח בטיחות',
                code: 'AI_SAFETY_ANALYSIS_ERROR'
            })
        }
    })
)

// Generate project insights
router.post('/insights/:projectId',
    requirePermission(PERMISSIONS.ANALYTICS_VIEW),
    validate(aiSchemas.analyzeProject),
    asyncHandler(async (req: express.Request, res: express.Response) => {
        try {
            const { projectId } = req.params

            // Verify project access
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
                    message: 'אין הרשאה לקבל תובנות לפרויקט זה',
                    code: 'PROJECT_ACCESS_DENIED'
                })
            }

            // Calculate project metrics
            const now = new Date()
            const startDate = new Date(project.startDate)
            const endDate = project.endDate ? new Date(project.endDate) : null

            const metrics = {
                progress: endDate ?
                    Math.min(100, Math.max(0, ((now.getTime() - startDate.getTime()) / (endDate.getTime() - startDate.getTime())) * 100)) :
                    0,
                daysElapsed: Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)),
                daysRemaining: endDate ? Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : null,
                budget: project.budget || 0,
                teamSize: project.assignedUsers.length,
                status: project.status
            }

            const insights = await aiService.generateSchedulingSuggestions(metrics)

            res.json({
                success: true,
                data: {
                    projectId,
                    metrics,
                    insights,
                    timestamp: new Date()
                },
                message: 'תובנות פרויקט נוצרו בהצלחה'
            })
        } catch (error) {
            console.error('AI Insights error:', error)
            res.status(500).json({
                success: false,
                message: 'שגיאה ביצירת תובנות',
                code: 'AI_INSIGHTS_ERROR'
            })
        }
    })
)

// Clear conversation history
router.delete('/chat-history',
    requirePermission(PERMISSIONS.AI_CHAT),
    validate(aiSchemas.clearHistory),
    asyncHandler(async (req: express.Request, res: express.Response) => {
        try {
            const { assistantType = 'construction_assistant' } = req.body

            // Clear conversation history logic would go here

            res.json({
                success: true,
                message: 'היסטוריית שיחה נמחקה בהצלחה'
            })
        } catch (error) {
            console.error('Clear chat history error:', error)
            res.status(500).json({
                success: false,
                message: 'שגיאה במחיקת היסטוריית שיחה',
                code: 'CLEAR_HISTORY_ERROR'
            })
        }
    })
)

// Get conversation history
router.get('/chat-history',
    requirePermission(PERMISSIONS.AI_CHAT),
    validate(aiSchemas.getHistory),
    asyncHandler(async (req: express.Request, res: express.Response) => {
        try {
            const { assistantType = 'construction_assistant' } = req.query

            const history: any[] = [] // Get conversation history logic would go here

            res.json({
                success: true,
                data: {
                    history,
                    assistantType
                },
                message: 'היסטוריית שיחה התקבלה בהצלחה'
            })
        } catch (error) {
            console.error('Get chat history error:', error)
            res.status(500).json({
                success: false,
                message: 'שגיאה בקבלת היסטוריית שיחה',
                code: 'GET_HISTORY_ERROR'
            })
        }
    })
)

// Get available AI assistants
router.get('/assistants',
    requirePermission(PERMISSIONS.AI_CHAT),
    asyncHandler(async (req: express.Request, res: express.Response) => {
        try {
            const assistants = [
                {
                    id: 'construction_assistant',
                    name: 'עוזר ניהול פרויקטים',
                    description: 'עוזר כללי לניהול פרויקטי בנייה',
                    icon: '🏗️'
                },
                {
                    id: 'data_analyst',
                    name: 'אנליסט נתונים',
                    description: 'ניתוח נתונים ותובנות עסקיות',
                    icon: '📊'
                },
                {
                    id: 'cost_estimator',
                    name: 'מומחה הערכת עלויות',
                    description: 'הערכת עלויות ותקציבים',
                    icon: '💰'
                },
                {
                    id: 'safety_advisor',
                    name: 'יועץ בטיחות',
                    description: 'ייעוץ בטיחות וסיכונים',
                    icon: '🛡️'
                }
            ]

            res.json({
                success: true,
                data: assistants,
                message: 'רשימת עוזרי AI התקבלה בהצלחה'
            })
        } catch (error) {
            console.error('Get AI assistants error:', error)
            res.status(500).json({
                success: false,
                message: 'שגיאה בקבלת רשימת עוזרי AI',
                code: 'GET_ASSISTANTS_ERROR'
            })
        }
    })
)

// Advanced AI Features

// Generate construction schedule
router.post('/schedule/:projectId',
    requirePermission(PERMISSIONS.AI_ANALYZE),
    validate(aiSchemas.analyzeProject),
    asyncHandler(async (req: express.Request, res: express.Response) => {
        try {
            const { projectId } = req.params
            const { scheduleType = 'gantt', constraints = {} } = req.body

            // Verify project access
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
                    message: 'אין הרשאה ליצור לוח זמנים לפרויקט זה',
                    code: 'PROJECT_ACCESS_DENIED'
                })
            }

            const scheduleData = {
                projectId,
                name: project.name,
                startDate: project.startDate,
                endDate: project.endDate,
                budget: project.budget,
                teamSize: project.assignedUsers.length,
                constraints
            }

            const schedule = await aiService.generateConstructionSchedule(scheduleData, scheduleType)

            res.json({
                success: true,
                data: {
                    projectId,
                    schedule,
                    scheduleType,
                    timestamp: new Date()
                },
                message: 'לוח זמנים נוצר בהצלחה'
            })
        } catch (error) {
            console.error('AI Schedule Generation error:', error)
            res.status(500).json({
                success: false,
                message: 'שגיאה ביצירת לוח זמנים',
                code: 'AI_SCHEDULE_ERROR'
            })
        }
    })
)

// Analyze BIM data
router.post('/analyze-bim/:fileId',
    requirePermission(PERMISSIONS.AI_ANALYZE),
    asyncHandler(async (req: express.Request, res: express.Response) => {
        try {
            const { fileId } = req.params
            const { analysisType = 'structural' } = req.body

            // Get BIM file data (this would be implemented with BIM service)
            const bimData = {
                fileId,
                type: 'ifc',
                elements: [],
                materials: [],
                layers: []
            }

            const analysis = await aiService.analyzeBIMData(bimData, analysisType)

            res.json({
                success: true,
                data: {
                    fileId,
                    analysis,
                    analysisType,
                    timestamp: new Date()
                },
                message: 'ניתוח BIM הושלם בהצלחה'
            })
        } catch (error) {
            console.error('AI BIM Analysis error:', error)
            res.status(500).json({
                success: false,
                message: 'שגיאה בניתוח BIM',
                code: 'AI_BIM_ANALYSIS_ERROR'
            })
        }
    })
)

// Generate material specifications
router.post('/materials/:projectId',
    requirePermission(PERMISSIONS.AI_ANALYZE),
    validate(aiSchemas.analyzeProject),
    asyncHandler(async (req: express.Request, res: express.Response) => {
        try {
            const { projectId } = req.params
            const { materialType = 'all', specifications = {} } = req.body

            // Verify project access
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
                    message: 'אין הרשאה לקבל מפרטי חומרים לפרויקט זה',
                    code: 'PROJECT_ACCESS_DENIED'
                })
            }

            const materialData = {
                projectId,
                name: project.name,
                type: project.description,
                budget: project.budget,
                location: 'Israel',
                specifications
            }

            const materials = await aiService.generateMaterialSpecifications(materialData, materialType)

            res.json({
                success: true,
                data: {
                    projectId,
                    materials,
                    materialType,
                    timestamp: new Date()
                },
                message: 'מפרטי חומרים נוצרו בהצלחה'
            })
        } catch (error) {
            console.error('AI Material Specifications error:', error)
            res.status(500).json({
                success: false,
                message: 'שגיאה ביצירת מפרטי חומרים',
                code: 'AI_MATERIALS_ERROR'
            })
        }
    })
)

// Generate quality control checklist
router.post('/quality-checklist/:projectId',
    requirePermission(PERMISSIONS.AI_ANALYZE),
    validate(aiSchemas.analyzeProject),
    asyncHandler(async (req: express.Request, res: express.Response) => {
        try {
            const { projectId } = req.params
            const { phase = 'all', standards = ['ISO9001'] } = req.body

            // Verify project access
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
                    message: 'אין הרשאה לקבל רשימת בקרת איכות לפרויקט זה',
                    code: 'PROJECT_ACCESS_DENIED'
                })
            }

            const qualityData = {
                projectId,
                name: project.name,
                type: project.description,
                phase,
                standards,
                teamSize: project.assignedUsers.length
            }

            const checklist = await aiService.generateQualityChecklist(qualityData)

            res.json({
                success: true,
                data: {
                    projectId,
                    checklist,
                    phase,
                    standards,
                    timestamp: new Date()
                },
                message: 'רשימת בקרת איכות נוצרה בהצלחה'
            })
        } catch (error) {
            console.error('AI Quality Checklist error:', error)
            res.status(500).json({
                success: false,
                message: 'שגיאה ביצירת רשימת בקרת איכות',
                code: 'AI_QUALITY_ERROR'
            })
        }
    })
)

// Generate sustainability report
router.post('/sustainability/:projectId',
    requirePermission(PERMISSIONS.AI_ANALYZE),
    validate(aiSchemas.analyzeProject),
    asyncHandler(async (req: express.Request, res: express.Response) => {
        try {
            const { projectId } = req.params
            const { reportType = 'comprehensive', standards = ['LEED'] } = req.body

            // Verify project access
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
                    message: 'אין הרשאה לקבל דוח קיימות לפרויקט זה',
                    code: 'PROJECT_ACCESS_DENIED'
                })
            }

            const sustainabilityData = {
                projectId,
                name: project.name,
                type: project.description,
                budget: project.budget,
                location: 'Israel',
                standards
            }

            const report = await aiService.generateSustainabilityReport(sustainabilityData, reportType)

            res.json({
                success: true,
                data: {
                    projectId,
                    report,
                    reportType,
                    standards,
                    timestamp: new Date()
                },
                message: 'דוח קיימות נוצר בהצלחה'
            })
        } catch (error) {
            console.error('AI Sustainability Report error:', error)
            res.status(500).json({
                success: false,
                message: 'שגיאה ביצירת דוח קיימות',
                code: 'AI_SUSTAINABILITY_ERROR'
            })
        }
    })
)

// Generate compliance report
router.post('/compliance/:projectId',
    requirePermission(PERMISSIONS.AI_ANALYZE),
    validate(aiSchemas.analyzeProject),
    asyncHandler(async (req: express.Request, res: express.Response) => {
        try {
            const { projectId } = req.params
            const { regulations = ['Israeli Building Code'], reportType = 'full' } = req.body

            // Verify project access
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
                    message: 'אין הרשאה לקבל דוח תאימות לפרויקט זה',
                    code: 'PROJECT_ACCESS_DENIED'
                })
            }

            const complianceData = {
                projectId,
                name: project.name,
                type: project.description,
                location: 'Israel',
                regulations,
                teamSize: project.assignedUsers.length
            }

            const report = await aiService.generateComplianceReport(complianceData, reportType)

            res.json({
                success: true,
                data: {
                    projectId,
                    report,
                    regulations,
                    reportType,
                    timestamp: new Date()
                },
                message: 'דוח תאימות נוצר בהצלחה'
            })
        } catch (error) {
            console.error('AI Compliance Report error:', error)
            res.status(500).json({
                success: false,
                message: 'שגיאה ביצירת דוח תאימות',
                code: 'AI_COMPLIANCE_ERROR'
            })
        }
    })
)

// Generate risk assessment
router.post('/risk-assessment/:projectId',
    requirePermission(PERMISSIONS.AI_ANALYZE),
    validate(aiSchemas.analyzeProject),
    asyncHandler(async (req: express.Request, res: express.Response) => {
        try {
            const { projectId } = req.params
            const { riskTypes = ['all'], assessmentLevel = 'detailed' } = req.body

            // Verify project access
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
                    message: 'אין הרשאה לקבל הערכת סיכונים לפרויקט זה',
                    code: 'PROJECT_ACCESS_DENIED'
                })
            }

            const riskData = {
                projectId,
                name: project.name,
                type: project.description,
                budget: project.budget,
                duration: project.endDate ? 
                    Math.ceil((new Date(project.endDate).getTime() - new Date(project.startDate).getTime()) / (1000 * 60 * 60 * 24)) :
                    365,
                teamSize: project.assignedUsers.length,
                location: 'Israel'
            }

            const assessment = await aiService.generateRiskAssessment(riskData, riskTypes, assessmentLevel)

            res.json({
                success: true,
                data: {
                    projectId,
                    assessment,
                    riskTypes,
                    assessmentLevel,
                    timestamp: new Date()
                },
                message: 'הערכת סיכונים נוצרה בהצלחה'
            })
        } catch (error) {
            console.error('AI Risk Assessment error:', error)
            res.status(500).json({
                success: false,
                message: 'שגיאה ביצירת הערכת סיכונים',
                code: 'AI_RISK_ASSESSMENT_ERROR'
            })
        }
    })
)

// Generate project documentation
router.post('/documentation/:projectId',
    requirePermission(PERMISSIONS.AI_ANALYZE),
    validate(aiSchemas.analyzeProject),
    asyncHandler(async (req: express.Request, res: express.Response) => {
        try {
            const { projectId } = req.params
            const { docType = 'project_manual', language = 'he' } = req.body

            // Verify project access
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
                    message: 'אין הרשאה ליצור תיעוד לפרויקט זה',
                    code: 'PROJECT_ACCESS_DENIED'
                })
            }

            const docData = {
                projectId,
                name: project.name,
                description: project.description,
                type: project.description,
                teamSize: project.assignedUsers.length,
                language
            }

            const documentation = await aiService.generateProjectDocumentation(docData, docType)

            res.json({
                success: true,
                data: {
                    projectId,
                    documentation,
                    docType,
                    language,
                    timestamp: new Date()
                },
                message: 'תיעוד פרויקט נוצר בהצלחה'
            })
        } catch (error) {
            console.error('AI Documentation error:', error)
            res.status(500).json({
                success: false,
                message: 'שגיאה ביצירת תיעוד פרויקט',
                code: 'AI_DOCUMENTATION_ERROR'
            })
        }
    })
)

// Get AI model status
router.get('/status',
    requirePermission(PERMISSIONS.AI_CHAT),
    asyncHandler(async (req: express.Request, res: express.Response) => {
        try {
            const status = await aiService.getModelStatus()

            res.json({
                success: true,
                data: status,
                message: 'סטטוס מודל AI התקבל בהצלחה'
            })
        } catch (error) {
            console.error('Get AI status error:', error)
            res.status(500).json({
                success: false,
                message: 'שגיאה בקבלת סטטוס מודל AI',
                code: 'GET_AI_STATUS_ERROR'
            })
        }
    })
)

// Get AI usage statistics
router.get('/usage-stats',
    requirePermission(PERMISSIONS.ANALYTICS_VIEW),
    asyncHandler(async (req: express.Request, res: express.Response) => {
        try {
            const { period = '30d' } = req.query
            const stats = await aiService.getUsageStatistics(period as string)

            res.json({
                success: true,
                data: stats,
                message: 'סטטיסטיקות שימוש AI התקבלו בהצלחה'
            })
        } catch (error) {
            console.error('Get AI usage stats error:', error)
            res.status(500).json({
                success: false,
                message: 'שגיאה בקבלת סטטיסטיקות שימוש AI',
                code: 'GET_AI_USAGE_STATS_ERROR'
            })
        }
    })
)

export default router
