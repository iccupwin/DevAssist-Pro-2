import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { ScreenReaderAnnouncements } from '../components/ui/ScreenReaderAnnouncements';

interface Announcement {
  id: string;
  message: string;
  priority: 'polite' | 'assertive';
  timestamp: number;
}

interface ScreenReaderContextType {
  announcements: Announcement[];
  announce: (message: string, priority?: 'polite' | 'assertive') => void;
  clearAnnouncements: () => void;
  
  // Специализированные методы
  announceFormError: (fieldName: string, error: string) => void;
  announceSuccess: (message: string) => void;
  announceNavigation: (pageName: string) => void;
  announceProgress: (current: number, total: number, operation: string) => void;
  announceFileUpload: (fileName: string, status: 'uploading' | 'success' | 'error') => void;
  announceLoadingState: (isLoading: boolean, operation?: string) => void;
  announceError: (error: string, context?: string) => void;
  announceDataUpdate: (dataType: string, action: 'created' | 'updated' | 'deleted') => void;
}

const ScreenReaderContext = createContext<ScreenReaderContextType | undefined>(undefined);

interface ScreenReaderProviderProps {
  children: React.ReactNode;
}

export const ScreenReaderProvider: React.FC<ScreenReaderProviderProps> = ({ children }) => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const idCounterRef = useRef(0);

  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    const id = `announcement-${++idCounterRef.current}`;
    const announcement: Announcement = {
      id,
      message,
      priority,
      timestamp: Date.now()
    };

    setAnnouncements(prev => [...prev, announcement]);

    // Автоматически удаляем объявление через 10 секунд
    setTimeout(() => {
      setAnnouncements(prev => prev.filter(a => a.id !== id));
    }, 10000);
  }, []);

  const clearAnnouncements = useCallback(() => {
    setAnnouncements([]);
  }, []);

  // Специализированные методы

  const announceFormError = useCallback((fieldName: string, error: string) => {
    announce(`Ошибка в поле "${fieldName}": ${error}`, 'assertive');
  }, [announce]);

  const announceSuccess = useCallback((message: string) => {
    announce(`Успешно: ${message}`, 'polite');
  }, [announce]);

  const announceNavigation = useCallback((pageName: string) => {
    announce(`Переход на страницу: ${pageName}`, 'polite');
  }, [announce]);

  const announceProgress = useCallback((current: number, total: number, operation: string) => {
    const percentage = Math.round((current / total) * 100);
    announce(`${operation}: ${percentage}% завершено, ${current} из ${total}`, 'polite');
  }, [announce]);

  const announceFileUpload = useCallback((fileName: string, status: 'uploading' | 'success' | 'error') => {
    const messages = {
      uploading: `Загрузка файла "${fileName}" началась`,
      success: `Файл "${fileName}" успешно загружен`,
      error: `Ошибка при загрузке файла "${fileName}"`
    };

    const priority = status === 'error' ? 'assertive' : 'polite';
    announce(messages[status], priority);
  }, [announce]);

  const announceLoadingState = useCallback((isLoading: boolean, operation = 'Операция') => {
    if (isLoading) {
      announce(`${operation} выполняется`, 'polite');
    } else {
      announce(`${operation} завершена`, 'polite');
    }
  }, [announce]);

  const announceError = useCallback((error: string, context?: string) => {
    const message = context ? `Ошибка в ${context}: ${error}` : `Ошибка: ${error}`;
    announce(message, 'assertive');
  }, [announce]);

  const announceDataUpdate = useCallback((dataType: string, action: 'created' | 'updated' | 'deleted') => {
    const actions = {
      created: 'создан',
      updated: 'обновлен',
      deleted: 'удален'
    };

    announce(`${dataType} ${actions[action]}`, 'polite');
  }, [announce]);

  const contextValue: ScreenReaderContextType = {
    announcements,
    announce,
    clearAnnouncements,
    announceFormError,
    announceSuccess,
    announceNavigation,
    announceProgress,
    announceFileUpload,
    announceLoadingState,
    announceError,
    announceDataUpdate
  };

  return (
    <ScreenReaderContext.Provider value={contextValue}>
      {children}
      <ScreenReaderAnnouncements
        announcements={announcements}
        maxAnnouncements={5}
      />
    </ScreenReaderContext.Provider>
  );
};

export const useScreenReader = (): ScreenReaderContextType => {
  const context = useContext(ScreenReaderContext);
  if (!context) {
    throw new Error('useScreenReader must be used within a ScreenReaderProvider');
  }
  return context;
};

export default ScreenReaderProvider;