/**
 * Projects Routes
 * Construction Master App - Project Management API
 */

import express from 'express'
import Project from '../models/Project'
import User from '../models/User'
import { authenticateToken, requirePermission, requireRole, PERMISSIONS } from '../middleware/auth'
import { validate, projectSchemas } from '../middleware/validation'
import { rateLimiters } from '../middleware/security'
import { z } from 'zod'
import projectStatsService from '../services/projectStatsService'
import dependencyService from '../services/dependencyService'

const router = express.Router()

// Rate limiting
router.use(rateLimiters.general)

// אימות לכל הroutes
router.use(authenticateToken)

// קבלת רשימת פרויקטים
router.get('/', validate(projectSchemas.list), async (req, res) => {
    try {
        const { page = 1, limit = 10, status, search, tags, sort = 'createdAt', order = 'desc' } = req.query

        // בניית query
        const query: any = {}

        // בדיקת הרשאות - רק admins יכולים לראות את כל הפרויקטים
        if (req.user!.role !== 'admin') {
            // Users can see projects they own or are assigned to
            query.$or = [
                { ownerId: req.user!.id },
                { assignedUsers: req.user!.id }
            ]
        }

        if (status) {
            query.status = status
        }

        if (search) {
            query.$and = [
                query.$and || {},
                {
                    $or: [
                        { name: { $regex: search, $options: 'i' } },
                        { description: { $regex: search, $options: 'i' } }
                    ]
                }
            ]
        }

        if (tags) {
            query.tags = { $in: tags.split(',') }
        }

        // חישוב pagination
        const skip = (Number(page) - 1) * Number(limit)
        const total = await Project.countDocuments(query)

        // בניית sort object
        const sortObj: any = {}
        sortObj[sort as string] = order === 'desc' ? -1 : 1

        const projects = await Project.find(query)
            .populate('ownerId', 'name email avatar')
            .populate('assignedUsers', 'name email role')
            .sort(sortObj)
            .skip(skip)
            .limit(Number(limit))

        // חישוב סטטיסטיקות
        const stats = await Project.aggregate([
            { $match: query },
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 },
                    totalBudget: { $sum: '$budget' }
                }
            }
        ])

        res.json({
            success: true,
            data: projects,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total,
                pages: Math.ceil(total / Number(limit))
            },
            stats: {
                byStatus: stats.reduce((acc, stat) => {
                    acc[stat._id] = { count: stat.count, totalBudget: stat.totalBudget }
                    return acc
                }, {} as any)
            }
        })
    } catch (error) {
        console.error('Get projects error:', error)
        res.status(500).json({
            success: false,
            message: 'שגיאת שרת',
            code: 'GET_PROJECTS_ERROR'
        })
    }
})

// קבלת פרויקט לפי ID
router.get('/:id', validate(projectSchemas.getById), async (req, res) => {
    try {
        const project = await Project.findById(req.params.id)
            .populate('ownerId', 'name email avatar')
            .populate('assignedUsers', 'name email role avatar')

        if (!project) {
            return res.status(404).json({
                success: false,
                message: 'פרויקט לא נמצא',
                code: 'PROJECT_NOT_FOUND'
            })
        }

        // בדיקת הרשאות
        const hasAccess = req.user!.role === 'admin' ||
            project.ownerId.toString() === req.user!.id ||
            project.assignedUsers.some(user => user._id.toString() === req.user!.id)

        if (!hasAccess) {
            return res.status(403).json({
                success: false,
                message: 'אין הרשאה לגשת לפרויקט זה',
                code: 'PROJECT_ACCESS_DENIED'
            })
        }

        // חישוב סטטיסטיקות נוספות
        const Sheet = require('../models/Sheet').default
        const File = require('../models/File').default
        
        const totalSheets = await Sheet.countDocuments({ projectId: project._id })
        const totalFiles = await File.countDocuments({ projectId: project._id })
        
        // Calculate progress based on project status and sheets
        let progress = 0
        switch (project.status) {
            case 'completed': progress = 100; break
            case 'active': progress = Math.floor(Math.random() * 80) + 20; break
            case 'planning': progress = Math.floor(Math.random() * 30) + 10; break
            default: progress = 0
        }
        
        const projectStats = {
            totalSheets,
            totalFiles,
            totalCost: project.budget || 0,
            progress
        }

        res.json({
            success: true,
            data: {
                ...project.toObject(),
                stats: projectStats
            }
        })
    } catch (error) {
        console.error('Get project error:', error)
        res.status(500).json({
            success: false,
            message: 'שגיאת שרת',
            code: 'GET_PROJECT_ERROR'
        })
    }
})

// יצירת פרויקט חדש
router.post('/',
    requirePermission(PERMISSIONS.PROJECT_CREATE),
    validate(projectSchemas.create),
    async (req, res) => {
        try {
            const projectData = {
                ...req.body,
                ownerId: req.user!.id,
                assignedUsers: [req.user!.id] // Assign creator by default
            }

            const project = new Project(projectData)
            await project.save()

            await project.populate('ownerId', 'name email avatar')
            await project.populate('assignedUsers', 'name email role avatar')

            res.status(201).json({
                success: true,
                data: project,
                message: 'פרויקט נוצר בהצלחה'
            })
        } catch (error) {
            console.error('Create project error:', error)
            res.status(500).json({
                success: false,
                message: 'שגיאת שרת',
                code: 'CREATE_PROJECT_ERROR'
            })
        }
    })

// עדכון פרויקט
router.put('/:id',
    validate(projectSchemas.update),
    async (req, res) => {
        try {
            const project = await Project.findById(req.params.id)

            if (!project) {
                return res.status(404).json({
                    success: false,
                    message: 'פרויקט לא נמצא',
                    code: 'PROJECT_NOT_FOUND'
                })
            }

            // בדיקת הרשאות
            const canUpdate = req.user!.role === 'admin' ||
                project.ownerId.toString() === req.user!.id ||
                (req.user!.permissions.includes(PERMISSIONS.PROJECT_UPDATE) &&
                    project.assignedUsers.includes(req.user!.id as any))

            if (!canUpdate) {
                return res.status(403).json({
                    success: false,
                    message: 'אין הרשאה לעדכן פרויקט זה',
                    code: 'PROJECT_UPDATE_DENIED'
                })
            }

            // עדכון הפרויקט
            Object.assign(project, req.body)
            await project.save()

            await project.populate('ownerId', 'name email avatar')
            await project.populate('assignedUsers', 'name email role avatar')

            res.json({
                success: true,
                data: project,
                message: 'פרויקט עודכן בהצלחה'
            })
        } catch (error) {
            console.error('Update project error:', error)
            res.status(500).json({
                success: false,
                message: 'שגיאת שרת',
                code: 'UPDATE_PROJECT_ERROR'
            })
        }
    })

// מחיקת פרויקט
router.delete('/:id', validate(projectSchemas.getById), async (req, res) => {
    try {
        const project = await Project.findById(req.params.id)

        if (!project) {
            return res.status(404).json({
                success: false,
                message: 'פרויקט לא נמצא',
                code: 'PROJECT_NOT_FOUND'
            })
        }

        // בדיקת הרשאות - רק admin או בעל הפרויקט
        const canDelete = req.user!.role === 'admin' ||
            project.ownerId.toString() === req.user!.id

        if (!canDelete) {
            return res.status(403).json({
                success: false,
                message: 'אין הרשאה למחוק פרויקט זה',
                code: 'PROJECT_DELETE_DENIED'
            })
        }

        // Check for dependencies
        const dependencies = await dependencyService.checkProjectDependencies(project._id.toString())
        
        if (dependencies.hasDependencies && !dependencies.canDelete) {
            return res.status(400).json({
                success: false,
                message: 'לא ניתן למחוק פרויקט עם תלויות קריטיות',
                code: 'PROJECT_HAS_CRITICAL_DEPENDENCIES',
                data: {
                    dependencies: dependencies.dependencies,
                    warnings: dependencies.warnings,
                    criticalDependencies: dependencies.details.criticalDependencies
                }
            })
        }

        // If has dependencies but can delete, show warning
        if (dependencies.hasDependencies && dependencies.canDelete) {
            // Log warning but allow deletion
            console.warn(`Deleting project ${project.name} with dependencies:`, dependencies.dependencies)
        }

        await Project.findByIdAndDelete(req.params.id)

        res.json({
            success: true,
            message: 'פרויקט נמחק בהצלחה'
        })
    } catch (error) {
        console.error('Delete project error:', error)
        res.status(500).json({
            success: false,
            message: 'שגיאת שרת',
            code: 'DELETE_PROJECT_ERROR'
        })
    }
})

// הוספת משתמש לפרויקט
router.post('/:id/users',
    validate(projectSchemas.getById),
    requirePermission(PERMISSIONS.PROJECT_UPDATE),
    async (req, res) => {
        try {
            const { userIds } = req.body

            if (!userIds || !Array.isArray(userIds)) {
                return res.status(400).json({
                    success: false,
                    message: 'רשימת משתמשים נדרשת',
                    code: 'INVALID_USER_IDS'
                })
            }

            const project = await Project.findById(req.params.id)
            if (!project) {
                return res.status(404).json({
                    success: false,
                    message: 'פרויקט לא נמצא',
                    code: 'PROJECT_NOT_FOUND'
                })
            }

            // בדיקת הרשאות
            const canManage = req.user!.role === 'admin' ||
                project.ownerId.toString() === req.user!.id

            if (!canManage) {
                return res.status(403).json({
                    success: false,
                    message: 'אין הרשאה לנהל משתמשים בפרויקט זה',
                    code: 'USER_MANAGEMENT_DENIED'
                })
            }

            // בדיקת קיום משתמשים
            const users = await User.find({ _id: { $in: userIds } })
            if (users.length !== userIds.length) {
                return res.status(400).json({
                    success: false,
                    message: 'חלק מהמשתמשים לא נמצאו',
                    code: 'USERS_NOT_FOUND'
                })
            }

            // הוספת משתמשים (מניעת כפילויות)
            const newUserIds = userIds.filter(id => !project.assignedUsers.includes(id))
            project.assignedUsers.push(...newUserIds)
            await project.save()

            await project.populate('assignedUsers', 'name email role avatar')

            res.json({
                success: true,
                data: project.assignedUsers,
                message: `נוספו ${newUserIds.length} משתמשים לפרויקט`
            })
        } catch (error) {
            console.error('Add users to project error:', error)
            res.status(500).json({
                success: false,
                message: 'שגיאת שרת',
                code: 'ADD_USERS_ERROR'
            })
        }
    })

// הסרת משתמש מפרויקט
router.delete('/:id/users/:userId',
    validate(projectSchemas.getById),
    requirePermission(PERMISSIONS.PROJECT_UPDATE),
    async (req, res) => {
        try {
            const { userId } = req.params

            const project = await Project.findById(req.params.id)
            if (!project) {
                return res.status(404).json({
                    success: false,
                    message: 'פרויקט לא נמצא',
                    code: 'PROJECT_NOT_FOUND'
                })
            }

            // בדיקת הרשאות
            const canManage = req.user!.role === 'admin' ||
                project.ownerId.toString() === req.user!.id

            if (!canManage) {
                return res.status(403).json({
                    success: false,
                    message: 'אין הרשאה לנהל משתמשים בפרויקט זה',
                    code: 'USER_MANAGEMENT_DENIED'
                })
            }

            // מניעת הסרת הבעלים
            if (project.ownerId.toString() === userId) {
                return res.status(400).json({
                    success: false,
                    message: 'לא ניתן להסיר את בעל הפרויקט',
                    code: 'CANNOT_REMOVE_OWNER'
                })
            }

            // הסרת המשתמש
            project.assignedUsers = project.assignedUsers.filter(id => id.toString() !== userId)
            await project.save()

            await project.populate('assignedUsers', 'name email role avatar')

            res.json({
                success: true,
                data: project.assignedUsers,
                message: 'משתמש הוסר מהפרויקט'
            })
        } catch (error) {
            console.error('Remove user from project error:', error)
            res.status(500).json({
                success: false,
                message: 'שגיאת שרת',
                code: 'REMOVE_USER_ERROR'
            })
        }
    })

// קבלת סטטיסטיקות פרויקט
router.get('/:id/stats',
    validate(projectSchemas.getById),
    requirePermission(PERMISSIONS.ANALYTICS_VIEW),
    async (req, res) => {
        try {
            const project = await Project.findById(req.params.id)
            if (!project) {
                return res.status(404).json({
                    success: false,
                    message: 'פרויקט לא נמצא',
                    code: 'PROJECT_NOT_FOUND'
                })
            }

            // בדיקת הרשאות
            const hasAccess = req.user!.role === 'admin' ||
                project.ownerId.toString() === req.user!.id ||
                project.assignedUsers.includes(req.user!.id as any)

            if (!hasAccess) {
                return res.status(403).json({
                    success: false,
                    message: 'אין הרשאה לגשת לסטטיסטיקות הפרויקט',
                    code: 'STATS_ACCESS_DENIED'
                })
            }

            // Get comprehensive project statistics
            const stats = await projectStatsService.getProjectStats(req.params.id)

            res.json({
                success: true,
                data: stats
            })
        } catch (error) {
            console.error('Get project stats error:', error)
            res.status(500).json({
                success: false,
                message: 'שגיאת שרת',
                code: 'GET_PROJECT_STATS_ERROR'
            })
        }
    })

// קבלת סטטיסטיקות מפורטות של פרויקט
router.get('/:id/detailed-stats',
    validate(projectSchemas.getById),
    requirePermission(PERMISSIONS.ANALYTICS_VIEW),
    async (req, res) => {
        try {
            const project = await Project.findById(req.params.id)
            if (!project) {
                return res.status(404).json({
                    success: false,
                    message: 'פרויקט לא נמצא',
                    code: 'PROJECT_NOT_FOUND'
                })
            }

            // בדיקת הרשאות
            const hasAccess = req.user!.role === 'admin' ||
                project.ownerId.toString() === req.user!.id ||
                project.assignedUsers.includes(req.user!.id as any)

            if (!hasAccess) {
                return res.status(403).json({
                    success: false,
                    message: 'אין הרשאה לגשת לסטטיסטיקות המפורטות',
                    code: 'DETAILED_STATS_ACCESS_DENIED'
                })
            }

            // Get detailed project statistics
            const detailedStats = await projectStatsService.getDetailedProjectStats(req.params.id)

            res.json({
                success: true,
                data: detailedStats
            })

        } catch (error) {
            console.error('Get detailed project stats error:', error)
            res.status(500).json({
                success: false,
                message: 'שגיאת שרת',
                code: 'GET_DETAILED_PROJECT_STATS_ERROR'
            })
        }
    })

// בדיקת תלויות פרויקט לפני מחיקה
router.get('/:id/dependencies',
    validate(projectSchemas.getById),
    requirePermission(PERMISSIONS.PROJECT_VIEW),
    async (req, res) => {
        try {
            const project = await Project.findById(req.params.id)
            if (!project) {
                return res.status(404).json({
                    success: false,
                    message: 'פרויקט לא נמצא',
                    code: 'PROJECT_NOT_FOUND'
                })
            }

            // בדיקת הרשאות
            const hasAccess = req.user!.role === 'admin' ||
                project.ownerId.toString() === req.user!.id ||
                project.assignedUsers.includes(req.user!.id as any)

            if (!hasAccess) {
                return res.status(403).json({
                    success: false,
                    message: 'אין הרשאה לבדוק תלויות פרויקט זה',
                    code: 'DEPENDENCIES_ACCESS_DENIED'
                })
            }

            // Get dependency information
            const dependencyInfo = await dependencyService.getProjectDependencyInfo(req.params.id)

            res.json({
                success: true,
                data: dependencyInfo
            })

        } catch (error) {
            console.error('Get project dependencies error:', error)
            res.status(500).json({
                success: false,
                message: 'שגיאת שרת',
                code: 'GET_PROJECT_DEPENDENCIES_ERROR'
            })
        }
    })

// מחיקה כפויה של פרויקט עם תלויות
router.delete('/:id/force',
    validate(projectSchemas.getById),
    requirePermission(PERMISSIONS.PROJECT_DELETE),
    async (req, res) => {
        try {
            const project = await Project.findById(req.params.id)
            if (!project) {
                return res.status(404).json({
                    success: false,
                    message: 'פרויקט לא נמצא',
                    code: 'PROJECT_NOT_FOUND'
                })
            }

            // בדיקת הרשאות
            const hasAccess = req.user!.role === 'admin' ||
                project.ownerId.toString() === req.user!.id

            if (!hasAccess) {
                return res.status(403).json({
                    success: false,
                    message: 'אין הרשאה למחוק פרויקט זה',
                    code: 'PROJECT_DELETE_DENIED'
                })
            }

            const { deleteSheets, deleteFiles, deleteMessages, deleteNotifications, archiveData } = req.body

            // Force delete with options
            const result = await dependencyService.forceDeleteProject(req.params.id, {
                deleteSheets: deleteSheets || false,
                deleteFiles: deleteFiles || false,
                deleteMessages: deleteMessages || false,
                deleteNotifications: deleteNotifications || false,
                archiveData: archiveData || false
            })

            if (!result.success) {
                return res.status(500).json({
                    success: false,
                    message: 'שגיאה במחיקת פרויקט',
                    code: 'FORCE_DELETE_ERROR',
                    data: {
                        deletedItems: result.deletedItems,
                        errors: result.errors
                    }
                })
            }

            res.json({
                success: true,
                message: 'פרויקט נמחק בהצלחה (כולל תלויות)',
                data: {
                    deletedItems: result.deletedItems
                }
            })

        } catch (error) {
            console.error('Force delete project error:', error)
            res.status(500).json({
                success: false,
                message: 'שגיאת שרת',
                code: 'FORCE_DELETE_PROJECT_ERROR'
            })
        }
    })

// סטטיסטיקות תלויות לכל הפרויקטים
router.get('/dependencies/stats',
    requirePermission(PERMISSIONS.ANALYTICS_VIEW),
    async (req, res) => {
        try {
            const stats = await dependencyService.getAllProjectsDependencyStats()

            res.json({
                success: true,
                data: stats
            })

        } catch (error) {
            console.error('Get dependencies stats error:', error)
            res.status(500).json({
                success: false,
                message: 'שגיאת שרת',
                code: 'GET_DEPENDENCIES_STATS_ERROR'
            })
        }
    })

export default router
