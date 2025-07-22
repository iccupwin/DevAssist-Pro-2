import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '../../services/queryClient'
import { User, SubscriptionPlan, Notification, UsageStatistics } from '../../stores/types'

// Mock API service - replace with real API calls
const userApi = {
  getProfile: async (): Promise<User> => {
    // Mock implementation
    await new Promise(resolve => setTimeout(resolve, 1000))
    return {
      id: '1',
      email: 'admin@devassist.pro',
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin',
      createdAt: new Date(),
      subscription: {
        id: '1',
        name: 'professional',
        limits: {
          documentsPerMonth: 1000,
          aiRequestsPerMonth: 10000,
          storageGB: 100,
          usersCount: 5
        },
        features: ['kp-analyzer', 'reports', 'api-access'],
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
      }
    }
  },
  
  updateProfile: async (updates: Partial<User>): Promise<User> => {
    await new Promise(resolve => setTimeout(resolve, 500))
    // Mock update
    return { ...await userApi.getProfile(), ...updates }
  },
  
  getNotifications: async (): Promise<Notification[]> => {
    await new Promise(resolve => setTimeout(resolve, 500))
    return [
      {
        id: '1',
        type: 'info',
        title: 'Анализ завершен',
        message: 'Анализ КП "Проект А" успешно завершен',
        timestamp: new Date(),
        read: false
      },
      {
        id: '2',
        type: 'warning',
        title: 'Превышен лимит',
        message: 'Использовано 80% месячного лимита AI запросов',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
        read: false
      }
    ]
  },
  
  markNotificationAsRead: async (notificationId: string): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 300))
  },
  
  getUsage: async (): Promise<UsageStatistics> => {
    await new Promise(resolve => setTimeout(resolve, 800))
    return {
      today: {
        requests: 45,
        tokens: 12500,
        cost: 2.35,
        documentsProcessed: 5,
        analysisCompleted: 3
      },
      thisMonth: {
        requests: 890,
        tokens: 245000,
        cost: 47.80,
        documentsProcessed: 67,
        analysisCompleted: 23
      },
      total: {
        requests: 2340,
        tokens: 675000,
        cost: 134.50,
        documentsProcessed: 156,
        analysisCompleted: 78
      }
    }
  }
}

// User profile query
export const useUserProfile = () => {
  return useQuery({
    queryKey: queryKeys.user.profile,
    queryFn: userApi.getProfile,
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}

// User profile mutation
export const useUpdateUserProfile = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: userApi.updateProfile,
    onSuccess: (data) => {
      // Update the profile cache
      queryClient.setQueryData(queryKeys.user.profile, data)
      // Optionally invalidate related queries
      queryClient.invalidateQueries({ queryKey: queryKeys.user.profile })
    },
    onError: (error) => {
      console.error('Failed to update profile:', error)
    }
  })
}

// User notifications query
export const useUserNotifications = () => {
  return useQuery({
    queryKey: queryKeys.user.notifications,
    queryFn: userApi.getNotifications,
    staleTime: 30 * 1000, // 30 seconds (notifications should be fresh)
    refetchInterval: 60 * 1000, // Refetch every minute
  })
}

// Mark notification as read mutation
export const useMarkNotificationAsRead = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: userApi.markNotificationAsRead,
    onSuccess: (_, notificationId) => {
      // Update notifications cache
      queryClient.setQueryData(queryKeys.user.notifications, (old: Notification[] | undefined) => {
        if (!old) return []
        return old.map(notification => 
          notification.id === notificationId 
            ? { ...notification, read: true }
            : notification
        )
      })
    }
  })
}

// User usage statistics query
export const useUserUsage = () => {
  return useQuery({
    queryKey: queryKeys.user.usage,
    queryFn: userApi.getUsage,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  })
}

// Combined hook for all user data
export const useUserData = () => {
  const profile = useUserProfile()
  const notifications = useUserNotifications()
  const usage = useUserUsage()
  
  return {
    profile,
    notifications,
    usage,
    isLoading: profile.isLoading || notifications.isLoading || usage.isLoading,
    error: profile.error || notifications.error || usage.error
  }
}