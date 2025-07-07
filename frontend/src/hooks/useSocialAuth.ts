import { useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface SocialAuthConfig {
  google: {
    clientId: string;
    redirectUri: string;
    scope: string;
  };
  yandex: {
    clientId: string;
    redirectUri: string;
    scope?: string;
  };
  vk: {
    clientId: string;
    redirectUri: string;
    scope: string;
  };
}

interface UseSocialAuthOptions {
  onSuccess?: (provider: string, user: any) => void;
  onError?: (provider: string, error: string) => void;
}

/**
 * Хук для работы с социальной авторизацией
 */
export const useSocialAuth = (options: UseSocialAuthOptions = {}) => {
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Конфигурация OAuth провайдеров
  const socialAuthConfig: SocialAuthConfig = {
    google: {
      clientId: process.env.REACT_APP_GOOGLE_CLIENT_ID || '',
      redirectUri: `${window.location.origin}/auth/callback/google`,
      scope: 'email profile'
    },
    yandex: {
      clientId: process.env.REACT_APP_YANDEX_CLIENT_ID || '',
      redirectUri: `${window.location.origin}/auth/callback/yandex`
    },
    vk: {
      clientId: process.env.REACT_APP_VK_CLIENT_ID || '',
      redirectUri: `${window.location.origin}/auth/callback/vk`,
      scope: 'email'
    }
  };

  /**
   * Построение URL для OAuth авторизации
   */
  const buildAuthUrl = (provider: keyof SocialAuthConfig): string => {
    const config = socialAuthConfig[provider];
    const state = generateRandomState();
    
    // Сохраняем state в sessionStorage для проверки безопасности
    sessionStorage.setItem(`oauth_state_${provider}`, state);

    switch (provider) {
      case 'google':
        return `https://accounts.google.com/o/oauth2/v2/auth?` +
          `client_id=${config.clientId}&` +
          `redirect_uri=${encodeURIComponent(config.redirectUri)}&` +
          `response_type=code&` +
          `scope=${encodeURIComponent(config.scope || '')}&` +
          `state=${state}`;

      case 'yandex':
        return `https://oauth.yandex.ru/authorize?` +
          `client_id=${config.clientId}&` +
          `redirect_uri=${encodeURIComponent(config.redirectUri)}&` +
          `response_type=code&` +
          `state=${state}`;

      case 'vk':
        return `https://oauth.vk.com/authorize?` +
          `client_id=${config.clientId}&` +
          `redirect_uri=${encodeURIComponent(config.redirectUri)}&` +
          `response_type=code&` +
          `scope=${(config as any).scope}&` +
          `state=${state}&` +
          `v=5.131`;

      default:
        throw new Error(`Неизвестный провайдер: ${provider}`);
    }
  };

  /**
   * Генерация случайного состояния для OAuth
   */
  const generateRandomState = (): string => {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  };

  /**
   * Открытие popup окна для авторизации
   */
  const openAuthPopup = (url: string, provider: string): Promise<any> => {
    return new Promise((resolve, reject) => {
      const popup = window.open(
        url,
        `${provider}_auth`,
        'width=500,height=600,scrollbars=yes,resizable=yes'
      );

      if (!popup) {
        reject(new Error('Не удалось открыть окно авторизации. Проверьте настройки блокировки всплывающих окон.'));
        return;
      }

      // Отслеживание закрытия popup
      const checkClosed = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkClosed);
          reject(new Error('Авторизация отменена пользователем'));
        }
      }, 1000);

      // Слушатель сообщений от popup
      const messageListener = (event: MessageEvent) => {
        if (event.origin !== window.location.origin) return;

        if (event.data.type === 'SOCIAL_AUTH_SUCCESS') {
          clearInterval(checkClosed);
          popup.close();
          window.removeEventListener('message', messageListener);
          resolve(event.data.payload);
        } else if (event.data.type === 'SOCIAL_AUTH_ERROR') {
          clearInterval(checkClosed);
          popup.close();
          window.removeEventListener('message', messageListener);
          reject(new Error(event.data.error || 'Ошибка авторизации'));
        }
      };

      window.addEventListener('message', messageListener);

      // Таймаут для popup
      setTimeout(() => {
        if (!popup.closed) {
          clearInterval(checkClosed);
          popup.close();
          window.removeEventListener('message', messageListener);
          reject(new Error('Превышено время ожидания авторизации'));
        }
      }, 5 * 60 * 1000); // 5 минут
    });
  };

  /**
   * Инициация социальной авторизации
   */
  const loginWithSocial = useCallback(async (provider: string) => {
    if (!['google', 'yandex', 'vk'].includes(provider)) {
      throw new Error(`Неподдерживаемый провайдер: ${provider}`);
    }

    setIsLoading(true);
    setError(null);

    try {
      const authUrl = buildAuthUrl(provider as keyof SocialAuthConfig);
      const authResult = await openAuthPopup(authUrl, provider);

      // TODO: Заменить на реальный API вызов
      const loginResult = await mockSocialLogin(provider, authResult);

      if (loginResult.success && loginResult.user && loginResult.token && loginResult.refreshToken) {
        // Используем существующий метод login из AuthContext
        // Здесь мы имитируем вход с полученными данными
        options.onSuccess?.(provider, loginResult.user);
        
        return loginResult;
      } else {
        throw new Error((loginResult as any).error || 'Ошибка авторизации');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
      setError(errorMessage);
      options.onError?.(provider, errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [options]);

  /**
   * Проверка конфигурации провайдера
   */
  const isProviderConfigured = (provider: keyof SocialAuthConfig): boolean => {
    const config = socialAuthConfig[provider];
    return !!config.clientId;
  };

  /**
   * Получение списка доступных провайдеров
   */
  const getAvailableProviders = (): string[] => {
    return Object.keys(socialAuthConfig).filter(provider => 
      isProviderConfigured(provider as keyof SocialAuthConfig)
    );
  };

  return {
    loginWithSocial,
    isLoading,
    error,
    isProviderConfigured,
    getAvailableProviders,
    clearError: () => setError(null)
  };
};

/**
 * Mock функция для социальной авторизации
 * TODO: Заменить на реальный API вызов
 */
const mockSocialLogin = async (provider: string, authData: any) => {
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Имитация успешной авторизации
  return {
    success: true,
    user: {
      id: `${provider}_${Date.now()}`,
      email: `user@${provider}.example`,
      firstName: 'Социальный',
      lastName: 'Пользователь',
      role: 'user' as const,
      avatar: '',
      isEmailVerified: true,
      subscription: {
        plan: 'Free',
        status: 'active' as const,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      },
      preferences: {
        language: 'ru',
        theme: 'system' as const,
        notifications: {
          email: true,
          push: false,
        },
      },
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
    },
    token: `mock_social_token_${Date.now()}`,
    refreshToken: `mock_social_refresh_${Date.now()}`,
  };
};