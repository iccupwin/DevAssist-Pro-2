import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { AUTH_CONFIG } from '../config/auth';
import { LoginFormData, RegisterFormData, ResetPasswordFormData, AuthResponse } from '../types/auth';
import { User } from '../types/shared';
import { authBridge } from '../services/authBridge';
import { websocketBridge } from '../services/websocketBridge';

export interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  sessionExpiresAt: number | null;
}

// Типы действий для reducer
type AuthAction =
  | { type: 'AUTH_START' }
  | { type: 'AUTH_SUCCESS'; payload: { user: User; token: string; refreshToken: string } }
  | { type: 'AUTH_FAILURE'; payload: string }
  | { type: 'UPDATE_USER'; payload: Partial<User> }
  | { type: 'REFRESH_TOKEN_SUCCESS'; payload: { token: string; refreshToken: string } }
  | { type: 'LOGOUT' }
  | { type: 'CLEAR_ERROR' }
  | { type: 'SET_LOADING'; payload: boolean };

// Начальное состояние
const initialState: AuthState = {
  user: null,
  token: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  sessionExpiresAt: null,
};

// Reducer для управления состоянием аутентификации
const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'AUTH_START':
      return {
        ...state,
        isLoading: true,
        error: null,
      };

    case 'AUTH_SUCCESS':
      const { user, token, refreshToken } = action.payload;
      const sessionExpiresAt = Date.now() + AUTH_CONFIG.SESSION_TIMEOUT;
      
      // Сохраняем данные в localStorage
      localStorage.setItem(AUTH_CONFIG.TOKEN_STORAGE_KEY, token);
      localStorage.setItem(AUTH_CONFIG.REFRESH_TOKEN_STORAGE_KEY, refreshToken);
      localStorage.setItem(AUTH_CONFIG.USER_STORAGE_KEY, JSON.stringify(user));
      
      return {
        ...state,
        user,
        token,
        refreshToken,
        isAuthenticated: true,
        isLoading: false,
        error: null,
        sessionExpiresAt,
      };

    case 'AUTH_FAILURE':
      // Очищаем localStorage при ошибке
      localStorage.removeItem(AUTH_CONFIG.TOKEN_STORAGE_KEY);
      localStorage.removeItem(AUTH_CONFIG.REFRESH_TOKEN_STORAGE_KEY);
      localStorage.removeItem(AUTH_CONFIG.USER_STORAGE_KEY);
      
      return {
        ...state,
        user: null,
        token: null,
        refreshToken: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload,
        sessionExpiresAt: null,
      };

    case 'UPDATE_USER':
      if (!state.user) return state;
      
      const updatedUser = { ...state.user, ...action.payload };
      localStorage.setItem(AUTH_CONFIG.USER_STORAGE_KEY, JSON.stringify(updatedUser));
      
      return {
        ...state,
        user: updatedUser,
      };

    case 'REFRESH_TOKEN_SUCCESS':
      const { token: newToken, refreshToken: newRefreshToken } = action.payload;
      const newSessionExpiresAt = Date.now() + AUTH_CONFIG.SESSION_TIMEOUT;
      
      localStorage.setItem(AUTH_CONFIG.TOKEN_STORAGE_KEY, newToken);
      localStorage.setItem(AUTH_CONFIG.REFRESH_TOKEN_STORAGE_KEY, newRefreshToken);
      
      return {
        ...state,
        token: newToken,
        refreshToken: newRefreshToken,
        sessionExpiresAt: newSessionExpiresAt,
      };

    case 'LOGOUT':
      // Полная очистка данных
      localStorage.removeItem(AUTH_CONFIG.TOKEN_STORAGE_KEY);
      localStorage.removeItem(AUTH_CONFIG.REFRESH_TOKEN_STORAGE_KEY);
      localStorage.removeItem(AUTH_CONFIG.USER_STORAGE_KEY);
      
      return {
        ...initialState,
      };

    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };

    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };

    default:
      return state;
  }
};

// Интерфейс для контекста
interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (credentials: LoginFormData) => Promise<AuthResponse>;
  register: (userData: RegisterFormData) => Promise<AuthResponse>;
  logout: () => void;
  forgotPassword: (email: string) => Promise<AuthResponse>;
  resetPassword: (data: ResetPasswordFormData) => Promise<AuthResponse>;
  clearError: () => void;
  refreshToken: () => Promise<boolean>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  checkSessionExpiry: () => boolean;
  getSessionExpiresAt: () => number | null;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  acceptTerms: boolean;
}

// Создание контекста
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Провайдер аутентификации
interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Восстановление состояния при загрузке приложения
  useEffect(() => {
    const initializeAuth = () => {
      try {
        const token = localStorage.getItem(AUTH_CONFIG.TOKEN_STORAGE_KEY);
        const refreshToken = localStorage.getItem(AUTH_CONFIG.REFRESH_TOKEN_STORAGE_KEY);
        const userStr = localStorage.getItem(AUTH_CONFIG.USER_STORAGE_KEY);

        if (token && refreshToken && userStr) {
          const user = JSON.parse(userStr);
          
          // Проверяем, не истекла ли сессия
          const sessionExpiresAt = Date.now() + AUTH_CONFIG.SESSION_TIMEOUT;
          if (Date.now() < sessionExpiresAt) {
            dispatch({
              type: 'AUTH_SUCCESS',
              payload: { user, token, refreshToken }
            });
          } else {
            // Сессия истекла, очищаем данные
            dispatch({ type: 'LOGOUT' });
          }
        }
      } catch (error) {
        console.error('Ошибка при восстановлении состояния аутентификации:', error);
        dispatch({ type: 'LOGOUT' });
      }
    };

    initializeAuth();
  }, []);

  // Автоматическое обновление токена
  useEffect(() => {
    if (!state.isAuthenticated || !state.sessionExpiresAt) return;

    const checkTokenExpiry = () => {
      const timeUntilExpiry = state.sessionExpiresAt! - Date.now();
      const refreshThreshold = 5 * 60 * 1000; // Обновляем за 5 минут до истечения

      if (timeUntilExpiry <= refreshThreshold && timeUntilExpiry > 0) {
        refreshToken();
      } else if (timeUntilExpiry <= 0) {
        logout();
      }
    };

    const interval = setInterval(checkTokenExpiry, 60 * 1000); // Проверяем каждую минуту
    return () => clearInterval(interval);
  }, [state.isAuthenticated, state.sessionExpiresAt]);

  // Функция входа
  const login = async (credentials: LoginFormData): Promise<AuthResponse> => {
    dispatch({ type: 'AUTH_START' });

    try {
      const response = await authBridge.login(credentials);
      
      if (response.success && response.user && response.token && response.refreshToken) {
        dispatch({
          type: 'AUTH_SUCCESS',
          payload: {
            user: response.user,
            token: response.token,
            refreshToken: response.refreshToken,
          }
        });
        
        // Подключаем WebSocket после успешной авторизации
        websocketBridge.connect().catch(error => {
          console.error('WebSocket connection failed:', error);
        });
        
        return response;
      } else {
        const errorMessage = response.error || 'Ошибка входа';
        dispatch({ type: 'AUTH_FAILURE', payload: errorMessage });
        return { success: false, error: errorMessage };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
      dispatch({ type: 'AUTH_FAILURE', payload: errorMessage });
      return { success: false, error: errorMessage };
    }
  };

  // Функция регистрации
  const register = async (userData: RegisterFormData): Promise<AuthResponse> => {
    dispatch({ type: 'AUTH_START' });

    try {
      const response = await authBridge.register(userData);
      
      if (response.success && response.user && response.token && response.refreshToken) {
        dispatch({
          type: 'AUTH_SUCCESS',
          payload: {
            user: response.user,
            token: response.token,
            refreshToken: response.refreshToken,
          }
        });
        
        // Подключаем WebSocket после успешной регистрации
        websocketBridge.connect().catch(error => {
          console.error('WebSocket connection failed:', error);
        });
        
        return response;
      } else {
        const errorMessage = response.error || 'Ошибка регистрации';
        dispatch({ type: 'AUTH_FAILURE', payload: errorMessage });
        return { success: false, error: errorMessage };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
      dispatch({ type: 'AUTH_FAILURE', payload: errorMessage });
      return { success: false, error: errorMessage };
    }
  };

  // Функция выхода
  const logout = (): void => {
    try {
      // Отключаем WebSocket
      websocketBridge.disconnect();
      
      // Выходим через authBridge
      authBridge.logout();
    } catch (error) {
      console.error('Ошибка при выходе:', error);
    } finally {
      dispatch({ type: 'LOGOUT' });
    }
  };

  // Обновление профиля
  const updateProfile = async (data: Partial<User>): Promise<void> => {
    try {
      // TODO: Заменить на реальный API вызов
      await mockUpdateProfileAPI(data);
      dispatch({ type: 'UPDATE_USER', payload: data });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Ошибка обновления профиля';
      dispatch({ type: 'AUTH_FAILURE', payload: errorMessage });
      throw error;
    }
  };

  // Обновление токена
  const refreshToken = async (): Promise<boolean> => {
    if (!state.refreshToken) {
      dispatch({ type: 'LOGOUT' });
      return false;
    }

    try {
      // TODO: Заменить на реальный API вызов
      const response = await mockRefreshTokenAPI(state.refreshToken);
      
      if (response.success) {
        dispatch({
          type: 'REFRESH_TOKEN_SUCCESS',
          payload: {
            token: response.token,
            refreshToken: response.refreshToken,
          }
        });
        return true;
      } else {
        dispatch({ type: 'LOGOUT' });
        return false;
      }
    } catch (error) {
      dispatch({ type: 'LOGOUT' });
      return false;
    }
  };

  // Восстановление пароля
  const forgotPassword = async (email: string): Promise<AuthResponse> => {
    try {
      // TODO: Заменить на реальный API вызов
      await mockForgotPasswordAPI(email);
      return { success: true, message: 'Письмо для восстановления пароля отправлено' };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Ошибка отправки письма';
      return { success: false, error: errorMessage };
    }
  };

  // Сброс пароля
  const resetPassword = async (data: ResetPasswordFormData): Promise<AuthResponse> => {
    try {
      // TODO: Заменить на реальный API вызов
      await mockResetPasswordAPI(data.token, data.password);
      return { success: true, message: 'Пароль успешно изменен' };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Ошибка сброса пароля';
      return { success: false, error: errorMessage };
    }
  };

  // Очистка ошибки
  const clearError = (): void => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  // Проверка истечения сессии
  const checkSessionExpiry = (): boolean => {
    if (!state.sessionExpiresAt) return false;
    return Date.now() >= state.sessionExpiresAt;
  };

  // Получение времени истечения сессии
  const getSessionExpiresAt = (): number | null => {
    return state.sessionExpiresAt;
  };

  const contextValue: AuthContextType = {
    user: state.user,
    isAuthenticated: state.isAuthenticated,
    isLoading: state.isLoading,
    error: state.error,
    login,
    register,
    logout,
    forgotPassword,
    resetPassword,
    clearError,
    refreshToken,
    updateProfile,
    checkSessionExpiry,
    getSessionExpiresAt,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// Хук для использования контекста аутентификации
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Mock API функции (заменить на реальные вызовы API)
const mockLoginAPI = async (email: string, password: string): Promise<{
  success: boolean;
  user?: User;
  token?: string;
  refreshToken?: string;
  error?: string;
}> => {
  await new Promise(resolve => setTimeout(resolve, 1000)); // Имитация задержки

  if (email === 'admin@devassist.ru' && password === 'Admin123!') {
    return {
      success: true,
      user: {
        id: 1,
        email: 'admin@devassist.ru',
        full_name: 'Александр Петров',
        firstName: 'Александр',
        lastName: 'Петров',
        role: 'admin' as const,
        avatar: '',
        isEmailVerified: true,
        is2FAEnabled: false,
        is_active: true,
        is_verified: true,
        is_superuser: true,
        subscription: {
          plan: 'Professional',
          status: 'active' as const,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        },
        preferences: {
          language: 'ru',
          theme: 'system' as const,
          notifications: {
            email: true,
            push: true,
          },
        },
        created_at: '2024-01-15T00:00:00Z',
        updated_at: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
      },
      token: 'mock_jwt_token_' + Date.now(),
      refreshToken: 'mock_refresh_token_' + Date.now(),
    };
  }

  return {
    success: false,
    error: 'Неверный email или пароль',
  };
};

const mockRegisterAPI = async (data: RegisterData): Promise<{
  success: boolean;
  user?: User;
  token?: string;
  refreshToken?: string;
  error?: string;
}> => {
  await new Promise(resolve => setTimeout(resolve, 1000));

  return {
    success: true,
    user: {
      id: Date.now(),
      email: data.email,
      full_name: `${data.firstName} ${data.lastName}`,
      firstName: data.firstName,
      lastName: data.lastName,
      role: 'user' as const,
      avatar: '',
      isEmailVerified: false,
      is2FAEnabled: false,
      is_active: true,
      is_verified: false,
      is_superuser: false,
      subscription: {
        plan: 'Free',
        status: 'active' as const,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      },
      preferences: {
        language: 'ru',
        theme: 'system' as const,
        notifications: {
          email: true,
          push: false,
        },
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
    },
    token: 'mock_jwt_token_' + Date.now(),
    refreshToken: 'mock_refresh_token_' + Date.now(),
  };
};

const mockLogoutAPI = async () => {
  await new Promise(resolve => setTimeout(resolve, 500));
  return { success: true };
};

const mockUpdateProfileAPI = async (data: Partial<User>) => {
  await new Promise(resolve => setTimeout(resolve, 500));
  return { success: true, user: data };
};

const mockRefreshTokenAPI = async (refreshToken: string) => {
  await new Promise(resolve => setTimeout(resolve, 500));
  
  return {
    success: true,
    token: 'mock_jwt_token_' + Date.now(),
    refreshToken: 'mock_refresh_token_' + Date.now(),
  };
};

const mockForgotPasswordAPI = async (email: string) => {
  await new Promise(resolve => setTimeout(resolve, 1000));
  return { success: true };
};

const mockResetPasswordAPI = async (token: string, password: string) => {
  await new Promise(resolve => setTimeout(resolve, 1000));
  return { success: true };
};