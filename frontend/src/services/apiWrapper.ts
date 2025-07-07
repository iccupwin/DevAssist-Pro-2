// Интегрированный API Wrapper для DevAssist Pro
import { httpClient, ApiResponse } from './httpClient';
import { apiMonitoring } from './apiMonitoring';
import { API_CONFIG } from '../config/api';
import { AnalysisResult } from './apiClient';

export interface UploadedFiles {
  tz_file: { filePath: string; originalName: string } | null;
  kp_files: { filePath: string; originalName: string }[];
  additional_files: { filePath: string; originalName: string }[];
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
  stage: 'uploading' | 'processing' | 'complete' | 'error';
  message?: string;
}

export interface AnalysisProgress {
  step: number;
  totalSteps: number;
  currentOperation: string;
  percentage: number;
  estimatedTimeRemaining?: number;
}

class DevAssistApiWrapper {
  // Проверка здоровья API
  async checkHealth(): Promise<ApiResponse<{ status: string; version?: string; models?: string[] }>> {
    const requestId = apiMonitoring.startRequest('/health', 'GET');
    
    try {
      const response = await httpClient.get<{ status: string; version?: string; models?: string[] }>('HEALTH');
      apiMonitoring.endRequest(requestId, response.success);
      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Health check failed';
      apiMonitoring.endRequest(requestId, false, errorMessage);
      throw error;
    }
  }

  // Загрузка файлов с прогрессом
  async uploadFiles(
    files: {
      tzFile?: File;
      kpFiles?: File[];
      additionalFiles?: File[];
    },
    onProgress?: (progress: UploadProgress) => void
  ): Promise<ApiResponse<UploadedFiles>> {
    const requestId = apiMonitoring.startRequest('/upload', 'POST');
    
    // Проверка rate limit
    const rateLimitCheck = apiMonitoring.checkRateLimit();
    if (!rateLimitCheck.allowed) {
      const error = 'Rate limit exceeded for file uploads';
      apiMonitoring.endRequest(requestId, false, error);
      return {
        success: false,
        data: { tz_file: null, kp_files: [], additional_files: [] },
        error,
      };
    }

    try {
      // Валидация файлов
      const allFiles = [
        ...(files.tzFile ? [files.tzFile] : []),
        ...(files.kpFiles || []),
        ...(files.additionalFiles || []),
      ];

      for (const file of allFiles) {
        if (file.size > API_CONFIG.FILE_UPLOAD.MAX_SIZE) {
          const error = `Файл ${file.name} превышает максимальный размер ${API_CONFIG.FILE_UPLOAD.MAX_SIZE / 1024 / 1024}MB`;
          apiMonitoring.endRequest(requestId, false, error);
          return {
            success: false,
            data: { tz_file: null, kp_files: [], additional_files: [] },
            error,
          };
        }

        const extension = file.name.toLowerCase().split('.').pop();
        if (!extension || !API_CONFIG.FILE_UPLOAD.SUPPORTED_FORMATS.includes(extension)) {
          const error = `Неподдерживаемый формат файла: ${file.name}`;
          apiMonitoring.endRequest(requestId, false, error);
          return {
            success: false,
            data: { tz_file: null, kp_files: [], additional_files: [] },
            error,
          };
        }
      }

      // Создание FormData
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

      // Отправка с отслеживанием прогресса
      const response = await httpClient.uploadFile<UploadedFiles>('UPLOAD', formData, {
        timeout: API_CONFIG.REQUEST.UPLOAD_TIMEOUT,
        onProgress: (percentage) => {
          if (onProgress) {
            onProgress({
              loaded: percentage,
              total: 100,
              percentage,
              stage: percentage < 100 ? 'uploading' : 'processing',
              message: percentage < 100 ? 'Загрузка файлов...' : 'Обработка файлов...'
            });
          }
        }
      });

      apiMonitoring.endRequest(requestId, response.success, response.error);

      if (onProgress && response.success) {
        onProgress({
          loaded: 100,
          total: 100,
          percentage: 100,
          stage: 'complete',
          message: 'Файлы успешно загружены'
        });
      }

      return response;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      apiMonitoring.endRequest(requestId, false, errorMessage);
      
      if (onProgress) {
        onProgress({
          loaded: 0,
          total: 100,
          percentage: 0,
          stage: 'error',
          message: errorMessage
        });
      }

      return {
        success: false,
        data: { tz_file: null, kp_files: [], additional_files: [] },
        error: errorMessage,
      };
    }
  }

  // Анализ КП с прогрессом
  async analyzeKP(
    tzFilePath: string,
    kpFilePath: string,
    additionalFiles: string[] = [],
    modelId?: string,
    onProgress?: (progress: AnalysisProgress) => void
  ): Promise<ApiResponse<AnalysisResult>> {
    const requestId = apiMonitoring.startRequest('/analyze', 'POST');
    
    // Проверка rate limit
    const rateLimitCheck = apiMonitoring.checkRateLimit();
    if (!rateLimitCheck.limits.analysisPerHour) {
      const error = 'Rate limit exceeded for analysis operations';
      apiMonitoring.endRequest(requestId, false, error);
      return {
        success: false,
        data: {} as AnalysisResult,
        error,
      };
    }

    try {
      if (onProgress) {
        onProgress({
          step: 1,
          totalSteps: 4,
          currentOperation: 'Инициализация анализа...',
          percentage: 25,
        });
      }

      const requestData = {
        tz_file_path: tzFilePath,
        kp_file_path: kpFilePath,
        additional_files: additionalFiles,
        model_id: modelId || API_CONFIG.AI_MODELS.DEFAULT_ANALYSIS,
      };

      if (onProgress) {
        onProgress({
          step: 2,
          totalSteps: 4,
          currentOperation: 'Обработка документов...',
          percentage: 50,
        });
      }

      const response = await httpClient.post<AnalysisResult>('ANALYZE', requestData, {
        timeout: API_CONFIG.REQUEST.TIMEOUT,
      });

      if (onProgress) {
        onProgress({
          step: 3,
          totalSteps: 4,
          currentOperation: 'Анализ соответствия требованиям...',
          percentage: 75,
        });
      }

      apiMonitoring.endRequest(requestId, response.success, response.error);

      if (onProgress) {
        onProgress({
          step: 4,
          totalSteps: 4,
          currentOperation: response.success ? 'Анализ завершен' : 'Ошибка анализа',
          percentage: 100,
        });
      }

      return response;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Analysis failed';
      apiMonitoring.endRequest(requestId, false, errorMessage);
      
      if (onProgress) {
        onProgress({
          step: 4,
          totalSteps: 4,
          currentOperation: `Ошибка: ${errorMessage}`,
          percentage: 100,
        });
      }

      return {
        success: false,
        data: {} as AnalysisResult,
        error: errorMessage,
      };
    }
  }

  // Сравнение всех КП
  async compareAllKP(
    analysisResults: AnalysisResult[],
    modelId?: string
  ): Promise<ApiResponse<string>> {
    const requestId = apiMonitoring.startRequest('/compare-all', 'POST');
    
    try {
      const requestData = {
        analysis_results: analysisResults,
        model_id: modelId || API_CONFIG.AI_MODELS.DEFAULT_COMPARISON,
      };

      const response = await httpClient.post<string>('COMPARE_ALL', requestData, {
        timeout: API_CONFIG.REQUEST.TIMEOUT,
      });

      apiMonitoring.endRequest(requestId, response.success, response.error);
      return response;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Comparison failed';
      apiMonitoring.endRequest(requestId, false, errorMessage);
      
      return {
        success: false,
        data: '',
        error: errorMessage,
      };
    }
  }

  // Генерация отчета
  async generateReport(
    analysisResults: AnalysisResult[],
    modelId?: string
  ): Promise<ApiResponse<string>> {
    const requestId = apiMonitoring.startRequest('/generate-report', 'POST');
    
    try {
      const requestData = {
        analysis_results: analysisResults,
        model_id: modelId || API_CONFIG.AI_MODELS.DEFAULT_COMPARISON,
      };

      const response = await httpClient.post<string>('GENERATE_REPORT', requestData, {
        timeout: API_CONFIG.REQUEST.TIMEOUT,
      });

      apiMonitoring.endRequest(requestId, response.success, response.error);
      return response;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Report generation failed';
      apiMonitoring.endRequest(requestId, false, errorMessage);
      
      return {
        success: false,
        data: '',
        error: errorMessage,
      };
    }
  }

  // Получение доступных моделей
  async getAvailableModels(): Promise<ApiResponse<{ analysis: string[]; comparison: string[] }>> {
    const requestId = apiMonitoring.startRequest('/models', 'GET');
    
    try {
      const response = await httpClient.get<{ analysis: string[]; comparison: string[] }>('MODELS');
      apiMonitoring.endRequest(requestId, response.success, response.error);
      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch models';
      apiMonitoring.endRequest(requestId, false, errorMessage);
      
      // Fallback к локальным моделям
      return {
        success: true,
        data: {
          analysis: [...API_CONFIG.AI_MODELS.AVAILABLE.CLAUDE, ...API_CONFIG.AI_MODELS.AVAILABLE.OPENAI],
          comparison: [...API_CONFIG.AI_MODELS.AVAILABLE.OPENAI, ...API_CONFIG.AI_MODELS.AVAILABLE.CLAUDE],
        },
      };
    }
  }

  // Получение статистики использования
  async getUsageStats(): Promise<ApiResponse<{
    requests_today: number;
    analysis_count: number;
    total_files_processed: number;
    average_processing_time: number;
  }>> {
    const requestId = apiMonitoring.startRequest('/usage/stats', 'GET');
    
    try {
      const response = await httpClient.get<{
        requests_today: number;
        analysis_count: number;
        total_files_processed: number;
        average_processing_time: number;
      }>('USAGE_STATS');
      apiMonitoring.endRequest(requestId, response.success, response.error);
      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch usage stats';
      apiMonitoring.endRequest(requestId, false, errorMessage);
      
      // Fallback к локальным метрикам
      const localMetrics = apiMonitoring.getMetrics();
      return {
        success: true,
        data: {
          requests_today: localMetrics.requestCount,
          analysis_count: localMetrics.rateLimitStatus.analysisPerHour,
          total_files_processed: localMetrics.rateLimitStatus.fileUploadsPerHour,
          average_processing_time: localMetrics.averageResponseTime,
        },
      };
    }
  }
}

// Экспорт основного API сервиса
export const devAssistApi = new DevAssistApiWrapper();

// Хук для React компонентов
export const useDevAssistApi = () => {
  return {
    checkHealth: devAssistApi.checkHealth.bind(devAssistApi),
    uploadFiles: devAssistApi.uploadFiles.bind(devAssistApi),
    analyzeKP: devAssistApi.analyzeKP.bind(devAssistApi),
    compareAllKP: devAssistApi.compareAllKP.bind(devAssistApi),
    generateReport: devAssistApi.generateReport.bind(devAssistApi),
    getAvailableModels: devAssistApi.getAvailableModels.bind(devAssistApi),
    getUsageStats: devAssistApi.getUsageStats.bind(devAssistApi),
  };
};