/**
 * Advanced Authentication Service
 * Construction Master App - Comprehensive Auth Management
 */

import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import User from '../models/User'
import { JWTService, PasswordService, SessionManager, TokenBlacklist } from '../middleware/auth'
import logger from '../config/logger'

interface LoginCredentials {
    email: string
    password: string
    rememberMe?: boolean
    mfaCode?: string
}

interface LoginResult {
    success: boolean
    user?: any
    tokens?: {
        accessToken: string
        refreshToken: string
    }
    requiresMFA?: boolean
    message?: string
    code?: string
}

interface RegistrationData {
    name: string
    email: string
    password: string
    role?: string
    company?: string
    phone?: string
}

interface PasswordResetRequest {
    email: string
}

interface PasswordResetConfirm {
    token: string
    newPassword: string
}

interface MFAConfig {
    enabled: boolean
    secret?: string
    backupCodes?: string[]
}

class AuthService {
    
    /**
     * User login with comprehensive security
     */
    async login(credentials: LoginCredentials, ipAddress: string, userAgent: string): Promise<LoginResult> {
        try {
            const { email, password, rememberMe, mfaCode } = credentials

            // Find user
            const user = await User.findOne({ email: email.toLowerCase() })
            if (!user) {
                return {
                    success: false,
                    message: 'משתמש לא נמצא',
                    code: 'USER_NOT_FOUND'
                }
            }

            // Check if user is active
            if (!user.isActive) {
                return {
                    success: false,
                    message: 'חשבון המשתמש לא פעיל',
                    code: 'USER_INACTIVE'
                }
            }

            // Check if user is locked
            if (user.isLocked) {
                return {
                    success: false,
                    message: 'חשבון המשתמש נעול',
                    code: 'USER_LOCKED'
                }
            }

            // Verify password
            const isPasswordValid = await PasswordService.comparePassword(password, user.password)
            if (!isPasswordValid) {
                // Increment failed login attempts
                await this.handleFailedLogin(user._id.toString())
                return {
                    success: false,
                    message: 'סיסמה לא נכונה',
                    code: 'INVALID_PASSWORD'
                }
            }

            // Check if MFA is required
            if (user.mfaEnabled && !mfaCode) {
                return {
                    success: false,
                    requiresMFA: true,
                    message: 'נדרש קוד אימות דו-שלבי',
                    code: 'MFA_REQUIRED'
                }
            }

            // Verify MFA code if provided
            if (user.mfaEnabled && mfaCode) {
                const isMFAValid = await this.verifyMFACode(user.mfaSecret, mfaCode)
                if (!isMFAValid) {
                    return {
                        success: false,
                        message: 'קוד אימות דו-שלבי לא נכון',
                        code: 'INVALID_MFA_CODE'
                    }
                }
            }

            // Reset failed login attempts
            await this.resetFailedLoginAttempts(user._id.toString())

            // Create session
            const sessionId = SessionManager.createSession(user._id.toString(), ipAddress, userAgent)

            // Generate tokens
            const tokens = JWTService.generateTokens(
                user._id.toString(),
                user.role,
                sessionId
            )

            // Update user last login
            user.lastLogin = new Date()
            user.loginCount = (user.loginCount || 0) + 1
            await user.save()

            // Log successful login
            logger.info('User login successful', {
                userId: user._id.toString(),
                email: user.email,
                ipAddress,
                userAgent
            })

            return {
                success: true,
                user: {
                    id: user._id.toString(),
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    permissions: this.getUserPermissions(user.role)
                },
                tokens
            }

        } catch (error) {
            logger.error('Login error:', error)
            return {
                success: false,
                message: 'שגיאה בהתחברות',
                code: 'LOGIN_ERROR'
            }
        }
    }

    /**
     * User registration
     */
    async register(data: RegistrationData): Promise<LoginResult> {
        try {
            const { name, email, password, role = 'user', company, phone } = data

            // Check if user already exists
            const existingUser = await User.findOne({ email: email.toLowerCase() })
            if (existingUser) {
                return {
                    success: false,
                    message: 'משתמש עם כתובת אימייל זו כבר קיים',
                    code: 'USER_EXISTS'
                }
            }

            // Validate password strength
            const passwordValidation = PasswordService.validatePasswordStrength(password)
            if (!passwordValidation.isValid) {
                return {
                    success: false,
                    message: 'סיסמה לא עומדת בדרישות',
                    code: 'WEAK_PASSWORD',
                    // In a real implementation, you might want to return the specific errors
                }
            }

            // Hash password
            const hashedPassword = await PasswordService.hashPassword(password)

            // Create user
            const user = new User({
                name,
                email: email.toLowerCase(),
                password: hashedPassword,
                role,
                company,
                phone,
                isActive: true,
                isEmailVerified: false,
                createdAt: new Date()
            })

            await user.save()

            // Generate email verification token
            const verificationToken = crypto.randomBytes(32).toString('hex')
            user.emailVerificationToken = verificationToken
            user.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
            await user.save()

            // Send verification email (this would be implemented in the email service)
            // await emailService.sendVerificationEmail(email, verificationToken)

            logger.info('User registered successfully', {
                userId: user._id.toString(),
                email: user.email,
                role: user.role
            })

            return {
                success: true,
                message: 'הרשמה בוצעה בהצלחה. נא לבדוק את האימייל לאימות החשבון'
            }

        } catch (error) {
            logger.error('Registration error:', error)
            return {
                success: false,
                message: 'שגיאה בהרשמה',
                code: 'REGISTRATION_ERROR'
            }
        }
    }

    /**
     * Logout user
     */
    async logout(token: string, sessionId?: string): Promise<{ success: boolean; message: string }> {
        try {
            // Add token to blacklist
            if (token) {
                TokenBlacklist.addToken(token)
            }

            // Destroy session
            if (sessionId) {
                SessionManager.destroySession(sessionId)
            }

            logger.info('User logout successful', { sessionId })

            return {
                success: true,
                message: 'התנתקות בוצעה בהצלחה'
            }

        } catch (error) {
            logger.error('Logout error:', error)
            return {
                success: false,
                message: 'שגיאה בהתנתקות'
            }
        }
    }

    /**
     * Refresh access token
     */
    async refreshAccessToken(refreshToken: string): Promise<{ success: boolean; accessToken?: string; message?: string }> {
        try {
            const decoded = JWTService.verifyToken(refreshToken)
            const user = await User.findById(decoded.userId)

            if (!user || !user.isActive) {
                return {
                    success: false,
                    message: 'משתמש לא נמצא או לא פעיל'
                }
            }

            // Generate new access token
            const { accessToken } = JWTService.generateTokens(
                user._id.toString(),
                user.role,
                decoded.sessionId
            )

            return {
                success: true,
                accessToken
            }

        } catch (error) {
            logger.error('Token refresh error:', error)
            return {
                success: false,
                message: 'שגיאה בחידוש הטוקן'
            }
        }
    }

    /**
     * Request password reset
     */
    async requestPasswordReset(data: PasswordResetRequest): Promise<{ success: boolean; message: string }> {
        try {
            const { email } = data
            const user = await User.findOne({ email: email.toLowerCase() })

            if (!user) {
                // Don't reveal if user exists or not
                return {
                    success: true,
                    message: 'אם החשבון קיים, נשלח אימייל לאיפוס סיסמה'
                }
            }

            // Generate reset token
            const resetToken = crypto.randomBytes(32).toString('hex')
            user.passwordResetToken = resetToken
            user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000) // 1 hour
            await user.save()

            // Send reset email (this would be implemented in the email service)
            // await emailService.sendPasswordResetEmail(email, resetToken)

            logger.info('Password reset requested', { userId: user._id.toString(), email })

            return {
                success: true,
                message: 'אם החשבון קיים, נשלח אימייל לאיפוס סיסמה'
            }

        } catch (error) {
            logger.error('Password reset request error:', error)
            return {
                success: false,
                message: 'שגיאה בבקשת איפוס סיסמה'
            }
        }
    }

    /**
     * Confirm password reset
     */
    async confirmPasswordReset(data: PasswordResetConfirm): Promise<{ success: boolean; message: string }> {
        try {
            const { token, newPassword } = data

            const user = await User.findOne({
                passwordResetToken: token,
                passwordResetExpires: { $gt: new Date() }
            })

            if (!user) {
                return {
                    success: false,
                    message: 'טוקן איפוס סיסמה לא תקין או פג תוקף'
                }
            }

            // Validate new password
            const passwordValidation = PasswordService.validatePasswordStrength(newPassword)
            if (!passwordValidation.isValid) {
                return {
                    success: false,
                    message: 'סיסמה חדשה לא עומדת בדרישות'
                }
            }

            // Hash new password
            const hashedPassword = await PasswordService.hashPassword(newPassword)
            user.password = hashedPassword
            user.passwordResetToken = undefined
            user.passwordResetExpires = undefined
            await user.save()

            // Invalidate all user sessions
            const userSessions = SessionManager.getUserSessions(user._id.toString())
            for (const session of userSessions) {
                SessionManager.destroySession(session.sessionId)
            }

            logger.info('Password reset successful', { userId: user._id.toString() })

            return {
                success: true,
                message: 'סיסמה עודכנה בהצלחה'
            }

        } catch (error) {
            logger.error('Password reset confirmation error:', error)
            return {
                success: false,
                message: 'שגיאה באיפוס סיסמה'
            }
        }
    }

    /**
     * Enable MFA for user
     */
    async enableMFA(userId: string): Promise<{ success: boolean; secret?: string; qrCode?: string; message?: string }> {
        try {
            const user = await User.findById(userId)
            if (!user) {
                return {
                    success: false,
                    message: 'משתמש לא נמצא'
                }
            }

            // Generate MFA secret
            const secret = crypto.randomBytes(20).toString('base32')
            user.mfaSecret = secret
            user.mfaEnabled = true
            await user.save()

            // Generate QR code data
            const qrCodeData = `otpauth://totp/ConstructionMaster:${user.email}?secret=${secret}&issuer=ConstructionMaster`

            logger.info('MFA enabled for user', { userId })

            return {
                success: true,
                secret,
                qrCode: qrCodeData,
                message: 'אימות דו-שלבי הופעל בהצלחה'
            }

        } catch (error) {
            logger.error('MFA enable error:', error)
            return {
                success: false,
                message: 'שגיאה בהפעלת אימות דו-שלבי'
            }
        }
    }

    /**
     * Disable MFA for user
     */
    async disableMFA(userId: string): Promise<{ success: boolean; message: string }> {
        try {
            const user = await User.findById(userId)
            if (!user) {
                return {
                    success: false,
                    message: 'משתמש לא נמצא'
                }
            }

            user.mfaEnabled = false
            user.mfaSecret = undefined
            await user.save()

            logger.info('MFA disabled for user', { userId })

            return {
                success: true,
                message: 'אימות דו-שלבי הופסק בהצלחה'
            }

        } catch (error) {
            logger.error('MFA disable error:', error)
            return {
                success: false,
                message: 'שגיאה בהפסקת אימות דו-שלבי'
            }
        }
    }

    /**
     * Get user sessions
     */
    async getUserSessions(userId: string): Promise<Array<{
        sessionId: string
        createdAt: Date
        lastActivity: Date
        ipAddress: string
        userAgent: string
    }>> {
        try {
            return SessionManager.getUserSessions(userId)
        } catch (error) {
            logger.error('Get user sessions error:', error)
            return []
        }
    }

    /**
     * Terminate user session
     */
    async terminateSession(userId: string, sessionId: string): Promise<{ success: boolean; message: string }> {
        try {
            const userSessions = SessionManager.getUserSessions(userId)
            const session = userSessions.find(s => s.sessionId === sessionId)

            if (!session) {
                return {
                    success: false,
                    message: 'סשן לא נמצא'
                }
            }

            SessionManager.destroySession(sessionId)

            logger.info('User session terminated', { userId, sessionId })

            return {
                success: true,
                message: 'סשן הופסק בהצלחה'
            }

        } catch (error) {
            logger.error('Terminate session error:', error)
            return {
                success: false,
                message: 'שגיאה בהפסקת סשן'
            }
        }
    }

    /**
     * Terminate all user sessions
     */
    async terminateAllSessions(userId: string): Promise<{ success: boolean; message: string }> {
        try {
            const userSessions = SessionManager.getUserSessions(userId)
            
            for (const session of userSessions) {
                SessionManager.destroySession(session.sessionId)
            }

            logger.info('All user sessions terminated', { userId })

            return {
                success: true,
                message: 'כל הסשנים הופסקו בהצלחה'
            }

        } catch (error) {
            logger.error('Terminate all sessions error:', error)
            return {
                success: false,
                message: 'שגיאה בהפסקת כל הסשנים'
            }
        }
    }

    /**
     * Change user password
     */
    async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<{ success: boolean; message: string }> {
        try {
            const user = await User.findById(userId)
            if (!user) {
                return {
                    success: false,
                    message: 'משתמש לא נמצא'
                }
            }

            // Verify current password
            const isCurrentPasswordValid = await PasswordService.comparePassword(currentPassword, user.password)
            if (!isCurrentPasswordValid) {
                return {
                    success: false,
                    message: 'סיסמה נוכחית לא נכונה'
                }
            }

            // Validate new password
            const passwordValidation = PasswordService.validatePasswordStrength(newPassword)
            if (!passwordValidation.isValid) {
                return {
                    success: false,
                    message: 'סיסמה חדשה לא עומדת בדרישות'
                }
            }

            // Hash new password
            const hashedPassword = await PasswordService.hashPassword(newPassword)
            user.password = hashedPassword
            await user.save()

            logger.info('Password changed successfully', { userId })

            return {
                success: true,
                message: 'סיסמה עודכנה בהצלחה'
            }

        } catch (error) {
            logger.error('Change password error:', error)
            return {
                success: false,
                message: 'שגיאה בשינוי סיסמה'
            }
        }
    }

    // Helper methods
    private async handleFailedLogin(userId: string): Promise<void> {
        try {
            const user = await User.findById(userId)
            if (!user) return

            user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1
            user.lastFailedLogin = new Date()

            // Lock account after 5 failed attempts
            if (user.failedLoginAttempts >= 5) {
                user.isLocked = true
                user.lockedUntil = new Date(Date.now() + 30 * 60 * 1000) // 30 minutes
            }

            await user.save()
        } catch (error) {
            logger.error('Handle failed login error:', error)
        }
    }

    private async resetFailedLoginAttempts(userId: string): Promise<void> {
        try {
            const user = await User.findById(userId)
            if (!user) return

            user.failedLoginAttempts = 0
            user.lastFailedLogin = undefined
            user.isLocked = false
            user.lockedUntil = undefined
            await user.save()
        } catch (error) {
            logger.error('Reset failed login attempts error:', error)
        }
    }

    private async verifyMFACode(secret: string, code: string): Promise<boolean> {
        // This would implement TOTP verification
        // For now, return true for demonstration
        return true
    }

    private getUserPermissions(role: string): string[] {
        const rolePermissions: Record<string, string[]> = {
            admin: ['*'],
            project_manager: ['project:*', 'sheet:*', 'file:*', 'analytics:*'],
            architect: ['project:view', 'sheet:*', 'file:*', 'analytics:view'],
            engineer: ['project:view', 'sheet:view', 'sheet:update', 'file:*'],
            contractor: ['project:view', 'sheet:view', 'file:upload', 'file:download'],
            viewer: ['project:view', 'sheet:view', 'file:download']
        }

        return rolePermissions[role] || []
    }
}

export default new AuthService()
