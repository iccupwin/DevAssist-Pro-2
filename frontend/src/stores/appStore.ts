import { create } from 'zustand'
import { persist, devtools } from 'zustand/middleware'
import { AppSettings, Notification, SystemStatus, DashboardStats, Module } from './types'

interface AppState {
  // App settings
  settings: AppSettings
  
  // UI state
  sidebarOpen: boolean
  loading: boolean
  activeModule: string | null
  
  // Notifications
  notifications: Notification[]
  unreadCount: number
  
  // System status
  systemStatus: SystemStatus
  
  // Dashboard data
  dashboardStats: DashboardStats
  
  // Available modules
  modules: Module[]
  
  // Actions - Settings
  updateSettings: (settings: Partial<AppSettings>) => void
  setTheme: (theme: 'light' | 'dark' | 'system') => void
  setLanguage: (language: 'ru' | 'en') => void
  toggleNotificationType: (type: keyof AppSettings['notifications']) => void
  
  // Actions - UI
  setSidebarOpen: (open: boolean) => void
  toggleSidebar: () => void
  setLoading: (loading: boolean) => void
  setActiveModule: (moduleId: string | null) => void
  
  // Actions - Notifications
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => void
  markAsRead: (notificationId: string) => void
  markAllAsRead: () => void
  removeNotification: (notificationId: string) => void
  clearNotifications: () => void
  
  // Actions - System status
  updateSystemStatus: (status: Partial<SystemStatus>) => void
  updateServiceStatus: (service: string, status: 'online' | 'offline' | 'degraded') => void
  
  // Actions - Dashboard
  updateDashboardStats: (stats: Partial<DashboardStats>) => void
  
  // Actions - Modules
  updateModules: (modules: Module[]) => void
  updateModuleStatus: (moduleId: string, status: Module['status']) => void
  recordModuleUsage: (moduleId: string) => void
  
  // Getters
  getNotificationsByType: (type: Notification['type']) => Notification[]
  getUnreadNotifications: () => Notification[]
  getActiveModuleInfo: () => Module | null
  getModuleById: (id: string) => Module | null
  isSystemHealthy: () => boolean
}

const defaultSettings: AppSettings = {
  theme: 'light',
  language: 'ru',
  timezone: 'Europe/Moscow',
  dateFormat: 'dd.MM.yyyy',
  notifications: {
    email: true,
    browser: true,
    desktop: false
  },
  privacy: {
    analytics: true,
    errorReporting: true,
    dataCollection: true
  }
}

const defaultSystemStatus: SystemStatus = {
  ai: {
    openai: 'online',
    anthropic: 'online',
    google: 'offline'
  },
  services: {
    api: 'online',
    database: 'online',
    fileStorage: 'online',
    documentProcessor: 'online'
  },
  lastCheck: new Date()
}

const defaultDashboardStats: DashboardStats = {
  totalDocuments: 0,
  totalAnalyses: 0,
  totalSavings: 0,
  averageScore: 0,
  recentActivity: [],
  topModules: []
}

const defaultModules: Module[] = [
  {
    id: 'kp-analyzer',
    name: 'КП Анализатор',
    description: 'AI-анализ коммерческих предложений против технических заданий',
    icon: 'FileText',
    status: 'active',
    version: '1.0.0',
    features: ['document-analysis', 'compliance-check', 'risk-assessment'],
    permissions: ['analyze-documents'],
    route: '/kp-analyzer',
    usage: 0
  },
  {
    id: 'tz-generator',
    name: 'ТЗ Генератор',
    description: 'Генерация технических заданий с помощью AI',
    icon: 'PenTool',
    status: 'coming_soon',
    version: '0.1.0',
    features: ['document-generation', 'templates'],
    permissions: ['generate-documents'],
    route: '/tz-generator',
    usage: 0
  },
  {
    id: 'project-evaluation',
    name: 'Оценка проектов',
    description: 'Комплексная оценка и анализ проектов недвижимости',
    icon: 'TrendingUp',
    status: 'coming_soon',
    version: '0.1.0',
    features: ['project-analysis', 'risk-modeling'],
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
    features: ['marketing-planning', 'audience-analysis'],
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
    features: ['knowledge-management', 'ai-search'],
    permissions: ['access-knowledge'],
    route: '/knowledge-base',
    usage: 0
  }
]

export const useAppStore = create<AppState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        settings: defaultSettings,
        sidebarOpen: false,
        loading: false,
        activeModule: null,
        notifications: [],
        unreadCount: 0,
        systemStatus: defaultSystemStatus,
        dashboardStats: defaultDashboardStats,
        modules: defaultModules,
        
        // Settings actions
        updateSettings: (updates) => set((state) => ({
          settings: { ...state.settings, ...updates }
        })),
        
        setTheme: (theme) => set((state) => ({
          settings: { ...state.settings, theme }
        })),
        
        setLanguage: (language) => set((state) => ({
          settings: { ...state.settings, language }
        })),
        
        toggleNotificationType: (type) => set((state) => ({
          settings: {
            ...state.settings,
            notifications: {
              ...state.settings.notifications,
              [type]: !state.settings.notifications[type]
            }
          }
        })),
        
        // UI actions
        setSidebarOpen: (open) => set({ sidebarOpen: open }),
        
        toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
        
        setLoading: (loading) => set({ loading }),
        
        setActiveModule: (moduleId) => {
          set({ activeModule: moduleId })
          if (moduleId) {
            get().recordModuleUsage(moduleId)
          }
        },
        
        // Notification actions
        addNotification: (notification) => {
          const newNotification: Notification = {
            ...notification,
            id: Date.now().toString(),
            timestamp: new Date(),
            read: false
          }
          
          set((state) => ({
            notifications: [newNotification, ...state.notifications],
            unreadCount: state.unreadCount + 1
          }))
        },
        
        markAsRead: (notificationId) => set((state) => ({
          notifications: state.notifications.map(n => 
            n.id === notificationId ? { ...n, read: true } : n
          ),
          unreadCount: Math.max(0, state.unreadCount - 1)
        })),
        
        markAllAsRead: () => set((state) => ({
          notifications: state.notifications.map(n => ({ ...n, read: true })),
          unreadCount: 0
        })),
        
        removeNotification: (notificationId) => set((state) => {
          const notification = state.notifications.find(n => n.id === notificationId)
          const wasUnread = notification && !notification.read
          
          return {
            notifications: state.notifications.filter(n => n.id !== notificationId),
            unreadCount: wasUnread ? state.unreadCount - 1 : state.unreadCount
          }
        }),
        
        clearNotifications: () => set({
          notifications: [],
          unreadCount: 0
        }),
        
        // System status actions
        updateSystemStatus: (updates) => set((state) => ({
          systemStatus: { ...state.systemStatus, ...updates, lastCheck: new Date() }
        })),
        
        updateServiceStatus: (service, status) => set((state) => ({
          systemStatus: {
            ...state.systemStatus,
            services: {
              ...state.systemStatus.services,
              [service]: status
            },
            lastCheck: new Date()
          }
        })),
        
        // Dashboard actions
        updateDashboardStats: (updates) => set((state) => ({
          dashboardStats: { ...state.dashboardStats, ...updates }
        })),
        
        // Module actions
        updateModules: (modules) => set({ modules }),
        
        updateModuleStatus: (moduleId, status) => set((state) => ({
          modules: state.modules.map(m => 
            m.id === moduleId ? { ...m, status } : m
          )
        })),
        
        recordModuleUsage: (moduleId) => set((state) => ({
          modules: state.modules.map(m => 
            m.id === moduleId ? { ...m, usage: m.usage + 1, lastUsed: new Date() } : m
          )
        })),
        
        // Getters
        getNotificationsByType: (type) => {
          const { notifications } = get()
          return notifications.filter(n => n.type === type)
        },
        
        getUnreadNotifications: () => {
          const { notifications } = get()
          return notifications.filter(n => !n.read)
        },
        
        getActiveModuleInfo: () => {
          const { modules, activeModule } = get()
          return modules.find(m => m.id === activeModule) || null
        },
        
        getModuleById: (id) => {
          const { modules } = get()
          return modules.find(m => m.id === id) || null
        },
        
        isSystemHealthy: () => {
          const { systemStatus } = get()
          
          // Check AI services
          const aiServices = Object.values(systemStatus.ai)
          const hasOnlineAI = aiServices.some(status => status === 'online')
          
          // Check core services
          const coreServices = Object.values(systemStatus.services)
          const allCoreOnline = coreServices.every(status => status === 'online')
          
          return hasOnlineAI && allCoreOnline
        }
      }),
      {
        name: 'app-storage',
        partialize: (state) => ({ 
          settings: state.settings,
          modules: state.modules
        })
      }
    ),
    { name: 'app-store' }
  )
)