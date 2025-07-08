/**
 * Unified API Client для DevAssist Pro
 * Объединяет React frontend с FastAPI backend
 */

import { LoginFormData, RegisterFormData, AuthResponse } from '../types/auth';
import { ApiResponse, PaginationParams } from '../types/api';
import { User, Project, Document, Analysis } from '../types/shared';

class UnifiedApiClient {
  private baseUrl: string;
  private token: string | null = null;
  private refreshToken: string | null = null;

  constructor(baseUrl: string = 'http://localhost:8000') {
    this.baseUrl = baseUrl;
    this.loadTokens();
  }

  // ===== TOKEN MANAGEMENT =====
  private loadTokens(): void {
    this.token = localStorage.getItem('access_token');
    this.refreshToken = localStorage.getItem('refresh_token');
  }

  private saveTokens(accessToken: string, refreshToken: string): void {
    this.token = accessToken;
    this.refreshToken = refreshToken;
    localStorage.setItem('access_token', accessToken);
    localStorage.setItem('refresh_token', refreshToken);
  }

  private clearTokens(): void {
    this.token = null;
    this.refreshToken = null;
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  }

  // ===== HTTP CLIENT =====
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

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
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const error = await response.json().catch(() => ({
        error: 'Network error',
        details: { status: response.status, statusText: response.statusText }
      }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // ===== AUTHENTICATION API =====
  async login(credentials: LoginFormData): Promise<AuthResponse> {
    const response = await this.request<{
      access_token: string;
      refresh_token: string;
      token_type: string;
      expires_in: number;
      user: User;
    }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    this.saveTokens(response.access_token, response.refresh_token);

    return {
      success: true,
      user: response.user,
      token: response.access_token,
      refreshToken: response.refresh_token,
    };
  }

  async register(userData: RegisterFormData): Promise<AuthResponse> {
    // Трансформируем React типы в backend типы
    const backendData = {
      email: userData.email,
      password: userData.password,
      full_name: `${userData.firstName} ${userData.lastName}`,
      company: userData.organization,
    };

    const response = await this.request<{
      access_token: string;
      refresh_token: string;
      token_type: string;
      expires_in: number;
      user: User;
    }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(backendData),
    });

    this.saveTokens(response.access_token, response.refresh_token);

    return {
      success: true,
      user: response.user,
      token: response.access_token,
      refreshToken: response.refresh_token,
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
    await this.request('/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });

    return {
      success: true,
      message: 'Инструкции по восстановлению пароля отправлены на email',
    };
  }

  async resetPassword(token: string, newPassword: string): Promise<AuthResponse> {
    await this.request('/api/auth/reset-password', {
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
    recent_activities: Array<{
      id: number;
      type: string;
      description: string;
      created_at: string;
    }>;
  }> {
    return this.request('/api/dashboard/stats');
  }

  // ===== WEBSOCKET CONNECTION =====
  connectWebSocket(): WebSocket {
    const wsUrl = this.baseUrl.replace('http', 'ws');
    const ws = new WebSocket(`${wsUrl}/ws?token=${this.token}`);
    
    ws.onopen = () => {
      console.log('WebSocket connected');
    };
    
    ws.onclose = () => {
      console.log('WebSocket disconnected');
    };
    
    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
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