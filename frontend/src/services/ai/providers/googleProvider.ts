/**
 * Google AI Provider - Implementation for Gemini API
 * Согласно ТЗ DevAssist Pro
 */

import { BaseAIProvider, AIRequest, AIResponse, AIStreamChunk, AIClientError, retryHandler, rateLimiter, usageTracker } from '../aiClient';
import { AIProvider, AIModel } from '../../../types/aiConfig';

export interface GoogleConfig {
  apiKey: string;
  baseUrl?: string;
  timeout?: number;
}

interface GoogleGenerateRequest {
  contents: Array<{
    parts: Array<{
      text: string;
    }>;
    role?: 'user' | 'model';
  }>;
  systemInstruction?: {
    parts: Array<{
      text: string;
    }>;
  };
  generationConfig?: {
    temperature?: number;
    maxOutputTokens?: number;
    topP?: number;
    topK?: number;
    candidateCount?: number;
    stopSequences?: string[];
  };
  safetySettings?: Array<{
    category: string;
    threshold: string;
  }>;
}

interface GoogleGenerateResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
      role: string;
    };
    finishReason: 'FINISH_REASON_UNSPECIFIED' | 'STOP' | 'MAX_TOKENS' | 'SAFETY' | 'RECITATION' | 'OTHER';
    index: number;
    safetyRatings?: Array<{
      category: string;
      probability: string;
    }>;
  }>;
  usageMetadata?: {
    promptTokenCount: number;
    candidatesTokenCount: number;
    totalTokenCount: number;
  };
}

interface GoogleStreamResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
      role?: string;
    };
    finishReason?: string;
    index?: number;
  }>;
  usageMetadata?: {
    promptTokenCount: number;
    candidatesTokenCount: number;
    totalTokenCount: number;
  };
}

export class GoogleProvider extends BaseAIProvider {
  protected provider: AIProvider = 'google';
  protected apiKey: string;
  protected baseUrl: string;
  private timeout: number;

  // Pricing per 1K tokens (as of 2024)
  private readonly pricing: Record<string, { input: number; output: number }> = {
    'gemini-pro': { input: 0.0005, output: 0.0015 },
    'gemini-pro-vision': { input: 0.0005, output: 0.0015 },
    'gemini-1.5-pro': { input: 0.0035, output: 0.0105 },
    'gemini-1.5-flash': { input: 0.00015, output: 0.0006 }
  };

  constructor(config: GoogleConfig) {
    super();
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl || 'https://generativelanguage.googleapis.com/v1beta';
    this.timeout = config.timeout || 30000;

    // Настраиваем rate limiting для Google AI
    rateLimiter.setLimits('google', 500, 10000); // 500 RPM, 10K TPM
  }

  async isAvailable(): Promise<boolean> {
    try {
      const response = await this.makeRequest('/models', 'GET');
      return response.ok;
    } catch {
      return false;
    }
  }

  async getModels(): Promise<AIModel[]> {
    try {
      const response = await this.makeRequest('/models', 'GET');
      const data = await response.json();

      return data.models
        .filter((model: any) => model.name.includes('gemini'))
        .map((model: any) => {
          const modelId = model.name.split('/').pop();
          return {
            id: modelId,
            name: modelId,
            displayName: this.getModelDisplayName(modelId),
            provider: 'google' as AIProvider,
            type: 'chat' as const,
            maxTokens: this.getModelMaxTokens(modelId),
            costPerToken: this.pricing[modelId] || { input: 0, output: 0 },
            capabilities: this.getModelCapabilities(modelId),
            status: 'active' as const,
            description: `Google ${this.getModelDisplayName(modelId)} model`,
            version: model.version || '1.0'
          };
        });
    } catch (error) {
      // Возвращаем статический список если API недоступен
      return this.getStaticModels();
    }
  }

  async chat(request: AIRequest): Promise<AIResponse> {
    this.validateRequest(request);
    this.logRequest(request);

    // Проверяем rate limiting
    await rateLimiter.checkAndWait('google', request.maxTokens || 1000);

    const operation = async (): Promise<AIResponse> => {
      const requestBody: GoogleGenerateRequest = {
        contents: [
          {
            parts: [{ text: request.prompt }],
            role: 'user'
          }
        ],
        generationConfig: {
          temperature: request.temperature ?? 0.7,
          maxOutputTokens: request.maxTokens,
          candidateCount: 1
        }
      };

      if (request.systemPrompt) {
        requestBody.systemInstruction = {
          parts: [{ text: request.systemPrompt }]
        };
      }

      const modelName = `models/${request.model}`;
      const response = await this.makeRequest(`/${modelName}:generateContent`, 'POST', requestBody);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw this.createErrorFromResponse(response, errorData);
      }

      const data: GoogleGenerateResponse = await response.json();
      
      if (!data.candidates || data.candidates.length === 0) {
        throw new AIClientError({
          code: 'NO_CANDIDATES',
          message: 'No candidates returned from Google AI',
          type: 'server_error'
        });
      }

      const candidate = data.candidates[0];
      if (!candidate.content || !candidate.content.parts) {
        throw new AIClientError({
          code: 'NO_CONTENT',
          message: 'No content in candidate response',
          type: 'server_error'
        });
      }

      const content = candidate.content.parts
        .map(part => part.text)
        .join('');

      const usage = data.usageMetadata || {
        promptTokenCount: Math.ceil(request.prompt.length / 4),
        candidatesTokenCount: Math.ceil(content.length / 4),
        totalTokenCount: Math.ceil((request.prompt.length + content.length) / 4)
      };

      const aiResponse: AIResponse = {
        id: this.generateId(),
        model: request.model,
        content,
        usage: {
          promptTokens: usage.promptTokenCount,
          completionTokens: usage.candidatesTokenCount,
          totalTokens: usage.totalTokenCount
        },
        cost: this.calculateCost(request.model, {
          promptTokens: usage.promptTokenCount,
          completionTokens: usage.candidatesTokenCount,
          totalTokens: usage.totalTokenCount
        }),
        finishReason: this.mapFinishReason(candidate.finishReason),
        metadata: {
          index: candidate.index,
          safetyRatings: candidate.safetyRatings
        }
      };

      // Трекинг использования
      usageTracker.track('google', request.model, aiResponse.usage, aiResponse.cost);
      
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
    await rateLimiter.checkAndWait('google', request.maxTokens || 1000);

    const requestBody: GoogleGenerateRequest = {
      contents: [
        {
          parts: [{ text: request.prompt }],
          role: 'user'
        }
      ],
      generationConfig: {
        temperature: request.temperature ?? 0.7,
        maxOutputTokens: request.maxTokens,
        candidateCount: 1
      }
    };

    if (request.systemPrompt) {
      requestBody.systemInstruction = {
        parts: [{ text: request.systemPrompt }]
      };
    }

    try {
      const modelName = `models/${request.model}`;
      const response = await this.makeRequest(`/${modelName}:streamGenerateContent`, 'POST', requestBody);
      
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
            
            try {
              const chunk: GoogleStreamResponse = JSON.parse(line);
              
              if (chunk.candidates && chunk.candidates[0]) {
                const candidate = chunk.candidates[0];
                
                if (candidate.content && candidate.content.parts) {
                  const content = candidate.content.parts
                    .map(part => part.text || '')
                    .join('');
                  
                  const isComplete = candidate.finishReason !== undefined;
                  
                  yield {
                    id: this.generateId(),
                    delta: content,
                    isComplete,
                    usage: totalUsage,
                    cost: totalUsage ? this.calculateCost(request.model, totalUsage) : undefined
                  };
                }
              }

              if (chunk.usageMetadata) {
                totalUsage = {
                  promptTokens: chunk.usageMetadata.promptTokenCount,
                  completionTokens: chunk.usageMetadata.candidatesTokenCount,
                  totalTokens: chunk.usageMetadata.totalTokenCount
                };
              }
            } catch (parseError) {
              console.warn('[Google] Failed to parse stream chunk:', parseError);
            }
          }
        }
      } finally {
        reader.releaseLock();
      }

      // Финальный чанк с usage информацией
      if (totalUsage) {
        const cost = this.calculateCost(request.model, totalUsage);
        usageTracker.track('google', request.model, totalUsage, cost);
        
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
    const url = `${this.baseUrl}${endpoint}${method === 'GET' ? `?key=${this.apiKey}` : ''}`;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };

    if (method === 'POST') {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
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
      case 403:
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
      
      default:
        return new AIClientError({
          code: 'SERVER_ERROR',
          message: error.message || `Server error: ${response.status}`,
          type: 'server_error'
        });
    }
  }

  private getStaticModels(): AIModel[] {
    return [
      {
        id: 'gemini-pro',
        name: 'gemini-pro',
        displayName: 'Gemini Pro',
        provider: 'google' as AIProvider,
        type: 'chat' as const,
        maxTokens: 32768,
        costPerToken: this.pricing['gemini-pro'],
        capabilities: ['text-analysis', 'web-search', 'classification'],
        status: 'active' as const,
        description: 'Google Gemini Pro - универсальная модель для текстовых задач',
        version: '1.0'
      },
      {
        id: 'gemini-1.5-pro',
        name: 'gemini-1.5-pro',
        displayName: 'Gemini 1.5 Pro',
        provider: 'google' as AIProvider,
        type: 'chat' as const,
        maxTokens: 1000000,
        costPerToken: this.pricing['gemini-1.5-pro'],
        capabilities: ['text-analysis', 'data-extraction', 'report-generation', 'web-search'],
        status: 'active' as const,
        description: 'Google Gemini 1.5 Pro - продвинутая модель с длинным контекстом',
        version: '1.5'
      },
      {
        id: 'gemini-1.5-flash',
        name: 'gemini-1.5-flash',
        displayName: 'Gemini 1.5 Flash',
        provider: 'google' as AIProvider,
        type: 'chat' as const,
        maxTokens: 1000000,
        costPerToken: this.pricing['gemini-1.5-flash'],
        capabilities: ['text-analysis', 'classification', 'summarization'],
        status: 'active' as const,
        description: 'Google Gemini 1.5 Flash - быстрая и экономичная модель',
        version: '1.5'
      }
    ];
  }

  private getModelDisplayName(modelId: string): string {
    const displayNames: Record<string, string> = {
      'gemini-pro': 'Gemini Pro',
      'gemini-pro-vision': 'Gemini Pro Vision',
      'gemini-1.5-pro': 'Gemini 1.5 Pro',
      'gemini-1.5-flash': 'Gemini 1.5 Flash'
    };

    return displayNames[modelId] || modelId;
  }

  private getModelMaxTokens(modelId: string): number {
    const maxTokens: Record<string, number> = {
      'gemini-pro': 32768,
      'gemini-pro-vision': 16384,
      'gemini-1.5-pro': 1000000,
      'gemini-1.5-flash': 1000000
    };

    return maxTokens[modelId] || 32768;
  }

  private getModelCapabilities(modelId: string): string[] {
    const capabilities: Record<string, string[]> = {
      'gemini-pro': ['text-analysis', 'web-search', 'classification'],
      'gemini-pro-vision': ['text-analysis', 'document-processing', 'classification'],
      'gemini-1.5-pro': ['text-analysis', 'data-extraction', 'report-generation', 'web-search'],
      'gemini-1.5-flash': ['text-analysis', 'classification', 'summarization']
    };

    return capabilities[modelId] || ['text-analysis'];
  }

  private mapFinishReason(reason: string): AIResponse['finishReason'] {
    switch (reason) {
      case 'STOP': return 'stop';
      case 'MAX_TOKENS': return 'length';
      case 'SAFETY': return 'content_filter';
      case 'RECITATION': return 'content_filter';
      default: return 'stop';
    }
  }
}