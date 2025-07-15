import { create } from 'zustand'
import { persist, devtools } from 'zustand/middleware'
import { User, SubscriptionPlan, Notification } from './types'

interface UserState {
  // State
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  
  // Actions
  setUser: (user: User) => void
  updateUser: (updates: Partial<User>) => void
  logout: () => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  clearError: () => void
  
  // Subscription
  updateSubscription: (subscription: SubscriptionPlan) => void
  checkSubscriptionLimits: (resource: string) => boolean
  
  // Permissions
  hasPermission: (permission: string) => boolean
  isAdmin: () => boolean
}

export const useUserStore = create<UserState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
        
        // Actions
        setUser: (user) => set({ 
          user, 
          isAuthenticated: true, 
          error: null 
        }),
        
        updateUser: (updates) => set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null
        })),
        
        logout: () => set({ 
          user: null, 
          isAuthenticated: false, 
          error: null 
        }),
        
        setLoading: (loading) => set({ isLoading: loading }),
        
        setError: (error) => set({ error }),
        
        clearError: () => set({ error: null }),
        
        // Subscription methods
        updateSubscription: (subscription) => set((state) => ({
          user: state.user ? { ...state.user, subscription } : null
        })),
        
        checkSubscriptionLimits: (resource: string) => {
          const { user } = get()
          if (!user) return false
          
          const limits = user.subscription.limits
          // Add logic to check specific resource limits
          // This would be implemented based on actual usage tracking
          return true
        },
        
        // Permission methods
        hasPermission: (permission: string) => {
          const { user } = get()
          if (!user) return false
          
          // Admin has all permissions
          if (user.role === 'admin') return true
          
          // Check subscription features
          return user.subscription.features.includes(permission)
        },
        
        isAdmin: () => {
          const { user } = get()
          return user?.role === 'admin'
        }
      }),
      {
        name: 'user-storage',
        partialize: (state) => ({ 
          user: state.user, 
          isAuthenticated: state.isAuthenticated 
        })
      }
    ),
    { name: 'user-store' }
  )
)