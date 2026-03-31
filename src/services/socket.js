import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:8081';

class SocketService {
  constructor() {
    this.socket = null;
    this.connected = false;
    this.listeners = new Map();
  }

  connect(token) {
    if (this.socket?.connected) {
      console.log('Socket already connected');
      return this.socket;
    }

    console.log('Connecting to WebSocket server...', SOCKET_URL);

    this.socket = io(SOCKET_URL, {
      auth: {
        token: token
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 10,
      timeout: 20000
    });

    this.socket.on('connect', () => {
      console.log('✅ WebSocket connected');
      this.connected = true;
    });

    this.socket.on('connected', (data) => {
      console.log('Server confirmed connection:', data);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ WebSocket disconnected:', reason);
      this.connected = false;
    });

    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
    });

    this.socket.on('connect_error', (error) => {
      console.error('Connection error:', error.message);
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
      this.listeners.clear();
      console.log('Socket disconnected');
    }
  }

  joinChat(chatId, callback) {
    if (!this.socket) {
      console.error('Socket not connected');
      return;
    }

    console.log('Joining chat:', chatId);
    this.socket.emit('join_chat', { chat_id: chatId });

    this.socket.once('joined_chat', (data) => {
      console.log('Joined chat successfully:', data);
      if (callback) callback(data);
    });
  }

  leaveChat(chatId) {
    if (!this.socket) return;
    
    console.log('Leaving chat:', chatId);
    this.socket.emit('leave_chat', { chat_id: chatId });
  }

  sendMessage(chatId, message, messageType = 'TEXT', imageData = null, fileName = null, callback) {
    if (!this.socket) {
      console.error('Socket not connected');
      return;
    }

    const payload = {
      chat_id: chatId,
      message: message,
      message_type: messageType
    };

    if (imageData) {
      payload.image_data = imageData;
      payload.file_name = fileName;
    }

    console.log('Sending message:', { chatId, messageType, hasImage: !!imageData });
    this.socket.emit('send_message', payload);

    if (callback) {
      this.socket.once('new_message', callback);
    }
  }

  onNewMessage(callback) {
    if (!this.socket) return;
    
    this.socket.off('new_message');
    
    this.socket.on('new_message', (data) => {
      console.log('New message received:', data);
      callback(data);
    });
  }

  onUserTyping(callback) {
    if (!this.socket) return;
    
    this.socket.off('user_typing');
    
    this.socket.on('user_typing', callback);
  }

  sendTyping(chatId, isTyping) {
    if (!this.socket) return;
    
    this.socket.emit('typing', {
      chat_id: chatId,
      is_typing: isTyping
    });
  }

  markAsRead(chatId) {
    if (!this.socket) return;
    
    this.socket.emit('mark_read', { chat_id: chatId });
  }

  onMessagesRead(callback) {
    if (!this.socket) return;
    
    this.socket.on('messages_read', callback);
  }

  onUserJoined(callback) {
    if (!this.socket) return;
    
    this.socket.off('user_joined');
    
    this.socket.on('user_joined', callback);
  }

  onUserLeft(callback) {
    if (!this.socket) return;
    
    this.socket.off('user_left');
    
    this.socket.on('user_left', callback);
  }

  onNewNotification(callback) {
    if (!this.socket) return;
    
    this.socket.off('new_notification');
    
    this.socket.on('new_notification', callback);
  }

  off(event) {
    if (!this.socket) return;
    
    this.socket.off(event);
  }

  isConnected() {
    return this.connected && this.socket?.connected;
  }
}

const socketService = new SocketService();

export default socketService;
