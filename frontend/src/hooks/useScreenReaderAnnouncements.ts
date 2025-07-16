import { useState, useCallback, useRef } from 'react';

interface Announcement {
  id: string;
  message: string;
  priority: 'polite' | 'assertive';
  timestamp: number;
}

interface UseScreenReaderAnnouncementsReturn {
  announcements: Announcement[];
  announce: (message: string, priority?: 'polite' | 'assertive') => void;
  clearAnnouncements: () => void;
  announceFormError: (fieldName: string, error: string) => void;
  announceSuccess: (message: string) => void;
  announceNavigation: (pageName: string) => void;
  announceProgress: (current: number, total: number, operation: string) => void;
  announceFileUpload: (fileName: string, status: 'uploading' | 'success' | 'error') => void;
}

/**
 * Хук для управления объявлениями screen reader
 */
export const useScreenReaderAnnouncements = (): UseScreenReaderAnnouncementsReturn => {
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

  // Специализированные функции для объявлений

  const announceFormError = useCallback((fieldName: string, error: string) => {
    announce(`Ошибка в поле ${fieldName}: ${error}`, 'assertive');
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
      uploading: `Загрузка файла ${fileName}`,
      success: `Файл ${fileName} успешно загружен`,
      error: `Ошибка при загрузке файла ${fileName}`
    };

    const priority = status === 'error' ? 'assertive' : 'polite';
    announce(messages[status], priority);
  }, [announce]);

  return {
    announcements,
    announce,
    clearAnnouncements,
    announceFormError,
    announceSuccess,
    announceNavigation,
    announceProgress,
    announceFileUpload
  };
};

export default useScreenReaderAnnouncements;