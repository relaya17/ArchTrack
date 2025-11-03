/**
 * Enterprise Routes
 * Construction Master App - Enterprise Features (SSO, RBAC)
 */

import express from 'express'
import { authenticateToken, requirePermission, PERMISSIONS } from '../middleware/auth'
import { rateLimiters } from '../middleware/security'
import { asyncHandler } from '../middleware/errorHandler'
import ssoService from '../services/ssoService'
import rbacService from '../services/rbacService'

const router = express.Router()

// Rate limiting for enterprise endpoints
router.use(rateLimiters.enterprise)

// Authentication required for all enterprise endpoints
router.use(authenticateToken)

// SSO Routes

// Get SSO providers
router.get('/sso/providers',
    requirePermission(PERMISSIONS.ANALYTICS_VIEW),
    asyncHandler(async (req: express.Request, res: express.Response) => {
        try {
            const providers = ssoService.getAllProviders()

            res.json({
                success: true,
                data: providers,
                message: 'ספקי SSO התקבלו בהצלחה'
            })
        } catch (error) {
            console.error('Get SSO providers error:', error)
            res.status(500).json({
                success: false,
                message: 'שגיאה בקבלת ספקי SSO',
                code: 'GET_SSO_PROVIDERS_ERROR'
            })
        }
    })
)

// Get SSO provider by ID
router.get('/sso/providers/:providerId',
    requirePermission(PERMISSIONS.ANALYTICS_VIEW),
    asyncHandler(async (req: express.Request, res: express.Response) => {
        try {
            const { providerId } = req.params
            const provider = ssoService.getProvider(providerId)

            if (!provider) {
                return res.status(404).json({
                    success: false,
                    message: 'ספק SSO לא נמצא',
                    code: 'SSO_PROVIDER_NOT_FOUND'
                })
            }

            res.json({
                success: true,
                data: provider,
                message: 'ספק SSO התקבל בהצלחה'
            })
        } catch (error) {
            console.error('Get SSO provider error:', error)
            res.status(500).json({
                success: false,
                message: 'שגיאה בקבלת ספק SSO',
                code: 'GET_SSO_PROVIDER_ERROR'
            })
        }
    })
)

// Create SSO provider
router.post('/sso/providers',
    requirePermission(PERMISSIONS.ANALYTICS_MANAGE),
    asyncHandler(async (req: express.Request, res: express.Response) => {
        try {
            const providerData = req.body
            ssoService.addProvider(providerData)

            res.status(201).json({
                success: true,
                data: providerData,
                message: 'ספק SSO נוצר בהצלחה'
            })
        } catch (error) {
            console.error('Create SSO provider error:', error)
            res.status(500).json({
                success: false,
                message: 'שגיאה ביצירת ספק SSO',
                code: 'CREATE_SSO_PROVIDER_ERROR'
            })
        }
    })
)

// Update SSO provider
router.put('/sso/providers/:providerId',
    requirePermission(PERMISSIONS.ANALYTICS_MANAGE),
    asyncHandler(async (req: express.Request, res: express.Response) => {
        try {
            const { providerId } = req.params
            const updates = req.body
            const success = ssoService.updateProvider(providerId, updates)

            if (!success) {
                return res.status(404).json({
                    success: false,
                    message: 'ספק SSO לא נמצא',
                    code: 'SSO_PROVIDER_NOT_FOUND'
                })
            }

            res.json({
                success: true,
                message: 'ספק SSO עודכן בהצלחה'
            })
        } catch (error) {
            console.error('Update SSO provider error:', error)
            res.status(500).json({
                success: false,
                message: 'שגיאה בעדכון ספק SSO',
                code: 'UPDATE_SSO_PROVIDER_ERROR'
            })
        }
    })
)

// Delete SSO provider
router.delete('/sso/providers/:providerId',
    requirePermission(PERMISSIONS.ANALYTICS_MANAGE),
    asyncHandler(async (req: express.Request, res: express.Response) => {
        try {
            const { providerId } = req.params
            const success = ssoService.deleteProvider(providerId)

            if (!success) {
                return res.status(404).json({
                    success: false,
                    message: 'ספק SSO לא נמצא',
                    code: 'SSO_PROVIDER_NOT_FOUND'
                })
            }

            res.json({
                success: true,
                message: 'ספק SSO נמחק בהצלחה'
            })
        } catch (error) {
            console.error('Delete SSO provider error:', error)
            res.status(500).json({
                success: false,
                message: 'שגיאה במחיקת ספק SSO',
                code: 'DELETE_SSO_PROVIDER_ERROR'
            })
        }
    })
)

// Generate SSO authorization URL
router.post('/sso/auth/:providerId',
    asyncHandler(async (req: express.Request, res: express.Response) => {
        try {
            const { providerId } = req.params
            const { redirectUri } = req.body

            if (!redirectUri) {
                return res.status(400).json({
                    success: false,
                    message: 'נדרש redirectUri',
                    code: 'MISSING_REDIRECT_URI'
                })
            }

            const authUrl = ssoService.generateAuthUrl(providerId, redirectUri)

            res.json({
                success: true,
                data: { authUrl },
                message: 'כתובת הרשאה נוצרה בהצלחה'
            })
        } catch (error) {
            console.error('Generate SSO auth URL error:', error)
            res.status(500).json({
                success: false,
                message: 'שגיאה ביצירת כתובת הרשאה',
                code: 'GENERATE_SSO_AUTH_URL_ERROR'
            })
        }
    })
)

// Handle SSO callback
router.post('/sso/callback/:providerId',
    asyncHandler(async (req: express.Request, res: express.Response) => {
        try {
            const { providerId } = req.params
            const { code, state } = req.body

            if (!code || !state) {
                return res.status(400).json({
                    success: false,
                    message: 'נדרשים code ו-state',
                    code: 'MISSING_REQUIRED_PARAMETERS'
                })
            }

            const user = await ssoService.handleCallback(providerId, code, state)

            res.json({
                success: true,
                data: user,
                message: 'התחברות SSO הושלמה בהצלחה'
            })
        } catch (error) {
            console.error('SSO callback error:', error)
            res.status(500).json({
                success: false,
                message: 'שגיאה בהתחברות SSO',
                code: 'SSO_CALLBACK_ERROR'
            })
        }
    })
)

// Test SSO provider connection
router.post('/sso/providers/:providerId/test',
    requirePermission(PERMISSIONS.ANALYTICS_MANAGE),
    asyncHandler(async (req: express.Request, res: express.Response) => {
        try {
            const { providerId } = req.params
            const provider = ssoService.getProvider(providerId)

            if (!provider) {
                return res.status(404).json({
                    success: false,
                    message: 'ספק SSO לא נמצא',
                    code: 'SSO_PROVIDER_NOT_FOUND'
                })
            }

            const result = await ssoService.testConnection(provider)

            res.json({
                success: result.success,
                data: result,
                message: result.success ? 'חיבור SSO תקין' : 'שגיאה בחיבור SSO'
            })
        } catch (error) {
            console.error('Test SSO connection error:', error)
            res.status(500).json({
                success: false,
                message: 'שגיאה בבדיקת חיבור SSO',
                code: 'TEST_SSO_CONNECTION_ERROR'
            })
        }
    })
)

// RBAC Routes

// Get permissions
router.get('/rbac/permissions',
    requirePermission(PERMISSIONS.ANALYTICS_VIEW),
    asyncHandler(async (req: express.Request, res: express.Response) => {
        try {
            const permissions = rbacService.getAllPermissions()

            res.json({
                success: true,
                data: permissions,
                message: 'הרשאות התקבלו בהצלחה'
            })
        } catch (error) {
            console.error('Get permissions error:', error)
            res.status(500).json({
                success: false,
                message: 'שגיאה בקבלת הרשאות',
                code: 'GET_PERMISSIONS_ERROR'
            })
        }
    })
)

// Get permission by ID
router.get('/rbac/permissions/:permissionId',
    requirePermission(PERMISSIONS.ANALYTICS_VIEW),
    asyncHandler(async (req: express.Request, res: express.Response) => {
        try {
            const { permissionId } = req.params
            const permission = rbacService.getPermission(permissionId)

            if (!permission) {
                return res.status(404).json({
                    success: false,
                    message: 'הרשאה לא נמצאה',
                    code: 'PERMISSION_NOT_FOUND'
                })
            }

            res.json({
                success: true,
                data: permission,
                message: 'הרשאה התקבלה בהצלחה'
            })
        } catch (error) {
            console.error('Get permission error:', error)
            res.status(500).json({
                success: false,
                message: 'שגיאה בקבלת הרשאה',
                code: 'GET_PERMISSION_ERROR'
            })
        }
    })
)

// Create permission
router.post('/rbac/permissions',
    requirePermission(PERMISSIONS.ANALYTICS_MANAGE),
    asyncHandler(async (req: express.Request, res: express.Response) => {
        try {
            const permissionData = req.body
            const permission = rbacService.createPermission(permissionData)

            res.status(201).json({
                success: true,
                data: permission,
                message: 'הרשאה נוצרה בהצלחה'
            })
        } catch (error) {
            console.error('Create permission error:', error)
            res.status(500).json({
                success: false,
                message: 'שגיאה ביצירת הרשאה',
                code: 'CREATE_PERMISSION_ERROR'
            })
        }
    })
)

// Update permission
router.put('/rbac/permissions/:permissionId',
    requirePermission(PERMISSIONS.ANALYTICS_MANAGE),
    asyncHandler(async (req: express.Request, res: express.Response) => {
        try {
            const { permissionId } = req.params
            const updates = req.body
            const success = rbacService.updatePermission(permissionId, updates)

            if (!success) {
                return res.status(404).json({
                    success: false,
                    message: 'הרשאה לא נמצאה',
                    code: 'PERMISSION_NOT_FOUND'
                })
            }

            res.json({
                success: true,
                message: 'הרשאה עודכנה בהצלחה'
            })
        } catch (error) {
            console.error('Update permission error:', error)
            res.status(500).json({
                success: false,
                message: 'שגיאה בעדכון הרשאה',
                code: 'UPDATE_PERMISSION_ERROR'
            })
        }
    })
)

// Delete permission
router.delete('/rbac/permissions/:permissionId',
    requirePermission(PERMISSIONS.ANALYTICS_MANAGE),
    asyncHandler(async (req: express.Request, res: express.Response) => {
        try {
            const { permissionId } = req.params
            const success = rbacService.deletePermission(permissionId)

            if (!success) {
                return res.status(404).json({
                    success: false,
                    message: 'הרשאה לא נמצאה או לא ניתן למחוק',
                    code: 'PERMISSION_NOT_FOUND_OR_SYSTEM'
                })
            }

            res.json({
                success: true,
                message: 'הרשאה נמחקה בהצלחה'
            })
        } catch (error) {
            console.error('Delete permission error:', error)
            res.status(500).json({
                success: false,
                message: 'שגיאה במחיקת הרשאה',
                code: 'DELETE_PERMISSION_ERROR'
            })
        }
    })
)

// Get roles
router.get('/rbac/roles',
    requirePermission(PERMISSIONS.ANALYTICS_VIEW),
    asyncHandler(async (req: express.Request, res: express.Response) => {
        try {
            const roles = rbacService.getAllRoles()

            res.json({
                success: true,
                data: roles,
                message: 'תפקידים התקבלו בהצלחה'
            })
        } catch (error) {
            console.error('Get roles error:', error)
            res.status(500).json({
                success: false,
                message: 'שגיאה בקבלת תפקידים',
                code: 'GET_ROLES_ERROR'
            })
        }
    })
)

// Get role by ID
router.get('/rbac/roles/:roleId',
    requirePermission(PERMISSIONS.ANALYTICS_VIEW),
    asyncHandler(async (req: express.Request, res: express.Response) => {
        try {
            const { roleId } = req.params
            const role = rbacService.getRole(roleId)

            if (!role) {
                return res.status(404).json({
                    success: false,
                    message: 'תפקיד לא נמצא',
                    code: 'ROLE_NOT_FOUND'
                })
            }

            res.json({
                success: true,
                data: role,
                message: 'תפקיד התקבל בהצלחה'
            })
        } catch (error) {
            console.error('Get role error:', error)
            res.status(500).json({
                success: false,
                message: 'שגיאה בקבלת תפקיד',
                code: 'GET_ROLE_ERROR'
            })
        }
    })
)

// Create role
router.post('/rbac/roles',
    requirePermission(PERMISSIONS.ANALYTICS_MANAGE),
    asyncHandler(async (req: express.Request, res: express.Response) => {
        try {
            const roleData = req.body
            const role = rbacService.createRole(roleData)

            res.status(201).json({
                success: true,
                data: role,
                message: 'תפקיד נוצר בהצלחה'
            })
        } catch (error) {
            console.error('Create role error:', error)
            res.status(500).json({
                success: false,
                message: 'שגיאה ביצירת תפקיד',
                code: 'CREATE_ROLE_ERROR'
            })
        }
    })
)

// Update role
router.put('/rbac/roles/:roleId',
    requirePermission(PERMISSIONS.ANALYTICS_MANAGE),
    asyncHandler(async (req: express.Request, res: express.Response) => {
        try {
            const { roleId } = req.params
            const updates = req.body
            const success = rbacService.updateRole(roleId, updates)

            if (!success) {
                return res.status(404).json({
                    success: false,
                    message: 'תפקיד לא נמצא',
                    code: 'ROLE_NOT_FOUND'
                })
            }

            res.json({
                success: true,
                message: 'תפקיד עודכן בהצלחה'
            })
        } catch (error) {
            console.error('Update role error:', error)
            res.status(500).json({
                success: false,
                message: 'שגיאה בעדכון תפקיד',
                code: 'UPDATE_ROLE_ERROR'
            })
        }
    })
)

// Delete role
router.delete('/rbac/roles/:roleId',
    requirePermission(PERMISSIONS.ANALYTICS_MANAGE),
    asyncHandler(async (req: express.Request, res: express.Response) => {
        try {
            const { roleId } = req.params
            const success = rbacService.deleteRole(roleId)

            if (!success) {
                return res.status(404).json({
                    success: false,
                    message: 'תפקיד לא נמצא או לא ניתן למחוק',
                    code: 'ROLE_NOT_FOUND_OR_SYSTEM'
                })
            }

            res.json({
                success: true,
                message: 'תפקיד נמחק בהצלחה'
            })
        } catch (error) {
            console.error('Delete role error:', error)
            res.status(500).json({
                success: false,
                message: 'שגיאה במחיקת תפקיד',
                code: 'DELETE_ROLE_ERROR'
            })
        }
    })
)

// Assign role to user
router.post('/rbac/users/:userId/roles',
    requirePermission(PERMISSIONS.ANALYTICS_MANAGE),
    asyncHandler(async (req: express.Request, res: express.Response) => {
        try {
            const { userId } = req.params
            const { roleId, expiresAt, conditions } = req.body
            const assignedBy = req.user!.id

            if (!roleId) {
                return res.status(400).json({
                    success: false,
                    message: 'נדרש מזהה תפקיד',
                    code: 'MISSING_ROLE_ID'
                })
            }

            const userRole = rbacService.assignRoleToUser(userId, roleId, assignedBy, expiresAt, conditions)

            res.status(201).json({
                success: true,
                data: userRole,
                message: 'תפקיד הוקצה למשתמש בהצלחה'
            })
        } catch (error) {
            console.error('Assign role to user error:', error)
            res.status(500).json({
                success: false,
                message: 'שגיאה בהקצאת תפקיד למשתמש',
                code: 'ASSIGN_ROLE_TO_USER_ERROR'
            })
        }
    })
)

// Remove role from user
router.delete('/rbac/users/:userId/roles/:roleId',
    requirePermission(PERMISSIONS.ANALYTICS_MANAGE),
    asyncHandler(async (req: express.Request, res: express.Response) => {
        try {
            const { userId, roleId } = req.params
            const success = rbacService.removeRoleFromUser(userId, roleId)

            if (!success) {
                return res.status(404).json({
                    success: false,
                    message: 'תפקיד לא נמצא למשתמש',
                    code: 'USER_ROLE_NOT_FOUND'
                })
            }

            res.json({
                success: true,
                message: 'תפקיד הוסר מהמשתמש בהצלחה'
            })
        } catch (error) {
            console.error('Remove role from user error:', error)
            res.status(500).json({
                success: false,
                message: 'שגיאה בהסרת תפקיד מהמשתמש',
                code: 'REMOVE_ROLE_FROM_USER_ERROR'
            })
        }
    })
)

// Get user roles
router.get('/rbac/users/:userId/roles',
    requirePermission(PERMISSIONS.ANALYTICS_VIEW),
    asyncHandler(async (req: express.Request, res: express.Response) => {
        try {
            const { userId } = req.params
            const userRoles = rbacService.getUserRoles(userId)

            res.json({
                success: true,
                data: userRoles,
                message: 'תפקידי משתמש התקבלו בהצלחה'
            })
        } catch (error) {
            console.error('Get user roles error:', error)
            res.status(500).json({
                success: false,
                message: 'שגיאה בקבלת תפקידי משתמש',
                code: 'GET_USER_ROLES_ERROR'
            })
        }
    })
)

// Get user permissions
router.get('/rbac/users/:userId/permissions',
    requirePermission(PERMISSIONS.ANALYTICS_VIEW),
    asyncHandler(async (req: express.Request, res: express.Response) => {
        try {
            const { userId } = req.params
            const permissions = rbacService.getUserPermissions(userId)

            res.json({
                success: true,
                data: permissions,
                message: 'הרשאות משתמש התקבלו בהצלחה'
            })
        } catch (error) {
            console.error('Get user permissions error:', error)
            res.status(500).json({
                success: false,
                message: 'שגיאה בקבלת הרשאות משתמש',
                code: 'GET_USER_PERMISSIONS_ERROR'
            })
        }
    })
)

// Check user permission
router.post('/rbac/users/:userId/check-permission',
    requirePermission(PERMISSIONS.ANALYTICS_VIEW),
    asyncHandler(async (req: express.Request, res: express.Response) => {
        try {
            const { userId } = req.params
            const { permissionId, resourceId, context } = req.body

            if (!permissionId) {
                return res.status(400).json({
                    success: false,
                    message: 'נדרש מזהה הרשאה',
                    code: 'MISSING_PERMISSION_ID'
                })
            }

            const hasPermission = rbacService.hasPermission(userId, permissionId, resourceId, context)

            res.json({
                success: true,
                data: { hasPermission },
                message: 'בדיקת הרשאה הושלמה'
            })
        } catch (error) {
            console.error('Check user permission error:', error)
            res.status(500).json({
                success: false,
                message: 'שגיאה בבדיקת הרשאה',
                code: 'CHECK_USER_PERMISSION_ERROR'
            })
        }
    })
)

// Check user action
router.post('/rbac/users/:userId/check-action',
    requirePermission(PERMISSIONS.ANALYTICS_VIEW),
    asyncHandler(async (req: express.Request, res: express.Response) => {
        try {
            const { userId } = req.params
            const { action, resource, resourceId, context } = req.body

            if (!action || !resource) {
                return res.status(400).json({
                    success: false,
                    message: 'נדרשים action ו-resource',
                    code: 'MISSING_REQUIRED_PARAMETERS'
                })
            }

            const canPerform = rbacService.canPerformAction(userId, action, resource, resourceId, context)

            res.json({
                success: true,
                data: { canPerform },
                message: 'בדיקת פעולה הושלמה'
            })
        } catch (error) {
            console.error('Check user action error:', error)
            res.status(500).json({
                success: false,
                message: 'שגיאה בבדיקת פעולה',
                code: 'CHECK_USER_ACTION_ERROR'
            })
        }
    })
)

// Evaluate access
router.post('/rbac/evaluate-access',
    requirePermission(PERMISSIONS.ANALYTICS_VIEW),
    asyncHandler(async (req: express.Request, res: express.Response) => {
        try {
            const { userId, action, resource, resourceId, context } = req.body

            if (!userId || !action || !resource) {
                return res.status(400).json({
                    success: false,
                    message: 'נדרשים userId, action ו-resource',
                    code: 'MISSING_REQUIRED_PARAMETERS'
                })
            }

            const decision = rbacService.evaluateAccess(userId, action, resource, resourceId, context)

            res.json({
                success: true,
                data: decision,
                message: 'הערכת גישה הושלמה'
            })
        } catch (error) {
            console.error('Evaluate access error:', error)
            res.status(500).json({
                success: false,
                message: 'שגיאה בהערכת גישה',
                code: 'EVALUATE_ACCESS_ERROR'
            })
        }
    })
)

// Get user access summary
router.get('/rbac/users/:userId/access-summary',
    requirePermission(PERMISSIONS.ANALYTICS_VIEW),
    asyncHandler(async (req: express.Request, res: express.Response) => {
        try {
            const { userId } = req.params
            const summary = rbacService.getUserAccessSummary(userId)

            res.json({
                success: true,
                data: summary,
                message: 'סיכום גישה למשתמש התקבל בהצלחה'
            })
        } catch (error) {
            console.error('Get user access summary error:', error)
            res.status(500).json({
                success: false,
                message: 'שגיאה בקבלת סיכום גישה למשתמש',
                code: 'GET_USER_ACCESS_SUMMARY_ERROR'
            })
        }
    })
)

// Get audit logs
router.get('/rbac/audit-logs',
    requirePermission(PERMISSIONS.ANALYTICS_VIEW),
    asyncHandler(async (req: express.Request, res: express.Response) => {
        try {
            const { userId, action, resource, limit } = req.query
            const logs = rbacService.getAuditLogs(
                userId as string,
                action as string,
                resource as string,
                parseInt(limit as string) || 100
            )

            res.json({
                success: true,
                data: logs,
                message: 'לוגי ביקורת התקבלו בהצלחה'
            })
        } catch (error) {
            console.error('Get audit logs error:', error)
            res.status(500).json({
                success: false,
                message: 'שגיאה בקבלת לוגי ביקורת',
                code: 'GET_AUDIT_LOGS_ERROR'
            })
        }
    })
)

export default router
