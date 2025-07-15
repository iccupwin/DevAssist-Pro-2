import { AUTH_CONFIG } from '../config/auth';

/**
 * Утилиты для работы с аутентификацией
 */

/**
 * Проверка валидности JWT токена (базовая проверка)
 */
export const isTokenValid = (token: string): boolean => {
  if (!token) return false;

  try {
    const parts = token.split('.');
    if (parts.length !== 3) return false;

    // Декодируем payload
    const payload = JSON.parse(atob(parts[1]));
    
    // Проверяем срок действия
    if (payload.exp && Date.now() >= payload.exp * 1000) {
      return false;
    }

    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Получение данных из JWT токена
 */
export const getTokenPayload = (token: string): any | null => {
  if (!token) return null;

  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    return JSON.parse(atob(parts[1]));
  } catch (error) {
    return null;
  }
};

/**
 * Проверка времени истечения токена
 */
export const getTokenExpirationTime = (token: string): number | null => {
  const payload = getTokenPayload(token);
  return payload?.exp ? payload.exp * 1000 : null;
};

/**
 * Проверка, истекает ли токен скоро
 */
export const isTokenExpiringSoon = (token: string, thresholdMinutes = 5): boolean => {
  const expirationTime = getTokenExpirationTime(token);
  if (!expirationTime) return false;

  const threshold = thresholdMinutes * 60 * 1000;
  return (expirationTime - Date.now()) <= threshold;
};

/**
 * Очистка всех данных аутентификации из localStorage
 */
export const clearAuthData = (): void => {
  localStorage.removeItem(AUTH_CONFIG.TOKEN_STORAGE_KEY);
  localStorage.removeItem(AUTH_CONFIG.REFRESH_TOKEN_STORAGE_KEY);
  localStorage.removeItem(AUTH_CONFIG.USER_STORAGE_KEY);
};

/**
 * Получение токена из localStorage
 */
export const getStoredToken = (): string | null => {
  return localStorage.getItem(AUTH_CONFIG.TOKEN_STORAGE_KEY);
};

/**
 * Получение refresh токена из localStorage
 */
export const getStoredRefreshToken = (): string | null => {
  return localStorage.getItem(AUTH_CONFIG.REFRESH_TOKEN_STORAGE_KEY);
};

/**
 * Получение пользователя из localStorage
 */
export const getStoredUser = (): any | null => {
  try {
    const userStr = localStorage.getItem(AUTH_CONFIG.USER_STORAGE_KEY);
    return userStr ? JSON.parse(userStr) : null;
  } catch (error) {
    return null;
  }
};

/**
 * Сохранение токена в localStorage
 */
export const storeToken = (token: string): void => {
  localStorage.setItem(AUTH_CONFIG.TOKEN_STORAGE_KEY, token);
};

/**
 * Сохранение refresh токена в localStorage
 */
export const storeRefreshToken = (refreshToken: string): void => {
  localStorage.setItem(AUTH_CONFIG.REFRESH_TOKEN_STORAGE_KEY, refreshToken);
};

/**
 * Сохранение пользователя в localStorage
 */
export const storeUser = (user: any): void => {
  localStorage.setItem(AUTH_CONFIG.USER_STORAGE_KEY, JSON.stringify(user));
};

/**
 * Проверка, авторизован ли пользователь (по наличию и валидности токена)
 */
export const isAuthenticated = (): boolean => {
  const token = getStoredToken();
  return token ? isTokenValid(token) : false;
};

/**
 * Получение заголовков для API запросов с токеном
 */
export const getAuthHeaders = (): Record<string, string> => {
  const token = getStoredToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

/**
 * Создание безопасного пароля
 */
export const generateSecurePassword = (length = 12): string => {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let password = '';
  
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  
  return password;
};

/**
 * Проверка силы пароля
 */
export const checkPasswordStrength = (password: string): {
  score: number;
  feedback: string[];
  isStrong: boolean;
} => {
  const feedback: string[] = [];
  let score = 0;

  // Длина
  if (password.length >= 8) score += 1;
  else feedback.push('Минимум 8 символов');

  if (password.length >= 12) score += 1;

  // Строчные буквы
  if (/[a-z]/.test(password)) score += 1;
  else feedback.push('Добавьте строчные буквы');

  // Заглавные буквы
  if (/[A-Z]/.test(password)) score += 1;
  else feedback.push('Добавьте заглавные буквы');

  // Цифры
  if (/\d/.test(password)) score += 1;
  else feedback.push('Добавьте цифры');

  // Специальные символы
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 1;
  else feedback.push('Добавьте специальные символы');

  return {
    score,
    feedback,
    isStrong: score >= 4
  };
};

/**
 * Валидация email адреса
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Форматирование времени сессии
 */
export const formatSessionTime = (milliseconds: number): string => {
  const hours = Math.floor(milliseconds / (1000 * 60 * 60));
  const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((milliseconds % (1000 * 60)) / 1000);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  
  if (minutes > 0) {
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }
  
  return `${seconds}с`;
};

/**
 * Создание уникального ID для сессии
 */
export const generateSessionId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Получение информации о браузере для логов безопасности
 */
export const getBrowserInfo = (): {
  userAgent: string;
  platform: string;
  language: string;
  cookieEnabled: boolean;
} => {
  return {
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    language: navigator.language,
    cookieEnabled: navigator.cookieEnabled
  };
};

/**
 * Проверка поддержки localStorage
 */
export const isLocalStorageAvailable = (): boolean => {
  try {
    const test = '__localStorage_test__';
    localStorage.setItem(test, 'test');
    localStorage.removeItem(test);
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Безопасное получение данных из localStorage с fallback
 */
export const safeGetFromStorage = (key: string, fallback: any = null): any => {
  if (!isLocalStorageAvailable()) return fallback;
  
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch (error) {
    return fallback;
  }
};

/**
 * Безопасное сохранение данных в localStorage
 */
export const safeSetToStorage = (key: string, value: any): boolean => {
  if (!isLocalStorageAvailable()) return false;
  
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error('Ошибка сохранения в localStorage:', error);
    return false;
  }
};