// Конфигурация авторизации
export const VALIDATION_RULES = {
  email: {
    required: 'Email обязателен',
    pattern: {
      value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      message: 'Введите корректный email'
    }
  },
  password: {
    required: 'Пароль обязателен',
    minLength: {
      value: 8,
      message: 'Пароль должен содержать минимум 8 символов'
    },
    maxLength: {
      value: 128,
      message: 'Пароль слишком длинный'
    },
    pattern: {
      value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/,
      message: 'Пароль должен содержать заглавные и строчные буквы, цифры'
    }
  },
  firstName: {
    required: 'Имя обязательно',
    minLength: {
      value: 2,
      message: 'Имя должно содержать минимум 2 символа'
    },
    maxLength: {
      value: 50,
      message: 'Имя слишком длинное'
    }
  },
  lastName: {
    required: 'Фамилия обязательна',
    minLength: {
      value: 2,
      message: 'Фамилия должна содержать минимум 2 символа'
    },
    maxLength: {
      value: 50,
      message: 'Фамилия слишком длинная'
    }
  }
} as const;

export const SOCIAL_PROVIDERS = [
  {
    id: 'google',
    name: 'Google',
    displayName: 'Google',
    icon: 'chrome',
    enabled: true,
  },
  {
    id: 'yandex',
    name: 'Яндекс',
    displayName: 'Яндекс',
    icon: 'grid3X3',
    enabled: true,
  },
  {
    id: 'vk',
    name: 'ВКонтакте',
    displayName: 'ВКонтакте',
    icon: 'circle',
    enabled: true,
  },
] as const;

export const AUTH_ENDPOINTS = {
  LOGIN: '/login',
  REGISTER: '/register', 
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',
  REFRESH_TOKEN: '/refresh',
  LOGOUT: '/logout',
  PROFILE: '/profile',
} as const;

// Backend auth service configuration
// 🔒 PRODUCTION READY: Uses environment variables with secure fallbacks
export const AUTH_CONFIG_API = {
  BASE_URL: process.env.REACT_APP_AUTH_API_URL || (
    process.env.NODE_ENV === 'production' 
      ? 'https://your-auth-domain.com' 
      : 'http://localhost:8001'
  ),
  TIMEOUT: 30000,
} as const;

export const AUTH_CONFIG = {
  TOKEN_STORAGE_KEY: 'devassist_token',
  REFRESH_TOKEN_STORAGE_KEY: 'devassist_refresh_token',
  TOKEN_EXPIRES_AT_KEY: 'devassist_token_expires_at',
  USER_STORAGE_KEY: 'devassist_user',
  SESSION_TIMEOUT: 24 * 60 * 60 * 1000, // 24 часа
} as const;