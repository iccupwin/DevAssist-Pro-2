import { io, Socket } from 'socket.io-client'

// Socket.IO event types for DevAssist Pro
export interface SocketEvents {
  // Connection events
  connect: () => void
  disconnect: (reason: string) => void
  reconnect: (attempt: number) => void
  connect_error: (error: Error) => void
  
  // Authentication events
  authenticated: (data: { userId: string; sessionId: string }) => void
  authentication_error: (error: string) => void
  
  // User events
  user_updated: (user: any) => void
  user_notification: (notification: any) => void
  user_usage_updated: (usage: any) => void
  
  // KP Analyzer events
  analysis_started: (data: { sessionId: string; analysisId: string }) => void
  analysis_progress: (data: { sessionId: string; progress: number; currentFile: string }) => void
  analysis_completed: (data: { sessionId: string; results: any[] }) => void
  analysis_failed: (data: { sessionId: string; error: string }) => void
  file_uploaded: (data: { sessionId: string; file: any }) => void
  file_processed: (data: { sessionId: string; fileId: string; status: string }) => void
  
  // AI events
  ai_model_status_changed: (data: { provider: string; model: string; status: string }) => void
  ai_usage_updated: (data: { usage: any }) => void
  ai_cost_alert: (data: { type: 'warning' | 'limit_exceeded'; message: string }) => void
  
  // System events
  system_status_changed: (data: { service: string; status: string }) => void
  system_maintenance: (data: { type: 'scheduled' | 'emergency'; message: string; duration?: number }) => void
  
  // Dashboard events
  dashboard_stats_updated: (data: { stats: any }) => void
  module_status_changed: (data: { moduleId: string; status: string }) => void
  
  // Collaboration events
  session_user_joined: (data: { sessionId: string; user: any }) => void
  session_user_left: (data: { sessionId: string; userId: string }) => void
  session_updated: (data: { sessionId: string; updates: any }) => void
}

class SocketService {
  private socket: Socket | null = null
  private isConnected = false
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private eventListeners: Map<string, Set<Function>> = new Map()
  
  // Initialize socket connection
  connect(token?: string) {
    if (this.socket?.connected) {
      console.log('Socket already connected')
      return
    }
    
    const socketUrl = process.env.REACT_APP_SOCKET_URL || 'ws://localhost:5000'
    
    this.socket = io(socketUrl, {
      auth: {
        token: token || localStorage.getItem('auth_token')
      },
      transports: ['websocket', 'polling'],
      timeout: 10000,
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000
    })
    
    this.setupEventListeners()
  }
  
  // Disconnect socket
  disconnect() {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
      this.isConnected = false
      this.reconnectAttempts = 0
      console.log('Socket disconnected')
    }
  }
  
  // Setup basic event listeners
  private setupEventListeners() {
    if (!this.socket) return
    
    this.socket.on('connect', () => {
      console.log('Socket connected:', this.socket?.id)
      this.isConnected = true
      this.reconnectAttempts = 0
      this.emit('connect')
    })
    
    this.socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason)
      this.isConnected = false
      this.emit('disconnect', reason)
    })
    
    this.socket.on('reconnect', (attempt) => {
      console.log('Socket reconnected after', attempt, 'attempts')
      this.reconnectAttempts = attempt
      this.emit('reconnect', attempt)
    })
    
    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error)
      this.emit('connect_error', error)
    })
    
    this.socket.on('authenticated', (data) => {
      console.log('Socket authenticated:', data)
      this.emit('authenticated', data)
    })
    
    this.socket.on('authentication_error', (error) => {
      console.error('Socket authentication error:', error)
      this.emit('authentication_error', error)
    })
    
    // Setup all event listeners
    this.setupAnalysisListeners()
    this.setupUserListeners()
    this.setupAIListeners()
    this.setupSystemListeners()
    this.setupDashboardListeners()
    this.setupCollaborationListeners()
  }
  
  // KP Analyzer event listeners
  private setupAnalysisListeners() {
    if (!this.socket) return
    
    this.socket.on('analysis_started', (data) => {
      console.log('Analysis started:', data)
      this.emit('analysis_started', data)
    })
    
    this.socket.on('analysis_progress', (data) => {
      console.log('Analysis progress:', data)
      this.emit('analysis_progress', data)
    })
    
    this.socket.on('analysis_completed', (data) => {
      console.log('Analysis completed:', data)
      this.emit('analysis_completed', data)
    })
    
    this.socket.on('analysis_failed', (data) => {
      console.error('Analysis failed:', data)
      this.emit('analysis_failed', data)
    })
    
    this.socket.on('file_uploaded', (data) => {
      console.log('File uploaded:', data)
      this.emit('file_uploaded', data)
    })
    
    this.socket.on('file_processed', (data) => {
      console.log('File processed:', data)
      this.emit('file_processed', data)
    })
  }
  
  // User event listeners
  private setupUserListeners() {
    if (!this.socket) return
    
    this.socket.on('user_updated', (data) => {
      console.log('User updated:', data)
      this.emit('user_updated', data)
    })
    
    this.socket.on('user_notification', (data) => {
      console.log('User notification:', data)
      this.emit('user_notification', data)
    })
    
    this.socket.on('user_usage_updated', (data) => {
      console.log('User usage updated:', data)
      this.emit('user_usage_updated', data)
    })
  }
  
  // AI event listeners
  private setupAIListeners() {
    if (!this.socket) return
    
    this.socket.on('ai_model_status_changed', (data) => {
      console.log('AI model status changed:', data)
      this.emit('ai_model_status_changed', data)
    })
    
    this.socket.on('ai_usage_updated', (data) => {
      console.log('AI usage updated:', data)
      this.emit('ai_usage_updated', data)
    })
    
    this.socket.on('ai_cost_alert', (data) => {
      console.warn('AI cost alert:', data)
      this.emit('ai_cost_alert', data)
    })
  }
  
  // System event listeners
  private setupSystemListeners() {
    if (!this.socket) return
    
    this.socket.on('system_status_changed', (data) => {
      console.log('System status changed:', data)
      this.emit('system_status_changed', data)
    })
    
    this.socket.on('system_maintenance', (data) => {
      console.warn('System maintenance:', data)
      this.emit('system_maintenance', data)
    })
  }
  
  // Dashboard event listeners
  private setupDashboardListeners() {
    if (!this.socket) return
    
    this.socket.on('dashboard_stats_updated', (data) => {
      console.log('Dashboard stats updated:', data)
      this.emit('dashboard_stats_updated', data)
    })
    
    this.socket.on('module_status_changed', (data) => {
      console.log('Module status changed:', data)
      this.emit('module_status_changed', data)
    })
  }
  
  // Collaboration event listeners
  private setupCollaborationListeners() {
    if (!this.socket) return
    
    this.socket.on('session_user_joined', (data) => {
      console.log('User joined session:', data)
      this.emit('session_user_joined', data)
    })
    
    this.socket.on('session_user_left', (data) => {
      console.log('User left session:', data)
      this.emit('session_user_left', data)
    })
    
    this.socket.on('session_updated', (data) => {
      console.log('Session updated:', data)
      this.emit('session_updated', data)
    })
  }
  
  // Join specific rooms
  joinRoom(room: string) {
    if (this.socket?.connected) {
      this.socket.emit('join_room', room)
      console.log('Joined room:', room)
    }
  }
  
  // Leave specific rooms
  leaveRoom(room: string) {
    if (this.socket?.connected) {
      this.socket.emit('leave_room', room)
      console.log('Left room:', room)
    }
  }
  
  // Send message to server
  send(event: string, data: any) {
    if (this.socket?.connected) {
      this.socket.emit(event, data)
    } else {
      console.warn('Socket not connected, cannot send:', event, data)
    }
  }
  
  // Subscribe to events
  on<K extends keyof SocketEvents>(event: K, callback: SocketEvents[K]) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set())
    }
    this.eventListeners.get(event)!.add(callback)
  }
  
  // Unsubscribe from events
  off<K extends keyof SocketEvents>(event: K, callback: SocketEvents[K]) {
    const listeners = this.eventListeners.get(event)
    if (listeners) {
      listeners.delete(callback)
    }
  }
  
  // Emit events to subscribers
  private emit(event: string, ...args: any[]) {
    const listeners = this.eventListeners.get(event)
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(...args)
        } catch (error) {
          console.error('Error in socket event listener:', error)
        }
      })
    }
  }
  
  // Get connection status
  get connected() {
    return this.isConnected && this.socket?.connected
  }
  
  // Get socket instance
  get instance() {
    return this.socket
  }
  
  // Get reconnection info
  get reconnectionInfo() {
    return {
      attempts: this.reconnectAttempts,
      maxAttempts: this.maxReconnectAttempts,
      isReconnecting: this.socket?.disconnected && this.reconnectAttempts > 0
    }
  }
}

// Export singleton instance
export const socketService = new SocketService()
export default socketService