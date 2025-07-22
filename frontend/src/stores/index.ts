// Zustand stores export - DevAssist Pro
export { useUserStore } from './userStore'
export { useAIStore } from './aiStore'
export { useKPAnalyzerStore } from './kpAnalyzerStore'
export { useAppStore } from './appStore'

// Types export
export * from './types'

// Store utilities
export const resetAllStores = () => {
  // Clear localStorage for all stores
  localStorage.removeItem('user-storage')
  localStorage.removeItem('ai-storage')
  localStorage.removeItem('kp-analyzer-storage')
  localStorage.removeItem('app-storage')
  
  // Reload page to reinitialize stores
  window.location.reload()
}

// Helper to check if user is authenticated across stores
export const isAuthenticated = () => {
  try {
    const userStorage = localStorage.getItem('user-storage')
    if (!userStorage) return false
    
    const parsed = JSON.parse(userStorage)
    return parsed.state?.isAuthenticated || false
  } catch {
    return false
  }
}

// Helper to get current user from storage
export const getCurrentUser = () => {
  try {
    const userStorage = localStorage.getItem('user-storage')
    if (!userStorage) return null
    
    const parsed = JSON.parse(userStorage)
    return parsed.state?.user || null
  } catch {
    return null
  }
}

// Helper to get current theme from storage
export const getCurrentTheme = () => {
  try {
    const appStorage = localStorage.getItem('app-storage')
    if (!appStorage) return 'light'
    
    const parsed = JSON.parse(appStorage)
    return parsed.state?.settings?.theme || 'light'
  } catch {
    return 'light'
  }
}

// Development helpers (only in development)
if (process.env.NODE_ENV === 'development') {
  // Make stores available in window for debugging
  ;(window as any).stores = {
    resetAllStores,
    isAuthenticated,
    getCurrentUser,
    getCurrentTheme
  }
}