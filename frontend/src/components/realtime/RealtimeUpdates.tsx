import React, { useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useSocketEvent } from '../../hooks/useSocket'
import { useAppStore } from '../../stores'
import { Bell, Wifi, WifiOff, AlertCircle, CheckCircle, Clock } from 'lucide-react'

// Real-time notification component
export const RealtimeNotifications: React.FC = () => {
  const { notifications, markAsRead } = useAppStore()
  const [showNotifications, setShowNotifications] = useState(false)
  const unreadCount = notifications.filter(n => !n.read).length
  
  // Auto-hide notifications after 5 seconds
  useEffect(() => {
    if (unreadCount > 0) {
      const timer = setTimeout(() => {
        setShowNotifications(false)
      }, 5000)
      
      return () => clearTimeout(timer)
    }
  }, [unreadCount])
  
  if (unreadCount === 0) return null
  
  return (
    <div className="fixed top-20 right-4 w-80 max-h-96 overflow-y-auto z-50">
      <div className="space-y-2">
        {notifications
          .filter(n => !n.read)
          .slice(0, 5)
          .map((notification) => (
            <div
              key={notification.id}
              className={`p-4 rounded-lg shadow-lg border-l-4 bg-white dark:bg-gray-800 cursor-pointer transition-all duration-300 hover:shadow-xl ${
                notification.type === 'success' ? 'border-green-500' :
                notification.type === 'warning' ? 'border-yellow-500' :
                notification.type === 'error' ? 'border-red-500' :
                'border-blue-500'
              }`}
              onClick={() => markAsRead(notification.id)}
            >
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  {notification.type === 'success' && <CheckCircle className="w-5 h-5 text-green-500" />}
                  {notification.type === 'warning' && <AlertCircle className="w-5 h-5 text-yellow-500" />}
                  {notification.type === 'error' && <AlertCircle className="w-5 h-5 text-red-500" />}
                  {notification.type === 'info' && <Bell className="w-5 h-5 text-blue-500" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {notification.title}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {notification.message}
                  </div>
                  <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    {notification.timestamp.toLocaleTimeString()}
                  </div>
                </div>
              </div>
            </div>
          ))}
      </div>
    </div>
  )
}

// Real-time connection status component
export const ConnectionStatus: React.FC = () => {
  const [isConnected, setIsConnected] = useState(true)
  const [isReconnecting, setIsReconnecting] = useState(false)
  const [lastSeen, setLastSeen] = useState<Date>(new Date())
  
  useSocketEvent('connect', () => {
    setIsConnected(true)
    setIsReconnecting(false)
    setLastSeen(new Date())
  })
  
  useSocketEvent('disconnect', () => {
    setIsConnected(false)
    setIsReconnecting(false)
  })
  
  useSocketEvent('reconnect', () => {
    setIsConnected(true)
    setIsReconnecting(false)
    setLastSeen(new Date())
  })
  
  // Update last seen timestamp
  useEffect(() => {
    if (isConnected && !isReconnecting) {
      const interval = setInterval(() => {
        setLastSeen(new Date())
      }, 30000) // Update every 30 seconds
      
      return () => clearInterval(interval)
    }
  }, [isConnected, isReconnecting])
  
  const getStatusColor = () => {
    if (isConnected) return 'text-green-500'
    if (isReconnecting) return 'text-yellow-500'
    return 'text-red-500'
  }
  
  const getStatusIcon = () => {
    if (isConnected) return <Wifi className="w-4 h-4" />
    if (isReconnecting) return <Clock className="w-4 h-4 animate-spin" />
    return <WifiOff className="w-4 h-4" />
  }
  
  const getStatusText = () => {
    if (isConnected) return 'Онлайн'
    if (isReconnecting) return 'Переподключение...'
    return 'Оффлайн'
  }
  
  return (
    <div className="flex items-center space-x-2 px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-800">
      <div className={getStatusColor()}>
        {getStatusIcon()}
      </div>
      <span className={`text-sm font-medium ${getStatusColor()}`}>
        {getStatusText()}
      </span>
      {isConnected && (
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {lastSeen.toLocaleTimeString()}
        </span>
      )}
    </div>
  )
}

// Real-time progress tracker for analysis
export const AnalysisProgressTracker: React.FC<{ sessionId: string }> = ({ sessionId }) => {
  const [progress, setProgress] = useState(0)
  const [currentFile, setCurrentFile] = useState<string>('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const queryClient = useQueryClient()
  
  useSocketEvent('analysis_started', (data: any) => {
    if (data.sessionId === sessionId) {
      setIsAnalyzing(true)
      setProgress(0)
      setCurrentFile('')
    }
  })
  
  useSocketEvent('analysis_progress', (data: any) => {
    if (data.sessionId === sessionId) {
      setProgress(data.progress)
      setCurrentFile(data.currentFile)
    }
  })
  
  useSocketEvent('analysis_completed', (data: any) => {
    if (data.sessionId === sessionId) {
      setIsAnalyzing(false)
      setProgress(100)
      setCurrentFile('')
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['kp-analyzer', 'session', sessionId] })
    }
  })
  
  useSocketEvent('analysis_failed', (data: any) => {
    if (data.sessionId === sessionId) {
      setIsAnalyzing(false)
      setProgress(0)
      setCurrentFile('')
    }
  })
  
  if (!isAnalyzing && progress === 0) return null
  
  return (
    <div className="fixed bottom-4 right-4 w-80 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-gray-900 dark:text-white">
          Анализ в процессе
        </h3>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {progress}%
        </span>
      </div>
      
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-2">
        <div 
          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
      
      {currentFile && (
        <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
          Обрабатывается: {currentFile}
        </div>
      )}
    </div>
  )
}

// Real-time system health monitor
export const SystemHealthMonitor: React.FC = () => {
  const [systemHealth, setSystemHealth] = useState({
    api: 'online',
    database: 'online',
    ai: 'online',
    storage: 'online'
  })
  const [showDetails, setShowDetails] = useState(false)
  
  useSocketEvent('system_status_changed', (data: any) => {
    setSystemHealth(prev => ({
      ...prev,
      [data.service]: data.status
    }))
  })
  
  const getHealthColor = (status: string) => {
    switch (status) {
      case 'online': return 'text-green-500'
      case 'degraded': return 'text-yellow-500'
      case 'offline': return 'text-red-500'
      default: return 'text-gray-500'
    }
  }
  
  const getHealthIcon = (status: string) => {
    switch (status) {
      case 'online': return <CheckCircle className="w-4 h-4" />
      case 'degraded': return <AlertCircle className="w-4 h-4" />
      case 'offline': return <AlertCircle className="w-4 h-4" />
      default: return <Clock className="w-4 h-4" />
    }
  }
  
  const overallHealth = Object.values(systemHealth).every(status => status === 'online')
  
  return (
    <div className="relative">
      <button
        onClick={() => setShowDetails(!showDetails)}
        className={`flex items-center space-x-2 px-3 py-1 rounded-full transition-colors ${
          overallHealth 
            ? 'bg-green-100 text-green-700 hover:bg-green-200' 
            : 'bg-red-100 text-red-700 hover:bg-red-200'
        }`}
      >
        <div className={overallHealth ? 'text-green-500' : 'text-red-500'}>
          {overallHealth ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
        </div>
        <span className="text-sm font-medium">
          {overallHealth ? 'Все системы работают' : 'Проблемы с системой'}
        </span>
      </button>
      
      {showDetails && (
        <div className="absolute top-full right-0 mt-2 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4 z-50">
          <div className="space-y-2">
            {Object.entries(systemHealth).map(([service, status]) => (
              <div key={service} className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                  {service}
                </span>
                <div className={`flex items-center space-x-1 ${getHealthColor(status)}`}>
                  {getHealthIcon(status)}
                  <span className="text-xs capitalize">{status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// Real-time activity feed
export const ActivityFeed: React.FC = () => {
  const [activities, setActivities] = useState<Array<{
    id: string
    type: string
    message: string
    timestamp: Date
    user?: string
  }>>([])
  
  useSocketEvent('user_activity', (data: any) => {
    setActivities(prev => [
      { ...data, timestamp: new Date() },
      ...prev.slice(0, 9) // Keep only last 10 activities
    ])
  })
  
  if (activities.length === 0) return null
  
  return (
    <div className="w-full max-w-md">
      <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
        Последняя активность
      </h3>
      <div className="space-y-2">
        {activities.map((activity) => (
          <div
            key={activity.id}
            className="flex items-start space-x-3 p-2 rounded-lg bg-gray-50 dark:bg-gray-700"
          >
            <div className="flex-shrink-0">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm text-gray-900 dark:text-white">
                {activity.message}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {activity.timestamp.toLocaleTimeString()}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// Combined real-time dashboard
export const RealtimeDashboard: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Мониторинг в реальном времени
        </h2>
        <div className="flex items-center space-x-4">
          <ConnectionStatus />
          <SystemHealthMonitor />
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ActivityFeed />
        <div className="space-y-4">
          {/* Add more real-time components here */}
        </div>
      </div>
    </div>
  )
}