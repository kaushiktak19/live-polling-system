import { io } from "socket.io-client";
import { API_URL } from "../config/api.js";

class SocketService {
  constructor() {
    this.socket = null;
  }

  connect() {
    if (!this.socket) {
      this.socket = io(API_URL, {
        autoConnect: true,
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5,
        maxReconnectionAttempts: 5,
        forceNew: true, // Force new connection
      });
      
      // Add connection logging
      this.socket.on('connect', () => {
        console.log('Socket connected with ID:', this.socket.id);
      });
      
      this.socket.on('disconnect', () => {
        console.log('Socket disconnected');
      });
      
      this.socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
      });
    }
    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  getSocket() {
    return this.socket;
  }

  emit(event, data) {
    if (this.socket) {
      if (this.socket.connected) {
        console.log(`Emitting ${event}:`, data);
        this.socket.emit(event, data);
      } else {
        console.log(`Socket not connected, queuing ${event}:`, data);
        this.socket.once('connect', () => {
          console.log(`Socket connected, emitting queued ${event}:`, data);
          this.socket.emit(event, data);
        });
      }
    }
  }

  on(event, callback) {
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  off(event, callback) {
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }
}

// Create a singleton instance
const socketService = new SocketService();

export default socketService;
