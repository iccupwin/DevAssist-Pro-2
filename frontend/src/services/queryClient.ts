import { QueryClient } from '@tanstack/react-query'

// Query client configuration for DevAssist Pro
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache for 5 minutes by default
      staleTime: 5 * 60 * 1000,
      // Keep in cache for 30 minutes
      gcTime: 30 * 60 * 1000,
      // Retry failed requests 3 times
      retry: 3,
      // Retry with exponential backoff
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      // Refetch on window focus for fresh data
      refetchOnWindowFocus: true,
      // Refetch on reconnect
      refetchOnReconnect: true,
      // Background refetch interval (5 minutes)
      refetchInterval: 5 * 60 * 1000,
      // Don't refetch on mount if data is fresh
      refetchOnMount: 'always',
    },
    mutations: {
      // Retry mutations once on failure
      retry: 1,
      // Retry delay for mutations
      retryDelay: 1000,
    },
  },
})

// Query keys factory for consistent key management
export const queryKeys = {
  // User queries
  user: {
    profile: ['user', 'profile'] as const,
    settings: ['user', 'settings'] as const,
    subscription: ['user', 'subscription'] as const,
    notifications: ['user', 'notifications'] as const,
    usage: ['user', 'usage'] as const,
  },
  
  // AI queries
  ai: {
    models: ['ai', 'models'] as const,
    providers: ['ai', 'providers'] as const,
    config: ['ai', 'config'] as const,
    usage: ['ai', 'usage'] as const,
    status: ['ai', 'status'] as const,
    costs: ['ai', 'costs'] as const,
  },
  
  // KP Analyzer queries
  kpAnalyzer: {
    sessions: ['kp-analyzer', 'sessions'] as const,
    session: (id: string) => ['kp-analyzer', 'session', id] as const,
    results: (sessionId: string) => ['kp-analyzer', 'results', sessionId] as const,
    files: (sessionId: string) => ['kp-analyzer', 'files', sessionId] as const,
    analysis: (sessionId: string) => ['kp-analyzer', 'analysis', sessionId] as const,
    templates: ['kp-analyzer', 'templates'] as const,
    history: ['kp-analyzer', 'history'] as const,
  },
  
  // Document processing queries
  documents: {
    upload: ['documents', 'upload'] as const,
    process: (fileId: string) => ['documents', 'process', fileId] as const,
    extract: (fileId: string) => ['documents', 'extract', fileId] as const,
    preview: (fileId: string) => ['documents', 'preview', fileId] as const,
  },
  
  // Reports queries
  reports: {
    generate: (sessionId: string) => ['reports', 'generate', sessionId] as const,
    export: (reportId: string) => ['reports', 'export', reportId] as const,
    templates: ['reports', 'templates'] as const,
  },
  
  // System queries
  system: {
    status: ['system', 'status'] as const,
    health: ['system', 'health'] as const,
    metrics: ['system', 'metrics'] as const,
    logs: ['system', 'logs'] as const,
  },
  
  // Dashboard queries
  dashboard: {
    stats: ['dashboard', 'stats'] as const,
    activity: ['dashboard', 'activity'] as const,
    modules: ['dashboard', 'modules'] as const,
  },
}