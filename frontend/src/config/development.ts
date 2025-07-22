/**
 * Development Configuration
 * ⚠️ ВНИМАНИЕ: Эти настройки только для разработки!
 * 🔒 В production все mock данные автоматически блокированы
 * 🚫 Test users и mock auth отключены в production режиме
 * ✅ Используйте переменные окружения для безопасной настройки
 */

// Development-only test users - PRODUCTION БЛОКИРОВАНЫ
const DEV_TEST_USERS_INTERNAL = [
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

// SECURITY: Блокируем test users в production
export const DEV_TEST_USERS = process.env.NODE_ENV === 'production' ? [] : DEV_TEST_USERS_INTERNAL;

// Development configuration - PRODUCTION БЕЗОПАСНО
export const DEV_CONFIG = {
  // Mock API режим только для development И с разрешенным mock режимом
  USE_MOCK_AUTH: process.env.NODE_ENV === 'development' && process.env.REACT_APP_ENABLE_MOCK_AUTH === 'true',
  
  // Показывать dev credentials в UI только в development
  SHOW_DEV_CREDENTIALS: process.env.NODE_ENV === 'development' && process.env.REACT_APP_SHOW_DEV_CREDENTIALS === 'true',
  
  // Test mode flags только для development
  ENABLE_AUTH_DEBUG: process.env.NODE_ENV === 'development' && process.env.REACT_APP_ENABLE_AUTH_DEBUG === 'true',
  
  // Автологин для development (отключен в production)
  AUTO_LOGIN_EMAIL: process.env.NODE_ENV === 'development' ? process.env.REACT_APP_AUTO_LOGIN_EMAIL || null : null,
} as const;

/**
 * SECURITY WARNING:
 * Этот файл содержит тестовые credentials только для development!
 * В production эти значения ПОЛНОСТЬЮ БЛОКИРОВАНЫ и используется real backend auth.
 */
if (process.env.NODE_ENV === 'production') {
  console.warn('🔒 PRODUCTION MODE: Development credentials and mock auth are DISABLED');
  
  // Дополнительная проверка безопасности в production
  if (DEV_TEST_USERS.length > 0) {
    console.error('❌ SECURITY ERROR: Test users detected in production!');
    throw new Error('Test users must be blocked in production mode');
  }
  
  if (DEV_CONFIG.USE_MOCK_AUTH) {
    console.error('❌ SECURITY ERROR: Mock auth enabled in production!');
    throw new Error('Mock authentication must be disabled in production mode');
  }
}