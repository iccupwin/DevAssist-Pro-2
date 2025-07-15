import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, Loader } from 'lucide-react';

/**
 * Компонент для обработки callback'ов от социальных провайдеров
 * Этот компонент должен быть размещен на роутах:
 * - /auth/callback/google
 * - /auth/callback/yandex  
 * - /auth/callback/vk
 */
const SocialAuthCallback: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Обработка авторизации...');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const urlParams = new URLSearchParams(location.search);
        const code = urlParams.get('code');
        const state = urlParams.get('state');
        const error = urlParams.get('error');
        const errorDescription = urlParams.get('error_description');

        // Определяем провайдера из URL
        const provider = location.pathname.split('/').pop();
        
        if (!provider || !['google', 'yandex', 'vk'].includes(provider)) {
          throw new Error('Неизвестный провайдер авторизации');
        }

        // Проверяем наличие ошибки от провайдера
        if (error) {
          throw new Error(errorDescription || `Ошибка ${provider}: ${error}`);
        }

        // Проверяем наличие кода авторизации
        if (!code) {
          throw new Error('Код авторизации не получен');
        }

        // Проверяем state для защиты от CSRF
        const savedState = sessionStorage.getItem(`oauth_state_${provider}`);
        if (!savedState || savedState !== state) {
          throw new Error('Недействительный state параметр');
        }

        // Очищаем сохраненный state
        sessionStorage.removeItem(`oauth_state_${provider}`);

        setMessage(`Завершение авторизации через ${getProviderName(provider)}...`);

        // Отправляем сообщение родительскому окну (popup mode)
        if (window.opener) {
          window.opener.postMessage({
            type: 'SOCIAL_AUTH_SUCCESS',
            payload: {
              provider,
              code,
              state
            }
          }, window.location.origin);
          
          window.close();
          return;
        }

        // Если не popup mode, обрабатываем здесь
        // TODO: Отправить код на backend для обмена на токены
        const result = await exchangeCodeForTokens(provider, code);
        
        if (result.success) {
          setStatus('success');
          setMessage('Авторизация успешно завершена!');
          
          // Перенаправляем на главную страницу через 2 секунды
          setTimeout(() => {
            navigate('/dashboard', { replace: true });
          }, 2000);
        } else {
          throw new Error((result as any).error || 'Ошибка обмена кода на токены');
        }

      } catch (error) {
        console.error('Social auth callback error:', error);
        
        setStatus('error');
        setMessage(error instanceof Error ? error.message : 'Произошла неизвестная ошибка');

        // Отправляем ошибку родительскому окну (popup mode)
        if (window.opener) {
          window.opener.postMessage({
            type: 'SOCIAL_AUTH_ERROR',
            error: error instanceof Error ? error.message : 'Ошибка авторизации'
          }, window.location.origin);
          
          setTimeout(() => window.close(), 3000);
          return;
        }

        // Если не popup mode, перенаправляем на страницу входа через 3 секунды
        setTimeout(() => {
          navigate('/auth/login', { 
            replace: true,
            state: { 
              error: 'Ошибка социальной авторизации. Попробуйте снова.' 
            }
          });
        }, 3000);
      }
    };

    handleCallback();
  }, [location, navigate]);

  const getProviderName = (provider: string): string => {
    switch (provider) {
      case 'google': return 'Google';
      case 'yandex': return 'Яндекс';
      case 'vk': return 'ВКонтакте';
      default: return provider;
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'loading':
        return <Loader className="w-8 h-8 text-blue-600 animate-spin" />;
      case 'success':
        return <CheckCircle className="w-8 h-8 text-green-600" />;
      case 'error':
        return <XCircle className="w-8 h-8 text-red-600" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'loading': return 'text-blue-600';
      case 'success': return 'text-green-600';
      case 'error': return 'text-red-600';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-white/20 p-8 max-w-md w-full mx-4 text-center">
        {/* Иконка статуса */}
        <div className="flex justify-center mb-4">
          {getStatusIcon()}
        </div>

        {/* Заголовок */}
        <h2 className={`text-xl font-semibold mb-2 ${getStatusColor()}`}>
          {status === 'loading' && 'Авторизация...'}
          {status === 'success' && 'Успешно!'}
          {status === 'error' && 'Ошибка'}
        </h2>

        {/* Сообщение */}
        <p className="text-gray-600 mb-6">
          {message}
        </p>

        {/* Дополнительная информация */}
        {status === 'loading' && (
          <div className="text-sm text-gray-500">
            Пожалуйста, не закрывайте это окно...
          </div>
        )}

        {status === 'success' && (
          <div className="text-sm text-gray-500">
            Перенаправление на главную страницу...
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-3">
            <div className="text-sm text-gray-500">
              {window.opener ? 
                'Это окно автоматически закроется через несколько секунд' :
                'Перенаправление на страницу входа...'
              }
            </div>
            
            {!window.opener && (
              <button
                onClick={() => navigate('/auth/login', { replace: true })}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Вернуться к входу
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Mock функция для обмена кода на токены
 * TODO: Заменить на реальный API вызов
 */
const exchangeCodeForTokens = async (provider: string, code: string) => {
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // Имитация успешного обмена
  return {
    success: true,
    data: {
      accessToken: `mock_access_token_${Date.now()}`,
      refreshToken: `mock_refresh_token_${Date.now()}`,
      user: {
        id: `${provider}_user_${Date.now()}`,
        email: `user@${provider}.example`,
        name: 'Социальный Пользователь'
      }
    }
  };
};

export default SocialAuthCallback;