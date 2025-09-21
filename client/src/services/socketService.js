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
        reconnectionAttempts: 10,
        maxReconnectionAttempts: 10,
        timeout: 20000,
        forceNew: true,
        transports: ['websocket', 'polling'],
      });
      
      // Add connection logging
      this.socket.on('connect', () => {
        console.log('Socket connected with ID:', this.socket.id);
      });
      
      this.socket.on('disconnect', (reason) => {
        console.log('Socket disconnected, reason:', reason);
      });
      
      this.socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
      });
      
      this.socket.on('reconnect', (attemptNumber) => {
        console.log('Socket reconnected after', attemptNumber, 'attempts');
      });
      
      this.socket.on('reconnect_error', (error) => {
        console.error('Socket reconnection error:', error);
      });
      
      this.socket.on('reconnect_failed', () => {
        console.error('Socket reconnection failed');
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

  isConnected() {
    return this.socket && this.socket.connected;
  }

  waitForConnection(timeout = 10000) {
    return new Promise((resolve, reject) => {
      if (this.isConnected()) {
        resolve(true);
        return;
      }

      const timeoutId = setTimeout(() => {
        reject(new Error('Connection timeout'));
      }, timeout);

      this.socket.once('connect', () => {
        clearTimeout(timeoutId);
        resolve(true);
      });

      this.socket.once('connect_error', (error) => {
        clearTimeout(timeoutId);
        reject(error);
      });
    });
  }

  emit(event, data) {
    if (this.socket) {
      if (this.socket.connected) {
        console.log(`Emitting ${event}:`, data);
        this.socket.emit(event, data);
      } else {
        console.log(`Socket not connected, queuing ${event}:`, data);
        // Wait for connection with timeout
        const timeout = setTimeout(() => {
          console.warn(`Timeout waiting for socket connection to emit ${event}`);
        }, 5000);
        
        this.socket.once('connect', () => {
          clearTimeout(timeout);
          console.log(`Socket connected, emitting queued ${event}:`, data);
          this.socket.emit(event, data);
        });
      }
    } else {
      console.warn(`Socket not initialized, cannot emit ${event}`);
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
