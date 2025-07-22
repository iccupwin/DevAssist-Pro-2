import { useEffect, useRef, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import socketService, { SocketEvents } from '../services/socketService'
import { queryKeys } from '../services/queryClient'
import { useUserStore, useAppStore } from '../stores'

// Main socket hook for managing connection
export const useSocket = () => {
  const queryClient = useQueryClient()
  const { user } = useUserStore()
  const { addNotification } = useAppStore()
  const isInitialized = useRef(false)
  
  const connect = useCallback(() => {
    if (!isInitialized.current && user) {
      const token = localStorage.getItem('auth_token')
      socketService.connect(token || undefined)
      isInitialized.current = true
    }
  }, [user])
  
  const disconnect = useCallback(() => {
    socketService.disconnect()
    isInitialized.current = false
  }, [])
  
  useEffect(() => {
    if (user) {
      connect()
    }
    
    return () => {
      if (!user) {
        disconnect()
      }
    }
  }, [user, connect, disconnect])
  
  // Setup global event listeners
  useEffect(() => {
    if (!socketService.connected) return
    
    // Connection events
    const handleConnect = () => {
      addNotification({
        type: 'success',
        title: 'Подключение восстановлено',
        message: 'Связь с сервером восстановлена',
        read: false
      })
    }
    
    const handleDisconnect = (reason: string) => {
      addNotification({
        type: 'warning',
        title: 'Потеряно соединение',
        message: `Соединение с сервером потеряно: ${reason}`,
        read: false
      })
    }
    
    const handleReconnect = (attempt: number) => {
      addNotification({
        type: 'info',
        title: 'Переподключение',
        message: `Переподключение выполнено (попытка ${attempt})`,
        read: false
      })
    }
    
    // User events
    const handleUserUpdated = (userData: any) => {
      queryClient.setQueryData(queryKeys.user.profile, userData)
    }
    
    const handleUserNotification = (notification: any) => {
      addNotification(notification)
      queryClient.invalidateQueries({ queryKey: queryKeys.user.notifications })
    }
    
    const handleUserUsageUpdated = (usage: any) => {
      queryClient.setQueryData(queryKeys.user.usage, usage)
    }
    
    // System events
    const handleSystemStatusChanged = (data: any) => {
      queryClient.setQueryData(queryKeys.system.status, (old: any) => {
        if (!old) return old
        return {
          ...old,
          services: {
            ...old.services,
            [data.service]: data.status
          },
          lastCheck: new Date()
        }
      })
    }
    
    const handleSystemMaintenance = (data: any) => {
      addNotification({
        type: data.type === 'emergency' ? 'error' : 'warning',
        title: 'Техническое обслуживание',
        message: data.message,
        read: false
      })
    }
    
    // Dashboard events
    const handleDashboardStatsUpdated = (stats: any) => {
      queryClient.setQueryData(queryKeys.dashboard.stats, stats)
    }
    
    const handleModuleStatusChanged = (data: any) => {
      queryClient.setQueryData(queryKeys.dashboard.modules, (old: any[]) => {
        if (!old) return old
        return old.map(module => 
          module.id === data.moduleId 
            ? { ...module, status: data.status }
            : module
        )
      })
    }
    
    // AI events
    const handleAIUsageUpdated = (usage: any) => {
      queryClient.setQueryData(queryKeys.ai.usage, usage)
    }
    
    const handleAICostAlert = (data: any) => {
      addNotification({
        type: data.type === 'limit_exceeded' ? 'error' : 'warning',
        title: 'Превышен лимит AI',
        message: data.message,
        read: false
      })
    }
    
    // Subscribe to events
    socketService.on('connect', handleConnect)
    socketService.on('disconnect', handleDisconnect)
    socketService.on('reconnect', handleReconnect)
    socketService.on('user_updated', handleUserUpdated)
    socketService.on('user_notification', handleUserNotification)
    socketService.on('user_usage_updated', handleUserUsageUpdated)
    socketService.on('system_status_changed', handleSystemStatusChanged)
    socketService.on('system_maintenance', handleSystemMaintenance)
    socketService.on('dashboard_stats_updated', handleDashboardStatsUpdated)
    socketService.on('module_status_changed', handleModuleStatusChanged)
    socketService.on('ai_usage_updated', handleAIUsageUpdated)
    socketService.on('ai_cost_alert', handleAICostAlert)
    
    return () => {
      // Cleanup listeners
      socketService.off('connect', handleConnect)
      socketService.off('disconnect', handleDisconnect)
      socketService.off('reconnect', handleReconnect)
      socketService.off('user_updated', handleUserUpdated)
      socketService.off('user_notification', handleUserNotification)
      socketService.off('user_usage_updated', handleUserUsageUpdated)
      socketService.off('system_status_changed', handleSystemStatusChanged)
      socketService.off('system_maintenance', handleSystemMaintenance)
      socketService.off('dashboard_stats_updated', handleDashboardStatsUpdated)
      socketService.off('module_status_changed', handleModuleStatusChanged)
      socketService.off('ai_usage_updated', handleAIUsageUpdated)
      socketService.off('ai_cost_alert', handleAICostAlert)
    }
  }, [queryClient, addNotification])
  
  return {
    connected: socketService.connected,
    connect,
    disconnect,
    reconnectionInfo: socketService.reconnectionInfo
  }
}

// Hook for KP Analyzer real-time events
export const useKPAnalyzerSocket = (sessionId?: string) => {
  const queryClient = useQueryClient()
  const { addNotification } = useAppStore()
  
  useEffect(() => {
    if (!sessionId || !socketService.connected) return
    
    // Join session room
    socketService.joinRoom(`session_${sessionId}`)
    
    const handleAnalysisStarted = (data: any) => {
      if (data.sessionId === sessionId) {
        addNotification({
          type: 'info',
          title: 'Анализ начат',
          message: 'Анализ коммерческих предложений начат',
          read: false
        })
        queryClient.invalidateQueries({ queryKey: queryKeys.kpAnalyzer.session(sessionId) })
      }
    }
    
    const handleAnalysisProgress = (data: any) => {
      if (data.sessionId === sessionId) {
        // Update analysis progress in real-time
        queryClient.setQueryData(queryKeys.kpAnalyzer.analysis(sessionId), (old: any) => ({
          ...old,
          progress: data.progress,
          currentFile: data.currentFile
        }))
      }
    }
    
    const handleAnalysisCompleted = (data: any) => {
      if (data.sessionId === sessionId) {
        addNotification({
          type: 'success',
          title: 'Анализ завершен',
          message: 'Анализ коммерческих предложений успешно завершен',
          read: false
        })
        queryClient.setQueryData(queryKeys.kpAnalyzer.results(sessionId), data.results)
        queryClient.invalidateQueries({ queryKey: queryKeys.kpAnalyzer.session(sessionId) })
      }
    }
    
    const handleAnalysisFailed = (data: any) => {
      if (data.sessionId === sessionId) {
        addNotification({
          type: 'error',
          title: 'Ошибка анализа',
          message: `Анализ завершился с ошибкой: ${data.error}`,
          read: false
        })
        queryClient.invalidateQueries({ queryKey: queryKeys.kpAnalyzer.session(sessionId) })
      }
    }
    
    const handleFileUploaded = (data: any) => {
      if (data.sessionId === sessionId) {
        addNotification({
          type: 'success',
          title: 'Файл загружен',
          message: `Файл ${data.file.name} успешно загружен`,
          read: false
        })
        queryClient.invalidateQueries({ queryKey: queryKeys.kpAnalyzer.session(sessionId) })
      }
    }
    
    const handleFileProcessed = (data: any) => {
      if (data.sessionId === sessionId) {
        queryClient.setQueryData(queryKeys.kpAnalyzer.session(sessionId), (old: any) => {
          if (!old) return old
          return {
            ...old,
            kpFiles: old.kpFiles.map((file: any) => 
              file.id === data.fileId 
                ? { ...file, status: data.status }
                : file
            )
          }
        })
      }
    }
    
    const handleSessionUpdated = (data: any) => {
      if (data.sessionId === sessionId) {
        queryClient.setQueryData(queryKeys.kpAnalyzer.session(sessionId), (old: any) => ({
          ...old,
          ...data.updates
        }))
      }
    }
    
    // Subscribe to events
    socketService.on('analysis_started', handleAnalysisStarted)
    socketService.on('analysis_progress', handleAnalysisProgress)
    socketService.on('analysis_completed', handleAnalysisCompleted)
    socketService.on('analysis_failed', handleAnalysisFailed)
    socketService.on('file_uploaded', handleFileUploaded)
    socketService.on('file_processed', handleFileProcessed)
    socketService.on('session_updated', handleSessionUpdated)
    
    return () => {
      // Leave session room
      socketService.leaveRoom(`session_${sessionId}`)
      
      // Cleanup listeners
      socketService.off('analysis_started', handleAnalysisStarted)
      socketService.off('analysis_progress', handleAnalysisProgress)
      socketService.off('analysis_completed', handleAnalysisCompleted)
      socketService.off('analysis_failed', handleAnalysisFailed)
      socketService.off('file_uploaded', handleFileUploaded)
      socketService.off('file_processed', handleFileProcessed)
      socketService.off('session_updated', handleSessionUpdated)
    }
  }, [sessionId, queryClient, addNotification])
  
  return {
    startAnalysis: (data: any) => socketService.send('start_analysis', { sessionId, ...data }),
    updateSession: (updates: any) => socketService.send('update_session', { sessionId, updates }),
    uploadFile: (file: any) => socketService.send('upload_file', { sessionId, file })
  }
}

// Hook for collaboration features
export const useCollaborationSocket = (sessionId?: string) => {
  const queryClient = useQueryClient()
  const { addNotification } = useAppStore()
  
  useEffect(() => {
    if (!sessionId || !socketService.connected) return
    
    // Join collaboration room
    socketService.joinRoom(`collaboration_${sessionId}`)
    
    const handleUserJoined = (data: any) => {
      if (data.sessionId === sessionId) {
        addNotification({
          type: 'info',
          title: 'Пользователь присоединился',
          message: `${data.user.name} присоединился к сессии`,
          read: false
        })
      }
    }
    
    const handleUserLeft = (data: any) => {
      if (data.sessionId === sessionId) {
        addNotification({
          type: 'info',
          title: 'Пользователь покинул сессию',
          message: `Пользователь покинул сессию`,
          read: false
        })
      }
    }
    
    // Subscribe to events
    socketService.on('session_user_joined', handleUserJoined)
    socketService.on('session_user_left', handleUserLeft)
    
    return () => {
      // Leave collaboration room
      socketService.leaveRoom(`collaboration_${sessionId}`)
      
      // Cleanup listeners
      socketService.off('session_user_joined', handleUserJoined)
      socketService.off('session_user_left', handleUserLeft)
    }
  }, [sessionId, queryClient, addNotification])
  
  return {
    broadcastUpdate: (updates: any) => socketService.send('broadcast_session_update', { sessionId, updates })
  }
}

// Hook for AI real-time events
export const useAISocket = () => {
  const queryClient = useQueryClient()
  const { addNotification } = useAppStore()
  
  useEffect(() => {
    if (!socketService.connected) return
    
    const handleModelStatusChanged = (data: any) => {
      queryClient.setQueryData(queryKeys.ai.status, (old: any) => {
        if (!old) return old
        return {
          ...old,
          ai: {
            ...old.ai,
            [data.provider]: data.status
          },
          lastCheck: new Date()
        }
      })
    }
    
    // Subscribe to events
    socketService.on('ai_model_status_changed', handleModelStatusChanged)
    
    return () => {
      socketService.off('ai_model_status_changed', handleModelStatusChanged)
    }
  }, [queryClient, addNotification])
  
  return {
    testProvider: (provider: string) => socketService.send('test_ai_provider', { provider })
  }
}

// Generic hook for custom socket events
export const useSocketEvent = <T>(event: string, handler: (data: T) => void, deps: any[] = []) => {
  useEffect(() => {
    if (!socketService.connected) return
    
    const wrappedHandler = (data: T) => {
      try {
        handler(data)
      } catch (error) {
        console.error(`Error in socket event handler for ${event}:`, error)
      }
    }
    
    socketService.on(event as any, wrappedHandler)
    
    return () => {
      socketService.off(event as any, wrappedHandler)
    }
  }, [event, ...deps])
}

// Hook to send socket events
export const useSocketSend = () => {
  return useCallback((event: string, data: any) => {
    if (socketService.connected) {
      socketService.send(event, data)
    } else {
      console.warn('Socket not connected, cannot send event:', event)
    }
  }, [])
}