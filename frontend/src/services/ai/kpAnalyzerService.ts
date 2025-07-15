/**
 * Сервис для работы с КП Анализатором
 * Интеграция с backend AI сервисами
 */

import { 
  Document, 
  TechnicalSpecification, 
  CommercialProposal, 
  AnalysisResult, 
  ComparisonResult,
  StartAnalysisRequest,
  StartAnalysisResponse,
  AnalysisStatusResponse,
  AIModelConfig
} from '../../types/kpAnalyzer';

export class KPAnalyzerService {
  private baseURL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

  /**
   * Загрузка и обработка документа
   */
  async uploadDocument(file: File, role: 'tz' | 'kp'): Promise<Document> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('role', role);

    try {
      const response = await fetch(`${this.baseURL}/api/kp-analyzer/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('devassist_simple_token')}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('[KPAnalyzerService] Upload error:', error);
      throw error;
    }
  }

  /**
   * Получение списка доступных AI моделей
   */
  async getAvailableModels(): Promise<AIModelConfig[]> {
    try {
      const response = await fetch(`${this.baseURL}/api/llm/models`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('devassist_simple_token')}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch models: ${response.statusText}`);
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('[KPAnalyzerService] Get models error:', error);
      // Возвращаем fallback модели для разработки
      return this.getFallbackModels();
    }
  }

  /**
   * Запуск анализа КП
   */
  async startAnalysis(request: StartAnalysisRequest): Promise<StartAnalysisResponse> {
    try {
      const response = await fetch(`${this.baseURL}/api/kp-analyzer/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('devassist_simple_token')}`,
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`Analysis failed: ${response.statusText}`);
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('[KPAnalyzerService] Start analysis error:', error);
      throw error;
    }
  }

  /**
   * Получение статуса анализа
   */
  async getAnalysisStatus(analysisId: string): Promise<AnalysisStatusResponse> {
    try {
      const response = await fetch(`${this.baseURL}/api/kp-analyzer/status/${analysisId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('devassist_simple_token')}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to get status: ${response.statusText}`);
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('[KPAnalyzerService] Get status error:', error);
      throw error;
    }
  }

  /**
   * Получение результатов анализа
   */
  async getAnalysisResults(analysisId: string): Promise<{
    results: AnalysisResult[];
    comparison: ComparisonResult;
  }> {
    try {
      const response = await fetch(`${this.baseURL}/api/kp-analyzer/results/${analysisId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('devassist_simple_token')}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to get results: ${response.statusText}`);
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('[KPAnalyzerService] Get results error:', error);
      throw error;
    }
  }


  /**
   * WebSocket для real-time обновлений
   */
  subscribeToAnalysisUpdates(
    analysisId: string, 
    onUpdate: (status: AnalysisStatusResponse) => void,
    onError: (error: Error) => void
  ): () => void {
    const wsUrl = `${this.baseURL.replace('http', 'ws')}/api/kp-analyzer/subscribe/${analysisId}`;
    const ws = new WebSocket(wsUrl);

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        onUpdate(data);
      } catch (error) {
        onError(new Error('Failed to parse WebSocket message'));
      }
    };

    ws.onerror = () => {
      onError(new Error('WebSocket connection failed'));
    };

    ws.onclose = () => {
      console.log('[KPAnalyzerService] WebSocket connection closed');
    };

    return () => {
      ws.close();
    };
  }

  /**
   * Fallback модели для разработки
   */
  private getFallbackModels(): AIModelConfig[] {
    return [
      {
        id: 'claude-3-5-sonnet',
        name: 'Claude 3.5 Sonnet',
        provider: 'anthropic',
        model: 'claude-3-5-sonnet-20241022',
        temperature: 0.1,
        maxTokens: 4000,
        available: true,
      },
      {
        id: 'gpt-4o',
        name: 'GPT-4o',
        provider: 'openai',
        model: 'gpt-4o',
        temperature: 0.1,
        maxTokens: 4000,
        available: true,
      },
      {
        id: 'gemini-pro',
        name: 'Gemini Pro',
        provider: 'google',
        model: 'gemini-pro',
        temperature: 0.1,
        maxTokens: 4000,
        available: true,
      },
    ];
  }

  /**
   * Сохранение анализа в локальную историю
   */
  private saveAnalysisToHistory(comparison: ComparisonResult): void {
    try {
      const historyKey = 'kp_analyzer_history';
      const existingHistory = JSON.parse(localStorage.getItem(historyKey) || '[]');
      
      // Добавляем новый результат в начало списка
      const updatedHistory = [comparison, ...existingHistory.slice(0, 19)]; // Храним только последние 20
      
      localStorage.setItem(historyKey, JSON.stringify(updatedHistory));
      console.log('[KPAnalyzerService] Analysis saved to history:', comparison.id);
    } catch (error) {
      console.error('[KPAnalyzerService] Failed to save to history:', error);
    }
  }

  /**
   * Получение истории из localStorage
   */
  async getAnalysisHistory(): Promise<ComparisonResult[]> {
    try {
      const historyKey = 'kp_analyzer_history';
      const history = JSON.parse(localStorage.getItem(historyKey) || '[]');
      return history;
    } catch (error) {
      console.error('[KPAnalyzerService] Failed to load history:', error);
      return [];
    }
  }
}

export const kpAnalyzerService = new KPAnalyzerService();