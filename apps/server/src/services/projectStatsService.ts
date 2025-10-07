/**
 * Project Statistics Service
 * Construction Master App - Advanced Project Statistics
 */

import Project from '../models/Project'
import Sheet from '../models/Sheet'
import File from '../models/File'
import User from '../models/User'
import ChatMessage from '../models/ChatMessage'
import logger from '../config/logger'

interface ProjectStats {
    // Basic stats
    totalSheets: number
    totalFiles: number
    totalUsers: number
    totalMessages: number
    
    // Budget stats
    budget: number
    spent: number
    remaining: number
    budgetUtilization: number
    costVariance: number
    
    // Progress stats
    progress: number
    completionRate: number
    estimatedCompletion: Date | null
    
    // Timeline stats
    startDate: Date | null
    endDate: Date | null
    daysElapsed: number
    daysRemaining: number
    timelineProgress: number
    
    // Activity stats
    lastActivity: Date | null
    activityLevel: 'low' | 'medium' | 'high'
    averageDailyActivity: number
    
    // Team stats
    teamProductivity: number
    collaborationScore: number
    activeUsers: number
    
    // Quality stats
    errorRate: number
    revisionCount: number
    qualityScore: number
    
    // Risk indicators
    budgetRisk: 'low' | 'medium' | 'high'
    timelineRisk: 'low' | 'medium' | 'high'
    teamRisk: 'low' | 'medium' | 'high'
    overallRisk: 'low' | 'medium' | 'high'
}

interface DetailedProjectStats extends ProjectStats {
    // Detailed breakdowns
    sheetsByType: Record<string, number>
    filesByType: Record<string, number>
    spendingByCategory: Record<string, number>
    activityTimeline: Array<{ date: string; activity: number }>
    teamPerformance: Array<{ userId: string; name: string; productivity: number }>
    
    // Trends
    budgetTrend: 'increasing' | 'decreasing' | 'stable'
    progressTrend: 'accelerating' | 'decelerating' | 'stable'
    teamTrend: 'growing' | 'shrinking' | 'stable'
}

class ProjectStatsService {
    
    /**
     * Get comprehensive project statistics
     */
    async getProjectStats(projectId: string): Promise<ProjectStats> {
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

            // Calculate basic stats
            const totalSheets = sheets.length
            const totalFiles = files.length
            const totalUsers = users.length
            const totalMessages = messages.length

            // Calculate budget stats
            const budget = project.budget || 0
            const spent = this.calculateSpending(sheets)
            const remaining = budget - spent
            const budgetUtilization = budget > 0 ? (spent / budget) * 100 : 0
            const costVariance = budget > 0 ? ((spent - budget) / budget) * 100 : 0

            // Calculate progress stats
            const progress = this.calculateProgress(project, sheets)
            const completionRate = this.calculateCompletionRate(sheets)
            const estimatedCompletion = this.estimateCompletion(project, progress)

            // Calculate timeline stats
            const timelineStats = this.calculateTimelineStats(project)

            // Calculate activity stats
            const activityStats = this.calculateActivityStats(messages, sheets)

            // Calculate team stats
            const teamStats = this.calculateTeamStats(users, messages, sheets)

            // Calculate quality stats
            const qualityStats = this.calculateQualityStats(sheets, files)

            // Calculate risk indicators
            const riskIndicators = this.calculateRiskIndicators({
                budget, spent, budgetUtilization,
                timeline: timelineStats,
                team: teamStats,
                quality: qualityStats
            })

            return {
                // Basic stats
                totalSheets,
                totalFiles,
                totalUsers,
                totalMessages,
                
                // Budget stats
                budget,
                spent,
                remaining,
                budgetUtilization,
                costVariance,
                
                // Progress stats
                progress,
                completionRate,
                estimatedCompletion,
                
                // Timeline stats
                startDate: project.startDate,
                endDate: project.endDate,
                daysElapsed: timelineStats.daysElapsed,
                daysRemaining: timelineStats.daysRemaining,
                timelineProgress: timelineStats.timelineProgress,
                
                // Activity stats
                lastActivity: activityStats.lastActivity,
                activityLevel: activityStats.activityLevel,
                averageDailyActivity: activityStats.averageDailyActivity,
                
                // Team stats
                teamProductivity: teamStats.teamProductivity,
                collaborationScore: teamStats.collaborationScore,
                activeUsers: teamStats.activeUsers,
                
                // Quality stats
                errorRate: qualityStats.errorRate,
                revisionCount: qualityStats.revisionCount,
                qualityScore: qualityStats.qualityScore,
                
                // Risk indicators
                budgetRisk: riskIndicators.budgetRisk,
                timelineRisk: riskIndicators.timelineRisk,
                teamRisk: riskIndicators.teamRisk,
                overallRisk: riskIndicators.overallRisk
            }

        } catch (error) {
            logger.error('Error calculating project stats:', error)
            throw error
        }
    }

    /**
     * Get detailed project statistics with breakdowns
     */
    async getDetailedProjectStats(projectId: string): Promise<DetailedProjectStats> {
        try {
            const basicStats = await this.getProjectStats(projectId)
            
            const [sheets, files, messages] = await Promise.all([
                Sheet.find({ projectId }),
                File.find({ projectId }),
                ChatMessage.find({ projectId }).sort({ timestamp: -1 })
            ])

            // Calculate detailed breakdowns
            const sheetsByType = this.calculateSheetsByType(sheets)
            const filesByType = this.calculateFilesByType(files)
            const spendingByCategory = this.calculateSpendingByCategory(sheets)
            const activityTimeline = this.calculateActivityTimeline(messages, sheets)
            const teamPerformance = await this.calculateTeamPerformance(projectId)

            // Calculate trends
            const trends = this.calculateTrends(basicStats, activityTimeline)

            return {
                ...basicStats,
                sheetsByType,
                filesByType,
                spendingByCategory,
                activityTimeline,
                teamPerformance,
                ...trends
            }

        } catch (error) {
            logger.error('Error calculating detailed project stats:', error)
            throw error
        }
    }

    /**
     * Calculate spending from sheets
     */
    private calculateSpending(sheets: any[]): number {
        let totalSpent = 0
        
        sheets.forEach(sheet => {
            if (['boq', 'costs', 'estimate'].includes(sheet.type)) {
                sheet.cells.forEach((cell: any) => {
                    if (cell.type === 'currency' && typeof cell.value === 'number') {
                        totalSpent += cell.value
                    }
                })
            }
        })
        
        return totalSpent
    }

    /**
     * Calculate project progress
     */
    private calculateProgress(project: any, sheets: any[]): number {
        if (project.status === 'completed') return 100
        if (project.status === 'cancelled') return 0
        
        // Calculate progress based on sheets completion
        const totalSheets = sheets.length
        if (totalSheets === 0) return 0
        
        const completedSheets = sheets.filter(sheet => 
            sheet.metadata?.version > 1 && 
            sheet.cells.length > 0
        ).length
        
        const sheetProgress = (completedSheets / totalSheets) * 100
        
        // Factor in timeline progress
        const timelineProgress = this.calculateTimelineProgress(project)
        
        // Weighted average: 70% sheets, 30% timeline
        return Math.round((sheetProgress * 0.7) + (timelineProgress * 0.3))
    }

    /**
     * Calculate completion rate
     */
    private calculateCompletionRate(sheets: any[]): number {
        if (sheets.length === 0) return 0
        
        const completedSheets = sheets.filter(sheet => 
            sheet.metadata?.version > 2 && 
            sheet.cells.length > 10
        ).length
        
        return Math.round((completedSheets / sheets.length) * 100)
    }

    /**
     * Estimate completion date
     */
    private estimateCompletion(project: any, progress: number): Date | null {
        if (progress >= 100) return new Date()
        if (!project.startDate) return null
        
        const startDate = new Date(project.startDate)
        const now = new Date()
        const daysElapsed = Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
        
        if (progress === 0) return null
        
        const estimatedTotalDays = Math.round((daysElapsed / progress) * 100)
        const estimatedCompletion = new Date(startDate.getTime() + (estimatedTotalDays * 24 * 60 * 60 * 1000))
        
        return estimatedCompletion
    }

    /**
     * Calculate timeline statistics
     */
    private calculateTimelineStats(project: any) {
        const now = new Date()
        const startDate = project.startDate ? new Date(project.startDate) : null
        const endDate = project.endDate ? new Date(project.endDate) : null
        
        let daysElapsed = 0
        let daysRemaining = 0
        let timelineProgress = 0
        
        if (startDate) {
            daysElapsed = Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
            
            if (endDate) {
                const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
                daysRemaining = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
                timelineProgress = Math.min(100, Math.max(0, (daysElapsed / totalDays) * 100))
            }
        }
        
        return { daysElapsed, daysRemaining, timelineProgress }
    }

    /**
     * Calculate timeline progress
     */
    private calculateTimelineProgress(project: any): number {
        const timelineStats = this.calculateTimelineStats(project)
        return timelineStats.timelineProgress
    }

    /**
     * Calculate activity statistics
     */
    private calculateActivityStats(messages: any[], sheets: any[]) {
        const now = new Date()
        const lastWeek = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000))
        
        // Get last activity
        const lastActivity = messages.length > 0 ? 
            new Date(Math.max(...messages.map(m => new Date(m.timestamp).getTime()))) : 
            null
        
        // Calculate activity level
        const recentMessages = messages.filter(m => new Date(m.timestamp) > lastWeek).length
        const recentSheetUpdates = sheets.filter(s => 
            s.metadata?.lastModified && new Date(s.metadata.lastModified) > lastWeek
        ).length
        
        const totalActivity = recentMessages + recentSheetUpdates
        let activityLevel: 'low' | 'medium' | 'high' = 'low'
        
        if (totalActivity > 20) activityLevel = 'high'
        else if (totalActivity > 5) activityLevel = 'medium'
        
        // Calculate average daily activity
        const days = 7
        const averageDailyActivity = totalActivity / days
        
        return {
            lastActivity,
            activityLevel,
            averageDailyActivity
        }
    }

    /**
     * Calculate team statistics
     */
    private calculateTeamStats(users: any[], messages: any[], sheets: any[]) {
        const activeUsers = users.filter(u => u.isActive).length
        const totalUsers = users.length
        
        // Calculate team productivity based on activity
        const recentActivity = messages.filter(m => 
            new Date(m.timestamp) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        ).length
        
        const teamProductivity = totalUsers > 0 ? 
            Math.min(100, (recentActivity / totalUsers) * 10) : 0
        
        // Calculate collaboration score
        const uniqueMessageUsers = new Set(messages.map(m => m.userId)).size
        const collaborationScore = totalUsers > 0 ? 
            (uniqueMessageUsers / totalUsers) * 100 : 0
        
        return {
            teamProductivity: Math.round(teamProductivity),
            collaborationScore: Math.round(collaborationScore),
            activeUsers
        }
    }

    /**
     * Calculate quality statistics
     */
    private calculateQualityStats(sheets: any[], files: any[]) {
        // Calculate error rate based on sheet revisions
        const totalRevisions = sheets.reduce((sum, sheet) => 
            sum + (sheet.metadata?.version || 1), 0
        )
        
        const errorRate = sheets.length > 0 ? 
            Math.max(0, ((totalRevisions - sheets.length) / sheets.length) * 100) : 0
        
        const revisionCount = totalRevisions - sheets.length
        
        // Calculate quality score (inverse of error rate)
        const qualityScore = Math.max(0, 100 - errorRate)
        
        return {
            errorRate: Math.round(errorRate * 100) / 100,
            revisionCount,
            qualityScore: Math.round(qualityScore)
        }
    }

    /**
     * Calculate risk indicators
     */
    private calculateRiskIndicators(data: any) {
        const { budget, spent, budgetUtilization, timeline, team, quality } = data
        
        // Budget risk
        let budgetRisk: 'low' | 'medium' | 'high' = 'low'
        if (budgetUtilization > 90) budgetRisk = 'high'
        else if (budgetUtilization > 70) budgetRisk = 'medium'
        
        // Timeline risk
        let timelineRisk: 'low' | 'medium' | 'high' = 'low'
        if (timeline.daysRemaining < 0) timelineRisk = 'high'
        else if (timeline.daysRemaining < 7) timelineRisk = 'medium'
        
        // Team risk
        let teamRisk: 'low' | 'medium' | 'high' = 'low'
        if (team.teamProductivity < 30) teamRisk = 'high'
        else if (team.teamProductivity < 60) teamRisk = 'medium'
        
        // Overall risk
        const riskScores = [budgetRisk, timelineRisk, teamRisk].map(risk => 
            risk === 'high' ? 3 : risk === 'medium' ? 2 : 1
        )
        const averageRisk = riskScores.reduce((sum, score) => sum + score, 0) / riskScores.length
        
        let overallRisk: 'low' | 'medium' | 'high' = 'low'
        if (averageRisk >= 2.5) overallRisk = 'high'
        else if (averageRisk >= 1.5) overallRisk = 'medium'
        
        return { budgetRisk, timelineRisk, teamRisk, overallRisk }
    }

    /**
     * Calculate sheets by type
     */
    private calculateSheetsByType(sheets: any[]): Record<string, number> {
        const types: Record<string, number> = {}
        sheets.forEach(sheet => {
            types[sheet.type] = (types[sheet.type] || 0) + 1
        })
        return types
    }

    /**
     * Calculate files by type
     */
    private calculateFilesByType(files: any[]): Record<string, number> {
        const types: Record<string, number> = {}
        files.forEach(file => {
            const extension = file.originalName?.split('.').pop()?.toLowerCase() || 'unknown'
            types[extension] = (types[extension] || 0) + 1
        })
        return types
    }

    /**
     * Calculate spending by category
     */
    private calculateSpendingByCategory(sheets: any[]): Record<string, number> {
        const categories: Record<string, number> = {}
        
        sheets.forEach(sheet => {
            if (['boq', 'costs', 'estimate'].includes(sheet.type)) {
                sheet.cells.forEach((cell: any) => {
                    if (cell.type === 'currency' && typeof cell.value === 'number') {
                        const category = cell.category || 'general'
                        categories[category] = (categories[category] || 0) + cell.value
                    }
                })
            }
        })
        
        return categories
    }

    /**
     * Calculate activity timeline
     */
    private calculateActivityTimeline(messages: any[], sheets: any[]): Array<{ date: string; activity: number }> {
        const timeline: Record<string, number> = {}
        const now = new Date()
        
        // Process messages
        messages.forEach(message => {
            const date = new Date(message.timestamp).toISOString().split('T')[0]
            timeline[date] = (timeline[date] || 0) + 1
        })
        
        // Process sheet updates
        sheets.forEach(sheet => {
            if (sheet.metadata?.lastModified) {
                const date = new Date(sheet.metadata.lastModified).toISOString().split('T')[0]
                timeline[date] = (timeline[date] || 0) + 1
            }
        })
        
        // Convert to array and sort by date
        return Object.entries(timeline)
            .map(([date, activity]) => ({ date, activity }))
            .sort((a, b) => a.date.localeCompare(b.date))
    }

    /**
     * Calculate team performance
     */
    private async calculateTeamPerformance(projectId: string): Promise<Array<{ userId: string; name: string; productivity: number }>> {
        try {
            const project = await Project.findById(projectId)
            if (!project) return []
            
            const users = await User.find({ _id: { $in: project.assignedUsers } })
            const messages = await ChatMessage.find({ projectId })
            
            return users.map(user => {
                const userMessages = messages.filter(m => m.userId === user._id.toString()).length
                const productivity = Math.min(100, userMessages * 5) // Simple productivity calculation
                
                return {
                    userId: user._id.toString(),
                    name: user.name,
                    productivity
                }
            })
        } catch (error) {
            logger.error('Error calculating team performance:', error)
            return []
        }
    }

    /**
     * Calculate trends
     */
    private calculateTrends(basicStats: ProjectStats, activityTimeline: Array<{ date: string; activity: number }>) {
        // Budget trend (simplified)
        const budgetTrend: 'increasing' | 'decreasing' | 'stable' = 
            basicStats.costVariance > 10 ? 'increasing' : 
            basicStats.costVariance < -10 ? 'decreasing' : 'stable'
        
        // Progress trend (simplified)
        const progressTrend: 'accelerating' | 'decelerating' | 'stable' = 
            basicStats.progress > 80 ? 'accelerating' : 
            basicStats.progress < 20 ? 'decelerating' : 'stable'
        
        // Team trend (simplified)
        const teamTrend: 'growing' | 'shrinking' | 'stable' = 
            basicStats.activeUsers > basicStats.totalUsers * 0.8 ? 'growing' : 
            basicStats.activeUsers < basicStats.totalUsers * 0.5 ? 'shrinking' : 'stable'
        
        return { budgetTrend, progressTrend, teamTrend }
    }
}

export default new ProjectStatsService()
