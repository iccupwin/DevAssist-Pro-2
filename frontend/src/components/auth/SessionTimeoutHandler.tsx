/**
 * SessionTimeoutHandler - компонент для обработки истечения сессии и токенов
 * Согласно ТЗ DevAssist Pro
 */

import React, { useState, useEffect } from 'react';
import { AlertTriangle, Clock, RefreshCw, LogOut } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTokenRefresh } from '../../hooks/useTokenRefresh';
import { Button } from '../ui/Button';

interface SessionTimeoutHandlerProps {
  warningTimeMs?: number; // Время предупреждения до истечения (по умолчанию 5 минут)
  enableWarningModal?: boolean; // Показывать модальное окно предупреждения
  enableAutoRefresh?: boolean; // Автоматическое обновление токена
  className?: string;
}

export const SessionTimeoutHandler: React.FC<SessionTimeoutHandlerProps> = ({
  warningTimeMs = 5 * 60 * 1000, // 5 минут
  enableWarningModal = true,
  enableAutoRefresh = true,
  className = ''
}) => {
  const { 
    isAuthenticated, 
    logout, 
    timeUntilExpiration,
    isRefreshing
  } = useAuth();

  const {
    refreshToken,
    formattedTimeLeft,
    isTokenExpired,
    needsRefresh
  } = useTokenRefresh({
    autoRefresh: enableAutoRefresh,
    checkInterval: 30000 // Проверяем каждые 30 секунд
  });

  const [showWarning, setShowWarning] = useState(false);
  const [isExtendingSession, setIsExtendingSession] = useState(false);

  // Проверяем необходимость показа предупреждения
  useEffect(() => {
    if (!isAuthenticated || !enableWarningModal || !timeUntilExpiration) {
      setShowWarning(false);
      return;
    }

    // Показываем предупреждение если осталось мало времени
    if (timeUntilExpiration <= warningTimeMs && timeUntilExpiration > 0) {
      setShowWarning(true);
    } else {
      setShowWarning(false);
    }
  }, [isAuthenticated, timeUntilExpiration, warningTimeMs, enableWarningModal]);

  // Автоматический logout при истечении токена
  useEffect(() => {
    if (isTokenExpired && isAuthenticated) {
      console.log('[SessionTimeoutHandler] Token expired, logging out');
      handleLogout();
    }
  }, [isTokenExpired, isAuthenticated]);

  const handleExtendSession = async () => {
    setIsExtendingSession(true);
    try {
      const success = await refreshToken();
      if (success) {
        setShowWarning(false);
        console.log('[SessionTimeoutHandler] Session extended successfully');
      } else {
        console.error('[SessionTimeoutHandler] Failed to extend session');
      }
    } catch (error) {
      console.error('[SessionTimeoutHandler] Error extending session:', error);
    } finally {
      setIsExtendingSession(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('[SessionTimeoutHandler] Error during logout:', error);
    }
  };

  const handleDismissWarning = () => {
    setShowWarning(false);
  };

  // Форматирование времени для отображения
  const formatTime = (timeMs: number | null): string => {
    if (!timeMs || timeMs <= 0) return '0с';
    
    const minutes = Math.floor(timeMs / 60000);
    const seconds = Math.floor((timeMs % 60000) / 1000);
    
    if (minutes > 0) {
      return `${minutes}м ${seconds}с`;
    }
    return `${seconds}с`;
  };

  // Если пользователь не авторизован, не показываем компонент
  if (!isAuthenticated) {
    return null;
  }

  return (
    <>
      {/* Индикатор статуса сессии (всегда видимый) */}
      <div className={`${className}`}>
        {timeUntilExpiration && timeUntilExpiration > 0 && (
          <div className={`text-xs ${timeUntilExpiration <= warningTimeMs ? 'text-orange-600' : 'text-gray-500'}`}>
            Сессия: {formatTime(timeUntilExpiration)}
            {isRefreshing && (
              <RefreshCw className="inline-block ml-1 h-3 w-3 animate-spin" />
            )}
          </div>
        )}
      </div>

      {/* Модальное окно предупреждения */}
      {showWarning && enableWarningModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Overlay */}
          <div className="fixed inset-0 bg-black bg-opacity-50" />
          
          {/* Modal */}
          <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <div className="flex items-center space-x-3 mb-4">
              <AlertTriangle className="h-6 w-6 text-orange-500" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Сессия истекает
              </h3>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Ваша сессия истечет через{' '}
                <span className="font-semibold text-orange-600">
                  {formatTime(timeUntilExpiration)}
                </span>
                . Вы будете автоматически разлогинены.
              </p>
              
              <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                <Clock className="h-4 w-4" />
                <span>Продлите сессию, чтобы продолжить работу</span>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
              <Button
                onClick={handleExtendSession}
                disabled={isExtendingSession}
                className="flex-1 flex items-center justify-center space-x-2"
              >
                {isExtendingSession ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Продление...</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4" />
                    <span>Продлить сессию</span>
                  </>
                )}
              </Button>
              
              <Button
                variant="outline"
                onClick={handleLogout}
                className="flex-1 flex items-center justify-center space-x-2"
              >
                <LogOut className="h-4 w-4" />
                <span>Выйти</span>
              </Button>
              
              <Button
                variant="ghost"
                onClick={handleDismissWarning}
                className="flex-1"
              >
                Скрыть
              </Button>
            </div>
            
            {/* Дополнительная информация */}
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
              <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                <span>Автообновление:</span>
                <span className={enableAutoRefresh ? 'text-green-600' : 'text-red-600'}>
                  {enableAutoRefresh ? 'Включено' : 'Отключено'}
                </span>
              </div>
              
              {needsRefresh && (
                <div className="flex items-center space-x-1 mt-2 text-xs text-orange-600">
                  <AlertTriangle className="h-3 w-3" />
                  <span>Требуется обновление токена</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SessionTimeoutHandler;