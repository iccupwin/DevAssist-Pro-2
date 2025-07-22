// React Query hooks export - DevAssist Pro
import { useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '../../services/queryClient'

// User queries
export * from './useUserQueries'

// AI queries
export * from './useAIQueries'

// KP Analyzer queries
export * from './useKPAnalyzerQueries'

// System queries
export * from './useSystemQueries'

// Query client
export { queryClient, queryKeys } from '../../services/queryClient'

// Common query patterns
export const useInvalidateQueries = () => {
  const queryClient = useQueryClient()
  
  return {
    invalidateUser: () => queryClient.invalidateQueries({ queryKey: queryKeys.user.profile }),
    invalidateAI: () => queryClient.invalidateQueries({ queryKey: queryKeys.ai.config }),
    invalidateKPAnalyzer: () => queryClient.invalidateQueries({ queryKey: queryKeys.kpAnalyzer.sessions }),
    invalidateSystem: () => queryClient.invalidateQueries({ queryKey: queryKeys.system.status }),
    invalidateAll: () => queryClient.invalidateQueries()
  }
}

// Prefetch helpers
export const usePrefetchQueries = () => {
  const queryClient = useQueryClient()
  
  return {
    prefetchUserData: () => {
      queryClient.prefetchQuery({
        queryKey: queryKeys.user.profile,
        staleTime: 10 * 60 * 1000
      })
      queryClient.prefetchQuery({
        queryKey: queryKeys.user.notifications,
        staleTime: 30 * 1000
      })
    },
    
    prefetchAIData: () => {
      queryClient.prefetchQuery({
        queryKey: queryKeys.ai.models,
        staleTime: 30 * 60 * 1000
      })
      queryClient.prefetchQuery({
        queryKey: queryKeys.ai.config,
        staleTime: 10 * 60 * 1000
      })
    },
    
    prefetchDashboard: () => {
      queryClient.prefetchQuery({
        queryKey: queryKeys.dashboard.stats,
        staleTime: 5 * 60 * 1000
      })
      queryClient.prefetchQuery({
        queryKey: queryKeys.dashboard.modules,
        staleTime: 15 * 60 * 1000
      })
    }
  }
}