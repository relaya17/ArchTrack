/**
 * Authentication & Authorization Middleware
 * Construction Master App - Advanced Security
 */

import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import User from '../models/User'
import { z } from 'zod'

// הרחבת Request interface
declare global {
    namespace Express {
        interface Request {
            user?: {
                id: string
                email: string
                role: string
                name: string
                permissions: string[]
            }
            sessionId?: string
        }
    }
}

// JWT Payload interface
interface JWTPayload {
    userId: string
    sessionId?: string
    role: string
    iat?: number
    exp?: number
}

// Permission system
export const PERMISSIONS = {
    // Project permissions
    PROJECT_VIEW: 'project:view',
    PROJECT_CREATE: 'project:create',
    PROJECT_UPDATE: 'project:update',
    PROJECT_DELETE: 'project:delete',

    // Sheet permissions
    SHEET_VIEW: 'sheet:view',
    SHEET_CREATE: 'sheet:create',
    SHEET_UPDATE: 'sheet:update',
    SHEET_DELETE: 'sheet:delete',

    // File permissions
    FILE_UPLOAD: 'file:upload',
    FILE_DOWNLOAD: 'file:download',
    FILE_UPDATE: 'file:update',
    FILE_DELETE: 'file:delete',

    // User management
    USER_MANAGE: 'user:manage',
    USER_VIEW: 'user:view',

    // AI permissions
    AI_CHAT: 'ai:chat',
    AI_ANALYZE: 'ai:analyze',

    // Analytics
    ANALYTICS_VIEW: 'analytics:view',
    ANALYTICS_EXPORT: 'analytics:export'
} as const

// Role permissions mapping
export const ROLE_PERMISSIONS: Record<string, string[]> = {
    admin: Object.values(PERMISSIONS),
    project_manager: [
        PERMISSIONS.PROJECT_VIEW,
        PERMISSIONS.PROJECT_CREATE,
        PERMISSIONS.PROJECT_UPDATE,
        PERMISSIONS.SHEET_VIEW,
        PERMISSIONS.SHEET_CREATE,
        PERMISSIONS.SHEET_UPDATE,
        PERMISSIONS.FILE_UPLOAD,
        PERMISSIONS.FILE_DOWNLOAD,
        PERMISSIONS.FILE_UPDATE,
        PERMISSIONS.AI_CHAT,
        PERMISSIONS.AI_ANALYZE,
        PERMISSIONS.ANALYTICS_VIEW,
        PERMISSIONS.ANALYTICS_EXPORT
    ],
    architect: [
        PERMISSIONS.PROJECT_VIEW,
        PERMISSIONS.SHEET_VIEW,
        PERMISSIONS.SHEET_CREATE,
        PERMISSIONS.SHEET_UPDATE,
        PERMISSIONS.FILE_UPLOAD,
        PERMISSIONS.FILE_DOWNLOAD,
        PERMISSIONS.AI_CHAT,
        PERMISSIONS.ANALYTICS_VIEW
    ],
    engineer: [
        PERMISSIONS.PROJECT_VIEW,
        PERMISSIONS.SHEET_VIEW,
        PERMISSIONS.SHEET_UPDATE,
        PERMISSIONS.FILE_UPLOAD,
        PERMISSIONS.FILE_DOWNLOAD,
        PERMISSIONS.AI_CHAT,
        PERMISSIONS.ANALYTICS_VIEW
    ],
    contractor: [
        PERMISSIONS.PROJECT_VIEW,
        PERMISSIONS.SHEET_VIEW,
        PERMISSIONS.FILE_UPLOAD,
        PERMISSIONS.FILE_DOWNLOAD,
        PERMISSIONS.AI_CHAT
    ],
    viewer: [
        PERMISSIONS.PROJECT_VIEW,
        PERMISSIONS.SHEET_VIEW,
        PERMISSIONS.FILE_DOWNLOAD,
        PERMISSIONS.AI_CHAT,
        PERMISSIONS.ANALYTICS_VIEW
    ]
}

// JWT utility functions
export class JWTService {
    private static readonly ACCESS_TOKEN_EXPIRY = '15m'
    private static readonly REFRESH_TOKEN_EXPIRY = '7d'

    static generateTokens(userId: string, role: string, sessionId?: string) {
        const jwtSecret = process.env.JWT_SECRET
        if (!jwtSecret) {
            throw new Error('JWT_SECRET not configured')
        }

        const payload: JWTPayload = {
            userId,
            role,
            sessionId
        }

        const accessToken = jwt.sign(payload, jwtSecret, {
            expiresIn: this.ACCESS_TOKEN_EXPIRY
        })

        const refreshToken = jwt.sign(payload, jwtSecret, {
            expiresIn: this.REFRESH_TOKEN_EXPIRY
        })

        return { accessToken, refreshToken }
    }

    static verifyToken(token: string): JWTPayload {
        const jwtSecret = process.env.JWT_SECRET
        if (!jwtSecret) {
            throw new Error('JWT_SECRET not configured')
        }

        return jwt.verify(token, jwtSecret) as JWTPayload
    }

    static decodeToken(token: string): JWTPayload | null {
        try {
            return jwt.decode(token) as JWTPayload
        } catch {
            return null
        }
    }
}

// Password utility functions
export class PasswordService {
    static async hashPassword(password: string): Promise<string> {
        const saltRounds = 12
        return bcrypt.hash(password, saltRounds)
    }

    static async comparePassword(password: string, hashedPassword: string): Promise<boolean> {
        return bcrypt.compare(password, hashedPassword)
    }

    static validatePasswordStrength(password: string): { isValid: boolean; errors: string[] } {
        const errors: string[] = []

        if (password.length < 8) {
            errors.push('סיסמה חייבת להכיל לפחות 8 תווים')
        }

        if (!/[A-Z]/.test(password)) {
            errors.push('סיסמה חייבת להכיל לפחות אות גדולה אחת')
        }

        if (!/[a-z]/.test(password)) {
            errors.push('סיסמה חייבת להכיל לפחות אות קטנה אחת')
        }

        if (!/\d/.test(password)) {
            errors.push('סיסמה חייבת להכיל לפחות מספר אחד')
        }

        if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
            errors.push('סיסמה חייבת להכיל לפחות תו מיוחד אחד')
        }

        return {
            isValid: errors.length === 0,
            errors
        }
    }
}

// Main authentication middleware
export const authenticateToken = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const authHeader = req.headers['authorization']
        const token = authHeader && authHeader.split(' ')[1]

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'נדרש token לאימות',
                code: 'MISSING_TOKEN'
            })
        }

        const decoded = JWTService.verifyToken(token)

        // בדיקה אם המשתמש קיים ופעיל
        const user = await User.findById(decoded.userId).select('-password')
        if (!user || !user.isActive) {
            return res.status(401).json({
                success: false,
                message: 'משתמש לא נמצא או לא פעיל',
                code: 'USER_NOT_FOUND'
            })
        }

        // עדכון זמן התחברות אחרון (אם לא נעשה לאחרונה)
        const now = new Date()
        if (!user.lastLogin || (now.getTime() - user.lastLogin.getTime()) > 300000) { // 5 minutes
            user.lastLogin = now
            await user.save()
        }

        req.user = {
            id: user._id.toString(),
            email: user.email,
            role: user.role,
            name: user.name,
            permissions: ROLE_PERMISSIONS[user.role] || []
        }

        req.sessionId = decoded.sessionId

        next()
    } catch (error) {
        if (error instanceof jwt.JsonWebTokenError) {
            return res.status(403).json({
                success: false,
                message: 'Token לא תקין או פג תוקף',
                code: 'INVALID_TOKEN'
            })
        }

        if (error instanceof jwt.TokenExpiredError) {
            return res.status(403).json({
                success: false,
                message: 'Token פג תוקף',
                code: 'TOKEN_EXPIRED'
            })
        }

        console.error('Authentication error:', error)
        return res.status(500).json({
            success: false,
            message: 'שגיאת אימות',
            code: 'AUTH_ERROR'
        })
    }
}

// Permission-based authorization middleware
export const requirePermission = (permission: string) => {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'נדרש אימות',
                code: 'AUTHENTICATION_REQUIRED'
            })
        }

        if (!req.user.permissions.includes(permission)) {
            return res.status(403).json({
                success: false,
                message: `אין הרשאה לבצע פעולה זו. נדרשת הרשאת: ${permission}`,
                code: 'INSUFFICIENT_PERMISSIONS'
            })
        }

        next()
    }
}

// Role-based authorization middleware
export const requireRole = (...roles: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'נדרש אימות',
                code: 'AUTHENTICATION_REQUIRED'
            })
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: `אין הרשאה לגשת למשאב זה. נדרש תפקיד: ${roles.join(' או ')}`,
                code: 'INSUFFICIENT_ROLE'
            })
        }

        next()
    }
}

// Resource ownership middleware
export const requireOwnership = (resourceField: string = 'ownerId') => {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'נדרש אימות',
                code: 'AUTHENTICATION_REQUIRED'
            })
        }

        // Admins יכולים לגשת לכל דבר
        if (req.user.role === 'admin') {
            return next()
        }

        const resourceOwnerId = req.params[resourceField] || req.body[resourceField]

        if (resourceOwnerId && resourceOwnerId !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'אין הרשאה לגשת למשאב זה',
                code: 'RESOURCE_ACCESS_DENIED'
            })
        }

        next()
    }
}

// Optional authentication (doesn't fail if no token)
export const optionalAuth = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const authHeader = req.headers['authorization']
        const token = authHeader && authHeader.split(' ')[1]

        if (token) {
            const decoded = JWTService.verifyToken(token)
            const user = await User.findById(decoded.userId).select('-password')

            if (user && user.isActive) {
                req.user = {
                    id: user._id.toString(),
                    email: user.email,
                    role: user.role,
                    name: user.name,
                    permissions: ROLE_PERMISSIONS[user.role] || []
                }
                req.sessionId = decoded.sessionId
            }
        }

        next()
    } catch (error) {
        // Continue without authentication
        next()
    }
}

// Session validation middleware
export const validateSession = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!req.user || !req.sessionId) {
            return next()
        }

        // כאן אפשר להוסיף בדיקת session במסד הנתונים
        // כרגע נסתמך על JWT expiration

        next()
    } catch (error) {
        console.error('Session validation error:', error)
        next()
    }
}

// Security headers middleware
export const securityHeaders = (req: Request, res: Response, next: NextFunction) => {
    // Remove X-Powered-By header
    res.removeHeader('X-Powered-By')

    // Add security headers
    res.setHeader('X-Content-Type-Options', 'nosniff')
    res.setHeader('X-Frame-Options', 'DENY')
    res.setHeader('X-XSS-Protection', '1; mode=block')
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')

    // Add HSTS header in production
    if (process.env.NODE_ENV === 'production') {
        res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
    }

    next()
}

// Request logging middleware
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
    const start = Date.now()
    const originalSend = res.send

    res.send = function (data) {
        const duration = Date.now() - start
        console.log(`${req.method} ${req.path} - ${res.statusCode} - ${duration}ms - ${req.user?.email || 'anonymous'}`)
        return originalSend.call(this, data)
    }

    next()
}