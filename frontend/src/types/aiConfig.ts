/**
 * AI Configuration Types - DevAssist Pro
 * Unified AI Configuration Panel
 * Согласно ТЗ DevAssist Pro
 */

// Основные типы для AI провайдеров
export type AIProvider = 'openai' | 'anthropic' | 'google' | 'custom';

export type AIModel = {
  id: string;
  name: string;
  displayName: string;
  provider: AIProvider;
  type: 'text' | 'chat' | 'embedding' | 'image' | 'code';
  maxTokens: number;
  costPerToken: {
    input: number;
    output: number;
  };
  capabilities: ModelCapability[];
  status: 'active' | 'deprecated' | 'beta' | 'unavailable';
  description?: string;
  version?: string;
};

export type ModelCapability = 
  | 'text-analysis'
  | 'data-extraction' 
  | 'report-generation'
  | 'web-search'
  | 'document-processing'
  | 'code-generation'
  | 'translation'
  | 'summarization'
  | 'classification'
  | 'comparison';

// Конфигурация моделей для задач
export interface ModelConfig {
  modelId: string;
  temperature: number;
  maxTokens: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  systemPrompt?: string;
  customInstructions?: string;
  timeout: number;
  retries: number;
  fallbackModels: string[];
}

// Основная конфигурация AI (как в ТЗ)
export interface AIConfiguration {
  defaultModels: {
    textAnalysis: ModelConfig;
    dataExtraction: ModelConfig;
    reportGeneration: ModelConfig;
    webSearch: ModelConfig;
  };
  moduleOverrides: Map<ModuleId, ModelConfig>;
  costLimits: CostConfiguration;
  performanceMode: 'quality' | 'balanced' | 'speed';
}

// Идентификаторы модулей системы
export type ModuleId = 
  | 'kp-analyzer'
  | 'tz-generator'
  | 'project-evaluation'
  | 'marketing-planner'
  | 'knowledge-base';

// Конфигурация ограничений по стоимости
export interface CostConfiguration {
  dailyLimit: number;
  monthlyLimit: number;
  perRequestLimit: number;
  warningThresholds: {
    daily: number;
    monthly: number;
  };
  alertsEnabled: boolean;
  autoStopOnLimit: boolean;
  budgetAllocation: {
    [key in ModuleId]: number;
  };
}

// Настройки провайдеров
export interface ProviderSettings {
  apiKey: string;
  baseUrl?: string;
  organization?: string;
  timeout: number;
  rateLimits: {
    requestsPerMinute: number;
    tokensPerMinute: number;
    requestsPerDay: number;
  };
  priority: number;
  enabled: boolean;
  customHeaders?: Record<string, string>;
}

// Конфигурация всех провайдеров
export type AIProviderConfiguration = {
  [key in AIProvider]?: ProviderSettings;
}

// Метрики производительности
export interface ModelPerformanceMetrics {
  modelId: string;
  metrics: {
    averageResponseTime: number;
    successRate: number;
    totalRequests: number;
    totalTokensUsed: number;
    totalCost: number;
    errorRate: number;
    lastUsed: string;
  };
  qualityScores: {
    accuracy: number;
    relevance: number;
    completeness: number;
    consistency: number;
  };
  usageByModule: {
    [key in ModuleId]?: {
      requests: number;
      tokens: number;
      cost: number;
    };
  };
}

// Настройки промптов
export interface PromptTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  template: string;
  variables: PromptVariable[];
  modelConfigs: {
    [modelId: string]: Partial<ModelConfig>;
  };
  tags: string[];
  createdAt: string;
  updatedAt: string;
  author: string;
  version: string;
  isDefault: boolean;
}

export interface PromptVariable {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  description: string;
  required: boolean;
  defaultValue?: any;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    options?: string[];
  };
}

// Режимы производительности
export interface PerformanceProfile {
  mode: 'quality' | 'balanced' | 'speed';
  description: string;
  settings: {
    preferredProviders: AIProvider[];
    timeoutMultiplier: number;
    retryCount: number;
    cacheEnabled: boolean;
    parallelProcessing: boolean;
    modelSelectionStrategy: 'best' | 'fastest' | 'cheapest' | 'balanced';
  };
}

// Настройки кеширования
export interface CacheConfiguration {
  enabled: boolean;
  ttl: number; // время жизни в секундах
  maxSize: number; // максимальный размер кеша в МБ
  strategy: 'lru' | 'fifo' | 'ttl';
  keyGenerationStrategy: 'full' | 'hash' | 'custom';
  invalidationRules: {
    onModelChange: boolean;
    onPromptChange: boolean;
    onConfigChange: boolean;
  };
}

// Мониторинг и алерты
export interface MonitoringConfiguration {
  enabled: boolean;
  alertChannels: AlertChannel[];
  thresholds: {
    responseTime: number;
    errorRate: number;
    costPerHour: number;
    tokenUsageRate: number;
  };
  reportingInterval: number; // в минутах
  retentionPeriod: number; // в днях
}

export interface AlertChannel {
  type: 'email' | 'slack' | 'webhook' | 'sms';
  config: {
    endpoint?: string;
    apiKey?: string;
    recipients?: string[];
    template?: string;
  };
  enabled: boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

// API ключи и безопасность
export interface APIKeyConfiguration {
  provider: AIProvider;
  keyName: string;
  keyValue: string;
  isEncrypted: boolean;
  createdAt: string;
  lastUsed?: string;
  expiresAt?: string;
  permissions: string[];
  usageQuota?: {
    requests: number;
    tokens: number;
    cost: number;
  };
  remainingQuota?: {
    requests: number;
    tokens: number;
    cost: number;
  };
}

// Экспериментальные настройки
export interface ExperimentalFeatures {
  multiModelEnsemble: boolean;
  adaptiveTimeout: boolean;
  intelligentRetry: boolean;
  contextAwarePrompting: boolean;
  dynamicModelSelection: boolean;
  crossProviderFallback: boolean;
  realTimeOptimization: boolean;
}

// Полная конфигурация AI системы
export interface UnifiedAIConfiguration {
  general: AIConfiguration;
  providers: AIProviderConfiguration;
  models: AIModel[];
  prompts: PromptTemplate[];
  performance: PerformanceProfile;
  cache: CacheConfiguration;
  monitoring: MonitoringConfiguration;
  apiKeys: APIKeyConfiguration[];
  experimental: ExperimentalFeatures;
  lastUpdated: string;
  version: string;
}

// Настройки для специфических задач
export interface TaskSpecificConfig {
  taskType: ModelCapability;
  preferredModels: string[];
  customPrompts: {
    system: string;
    user: string;
    assistant?: string;
  };
  preprocessing: {
    enabled: boolean;
    steps: string[];
  };
  postprocessing: {
    enabled: boolean;
    validation: boolean;
    formatting: boolean;
  };
  qualityControls: {
    enabled: boolean;
    minConfidence: number;
    requiredFields: string[];
    validationRules: ValidationRule[];
  };
}

export interface ValidationRule {
  field: string;
  type: 'required' | 'format' | 'range' | 'custom';
  rule: string | RegExp | ((value: any) => boolean);
  message: string;
}

// Статистика использования
export interface AIUsageStatistics {
  period: 'hour' | 'day' | 'week' | 'month';
  data: {
    timestamp: string;
    totalRequests: number;
    totalTokens: number;
    totalCost: number;
    averageResponseTime: number;
    successRate: number;
    topModels: Array<{
      modelId: string;
      requests: number;
      tokens: number;
      cost: number;
    }>;
    topModules: Array<{
      moduleId: ModuleId;
      requests: number;
      cost: number;
    }>;
    errors: Array<{
      type: string;
      count: number;
      lastOccurred: string;
    }>;
  }[];
}

// Конфигурация для UI
export interface AIConfigUIState {
  activeTab: 'models' | 'providers' | 'prompts' | 'performance' | 'monitoring' | 'costs';
  selectedProvider?: AIProvider;
  selectedModel?: string;
  selectedModule?: ModuleId;
  filters: {
    provider?: AIProvider;
    capability?: ModelCapability;
    status?: string;
  };
  viewMode: 'grid' | 'list' | 'detailed';
  showAdvanced: boolean;
}

// Предустановленные конфигурации
export interface PresetConfiguration {
  id: string;
  name: string;
  description: string;
  category: 'development' | 'production' | 'cost-optimized' | 'performance' | 'custom';
  config: Partial<UnifiedAIConfiguration>;
  isDefault: boolean;
  author: string;
  createdAt: string;
  tags: string[];
}

// Экспорт/импорт конфигурации
export interface ConfigurationExport {
  metadata: {
    exportedAt: string;
    version: string;
    exportedBy: string;
    description?: string;
  };
  config: UnifiedAIConfiguration;
  checksum: string;
}

// Валидация конфигурации
export interface ConfigValidationResult {
  isValid: boolean;
  errors: ConfigValidationError[];
  warnings: ConfigValidationWarning[];
  suggestions: ConfigValidationSuggestion[];
}

export interface ConfigValidationError {
  field: string;
  message: string;
  severity: 'error' | 'warning';
  code: string;
}

export interface ConfigValidationWarning {
  field: string;
  message: string;
  impact: 'low' | 'medium' | 'high';
  recommendation: string;
}

export interface ConfigValidationSuggestion {
  field: string;
  currentValue: any;
  suggestedValue: any;
  reason: string;
  expectedImprovement: string;
}