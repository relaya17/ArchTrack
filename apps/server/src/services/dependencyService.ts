/**
 * Dependency Service
 * Construction Master App - Project Dependency Management
 */

import Project from '../models/Project'
import Sheet from '../models/Sheet'
import File from '../models/File'
import ChatMessage from '../models/ChatMessage'
import Notification from '../models/Notification'
import logger from '../config/logger'

interface DependencyCheck {
    hasDependencies: boolean
    dependencies: {
        sheets: number
        files: number
        messages: number
        notifications: number
        total: number
    }
    details: {
        sheets: Array<{ id: string; name: string; type: string }>
        files: Array<{ id: string; name: string; type: string }>
        criticalDependencies: string[]
    }
    canDelete: boolean
    warnings: string[]
}

interface ProjectDependencyInfo {
    projectId: string
    projectName: string
    dependencies: DependencyCheck
    affectedUsers: number
    estimatedDataLoss: string
}

class DependencyService {
    
    /**
     * Check project dependencies before deletion
     */
    async checkProjectDependencies(projectId: string): Promise<DependencyCheck> {
        try {
            const project = await Project.findById(projectId)
            if (!project) {
                return {
                    hasDependencies: false,
                    dependencies: { sheets: 0, files: 0, messages: 0, notifications: 0, total: 0 },
                    details: { sheets: [], files: [], criticalDependencies: [] },
                    canDelete: true,
                    warnings: []
                }
            }

            // Get all dependencies
            const [sheets, files, messages, notifications] = await Promise.all([
                Sheet.find({ projectId }),
                File.find({ projectId }),
                ChatMessage.find({ projectId }),
                Notification.find({ projectId })
            ])

            // Get detailed information
            const sheetDetails = sheets.map(sheet => ({
                id: sheet._id.toString(),
                name: sheet.name,
                type: sheet.type
            }))

            const fileDetails = files.map(file => ({
                id: file._id.toString(),
                name: file.originalName || file.filename,
                type: file.mimetype || 'unknown'
            }))

            // Calculate totals
            const totalDependencies = sheets.length + files.length + messages.length + notifications.length
            const hasDependencies = totalDependencies > 0

            // Identify critical dependencies
            const criticalDependencies = this.identifyCriticalDependencies(sheets, files)

            // Determine if deletion is safe
            const canDelete = this.canSafelyDeleteProject(sheets, files, messages, notifications)

            // Generate warnings
            const warnings = this.generateWarnings(sheets, files, messages, notifications)

            return {
                hasDependencies,
                dependencies: {
                    sheets: sheets.length,
                    files: files.length,
                    messages: messages.length,
                    notifications: notifications.length,
                    total: totalDependencies
                },
                details: {
                    sheets: sheetDetails,
                    files: fileDetails,
                    criticalDependencies
                },
                canDelete,
                warnings
            }

        } catch (error) {
            logger.error('Error checking project dependencies:', error)
            return {
                hasDependencies: true,
                dependencies: { sheets: 0, files: 0, messages: 0, notifications: 0, total: 0 },
                details: { sheets: [], files: [], criticalDependencies: [] },
                canDelete: false,
                warnings: ['שגיאה בבדיקת תלויות - לא ניתן למחוק פרויקט']
            }
        }
    }

    /**
     * Get comprehensive dependency information
     */
    async getProjectDependencyInfo(projectId: string): Promise<ProjectDependencyInfo> {
        try {
            const project = await Project.findById(projectId)
            if (!project) {
                throw new Error('Project not found')
            }

            const dependencies = await this.checkProjectDependencies(projectId)
            
            // Get affected users
            const affectedUsers = project.assignedUsers.length

            // Estimate data loss
            const estimatedDataLoss = this.estimateDataLoss(dependencies)

            return {
                projectId,
                projectName: project.name,
                dependencies,
                affectedUsers,
                estimatedDataLoss
            }

        } catch (error) {
            logger.error('Error getting project dependency info:', error)
            throw error
        }
    }

    /**
     * Force delete project with dependencies
     */
    async forceDeleteProject(projectId: string, deleteOptions: {
        deleteSheets?: boolean
        deleteFiles?: boolean
        deleteMessages?: boolean
        deleteNotifications?: boolean
        archiveData?: boolean
    } = {}): Promise<{ success: boolean; deletedItems: any; errors: string[] }> {
        try {
            const errors: string[] = []
            const deletedItems: any = {
                sheets: 0,
                files: 0,
                messages: 0,
                notifications: 0
            }

            // Delete sheets if requested
            if (deleteOptions.deleteSheets) {
                try {
                    const sheetsResult = await Sheet.deleteMany({ projectId })
                    deletedItems.sheets = sheetsResult.deletedCount
                } catch (error) {
                    errors.push(`Failed to delete sheets: ${error}`)
                }
            }

            // Delete files if requested
            if (deleteOptions.deleteFiles) {
                try {
                    const filesResult = await File.deleteMany({ projectId })
                    deletedItems.files = filesResult.deletedCount
                } catch (error) {
                    errors.push(`Failed to delete files: ${error}`)
                }
            }

            // Delete messages if requested
            if (deleteOptions.deleteMessages) {
                try {
                    const messagesResult = await ChatMessage.deleteMany({ projectId })
                    deletedItems.messages = messagesResult.deletedCount
                } catch (error) {
                    errors.push(`Failed to delete messages: ${error}`)
                }
            }

            // Delete notifications if requested
            if (deleteOptions.deleteNotifications) {
                try {
                    const notificationsResult = await Notification.deleteMany({ projectId })
                    deletedItems.notifications = notificationsResult.deletedCount
                } catch (error) {
                    errors.push(`Failed to delete notifications: ${error}`)
                }
            }

            // Archive data if requested
            if (deleteOptions.archiveData) {
                try {
                    await this.archiveProjectData(projectId)
                } catch (error) {
                    errors.push(`Failed to archive data: ${error}`)
                }
            }

            // Finally delete the project
            await Project.findByIdAndDelete(projectId)

            return {
                success: errors.length === 0,
                deletedItems,
                errors
            }

        } catch (error) {
            logger.error('Error force deleting project:', error)
            return {
                success: false,
                deletedItems: { sheets: 0, files: 0, messages: 0, notifications: 0 },
                errors: [`Failed to delete project: ${error}`]
            }
        }
    }

    /**
     * Archive project data before deletion
     */
    private async archiveProjectData(projectId: string): Promise<void> {
        try {
            // This would implement data archiving logic
            // For now, we'll just log the action
            logger.info(`Archiving data for project ${projectId}`)
            
            // In a real implementation, you would:
            // 1. Create archive records
            // 2. Move data to archive tables
            // 3. Generate archive reports
            // 4. Send notifications to stakeholders
            
        } catch (error) {
            logger.error('Error archiving project data:', error)
            throw error
        }
    }

    /**
     * Identify critical dependencies
     */
    private identifyCriticalDependencies(sheets: any[], files: any[]): string[] {
        const critical: string[] = []

        // Check for critical sheets
        sheets.forEach(sheet => {
            if (sheet.type === 'boq' && sheet.cells.length > 0) {
                critical.push(`Critical BOQ sheet: ${sheet.name}`)
            }
            if (sheet.type === 'estimate' && sheet.cells.length > 0) {
                critical.push(`Critical estimate sheet: ${sheet.name}`)
            }
            if (sheet.metadata?.version > 5) {
                critical.push(`Heavily modified sheet: ${sheet.name}`)
            }
        })

        // Check for critical files
        files.forEach(file => {
            if (file.size > 10 * 1024 * 1024) { // Files larger than 10MB
                critical.push(`Large file: ${file.originalName || file.filename}`)
            }
            if (['pdf', 'dwg', 'ifc'].includes(file.originalName?.split('.').pop()?.toLowerCase())) {
                critical.push(`Important design file: ${file.originalName || file.filename}`)
            }
        })

        return critical
    }

    /**
     * Check if project can be safely deleted
     */
    private canSafelyDeleteProject(sheets: any[], files: any[], messages: any[], notifications: any[]): boolean {
        // Project can be safely deleted if:
        // 1. No critical sheets with data
        const hasCriticalSheets = sheets.some(sheet => 
            sheet.cells.length > 0 && ['boq', 'estimate', 'costs'].includes(sheet.type)
        )

        // 2. No large files
        const hasLargeFiles = files.some(file => file.size > 5 * 1024 * 1024) // 5MB

        // 3. No recent activity
        const recentMessages = messages.filter(msg => 
            new Date(msg.timestamp) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        ).length

        return !hasCriticalSheets && !hasLargeFiles && recentMessages === 0
    }

    /**
     * Generate warnings for project deletion
     */
    private generateWarnings(sheets: any[], files: any[], messages: any[], notifications: any[]): string[] {
        const warnings: string[] = []

        if (sheets.length > 0) {
            warnings.push(`פרויקט מכיל ${sheets.length} גיליונות שיימחקו`)
        }

        if (files.length > 0) {
            const totalSize = files.reduce((sum, file) => sum + (file.size || 0), 0)
            const sizeMB = Math.round(totalSize / (1024 * 1024))
            warnings.push(`פרויקט מכיל ${files.length} קבצים (${sizeMB}MB) שיימחקו`)
        }

        if (messages.length > 0) {
            warnings.push(`פרויקט מכיל ${messages.length} הודעות צ'אט שיימחקו`)
        }

        if (notifications.length > 0) {
            warnings.push(`פרויקט מכיל ${notifications.length} התראות שיימחקו`)
        }

        // Check for critical data
        const criticalSheets = sheets.filter(sheet => 
            sheet.cells.length > 0 && ['boq', 'estimate'].includes(sheet.type)
        )

        if (criticalSheets.length > 0) {
            warnings.push(`פרויקט מכיל ${criticalSheets.length} גיליונות קריטיים עם נתונים`)
        }

        return warnings
    }

    /**
     * Estimate data loss from project deletion
     */
    private estimateDataLoss(dependencies: DependencyCheck): string {
        const { sheets, files, messages, notifications } = dependencies.dependencies
        
        let loss = []
        
        if (sheets > 0) loss.push(`${sheets} גיליונות`)
        if (files > 0) loss.push(`${files} קבצים`)
        if (messages > 0) loss.push(`${messages} הודעות`)
        if (notifications > 0) loss.push(`${notifications} התראות`)
        
        return loss.length > 0 ? loss.join(', ') : 'אין נתונים למחיקה'
    }

    /**
     * Get dependency statistics for all projects
     */
    async getAllProjectsDependencyStats(): Promise<Array<{
        projectId: string
        projectName: string
        dependencyCount: number
        hasCriticalDependencies: boolean
    }>> {
        try {
            const projects = await Project.find({})
            const stats = []

            for (const project of projects) {
                const dependencies = await this.checkProjectDependencies(project._id.toString())
                stats.push({
                    projectId: project._id.toString(),
                    projectName: project.name,
                    dependencyCount: dependencies.dependencies.total,
                    hasCriticalDependencies: dependencies.details.criticalDependencies.length > 0
                })
            }

            return stats

        } catch (error) {
            logger.error('Error getting all projects dependency stats:', error)
            return []
        }
    }
}

export default new DependencyService()
