import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, ArrowLeft } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { ForgotPasswordFormData } from '../../types/auth';
import { VALIDATION_RULES } from '../../config/auth';

const forgotPasswordSchema = z.object({
  email: z.string()
    .min(1, VALIDATION_RULES.email.required)
    .regex(VALIDATION_RULES.email.pattern.value, VALIDATION_RULES.email.pattern.message)
});

interface ForgotPasswordFormProps {
  onSubmit: (data: ForgotPasswordFormData) => Promise<void>;
  isLoading?: boolean;
  error?: string;
  success?: boolean;
  onBackToLogin: () => void;
  isDarkMode?: boolean;
}

export const ForgotPasswordForm: React.FC<ForgotPasswordFormProps> = ({
  onSubmit,
  isLoading = false,
  error,
  success = false,
  onBackToLogin,
  isDarkMode = true
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema)
  });

  const handleFormSubmit = async (data: ForgotPasswordFormData) => {
    await onSubmit(data);
  };

  if (success) {
    return (
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-4">
          <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center transition-colors duration-300 ${
            isDarkMode ? 'bg-green-900/30' : 'bg-green-100'
          }`}>
            <Mail className={`w-8 h-8 transition-colors duration-300 ${
              isDarkMode ? 'text-green-400' : 'text-green-600'
            }`} />
          </div>
          
          <h1 className={`text-2xl font-bold transition-colors duration-300 ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>
            Письмо отправлено
          </h1>
          
          <div className="space-y-2">
            <p className={`transition-colors duration-300 ${
              isDarkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Мы отправили инструкции по восстановлению пароля на ваш email.
            </p>
            <p className={`text-sm transition-colors duration-300 ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Проверьте папку "Спам", если письмо не появилось в течение нескольких минут.
            </p>
          </div>
        </div>

        <Button
          onClick={onBackToLogin}
          variant="outline"
          fullWidth
          icon={ArrowLeft}
          isDarkMode={isDarkMode}
        >
          Вернуться к входу
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className={`text-2xl font-bold transition-colors duration-300 ${
          isDarkMode ? 'text-white' : 'text-gray-900'
        }`}>
          Восстановление пароля
        </h1>
        <p className={`transition-colors duration-300 ${
          isDarkMode ? 'text-gray-400' : 'text-gray-600'
        }`}>
          Введите ваш email и мы отправим инструкции для восстановления пароля
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

      {/* Form */}
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-5">
        <Input
          {...register('email')}
          label="Email"
          type="email"
          placeholder="your@email.com"
          icon={Mail}
          error={errors.email?.message}
          isDarkMode={isDarkMode}
        />

        <div className="space-y-4">
          <Button
            type="submit"
            fullWidth
            isLoading={isLoading}
            size="lg"
            isDarkMode={isDarkMode}
          >
            Отправить инструкции
          </Button>

          <Button
            type="button"
            onClick={onBackToLogin}
            variant="ghost"
            fullWidth
            icon={ArrowLeft}
            isDarkMode={isDarkMode}
          >
            Вернуться к входу
          </Button>
        </div>
      </form>
    </div>
  );
};