import React, { useEffect, useRef } from 'react';

interface ScreenReaderAnnouncementsProps {
  // Список объявлений для screen reader
  announcements: {
    id: string;
    message: string;
    priority: 'polite' | 'assertive';
    timestamp: number;
  }[];
  // Максимальное количество объявлений
  maxAnnouncements?: number;
}

/**
 * Компонент для объявлений screen reader
 * Использует aria-live регионы для уведомления пользователей assistive technologies
 */
export const ScreenReaderAnnouncements: React.FC<ScreenReaderAnnouncementsProps> = ({
  announcements,
  maxAnnouncements = 5
}) => {
  const politeRef = useRef<HTMLDivElement>(null);
  const assertiveRef = useRef<HTMLDivElement>(null);

  // Фильтруем последние объявления
  const recentAnnouncements = announcements
    .slice(-maxAnnouncements)
    .sort((a, b) => b.timestamp - a.timestamp);

  const politeAnnouncements = recentAnnouncements.filter(a => a.priority === 'polite');
  const assertiveAnnouncements = recentAnnouncements.filter(a => a.priority === 'assertive');

  useEffect(() => {
    // Очищаем старые объявления через 5 секунд
    const cleanup = setTimeout(() => {
      if (politeRef.current) {
        politeRef.current.textContent = '';
      }
      if (assertiveRef.current) {
        assertiveRef.current.textContent = '';
      }
    }, 5000);

    return () => clearTimeout(cleanup);
  }, [announcements]);

  return (
    <>
      {/* Polite announcements - не прерывают текущую речь */}
      <div
        ref={politeRef}
        aria-live="polite"
        aria-atomic="false"
        className="sr-only"
        role="status"
      >
        {politeAnnouncements.map(announcement => (
          <div key={announcement.id}>
            {announcement.message}
          </div>
        ))}
      </div>

      {/* Assertive announcements - прерывают текущую речь */}
      <div
        ref={assertiveRef}
        aria-live="assertive"
        aria-atomic="false"
        className="sr-only"
        role="alert"
      >
        {assertiveAnnouncements.map(announcement => (
          <div key={announcement.id}>
            {announcement.message}
          </div>
        ))}
      </div>
    </>
  );
};

export default ScreenReaderAnnouncements;