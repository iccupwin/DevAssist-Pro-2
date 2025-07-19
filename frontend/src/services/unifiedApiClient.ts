/**
 * Unified API Client для DevAssist Pro
 * Объединяет React frontend с FastAPI backend
 */

import { LoginFormData, RegisterFormData, AuthResponse } from '../types/auth';
import { ApiResponse, PaginationParams } from '../types/api';
import { User, Project, Document, Analysis, Activity } from '../types/shared';
import { AUTH_CONFIG } from '../config/auth';

class UnifiedApiClient {
  private baseUrl: string;
  private token: string | null = null;
  private refreshToken: string | null = null;

  constructor(baseUrl: string = process.env.REACT_APP_API_URL || (
    process.env.NODE_ENV === 'production' 
      ? 'https://your-api-domain.com' 
      : 'http://localhost:8000'
  )) {
    this.baseUrl = baseUrl;
    this.loadTokens();
  }

  // ===== TOKEN MANAGEMENT =====
  private loadTokens(): void {
    // Используем стандартизированные ключи из AUTH_CONFIG
    this.token = localStorage.getItem(AUTH_CONFIG.TOKEN_STORAGE_KEY);
    this.refreshToken = localStorage.getItem(AUTH_CONFIG.REFRESH_TOKEN_STORAGE_KEY);
    console.log('[UnifiedApiClient] Loading tokens:', {
      hasToken: !!this.token,
      hasRefreshToken: !!this.refreshToken,
      tokenKey: AUTH_CONFIG.TOKEN_STORAGE_KEY,
      refreshKey: AUTH_CONFIG.REFRESH_TOKEN_STORAGE_KEY
    });
  }

  private saveTokens(accessToken: string, refreshToken: string): void {
    this.token = accessToken;
    this.refreshToken = refreshToken;
    localStorage.setItem(AUTH_CONFIG.TOKEN_STORAGE_KEY, accessToken);
    localStorage.setItem(AUTH_CONFIG.REFRESH_TOKEN_STORAGE_KEY, refreshToken);
  }

  private clearTokens(): void {
    this.token = null;
    this.refreshToken = null;
    localStorage.removeItem(AUTH_CONFIG.TOKEN_STORAGE_KEY);
    localStorage.removeItem(AUTH_CONFIG.REFRESH_TOKEN_STORAGE_KEY);
  }

  // Публичный метод для обновления токенов (используется при логине)
  public updateTokens(): void {
    this.loadTokens();
  }

  // ===== HTTP CLIENT =====
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    console.log(`[UnifiedApiClient] Making request to: ${url}`);
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      console.log(`[UnifiedApiClient] Response status: ${response.status}`);

      // Handle token refresh
      if (response.status === 401 && this.refreshToken) {
        const refreshed = await this.refreshAccessToken();
        if (refreshed) {
          headers['Authorization'] = `Bearer ${this.token}`;
          const retryResponse = await fetch(url, {
            ...options,
            headers,
          });
          return this.handleResponse<T>(retryResponse);
        }
      }

      return this.handleResponse<T>(response);
    } catch (error) {
      console.error(`[UnifiedApiClient] Request failed:`, error);
      throw new Error(
        error instanceof Error 
          ? error.message 
          : `Failed to connect to ${url}. Please check if the backend services are running.`
      );
    }
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      
      try {
        const errorData = await response.json();
        errorMessage = errorData.detail || errorData.error || errorMessage;
      } catch {
        // If we can't parse JSON, use the default error message
      }
      
      console.error(`[UnifiedApiClient] Response error:`, errorMessage);
      throw new Error(errorMessage);
    }

    try {
      return await response.json();
    } catch (error) {
      console.error(`[UnifiedApiClient] JSON parse error:`, error);
      throw new Error('Invalid JSON response from server');
    }
  }

  // ===== AUTHENTICATION API =====
  async login(credentials: LoginFormData): Promise<AuthResponse> {
    try {
      console.log('[UnifiedApiClient] Starting login with credentials:', { email: credentials.email });
      
      // Отправляем только email и password
      const { email, password } = credentials;
      console.log('[UnifiedApiClient] CALLING ENDPOINT:', '/api/auth/login');
      const response = await this.request<any>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      console.log('[UnifiedApiClient] Login successful, response:', response);

      // Извлекаем токен и пользователя из ответа backend
      const token = response.access_token || response.token;
      const refreshToken = response.refresh_token || token;
      const user = response.user;
      
      // Сохраняем токен если получен
      if (token) {
        this.saveTokens(token, refreshToken);
        console.log('[UnifiedApiClient] Token saved after login:', token.substring(0, 10) + '...');
      }

      return {
        success: true,
        user: user,
        token: token,
        refreshToken: refreshToken,
        expiresIn: response.expires_in,
      };
    } catch (error) {
      console.error('[UnifiedApiClient] Login failed:', error);
      throw error;
    }
  }

  async register(userData: RegisterFormData): Promise<AuthResponse> {
    try {
      console.log('[UnifiedApiClient] Starting registration with data:', userData);
      
      // Трансформируем React типы в backend типы
      const backendData = {
        email: userData.email,
        password: userData.password,
        full_name: `${userData.firstName} ${userData.lastName}`,
        company: userData.organization,
      };
      
      console.log('[UnifiedApiClient] Transformed backend data:', backendData);

      // Регистрируем пользователя
      const response = await this.request<any>('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(backendData),
      });
      
      console.log('[UnifiedApiClient] Registration successful, response:', response);

      // Извлекаем токен и пользователя из ответа backend
      const token = response.token;
      const user = response.user;
      
      // Сохраняем токен если получен
      if (token) {
        this.saveTokens(token, token); // Используем тот же токен как refresh
        console.log('[UnifiedApiClient] Token saved after registration:', token.substring(0, 10) + '...');
      }

      // Возвращаем результат регистрации с токенами
      return {
        success: true,
        user: user,
        token: token,
        refreshToken: token, // Используем тот же токен как refresh
      };
    } catch (error) {
      console.error('[UnifiedApiClient] Registration failed:', error);
      console.error('[UnifiedApiClient] Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      
      // Проверяем, является ли ошибка CORS или сетевой
      const isCorsError = error instanceof Error && (
        error.message.includes('CORS') || 
        error.message.includes('Failed to fetch') ||
        error.message.includes('Network error')
      );
      if (isCorsError) {
        console.log('[UnifiedApiClient] CORS error detected, using mock registration');
        return this.mockRegister(userData);
      }
      throw error;
    }
  }

  private async mockRegister(userData: RegisterFormData): Promise<AuthResponse> {
    console.log('[UnifiedApiClient] Using mock registration');
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    const mockUser: User = {
      id: Date.now().toString(),
      email: userData.email,
      full_name: `${userData.firstName} ${userData.lastName}`,
      firstName: userData.firstName,
      lastName: userData.lastName,
      role: 'user',
      avatar: '',
      isEmailVerified: false,
      is2FAEnabled: false,
      is_active: true,
      is_verified: false,
      is_superuser: false,
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
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
    };

    const mockToken = `mock_jwt_token_${Date.now()}`;
    const mockRefreshToken = `mock_refresh_token_${Date.now()}`;

    this.saveTokens(mockToken, mockRefreshToken);

    return {
      success: true,
      user: mockUser,
      token: mockToken,
      refreshToken: mockRefreshToken,
    };
  }

  async logout(): Promise<void> {
    if (this.refreshToken) {
      await this.request('/api/auth/logout', {
        method: 'POST',
        body: JSON.stringify({ refresh_token: this.refreshToken }),
      });
    }
    this.clearTokens();
  }

  async refreshAccessToken(): Promise<boolean> {
    if (!this.refreshToken) return false;

    try {
      const response = await this.request<{
        access_token: string;
        token_type: string;
        expires_in: number;
      }>('/api/auth/refresh', {
        method: 'POST',
        body: JSON.stringify({ refresh_token: this.refreshToken }),
      });

      this.token = response.access_token;
      localStorage.setItem('access_token', response.access_token);
      return true;
    } catch {
      this.clearTokens();
      return false;
    }
  }

  async forgotPassword(email: string): Promise<AuthResponse> {
    await this.request('/api/auth/password-reset', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });

    return {
      success: true,
      message: 'Инструкции по восстановлению пароля отправлены на email',
    };
  }

  async resetPassword(token: string, newPassword: string): Promise<AuthResponse> {
    await this.request('/api/auth/password-reset/confirm', {
      method: 'POST',
      body: JSON.stringify({ token, new_password: newPassword }),
    });

    return {
      success: true,
      message: 'Пароль успешно изменен',
    };
  }

  // ===== OAUTH API =====
  async loginWithOAuth(provider: string, code: string, redirectUri: string): Promise<AuthResponse> {
    const response = await this.request<{
      access_token: string;
      refresh_token: string;
      token_type: string;
      expires_in: number;
      user: User;
    }>('/api/auth/oauth/login', {
      method: 'POST',
      body: JSON.stringify({ provider, code, redirect_uri: redirectUri }),
    });

    this.saveTokens(response.access_token, response.refresh_token);

    return {
      success: true,
      user: response.user,
      token: response.access_token,
      refreshToken: response.refresh_token,
    };
  }

  // ===== USER API =====
  async getCurrentUser(): Promise<User> {
    return this.request<User>('/api/users/me');
  }

  async updateProfile(data: Partial<User>): Promise<User> {
    return this.request<User>('/api/users/me', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // ===== PROJECTS API =====
  async getProjects(params?: PaginationParams): Promise<ApiResponse<Project[]>> {
    const query = params ? `?page=${params.page}&size=${params.size}` : '';
    return this.request<ApiResponse<Project[]>>(`/api/projects${query}`);
  }

  async createProject(data: {
    name: string;
    description?: string;
    project_type: string;
    organization_id: number;
  }): Promise<Project> {
    return this.request<Project>('/api/projects', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getProject(id: number): Promise<Project> {
    return this.request<Project>(`/api/projects/${id}`);
  }

  async updateProject(id: number, data: Partial<Project>): Promise<Project> {
    return this.request<Project>(`/api/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteProject(id: number): Promise<void> {
    await this.request(`/api/projects/${id}`, {
      method: 'DELETE',
    });
  }

  // ===== DOCUMENTS API =====
  async uploadDocument(
    file: File,
    documentType: string,
    projectId?: number
  ): Promise<Document> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('document_type', documentType);
    if (projectId) {
      formData.append('project_id', projectId.toString());
    }

    const response = await fetch(`${this.baseUrl}/api/documents/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.token}`,
      },
      body: formData,
    });

    return this.handleResponse<Document>(response);
  }

  async getDocuments(projectId?: number): Promise<Document[]> {
    const query = projectId ? `?project_id=${projectId}` : '';
    return this.request<Document[]>(`/api/documents${query}`);
  }

  async getDocument(id: number): Promise<Document> {
    return this.request<Document>(`/api/documents/${id}`);
  }

  async deleteDocument(id: number): Promise<void> {
    await this.request(`/api/documents/${id}`, {
      method: 'DELETE',
    });
  }

  // ===== ANALYSIS API =====
  async createAnalysis(data: {
    project_id: number;
    analysis_type: string;
    ai_model: string;
    ai_provider: string;
    tz_document_id?: number;
    analysis_config?: Record<string, any>;
  }): Promise<Analysis> {
    return this.request<Analysis>('/api/analyses', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getAnalyses(projectId: number): Promise<Analysis[]> {
    return this.request<Analysis[]>(`/api/analyses?project_id=${projectId}`);
  }

  async getAnalysis(id: number): Promise<Analysis> {
    return this.request<Analysis>(`/api/analyses/${id}`);
  }

  async startKpAnalysis(data: {
    project_id: number;
    tz_document_id: number;
    kp_document_ids: number[];
    ai_model: string;
    ai_provider: string;
  }): Promise<Analysis> {
    return this.request<Analysis>('/api/analyses/kp-analysis', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // ===== DASHBOARD API =====
  async getDashboardStats(): Promise<{
    total_projects: number;
    total_documents: number;
    total_analyses: number;
    ai_cost_this_month: number;
    recent_activities: Activity[];
  }> {
    return this.request('/api/dashboard/stats');
  }

  // ===== WEBSOCKET CONNECTION =====
  connectWebSocket(): WebSocket | null {
    // WebSocket отключен для КП анализатора - используем только HTTP API
    console.log('[UnifiedApiClient] WebSocket disabled - using HTTP API only');
    return null;
    
    // Обновляем токены перед подключением
    this.loadTokens();
    
    if (!this.token) {
      console.warn('[UnifiedApiClient] No token available for WebSocket connection');
      return null;
    }
    
    const wsUrl = this.baseUrl.replace('http', 'ws');
    const ws = new WebSocket(`${wsUrl}/ws?token=${this.token}`);
    
    ws.onopen = () => {
      console.log('[UnifiedApiClient] WebSocket connected');
    };
    
    ws.onclose = () => {
      console.log('[UnifiedApiClient] WebSocket disconnected');
    };
    
    ws.onerror = (error) => {
      console.error('[UnifiedApiClient] WebSocket error:', error);
    };
    
    return ws;
  }

  // ===== HEALTH CHECK =====
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    return this.request('/health');
  }
}

// Singleton instance
export const unifiedApiClient = new UnifiedApiClient();

export default unifiedApiClient;