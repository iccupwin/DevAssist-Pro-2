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
  LOGIN: '/api/auth/login',
  REGISTER: '/api/auth/register',
  FORGOT_PASSWORD: '/api/auth/forgot-password',
  RESET_PASSWORD: '/api/auth/reset-password',
  REFRESH_TOKEN: '/api/auth/refresh',
  LOGOUT: '/api/auth/logout',
} as const;

export const AUTH_CONFIG = {
  TOKEN_STORAGE_KEY: 'devassist_token',
  REFRESH_TOKEN_STORAGE_KEY: 'devassist_refresh_token',
  USER_STORAGE_KEY: 'devassist_user',
  SESSION_TIMEOUT: 24 * 60 * 60 * 1000, // 24 часа
} as const;