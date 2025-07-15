/**
 * AI Client - Unified client for all AI providers
 * Согласно ТЗ DevAssist Pro
 */

import { AIProvider, ModelConfig, AIModel } from '../../types/aiConfig';

export interface AIRequest {
  model: string;
  prompt: string;
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
  context?: any;
}

export interface AIResponse {
  id: string;
  model: string;
  content: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  cost: number;
  finishReason: 'stop' | 'length' | 'content_filter' | 'error';
  metadata?: any;
}

export interface AIStreamChunk {
  id: string;
  delta: string;
  isComplete: boolean;
  usage?: AIResponse['usage'];
  cost?: number;
}

export interface AIError {
  code: string;
  message: string;
  type: 'rate_limit' | 'insufficient_quota' | 'invalid_request' | 'server_error' | 'network_error';
  retryAfter?: number;
  details?: any;
}

export class AIClientError extends Error {
  public readonly code: string;
  public readonly type: AIError['type'];
  public readonly retryAfter?: number;
  public readonly details?: any;

  constructor(error: AIError) {
    super(error.message);
    this.name = 'AIClientError';
    this.code = error.code;
    this.type = error.type;
    this.retryAfter = error.retryAfter;
    this.details = error.details;
  }
}

export abstract class BaseAIProvider {
  protected abstract provider: AIProvider;
  protected abstract apiKey: string;
  protected abstract baseUrl: string;

  abstract isAvailable(): Promise<boolean>;
  abstract getModels(): Promise<AIModel[]>;
  abstract chat(request: AIRequest): Promise<AIResponse>;
  abstract stream(request: AIRequest): AsyncGenerator<AIStreamChunk, void, unknown>;
  
  protected abstract handleError(error: any): AIClientError;
  protected abstract calculateCost(model: string, usage: AIResponse['usage']): number;

  // Общие методы
  protected validateRequest(request: AIRequest): void {
    if (!request.model) {
      throw new AIClientError({
        code: 'INVALID_MODEL',
        message: 'Model is required',
        type: 'invalid_request'
      });
    }

    if (!request.prompt) {
      throw new AIClientError({
        code: 'INVALID_PROMPT',
        message: 'Prompt is required',
        type: 'invalid_request'
      });
    }

    if (request.maxTokens && request.maxTokens > 100000) {
      throw new AIClientError({
        code: 'MAX_TOKENS_EXCEEDED',
        message: 'Max tokens exceeded',
        type: 'invalid_request'
      });
    }
  }

  protected generateId(): string {
    return `${this.provider}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  protected logRequest(request: AIRequest): void {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[${this.provider.toUpperCase()}] Request:`, {
        model: request.model,
        promptLength: request.prompt.length,
        temperature: request.temperature,
        maxTokens: request.maxTokens,
        stream: request.stream
      });
    }
  }

  protected logResponse(response: AIResponse): void {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[${this.provider.toUpperCase()}] Response:`, {
        id: response.id,
        model: response.model,
        contentLength: response.content.length,
        usage: response.usage,
        cost: response.cost,
        finishReason: response.finishReason
      });
    }
  }
}

// Retry механизм с exponential backoff
export class RetryHandler {
  private maxRetries: number;
  private baseDelay: number;
  private maxDelay: number;

  constructor(maxRetries = 3, baseDelay = 1000, maxDelay = 30000) {
    this.maxRetries = maxRetries;
    this.baseDelay = baseDelay;
    this.maxDelay = maxDelay;
  }

  async execute<T>(
    operation: () => Promise<T>,
    shouldRetry: (error: AIClientError) => boolean = () => true
  ): Promise<T> {
    let lastError: AIClientError;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error instanceof AIClientError ? error : new AIClientError({
          code: 'UNKNOWN_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
          type: 'server_error'
        });

        // Если это последняя попытка или ошибка не подлежит повтору
        if (attempt === this.maxRetries || !shouldRetry(lastError)) {
          throw lastError;
        }

        // Вычисляем задержку
        const delay = Math.min(
          this.baseDelay * Math.pow(2, attempt),
          this.maxDelay
        );

        // Если есть Retry-After заголовок, используем его
        const finalDelay = lastError.retryAfter 
          ? Math.max(lastError.retryAfter * 1000, delay)
          : delay;

        console.warn(`[AI] Retry attempt ${attempt + 1}/${this.maxRetries} after ${finalDelay}ms`, {
          error: lastError.message,
          type: lastError.type
        });

        await new Promise(resolve => setTimeout(resolve, finalDelay));
      }
    }

    throw lastError!;
  }
}

// Rate limiting handler
export class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  private limits: Map<string, { rpm: number; tpm: number }> = new Map();

  setLimits(provider: AIProvider, rpm: number, tpm: number): void {
    this.limits.set(provider, { rpm, tpm });
  }

  async checkAndWait(provider: AIProvider, tokens: number): Promise<void> {
    const now = Date.now();
    const minute = 60 * 1000;
    
    const limits = this.limits.get(provider);
    if (!limits) return;

    const requests = this.requests.get(provider) || [];
    
    // Очищаем старые запросы (старше минуты)
    const recentRequests = requests.filter(time => now - time < minute);
    
    // Проверяем лимит по запросам в минуту
    if (recentRequests.length >= limits.rpm) {
      const oldestRequest = Math.min(...recentRequests);
      const waitTime = minute - (now - oldestRequest);
      
      if (waitTime > 0) {
        console.warn(`[AI] Rate limit reached for ${provider}. Waiting ${waitTime}ms`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }

    // Записываем новый запрос
    recentRequests.push(now);
    this.requests.set(provider, recentRequests);
  }
}

// Usage tracker для мониторинга расходов
export class UsageTracker {
  private usage: Map<string, {
    requests: number;
    tokens: number;
    cost: number;
    lastReset: number;
  }> = new Map();

  track(provider: AIProvider, model: string, usage: AIResponse['usage'], cost: number): void {
    const key = `${provider}:${model}`;
    const now = Date.now();
    const hour = 60 * 60 * 1000;

    const current = this.usage.get(key) || {
      requests: 0,
      tokens: 0,
      cost: 0,
      lastReset: now
    };

    // Сброс каждый час
    if (now - current.lastReset > hour) {
      current.requests = 0;
      current.tokens = 0;
      current.cost = 0;
      current.lastReset = now;
    }

    current.requests += 1;
    current.tokens += usage.totalTokens;
    current.cost += cost;

    this.usage.set(key, current);

    // Логирование в development режиме
    if (process.env.NODE_ENV === 'development') {
      console.log(`[USAGE] ${key}:`, {
        requests: current.requests,
        tokens: current.tokens,
        cost: current.cost.toFixed(4)
      });
    }
  }

  getUsage(provider?: AIProvider): any {
    if (provider) {
      const results: any = {};
      this.usage.forEach((data, key) => {
        if (key.startsWith(provider + ':')) {
          results[key] = data;
        }
      });
      return results;
    }
    return Object.fromEntries(this.usage);
  }

  getTotalCost(provider?: AIProvider): number {
    let total = 0;
    this.usage.forEach((data, key) => {
      if (!provider || key.startsWith(provider + ':')) {
        total += data.cost;
      }
    });
    return total;
  }
}

// Создаем глобальные экземпляры
export const retryHandler = new RetryHandler();
export const rateLimiter = new RateLimiter();
export const usageTracker = new UsageTracker();