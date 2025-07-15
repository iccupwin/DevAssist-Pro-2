"use client";

import React, { useState } from "react";
import { Eye, EyeOff, Mail, Lock } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { LoginFormData } from '../../types/auth';
import { DEV_TEST_USERS, DEV_CONFIG } from '../../config/development';
const logoLight = '/devent-logo.png';
const logoDark = '/devent-logo-white1.png';

interface LightLoginFormProps {
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

export const LightLoginForm: React.FC<LightLoginFormProps> = ({
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
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: '',
    remember: false
  });
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

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 transition-colors duration-300 ${
      isDarkMode 
        ? 'bg-gradient-to-br from-gray-900 to-gray-800' 
        : 'bg-gradient-to-br from-gray-50 to-gray-100'
    }`}>
      <div className={`w-full max-w-md rounded-2xl shadow-xl overflow-hidden border relative transition-colors duration-300 ${
        isDarkMode 
          ? 'bg-gray-800 border-gray-700' 
          : 'bg-white border-gray-100'
      }`}>
        {/* Decorative gradient background */}
        <div className={`absolute top-0 left-0 right-0 h-48 bg-gradient-to-b opacity-40 blur-3xl -mt-20 ${
          isDarkMode 
            ? 'from-blue-900 via-blue-800 to-transparent' 
            : 'from-blue-100 via-blue-50 to-transparent'
        }`}></div>
        
        <div className="p-8">
          {/* Logo and Welcome Header */}
          <div className="flex flex-col items-center mb-8">
            <div className={`p-4 rounded-2xl shadow-lg mb-6 transition-colors duration-300 ${
              isDarkMode ? 'bg-gray-700' : 'bg-white'
            }`}>
              <img 
                src={isDarkMode ? logoDark : logoLight} 
                alt="DevAssist Pro" 
                className="w-12 h-12" 
              />
            </div>
            <div>
              <h2 className={`text-2xl font-bold text-center transition-colors duration-300 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                Добро пожаловать!
              </h2>
              <p className={`text-center mt-2 transition-colors duration-300 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>
                Войдите в свой аккаунт DevAssist Pro
              </p>
            </div>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Input */}
            <div className="space-y-2">
              <label className={`text-sm font-medium transition-colors duration-300 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Email или телефон
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className={`
                    h-12 rounded-lg w-full pl-10 pr-3 py-2 text-sm transition-colors
                    focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                    ${errors.email 
                      ? 'border-red-300 bg-red-50' 
                      : isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                        : 'bg-gray-50 border-gray-200 text-gray-900'
                    }
                  `}
                  placeholder="Введите email или телефон"
                  disabled={externalLoading ?? isLoading}
                />
              </div>
              {errors.email && (
                <p className="text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            {/* Password Input */}
            <div className="space-y-2">
              <label className={`text-sm font-medium transition-colors duration-300 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Пароль
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  className={`
                    h-12 rounded-lg w-full pl-10 pr-12 py-2 text-sm transition-colors
                    focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                    ${errors.password 
                      ? 'border-red-300 bg-red-50' 
                      : isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                        : 'bg-gray-50 border-gray-200 text-gray-900'
                    }
                  `}
                  placeholder="Введите пароль"
                  disabled={externalLoading ?? isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
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

            {/* Remember Me and Forgot Password */}
            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.remember}
                  onChange={(e) => handleInputChange('remember', e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  disabled={externalLoading ?? isLoading}
                />
                <span className={`ml-2 text-sm transition-colors duration-300 ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>Запомнить меня</span>
              </label>
              
              {onForgotPassword && (
                <button
                  type="button"
                  onClick={onForgotPassword}
                  className="text-sm text-blue-600 hover:text-blue-700 transition-colors"
                  disabled={externalLoading ?? isLoading}
                >
                  Забыли пароль?
                </button>
              )}
            </div>

            {/* Error Message */}
            {(externalError || error) && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">{externalError || error}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={externalLoading ?? isLoading}
              className="w-full h-12 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center font-medium"
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

          {/* Social Login Divider */}
          <div className="mt-6 mb-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-white px-4 text-gray-500">Или продолжить с</span>
              </div>
            </div>
          </div>

          {/* Social Login Buttons */}
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              className="h-12 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center"
              disabled={externalLoading ?? isLoading}
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span className="text-sm font-medium text-gray-700">Google</span>
            </button>
            <button
              type="button"
              className="h-12 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center"
              disabled={externalLoading ?? isLoading}
            >
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
              </svg>
              <span className="text-sm font-medium text-gray-700">Twitter</span>
            </button>
          </div>

          {/* Sign Up Link */}
          {onSignUp && (
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Нет аккаунта?{' '}
                <button
                  onClick={onSignUp}
                  className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
                  disabled={isLoading}
                >
                  Зарегистрироваться
                </button>
              </p>
            </div>
          )}

          {/* Demo Accounts */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              {DEV_CONFIG.SHOW_DEV_CREDENTIALS && (
                <>
                  <p className="text-sm font-medium text-blue-800 mb-2">Test аккаунты (только для разработки):</p>
                  <div className="text-xs text-blue-700 space-y-1">
                    {DEV_TEST_USERS.map((user, index) => (
                      <div key={index}>
                        {user.role === 'admin' ? 'Админ' : 'Пользователь'}: {user.email} / {user.password}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LightLoginForm;