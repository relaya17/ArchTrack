/**
 * Monitoring Service
 * Construction Master App - Advanced Monitoring & Metrics System
 */

import { EventEmitter } from 'events'
import mongoose from 'mongoose'
import performanceService from './performanceService'
import notificationService from './notificationService'

export interface MetricData {
    timestamp: Date
    name: string
    value: number
    unit: string
    tags: Record<string, string>
    metadata?: any
}

export interface AlertRule {
    id: string
    name: string
    metric: string
    condition: 'gt' | 'lt' | 'eq' | 'gte' | 'lte'
    threshold: number
    duration: number // seconds
    severity: 'low' | 'medium' | 'high' | 'critical'
    enabled: boolean
    actions: string[] // notification channels
}

export interface Alert {
    id: string
    ruleId: string
    name: string
    severity: string
    message: string
    metric: string
    value: number
    threshold: number
    timestamp: Date
    resolved: boolean
    resolvedAt?: Date
    acknowledged: boolean
    acknowledgedBy?: string
    acknowledgedAt?: Date
}

export interface SystemHealth {
    status: 'healthy' | 'warning' | 'critical'
    score: number // 0-100
    checks: {
        database: boolean
        cache: boolean
        memory: boolean
        cpu: boolean
        disk: boolean
        network: boolean
    }
    metrics: {
        uptime: number
        responseTime: number
        errorRate: number
        memoryUsage: number
        cpuUsage: number
    }
    alerts: Alert[]
}

class MonitoringService extends EventEmitter {
    private metrics: MetricData[] = []
    private alertRules: AlertRule[] = []
    private alerts: Alert[] = []
    private healthChecks: Map<string, boolean> = new Map()
    private startTime: Date = new Date()

    constructor() {
        super()
        this.initializeDefaultRules()
        this.startMonitoring()
    }

    // התחלת ניטור
    private startMonitoring() {
        // ניטור כל 30 שניות
        setInterval(() => {
            this.collectMetrics()
            this.checkAlerts()
            this.updateHealthStatus()
        }, 30000)

        // ניטור כל דקה
        setInterval(() => {
            this.cleanupOldData()
        }, 60000)

        console.log('🔍 Monitoring service started')
    }

    // איסוף מטריקות
    private async collectMetrics() {
        try {
            const perfStats = performanceService.getPerformanceStats()
            const memoryUsage = process.memoryUsage()
            const cpuUsage = process.cpuUsage()

            // מטריקות מערכת
            this.recordMetric('system.memory.heap_used', memoryUsage.heapUsed, 'bytes', {
                type: 'memory',
                component: 'system'
            })

            this.recordMetric('system.memory.heap_total', memoryUsage.heapTotal, 'bytes', {
                type: 'memory',
                component: 'system'
            })

            this.recordMetric('system.memory.external', memoryUsage.external, 'bytes', {
                type: 'memory',
                component: 'system'
            })

            this.recordMetric('system.cpu.user', cpuUsage.user, 'microseconds', {
                type: 'cpu',
                component: 'system'
            })

            this.recordMetric('system.cpu.system', cpuUsage.system, 'microseconds', {
                type: 'cpu',
                component: 'system'
            })

            // מטריקות ביצועים
            this.recordMetric('performance.response_time', perfStats.requests.averageResponseTime, 'ms', {
                type: 'performance',
                component: 'api'
            })

            this.recordMetric('performance.error_rate', parseFloat(perfStats.requests.errorRate), 'percent', {
                type: 'performance',
                component: 'api'
            })

            this.recordMetric('performance.db_queries', perfStats.performance.averageDbQueries, 'count', {
                type: 'performance',
                component: 'database'
            })

            this.recordMetric('performance.cache_hit_rate', perfStats.performance.cacheHitRate, 'percent', {
                type: 'performance',
                component: 'cache'
            })

            // מטריקות מסד נתונים
            const dbStats = await this.getDatabaseStats()
            this.recordMetric('database.connections', dbStats.connections, 'count', {
                type: 'database',
                component: 'mongodb'
            })

            this.recordMetric('database.operations', dbStats.operations, 'count', {
                type: 'database',
                component: 'mongodb'
            })

            // מטריקות אפליקציה
            const appStats = await this.getApplicationStats()
            this.recordMetric('application.users.active', appStats.activeUsers, 'count', {
                type: 'application',
                component: 'users'
            })

            this.recordMetric('application.projects.active', appStats.activeProjects, 'count', {
                type: 'application',
                component: 'projects'
            })

            this.recordMetric('application.files.total', appStats.totalFiles, 'count', {
                type: 'application',
                component: 'files'
            })

        } catch (error) {
            console.error('Error collecting metrics:', error)
        }
    }

    // רישום מטריקה
    public recordMetric(name: string, value: number, unit: string, tags: Record<string, string> = {}, metadata?: any) {
        const metric: MetricData = {
            timestamp: new Date(),
            name,
            value,
            unit,
            tags,
            metadata
        }

        this.metrics.push(metric)

        // שמירת רק 10000 המטריקות האחרונות
        if (this.metrics.length > 10000) {
            this.metrics = this.metrics.slice(-10000)
        }

        // הודעת event
        this.emit('metric', metric)
    }

    // בדיקת התראות
    private checkAlerts() {
        for (const rule of this.alertRules) {
            if (!rule.enabled) continue

            const recentMetrics = this.getRecentMetrics(rule.metric, rule.duration)

            if (recentMetrics.length === 0) continue

            const avgValue = recentMetrics.reduce((sum, m) => sum + m.value, 0) / recentMetrics.length
            const shouldAlert = this.evaluateCondition(avgValue, rule.condition, rule.threshold)

            if (shouldAlert) {
                const existingAlert = this.alerts.find(a =>
                    a.ruleId === rule.id && !a.resolved && !a.acknowledged
                )

                if (!existingAlert) {
                    this.createAlert(rule, avgValue)
                }
            } else {
                // פתרון התראה אם התנאי כבר לא מתקיים
                const existingAlert = this.alerts.find(a =>
                    a.ruleId === rule.id && !a.resolved
                )

                if (existingAlert) {
                    this.resolveAlert(existingAlert.id)
                }
            }
        }
    }

    // יצירת התראה
    private async createAlert(rule: AlertRule, value: number) {
        const alert: Alert = {
            id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            ruleId: rule.id,
            name: rule.name,
            severity: rule.severity,
            message: `Metric ${rule.metric} is ${rule.condition} ${rule.threshold} (current: ${value})`,
            metric: rule.metric,
            value,
            threshold: rule.threshold,
            timestamp: new Date(),
            resolved: false,
            acknowledged: false
        }

        this.alerts.push(alert)

        // שליחת התראה
        await this.sendAlertNotification(alert)

        // הודעת event
        this.emit('alert', alert)

        console.log(`🚨 Alert triggered: ${alert.name} (${alert.severity})`)
    }

    // פתרון התראה
    public resolveAlert(alertId: string) {
        const alert = this.alerts.find(a => a.id === alertId)
        if (alert && !alert.resolved) {
            alert.resolved = true
            alert.resolvedAt = new Date()

            console.log(`✅ Alert resolved: ${alert.name}`)
            this.emit('alertResolved', alert)
        }
    }

    // אישור התראה
    public acknowledgeAlert(alertId: string, userId: string) {
        const alert = this.alerts.find(a => a.id === alertId)
        if (alert && !alert.acknowledged) {
            alert.acknowledged = true
            alert.acknowledgedBy = userId
            alert.acknowledgedAt = new Date()

            console.log(`👤 Alert acknowledged: ${alert.name} by ${userId}`)
            this.emit('alertAcknowledged', alert)
        }
    }

    // שליחת התראה
    private async sendAlertNotification(alert: Alert) {
        try {
            // שליחת התראה למנהלי מערכת
            const User = require('../models/User').default
            const admins = await User.find({ role: 'admin' })

            for (const admin of admins) {
                await notificationService.createNotification({
                    recipient: admin._id.toString(),
                    template: {
                        title: `🚨 Alert: ${alert.name}`,
                        message: alert.message,
                        type: alert.severity === 'critical' ? 'error' : 'warning',
                        priority: alert.severity === 'critical' ? 'urgent' : 'high',
                        channels: ['email', 'push', 'in_app']
                    }
                })
            }
        } catch (error) {
            console.error('Failed to send alert notification:', error)
        }
    }

    // הערכת תנאי
    private evaluateCondition(value: number, condition: string, threshold: number): boolean {
        switch (condition) {
            case 'gt': return value > threshold
            case 'lt': return value < threshold
            case 'eq': return value === threshold
            case 'gte': return value >= threshold
            case 'lte': return value <= threshold
            default: return false
        }
    }

    // קבלת מטריקות אחרונות
    private getRecentMetrics(metricName: string, durationSeconds: number): MetricData[] {
        const cutoffTime = new Date(Date.now() - (durationSeconds * 1000))
        return this.metrics.filter(m =>
            m.name === metricName && m.timestamp >= cutoffTime
        )
    }

    // עדכון סטטוס בריאות
    private updateHealthStatus() {
        const checks = this.runHealthChecks()
        const score = this.calculateHealthScore(checks)
        const status = score >= 80 ? 'healthy' : score >= 60 ? 'warning' : 'critical'

        const health: SystemHealth = {
            status,
            score,
            checks,
            metrics: this.getCurrentMetrics(),
            alerts: this.getActiveAlerts()
        }

        this.emit('healthUpdate', health)
    }

    // בדיקות בריאות
    private runHealthChecks(): SystemHealth['checks'] {
        const checks = {
            database: false,
            cache: false,
            memory: false,
            cpu: false,
            disk: false,
            network: false
        }

        try {
            // בדיקת מסד נתונים
            checks.database = mongoose.connection.readyState === 1

            // בדיקת cache
            checks.cache = true // Redis check would go here

            // בדיקת זיכרון
            const memoryUsage = process.memoryUsage()
            checks.memory = (memoryUsage.heapUsed / memoryUsage.heapTotal) < 0.9

            // בדיקת CPU
            checks.cpu = true // CPU check would go here

            // בדיקת דיסק
            checks.disk = true // Disk space check would go here

            // בדיקת רשת
            checks.network = true // Network connectivity check would go here

        } catch (error) {
            console.error('Health check error:', error)
        }

        return checks
    }

    // חישוב ציון בריאות
    private calculateHealthScore(checks: SystemHealth['checks']): number {
        const totalChecks = Object.keys(checks).length
        const passedChecks = Object.values(checks).filter(Boolean).length
        return Math.round((passedChecks / totalChecks) * 100)
    }

    // קבלת מטריקות נוכחיות
    private getCurrentMetrics(): SystemHealth['metrics'] {
        const perfStats = performanceService.getPerformanceStats()
        const memoryUsage = process.memoryUsage()

        return {
            uptime: process.uptime(),
            responseTime: perfStats.requests.averageResponseTime,
            errorRate: parseFloat(perfStats.requests.errorRate),
            memoryUsage: (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100,
            cpuUsage: 0 // CPU usage calculation would go here
        }
    }

    // קבלת התראות פעילות
    private getActiveAlerts(): Alert[] {
        return this.alerts.filter(a => !a.resolved)
    }

    // ניקוי נתונים ישנים
    private cleanupOldData() {
        const oneWeekAgo = new Date(Date.now() - (7 * 24 * 60 * 60 * 1000))

        // ניקוי מטריקות ישנות
        this.metrics = this.metrics.filter(m => m.timestamp >= oneWeekAgo)

        // ניקוי התראות ישנות
        this.alerts = this.alerts.filter(a => a.timestamp >= oneWeekAgo)
    }

    // API methods
    public getMetrics(filters?: {
        name?: string
        tags?: Record<string, string>
        startTime?: Date
        endTime?: Date
        limit?: number
    }) {
        let filteredMetrics = [...this.metrics]

        if (filters) {
            if (filters.name) {
                filteredMetrics = filteredMetrics.filter(m => m.name === filters.name)
            }

            if (filters.tags) {
                filteredMetrics = filteredMetrics.filter(m =>
                    Object.entries(filters.tags!).every(([key, value]) =>
                        m.tags[key] === value
                    )
                )
            }

            if (filters.startTime) {
                filteredMetrics = filteredMetrics.filter(m => m.timestamp >= filters.startTime!)
            }

            if (filters.endTime) {
                filteredMetrics = filteredMetrics.filter(m => m.timestamp <= filters.endTime!)
            }

            if (filters.limit) {
                filteredMetrics = filteredMetrics.slice(-filters.limit)
            }
        }

        return filteredMetrics.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    }

    public getAlerts(filters?: {
        severity?: string
        resolved?: boolean
        acknowledged?: boolean
        limit?: number
    }) {
        let filteredAlerts = [...this.alerts]

        if (filters) {
            if (filters.severity) {
                filteredAlerts = filteredAlerts.filter(a => a.severity === filters.severity)
            }

            if (filters.resolved !== undefined) {
                filteredAlerts = filteredAlerts.filter(a => a.resolved === filters.resolved)
            }

            if (filters.acknowledged !== undefined) {
                filteredAlerts = filteredAlerts.filter(a => a.acknowledged === filters.acknowledged)
            }

            if (filters.limit) {
                filteredAlerts = filteredAlerts.slice(-filters.limit)
            }
        }

        return filteredAlerts.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    }

    public getAlertRules() {
        return [...this.alertRules]
    }

    public addAlertRule(rule: Omit<AlertRule, 'id'>) {
        const newRule: AlertRule = {
            ...rule,
            id: `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        }
        this.alertRules.push(newRule)
        return newRule
    }

    public updateAlertRule(ruleId: string, updates: Partial<AlertRule>) {
        const rule = this.alertRules.find(r => r.id === ruleId)
        if (rule) {
            Object.assign(rule, updates)
            return rule
        }
        return null
    }

    public deleteAlertRule(ruleId: string) {
        const index = this.alertRules.findIndex(r => r.id === ruleId)
        if (index >= 0) {
            this.alertRules.splice(index, 1)
            return true
        }
        return false
    }

    // Helper methods
    private async getDatabaseStats() {
        try {
            const stats = await mongoose.connection.db?.stats()
            return {
                connections: mongoose.connection.readyState === 1 ? 1 : 0,
                operations: stats?.totalInsert || 0
            }
        } catch (error) {
            return { connections: 0, operations: 0 }
        }
    }

    private async getApplicationStats() {
        try {
            const User = require('../models/User').default
            const Project = require('../models/Project').default
            const File = require('../models/File').default

            const [activeUsers, activeProjects, totalFiles] = await Promise.all([
                User.countDocuments({ isActive: true }),
                Project.countDocuments({ status: 'active' }),
                File.countDocuments()
            ])

            return {
                activeUsers,
                activeProjects,
                totalFiles
            }
        } catch (error) {
            return { activeUsers: 0, activeProjects: 0, totalFiles: 0 }
        }
    }

    // התחלת כללי ברירת מחדל
    private initializeDefaultRules() {
        this.addAlertRule({
            name: 'High Memory Usage',
            metric: 'system.memory.heap_used',
            condition: 'gt',
            threshold: 100 * 1024 * 1024, // 100MB
            duration: 300, // 5 minutes
            severity: 'high',
            enabled: true,
            actions: ['email', 'in_app']
        })

        this.addAlertRule({
            name: 'High Response Time',
            metric: 'performance.response_time',
            condition: 'gt',
            threshold: 5000, // 5 seconds
            duration: 600, // 10 minutes
            severity: 'medium',
            enabled: true,
            actions: ['email', 'in_app']
        })

        this.addAlertRule({
            name: 'High Error Rate',
            metric: 'performance.error_rate',
            condition: 'gt',
            threshold: 5, // 5%
            duration: 300, // 5 minutes
            severity: 'critical',
            enabled: true,
            actions: ['email', 'push', 'in_app']
        })

        this.addAlertRule({
            name: 'Database Connection Lost',
            metric: 'database.connections',
            condition: 'eq',
            threshold: 0,
            duration: 60, // 1 minute
            severity: 'critical',
            enabled: true,
            actions: ['email', 'push', 'in_app']
        })
    }
}

export default new MonitoringService()

