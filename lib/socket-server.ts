import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from './prisma';

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

export interface CollaborationRoom {
  contractId: string;
  users: Map<string, CollaborationUser>;
  changes: DocumentChange[];
  lastActivity: Date;
}

class CollaborationServer {
  private io: SocketIOServer;
  private rooms: Map<string, CollaborationRoom> = new Map();
  private userSessions: Map<string, string> = new Map(); // userId -> roomId

  constructor(server: HTTPServer) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env.NODE_ENV === 'production' 
          ? process.env.NEXT_PUBLIC_APP_URL 
          : "http://localhost:8090",
        methods: ["GET", "POST"]
      },
      transports: ['websocket', 'polling']
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    this.io.on('connection', (socket) => {
      // User connected

      // Join collaboration room
      socket.on('join-room', async (data: { contractId: string; user: CollaborationUser }) => {
        const { contractId, user } = data;
        
        // Create or get room
        if (!this.rooms.has(contractId)) {
          this.rooms.set(contractId, {
            contractId,
            users: new Map(),
            changes: [],
            lastActivity: new Date()
          });
        }

        const room = this.rooms.get(contractId)!;
        
        // Add user to room
        room.users.set(user.id, user);
        this.userSessions.set(user.id, contractId);
        
        // Join socket room
        socket.join(contractId);
        socket.contractId = contractId;
        socket.userId = user.id;

        // Generate unique color for user
        const colors = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'];
        const usedColors = Array.from(room.users.values()).map(u => u.color);
        const availableColors = colors.filter(c => !usedColors.includes(c));
        user.color = availableColors[0] || colors[Math.floor(Math.random() * colors.length)];

        // Notify other users in room
        socket.to(contractId).emit('user-joined', {
          user,
          timestamp: new Date(),
          message: `${user.name} joined the contract`
        });

        // Send room state to joining user
        socket.emit('room-joined', {
          contractId,
          users: Array.from(room.users.values()),
          recentChanges: room.changes.slice(-10), // Last 10 changes
          message: `Welcome to contract collaboration`
        });

        // Create notification for other users about new collaborator
        await this.createCollaborationNotification(contractId, user, 'joined');
      });

      // Leave collaboration room
      socket.on('leave-room', (data: { contractId: string; userId: string }) => {
        const { contractId, userId } = data;
        const room = this.rooms.get(contractId);
        
        if (room && room.users.has(userId)) {
          const user = room.users.get(userId)!;
          room.users.delete(userId);
          this.userSessions.delete(userId);
          
          // Notify other users
          socket.to(contractId).emit('user-left', {
            userId,
            userName: user.name,
            timestamp: new Date(),
            message: `${user.name} left the contract`
          });

          // Create notification for other users about collaborator leaving
          await this.createCollaborationNotification(contractId, user, 'left');

          // Clean up empty rooms
          if (room.users.size === 0) {
            this.rooms.delete(contractId);
          }
        }
      });

      // Handle document changes
      socket.on('document-change', async (data: DocumentChange) => {
        const { contractId } = data;
        const room = this.rooms.get(contractId);
        
        if (room) {
          // Add change to room history
          room.changes.push(data);
          room.lastActivity = new Date();
          
          // Keep only last 100 changes
          if (room.changes.length > 100) {
            room.changes = room.changes.slice(-100);
          }

          // Broadcast change to other users in room
          socket.to(contractId).emit('document-changed', {
            ...data,
            timestamp: new Date()
          });

          // Store change in database
          try {
            await prisma.documentChange.create({
              data: {
                documentId: contractId,
                changeType: data.changeType,
                position: data.position,
                oldContent: data.oldContent,
                newContent: data.newContent,
                userId: data.userId,
                sessionId: socket.id,
                metadata: data.metadata
              }
            });
          } catch (error) {
            // Handle storage error silently
          }

          // Create notification for significant changes (not cursor movements)
          if (data.changeType !== 'cursor') {
            await this.createDocumentChangeNotification(contractId, data);
          }
        }
      });

      // Handle cursor movements
      socket.on('cursor-move', (data: { contractId: string; user: CollaborationUser; cursor: any }) => {
        const { contractId, user, cursor } = data;
        const room = this.rooms.get(contractId);
        
        if (room && room.users.has(user.id)) {
          // Update user's cursor position
          room.users.get(user.id)!.cursor = cursor;
          
          // Broadcast cursor movement to other users
          socket.to(contractId).emit('cursor-moved', {
            userId: user.id,
            userName: user.name,
            cursor,
            timestamp: new Date()
          });
        }
      });

      // Handle user typing indicator
      socket.on('typing', (data: { contractId: string; userId: string; isTyping: boolean }) => {
        const { contractId, userId, isTyping } = data;
        
        // Broadcast typing indicator
        socket.to(contractId).emit('user-typing', {
          userId,
          isTyping,
          timestamp: new Date()
        });
      });

      // Handle comments
      socket.on('add-comment', async (data: { contractId: string; comment: any }) => {
        const { contractId, comment } = data;
        
        // Broadcast comment to other users
        socket.to(contractId).emit('comment-added', {
          ...comment,
          timestamp: new Date()
        });

        // Create notification for new comment
        await this.createCommentNotification(contractId, comment);
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        if (socket.contractId && socket.userId) {
          this.handleLeaveRoom(socket, {
            contractId: socket.contractId,
            userId: socket.userId
          });
        }
      });
    });
  }

  // Create collaboration notifications using your existing system
  private async createCollaborationNotification(contractId: string, user: CollaborationUser, action: 'joined' | 'left') {
    try {
      const room = this.rooms.get(contractId);
      if (!room) return;

      // Get contract details for better notification context
      const contract = await prisma.document.findUnique({
        where: { id: contractId },
        select: { title: true, ownerId: true }
      });

      if (!contract) return;

      // Create notifications for other users in the room
      const otherUsers = Array.from(room.users.values()).filter(u => u.id !== user.id);
      
      for (const otherUser of otherUsers) {
        await prisma.notification.create({
          data: {
            userId: otherUser.id,
            title: `Collaboration Update`,
            message: `${user.name} ${action} the contract "${contract.title || 'Untitled'}"`,
            type: 'collaboration',
            link: `/lvm/contracts?contract=${contractId}`,
            read: false
          }
        });
      }
    } catch (error) {
      // Handle notification error silently
    }
  }

  // Create document change notifications
  private async createDocumentChangeNotification(contractId: string, change: DocumentChange) {
    try {
      const room = this.rooms.get(contractId);
      if (!room) return;

      const contract = await prisma.document.findUnique({
        where: { id: contractId },
        select: { title: true, ownerId: true }
      });

      if (!contract) return;

      // Create notifications for other users in the room
      const otherUsers = Array.from(room.users.values()).filter(u => u.id !== change.userId);
      
      for (const otherUser of otherUsers) {
        await prisma.notification.create({
          data: {
            userId: otherUser.id,
            title: `Document Updated`,
            message: `${change.userName} made changes to "${contract.title || 'Untitled'}"`,
            type: 'document_change',
            link: `/lvm/contracts?contract=${contractId}`,
            read: false
          }
        });
      }
    } catch (error) {
      // Handle notification error silently
    }
  }

  // Create comment notifications
  private async createCommentNotification(contractId: string, comment: any) {
    try {
      const room = this.rooms.get(contractId);
      if (!room) return;

      const contract = await prisma.document.findUnique({
        where: { id: contractId },
        select: { title: true, ownerId: true }
      });

      if (!contract) return;

      // Create notifications for other users in the room
      const otherUsers = Array.from(room.users.values()).filter(u => u.id !== comment.authorId);
      
      for (const otherUser of otherUsers) {
        await prisma.notification.create({
          data: {
            userId: otherUser.id,
            title: `New Comment`,
            message: `${comment.author} added a comment to "${contract.title || 'Untitled'}"`,
            type: 'comment',
            link: `/lvm/contracts?contract=${contractId}`,
            read: false
          }
        });
      }
    } catch (error) {
      // Handle notification error silently
    }
  }

  // Public methods for external use
  public getRoomInfo(contractId: string) {
    const room = this.rooms.get(contractId);
    if (room) {
      return {
        contractId: room.contractId,
        userCount: room.users.size,
        users: Array.from(room.users.values()),
        lastActivity: room.lastActivity,
        changeCount: room.changes.length
      };
    }
    return null;
  }

  public getAllRooms() {
    return Array.from(this.rooms.keys()).map(contractId => this.getRoomInfo(contractId));
  }

  public broadcastToRoom(contractId: string, event: string, data: any) {
    this.io.to(contractId).emit(event, data);
  }
}

export default CollaborationServer;
