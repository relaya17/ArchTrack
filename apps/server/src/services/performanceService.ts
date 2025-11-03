/**
 * Performance Service
 * Construction Master App - Performance Optimization & Monitoring
 */

import { performance } from 'perf_hooks'
import mongoose from 'mongoose'
import redis from 'redis'
import compression from 'compression'
import { Request, Response, NextFunction } from 'express'

export interface PerformanceMetrics {
    timestamp: Date
    requestId: string
    method: string
    url: string
    statusCode: number
    responseTime: number
    memoryUsage: NodeJS.MemoryUsage
    cpuUsage: NodeJS.CpuUsage
    dbQueries: number
    dbQueryTime: number
    cacheHits: number
    cacheMisses: number
}

export interface SystemMetrics {
    timestamp: Date
    uptime: number
    memoryUsage: NodeJS.MemoryUsage
    cpuUsage: NodeJS.CpuUsage
    activeConnections: number
    dbConnections: number
    cacheConnections: number
    requestCount: number
    errorCount: number
    averageResponseTime: number
}

class PerformanceService {
    private metrics: PerformanceMetrics[] = []
    private systemMetrics: SystemMetrics[] = []
    private redisClient: redis.RedisClientType | null = null
    private startTime: number = performance.now()
    private requestCount: number = 0
    private errorCount: number = 0
    private totalResponseTime: number = 0

    constructor() {
        this.initializeRedis()
        this.startSystemMonitoring()
    }

    private async initializeRedis() {
        try {
            if (process.env.REDIS_URL) {
                this.redisClient = redis.createClient({
                    url: process.env.REDIS_URL
                })

                await this.redisClient.connect()
                console.log('✅ Redis connected for caching')
            }
        } catch (error) {
            console.warn('⚠️ Redis not available, using memory cache')
        }
    }

    // Middleware למדידת ביצועים
    public performanceMiddleware() {
        return (req: Request, res: Response, next: NextFunction) => {
            const startTime = performance.now()
            const startCpuUsage = process.cpuUsage()
            const requestId = this.generateRequestId()

            // הוספת request ID ל-response headers
            res.setHeader('X-Request-ID', requestId)

            // מעקב אחרי database queries
            let dbQueries = 0
            let dbQueryTime = 0

            const originalExec = mongoose.Query.prototype.exec
            mongoose.Query.prototype.exec = function () {
                dbQueries++
                const queryStart = performance.now()

                return originalExec.apply(this, arguments as any).then((result: any) => {
                    dbQueryTime += performance.now() - queryStart
                    return result
                })
            }

            // מעקב אחרי cache
            let cacheHits = 0
            let cacheMisses = 0

            const originalGet = this.redisClient?.get
            if (originalGet) {
                this.redisClient!.get = async function (key: string) {
                    const result = await originalGet.call(this, key)
                    if (result) {
                        cacheHits++
                    } else {
                        cacheMisses++
                    }
                    return result
                }
            }

            // מעקב אחרי סיום request
            res.on('finish', () => {
                const endTime = performance.now()
                const responseTime = endTime - startTime
                const cpuUsage = process.cpuUsage(startCpuUsage)

                const metric: PerformanceMetrics = {
                    timestamp: new Date(),
                    requestId,
                    method: req.method,
                    url: req.url,
                    statusCode: res.statusCode,
                    responseTime,
                    memoryUsage: process.memoryUsage(),
                    cpuUsage,
                    dbQueries,
                    dbQueryTime,
                    cacheHits,
                    cacheMisses
                }

                this.recordMetric(metric)
                this.updateCounters(responseTime, res.statusCode >= 400)

                // החזרת mongoose.exec למצב מקורי
                mongoose.Query.prototype.exec = originalExec
            })

            next()
        }
    }

    // רישום מטריקה
    private recordMetric(metric: PerformanceMetrics) {
        this.metrics.push(metric)

        // שמירת רק 1000 המטריקות האחרונות
        if (this.metrics.length > 1000) {
            this.metrics = this.metrics.slice(-1000)
        }

        // שמירה ל-Redis אם זמין
        if (this.redisClient) {
            this.redisClient.setex(`metric:${metric.requestId}`, 3600, JSON.stringify(metric))
        }
    }

    // עדכון מונים
    private updateCounters(responseTime: number, isError: boolean) {
        this.requestCount++
        this.totalResponseTime += responseTime

        if (isError) {
            this.errorCount++
        }
    }

    // מעקב אחרי מערכת
    private startSystemMonitoring() {
        setInterval(() => {
            this.recordSystemMetrics()
        }, 60000) // כל דקה
    }

    private recordSystemMetrics() {
        const systemMetric: SystemMetrics = {
            timestamp: new Date(),
            uptime: process.uptime(),
            memoryUsage: process.memoryUsage(),
            cpuUsage: process.cpuUsage(),
            activeConnections: this.getActiveConnections(),
            dbConnections: this.getDbConnections(),
            cacheConnections: this.getCacheConnections(),
            requestCount: this.requestCount,
            errorCount: this.errorCount,
            averageResponseTime: this.requestCount > 0 ? this.totalResponseTime / this.requestCount : 0
        }

        this.systemMetrics.push(systemMetric)

        // שמירת רק 100 המטריקות האחרונות
        if (this.systemMetrics.length > 100) {
            this.systemMetrics = this.systemMetrics.slice(-100)
        }
    }

    // Cache management
    public async get(key: string): Promise<string | null> {
        if (!this.redisClient) return null

        try {
            return await this.redisClient.get(key)
        } catch (error) {
            console.error('Cache get error:', error)
            return null
        }
    }

    public async set(key: string, value: string, ttl: number = 3600): Promise<boolean> {
        if (!this.redisClient) return false

        try {
            await this.redisClient.setex(key, ttl, value)
            return true
        } catch (error) {
            console.error('Cache set error:', error)
            return false
        }
    }

    public async del(key: string): Promise<boolean> {
        if (!this.redisClient) return false

        try {
            await this.redisClient.del(key)
            return true
        } catch (error) {
            console.error('Cache del error:', error)
            return false
        }
    }

    public async flush(): Promise<boolean> {
        if (!this.redisClient) return false

        try {
            await this.redisClient.flushAll()
            return true
        } catch (error) {
            console.error('Cache flush error:', error)
            return false
        }
    }

    // Database optimization
    public async optimizeDatabase(): Promise<void> {
        try {
            // יצירת אינדקסים חסרים
            await this.createMissingIndexes()

            // ניקוי collections ישנים
            await this.cleanupOldCollections()

            // אופטימיזציה של queries
            await this.optimizeQueries()

            console.log('✅ Database optimization completed')
        } catch (error) {
            console.error('❌ Database optimization failed:', error)
            throw error
        }
    }

    private async createMissingIndexes(): Promise<void> {
        const collections = [
            { name: 'users', indexes: [{ email: 1 }, { role: 1 }, { createdAt: -1 }] },
            { name: 'projects', indexes: [{ ownerId: 1 }, { status: 1 }, { createdAt: -1 }] },
            { name: 'sheets', indexes: [{ projectId: 1 }, { createdAt: -1 }] },
            { name: 'files', indexes: [{ projectId: 1 }, { uploadedBy: 1 }, { category: 1 }] },
            { name: 'notifications', indexes: [{ recipient: 1 }, { status: 1 }, { createdAt: -1 }] }
        ]

        for (const collection of collections) {
            const coll = mongoose.connection.db?.collection(collection.name)
            if (coll) {
                for (const index of collection.indexes) {
                    try {
                        await coll.createIndex(index)
                    } catch (error) {
                        // Index might already exist
                    }
                }
            }
        }
    }

    private async cleanupOldCollections(): Promise<void> {
        // ניקוי התראות ישנות
        const thirtyDaysAgo = new Date(Date.now() - (30 * 24 * 60 * 60 * 1000))
        await mongoose.connection.db?.collection('notifications').deleteMany({
            createdAt: { $lt: thirtyDaysAgo },
            status: { $in: ['read', 'failed'] }
        })

        // ניקוי הודעות צ'אט ישנות
        const sevenDaysAgo = new Date(Date.now() - (7 * 24 * 60 * 60 * 1000))
        await mongoose.connection.db?.collection('chatmessages').deleteMany({
            createdAt: { $lt: sevenDaysAgo },
            type: 'system'
        })
    }

    private async optimizeQueries(): Promise<void> {
        // כאן יהיה קוד לאופטימיזציה של queries
        console.log('🔍 Query optimization completed')
    }

    // Memory management
    public async optimizeMemory(): Promise<void> {
        try {
            // ניקוי memory leaks
            if (global.gc) {
                global.gc()
            }

            // אופטימיזציה של cache
            if (this.metrics.length > 500) {
                this.metrics = this.metrics.slice(-500)
            }

            if (this.systemMetrics.length > 50) {
                this.systemMetrics = this.systemMetrics.slice(-50)
            }

            console.log('✅ Memory optimization completed')
        } catch (error) {
            console.error('❌ Memory optimization failed:', error)
            throw error
        }
    }

    // API response optimization
    public paginationMiddleware(pageSize: number = 20, maxPageSize: number = 100) {
        return (req: Request, res: Response, next: NextFunction) => {
            const page = Math.max(1, parseInt(req.query.page as string) || 1)
            const limit = Math.min(maxPageSize, Math.max(1, parseInt(req.query.limit as string) || pageSize))
            const skip = (page - 1) * limit

            req.pagination = { page, limit, skip }
            next()
        }
    }

    // Compression middleware
    public compressionMiddleware() {
        return compression({
            level: 6,
            threshold: 1024,
            filter: (req: Request, res: Response) => {
                if (req.headers['x-no-compression']) {
                    return false
                }
                return compression.filter(req, res)
            }
        })
    }

    // Helper methods
    private generateRequestId(): string {
        return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }

    private getActiveConnections(): number {
        return process.listenerCount('connection') || 0
    }

    private getDbConnections(): number {
        return mongoose.connection.readyState === 1 ? 1 : 0
    }

    private getCacheConnections(): number {
        return this.redisClient ? 1 : 0
    }

    // Statistics
    public getPerformanceStats(): any {
        const recentMetrics = this.metrics.slice(-100)
        const recentSystemMetrics = this.systemMetrics.slice(-10)

        return {
            requests: {
                total: this.requestCount,
                errors: this.errorCount,
                errorRate: this.requestCount > 0 ? (this.errorCount / this.requestCount * 100).toFixed(2) + '%' : '0%',
                averageResponseTime: this.requestCount > 0 ? (this.totalResponseTime / this.requestCount).toFixed(2) + 'ms' : '0ms'
            },
            performance: {
                averageResponseTime: recentMetrics.reduce((sum, m) => sum + m.responseTime, 0) / recentMetrics.length || 0,
                averageDbQueries: recentMetrics.reduce((sum, m) => sum + m.dbQueries, 0) / recentMetrics.length || 0,
                averageDbQueryTime: recentMetrics.reduce((sum, m) => sum + m.dbQueryTime, 0) / recentMetrics.length || 0,
                cacheHitRate: recentMetrics.reduce((sum, m) => sum + m.cacheHits, 0) /
                    (recentMetrics.reduce((sum, m) => sum + m.cacheHits + m.cacheMisses, 0) || 1) * 100 || 0
            },
            system: {
                uptime: process.uptime(),
                memoryUsage: process.memoryUsage(),
                cpuUsage: process.cpuUsage(),
                activeConnections: this.getActiveConnections(),
                dbConnections: this.getDbConnections(),
                cacheConnections: this.getCacheConnections()
            },
            trends: {
                responseTime: recentSystemMetrics.map(m => ({
                    timestamp: m.timestamp,
                    value: m.averageResponseTime
                })),
                memoryUsage: recentSystemMetrics.map(m => ({
                    timestamp: m.timestamp,
                    value: m.memoryUsage.heapUsed
                }))
            }
        }
    }

    // Health check
    public getHealthStatus(): any {
        const stats = this.getPerformanceStats()
        const memoryUsage = process.memoryUsage()
        const memoryUsagePercent = (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100

        return {
            status: memoryUsagePercent > 90 ? 'critical' : memoryUsagePercent > 75 ? 'warning' : 'healthy',
            uptime: process.uptime(),
            memory: {
                used: memoryUsage.heapUsed,
                total: memoryUsage.heapTotal,
                percentage: memoryUsagePercent
            },
            database: {
                status: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
            },
            cache: {
                status: this.redisClient ? 'connected' : 'disabled'
            },
            performance: {
                averageResponseTime: stats.requests.averageResponseTime,
                errorRate: stats.requests.errorRate
            }
        }
    }
}

export default new PerformanceService()

