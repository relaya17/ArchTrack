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

export default logger;

