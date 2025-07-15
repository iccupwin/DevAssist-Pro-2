"use client";

import React, { useState } from "react";
import { Eye, EyeOff, Mail, Lock, User, Building } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { RegisterFormData } from '../../types/auth';
const logoLight = '/devent-logo.png';
const logoDark = '/devent-logo-white1.png';

interface LightRegisterFormProps {
  onSubmit?: (data: RegisterFormData) => Promise<void>;
  onSuccess?: () => void;
  onSwitchToLogin?: () => void;
  onSignIn?: () => void;
  isLoading?: boolean;
  error?: string;
  isDarkMode?: boolean;
  className?: string;
}

export const LightRegisterForm: React.FC<LightRegisterFormProps> = ({
  onSubmit,
  onSuccess,
  onSwitchToLogin,
  onSignIn,
  isLoading: externalLoading,
  error: externalError,
  isDarkMode,
  className = ''
}) => {
  const { register, isLoading, error } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState<RegisterFormData>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    organization: '',
    acceptTerms: false
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

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'Имя обязательно';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Фамилия обязательна';
    }

    if (!formData.email) {
      newErrors.email = 'Email обязателен';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Введите корректный email';
    }

    if (!formData.password) {
      newErrors.password = 'Пароль обязателен';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Пароль должен содержать минимум 8 символов';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Подтвердите пароль';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Пароли не совпадают';
    }

    if (!formData.acceptTerms) {
      newErrors.acceptTerms = 'Необходимо принять условия использования';
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
        const result = await register(formData);
        if (result.success) {
          onSuccess?.();
        }
      }
    } catch (error) {
      console.error('Register error:', error);
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
                Создать аккаунт
              </h2>
              <p className={`text-center mt-2 transition-colors duration-300 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>
                Зарегистрируйтесь для доступа к DevAssist Pro
              </p>
            </div>
          </div>

          {/* Register Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className={`text-sm font-medium transition-colors duration-300 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Имя
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    className={`
                      h-12 rounded-lg w-full pl-10 pr-3 py-2 text-sm transition-colors
                      focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                      ${errors.firstName 
                        ? 'border-red-300 bg-red-50' 
                        : isDarkMode 
                          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                          : 'bg-gray-50 border-gray-200 text-gray-900'
                      }
                    `}
                    placeholder="Иван"
                    disabled={externalLoading ?? isLoading}
                  />
                </div>
                {errors.firstName && (
                  <p className="text-sm text-red-600">{errors.firstName}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className={`text-sm font-medium transition-colors duration-300 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Фамилия
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    className={`
                      h-12 rounded-lg w-full pl-10 pr-3 py-2 text-sm transition-colors
                      focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                      ${errors.lastName 
                        ? 'border-red-300 bg-red-50' 
                        : isDarkMode 
                          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                          : 'bg-gray-50 border-gray-200 text-gray-900'
                      }
                    `}
                    placeholder="Иванов"
                    disabled={externalLoading ?? isLoading}
                  />
                </div>
                {errors.lastName && (
                  <p className="text-sm text-red-600">{errors.lastName}</p>
                )}
              </div>
            </div>

            {/* Email Input */}
            <div className="space-y-2">
              <label className={`text-sm font-medium transition-colors duration-300 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Email
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
                  placeholder="your@email.com"
                  disabled={externalLoading ?? isLoading}
                />
              </div>
              {errors.email && (
                <p className="text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            {/* Organization Input */}
            <div className="space-y-2">
              <label className={`text-sm font-medium transition-colors duration-300 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Организация (необязательно)
              </label>
              <div className="relative">
                <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={formData.organization}
                  onChange={(e) => handleInputChange('organization', e.target.value)}
                  className={`
                    h-12 rounded-lg w-full pl-10 pr-3 py-2 text-sm transition-colors
                    focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                    ${isDarkMode 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                      : 'bg-gray-50 border-gray-200 text-gray-900'
                    }
                  `}
                  placeholder="ООО Название компании"
                  disabled={externalLoading ?? isLoading}
                />
              </div>
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
                  placeholder="Создайте надежный пароль"
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

            {/* Confirm Password Input */}
            <div className="space-y-2">
              <label className={`text-sm font-medium transition-colors duration-300 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Подтвердите пароль
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  className={`
                    h-12 rounded-lg w-full pl-10 pr-12 py-2 text-sm transition-colors
                    focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                    ${errors.confirmPassword 
                      ? 'border-red-300 bg-red-50' 
                      : isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                        : 'bg-gray-50 border-gray-200 text-gray-900'
                    }
                  `}
                  placeholder="Повторите пароль"
                  disabled={externalLoading ?? isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-sm text-red-600">{errors.confirmPassword}</p>
              )}
            </div>

            {/* Terms Checkbox */}
            <div className="space-y-2">
              <label className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  checked={formData.acceptTerms}
                  onChange={(e) => handleInputChange('acceptTerms', e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mt-1"
                  disabled={externalLoading ?? isLoading}
                />
                <span className={`text-sm transition-colors duration-300 ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  Я принимаю{' '}
                  <a href="/terms" className="text-blue-600 hover:text-blue-700 transition-colors">
                    условия использования
                  </a>{' '}
                  и{' '}
                  <a href="/privacy" className="text-blue-600 hover:text-blue-700 transition-colors">
                    политику конфиденциальности
                  </a>
                </span>
              </label>
              {errors.acceptTerms && (
                <p className="text-sm text-red-600">{errors.acceptTerms}</p>
              )}
            </div>

            {/* Error Message */}
            {(externalError || error) && (
              <div className={`p-3 border rounded-lg transition-colors duration-300 ${
                isDarkMode 
                  ? 'bg-red-900/20 border-red-800' 
                  : 'bg-red-50 border-red-200'
              }`}>
                <p className={`text-sm transition-colors duration-300 ${
                  isDarkMode ? 'text-red-400' : 'text-red-700'
                }`}>{externalError || error}</p>
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
                  Создание аккаунта...
                </>
              ) : (
                'Создать аккаунт'
              )}
            </button>
          </form>

          {/* Social Login Divider */}
          <div className="mt-6 mb-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className={`w-full border-t transition-colors duration-300 ${
                  isDarkMode ? 'border-gray-600' : 'border-gray-200'
                }`}></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className={`px-4 transition-colors duration-300 ${
                  isDarkMode 
                    ? 'bg-gray-800 text-gray-400' 
                    : 'bg-white text-gray-500'
                }`}>Или зарегистрируйтесь с</span>
              </div>
            </div>
          </div>

          {/* Social Login Buttons */}
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              className={`h-12 border rounded-lg transition-colors flex items-center justify-center ${
                isDarkMode 
                  ? 'bg-gray-700 border-gray-600 hover:bg-gray-600' 
                  : 'bg-white border-gray-200 hover:bg-gray-50'
              }`}
              disabled={externalLoading ?? isLoading}
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span className={`text-sm font-medium transition-colors duration-300 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>Google</span>
            </button>
            <button
              type="button"
              className={`h-12 border rounded-lg transition-colors flex items-center justify-center ${
                isDarkMode 
                  ? 'bg-gray-700 border-gray-600 hover:bg-gray-600' 
                  : 'bg-white border-gray-200 hover:bg-gray-50'
              }`}
              disabled={externalLoading ?? isLoading}
            >
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
              </svg>
              <span className={`text-sm font-medium transition-colors duration-300 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>Twitter</span>
            </button>
          </div>

          {/* Sign In Link */}
          {onSignIn && (
            <div className="mt-6 text-center">
              <p className={`text-sm transition-colors duration-300 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Уже есть аккаунт?{' '}
                <button
                  onClick={onSignIn}
                  className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
                  disabled={isLoading}
                >
                  Войти
                </button>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LightRegisterForm;