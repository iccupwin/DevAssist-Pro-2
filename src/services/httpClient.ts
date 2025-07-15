// HTTP Client для API запросов
import { API_CONFIG, buildApiUrl, APIEndpoint } from '../config/api';

export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  error?: string;
  message?: string;
  timestamp?: string;
}

export interface RequestOptions {
  timeout?: number;
  retries?: number;
  headers?: Record<string, string>;
  onProgress?: (progress: number) => void;
}

export class HttpClient {
  private abortControllers: Map<string, AbortController> = new Map();

  private async makeRequest<T>(
    url: string,
    options: RequestInit & RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const {
      timeout = API_CONFIG.REQUEST.TIMEOUT,
      retries = API_CONFIG.REQUEST.RETRY_ATTEMPTS,
      headers = {},
      onProgress,
      ...fetchOptions
    } = options;

    // Создаем AbortController для отмены запроса
    const controller = new AbortController();
    const requestId = `${Date.now()}-${Math.random()}`;
    this.abortControllers.set(requestId, controller);

    try {
      // Настройка заголовков
      const requestHeaders = {
        ...API_CONFIG.DEFAULT_HEADERS,
        ...headers,
      };

      // Настройка timeout
      const timeoutId = setTimeout(() => {
        controller.abort();
      }, timeout);

      let attempt = 0;
      let lastError: Error;

      while (attempt < retries) {
        try {
          const response = await fetch(url, {
            ...fetchOptions,
            headers: requestHeaders,
            signal: controller.signal,
          });

          clearTimeout(timeoutId);

          if (!response.ok) {
            const errorData = await response.text();
            let errorMessage: string;
            
            try {
              const errorJson = JSON.parse(errorData);
              errorMessage = errorJson.error || errorJson.message || `HTTP ${response.status}`;
            } catch {
              errorMessage = `HTTP ${response.status}: ${response.statusText}`;
            }

            throw new Error(errorMessage);
          }

          // Обработка прогресса для загрузки файлов
          if (onProgress && response.body) {
            const contentLength = response.headers.get('content-length');
            if (contentLength) {
              const total = parseInt(contentLength, 10);
              let loaded = 0;

              const reader = response.body.getReader();
              const chunks: Uint8Array[] = [];

              while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                chunks.push(value);
                loaded += value.length;
                onProgress((loaded / total) * 100);
              }

              // Объединяем chunks в один массив
              const allChunks = new Uint8Array(chunks.reduce((acc, chunk) => acc + chunk.length, 0));
              let offset = 0;
              for (const chunk of chunks) {
                allChunks.set(chunk, offset);
                offset += chunk.length;
              }
              
              const responseText = new TextDecoder().decode(allChunks);
              
              const data = JSON.parse(responseText);
              return { success: true, data };
            }
          }

          const data = await response.json();
          return { success: true, data };

        } catch (error) {
          lastError = error as Error;
          
          if (error instanceof Error && error.name === 'AbortError') {
            throw new Error('Запрос был отменен');
          }

          if (attempt === retries - 1) {
            throw lastError;
          }

          // Exponential backoff
          const delay = API_CONFIG.REQUEST.RETRY_DELAY * Math.pow(2, attempt);
          await new Promise(resolve => setTimeout(resolve, delay));
          
          attempt++;
        }
      }

      throw lastError!;

    } catch (error) {
      console.error('API Request failed:', error);
      return {
        success: false,
        data: {} as T,
        error: error instanceof Error ? error.message : 'Неизвестная ошибка',
        timestamp: new Date().toISOString(),
      };
    } finally {
      this.abortControllers.delete(requestId);
    }
  }

  // GET запрос
  async get<T>(endpoint: APIEndpoint, params?: Record<string, string>, options?: RequestOptions): Promise<ApiResponse<T>> {
    const url = buildApiUrl(endpoint, params);
    return this.makeRequest<T>(url, { method: 'GET', ...options });
  }

  // POST запрос
  async post<T>(endpoint: APIEndpoint, data?: any, options?: RequestOptions): Promise<ApiResponse<T>> {
    const url = buildApiUrl(endpoint);
    return this.makeRequest<T>(url, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    });
  }

  // PUT запрос
  async put<T>(endpoint: APIEndpoint, data?: any, options?: RequestOptions): Promise<ApiResponse<T>> {
    const url = buildApiUrl(endpoint);
    return this.makeRequest<T>(url, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    });
  }

  // DELETE запрос
  async delete<T>(endpoint: APIEndpoint, options?: RequestOptions): Promise<ApiResponse<T>> {
    const url = buildApiUrl(endpoint);
    return this.makeRequest<T>(url, { method: 'DELETE', ...options });
  }

  // Загрузка файлов
  async uploadFile<T>(
    endpoint: APIEndpoint,
    formData: FormData,
    options?: RequestOptions
  ): Promise<ApiResponse<T>> {
    const url = buildApiUrl(endpoint);
    
    // Для файлов не устанавливаем Content-Type, браузер сам установит с boundary
    const { headers, ...restOptions } = options || {};
    const uploadHeaders = headers ? { ...headers } : {};
    delete uploadHeaders['Content-Type'];

    return this.makeRequest<T>(url, {
      method: 'POST',
      body: formData,
      headers: uploadHeaders,
      timeout: API_CONFIG.REQUEST.UPLOAD_TIMEOUT,
      ...restOptions,
    });
  }

  // Отмена всех активных запросов
  cancelAllRequests(): void {
    this.abortControllers.forEach(controller => controller.abort());
    this.abortControllers.clear();
  }

  // Отмена конкретного запроса (по ID если нужно)
  cancelRequest(requestId: string): void {
    const controller = this.abortControllers.get(requestId);
    if (controller) {
      controller.abort();
      this.abortControllers.delete(requestId);
    }
  }
}

// Экспорт синглтона
export const httpClient = new HttpClient();