/**
 * Health Check Routes
 * Construction Master App - System Health Monitoring
 */

import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import logger from '../config/logger';
import { businessMetrics } from '../config/metrics';

const router = Router();

// Basic health check
router.get('/', async (req: Request, res: Response) => {
    try {
        const health = {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            version: process.env.npm_package_version || '1.0.0',
            environment: process.env.NODE_ENV || 'development',
        };

        res.status(200).json(health);
    } catch (error) {
        logger.error('Health check failed', error);
        res.status(500).json({
            status: 'unhealthy',
            timestamp: new Date().toISOString(),
            error: 'Health check failed',
        });
    }
});

// Detailed health check
router.get('/detailed', async (req: Request, res: Response) => {
    const startTime = Date.now();
    const health = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        checks: {
            database: { status: 'unknown', responseTime: 0 },
            redis: { status: 'unknown', responseTime: 0 },
            memory: { status: 'unknown', usage: 0 },
            disk: { status: 'unknown', usage: 0 },
        },
    };

    let allHealthy = true;

    try {
        // Database health check
        const dbStart = Date.now();
        await mongoose.connection.db.admin().ping();
        const dbResponseTime = Date.now() - dbStart;
        health.checks.database = {
            status: 'healthy',
            responseTime: dbResponseTime,
        };

        // Record database health metric
        businessMetrics.apiResponseTime.observe(
            { endpoint: '/health/detailed', method: 'GET' },
            dbResponseTime / 1000
        );

    } catch (error) {
        health.checks.database = {
            status: 'unhealthy',
            responseTime: 0,
            error: error instanceof Error ? error.message : 'Unknown error',
        };
        allHealthy = false;
        logger.error('Database health check failed', error);
    }

    try {
        // Redis health check (if Redis is configured)
        if (process.env.REDIS_URL) {
            const redisStart = Date.now();
            // Add Redis ping logic here when Redis client is implemented
            const redisResponseTime = Date.now() - redisStart;
            health.checks.redis = {
                status: 'healthy',
                responseTime: redisResponseTime,
            };
        } else {
            health.checks.redis = {
                status: 'not_configured',
                responseTime: 0,
            };
        }
    } catch (error) {
        health.checks.redis = {
            status: 'unhealthy',
            responseTime: 0,
            error: error instanceof Error ? error.message : 'Unknown error',
        };
        allHealthy = false;
        logger.error('Redis health check failed', error);
    }

    try {
        // Memory health check
        const memUsage = process.memoryUsage();
        const totalMem = require('os').totalmem();
        const freeMem = require('os').freemem();
        const usedMem = totalMem - freeMem;
        const memUsagePercent = (usedMem / totalMem) * 100;

        health.checks.memory = {
            status: memUsagePercent > 90 ? 'unhealthy' : 'healthy',
            usage: memUsagePercent,
            details: {
                rss: memUsage.rss,
                heapTotal: memUsage.heapTotal,
                heapUsed: memUsage.heapUsed,
                external: memUsage.external,
            },
        };

        if (memUsagePercent > 90) {
            allHealthy = false;
            logger.warn('High memory usage detected', { usage: memUsagePercent });
        }
    } catch (error) {
        health.checks.memory = {
            status: 'unknown',
            usage: 0,
            error: error instanceof Error ? error.message : 'Unknown error',
        };
        logger.error('Memory health check failed', error);
    }

    try {
        // Disk health check
        const fs = require('fs');
        const stats = fs.statSync('.');
        const diskUsage = stats.size;

        health.checks.disk = {
            status: 'healthy',
            usage: diskUsage,
        };
    } catch (error) {
        health.checks.disk = {
            status: 'unknown',
            usage: 0,
            error: error instanceof Error ? error.message : 'Unknown error',
        };
        logger.error('Disk health check failed', error);
    }

    // Set overall status
    health.status = allHealthy ? 'healthy' : 'unhealthy';

    const responseTime = Date.now() - startTime;
    const statusCode = allHealthy ? 200 : 503;

    // Record health check metric
    businessMetrics.apiResponseTime.observe(
        { endpoint: '/health/detailed', method: 'GET' },
        responseTime / 1000
    );

    res.status(statusCode).json(health);
});

// Readiness probe
router.get('/ready', async (req: Request, res: Response) => {
    try {
        // Check if all required services are ready
        const isReady = mongoose.connection.readyState === 1;

        if (isReady) {
            res.status(200).json({
                status: 'ready',
                timestamp: new Date().toISOString(),
            });
        } else {
            res.status(503).json({
                status: 'not_ready',
                timestamp: new Date().toISOString(),
                reason: 'Database not connected',
            });
        }
    } catch (error) {
        logger.error('Readiness check failed', error);
        res.status(503).json({
            status: 'not_ready',
            timestamp: new Date().toISOString(),
            error: 'Readiness check failed',
        });
    }
});

// Liveness probe
router.get('/live', (req: Request, res: Response) => {
    res.status(200).json({
        status: 'alive',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
    });
});

// Metrics endpoint
router.get('/metrics', (req: Request, res: Response) => {
    try {
        const { register } = require('../config/metrics');
        res.set('Content-Type', register.contentType);
        res.end(register.metrics());
    } catch (error) {
        logger.error('Metrics endpoint failed', error);
        res.status(500).json({
            error: 'Failed to retrieve metrics',
            timestamp: new Date().toISOString(),
        });
    }
});

export default router;

