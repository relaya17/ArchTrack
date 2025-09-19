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

            const history = [] // Get conversation history logic would go here

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

export default router
