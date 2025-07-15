// Конфигурация AI моделей
export const AI_MODELS = {
  CLAUDE: {
    id: 'claude-3-sonnet',
    name: 'Claude 3 Sonnet',
    provider: 'anthropic',
    maxTokens: 4096,
    temperature: 0.7,
  },
  GPT4: {
    id: 'gpt-4',
    name: 'GPT-4',
    provider: 'openai',
    maxTokens: 4096,
    temperature: 0.7,
  },
  GPT35: {
    id: 'gpt-3.5-turbo',
    name: 'GPT-3.5 Turbo',
    provider: 'openai',
    maxTokens: 4096,
    temperature: 0.7,
  },
} as const;

export const DEFAULT_MODEL = AI_MODELS.CLAUDE;

export type AIModel = typeof AI_MODELS[keyof typeof AI_MODELS];
export type ModelProvider = 'anthropic' | 'openai';

// Утилитарная функция для получения модели по ID
export const getModelById = (modelId: string): AIModel | undefined => {
  return Object.values(AI_MODELS).find(model => model.id === modelId);
};