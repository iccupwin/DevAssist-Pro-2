/**
 * JWT Token Management Service
 * Согласно ТЗ DevAssist Pro
 */

interface TokenPayload {
  sub: string; // user ID
  email: string;
  role: string;
  permissions: string[];
  iat: number; // issued at
  exp: number; // expiration time
  jti?: string; // JWT ID
}

interface TokenPair {
  accessToken: string;
  refreshToken: string;
  tokenType: 'Bearer';
  expiresIn: number; // seconds
  scope?: string;
}

interface TokenMetadata {
  issuedAt: number;
  expiresAt: number;
  refreshExpiresAt: number;
  userId: string;
  sessionId?: string;
}

export class TokenService {
  private static readonly ACCESS_TOKEN_KEY = 'devassist_access_token';
  private static readonly REFRESH_TOKEN_KEY = 'devassist_refresh_token';
  private static readonly TOKEN_METADATA_KEY = 'devassist_token_metadata';
  private static readonly TOKEN_PREFIX = 'Bearer ';
  
  // Buffer time before token expiration to trigger refresh (5 minutes)
  private static readonly REFRESH_BUFFER_TIME = 5 * 60 * 1000;
  
  private refreshPromise: Promise<TokenPair> | null = null;
  private refreshCallbacks: Array<(success: boolean) => void> = [];

  /**
   * Сохранение токенов после успешной авторизации
   */
  static saveTokens(tokenPair: TokenPair): void {
    try {
      const { accessToken, refreshToken, expiresIn } = tokenPair;
      
      // Decode access token to get metadata
      const payload = this.decodeToken(accessToken);
      if (!payload) {
        throw new Error('Invalid access token format');
      }

      const now = Date.now();
      const metadata: TokenMetadata = {
        issuedAt: now,
        expiresAt: now + (expiresIn * 1000),
        refreshExpiresAt: now + (30 * 24 * 60 * 60 * 1000), // 30 days for refresh token
        userId: payload.sub,
        sessionId: payload.jti
      };

      // Save to localStorage with proper security considerations
      localStorage.setItem(this.ACCESS_TOKEN_KEY, accessToken);
      localStorage.setItem(this.REFRESH_TOKEN_KEY, refreshToken);
      localStorage.setItem(this.TOKEN_METADATA_KEY, JSON.stringify(metadata));

      // Security event: Tokens saved successfully with user ID, expiration time, and session ID
    } catch (error) {
      // Error: Failed to save tokens - authentication token storage operation failed
      throw new Error('Failed to save authentication tokens');
    }
  }

  /**
   * Получение access token
   */
  static getAccessToken(): string | null {
    try {
      const token = localStorage.getItem(this.ACCESS_TOKEN_KEY);
      
      if (!token) {
        return null;
      }

      // Validate token format and expiration
      if (!this.isTokenValid(token)) {
        // Warning: Access token is invalid or expired - clearing stored tokens
        this.clearTokens();
        return null;
      }

      return token;
    } catch (error) {
      // Error: Failed to retrieve access token from storage
      return null;
    }
  }

  /**
   * Получение refresh token
   */
  static getRefreshToken(): string | null {
    try {
      return localStorage.getItem(this.REFRESH_TOKEN_KEY);
    } catch (error) {
      // Error: Failed to retrieve refresh token from storage
      return null;
    }
  }

  /**
   * Получение токена с Bearer prefix
   */
  static getAuthorizationHeader(): string | null {
    const token = this.getAccessToken();
    return token ? `${this.TOKEN_PREFIX}${token}` : null;
  }

  /**
   * Получение метаданных токена
   */
  static getTokenMetadata(): TokenMetadata | null {
    try {
      const metadata = localStorage.getItem(this.TOKEN_METADATA_KEY);
      return metadata ? JSON.parse(metadata) : null;
    } catch (error) {
      // Error: Failed to retrieve or parse token metadata from storage
      return null;
    }
  }

  /**
   * Проверка валидности токена
   */
  static isTokenValid(token?: string): boolean {
    try {
      const accessToken = token || this.getAccessToken();
      
      if (!accessToken) {
        return false;
      }

      const payload = this.decodeToken(accessToken);
      if (!payload) {
        return false;
      }

      const now = Math.floor(Date.now() / 1000);
      
      // Check if token is expired
      if (payload.exp <= now) {
        // Warning: Token is expired - expiration time, current time, and expired duration logged for debugging
        return false;
      }

      return true;
    } catch (error) {
      // Error: Token validation failed due to parsing or verification error
      return false;
    }
  }

  /**
   * Проверка необходимости обновления токена
   */
  static shouldRefreshToken(): boolean {
    try {
      const metadata = this.getTokenMetadata();
      
      if (!metadata) {
        return false;
      }

      const now = Date.now();
      const timeUntilExpiration = metadata.expiresAt - now;
      
      // Refresh if token expires within buffer time
      return timeUntilExpiration <= this.REFRESH_BUFFER_TIME && timeUntilExpiration > 0;
    } catch (error) {
      // Error: Failed to determine if token refresh is needed
      return false;
    }
  }

  /**
   * Проверка истечения refresh token
   */
  static isRefreshTokenExpired(): boolean {
    try {
      const metadata = this.getTokenMetadata();
      
      if (!metadata) {
        return true;
      }

      const now = Date.now();
      return now >= metadata.refreshExpiresAt;
    } catch (error) {
      // Error: Failed to check refresh token expiration - assuming expired for security
      return true;
    }
  }

  /**
   * Обновление токенов
   */
  async refreshTokens(): Promise<TokenPair> {
    // Prevent multiple simultaneous refresh requests
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    const refreshToken = TokenService.getRefreshToken();
    
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    if (TokenService.isRefreshTokenExpired()) {
      throw new Error('Refresh token has expired');
    }

    this.refreshPromise = this.performTokenRefresh(refreshToken);

    try {
      const newTokens = await this.refreshPromise;
      
      // Save new tokens
      TokenService.saveTokens(newTokens);
      
      // Notify all waiting callbacks
      this.refreshCallbacks.forEach(callback => callback(true));
      this.refreshCallbacks = [];
      
      // Success: Tokens refreshed successfully and callbacks notified
      
      return newTokens;
    } catch (error) {
      // Error: Token refresh operation failed - clearing invalid tokens
      
      // Clear invalid tokens
      TokenService.clearTokens();
      
      // Notify all waiting callbacks of failure
      this.refreshCallbacks.forEach(callback => callback(false));
      this.refreshCallbacks = [];
      
      throw error;
    } finally {
      this.refreshPromise = null;
    }
  }

  /**
   * Выполнение запроса на обновление токена
   */
  private async performTokenRefresh(refreshToken: string): Promise<TokenPair> {
    try {
      const response = await fetch('/api/v1/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${refreshToken}`
        },
        body: JSON.stringify({
          grant_type: 'refresh_token',
          refresh_token: refreshToken
        })
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Refresh token is invalid or expired');
        }
        throw new Error(`Token refresh failed: ${response.status} ${response.statusText}`);
      }

      const tokenData = await response.json();
      
      if (!tokenData.access_token || !tokenData.refresh_token) {
        throw new Error('Invalid token response format');
      }

      return {
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        tokenType: 'Bearer',
        expiresIn: tokenData.expires_in || 3600,
        scope: tokenData.scope
      };
    } catch (error) {
      // Error: HTTP request for token refresh failed
      throw error;
    }
  }

  /**
   * Подписка на события обновления токена
   */
  onTokenRefresh(callback: (success: boolean) => void): void {
    this.refreshCallbacks.push(callback);
  }

  /**
   * Декодирование JWT токена
   */
  static decodeToken(token: string): TokenPayload | null {
    try {
      const parts = token.split('.');
      
      if (parts.length !== 3) {
        throw new Error('Invalid JWT format');
      }

      const payload = parts[1];
      const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
      
      return JSON.parse(decoded) as TokenPayload;
    } catch (error) {
      // Error: JWT token decoding failed due to invalid format or parsing error
      return null;
    }
  }

  /**
   * Получение информации о пользователе из токена
   */
  static getUserFromToken(): { id: string; email: string; role: string; permissions: string[] } | null {
    try {
      const token = this.getAccessToken();
      
      if (!token) {
        return null;
      }

      const payload = this.decodeToken(token);
      
      if (!payload) {
        return null;
      }

      return {
        id: payload.sub,
        email: payload.email,
        role: payload.role,
        permissions: payload.permissions || []
      };
    } catch (error) {
      // Error: Failed to extract user information from token
      return null;
    }
  }

  /**
   * Проверка прав доступа
   */
  static hasPermission(permission: string): boolean {
    try {
      const user = this.getUserFromToken();
      
      if (!user) {
        return false;
      }

      return user.permissions.includes(permission) || user.role === 'admin';
    } catch (error) {
      // Error: Permission check failed - denying access for security
      return false;
    }
  }

  /**
   * Получение времени до истечения токена
   */
  static getTimeUntilExpiration(): number | null {
    try {
      const metadata = this.getTokenMetadata();
      
      if (!metadata) {
        return null;
      }

      const now = Date.now();
      const timeLeft = metadata.expiresAt - now;
      
      return Math.max(0, timeLeft);
    } catch (error) {
      // Error: Failed to calculate time until token expiration
      return null;
    }
  }

  /**
   * Очистка всех токенов
   */
  static clearTokens(): void {
    try {
      localStorage.removeItem(this.ACCESS_TOKEN_KEY);
      localStorage.removeItem(this.REFRESH_TOKEN_KEY);
      localStorage.removeItem(this.TOKEN_METADATA_KEY);
      
      // Success: All authentication tokens and metadata cleared from storage
    } catch (error) {
      // Error: Failed to clear tokens from storage
    }
  }

  /**
   * Проверка авторизации пользователя
   */
  static isAuthenticated(): boolean {
    const token = this.getAccessToken();
    return token !== null && this.isTokenValid(token);
  }

  /**
   * Logout - очистка токенов и уведомление сервера
   */
  static async logout(): Promise<void> {
    try {
      const refreshToken = this.getRefreshToken();
      
      // Try to notify server about logout
      if (refreshToken) {
        try {
          await fetch('/api/v1/auth/logout', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': this.getAuthorizationHeader() || ''
            },
            body: JSON.stringify({
              refresh_token: refreshToken
            })
          });
        } catch (error) {
          // Warning: Failed to notify server about logout - proceeding with local cleanup
        }
      }
      
      // Clear tokens regardless of server response
      this.clearTokens();
      
      // Success: Logout completed - tokens cleared and server notified
    } catch (error) {
      // Error: Logout process encountered an error - still clearing tokens for security
      // Still clear tokens even if server notification fails
      this.clearTokens();
    }
  }

  /**
   * Получение информации о сессии
   */
  static getSessionInfo(): { 
    isAuthenticated: boolean; 
    user: { id: string; email: string; role: string; permissions: string[] } | null;
    expiresAt: Date | null;
    timeUntilExpiration: number | null;
  } {
    const isAuthenticated = this.isAuthenticated();
    const user = this.getUserFromToken();
    const metadata = this.getTokenMetadata();
    const timeUntilExpiration = this.getTimeUntilExpiration();
    
    return {
      isAuthenticated,
      user,
      expiresAt: metadata ? new Date(metadata.expiresAt) : null,
      timeUntilExpiration
    };
  }
}

// Create singleton instance
export const tokenService = new TokenService();

// Export types for use in other modules
export type { TokenPayload, TokenPair, TokenMetadata };