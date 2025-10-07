/**
 * Access Control Service
 * Construction Master App - Advanced Access Control
 */

import Project from '../models/Project'
import Sheet from '../models/Sheet'
import User from '../models/User'
import logger from '../config/logger'

interface AccessResult {
    hasAccess: boolean
    reason?: string
    level?: 'owner' | 'admin' | 'member' | 'viewer'
}

interface ProjectAccess extends AccessResult {
    project?: any
}

interface SheetAccess extends AccessResult {
    sheet?: any
    project?: any
}

class AccessControlService {
    
    /**
     * Check if user has access to a project
     */
    async checkProjectAccess(userId: string, userRole: string, projectId: string, requiredLevel: 'view' | 'edit' | 'admin' = 'view'): Promise<ProjectAccess> {
        try {
            const project = await Project.findById(projectId)
            if (!project) {
                return {
                    hasAccess: false,
                    reason: 'Project not found'
                }
            }

            // Admin has access to everything
            if (userRole === 'admin') {
                return {
                    hasAccess: true,
                    level: 'admin',
                    project
                }
            }

            // Check if user is owner
            if (project.ownerId.toString() === userId) {
                return {
                    hasAccess: true,
                    level: 'owner',
                    project
                }
            }

            // Check if user is assigned to project
            const isAssigned = project.assignedUsers.some(assignedUserId => 
                assignedUserId.toString() === userId
            )

            if (!isAssigned) {
                return {
                    hasAccess: false,
                    reason: 'User not assigned to project'
                }
            }

            // Check access level based on user role and required level
            const accessLevel = this.getUserAccessLevel(userRole, project, userId)
            
            if (requiredLevel === 'view' && accessLevel !== 'none') {
                return {
                    hasAccess: true,
                    level: accessLevel,
                    project
                }
            }

            if (requiredLevel === 'edit' && ['member', 'admin', 'owner'].includes(accessLevel)) {
                return {
                    hasAccess: true,
                    level: accessLevel,
                    project
                }
            }

            if (requiredLevel === 'admin' && ['admin', 'owner'].includes(accessLevel)) {
                return {
                    hasAccess: true,
                    level: accessLevel,
                    project
                }
            }

            return {
                hasAccess: false,
                reason: `Insufficient permissions for ${requiredLevel} access`
            }

        } catch (error) {
            logger.error('Error checking project access:', error)
            return {
                hasAccess: false,
                reason: 'Error checking access'
            }
        }
    }

    /**
     * Check if user has access to a sheet
     */
    async checkSheetAccess(userId: string, userRole: string, sheetId: string, requiredLevel: 'view' | 'edit' | 'admin' = 'view'): Promise<SheetAccess> {
        try {
            const sheet = await Sheet.findById(sheetId).populate('projectId')
            if (!sheet) {
                return {
                    hasAccess: false,
                    reason: 'Sheet not found'
                }
            }

            // Check project access first
            const projectAccess = await this.checkProjectAccess(userId, userRole, sheet.projectId.toString(), requiredLevel)
            if (!projectAccess.hasAccess) {
                return {
                    hasAccess: false,
                    reason: projectAccess.reason,
                    sheet,
                    project: projectAccess.project
                }
            }

            // Additional sheet-specific checks can be added here
            // For example, checking if sheet is private or has specific permissions

            return {
                hasAccess: true,
                level: projectAccess.level,
                sheet,
                project: projectAccess.project
            }

        } catch (error) {
            logger.error('Error checking sheet access:', error)
            return {
                hasAccess: false,
                reason: 'Error checking access'
            }
        }
    }

    /**
     * Get users who have access to a project
     */
    async getProjectUsers(projectId: string): Promise<any[]> {
        try {
            const project = await Project.findById(projectId).populate('assignedUsers', 'name email role isActive')
            if (!project) {
                return []
            }

            // Get owner
            const owner = await User.findById(project.ownerId).select('name email role isActive')
            
            // Combine owner and assigned users
            const users = []
            if (owner) {
                users.push({
                    ...owner.toObject(),
                    accessLevel: 'owner'
                })
            }

            // Add assigned users
            project.assignedUsers.forEach((user: any) => {
                if (user._id.toString() !== project.ownerId.toString()) {
                    users.push({
                        ...user.toObject(),
                        accessLevel: this.getUserAccessLevel(user.role, project, user._id.toString())
                    })
                }
            })

            return users

        } catch (error) {
            logger.error('Error getting project users:', error)
            return []
        }
    }

    /**
     * Get user's access level for a project
     */
    private getUserAccessLevel(userRole: string, project: any, userId: string): string {
        // Owner always has full access
        if (project.ownerId.toString() === userId) {
            return 'owner'
        }

        // Admin has admin access
        if (userRole === 'admin') {
            return 'admin'
        }

        // Project managers have member access
        if (userRole === 'project_manager') {
            return 'member'
        }

        // Other roles have viewer access
        return 'viewer'
    }

    /**
     * Check if user can perform action on resource
     */
    async canPerformAction(
        userId: string, 
        userRole: string, 
        resourceType: 'project' | 'sheet', 
        resourceId: string, 
        action: string
    ): Promise<boolean> {
        try {
            let accessResult: AccessResult

            if (resourceType === 'project') {
                const requiredLevel = this.getRequiredLevelForAction(action)
                accessResult = await this.checkProjectAccess(userId, userRole, resourceId, requiredLevel)
            } else {
                const requiredLevel = this.getRequiredLevelForAction(action)
                accessResult = await this.checkSheetAccess(userId, userRole, resourceId, requiredLevel)
            }

            return accessResult.hasAccess

        } catch (error) {
            logger.error('Error checking action permission:', error)
            return false
        }
    }

    /**
     * Get required access level for action
     */
    private getRequiredLevelForAction(action: string): 'view' | 'edit' | 'admin' {
        switch (action) {
            case 'view':
            case 'read':
                return 'view'
            case 'edit':
            case 'update':
            case 'create':
                return 'edit'
            case 'delete':
            case 'admin':
                return 'admin'
            default:
                return 'view'
        }
    }

    /**
     * Check if user can invite others to project
     */
    async canInviteToProject(userId: string, userRole: string, projectId: string): Promise<boolean> {
        const access = await this.checkProjectAccess(userId, userRole, projectId, 'edit')
        return access.hasAccess && ['owner', 'admin', 'member'].includes(access.level || '')
    }

    /**
     * Check if user can remove others from project
     */
    async canRemoveFromProject(userId: string, userRole: string, projectId: string): Promise<boolean> {
        const access = await this.checkProjectAccess(userId, userRole, projectId, 'admin')
        return access.hasAccess && ['owner', 'admin'].includes(access.level || '')
    }

    /**
     * Get user's permissions for a specific project
     */
    async getUserProjectPermissions(userId: string, userRole: string, projectId: string): Promise<string[]> {
        const access = await this.checkProjectAccess(userId, userRole, projectId, 'view')
        
        if (!access.hasAccess) {
            return []
        }

        const permissions = ['project:view']
        
        if (['owner', 'admin', 'member'].includes(access.level || '')) {
            permissions.push('project:edit', 'sheet:create', 'sheet:edit', 'file:upload')
        }
        
        if (['owner', 'admin'].includes(access.level || '')) {
            permissions.push('project:delete', 'project:admin', 'user:manage')
        }

        return permissions
    }
}

export default new AccessControlService()
