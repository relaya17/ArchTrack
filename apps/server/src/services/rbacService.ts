/**
 * RBAC Service
 * Construction Master App - Role-Based Access Control
 */

import logger from '../config/logger'

interface Permission {
    id: string
    name: string
    description: string
    resource: string
    action: string
    conditions?: PermissionCondition[]
    isSystem: boolean
    createdAt: Date
    updatedAt: Date
}

interface PermissionCondition {
    field: string
    operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'in' | 'not_in' | 'greater_than' | 'less_than'
    value: any
}

interface Role {
    id: string
    name: string
    displayName: string
    description: string
    permissions: string[]
    parentRoles: string[]
    isSystem: boolean
    isActive: boolean
    metadata: RoleMetadata
    createdAt: Date
    updatedAt: Date
}

interface RoleMetadata {
    color: string
    icon: string
    priority: number
    category: string
    tags: string[]
}

interface UserRole {
    id: string
    userId: string
    roleId: string
    assignedBy: string
    assignedAt: Date
    expiresAt?: Date
    isActive: boolean
    conditions?: UserRoleCondition[]
}

interface UserRoleCondition {
    field: string
    operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'in' | 'not_in' | 'greater_than' | 'less_than'
    value: any
}

interface Resource {
    id: string
    name: string
    type: string
    owner: string
    permissions: string[]
    attributes: Record<string, any>
    createdAt: Date
    updatedAt: Date
}

interface Policy {
    id: string
    name: string
    description: string
    effect: 'allow' | 'deny'
    subjects: PolicySubject[]
    resources: PolicyResource[]
    actions: string[]
    conditions: PolicyCondition[]
    priority: number
    isActive: boolean
    createdAt: Date
    updatedAt: Date
}

interface PolicySubject {
    type: 'user' | 'role' | 'group'
    id: string
    attributes?: Record<string, any>
}

interface PolicyResource {
    type: string
    id?: string
    pattern?: string
    attributes?: Record<string, any>
}

interface PolicyCondition {
    field: string
    operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'in' | 'not_in' | 'greater_than' | 'less_than' | 'regex'
    value: any
}

interface AccessDecision {
    allowed: boolean
    reason: string
    matchedPolicies: string[]
    matchedRoles: string[]
    matchedPermissions: string[]
    conditions: string[]
}

interface AuditLog {
    id: string
    userId: string
    action: string
    resource: string
    resourceId: string
    result: 'allow' | 'deny'
    reason: string
    timestamp: Date
    ipAddress: string
    userAgent: string
    metadata: Record<string, any>
}

class RBACService {
    private permissions: Map<string, Permission> = new Map()
    private roles: Map<string, Role> = new Map()
    private userRoles: Map<string, UserRole[]> = new Map()
    private resources: Map<string, Resource> = new Map()
    private policies: Map<string, Policy> = new Map()
    private auditLogs: AuditLog[] = []

    constructor() {
        this.initializeSystemPermissions()
        this.initializeSystemRoles()
    }

    /**
     * Initialize system permissions
     */
    private initializeSystemPermissions(): void {
        const systemPermissions: Permission[] = [
            {
                id: 'project_create',
                name: 'Create Project',
                description: 'Create new projects',
                resource: 'project',
                action: 'create',
                isSystem: true,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                id: 'project_read',
                name: 'Read Project',
                description: 'View project details',
                resource: 'project',
                action: 'read',
                isSystem: true,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                id: 'project_update',
                name: 'Update Project',
                description: 'Modify project details',
                resource: 'project',
                action: 'update',
                isSystem: true,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                id: 'project_delete',
                name: 'Delete Project',
                description: 'Delete projects',
                resource: 'project',
                action: 'delete',
                isSystem: true,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                id: 'sheet_create',
                name: 'Create Sheet',
                description: 'Create new sheets',
                resource: 'sheet',
                action: 'create',
                isSystem: true,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                id: 'sheet_read',
                name: 'Read Sheet',
                description: 'View sheet details',
                resource: 'sheet',
                action: 'read',
                isSystem: true,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                id: 'sheet_update',
                name: 'Update Sheet',
                description: 'Modify sheet details',
                resource: 'sheet',
                action: 'update',
                isSystem: true,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                id: 'sheet_delete',
                name: 'Delete Sheet',
                description: 'Delete sheets',
                resource: 'sheet',
                action: 'delete',
                isSystem: true,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                id: 'user_manage',
                name: 'Manage Users',
                description: 'Manage user accounts',
                resource: 'user',
                action: 'manage',
                isSystem: true,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                id: 'analytics_view',
                name: 'View Analytics',
                description: 'View analytics and reports',
                resource: 'analytics',
                action: 'read',
                isSystem: true,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                id: 'analytics_manage',
                name: 'Manage Analytics',
                description: 'Manage analytics settings',
                resource: 'analytics',
                action: 'manage',
                isSystem: true,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                id: 'analytics_export',
                name: 'Export Analytics',
                description: 'Export analytics data',
                resource: 'analytics',
                action: 'export',
                isSystem: true,
                createdAt: new Date(),
                updatedAt: new Date()
            }
        ]

        for (const permission of systemPermissions) {
            this.permissions.set(permission.id, permission)
        }

        logger.info('System permissions initialized', { count: systemPermissions.length })
    }

    /**
     * Initialize system roles
     */
    private initializeSystemRoles(): void {
        const systemRoles: Role[] = [
            {
                id: 'admin',
                name: 'admin',
                displayName: 'Administrator',
                description: 'Full system access',
                permissions: Array.from(this.permissions.keys()),
                parentRoles: [],
                isSystem: true,
                isActive: true,
                metadata: {
                    color: '#FF5722',
                    icon: 'shield',
                    priority: 100,
                    category: 'system',
                    tags: ['system', 'admin']
                },
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                id: 'project_manager',
                name: 'project_manager',
                displayName: 'Project Manager',
                description: 'Manage projects and teams',
                permissions: [
                    'project_create', 'project_read', 'project_update',
                    'sheet_create', 'sheet_read', 'sheet_update',
                    'analytics_view', 'analytics_export'
                ],
                parentRoles: [],
                isSystem: true,
                isActive: true,
                metadata: {
                    color: '#2196F3',
                    icon: 'briefcase',
                    priority: 80,
                    category: 'management',
                    tags: ['management', 'project']
                },
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                id: 'engineer',
                name: 'engineer',
                displayName: 'Engineer',
                description: 'Technical work on projects',
                permissions: [
                    'project_read',
                    'sheet_create', 'sheet_read', 'sheet_update',
                    'analytics_view'
                ],
                parentRoles: [],
                isSystem: true,
                isActive: true,
                metadata: {
                    color: '#4CAF50',
                    icon: 'cog',
                    priority: 60,
                    category: 'technical',
                    tags: ['technical', 'engineering']
                },
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                id: 'viewer',
                name: 'viewer',
                displayName: 'Viewer',
                description: 'Read-only access',
                permissions: [
                    'project_read',
                    'sheet_read',
                    'analytics_view'
                ],
                parentRoles: [],
                isSystem: true,
                isActive: true,
                metadata: {
                    color: '#9E9E9E',
                    icon: 'eye',
                    priority: 20,
                    category: 'readonly',
                    tags: ['readonly', 'viewer']
                },
                createdAt: new Date(),
                updatedAt: new Date()
            }
        ]

        for (const role of systemRoles) {
            this.roles.set(role.id, role)
        }

        logger.info('System roles initialized', { count: systemRoles.length })
    }

    /**
     * Create permission
     */
    createPermission(permission: Omit<Permission, 'id' | 'createdAt' | 'updatedAt'>): Permission {
        const newPermission: Permission = {
            id: `perm_${Date.now()}`,
            ...permission,
            createdAt: new Date(),
            updatedAt: new Date()
        }

        this.permissions.set(newPermission.id, newPermission)
        logger.info('Permission created', { permissionId: newPermission.id, name: newPermission.name })
        return newPermission
    }

    /**
     * Get permission
     */
    getPermission(permissionId: string): Permission | null {
        return this.permissions.get(permissionId) || null
    }

    /**
     * Get all permissions
     */
    getAllPermissions(): Permission[] {
        return Array.from(this.permissions.values())
    }

    /**
     * Update permission
     */
    updatePermission(permissionId: string, updates: Partial<Permission>): boolean {
        const permission = this.permissions.get(permissionId)
        if (!permission) return false

        const updatedPermission = { ...permission, ...updates, updatedAt: new Date() }
        this.permissions.set(permissionId, updatedPermission)
        logger.info('Permission updated', { permissionId })
        return true
    }

    /**
     * Delete permission
     */
    deletePermission(permissionId: string): boolean {
        const permission = this.permissions.get(permissionId)
        if (!permission || permission.isSystem) return false

        const deleted = this.permissions.delete(permissionId)
        if (deleted) {
            logger.info('Permission deleted', { permissionId })
        }
        return deleted
    }

    /**
     * Create role
     */
    createRole(role: Omit<Role, 'id' | 'createdAt' | 'updatedAt'>): Role {
        const newRole: Role = {
            id: `role_${Date.now()}`,
            ...role,
            createdAt: new Date(),
            updatedAt: new Date()
        }

        this.roles.set(newRole.id, newRole)
        logger.info('Role created', { roleId: newRole.id, name: newRole.name })
        return newRole
    }

    /**
     * Get role
     */
    getRole(roleId: string): Role | null {
        return this.roles.get(roleId) || null
    }

    /**
     * Get all roles
     */
    getAllRoles(): Role[] {
        return Array.from(this.roles.values())
    }

    /**
     * Update role
     */
    updateRole(roleId: string, updates: Partial<Role>): boolean {
        const role = this.roles.get(roleId)
        if (!role) return false

        const updatedRole = { ...role, ...updates, updatedAt: new Date() }
        this.roles.set(roleId, updatedRole)
        logger.info('Role updated', { roleId })
        return true
    }

    /**
     * Delete role
     */
    deleteRole(roleId: string): boolean {
        const role = this.roles.get(roleId)
        if (!role || role.isSystem) return false

        const deleted = this.roles.delete(roleId)
        if (deleted) {
            logger.info('Role deleted', { roleId })
        }
        return deleted
    }

    /**
     * Assign role to user
     */
    assignRoleToUser(userId: string, roleId: string, assignedBy: string, expiresAt?: Date, conditions?: UserRoleCondition[]): UserRole {
        const userRole: UserRole = {
            id: `user_role_${Date.now()}`,
            userId,
            roleId,
            assignedBy,
            assignedAt: new Date(),
            expiresAt,
            isActive: true,
            conditions
        }

        const userRoles = this.userRoles.get(userId) || []
        userRoles.push(userRole)
        this.userRoles.set(userId, userRoles)

        logger.info('Role assigned to user', { userId, roleId, assignedBy })
        return userRole
    }

    /**
     * Remove role from user
     */
    removeRoleFromUser(userId: string, roleId: string): boolean {
        const userRoles = this.userRoles.get(userId)
        if (!userRoles) return false

        const index = userRoles.findIndex(ur => ur.roleId === roleId && ur.isActive)
        if (index === -1) return false

        userRoles[index].isActive = false
        logger.info('Role removed from user', { userId, roleId })
        return true
    }

    /**
     * Get user roles
     */
    getUserRoles(userId: string): UserRole[] {
        return this.userRoles.get(userId) || []
    }

    /**
     * Get user effective roles
     */
    getUserEffectiveRoles(userId: string): Role[] {
        const userRoles = this.getUserRoles(userId)
        const now = new Date()
        const effectiveRoles: Role[] = []

        for (const userRole of userRoles) {
            if (!userRole.isActive) continue
            if (userRole.expiresAt && userRole.expiresAt < now) continue

            const role = this.getRole(userRole.roleId)
            if (role && role.isActive) {
                effectiveRoles.push(role)
            }
        }

        return effectiveRoles
    }

    /**
     * Get user permissions
     */
    getUserPermissions(userId: string): Permission[] {
        const effectiveRoles = this.getUserEffectiveRoles(userId)
        const permissions: Permission[] = []
        const permissionIds = new Set<string>()

        for (const role of effectiveRoles) {
            for (const permissionId of role.permissions) {
                if (!permissionIds.has(permissionId)) {
                    const permission = this.getPermission(permissionId)
                    if (permission) {
                        permissions.push(permission)
                        permissionIds.add(permissionId)
                    }
                }
            }
        }

        return permissions
    }

    /**
     * Check if user has permission
     */
    hasPermission(userId: string, permissionId: string, resourceId?: string, context?: Record<string, any>): boolean {
        const permissions = this.getUserPermissions(userId)
        const permission = permissions.find(p => p.id === permissionId)
        
        if (!permission) return false

        // Check conditions if any
        if (permission.conditions && permission.conditions.length > 0) {
            return this.evaluateConditions(permission.conditions, context)
        }

        return true
    }

    /**
     * Check if user can perform action on resource
     */
    canPerformAction(userId: string, action: string, resource: string, resourceId?: string, context?: Record<string, any>): boolean {
        const permissions = this.getUserPermissions(userId)
        
        for (const permission of permissions) {
            if (permission.resource === resource && permission.action === action) {
                if (!permission.conditions || this.evaluateConditions(permission.conditions, context)) {
                    return true
                }
            }
        }

        return false
    }

    /**
     * Evaluate permission conditions
     */
    private evaluateConditions(conditions: PermissionCondition[], context?: Record<string, any>): boolean {
        if (!context) return true

        for (const condition of conditions) {
            const fieldValue = this.getNestedValue(context, condition.field)
            const conditionValue = condition.value

            switch (condition.operator) {
                case 'equals':
                    if (fieldValue !== conditionValue) return false
                    break
                case 'not_equals':
                    if (fieldValue === conditionValue) return false
                    break
                case 'contains':
                    if (!fieldValue || !fieldValue.includes(conditionValue)) return false
                    break
                case 'not_contains':
                    if (fieldValue && fieldValue.includes(conditionValue)) return false
                    break
                case 'in':
                    if (!Array.isArray(conditionValue) || !conditionValue.includes(fieldValue)) return false
                    break
                case 'not_in':
                    if (Array.isArray(conditionValue) && conditionValue.includes(fieldValue)) return false
                    break
                case 'greater_than':
                    if (fieldValue <= conditionValue) return false
                    break
                case 'less_than':
                    if (fieldValue >= conditionValue) return false
                    break
                default:
                    return false
            }
        }

        return true
    }

    /**
     * Get nested object value
     */
    private getNestedValue(obj: any, path: string): any {
        return path.split('.').reduce((current, key) => current?.[key], obj)
    }

    /**
     * Create policy
     */
    createPolicy(policy: Omit<Policy, 'id' | 'createdAt' | 'updatedAt'>): Policy {
        const newPolicy: Policy = {
            id: `policy_${Date.now()}`,
            ...policy,
            createdAt: new Date(),
            updatedAt: new Date()
        }

        this.policies.set(newPolicy.id, newPolicy)
        logger.info('Policy created', { policyId: newPolicy.id, name: newPolicy.name })
        return newPolicy
    }

    /**
     * Get policy
     */
    getPolicy(policyId: string): Policy | null {
        return this.policies.get(policyId) || null
    }

    /**
     * Get all policies
     */
    getAllPolicies(): Policy[] {
        return Array.from(this.policies.values())
    }

    /**
     * Update policy
     */
    updatePolicy(policyId: string, updates: Partial<Policy>): boolean {
        const policy = this.policies.get(policyId)
        if (!policy) return false

        const updatedPolicy = { ...policy, ...updates, updatedAt: new Date() }
        this.policies.set(policyId, updatedPolicy)
        logger.info('Policy updated', { policyId })
        return true
    }

    /**
     * Delete policy
     */
    deletePolicy(policyId: string): boolean {
        const deleted = this.policies.delete(policyId)
        if (deleted) {
            logger.info('Policy deleted', { policyId })
        }
        return deleted
    }

    /**
     * Evaluate access decision
     */
    evaluateAccess(userId: string, action: string, resource: string, resourceId?: string, context?: Record<string, any>): AccessDecision {
        const decision: AccessDecision = {
            allowed: false,
            reason: '',
            matchedPolicies: [],
            matchedRoles: [],
            matchedPermissions: [],
            conditions: []
        }

        // Check permissions first
        const permissions = this.getUserPermissions(userId)
        for (const permission of permissions) {
            if (permission.resource === resource && permission.action === action) {
                if (!permission.conditions || this.evaluateConditions(permission.conditions, context)) {
                    decision.allowed = true
                    decision.matchedPermissions.push(permission.id)
                    decision.reason = 'Permission granted'
                }
            }
        }

        // Check policies
        const policies = Array.from(this.policies.values()).filter(p => p.isActive)
        for (const policy of policies) {
            if (this.matchesPolicy(policy, userId, action, resource, resourceId, context)) {
                decision.matchedPolicies.push(policy.id)
                if (policy.effect === 'allow') {
                    decision.allowed = true
                    decision.reason = 'Policy allows access'
                } else if (policy.effect === 'deny') {
                    decision.allowed = false
                    decision.reason = 'Policy denies access'
                    break
                }
            }
        }

        // Log access decision
        this.logAccessDecision(userId, action, resource, resourceId || '', decision.allowed ? 'allow' : 'deny', decision.reason, context)

        return decision
    }

    /**
     * Check if policy matches
     */
    private matchesPolicy(policy: Policy, userId: string, action: string, resource: string, resourceId?: string, context?: Record<string, any>): boolean {
        // Check subjects
        const subjectMatch = policy.subjects.some(subject => {
            if (subject.type === 'user' && subject.id === userId) return true
            if (subject.type === 'role') {
                const userRoles = this.getUserEffectiveRoles(userId)
                return userRoles.some(role => role.id === subject.id)
            }
            return false
        })

        if (!subjectMatch) return false

        // Check resources
        const resourceMatch = policy.resources.some(res => {
            if (res.type === resource) {
                if (res.id && res.id !== resourceId) return false
                if (res.pattern && !this.matchesPattern(resourceId || '', res.pattern)) return false
                return true
            }
            return false
        })

        if (!resourceMatch) return false

        // Check actions
        if (!policy.actions.includes(action)) return false

        // Check conditions
        if (policy.conditions.length > 0) {
            return this.evaluateConditions(policy.conditions, context)
        }

        return true
    }

    /**
     * Check if string matches pattern
     */
    private matchesPattern(str: string, pattern: string): boolean {
        const regex = new RegExp(pattern.replace(/\*/g, '.*'))
        return regex.test(str)
    }

    /**
     * Log access decision
     */
    private logAccessDecision(userId: string, action: string, resource: string, resourceId: string, result: 'allow' | 'deny', reason: string, context?: Record<string, any>): void {
        const auditLog: AuditLog = {
            id: `audit_${Date.now()}`,
            userId,
            action,
            resource,
            resourceId,
            result,
            reason,
            timestamp: new Date(),
            ipAddress: context?.ipAddress || 'unknown',
            userAgent: context?.userAgent || 'unknown',
            metadata: context || {}
        }

        this.auditLogs.push(auditLog)
        logger.info('Access decision logged', { userId, action, resource, result })
    }

    /**
     * Get audit logs
     */
    getAuditLogs(userId?: string, action?: string, resource?: string, limit: number = 100): AuditLog[] {
        let logs = this.auditLogs

        if (userId) {
            logs = logs.filter(log => log.userId === userId)
        }

        if (action) {
            logs = logs.filter(log => log.action === action)
        }

        if (resource) {
            logs = logs.filter(log => log.resource === resource)
        }

        return logs.slice(-limit)
    }

    /**
     * Get user access summary
     */
    getUserAccessSummary(userId: string): {
        roles: Role[]
        permissions: Permission[]
        policies: Policy[]
        recentActivity: AuditLog[]
    } {
        const roles = this.getUserEffectiveRoles(userId)
        const permissions = this.getUserPermissions(userId)
        const policies = Array.from(this.policies.values()).filter(p => p.isActive)
        const recentActivity = this.getAuditLogs(userId, undefined, undefined, 10)

        return {
            roles,
            permissions,
            policies,
            recentActivity
        }
    }
}

export default new RBACService()
