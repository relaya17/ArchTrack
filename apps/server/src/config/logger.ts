/**
 * Logger Configuration
 * Construction Master App - Advanced Logging Setup
 */

import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';

// Log levels
const levels = {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4,
};

// Colors for console output
const colors = {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    http: 'magenta',
    debug: 'white',
};

winston.addColors(colors);

// Custom format
const format = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
    winston.format.colorize({ all: true }),
    winston.format.printf(
        (info) => `${info.timestamp} ${info.level}: ${info.message}`
    )
);

// Transports
const transports = [
    // Console transport
    new winston.transports.Console({
        level: process.env.LOG_LEVEL || 'info',
        format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
        ),
    }),

    // Error log file
    new DailyRotateFile({
        filename: path.join('logs', 'error-%DATE%.log'),
        datePattern: 'YYYY-MM-DD',
        level: 'error',
        maxSize: '20m',
        maxFiles: '14d',
        format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json()
        ),
    }),

    // Combined log file
    new DailyRotateFile({
        filename: path.join('logs', 'combined-%DATE%.log'),
        datePattern: 'YYYY-MM-DD',
        maxSize: '20m',
        maxFiles: '30d',
        format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json()
        ),
    }),

    // HTTP requests log file
    new DailyRotateFile({
        filename: path.join('logs', 'http-%DATE%.log'),
        datePattern: 'YYYY-MM-DD',
        level: 'http',
        maxSize: '20m',
        maxFiles: '7d',
        format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json()
        ),
    }),

    // Performance metrics log file
    new DailyRotateFile({
        filename: path.join('logs', 'performance-%DATE%.log'),
        datePattern: 'YYYY-MM-DD',
        level: 'info',
        maxSize: '20m',
        maxFiles: '7d',
        format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json()
        ),
    }),
];

// Create logger instance
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    levels,
    format,
    transports,
    exitOnError: false,
});

// Handle uncaught exceptions
logger.exceptions.handle(
    new winston.transports.File({ filename: 'logs/exceptions.log' })
);

// Handle unhandled promise rejections
logger.rejections.handle(
    new winston.transports.File({ filename: 'logs/rejections.log' })
);

// Custom logging methods
export const logRequest = (req: any, res: any, responseTime: number) => {
    logger.http('HTTP Request', {
        method: req.method,
        url: req.url,
        status: res.statusCode,
        responseTime: `${responseTime}ms`,
        userAgent: req.get('User-Agent'),
        ip: req.ip,
        userId: req.user?.id,
    });
};

export const logError = (error: Error, context?: any) => {
    logger.error('Application Error', {
        message: error.message,
        stack: error.stack,
        context,
        timestamp: new Date().toISOString(),
    });
};

export const logPerformance = (operation: string, duration: number, metadata?: any) => {
    logger.info('Performance Metric', {
        operation,
        duration: `${duration}ms`,
        metadata,
        timestamp: new Date().toISOString(),
    });
};

export const logSecurity = (event: string, details: any) => {
    logger.warn('Security Event', {
        event,
        details,
        timestamp: new Date().toISOString(),
        severity: 'HIGH',
    });
};

export const logBusiness = (event: string, data: any) => {
    logger.info('Business Event', {
        event,
        data,
        timestamp: new Date().toISOString(),
    });
};

// Advanced logging methods
export const logUserActivity = (userId: string, action: string, details: any) => {
    logger.info('User Activity', {
        userId,
        action,
        details,
        timestamp: new Date().toISOString(),
        level: 'USER_ACTIVITY'
    });
};

export const logDatabaseOperation = (operation: string, collection: string, duration: number, success: boolean) => {
    logger.info('Database Operation', {
        operation,
        collection,
        duration: `${duration}ms`,
        success,
        timestamp: new Date().toISOString(),
        level: 'DATABASE'
    });
};

export const logAPICall = (endpoint: string, method: string, statusCode: number, responseTime: number, userId?: string) => {
    logger.http('API Call', {
        endpoint,
        method,
        statusCode,
        responseTime: `${responseTime}ms`,
        userId,
        timestamp: new Date().toISOString(),
        level: 'API'
    });
};

export const logSystemEvent = (event: string, severity: 'low' | 'medium' | 'high' | 'critical', details: any) => {
    const level = severity === 'critical' ? 'error' : severity === 'high' ? 'warn' : 'info';
    
    logger[level]('System Event', {
        event,
        severity,
        details,
        timestamp: new Date().toISOString(),
        level: 'SYSTEM'
    });
};

export const logAudit = (action: string, resource: string, userId: string, details: any) => {
    logger.info('Audit Log', {
        action,
        resource,
        userId,
        details,
        timestamp: new Date().toISOString(),
        level: 'AUDIT'
    });
};

export const logCollaboration = (event: string, projectId: string, userId: string, details: any) => {
    logger.info('Collaboration Event', {
        event,
        projectId,
        userId,
        details,
        timestamp: new Date().toISOString(),
        level: 'COLLABORATION'
    });
};

export const logFileOperation = (operation: string, filename: string, size: number, userId: string, projectId?: string) => {
    logger.info('File Operation', {
        operation,
        filename,
        size: `${size} bytes`,
        userId,
        projectId,
        timestamp: new Date().toISOString(),
        level: 'FILE'
    });
};

export const logAnalytics = (metric: string, value: number, context: any) => {
    logger.info('Analytics Metric', {
        metric,
        value,
        context,
        timestamp: new Date().toISOString(),
        level: 'ANALYTICS'
    });
};

export const logNotification = (type: string, recipient: string, subject: string, success: boolean) => {
    logger.info('Notification Sent', {
        type,
        recipient,
        subject,
        success,
        timestamp: new Date().toISOString(),
        level: 'NOTIFICATION'
    });
};

export const logBackup = (operation: string, size: number, duration: number, success: boolean) => {
    logger.info('Backup Operation', {
        operation,
        size: `${size} bytes`,
        duration: `${duration}ms`,
        success,
        timestamp: new Date().toISOString(),
        level: 'BACKUP'
    });
};

export const logPerformanceMetric = (metric: string, value: number, unit: string, context: any) => {
    logger.info('Performance Metric', {
        metric,
        value,
        unit,
        context,
        timestamp: new Date().toISOString(),
        level: 'PERFORMANCE'
    });
};

export const logErrorWithContext = (error: Error, context: any, severity: 'low' | 'medium' | 'high' | 'critical' = 'medium') => {
    const level = severity === 'critical' ? 'error' : severity === 'high' ? 'warn' : 'info';
    
    logger[level]('Error with Context', {
        message: error.message,
        stack: error.stack,
        context,
        severity,
        timestamp: new Date().toISOString(),
        level: 'ERROR'
    });
};

// Log aggregation and analysis methods
export const getLogStats = async (timeRange: { start: Date; end: Date }) => {
    // This would typically query a log aggregation service
    // For now, return mock data
    return {
        totalLogs: 0,
        errorCount: 0,
        warningCount: 0,
        infoCount: 0,
        topErrors: [],
        topUsers: [],
        performanceMetrics: {}
    };
};

export const searchLogs = async (query: any, filters: any) => {
    // This would typically query a log search service
    // For now, return mock data
    return {
        logs: [],
        total: 0,
        page: 1,
        limit: 100
    };
};

export const exportLogs = async (timeRange: { start: Date; end: Date }, format: 'json' | 'csv' | 'txt') => {
    // This would export logs in the specified format
    // For now, return mock data
    return Buffer.from('Mock log export data');
};

export default logger;

