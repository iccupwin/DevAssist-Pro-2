/**
 * OpenAI Provider - Implementation for OpenAI API
 * Согласно ТЗ DevAssist Pro
 */

import { BaseAIProvider, AIRequest, AIResponse, AIStreamChunk, AIClientError, retryHandler, rateLimiter, usageTracker } from '../aiClient';
import { AIProvider, AIModel } from '../../../types/aiConfig';

export interface OpenAIConfig {
  apiKey: string;
  organization?: string;
  baseUrl?: string;
  timeout?: number;
}

interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface OpenAIChatRequest {
  model: string;
  messages: OpenAIMessage[];
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
}

interface OpenAIChatResponse {
  id: string;
  object: 'chat.completion';
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: 'assistant';
      content: string;
    };
    finish_reason: 'stop' | 'length' | 'content_filter' | 'function_call';
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

interface OpenAIStreamChunk {
  id: string;
  object: 'chat.completion.chunk';
  created: number;
  model: string;
  choices: Array<{
    index: number;
    delta: {
      role?: 'assistant';
      content?: string;
    };
    finish_reason: string | null;
  }>;
}

export class OpenAIProvider extends BaseAIProvider {
  protected provider: AIProvider = 'openai';
  protected apiKey: string;
  protected organization?: string;
  protected baseUrl: string;
  private timeout: number;

  // Pricing per 1K tokens (as of 2024)
  private readonly pricing: Record<string, { input: number; output: number }> = {
    'gpt-4o': { input: 0.005, output: 0.015 },
    'gpt-4o-mini': { input: 0.00015, output: 0.0006 },
    'gpt-4-turbo': { input: 0.01, output: 0.03 },
    'gpt-4': { input: 0.03, output: 0.06 },
    'gpt-3.5-turbo': { input: 0.0015, output: 0.002 },
    'gpt-3.5-turbo-16k': { input: 0.003, output: 0.004 }
  };

  constructor(config: OpenAIConfig) {
    super();
    this.apiKey = config.apiKey;
    this.organization = config.organization;
    this.baseUrl = config.baseUrl || 'https://api.openai.com/v1';
    this.timeout = config.timeout || 30000;

    // Настраиваем rate limiting для OpenAI
    rateLimiter.setLimits('openai', 3500, 40000); // 3.5K RPM, 40K TPM
  }

  async isAvailable(): Promise<boolean> {
    try {
      const response = await this.makeRequest('/models', 'GET');
      return response.ok;
    } catch {
      return false;
    }
  }

  async isAvailableWithDetails(): Promise<{ ok: boolean, error?: { code: string, status?: number, message?: string } }> {
    try {
      const response = await this.makeRequest('/models', 'GET');
      if (response.ok) {
        return { ok: true };
      } else {
        let errorMsg = '';
        let code = 'HTTP_ERROR';
        try {
          const data = await response.json();
          errorMsg = data.error?.message || JSON.stringify(data);
          code = data.error?.code || code;
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
    try {
      const response = await this.makeRequest('/models', 'GET');
      const data = await response.json();

      return data.data
        .filter((model: any) => model.id.includes('gpt'))
        .map((model: any) => ({
          id: model.id,
          name: model.id,
          displayName: this.getModelDisplayName(model.id),
          provider: 'openai' as AIProvider,
          type: 'chat' as const,
          maxTokens: this.getModelMaxTokens(model.id),
          costPerToken: this.pricing[model.id] || { input: 0, output: 0 },
          capabilities: ['text-analysis', 'data-extraction', 'report-generation', 'code-generation'],
          status: 'active' as const,
          description: `OpenAI ${this.getModelDisplayName(model.id)} model`,
          version: model.created ? new Date(model.created * 1000).toISOString().split('T')[0] : undefined
        }));
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async chat(request: AIRequest): Promise<AIResponse> {
    this.validateRequest(request);
    this.logRequest(request);

    // Проверяем rate limiting
    await rateLimiter.checkAndWait('openai', request.maxTokens || 1000);

    const operation = async (): Promise<AIResponse> => {
      const messages: OpenAIMessage[] = [];
      
      if (request.systemPrompt) {
        messages.push({ role: 'system', content: request.systemPrompt });
      }
      
      messages.push({ role: 'user', content: request.prompt });

      const requestBody: OpenAIChatRequest = {
        model: request.model,
        messages,
        temperature: request.temperature ?? 0.7,
        max_tokens: request.maxTokens,
        stream: false
      };

      const response = await this.makeRequest('/chat/completions', 'POST', requestBody);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw this.createErrorFromResponse(response, errorData);
      }

      const data: OpenAIChatResponse = await response.json();
      const choice = data.choices[0];
      
      if (!choice) {
        throw new AIClientError({
          code: 'NO_CHOICES',
          message: 'No choices returned from OpenAI',
          type: 'server_error'
        });
      }

      const aiResponse: AIResponse = {
        id: data.id,
        model: data.model,
        content: choice.message.content,
        usage: {
          promptTokens: data.usage.prompt_tokens,
          completionTokens: data.usage.completion_tokens,
          totalTokens: data.usage.total_tokens
        },
        cost: this.calculateCost(data.model, {
          promptTokens: data.usage.prompt_tokens,
          completionTokens: data.usage.completion_tokens,
          totalTokens: data.usage.total_tokens
        }),
        finishReason: this.mapFinishReason(choice.finish_reason),
        metadata: {
          created: data.created,
          object: data.object
        }
      };

      // Трекинг использования
      usageTracker.track('openai', data.model, aiResponse.usage, aiResponse.cost);
      
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
    await rateLimiter.checkAndWait('openai', request.maxTokens || 1000);

    const messages: OpenAIMessage[] = [];
    
    if (request.systemPrompt) {
      messages.push({ role: 'system', content: request.systemPrompt });
    }
    
    messages.push({ role: 'user', content: request.prompt });

    const requestBody: OpenAIChatRequest = {
      model: request.model,
      messages,
      temperature: request.temperature ?? 0.7,
      max_tokens: request.maxTokens,
      stream: true
    };

    try {
      const response = await this.makeRequest('/chat/completions', 'POST', requestBody);
      
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
            if (line.trim() === 'data: [DONE]') continue;
            
            if (line.startsWith('data: ')) {
              try {
                const jsonStr = line.slice(6);
                const chunk: OpenAIStreamChunk = JSON.parse(jsonStr);
                
                const choice = chunk.choices[0];
                if (!choice) continue;

                const isComplete = choice.finish_reason !== null;
                const content = choice.delta.content || '';

                yield {
                  id: chunk.id,
                  delta: content,
                  isComplete,
                  usage: totalUsage,
                  cost: totalUsage ? this.calculateCost(chunk.model, totalUsage) : undefined
                };

                // В последнем чанке может быть usage информация
                if (isComplete && !totalUsage) {
                  // Для streaming запросов usage информация может отсутствовать
                  // В этом случае используем приблизительные значения
                  totalUsage = {
                    promptTokens: Math.ceil(request.prompt.length / 4),
                    completionTokens: Math.ceil(content.length / 4),
                    totalTokens: Math.ceil((request.prompt.length + content.length) / 4)
                  };
                }
              } catch (parseError) {
                console.warn('[OpenAI] Failed to parse stream chunk:', parseError);
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
      }

      // Финальный чанк с usage информацией
      if (totalUsage) {
        const cost = this.calculateCost(request.model, totalUsage);
        usageTracker.track('openai', request.model, totalUsage, cost);
        
        yield {
          id: this.generateId(),
          delta: '',
          isComplete: true,
          usage: totalUsage,
          cost
        };
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

  private async makeRequest(endpoint: string, method: 'GET' | 'POST', body?: any): Promise<Response> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json'
    };

    if (this.organization) {
      headers['OpenAI-Organization'] = this.organization;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
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
          code: error.code || 'INVALID_REQUEST',
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

  private getModelDisplayName(modelId: string): string {
    const displayNames: Record<string, string> = {
      'gpt-4o': 'GPT-4o',
      'gpt-4o-mini': 'GPT-4o Mini',
      'gpt-4-turbo': 'GPT-4 Turbo',
      'gpt-4': 'GPT-4',
      'gpt-3.5-turbo': 'GPT-3.5 Turbo',
      'gpt-3.5-turbo-16k': 'GPT-3.5 Turbo 16K'
    };

    return displayNames[modelId] || modelId;
  }

  private getModelMaxTokens(modelId: string): number {
    const maxTokens: Record<string, number> = {
      'gpt-4o': 128000,
      'gpt-4o-mini': 128000,
      'gpt-4-turbo': 128000,
      'gpt-4': 8192,
      'gpt-3.5-turbo': 4096,
      'gpt-3.5-turbo-16k': 16384
    };

    return maxTokens[modelId] || 4096;
  }

  private mapFinishReason(reason: string): AIResponse['finishReason'] {
    switch (reason) {
      case 'stop': return 'stop';
      case 'length': return 'length';
      case 'content_filter': return 'content_filter';
      default: return 'stop';
    }
  }
}