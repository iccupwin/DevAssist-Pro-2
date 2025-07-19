/**
 * Fixed AI Service - Proper Claude API integration
 * Исправленный AI сервис с корректной интеграцией Claude API
 */

import { apiClient } from '../apiClientFixed';
import { AnthropicProvider } from './providers/anthropicProvider';

export interface AIRequest {
  prompt: string;
  systemPrompt?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
}

export interface AIResponse {
  id: string;
  content: string;
  model: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  cost: number;
  finishReason: 'stop' | 'length' | 'content_filter' | 'error';
  timestamp: Date;
}

export interface KPAnalysisRequest {
  tzText: string;
  kpText: string;
  kpFileName: string;
  model?: string;
}

export interface KPAnalysisResponse {
  id: string;
  summary: {
    companyName: string;
    techStack: string;
    pricing: string;
    timeline: string;
  };
  analysis: {
    overallScore: number;
    compliancePercentage: number;
    technicalScore: number;
    commercialScore: number;
    experienceScore: number;
    timelineScore: number;
    strengths: string[];
    weaknesses: string[];
    recommendations: string[];
    detailedAnalysis: string;
  };
  cost: number;
  processingTime: number;
  timestamp: Date;
}

class AIService {
  private anthropicProvider: AnthropicProvider | null = null;
  private isInitialized = false;

  constructor() {
    this.initialize();
  }

  /**
   * Инициализация AI провайдеров
   */
  private async initialize(): Promise<void> {
    try {
      const anthropicApiKey = process.env.REACT_APP_ANTHROPIC_API_KEY;
      
      if (anthropicApiKey && anthropicApiKey !== 'your_anthropic_api_key_here') {
        this.anthropicProvider = new AnthropicProvider({
          apiKey: anthropicApiKey
        });

        // Test provider availability
        const isAvailable = await this.anthropicProvider.isAvailableWithDetails();
        if (isAvailable.ok) {
          console.log('[AIService] Anthropic provider initialized successfully');
        } else {
          console.warn('[AIService] Anthropic provider initialization failed:', isAvailable.error);
          this.anthropicProvider = null;
        }
      } else {
        console.warn('[AIService] Anthropic API key not configured');
      }

      this.isInitialized = true;
    } catch (error) {
      console.error('[AIService] Failed to initialize AI providers:', error);
      this.isInitialized = true; // Mark as initialized even on error
    }
  }

  /**
   * Ожидание инициализации
   */
  private async waitForInitialization(): Promise<void> {
    while (!this.isInitialized) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  /**
   * Генерация текста с использованием AI
   */
  async generateText(request: AIRequest): Promise<AIResponse> {
    await this.waitForInitialization();

    // Try Claude first if available
    if (this.anthropicProvider) {
      try {
        console.log('[AIService] Using Anthropic Claude for text generation');
        
        const model = request.model || 'claude-3-5-sonnet-20240620';
        const response = await this.anthropicProvider.chat({
          model,
          prompt: request.prompt,
          systemPrompt: request.systemPrompt,
          temperature: request.temperature || 0.7,
          maxTokens: request.maxTokens || 4000,
        });

        return {
          id: response.id,
          content: response.content,
          model: response.model,
          usage: response.usage,
          cost: response.cost,
          finishReason: response.finishReason,
          timestamp: new Date(),
        };
      } catch (error) {
        console.error('[AIService] Anthropic request failed:', error);
        // Fall through to backend API
      }
    }

    // Fallback to backend API
    try {
      console.log('[AIService] Using backend API for text generation');
      
      const response = await apiClient.post<AIResponse>('/api/v1/llm/generate', {
        prompt: request.prompt,
        systemPrompt: request.systemPrompt,
        model: request.model || 'claude-3-5-sonnet-20240620',
        temperature: request.temperature || 0.7,
        maxTokens: request.maxTokens || 4000,
      });

      return response.data;
    } catch (error) {
      console.error('[AIService] Backend API request failed:', error);
      throw new Error('All AI providers failed. Please check your configuration.');
    }
  }

  /**
   * Streaming генерация текста
   */
  async* generateTextStream(request: AIRequest): AsyncGenerator<string, void, unknown> {
    await this.waitForInitialization();

    // Try Claude streaming first if available
    if (this.anthropicProvider) {
      try {
        console.log('[AIService] Using Anthropic Claude for streaming');
        
        const model = request.model || 'claude-3-5-sonnet-20240620';
        
        for await (const chunk of this.anthropicProvider.stream({
          model,
          prompt: request.prompt,
          systemPrompt: request.systemPrompt,
          temperature: request.temperature || 0.7,
          maxTokens: request.maxTokens || 4000,
        })) {
          if (chunk.delta) {
            yield chunk.delta;
          }
        }
        return;
      } catch (error) {
        console.error('[AIService] Anthropic streaming failed:', error);
        // Fall through to backend API
      }
    }

    // Fallback to backend streaming API
    try {
      console.log('[AIService] Using backend API for streaming');
      
      const stream = await apiClient.stream('/api/v1/llm/generate/stream', {
        prompt: request.prompt,
        systemPrompt: request.systemPrompt,
        model: request.model || 'claude-3-5-sonnet-20240620',
        temperature: request.temperature || 0.7,
        maxTokens: request.maxTokens || 4000,
      });

      const reader = stream.getReader();
      const decoder = new TextDecoder();

      try {
        while (true) {
          const { done, value } = await reader.read();
          
          if (done) break;
          
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');
          
          for (const line of lines) {
            if (line.trim() && line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                if (data.chunk) {
                  yield data.chunk;
                }
              } catch (parseError) {
                console.warn('[AIService] Failed to parse stream chunk:', parseError);
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
      }
    } catch (error) {
      console.error('[AIService] Backend streaming failed:', error);
      throw new Error('Streaming generation failed. Please try again.');
    }
  }

  /**
   * Анализ КП документов
   */
  async analyzeKP(request: KPAnalysisRequest): Promise<KPAnalysisResponse> {
    await this.waitForInitialization();

    const startTime = Date.now();

    try {
      // Use specialized KP analysis prompt
      const systemPrompt = `Ты эксперт по анализу коммерческих предложений в сфере строительства и девелопмента.
      Проводи тщательный анализ КП на соответствие техническому заданию.
      
      Твоя задача:
      1. Извлечь ключевую информацию из КП
      2. Оценить соответствие требованиям ТЗ
      3. Дать объективную оценку по критериям
      4. Предоставить конструктивные рекомендации
      
      Верни результат в структурированном JSON формате.`;

      const userPrompt = `Проанализируй коммерческое предложение на соответствие техническому заданию:

ТЕХНИЧЕСКОЕ ЗАДАНИЕ:
${request.tzText}

КОММЕРЧЕСКОЕ ПРЕДЛОЖЕНИЕ (${request.kpFileName}):
${request.kpText}

Проведи детальный анализ и верни результат в следующем JSON формате:
{
  "summary": {
    "companyName": "название компании",
    "techStack": "используемые технологии",
    "pricing": "ценовое предложение",
    "timeline": "временные рамки"
  },
  "analysis": {
    "overallScore": число_от_0_до_100,
    "compliancePercentage": процент_соответствия,
    "technicalScore": техническая_оценка,
    "commercialScore": коммерческая_оценка,
    "experienceScore": оценка_опыта,
    "timelineScore": оценка_сроков,
    "strengths": ["сильная сторона 1", "сильная сторона 2"],
    "weaknesses": ["слабая сторона 1", "слабая сторона 2"],
    "recommendations": ["рекомендация 1", "рекомендация 2"],
    "detailedAnalysis": "подробный анализ"
  }
}`;

      const response = await this.generateText({
        prompt: userPrompt,
        systemPrompt,
        model: request.model || 'claude-3-5-sonnet-20240620',
        temperature: 0.1, // Low temperature for consistent analysis
        maxTokens: 4000,
      });

      // Parse JSON response
      let analysisResult;
      try {
        // Clean up the response content
        const cleanContent = response.content
          .replace(/```json\n?/g, '')
          .replace(/```\n?/g, '')
          .trim();
        
        analysisResult = JSON.parse(cleanContent);
      } catch (parseError) {
        console.error('[AIService] Failed to parse KP analysis response:', parseError);
        
        // Return fallback response
        analysisResult = {
          summary: {
            companyName: 'Не удалось извлечь',
            techStack: 'Не удалось извлечь',
            pricing: 'Не удалось извлечь',
            timeline: 'Не удалось извлечь',
          },
          analysis: {
            overallScore: 0,
            compliancePercentage: 0,
            technicalScore: 0,
            commercialScore: 0,
            experienceScore: 0,
            timelineScore: 0,
            strengths: ['Анализ недоступен из-за ошибки парсинга'],
            weaknesses: ['Требуется ручная проверка'],
            recommendations: ['Повторите анализ или обратитесь к специалисту'],
            detailedAnalysis: 'Ошибка при парсинге результатов анализа AI',
          },
        };
      }

      const processingTime = Date.now() - startTime;

      return {
        id: response.id,
        summary: analysisResult.summary,
        analysis: analysisResult.analysis,
        cost: response.cost,
        processingTime,
        timestamp: new Date(),
      };
    } catch (error) {
      console.error('[AIService] KP analysis failed:', error);
      throw new Error('Не удалось провести анализ КП. Попробуйте еще раз.');
    }
  }

  /**
   * Проверка доступности AI провайдеров
   */
  async checkProviders(): Promise<{
    anthropic: { available: boolean; error?: string };
    backend: { available: boolean; error?: string };
  }> {
    await this.waitForInitialization();

    const result = {
      anthropic: { available: false, error: undefined as string | undefined },
      backend: { available: false, error: undefined as string | undefined },
    };

    // Check Anthropic
    if (this.anthropicProvider) {
      try {
        const availability = await this.anthropicProvider.isAvailableWithDetails();
        result.anthropic.available = availability.ok;
        if (!availability.ok && availability.error) {
          result.anthropic.error = availability.error.message;
        }
      } catch (error) {
        result.anthropic.error = error instanceof Error ? error.message : 'Unknown error';
      }
    } else {
      result.anthropic.error = 'Provider not initialized';
    }

    // Check backend
    try {
      const healthResponse = await apiClient.get('/api/v1/llm/health');
      result.backend.available = healthResponse.success;
    } catch (error) {
      result.backend.error = error instanceof Error ? error.message : 'Unknown error';
    }

    return result;
  }

  /**
   * Получение доступных моделей
   */
  async getAvailableModels(): Promise<string[]> {
    await this.waitForInitialization();

    const models: string[] = [];

    // Add Anthropic models if available
    if (this.anthropicProvider) {
      try {
        const anthropicModels = await this.anthropicProvider.getModels();
        models.push(...anthropicModels.map(m => m.id));
      } catch (error) {
        console.warn('[AIService] Failed to get Anthropic models:', error);
      }
    }

    // Add backend models
    try {
      const response = await apiClient.get('/api/v1/llm/models');
      if (response.success && response.data.models) {
        models.push(...response.data.models.map((m: any) => m.model));
      }
    } catch (error) {
      console.warn('[AIService] Failed to get backend models:', error);
    }

    // Remove duplicates and return
    return [...new Set(models)];
  }
}

// Export singleton instance
export const aiService = new AIService();
export default aiService;