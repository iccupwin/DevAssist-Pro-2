/**
 * КП Analysis Service - AI-powered analysis of commercial proposals
 * Integrates with DevAssist Pro's AI infrastructure
 */

import { apiClient } from '../apiClient';
import {
  KPSummaryData,
  ComparisonAIResult,
  RecommendationResult,
  KPAnalysisResult,
  KPAnalysisProgress,
  AnalysisResult,
  ComparisonResult
} from '../../types/kpAnalyzer';

// Available AI models from settings
export const AVAILABLE_MODELS = {
  "GPT-4o": "gpt-4o",
  "GPT-4.5 Preview": "gpt-4-turbo-preview", 
  "GPT-4 Turbo": "gpt-4-turbo",
  "Claude 3.7 Sonnet": "claude-3-7-sonnet-20250219",
  "Claude 3.5 Sonnet": "claude-3-5-sonnet-20240620",
  "Claude 3 Opus": "claude-3-opus-20240229"
} as const;

export type ModelId = typeof AVAILABLE_MODELS[keyof typeof AVAILABLE_MODELS];

class KPAnalysisService {
  private baseUrl = '/api/v1/llm';

  /**
   * Extract key data from KP text using real API
   */
  async extractKPSummaryData(kpText: string, fileName: string = 'unknown.pdf'): Promise<KPSummaryData> {
    try {
      const response = await apiClient.post<KPSummaryData>('/api/kp-analyzer/extract-summary', {
        kpText,
        fileName,
      });
      return response.data;
    } catch (error) {
      console.error('Error extracting KP summary:', error);
      return {
        company_name: 'Ошибка извлечения',
        tech_stack: 'Ошибка извлечения',
        pricing: 'Ошибка извлечения',
        timeline: 'Ошибка извлечения',
      };
    }
  }

  /**
   * Compare TZ and KP using real API
   */
  async compareTZKP(tzText: string, kpText: string, fileName: string = 'unknown.pdf'): Promise<ComparisonAIResult> {
    try {
      const response = await apiClient.post<ComparisonAIResult>('/api/kp-analyzer/compare-tz-kp', {
        tzText,
        kpText,
        fileName,
      });
      return response.data;
    } catch (error) {
      console.error('Error comparing TZ and KP:', error);
      return {
        overall_score: 0,
        compliance_percentage: 0,
        technical_score: 0,
        commercial_score: 0,
        experience_score: 0,
        timeline_score: 0,
        strengths: [],
        weaknesses: ['Ошибка при анализе'],
        recommendations: [],
        detailed_analysis: 'Произошла ошибка при сравнении ТЗ и КП',
      };
    }
  }

  /**
   * Generate recommendation using real API
   */
  async generateKPRecommendation(analysisResults: any, tzText: string): Promise<RecommendationResult> {
    try {
      const response = await apiClient.post<RecommendationResult>('/api/kp-analyzer/generate-recommendation', {
        analysisResults,
        tzText,
      });
      return response.data;
    } catch (error) {
      console.error('Error generating recommendation:', error);
      return {
        executive_summary: 'Ошибка генерации',
        detailed_comparison: '',
        risk_analysis: '',
        final_recommendation: '',
        recommended_vendor: '',
        confidence_level: '',
      };
    }
  }

  /**
   * Perform complete analysis of a single KP against TZ using real API
   */
  async analyzeKP(
    tzText: string,
    kpText: string,
    kpFileName: string,
    progressCallback?: (progress: number) => void,
    modelId?: string
  ): Promise<KPAnalysisResult> {
    try {
      const response = await apiClient.post<KPAnalysisResult>('/api/kp-analyzer/analyze-single', {
        tzText,
        kpText,
        kpFileName,
        modelId,
      });
      if (progressCallback) progressCallback(100);
      return response.data;
    } catch (error) {
      console.error('Error during KP analysis:', error);
      if (progressCallback) progressCallback(100);
      return {
        id: Date.now().toString(),
        kpFileName,
        score: 0,
        extractedData: {
          company_name: 'Ошибка извлечения',
          tech_stack: 'Ошибка извлечения',
          pricing: 'Ошибка извлечения',
          timeline: 'Ошибка извлечения',
        },
        analysis: {
          compliance: 0,
          technical: 0,
          commercial: 0,
          experience: 0,
          strengths: [],
          weaknesses: ['Произошла ошибка при анализе КП'],
          recommendations: ['Не удалось выполнить анализ из-за технической ошибки'],
          detailedAnalysis: 'Ошибка анализа',
        },
        timestamp: new Date(),
        status: 'error',
      };
    }
  }

  /**
   * Analyze multiple KPs against TZ with progress tracking using real API
   */
  async analyzeAllKPs(
    tzText: string,
    kpFiles: { text: string; fileName: string }[],
    progressCallback?: (progress: KPAnalysisProgress) => void,
    modelId?: string
  ): Promise<KPAnalysisResult[]> {
    try {
      const response = await apiClient.post<KPAnalysisResult[]>('/api/kp-analyzer/analyze', {
        tzText,
        kpFiles,
        modelId,
      });
      if (progressCallback) {
        progressCallback({
          currentKP: '',
          progress: 100,
          totalKPs: kpFiles.length,
          completedKPs: kpFiles.length,
          isAnalyzing: false,
        });
      }
      return response.data;
    } catch (error) {
      console.error('Error during multiple KP analysis:', error);
      if (progressCallback) {
        progressCallback({
          currentKP: '',
          progress: 100,
          totalKPs: kpFiles.length,
          completedKPs: 0,
          isAnalyzing: false,
        });
      }
      return [];
    }
  }
}

export const kpAnalysisService = new KPAnalysisService();

// Re-export types from kpAnalyzer for easier import
export type {
  KPSummaryData,
  ComparisonAIResult as ComparisonResult,
  RecommendationResult,
  KPAnalysisResult as AnalysisResult,
  KPAnalysisProgress as AnalysisProgress
} from '../../types/kpAnalyzer';