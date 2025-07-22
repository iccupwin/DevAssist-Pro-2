/**
 * useTokenRefresh Hook - автоматическое управление обновлением токенов
 * Согласно ТЗ DevAssist Pro
 */

import { useEffect, useCallback, useRef, useState } from 'react';
import { TokenService, tokenService } from '../services/tokenService';

interface UseTokenRefreshOptions {
  checkInterval?: number; // Интервал проверки в миллисекундах
  autoRefresh?: boolean; // Автоматическое обновление
  onTokenRefreshed?: () => void; // Колбэк при успешном обновлении
  onTokenExpired?: () => void; // Колбэк при истечении токена
  onRefreshFailed?: (error: Error) => void; // Колбэк при ошибке обновления
}

interface TokenRefreshState {
  isRefreshing: boolean;
  timeUntilExpiration: number | null;
  lastRefreshTime: number | null;
  refreshError: Error | null;
}

export const useTokenRefresh = (options: UseTokenRefreshOptions = {}) => {
  const {
    checkInterval = 60000, // 1 минута
    autoRefresh = true,
    onTokenRefreshed,
    onTokenExpired,
    onRefreshFailed
  } = options;

  const [state, setState] = useState<TokenRefreshState>({
    isRefreshing: false,
    timeUntilExpiration: null,
    lastRefreshTime: null,
    refreshError: null
  });

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isRefreshingRef = useRef(false);

  /**
   * Обновление состояния времени до истечения токена
   */
  const updateTimeUntilExpiration = useCallback(() => {
    const timeLeft = TokenService.getTimeUntilExpiration();
    setState(prev => ({ ...prev, timeUntilExpiration: timeLeft }));
    return timeLeft;
  }, []);

  /**
   * Выполнение обновления токена
   */
  const refreshToken = useCallback(async (): Promise<boolean> => {
    if (isRefreshingRef.current) {
      console.log('[useTokenRefresh] Refresh already in progress');
      return false;
    }

    if (!TokenService.getRefreshToken()) {
      console.warn('[useTokenRefresh] No refresh token available');
      onTokenExpired?.();
      return false;
    }

    if (TokenService.isRefreshTokenExpired()) {
      console.warn('[useTokenRefresh] Refresh token is expired');
      onTokenExpired?.();
      return false;
    }

    isRefreshingRef.current = true;
    setState(prev => ({ ...prev, isRefreshing: true, refreshError: null }));

    try {
      console.log('[useTokenRefresh] Starting token refresh');
      
      await tokenService.refreshTokens();
      
      const now = Date.now();
      setState(prev => ({
        ...prev,
        isRefreshing: false,
        lastRefreshTime: now,
        refreshError: null
      }));

      updateTimeUntilExpiration();
      onTokenRefreshed?.();
      
      console.log('[useTokenRefresh] Token refresh successful');
      return true;

    } catch (error) {
      const refreshError = error instanceof Error ? error : new Error('Token refresh failed');
      
      setState(prev => ({
        ...prev,
        isRefreshing: false,
        refreshError
      }));

      console.error('[useTokenRefresh] Token refresh failed:', refreshError);
      onRefreshFailed?.(refreshError);
      
      // Если refresh token недействителен, считаем что сессия истекла
      if (refreshError.message.includes('invalid') || refreshError.message.includes('expired')) {
        onTokenExpired?.();
      }
      
      return false;
    } finally {
      isRefreshingRef.current = false;
    }
  }, [onTokenRefreshed, onTokenExpired, onRefreshFailed, updateTimeUntilExpiration]);

  /**
   * Проверка необходимости обновления токена
   */
  const checkTokenStatus = useCallback(async () => {
    if (!TokenService.isAuthenticated()) {
      return;
    }

    const timeLeft = updateTimeUntilExpiration();
    
    if (timeLeft === null) {
      return;
    }

    // Проверяем, нужно ли обновить токен
    if (TokenService.shouldRefreshToken()) {
      console.log('[useTokenRefresh] Token needs refresh, time left:', timeLeft);
      
      if (autoRefresh) {
        await refreshToken();
      }
    }

    // Если токен истек
    if (timeLeft <= 0) {
      console.warn('[useTokenRefresh] Token has expired');
      onTokenExpired?.();
    }
  }, [autoRefresh, refreshToken, updateTimeUntilExpiration, onTokenExpired]);

  /**
   * Запуск периодической проверки
   */
  const startPeriodicCheck = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // Выполняем первую проверку сразу
    checkTokenStatus();

    // Настраиваем периодическую проверку
    intervalRef.current = setInterval(checkTokenStatus, checkInterval);
    
    console.log(`[useTokenRefresh] Started periodic token check every ${checkInterval}ms`);
  }, [checkTokenStatus, checkInterval]);

  /**
   * Остановка периодической проверки
   */
  const stopPeriodicCheck = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
      console.log('[useTokenRefresh] Stopped periodic token check');
    }
  }, []);

  /**
   * Принудительная проверка токена
   */
  const forceCheck = useCallback(async () => {
    console.log('[useTokenRefresh] Forcing token check');
    await checkTokenStatus();
  }, [checkTokenStatus]);

  /**
   * Получение информации о сессии
   */
  const getSessionInfo = useCallback(() => {
    return TokenService.getSessionInfo();
  }, []);

  /**
   * Проверка, нужно ли обновлять токен
   */
  const shouldRefresh = useCallback(() => {
    return TokenService.shouldRefreshToken();
  }, []);

  /**
   * Форматирование времени до истечения
   */
  const formatTimeUntilExpiration = useCallback((timeMs: number | null): string => {
    if (timeMs === null || timeMs <= 0) {
      return 'Expired';
    }

    const minutes = Math.floor(timeMs / 60000);
    const seconds = Math.floor((timeMs % 60000) / 1000);
    
    if (minutes > 60) {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      return `${hours}h ${remainingMinutes}m`;
    }
    
    if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    }
    
    return `${seconds}s`;
  }, []);

  // Effect для запуска/остановки периодической проверки
  useEffect(() => {
    if (TokenService.isAuthenticated()) {
      startPeriodicCheck();
    } else {
      stopPeriodicCheck();
    }

    return () => {
      stopPeriodicCheck();
    };
  }, [startPeriodicCheck, stopPeriodicCheck]);

  // Effect для обработки visibility change (когда пользователь переключается между вкладками)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && TokenService.isAuthenticated()) {
        console.log('[useTokenRefresh] Tab became visible, checking token status');
        forceCheck();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [forceCheck]);

  // Effect для обработки focus событий
  useEffect(() => {
    const handleFocus = () => {
      if (TokenService.isAuthenticated()) {
        console.log('[useTokenRefresh] Window focused, checking token status');
        forceCheck();
      }
    };

    window.addEventListener('focus', handleFocus);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [forceCheck]);

  return {
    // Состояние
    ...state,
    
    // Методы
    refreshToken,
    forceCheck,
    startPeriodicCheck,
    stopPeriodicCheck,
    
    // Утилиты
    getSessionInfo,
    shouldRefresh,
    formatTimeUntilExpiration,
    
    // Вычисляемые значения
    isAuthenticated: TokenService.isAuthenticated(),
    formattedTimeLeft: formatTimeUntilExpiration(state.timeUntilExpiration),
    isTokenExpired: state.timeUntilExpiration !== null && state.timeUntilExpiration <= 0,
    needsRefresh: TokenService.shouldRefreshToken()
  };
};

export type { UseTokenRefreshOptions, TokenRefreshState };