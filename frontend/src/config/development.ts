/**
 * Development Configuration
 * ВНИМАНИЕ: Эти настройки только для разработки!
 * В production должны использоваться переменные окружения
 */

// Development-only test users
export const DEV_TEST_USERS = [
  {
    email: 'admin@test.local',
    password: 'dev_admin_2024',
    role: 'admin' as const,
    profile: {
      id: 1,
      email: 'admin@test.local',
      full_name: 'Test Admin',
      firstName: 'Test',
      lastName: 'Admin',
      role: 'admin' as const,
      avatar: '',
      isEmailVerified: true,
      is2FAEnabled: false,
      is_active: true,
      is_verified: true,
      is_superuser: true,
      subscription: {
        plan: 'Professional',
        status: 'active' as const,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      },
      preferences: {
        language: 'ru',
        theme: 'system' as const,
        notifications: {
          email: true,
          push: true,
        },
      },
      created_at: '2024-01-15T00:00:00Z',
      updated_at: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
    }
  },
  {
    email: 'user@test.local',
    password: 'dev_user_2024',
    role: 'user' as const,
    profile: {
      id: 2,
      email: 'user@test.local',
      full_name: 'Test User',
      firstName: 'Test',
      lastName: 'User',
      role: 'user' as const,
      avatar: '',
      isEmailVerified: true,
      is2FAEnabled: false,
      is_active: true,
      is_verified: true,
      is_superuser: false,
      subscription: {
        plan: 'Free',
        status: 'active' as const,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      },
      preferences: {
        language: 'ru',
        theme: 'system' as const,
        notifications: {
          email: true,
          push: false,
        },
      },
      created_at: '2024-01-15T00:00:00Z',
      updated_at: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
    }
  }
];

// Development configuration
export const DEV_CONFIG = {
  // Mock API режим только для development
  USE_MOCK_AUTH: process.env.NODE_ENV === 'development',
  
  // Показывать dev credentials в UI
  SHOW_DEV_CREDENTIALS: process.env.NODE_ENV === 'development',
  
  // Test mode flags
  ENABLE_AUTH_DEBUG: process.env.NODE_ENV === 'development',
  
  // Автологин для development
  AUTO_LOGIN_EMAIL: process.env.REACT_APP_AUTO_LOGIN_EMAIL || null,
} as const;

/**
 * SECURITY WARNING:
 * Этот файл содержит тестовые credentials только для development!
 * В production эти значения игнорируются и используется real backend auth.
 */
if (process.env.NODE_ENV === 'production') {
  console.warn('Development credentials are disabled in production mode');
}