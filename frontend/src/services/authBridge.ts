/**
 * Authentication Bridge
 * Объединяет React frontend authentication с FastAPI JWT backend
 */

import { integrationService } from './integrationService';
import { LoginFormData, RegisterFormData, AuthResponse } from '../types/auth';
import { User, TokenPayload } from '../types/shared';

class AuthBridge {
  private tokenRefreshInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.setupTokenRefresh();
  }

  // ===== TOKEN MANAGEMENT =====
  private setupTokenRefresh(): void {
    // Проверяем токен каждые 5 минут
    this.tokenRefreshInterval = setInterval(async () => {
      await this.checkAndRefreshToken();
    }, 5 * 60 * 1000);
  }

  private async checkAndRefreshToken(): Promise<void> {
    const token = this.getStoredToken();
    if (!token) return;

    try {
      const payload = this.decodeToken(token);
      if (!payload || !payload.exp) return;

      const now = Math.floor(Date.now() / 1000);
      const timeUntilExpiry = payload.exp - now;

      // Если токен истекает в течение 10 минут, обновляем его
      if (timeUntilExpiry < 600) {
        await integrationService.refreshUserToken();
      }
    } catch (error) {
      console.error('Error checking token:', error);
    }
  }

  private getStoredToken(): string | null {
    return localStorage.getItem('access_token');
  }

  private decodeToken(token: string): TokenPayload | null {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload;
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  }

  // ===== AUTHENTICATION METHODS =====
  async login(credentials: LoginFormData): Promise<AuthResponse> {
    try {
      const response = await integrationService.authenticateUser(credentials);
      
      if (response.success && response.user) {
        this.setupTokenRefresh();
        this.trackUserActivity('login');
      }
      
      return response;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Login failed'
      };
    }
  }

  async register(userData: RegisterFormData): Promise<AuthResponse> {
    try {
      const response = await integrationService.registerUser(userData);
      
      if (response.success && response.user) {
        this.setupTokenRefresh();
        this.trackUserActivity('register');
      }
      
      return response;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Registration failed'
      };
    }
  }

  async logout(): Promise<void> {
    try {
      await integrationService.logoutUser();
      this.cleanup();
      this.trackUserActivity('logout');
    } catch (error) {
      console.error('Logout error:', error);
    }
  }

  async refreshToken(): Promise<boolean> {
    try {
      const success = await integrationService.refreshUserToken();
      if (success) {
        this.trackUserActivity('token_refresh');
      }
      return success;
    } catch (error) {
      console.error('Token refresh error:', error);
      return false;
    }
  }

  // ===== OAUTH INTEGRATION =====
  async handleOAuthCallback(provider: string, code: string): Promise<AuthResponse> {
    try {
      const redirectUri = `${window.location.origin}/auth/callback/${provider}`;
      const response = await integrationService.handleOAuthCallback(provider, code, redirectUri);
      
      if (response.success && response.user) {
        this.setupTokenRefresh();
        this.trackUserActivity('oauth_login', { provider });
      }
      
      return response;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'OAuth login failed'
      };
    }
  }

  generateOAuthUrl(provider: string): string {
    const redirectUri = `${window.location.origin}/auth/callback/${provider}`;
    const state = this.generateRandomState();
    
    // Сохраняем state для проверки безопасности
    sessionStorage.setItem(`oauth_state_${provider}`, state);
    
    const configs = {
      google: {
        clientId: process.env.REACT_APP_GOOGLE_CLIENT_ID,
        baseUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
        scope: 'email profile openid',
      },
      yandex: {
        clientId: process.env.REACT_APP_YANDEX_CLIENT_ID,
        baseUrl: 'https://oauth.yandex.ru/authorize',
        scope: 'login:email login:info',
      },
      microsoft: {
        clientId: process.env.REACT_APP_MICROSOFT_CLIENT_ID,
        baseUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
        scope: 'openid email profile',
      },
    };
    
    const config = configs[provider as keyof typeof configs];
    if (!config) {
      throw new Error(`Unsupported OAuth provider: ${provider}`);
    }
    
    const params = new URLSearchParams({
      client_id: config.clientId || '',
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: config.scope,
      state,
    });
    
    return `${config.baseUrl}?${params.toString()}`;
  }

  private generateRandomState(): string {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  }

  // ===== USER MANAGEMENT =====
  async getCurrentUser(): Promise<User | null> {
    try {
      const user = await integrationService.getUserProfile();
      return user;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  async updateUserProfile(data: Partial<User>): Promise<User | null> {
    try {
      const user = await integrationService.updateUserProfile(data);
      if (user) {
        this.trackUserActivity('profile_update');
      }
      return user;
    } catch (error) {
      console.error('Error updating user profile:', error);
      return null;
    }
  }

  // ===== PASSWORD MANAGEMENT =====
  async forgotPassword(email: string): Promise<AuthResponse> {
    try {
      // Вызываем API для сброса пароля
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });
      
      if (response.ok) {
        return {
          success: true,
          message: 'Инструкции по восстановлению пароля отправлены на email',
        };
      } else {
        const error = await response.json();
        return {
          success: false,
          error: error.error || 'Ошибка при отправке письма',
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  async resetPassword(token: string, newPassword: string): Promise<AuthResponse> {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, new_password: newPassword }),
      });
      
      if (response.ok) {
        return {
          success: true,
          message: 'Пароль успешно изменен',
        };
      } else {
        const error = await response.json();
        return {
          success: false,
          error: error.error || 'Ошибка при изменении пароля',
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  // ===== SESSION MANAGEMENT =====
  isAuthenticated(): boolean {
    const token = this.getStoredToken();
    if (!token) return false;
    
    const payload = this.decodeToken(token);
    if (!payload || !payload.exp) return false;
    
    const now = Math.floor(Date.now() / 1000);
    return payload.exp > now;
  }

  getSessionInfo(): { user: User | null; expiresAt: number | null } {
    const token = this.getStoredToken();
    if (!token) return { user: null, expiresAt: null };
    
    const payload = this.decodeToken(token);
    if (!payload) return { user: null, expiresAt: null };
    
    return {
      user: null, // Пользователь загружается отдельно
      expiresAt: payload.exp ? payload.exp * 1000 : null,
    };
  }

  // ===== ACTIVITY TRACKING =====
  private trackUserActivity(activity: string, metadata?: Record<string, any>): void {
    try {
      // Отправляем активность через WebSocket
      integrationService.subscribeToEvent('activity', () => {
        // Обработка активности
      });
    } catch (error) {
      console.error('Error tracking user activity:', error);
    }
  }

  // ===== ERROR HANDLING =====
  handleAuthError(error: any): AuthResponse {
    let errorMessage = 'Authentication error';
    
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'string') {
      errorMessage = error;
    } else if (error.error) {
      errorMessage = error.error;
    }
    
    // Логируем ошибку
    integrationService.handleError(error, 'authentication');
    
    return {
      success: false,
      error: errorMessage,
    };
  }

  // ===== CLEANUP =====
  cleanup(): void {
    if (this.tokenRefreshInterval) {
      clearInterval(this.tokenRefreshInterval);
      this.tokenRefreshInterval = null;
    }
  }
}

// Singleton instance
export const authBridge = new AuthBridge();

export default authBridge;