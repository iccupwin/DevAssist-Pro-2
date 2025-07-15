/**
 * WebSocket Bridge
 * Real-time интеграция между React frontend и FastAPI backend
 */

import { WebSocketMessage, WebSocketEvent } from '../types/shared';

interface WebSocketOptions {
  url?: string;
  reconnectDelay?: number;
  maxReconnectAttempts?: number;
  heartbeatInterval?: number;
}

class WebSocketBridge {
  private ws: WebSocket | null = null;
  private eventListeners: Map<string, ((event: WebSocketEvent) => void)[]> = new Map();
  private reconnectAttempts = 0;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private options: Required<WebSocketOptions>;

  constructor(options: WebSocketOptions = {}) {
    this.options = {
      url: options.url || `${window.location.origin.replace('http', 'ws')}/ws`,
      reconnectDelay: options.reconnectDelay || 3000,
      maxReconnectAttempts: options.maxReconnectAttempts || 5,
      heartbeatInterval: options.heartbeatInterval || 30000,
    };
  }

  // ===== CONNECTION MANAGEMENT =====
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const token = localStorage.getItem('access_token');
        if (!token) {
          reject(new Error('No authentication token found'));
          return;
        }

        const wsUrl = `${this.options.url}?token=${token}`;
        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
          console.log('WebSocket connected');
          this.reconnectAttempts = 0;
          this.setupHeartbeat();
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };

        this.ws.onclose = (event) => {
          console.log('WebSocket disconnected:', event.code, event.reason);
          this.cleanup();
          
          if (event.code !== 1000 && this.reconnectAttempts < this.options.maxReconnectAttempts) {
            this.scheduleReconnect();
          }
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          reject(error);
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
    }
    this.cleanup();
  }

  private scheduleReconnect(): void {
    this.reconnectAttempts++;
    console.log(`Reconnecting WebSocket (attempt ${this.reconnectAttempts}/${this.options.maxReconnectAttempts})...`);
    
    setTimeout(() => {
      this.connect().catch(error => {
        console.error('Reconnection failed:', error);
      });
    }, this.options.reconnectDelay);
  }

  private setupHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.send({
          type: 'heartbeat',
          data: { timestamp: Date.now() },
          timestamp: new Date().toISOString(),
        });
      }
    }, this.options.heartbeatInterval);
  }

  private cleanup(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  // ===== MESSAGE HANDLING =====
  private handleMessage(message: WebSocketMessage): void {
    // Обработка системных сообщений
    switch (message.type) {
      case 'heartbeat':
        // Отвечаем на heartbeat
        this.send({
          type: 'heartbeat_response',
          data: { timestamp: Date.now() },
          timestamp: new Date().toISOString(),
        });
        break;
      
      case 'error':
        console.error('WebSocket error:', message.data);
        this.emit('error', message as WebSocketEvent);
        break;
      
      default:
        this.emit(message.type, message as WebSocketEvent);
    }
  }

  private emit(eventType: string, event: WebSocketEvent): void {
    const listeners = this.eventListeners.get(eventType) || [];
    listeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('Error in WebSocket event listener:', error);
      }
    });
  }

  // ===== EVENT SUBSCRIPTION =====
  on(eventType: string, listener: (event: WebSocketEvent) => void): void {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, []);
    }
    this.eventListeners.get(eventType)!.push(listener);
  }

  off(eventType: string, listener: (event: WebSocketEvent) => void): void {
    const listeners = this.eventListeners.get(eventType) || [];
    const index = listeners.indexOf(listener);
    if (index > -1) {
      listeners.splice(index, 1);
    }
  }

  once(eventType: string, listener: (event: WebSocketEvent) => void): void {
    const onceListener = (event: WebSocketEvent) => {
      listener(event);
      this.off(eventType, onceListener);
    };
    this.on(eventType, onceListener);
  }

  // ===== MESSAGE SENDING =====
  send(message: WebSocketMessage): boolean {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify(message));
        return true;
      } catch (error) {
        console.error('Error sending WebSocket message:', error);
        return false;
      }
    }
    return false;
  }

  // ===== ANALYSIS PROGRESS TRACKING =====
  trackAnalysisProgress(analysisId: number, callback: (progress: {
    stage: string;
    progress: number;
    estimated_time?: number;
  }) => void): void {
    const listener = (event: WebSocketEvent) => {
      if (event.data.analysis_id === analysisId) {
        callback({
          stage: event.data.stage,
          progress: event.data.progress,
          estimated_time: event.data.estimated_time,
        });
      }
    };

    this.on('analysis_progress', listener);
    
    // Автоматически отписываемся при завершении анализа
    this.once('analysis_complete', (event) => {
      if (event.data.analysis_id === analysisId) {
        this.off('analysis_progress', listener);
      }
    });
  }

  // ===== DOCUMENT PROCESSING TRACKING =====
  trackDocumentProcessing(documentId: number, callback: (status: {
    status: string;
    progress: number;
    error?: string;
  }) => void): void {
    const listener = (event: WebSocketEvent) => {
      if (event.data.document_id === documentId) {
        callback({
          status: event.data.status,
          progress: event.data.progress,
          error: event.data.error,
        });
      }
    };

    this.on('document_processing', listener);
    
    // Автоматически отписываемся при завершении обработки
    this.once('document_processed', (event) => {
      if (event.data.document_id === documentId) {
        this.off('document_processing', listener);
      }
    });
  }

  // ===== NOTIFICATIONS =====
  subscribeToNotifications(callback: (notification: {
    type: string;
    title: string;
    message: string;
    timestamp: string;
  }) => void): void {
    this.on('notification', (event) => {
      callback(event.data);
    });
  }

  // ===== USER ACTIVITY TRACKING =====
  trackUserActivity(callback: (activity: {
    user_id: number;
    type: string;
    description: string;
    timestamp: string;
  }) => void): void {
    this.on('user_activity', (event) => {
      callback(event.data);
    });
  }

  // ===== PROJECT UPDATES =====
  subscribeToProjectUpdates(projectId: number, callback: (update: {
    type: string;
    data: any;
    timestamp: string;
  }) => void): void {
    const listener = (event: WebSocketEvent) => {
      if (event.data.project_id === projectId) {
        callback({
          type: event.data.type,
          data: event.data,
          timestamp: event.timestamp,
        });
      }
    };

    this.on('project_update', listener);
  }

  // ===== SYSTEM STATUS =====
  subscribeToSystemStatus(callback: (status: {
    service: string;
    status: string;
    message?: string;
    timestamp: string;
  }) => void): void {
    this.on('system_status', (event) => {
      callback(event.data);
    });
  }

  // ===== CHAT/COLLABORATION =====
  sendChatMessage(message: string, projectId?: number): boolean {
    return this.send({
      type: 'chat_message',
      data: {
        message,
        project_id: projectId,
        timestamp: Date.now(),
      },
      timestamp: new Date().toISOString(),
    });
  }

  subscribeToChatMessages(projectId: number, callback: (message: {
    user_id: number;
    user_name: string;
    message: string;
    timestamp: string;
  }) => void): void {
    const listener = (event: WebSocketEvent) => {
      if (event.data.project_id === projectId) {
        callback(event.data);
      }
    };

    this.on('chat_message', listener);
  }

  // ===== CONNECTION STATUS =====
  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  getConnectionState(): string {
    if (!this.ws) return 'disconnected';
    
    switch (this.ws.readyState) {
      case WebSocket.CONNECTING:
        return 'connecting';
      case WebSocket.OPEN:
        return 'connected';
      case WebSocket.CLOSING:
        return 'closing';
      case WebSocket.CLOSED:
        return 'disconnected';
      default:
        return 'unknown';
    }
  }

  // ===== BULK OPERATIONS =====
  subscribeToBulkOperations(operationId: string, callback: (progress: {
    operation_id: string;
    stage: string;
    progress: number;
    completed: number;
    total: number;
    errors: any[];
  }) => void): void {
    const listener = (event: WebSocketEvent) => {
      if (event.data.operation_id === operationId) {
        callback(event.data);
      }
    };

    this.on('bulk_operation_progress', listener);
    
    // Автоматически отписываемся при завершении операции
    this.once('bulk_operation_complete', (event) => {
      if (event.data.operation_id === operationId) {
        this.off('bulk_operation_progress', listener);
      }
    });
  }

  // ===== CLEANUP =====
  destroy(): void {
    this.disconnect();
    this.eventListeners.clear();
  }
}

// Singleton instance
export const websocketBridge = new WebSocketBridge();

export default websocketBridge;