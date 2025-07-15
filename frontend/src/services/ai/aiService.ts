/**
 * AI Service - Main service for AI operations
 * Unified interface for all AI providers
 * Согласно ТЗ DevAssist Pro
 */

import { OpenAIProvider } from './providers/openaiProvider';
import { AnthropicProvider } from './providers/anthropicProvider';
import { GoogleProvider } from './providers/googleProvider';
import { BaseAIProvider, AIRequest, AIResponse, AIStreamChunk, AIClientError, usageTracker } from './aiClient';
import { AIProvider, AIModel, UnifiedAIConfiguration, ModelConfig } from '../../types/aiConfig';
import { useAIConfig } from '../../hooks/useAIConfig';

export interface AIServiceConfig {
  openai?: {
    apiKey: string;
    organization?: string;
    baseUrl?: string;
  };
  anthropic?: {
    apiKey: string;
    baseUrl?: string;
  };
  google?: {
    apiKey: string;
    baseUrl?: string;
  };
  defaultProvider?: AIProvider;
  fallbackProviders?: AIProvider[];
  maxRetries?: number;
  timeout?: number;
}

export interface TaskRequest {
  taskType: 'text-analysis' | 'data-extraction' | 'report-generation' | 'web-search' | 'summarization' | 'comparison';
  prompt: string;
  systemPrompt?: string;
  context?: any;
  stream?: boolean;
  modelOverride?: string;
  providerOverride?: AIProvider;
}

export interface TaskResponse {
  id: string;
  taskType: string;
  content: string;
  model: string;
  provider: AIProvider;
  usage: AIResponse['usage'];
  cost: number;
  processingTime: number;
  finishReason: AIResponse['finishReason'];
  metadata?: any;
}

export class AIService {
  private providers: Map<AIProvider, BaseAIProvider> = new Map();
  private config: AIServiceConfig;
  private aiConfig: UnifiedAIConfiguration | null = null;

  constructor(config: AIServiceConfig) {
    this.config = config;
    this.initializeProviders();
  }

  // Инициализация провайдеров
  private initializeProviders(): void {
    if (this.config.openai?.apiKey) {
      this.providers.set('openai', new OpenAIProvider({
        apiKey: this.config.openai.apiKey,
        organization: this.config.openai.organization,
        baseUrl: this.config.openai.baseUrl,
        timeout: this.config.timeout
      }));
    }

    if (this.config.anthropic?.apiKey) {
      this.providers.set('anthropic', new AnthropicProvider({
        apiKey: this.config.anthropic.apiKey,
        baseUrl: this.config.anthropic.baseUrl,
        timeout: this.config.timeout
      }));
    }

    if (this.config.google?.apiKey) {
      this.providers.set('google', new GoogleProvider({
        apiKey: this.config.google.apiKey,
        baseUrl: this.config.google.baseUrl,
        timeout: this.config.timeout
      }));
    }
  }

  // Загрузка AI конфигурации
  async loadAIConfig(): Promise<void> {
    try {
      // В реальном приложении это будет использовать useAIConfig hook
      // Здесь используем mock данные для демонстрации
      this.aiConfig = await this.getMockAIConfig();
    } catch (error) {
      console.warn('Failed to load AI config, using defaults:', error);
    }
  }

  // Проверка доступности провайдеров с расширенным логированием
  async checkProviderAvailabilityWithDetails(): Promise<Map<AIProvider, { ok: boolean, error?: { code: string, status?: number, message?: string } }>> {
    const availability = new Map<AIProvider, { ok: boolean, error?: { code: string, status?: number, message?: string } }>();
    const providers = Array.from(this.providers.entries());

    function hasIsAvailableWithDetails(obj: any): obj is { isAvailableWithDetails: () => Promise<{ ok: boolean, error?: { code: string, status?: number, message?: string } }> } {
      return typeof obj.isAvailableWithDetails === 'function';
    }

    for (const [provider, instance] of providers) {
      try {
        if (hasIsAvailableWithDetails(instance)) {
          const result = await instance.isAvailableWithDetails();
          availability.set(provider, result);
        } else {
          // fallback: обычная проверка
          const ok = await instance.isAvailable();
          availability.set(provider, { ok });
        }
      } catch (err: any) {
        let errorInfo = { code: 'UNKNOWN', message: 'Unknown error' };
        if (err instanceof Error) {
          errorInfo = { code: err.name, message: err.message };
        } else if (typeof err === 'object' && err !== null) {
          errorInfo = { ...errorInfo, ...err };
        }
        availability.set(provider, { ok: false, error: errorInfo });
      }
    }

    return availability;
  }

  // Простая проверка доступности провайдеров (для обратной совместимости)
  async checkProviderAvailability(): Promise<Map<AIProvider, boolean>> {
    const detailed = await this.checkProviderAvailabilityWithDetails();
    const simple = new Map<AIProvider, boolean>();
    
    Array.from(detailed.entries()).forEach(([provider, details]) => {
      simple.set(provider, details.ok);
    });
    
    return simple;
  }

  // Получение списка доступных моделей
  async getAvailableModels(): Promise<AIModel[]> {
    const allModels: AIModel[] = [];
    const providers = Array.from(this.providers.entries());

    for (const [provider, instance] of providers) {
      try {
        const models = await instance.getModels();
        allModels.push(...models);
      } catch (error) {
        console.warn(`Failed to get models from ${provider}:`, error);
      }
    }

    return allModels;
  }

  // Основной метод для выполнения задач
  async executeTask(request: TaskRequest): Promise<TaskResponse> {
    const startTime = Date.now();

    try {
      // Определяем модель и провайдера для задачи
      const { model, provider } = this.selectModelForTask(request);
      
      // Получаем конфигурацию модели
      const modelConfig = this.getModelConfig(request.taskType, model);
      
      // Подготавливаем AI запрос
      const aiRequest: AIRequest = {
        model,
        prompt: request.prompt,
        systemPrompt: request.systemPrompt || modelConfig.systemPrompt,
        temperature: modelConfig.temperature,
        maxTokens: modelConfig.maxTokens,
        stream: request.stream || false,
        context: request.context
      };

      // Выполняем запрос с fallback механизмом
      const response = await this.executeWithFallback(provider, aiRequest);
      
      const processingTime = Date.now() - startTime;

      return {
        id: response.id,
        taskType: request.taskType,
        content: response.content,
        model: response.model,
        provider,
        usage: response.usage,
        cost: response.cost,
        processingTime,
        finishReason: response.finishReason,
        metadata: {
          ...response.metadata,
          originalRequest: {
            taskType: request.taskType,
            modelOverride: request.modelOverride,
            providerOverride: request.providerOverride
          }
        }
      };
    } catch (error) {
      const processingTime = Date.now() - startTime;
      throw new AIClientError({
        code: 'TASK_EXECUTION_FAILED',
        message: `Failed to execute ${request.taskType} task: ${error instanceof Error ? error.message : 'Unknown error'}`,
        type: 'server_error',
        details: { processingTime, taskType: request.taskType }
      });
    }
  }

  // Стриминг версия выполнения задач
  async* executeTaskStream(request: TaskRequest): AsyncGenerator<{
    id: string;
    taskType: string;
    delta: string;
    isComplete: boolean;
    model: string;
    provider: AIProvider;
    usage?: AIResponse['usage'];
    cost?: number;
    processingTime?: number;
  }, void, unknown> {
    const startTime = Date.now();

    try {
      // Определяем модель и провайдера для задачи
      const { model, provider } = this.selectModelForTask(request);
      
      // Получаем конфигурацию модели
      const modelConfig = this.getModelConfig(request.taskType, model);
      
      // Подготавливаем AI запрос
      const aiRequest: AIRequest = {
        model,
        prompt: request.prompt,
        systemPrompt: request.systemPrompt || modelConfig.systemPrompt,
        temperature: modelConfig.temperature,
        maxTokens: modelConfig.maxTokens,
        stream: true,
        context: request.context
      };

      const providerInstance = this.providers.get(provider);
      if (!providerInstance) {
        throw new AIClientError({
          code: 'PROVIDER_NOT_AVAILABLE',
          message: `Provider ${provider} is not available`,
          type: 'invalid_request'
        });
      }

      // Стриминг с fallback в случае ошибки
      try {
        for await (const chunk of providerInstance.stream(aiRequest)) {
          const processingTime = chunk.isComplete ? Date.now() - startTime : undefined;
          
          yield {
            id: chunk.id,
            taskType: request.taskType,
            delta: chunk.delta,
            isComplete: chunk.isComplete,
            model,
            provider,
            usage: chunk.usage,
            cost: chunk.cost,
            processingTime
          };
        }
      } catch (error) {
        // Попытка fallback для стриминга
        const fallbackProviders = this.getFallbackProviders(provider);
        
        if (fallbackProviders.length > 0) {
          console.warn(`Streaming failed for ${provider}, trying fallback:`, error);
          
          for (const fallbackProvider of fallbackProviders) {
            try {
              const fallbackInstance = this.providers.get(fallbackProvider);
              if (!fallbackInstance) continue;

              // Обновляем модель для fallback провайдера
              const fallbackModel = this.selectModelForProvider(fallbackProvider, request.taskType);
              const fallbackRequest = { ...aiRequest, model: fallbackModel };

              for await (const chunk of fallbackInstance.stream(fallbackRequest)) {
                const processingTime = chunk.isComplete ? Date.now() - startTime : undefined;
                
                yield {
                  id: chunk.id,
                  taskType: request.taskType,
                  delta: chunk.delta,
                  isComplete: chunk.isComplete,
                  model: fallbackModel,
                  provider: fallbackProvider,
                  usage: chunk.usage,
                  cost: chunk.cost,
                  processingTime
                };
              }
              return; // Успешно выполнено с fallback
            } catch (fallbackError) {
              console.warn(`Fallback streaming failed for ${fallbackProvider}:`, fallbackError);
            }
          }
        }
        
        throw error; // Все fallback провайдеры не сработали
      }
    } catch (error) {
      throw new AIClientError({
        code: 'STREAM_EXECUTION_FAILED',
        message: `Failed to stream ${request.taskType} task: ${error instanceof Error ? error.message : 'Unknown error'}`,
        type: 'server_error',
        details: { taskType: request.taskType }
      });
    }
  }

  // Специализированные методы для конкретных задач

  async analyzeKP(kpContent: string, tzContent: string, criteria?: string[]): Promise<TaskResponse> {
    const systemPrompt = `Ты - эксперт по анализу коммерческих предложений (КП) в сфере строительства и девелопмента.
Твоя задача - проанализировать КП на соответствие техническому заданию (ТЗ) и дать детальную оценку.

Критерии анализа:
${criteria?.join(', ') || 'технические требования, финансовые условия, сроки выполнения, квалификация исполнителя, предлагаемые решения'}

Формат ответа должен быть JSON со следующей структурой:
{
  "compliance_score": 0-100,
  "technical_compliance": 0-100,
  "financial_evaluation": 0-100,
  "timeline_feasibility": 0-100,
  "contractor_assessment": 0-100,
  "strengths": ["список сильных сторон"],
  "weaknesses": ["список слабых сторон"],
  "recommendations": ["список рекомендаций"],
  "risk_factors": ["список рисков"],
  "summary": "краткое резюме анализа"
}`;

    const prompt = `ТЕХНИЧЕСКОЕ ЗАДАНИЕ:
${tzContent}

КОММЕРЧЕСКОЕ ПРЕДЛОЖЕНИЕ ДЛЯ АНАЛИЗА:
${kpContent}

Проведи детальный анализ КП на соответствие ТЗ и предоставь результат в указанном JSON формате.`;

    return this.executeTask({
      taskType: 'data-extraction',
      prompt,
      systemPrompt
    });
  }

  async compareKPs(kps: Array<{ id: string; content: string; title: string }>, tzContent: string): Promise<TaskResponse> {
    const systemPrompt = `Ты - эксперт по сравнительному анализу коммерческих предложений.
Твоя задача - сравнить несколько КП и ранжировать их по соответствию ТЗ.

Формат ответа должен быть JSON со следующей структурой:
{
  "comparison_results": [
    {
      "kp_id": "id",
      "kp_title": "название",
      "overall_score": 0-100,
      "ranking": 1,
      "scores": {
        "technical": 0-100,
        "financial": 0-100,
        "timeline": 0-100,
        "contractor": 0-100
      },
      "strengths": ["список"],
      "weaknesses": ["список"]
    }
  ],
  "summary": "общий вывод по сравнению",
  "recommendation": "рекомендация по выбору"
}`;

    const kpTexts = kps.map(kp => `КП ID: ${kp.id}
НАЗВАНИЕ: ${kp.title}
СОДЕРЖАНИЕ: ${kp.content}`).join('\n\n---\n\n');

    const prompt = `ТЕХНИЧЕСКОЕ ЗАДАНИЕ:
${tzContent}

КОММЕРЧЕСКИЕ ПРЕДЛОЖЕНИЯ ДЛЯ СРАВНЕНИЯ:
${kpTexts}

Проведи сравнительный анализ всех КП и предоставь результат в указанном JSON формате.`;

    return this.executeTask({
      taskType: 'comparison',
      prompt,
      systemPrompt
    });
  }

  async generateReport(analysisResults: any[], options?: { format?: 'executive' | 'detailed'; language?: 'ru' | 'en' }): Promise<TaskResponse> {
    const format = options?.format || 'detailed';
    const language = options?.language || 'ru';

    const systemPrompt = `Ты - эксперт по составлению аналитических отчетов в сфере строительства и девелопмента.
Создай ${format === 'executive' ? 'краткий исполнительный' : 'подробный аналитический'} отчет на ${language === 'ru' ? 'русском' : 'английском'} языке.

Структура отчета (11-пунктовая):
1. Резюме / Ключевые Выводы
2. Вводная информация
3. Обзор документа
4. Детальное сравнение
5. Анализ полноты охвата
6. Финансовый анализ
7. Анализ рисков и угроз
8. Оценка предложенного решения
9. Оценка поставщика
10. Сводный анализ рисков
11. Заключение и рекомендации

Верни результат в HTML формате с использованием CSS классов:
- .high (зеленый) - высокие показатели ≥80%
- .medium (желтый) - средние показатели 60-79%
- .low (красный) - низкие показатели <60%
- .warning - предупреждения и риски
- .recommendation - итоговые рекомендации
- .table-responsive - адаптивные таблицы`;

    const prompt = `Результаты анализа КП:
${JSON.stringify(analysisResults, null, 2)}

Создай профессиональный HTML отчет по результатам анализа коммерческих предложений с 11-пунктовой структурой.`;

    return this.executeTask({
      taskType: 'report-generation',
      prompt,
      systemPrompt
    });
  }

  async extractDocumentData(text: string, model?: string): Promise<TaskResponse> {
    const systemPrompt = `Ты - эксперт по анализу коммерческих документов. Твоя задача - извлечь ключевую информацию из документа и вернуть её в структурированном JSON формате.

Извлеки следующую информацию:
- company_name: Название компании-исполнителя
- tech_stack: Массив используемых технологий
- pricing: Общая стоимость (число)
- timeline: Сроки выполнения
- contact_info: Контактная информация
- key_features: Ключевые особенности предложения
- team_size: Размер команды
- experience: Опыт работы компании

Формат ответа - строго JSON без дополнительного текста:
{
  "company_name": "...",
  "tech_stack": ["...", "..."],
  "pricing": 0,
  "timeline": "...",
  "contact_info": "...",
  "key_features": ["...", "..."],
  "team_size": 0,
  "experience": "..."
}`;

    const prompt = `Документ для анализа:
${text.substring(0, 8000)}

Проанализируй документ и извлеки ключевую информацию в указанном JSON формате.`;

    return this.executeTask({
      taskType: 'data-extraction',
      prompt,
      systemPrompt,
      modelOverride: model
    });
  }

  async compareDocuments(doc1Text: string, doc2Text: string, model?: string): Promise<TaskResponse> {
    const systemPrompt = `Ты - эксперт по анализу соответствия коммерческих предложений техническим заданиям. Сравни ТЗ и КП, оцени степень соответствия.

Проанализируй:
- compliance_score: Общий балл соответствия (0-100)
- technical_compliance: Техническое соответствие (0-100)
- functional_compliance: Функциональное соответствие (0-100)
- missing_requirements: Массив отсутствующих требований
- additional_features: Массив дополнительных возможностей
- risks: Массив выявленных рисков
- strengths: Массив сильных сторон
- weaknesses: Массив слабых сторон

Формат ответа - строго JSON без дополнительного текста:
{
  "compliance_score": 85,
  "technical_compliance": 90,
  "functional_compliance": 80,
  "missing_requirements": ["...", "..."],
  "additional_features": ["...", "..."],
  "risks": ["...", "..."],
  "strengths": ["...", "..."],
  "weaknesses": ["...", "..."]
}`;

    const prompt = `ТЕХНИЧЕСКОЕ ЗАДАНИЕ:
${doc1Text.substring(0, 4000)}

КОММЕРЧЕСКОЕ ПРЕДЛОЖЕНИЕ:
${doc2Text.substring(0, 4000)}

Сравни ТЗ и КП, оцени степень соответствия и предоставь результат в указанном JSON формате.`;

    return this.executeTask({
      taskType: 'comparison',
      prompt,
      systemPrompt,
      modelOverride: model
    });
  }

  async generateRecommendation(comparisonResult: any, summary: any, model?: string): Promise<TaskResponse> {
    const systemPrompt = `Ты - консультант по закупкам и тендерам. На основе анализа создай рекомендации по коммерческому предложению.

Сгенерируй:
- strength: Краткое описание главных преимуществ
- weakness: Краткое описание основных недостатков
- summary: Общая оценка предложения
- recommendation: Финальная рекомендация (принять/отклонить/доработать)
- decision_rationale: Обоснование решения
- next_steps: Следующие шаги

Формат ответа - строго JSON без дополнительного текста:
{
  "strength": "...",
  "weakness": "...",
  "summary": "...",
  "recommendation": "принять|отклонить|доработать",
  "decision_rationale": "...",
  "next_steps": ["...", "..."]
}`;

    const prompt = `РЕЗУЛЬТАТ СРАВНЕНИЯ:
${JSON.stringify(comparisonResult, null, 2)}

СВОДКА:
${JSON.stringify(summary, null, 2)}

На основе результатов анализа создай рекомендации в указанном JSON формате.`;

    return this.executeTask({
      taskType: 'text-analysis',
      prompt,
      systemPrompt,
      modelOverride: model
    });
  }

  // Приватные методы

  private selectModelForTask(request: TaskRequest): { model: string; provider: AIProvider } {
    // Если указан override, используем его
    if (request.modelOverride && request.providerOverride) {
      return { model: request.modelOverride, provider: request.providerOverride };
    }

    // Используем конфигурацию из aiConfig
    if (this.aiConfig) {
      const defaultModels = this.aiConfig.general.defaultModels;
      const taskMapping: Record<string, keyof typeof defaultModels> = {
        'text-analysis': 'textAnalysis',
        'data-extraction': 'dataExtraction',
        'report-generation': 'reportGeneration',
        'web-search': 'webSearch',
        'summarization': 'textAnalysis',
        'comparison': 'textAnalysis'
      };

      const configKey = taskMapping[request.taskType];
      if (configKey && defaultModels[configKey]) {
        const modelConfig = defaultModels[configKey];
        const provider = this.getProviderForModel(modelConfig.modelId);
        if (provider) {
          return { model: modelConfig.modelId, provider };
        }
      }
    }

    // Fallback к дефолтным настройкам
    const defaultProvider = this.config.defaultProvider || 'openai';
    const defaultModel = this.selectModelForProvider(defaultProvider, request.taskType);
    
    return { model: defaultModel, provider: defaultProvider };
  }

  private selectModelForProvider(provider: AIProvider, taskType: string): string {
    const providerModels: Record<AIProvider, Record<string, string>> = {
      openai: {
        'text-analysis': 'gpt-4o',
        'data-extraction': 'gpt-4-turbo',
        'report-generation': 'gpt-4o',
        'web-search': 'gpt-3.5-turbo',
        'summarization': 'gpt-4o',
        'comparison': 'gpt-4-turbo'
      },
      anthropic: {
        'text-analysis': 'claude-3-5-sonnet-20241022',
        'data-extraction': 'claude-3-5-sonnet-20241022',
        'report-generation': 'claude-3-opus-20240229',
        'web-search': 'claude-3-haiku-20240307',
        'summarization': 'claude-3-5-sonnet-20241022',
        'comparison': 'claude-3-5-sonnet-20241022'
      },
      google: {
        'text-analysis': 'gemini-1.5-pro',
        'data-extraction': 'gemini-1.5-pro',
        'report-generation': 'gemini-1.5-pro',
        'web-search': 'gemini-pro',
        'summarization': 'gemini-1.5-flash',
        'comparison': 'gemini-1.5-pro'
      },
      custom: {
        'text-analysis': 'custom-model',
        'data-extraction': 'custom-model',
        'report-generation': 'custom-model',
        'web-search': 'custom-model',
        'summarization': 'custom-model',
        'comparison': 'custom-model'
      }
    };

    return providerModels[provider]?.[taskType] || providerModels[provider]?.['text-analysis'] || 'gpt-4o';
  }

  private getProviderForModel(modelId: string): AIProvider | null {
    if (modelId.includes('gpt')) return 'openai';
    if (modelId.includes('claude')) return 'anthropic';
    if (modelId.includes('gemini')) return 'google';
    return null;
  }

  private getModelConfig(taskType: string, model: string): ModelConfig {
    if (this.aiConfig) {
      const defaultModels = this.aiConfig.general.defaultModels;
      const taskMapping: Record<string, keyof typeof defaultModels> = {
        'text-analysis': 'textAnalysis',
        'data-extraction': 'dataExtraction',
        'report-generation': 'reportGeneration',
        'web-search': 'webSearch',
        'summarization': 'textAnalysis',
        'comparison': 'textAnalysis'
      };

      const configKey = taskMapping[taskType];
      if (configKey && defaultModels[configKey]) {
        return defaultModels[configKey];
      }
    }

    // Дефолтные настройки
    return {
      modelId: model,
      temperature: 0.7,
      maxTokens: 4000,
      timeout: 30,
      retries: 2,
      fallbackModels: []
    };
  }

  private getFallbackProviders(currentProvider: AIProvider): AIProvider[] {
    if (this.config.fallbackProviders) {
      return this.config.fallbackProviders.filter(p => p !== currentProvider);
    }

    // Дефолтные fallback провайдеры
    const fallbackOrder: Record<AIProvider, AIProvider[]> = {
      openai: ['anthropic', 'google'],
      anthropic: ['openai', 'google'],
      google: ['openai', 'anthropic'],
      custom: ['openai', 'anthropic', 'google']
    };

    return fallbackOrder[currentProvider] || [];
  }

  private async executeWithFallback(provider: AIProvider, request: AIRequest): Promise<AIResponse> {
    const providerInstance = this.providers.get(provider);
    if (!providerInstance) {
      throw new AIClientError({
        code: 'PROVIDER_NOT_AVAILABLE',
        message: `Provider ${provider} is not available`,
        type: 'invalid_request'
      });
    }

    try {
      return await providerInstance.chat(request);
    } catch (error) {
      console.warn(`Request failed for ${provider}, trying fallbacks:`, error);
      
      const fallbackProviders = this.getFallbackProviders(provider);
      
      for (const fallbackProvider of fallbackProviders) {
        try {
          const fallbackInstance = this.providers.get(fallbackProvider);
          if (!fallbackInstance) continue;

          // Обновляем модель для fallback провайдера
          const fallbackModel = this.selectModelForProvider(fallbackProvider, 'text-analysis');
          const fallbackRequest = { ...request, model: fallbackModel };

          return await fallbackInstance.chat(fallbackRequest);
        } catch (fallbackError) {
          console.warn(`Fallback failed for ${fallbackProvider}:`, fallbackError);
        }
      }
      
      throw error; // Все fallback провайдеры не сработали
    }
  }

  // Получение статистики использования
  getUsageStatistics(provider?: AIProvider): any {
    return usageTracker.getUsage(provider);
  }

  getTotalCost(provider?: AIProvider): number {
    return usageTracker.getTotalCost(provider);
  }

  // Mock конфигурация для демонстрации
  private async getMockAIConfig(): Promise<UnifiedAIConfiguration> {
    // Имитируем загрузку конфигурации
    await new Promise(resolve => setTimeout(resolve, 100));
    
    return {
      general: {
        defaultModels: {
          textAnalysis: {
            modelId: 'gpt-4o',
            temperature: 0.3,
            maxTokens: 4000,
            timeout: 30,
            retries: 2,
            fallbackModels: ['claude-3-5-sonnet-20241022']
          },
          dataExtraction: {
            modelId: 'claude-3-5-sonnet-20241022',
            temperature: 0.1,
            maxTokens: 8000,
            timeout: 45,
            retries: 3,
            fallbackModels: ['gpt-4-turbo']
          },
          reportGeneration: {
            modelId: 'gpt-4-turbo',
            temperature: 0.7,
            maxTokens: 8000,
            timeout: 60,
            retries: 2,
            fallbackModels: ['claude-3-opus-20240229']
          },
          webSearch: {
            modelId: 'gemini-pro',
            temperature: 0.2,
            maxTokens: 2000,
            timeout: 20,
            retries: 1,
            fallbackModels: ['gpt-3.5-turbo']
          }
        },
        moduleOverrides: new Map(),
        costLimits: {
          dailyLimit: 100,
          monthlyLimit: 2000,
          perRequestLimit: 5,
          warningThresholds: { daily: 80, monthly: 1800 },
          alertsEnabled: true,
          autoStopOnLimit: false,
          budgetAllocation: {
            'kp-analyzer': 40,
            'tz-generator': 25,
            'project-evaluation': 20,
            'marketing-planner': 10,
            'knowledge-base': 5
          }
        },
        performanceMode: 'balanced'
      },
      providers: {
        openai: {
          apiKey: '',
          timeout: 30,
          rateLimits: { requestsPerMinute: 3500, tokensPerMinute: 40000, requestsPerDay: 10000 },
          priority: 1,
          enabled: true
        },
        anthropic: {
          apiKey: '',
          timeout: 30,
          rateLimits: { requestsPerMinute: 1000, tokensPerMinute: 20000, requestsPerDay: 5000 },
          priority: 2,
          enabled: true
        },
        google: {
          apiKey: '',
          timeout: 20,
          rateLimits: { requestsPerMinute: 500, tokensPerMinute: 10000, requestsPerDay: 2000 },
          priority: 3,
          enabled: true
        }
      },
      models: [],
      prompts: [],
      performance: {
        mode: 'balanced',
        description: 'Оптимальный баланс качества и скорости',
        settings: {
          preferredProviders: ['openai', 'anthropic'],
          timeoutMultiplier: 1.0,
          retryCount: 2,
          cacheEnabled: true,
          parallelProcessing: true,
          modelSelectionStrategy: 'balanced'
        }
      },
      cache: {
        enabled: true,
        ttl: 3600,
        maxSize: 100,
        strategy: 'lru',
        keyGenerationStrategy: 'hash',
        invalidationRules: {
          onModelChange: true,
          onPromptChange: true,
          onConfigChange: false
        }
      },
      monitoring: {
        enabled: true,
        alertChannels: [],
        thresholds: {
          responseTime: 30,
          errorRate: 5,
          costPerHour: 10,
          tokenUsageRate: 1000
        },
        reportingInterval: 60,
        retentionPeriod: 30
      },
      apiKeys: [],
      experimental: {
        multiModelEnsemble: false,
        adaptiveTimeout: false,
        intelligentRetry: true,
        contextAwarePrompting: false,
        dynamicModelSelection: false,
        crossProviderFallback: true,
        realTimeOptimization: false
      },
      lastUpdated: new Date().toISOString(),
      version: '1.0.0'
    };
  }
}

// Глобальный экземпляр AI сервиса
let aiServiceInstance: AIService | null = null;

export function initializeAIService(config: AIServiceConfig): AIService {
  aiServiceInstance = new AIService(config);
  aiServiceInstance.loadAIConfig();
  return aiServiceInstance;
}

export function getAIService(): AIService {
  if (!aiServiceInstance) {
    throw new Error('AI Service not initialized. Call initializeAIService first.');
  }
  return aiServiceInstance;
}