import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { AuthLayout } from '../components/auth/AuthLayout';
import LoginForm from '../components/auth/LoginForm';
import { RegisterForm } from '../components/auth/RegisterForm';
import { ForgotPasswordForm } from '../components/auth/ForgotPasswordForm';
import { LoginFormData, RegisterFormData, ForgotPasswordFormData, AuthResponse } from '../types/auth';
import { getStreamlitUrl, storeUserData } from '../config/app';

type AuthMode = 'login' | 'register' | 'forgot-password';

export const AuthPage: React.FC = () => {
  const location = useLocation();
  const [mode, setMode] = useState<AuthMode>('login');
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);
  const [forgotPasswordSuccess, setForgotPasswordSuccess] = useState(false);

  const clearError = () => setError(undefined);

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

  // Load theme preference from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      setIsDarkMode(savedTheme === 'dark');
    } else {
      // Default to system preference
      setIsDarkMode(window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
  }, []);

  // Save theme preference and apply to document
  useEffect(() => {
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  // Mock API calls - replace with actual API integration
  const handleLogin = async (data: LoginFormData): Promise<void> => {
    setIsLoading(true);
    clearError();
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Mock validation - accept any valid email and password
      if (data.email && data.password && data.email.includes('@')) {
        // Success - redirect to Streamlit app
        console.log('Login successful:', data);
        
        // Store user data using helper function
        storeUserData({ email: data.email });
        
        // Redirect to Streamlit app
        window.location.href = getStreamlitUrl();
      } else {
        throw new Error('Неверный email или пароль');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка входа');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (data: RegisterFormData): Promise<void> => {
    setIsLoading(true);
    clearError();
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock validation - accept any valid registration data
      if (data.email && data.password && data.firstName && data.lastName) {
        // Success - auto-login after registration
        console.log('Registration successful:', data);
        
        // Store user data using helper function
        storeUserData({
          email: data.email,
          firstName: data.firstName,
          lastName: data.lastName,
          organization: data.organization
        });
        
        // Redirect to Streamlit app after successful registration
        window.location.href = getStreamlitUrl();
      } else {
        throw new Error('Заполните все обязательные поля');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка регистрации');
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
        console.log('Password reset requested for:', data.email);
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
          <LoginForm
            onSubmit={handleLogin}
            isLoading={isLoading}
            error={error}
            onForgotPassword={() => {
              setMode('forgot-password');
              clearError();
              setForgotPasswordSuccess(false);
            }}
            onSwitchToRegister={() => {
              setMode('register');
              clearError();
            }}
            isDarkMode={isDarkMode}
          />
        );
      
      case 'register':
        return (
          <RegisterForm
            onSubmit={handleRegister}
            isLoading={isLoading}
            error={error}
            onSwitchToLogin={() => {
              setMode('login');
              clearError();
            }}
            isDarkMode={isDarkMode}
          />
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

  return (
    <AuthLayout isDarkMode={isDarkMode} onToggleTheme={toggleTheme}>
      {renderAuthForm()}
    </AuthLayout>
  );
};