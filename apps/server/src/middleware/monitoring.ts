/**
 * Monitoring Middleware
 * Construction Master App - Request Monitoring & Metrics
 */

import { Request, Response, NextFunction } from 'express';
import morgan from 'morgan';
import logger from '../config/logger';
import {
    httpRequestDuration,
    httpRequestTotal,
    httpRequestErrors,
    businessMetrics
} from '../config/metrics';
import { captureBreadcrumb, captureException } from '../config/sentry';

// Morgan HTTP logger middleware
export const httpLogger = morgan('combined', {
    stream: {
        write: (message: string) => {
            logger.http(message.trim());
        },
    },
});

// Request timing middleware
export const requestTiming = (req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();

    res.on('finish', () => {
        const duration = (Date.now() - start) / 1000;
        const labels = {
            method: req.method,
            route: req.route?.path || req.path,
            status_code: res.statusCode.toString(),
        };

        // Record metrics
        httpRequestDuration.observe(labels, duration);
        httpRequestTotal.inc(labels);

        // Record business metrics
        businessMetrics.apiCallsTotal.inc({
            endpoint: req.route?.path || req.path,
            method: req.method,
        });

        businessMetrics.apiResponseTime.observe(
            { endpoint: req.route?.path || req.path, method: req.method },
            duration
        );

        // Log performance
        if (duration > 1) {
            logger.warn('Slow request detected', {
                method: req.method,
                url: req.url,
                duration: `${duration}s`,
                statusCode: res.statusCode,
            });
        }

        // Add breadcrumb for Sentry
        captureBreadcrumb(
            `${req.method} ${req.url} - ${res.statusCode}`,
            'http',
            {
                method: req.method,
                url: req.url,
                statusCode: res.statusCode,
                duration: `${duration}s`,
            }
        );
    });

    next();
};

// Error tracking middleware
export const errorTracking = (req: Request, res: Response, next: NextFunction) => {
    const originalSend = res.send;

    res.send = function (data) {
        if (res.statusCode >= 400) {
            const labels = {
                method: req.method,
                route: req.route?.path || req.path,
                status_code: res.statusCode.toString(),
                error_type: res.statusCode >= 500 ? 'server_error' : 'client_error',
            };

            // Record error metrics
            httpRequestErrors.inc(labels);
            businessMetrics.errorsTotal.inc({
                type: 'http_error',
                severity: res.statusCode >= 500 ? 'high' : 'medium',
            });

            // Log error
            logger.error('HTTP Error', {
                method: req.method,
                url: req.url,
                statusCode: res.statusCode,
                userAgent: req.get('User-Agent'),
                ip: req.ip,
                userId: (req as any).user?.id,
            });
        }

        return originalSend.call(this, data);
    };

    next();
};

// Security monitoring middleware
export const securityMonitoring = (req: Request, res: Response, next: NextFunction) => {
    const suspiciousPatterns = [
        /\.\.\//,  // Directory traversal
        /<script/i,  // XSS attempts
        /union.*select/i,  // SQL injection
        /eval\(/i,  // Code injection
        /javascript:/i,  // JavaScript injection
    ];

    const userInput = JSON.stringify({
        body: req.body,
        query: req.query,
        params: req.params,
        headers: req.headers,
    });

    for (const pattern of suspiciousPatterns) {
        if (pattern.test(userInput)) {
            logger.warn('Suspicious request detected', {
                method: req.method,
                url: req.url,
                ip: req.ip,
                userAgent: req.get('User-Agent'),
                pattern: pattern.toString(),
            });

            // Record security metric
            businessMetrics.errorsTotal.inc({
                type: 'security_threat',
                severity: 'high',
            });

            break;
        }
    }

    next();
};

// Rate limiting monitoring
export const rateLimitMonitoring = (req: Request, res: Response, next: NextFunction) => {
    res.on('finish', () => {
        if (res.statusCode === 429) {
            logger.warn('Rate limit exceeded', {
                method: req.method,
                url: req.url,
                ip: req.ip,
                userAgent: req.get('User-Agent'),
            });

            businessMetrics.errorsTotal.inc({
                type: 'rate_limit',
                severity: 'medium',
            });
        }
    });

    next();
};

// Database query monitoring
export const dbQueryMonitoring = (req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();

    res.on('finish', () => {
        const duration = (Date.now() - start) / 1000;

        if (duration > 2) {
            logger.warn('Slow database operation detected', {
                method: req.method,
                url: req.url,
                duration: `${duration}s`,
                statusCode: res.statusCode,
            });
        }
    });

    next();
};

// User activity monitoring
export const userActivityMonitoring = (req: Request, res: Response, next: NextFunction) => {
    res.on('finish', () => {
        if ((req as any).user) {
            const user = (req as any).user;

            // Log user activity
            logger.info('User activity', {
                userId: user.id,
                email: user.email,
                method: req.method,
                url: req.url,
                statusCode: res.statusCode,
                timestamp: new Date().toISOString(),
            });

            // Add breadcrumb for Sentry
            captureBreadcrumb(
                `User ${user.email} - ${req.method} ${req.url}`,
                'user',
                {
                    userId: user.id,
                    email: user.email,
                    action: `${req.method} ${req.url}`,
                }
            );
        }
    });

    next();
};

// System health monitoring
export const healthMonitoring = (req: Request, res: Response, next: NextFunction) => {
    if (req.path === '/health' || req.path === '/api/health') {
        const start = Date.now();

        res.on('finish', () => {
            const duration = Date.now() - start;

            if (duration > 1000) {
                logger.warn('Slow health check response', {
                    duration: `${duration}ms`,
                    statusCode: res.statusCode,
                });
            }
        });
    }

    next();
};

// Combined monitoring middleware
export const monitoringMiddleware = [
    httpLogger,
    requestTiming,
    errorTracking,
    securityMonitoring,
    rateLimitMonitoring,
    dbQueryMonitoring,
    userActivityMonitoring,
    healthMonitoring,
];

export default monitoringMiddleware;

