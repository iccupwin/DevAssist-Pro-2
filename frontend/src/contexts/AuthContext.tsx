import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { AUTH_CONFIG } from '../config/auth';
import { LoginFormData, RegisterFormData, ResetPasswordFormData, AuthResponse } from '../types/auth';
import { User } from '../types/shared';
import { authBridge } from '../services/authBridge';
import { websocketBridge } from '../services/websocketBridge';
import { TokenService } from '../services/tokenService';
import { useTokenRefresh } from '../hooks/useTokenRefresh';
import { unifiedApiClient } from '../services/unifiedApiClient';

export interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  sessionExpiresAt: number | null;
  tokenExpiresAt: number | null;
  isRefreshing: boolean;
  timeUntilExpiration: number | null;
}

// Типы действий для reducer
type AuthAction =
  | { type: 'AUTH_START' }
  | { type: 'AUTH_SUCCESS'; payload: { user: User; token: string; refreshToken: string; tokenExpiresAt: number } }
  | { type: 'AUTH_FAILURE'; payload: string }
  | { type: 'UPDATE_USER'; payload: Partial<User> }
  | { type: 'REFRESH_TOKEN_START' }
  | { type: 'REFRESH_TOKEN_SUCCESS'; payload: { token: string; refreshToken: string; tokenExpiresAt: number } }
  | { type: 'REFRESH_TOKEN_FAILURE'; payload: string }
  | { type: 'UPDATE_TOKEN_EXPIRATION'; payload: number | null }
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
  tokenExpiresAt: null,
  isRefreshing: false,
  timeUntilExpiration: null,
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
      const { user, token, refreshToken, tokenExpiresAt } = action.payload;
      const sessionExpiresAt = Date.now() + AUTH_CONFIG.SESSION_TIMEOUT;
      
      // Сохраняем данные в localStorage простым способом (всегда перезаписываем)
      localStorage.setItem(AUTH_CONFIG.USER_STORAGE_KEY, JSON.stringify(user));
      localStorage.setItem(AUTH_CONFIG.TOKEN_STORAGE_KEY, token);
      localStorage.setItem(AUTH_CONFIG.REFRESH_TOKEN_STORAGE_KEY, refreshToken);
      localStorage.setItem(AUTH_CONFIG.TOKEN_EXPIRES_AT_KEY, tokenExpiresAt.toString());
      
      // User authenticated successfully
      
      return {
        ...state,
        user,
        token,
        refreshToken,
        isAuthenticated: true,
        isLoading: false,
        error: null,
        sessionExpiresAt,
        tokenExpiresAt,
        isRefreshing: false,
        timeUntilExpiration: tokenExpiresAt - Date.now(),
      };

    case 'AUTH_FAILURE':
      // Очищаем простые localStorage ключи
      localStorage.removeItem(AUTH_CONFIG.USER_STORAGE_KEY);
      localStorage.removeItem(AUTH_CONFIG.TOKEN_STORAGE_KEY);
      localStorage.removeItem(AUTH_CONFIG.REFRESH_TOKEN_STORAGE_KEY);
      localStorage.removeItem(AUTH_CONFIG.TOKEN_EXPIRES_AT_KEY);
      
      return {
        ...state,
        user: null,
        token: null,
        refreshToken: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload,
        sessionExpiresAt: null,
        tokenExpiresAt: null,
        isRefreshing: false,
        timeUntilExpiration: null,
      };

    case 'UPDATE_USER':
      if (!state.user) return state;
      
      const updatedUser = { ...state.user, ...action.payload };
      localStorage.setItem(AUTH_CONFIG.USER_STORAGE_KEY, JSON.stringify(updatedUser));
      
      return {
        ...state,
        user: updatedUser,
      };

    case 'REFRESH_TOKEN_START':
      return {
        ...state,
        isRefreshing: true,
        error: null,
      };

    case 'REFRESH_TOKEN_SUCCESS':
      const { token: newToken, refreshToken: newRefreshToken, tokenExpiresAt: newTokenExpiresAt } = action.payload;
      const newSessionExpiresAt = Date.now() + AUTH_CONFIG.SESSION_TIMEOUT;
      
      return {
        ...state,
        token: newToken,
        refreshToken: newRefreshToken,
        sessionExpiresAt: newSessionExpiresAt,
        tokenExpiresAt: newTokenExpiresAt,
        isRefreshing: false,
        timeUntilExpiration: newTokenExpiresAt - Date.now(),
        error: null,
      };

    case 'REFRESH_TOKEN_FAILURE':
      return {
        ...state,
        isRefreshing: false,
        error: action.payload,
      };

    case 'UPDATE_TOKEN_EXPIRATION':
      return {
        ...state,
        timeUntilExpiration: action.payload,
      };

    case 'LOGOUT':
      // Полная очистка данных из localStorage
      localStorage.removeItem(AUTH_CONFIG.USER_STORAGE_KEY);
      localStorage.removeItem(AUTH_CONFIG.TOKEN_STORAGE_KEY);
      localStorage.removeItem(AUTH_CONFIG.REFRESH_TOKEN_STORAGE_KEY);
      localStorage.removeItem(AUTH_CONFIG.TOKEN_EXPIRES_AT_KEY);
      
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
  isRefreshing: boolean;
  error: string | null;
  timeUntilExpiration: number | null;
  login: (credentials: LoginFormData) => Promise<AuthResponse>;
  register: (userData: RegisterFormData) => Promise<AuthResponse>;
  logout: () => Promise<void>;
  forgotPassword: (email: string) => Promise<AuthResponse>;
  resetPassword: (data: ResetPasswordFormData) => Promise<AuthResponse>;
  clearError: () => void;
  refreshToken: () => Promise<boolean>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  checkSessionExpiry: () => boolean;
  getSessionExpiresAt: () => number | null;
  getTokenExpiresAt: () => number | null;
  getTimeUntilTokenExpiration: () => number | null;
  hasPermission: (permission: string) => boolean;
  getSessionInfo: () => {
    isAuthenticated: boolean;
    user: User | null;
    tokenExpiresAt: number | null;
    sessionExpiresAt: number | null;
  };
}


// Создание контекста
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Провайдер аутентификации
interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // JWT Token management теперь включен
  // Интеграция с JWT Token management
  const tokenRefresh = useTokenRefresh({
    autoRefresh: true,
    checkInterval: 60000, // Проверяем каждую минуту
    onTokenRefreshed: () => {
      // Token refreshed successfully
      const sessionInfo = TokenService.getSessionInfo();
      if (sessionInfo.isAuthenticated) {
        const timeLeft = TokenService.getTimeUntilExpiration();
        dispatch({ type: 'UPDATE_TOKEN_EXPIRATION', payload: timeLeft });
      }
    },
    onTokenExpired: () => {
      // Token expired, logging out
      dispatch({ type: 'LOGOUT' });
    },
    onRefreshFailed: (error) => {
      // Token refresh failed
      dispatch({ type: 'REFRESH_TOKEN_FAILURE', payload: error.message });
    }
  });

  // Восстановление состояния при загрузке приложения
  useEffect(() => {
    const initializeAuth = () => {
      // Initializing authentication
      dispatch({ type: 'SET_LOADING', payload: true });
      
      try {
        // Используем простую проверку localStorage для development
        const userStr = localStorage.getItem(AUTH_CONFIG.USER_STORAGE_KEY);
        const tokenStr = localStorage.getItem(AUTH_CONFIG.TOKEN_STORAGE_KEY);
        const refreshTokenStr = localStorage.getItem(AUTH_CONFIG.REFRESH_TOKEN_STORAGE_KEY);
        const tokenExpiresAtStr = localStorage.getItem(AUTH_CONFIG.TOKEN_EXPIRES_AT_KEY);

        // Checking localStorage for saved session

        if (userStr && tokenStr && refreshTokenStr && tokenExpiresAtStr) {
          const user = JSON.parse(userStr);
          const tokenExpiresAt = parseInt(tokenExpiresAtStr);
          
          // Found saved session data
          
          // Проверяем, не истек ли токен
          if (tokenExpiresAt > Date.now()) {
            // Restoring session for user
            
            // Обновляем токены в API клиентах при восстановлении сессии
            unifiedApiClient.updateTokens();
            
            dispatch({
              type: 'AUTH_SUCCESS',
              payload: { 
                user, 
                token: tokenStr, 
                refreshToken: refreshTokenStr, 
                tokenExpiresAt 
              }
            });
            
            // Session restored successfully
            
            // Подключаем WebSocket после восстановления сессии (только в production)
            if (process.env.NODE_ENV === 'production') {
              websocketBridge.connect().catch(() => {
                // WebSocket connection failed after session restore
              });
            }
          } else {
            // Token expired, clearing session
            dispatch({ type: 'LOGOUT' });
          }
        } else {
          // No saved session found or incomplete data
          dispatch({ type: 'SET_LOADING', payload: false });
        }
      } catch (error) {
        // Error during authentication state restoration
        dispatch({ type: 'LOGOUT' });
      }
    };

    initializeAuth();
  }, []);

  // Обновление времени до истечения токена
  useEffect(() => {
    if (!state.isAuthenticated || !state.tokenExpiresAt) return;

    const updateExpirationTime = () => {
      const timeLeft = state.tokenExpiresAt! - Date.now();
      dispatch({ type: 'UPDATE_TOKEN_EXPIRATION', payload: timeLeft > 0 ? timeLeft : null });
    };

    updateExpirationTime(); // Обновляем сразу
    const interval = setInterval(updateExpirationTime, 10000); // Обновляем каждые 10 секунд

    return () => clearInterval(interval);
  }, [state.isAuthenticated, state.tokenExpiresAt]);

  // JWT token management происходит через useTokenRefresh hook

  // Функция входа
  const login = async (credentials: LoginFormData): Promise<AuthResponse> => {
    // Starting login process
    dispatch({ type: 'AUTH_START' });

    try {
      // Используем real backend API
      const response = await authBridge.login(credentials);
      
      // Real API response received
      
      if (response.success && response.user && response.token && response.refreshToken) {
        // Вычисляем время истечения токена
        const tokenExpiresAt = Date.now() + (response.expiresIn || 3600) * 1000;
        
        // Saving user data to localStorage
        
        localStorage.setItem(AUTH_CONFIG.USER_STORAGE_KEY, JSON.stringify(response.user));
        localStorage.setItem(AUTH_CONFIG.TOKEN_STORAGE_KEY, response.token);
        localStorage.setItem(AUTH_CONFIG.REFRESH_TOKEN_STORAGE_KEY, response.refreshToken);
        localStorage.setItem(AUTH_CONFIG.TOKEN_EXPIRES_AT_KEY, tokenExpiresAt.toString());
        
        // Обновляем токены в API клиентах
        unifiedApiClient.updateTokens();
        
        dispatch({
          type: 'AUTH_SUCCESS',
          payload: {
            user: response.user,
            token: response.token,
            refreshToken: response.refreshToken,
            tokenExpiresAt
          }
        });
        
        // Login successful
        
        // Подключаем WebSocket после успешной авторизации (только в production)
        if (process.env.NODE_ENV === 'production') {
          try {
            websocketBridge.connect();
          } catch (error) {
            // WebSocket connection failed
          }
        }
        
        return response;
      } else {
        const errorMessage = response.error || 'Ошибка входа';
        // Login failed
        dispatch({ type: 'AUTH_FAILURE', payload: errorMessage });
        return { success: false, error: errorMessage };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
      // Login error occurred
      dispatch({ type: 'AUTH_FAILURE', payload: errorMessage });
      return { success: false, error: errorMessage };
    }
  };

  // Функция регистрации
  const register = async (userData: RegisterFormData): Promise<AuthResponse> => {
    dispatch({ type: 'AUTH_START' });

    try {
      const response = await authBridge.register(userData);
      
      if (response.success && response.user) {
        // При регистрации не устанавливаем токены, так как их нет
        // Пользователь должен будет войти отдельно
        // Registration successful
        
        // Очищаем состояние и возвращаем успешный ответ
        dispatch({ type: 'CLEAR_ERROR' }); // Очищаем ошибки
        dispatch({ type: 'SET_LOADING', payload: false });
        
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
  const logout = async (): Promise<void> => {
    try {
      // Отключаем WebSocket (только в production)
      if (process.env.NODE_ENV === 'production') {
        websocketBridge.disconnect();
      }
      
      // Очищаем простые localStorage ключи
      localStorage.removeItem(AUTH_CONFIG.USER_STORAGE_KEY);
      localStorage.removeItem(AUTH_CONFIG.TOKEN_STORAGE_KEY);
      localStorage.removeItem(AUTH_CONFIG.REFRESH_TOKEN_STORAGE_KEY);
      localStorage.removeItem(AUTH_CONFIG.TOKEN_EXPIRES_AT_KEY);
      
      // Logout successful, session cleared
    } catch (error) {
      // Error during logout
    } finally {
      dispatch({ type: 'LOGOUT' });
    }
  };

  // Обновление профиля
  const updateProfile = async (data: Partial<User>): Promise<void> => {
    try {
      const updatedUser = await authBridge.updateUserProfile(data);
      if (updatedUser) {
        dispatch({ type: 'UPDATE_USER', payload: updatedUser });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Ошибка обновления профиля';
      dispatch({ type: 'AUTH_FAILURE', payload: errorMessage });
      throw error;
    }
  };

  // Обновление токена
  const refreshToken = async (): Promise<boolean> => {
    const storedRefreshToken = localStorage.getItem(AUTH_CONFIG.REFRESH_TOKEN_STORAGE_KEY);
    
    if (!storedRefreshToken) {
      // No refresh token found, logging out
      dispatch({ type: 'LOGOUT' });
      return false;
    }

    dispatch({ type: 'REFRESH_TOKEN_START' });

    try {
      const success = await authBridge.refreshToken();
      
      if (success) {
        // Обновляем токены из localStorage после успешного обновления
        const newToken = localStorage.getItem(AUTH_CONFIG.TOKEN_STORAGE_KEY);
        const newRefreshToken = localStorage.getItem(AUTH_CONFIG.REFRESH_TOKEN_STORAGE_KEY);
        const newTokenExpiresAt = Date.now() + 3600 * 1000; // Предполагаем час
        
        if (newToken && newRefreshToken) {
          localStorage.setItem(AUTH_CONFIG.TOKEN_EXPIRES_AT_KEY, newTokenExpiresAt.toString());
          
          dispatch({
            type: 'REFRESH_TOKEN_SUCCESS',
            payload: {
              token: newToken,
              refreshToken: newRefreshToken,
              tokenExpiresAt: newTokenExpiresAt
            }
          });
          
          // Token refreshed successfully
          return true;
        }
      }
      
      throw new Error('Token refresh failed');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Token refresh failed';
      // Token refresh failed
      dispatch({ type: 'REFRESH_TOKEN_FAILURE', payload: errorMessage });
      dispatch({ type: 'LOGOUT' });
      return false;
    }
  };

  // Восстановление пароля
  const forgotPassword = async (email: string): Promise<AuthResponse> => {
    try {
      const response = await authBridge.forgotPassword(email);
      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Ошибка отправки письма';
      return { success: false, error: errorMessage };
    }
  };

  // Сброс пароля
  const resetPassword = async (data: ResetPasswordFormData): Promise<AuthResponse> => {
    try {
      const response = await authBridge.resetPassword(data.token, data.password);
      return response;
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

  // Получение времени истечения JWT токена
  const getTokenExpiresAt = (): number | null => {
    return state.tokenExpiresAt;
  };

  // Получение времени до истечения токена
  const getTimeUntilTokenExpiration = (): number | null => {
    return state.timeUntilExpiration;
  };

  // Проверка прав доступа (упрощенная версия для development)
  const hasPermission = (permission: string): boolean => {
    if (!state.user) return false;
    
    // В development режиме админы имеют все права
    if (state.user.role === 'admin') return true;
    
    // Базовые права для обычных пользователей
    const basicPermissions = ['read_profile', 'update_profile', 'use_kp_analyzer'];
    return basicPermissions.includes(permission);
  };

  // Получение информации о сессии (упрощенная версия для development)
  const getSessionInfo = () => {
    return {
      isAuthenticated: state.isAuthenticated,
      user: state.user,
      tokenExpiresAt: state.tokenExpiresAt,
      sessionExpiresAt: state.sessionExpiresAt
    };
  };

  const contextValue: AuthContextType = {
    user: state.user,
    isAuthenticated: state.isAuthenticated,
    isLoading: state.isLoading,
    isRefreshing: state.isRefreshing,
    error: state.error,
    timeUntilExpiration: state.timeUntilExpiration,
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
    getTokenExpiresAt,
    getTimeUntilTokenExpiration,
    hasPermission,
    getSessionInfo,
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

