/**
 * Metrics Configuration
 * Construction Master App - Prometheus Metrics Setup
 */

import { register, collectDefaultMetrics, Counter, Histogram, Gauge, Summary } from 'prom-client';

// Enable default metrics collection
collectDefaultMetrics({ register });

// Custom metrics
export const httpRequestDuration = new Histogram({
    name: 'http_request_duration_seconds',
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method', 'route', 'status_code'],
    buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10],
});

export const httpRequestTotal = new Counter({
    name: 'http_requests_total',
    help: 'Total number of HTTP requests',
    labelNames: ['method', 'route', 'status_code'],
});

export const httpRequestErrors = new Counter({
    name: 'http_request_errors_total',
    help: 'Total number of HTTP request errors',
    labelNames: ['method', 'route', 'status_code', 'error_type'],
});

export const activeConnections = new Gauge({
    name: 'active_connections',
    help: 'Number of active connections',
});

export const databaseConnections = new Gauge({
    name: 'database_connections_active',
    help: 'Number of active database connections',
});

export const redisConnections = new Gauge({
    name: 'redis_connections_active',
    help: 'Number of active Redis connections',
});

export const memoryUsage = new Gauge({
    name: 'memory_usage_bytes',
    help: 'Memory usage in bytes',
    labelNames: ['type'],
});

export const cpuUsage = new Gauge({
    name: 'cpu_usage_percent',
    help: 'CPU usage percentage',
});

export const diskUsage = new Gauge({
    name: 'disk_usage_bytes',
    help: 'Disk usage in bytes',
    labelNames: ['path'],
});

export const businessMetrics = {
    usersRegistered: new Counter({
        name: 'users_registered_total',
        help: 'Total number of registered users',
        labelNames: ['source'],
    }),

    projectsCreated: new Counter({
        name: 'projects_created_total',
        help: 'Total number of projects created',
        labelNames: ['type'],
    }),

    documentsGenerated: new Counter({
        name: 'documents_generated_total',
        help: 'Total number of documents generated',
        labelNames: ['type'],
    }),

    apiCallsTotal: new Counter({
        name: 'api_calls_total',
        help: 'Total number of API calls',
        labelNames: ['endpoint', 'method'],
    }),

    apiResponseTime: new Summary({
        name: 'api_response_time_seconds',
        help: 'API response time in seconds',
        labelNames: ['endpoint', 'method'],
        percentiles: [0.5, 0.9, 0.95, 0.99],
    }),

    authenticationAttempts: new Counter({
        name: 'authentication_attempts_total',
        help: 'Total number of authentication attempts',
        labelNames: ['success', 'method'],
    }),

    fileUploads: new Counter({
        name: 'file_uploads_total',
        help: 'Total number of file uploads',
        labelNames: ['type', 'size_category'],
    }),

    emailSent: new Counter({
        name: 'emails_sent_total',
        help: 'Total number of emails sent',
        labelNames: ['type', 'status'],
    }),

    notificationsSent: new Counter({
        name: 'notifications_sent_total',
        help: 'Total number of notifications sent',
        labelNames: ['type', 'channel'],
    }),

    errorsTotal: new Counter({
        name: 'errors_total',
        help: 'Total number of errors',
        labelNames: ['type', 'severity'],
    }),
};

export const securityMetrics = {
    failedLogins: new Counter({
        name: 'failed_logins_total',
        help: 'Total number of failed login attempts',
        labelNames: ['ip', 'user_agent'],
    }),

    suspiciousActivity: new Counter({
        name: 'suspicious_activity_total',
        help: 'Total number of suspicious activities detected',
        labelNames: ['type', 'severity'],
    }),

    rateLimitHits: new Counter({
        name: 'rate_limit_hits_total',
        help: 'Total number of rate limit hits',
        labelNames: ['endpoint', 'ip'],
    }),

    blockedRequests: new Counter({
        name: 'blocked_requests_total',
        help: 'Total number of blocked requests',
        labelNames: ['reason', 'ip'],
    }),
};

export const performanceMetrics = {
    responseTime: new Histogram({
        name: 'response_time_seconds',
        help: 'Response time for various operations',
        labelNames: ['operation', 'status'],
        buckets: [0.1, 0.5, 1, 2, 5, 10],
    }),

    databaseQueryTime: new Histogram({
        name: 'database_query_time_seconds',
        help: 'Database query execution time',
        labelNames: ['collection', 'operation'],
        buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5],
    }),

    cacheHitRate: new Gauge({
        name: 'cache_hit_rate',
        help: 'Cache hit rate percentage',
        labelNames: ['cache_type'],
    }),

    queueSize: new Gauge({
        name: 'queue_size',
        help: 'Size of various queues',
        labelNames: ['queue_name'],
    }),

    processingTime: new Summary({
        name: 'processing_time_seconds',
        help: 'Processing time for various operations',
        labelNames: ['operation'],
        percentiles: [0.5, 0.9, 0.95, 0.99],
    }),
};

// System metrics collection
export const collectSystemMetrics = () => {
    const os = require('os');

    // Memory usage
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;

    memoryUsage.set({ type: 'total' }, totalMem);
    memoryUsage.set({ type: 'used' }, usedMem);
    memoryUsage.set({ type: 'free' }, freeMem);

    // CPU usage (simplified)
    const cpus = os.cpus();
    const cpuUsagePercent = cpus.reduce((acc: number, cpu: any) => {
        const total = Object.values(cpu.times).reduce((a: number, b: number) => a + b, 0) as number;
        const idle = cpu.times.idle;
        return acc + (1 - idle / total);
    }, 0) / cpus.length * 100;

    cpuUsage.set(cpuUsagePercent);

    // Active connections (placeholder - implement based on your needs)
    activeConnections.set(0);
};

// Start system metrics collection
setInterval(collectSystemMetrics, 10000); // Every 10 seconds

export default register;

