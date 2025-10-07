/**
 * Socket.IO Service
 * Construction Master App - Real-time Collaboration
 */

import { Server as SocketIOServer, Socket } from 'socket.io'
import { Server as HTTPServer } from 'http'
import jwt from 'jsonwebtoken'
import User from '../models/User'
import { authenticateToken } from '../middleware/auth'
import accessControlService from './accessControlService'

interface AuthenticatedSocket extends Socket {
    user?: {
        id: string
        email: string
        name: string
        role: string
    }
    projectId?: string
    sheetId?: string
}

interface CursorPosition {
    x: number
    y: number
    user: {
        id: string
        name: string
        color: string
    }
}

interface SelectionRange {
    startRow: number
    endRow: number
    startCol: number
    endCol: number
}

interface UserInfo {
    id: string
    name: string
    email: string
    role: string
    color: string
    isActive: boolean
    lastSeen: Date
}

interface CollaborationState {
    cursors: Map<string, CursorPosition>
    selections: Map<string, { range: SelectionRange; user: UserInfo }>
    users: Map<string, UserInfo>
}

class SocketService {
    private io: SocketIOServer
    private collaborationStates: Map<string, CollaborationState> = new Map()
    
    // Rate limiting
    private connectionAttempts: Map<string, { count: number; lastAttempt: number }> = new Map()
    private eventCounts: Map<string, { count: number; lastReset: number }> = new Map()
    private readonly MAX_CONNECTIONS_PER_IP = 5
    private readonly MAX_EVENTS_PER_MINUTE = 100
    private readonly CONNECTION_WINDOW = 60000 // 1 minute
    private readonly EVENT_WINDOW = 60000 // 1 minute

    constructor(server: HTTPServer) {
        this.io = new SocketIOServer(server, {
            cors: {
                origin: process.env.CLIENT_URL || 'http://localhost:3016',
                methods: ['GET', 'POST'],
                credentials: true
            },
            transports: ['websocket', 'polling']
        })

        this.setupMiddleware()
        this.setupEventHandlers()
    }

    private setupMiddleware() {
        // Authentication middleware
        this.io.use(async (socket: AuthenticatedSocket, next) => {
            try {
                const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '')

                if (!token) {
                    return next(new Error('Authentication token required'))
                }

                const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
                const user = await User.findById(decoded.userId).select('-password')

                if (!user || !user.isActive) {
                    return next(new Error('User not found or inactive'))
                }

                socket.user = {
                    id: user._id.toString(),
                    email: user.email,
                    name: user.name,
                    role: user.role
                }

                next()
            } catch (error) {
                next(new Error('Authentication failed'))
            }
        })

        // Rate limiting middleware
        this.io.use((socket, next) => {
            this.handleRateLimiting(socket, next)
        })
    }

    private setupEventHandlers() {
        this.io.on('connection', (socket: AuthenticatedSocket) => {
            console.log(`👤 User connected: ${socket.user?.name} (${socket.id})`)

            // Join project room
            socket.on('join_project', async (data: { projectId: string }) => {
                try {
                    await this.handleJoinProject(socket, data.projectId)
                } catch (error) {
                    socket.emit('error', { message: 'Failed to join project' })
                }
            })

            // Leave project room
            socket.on('leave_project', (data: { projectId: string }) => {
                this.handleLeaveProject(socket, data.projectId)
            })

            // Join sheet room for real-time collaboration
            socket.on('join_sheet', async (data: { sheetId: string }) => {
                try {
                    await this.handleJoinSheet(socket, data.sheetId)
                } catch (error) {
                    socket.emit('error', { message: 'Failed to join sheet' })
                }
            })

            // Leave sheet room
            socket.on('leave_sheet', (data: { sheetId: string }) => {
                this.handleLeaveSheet(socket, data.sheetId)
            })

            // Real-time cursor tracking
            socket.on('cursor_move', (data: { x: number; y: number; sheetId?: string }) => {
                this.handleCursorMove(socket, data)
            })

            // Real-time cell editing
            socket.on('cell_edit', (data: {
                sheetId: string
                row: number
                col: number
                value: string
                type?: string
            }) => {
                if (!this.checkEventRateLimit(socket.id)) {
                    socket.emit('error', { message: 'Rate limit exceeded' })
                    return
                }
                this.handleCellEdit(socket, data)
            })

            // Real-time selection tracking
            socket.on('selection_change', (data: {
                sheetId: string
                range: { start: { row: number; col: number }, end: { row: number; col: number } }
            }) => {
                this.handleSelectionChange(socket, data)
            })

            // Typing indicators
            socket.on('typing_start', (data: { sheetId: string; cell: string }) => {
                this.handleTypingStart(socket, data)
            })

            socket.on('typing_stop', (data: { sheetId: string; cell: string }) => {
                this.handleTypingStop(socket, data)
            })

            // Chat messages
            socket.on('chat_message', async (data: {
                projectId: string
                message: string
                type?: 'text' | 'system' | 'mention'
            }) => {
                if (!this.checkEventRateLimit(socket.id)) {
                    socket.emit('error', { message: 'Rate limit exceeded' })
                    return
                }
                try {
                    await this.handleChatMessage(socket, data)
                } catch (error) {
                    socket.emit('error', { message: 'Failed to send message' })
                }
            })

            // File upload notifications
            socket.on('file_uploaded', (data: {
                projectId: string
                fileName: string
                fileSize: number
            }) => {
                this.handleFileUploaded(socket, data)
            })

            // Project updates
            socket.on('project_update', (data: {
                projectId: string
                updates: any
            }) => {
                this.handleProjectUpdate(socket, data)
            })

            // Disconnect handling
            socket.on('disconnect', (reason) => {
                this.handleDisconnect(socket, reason)
            })

            // Error handling
            socket.on('error', (error) => {
                console.error('Socket error:', error)
            })
        })
    }

    private async handleJoinProject(socket: AuthenticatedSocket, projectId: string) {
        try {
            // Verify user has access to project
            const access = await accessControlService.checkProjectAccess(
                socket.user!.id, 
                socket.user!.role, 
                projectId, 
                'view'
            )

            if (!access.hasAccess) {
                socket.emit('error', { 
                    message: 'אין הרשאה לגשת לפרויקט זה',
                    code: 'PROJECT_ACCESS_DENIED'
                })
                return
            }

            socket.projectId = projectId
            socket.join(`project:${projectId}`)

            // Notify other users
            socket.to(`project:${projectId}`).emit('user_joined', {
                user: socket.user,
                timestamp: new Date()
            })

            // Get current project users
            const projectUsers = await this.getProjectUsers(projectId)
            socket.emit('project_users', projectUsers)

            console.log(`👥 ${socket.user?.name} joined project ${projectId}`)
        } catch (error) {
            console.error('Error joining project:', error)
            socket.emit('error', { 
                message: 'שגיאה בהצטרפות לפרויקט',
                code: 'JOIN_PROJECT_ERROR'
            })
        }
    }

    private handleLeaveProject(socket: AuthenticatedSocket, projectId: string) {
        socket.leave(`project:${projectId}`)
        socket.projectId = undefined

        // Notify other users
        socket.to(`project:${projectId}`).emit('user_left', {
            user: socket.user,
            timestamp: new Date()
        })

        console.log(`👋 ${socket.user?.name} left project ${projectId}`)
    }

    private async handleJoinSheet(socket: AuthenticatedSocket, sheetId: string) {
        try {
            // Verify user has access to sheet
            const access = await accessControlService.checkSheetAccess(
                socket.user!.id, 
                socket.user!.role, 
                sheetId, 
                'view'
            )

            if (!access.hasAccess) {
                socket.emit('error', { 
                    message: 'אין הרשאה לגשת לגיליון זה',
                    code: 'SHEET_ACCESS_DENIED'
                })
                return
            }

            socket.sheetId = sheetId
            socket.join(`sheet:${sheetId}`)

            // Initialize collaboration state if not exists
            if (!this.collaborationStates.has(sheetId)) {
                this.collaborationStates.set(sheetId, {
                    cursors: new Map(),
                    selections: new Map(),
                    users: new Map()
                })
            }

            const state = this.collaborationStates.get(sheetId)!
            state.users.set(socket.id, socket.user)

            // Send current collaboration state to new user
            socket.emit('collaboration_state', {
                cursors: Array.from(state.cursors.values()),
                selections: Array.from(state.selections.values()),
                users: Array.from(state.users.values())
            })

            // Notify other users
            socket.to(`sheet:${sheetId}`).emit('user_joined_sheet', {
                user: socket.user,
                timestamp: new Date()
            })

            console.log(`📊 ${socket.user?.name} joined sheet ${sheetId}`)
        } catch (error) {
            console.error('Error joining sheet:', error)
            socket.emit('error', { 
                message: 'שגיאה בהצטרפות לגיליון',
                code: 'JOIN_SHEET_ERROR'
            })
        }
    }

    private handleLeaveSheet(socket: AuthenticatedSocket, sheetId: string) {
        socket.leave(`sheet:${sheetId}`)
        socket.sheetId = undefined

        // Remove from collaboration state
        const state = this.collaborationStates.get(sheetId)
        if (state) {
            state.cursors.delete(socket.id)
            state.selections.delete(socket.id)
            state.users.delete(socket.id)

            // Notify other users
            socket.to(`sheet:${sheetId}`).emit('user_left_sheet', {
                userId: socket.user?.id,
                timestamp: new Date()
            })

            // Clean up empty state
            if (state.users.size === 0) {
                this.collaborationStates.delete(sheetId)
            }
        }

        console.log(`📊 ${socket.user?.name} left sheet ${sheetId}`)
    }

    private handleCursorMove(socket: AuthenticatedSocket, data: { x: number; y: number; sheetId?: string }) {
        if (!data.sheetId) return

        const state = this.collaborationStates.get(data.sheetId)
        if (state) {
            state.cursors.set(socket.id, {
                x: data.x,
                y: data.y,
                user: socket.user
            })

            // Broadcast to other users in the sheet
            socket.to(`sheet:${data.sheetId}`).emit('cursor_moved', {
                userId: socket.user?.id,
                user: socket.user,
                x: data.x,
                y: data.y,
                timestamp: new Date()
            })
        }
    }

    private handleCellEdit(socket: AuthenticatedSocket, data: {
        sheetId: string
        row: number
        col: number
        value: string
        type?: string
    }) {
        // Broadcast cell edit to other users
        socket.to(`sheet:${data.sheetId}`).emit('cell_edited', {
            userId: socket.user?.id,
            user: socket.user,
            row: data.row,
            col: data.col,
            value: data.value,
            type: data.type,
            timestamp: new Date()
        })

        console.log(`✏️ ${socket.user?.name} edited cell [${data.row},${data.col}] in sheet ${data.sheetId}`)
    }

    private handleSelectionChange(socket: AuthenticatedSocket, data: {
        sheetId: string
        range: { start: { row: number; col: number }, end: { row: number; col: number } }
    }) {
        const state = this.collaborationStates.get(data.sheetId)
        if (state) {
            state.selections.set(socket.id, {
                range: data.range,
                user: socket.user
            })

            // Broadcast selection to other users
            socket.to(`sheet:${data.sheetId}`).emit('selection_changed', {
                userId: socket.user?.id,
                user: socket.user,
                range: data.range,
                timestamp: new Date()
            })
        }
    }

    private handleTypingStart(socket: AuthenticatedSocket, data: { sheetId: string; cell: string }) {
        socket.to(`sheet:${data.sheetId}`).emit('user_typing', {
            userId: socket.user?.id,
            user: socket.user,
            cell: data.cell,
            timestamp: new Date()
        })
    }

    private handleTypingStop(socket: AuthenticatedSocket, data: { sheetId: string; cell: string }) {
        socket.to(`sheet:${data.sheetId}`).emit('user_stopped_typing', {
            userId: socket.user?.id,
            user: socket.user,
            cell: data.cell,
            timestamp: new Date()
        })
    }

    private async handleChatMessage(socket: AuthenticatedSocket, data: {
        projectId: string
        message: string
        type?: 'text' | 'system' | 'mention'
    }) {
        try {
            // Save message to database
            const ChatMessage = require('../models/ChatMessage').default
            const messageId = require('crypto').randomUUID()
            
            const chatMessage = new ChatMessage({
                _id: messageId,
                projectId: data.projectId,
                userId: socket.user?.id,
                message: data.message,
                type: data.type || 'text',
                timestamp: new Date()
            })

            await chatMessage.save()

            // Broadcast message to project room
            this.io.to(`project:${data.projectId}`).emit('chat_message', {
                id: messageId,
                userId: socket.user?.id,
                user: socket.user,
                message: data.message,
                type: data.type || 'text',
                timestamp: new Date()
            })

            console.log(`💬 ${socket.user?.name} sent message in project ${data.projectId}`)
        } catch (error) {
            console.error('Error saving chat message:', error)
            socket.emit('error', { 
                message: 'שגיאה בשמירת הודעה',
                code: 'MESSAGE_SAVE_ERROR'
            })
        }
    }

    private handleFileUploaded(socket: AuthenticatedSocket, data: {
        projectId: string
        fileName: string
        fileSize: number
    }) {
        // Broadcast file upload notification
        socket.to(`project:${data.projectId}`).emit('file_uploaded', {
            userId: socket.user?.id,
            user: socket.user,
            fileName: data.fileName,
            fileSize: data.fileSize,
            timestamp: new Date()
        })

        console.log(`📁 ${socket.user?.name} uploaded file ${data.fileName} in project ${data.projectId}`)
    }

    private handleProjectUpdate(socket: AuthenticatedSocket, data: {
        projectId: string
        updates: any
    }) {
        // Broadcast project update
        socket.to(`project:${data.projectId}`).emit('project_updated', {
            userId: socket.user?.id,
            user: socket.user,
            updates: data.updates,
            timestamp: new Date()
        })

        console.log(`🔄 ${socket.user?.name} updated project ${data.projectId}`)
    }

    private handleDisconnect(socket: AuthenticatedSocket, reason: string) {
        console.log(`👋 User disconnected: ${socket.user?.name} (${reason})`)

        // Clean up rate limiting data
        this.cleanupRateLimitData(socket.id)

        // Clean up collaboration states
        if (socket.sheetId) {
            const state = this.collaborationStates.get(socket.sheetId)
            if (state) {
                state.cursors.delete(socket.id)
                state.selections.delete(socket.id)
                state.users.delete(socket.id)

                // Notify other users
                socket.to(`sheet:${socket.sheetId}`).emit('user_left_sheet', {
                    userId: socket.user?.id,
                    timestamp: new Date()
                })

                // Clean up empty state
                if (state.users.size === 0) {
                    this.collaborationStates.delete(socket.sheetId)
                }
            }
        }

        // Notify project users
        if (socket.projectId) {
            socket.to(`project:${socket.projectId}`).emit('user_left', {
                user: socket.user,
                timestamp: new Date()
            })
        }
    }

    private async getProjectUsers(projectId: string): Promise<any[]> {
        try {
            return await accessControlService.getProjectUsers(projectId)
        } catch (error) {
            console.error('Error getting project users:', error)
            return []
        }
    }

    // Public methods for server-side events
    public notifyProjectUsers(projectId: string, event: string, data: Record<string, unknown>) {
        this.io.to(`project:${projectId}`).emit(event, data)
    }

    public notifySheetUsers(sheetId: string, event: string, data: Record<string, unknown>) {
        this.io.to(`sheet:${sheetId}`).emit(event, data)
    }

    public notifyUser(userId: string, event: string, data: Record<string, unknown>) {
        // Find socket by user ID and emit
        this.io.sockets.sockets.forEach((socket: AuthenticatedSocket) => {
            if (socket.user?.id === userId) {
                socket.emit(event, data)
            }
        })
    }

    public getConnectedUsers(): UserInfo[] {
        const users: UserInfo[] = []
        this.io.sockets.sockets.forEach((socket: AuthenticatedSocket) => {
            if (socket.user) {
                users.push({
                    ...socket.user,
                    socketId: socket.id,
                    projectId: socket.projectId,
                    sheetId: socket.sheetId
                })
            }
        })
        return users
    }

    public getProjectCollaborationState(projectId: string): CollaborationState | undefined {
        try {
            // Get all connected users for this project
            const projectUsers = this.getConnectedUsers().filter(u => u.projectId === projectId)
            
            // Get all sheets for this project that have active collaboration
            const projectSheets = Array.from(this.collaborationStates.keys()).filter(sheetId => {
                const state = this.collaborationStates.get(sheetId)
                return state && state.users.size > 0
            })

            // Get detailed collaboration state for each sheet
            const sheetsCollaboration = projectSheets.map(sheetId => {
                const state = this.collaborationStates.get(sheetId)
                return {
                    sheetId,
                    activeUsers: Array.from(state?.users.values() || []),
                    cursors: Array.from(state?.cursors.values() || []),
                    selections: Array.from(state?.selections.values() || [])
                }
            })

            return {
                projectId,
                users: projectUsers,
                sheets: sheetsCollaboration,
                totalActiveUsers: projectUsers.length,
                totalActiveSheets: projectSheets.length,
                lastUpdated: new Date()
            }
        } catch (error) {
            console.error('Error getting project collaboration state:', error)
            return undefined
        }
    }

    // שליחת התראה למשתמש ספציפי
    public sendNotificationToUser(userId: string, notification: {
        id: string
        title: string
        message: string
        type: 'info' | 'warning' | 'error' | 'success'
        timestamp: Date
        data?: Record<string, unknown>
    }) {
        this.io.sockets.sockets.forEach((socket: AuthenticatedSocket) => {
            if (socket.user && socket.user.id === userId) {
                socket.emit('notification', {
                    id: notification._id,
                    title: notification.title,
                    message: notification.message,
                    type: notification.type,
                    priority: notification.priority,
                    timestamp: notification.createdAt,
                    projectId: notification.projectId
                })
            }
        })
    }

    // שליחת התראה לכל המשתמשים בפרויקט
    public sendNotificationToProject(projectId: string, notification: {
        id: string
        title: string
        message: string
        type: 'info' | 'warning' | 'error' | 'success'
        timestamp: Date
        data?: Record<string, unknown>
    }) {
        const room = `project:${projectId}`
        this.io.to(room).emit('project_notification', {
            id: notification._id,
            title: notification.title,
            message: notification.message,
            type: notification.type,
            priority: notification.priority,
            timestamp: notification.createdAt
        })
    }

    public getIO(): SocketIOServer {
        return this.io
    }

    /**
     * Get collaboration state for a specific sheet
     */
    public getSheetCollaborationState(sheetId: string): any {
        const state = this.collaborationStates.get(sheetId)
        if (!state) {
            return null
        }

        return {
            sheetId,
            activeUsers: Array.from(state.users.values()),
            cursors: Array.from(state.cursors.values()),
            selections: Array.from(state.selections.values()),
            totalUsers: state.users.size,
            lastUpdated: new Date()
        }
    }

    /**
     * Get all active collaboration states
     */
    public getAllCollaborationStates(): any[] {
        const states = []
        for (const [sheetId, state] of this.collaborationStates.entries()) {
            if (state.users.size > 0) {
                states.push({
                    sheetId,
                    activeUsers: Array.from(state.users.values()),
                    cursors: Array.from(state.cursors.values()),
                    selections: Array.from(state.selections.values()),
                    totalUsers: state.users.size
                })
            }
        }
        return states
    }

    /**
     * Clean up inactive collaboration states
     */
    public cleanupInactiveStates(): void {
        const now = Date.now()
        const INACTIVE_THRESHOLD = 5 * 60 * 1000 // 5 minutes

        for (const [sheetId, state] of this.collaborationStates.entries()) {
            if (state.users.size === 0) {
                this.collaborationStates.delete(sheetId)
                console.log(`🧹 Cleaned up inactive collaboration state for sheet ${sheetId}`)
            }
        }
    }

    /**
     * Get user's current collaboration activities
     */
    public getUserCollaborationActivities(userId: string): any[] {
        const activities = []
        
        for (const [sheetId, state] of this.collaborationStates.entries()) {
            const user = Array.from(state.users.values()).find(u => u.id === userId)
            if (user) {
                activities.push({
                    sheetId,
                    user,
                    cursor: state.cursors.get(userId),
                    selection: state.selections.get(userId)
                })
            }
        }
        
        return activities
    }

    /**
     * Handle rate limiting for socket connections
     */
    private handleRateLimiting(socket: any, next: (err?: Error) => void) {
        const clientIP = socket.handshake.address || socket.handshake.headers['x-forwarded-for'] || 'unknown'
        const now = Date.now()

        // Check connection rate limiting
        const connectionData = this.connectionAttempts.get(clientIP)
        if (connectionData) {
            // Reset if window has passed
            if (now - connectionData.lastAttempt > this.CONNECTION_WINDOW) {
                connectionData.count = 0
                connectionData.lastAttempt = now
            }

            // Check if limit exceeded
            if (connectionData.count >= this.MAX_CONNECTIONS_PER_IP) {
                console.warn(`Rate limit exceeded for IP: ${clientIP}`)
                return next(new Error('Too many connection attempts'))
            }

            connectionData.count++
            connectionData.lastAttempt = now
        } else {
            this.connectionAttempts.set(clientIP, { count: 1, lastAttempt: now })
        }

        // Initialize event counting for this socket
        this.eventCounts.set(socket.id, { count: 0, lastReset: now })

        next()
    }

    /**
     * Check event rate limiting for a socket
     */
    private checkEventRateLimit(socketId: string): boolean {
        const now = Date.now()
        const eventData = this.eventCounts.get(socketId)

        if (!eventData) {
            return false
        }

        // Reset if window has passed
        if (now - eventData.lastReset > this.EVENT_WINDOW) {
            eventData.count = 0
            eventData.lastReset = now
        }

        // Check if limit exceeded
        if (eventData.count >= this.MAX_EVENTS_PER_MINUTE) {
            console.warn(`Event rate limit exceeded for socket: ${socketId}`)
            return false
        }

        eventData.count++
        return true
    }

    /**
     * Clean up rate limiting data for disconnected sockets
     */
    private cleanupRateLimitData(socketId: string) {
        this.eventCounts.delete(socketId)
    }
}

export default SocketService
