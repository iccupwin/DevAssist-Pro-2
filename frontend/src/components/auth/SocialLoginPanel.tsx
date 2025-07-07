import React, { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import SocialLoginButton from './SocialLoginButton';
import { SOCIAL_PROVIDERS } from '../../config/auth';

interface SocialLoginPanelProps {
  onSocialLogin: (provider: string) => Promise<void>;
  disabled?: boolean;
  className?: string;
  showDivider?: boolean;
  title?: string;
}

/**
 * Панель с кнопками социальной авторизации
 */
const SocialLoginPanel: React.FC<SocialLoginPanelProps> = ({
  onSocialLogin,
  disabled = false,
  className = '',
  showDivider = true,
  title = 'Или войдите через'
}) => {
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSocialLogin = async (provider: string) => {
    setLoadingProvider(provider);
    setError(null);

    try {
      await onSocialLogin(provider);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Ошибка авторизации');
    } finally {
      setLoadingProvider(null);
    }
  };

  // Фильтруем только включенные провайдеры
  const enabledProviders = SOCIAL_PROVIDERS.filter(provider => provider.enabled);

  if (enabledProviders.length === 0) {
    return null;
  }

  return (
    <div className={`w-full ${className}`}>
      {/* Разделитель */}
      {showDivider && (
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-white text-gray-500">{title}</span>
          </div>
        </div>
      )}

      {/* Кнопки социальной авторизации */}
      <div className="space-y-3">
        {enabledProviders.map((provider) => (
          <SocialLoginButton
            key={provider.id}
            provider={provider.id as 'google' | 'yandex' | 'vk'}
            onClick={handleSocialLogin}
            isLoading={loadingProvider === provider.id}
            disabled={disabled || loadingProvider !== null}
          />
        ))}
      </div>

      {/* Отображение ошибки */}
      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start">
          <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 mr-2 flex-shrink-0" />
          <div>
            <h4 className="text-sm font-medium text-red-800">Ошибка авторизации</h4>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Информация о безопасности */}
      <div className="mt-4 text-xs text-gray-500 text-center">
        Мы не получаем доступ к вашему паролю и другим личным данным
      </div>
    </div>
  );
};

export default SocialLoginPanel;