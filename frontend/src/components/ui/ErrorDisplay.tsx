import React from 'react';
import { AlertTriangle, XCircle, RefreshCw, Home } from 'lucide-react';
import { TouchButton } from './TouchButton';

interface ErrorDisplayProps {
  title?: string;
  message: string;
  type?: 'error' | 'warning' | 'info';
  showRetry?: boolean;
  onRetry?: () => void;
  showHome?: boolean;
  onHome?: () => void;
  className?: string;
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  title,
  message,
  type = 'error',
  showRetry = false,
  onRetry,
  showHome = false,
  onHome,
  className = ''
}) => {
  const getIcon = () => {
    switch (type) {
      case 'error':
        return <XCircle className="w-8 h-8 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-8 h-8 text-orange-500" />;
      case 'info':
        return <AlertTriangle className="w-8 h-8 text-blue-500" />;
      default:
        return <XCircle className="w-8 h-8 text-red-500" />;
    }
  };
  
  const getColors = () => {
    switch (type) {
      case 'error':
        return {
          bg: 'bg-red-50',
          border: 'border-red-200',
          title: 'text-red-800',
          message: 'text-red-600'
        };
      case 'warning':
        return {
          bg: 'bg-orange-50',
          border: 'border-orange-200',
          title: 'text-orange-800',
          message: 'text-orange-600'
        };
      case 'info':
        return {
          bg: 'bg-blue-50',
          border: 'border-blue-200',
          title: 'text-blue-800',
          message: 'text-blue-600'
        };
      default:
        return {
          bg: 'bg-red-50',
          border: 'border-red-200',
          title: 'text-red-800',
          message: 'text-red-600'
        };
    }
  };
  
  const colors = getColors();
  const defaultTitle = type === 'error' ? 'Ошибка' : type === 'warning' ? 'Предупреждение' : 'Информация';
  
  return (
    <div className={`rounded-xl border p-6 ${colors.bg} ${colors.border} ${className}`}>
      <div className="flex items-start space-x-4">
        <div className="flex-shrink-0">
          {getIcon()}
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className={`text-lg font-semibold ${colors.title} mb-2`}>
            {title || defaultTitle}
          </h3>
          
          <p className={`text-sm ${colors.message} leading-relaxed`}>
            {message}
          </p>
          
          {(showRetry || showHome) && (
            <div className="flex flex-wrap gap-3 mt-6">
              {showRetry && onRetry && (
                <TouchButton
                  onClick={onRetry}
                  variant="primary"
                  size="sm"
                  icon={RefreshCw}
                >
                  Попробовать снова
                </TouchButton>
              )}
              
              {showHome && onHome && (
                <TouchButton
                  onClick={onHome}
                  variant="outline"
                  size="sm"
                  icon={Home}
                >
                  На главную
                </TouchButton>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Компонент для компактного отображения ошибок
export const CompactError: React.FC<{
  message: string;
  type?: 'error' | 'warning' | 'info';
  className?: string;
}> = ({ message, type = 'error', className = '' }) => {
  const getColors = () => {
    switch (type) {
      case 'error':
        return 'bg-red-50 border-red-200 text-red-700';
      case 'warning':
        return 'bg-orange-50 border-orange-200 text-orange-700';
      case 'info':
        return 'bg-blue-50 border-blue-200 text-blue-700';
      default:
        return 'bg-red-50 border-red-200 text-red-700';
    }
  };
  
  const getIcon = () => {
    switch (type) {
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-orange-500" />;
      case 'info':
        return <AlertTriangle className="w-4 h-4 text-blue-500" />;
      default:
        return <XCircle className="w-4 h-4 text-red-500" />;
    }
  };
  
  return (
    <div className={`flex items-center space-x-2 p-3 rounded-lg border ${getColors()} ${className}`}>
      {getIcon()}
      <span className="text-sm font-medium flex-1">{message}</span>
    </div>
  );
};

export default ErrorDisplay;