import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { User, Mail, Lock, Eye, EyeOff, Building } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { SocialLoginButtons } from './SocialLoginButtons';
import { RegisterFormData } from '../../types/auth';
import { VALIDATION_RULES } from '../../config/auth';

const registerSchema = z.object({
  firstName: z.string()
    .min(1, VALIDATION_RULES.firstName.required)
    .min(VALIDATION_RULES.firstName.minLength.value, VALIDATION_RULES.firstName.minLength.message),
  lastName: z.string()
    .min(1, VALIDATION_RULES.lastName.required)
    .min(VALIDATION_RULES.lastName.minLength.value, VALIDATION_RULES.lastName.minLength.message),
  email: z.string()
    .min(1, VALIDATION_RULES.email.required)
    .regex(VALIDATION_RULES.email.pattern.value, VALIDATION_RULES.email.pattern.message),
  password: z.string()
    .min(1, VALIDATION_RULES.password.required)
    .min(VALIDATION_RULES.password.minLength.value, VALIDATION_RULES.password.minLength.message)
    .regex(VALIDATION_RULES.password.pattern.value, VALIDATION_RULES.password.pattern.message),
  confirmPassword: z.string().min(1, 'Подтвердите пароль'),
  organization: z.string().optional(),
  acceptTerms: z.boolean().refine(val => val === true, {
    message: 'Необходимо принять условия использования'
  })
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Пароли не совпадают',
  path: ['confirmPassword']
});

interface RegisterFormProps {
  onSubmit: (data: RegisterFormData) => Promise<void>;
  isLoading?: boolean;
  error?: string;
  onSwitchToLogin: () => void;
  isDarkMode?: boolean;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({
  onSubmit,
  isLoading = false,
  error,
  onSwitchToLogin,
  isDarkMode = true
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema)
  });

  const handleFormSubmit = async (data: RegisterFormData) => {
    await onSubmit(data);
  };

  return (
    <div className="w-full max-w-md space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className={`text-3xl font-bold transition-colors duration-300 ${
          isDarkMode ? 'text-white' : 'text-gray-900'
        }`}>
          Создать аккаунт
        </h1>
        <p className={`transition-colors duration-300 ${
          isDarkMode ? 'text-gray-400' : 'text-gray-600'
        }`}>
          Зарегистрируйтесь для доступа к DevAssist Pro
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className={`border rounded-lg p-4 animate-fade-in transition-colors duration-300 ${
          isDarkMode 
            ? 'bg-red-900/20 border-red-800 text-red-400' 
            : 'bg-red-50 border-red-200 text-red-600'
        }`}>
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Social Login */}
      <SocialLoginButtons isRegister isDarkMode={isDarkMode} />

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className={`w-full border-t transition-colors duration-300 ${
            isDarkMode ? 'border-gray-700' : 'border-gray-200'
          }`} />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className={`px-4 transition-colors duration-300 ${
            isDarkMode 
              ? 'bg-gray-900 text-gray-400' 
              : 'bg-white text-gray-600'
          }`}>
            или зарегистрируйтесь с email
          </span>
        </div>
      </div>

      {/* Register Form */}
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Input
            {...register('firstName')}
            label="Имя"
            placeholder="Иван"
            icon={User}
            error={errors.firstName?.message}
            isDarkMode={isDarkMode}
          />
          
          <Input
            {...register('lastName')}
            label="Фамилия"
            placeholder="Иванов"
            error={errors.lastName?.message}
            isDarkMode={isDarkMode}
          />
        </div>

        <Input
          {...register('email')}
          label="Email"
          type="email"
          placeholder="your@email.com"
          icon={Mail}
          error={errors.email?.message}
          isDarkMode={isDarkMode}
        />

        <Input
          {...register('organization')}
          label="Организация (необязательно)"
          placeholder="ООО Название компании"
          icon={Building}
          error={errors.organization?.message}
          isDarkMode={isDarkMode}
        />

        <div className="relative">
          <Input
            {...register('password')}
            label="Пароль"
            type={showPassword ? 'text' : 'password'}
            placeholder="Создайте надежный пароль"
            icon={Lock}
            error={errors.password?.message}
            helperText="Минимум 8 символов, заглавные и строчные буквы, цифры"
            isDarkMode={isDarkMode}
          />
          <button
            type="button"
            className={`absolute right-3 top-[38px] transition-colors duration-300 ${
              isDarkMode 
                ? 'text-gray-400 hover:text-white' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>

        <div className="relative">
          <Input
            {...register('confirmPassword')}
            label="Подтвердите пароль"
            type={showConfirmPassword ? 'text' : 'password'}
            placeholder="Повторите пароль"
            icon={Lock}
            error={errors.confirmPassword?.message}
            isDarkMode={isDarkMode}
          />
          <button
            type="button"
            className={`absolute right-3 top-[38px] transition-colors duration-300 ${
              isDarkMode 
                ? 'text-gray-400 hover:text-white' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
          >
            {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>

        <div className="space-y-4">
          <label className="flex items-start space-x-3">
            <input
              {...register('acceptTerms')}
              type="checkbox"
              className={`h-4 w-4 rounded mt-1 transition-colors duration-300 ${
                isDarkMode 
                  ? 'text-blue-500 focus:ring-blue-500 border-gray-600 bg-gray-800' 
                  : 'text-blue-600 focus:ring-blue-600 border-gray-300 bg-white'
              }`}
            />
            <span className={`text-sm leading-5 transition-colors duration-300 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              Я принимаю{' '}
              <a href="/terms" className={`transition-colors duration-300 ${
                isDarkMode 
                  ? 'text-blue-400 hover:text-blue-300' 
                  : 'text-blue-600 hover:text-blue-500'
              }`}>
                условия использования
              </a>{' '}
              и{' '}
              <a href="/privacy" className={`transition-colors duration-300 ${
                isDarkMode 
                  ? 'text-blue-400 hover:text-blue-300' 
                  : 'text-blue-600 hover:text-blue-500'
              }`}>
                политику конфиденциальности
              </a>
            </span>
          </label>
          {errors.acceptTerms && (
            <p className={`text-sm animate-fade-in transition-colors duration-300 ${
              isDarkMode ? 'text-red-400' : 'text-red-600'
            }`}>
              {errors.acceptTerms.message}
            </p>
          )}
        </div>

        <Button
          type="submit"
          fullWidth
          isLoading={isLoading}
          size="lg"
          isDarkMode={isDarkMode}
        >
          Создать аккаунт
        </Button>
      </form>

      {/* Switch to Login */}
      <div className="text-center">
        <p className={`text-sm transition-colors duration-300 ${
          isDarkMode ? 'text-gray-400' : 'text-gray-600'
        }`}>
          Уже есть аккаунт?{' '}
          <button
            onClick={onSwitchToLogin}
            className={`font-medium transition-colors duration-300 ${
              isDarkMode 
                ? 'text-blue-400 hover:text-blue-300' 
                : 'text-blue-600 hover:text-blue-500'
            }`}
          >
            Войти
          </button>
        </p>
      </div>
    </div>
  );
};