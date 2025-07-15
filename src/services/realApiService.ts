/**
 * Real API Service для production окружения
 */

import { AnalysisResult } from './apiClient';
import { httpClient, ApiResponse } from './httpClient';
import { API_CONFIG } from '../config/api';

const API_BASE_URL = API_CONFIG.BASE_URL;

class RealApiService {
  private async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  async uploadFiles(files: {
    tzFile?: File;
    kpFiles?: File[];
    additionalFiles?: File[];
  }): Promise<{
    success: boolean;
    data: {
      tz_file: { filePath: string; originalName: string } | null;
      kp_files: { filePath: string; originalName: string }[];
      additional_files: { filePath: string; originalName: string }[];
    };
    error?: string;
  }> {
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

    const response = await httpClient.uploadFile('UPLOAD', formData, {
      timeout: API_CONFIG.REQUEST.UPLOAD_TIMEOUT,
    });

    if (response.success) {
      return {
        success: true,
        data: {
          tz_file: (response.data as any).tz_file || null,
          kp_files: (response.data as any).kp_files || [],
          additional_files: (response.data as any).additional_files || []
        }
      };
    } else {
      return {
        success: false,
        data: { tz_file: null, kp_files: [], additional_files: [] },
        error: response.error || 'Upload failed'
      };
    }
  }

  async analyzeKP(
    tzFile: string,
    kpFile: string,
    additionalFiles?: string[],
    modelId?: string
  ): Promise<{ success: boolean; data: AnalysisResult; error?: string }> {
    try {
      const data = await this.makeRequest<AnalysisResult>('/analyze', {
        method: 'POST',
        body: JSON.stringify({
          tz_file_path: tzFile,
          kp_file_path: kpFile,
          additional_files: additionalFiles || [],
          model_id: modelId || 'claude-3-5-sonnet-20240620'
        }),
      });
      return { success: true, data };
    } catch (error) {
      return { 
        success: false, 
        data: {} as AnalysisResult,
        error: error instanceof Error ? error.message : 'Analysis failed'
      };
    }
  }

  async compareAllKP(
    analysisResults: AnalysisResult[],
    modelId?: string
  ): Promise<{ success: boolean; data: string; error?: string }> {
    try {
      const response = await this.makeRequest<{ comparison_text: string }>('/compare-all', {
        method: 'POST',
        body: JSON.stringify({
          analysis_results: analysisResults,
          model_id: modelId || 'gpt-4o'
        }),
      });
      
      return { success: true, data: response.comparison_text };
    } catch (error) {
      return { 
        success: false, 
        data: '',
        error: error instanceof Error ? error.message : 'Comparison failed'
      };
    }
  }

  async generateReport(
    analysisResults: AnalysisResult[],
    modelId?: string
  ): Promise<{ success: boolean; data: string; error?: string }> {
    try {
      const response = await this.makeRequest<{ report_text: string }>('/generate-report', {
        method: 'POST',
        body: JSON.stringify({
          analysis_results: analysisResults,
          model_id: modelId || 'gpt-4o'
        }),
      });
      
      return { success: true, data: response.report_text };
    } catch (error) {
      return { 
        success: false, 
        data: '',
        error: error instanceof Error ? error.message : 'Report generation failed'
      };
    }
  }

  async checkHealth(): Promise<{ status: string; timestamp: string }> {
    return this.makeRequest<{ status: string; timestamp: string }>('/health');
  }
}

export const realApiService = new RealApiService();