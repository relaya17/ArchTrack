/**
 * Collaboration Hook
 * Construction Master App - Real-time Collaboration
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './useAuth';

interface Participant {
    userId: string;
    name: string;
    role: string;
    cursorPosition?: { x: number; y: number };
    isTyping?: boolean;
}

interface CollaborationState {
    isConnected: boolean;
    participants: Participant[];
    currentProjectId: string | null;
    documentState: any;
    version: number;
}

interface CollaborationCallbacks {
    onUserJoined?: (participant: Participant) => void;
    onUserLeft?: (participant: Participant) => void;
    onCursorMove?: (participant: Participant, cursor: { x: number; y: number }) => void;
    onDocumentChange?: (changes: any, version: number) => void;
    onSelectionChange?: (participant: Participant, selection: any) => void;
    onCommentAdded?: (comment: any) => void;
    onCommentResolved?: (commentId: string, resolvedBy: string) => void;
    onTypingStart?: (participant: Participant) => void;
    onTypingStop?: (participant: Participant) => void;
    onError?: (error: string) => void;
}

export const useCollaboration = (callbacks: CollaborationCallbacks = {}) => {
    const [state, setState] = useState<CollaborationState>({
        isConnected: false,
        participants: [],
        currentProjectId: null,
        documentState: {},
        version: 1,
    });

    const { user, token } = useAuth();
    const socketRef = useRef<Socket | null>(null);
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Connect to collaboration server
    const connect = useCallback(() => {
        if (!user || !token) return;

        const socket = io(process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3016', {
            auth: {
                token,
                userId: user.id,
            },
            transports: ['websocket'],
        });

        socketRef.current = socket;

        // Connection events
        socket.on('connect', () => {
            setState(prev => ({ ...prev, isConnected: true }));
        });

        socket.on('disconnect', () => {
            setState(prev => ({ ...prev, isConnected: false }));
        });

        socket.on('error', (error) => {
            callbacks.onError?.(error.message);
        });

        // Collaboration events
        socket.on('session-state', (data) => {
            setState(prev => ({
                ...prev,
                participants: data.participants,
                documentState: data.documentState,
                version: data.version,
            }));
        });

        socket.on('user-joined', (participant) => {
            setState(prev => ({
                ...prev,
                participants: [...prev.participants.filter(p => p.userId !== participant.userId), participant],
            }));
            callbacks.onUserJoined?.(participant);
        });

        socket.on('user-left', (participant) => {
            setState(prev => ({
                ...prev,
                participants: prev.participants.filter(p => p.userId !== participant.userId),
            }));
            callbacks.onUserLeft?.(participant);
        });

        socket.on('cursor-move', (data) => {
            setState(prev => ({
                ...prev,
                participants: prev.participants.map(p =>
                    p.userId === data.userId
                        ? { ...p, cursorPosition: data.cursor }
                        : p
                ),
            }));
            callbacks.onCursorMove?.(data, data.cursor);
        });

        socket.on('document-change', (data) => {
            setState(prev => ({
                ...prev,
                documentState: { ...prev.documentState, ...data.changes },
                version: data.version,
            }));
            callbacks.onDocumentChange?.(data.changes, data.version);
        });

        socket.on('selection-change', (data) => {
            callbacks.onSelectionChange?.(data, data.selection);
        });

        socket.on('comment-added', (comment) => {
            callbacks.onCommentAdded?.(comment);
        });

        socket.on('comment-resolved', (data) => {
            callbacks.onCommentResolved?.(data.commentId, data.resolvedBy);
        });

        socket.on('user-typing', (data) => {
            setState(prev => ({
                ...prev,
                participants: prev.participants.map(p =>
                    p.userId === data.userId
                        ? { ...p, isTyping: data.isTyping }
                        : p
                ),
            }));

            if (data.isTyping) {
                callbacks.onTypingStart?.(data);
            } else {
                callbacks.onTypingStop?.(data);
            }
        });

        socket.on('version-conflict', (data) => {
            callbacks.onError?.(`Version conflict: server version ${data.serverVersion}, client version ${data.clientVersion}`);
        });

    }, [user, token, callbacks]);

    // Disconnect from collaboration server
    const disconnect = useCallback(() => {
        if (socketRef.current) {
            socketRef.current.disconnect();
            socketRef.current = null;
        }
        setState(prev => ({
            ...prev,
            isConnected: false,
            participants: [],
            currentProjectId: null,
        }));
    }, []);

    // Join project collaboration
    const joinProject = useCallback((projectId: string) => {
        if (!socketRef.current || !user) return;

        socketRef.current.emit('join-project', {
            projectId,
            userId: user.id,
        });

        setState(prev => ({ ...prev, currentProjectId: projectId }));
    }, [user]);

    // Leave project collaboration
    const leaveProject = useCallback(() => {
        if (!socketRef.current || !user || !state.currentProjectId) return;

        socketRef.current.emit('leave-project', {
            projectId: state.currentProjectId,
            userId: user.id,
        });

        setState(prev => ({ ...prev, currentProjectId: null }));
    }, [user, state.currentProjectId]);

    // Send cursor movement
    const sendCursorMove = useCallback((x: number, y: number) => {
        if (!socketRef.current || !state.currentProjectId) return;

        socketRef.current.emit('cursor-move', {
            projectId: state.currentProjectId,
            x,
            y,
        });
    }, [state.currentProjectId]);

    // Send document changes
    const sendDocumentChange = useCallback((changes: any) => {
        if (!socketRef.current || !state.currentProjectId) return;

        socketRef.current.emit('document-change', {
            projectId: state.currentProjectId,
            changes,
            version: state.version,
        });
    }, [state.currentProjectId, state.version]);

    // Send selection changes
    const sendSelectionChange = useCallback((selection: any) => {
        if (!socketRef.current || !state.currentProjectId) return;

        socketRef.current.emit('selection-change', {
            projectId: state.currentProjectId,
            selection,
        });
    }, [state.currentProjectId]);

    // Add comment
    const addComment = useCallback((comment: any) => {
        if (!socketRef.current || !state.currentProjectId) return;

        socketRef.current.emit('add-comment', {
            projectId: state.currentProjectId,
            comment,
        });
    }, [state.currentProjectId]);

    // Resolve comment
    const resolveComment = useCallback((commentId: string) => {
        if (!socketRef.current || !state.currentProjectId) return;

        socketRef.current.emit('resolve-comment', {
            projectId: state.currentProjectId,
            commentId,
        });
    }, [state.currentProjectId]);

    // Send typing indicators
    const startTyping = useCallback(() => {
        if (!socketRef.current || !state.currentProjectId) return;

        socketRef.current.emit('typing-start', {
            projectId: state.currentProjectId,
        });

        // Clear existing timeout
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

        // Auto-stop typing after 3 seconds
        typingTimeoutRef.current = setTimeout(() => {
            stopTyping();
        }, 3000);
    }, [state.currentProjectId]);

    const stopTyping = useCallback(() => {
        if (!socketRef.current || !state.currentProjectId) return;

        socketRef.current.emit('typing-stop', {
            projectId: state.currentProjectId,
        });

        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
            typingTimeoutRef.current = null;
        }
    }, [state.currentProjectId]);

    // Get current user from participants
    const getCurrentUserParticipant = useCallback((): Participant | null => {
        if (!user) return null;
        return state.participants.find(p => p.userId === user.id) || null;
    }, [user, state.participants]);

    // Get other participants (excluding current user)
    const getOtherParticipants = useCallback((): Participant[] => {
        if (!user) return state.participants;
        return state.participants.filter(p => p.userId !== user.id);
    }, [user, state.participants]);

    // Check if user is collaborating
    const isCollaborating = useCallback((): boolean => {
        return state.isConnected && state.currentProjectId !== null && state.participants.length > 1;
    }, [state.isConnected, state.currentProjectId, state.participants.length]);

    // Auto-connect on mount
    useEffect(() => {
        if (user && token) {
            connect();
        }

        return () => {
            disconnect();
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }
        };
    }, [user, token, connect, disconnect]);

    return {
        // State
        isConnected: state.isConnected,
        participants: state.participants,
        currentProjectId: state.currentProjectId,
        documentState: state.documentState,
        version: state.version,

        // Actions
        connect,
        disconnect,
        joinProject,
        leaveProject,
        sendCursorMove,
        sendDocumentChange,
        sendSelectionChange,
        addComment,
        resolveComment,
        startTyping,
        stopTyping,

        // Utilities
        getCurrentUserParticipant,
        getOtherParticipants,
        isCollaborating,
    };
};

