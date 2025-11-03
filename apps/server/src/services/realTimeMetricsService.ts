/**
 * Real-Time Metrics Service
 * Construction Master App - Live Performance Monitoring
 */

import { EventEmitter } from 'events'
import Project from '../models/Project'
import Sheet from '../models/Sheet'
import File from '../models/File'
import User from '../models/User'
import ChatMessage from '../models/ChatMessage'
import logger from '../config/logger'

interface RealTimeMetric {
    id: string
    name: string
    value: number
    unit: string
    status: 'healthy' | 'warning' | 'critical'
    timestamp: Date
    trend: 'up' | 'down' | 'stable'
    threshold?: {
        warning: number
        critical: number
    }
}

interface SystemMetrics {
    // Server metrics
    cpuUsage: number
    memoryUsage: number
    diskUsage: number
    networkLatency: number
    
    // Database metrics
    dbConnections: number
    dbQueryTime: number
    dbOperations: number
    
    // Application metrics
    activeUsers: number
    activeProjects: number
    activeSheets: number
    totalRequests: number
    errorRate: number
    responseTime: number
    
    // Business metrics
    projectsCreated: number
    sheetsModified: number
    filesUploaded: number
    messagesSent: number
    collaborationScore: number
}

interface ProjectMetrics {
    projectId: string
    projectName: string
    metrics: {
        // Activity metrics
        activeUsers: number
        recentActivity: number
        collaborationLevel: number
        
        // Performance metrics
        productivityScore: number
        qualityScore: number
        efficiencyScore: number
        
        // Resource metrics
        storageUsed: number
        bandwidthUsed: number
        processingTime: number
        
        // Business metrics
        progressRate: number
        budgetUtilization: number
        timelineAdherence: number
    }
    alerts: Array<{
        type: 'performance' | 'resource' | 'business' | 'security'
        severity: 'low' | 'medium' | 'high' | 'critical'
        message: string
        timestamp: Date
    }>
}

class RealTimeMetricsService extends EventEmitter {
    private metrics: Map<string, RealTimeMetric> = new Map()
    private systemMetrics: SystemMetrics
    private projectMetrics: Map<string, ProjectMetrics> = new Map()
    private updateInterval: NodeJS.Timeout | null = null
    private isRunning: boolean = false

    constructor() {
        super()
        this.systemMetrics = this.initializeSystemMetrics()
        this.startMetricsCollection()
    }

    /**
     * Start real-time metrics collection
     */
    public startMetricsCollection(): void {
        if (this.isRunning) return
        
        this.isRunning = true
        this.updateInterval = setInterval(async () => {
            try {
                await this.updateSystemMetrics()
                await this.updateProjectMetrics()
                await this.updateBusinessMetrics()
                this.emit('metricsUpdated', this.getAllMetrics())
            } catch (error) {
                logger.error('Error updating real-time metrics:', error)
            }
        }, 5000) // Update every 5 seconds

        logger.info('Real-time metrics collection started')
    }

    /**
     * Stop real-time metrics collection
     */
    public stopMetricsCollection(): void {
        if (this.updateInterval) {
            clearInterval(this.updateInterval)
            this.updateInterval = null
        }
        this.isRunning = false
        logger.info('Real-time metrics collection stopped')
    }

    /**
     * Get all current metrics
     */
    public getAllMetrics(): {
        system: SystemMetrics
        projects: ProjectMetrics[]
        custom: RealTimeMetric[]
    } {
        return {
            system: this.systemMetrics,
            projects: Array.from(this.projectMetrics.values()),
            custom: Array.from(this.metrics.values())
        }
    }

    /**
     * Get system metrics
     */
    public getSystemMetrics(): SystemMetrics {
        return this.systemMetrics
    }

    /**
     * Get project metrics
     */
    public getProjectMetrics(projectId: string): ProjectMetrics | undefined {
        return this.projectMetrics.get(projectId)
    }

    /**
     * Get all project metrics
     */
    public getAllProjectMetrics(): ProjectMetrics[] {
        return Array.from(this.projectMetrics.values())
    }

    /**
     * Add custom metric
     */
    public addCustomMetric(metric: Omit<RealTimeMetric, 'timestamp'>): void {
        const fullMetric: RealTimeMetric = {
            ...metric,
            timestamp: new Date()
        }
        
        this.metrics.set(metric.id, fullMetric)
        this.emit('metricAdded', fullMetric)
    }

    /**
     * Update custom metric
     */
    public updateCustomMetric(id: string, value: number): void {
        const metric = this.metrics.get(id)
        if (metric) {
            const oldValue = metric.value
            metric.value = value
            metric.timestamp = new Date()
            metric.trend = value > oldValue ? 'up' : value < oldValue ? 'down' : 'stable'
            
            // Check thresholds
            if (metric.threshold) {
                if (value >= metric.threshold.critical) {
                    metric.status = 'critical'
                } else if (value >= metric.threshold.warning) {
                    metric.status = 'warning'
                } else {
                    metric.status = 'healthy'
                }
            }
            
            this.metrics.set(id, metric)
            this.emit('metricUpdated', metric)
        }
    }

    /**
     * Remove custom metric
     */
    public removeCustomMetric(id: string): void {
        this.metrics.delete(id)
        this.emit('metricRemoved', id)
    }

    /**
     * Get metrics history
     */
    public getMetricsHistory(metricId: string, duration: number = 3600000): RealTimeMetric[] {
        // In a real implementation, this would query a time-series database
        // For now, return current metric
        const metric = this.metrics.get(metricId)
        return metric ? [metric] : []
    }

    /**
     * Initialize system metrics
     */
    private initializeSystemMetrics(): SystemMetrics {
        return {
            // Server metrics
            cpuUsage: 0,
            memoryUsage: 0,
            diskUsage: 0,
            networkLatency: 0,
            
            // Database metrics
            dbConnections: 0,
            dbQueryTime: 0,
            dbOperations: 0,
            
            // Application metrics
            activeUsers: 0,
            activeProjects: 0,
            activeSheets: 0,
            totalRequests: 0,
            errorRate: 0,
            responseTime: 0,
            
            // Business metrics
            projectsCreated: 0,
            sheetsModified: 0,
            filesUploaded: 0,
            messagesSent: 0,
            collaborationScore: 0
        }
    }

    /**
     * Update system metrics
     */
    private async updateSystemMetrics(): Promise<void> {
        try {
            // Get server metrics (simplified)
            this.systemMetrics.cpuUsage = this.getCPUUsage()
            this.systemMetrics.memoryUsage = this.getMemoryUsage()
            this.systemMetrics.diskUsage = this.getDiskUsage()
            this.systemMetrics.networkLatency = this.getNetworkLatency()
            
            // Get database metrics
            this.systemMetrics.dbConnections = await this.getDatabaseConnections()
            this.systemMetrics.dbQueryTime = await this.getDatabaseQueryTime()
            this.systemMetrics.dbOperations = await this.getDatabaseOperations()
            
            // Get application metrics
            this.systemMetrics.activeUsers = await this.getActiveUsers()
            this.systemMetrics.activeProjects = await this.getActiveProjects()
            this.systemMetrics.activeSheets = await this.getActiveSheets()
            this.systemMetrics.totalRequests = await this.getTotalRequests()
            this.systemMetrics.errorRate = await this.getErrorRate()
            this.systemMetrics.responseTime = await this.getResponseTime()
            
        } catch (error) {
            logger.error('Error updating system metrics:', error)
        }
    }

    /**
     * Update project metrics
     */
    private async updateProjectMetrics(): Promise<void> {
        try {
            const projects = await Project.find({ status: 'active' })
            
            for (const project of projects) {
                const projectId = project._id.toString()
                
                // Get project data
                const [sheets, files, messages, users] = await Promise.all([
                    Sheet.find({ projectId }),
                    File.find({ projectId }),
                    ChatMessage.find({ projectId }).sort({ timestamp: -1 }).limit(100),
                    User.find({ _id: { $in: project.assignedUsers } })
                ])
                
                // Calculate metrics
                const metrics = await this.calculateProjectMetrics(project, sheets, files, messages, users)
                const alerts = this.generateProjectAlerts(metrics, project)
                
                const projectMetrics: ProjectMetrics = {
                    projectId,
                    projectName: project.name,
                    metrics,
                    alerts
                }
                
                this.projectMetrics.set(projectId, projectMetrics)
            }
            
        } catch (error) {
            logger.error('Error updating project metrics:', error)
        }
    }

    /**
     * Update business metrics
     */
    private async updateBusinessMetrics(): Promise<void> {
        try {
            const now = new Date()
            const lastHour = new Date(now.getTime() - 60 * 60 * 1000)
            
            // Get recent activity
            const [recentProjects, recentSheets, recentFiles, recentMessages] = await Promise.all([
                Project.countDocuments({ createdAt: { $gte: lastHour } }),
                Sheet.countDocuments({ 'metadata.lastModified': { $gte: lastHour } }),
                File.countDocuments({ createdAt: { $gte: lastHour } }),
                ChatMessage.countDocuments({ timestamp: { $gte: lastHour } })
            ])
            
            this.systemMetrics.projectsCreated = recentProjects
            this.systemMetrics.sheetsModified = recentSheets
            this.systemMetrics.filesUploaded = recentFiles
            this.systemMetrics.messagesSent = recentMessages
            
            // Calculate collaboration score
            this.systemMetrics.collaborationScore = await this.calculateCollaborationScore()
            
        } catch (error) {
            logger.error('Error updating business metrics:', error)
        }
    }

    /**
     * Calculate project metrics
     */
    private async calculateProjectMetrics(project: any, sheets: any[], files: any[], messages: any[], users: any[]) {
        const now = new Date()
        const lastHour = new Date(now.getTime() - 60 * 60 * 1000)
        
        // Activity metrics
        const activeUsers = users.filter(user => user.isActive).length
        const recentActivity = messages.filter(msg => 
            new Date(msg.timestamp) >= lastHour
        ).length
        const collaborationLevel = this.calculateCollaborationLevel(messages, users)
        
        // Performance metrics
        const productivityScore = this.calculateProductivityScore(sheets, messages, lastHour)
        const qualityScore = this.calculateQualityScore(sheets, files)
        const efficiencyScore = this.calculateEfficiencyScore(sheets, project)
        
        // Resource metrics
        const storageUsed = files.reduce((sum, file) => sum + (file.size || 0), 0)
        const bandwidthUsed = this.calculateBandwidthUsed(files, lastHour)
        const processingTime = this.calculateProcessingTime(sheets, files)
        
        // Business metrics
        const progressRate = this.calculateProgressRate(project, sheets)
        const budgetUtilization = this.calculateBudgetUtilization(project, sheets)
        const timelineAdherence = this.calculateTimelineAdherence(project, sheets)
        
        return {
            activeUsers,
            recentActivity,
            collaborationLevel,
            productivityScore,
            qualityScore,
            efficiencyScore,
            storageUsed,
            bandwidthUsed,
            processingTime,
            progressRate,
            budgetUtilization,
            timelineAdherence
        }
    }

    /**
     * Generate project alerts
     */
    private generateProjectAlerts(metrics: any, project: any): Array<any> {
        const alerts = []
        
        // Performance alerts
        if (metrics.productivityScore < 30) {
            alerts.push({
                type: 'performance',
                severity: 'high',
                message: 'פרודוקטיביות נמוכה בפרויקט',
                timestamp: new Date()
            })
        }
        
        // Resource alerts
        if (metrics.storageUsed > 1024 * 1024 * 1024) { // 1GB
            alerts.push({
                type: 'resource',
                severity: 'medium',
                message: 'שימוש גבוה באחסון',
                timestamp: new Date()
            })
        }
        
        // Business alerts
        if (metrics.budgetUtilization > 90) {
            alerts.push({
                type: 'business',
                severity: 'critical',
                message: 'פרויקט עובר את התקציב',
                timestamp: new Date()
            })
        }
        
        if (metrics.timelineAdherence < 50) {
            alerts.push({
                type: 'business',
                severity: 'high',
                message: 'פרויקט מאחר בלוח הזמנים',
                timestamp: new Date()
            })
        }
        
        return alerts
    }

    // Helper methods for system metrics
    private getCPUUsage(): number {
        // Simplified CPU usage calculation
        return Math.random() * 100
    }

    private getMemoryUsage(): number {
        // Simplified memory usage calculation
        return Math.random() * 100
    }

    private getDiskUsage(): number {
        // Simplified disk usage calculation
        return Math.random() * 100
    }

    private getNetworkLatency(): number {
        // Simplified network latency calculation
        return Math.random() * 100
    }

    private async getDatabaseConnections(): Promise<number> {
        // Simplified database connections count
        return Math.floor(Math.random() * 50) + 10
    }

    private async getDatabaseQueryTime(): Promise<number> {
        // Simplified database query time
        return Math.random() * 100
    }

    private async getDatabaseOperations(): Promise<number> {
        // Simplified database operations count
        return Math.floor(Math.random() * 1000) + 100
    }

    private async getActiveUsers(): Promise<number> {
        try {
            return await User.countDocuments({ isActive: true })
        } catch (error) {
            return 0
        }
    }

    private async getActiveProjects(): Promise<number> {
        try {
            return await Project.countDocuments({ status: 'active' })
        } catch (error) {
            return 0
        }
    }

    private async getActiveSheets(): Promise<number> {
        try {
            return await Sheet.countDocuments({})
        } catch (error) {
            return 0
        }
    }

    private async getTotalRequests(): Promise<number> {
        // Simplified request count
        return Math.floor(Math.random() * 10000) + 1000
    }

    private async getErrorRate(): Promise<number> {
        // Simplified error rate calculation
        return Math.random() * 5
    }

    private async getResponseTime(): Promise<number> {
        // Simplified response time calculation
        return Math.random() * 500 + 50
    }

    private async calculateCollaborationScore(): Promise<number> {
        try {
            const messages = await ChatMessage.find({})
            const uniqueUsers = new Set(messages.map(m => m.userId)).size
            const totalUsers = await User.countDocuments()
            
            return totalUsers > 0 ? Math.round((uniqueUsers / totalUsers) * 100) : 0
        } catch (error) {
            return 0
        }
    }

    // Helper methods for project metrics
    private calculateCollaborationLevel(messages: any[], users: any[]): number {
        if (users.length === 0) return 0
        
        const uniqueMessageUsers = new Set(messages.map(m => m.userId)).size
        return Math.round((uniqueMessageUsers / users.length) * 100)
    }

    private calculateProductivityScore(sheets: any[], messages: any[], lastHour: Date): number {
        const recentSheets = sheets.filter(sheet => 
            sheet.metadata?.lastModified && new Date(sheet.metadata.lastModified) >= lastHour
        ).length
        
        const recentMessages = messages.filter(msg => 
            new Date(msg.timestamp) >= lastHour
        ).length
        
        return Math.min(100, (recentSheets * 10) + (recentMessages * 2))
    }

    private calculateQualityScore(sheets: any[], files: any[]): number {
        const totalItems = sheets.length + files.length
        if (totalItems === 0) return 0
        
        const qualityItems = sheets.filter(sheet => 
            sheet.metadata?.version > 1 && sheet.cells.length > 0
        ).length + files.filter(file => 
            file.size > 0 && file.mimetype
        ).length
        
        return Math.round((qualityItems / totalItems) * 100)
    }

    private calculateEfficiencyScore(sheets: any[], project: any): number {
        if (sheets.length === 0) return 0
        
        const avgVersion = sheets.reduce((sum, sheet) => 
            sum + (sheet.metadata?.version || 1), 0
        ) / sheets.length
        
        return Math.min(100, avgVersion * 20)
    }

    private calculateBandwidthUsed(files: any[], lastHour: Date): number {
        return files.filter(file => 
            new Date(file.createdAt) >= lastHour
        ).reduce((sum, file) => sum + (file.size || 0), 0)
    }

    private calculateProcessingTime(sheets: any[], files: any[]): number {
        // Simplified processing time calculation
        return (sheets.length + files.length) * 0.1
    }

    private calculateProgressRate(project: any, sheets: any[]): number {
        if (project.status === 'completed') return 100
        if (project.status === 'cancelled') return 0
        
        const completedSheets = sheets.filter(sheet => 
            sheet.metadata?.version > 2 && sheet.cells.length > 0
        ).length
        
        return sheets.length > 0 ? Math.round((completedSheets / sheets.length) * 100) : 0
    }

    private calculateBudgetUtilization(project: any, sheets: any[]): number {
        if (!project.budget || project.budget === 0) return 0
        
        const spent = sheets.reduce((sum, sheet) => {
            if (['boq', 'costs', 'estimate'].includes(sheet.type)) {
                return sum + sheet.cells.reduce((cellSum, cell) => {
                    if (cell.type === 'currency' && typeof cell.value === 'number') {
                        return cellSum + cell.value
                    }
                    return cellSum
                }, 0)
            }
            return sum
        }, 0)
        
        return Math.round((spent / project.budget) * 100)
    }

    private calculateTimelineAdherence(project: any, sheets: any[]): number {
        if (!project.startDate || !project.endDate) return 0
        
        const now = new Date()
        const startDate = new Date(project.startDate)
        const endDate = new Date(project.endDate)
        
        const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
        const elapsedDays = Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
        
        if (totalDays === 0) return 0
        
        const expectedProgress = Math.min(100, (elapsedDays / totalDays) * 100)
        const actualProgress = this.calculateProgressRate(project, sheets)
        
        return Math.round(Math.max(0, 100 - Math.abs(expectedProgress - actualProgress)))
    }
}

export default new RealTimeMetricsService()
