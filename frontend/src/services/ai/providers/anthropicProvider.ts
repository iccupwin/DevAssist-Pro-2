/**
 * Anthropic Provider - Implementation for Claude API
 * Согласно ТЗ DevAssist Pro
 */

import { BaseAIProvider, AIRequest, AIResponse, AIStreamChunk, AIClientError, retryHandler, rateLimiter, usageTracker } from '../aiClient';
import { AIProvider, AIModel } from '../../../types/aiConfig';

export interface AnthropicConfig {
  apiKey: string;
  baseUrl?: string;
  timeout?: number;
}

interface AnthropicMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface AnthropicRequest {
  model: string;
  max_tokens: number;
  messages: AnthropicMessage[];
  system?: string;
  temperature?: number;
  stream?: boolean;
  top_p?: number;
}

interface AnthropicResponse {
  id: string;
  type: 'message';
  role: 'assistant';
  content: Array<{
    type: 'text';
    text: string;
  }>;
  model: string;
  stop_reason: 'end_turn' | 'max_tokens' | 'stop_sequence';
  stop_sequence?: string;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
}

interface AnthropicStreamEvent {
  type: 'message_start' | 'content_block_start' | 'content_block_delta' | 'content_block_stop' | 'message_delta' | 'message_stop';
  index?: number;
  delta?: {
    type: 'text_delta';
    text: string;
  };
  message?: AnthropicResponse;
  usage?: {
    input_tokens: number;
    output_tokens: number;
  };
}

export class AnthropicProvider extends BaseAIProvider {
  protected provider: AIProvider = 'anthropic';
  protected apiKey: string;
  protected baseUrl: string;
  private timeout: number;

  // Pricing per 1K tokens (as of 2024)
  private readonly pricing: Record<string, { input: number; output: number }> = {
    'claude-3-5-sonnet-20241022': { input: 0.003, output: 0.015 },
    'claude-3-5-sonnet-20240620': { input: 0.003, output: 0.015 },
    'claude-3-opus-20240229': { input: 0.015, output: 0.075 },
    'claude-3-sonnet-20240229': { input: 0.003, output: 0.015 },
    'claude-3-haiku-20240307': { input: 0.00025, output: 0.00125 },
    'claude-2.1': { input: 0.008, output: 0.024 },
    'claude-2.0': { input: 0.008, output: 0.024 }
  };

  constructor(config: AnthropicConfig) {
    super();
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl || 'https://api.anthropic.com/v1';
    this.timeout = config.timeout || 30000;

    // Настраиваем rate limiting для Anthropic
    rateLimiter.setLimits('anthropic', 1000, 20000); // 1K RPM, 20K TPM
  }

  async isAvailable(): Promise<boolean> {
    try {
      // Anthropic не предоставляет endpoint для проверки доступности
      // Делаем минимальный запрос для проверки
      const response = await this.makeRequest('/messages', 'POST', {
        model: 'claude-3-haiku-20240307',
        max_tokens: 1,
        messages: [{ role: 'user', content: 'Hi' }]
      });
      return response.ok || response.status === 400; // 400 означает что API доступен, но запрос некорректен
    } catch {
      return false;
    }
  }

  async isAvailableWithDetails(): Promise<{ ok: boolean, error?: { code: string, status?: number, message?: string } }> {
    try {
      const response = await this.makeRequest('/messages', 'POST', {
        model: 'claude-3-haiku-20240307',
        max_tokens: 1,
        messages: [{ role: 'user', content: 'Hi' }]
      });
      if (response.ok || response.status === 400) {
        // 400 — API доступен, но запрос некорректен (значит ключ рабочий)
        return { ok: true };
      } else {
        let errorMsg = '';
        let code = 'HTTP_ERROR';
        try {
          const data = await response.json();
          errorMsg = data.error?.message || JSON.stringify(data);
          code = data.error?.type || code;
        } catch (e) {
          errorMsg = await response.text();
        }
        return {
          ok: false,
          error: {
            code,
            status: response.status,
            message: errorMsg
          }
        };
      }
    } catch (err: any) {
      return {
        ok: false,
        error: {
          code: err?.code || err?.name || 'NETWORK_ERROR',
          message: err?.message || String(err)
        }
      };
    }
  }

  async getModels(): Promise<AIModel[]> {
    // Anthropic не предоставляет список моделей через API
    // Возвращаем статический список доступных моделей
    return [
      {
        id: 'claude-3-5-sonnet-20241022',
        name: 'claude-3-5-sonnet-20241022',
        displayName: 'Claude 3.5 Sonnet (Latest)',
        provider: 'anthropic' as AIProvider,
        type: 'chat' as const,
        maxTokens: 200000,
        costPerToken: this.pricing['claude-3-5-sonnet-20241022'],
        capabilities: ['text-analysis', 'data-extraction', 'report-generation', 'summarization', 'comparison'],
        status: 'active' as const,
        description: 'Claude 3.5 Sonnet - самая сбалансированная модель с отличными аналитическими способностями',
        version: '2024-10-22'
      },
      {
        id: 'claude-3-opus-20240229',
        name: 'claude-3-opus-20240229',
        displayName: 'Claude 3 Opus',
        provider: 'anthropic' as AIProvider,
        type: 'chat' as const,
        maxTokens: 200000,
        costPerToken: this.pricing['claude-3-opus-20240229'],
        capabilities: ['text-analysis', 'data-extraction', 'report-generation', 'code-generation', 'comparison'],
        status: 'active' as const,
        description: 'Claude 3 Opus - самая мощная модель для сложных аналитических задач',
        version: '2024-02-29'
      },
      {
        id: 'claude-3-sonnet-20240229',
        name: 'claude-3-sonnet-20240229',
        displayName: 'Claude 3 Sonnet',
        provider: 'anthropic' as AIProvider,
        type: 'chat' as const,
        maxTokens: 200000,
        costPerToken: this.pricing['claude-3-sonnet-20240229'],
        capabilities: ['text-analysis', 'data-extraction', 'summarization', 'comparison'],
        status: 'active' as const,
        description: 'Claude 3 Sonnet - сбалансированная модель для большинства задач',
        version: '2024-02-29'
      },
      {
        id: 'claude-3-haiku-20240307',
        name: 'claude-3-haiku-20240307',
        displayName: 'Claude 3 Haiku',
        provider: 'anthropic' as AIProvider,
        type: 'chat' as const,
        maxTokens: 200000,
        costPerToken: this.pricing['claude-3-haiku-20240307'],
        capabilities: ['text-analysis', 'summarization', 'classification'],
        status: 'active' as const,
        description: 'Claude 3 Haiku - быстрая и экономичная модель для простых задач',
        version: '2024-03-07'
      }
    ];
  }

  async chat(request: AIRequest): Promise<AIResponse> {
    this.validateRequest(request);
    this.logRequest(request);

    // Проверяем rate limiting
    await rateLimiter.checkAndWait('anthropic', request.maxTokens || 1000);

    const operation = async (): Promise<AIResponse> => {
      const messages: AnthropicMessage[] = [
        { role: 'user', content: request.prompt }
      ];

      const requestBody: AnthropicRequest = {
        model: request.model,
        max_tokens: request.maxTokens || 4000,
        messages,
        system: request.systemPrompt,
        temperature: request.temperature ?? 0.7,
        stream: false
      };

      const response = await this.makeRequest('/messages', 'POST', requestBody);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw this.createErrorFromResponse(response, errorData);
      }

      const data: AnthropicResponse = await response.json();
      
      if (!data.content || data.content.length === 0) {
        throw new AIClientError({
          code: 'NO_CONTENT',
          message: 'No content returned from Anthropic',
          type: 'server_error'
        });
      }

      const content = data.content
        .filter(block => block.type === 'text')
        .map(block => block.text)
        .join('');

      const aiResponse: AIResponse = {
        id: data.id,
        model: data.model,
        content,
        usage: {
          promptTokens: data.usage.input_tokens,
          completionTokens: data.usage.output_tokens,
          totalTokens: data.usage.input_tokens + data.usage.output_tokens
        },
        cost: this.calculateCost(data.model, {
          promptTokens: data.usage.input_tokens,
          completionTokens: data.usage.output_tokens,
          totalTokens: data.usage.input_tokens + data.usage.output_tokens
        }),
        finishReason: this.mapFinishReason(data.stop_reason),
        metadata: {
          type: data.type,
          role: data.role,
          stopSequence: data.stop_sequence
        }
      };

      // Трекинг использования
      usageTracker.track('anthropic', data.model, aiResponse.usage, aiResponse.cost);
      
      this.logResponse(aiResponse);
      return aiResponse;
    };

    return retryHandler.execute(operation, (error) => {
      return error.type === 'rate_limit' || error.type === 'server_error';
    });
  }

  async* stream(request: AIRequest): AsyncGenerator<AIStreamChunk, void, unknown> {
    this.validateRequest(request);
    this.logRequest(request);

    // Проверяем rate limiting
    await rateLimiter.checkAndWait('anthropic', request.maxTokens || 1000);

    const messages: AnthropicMessage[] = [
      { role: 'user', content: request.prompt }
    ];

    const requestBody: AnthropicRequest = {
      model: request.model,
      max_tokens: request.maxTokens || 4000,
      messages,
      system: request.systemPrompt,
      temperature: request.temperature ?? 0.7,
      stream: true
    };

    try {
      const response = await this.makeRequest('/messages', 'POST', requestBody);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw this.createErrorFromResponse(response, errorData);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new AIClientError({
          code: 'NO_STREAM',
          message: 'No stream available',
          type: 'server_error'
        });
      }

      const decoder = new TextDecoder();
      let buffer = '';
      let totalUsage: AIResponse['usage'] | undefined;

      try {
        while (true) {
          const { done, value } = await reader.read();
          
          if (done) break;
          
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.trim() === '') continue;
            
            if (line.startsWith('data: ')) {
              try {
                const jsonStr = line.slice(6);
                const event: AnthropicStreamEvent = JSON.parse(jsonStr);
                
                if (event.type === 'content_block_delta' && event.delta) {
                  yield {
                    id: this.generateId(),
                    delta: event.delta.text,
                    isComplete: false
                  };
                } else if (event.type === 'message_delta' && event.usage) {
                  totalUsage = {
                    promptTokens: event.usage.input_tokens,
                    completionTokens: event.usage.output_tokens,
                    totalTokens: event.usage.input_tokens + event.usage.output_tokens
                  };
                } else if (event.type === 'message_stop') {
                  // Поток завершен
                  if (totalUsage) {
                    const cost = this.calculateCost(request.model, totalUsage);
                    usageTracker.track('anthropic', request.model, totalUsage, cost);
                    
                    yield {
                      id: this.generateId(),
                      delta: '',
                      isComplete: true,
                      usage: totalUsage,
                      cost
                    };
                  }
                }
              } catch (parseError) {
                console.warn('[Anthropic] Failed to parse stream chunk:', parseError);
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
      }
    } catch (error) {
      throw this.handleError(error);
    }
  }

  protected calculateCost(model: string, usage: AIResponse['usage']): number {
    const pricing = this.pricing[model];
    if (!pricing) return 0;

    const inputCost = (usage.promptTokens / 1000) * pricing.input;
    const outputCost = (usage.completionTokens / 1000) * pricing.output;
    
    return inputCost + outputCost;
  }

  protected handleError(error: any): AIClientError {
    if (error instanceof AIClientError) {
      return error;
    }

    // Network errors
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      return new AIClientError({
        code: 'NETWORK_ERROR',
        message: 'Network connection failed',
        type: 'network_error'
      });
    }

    // Timeout errors
    if (error.name === 'AbortError') {
      return new AIClientError({
        code: 'TIMEOUT',
        message: 'Request timeout',
        type: 'server_error'
      });
    }

    return new AIClientError({
      code: 'UNKNOWN_ERROR',
      message: error.message || 'Unknown error occurred',
      type: 'server_error'
    });
  }

  private async makeRequest(endpoint: string, method: 'POST', body: any): Promise<Response> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
      'anthropic-version': '2023-06-01'
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(body),
        signal: controller.signal
      });

      return response;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private createErrorFromResponse(response: Response, errorData: any): AIClientError {
    const error = errorData.error || {};
    
    switch (response.status) {
      case 401:
        return new AIClientError({
          code: 'INVALID_API_KEY',
          message: 'Invalid API key',
          type: 'invalid_request'
        });
      
      case 429:
        const retryAfter = response.headers.get('retry-after');
        return new AIClientError({
          code: 'RATE_LIMIT_EXCEEDED',
          message: error.message || 'Rate limit exceeded',
          type: 'rate_limit',
          retryAfter: retryAfter ? parseInt(retryAfter) : undefined
        });
      
      case 400:
        return new AIClientError({
          code: error.type || 'INVALID_REQUEST',
          message: error.message || 'Invalid request',
          type: 'invalid_request'
        });
      
      case 402:
        return new AIClientError({
          code: 'INSUFFICIENT_QUOTA',
          message: 'Insufficient quota',
          type: 'insufficient_quota'
        });
      
      default:
        return new AIClientError({
          code: 'SERVER_ERROR',
          message: error.message || `Server error: ${response.status}`,
          type: 'server_error'
        });
    }
  }

  private mapFinishReason(reason: string): AIResponse['finishReason'] {
    switch (reason) {
      case 'end_turn': return 'stop';
      case 'max_tokens': return 'length';
      case 'stop_sequence': return 'stop';
      default: return 'stop';
    }
  }
}