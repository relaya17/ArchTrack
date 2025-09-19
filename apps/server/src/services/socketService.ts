/**
 * Socket.IO Service
 * Construction Master App - Real-time Collaboration
 */

import { Server as SocketIOServer, Socket } from 'socket.io'
import { Server as HTTPServer } from 'http'
import jwt from 'jsonwebtoken'
import User from '../models/User'
import { authenticateToken } from '../middleware/auth'

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

interface CollaborationState {
    cursors: Map<string, { x: number; y: number; user: any }>
    selections: Map<string, { range: any; user: any }>
    users: Map<string, any>
}

class SocketService {
    private io: SocketIOServer
    private collaborationStates: Map<string, CollaborationState> = new Map()

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
            // TODO: Implement rate limiting for socket connections
            next()
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
        // TODO: Verify user has access to project
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
        // TODO: Verify user has access to sheet
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
        // TODO: Save message to database

        // Broadcast message to project room
        this.io.to(`project:${data.projectId}`).emit('chat_message', {
            id: require('crypto').randomUUID(),
            userId: socket.user?.id,
            user: socket.user,
            message: data.message,
            type: data.type || 'text',
            timestamp: new Date()
        })

        console.log(`💬 ${socket.user?.name} sent message in project ${data.projectId}`)
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
        // TODO: Get actual project users from database
        return []
    }

    // Public methods for server-side events
    public notifyProjectUsers(projectId: string, event: string, data: any) {
        this.io.to(`project:${projectId}`).emit(event, data)
    }

    public notifySheetUsers(sheetId: string, event: string, data: any) {
        this.io.to(`sheet:${sheetId}`).emit(event, data)
    }

    public notifyUser(userId: string, event: string, data: any) {
        // Find socket by user ID and emit
        this.io.sockets.sockets.forEach((socket: AuthenticatedSocket) => {
            if (socket.user?.id === userId) {
                socket.emit(event, data)
            }
        })
    }

    public getConnectedUsers(): any[] {
        const users: any[] = []
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

    public getProjectCollaborationState(projectId: string): any {
        // TODO: Return collaboration state for project
        return {
            users: this.getConnectedUsers().filter(u => u.projectId === projectId),
            sheets: Array.from(this.collaborationStates.keys())
        }
    }

    // שליחת התראה למשתמש ספציפי
    public sendNotificationToUser(userId: string, notification: any) {
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
    public sendNotificationToProject(projectId: string, notification: any) {
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
}

export default SocketService
