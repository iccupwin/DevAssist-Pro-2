import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface UseSessionTimeoutOptions {
  warningTime?: number; // Время предупреждения в миллисекундах (по умолчанию 5 минут)
  onWarning?: () => void;
  onTimeout?: () => void;
  autoExtend?: boolean; // Автоматически продлевать сессию при активности
}

/**
 * Хук для управления тайм-аутом сессии
 * @param options - Опции для настройки поведения тайм-аута
 * @returns объект с информацией о состоянии сессии
 */
export const useSessionTimeout = (options: UseSessionTimeoutOptions = {}) => {
  const { isAuthenticated, refreshToken, logout, checkSessionExpiry, getSessionExpiresAt } = useAuth();
  const {
    warningTime = 5 * 60 * 1000, // 5 минут
    onWarning,
    onTimeout,
    autoExtend = false
  } = options;

  const [timeUntilExpiry, setTimeUntilExpiry] = useState<number | null>(null);
  const [showWarning, setShowWarning] = useState(false);
  const [lastActivity, setLastActivity] = useState(Date.now());

  // Обновление времени до истечения сессии
  useEffect(() => {
    const sessionExpiresAt = getSessionExpiresAt();
    if (!isAuthenticated || !sessionExpiresAt) {
      setTimeUntilExpiry(null);
      setShowWarning(false);
      return;
    }

    const updateTimer = () => {
      const now = Date.now();
      const timeLeft = sessionExpiresAt - now;
      setTimeUntilExpiry(timeLeft);

      // Показываем предупреждение, если времени осталось меньше warningTime
      if (timeLeft <= warningTime && timeLeft > 0 && !showWarning) {
        setShowWarning(true);
        onWarning?.();
      }

      // Автоматический logout при истечении времени
      if (timeLeft <= 0) {
        setShowWarning(false);
        onTimeout?.();
        logout();
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000); // Обновляем каждую секунду

    return () => clearInterval(interval);
  }, [isAuthenticated, getSessionExpiresAt, warningTime, showWarning, onWarning, onTimeout, logout]);

  // Отслеживание активности пользователя
  useEffect(() => {
    if (!autoExtend || !isAuthenticated) return;

    const handleActivity = () => {
      setLastActivity(Date.now());
    };

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    events.forEach(event => {
      document.addEventListener(event, handleActivity, true);
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity, true);
      });
    };
  }, [autoExtend, isAuthenticated]);

  // Автоматическое продление сессии при активности
  useEffect(() => {
    if (!autoExtend || !isAuthenticated || !timeUntilExpiry) return;

    const activityThreshold = 30 * 1000; // 30 секунд с последней активности
    const renewThreshold = 10 * 60 * 1000; // Продлеваем, если осталось меньше 10 минут

    if (
      timeUntilExpiry <= renewThreshold &&
      Date.now() - lastActivity <= activityThreshold
    ) {
      refreshToken();
    }
  }, [autoExtend, isAuthenticated, timeUntilExpiry, lastActivity, refreshToken]);

  // Методы для управления сессией
  const extendSession = useCallback(async () => {
    try {
      await refreshToken();
      setShowWarning(false);
    } catch (error) {
      console.error('Ошибка продления сессии:', error);
    }
  }, [refreshToken]);

  const dismissWarning = useCallback(() => {
    setShowWarning(false);
  }, []);

  // Форматирование времени для отображения
  const formatTimeLeft = useCallback((milliseconds: number): string => {
    const minutes = Math.floor(milliseconds / (1000 * 60));
    const seconds = Math.floor((milliseconds % (1000 * 60)) / 1000);
    
    if (minutes > 0) {
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
    
    return `${seconds}с`;
  }, []);

  return {
    // Состояние
    timeUntilExpiry,
    showWarning,
    isExpired: timeUntilExpiry !== null && timeUntilExpiry <= 0,
    isExpiringSoon: timeUntilExpiry !== null && timeUntilExpiry <= warningTime,
    
    // Форматированные данные
    timeLeftFormatted: timeUntilExpiry ? formatTimeLeft(timeUntilExpiry) : null,
    minutesLeft: timeUntilExpiry ? Math.floor(timeUntilExpiry / (1000 * 60)) : null,
    
    // Методы
    extendSession,
    dismissWarning,
    
    // Утилиты
    formatTimeLeft,
  };
};