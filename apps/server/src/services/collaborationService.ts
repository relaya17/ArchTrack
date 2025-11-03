/**
 * Real-time Collaboration Service
 * Construction Master App - Live Collaboration Features
 */

import { Server as SocketIOServer } from 'socket.io';
import logger from '../config/logger';
import { businessMetrics } from '../config/metrics';
import User from '../models/User';
import Project from '../models/Project';

interface CollaborationSession {
    id: string;
    projectId: string;
    participants: Map<string, {
        userId: string;
        socketId: string;
        name: string;
        email: string;
        role: string;
        cursorPosition?: { x: number; y: number };
        lastSeen: Date;
    }>;
    documentState: any;
    lastModified: Date;
    version: number;
}

class CollaborationService {
    private io: SocketIOServer | null = null;
    private activeSessions: Map<string, CollaborationSession> = new Map();
    private userSessions: Map<string, string> = new Map(); // userId -> sessionId

    constructor() {
        this.cleanupInactiveSessions();
    }

    /**
     * Initialize collaboration service with Socket.IO
     */
    initialize(io: SocketIOServer): void {
        this.io = io;
        this.setupEventHandlers();
        logger.info('Collaboration service initialized');
    }

    /**
     * Setup Socket.IO event handlers
     */
    private setupEventHandlers(): void {
        if (!this.io) return;

        this.io.on('connection', (socket) => {
            logger.info('User connected to collaboration', { socketId: socket.id });

            // Join project collaboration room
            socket.on('join-project', async (data) => {
                try {
                    await this.handleJoinProject(socket, data);
                } catch (error) {
                    logger.error('Error joining project', error);
                    socket.emit('error', { message: 'Failed to join project' });
                }
            });

            // Leave project collaboration room
            socket.on('leave-project', async (data) => {
                try {
                    await this.handleLeaveProject(socket, data);
                } catch (error) {
                    logger.error('Error leaving project', error);
                }
            });

            // Handle cursor movement
            socket.on('cursor-move', (data) => {
                this.handleCursorMove(socket, data);
            });

            // Handle document changes
            socket.on('document-change', (data) => {
                this.handleDocumentChange(socket, data);
            });

            // Handle selection changes
            socket.on('selection-change', (data) => {
                this.handleSelectionChange(socket, data);
            });

            // Handle comment addition
            socket.on('add-comment', (data) => {
                this.handleAddComment(socket, data);
            });

            // Handle comment resolution
            socket.on('resolve-comment', (data) => {
                this.handleResolveComment(socket, data);
            });

            // Handle user typing indicator
            socket.on('typing-start', (data) => {
                this.handleTypingStart(socket, data);
            });

            socket.on('typing-stop', (data) => {
                this.handleTypingStop(socket, data);
            });

            // Handle disconnect
            socket.on('disconnect', () => {
                this.handleDisconnect(socket);
            });
        });
    }

    /**
     * Handle user joining a project
     */
    private async handleJoinProject(socket: any, data: { projectId: string; userId: string }): Promise<void> {
        const { projectId, userId } = data;

        // Verify user has access to project
        const user = await User.findById(userId);
        const project = await Project.findById(projectId);

        if (!user || !project) {
            socket.emit('error', { message: 'Invalid user or project' });
            return;
        }

        // Check user permissions
        if (!project.teamMembers.some(member => member.userId.toString() === userId)) {
            socket.emit('error', { message: 'Access denied to project' });
            return;
        }

        // Create or get collaboration session
        let session = this.activeSessions.get(projectId);
        if (!session) {
            session = {
                id: projectId,
                projectId,
                participants: new Map(),
                documentState: {},
                lastModified: new Date(),
                version: 1,
            };
            this.activeSessions.set(projectId, session);
        }

        // Add user to session
        session.participants.set(socket.id, {
            userId,
            socketId: socket.id,
            name: user.name,
            email: user.email,
            role: project.teamMembers.find(m => m.userId.toString() === userId)?.role || 'viewer',
            lastSeen: new Date(),
        });

        this.userSessions.set(userId, projectId);

        // Join socket room
        socket.join(projectId);

        // Notify other participants
        socket.to(projectId).emit('user-joined', {
            userId,
            name: user.name,
            role: project.teamMembers.find(m => m.userId.toString() === userId)?.role || 'viewer',
        });

        // Send current session state to user
        socket.emit('session-state', {
            participants: Array.from(session.participants.values()),
            documentState: session.documentState,
            version: session.version,
        });

        // Record metrics
        businessMetrics.apiCallsTotal.inc({
            endpoint: 'collaboration/join',
            method: 'WEBSOCKET',
        });

        logger.info('User joined project collaboration', {
            userId,
            projectId,
            socketId: socket.id,
        });
    }

    /**
     * Handle user leaving a project
     */
    private async handleLeaveProject(socket: any, data: { projectId: string; userId: string }): Promise<void> {
        const { projectId, userId } = data;

        const session = this.activeSessions.get(projectId);
        if (!session) return;

        // Remove user from session
        const participant = session.participants.get(socket.id);
        if (participant) {
            session.participants.delete(socket.id);
            this.userSessions.delete(userId);

            // Leave socket room
            socket.leave(projectId);

            // Notify other participants
            socket.to(projectId).emit('user-left', {
                userId,
                name: participant.name,
            });

            // Clean up session if empty
            if (session.participants.size === 0) {
                this.activeSessions.delete(projectId);
            }

            logger.info('User left project collaboration', {
                userId,
                projectId,
                socketId: socket.id,
            });
        }
    }

    /**
     * Handle cursor movement
     */
    private handleCursorMove(socket: any, data: { projectId: string; x: number; y: number }): void {
        const { projectId, x, y } = data;
        const session = this.activeSessions.get(projectId);

        if (!session) return;

        const participant = session.participants.get(socket.id);
        if (!participant) return;

        // Update cursor position
        participant.cursorPosition = { x, y };
        participant.lastSeen = new Date();

        // Broadcast to other participants
        socket.to(projectId).emit('cursor-move', {
            userId: participant.userId,
            name: participant.name,
            cursor: { x, y },
        });
    }

    /**
     * Handle document changes
     */
    private handleDocumentChange(socket: any, data: { projectId: string; changes: any; version: number }): void {
        const { projectId, changes, version } = data;
        const session = this.activeSessions.get(projectId);

        if (!session) return;

        const participant = session.participants.get(socket.id);
        if (!participant) return;

        // Validate version
        if (version !== session.version) {
            socket.emit('version-conflict', {
                serverVersion: session.version,
                clientVersion: version,
            });
            return;
        }

        // Apply changes
        session.documentState = this.applyChanges(session.documentState, changes);
        session.version += 1;
        session.lastModified = new Date();

        // Broadcast to other participants
        socket.to(projectId).emit('document-change', {
            changes,
            version: session.version,
            userId: participant.userId,
            timestamp: new Date().toISOString(),
        });

        // Record metrics
        businessMetrics.apiCallsTotal.inc({
            endpoint: 'collaboration/document-change',
            method: 'WEBSOCKET',
        });

        logger.debug('Document changed', {
            projectId,
            userId: participant.userId,
            version: session.version,
        });
    }

    /**
     * Handle selection changes
     */
    private handleSelectionChange(socket: any, data: { projectId: string; selection: any }): void {
        const { projectId, selection } = data;
        const session = this.activeSessions.get(projectId);

        if (!session) return;

        const participant = session.participants.get(socket.id);
        if (!participant) return;

        // Broadcast to other participants
        socket.to(projectId).emit('selection-change', {
            userId: participant.userId,
            name: participant.name,
            selection,
        });
    }

    /**
     * Handle comment addition
     */
    private handleAddComment(socket: any, data: { projectId: string; comment: any }): void {
        const { projectId, comment } = data;
        const session = this.activeSessions.get(projectId);

        if (!session) return;

        const participant = session.participants.get(socket.id);
        if (!participant) return;

        // Add comment with metadata
        const commentWithMetadata = {
            ...comment,
            id: this.generateId(),
            authorId: participant.userId,
            authorName: participant.name,
            timestamp: new Date().toISOString(),
            resolved: false,
        };

        // Broadcast to all participants including sender
        if (this.io) {
            this.io.to(projectId).emit('comment-added', commentWithMetadata);
        }

        logger.info('Comment added', {
            projectId,
            userId: participant.userId,
            commentId: commentWithMetadata.id,
        });
    }

    /**
     * Handle comment resolution
     */
    private handleResolveComment(socket: any, data: { projectId: string; commentId: string }): void {
        const { projectId, commentId } = data;
        const session = this.activeSessions.get(projectId);

        if (!session) return;

        const participant = session.participants.get(socket.id);
        if (!participant) return;

        // Broadcast to all participants
        if (this.io) {
            this.io.to(projectId).emit('comment-resolved', {
                commentId,
                resolvedBy: participant.userId,
                resolvedByName: participant.name,
                timestamp: new Date().toISOString(),
            });
        }

        logger.info('Comment resolved', {
            projectId,
            userId: participant.userId,
            commentId,
        });
    }

    /**
     * Handle typing start
     */
    private handleTypingStart(socket: any, data: { projectId: string }): void {
        const { projectId } = data;
        const session = this.activeSessions.get(projectId);

        if (!session) return;

        const participant = session.participants.get(socket.id);
        if (!participant) return;

        // Broadcast to other participants
        socket.to(projectId).emit('user-typing', {
            userId: participant.userId,
            name: participant.name,
            isTyping: true,
        });
    }

    /**
     * Handle typing stop
     */
    private handleTypingStop(socket: any, data: { projectId: string }): void {
        const { projectId } = data;
        const session = this.activeSessions.get(projectId);

        if (!session) return;

        const participant = session.participants.get(socket.id);
        if (!participant) return;

        // Broadcast to other participants
        socket.to(projectId).emit('user-typing', {
            userId: participant.userId,
            name: participant.name,
            isTyping: false,
        });
    }

    /**
     * Handle user disconnect
     */
    private handleDisconnect(socket: any): void {
        // Find and remove user from all sessions
        for (const [projectId, session] of this.activeSessions) {
            const participant = session.participants.get(socket.id);
            if (participant) {
                session.participants.delete(socket.id);
                this.userSessions.delete(participant.userId);

                // Notify other participants
                if (this.io) {
                    this.io.to(projectId).emit('user-left', {
                        userId: participant.userId,
                        name: participant.name,
                    });
                }

                // Clean up session if empty
                if (session.participants.size === 0) {
                    this.activeSessions.delete(projectId);
                }

                logger.info('User disconnected from collaboration', {
                    userId: participant.userId,
                    projectId,
                    socketId: socket.id,
                });
                break;
            }
        }
    }

    /**
     * Apply document changes (simplified implementation)
     */
    private applyChanges(documentState: any, changes: any): any {
        // This is a simplified implementation
        // In a real application, you'd use operational transforms (OT) or CRDTs
        return { ...documentState, ...changes };
    }

    /**
     * Generate unique ID
     */
    private generateId(): string {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    /**
     * Clean up inactive sessions
     */
    private cleanupInactiveSessions(): void {
        setInterval(() => {
            const now = new Date();
            const inactiveThreshold = 30 * 60 * 1000; // 30 minutes

            for (const [projectId, session] of this.activeSessions) {
                let hasActiveParticipants = false;

                for (const [socketId, participant] of session.participants) {
                    if (now.getTime() - participant.lastSeen.getTime() < inactiveThreshold) {
                        hasActiveParticipants = true;
                    } else {
                        session.participants.delete(socketId);
                        this.userSessions.delete(participant.userId);
                    }
                }

                if (!hasActiveParticipants) {
                    this.activeSessions.delete(projectId);
                    logger.info('Cleaned up inactive collaboration session', { projectId });
                }
            }
        }, 5 * 60 * 1000); // Run every 5 minutes
    }

    /**
     * Get active collaboration sessions
     */
    getActiveSessions(): any[] {
        return Array.from(this.activeSessions.values()).map(session => ({
            projectId: session.projectId,
            participantCount: session.participants.size,
            participants: Array.from(session.participants.values()),
            lastModified: session.lastModified,
            version: session.version,
        }));
    }

    /**
     * Get user's current session
     */
    getUserSession(userId: string): string | null {
        return this.userSessions.get(userId) || null;
    }
}

export default new CollaborationService();

