import React from 'react';
import { Loader2, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface LoadingStateProps {
  state: 'loading' | 'success' | 'error' | 'warning';
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  state,
  message,
  size = 'md',
  showIcon = true,
  className = ''
}) => {
  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  };
  
  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };
  
  const getIcon = () => {
    switch (state) {
      case 'loading':
        return <Loader2 className={`${iconSizes[size]} animate-spin text-blue-500`} />;
      case 'success':
        return <CheckCircle className={`${iconSizes[size]} text-green-500`} />;
      case 'error':
        return <XCircle className={`${iconSizes[size]} text-red-500`} />;
      case 'warning':
        return <AlertCircle className={`${iconSizes[size]} text-orange-500`} />;
      default:
        return null;
    }
  };
  
  const getTextColor = () => {
    switch (state) {
      case 'loading':
        return 'text-blue-600';
      case 'success':
        return 'text-green-600';
      case 'error':
        return 'text-red-600';
      case 'warning':
        return 'text-orange-600';
      default:
        return 'text-gray-600';
    }
  };
  
  const getDefaultMessage = () => {
    switch (state) {
      case 'loading':
        return 'Загрузка...';
      case 'success':
        return 'Успешно!';
      case 'error':
        return 'Ошибка';
      case 'warning':
        return 'Предупреждение';
      default:
        return '';
    }
  };
  
  return (
    <div className={`inline-flex items-center space-x-2 ${className}`}>
      {showIcon && getIcon()}
      <span className={`${sizeClasses[size]} font-medium ${getTextColor()}`}>
        {message || getDefaultMessage()}
      </span>
    </div>
  );
};

// Компонент для полноэкранного загрузочного состояния
export const FullScreenLoading: React.FC<{ message?: string }> = ({ message = 'Загрузка...' }) => {
  return (
    <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-lg p-8 max-w-sm w-full mx-4">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          <p className="text-gray-700 text-center font-medium">{message}</p>
        </div>
      </div>
    </div>
  );
};

export default LoadingState;