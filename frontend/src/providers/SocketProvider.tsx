import React, { createContext, useContext, useEffect, useState } from 'react'
import { useSocket } from '../hooks/useSocket'
import socketService from '../services/socketService'

interface SocketContextType {
  connected: boolean
  reconnectionInfo: {
    attempts: number
    maxAttempts: number
    isReconnecting: boolean
  }
  connect: () => void
  disconnect: () => void
}

const SocketContext = createContext<SocketContextType | undefined>(undefined)

interface SocketProviderProps {
  children: React.ReactNode
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  const { connected, connect, disconnect, reconnectionInfo } = useSocket()
  const [isReady, setIsReady] = useState(false)
  
  // Initialize socket connection
  useEffect(() => {
    // Small delay to ensure other providers are ready
    const timer = setTimeout(() => {
      setIsReady(true)
    }, 100)
    
    return () => clearTimeout(timer)
  }, [])
  
  const value: SocketContextType = {
    connected: connected || false,
    reconnectionInfo: {
      ...reconnectionInfo,
      isReconnecting: reconnectionInfo.isReconnecting || false
    },
    connect,
    disconnect
  }
  
  return (
    <SocketContext.Provider value={value}>
      {children}
      {isReady && <SocketStatusIndicator />}
    </SocketContext.Provider>
  )
}

// Socket status indicator component
const SocketStatusIndicator: React.FC = () => {
  const { connected, reconnectionInfo } = useSocketContext()
  const [showIndicator, setShowIndicator] = useState(false)
  
  useEffect(() => {
    if (!connected || reconnectionInfo.isReconnecting) {
      setShowIndicator(true)
    } else {
      // Hide indicator after a short delay when connected
      const timer = setTimeout(() => {
        setShowIndicator(false)
      }, 2000)
      
      return () => clearTimeout(timer)
    }
  }, [connected, reconnectionInfo.isReconnecting])
  
  if (!showIndicator) return null
  
  return (
    <div className="fixed top-4 right-4 z-50 flex items-center space-x-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
      <div className="flex items-center space-x-2">
        {connected ? (
          <>
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-green-600 dark:text-green-400">
              Подключено
            </span>
          </>
        ) : reconnectionInfo.isReconnecting ? (
          <>
            <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-yellow-600 dark:text-yellow-400">
              Переподключение... ({reconnectionInfo.attempts}/{reconnectionInfo.maxAttempts})
            </span>
          </>
        ) : (
          <>
            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
            <span className="text-sm font-medium text-red-600 dark:text-red-400">
              Нет соединения
            </span>
          </>
        )}
      </div>
    </div>
  )
}

// Hook to use socket context
export const useSocketContext = () => {
  const context = useContext(SocketContext)
  if (!context) {
    throw new Error('useSocketContext must be used within a SocketProvider')
  }
  return context
}

// Hook for connection status
export const useConnectionStatus = () => {
  const { connected, reconnectionInfo } = useSocketContext()
  
  return {
    isConnected: connected,
    isReconnecting: reconnectionInfo.isReconnecting,
    reconnectAttempts: reconnectionInfo.attempts,
    maxReconnectAttempts: reconnectionInfo.maxAttempts,
    status: connected ? 'connected' : reconnectionInfo.isReconnecting ? 'reconnecting' : 'disconnected'
  }
}

// Development helper component
export const SocketDebugPanel: React.FC = () => {
  const { connected, reconnectionInfo } = useSocketContext()
  const [events, setEvents] = useState<Array<{ event: string; data: any; timestamp: Date }>>([])
  
  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return
    
    const originalEmit = socketService.instance?.emit
    if (!originalEmit) return
    
    // Intercept socket events for debugging
    socketService.instance!.emit = function(event: string, ...args: any[]) {
      setEvents(prev => [...prev.slice(-19), { event, data: args, timestamp: new Date() }])
      return originalEmit.apply(this, [event, ...args])
    }
    
    return () => {
      if (socketService.instance && originalEmit) {
        socketService.instance.emit = originalEmit
      }
    }
  }, [])
  
  if (process.env.NODE_ENV !== 'development') {
    return null
  }
  
  return (
    <div className="fixed bottom-4 right-4 w-80 max-h-96 bg-black text-white p-4 rounded-lg shadow-lg overflow-y-auto text-xs font-mono">
      <div className="mb-2 font-bold">Socket Debug Panel</div>
      <div className="mb-2">
        Status: <span className={connected ? 'text-green-400' : 'text-red-400'}>
          {connected ? 'Connected' : 'Disconnected'}
        </span>
      </div>
      <div className="mb-2">
        Reconnection: {reconnectionInfo.attempts}/{reconnectionInfo.maxAttempts}
      </div>
      <div className="border-t border-gray-600 pt-2">
        <div className="font-bold mb-1">Recent Events:</div>
        <div className="space-y-1 max-h-48 overflow-y-auto">
          {events.map((event, index) => (
            <div key={index} className="text-xs">
              <span className="text-blue-400">{event.timestamp.toLocaleTimeString()}</span>
              <span className="text-yellow-400 ml-2">{event.event}</span>
              {event.data.length > 0 && (
                <div className="text-gray-300 ml-4 truncate">
                  {JSON.stringify(event.data)}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}