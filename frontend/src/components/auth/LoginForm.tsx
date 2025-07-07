import React, { useState } from 'react';
import { Eye, EyeOff, Mail, Lock } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useSocialAuth } from '../../hooks/useSocialAuth';
import SocialLoginPanel from './SocialLoginPanel';
import { LoginFormData } from '../../types/auth';

interface LoginFormProps {
  onSubmit?: (data: LoginFormData) => Promise<void>;
  onSuccess?: () => void;
  onForgotPassword?: () => void;
  onSwitchToRegister?: () => void;
  onSignUp?: () => void;
  isLoading?: boolean;
  error?: string;
  isDarkMode?: boolean;
  className?: string;
}

const LoginForm: React.FC<LoginFormProps> = ({
  onSubmit,
  onSuccess,
  onForgotPassword,
  onSwitchToRegister,
  onSignUp,
  isLoading: externalLoading,
  error: externalError,
  isDarkMode,
  className = ''
}) => {
  const { login, isLoading, error } = useAuth();
  const { loginWithSocial } = useSocialAuth({
    onSuccess: (provider, user) => {
      console.log(`Успешный вход через ${provider}:`, user);
      onSuccess?.();
    }
  });

  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: '',
    remember: false
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.email) {
      newErrors.email = 'Email обязателен';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Введите корректный email';
    }

    if (!formData.password) {
      newErrors.password = 'Пароль обязателен';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Пароль должен содержать минимум 6 символов';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      // Если передан внешний onSubmit, используем его, иначе используем встроенный login
      if (onSubmit) {
        await onSubmit(formData);
      } else {
        const result = await login(formData);
        if (result.success) {
          onSuccess?.();
        }
      }
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  const handleSocialLogin = async (provider: string) => {
    try {
      await loginWithSocial(provider);
    } catch (error) {
      console.error('Social login error:', error);
    }
  };

  return (
    <div className={`w-full max-w-md ${className}`}>
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Добро пожаловать!
        </h2>
        <p className="text-gray-600">
          Войдите в свой аккаунт DevAssist Pro
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Email адрес
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              className={`
                w-full pl-10 pr-4 py-3 border rounded-xl
                focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                ${errors.email ? 'border-red-300' : 'border-gray-300'}
              `}
              placeholder="your@email.com"
              disabled={externalLoading ?? isLoading}
            />
          </div>
          {errors.email && (
            <p className="text-sm text-red-600">{errors.email}</p>
          )}
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Пароль
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              className={`
                w-full pl-10 pr-12 py-3 border rounded-xl
                focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                ${errors.password ? 'border-red-300' : 'border-gray-300'}
              `}
              placeholder="Введите пароль"
              disabled={externalLoading ?? isLoading}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          </div>
          {errors.password && (
            <p className="text-sm text-red-600">{errors.password}</p>
          )}
        </div>

        <div className="flex items-center justify-between">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={formData.remember}
              onChange={(e) => handleInputChange('remember', e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              disabled={externalLoading ?? isLoading}
            />
            <span className="ml-2 text-sm text-gray-600">Запомнить меня</span>
          </label>
          
          {onForgotPassword && (
            <button
              type="button"
              onClick={onForgotPassword}
              className="text-sm text-blue-600 hover:text-blue-700"
              disabled={externalLoading ?? isLoading}
            >
              Забыли пароль?
            </button>
          )}
        </div>

        {(externalError || error) && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-sm text-red-700">{externalError || error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={externalLoading ?? isLoading}
          className="w-full py-3 px-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
        >
          {(externalLoading ?? isLoading) ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              Вход...
            </>
          ) : (
            'Войти'
          )}
        </button>
      </form>

      <SocialLoginPanel
        onSocialLogin={handleSocialLogin}
        disabled={isLoading}
      />

      {onSignUp && (
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Нет аккаунта?{' '}
            <button
              onClick={onSignUp}
              className="text-blue-600 hover:text-blue-700 font-medium"
              disabled={isLoading}
            >
              Зарегистрироваться
            </button>
          </p>
        </div>
      )}

      {process.env.NODE_ENV === 'development' && (
        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
          <p className="text-sm font-medium text-yellow-800 mb-2">Демо-аккаунты:</p>
          <div className="text-xs text-yellow-700 space-y-1">
            <div>Админ: admin@devassist.ru / Admin123!</div>
            <div>Пользователь: user@devassist.ru / User123!</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoginForm;