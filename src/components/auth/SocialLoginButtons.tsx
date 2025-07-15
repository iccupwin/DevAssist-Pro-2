import React from 'react';
import { Chrome, Grid3X3, Circle } from 'lucide-react';
import { Button } from '../ui/Button';
import { SOCIAL_PROVIDERS } from '../../config/auth';

interface SocialLoginButtonsProps {
  isRegister?: boolean;
  onSocialLogin?: (provider: string) => void;
  isDarkMode?: boolean;
}

const iconMap = {
  Chrome,
  Grid3X3,
  Circle
};

export const SocialLoginButtons: React.FC<SocialLoginButtonsProps> = ({
  isRegister = false,
  onSocialLogin,
  isDarkMode = true
}) => {
  const handleSocialLogin = (providerName: string) => {
    if (onSocialLogin) {
      onSocialLogin(providerName);
    } else {
      // Default behavior - redirect to backend OAuth endpoint
      window.location.href = `/api/auth/oauth/${providerName}`;
    }
  };

  return (
    <div className="space-y-3">
      <p className={`text-sm text-center mb-4 transition-colors duration-300 ${
        isDarkMode ? 'text-gray-400' : 'text-gray-600'
      }`}>
        {isRegister ? 'Зарегистрироваться с помощью' : 'Войти с помощью'}
      </p>
      
      <div className="grid grid-cols-1 gap-3">
        {SOCIAL_PROVIDERS.map((provider) => {
          const IconComponent = iconMap[provider.icon as keyof typeof iconMap];
          
          return (
            <Button
              key={provider.name}
              variant="social"
              onClick={() => handleSocialLogin(provider.name)}
              icon={IconComponent}
              fullWidth
              className="justify-center"
              isDarkMode={isDarkMode}
            >
              <span className="flex-1 text-center">
                {provider.displayName}
              </span>
            </Button>
          );
        })}
      </div>
    </div>
  );
};