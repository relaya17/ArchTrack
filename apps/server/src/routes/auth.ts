/**
 * Authentication Routes
 * Construction Master App - Advanced Auth System
 */

import express from 'express'
import User from '../models/User'
import { authenticateToken, JWTService, PasswordService } from '../middleware/auth'
import { validate, authSchemas } from '../middleware/validation'
import { rateLimiters } from '../middleware/security'
import { z } from 'zod'
import emailService from '../services/emailService'

const router = express.Router()

// Rate limiting for auth routes
router.use(rateLimiters.auth)

// התחברות
router.post('/login', validate(authSchemas.login), async (req, res) => {
    try {
        const { email, password, rememberMe } = req.body

        // חיפוש משתמש
        const user = await User.findOne({ email }).select('+password')
        if (!user || !user.isActive) {
            return res.status(401).json({
                success: false,
                message: 'כתובת אימייל או סיסמה לא נכונים',
                code: 'INVALID_CREDENTIALS'
            })
        }

        // בדיקת סיסמה
        const isPasswordValid = await PasswordService.comparePassword(password, user.password)
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'כתובת אימייל או סיסמה לא נכונים',
                code: 'INVALID_CREDENTIALS'
            })
        }

        // יצירת session ID
        const sessionId = require('crypto').randomUUID()

        // יצירת tokens
        const { accessToken, refreshToken } = JWTService.generateTokens(
            user._id.toString(),
            user.role,
            sessionId
        )

        // עדכון זמן התחברות אחרון
        user.lastLogin = new Date()
        await user.save()

        // Set secure cookies in production
        if (process.env.NODE_ENV === 'production') {
            res.cookie('refreshToken', refreshToken, {
                httpOnly: true,
                secure: true,
                sameSite: 'strict',
                maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
            })
        }

        res.json({
            success: true,
            data: {
                user: {
                    id: user._id,
                    email: user.email,
                    name: user.name,
                    role: user.role,
                    avatar: user.avatar,
                    lastLogin: user.lastLogin
                },
                accessToken,
                refreshToken: process.env.NODE_ENV === 'production' ? undefined : refreshToken,
                expiresIn: 15 * 60 // 15 minutes
            },
            message: 'התחברת בהצלחה'
        })
    } catch (error) {
        console.error('Login error:', error)
        res.status(500).json({
            success: false,
            message: 'שגיאת שרת',
            code: 'LOGIN_ERROR'
        })
    }
})

// רישום משתמש חדש
router.post('/register', rateLimiters.registration, validate(authSchemas.register), async (req, res) => {
    try {
        const { email, password, name, phone, role = 'viewer' } = req.body

        // בדיקה אם המשתמש כבר קיים
        const existingUser = await User.findOne({ email })
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'משתמש עם כתובת אימייל זו כבר קיים',
                code: 'USER_ALREADY_EXISTS'
            })
        }

        // בדיקת חוזק סיסמה
        const passwordValidation = PasswordService.validatePasswordStrength(password)
        if (!passwordValidation.isValid) {
            return res.status(400).json({
                success: false,
                message: 'סיסמה לא עומדת בדרישות',
                errors: passwordValidation.errors,
                code: 'WEAK_PASSWORD'
            })
        }

        // הצפנת סיסמה
        const hashedPassword = await PasswordService.hashPassword(password)

        // יצירת משתמש חדש
        const user = new User({
            email,
            password: hashedPassword,
            name,
            phone,
            role
        })

        await user.save()

        // שליחת אימייל אימות (אם מוגדר)
        if (process.env.SMTP_HOST && process.env.SMTP_USER) {
            try {
                await sendVerificationEmail(user.email, user._id.toString())
            } catch (emailError) {
                console.warn('Failed to send verification email:', emailError)
                // Don't fail registration if email fails
            }
        }

        res.status(201).json({
            success: true,
            data: {
                user: {
                    id: user._id,
                    email: user.email,
                    name: user.name,
                    role: user.role
                }
            },
            message: 'משתמש נוצר בהצלחה'
        })
    } catch (error) {
        console.error('Register error:', error)
        res.status(500).json({
            success: false,
            message: 'שגיאת שרת',
            code: 'REGISTER_ERROR'
        })
    }
})

// קבלת פרטי משתמש נוכחי
router.get('/me', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user!.id).select('-password')

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'משתמש לא נמצא',
                code: 'USER_NOT_FOUND'
            })
        }

        res.json({
            success: true,
            data: {
                user: {
                    id: user._id,
                    email: user.email,
                    name: user.name,
                    role: user.role,
                    phone: user.phone,
                    avatar: user.avatar,
                    isActive: user.isActive,
                    lastLogin: user.lastLogin,
                    createdAt: user.createdAt,
                    updatedAt: user.updatedAt
                }
            }
        })
    } catch (error) {
        console.error('Get user error:', error)
        res.status(500).json({
            success: false,
            message: 'שגיאת שרת',
            code: 'GET_USER_ERROR'
        })
    }
})

// רענון token
router.post('/refresh', validate(authSchemas.refreshToken), async (req, res) => {
    try {
        const { refreshToken } = req.body

        const decoded = JWTService.verifyToken(refreshToken)

        const user = await User.findById(decoded.userId).select('-password')
        if (!user || !user.isActive) {
            return res.status(401).json({
                success: false,
                message: 'משתמש לא נמצא או לא פעיל',
                code: 'USER_NOT_FOUND'
            })
        }

        // יצירת tokens חדשים
        const { accessToken, refreshToken: newRefreshToken } = JWTService.generateTokens(
            user._id.toString(),
            user.role,
            decoded.sessionId
        )

        res.json({
            success: true,
            data: {
                accessToken,
                refreshToken: process.env.NODE_ENV === 'production' ? undefined : newRefreshToken,
                expiresIn: 15 * 60 // 15 minutes
            },
            message: 'Token רוענן בהצלחה'
        })
    } catch (error) {
        if (error instanceof Error && error.name === 'JsonWebTokenError') {
            return res.status(403).json({
                success: false,
                message: 'Refresh token לא תקין',
                code: 'INVALID_REFRESH_TOKEN'
            })
        }

        console.error('Refresh token error:', error)
        res.status(500).json({
            success: false,
            message: 'שגיאת שרת',
            code: 'REFRESH_TOKEN_ERROR'
        })
    }
})

// התנתקות
router.post('/logout', authenticateToken, async (req, res) => {
    try {
        // כאן אפשר להוסיף לוגיקה למחיקת refresh token ממסד הנתונים
        // או הוספה לרשימה שחורה

        // Clear refresh token cookie
        if (process.env.NODE_ENV === 'production') {
            res.clearCookie('refreshToken')
        }

        res.json({
            success: true,
            message: 'התנתקת בהצלחה'
        })
    } catch (error) {
        console.error('Logout error:', error)
        res.status(500).json({
            success: false,
            message: 'שגיאת שרת',
            code: 'LOGOUT_ERROR'
        })
    }
})

// שינוי סיסמה
router.post('/change-password', authenticateToken, validate(authSchemas.changePassword), async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body

        const user = await User.findById(req.user!.id).select('+password')
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'משתמש לא נמצא',
                code: 'USER_NOT_FOUND'
            })
        }

        // בדיקת סיסמה נוכחית
        const isCurrentPasswordValid = await PasswordService.comparePassword(currentPassword, user.password)
        if (!isCurrentPasswordValid) {
            return res.status(400).json({
                success: false,
                message: 'סיסמה נוכחית לא נכונה',
                code: 'INVALID_CURRENT_PASSWORD'
            })
        }

        // בדיקת חוזק סיסמה חדשה
        const passwordValidation = PasswordService.validatePasswordStrength(newPassword)
        if (!passwordValidation.isValid) {
            return res.status(400).json({
                success: false,
                message: 'סיסמה לא עומדת בדרישות',
                errors: passwordValidation.errors,
                code: 'WEAK_PASSWORD'
            })
        }

        // הצפנת סיסמה חדשה
        const hashedNewPassword = await PasswordService.hashPassword(newPassword)
        user.password = hashedNewPassword
        await user.save()

        res.json({
            success: true,
            message: 'סיסמה שונתה בהצלחה'
        })
    } catch (error) {
        console.error('Change password error:', error)
        res.status(500).json({
            success: false,
            message: 'שגיאת שרת',
            code: 'CHANGE_PASSWORD_ERROR'
        })
    }
})

// שכחת סיסמה
router.post('/forgot-password', rateLimiters.passwordReset, validate(authSchemas.forgotPassword), async (req, res) => {
    try {
        const { email } = req.body

        const user = await User.findOne({ email })
        if (!user) {
            // Don't reveal if user exists or not
            return res.json({
                success: true,
                message: 'אם כתובת האימייל קיימת במערכת, נשלח אליה קישור לאיפוס סיסמה'
            })
        }

        // יצירת reset token
        const resetToken = require('crypto').randomBytes(32).toString('hex')
        const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

        // שמירת reset token במסד הנתונים
        user.resetPasswordToken = resetToken
        user.resetPasswordExpiry = resetTokenExpiry
        await user.save()

        // שליחת אימייל איפוס סיסמה
        if (process.env.SMTP_HOST && process.env.SMTP_USER) {
            try {
                await sendPasswordResetEmail(user.email, resetToken)
            } catch (emailError) {
                console.warn('Failed to send password reset email:', emailError)
                // Don't fail the request if email fails
            }
        }

        res.json({
            success: true,
            message: 'אם כתובת האימייל קיימת במערכת, נשלח אליה קישור לאיפוס סיסמה'
        })
    } catch (error) {
        console.error('Forgot password error:', error)
        res.status(500).json({
            success: false,
            message: 'שגיאת שרת',
            code: 'FORGOT_PASSWORD_ERROR'
        })
    }
})

// איפוס סיסמה
router.post('/reset-password', rateLimiters.passwordReset, validate(authSchemas.resetPassword), async (req, res) => {
    try {
        const { token, password } = req.body

        const user = await User.findOne({
            resetPasswordToken: token,
            resetPasswordExpiry: { $gt: new Date() }
        })

        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'Token לא תקין או פג תוקף',
                code: 'INVALID_RESET_TOKEN'
            })
        }

        // בדיקת חוזק סיסמה
        const passwordValidation = PasswordService.validatePasswordStrength(password)
        if (!passwordValidation.isValid) {
            return res.status(400).json({
                success: false,
                message: 'סיסמה לא עומדת בדרישות',
                errors: passwordValidation.errors,
                code: 'WEAK_PASSWORD'
            })
        }

        // הצפנת סיסמה חדשה
        const hashedPassword = await PasswordService.hashPassword(password)
        user.password = hashedPassword
        user.resetPasswordToken = undefined
        user.resetPasswordExpiry = undefined
        await user.save()

        res.json({
            success: true,
            message: 'סיסמה אופסה בהצלחה'
        })
    } catch (error) {
        console.error('Reset password error:', error)
        res.status(500).json({
            success: false,
            message: 'שגיאת שרת',
            code: 'RESET_PASSWORD_ERROR'
        })
    }
})

// בדיקת זמינות אימייל
router.get('/check-email/:email', async (req, res) => {
    try {
        const { email } = req.params

        const user = await User.findOne({ email })

        res.json({
            success: true,
            data: {
                available: !user,
                email
            }
        })
    } catch (error) {
        console.error('Check email error:', error)
        res.status(500).json({
            success: false,
            message: 'שגיאת שרת',
            code: 'CHECK_EMAIL_ERROR'
        })
    }
})

// עדכון פרופיל
router.put('/profile', authenticateToken, validate(authSchemas.updateProfile), async (req, res) => {
    try {
        const { name, phone, avatar } = req.body

        const user = await User.findById(req.user!.id)
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'משתמש לא נמצא',
                code: 'USER_NOT_FOUND'
            })
        }

        // עדכון שדות
        if (name) user.name = name
        if (phone !== undefined) user.phone = phone
        if (avatar !== undefined) user.avatar = avatar

        await user.save()

        res.json({
            success: true,
            data: {
                user: {
                    id: user._id,
                    email: user.email,
                    name: user.name,
                    role: user.role,
                    phone: user.phone,
                    avatar: user.avatar
                }
            },
            message: 'פרופיל עודכן בהצלחה'
        })
    } catch (error) {
        console.error('Update profile error:', error)
        res.status(500).json({
            success: false,
            message: 'שגיאת שרת',
            code: 'UPDATE_PROFILE_ERROR'
        })
    }
})

/**
 * Send verification email to user
 */
async function sendVerificationEmail(email: string, userId: string): Promise<void> {
    const crypto = require('crypto')
    const verificationToken = crypto.randomBytes(32).toString('hex')
    const verificationUrl = `${process.env.CLIENT_URL}/verify-email?token=${verificationToken}&userId=${userId}`
    
    // Store verification token in database
    await User.findByIdAndUpdate(userId, { 
        emailVerificationToken: verificationToken,
        emailVerificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    })

    // Send email using email service
    try {
        const success = await emailService.sendVerificationEmail(email, verificationToken)
        if (success) {
            console.log(`Verification email sent successfully to ${email}`)
        } else {
            console.log(`Failed to send verification email to ${email} - check email service configuration`)
        }
    } catch (error) {
        console.error('Error sending verification email:', error)
    }
}

/**
 * Send password reset email to user
 */
async function sendPasswordResetEmail(email: string, resetToken: string): Promise<void> {
    const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`
    
    // Send email using email service
    try {
        const success = await emailService.sendPasswordResetEmail(email, resetToken)
        if (success) {
            console.log(`Password reset email sent successfully to ${email}`)
        } else {
            console.log(`Failed to send password reset email to ${email} - check email service configuration`)
        }
    } catch (error) {
        console.error('Error sending password reset email:', error)
    }
}

export default router
