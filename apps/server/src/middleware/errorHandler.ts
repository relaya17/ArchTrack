/**
 * Advanced Error Handling Middleware
 * Construction Master App - Centralized Error Management
 */

import { Request, Response, NextFunction } from 'express'
import { ZodError } from 'zod'
import { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken'
import mongoose from 'mongoose'

// Custom error classes
export class AppError extends Error {
    public statusCode: number
    public code: string
    public isOperational: boolean

    constructor(message: string, statusCode: number = 500, code: string = 'INTERNAL_ERROR') {
        super(message)
        this.statusCode = statusCode
        this.code = code
        this.isOperational = true

        Error.captureStackTrace(this, this.constructor)
    }
}

export class CustomValidationError extends AppError {
    constructor(message: string, field?: string) {
        super(message, 400, 'VALIDATION_ERROR')
        this.name = 'CustomValidationError'
    }
}

export class AuthenticationError extends AppError {
    constructor(message: string = 'אימות נדרש') {
        super(message, 401, 'AUTHENTICATION_ERROR')
        this.name = 'AuthenticationError'
    }
}

export class AuthorizationError extends AppError {
    constructor(message: string = 'אין הרשאה') {
        super(message, 403, 'AUTHORIZATION_ERROR')
        this.name = 'AuthorizationError'
    }
}

export class NotFoundError extends AppError {
    constructor(message: string = 'משאב לא נמצא') {
        super(message, 404, 'NOT_FOUND_ERROR')
        this.name = 'NotFoundError'
    }
}

export class ConflictError extends AppError {
    constructor(message: string = 'קונפליקט במשאב') {
        super(message, 409, 'CONFLICT_ERROR')
        this.name = 'ConflictError'
    }
}

export class RateLimitError extends AppError {
    constructor(message: string = 'יותר מדי בקשות') {
        super(message, 429, 'RATE_LIMIT_ERROR')
        this.name = 'RateLimitError'
    }
}

// Error logging interface
interface ErrorLog {
    timestamp: Date
    level: 'error' | 'warn' | 'info'
    message: string
    code: string
    statusCode: number
    stack?: string
    userId?: string
    ip?: string
    userAgent?: string
    url?: string
    method?: string
}

// Enhanced error logger
export class ErrorLogger {
    private static logError(error: ErrorLog): void {
        const logEntry = {
            ...error,
            timestamp: error.timestamp.toISOString(),
            environment: process.env.NODE_ENV || 'development'
        }

        // Log to console in development
        if (process.env.NODE_ENV === 'development') {
            console.error('🚨 Error:', logEntry)
        }

        // TODO: Implement proper logging service (Winston, etc.)
        // logger.error(logEntry)
    }

    static log(error: Error, req?: Request, userId?: string): void {
        const errorLog: ErrorLog = {
            timestamp: new Date(),
            level: 'error',
            message: error.message,
            code: (error as any).code || 'UNKNOWN_ERROR',
            statusCode: (error as any).statusCode || 500,
            stack: error.stack,
            userId,
            ip: req?.ip,
            userAgent: req?.get('User-Agent'),
            url: req?.originalUrl,
            method: req?.method
        }

        this.logError(errorLog)
    }
}

// Handle different types of errors
const handleZodError = (error: ZodError): AppError => {
    const errors = error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
        code: err.code
    }))

    return new ValidationError(`שגיאת אימות: ${errors.map(e => e.message).join(', ')}`)
}

const handleJWTError = (error: JsonWebTokenError): AppError => {
    if (error instanceof TokenExpiredError) {
        return new AuthenticationError('Token פג תוקף')
    }
    return new AuthenticationError('Token לא תקין')
}

const handleMongooseError = (error: any): AppError => {
    if (error.name === 'ValidationError') {
        const messages = Object.values(error.errors).map((err: any) => err.message)
        return new ValidationError(messages.join(', '))
    }

    if (error.code === 11000) {
        const field = Object.keys(error.keyPattern)[0]
        return new ConflictError(`${field} כבר קיים במערכת`)
    }

    if (error.name === 'CastError') {
        return new ValidationError(`ערך לא תקין: ${error.path}`)
    }

    return new AppError('שגיאת מסד נתונים', 500, 'DATABASE_ERROR')
}

const handleMongooseValidationError = (error: ValidationError): AppError => {
    const messages = Object.values(error.errors).map((err: any) => err.message)
    return new ValidationError(messages.join(', '))
}

// Main error handling middleware
export const errorHandler = (
    error: Error,
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    let appError: AppError

    // Log the error
    ErrorLogger.log(error, req, (req as any).user?.id)

    // Handle different error types
    if (error instanceof AppError) {
        appError = error
    } else if (error instanceof ZodError) {
        appError = handleZodError(error)
    } else if (error instanceof JsonWebTokenError) {
        appError = handleJWTError(error)
    } else if (error instanceof ValidationError) {
        appError = handleMongooseValidationError(error)
    } else if (error.name === 'ValidationError') {
        appError = handleMongooseError(error)
    } else if (error.name === 'CastError') {
        appError = handleMongooseError(error)
    } else {
        // Unknown error
        appError = new AppError(
            process.env.NODE_ENV === 'development' ? error.message : 'שגיאת שרת פנימית',
            500,
            'INTERNAL_SERVER_ERROR'
        )
    }

    // Send error response
    const response: any = {
        success: false,
        message: appError.message,
        code: appError.code
    }

    // Add stack trace in development
    if (process.env.NODE_ENV === 'development') {
        response.stack = appError.stack
        response.originalError = {
            name: error.name,
            message: error.message
        }
    }

    res.status(appError.statusCode).json(response)
}

// Async error wrapper
export const asyncHandler = (fn: Function) => {
    return (req: Request, res: Response, next: NextFunction) => {
        Promise.resolve(fn(req, res, next)).catch(next)
    }
}

// Not found handler
export const notFoundHandler = (req: Request, res: Response, next: NextFunction): void => {
    const error = new NotFoundError(`מסלול לא נמצא: ${req.originalUrl}`)
    next(error)
}

// Global unhandled rejection handler
export const handleUnhandledRejection = (): void => {
    process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
        console.error('🚨 Unhandled Rejection at:', promise, 'reason:', reason)

        ErrorLogger.log(new Error(`Unhandled Rejection: ${reason}`))

        // Graceful shutdown
        process.exit(1)
    })
}

// Global uncaught exception handler
export const handleUncaughtException = (): void => {
    process.on('uncaughtException', (error: Error) => {
        console.error('🚨 Uncaught Exception:', error)

        ErrorLogger.log(error)

        // Graceful shutdown
        process.exit(1)
    })
}

// Initialize global error handlers
export const initializeErrorHandlers = (): void => {
    handleUnhandledRejection()
    handleUncaughtException()
}
