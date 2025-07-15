/**
 * Comprehensive JWT Token Management Service
 * Handles token storage, validation, refresh, and security
 */

export interface TokenData {
  accessToken: string;
  refreshToken?: string;
  expiresAt: number;
  tokenType: 'Bearer';
  scope?: string;
}

export interface TokenManagerConfig {
  storageType: 'localStorage' | 'sessionStorage' | 'memory';
  refreshThreshold: number; // Minutes before expiry to refresh
  maxRefreshRetries: number;
  enableAutoRefresh: boolean;
}

const DEFAULT_CONFIG: TokenManagerConfig = {
  storageType: 'localStorage',
  refreshThreshold: 5, // Refresh 5 minutes before expiry
  maxRefreshRetries: 3,
  enableAutoRefresh: true
};

export class TokenManager {
  private static instance: TokenManager;
  private config: TokenManagerConfig;
  private refreshTimeout: NodeJS.Timeout | null = null;
  private refreshPromise: Promise<TokenData | null> | null = null;
  private refreshCallbacks: Set<(token: TokenData | null) => void> = new Set();
  private storage: Storage | Map<string, string>;

  private constructor(config: Partial<TokenManagerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.storage = this.getStorage();
    this.scheduleTokenRefresh();
  }

  static getInstance(config?: Partial<TokenManagerConfig>): TokenManager {
    if (!TokenManager.instance) {
      TokenManager.instance = new TokenManager(config);
    }
    return TokenManager.instance;
  }

  private getStorage(): Storage | Map<string, string> {
    if (this.config.storageType === 'memory') {
      return new Map<string, string>();
    }
    
    if (typeof window !== 'undefined') {
      return this.config.storageType === 'localStorage' 
        ? window.localStorage 
        : window.sessionStorage;
    }
    
    // Fallback for SSR
    return new Map<string, string>();
  }

  /**
   * Store token data securely
   */
  setToken(tokenData: TokenData): void {
    try {
      const serializedData = JSON.stringify({
        ...tokenData,
        storedAt: Date.now()
      });

      if (this.storage instanceof Map) {
        this.storage.set('auth_token', serializedData);
      } else {
        this.storage.setItem('auth_token', serializedData);
      }

      this.scheduleTokenRefresh();
      this.notifyRefreshCallbacks(tokenData);
    } catch (error) {
      console.error('Failed to store token:', error);
    }
  }

  /**
   * Retrieve stored token data
   */
  getToken(): TokenData | null {
    try {
      const serializedData = this.storage instanceof Map
        ? this.storage.get('auth_token')
        : this.storage.getItem('auth_token');

      if (!serializedData) {
        return null;
      }

      const tokenData = JSON.parse(serializedData);
      
      // Check if token is expired
      if (this.isTokenExpired(tokenData)) {
        this.clearToken();
        return null;
      }

      return tokenData;
    } catch (error) {
      console.error('Failed to retrieve token:', error);
      this.clearToken();
      return null;
    }
  }

  /**
   * Get access token string for API calls
   */
  getAccessToken(): string | null {
    const tokenData = this.getToken();
    return tokenData?.accessToken || null;
  }

  /**
   * Get authorization header for API calls
   */
  getAuthHeader(): { Authorization: string } | {} {
    const token = this.getAccessToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  /**
   * Check if token exists and is valid
   */
  isAuthenticated(): boolean {
    const tokenData = this.getToken();
    return tokenData !== null && !this.isTokenExpired(tokenData);
  }

  /**
   * Check if token is expired
   */
  private isTokenExpired(tokenData: TokenData): boolean {
    if (!tokenData.expiresAt) {
      return false; // If no expiry, assume it's valid
    }
    
    return Date.now() >= tokenData.expiresAt;
  }

  /**
   * Check if token needs refresh
   */
  private shouldRefreshToken(tokenData: TokenData): boolean {
    if (!tokenData.expiresAt || !this.config.enableAutoRefresh) {
      return false;
    }

    const refreshTime = tokenData.expiresAt - (this.config.refreshThreshold * 60 * 1000);
    return Date.now() >= refreshTime;
  }

  /**
   * Clear stored token
   */
  clearToken(): void {
    try {
      if (this.storage instanceof Map) {
        this.storage.delete('auth_token');
      } else {
        this.storage.removeItem('auth_token');
      }

      if (this.refreshTimeout) {
        clearTimeout(this.refreshTimeout);
        this.refreshTimeout = null;
      }

      this.notifyRefreshCallbacks(null);
    } catch (error) {
      console.error('Failed to clear token:', error);
    }
  }

  /**
   * Refresh token using refresh token
   */
  async refreshToken(): Promise<TokenData | null> {
    // Prevent multiple simultaneous refresh attempts
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    const currentToken = this.getToken();
    if (!currentToken?.refreshToken) {
      this.clearToken();
      return null;
    }

    this.refreshPromise = this.performTokenRefresh(currentToken.refreshToken);
    
    try {
      const newToken = await this.refreshPromise;
      return newToken;
    } finally {
      this.refreshPromise = null;
    }
  }

  /**
   * Perform the actual token refresh API call
   */
  private async performTokenRefresh(refreshToken: string): Promise<TokenData | null> {
    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        throw new Error(`Token refresh failed: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success && data.token) {
        const newTokenData: TokenData = {
          accessToken: data.token.accessToken,
          refreshToken: data.token.refreshToken || refreshToken,
          expiresAt: data.token.expiresAt || (Date.now() + (60 * 60 * 1000)), // 1 hour default
          tokenType: 'Bearer',
          scope: data.token.scope
        };

        this.setToken(newTokenData);
        return newTokenData;
      } else {
        throw new Error(data.message || 'Token refresh failed');
      }
    } catch (error) {
      console.error('Token refresh error:', error);
      this.clearToken();
      return null;
    }
  }

  /**
   * Schedule automatic token refresh
   */
  private scheduleTokenRefresh(): void {
    if (this.refreshTimeout) {
      clearTimeout(this.refreshTimeout);
    }

    if (!this.config.enableAutoRefresh) {
      return;
    }

    const tokenData = this.getToken();
    if (!tokenData?.expiresAt) {
      return;
    }

    const refreshTime = tokenData.expiresAt - (this.config.refreshThreshold * 60 * 1000);
    const delay = Math.max(0, refreshTime - Date.now());

    this.refreshTimeout = setTimeout(async () => {
      console.log('Auto-refreshing token...');
      await this.refreshToken();
    }, delay);
  }

  /**
   * Register callback for token changes
   */
  onTokenChange(callback: (token: TokenData | null) => void): () => void {
    this.refreshCallbacks.add(callback);
    
    // Return unsubscribe function
    return () => {
      this.refreshCallbacks.delete(callback);
    };
  }

  /**
   * Notify all registered callbacks about token changes
   */
  private notifyRefreshCallbacks(token: TokenData | null): void {
    this.refreshCallbacks.forEach(callback => {
      try {
        callback(token);
      } catch (error) {
        console.error('Token change callback error:', error);
      }
    });
  }

  /**
   * Validate token with backend
   */
  async validateToken(): Promise<boolean> {
    const token = this.getAccessToken();
    if (!token) {
      return false;
    }

    try {
      const response = await fetch('/api/auth/me', {
        headers: this.getAuthHeader(),
      });

      if (response.ok) {
        return true;
      } else if (response.status === 401) {
        // Try to refresh token
        const refreshed = await this.refreshToken();
        return refreshed !== null;
      } else {
        return false;
      }
    } catch (error) {
      console.error('Token validation error:', error);
      return false;
    }
  }

  /**
   * Get token expiry information
   */
  getTokenInfo(): {
    isValid: boolean;
    expiresAt: number | null;
    expiresIn: number | null; // milliseconds
    needsRefresh: boolean;
  } {
    const tokenData = this.getToken();
    
    if (!tokenData) {
      return {
        isValid: false,
        expiresAt: null,
        expiresIn: null,
        needsRefresh: false
      };
    }

    const isValid = !this.isTokenExpired(tokenData);
    const expiresIn = tokenData.expiresAt ? tokenData.expiresAt - Date.now() : null;
    const needsRefresh = this.shouldRefreshToken(tokenData);

    return {
      isValid,
      expiresAt: tokenData.expiresAt,
      expiresIn,
      needsRefresh
    };
  }

  /**
   * Create token from login response
   */
  static createTokenData(loginResponse: any): TokenData {
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

  /**
   * Initialize token manager from stored data
   */
  static async initialize(config?: Partial<TokenManagerConfig>): Promise<TokenManager> {
    const manager = TokenManager.getInstance(config);
    
    // Validate stored token on initialization
    const hasValidToken = await manager.validateToken();
    
    if (!hasValidToken) {
      manager.clearToken();
    }

    return manager;
  }

  /**
   * Cleanup token manager
   */
  destroy(): void {
    if (this.refreshTimeout) {
      clearTimeout(this.refreshTimeout);
    }
    this.refreshCallbacks.clear();
    this.refreshPromise = null;
  }
}

// Export singleton instance
export const tokenManager = TokenManager.getInstance();
export default tokenManager;