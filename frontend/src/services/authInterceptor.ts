/**
 * Authentication Interceptor for HTTP Requests
 * Automatically adds auth headers and handles token refresh
 */

import { tokenManager } from './tokenManager';

export interface RequestConfig {
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: any;
  skipAuth?: boolean;
  retry?: boolean;
}

export interface InterceptorResponse<T = any> {
  data: T;
  status: number;
  statusText: string;
  headers: Record<string, string>;
  ok: boolean;
}

class AuthInterceptor {
  private static instance: AuthInterceptor;
  private baseURL: string;
  private retryQueue: Array<() => Promise<any>> = [];
  private isRefreshing = false;

  private constructor() {
    this.baseURL = process.env.REACT_APP_API_URL || '/api';
  }

  static getInstance(): AuthInterceptor {
    if (!AuthInterceptor.instance) {
      AuthInterceptor.instance = new AuthInterceptor();
    }
    return AuthInterceptor.instance;
  }

  /**
   * Enhanced fetch with automatic auth handling
   */
  async fetch<T = any>(config: RequestConfig): Promise<InterceptorResponse<T>> {
    const { url, method = 'GET', headers = {}, body, skipAuth = false, retry = true } = config;
    
    // Prepare request
    const requestUrl = url.startsWith('http') ? url : `${this.baseURL}${url}`;
    const requestHeaders = new Headers(headers);

    // Add auth header if not skipped and token exists
    if (!skipAuth) {
      const authHeaders = tokenManager.getAuthHeader();
      if ('Authorization' in authHeaders) {
        requestHeaders.set('Authorization', authHeaders.Authorization);
      }
    }

    // Add content type for non-GET requests with body
    if (body && !requestHeaders.has('Content-Type')) {
      if (body instanceof FormData) {
        // Don't set Content-Type for FormData, browser will set it with boundary
      } else {
        requestHeaders.set('Content-Type', 'application/json');
      }
    }

    // Prepare request options
    const requestOptions: RequestInit = {
      method,
      headers: requestHeaders,
      body: body instanceof FormData ? body : (body ? JSON.stringify(body) : undefined),
    };

    try {
      const response = await fetch(requestUrl, requestOptions);
      
      // Handle successful response
      if (response.ok) {
        return await this.handleSuccessResponse<T>(response);
      }
      
      // Handle 401 Unauthorized
      if (response.status === 401 && !skipAuth && retry) {
        return await this.handleUnauthorized<T>(config);
      }
      
      // Handle other error responses
      return await this.handleErrorResponse<T>(response);
      
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Network error');
    }
  }

  /**
   * Handle successful response
   */
  private async handleSuccessResponse<T>(response: Response): Promise<InterceptorResponse<T>> {
    let data: T;
    
    const contentType = response.headers.get('Content-Type');
    
    if (contentType?.includes('application/json')) {
      data = await response.json();
    } else if (contentType?.includes('text/')) {
      data = await response.text() as unknown as T;
    } else {
      data = await response.blob() as unknown as T;
    }

    return {
      data,
      status: response.status,
      statusText: response.statusText,
      headers: this.responseHeadersToObject(response.headers),
      ok: true,
    };
  }

  /**
   * Handle error response
   */
  private async handleErrorResponse<T>(response: Response): Promise<InterceptorResponse<T>> {
    let errorData: any;
    
    try {
      const contentType = response.headers.get('Content-Type');
      if (contentType?.includes('application/json')) {
        errorData = await response.json();
      } else {
        errorData = { message: await response.text() };
      }
    } catch {
      errorData = { message: response.statusText };
    }

    return {
      data: errorData,
      status: response.status,
      statusText: response.statusText,
      headers: this.responseHeadersToObject(response.headers),
      ok: false,
    };
  }

  /**
   * Handle 401 Unauthorized with token refresh
   */
  private async handleUnauthorized<T>(originalConfig: RequestConfig): Promise<InterceptorResponse<T>> {
    // If already refreshing, add to queue
    if (this.isRefreshing) {
      return new Promise((resolve, reject) => {
        this.retryQueue.push(async () => {
          try {
            const response = await this.fetch<T>({ ...originalConfig, retry: false });
            resolve(response);
          } catch (error) {
            reject(error);
          }
        });
      });
    }

    this.isRefreshing = true;

    try {
      // Attempt token refresh
      const refreshed = await tokenManager.refreshToken();
      
      if (refreshed) {
        // Process retry queue
        const retryPromises = this.retryQueue.map(callback => callback());
        this.retryQueue = [];
        
        await Promise.allSettled(retryPromises);
        
        // Retry original request
        return await this.fetch<T>({ ...originalConfig, retry: false });
      } else {
        // Refresh failed, clear auth and throw error
        tokenManager.clearToken();
        throw new Error('Authentication failed');
      }
    } catch (error) {
      // Clear retry queue on refresh failure
      this.retryQueue = [];
      throw error;
    } finally {
      this.isRefreshing = false;
    }
  }

  /**
   * Convert response headers to object
   */
  private responseHeadersToObject(headers: Headers): Record<string, string> {
    const headerObj: Record<string, string> = {};
    headers.forEach((value, key) => {
      headerObj[key] = value;
    });
    return headerObj;
  }

  /**
   * GET request
   */
  async get<T = any>(url: string, config: Partial<RequestConfig> = {}): Promise<InterceptorResponse<T>> {
    return this.fetch<T>({ ...config, url, method: 'GET' });
  }

  /**
   * POST request
   */
  async post<T = any>(url: string, body?: any, config: Partial<RequestConfig> = {}): Promise<InterceptorResponse<T>> {
    return this.fetch<T>({ ...config, url, method: 'POST', body });
  }

  /**
   * PUT request
   */
  async put<T = any>(url: string, body?: any, config: Partial<RequestConfig> = {}): Promise<InterceptorResponse<T>> {
    return this.fetch<T>({ ...config, url, method: 'PUT', body });
  }

  /**
   * DELETE request
   */
  async delete<T = any>(url: string, config: Partial<RequestConfig> = {}): Promise<InterceptorResponse<T>> {
    return this.fetch<T>({ ...config, url, method: 'DELETE' });
  }

  /**
   * PATCH request
   */
  async patch<T = any>(url: string, body?: any, config: Partial<RequestConfig> = {}): Promise<InterceptorResponse<T>> {
    return this.fetch<T>({ ...config, url, method: 'PATCH', body });
  }

  /**
   * Upload file with progress
   */
  async upload<T = any>(
    url: string, 
    formData: FormData, 
    onProgress?: (progress: number) => void,
    config: Partial<RequestConfig> = {}
  ): Promise<InterceptorResponse<T>> {
    const requestUrl = url.startsWith('http') ? url : `${this.baseURL}${url}`;
    
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      
      // Set up progress tracking
      if (onProgress) {
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const progress = (event.loaded / event.total) * 100;
            onProgress(progress);
          }
        });
      }
      
      // Set up response handling
      xhr.addEventListener('load', async () => {
        try {
          let data: T;
          const contentType = xhr.getResponseHeader('Content-Type');
          
          if (contentType?.includes('application/json')) {
            data = JSON.parse(xhr.responseText);
          } else {
            data = xhr.responseText as unknown as T;
          }

          const response: InterceptorResponse<T> = {
            data,
            status: xhr.status,
            statusText: xhr.statusText,
            headers: this.parseXHRHeaders(xhr.getAllResponseHeaders()),
            ok: xhr.status >= 200 && xhr.status < 300,
          };

          if (response.ok) {
            resolve(response);
          } else if (xhr.status === 401 && !config.skipAuth) {
            // Handle token refresh for uploads
            try {
              await tokenManager.refreshToken();
              // Retry upload
              const retryResponse = await this.upload<T>(url, formData, onProgress, { ...config, retry: false });
              resolve(retryResponse);
            } catch (refreshError) {
              reject(new Error('Authentication failed'));
            }
          } else {
            reject(new Error(`Upload failed: ${xhr.status} ${xhr.statusText}`));
          }
        } catch (error) {
          reject(error);
        }
      });
      
      xhr.addEventListener('error', () => {
        reject(new Error('Upload failed: Network error'));
      });
      
      // Set auth header
      if (!config.skipAuth) {
        const authHeaders = tokenManager.getAuthHeader();
        if ('Authorization' in authHeaders) {
          xhr.setRequestHeader('Authorization', authHeaders.Authorization);
        }
      }
      
      // Set custom headers
      if (config.headers) {
        Object.entries(config.headers).forEach(([key, value]) => {
          xhr.setRequestHeader(key, value);
        });
      }
      
      xhr.open('POST', requestUrl);
      xhr.send(formData);
    });
  }

  /**
   * Parse XHR response headers
   */
  private parseXHRHeaders(headerString: string): Record<string, string> {
    const headers: Record<string, string> = {};
    
    headerString.split('\r\n').forEach(line => {
      const parts = line.split(': ');
      if (parts.length === 2) {
        headers[parts[0].toLowerCase()] = parts[1];
      }
    });
    
    return headers;
  }

  /**
   * Download file with auth
   */
  async download(url: string, filename?: string): Promise<void> {
    try {
      const response = await this.fetch<Blob>({ url });
      
      if (!response.ok) {
        throw new Error(`Download failed: ${response.status}`);
      }
      
      // Create download link
      const blob = response.data;
      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      
      link.href = downloadUrl;
      link.download = filename || 'download';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up
      URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      throw new Error(`Download failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Check if response indicates auth error
   */
  isAuthError(response: InterceptorResponse): boolean {
    return response.status === 401 || response.status === 403;
  }

  /**
   * Create AbortController for request cancellation
   */
  createAbortController(): AbortController {
    return new AbortController();
  }
}

// Export singleton instance
export const authInterceptor = AuthInterceptor.getInstance();
export default authInterceptor;