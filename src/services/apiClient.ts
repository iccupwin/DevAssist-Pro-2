/**
 * API Client для работы с backend сервисами
 */

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
  private baseUrl: string;

  constructor() {
    // В production это будет URL вашего Python backend
    this.baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000';
  }

  private async makeRequest<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
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
      const response = await fetch(`${this.baseUrl}/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.status}`);
      }

      const data = await response.json();
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
}

// Выбор между mock и real API в зависимости от настроек
import { mockApiService } from './mockApiService';
import { realApiService } from './realApiService';
import { devAssistApi } from './apiWrapper';
import { API_CONFIG } from '../config/api';

// Определяем, использовать ли реальные API или mock
const USE_REAL_API = API_CONFIG.USE_REAL_API;

// Создаем универсальный API сервис
export const apiService = USE_REAL_API ? realApiService : mockApiService;

// Экспорт нового интегрированного API
export { devAssistApi, useDevAssistApi } from './apiWrapper';
export { apiMonitoring, useApiMonitoring } from './apiMonitoring';

export const apiClient = new ApiClient();