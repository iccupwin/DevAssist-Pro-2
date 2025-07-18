/**
 * API Client для работы с backend сервисами
 * Интегрирован с JWT Token Management
 */

import { httpClient } from './httpInterceptors';
import { realApiService } from './realApiService';
import { devAssistApi } from './apiWrapper';

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  error?: string;
}

export interface FileMetadata {
  originalName: string;
  filePath: string;
  extension: string;
  size: number;
  uploadTime: string;
}

export interface UploadedFiles {
  tz_file: FileMetadata | null;
  kp_files: FileMetadata[];
  additional_files: FileMetadata[];
}

export interface ComplianceAnalysis {
  compliance_score: number;
  missing_requirements: string[];
  additional_features: string[];
  sections?: {
    name: string;
    compliance: number;
    details: string;
  }[];
}

export interface KPSummary {
  company_name: string;
  tech_stack: string;
  pricing: string;
  timeline: string;
}

export interface PreliminaryRecommendation {
  strength: string[];
  weakness: string[];
  summary: string;
}

export interface AnalysisResult {
  tz_name: string;
  kp_name: string;
  company_name: string;
  tech_stack: string;
  pricing: string;
  timeline: string;
  comparison_result: ComplianceAnalysis;
  additional_info_analysis?: {
    key_findings: string[];
    impact: string;
    rating_impact: number;
  };
  preliminary_recommendation: PreliminaryRecommendation;
  ratings: Record<string, number>;
  comments: Record<string, string>;
}

class ApiClient {
  constructor() {
    // HTTP client уже настроен с JWT token management
  }

  private async makeRequest<T>(
    endpoint: string, 
    options: Partial<RequestInit> = {},
    requiresAuth: boolean = true
  ): Promise<ApiResponse<T>> {
    try {
      // Используем httpClient с автоматическим управлением токенами
      const data = await httpClient.request<T>({
        url: endpoint,
        method: (options.method as string) || 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...options.headers as Record<string, string>,
        },
        body: options.body,
        requiresAuth
      });

      return { data, success: true };
    } catch (error) {
      console.error('API request failed:', error);
      return { 
        data: {} as T, 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // Загрузка файлов
  async uploadFiles(files: {
    tzFile?: File;
    kpFiles?: File[];
    additionalFiles?: File[];
  }): Promise<ApiResponse<UploadedFiles>> {
    const formData = new FormData();
    
    if (files.tzFile) {
      formData.append('tz_file', files.tzFile);
    }
    
    if (files.kpFiles) {
      files.kpFiles.forEach((file, index) => {
        formData.append(`kp_file_${index}`, file);
      });
    }
    
    if (files.additionalFiles) {
      files.additionalFiles.forEach((file, index) => {
        formData.append(`additional_file_${index}`, file);
      });
    }

    try {
      // Используем httpClient для файловых загрузок с JWT авторизацией
      const data = await httpClient.post<UploadedFiles>('/upload', formData, {
        headers: {
          // Не устанавливаем Content-Type для FormData - браузер установит автоматически с boundary
        }
      });

      return { data, success: true };
    } catch (error) {
      console.error('File upload failed:', error);
      return { 
        data: {} as UploadedFiles, 
        success: false, 
        error: error instanceof Error ? error.message : 'Upload failed' 
      };
    }
  }

  // Анализ КП
  async analyzeKP(
    tzFilePath: string, 
    kpFilePath: string, 
    additionalFiles?: string[],
    modelId?: string
  ): Promise<ApiResponse<AnalysisResult>> {
    return this.makeRequest<AnalysisResult>('/analyze', {
      method: 'POST',
      body: JSON.stringify({
        tz_file_path: tzFilePath,
        kp_file_path: kpFilePath,
        additional_files: additionalFiles || [],
        model_id: modelId || 'claude-3-5-sonnet-20240620'
      }),
    });
  }

  // Сравнение всех КП
  async compareAllKP(
    analysisResults: AnalysisResult[],
    modelId?: string
  ): Promise<ApiResponse<string>> {
    return this.makeRequest<string>('/compare-all', {
      method: 'POST',
      body: JSON.stringify({
        analysis_results: analysisResults,
        model_id: modelId || 'gpt-4o'
      }),
    });
  }

  // Генерация отчета
  async generateReport(
    analysisResults: AnalysisResult[],
    modelId?: string
  ): Promise<ApiResponse<string>> {
    return this.makeRequest<string>('/generate-report', {
      method: 'POST',
      body: JSON.stringify({
        analysis_results: analysisResults,
        model_id: modelId || 'gpt-4o'
      }),
    });
  }

  // Проверка статуса backend
  async checkHealth(): Promise<ApiResponse<{ status: string }>> {
    return this.makeRequest<{ status: string }>('/health');
  }

  // Generic GET method
  async get<T>(endpoint: string, params?: Record<string, any>): Promise<{ data: T }> {
    const queryParams = params ? '?' + new URLSearchParams(params).toString() : '';
    const response = await this.makeRequest<T>(`${endpoint}${queryParams}`);
    if (!response.success) {
      throw new Error(response.error || 'Request failed');
    }
    return { data: response.data };
  }

  // Generic POST method
  async post<T>(endpoint: string, data: any): Promise<{ data: T }> {
    const response = await this.makeRequest<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data)
    });
    if (!response.success) {
      throw new Error(response.error || 'Request failed');
    }
    return { data: response.data };
  }
}

// Используем только реальные API
export const apiService = realApiService;

// Экспорт нового интегрированного API
export { devAssistApi, useDevAssistApi } from './apiWrapper';
export { apiMonitoring, useApiMonitoring } from './apiMonitoring';

export const apiClient = new ApiClient();