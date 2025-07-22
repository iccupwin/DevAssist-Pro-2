import React from 'react';
import { Clock, RefreshCw, LogOut } from 'lucide-react';
import { useSessionTimeout } from '../../hooks/useSessionTimeout';

interface SessionTimeoutModalProps {
  onExtend?: () => void;
  onLogout?: () => void;
  className?: string;
}

/**
 * Компонент модального окна для предупреждения об истечении сессии
 */
const SessionTimeoutModal: React.FC<SessionTimeoutModalProps> = ({
  onExtend,
  onLogout,
  className = ''
}) => {
  const {
    showWarning,
    timeLeftFormatted,
    minutesLeft,
    extendSession,
    dismissWarning
  } = useSessionTimeout({
    warningTime: 5 * 60 * 1000, // 5 минут
    autoExtend: false
  });

  const handleExtend = async () => {
    try {
      await extendSession();
      onExtend?.();
    } catch (error) {
      console.error('Ошибка продления сессии:', error);
    }
  };

  const handleLogout = () => {
    dismissWarning();
    onLogout?.();
  };

  if (!showWarning) {
    return null;
  }

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center ${className}`}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      
      {/* Modal */}
      <div className="relative bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
        <div className="text-center">
          {/* Icon */}
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock className="w-8 h-8 text-orange-600" />
          </div>
          
          {/* Title */}
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Сессия истекает
          </h3>
          
          {/* Message */}
          <p className="text-gray-600 mb-6">
            Ваша сессия истечет через{' '}
            <span className="font-mono font-semibold text-orange-600">
              {timeLeftFormatted}
            </span>
            {minutesLeft && minutesLeft > 0 && (
              <span className="text-sm text-gray-500">
                {' '}({minutesLeft} мин.)
              </span>
            )}
          </p>
          
          {/* Warning */}
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-6">
            <p className="text-sm text-orange-800">
              Чтобы не потерять несохраненные данные, продлите сессию или сохраните работу
            </p>
          </div>
          
          {/* Actions */}
          <div className="flex space-x-3">
            <button
              onClick={handleExtend}
              className="flex-1 flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Продлить сессию
            </button>
            
            <button
              onClick={handleLogout}
              className="flex-1 flex items-center justify-center px-4 py-3 bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition-colors"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Выйти
            </button>
          </div>
          
          {/* Skip warning */}
          <button
            onClick={dismissWarning}
            className="mt-3 text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            Скрыть предупреждение
          </button>
        </div>
      </div>
    </div>
  );
};

export default SessionTimeoutModal;