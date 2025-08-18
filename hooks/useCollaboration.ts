import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useSession } from 'next-auth/react';
import { useNotifications } from './useNotifications';

export interface CollaborationUser {
  id: string;
  name: string;
  username: string;
  department: string;
  color: string;
  cursor?: {
    x: number;
    y: number;
    selection?: {
      from: number;
      to: number;
    };
  };
}

export interface DocumentChange {
  id: string;
  contractId: string;
  userId: string;
  userName: string;
  timestamp: Date;
  changeType: 'insert' | 'delete' | 'format' | 'comment' | 'cursor';
  position: number;
  oldContent?: string;
  newContent?: string;
  metadata: {
    selection?: { from: number; to: number };
    operation: string;
    timestamp: number;
  };
}

export interface CollaborationState {
  isConnected: boolean;
  users: CollaborationUser[];
  recentChanges: DocumentChange[];
  isTyping: { [userId: string]: boolean };
  lastActivity: Date | null;
}

export interface UseCollaborationOptions {
  contractId: string;
  onUserJoined?: (user: CollaborationUser) => void;
  onUserLeft?: (userId: string, userName: string) => void;
  onDocumentChanged?: (change: DocumentChange) => void;
  onCursorMoved?: (userId: string, cursor: any) => void;
  onCommentAdded?: (comment: any) => void;
}

export const useCollaboration = (options: UseCollaborationOptions) => {
  const { data: session } = useSession();
  const { setNotifications } = useNotifications();
  const socketRef = useRef<Socket | null>(null);
  const [state, setState] = useState<CollaborationState>({
    isConnected: false,
    users: [],
    recentChanges: [],
    isTyping: {},
    lastActivity: null
  });

  const [error, setError] = useState<string | null>(null);

  // Initialize WebSocket connection
  const connect = useCallback(async () => {
    if (!session?.user?.id || socketRef.current?.connected) return;

    try {
      // Create socket connection
      const socket = io(process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:8090', {
        transports: ['websocket', 'polling'],
        auth: {
          token: session.user.id,
          username: session.user.username || session.user.name
        }
      });

      socketRef.current = socket;

      // Connection events
      socket.on('connect', () => {
        console.log('Connected to collaboration server');
        setState(prev => ({ ...prev, isConnected: true }));
        setError(null);

        // Join collaboration room
        socket.emit('join-room', {
          contractId: options.contractId,
          user: {
            id: session.user.id,
            name: session.user.name || session.user.username || 'Unknown User',
            username: session.user.username || 'unknown',
            department: session.user.department || 'Unknown',
            color: '#3B82F6'
          }
        });
      });

      socket.on('disconnect', () => {
        console.log('Disconnected from collaboration server');
        setState(prev => ({ ...prev, isConnected: false }));
      });

      socket.on('connect_error', (error) => {
        console.error('Connection error:', error);
        setError('Failed to connect to collaboration server');
        setState(prev => ({ ...prev, isConnected: false }));
      });

      // Room events
      socket.on('room-joined', (data: any) => {
        console.log('Joined collaboration room:', data);
        setState(prev => ({
          ...prev,
          users: data.users || [],
          recentChanges: data.recentChanges || [],
          lastActivity: new Date()
        }));
      });

      socket.on('user-joined', (data: any) => {
        console.log('User joined:', data);
        setState(prev => ({
          ...prev,
          users: [...prev.users, data.user],
          lastActivity: new Date()
        }));
        options.onUserJoined?.(data.user);
      });

      socket.on('user-left', (data: any) => {
        console.log('User left:', data);
        setState(prev => ({
          ...prev,
          users: prev.users.filter(u => u.id !== data.userId),
          lastActivity: new Date()
        }));
        options.onUserLeft?.(data.userId, data.userName);
      });

      // Document change events
      socket.on('document-changed', (change: DocumentChange) => {
        console.log('Document changed:', change);
        setState(prev => ({
          ...prev,
          recentChanges: [...prev.recentChanges, change].slice(-50), // Keep last 50
          lastActivity: new Date()
        }));
        options.onDocumentChanged?.(change);
      });

      // Cursor movement events
      socket.on('cursor-moved', (data: any) => {
        setState(prev => ({
          ...prev,
          users: prev.users.map(u => 
            u.id === data.userId 
              ? { ...u, cursor: data.cursor }
              : u
          )
        }));
        options.onCursorMoved?.(data.userId, data.cursor);
      });

      // Typing indicator events
      socket.on('user-typing', (data: any) => {
        setState(prev => ({
          ...prev,
          isTyping: {
            ...prev.isTyping,
            [data.userId]: data.isTyping
          }
        }));
      });

      // Comment events
      socket.on('comment-added', (comment: any) => {
        console.log('Comment added:', comment);
        options.onCommentAdded?.(comment);
      });

    } catch (error) {
      console.error('Failed to initialize collaboration:', error);
      setError('Failed to initialize collaboration');
    }
  }, [session?.user?.id, options.contractId, options, setNotifications]);

  // Disconnect from WebSocket
  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.emit('leave-room', {
        contractId: options.contractId,
        userId: session?.user?.id
      });
      socketRef.current.disconnect();
      socketRef.current = null;
      setState(prev => ({ ...prev, isConnected: false }));
    }
  }, [options.contractId, session?.user?.id]);

  // Send document change
  const sendDocumentChange = useCallback((change: Omit<DocumentChange, 'id' | 'timestamp'>) => {
    if (socketRef.current?.connected) {
      const fullChange: DocumentChange = {
        ...change,
        id: `${Date.now()}-${Math.random()}`,
        timestamp: new Date()
      };
      
      socketRef.current.emit('document-change', fullChange);
      return fullChange;
    }
    return null;
  }, []);

  // Send cursor movement
  const sendCursorMove = useCallback((cursor: any) => {
    if (socketRef.current?.connected && session?.user?.id) {
      socketRef.current.emit('cursor-move', {
        contractId: options.contractId,
        user: {
          id: session.user.id,
          name: session.user.name || session.user.username || 'Unknown User',
          username: session.user.username || 'unknown',
          department: session.user.department || 'Unknown',
          color: '#3B82F6'
        },
        cursor
      });
    }
  }, [options.contractId, session?.user?.id]);

  // Send typing indicator
  const sendTypingIndicator = useCallback((isTyping: boolean) => {
    if (socketRef.current?.connected && session?.user?.id) {
      socketRef.current.emit('typing', {
        contractId: options.contractId,
        userId: session.user.id,
        isTyping
      });
    }
  }, [options.contractId, session?.user?.id]);

  // Send comment
  const sendComment = useCallback((comment: any) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('add-comment', {
        contractId: options.contractId,
        comment
      });
    }
  }, [options.contractId]);

  // Get user by ID
  const getUserById = useCallback((userId: string) => {
    return state.users.find(u => u.id === userId);
  }, [state.users]);

  // Get user color
  const getUserColor = useCallback((userId: string) => {
    const user = getUserById(userId);
    return user?.color || '#6B7280';
  }, [getUserById]);

  // Check if user is typing
  const isUserTyping = useCallback((userId: string) => {
    return state.isTyping[userId] || false;
  }, [state.isTyping]);

  // Connect on mount
  useEffect(() => {
    connect();

    // Cleanup on unmount
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    // State
    ...state,
    error,
    
    // Actions
    connect,
    disconnect,
    sendDocumentChange,
    sendCursorMove,
    sendTypingIndicator,
    sendComment,
    
    // Utilities
    getUserById,
    getUserColor,
    isUserTyping,
    
    // Socket reference (for advanced usage)
    socket: socketRef.current
  };
};
