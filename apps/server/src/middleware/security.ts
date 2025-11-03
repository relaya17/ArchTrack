/**
 * Advanced Security Middleware
 * Construction Master App - Security & Rate Limiting
 */

import rateLimit from 'express-rate-limit'
import slowDown from 'express-slow-down'
import { Request, Response, NextFunction } from 'express'
import crypto from 'crypto'
import { z } from 'zod'

// Advanced rate limiting with different strategies
export const createRateLimit = (options: {
    windowMs: number
    max: number
    message?: string
    keyGenerator?: (req: Request) => string
    skipSuccessfulRequests?: boolean
    skipFailedRequests?: boolean
}) => {
    return rateLimit({
        windowMs: options.windowMs,
        max: options.max,
        message: {
            success: false,
            message: options.message || 'יותר מדי בקשות, נסה שוב מאוחר יותר',
            code: 'RATE_LIMIT_EXCEEDED'
        },
        keyGenerator: options.keyGenerator || ((req) => {
            // Use IP + User ID for authenticated requests
            const userId = req.user?.id || ''
            return `${req.ip}:${userId}`
        }),
        skipSuccessfulRequests: options.skipSuccessfulRequests || false,
        skipFailedRequests: options.skipFailedRequests || false,
        standardHeaders: true,
        legacyHeaders: false,
        // Custom handler for rate limit exceeded
        handler: (req: Request, res: Response) => {
            const retryAfter = Math.round(options.windowMs / 1000)
            res.set('Retry-After', retryAfter.toString())
            res.status(429).json({
                success: false,
                message: options.message || 'יותר מדי בקשות, נסה שוב מאוחר יותר',
                code: 'RATE_LIMIT_EXCEEDED',
                retryAfter
            })
        }
    })
}

// Speed limiting (gradual slowdown)
export const createSpeedLimit = (options: {
    windowMs: number
    delayAfter: number
    delayMs: number
    maxDelayMs: number
}) => {
    return slowDown({
        windowMs: options.windowMs,
        delayAfter: options.delayAfter,
        delayMs: options.delayMs,
        maxDelayMs: options.maxDelayMs,
        keyGenerator: (req) => {
            const userId = req.user?.id || ''
            return `${req.ip}:${userId}`
        }
    })
}

// Predefined rate limiters
export const rateLimiters = {
    // General API rate limit
    general: createRateLimit({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100, // 100 requests per window
        message: 'יותר מדי בקשות API, נסה שוב מאוחר יותר'
    }),

    // Strict rate limit for authentication
    auth: createRateLimit({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 5, // 5 login attempts per window
        message: 'יותר מדי ניסיונות התחברות, נסה שוב מאוחר יותר',
        keyGenerator: (req) => req.ip || 'unknown', // Only by IP for auth
        skipSuccessfulRequests: true
    }),

    // Password reset rate limit
    passwordReset: createRateLimit({
        windowMs: 60 * 60 * 1000, // 1 hour
        max: 3, // 3 password reset attempts per hour
        message: 'יותר מדי ניסיונות איפוס סיסמה, נסה שוב מאוחר יותר'
    }),

    // File upload rate limit
    upload: createRateLimit({
        windowMs: 60 * 60 * 1000, // 1 hour
        max: 20, // 20 uploads per hour
        message: 'יותר מדי העלאות קבצים, נסה שוב מאוחר יותר'
    }),

    // AI rate limit
    ai: createRateLimit({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 20, // 20 AI requests per window
        message: 'יותר מדי בקשות AI, נסה שוב מאוחר יותר'
    }),

    // Search rate limit
    search: createRateLimit({
        windowMs: 1 * 60 * 1000, // 1 minute
        max: 20, // 20 searches per minute
        message: 'יותר מדי חיפושים, נסה שוב מאוחר יותר'
    }),

    // Analytics rate limit
    analytics: createRateLimit({
        windowMs: 5 * 60 * 1000, // 5 minutes
        max: 10, // 10 analytics requests per 5 minutes
        message: 'יותר מדי בקשות אנליטיקה, נסה שוב מאוחר יותר'
    }),

    // Registration rate limit
    registration: createRateLimit({
        windowMs: 60 * 60 * 1000, // 1 hour
        max: 3, // 3 registrations per hour per IP
        message: 'יותר מדי ניסיונות רישום, נסה שוב מאוחר יותר'
    }),

    // Enterprise rate limit
    enterprise: createRateLimit({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 50, // 50 enterprise requests per window
        message: 'יותר מדי בקשות ארגוניות, נסה שוב מאוחר יותר'
    })
}

// Speed limiters
export const speedLimiters = {
    // General speed limiting
    general: createSpeedLimit({
        windowMs: 15 * 60 * 1000, // 15 minutes
        delayAfter: 50, // Start delaying after 50 requests
        delayMs: 500, // Add 500ms delay
        maxDelayMs: 20000 // Max 20 second delay
    }),

    // File upload speed limiting
    fileUpload: createSpeedLimit({
        windowMs: 60 * 60 * 1000, // 1 hour
        delayAfter: 10, // Start delaying after 10 uploads
        delayMs: 1000, // Add 1 second delay
        maxDelayMs: 30000 // Max 30 second delay
    })
}

// Security headers middleware
export const securityHeaders = (req: Request, res: Response, next: NextFunction) => {
    // Remove potentially revealing headers
    res.removeHeader('X-Powered-By')
    res.removeHeader('Server')

    // Security headers
    res.setHeader('X-Content-Type-Options', 'nosniff')
    res.setHeader('X-Frame-Options', 'DENY')
    res.setHeader('X-XSS-Protection', '1; mode=block')
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
    res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()')

    // Content Security Policy
    const csp = [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: https:",
        "font-src 'self' data:",
        "connect-src 'self' ws: wss:",
        "media-src 'self'",
        "object-src 'none'",
        "child-src 'none'",
        "frame-ancestors 'none'",
        "form-action 'self'",
        "base-uri 'self'"
    ].join('; ')

    res.setHeader('Content-Security-Policy', csp)

    // HSTS header in production
    if (process.env.NODE_ENV === 'production') {
        res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload')
    }

    next()
}

// Request size limiting
export const requestSizeLimit = (maxSize: string = '10mb') => {
    return (req: Request, res: Response, next: NextFunction) => {
        const contentLength = parseInt(req.headers['content-length'] || '0')
        const maxSizeBytes = parseSize(maxSize)

        if (contentLength > maxSizeBytes) {
            return res.status(413).json({
                success: false,
                message: `גודל הבקשה גדול מדי. מקסימום: ${maxSize}`,
                code: 'REQUEST_TOO_LARGE'
            })
        }

        next()
    }
}

// Helper function to parse size strings
const parseSize = (size: string): number => {
    const units: { [key: string]: number } = {
        'b': 1,
        'kb': 1024,
        'mb': 1024 * 1024,
        'gb': 1024 * 1024 * 1024
    }

    const match = size.toLowerCase().match(/^(\d+(?:\.\d+)?)\s*(b|kb|mb|gb)?$/i)
    if (!match) return 10 * 1024 * 1024 // Default 10MB

    const value = parseFloat(match[1])
    const unit = match[2] || 'b'

    return value * (units[unit] || 1)
}

// IP whitelist/blacklist middleware
export const ipFilter = (options: {
    whitelist?: string[]
    blacklist?: string[]
    message?: string
}) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const clientIP = req.ip || req.connection.remoteAddress || ''

        // Check blacklist first
        if (options.blacklist && options.blacklist.includes(clientIP)) {
            return res.status(403).json({
                success: false,
                message: options.message || 'גישה נדחתה',
                code: 'IP_BLOCKED'
            })
        }

        // Check whitelist if provided
        if (options.whitelist && !options.whitelist.includes(clientIP)) {
            return res.status(403).json({
                success: false,
                message: options.message || 'גישה נדחתה',
                code: 'IP_NOT_WHITELISTED'
            })
        }

        next()
    }
}

// Request logging middleware with security focus
export const securityLogger = (req: Request, res: Response, next: NextFunction) => {
    const start = Date.now()
    const requestId = crypto.randomUUID()

    // Add request ID to response headers
    res.setHeader('X-Request-ID', requestId)

    // Log security-relevant information
    const securityInfo = {
        requestId,
        timestamp: new Date().toISOString(),
        method: req.method,
        url: req.url,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        userId: req.user?.id,
        userEmail: req.user?.email,
        referer: req.headers.referer,
        origin: req.headers.origin
    }

    const originalSend = res.send
    res.send = function (data) {
        const duration = Date.now() - start

        // Log security events
        const logEntry = {
            ...securityInfo,
            statusCode: res.statusCode,
            duration,
            responseSize: data ? data.length : 0,
            isError: res.statusCode >= 400,
            isSecurityEvent: res.statusCode === 401 || res.statusCode === 403 || res.statusCode === 429
        }

        if (logEntry.isSecurityEvent) {
            console.warn('SECURITY_EVENT:', JSON.stringify(logEntry))
        } else {
            console.log('REQUEST:', JSON.stringify(logEntry))
        }

        return originalSend.call(this, data)
    }

    next()
}

// SQL injection protection middleware
export const sqlInjectionProtection = (req: Request, res: Response, next: NextFunction) => {
    const sqlPatterns = [
        /(\b(ALTER|CREATE|DELETE|DROP|EXEC(UTE)?|INSERT( +INTO)?|MERGE|SELECT|UPDATE|UNION( +ALL)?)\b)/gi,
        /(\b(AND|OR)\b.*(=|<|>|\bLIKE\b))/gi,
        /(\\x27|\\x00|\\x1a|'|;|\-\-|\/\*|\*\/)/gi,
        /(script|javascript|vbscript|onload|onerror)/gi
    ]

    const checkString = (str: string): boolean => {
        return sqlPatterns.some(pattern => pattern.test(str))
    }

    const checkObject = (obj: any): boolean => {
        if (typeof obj === 'string') {
            return checkString(obj)
        }

        if (Array.isArray(obj)) {
            return obj.some(checkObject)
        }

        if (obj && typeof obj === 'object') {
            return Object.values(obj).some(checkObject)
        }

        return false
    }

    // Check request body, query, and params
    if (checkObject(req.body) || checkObject(req.query) || checkObject(req.params)) {
        return res.status(400).json({
            success: false,
            message: 'בקשה מכילה תוכן חשוד',
            code: 'SUSPICIOUS_REQUEST'
        })
    }

    next()
}

// XSS protection middleware
export const xssProtection = (req: Request, res: Response, next: NextFunction) => {
    const xssPatterns = [
        /<script[^>]*>.*?<\/script>/gi,
        /<iframe[^>]*>.*?<\/iframe>/gi,
        /<object[^>]*>.*?<\/object>/gi,
        /<embed[^>]*>.*?<\/embed>/gi,
        /javascript:/gi,
        /vbscript:/gi,
        /onload\s*=/gi,
        /onerror\s*=/gi,
        /onclick\s*=/gi
    ]

    const checkString = (str: string): boolean => {
        return xssPatterns.some(pattern => pattern.test(str))
    }

    const checkObject = (obj: any): boolean => {
        if (typeof obj === 'string') {
            return checkString(obj)
        }

        if (Array.isArray(obj)) {
            return obj.some(checkObject)
        }

        if (obj && typeof obj === 'object') {
            return Object.values(obj).some(checkObject)
        }

        return false
    }

    // Check request body, query, and params
    if (checkObject(req.body) || checkObject(req.query) || checkObject(req.params)) {
        return res.status(400).json({
            success: false,
            message: 'בקשה מכילה תוכן חשוד',
            code: 'XSS_ATTEMPT_DETECTED'
        })
    }

    next()
}

// CSRF protection middleware
export const csrfProtection = (req: Request, res: Response, next: NextFunction) => {
    // Skip CSRF check for GET, HEAD, OPTIONS requests
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
        return next()
    }

    const token = req.headers['x-csrf-token'] || req.body._csrf
    const sessionToken = req.headers['x-session-token']

    // For now, we'll implement basic CSRF protection
    // In production, you should use a proper CSRF library like csurf
    if (!token && !sessionToken) {
        return res.status(403).json({
            success: false,
            message: 'נדרש CSRF token',
            code: 'CSRF_TOKEN_MISSING'
        })
    }

    next()
}

// Request timeout middleware
export const requestTimeout = (timeout: number = 30000) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const timer = setTimeout(() => {
            if (!res.headersSent) {
                res.status(408).json({
                    success: false,
                    message: 'הבקשה ארכה יותר מדי זמן',
                    code: 'REQUEST_TIMEOUT'
                })
            }
        }, timeout)

        // Clear timeout when response is sent
        const originalSend = res.send
        res.send = function (data) {
            clearTimeout(timer)
            return originalSend.call(this, data)
        }

        next()
    }
}

// API versioning middleware
export const apiVersioning = (req: Request, res: Response, next: NextFunction) => {
    const version = req.headers['api-version'] || req.query.version

    if (version) {
        // Validate version format
        const versionSchema = z.string().regex(/^v\d+$/)
        const result = versionSchema.safeParse(version)

        if (!result.success) {
            return res.status(400).json({
                success: false,
                message: 'גרסת API לא תקינה',
                code: 'INVALID_API_VERSION'
            })
        }

        req.apiVersion = version as string
    }

    next()
}

// Extend Request interface
declare global {
    namespace Express {
        interface Request {
            apiVersion?: string
        }
    }
}
