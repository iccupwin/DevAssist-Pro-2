import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Volume2, VolumeX, Keyboard, Mouse } from 'lucide-react';
import { cn } from '../../lib/utils';

interface AccessibilityHelperProps {
  showHelper?: boolean;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  className?: string;
}

/**
 * Помощник доступности для пользователей с ограниченными возможностями
 */
export const AccessibilityHelper: React.FC<AccessibilityHelperProps> = ({
  showHelper = true,
  position = 'bottom-left',
  className
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [settings, setSettings] = useState({
    highContrast: false,
    largeText: false,
    focusIndicator: true,
    keyboardNavigation: true,
    screenReader: false,
    reduceMotion: false
  });

  useEffect(() => {
    // Применяем настройки доступности
    const root = document.documentElement;
    
    if (settings.highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }
    
    if (settings.largeText) {
      root.classList.add('large-text');
    } else {
      root.classList.remove('large-text');
    }
    
    if (settings.reduceMotion) {
      root.classList.add('reduce-motion');
    } else {
      root.classList.remove('reduce-motion');
    }
    
    if (settings.focusIndicator) {
      root.classList.add('focus-indicator');
    } else {
      root.classList.remove('focus-indicator');
    }
  }, [settings]);

  const getPositionClasses = () => {
    const baseClasses = 'fixed z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg';
    
    switch (position) {
      case 'top-left':
        return `${baseClasses} top-4 left-4`;
      case 'top-right':
        return `${baseClasses} top-4 right-4`;
      case 'bottom-left':
        return `${baseClasses} bottom-4 left-4`;
      case 'bottom-right':
        return `${baseClasses} bottom-4 right-4`;
      default:
        return `${baseClasses} bottom-4 left-4`;
    }
  };

  const toggleSetting = (setting: keyof typeof settings) => {
    setSettings(prev => ({
      ...prev,
      [setting]: !prev[setting]
    }));
  };

  if (!showHelper) return null;

  return (
    <div className={cn(getPositionClasses(), className)}>
      {/* Кнопка переключения */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 p-3 w-full text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors rounded-lg"
        aria-label="Настройки доступности"
        aria-expanded={isExpanded}
      >
        <Eye className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        <span className="font-medium text-gray-900 dark:text-white">
          Доступность
        </span>
      </button>

      {/* Панель настроек */}
      {isExpanded && (
        <div className="border-t border-gray-200 dark:border-gray-700 p-4 space-y-3 min-w-[250px]">
          {/* Высокий контраст */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Высокий контраст
              </span>
            </div>
            <button
              onClick={() => toggleSetting('highContrast')}
              className={cn(
                'w-10 h-6 rounded-full transition-colors',
                settings.highContrast ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
              )}
              aria-label="Переключить высокий контраст"
            >
              <div className={cn(
                'w-4 h-4 bg-white rounded-full transition-transform',
                settings.highContrast ? 'translate-x-5' : 'translate-x-1'
              )} />
            </button>
          </div>

          {/* Крупный текст */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Крупный текст
              </span>
            </div>
            <button
              onClick={() => toggleSetting('largeText')}
              className={cn(
                'w-10 h-6 rounded-full transition-colors',
                settings.largeText ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
              )}
              aria-label="Переключить крупный текст"
            >
              <div className={cn(
                'w-4 h-4 bg-white rounded-full transition-transform',
                settings.largeText ? 'translate-x-5' : 'translate-x-1'
              )} />
            </button>
          </div>

          {/* Индикатор фокуса */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Keyboard className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Индикатор фокуса
              </span>
            </div>
            <button
              onClick={() => toggleSetting('focusIndicator')}
              className={cn(
                'w-10 h-6 rounded-full transition-colors',
                settings.focusIndicator ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
              )}
              aria-label="Переключить индикатор фокуса"
            >
              <div className={cn(
                'w-4 h-4 bg-white rounded-full transition-transform',
                settings.focusIndicator ? 'translate-x-5' : 'translate-x-1'
              )} />
            </button>
          </div>

          {/* Уменьшить анимации */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mouse className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Уменьшить анимации
              </span>
            </div>
            <button
              onClick={() => toggleSetting('reduceMotion')}
              className={cn(
                'w-10 h-6 rounded-full transition-colors',
                settings.reduceMotion ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
              )}
              aria-label="Переключить уменьшение анимаций"
            >
              <div className={cn(
                'w-4 h-4 bg-white rounded-full transition-transform',
                settings.reduceMotion ? 'translate-x-5' : 'translate-x-1'
              )} />
            </button>
          </div>

          {/* Информация */}
          <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Используйте <kbd className="bg-gray-100 dark:bg-gray-700 px-1 py-0.5 rounded text-xs">Tab</kbd> для навигации
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Живая область для объявления изменений screen reader'ам
 */
export const LiveRegion: React.FC<{
  children: React.ReactNode;
  politeness?: 'polite' | 'assertive' | 'off';
  atomic?: boolean;
  className?: string;
}> = ({ children, politeness = 'polite', atomic = false, className }) => {
  return (
    <div
      aria-live={politeness}
      aria-atomic={atomic}
      className={cn('sr-only', className)}
    >
      {children}
    </div>
  );
};

/**
 * Описание элемента для screen reader
 */
export const ScreenReaderOnly: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className }) => {
  return (
    <span className={cn('sr-only', className)}>
      {children}
    </span>
  );
};

/**
 * Компонент для объявления статуса загрузки
 */
export const LoadingAnnouncement: React.FC<{
  isLoading: boolean;
  loadingMessage?: string;
  completedMessage?: string;
}> = ({ 
  isLoading, 
  loadingMessage = 'Загрузка...', 
  completedMessage = 'Загрузка завершена' 
}) => {
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (isLoading) {
      setMessage(loadingMessage);
    } else if (message === loadingMessage) {
      setMessage(completedMessage);
    }
  }, [isLoading, loadingMessage, completedMessage, message]);

  return (
    <LiveRegion politeness="polite">
      {message}
    </LiveRegion>
  );
};

/**
 * Компонент для объявления ошибок
 */
export const ErrorAnnouncement: React.FC<{
  error: string | null;
  prefix?: string;
}> = ({ error, prefix = 'Ошибка:' }) => {
  return (
    <LiveRegion politeness="assertive">
      {error && `${prefix} ${error}`}
    </LiveRegion>
  );
};

/**
 * Компонент для объявления успешных действий
 */
export const SuccessAnnouncement: React.FC<{
  message: string | null;
  prefix?: string;
}> = ({ message, prefix = 'Успешно:' }) => {
  return (
    <LiveRegion politeness="polite">
      {message && `${prefix} ${message}`}
    </LiveRegion>
  );
};

/**
 * Контейнер для группировки связанных элементов
 */
export const AccessibleGroup: React.FC<{
  children: React.ReactNode;
  label: string;
  description?: string;
  className?: string;
}> = ({ children, label, description, className }) => {
  const groupId = React.useId();
  const descriptionId = React.useId();

  return (
    <div
      role="group"
      aria-labelledby={groupId}
      aria-describedby={description ? descriptionId : undefined}
      className={className}
    >
      <div id={groupId} className="sr-only">
        {label}
      </div>
      {description && (
        <div id={descriptionId} className="sr-only">
          {description}
        </div>
      )}
      {children}
    </div>
  );
};

export default AccessibilityHelper;