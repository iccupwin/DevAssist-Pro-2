import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '../../services/queryClient'
import { SystemStatus, DashboardStats, Module } from '../../stores/types'

// Mock System API service
const systemApi = {
  getSystemStatus: async (): Promise<SystemStatus> => {
    await new Promise(resolve => setTimeout(resolve, 500))
    
    return {
      ai: {
        openai: Math.random() > 0.1 ? 'online' : 'degraded',
        anthropic: Math.random() > 0.05 ? 'online' : 'offline',
        google: Math.random() > 0.3 ? 'online' : 'offline'
      },
      services: {
        api: Math.random() > 0.02 ? 'online' : 'degraded',
        database: Math.random() > 0.01 ? 'online' : 'degraded',
        fileStorage: Math.random() > 0.03 ? 'online' : 'offline',
        documentProcessor: Math.random() > 0.05 ? 'online' : 'degraded'
      },
      lastCheck: new Date()
    }
  },
  
  getHealthCheck: async (): Promise<{ healthy: boolean; details: Record<string, any> }> => {
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    return {
      healthy: Math.random() > 0.1,
      details: {
        uptime: '15d 4h 32m',
        memory: {
          used: 4.2,
          total: 16,
          percentage: 26.25
        },
        cpu: {
          usage: Math.floor(Math.random() * 100),
          cores: 8
        },
        disk: {
          used: 234,
          total: 1000,
          percentage: 23.4
        },
        activeConnections: Math.floor(Math.random() * 1000),
        responseTime: Math.floor(Math.random() * 200) + 50
      }
    }
  },
  
  getDashboardStats: async (): Promise<DashboardStats> => {
    await new Promise(resolve => setTimeout(resolve, 800))
    
    return {
      totalDocuments: 1247,
      totalAnalyses: 456,
      totalSavings: 892,
      averageScore: 84.5,
      recentActivity: [
        {
          id: '1',
          type: 'analysis',
          description: 'Завершен анализ КП для проекта "Северный"',
          timestamp: new Date(Date.now() - 10 * 60 * 1000),
          moduleId: 'kp-analyzer',
          status: 'success'
        },
        {
          id: '2',
          type: 'upload',
          description: 'Загружен новый файл ТЗ',
          timestamp: new Date(Date.now() - 25 * 60 * 1000),
          moduleId: 'kp-analyzer',
          status: 'success'
        },
        {
          id: '3',
          type: 'report',
          description: 'Сгенерирован отчет по анализу',
          timestamp: new Date(Date.now() - 45 * 60 * 1000),
          moduleId: 'kp-analyzer',
          status: 'success'
        },
        {
          id: '4',
          type: 'login',
          description: 'Вход в систему',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
          status: 'success'
        },
        {
          id: '5',
          type: 'analysis',
          description: 'Ошибка при анализе КП',
          timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000),
          moduleId: 'kp-analyzer',
          status: 'failed'
        }
      ],
      topModules: [
        {
          moduleId: 'kp-analyzer',
          name: 'КП Анализатор',
          usage: 87,
          trend: 'up'
        },
        {
          moduleId: 'tz-generator',
          name: 'ТЗ Генератор',
          usage: 23,
          trend: 'stable'
        },
        {
          moduleId: 'project-evaluation',
          name: 'Оценка проектов',
          usage: 15,
          trend: 'down'
        }
      ]
    }
  },
  
  getModules: async (): Promise<Module[]> => {
    await new Promise(resolve => setTimeout(resolve, 400))
    
    return [
      {
        id: 'kp-analyzer',
        name: 'КП Анализатор',
        description: 'AI-анализ коммерческих предложений против технических заданий',
        icon: 'FileText',
        status: 'active',
        version: '1.2.0',
        features: ['document-analysis', 'compliance-check', 'risk-assessment', 'contractor-research'],
        permissions: ['analyze-documents', 'export-reports'],
        route: '/kp-analyzer',
        lastUsed: new Date(Date.now() - 2 * 60 * 60 * 1000),
        usage: 1247
      },
      {
        id: 'tz-generator',
        name: 'ТЗ Генератор',
        description: 'Генерация технических заданий с помощью AI',
        icon: 'PenTool',
        status: 'beta',
        version: '0.8.0',
        features: ['document-generation', 'templates', 'validation'],
        permissions: ['generate-documents'],
        route: '/tz-generator',
        lastUsed: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        usage: 234
      },
      {
        id: 'project-evaluation',
        name: 'Оценка проектов',
        description: 'Комплексная оценка и анализ проектов недвижимости',
        icon: 'TrendingUp',
        status: 'coming_soon',
        version: '0.1.0',
        features: ['project-analysis', 'risk-modeling', 'financial-analysis'],
        permissions: ['evaluate-projects'],
        route: '/project-evaluation',
        usage: 0
      },
      {
        id: 'marketing-planner',
        name: 'Маркетинг планировщик',
        description: 'AI-планирование маркетинговых стратегий',
        icon: 'Target',
        status: 'coming_soon',
        version: '0.1.0',
        features: ['marketing-planning', 'audience-analysis', 'campaign-optimization'],
        permissions: ['plan-marketing'],
        route: '/marketing-planner',
        usage: 0
      },
      {
        id: 'knowledge-base',
        name: 'База знаний',
        description: 'Централизованная база знаний с AI-поиском',
        icon: 'Database',
        status: 'coming_soon',
        version: '0.1.0',
        features: ['knowledge-management', 'ai-search', 'collaboration'],
        permissions: ['access-knowledge'],
        route: '/knowledge-base',
        usage: 0
      }
    ]
  },
  
  updateModuleStatus: async (moduleId: string, status: Module['status']): Promise<Module> => {
    await new Promise(resolve => setTimeout(resolve, 600))
    
    const modules = await systemApi.getModules()
    const module = modules.find(m => m.id === moduleId)
    
    if (!module) {
      throw new Error(`Module ${moduleId} not found`)
    }
    
    return { ...module, status }
  },
  
  getSystemMetrics: async (): Promise<Record<string, any>> => {
    await new Promise(resolve => setTimeout(resolve, 1200))
    
    return {
      performance: {
        avgResponseTime: Math.floor(Math.random() * 200) + 100,
        requestsPerSecond: Math.floor(Math.random() * 50) + 20,
        errorRate: Math.random() * 0.05,
        uptime: 99.98
      },
      usage: {
        activeUsers: Math.floor(Math.random() * 100) + 50,
        totalSessions: Math.floor(Math.random() * 1000) + 500,
        documentsProcessed: Math.floor(Math.random() * 500) + 200,
        aiRequestsToday: Math.floor(Math.random() * 2000) + 1000
      },
      resources: {
        cpuUsage: Math.floor(Math.random() * 100),
        memoryUsage: Math.floor(Math.random() * 100),
        diskUsage: Math.floor(Math.random() * 100),
        networkIO: Math.floor(Math.random() * 1000)
      }
    }
  }
}

// System status query
export const useSystemStatus = () => {
  return useQuery({
    queryKey: queryKeys.system.status,
    queryFn: systemApi.getSystemStatus,
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // Refetch every minute
  })
}

// Health check query
export const useHealthCheck = () => {
  return useQuery({
    queryKey: queryKeys.system.health,
    queryFn: systemApi.getHealthCheck,
    staleTime: 60 * 1000, // 1 minute
    refetchInterval: 2 * 60 * 1000, // Refetch every 2 minutes
  })
}

// Dashboard statistics query
export const useDashboardStats = () => {
  return useQuery({
    queryKey: queryKeys.dashboard.stats,
    queryFn: systemApi.getDashboardStats,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  })
}

// Available modules query
export const useModules = () => {
  return useQuery({
    queryKey: queryKeys.dashboard.modules,
    queryFn: systemApi.getModules,
    staleTime: 15 * 60 * 1000, // 15 minutes (modules don't change often)
  })
}

// Update module status mutation
export const useUpdateModuleStatus = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ moduleId, status }: { moduleId: string; status: Module['status'] }) => 
      systemApi.updateModuleStatus(moduleId, status),
    onSuccess: (data) => {
      // Update modules cache
      queryClient.setQueryData(queryKeys.dashboard.modules, (old: Module[] | undefined) => {
        if (!old) return [data]
        return old.map(module => 
          module.id === data.id ? data : module
        )
      })
    },
    onError: (error) => {
      console.error('Failed to update module status:', error)
    }
  })
}

// System metrics query
export const useSystemMetrics = () => {
  return useQuery({
    queryKey: queryKeys.system.metrics,
    queryFn: systemApi.getSystemMetrics,
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 2 * 60 * 1000, // Refetch every 2 minutes
  })
}

// Combined hook for system dashboard
export const useSystemDashboard = () => {
  const status = useSystemStatus()
  const health = useHealthCheck()
  const stats = useDashboardStats()
  const modules = useModules()
  const metrics = useSystemMetrics()
  
  return {
    status,
    health,
    stats,
    modules,
    metrics,
    isLoading: status.isLoading || health.isLoading || stats.isLoading || modules.isLoading || metrics.isLoading,
    error: status.error || health.error || stats.error || modules.error || metrics.error
  }
}

// Hook for checking system health
export const useSystemHealth = () => {
  const { data: status } = useSystemStatus()
  const { data: health } = useHealthCheck()
  
  const isHealthy = status && health && 
    Object.values(status.services).every(service => service === 'online') &&
    Object.values(status.ai).some(ai => ai === 'online') &&
    health.healthy
  
  return {
    isHealthy,
    status,
    health,
    hasAIProvider: status && Object.values(status.ai).some(ai => ai === 'online'),
    allServicesOnline: status && Object.values(status.services).every(service => service === 'online')
  }
}