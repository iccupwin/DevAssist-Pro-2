/**
 * Enhanced Authentication Service with Token Management
 * Handles authentication, user profile, and persistent sessions
 */

import { tokenManager, TokenData } from './tokenManager';

export interface User {
  id: string;
  email: string;
  name: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  role: 'user' | 'admin' | 'manager';
  company?: string;
  department?: string;
  phone?: string;
  verified: boolean;
  createdAt: string;
  lastLogin?: string;
  preferences?: UserPreferences;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  language: 'ru' | 'en';
  timezone: string;
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
  dashboard: {
    layout: 'grid' | 'list';
    modules: string[];
  };
}

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  firstName?: string;
  lastName?: string;
  company?: string;
  department?: string;
  phone?: string;
}

export interface AuthResponse {
  success: boolean;
  user?: User;
  token?: {
    accessToken: string;
    refreshToken: string;
    expiresAt: string;
    expiresIn: number;
  };
  message?: string;
  error?: string;
}

export interface PasswordResetData {
  email: string;
}

export interface PasswordChangeData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export class EnhancedAuthService {
  private static instance: EnhancedAuthService;
  private baseURL: string;
  private currentUser: User | null = null;
  private userCallbacks: Set<(user: User | null) => void> = new Set();

  private constructor() {
    this.baseURL = process.env.REACT_APP_API_URL || '/api';
    this.initializeTokenListener();
  }

  static getInstance(): EnhancedAuthService {
    if (!EnhancedAuthService.instance) {
      EnhancedAuthService.instance = new EnhancedAuthService();
    }
    return EnhancedAuthService.instance;
  }

  /**
   * Initialize token change listener
   */
  private initializeTokenListener(): void {
    tokenManager.onTokenChange((token) => {
      if (!token) {
        this.currentUser = null;
        this.notifyUserCallbacks(null);
      }
    });
  }

  /**
   * Login with credentials
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const response = await fetch(`${this.baseURL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        if (data.token) {
          const tokenData = this.createTokenData(data.token);
          tokenManager.setToken(tokenData);
        }

        if (data.user) {
          this.currentUser = data.user;
          this.notifyUserCallbacks(data.user);
        }

        return data;
      } else {
        return {
          success: false,
          error: data.message || 'Login failed',
        };
      }
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  /**
   * Register new user
   */
  async register(userData: RegisterData): Promise<AuthResponse> {
    try {
      const response = await fetch(`${this.baseURL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        if (data.token) {
          const tokenData = this.createTokenData(data.token);
          tokenManager.setToken(tokenData);
        }

        if (data.user) {
          this.currentUser = data.user;
          this.notifyUserCallbacks(data.user);
        }

        return data;
      } else {
        return {
          success: false,
          error: data.message || 'Registration failed',
        };
      }
    } catch (error) {
      console.error('Registration error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    try {
      const token = tokenManager.getAccessToken();
      
      if (token) {
        await fetch(`${this.baseURL}/auth/logout`, {
          method: 'POST',
          headers: {
            ...tokenManager.getAuthHeader(),
            'Content-Type': 'application/json',
          },
        });
      }
    } catch (error) {
      console.error('Logout API error:', error);
    } finally {
      // Clear local state regardless of API call success
      tokenManager.clearToken();
      this.currentUser = null;
      this.notifyUserCallbacks(null);
    }
  }

  /**
   * Get current user profile
   */
  async getCurrentUser(): Promise<User | null> {
    // Return cached user if available
    if (this.currentUser) {
      return this.currentUser;
    }

    // Check if we have a valid token
    if (!tokenManager.isAuthenticated()) {
      return null;
    }

    try {
      const response = await fetch(`${this.baseURL}/auth/me`, {
        headers: tokenManager.getAuthHeader(),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.user) {
          this.currentUser = data.user;
          this.notifyUserCallbacks(data.user);
          return data.user;
        }
      } else if (response.status === 401) {
        // Token might be expired, try to refresh
        const refreshed = await tokenManager.refreshToken();
        if (refreshed) {
          // Retry with new token
          return this.getCurrentUser();
        } else {
          // Refresh failed, clear auth state
          await this.logout();
        }
      }
    } catch (error) {
      console.error('Get current user error:', error);
    }

    return null;
  }

  /**
   * Update user profile
   */
  async updateProfile(updates: Partial<User>): Promise<AuthResponse> {
    try {
      const response = await fetch(`${this.baseURL}/auth/profile`, {
        method: 'PUT',
        headers: {
          ...tokenManager.getAuthHeader(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        if (data.user) {
          this.currentUser = data.user;
          this.notifyUserCallbacks(data.user);
        }
        return data;
      } else {
        return {
          success: false,
          error: data.message || 'Profile update failed',
        };
      }
    } catch (error) {
      console.error('Profile update error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  /**
   * Change password
   */
  async changePassword(passwordData: PasswordChangeData): Promise<AuthResponse> {
    try {
      const response = await fetch(`${this.baseURL}/auth/change-password`, {
        method: 'POST',
        headers: {
          ...tokenManager.getAuthHeader(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(passwordData),
      });

      const data = await response.json();

      return {
        success: response.ok && data.success,
        message: data.message,
        error: data.error || (!response.ok ? 'Password change failed' : undefined),
      };
    } catch (error) {
      console.error('Password change error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  /**
   * Request password reset
   */
  async requestPasswordReset(data: PasswordResetData): Promise<AuthResponse> {
    try {
      const response = await fetch(`${this.baseURL}/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const responseData = await response.json();

      return {
        success: response.ok && responseData.success,
        message: responseData.message,
        error: responseData.error || (!response.ok ? 'Password reset request failed' : undefined),
      };
    } catch (error) {
      console.error('Password reset request error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  /**
   * Verify email
   */
  async verifyEmail(token: string): Promise<AuthResponse> {
    try {
      const response = await fetch(`${this.baseURL}/auth/verify-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });

      const data = await response.json();

      if (response.ok && data.success && data.user) {
        this.currentUser = data.user;
        this.notifyUserCallbacks(data.user);
      }

      return {
        success: response.ok && data.success,
        user: data.user,
        message: data.message,
        error: data.error || (!response.ok ? 'Email verification failed' : undefined),
      };
    } catch (error) {
      console.error('Email verification error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  /**
   * Social login (Google, Yandex, VK)
   */
  async socialLogin(provider: string, code: string): Promise<AuthResponse> {
    try {
      const response = await fetch(`${this.baseURL}/auth/social/${provider}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        if (data.token) {
          const tokenData = this.createTokenData(data.token);
          tokenManager.setToken(tokenData);
        }

        if (data.user) {
          this.currentUser = data.user;
          this.notifyUserCallbacks(data.user);
        }

        return data;
      } else {
        return {
          success: false,
          error: data.message || 'Social login failed',
        };
      }
    } catch (error) {
      console.error('Social login error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return tokenManager.isAuthenticated() && this.currentUser !== null;
  }

  /**
   * Get cached user (synchronous)
   */
  getUser(): User | null {
    return this.currentUser;
  }

  /**
   * Initialize auth state from stored token
   */
  async initializeAuth(): Promise<User | null> {
    if (!tokenManager.isAuthenticated()) {
      return null;
    }

    try {
      return await this.getCurrentUser();
    } catch (error) {
      console.error('Auth initialization error:', error);
      await this.logout();
      return null;
    }
  }

  /**
   * Register callback for user changes
   */
  onUserChange(callback: (user: User | null) => void): () => void {
    this.userCallbacks.add(callback);
    
    // Return unsubscribe function
    return () => {
      this.userCallbacks.delete(callback);
    };
  }

  /**
   * Notify all registered callbacks about user changes
   */
  private notifyUserCallbacks(user: User | null): void {
    this.userCallbacks.forEach(callback => {
      try {
        callback(user);
      } catch (error) {
        console.error('User change callback error:', error);
      }
    });
  }

  /**
   * Upload user avatar
   */
  async uploadAvatar(file: File): Promise<AuthResponse> {
    try {
      const formData = new FormData();
      formData.append('avatar', file);

      const response = await fetch(`${this.baseURL}/auth/avatar`, {
        method: 'POST',
        headers: tokenManager.getAuthHeader(),
        body: formData,
      });

      const data = await response.json();

      if (response.ok && data.success) {
        if (data.user) {
          this.currentUser = data.user;
          this.notifyUserCallbacks(data.user);
        }
        return data;
      } else {
        return {
          success: false,
          error: data.message || 'Avatar upload failed',
        };
      }
    } catch (error) {
      console.error('Avatar upload error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  /**
   * Get authentication status info
   */
  getAuthStatus(): {
    isAuthenticated: boolean;
    user: User | null;
    tokenInfo: ReturnType<typeof tokenManager.getTokenInfo>;
  } {
    return {
      isAuthenticated: this.isAuthenticated(),
      user: this.currentUser,
      tokenInfo: tokenManager.getTokenInfo(),
    };
  }

  /**
   * Refresh authentication state
   */
  async refreshAuth(): Promise<User | null> {
    const refreshed = await tokenManager.refreshToken();
    if (refreshed) {
      return await this.getCurrentUser();
    }
    return null;
  }

  /**
   * Create token data from login response
   */
  private createTokenData(loginResponse: any): TokenData {
    const expiresAt = loginResponse.expiresAt 
      ? new Date(loginResponse.expiresAt).getTime()
      : Date.now() + (loginResponse.expiresIn ? loginResponse.expiresIn * 1000 : 60 * 60 * 1000);

    return {
      accessToken: loginResponse.accessToken || loginResponse.token,
      refreshToken: loginResponse.refreshToken,
      expiresAt,
      tokenType: 'Bearer',
      scope: loginResponse.scope
    };
  }
}

// Export singleton instance
export const enhancedAuthService = EnhancedAuthService.getInstance();
export default enhancedAuthService;