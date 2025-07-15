import { AUTH_ENDPOINTS } from '../config/auth';
import { getAuthHeaders, clearAuthData } from '../utils/authUtils';

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  acceptTerms: boolean;
}

export interface AuthResponse {
  success: boolean;
  user?: any;
  token?: string;
  refreshToken?: string;
  error?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * Сервис для работы с API аутентификации
 * TODO: Заменить mock функции на реальные API вызовы
 */
class AuthService {
  private baseURL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

  /**
   * Выполнение HTTP запроса с обработкой ошибок
   */
  private async apiRequest<T = any>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${this.baseURL}${endpoint}`;
      const headers = {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
        ...options.headers,
      };

      const response = await fetch(url, {
        ...options,
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.message || `HTTP Error: ${response.status}`,
        };
      }

      return {
        success: true,
        data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Неизвестная ошибка',
      };
    }
  }

  /**
   * Вход в систему
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    // TODO: Заменить на реальный API вызов
    return this.mockLogin(credentials);

    /* Реальная реализация:
    const response = await this.apiRequest<{
      user: any;
      token: string;
      refreshToken: string;
    }>(AUTH_ENDPOINTS.LOGIN, {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    if (response.success && response.data) {
      return {
        success: true,
        user: response.data.user,
        token: response.data.token,
        refreshToken: response.data.refreshToken,
      };
    }

    return {
      success: false,
      error: response.error || 'Ошибка входа',
    };
    */
  }

  /**
   * Регистрация нового пользователя
   */
  async register(data: RegisterData): Promise<AuthResponse> {
    // TODO: Заменить на реальный API вызов
    return this.mockRegister(data);

    /* Реальная реализация:
    const response = await this.apiRequest<{
      user: any;
      token: string;
      refreshToken: string;
    }>(AUTH_ENDPOINTS.REGISTER, {
      method: 'POST',
      body: JSON.stringify(data),
    });

    if (response.success && response.data) {
      return {
        success: true,
        user: response.data.user,
        token: response.data.token,
        refreshToken: response.data.refreshToken,
      };
    }

    return {
      success: false,
      error: response.error || 'Ошибка регистрации',
    };
    */
  }

  /**
   * Выход из системы
   */
  async logout(): Promise<ApiResponse> {
    // TODO: Заменить на реальный API вызов
    await this.mockLogout();

    /* Реальная реализация:
    const response = await this.apiRequest(AUTH_ENDPOINTS.LOGOUT, {
      method: 'POST',
    });
    */

    // Очищаем локальные данные независимо от результата API
    clearAuthData();

    return { success: true };
  }

  /**
   * Обновление токена
   */
  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    // TODO: Заменить на реальный API вызов
    return this.mockRefreshToken(refreshToken);

    /* Реальная реализация:
    const response = await this.apiRequest<{
      token: string;
      refreshToken: string;
    }>(AUTH_ENDPOINTS.REFRESH_TOKEN, {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    });

    if (response.success && response.data) {
      return {
        success: true,
        token: response.data.token,
        refreshToken: response.data.refreshToken,
      };
    }

    return {
      success: false,
      error: response.error || 'Ошибка обновления токена',
    };
    */
  }

  /**
   * Запрос на восстановление пароля
   */
  async forgotPassword(email: string): Promise<ApiResponse> {
    // TODO: Заменить на реальный API вызов
    return this.mockForgotPassword(email);

    /* Реальная реализация:
    const response = await this.apiRequest(AUTH_ENDPOINTS.FORGOT_PASSWORD, {
      method: 'POST',
      body: JSON.stringify({ email }),
    });

    return response;
    */
  }

  /**
   * Сброс пароля
   */
  async resetPassword(token: string, password: string): Promise<ApiResponse> {
    // TODO: Заменить на реальный API вызов
    return this.mockResetPassword(token, password);

    /* Реальная реализация:
    const response = await this.apiRequest(AUTH_ENDPOINTS.RESET_PASSWORD, {
      method: 'POST',
      body: JSON.stringify({ token, password }),
    });

    return response;
    */
  }

  /**
   * Получение текущего профиля пользователя
   */
  async getCurrentUser(): Promise<ApiResponse<any>> {
    const response = await this.apiRequest('/api/user/profile', {
      method: 'GET',
    });

    return response;
  }

  /**
   * Обновление профиля пользователя
   */
  async updateProfile(data: Partial<any>): Promise<ApiResponse<any>> {
    const response = await this.apiRequest('/api/user/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });

    return response;
  }

  /**
   * Изменение пароля
   */
  async changePassword(
    currentPassword: string,
    newPassword: string
  ): Promise<ApiResponse> {
    const response = await this.apiRequest('/api/user/password', {
      method: 'POST',
      body: JSON.stringify({
        currentPassword,
        newPassword,
      }),
    });

    return response;
  }

  /**
   * Проверка доступности email
   */
  async checkEmailAvailability(email: string): Promise<ApiResponse<{ available: boolean }>> {
    const response = await this.apiRequest<{ available: boolean }>('/api/auth/check-email', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });

    return response;
  }

  // Mock функции для разработки
  private async mockLogin(credentials: LoginCredentials): Promise<AuthResponse> {
    await new Promise(resolve => setTimeout(resolve, 1000));

    if (credentials.email === 'admin@devassist.ru' && credentials.password === 'Admin123!') {
      return {
        success: true,
        user: {
          id: '1',
          email: 'admin@devassist.ru',
          firstName: 'Александр',
          lastName: 'Петров',
          role: 'admin',
          avatar: '',
          isEmailVerified: true,
          subscription: {
            plan: 'Professional',
            status: 'active',
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          },
          preferences: {
            language: 'ru',
            theme: 'system',
            notifications: {
              email: true,
              push: true,
            },
          },
          createdAt: '2024-01-15T00:00:00Z',
          lastLoginAt: new Date().toISOString(),
        },
        token: 'mock_jwt_token_' + Date.now(),
        refreshToken: 'mock_refresh_token_' + Date.now(),
      };
    }

    if (credentials.email === 'user@devassist.ru' && credentials.password === 'User123!') {
      return {
        success: true,
        user: {
          id: '2',
          email: 'user@devassist.ru',
          firstName: 'Мария',
          lastName: 'Иванова',
          role: 'user',
          avatar: '',
          isEmailVerified: true,
          subscription: {
            plan: 'Free',
            status: 'active',
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          },
          preferences: {
            language: 'ru',
            theme: 'light',
            notifications: {
              email: true,
              push: false,
            },
          },
          createdAt: '2024-02-01T00:00:00Z',
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
  }

  private async mockRegister(data: RegisterData): Promise<AuthResponse> {
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Проверяем, не существует ли уже такой email
    if (data.email === 'admin@devassist.ru' || data.email === 'user@devassist.ru') {
      return {
        success: false,
        error: 'Пользователь с таким email уже существует',
      };
    }

    return {
      success: true,
      user: {
        id: Date.now().toString(),
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        role: 'user',
        avatar: '',
        isEmailVerified: false,
        subscription: {
          plan: 'Free',
          status: 'active',
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
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
      },
      token: 'mock_jwt_token_' + Date.now(),
      refreshToken: 'mock_refresh_token_' + Date.now(),
    };
  }

  private async mockLogout(): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  private async mockRefreshToken(refreshToken: string): Promise<AuthResponse> {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return {
      success: true,
      token: 'mock_jwt_token_' + Date.now(),
      refreshToken: 'mock_refresh_token_' + Date.now(),
    };
  }

  private async mockForgotPassword(email: string): Promise<ApiResponse> {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return {
      success: true,
      message: 'Инструкции по восстановлению пароля отправлены на ваш email',
    };
  }

  private async mockResetPassword(token: string, password: string): Promise<ApiResponse> {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return {
      success: true,
      message: 'Пароль успешно изменен',
    };
  }
}

// Экспортируем singleton экземпляр
export const authService = new AuthService();
export default authService;