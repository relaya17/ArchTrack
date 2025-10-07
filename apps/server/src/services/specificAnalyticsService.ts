/**
 * Specific Analytics Service
 * Construction Master App - Project, User, and File Analytics
 */

import Project from '../models/Project'
import Sheet from '../models/Sheet'
import File from '../models/File'
import User from '../models/User'
import ChatMessage from '../models/ChatMessage'
import logger from '../config/logger'

interface ProjectAnalytics {
    projectId: string
    projectName: string
    metrics: {
        // Activity metrics
        totalActivity: number
        dailyActivity: Array<{ date: string; activity: number }>
        peakActivityHours: number[]
        
        // Collaboration metrics
        collaborationScore: number
        teamEngagement: number
        communicationFrequency: number
        
        // Productivity metrics
        productivityScore: number
        taskCompletionRate: number
        efficiencyTrend: 'improving' | 'declining' | 'stable'
        
        // Quality metrics
        qualityScore: number
        errorRate: number
        revisionFrequency: number
        
        // Resource metrics
        resourceUtilization: number
        budgetEfficiency: number
        timelineAdherence: number
    }
    insights: Array<{
        type: 'positive' | 'negative' | 'neutral'
        category: 'productivity' | 'collaboration' | 'quality' | 'timeline' | 'budget'
        message: string
        impact: 'high' | 'medium' | 'low'
        recommendation?: string
    }>
    alerts: Array<{
        type: 'warning' | 'error' | 'info'
        message: string
        severity: 'high' | 'medium' | 'low'
        timestamp: Date
    }>
}

interface UserAnalytics {
    userId: string
    userName: string
    metrics: {
        // Activity patterns
        loginFrequency: number
        sessionDuration: number
        activeHours: number[]
        workPatterns: Array<{ day: string; hours: number }>
        
        // Productivity metrics
        productivityScore: number
        taskCompletionRate: number
        collaborationScore: number
        responseTime: number
        
        // Project involvement
        projectsCount: number
        sheetsCreated: number
        filesUploaded: number
        messagesSent: number
        
        // Performance trends
        performanceTrend: 'improving' | 'declining' | 'stable'
        engagementLevel: 'high' | 'medium' | 'low'
        skillLevel: 'beginner' | 'intermediate' | 'advanced'
    }
    insights: Array<{
        type: 'positive' | 'negative' | 'neutral'
        category: 'productivity' | 'collaboration' | 'performance' | 'engagement'
        message: string
        impact: 'high' | 'medium' | 'low'
        recommendation?: string
    }>
    recommendations: Array<{
        category: 'training' | 'workload' | 'collaboration' | 'tools'
        priority: 'high' | 'medium' | 'low'
        action: string
        expectedImpact: string
    }>
}

interface FileAnalytics {
    period: string
    metrics: {
        // Storage metrics
        totalStorage: number
        storageByType: Record<string, number>
        storageTrend: Array<{ date: string; size: number }>
        
        // Usage metrics
        totalFiles: number
        uploadsByDay: Array<{ date: string; count: number }>
        downloadsByDay: Array<{ date: string; count: number }>
        popularFileTypes: Array<{ type: string; count: number; size: number }>
        
        // Performance metrics
        averageFileSize: number
        uploadSuccessRate: number
        downloadSuccessRate: number
        processingTime: number
        
        // User behavior
        mostActiveUsers: Array<{ userId: string; name: string; activity: number }>
        fileSharingPatterns: Array<{ pattern: string; frequency: number }>
    }
    insights: Array<{
        type: 'positive' | 'negative' | 'neutral'
        category: 'storage' | 'performance' | 'usage' | 'security'
        message: string
        impact: 'high' | 'medium' | 'low'
        recommendation?: string
    }>
    alerts: Array<{
        type: 'warning' | 'error' | 'info'
        message: string
        severity: 'high' | 'medium' | 'low'
        timestamp: Date
    }>
}

class SpecificAnalyticsService {
    
    /**
     * Get project-specific analytics
     */
    async getProjectAnalytics(projectId: string): Promise<ProjectAnalytics> {
        try {
            const project = await Project.findById(projectId)
            if (!project) {
                throw new Error('Project not found')
            }

            // Get all related data
            const [sheets, files, messages, users] = await Promise.all([
                Sheet.find({ projectId }),
                File.find({ projectId }),
                ChatMessage.find({ projectId }).sort({ timestamp: -1 }),
                User.find({ _id: { $in: project.assignedUsers } })
            ])

            // Calculate metrics
            const metrics = await this.calculateProjectMetrics(project, sheets, files, messages, users)
            
            // Generate insights
            const insights = this.generateProjectInsights(metrics, project)
            
            // Generate alerts
            const alerts = this.generateProjectAlerts(metrics, project)

            return {
                projectId,
                projectName: project.name,
                metrics,
                insights,
                alerts
            }

        } catch (error) {
            logger.error('Error getting project analytics:', error)
            throw error
        }
    }

    /**
     * Get user activity analytics
     */
    async getUserAnalytics(userId: string): Promise<UserAnalytics> {
        try {
            const user = await User.findById(userId)
            if (!user) {
                throw new Error('User not found')
            }

            // Get user's projects
            const projects = await Project.find({ assignedUsers: userId })
            
            // Get user's activity data
            const [sheets, files, messages] = await Promise.all([
                Sheet.find({ createdBy: userId }),
                File.find({ uploadedBy: userId }),
                ChatMessage.find({ userId })
            ])

            // Calculate metrics
            const metrics = await this.calculateUserMetrics(user, projects, sheets, files, messages)
            
            // Generate insights
            const insights = this.generateUserInsights(metrics, user)
            
            // Generate recommendations
            const recommendations = this.generateUserRecommendations(metrics, user)

            return {
                userId,
                userName: user.name,
                metrics,
                insights,
                recommendations
            }

        } catch (error) {
            logger.error('Error getting user analytics:', error)
            throw error
        }
    }

    /**
     * Get file usage analytics
     */
    async getFileAnalytics(period: string = '30d'): Promise<FileAnalytics> {
        try {
            // Calculate date range
            const days = parseInt(period.replace('d', ''))
            const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
            
            // Get files within period
            const files = await File.find({
                createdAt: { $gte: startDate }
            }).populate('uploadedBy', 'name')

            // Calculate metrics
            const metrics = await this.calculateFileMetrics(files, startDate)
            
            // Generate insights
            const insights = this.generateFileInsights(metrics, files)
            
            // Generate alerts
            const alerts = this.generateFileAlerts(metrics, files)

            return {
                period,
                metrics,
                insights,
                alerts
            }

        } catch (error) {
            logger.error('Error getting file analytics:', error)
            throw error
        }
    }

    /**
     * Calculate project metrics
     */
    private async calculateProjectMetrics(project: any, sheets: any[], files: any[], messages: any[], users: any[]) {
        const now = new Date()
        const startDate = project.startDate || new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        
        // Activity metrics
        const totalActivity = messages.length + sheets.length + files.length
        const dailyActivity = this.calculateDailyActivity(messages, sheets, startDate)
        const peakActivityHours = this.calculatePeakActivityHours(messages)
        
        // Collaboration metrics
        const collaborationScore = this.calculateCollaborationScore(messages, users)
        const teamEngagement = this.calculateTeamEngagement(users, messages)
        const communicationFrequency = this.calculateCommunicationFrequency(messages, startDate)
        
        // Productivity metrics
        const productivityScore = this.calculateProductivityScore(sheets, messages, startDate)
        const taskCompletionRate = this.calculateTaskCompletionRate(sheets)
        const efficiencyTrend = this.calculateEfficiencyTrend(sheets, startDate)
        
        // Quality metrics
        const qualityScore = this.calculateQualityScore(sheets, files)
        const errorRate = this.calculateErrorRate(sheets)
        const revisionFrequency = this.calculateRevisionFrequency(sheets)
        
        // Resource metrics
        const resourceUtilization = this.calculateResourceUtilization(users, project)
        const budgetEfficiency = this.calculateBudgetEfficiency(project, sheets)
        const timelineAdherence = this.calculateTimelineAdherence(project, sheets)

        return {
            totalActivity,
            dailyActivity,
            peakActivityHours,
            collaborationScore,
            teamEngagement,
            communicationFrequency,
            productivityScore,
            taskCompletionRate,
            efficiencyTrend,
            qualityScore,
            errorRate,
            revisionFrequency,
            resourceUtilization,
            budgetEfficiency,
            timelineAdherence
        }
    }

    /**
     * Calculate user metrics
     */
    private async calculateUserMetrics(user: any, projects: any[], sheets: any[], files: any[], messages: any[]) {
        const now = new Date()
        const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        
        // Activity patterns
        const loginFrequency = this.calculateLoginFrequency(user)
        const sessionDuration = this.calculateSessionDuration(user)
        const activeHours = this.calculateActiveHours(messages)
        const workPatterns = this.calculateWorkPatterns(messages)
        
        // Productivity metrics
        const productivityScore = this.calculateUserProductivityScore(sheets, messages, lastWeek)
        const taskCompletionRate = this.calculateUserTaskCompletionRate(sheets)
        const collaborationScore = this.calculateUserCollaborationScore(messages, projects)
        const responseTime = this.calculateResponseTime(messages)
        
        // Project involvement
        const projectsCount = projects.length
        const sheetsCreated = sheets.length
        const filesUploaded = files.length
        const messagesSent = messages.length
        
        // Performance trends
        const performanceTrend = this.calculatePerformanceTrend(sheets, messages)
        const engagementLevel = this.calculateEngagementLevel(messages, lastWeek)
        const skillLevel = this.calculateSkillLevel(sheets, files)

        return {
            loginFrequency,
            sessionDuration,
            activeHours,
            workPatterns,
            productivityScore,
            taskCompletionRate,
            collaborationScore,
            responseTime,
            projectsCount,
            sheetsCreated,
            filesUploaded,
            messagesSent,
            performanceTrend,
            engagementLevel,
            skillLevel
        }
    }

    /**
     * Calculate file metrics
     */
    private async calculateFileMetrics(files: any[], startDate: Date) {
        // Storage metrics
        const totalStorage = files.reduce((sum, file) => sum + (file.size || 0), 0)
        const storageByType = this.calculateStorageByType(files)
        const storageTrend = this.calculateStorageTrend(files, startDate)
        
        // Usage metrics
        const totalFiles = files.length
        const uploadsByDay = this.calculateUploadsByDay(files, startDate)
        const downloadsByDay = this.calculateDownloadsByDay(files, startDate)
        const popularFileTypes = this.calculatePopularFileTypes(files)
        
        // Performance metrics
        const averageFileSize = totalFiles > 0 ? totalStorage / totalFiles : 0
        const uploadSuccessRate = this.calculateUploadSuccessRate(files)
        const downloadSuccessRate = this.calculateDownloadSuccessRate(files)
        const processingTime = this.calculateProcessingTime(files)
        
        // User behavior
        const mostActiveUsers = this.calculateMostActiveUsers(files)
        const fileSharingPatterns = this.calculateFileSharingPatterns(files)

        return {
            totalStorage,
            storageByType,
            storageTrend,
            totalFiles,
            uploadsByDay,
            downloadsByDay,
            popularFileTypes,
            averageFileSize,
            uploadSuccessRate,
            downloadSuccessRate,
            processingTime,
            mostActiveUsers,
            fileSharingPatterns
        }
    }

    // Helper methods for calculations
    private calculateDailyActivity(messages: any[], sheets: any[], startDate: Date): Array<{ date: string; activity: number }> {
        const activity: Record<string, number> = {}
        const now = new Date()
        
        // Process messages
        messages.forEach(msg => {
            const date = new Date(msg.timestamp).toISOString().split('T')[0]
            if (new Date(date) >= startDate) {
                activity[date] = (activity[date] || 0) + 1
            }
        })
        
        // Process sheet updates
        sheets.forEach(sheet => {
            if (sheet.metadata?.lastModified) {
                const date = new Date(sheet.metadata.lastModified).toISOString().split('T')[0]
                if (new Date(date) >= startDate) {
                    activity[date] = (activity[date] || 0) + 1
                }
            }
        })
        
        return Object.entries(activity)
            .map(([date, activity]) => ({ date, activity }))
            .sort((a, b) => a.date.localeCompare(b.date))
    }

    private calculatePeakActivityHours(messages: any[]): number[] {
        const hourCounts: Record<number, number> = {}
        
        messages.forEach(msg => {
            const hour = new Date(msg.timestamp).getHours()
            hourCounts[hour] = (hourCounts[hour] || 0) + 1
        })
        
        return Object.entries(hourCounts)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 3)
            .map(([hour]) => parseInt(hour))
    }

    private calculateCollaborationScore(messages: any[], users: any[]): number {
        if (users.length === 0) return 0
        
        const uniqueMessageUsers = new Set(messages.map(m => m.userId)).size
        return Math.round((uniqueMessageUsers / users.length) * 100)
    }

    private calculateTeamEngagement(users: any[], messages: any[]): number {
        if (users.length === 0) return 0
        
        const activeUsers = users.filter(user => 
            messages.some(msg => msg.userId === user._id.toString())
        ).length
        
        return Math.round((activeUsers / users.length) * 100)
    }

    private calculateCommunicationFrequency(messages: any[], startDate: Date): number {
        const days = Math.ceil((Date.now() - startDate.getTime()) / (1000 * 60 * 60 * 24))
        return days > 0 ? Math.round(messages.length / days) : 0
    }

    private calculateProductivityScore(sheets: any[], messages: any[], startDate: Date): number {
        const recentSheets = sheets.filter(sheet => 
            sheet.metadata?.lastModified && new Date(sheet.metadata.lastModified) >= startDate
        ).length
        
        const recentMessages = messages.filter(msg => 
            new Date(msg.timestamp) >= startDate
        ).length
        
        return Math.min(100, (recentSheets * 10) + (recentMessages * 2))
    }

    private calculateTaskCompletionRate(sheets: any[]): number {
        if (sheets.length === 0) return 0
        
        const completedSheets = sheets.filter(sheet => 
            sheet.metadata?.version > 2 && sheet.cells.length > 0
        ).length
        
        return Math.round((completedSheets / sheets.length) * 100)
    }

    private calculateEfficiencyTrend(sheets: any[], startDate: Date): 'improving' | 'declining' | 'stable' {
        const recentSheets = sheets.filter(sheet => 
            sheet.metadata?.lastModified && new Date(sheet.metadata.lastModified) >= startDate
        )
        
        if (recentSheets.length === 0) return 'stable'
        
        // Simple trend calculation based on version numbers
        const avgVersion = recentSheets.reduce((sum, sheet) => 
            sum + (sheet.metadata?.version || 1), 0
        ) / recentSheets.length
        
        if (avgVersion > 3) return 'improving'
        if (avgVersion < 2) return 'declining'
        return 'stable'
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

    private calculateErrorRate(sheets: any[]): number {
        if (sheets.length === 0) return 0
        
        const totalRevisions = sheets.reduce((sum, sheet) => 
            sum + (sheet.metadata?.version || 1), 0
        )
        
        const expectedRevisions = sheets.length
        const excessRevisions = Math.max(0, totalRevisions - expectedRevisions)
        
        return Math.round((excessRevisions / expectedRevisions) * 100)
    }

    private calculateRevisionFrequency(sheets: any[]): number {
        if (sheets.length === 0) return 0
        
        const totalRevisions = sheets.reduce((sum, sheet) => 
            sum + (sheet.metadata?.version || 1), 0
        )
        
        return Math.round(totalRevisions / sheets.length)
    }

    private calculateResourceUtilization(users: any[], project: any): number {
        const activeUsers = users.filter(user => user.isActive).length
        const totalUsers = users.length
        
        return totalUsers > 0 ? Math.round((activeUsers / totalUsers) * 100) : 0
    }

    private calculateBudgetEfficiency(project: any, sheets: any[]): number {
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
        const actualProgress = this.calculateTaskCompletionRate(sheets)
        
        return Math.round(Math.max(0, 100 - Math.abs(expectedProgress - actualProgress)))
    }

    // Additional helper methods for user analytics
    private calculateLoginFrequency(user: any): number {
        // Simplified calculation - in real implementation, track login events
        return user.lastLogin ? 1 : 0
    }

    private calculateSessionDuration(user: any): number {
        // Simplified calculation - in real implementation, track session data
        return 60 // minutes
    }

    private calculateActiveHours(messages: any[]): number[] {
        const hourCounts: Record<number, number> = {}
        
        messages.forEach(msg => {
            const hour = new Date(msg.timestamp).getHours()
            hourCounts[hour] = (hourCounts[hour] || 0) + 1
        })
        
        return Object.entries(hourCounts)
            .filter(([, count]) => count > 0)
            .map(([hour]) => parseInt(hour))
            .sort((a, b) => b - a)
    }

    private calculateWorkPatterns(messages: any[]): Array<{ day: string; hours: number }> {
        const patterns: Record<string, number> = {}
        
        messages.forEach(msg => {
            const date = new Date(msg.timestamp)
            const day = date.toLocaleDateString('en-US', { weekday: 'long' })
            patterns[day] = (patterns[day] || 0) + 1
        })
        
        return Object.entries(patterns)
            .map(([day, hours]) => ({ day, hours }))
            .sort((a, b) => b.hours - a.hours)
    }

    private calculateUserProductivityScore(sheets: any[], messages: any[], startDate: Date): number {
        const recentSheets = sheets.filter(sheet => 
            sheet.metadata?.lastModified && new Date(sheet.metadata.lastModified) >= startDate
        ).length
        
        const recentMessages = messages.filter(msg => 
            new Date(msg.timestamp) >= startDate
        ).length
        
        return Math.min(100, (recentSheets * 15) + (recentMessages * 3))
    }

    private calculateUserTaskCompletionRate(sheets: any[]): number {
        if (sheets.length === 0) return 0
        
        const completedSheets = sheets.filter(sheet => 
            sheet.metadata?.version > 2 && sheet.cells.length > 5
        ).length
        
        return Math.round((completedSheets / sheets.length) * 100)
    }

    private calculateUserCollaborationScore(messages: any[], projects: any[]): number {
        if (projects.length === 0) return 0
        
        const uniqueProjects = new Set(messages.map(m => m.projectId)).size
        return Math.round((uniqueProjects / projects.length) * 100)
    }

    private calculateResponseTime(messages: any[]): number {
        if (messages.length < 2) return 0
        
        const sortedMessages = messages.sort((a, b) => 
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        )
        
        let totalTime = 0
        let count = 0
        
        for (let i = 1; i < sortedMessages.length; i++) {
            const timeDiff = new Date(sortedMessages[i].timestamp).getTime() - 
                           new Date(sortedMessages[i-1].timestamp).getTime()
            totalTime += timeDiff
            count++
        }
        
        return count > 0 ? Math.round(totalTime / count / (1000 * 60)) : 0 // minutes
    }

    private calculatePerformanceTrend(sheets: any[], messages: any[]): 'improving' | 'declining' | 'stable' {
        const recentSheets = sheets.filter(sheet => 
            sheet.metadata?.lastModified && 
            new Date(sheet.metadata.lastModified) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        )
        
        if (recentSheets.length === 0) return 'stable'
        
        const avgVersion = recentSheets.reduce((sum, sheet) => 
            sum + (sheet.metadata?.version || 1), 0
        ) / recentSheets.length
        
        if (avgVersion > 3) return 'improving'
        if (avgVersion < 2) return 'declining'
        return 'stable'
    }

    private calculateEngagementLevel(messages: any[], startDate: Date): 'high' | 'medium' | 'low' {
        const recentMessages = messages.filter(msg => 
            new Date(msg.timestamp) >= startDate
        ).length
        
        if (recentMessages > 20) return 'high'
        if (recentMessages > 5) return 'medium'
        return 'low'
    }

    private calculateSkillLevel(sheets: any[], files: any[]): 'beginner' | 'intermediate' | 'advanced' {
        const totalItems = sheets.length + files.length
        
        if (totalItems < 5) return 'beginner'
        if (totalItems < 20) return 'intermediate'
        return 'advanced'
    }

    // File analytics helper methods
    private calculateStorageByType(files: any[]): Record<string, number> {
        const storage: Record<string, number> = {}
        
        files.forEach(file => {
            const type = file.mimetype?.split('/')[0] || 'unknown'
            storage[type] = (storage[type] || 0) + (file.size || 0)
        })
        
        return storage
    }

    private calculateStorageTrend(files: any[], startDate: Date): Array<{ date: string; size: number }> {
        const trend: Record<string, number> = {}
        
        files.forEach(file => {
            const date = new Date(file.createdAt).toISOString().split('T')[0]
            if (new Date(date) >= startDate) {
                trend[date] = (trend[date] || 0) + (file.size || 0)
            }
        })
        
        return Object.entries(trend)
            .map(([date, size]) => ({ date, size }))
            .sort((a, b) => a.date.localeCompare(b.date))
    }

    private calculateUploadsByDay(files: any[], startDate: Date): Array<{ date: string; count: number }> {
        const uploads: Record<string, number> = {}
        
        files.forEach(file => {
            const date = new Date(file.createdAt).toISOString().split('T')[0]
            if (new Date(date) >= startDate) {
                uploads[date] = (uploads[date] || 0) + 1
            }
        })
        
        return Object.entries(uploads)
            .map(([date, count]) => ({ date, count }))
            .sort((a, b) => a.date.localeCompare(b.date))
    }

    private calculateDownloadsByDay(files: any[], startDate: Date): Array<{ date: string; count: number }> {
        // Simplified - in real implementation, track download events
        return []
    }

    private calculatePopularFileTypes(files: any[]): Array<{ type: string; count: number; size: number }> {
        const types: Record<string, { count: number; size: number }> = {}
        
        files.forEach(file => {
            const type = file.originalName?.split('.').pop()?.toLowerCase() || 'unknown'
            if (!types[type]) {
                types[type] = { count: 0, size: 0 }
            }
            types[type].count++
            types[type].size += file.size || 0
        })
        
        return Object.entries(types)
            .map(([type, data]) => ({ type, ...data }))
            .sort((a, b) => b.count - a.count)
    }

    private calculateUploadSuccessRate(files: any[]): number {
        // Simplified - assume all files are successful uploads
        return 100
    }

    private calculateDownloadSuccessRate(files: any[]): number {
        // Simplified - assume all files can be downloaded
        return 100
    }

    private calculateProcessingTime(files: any[]): number {
        // Simplified - assume average processing time
        return 2 // seconds
    }

    private calculateMostActiveUsers(files: any[]): Array<{ userId: string; name: string; activity: number }> {
        const userActivity: Record<string, { name: string; count: number }> = {}
        
        files.forEach(file => {
            if (file.uploadedBy) {
                const userId = file.uploadedBy._id?.toString() || file.uploadedBy.toString()
                const name = file.uploadedBy.name || 'Unknown User'
                
                if (!userActivity[userId]) {
                    userActivity[userId] = { name, count: 0 }
                }
                userActivity[userId].count++
            }
        })
        
        return Object.entries(userActivity)
            .map(([userId, data]) => ({ userId, name: data.name, activity: data.count }))
            .sort((a, b) => b.activity - a.activity)
            .slice(0, 10)
    }

    private calculateFileSharingPatterns(files: any[]): Array<{ pattern: string; frequency: number }> {
        // Simplified - analyze file sharing patterns
        return [
            { pattern: 'Direct upload', frequency: files.length },
            { pattern: 'Bulk upload', frequency: Math.floor(files.length / 5) },
            { pattern: 'Shared files', frequency: Math.floor(files.length / 10) }
        ]
    }

    // Insight generation methods
    private generateProjectInsights(metrics: any, project: any): Array<any> {
        const insights = []
        
        if (metrics.productivityScore > 80) {
            insights.push({
                type: 'positive',
                category: 'productivity',
                message: 'פרויקט מראה פרודוקטיביות גבוהה',
                impact: 'high',
                recommendation: 'המשך עם הגישה הנוכחית'
            })
        }
        
        if (metrics.collaborationScore < 50) {
            insights.push({
                type: 'negative',
                category: 'collaboration',
                message: 'רמת שיתוף הפעולה נמוכה',
                impact: 'medium',
                recommendation: 'עודד תקשורת בין חברי הצוות'
            })
        }
        
        if (metrics.errorRate > 20) {
            insights.push({
                type: 'negative',
                category: 'quality',
                message: 'שיעור שגיאות גבוה',
                impact: 'high',
                recommendation: 'בדוק תהליכי עבודה ושיפור איכות'
            })
        }
        
        return insights
    }

    private generateUserInsights(metrics: any, user: any): Array<any> {
        const insights = []
        
        if (metrics.productivityScore > 85) {
            insights.push({
                type: 'positive',
                category: 'productivity',
                message: 'ביצועים מעולים',
                impact: 'high'
            })
        }
        
        if (metrics.engagementLevel === 'low') {
            insights.push({
                type: 'negative',
                category: 'engagement',
                message: 'רמת מעורבות נמוכה',
                impact: 'medium',
                recommendation: 'חפש דרכים להגברת המעורבות'
            })
        }
        
        return insights
    }

    private generateUserRecommendations(metrics: any, user: any): Array<any> {
        const recommendations = []
        
        if (metrics.skillLevel === 'beginner') {
            recommendations.push({
                category: 'training',
                priority: 'high',
                action: 'השתתף בהדרכות בסיסיות',
                expectedImpact: 'שיפור מיומנויות בסיסיות'
            })
        }
        
        if (metrics.collaborationScore < 60) {
            recommendations.push({
                category: 'collaboration',
                priority: 'medium',
                action: 'השתתף יותר בדיונים קבוצתיים',
                expectedImpact: 'שיפור שיתוף פעולה'
            })
        }
        
        return recommendations
    }

    private generateFileInsights(metrics: any, files: any[]): Array<any> {
        const insights = []
        
        if (metrics.totalStorage > 1024 * 1024 * 1024) { // 1GB
            insights.push({
                type: 'warning',
                category: 'storage',
                message: 'שימוש גבוה באחסון',
                impact: 'medium',
                recommendation: 'חשב על ניקוי קבצים ישנים'
            })
        }
        
        if (metrics.uploadSuccessRate < 95) {
            insights.push({
                type: 'negative',
                category: 'performance',
                message: 'שיעור הצלחה נמוך בהעלאת קבצים',
                impact: 'high',
                recommendation: 'בדוק בעיות רשת או הגדרות שרת'
            })
        }
        
        return insights
    }

    private generateProjectAlerts(metrics: any, project: any): Array<any> {
        const alerts = []
        
        if (metrics.budgetEfficiency > 90) {
            alerts.push({
                type: 'warning',
                message: 'פרויקט עובר את התקציב',
                severity: 'high',
                timestamp: new Date()
            })
        }
        
        if (metrics.timelineAdherence < 50) {
            alerts.push({
                type: 'warning',
                message: 'פרויקט מאחר בלוח הזמנים',
                severity: 'medium',
                timestamp: new Date()
            })
        }
        
        return alerts
    }

    private generateFileAlerts(metrics: any, files: any[]): Array<any> {
        const alerts = []
        
        if (metrics.totalStorage > 5 * 1024 * 1024 * 1024) { // 5GB
            alerts.push({
                type: 'warning',
                message: 'שימוש גבוה באחסון - שקול ניקוי',
                severity: 'medium',
                timestamp: new Date()
            })
        }
        
        return alerts
    }
}

export default new SpecificAnalyticsService()
