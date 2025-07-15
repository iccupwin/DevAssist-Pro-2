import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AuthLayout } from '../components/auth/AuthLayout';
import LightLoginForm from '../components/auth/LightLoginForm';
import LightRegisterForm from '../components/auth/LightRegisterForm';
import { ForgotPasswordForm } from '../components/auth/ForgotPasswordForm';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext'; // Добавляем AuthContext
import { LoginFormData, RegisterFormData, ForgotPasswordFormData } from '../types/auth';
import { BackendDiagnostics } from '../components/debug/BackendDiagnostics';
import { ConnectionStatus } from '../components/debug/ConnectionStatus';
import { useToast } from '../contexts/ToastContext';

type AuthMode = 'login' | 'register' | 'forgot-password';

export const AuthPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [mode, setMode] = useState<AuthMode>('login');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);
  const [forgotPasswordSuccess, setForgotPasswordSuccess] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const { isDarkMode, toggleTheme } = useTheme();
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const { showRegistrationToast } = useToast();
  
  // Используем AuthContext
  const { login, register, clearError: clearAuthError } = useAuth();

  const clearError = () => {
    setError(undefined);
    clearAuthError();
  };

  // Set mode based on URL path
  useEffect(() => {
    const path = location.pathname;
    if (path.includes('/register')) {
      setMode('register');
    } else if (path.includes('/forgot-password')) {
      setMode('forgot-password');
    } else {
      setMode('login');
    }
  }, [location.pathname]);

  // Используем AuthContext для входа
  const handleLogin = async (data: LoginFormData): Promise<void> => {
    setIsLoading(true);
    clearError();
    
    try {
      // Attempting login
      
      // Используем AuthContext login
      const response = await login(data);
      
      // Login response received
      
      if (response.success) {
        // Login successful
        
        // Принудительный переход на dashboard
        setTimeout(() => {
          // Redirecting to dashboard
          window.location.href = '/dashboard';
        }, 500);
      } else {
        // Login failed
        setError(response.error || 'Ошибка входа');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Ошибка входа';
      console.error('[AuthPage] Login error caught:', err);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Используем AuthContext для регистрации
  const handleRegister = async (data: RegisterFormData): Promise<void> => {
    setIsLoading(true);
    clearError();
    setRegistrationSuccess(false);
    
    try {
      // Attempting registration
      
      // Используем AuthContext register
      const response = await register(data);
      
      // Registration response received
      
      if (response.success) {
        setRegistrationSuccess(true);
        showRegistrationToast(`${data.firstName} ${data.lastName}`, data.email);
        setTimeout(() => {
          setMode('login');
          setRegistrationSuccess(false);
        }, 500);
        setError(undefined);
      } else {
        // Registration failed
        setError(response.error || 'Ошибка регистрации');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Ошибка регистрации';
      console.error('[AuthPage] Registration error caught:', err);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (data: ForgotPasswordFormData): Promise<void> => {
    setIsLoading(true);
    clearError();
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock validation - accept any valid email
      if (data.email && data.email.includes('@')) {
        // Password reset requested
        setForgotPasswordSuccess(true);
      } else {
        throw new Error('Введите корректный email адрес');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка отправки письма');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = (provider: string) => {
    // Redirect to OAuth endpoint
    window.location.href = `/api/auth/oauth/${provider}`;
  };

  const renderAuthForm = () => {
    switch (mode) {
      case 'login':
        return (
          <div className="w-full">
            {registrationSuccess && (
              <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-green-800">
                      Регистрация успешно завершена! Теперь вы можете войти в систему.
                    </p>
                  </div>
                </div>
              </div>
            )}
            <LightLoginForm
              onSubmit={handleLogin}
              isLoading={isLoading}
              error={error}
              onForgotPassword={() => {
                setMode('forgot-password');
                clearError();
                setForgotPasswordSuccess(false);
              }}
              onSignUp={() => {
                setMode('register');
                clearError();
                setRegistrationSuccess(false);
              }}
              isDarkMode={isDarkMode}
            />
          </div>
        );
      
      case 'register':
        return (
          <div className="w-full">
            <LightRegisterForm
              onSubmit={handleRegister}
              isLoading={isLoading}
              error={error}
              onSignIn={() => {
                setMode('login');
                clearError();
                setRegistrationSuccess(false);
              }}
              isDarkMode={isDarkMode}
            />
          </div>
        );
      
      case 'forgot-password':
        return (
          <ForgotPasswordForm
            onSubmit={handleForgotPassword}
            isLoading={isLoading}
            error={error}
            success={forgotPasswordSuccess}
            onBackToLogin={() => {
              setMode('login');
              clearError();
              setForgotPasswordSuccess(false);
            }}
            isDarkMode={isDarkMode}
          />
        );
      
      default:
        return null;
    }
  };

  // For login and register modes, render without AuthLayout (full screen centered)
  return (
    <>
      {mode === 'login' || mode === 'register' ? (
        <div className="relative">
          {/* Theme Toggle Button - Fixed position */}
          <button
            onClick={toggleTheme}
            className="fixed top-6 right-6 z-50 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-105"
            style={{
              background: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
              backdropFilter: 'blur(10px)',
              border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)'}`
            }}
            title={isDarkMode ? 'Переключить на светлую тему' : 'Переключить на тёмную тему'}
          >
            {isDarkMode ? (
              <Sun className="w-5 h-5 text-yellow-400" />
            ) : (
              <Moon className="w-5 h-5 text-gray-600" />
            )}
          </button>
          {renderAuthForm()}
        </div>
      ) : (
        <AuthLayout isDarkMode={isDarkMode} onToggleTheme={toggleTheme}>
          {renderAuthForm()}
        </AuthLayout>
      )}
    </>
  );
};