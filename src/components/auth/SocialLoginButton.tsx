import React from 'react';
import { Chrome, Circle, Grid3x3 } from 'lucide-react';

interface SocialLoginButtonProps {
  provider: 'google' | 'yandex' | 'vk';
  onClick: (provider: string) => void;
  isLoading?: boolean;
  disabled?: boolean;
  className?: string;
}

/**
 * Компонент кнопки для социальной авторизации
 */
const SocialLoginButton: React.FC<SocialLoginButtonProps> = ({
  provider,
  onClick,
  isLoading = false,
  disabled = false,
  className = ''
}) => {
  const providerConfig = {
    google: {
      name: 'Google',
      icon: Chrome,
      bgColor: 'bg-white hover:bg-gray-50',
      textColor: 'text-gray-700',
      borderColor: 'border-gray-300',
      iconColor: 'text-red-500'
    },
    yandex: {
      name: 'Яндекс',
      icon: Grid3x3,
      bgColor: 'bg-red-500 hover:bg-red-600',
      textColor: 'text-white',
      borderColor: 'border-red-500',
      iconColor: 'text-white'
    },
    vk: {
      name: 'ВКонтакте',
      icon: Circle,
      bgColor: 'bg-blue-600 hover:bg-blue-700',
      textColor: 'text-white',
      borderColor: 'border-blue-600',
      iconColor: 'text-white'
    }
  };

  const config = providerConfig[provider];
  const IconComponent = config.icon;

  const handleClick = () => {
    if (!disabled && !isLoading) {
      onClick(provider);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={disabled || isLoading}
      className={`
        w-full flex items-center justify-center px-4 py-3 rounded-xl
        border transition-all duration-200
        ${config.bgColor} ${config.textColor} ${config.borderColor}
        ${disabled || isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${className}
      `}
      aria-label={`Войти через ${config.name}`}
    >
      {isLoading ? (
        <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin mr-3" />
      ) : (
        <IconComponent className={`w-5 h-5 mr-3 ${config.iconColor}`} />
      )}
      
      <span className="font-medium">
        {isLoading ? 'Подключение...' : `Войти через ${config.name}`}
      </span>
    </button>
  );
};

export default SocialLoginButton;