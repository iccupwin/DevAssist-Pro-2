import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { LoginFormData, RegisterFormData, ResetPasswordFormData, AuthResponse } from '../types/auth';
import { User } from '../types/shared';
import { authBridge } from '../services/authBridge';
import { TokenService } from '../services/tokenService';

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  isRefreshing: boolean;
  timeUntilExpiration: number | null;
}

// Типы действий для reducer
type AuthAction =
  | { type: 'AUTH_START' }
  | { type: 'AUTH_SUCCESS'; payload: { user: User } }
  | { type: 'AUTH_FAILURE'; payload: string }
  | { type: 'UPDATE_USER'; payload: Partial<User> }
  | { type: 'REFRESH_TOKEN_START' }
  | { type: 'REFRESH_TOKEN_SUCCESS' }
  | { type: 'REFRESH_TOKEN_FAILURE'; payload: string }
  | { type: 'UPDATE_TOKEN_EXPIRATION'; payload: number | null }
  | { type: 'LOGOUT' }
  | { type: 'CLEAR_ERROR' }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'RESTORE_SESSION'; payload: { user: User } };

// Начальное состояние
const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: true, // Start with loading true for session restoration
  error: null,
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
      console.log('[AuthContextFixed] AUTH_SUCCESS - user authenticated:', action.payload.user.email);
      return {
        ...state,
        user: action.payload.user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
        isRefreshing: false,
      };

    case 'RESTORE_SESSION':
      console.log('[AuthContextFixed] Session restored for user:', action.payload.user.email);
      return {
        ...state,
        user: action.payload.user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
        isRefreshing: false,
      };

    case 'AUTH_FAILURE':
      TokenService.clearTokens();
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload,
        isRefreshing: false,
        timeUntilExpiration: null,
      };

    case 'UPDATE_USER':
      if (!state.user) return state;
      
      const updatedUser = { ...state.user, ...action.payload };
      
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
      return {
        ...state,
        isRefreshing: false,
        error: null,
      };

    case 'REFRESH_TOKEN_FAILURE':
      TokenService.clearTokens();
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isRefreshing: false,
        error: action.payload,
        timeUntilExpiration: null,
      };

    case 'UPDATE_TOKEN_EXPIRATION':
      return {
        ...state,
        timeUntilExpiration: action.payload,
      };

    case 'LOGOUT':
      TokenService.clearTokens();
      return {
        ...initialState,
        isLoading: false,
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
  hasPermission: (permission: string) => boolean;
  getSessionInfo: () => any;
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
    const initializeAuth = async () => {
      console.log('[AuthContextFixed] Initializing authentication...');
      
      try {
        // Check if user is authenticated using TokenService
        if (TokenService.isAuthenticated()) {
          const userInfo = TokenService.getUserFromToken();
          
          if (userInfo) {
            console.log('[AuthContextFixed] Restoring session for user:', userInfo.email);
            
            dispatch({
              type: 'RESTORE_SESSION',
              payload: {
                user: {
                  id: userInfo.id,
                  email: userInfo.email,
                  role: userInfo.role,
                  firstName: '',
                  lastName: '',
                  avatar: '',
                  isEmailVerified: true,
                  subscription: {
                    plan: 'Free',
                    status: 'active',
                    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                  },
                  preferences: {
                    language: 'ru',
                    theme: 'system',
                    notifications: {
                      email: true,
                      push: false,
                    },
                  },
                  createdAt: new Date().toISOString(),
                  lastLoginAt: new Date().toISOString(),
                } as User
              }
            });
            
            // Set up token expiration monitoring
            const timeLeft = TokenService.getTimeUntilExpiration();
            if (timeLeft) {
              dispatch({ type: 'UPDATE_TOKEN_EXPIRATION', payload: timeLeft });
            }
          } else {
            console.log('[AuthContextFixed] Invalid token data, clearing tokens');
            dispatch({ type: 'SET_LOADING', payload: false });
          }
        } else {
          console.log('[AuthContextFixed] No valid session found');
          dispatch({ type: 'SET_LOADING', payload: false });
        }
      } catch (error) {
        console.error('[AuthContextFixed] Error initializing auth:', error);
        dispatch({ type: 'AUTH_FAILURE', payload: 'Failed to restore session' });
      }
    };

    initializeAuth();
  }, []);

  // Обновление времени до истечения токена
  useEffect(() => {
    if (!state.isAuthenticated) return;

    const updateExpirationTime = () => {
      const timeLeft = TokenService.getTimeUntilExpiration();
      dispatch({ type: 'UPDATE_TOKEN_EXPIRATION', payload: timeLeft });
      
      // Auto-refresh if needed
      if (TokenService.shouldRefreshToken()) {
        refreshToken();
      }
    };

    updateExpirationTime();
    const interval = setInterval(updateExpirationTime, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [state.isAuthenticated]);

  // Функция входа
  const login = async (credentials: LoginFormData): Promise<AuthResponse> => {
    console.log('[AuthContextFixed] Starting login process for:', credentials.email);
    dispatch({ type: 'AUTH_START' });

    try {
      const response = await authBridge.login(credentials);
      
      if (response.success && response.user && response.token && response.refreshToken) {
        // Save tokens using TokenService
        TokenService.saveTokens({
          accessToken: response.token,
          refreshToken: response.refreshToken,
          tokenType: 'Bearer',
          expiresIn: response.expiresIn || 3600,
        });
        
        dispatch({
          type: 'AUTH_SUCCESS',
          payload: { user: response.user }
        });
        
        console.log('[AuthContextFixed] Login successful for user:', response.user.email);
        
        return response;
      } else {
        const errorMessage = response.error || 'Ошибка входа';
        dispatch({ type: 'AUTH_FAILURE', payload: errorMessage });
        return { success: false, error: errorMessage };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
      console.error('[AuthContextFixed] Login error:', error);
      dispatch({ type: 'AUTH_FAILURE', payload: errorMessage });
      return { success: false, error: errorMessage };
    }
  };

  // Функция регистрации
  const register = async (userData: RegisterFormData): Promise<AuthResponse> => {
    dispatch({ type: 'AUTH_START' });

    try {
      const response = await authBridge.register(userData);
      
      if (response.success) {
        // Registration successful but don't auto-login
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
      await TokenService.logout();
      dispatch({ type: 'LOGOUT' });
      console.log('[AuthContextFixed] Logout successful');
    } catch (error) {
      console.error('[AuthContextFixed] Logout error:', error);
      // Force logout even if server call fails
      dispatch({ type: 'LOGOUT' });
    }
  };

  // Обновление токена
  const refreshToken = async (): Promise<boolean> => {
    if (!TokenService.getRefreshToken()) {
      console.log('[AuthContextFixed] No refresh token available');
      dispatch({ type: 'LOGOUT' });
      return false;
    }

    dispatch({ type: 'REFRESH_TOKEN_START' });

    try {
      // Use TokenService to refresh tokens
      const newTokens = await (new (TokenService as any)).refreshTokens();
      
      dispatch({ type: 'REFRESH_TOKEN_SUCCESS' });
      console.log('[AuthContextFixed] Token refreshed successfully');
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Token refresh failed';
      console.error('[AuthContextFixed] Token refresh failed:', errorMessage);
      dispatch({ type: 'REFRESH_TOKEN_FAILURE', payload: errorMessage });
      return false;
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

  // Восстановление пароля
  const forgotPassword = async (email: string): Promise<AuthResponse> => {
    try {
      return await authBridge.forgotPassword(email);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Ошибка отправки письма';
      return { success: false, error: errorMessage };
    }
  };

  // Сброс пароля
  const resetPassword = async (data: ResetPasswordFormData): Promise<AuthResponse> => {
    try {
      return await authBridge.resetPassword(data.token, data.password);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Ошибка сброса пароля';
      return { success: false, error: errorMessage };
    }
  };

  // Очистка ошибки
  const clearError = (): void => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  // Проверка прав доступа
  const hasPermission = (permission: string): boolean => {
    return TokenService.hasPermission(permission);
  };

  // Получение информации о сессии
  const getSessionInfo = () => {
    return TokenService.getSessionInfo();
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