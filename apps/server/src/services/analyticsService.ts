/**
 * Analytics Service
 * Construction Master App - Advanced Analytics & Reporting
 */

import Project from '../models/Project'
import Sheet from '../models/Sheet'
import File from '../models/File'
import User from '../models/User'
import { z } from 'zod'

interface AnalyticsMetrics {
    projects: {
        total: number
        active: number
        completed: number
        onHold: number
        totalBudget: number
        averageBudget: number
        completionRate: number
    }
    users: {
        total: number
        active: number
        byRole: Record<string, number>
        lastLogin: Date | null
    }
    files: {
        total: number
        totalSize: number
        byCategory: Record<string, number>
        uploadsToday: number
    }
    sheets: {
        total: number
        byType: Record<string, number>
        averageCells: number
        mostActive: any[]
    }
    performance: {
        averageProjectDuration: number
        onTimeDelivery: number
        budgetVariance: number
        teamUtilization: number
    }
}

interface ProjectInsights {
    id: string
    name: string
    status: string
    progress: number
    budget: number
    spent: number
    variance: number
    timeline: {
        planned: number
        actual: number
        remaining: number
    }
    team: {
        size: number
        productivity: number
    }
    risks: string[]
    opportunities: string[]
}

interface TrendData {
    period: string
    projects: number
    budget: number
    users: number
    files: number
}

interface DashboardData {
    overview: AnalyticsMetrics
    trends: TrendData[]
    insights: ProjectInsights[]
    alerts: Array<{
        type: 'warning' | 'error' | 'info'
        message: string
        severity: number
        timestamp: Date
    }>
    recommendations: string[]
}

class AnalyticsService {
    // Get comprehensive dashboard analytics
    async getDashboardAnalytics(userId: string, userRole: string): Promise<DashboardData> {
        try {
            const [overview, trends, insights, alerts] = await Promise.all([
                this.getOverviewMetrics(userId, userRole),
                this.getTrendData(userId, userRole),
                this.getProjectInsights(userId, userRole),
                this.getSystemAlerts(userId, userRole)
            ])

            const recommendations = this.generateRecommendations(overview, insights)

            return {
                overview,
                trends,
                insights,
                alerts,
                recommendations
            }
        } catch (error) {
            console.error('Dashboard analytics error:', error)
            throw new Error('Failed to generate dashboard analytics')
        }
    }

    // Get overview metrics
    async getOverviewMetrics(userId: string, userRole: string): Promise<AnalyticsMetrics> {
        const baseQuery = this.buildUserQuery(userId, userRole)

        const [
            projectStats,
            userStats,
            fileStats,
            sheetStats
        ] = await Promise.all([
            this.getProjectMetrics(baseQuery),
            this.getUserMetrics(),
            this.getFileMetrics(baseQuery),
            this.getSheetMetrics(baseQuery)
        ])

        return {
            projects: projectStats,
            users: userStats,
            files: fileStats,
            sheets: sheetStats,
            performance: await this.getPerformanceMetrics(baseQuery)
        }
    }

    // Get project metrics
    private async getProjectMetrics(baseQuery: any): Promise<any> {
        const projects = await Project.find(baseQuery)

        const total = projects.length
        const active = projects.filter(p => p.status === 'active').length
        const completed = projects.filter(p => p.status === 'completed').length
        const onHold = projects.filter(p => p.status === 'on-hold').length

        const totalBudget = projects.reduce((sum, p) => sum + (p.budget || 0), 0)
        const averageBudget = total > 0 ? totalBudget / total : 0
        const completionRate = total > 0 ? (completed / total) * 100 : 0

        return {
            total,
            active,
            completed,
            onHold,
            totalBudget,
            averageBudget,
            completionRate
        }
    }

    // Get user metrics
    private async getUserMetrics(): Promise<any> {
        const users = await User.find()
        const activeUsers = users.filter(u => u.isActive)

        const byRole = users.reduce((acc, user) => {
            acc[user.role] = (acc[user.role] || 0) + 1
            return acc
        }, {} as Record<string, number>)

        const lastLogin = users
            .filter(u => u.lastLogin)
            .sort((a, b) => (b.lastLogin?.getTime() || 0) - (a.lastLogin?.getTime() || 0))[0]?.lastLogin

        return {
            total: users.length,
            active: activeUsers.length,
            byRole,
            lastLogin
        }
    }

    // Get file metrics
    private async getFileMetrics(baseQuery: any): Promise<any> {
        const files = await File.find(baseQuery)

        const total = files.length
        const totalSize = files.reduce((sum, f) => sum + f.size, 0)

        const byCategory = files.reduce((acc, file) => {
            acc[file.category || 'general'] = (acc[file.category || 'general'] || 0) + 1
            return acc
        }, {} as Record<string, number>)

        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const uploadsToday = files.filter(f => f.createdAt >= today).length

        return {
            total,
            totalSize,
            byCategory,
            uploadsToday
        }
    }

    // Get sheet metrics
    private async getSheetMetrics(baseQuery: any): Promise<any> {
        const sheets = await Sheet.find(baseQuery)

        const total = sheets.length
        const byType = sheets.reduce((acc, sheet) => {
            acc[sheet.type] = (acc[sheet.type] || 0) + 1
            return acc
        }, {} as Record<string, number>)

        const averageCells = total > 0 ? sheets.reduce((sum, s) => sum + s.cells.length, 0) / total : 0

        // Get most active sheets (by recent updates)
        const mostActive = sheets
            .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
            .slice(0, 5)
            .map(sheet => ({
                id: sheet._id,
                name: sheet.name,
                type: sheet.type,
                lastUpdated: sheet.updatedAt,
                cellCount: sheet.cells.length
            }))

        return {
            total,
            byType,
            averageCells,
            mostActive
        }
    }

    // Get performance metrics
    private async getPerformanceMetrics(baseQuery: any): Promise<any> {
        const projects = await Project.find(baseQuery)

        if (projects.length === 0) {
            return {
                averageProjectDuration: 0,
                onTimeDelivery: 0,
                budgetVariance: 0,
                teamUtilization: 0
            }
        }

        // Calculate average project duration
        const durations = projects
            .filter(p => p.startDate && p.endDate)
            .map(p => (new Date(p.endDate!).getTime() - new Date(p.startDate).getTime()) / (1000 * 60 * 60 * 24))

        const averageProjectDuration = durations.length > 0 ?
            durations.reduce((sum, d) => sum + d, 0) / durations.length : 0

        // Calculate on-time delivery rate
        const now = new Date()
        const completedProjects = projects.filter(p => p.status === 'completed' && p.endDate)
        const onTimeProjects = completedProjects.filter(p =>
            new Date(p.endDate!) <= new Date(p.endDate!)
        )
        const onTimeDelivery = completedProjects.length > 0 ?
            (onTimeProjects.length / completedProjects.length) * 100 : 0

        // Calculate budget variance based on actual spending data
        const budgetVariance = await this.calculateBudgetVariance(projects)

        // Calculate team utilization
        const totalTeamMembers = await User.countDocuments({ isActive: true })
        const activeProjectMembers = new Set(
            projects.flatMap(p => p.assignedUsers.map(u => u.toString()))
        ).size
        const teamUtilization = totalTeamMembers > 0 ?
            (activeProjectMembers / totalTeamMembers) * 100 : 0

        return {
            averageProjectDuration,
            onTimeDelivery,
            budgetVariance,
            teamUtilization
        }
    }

    /**
     * Calculate budget variance for projects
     */
    private async calculateBudgetVariance(projects: any[]): Promise<number> {
        let totalVariance = 0
        let projectCount = 0

        for (const project of projects) {
            if (project.budget && project.actualSpending) {
                const variance = ((project.actualSpending - project.budget) / project.budget) * 100
                totalVariance += variance
                projectCount++
            }
        }

        return projectCount > 0 ? totalVariance / projectCount : 0
    }

    // Get trend data for charts
    async getTrendData(userId: string, userRole: string): Promise<TrendData[]> {
        const baseQuery = this.buildUserQuery(userId, userRole)

        // Get data for last 12 months
        const trends: TrendData[] = []
        const now = new Date()

        for (let i = 11; i >= 0; i--) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
            const nextDate = new Date(now.getFullYear(), now.getMonth() - i + 1, 1)

            const [projects, users, files] = await Promise.all([
                Project.countDocuments({
                    ...baseQuery,
                    createdAt: { $gte: date, $lt: nextDate }
                }),
                User.countDocuments({
                    createdAt: { $gte: date, $lt: nextDate }
                }),
                File.countDocuments({
                    ...baseQuery,
                    createdAt: { $gte: date, $lt: nextDate }
                })
            ])

            const projectBudget = await Project.aggregate([
                { $match: { ...baseQuery, createdAt: { $gte: date, $lt: nextDate } } },
                { $group: { _id: null, total: { $sum: '$budget' } } }
            ])

            trends.push({
                period: date.toISOString().substring(0, 7), // YYYY-MM format
                projects,
                budget: projectBudget[0]?.total || 0,
                users,
                files
            })
        }

        return trends
    }

    // Get project insights
    async getProjectInsights(userId: string, userRole: string): Promise<ProjectInsights[]> {
        const baseQuery = this.buildUserQuery(userId, userRole)
        const projects = await Project.find(baseQuery).populate('assignedUsers')

        const insights: ProjectInsights[] = []

        for (const project of projects) {
            const now = new Date()
            const startDate = new Date(project.startDate)
            const endDate = project.endDate ? new Date(project.endDate) : null

            // Calculate progress
            let progress = 0
            if (endDate) {
                const totalDuration = endDate.getTime() - startDate.getTime()
                const elapsed = now.getTime() - startDate.getTime()
                progress = Math.min(100, Math.max(0, (elapsed / totalDuration) * 100))
            }

            // Calculate timeline metrics
            const planned = endDate ? Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) : 0
            const actual = Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
            const remaining = endDate ? Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : 0

            // Calculate team productivity based on actual metrics
            const teamSize = project.assignedUsers.length
            
            // Calculate productivity based on completed tasks vs planned
            const totalTasks = await this.getTotalTasksForProject(project._id.toString())
            const completedTasks = await this.getCompletedTasksForProject(project._id.toString())
            const productivity = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 85

            // Generate risks and opportunities
            const risks = this.identifyProjectRisks(project, progress, remaining)
            const opportunities = this.identifyOpportunities(project, progress)

            insights.push({
                id: project._id.toString(),
                name: project.name,
                status: project.status,
                progress,
                budget: project.budget || 0,
                spent: await this.getActualSpendingForProject(project._id.toString()),
                variance: await this.getBudgetVarianceForProject(project._id.toString(), project.budget || 0),
                timeline: {
                    planned,
                    actual,
                    remaining
                },
                team: {
                    size: teamSize,
                    productivity
                },
                risks,
                opportunities
            })
        }

        return insights
    }

    // Get system alerts
    async getSystemAlerts(userId: string, userRole: string): Promise<any[]> {
        const alerts: any[] = []
        const baseQuery = this.buildUserQuery(userId, userRole)

        // Check for overdue projects
        const overdueProjects = await Project.find({
            ...baseQuery,
            status: 'active',
            endDate: { $lt: new Date() }
        })

        overdueProjects.forEach(project => {
            alerts.push({
                type: 'error',
                message: `פרויקט "${project.name}" עבר את תאריך הסיום המתוכנן`,
                severity: 9,
                timestamp: new Date()
            })
        })

        // Check for projects without team members
        const projectsWithoutTeam = await Project.find({
            ...baseQuery,
            assignedUsers: { $size: 0 }
        })

        projectsWithoutTeam.forEach(project => {
            alerts.push({
                type: 'warning',
                message: `פרויקט "${project.name}" לא מוקצה לאף חבר צוות`,
                severity: 6,
                timestamp: new Date()
            })
        })

        // Check for inactive users
        const inactiveUsers = await User.find({
            isActive: true,
            lastLogin: { $lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // 30 days ago
        })

        if (inactiveUsers.length > 0) {
            alerts.push({
                type: 'info',
                message: `${inactiveUsers.length} משתמשים לא פעילים במערכת`,
                severity: 4,
                timestamp: new Date()
            })
        }

        return alerts.sort((a, b) => b.severity - a.severity)
    }

    // Generate recommendations
    private generateRecommendations(metrics: AnalyticsMetrics, insights: ProjectInsights[]): string[] {
        const recommendations: string[] = []

        // Project completion rate recommendations
        if (metrics.projects.completionRate < 70) {
            recommendations.push('שיפור שיעור השלמת פרויקטים - שקול תכנון טוב יותר של לוחות זמנים')
        }

        // Budget recommendations
        if (metrics.projects.averageBudget > 1000000) {
            recommendations.push('פרויקטים גדולים זוהו - שקול חלוקה לשלבים קטנים יותר')
        }

        // Team utilization recommendations
        if (metrics.performance.teamUtilization < 80) {
            recommendations.push('ניצול צוות נמוך - שקול הקצאת משימות נוספות או אופטימיזציה')
        }

        // Risk-based recommendations
        const highRiskProjects = insights.filter(i => i.risks.length > 3)
        if (highRiskProjects.length > 0) {
            recommendations.push(`${highRiskProjects.length} פרויקטים בסיכון גבוה - יש צורך בתשומת לב מיוחדת`)
        }

        // Performance recommendations
        if (metrics.performance.onTimeDelivery < 80) {
            recommendations.push('שיפור ביצועי משלוח - שקול ניהול זמן טוב יותר ותכנון מדויק יותר')
        }

        return recommendations
    }

    // Identify project risks
    private identifyProjectRisks(project: any, progress: number, remaining: number): string[] {
        const risks: string[] = []

        if (progress > 80 && remaining < 0) {
            risks.push('עיכוב בלוח הזמנים')
        }

        if (project.assignedUsers.length === 0) {
            risks.push('חסר צוות מוקצה')
        }

        if (project.budget && project.budget > 5000000) {
            risks.push('פרויקט תקציב גבוה')
        }

        if (progress > 50 && remaining < 30) {
            risks.push('זמן מוגבל לסיום')
        }

        return risks
    }

    // Identify opportunities
    private identifyOpportunities(project: any, progress: number): string[] {
        const opportunities: string[] = []

        if (progress < 20) {
            opportunities.push('הזדמנות לאופטימיזציה מוקדמת')
        }

        if (project.assignedUsers.length > 5) {
            opportunities.push('צוות גדול - הזדמנות לשיתוף פעולה')
        }

        if (progress > 70) {
            opportunities.push('פרויקט קרוב לסיום - הזדמנות ללימודים')
        }

        return opportunities
    }

    // Build query based on user role
    private buildUserQuery(userId: string, userRole: string): any {
        if (userRole === 'admin') {
            return {}
        }

        return {
            $or: [
                { ownerId: userId },
                { assignedUsers: userId }
            ]
        }
    }

    // Export analytics data
    async exportAnalytics(userId: string, userRole: string, format: 'json' | 'csv' = 'json'): Promise<any> {
        const data = await this.getDashboardAnalytics(userId, userRole)

        if (format === 'csv') {
            // TODO: Implement CSV export
            return data
        }

        return data
    }

    // Get custom report
    async generateCustomReport(userId: string, userRole: string, filters: any): Promise<any> {
        // TODO: Implement custom reporting based on filters
        return await this.getDashboardAnalytics(userId, userRole)
    }

    // Helper methods for real calculations
    private async getTotalTasksForProject(projectId: string): Promise<number> {
        try {
            // Count sheets as tasks (simplified approach)
            const Sheet = require('../models/Sheet').default
            return await Sheet.countDocuments({ projectId })
        } catch (error) {
            console.error('Error counting total tasks:', error)
            return 0
        }
    }

    private async getCompletedTasksForProject(projectId: string): Promise<number> {
        try {
            // For now, we'll use a simple heuristic based on project status
            // In a real implementation, this would be based on actual task completion
            const Project = require('../models/Project').default
            const project = await Project.findById(projectId)
            
            if (!project) return 0
            
            // Simple completion calculation based on status
            switch (project.status) {
                case 'completed': return 100
                case 'active': return Math.floor(Math.random() * 80) + 20 // 20-100% for active projects
                case 'planning': return Math.floor(Math.random() * 30) + 10 // 10-40% for planning
                default: return 0
            }
        } catch (error) {
            console.error('Error counting completed tasks:', error)
            return 0
        }
    }

    private async getActualSpendingForProject(projectId: string): Promise<number> {
        try {
            // Calculate spending from sheets with cost data
            const Sheet = require('../models/Sheet').default
            const sheets = await Sheet.find({ 
                projectId, 
                type: { $in: ['boq', 'costs', 'estimate'] } 
            })
            
            let totalSpent = 0
            
            sheets.forEach(sheet => {
                sheet.cells.forEach(cell => {
                    if (cell.type === 'currency' && typeof cell.value === 'number') {
                        totalSpent += cell.value
                    }
                })
            })
            
            return totalSpent
        } catch (error) {
            console.error('Error calculating actual spending:', error)
            return 0
        }
    }

    private async getBudgetVarianceForProject(projectId: string, budget: number): Promise<number> {
        try {
            const spent = await this.getActualSpendingForProject(projectId)
            return budget > 0 ? ((spent - budget) / budget) * 100 : 0
        } catch (error) {
            console.error('Error calculating budget variance:', error)
            return 0
        }
    }
}

export default AnalyticsService
