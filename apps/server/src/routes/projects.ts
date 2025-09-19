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
        const projectStats = {
            totalSheets: 0, // TODO: Count from Sheet model
            totalFiles: 0,  // TODO: Count from File model
            totalCost: project.budget || 0,
            progress: 0     // TODO: Calculate based on tasks/sheets
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

        // TODO: Check for dependencies (sheets, files, etc.)
        // const hasDependencies = await checkProjectDependencies(project._id)
        // if (hasDependencies) {
        //     return res.status(400).json({
        //         success: false,
        //         message: 'לא ניתן למחוק פרויקט עם תלויות',
        //         code: 'PROJECT_HAS_DEPENDENCIES'
        //     })
        // }

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

            // חישוב סטטיסטיקות
            const stats = {
                // Basic stats
                totalSheets: 0, // TODO: Count from Sheet model
                totalFiles: 0,  // TODO: Count from File model
                totalUsers: project.assignedUsers.length,

                // Budget stats
                budget: project.budget || 0,
                spent: 0, // TODO: Calculate from expenses

                // Progress stats
                progress: 0, // TODO: Calculate based on completed tasks

                // Timeline stats
                startDate: project.startDate,
                endDate: project.endDate,
                daysRemaining: project.endDate ?
                    Math.ceil((new Date(project.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) :
                    null,

                // Status
                status: project.status,
                lastModified: project.updatedAt
            }

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

export default router
