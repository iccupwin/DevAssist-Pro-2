/**
 * useAIConfig - React hook для работы с AI конфигурацией
 * Согласно ТЗ DevAssist Pro
 */

import { useState, useEffect, useCallback } from 'react';
import { 
  UnifiedAIConfiguration, 
  AIModel, 
  ModelConfig, 
  ProviderSettings,
  AIUsageStatistics,
  ConfigValidationResult
} from '../types/aiConfig';

interface AIConfigHookReturn {
  config: UnifiedAIConfiguration | null;
  isLoading: boolean;
  error: string | null;
  loadConfig: () => Promise<void>;
  saveConfig: (config: UnifiedAIConfiguration) => Promise<void>;
  validateConfig: (config: UnifiedAIConfiguration) => ConfigValidationResult;
  resetToDefaults: () => void;
  exportConfig: () => Promise<string>;
  importConfig: (configJson: string) => Promise<void>;
  getModelById: (modelId: string) => AIModel | undefined;
  getProviderSettings: (provider: string) => ProviderSettings | undefined;
  updateModelConfig: (taskType: string, config: ModelConfig) => void;
  getUsageStatistics: () => Promise<AIUsageStatistics>;
  testConnection: (provider: string) => Promise<boolean>;
}

export const useAIConfig = (): AIConfigHookReturn => {
  const [config, setConfig] = useState<UnifiedAIConfiguration | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Загрузка конфигурации
  const loadConfig = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // В production это будет реальный API вызов
      if (process.env.NODE_ENV === 'development') {
        const mockConfig = await getMockConfig();
        setConfig(mockConfig);
      } else {
        const response = await fetch('/api/ai/config');
        if (!response.ok) {
          throw new Error('Failed to load AI configuration');
        }
        const data = await response.json();
        setConfig(data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Сохранение конфигурации
  const saveConfig = useCallback(async (newConfig: UnifiedAIConfiguration) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Валидация перед сохранением
      const validation = validateConfig(newConfig);
      if (!validation.isValid) {
        throw new Error(`Configuration validation failed: ${validation.errors[0]?.message}`);
      }

      // В production это будет реальный API вызов
      if (process.env.NODE_ENV === 'development') {
        await new Promise(resolve => setTimeout(resolve, 1000));
        setConfig(newConfig);
        localStorage.setItem('ai_config', JSON.stringify(newConfig));
      } else {
        const response = await fetch('/api/ai/config', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(newConfig),
        });
        
        if (!response.ok) {
          throw new Error('Failed to save AI configuration');
        }
        
        setConfig(newConfig);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Валидация конфигурации
  const validateConfig = useCallback((config: UnifiedAIConfiguration): ConfigValidationResult => {
    const errors: any[] = [];
    const warnings: any[] = [];
    const suggestions: any[] = [];

    // Проверка базовых настроек
    if (!config.general) {
      errors.push({
        field: 'general',
        message: 'General configuration is required',
        severity: 'error',
        code: 'MISSING_GENERAL_CONFIG'
      });
    }

    // Проверка провайдеров
    if (!config.providers || Object.keys(config.providers).length === 0) {
      warnings.push({
        field: 'providers',
        message: 'No AI providers configured',
        impact: 'high',
        recommendation: 'Configure at least one AI provider'
      });
    }

    // Проверка лимитов стоимости
    if (config.general?.costLimits) {
      const { dailyLimit, monthlyLimit } = config.general.costLimits;
      if (dailyLimit * 30 > monthlyLimit) {
        warnings.push({
          field: 'costLimits',
          message: 'Daily limit may exceed monthly limit',
          impact: 'medium',
          recommendation: 'Adjust daily or monthly limits'
        });
      }
    }

    // Проверка моделей
    if (!config.models || config.models.length === 0) {
      errors.push({
        field: 'models',
        message: 'At least one AI model must be configured',
        severity: 'error',
        code: 'NO_MODELS_CONFIGURED'
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      suggestions
    };
  }, []);

  // Сброс к настройкам по умолчанию
  const resetToDefaults = useCallback(() => {
    const defaultConfig = getDefaultConfig();
    setConfig(defaultConfig);
  }, []);

  // Экспорт конфигурации
  const exportConfig = useCallback(async (): Promise<string> => {
    if (!config) {
      throw new Error('No configuration to export');
    }

    const exportData = {
      metadata: {
        exportedAt: new Date().toISOString(),
        version: config.version,
        exportedBy: 'current-user',
        description: 'AI Configuration Export'
      },
      config,
      checksum: generateChecksum(config)
    };

    return JSON.stringify(exportData, null, 2);
  }, [config]);

  // Импорт конфигурации
  const importConfig = useCallback(async (configJson: string) => {
    try {
      const importData = JSON.parse(configJson);
      
      // Проверка структуры импорта
      if (!importData.config || !importData.metadata) {
        throw new Error('Invalid configuration file format');
      }

      // Проверка checksum
      const expectedChecksum = generateChecksum(importData.config);
      if (importData.checksum !== expectedChecksum) {
        throw new Error('Configuration file integrity check failed');
      }

      // Валидация конфигурации
      const validation = validateConfig(importData.config);
      if (!validation.isValid) {
        throw new Error(`Invalid configuration: ${validation.errors[0]?.message}`);
      }

      setConfig(importData.config);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed');
      throw err;
    }
  }, [validateConfig]);

  // Получение модели по ID
  const getModelById = useCallback((modelId: string): AIModel | undefined => {
    return config?.models.find(model => model.id === modelId);
  }, [config]);

  // Получение настроек провайдера
  const getProviderSettings = useCallback((provider: string): ProviderSettings | undefined => {
    return config?.providers[provider as keyof typeof config.providers];
  }, [config]);

  // Обновление конфигурации модели
  const updateModelConfig = useCallback((taskType: string, modelConfig: ModelConfig) => {
    if (!config) return;

    const updatedConfig = {
      ...config,
      general: {
        ...config.general,
        defaultModels: {
          ...config.general.defaultModels,
          [taskType]: modelConfig
        }
      }
    };

    setConfig(updatedConfig);
  }, [config]);

  // Получение статистики использования
  const getUsageStatistics = useCallback(async (): Promise<AIUsageStatistics> => {
    // В production это будет реальный API вызов
    if (process.env.NODE_ENV === 'development') {
      return getMockUsageStatistics();
    }

    const response = await fetch('/api/ai/usage-statistics');
    if (!response.ok) {
      throw new Error('Failed to load usage statistics');
    }
    return response.json();
  }, []);

  // Тестирование соединения с провайдером
  const testConnection = useCallback(async (provider: string): Promise<boolean> => {
    try {
      // В production это будет реальный API вызов
      if (process.env.NODE_ENV === 'development') {
        await new Promise(resolve => setTimeout(resolve, 1000));
        return Math.random() > 0.2; // 80% успеха
      }

      const response = await fetch(`/api/ai/test-connection/${provider}`, {
        method: 'POST'
      });
      
      return response.ok;
    } catch {
      return false;
    }
  }, []);

  // Загрузка конфигурации при монтировании
  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  return {
    config,
    isLoading,
    error,
    loadConfig,
    saveConfig,
    validateConfig,
    resetToDefaults,
    exportConfig,
    importConfig,
    getModelById,
    getProviderSettings,
    updateModelConfig,
    getUsageStatistics,
    testConnection
  };
};

// Утилитарные функции

function generateChecksum(config: any): string {
  // Простая реализация checksum для демонстрации
  const str = JSON.stringify(config);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16);
}

function getDefaultConfig(): UnifiedAIConfiguration {
  return {
    general: {
      defaultModels: {
        textAnalysis: {
          modelId: 'gpt-4-turbo',
          temperature: 0.3,
          maxTokens: 4000,
          timeout: 30,
          retries: 2,
          fallbackModels: ['claude-3-sonnet']
        },
        dataExtraction: {
          modelId: 'claude-3-sonnet',
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
          fallbackModels: ['claude-3-sonnet']
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
        warningThresholds: {
          daily: 80,
          monthly: 1800
        },
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
        apiKey: process.env.REACT_APP_OPENAI_API_KEY || '',
        timeout: 30,
        rateLimits: {
          requestsPerMinute: 3500,
          tokensPerMinute: 40000,
          requestsPerDay: 10000
        },
        priority: 1,
        enabled: true
      },
      anthropic: {
        apiKey: process.env.REACT_APP_ANTHROPIC_API_KEY || '',
        timeout: 30,
        rateLimits: {
          requestsPerMinute: 1000,
          tokensPerMinute: 20000,
          requestsPerDay: 5000
        },
        priority: 2,
        enabled: true
      },
      google: {
        apiKey: process.env.REACT_APP_GOOGLE_API_KEY || '',
        timeout: 20,
        rateLimits: {
          requestsPerMinute: 500,
          tokensPerMinute: 10000,
          requestsPerDay: 2000
        },
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

async function getMockConfig(): Promise<UnifiedAIConfiguration> {
  // Симуляция задержки загрузки
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Попытка загрузить из localStorage
  const saved = localStorage.getItem('ai_config');
  if (saved) {
    try {
      const config = JSON.parse(saved);
      // Обновляем API ключи из переменных окружения, если они есть
      if (process.env.REACT_APP_OPENAI_API_KEY && config.providers.openai) {
        config.providers.openai.apiKey = process.env.REACT_APP_OPENAI_API_KEY;
      }
      if (process.env.REACT_APP_ANTHROPIC_API_KEY && config.providers.anthropic) {
        config.providers.anthropic.apiKey = process.env.REACT_APP_ANTHROPIC_API_KEY;
      }
      if (process.env.REACT_APP_GOOGLE_API_KEY && config.providers.google) {
        config.providers.google.apiKey = process.env.REACT_APP_GOOGLE_API_KEY;
      }
      return config;
    } catch {
      // Если не удалось распарсить, возвращаем дефолтную конфигурацию
    }
  }
  
  return getDefaultConfig();
}

function getMockUsageStatistics(): AIUsageStatistics {
  return {
    period: 'day',
    data: Array.from({ length: 24 }, (_, i) => ({
      timestamp: new Date(Date.now() - (23 - i) * 60 * 60 * 1000).toISOString(),
      totalRequests: Math.floor(Math.random() * 100) + 20,
      totalTokens: Math.floor(Math.random() * 10000) + 1000,
      totalCost: Math.random() * 10 + 1,
      averageResponseTime: Math.random() * 3000 + 500,
      successRate: 95 + Math.random() * 5,
      topModels: [
        {
          modelId: 'gpt-4-turbo',
          requests: Math.floor(Math.random() * 50) + 10,
          tokens: Math.floor(Math.random() * 5000) + 500,
          cost: Math.random() * 5 + 0.5
        },
        {
          modelId: 'claude-3-sonnet',
          requests: Math.floor(Math.random() * 30) + 5,
          tokens: Math.floor(Math.random() * 3000) + 300,
          cost: Math.random() * 3 + 0.3
        }
      ],
      topModules: [
        {
          moduleId: 'kp-analyzer',
          requests: Math.floor(Math.random() * 40) + 10,
          cost: Math.random() * 4 + 0.5
        },
        {
          moduleId: 'tz-generator',
          requests: Math.floor(Math.random() * 20) + 5,
          cost: Math.random() * 2 + 0.2
        }
      ],
      errors: [
        {
          type: 'timeout',
          count: Math.floor(Math.random() * 3),
          lastOccurred: new Date(Date.now() - Math.random() * 3600000).toISOString()
        }
      ]
    }))
  };
}