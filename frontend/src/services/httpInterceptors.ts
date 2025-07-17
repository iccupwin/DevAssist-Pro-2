/**
 * HTTP Interceptors для автоматического управления JWT токенами
 * Согласно ТЗ DevAssist Pro
 */

import { TokenService, tokenService } from './tokenService';
import { AUTH_CONFIG } from '../config/auth';

interface RequestConfig {
  url: string;
  method: string;
  headers?: Record<string, string>;
  body?: any;
  requiresAuth?: boolean;
  retryCount?: number;
}

interface ResponseData {
  ok: boolean;
  status: number;
  statusText: string;
  data: any;
  headers: Headers;
}

interface InterceptorOptions {
  baseURL?: string;
  timeout?: number;
  retryAttempts?: number;
  retryDelay?: number;
}

export class HTTPInterceptor {
  private baseURL: string;
  private timeout: number;
  private retryAttempts: number;
  private retryDelay: number;
  private isRefreshing: boolean = false;
  private failedQueue: Array<{
    resolve: (value: any) => void;
    reject: (reason: any) => void;
    config: RequestConfig;
  }> = [];

  constructor(options: InterceptorOptions = {}) {
    // Определяем baseURL с правильным API путем
    let baseURL = options.baseURL || '/api';
    
    // Если это полный URL (начинается с http), добавляем /api если его нет
    if (baseURL.startsWith('http') && !baseURL.endsWith('/api')) {
      baseURL = baseURL.replace(/\/+$/, '') + '/api';
    }
    
    this.baseURL = baseURL;
    this.timeout = options.timeout || 30000;
    this.retryAttempts = options.retryAttempts || 3;
    this.retryDelay = options.retryDelay || 1000;
    
    console.log('[HTTPInterceptor] Initialized with baseURL:', this.baseURL);
  }

  /**
   * Основной метод для выполнения HTTP запросов
   */
  async request<T = any>(config: RequestConfig): Promise<T> {
    // Применяем request interceptor
    const processedConfig = await this.requestInterceptor(config);
    
    try {
      // Выполняем запрос
      const response = await this.performRequest(processedConfig);
      
      // Применяем response interceptor
      return await this.responseInterceptor(response, processedConfig);
    } catch (error) {
      // Обрабатываем ошибки
      return await this.errorInterceptor(error, processedConfig);
    }
  }

  /**
   * Request Interceptor - добавляет токены и обрабатывает заголовки
   */
  private async requestInterceptor(config: RequestConfig): Promise<RequestConfig> {
    const processedConfig = { ...config };

    // Устанавливаем базовые заголовки
    processedConfig.headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...(processedConfig.headers || {})
    };

    // Добавляем полный URL
    if (!processedConfig.url.startsWith('http')) {
      processedConfig.url = `${this.baseURL}${processedConfig.url}`;
    }

    // Добавляем токен авторизации для защищенных маршрутов
    if (processedConfig.requiresAuth !== false) {
      await this.addAuthorizationHeader(processedConfig);
    }

    // Логируем исходящий запрос
    console.log('[HTTPInterceptor] Outgoing request:', {
      method: processedConfig.method,
      url: processedConfig.url,
      baseURL: this.baseURL,
      originalUrl: config.url,
      hasAuth: !!(processedConfig.headers?.Authorization),
      timestamp: new Date().toISOString()
    });

    return processedConfig;
  }

  /**
   * Response Interceptor - обрабатывает ответы и ошибки авторизации
   */
  private async responseInterceptor<T>(response: ResponseData, config: RequestConfig): Promise<T> {
    // Логируем успешный ответ
    console.log('[HTTPInterceptor] Response received:', {
      status: response.status,
      url: config.url,
      method: config.method,
      timestamp: new Date().toISOString()
    });

    // Проверяем статус ответа
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.data;
  }

  /**
   * Error Interceptor - обрабатывает ошибки и автоматически обновляет токены
   */
  private async errorInterceptor(error: any, config: RequestConfig): Promise<any> {
    const originalRequest = config;

    console.error('[HTTPInterceptor] Request failed:', {
      url: config.url,
      method: config.method,
      error: error.message,
      status: error.status,
      timestamp: new Date().toISOString()
    });

    // Обрабатываем ошибки авторизации (401)
    if (error.status === 401 && config.requiresAuth !== false) {
      return this.handle401Error(originalRequest);
    }

    // Обрабатываем сетевые ошибки с retry логикой
    if (this.isNetworkError(error) && (originalRequest.retryCount || 0) < this.retryAttempts) {
      return this.retryRequest(originalRequest);
    }

    // Пробрасываем ошибку дальше
    throw this.createAPIError(error, config);
  }

  /**
   * Обработка 401 ошибок с автоматическим обновлением токенов
   */
  private async handle401Error(config: RequestConfig): Promise<any> {
    // Проверяем, не является ли это запросом на обновление токена
    if (config.url.includes('/auth/refresh')) {
      console.log('[HTTPInterceptor] Refresh token request failed, redirecting to login');
      this.redirectToLogin();
      throw new Error('Authentication failed');
    }

    // Если уже выполняется обновление токена, добавляем запрос в очередь
    if (this.isRefreshing) {
      return new Promise((resolve, reject) => {
        this.failedQueue.push({ resolve, reject, config });
      });
    }

    this.isRefreshing = true;

    try {
      // Пытаемся обновить токен
      await tokenService.refreshTokens();
      
      console.log('[HTTPInterceptor] Token refreshed successfully, retrying failed requests');
      
      // Обрабатываем очередь неудачных запросов
      this.processFailedQueue(null);
      
      // Повторяем оригинальный запрос с новым токеном
      const updatedConfig = await this.requestInterceptor(config);
      return this.performRequest(updatedConfig);
      
    } catch (refreshError) {
      console.error('[HTTPInterceptor] Token refresh failed:', refreshError);
      
      // Обрабатываем очередь с ошибкой
      this.processFailedQueue(refreshError);
      
      // Перенаправляем на страницу входа
      this.redirectToLogin();
      
      throw new Error('Authentication failed and token refresh unsuccessful');
    } finally {
      this.isRefreshing = false;
    }
  }

  /**
   * Обработка очереди неудачных запросов
   */
  private processFailedQueue(error: any): void {
    this.failedQueue.forEach(({ resolve, reject, config }) => {
      if (error) {
        reject(error);
      } else {
        resolve(this.request(config));
      }
    });
    
    this.failedQueue = [];
  }

  /**
   * Retry логика для сетевых ошибок
   */
  private async retryRequest(config: RequestConfig): Promise<any> {
    const retryCount = (config.retryCount || 0) + 1;
    const delay = this.retryDelay * Math.pow(2, retryCount - 1); // Exponential backoff
    
    console.log(`[HTTPInterceptor] Retrying request (attempt ${retryCount}/${this.retryAttempts}) after ${delay}ms`, {
      url: config.url,
      method: config.method
    });

    // Ждем перед повторной попыткой
    await new Promise(resolve => setTimeout(resolve, delay));
    
    // Повторяем запрос
    const retryConfig = { ...config, retryCount };
    return this.request(retryConfig);
  }

  /**
   * Добавление заголовка авторизации
   */
  private async addAuthorizationHeader(config: RequestConfig): Promise<void> {
    // В development режиме используем упрощенное хранение токенов
    if (process.env.NODE_ENV === 'development') {
      const simpleToken = localStorage.getItem(AUTH_CONFIG.TOKEN_STORAGE_KEY);
      const tokenExpiresAt = localStorage.getItem(AUTH_CONFIG.TOKEN_EXPIRY_STORAGE_KEY);
      
      if (simpleToken && tokenExpiresAt) {
        const isValid = parseInt(tokenExpiresAt) > Date.now();
        if (isValid) {
          if (!config.headers) {
            config.headers = {};
          }
          config.headers.Authorization = `Bearer ${simpleToken}`;
          console.log('[HTTPInterceptor] Using simple development token');
          return;
        } else {
          console.warn('[HTTPInterceptor] Simple development token expired');
        }
      } else {
        console.warn('[HTTPInterceptor] No simple development token found');
      }
      
      // В development режиме не блокируем запросы из-за отсутствия токенов
      if (config.requiresAuth !== false) {
        console.warn('[HTTPInterceptor] Proceeding without token in development mode');
        return;
      }
    } else {
      // Production режим - используем TokenService
      // Проверяем, нужно ли обновить токен
      if (TokenService.shouldRefreshToken() && !TokenService.isRefreshTokenExpired()) {
        try {
          await tokenService.refreshTokens();
          console.log('[HTTPInterceptor] Token refreshed proactively');
        } catch (error) {
          console.warn('[HTTPInterceptor] Proactive token refresh failed:', error);
        }
      }

      // Добавляем токен в заголовки
      const authHeader = TokenService.getAuthorizationHeader();
      if (authHeader) {
        if (!config.headers) {
          config.headers = {};
        }
        config.headers.Authorization = authHeader;
      } else if (config.requiresAuth !== false) {
        console.warn('[HTTPInterceptor] No valid token available for authenticated request');
        throw new Error('No valid authentication token available');
      }
    }
  }

  /**
   * Выполнение HTTP запроса
   */
  private async performRequest(config: RequestConfig): Promise<ResponseData> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const fetchOptions: RequestInit = {
        method: config.method,
        headers: config.headers,
        signal: controller.signal,
        credentials: 'include', // Include cookies for additional security
      };

      // Добавляем body для POST/PUT/PATCH запросов
      if (config.body && ['POST', 'PUT', 'PATCH'].includes(config.method.toUpperCase())) {
        fetchOptions.body = typeof config.body === 'string' 
          ? config.body 
          : JSON.stringify(config.body);
      }

      const response = await fetch(config.url, fetchOptions);
      
      clearTimeout(timeoutId);

      // Парсим ответ
      let data;
      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      return {
        ok: response.ok,
        status: response.status,
        statusText: response.statusText,
        data,
        headers: response.headers
      };

    } catch (error: any) {
      clearTimeout(timeoutId);
      
      // Обрабатываем различные типы ошибок
      if (error.name === 'AbortError') {
        throw new Error(`Request timeout after ${this.timeout}ms`);
      }
      
      throw error;
    }
  }

  /**
   * Проверка сетевых ошибок
   */
  private isNetworkError(error: any): boolean {
    return (
      error.name === 'TypeError' ||
      error.message === 'Failed to fetch' ||
      error.message.includes('network') ||
      error.code === 'NETWORK_ERROR'
    );
  }

  /**
   * Создание стандартизированной ошибки API
   */
  private createAPIError(error: any, config: RequestConfig): Error {
    const apiError = new Error(error.message || 'API request failed');
    
    // Добавляем дополнительную информацию об ошибке
    (apiError as any).status = error.status;
    (apiError as any).statusText = error.statusText;
    (apiError as any).url = config.url;
    (apiError as any).method = config.method;
    (apiError as any).timestamp = new Date().toISOString();
    
    return apiError;
  }

  /**
   * Перенаправление на страницу входа
   */
  private redirectToLogin(): void {
    // Очищаем токены
    TokenService.clearTokens();
    
    // Перенаправляем на страницу входа
    if (typeof window !== 'undefined') {
      const currentPath = window.location.pathname;
      const loginUrl = `/auth/login?redirect=${encodeURIComponent(currentPath)}`;
      
      console.log('[HTTPInterceptor] Redirecting to login:', loginUrl);
      window.location.href = loginUrl;
    }
  }

  /**
   * Удобные методы для HTTP запросов
   */
  async get<T = any>(url: string, config: Partial<RequestConfig> = {}): Promise<T> {
    return this.request<T>({ method: 'GET', url, ...config });
  }

  async post<T = any>(url: string, data?: any, config: Partial<RequestConfig> = {}): Promise<T> {
    return this.request<T>({ method: 'POST', url, body: data, ...config });
  }

  async put<T = any>(url: string, data?: any, config: Partial<RequestConfig> = {}): Promise<T> {
    return this.request<T>({ method: 'PUT', url, body: data, ...config });
  }

  async patch<T = any>(url: string, data?: any, config: Partial<RequestConfig> = {}): Promise<T> {
    return this.request<T>({ method: 'PATCH', url, body: data, ...config });
  }

  async delete<T = any>(url: string, config: Partial<RequestConfig> = {}): Promise<T> {
    return this.request<T>({ method: 'DELETE', url, ...config });
  }
}

// Создаем глобальный экземпляр HTTP клиента
// 🔒 PRODUCTION READY: Uses environment variables with secure fallbacks
const apiUrl = process.env.REACT_APP_API_URL || process.env.REACT_APP_API_BASE_URL || (
  process.env.NODE_ENV === 'production' 
    ? 'https://your-api-domain.com' 
    : 'http://localhost:8000'
);
console.log('[HTTPInterceptor] Environment variables:', {
  REACT_APP_API_URL: process.env.REACT_APP_API_URL,
  REACT_APP_API_BASE_URL: process.env.REACT_APP_API_BASE_URL,
  resolvedApiUrl: apiUrl
});

export const httpClient = new HTTPInterceptor({
  baseURL: apiUrl,
  timeout: 30000,
  retryAttempts: 3,
  retryDelay: 1000
});

// Экспортируем типы
export type { RequestConfig, ResponseData, InterceptorOptions };