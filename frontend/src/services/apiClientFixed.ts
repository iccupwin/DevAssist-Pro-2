/**
 * Fixed API Client with proper token management
 * Исправленный API клиент с корректным управлением токенами
 */

import { TokenService } from './tokenService';

export interface ApiResponse<T = any> {
  data: T;
  success: boolean;
  message?: string;
  status: number;
}

export interface ApiError {
  message: string;
  status: number;
  code?: string;
  details?: any;
}

export class ApiClientError extends Error {
  public readonly status: number;
  public readonly code?: string;
  public readonly details?: any;

  constructor(error: ApiError) {
    super(error.message);
    this.name = 'ApiClientError';
    this.status = error.status;
    this.code = error.code;
    this.details = error.details;
  }
}

class ApiClient {
  private baseURL: string;
  private timeout: number;
  private defaultHeaders: Record<string, string>;

  constructor(
    baseURL: string = process.env.REACT_APP_API_URL || 'http://localhost:8000',
    timeout: number = 30000
  ) {
    this.baseURL = baseURL.replace(/\/$/, ''); // Remove trailing slash
    this.timeout = timeout;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
  }

  /**
   * Получение заголовков для запроса
   */
  private getHeaders(customHeaders: Record<string, string> = {}): Record<string, string> {
    const headers = { ...this.defaultHeaders, ...customHeaders };

    // Add authorization header if token exists
    const authHeader = TokenService.getAuthorizationHeader();
    if (authHeader) {
      headers.Authorization = authHeader;
    }

    return headers;
  }

  /**
   * Выполнение HTTP запроса с автоматическим обновлением токена
   */
  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    const headers = this.getHeaders(options.headers as Record<string, string>);

    // Setup timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Handle 401 Unauthorized - try to refresh token
      if (response.status === 401 && TokenService.getRefreshToken()) {
        console.log('[ApiClient] Received 401, attempting token refresh...');
        
        try {
          // Try to refresh token
          const tokenService = new (TokenService as any)();
          await tokenService.refreshTokens();
          
          console.log('[ApiClient] Token refreshed, retrying request...');
          
          // Retry request with new token
          const newHeaders = this.getHeaders(options.headers as Record<string, string>);
          const retryResponse = await fetch(url, {
            ...options,
            headers: newHeaders,
          });

          return this.handleResponse<T>(retryResponse);
        } catch (refreshError) {
          console.error('[ApiClient] Token refresh failed:', refreshError);
          
          // Clear tokens and redirect to login
          TokenService.clearTokens();
          window.location.href = '/login';
          
          throw new ApiClientError({
            message: 'Authentication failed',
            status: 401,
            code: 'AUTH_FAILED'
          });
        }
      }

      return this.handleResponse<T>(response);
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof ApiClientError) {
        throw error;
      }

      // Handle network errors
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new ApiClientError({
            message: 'Request timeout',
            status: 408,
            code: 'TIMEOUT'
          });
        }

        throw new ApiClientError({
          message: `Network error: ${error.message}`,
          status: 0,
          code: 'NETWORK_ERROR'
        });
      }

      throw new ApiClientError({
        message: 'Unknown error occurred',
        status: 500,
        code: 'UNKNOWN_ERROR'
      });
    }
  }

  /**
   * Обработка ответа от сервера
   */
  private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
    let data: any;
    
    try {
      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }
    } catch (error) {
      console.warn('[ApiClient] Failed to parse response body:', error);
      data = null;
    }

    if (!response.ok) {
      const errorMessage = data?.message || data?.error || `HTTP ${response.status}: ${response.statusText}`;
      
      throw new ApiClientError({
        message: errorMessage,
        status: response.status,
        code: data?.code || data?.error_code,
        details: data
      });
    }

    return {
      data: data,
      success: true,
      message: data?.message,
      status: response.status
    };
  }

  /**
   * GET запрос
   */
  async get<T>(endpoint: string, params?: Record<string, any>): Promise<ApiResponse<T>> {
    let url = endpoint;

    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });

      if (searchParams.toString()) {
        url += `?${searchParams.toString()}`;
      }
    }

    return this.makeRequest<T>(url, {
      method: 'GET',
    });
  }

  /**
   * POST запрос
   */
  async post<T>(endpoint: string, data?: any, options: { headers?: Record<string, string> } = {}): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
      headers: options.headers,
    });
  }

  /**
   * PUT запрос
   */
  async put<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * PATCH запрос
   */
  async patch<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * DELETE запрос
   */
  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, {
      method: 'DELETE',
    });
  }

  /**
   * Upload файла
   */
  async upload<T>(endpoint: string, file: File, additionalData?: Record<string, any>): Promise<ApiResponse<T>> {
    const formData = new FormData();
    formData.append('file', file);

    if (additionalData) {
      Object.entries(additionalData).forEach(([key, value]) => {
        formData.append(key, String(value));
      });
    }

    // Don't set Content-Type for FormData - browser will set it with boundary
    const headers = this.getHeaders();
    delete headers['Content-Type'];

    return this.makeRequest<T>(endpoint, {
      method: 'POST',
      body: formData,
      headers,
    });
  }

  /**
   * Streaming запрос для Server-Sent Events
   */
  async stream(endpoint: string, data?: any): Promise<ReadableStream<Uint8Array>> {
    const url = `${this.baseURL}${endpoint}`;
    const headers = this.getHeaders();

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: data ? JSON.stringify(data) : undefined,
    });

    if (!response.ok) {
      throw new ApiClientError({
        message: `Stream request failed: ${response.status}`,
        status: response.status,
      });
    }

    if (!response.body) {
      throw new ApiClientError({
        message: 'No stream body available',
        status: 500,
        code: 'NO_STREAM'
      });
    }

    return response.body;
  }

  /**
   * Health check endpoint
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.get('/health');
      return response.success;
    } catch (error) {
      console.error('[ApiClient] Health check failed:', error);
      return false;
    }
  }

  /**
   * Проверка соединения с API
   */
  async checkConnection(): Promise<{ connected: boolean; latency?: number; error?: string }> {
    const startTime = Date.now();

    try {
      await this.healthCheck();
      const latency = Date.now() - startTime;
      
      return {
        connected: true,
        latency
      };
    } catch (error) {
      return {
        connected: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Установка базового URL
   */
  setBaseURL(baseURL: string): void {
    this.baseURL = baseURL.replace(/\/$/, '');
  }

  /**
   * Установка таймаута
   */
  setTimeout(timeout: number): void {
    this.timeout = timeout;
  }

  /**
   * Добавление пользовательских заголовков
   */
  setDefaultHeaders(headers: Record<string, string>): void {
    this.defaultHeaders = { ...this.defaultHeaders, ...headers };
  }
}

// Создаем singleton экземпляр
export const apiClient = new ApiClient();

// Экспортируем класс для создания дополнительных экземпляров
export default ApiClient;