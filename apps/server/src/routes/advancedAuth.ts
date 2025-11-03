/**
 * Advanced Authentication Routes
 * Construction Master App - Comprehensive Auth Management API
 */

import express from 'express'
import { rateLimiters } from '../middleware/security'
import { asyncHandler } from '../middleware/errorHandler'
import authService from '../services/authService'
import { authenticateToken, requirePermission, PERMISSIONS } from '../middleware/auth'

const router = express.Router()

// Rate limiting for auth endpoints
router.use(rateLimiters.auth)

// User login
router.post('/login',
    asyncHandler(async (req: express.Request, res: express.Response) => {
        try {
            const { email, password, rememberMe, mfaCode } = req.body
            const ipAddress = req.ip || req.connection.remoteAddress || 'unknown'
            const userAgent = req.get('User-Agent') || 'unknown'

            if (!email || !password) {
                return res.status(400).json({
                    success: false,
                    message: 'נדרשים שדות חובה: email, password',
                    code: 'MISSING_REQUIRED_FIELDS'
                })
            }

            const result = await authService.login(
                { email, password, rememberMe, mfaCode },
                ipAddress,
                userAgent
            )

            if (!result.success) {
                return res.status(401).json({
                    success: false,
                    message: result.message,
                    code: result.code
                })
            }

            res.json({
                success: true,
                data: {
                    user: result.user,
                    tokens: result.tokens
                },
                message: 'התחברות בוצעה בהצלחה'
            })
        } catch (error) {
            console.error('Login error:', error)
            res.status(500).json({
                success: false,
                message: 'שגיאה בהתחברות',
                code: 'LOGIN_ERROR'
            })
        }
    })
)

// User registration
router.post('/register',
    asyncHandler(async (req: express.Request, res: express.Response) => {
        try {
            const { name, email, password, role, company, phone } = req.body

            if (!name || !email || !password) {
                return res.status(400).json({
                    success: false,
                    message: 'נדרשים שדות חובה: name, email, password',
                    code: 'MISSING_REQUIRED_FIELDS'
                })
            }

            const result = await authService.register({
                name,
                email,
                password,
                role,
                company,
                phone
            })

            if (!result.success) {
                return res.status(400).json({
                    success: false,
                    message: result.message,
                    code: result.code
                })
            }

            res.status(201).json({
                success: true,
                message: result.message
            })
        } catch (error) {
            console.error('Registration error:', error)
            res.status(500).json({
                success: false,
                message: 'שגיאה בהרשמה',
                code: 'REGISTRATION_ERROR'
            })
        }
    })
)

// User logout
router.post('/logout',
    authenticateToken,
    asyncHandler(async (req: express.Request, res: express.Response) => {
        try {
            const authHeader = req.headers['authorization']
            const token = authHeader && authHeader.split(' ')[1]

            const result = await authService.logout(token, req.sessionId)

            res.json({
                success: result.success,
                message: result.message
            })
        } catch (error) {
            console.error('Logout error:', error)
            res.status(500).json({
                success: false,
                message: 'שגיאה בהתנתקות',
                code: 'LOGOUT_ERROR'
            })
        }
    })
)

// Refresh access token
router.post('/refresh',
    asyncHandler(async (req: express.Request, res: express.Response) => {
        try {
            const { refreshToken } = req.body

            if (!refreshToken) {
                return res.status(400).json({
                    success: false,
                    message: 'נדרש refresh token',
                    code: 'MISSING_REFRESH_TOKEN'
                })
            }

            const result = await authService.refreshAccessToken(refreshToken)

            if (!result.success) {
                return res.status(401).json({
                    success: false,
                    message: result.message
                })
            }

            res.json({
                success: true,
                data: {
                    accessToken: result.accessToken
                },
                message: 'טוקן חודש בהצלחה'
            })
        } catch (error) {
            console.error('Token refresh error:', error)
            res.status(500).json({
                success: false,
                message: 'שגיאה בחידוש טוקן',
                code: 'TOKEN_REFRESH_ERROR'
            })
        }
    })
)

// Request password reset
router.post('/password-reset/request',
    asyncHandler(async (req: express.Request, res: express.Response) => {
        try {
            const { email } = req.body

            if (!email) {
                return res.status(400).json({
                    success: false,
                    message: 'נדרש שדה email',
                    code: 'MISSING_EMAIL'
                })
            }

            const result = await authService.requestPasswordReset({ email })

            res.json({
                success: result.success,
                message: result.message
            })
        } catch (error) {
            console.error('Password reset request error:', error)
            res.status(500).json({
                success: false,
                message: 'שגיאה בבקשת איפוס סיסמה',
                code: 'PASSWORD_RESET_REQUEST_ERROR'
            })
        }
    })
)

// Confirm password reset
router.post('/password-reset/confirm',
    asyncHandler(async (req: express.Request, res: express.Response) => {
        try {
            const { token, newPassword } = req.body

            if (!token || !newPassword) {
                return res.status(400).json({
                    success: false,
                    message: 'נדרשים שדות חובה: token, newPassword',
                    code: 'MISSING_REQUIRED_FIELDS'
                })
            }

            const result = await authService.confirmPasswordReset({ token, newPassword })

            if (!result.success) {
                return res.status(400).json({
                    success: false,
                    message: result.message
                })
            }

            res.json({
                success: true,
                message: result.message
            })
        } catch (error) {
            console.error('Password reset confirmation error:', error)
            res.status(500).json({
                success: false,
                message: 'שגיאה באיפוס סיסמה',
                code: 'PASSWORD_RESET_CONFIRM_ERROR'
            })
        }
    })
)

// Change password
router.post('/change-password',
    authenticateToken,
    asyncHandler(async (req: express.Request, res: express.Response) => {
        try {
            const { currentPassword, newPassword } = req.body

            if (!currentPassword || !newPassword) {
                return res.status(400).json({
                    success: false,
                    message: 'נדרשים שדות חובה: currentPassword, newPassword',
                    code: 'MISSING_REQUIRED_FIELDS'
                })
            }

            const result = await authService.changePassword(
                req.user!.id,
                currentPassword,
                newPassword
            )

            if (!result.success) {
                return res.status(400).json({
                    success: false,
                    message: result.message
                })
            }

            res.json({
                success: true,
                message: result.message
            })
        } catch (error) {
            console.error('Change password error:', error)
            res.status(500).json({
                success: false,
                message: 'שגיאה בשינוי סיסמה',
                code: 'CHANGE_PASSWORD_ERROR'
            })
        }
    })
)

// Enable MFA
router.post('/mfa/enable',
    authenticateToken,
    asyncHandler(async (req: express.Request, res: express.Response) => {
        try {
            const result = await authService.enableMFA(req.user!.id)

            if (!result.success) {
                return res.status(400).json({
                    success: false,
                    message: result.message
                })
            }

            res.json({
                success: true,
                data: {
                    secret: result.secret,
                    qrCode: result.qrCode
                },
                message: result.message
            })
        } catch (error) {
            console.error('Enable MFA error:', error)
            res.status(500).json({
                success: false,
                message: 'שגיאה בהפעלת אימות דו-שלבי',
                code: 'ENABLE_MFA_ERROR'
            })
        }
    })
)

// Disable MFA
router.post('/mfa/disable',
    authenticateToken,
    asyncHandler(async (req: express.Request, res: express.Response) => {
        try {
            const result = await authService.disableMFA(req.user!.id)

            if (!result.success) {
                return res.status(400).json({
                    success: false,
                    message: result.message
                })
            }

            res.json({
                success: true,
                message: result.message
            })
        } catch (error) {
            console.error('Disable MFA error:', error)
            res.status(500).json({
                success: false,
                message: 'שגיאה בהפסקת אימות דו-שלבי',
                code: 'DISABLE_MFA_ERROR'
            })
        }
    })
)

// Get user sessions
router.get('/sessions',
    authenticateToken,
    asyncHandler(async (req: express.Request, res: express.Response) => {
        try {
            const sessions = await authService.getUserSessions(req.user!.id)

            res.json({
                success: true,
                data: sessions,
                message: 'סשנים התקבלו בהצלחה'
            })
        } catch (error) {
            console.error('Get user sessions error:', error)
            res.status(500).json({
                success: false,
                message: 'שגיאה בקבלת סשנים',
                code: 'GET_SESSIONS_ERROR'
            })
        }
    })
)

// Terminate specific session
router.delete('/sessions/:sessionId',
    authenticateToken,
    asyncHandler(async (req: express.Request, res: express.Response) => {
        try {
            const { sessionId } = req.params

            const result = await authService.terminateSession(req.user!.id, sessionId)

            if (!result.success) {
                return res.status(400).json({
                    success: false,
                    message: result.message
                })
            }

            res.json({
                success: true,
                message: result.message
            })
        } catch (error) {
            console.error('Terminate session error:', error)
            res.status(500).json({
                success: false,
                message: 'שגיאה בהפסקת סשן',
                code: 'TERMINATE_SESSION_ERROR'
            })
        }
    })
)

// Terminate all sessions
router.delete('/sessions',
    authenticateToken,
    asyncHandler(async (req: express.Request, res: express.Response) => {
        try {
            const result = await authService.terminateAllSessions(req.user!.id)

            if (!result.success) {
                return res.status(400).json({
                    success: false,
                    message: result.message
                })
            }

            res.json({
                success: true,
                message: result.message
            })
        } catch (error) {
            console.error('Terminate all sessions error:', error)
            res.status(500).json({
                success: false,
                message: 'שגיאה בהפסקת כל הסשנים',
                code: 'TERMINATE_ALL_SESSIONS_ERROR'
            })
        }
    })
)

// Get current user info
router.get('/me',
    authenticateToken,
    asyncHandler(async (req: express.Request, res: express.Response) => {
        try {
            res.json({
                success: true,
                data: {
                    user: req.user
                },
                message: 'מידע משתמש התקבל בהצלחה'
            })
        } catch (error) {
            console.error('Get user info error:', error)
            res.status(500).json({
                success: false,
                message: 'שגיאה בקבלת מידע משתמש',
                code: 'GET_USER_INFO_ERROR'
            })
        }
    })
)

// Verify token
router.post('/verify-token',
    asyncHandler(async (req: express.Request, res: express.Response) => {
        try {
            const { token } = req.body

            if (!token) {
                return res.status(400).json({
                    success: false,
                    message: 'נדרש token',
                    code: 'MISSING_TOKEN'
                })
            }

            try {
                const { JWTService } = require('../middleware/auth')
                const decoded = JWTService.verifyToken(token)

                res.json({
                    success: true,
                    data: {
                        valid: true,
                        userId: decoded.userId,
                        role: decoded.role
                    },
                    message: 'טוקן תקין'
                })
            } catch (error) {
                res.json({
                    success: true,
                    data: {
                        valid: false
                    },
                    message: 'טוקן לא תקין'
                })
            }
        } catch (error) {
            console.error('Verify token error:', error)
            res.status(500).json({
                success: false,
                message: 'שגיאה בבדיקת טוקן',
                code: 'VERIFY_TOKEN_ERROR'
            })
        }
    })
)

export default router
