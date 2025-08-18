import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export const initializeSocket = (userId: string, username: string): Socket => {
  if (socket?.connected) {
    return socket;
  }

  socket = io(process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:8090', {
    transports: ['websocket', 'polling'],
    auth: {
      token: userId,
      username: username
    },
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 20000,
  });

  socket.on('connect', () => {
    console.log('Connected to WebSocket server');
  });

  socket.on('disconnect', () => {
    console.log('Disconnected from WebSocket server');
  });

  socket.on('connect_error', (error) => {
    console.error('WebSocket connection error:', error);
  });

  socket.on('reconnect', (attemptNumber) => {
    console.log(`Reconnected to WebSocket server after ${attemptNumber} attempts`);
  });

  socket.on('reconnect_error', (error) => {
    console.error('WebSocket reconnection error:', error);
  });

  return socket;
};

export const getSocket = (): Socket | null => {
  return socket;
};

export const disconnectSocket = (): void => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const isSocketConnected = (): boolean => {
  return socket?.connected || false;
};

// Export socket instance for direct access if needed
export { socket };
