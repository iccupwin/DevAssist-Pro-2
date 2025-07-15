import { create } from 'zustand'
import { persist, devtools } from 'zustand/middleware'
import { AIConfiguration, ModelConfig, UsageStatistics, ProviderConfig } from './types'

interface AIState {
  // Configuration
  config: AIConfiguration
  availableModels: ModelConfig[]
  
  // Usage tracking
  usage: UsageStatistics
  
  // Real-time status
  isProcessing: boolean
  currentProvider: string | null
  
  // Actions
  updateConfig: (config: Partial<AIConfiguration>) => void
  setDefaultModel: (category: string, modelId: string) => void
  setModuleOverride: (moduleId: string, modelId: string) => void
  removeModuleOverride: (moduleId: string) => void
  
  // Provider management
  updateProvider: (provider: string, config: Partial<ProviderConfig>) => void
  setProviderStatus: (provider: string, enabled: boolean) => void
  
  // Model management
  addModel: (model: ModelConfig) => void
  updateModel: (modelId: string, updates: Partial<ModelConfig>) => void
  removeModel: (modelId: string) => void
  getModelById: (modelId: string) => ModelConfig | undefined
  getModelsByProvider: (provider: string) => ModelConfig[]
  
  // Usage tracking
  recordUsage: (provider: string, tokens: number, cost: number) => void
  resetUsage: (period: 'daily' | 'monthly') => void
  
  // Cost management
  checkCostLimits: () => { exceeded: boolean; warning: boolean }
  getRemainingBudget: () => number
  
  // Processing state
  setProcessing: (processing: boolean, provider?: string) => void
}

const defaultAIConfig: AIConfiguration = {
  defaultModels: {
    textAnalysis: 'claude-3-5-sonnet',
    dataExtraction: 'gpt-4o',
    reportGeneration: 'claude-3-5-sonnet',
    webSearch: 'gpt-4o-mini'
  },
  moduleOverrides: {},
  costLimits: {
    dailyLimit: 50,
    monthlyLimit: 500,
    warningThreshold: 80,
    currency: 'USD'
  },
  performanceMode: 'balanced',
  providers: {
    openai: {
      enabled: true,
      models: [],
      rateLimits: {
        requestsPerMinute: 60,
        tokensPerMinute: 150000
      }
    },
    anthropic: {
      enabled: true,
      models: [],
      rateLimits: {
        requestsPerMinute: 50,
        tokensPerMinute: 100000
      }
    },
    google: {
      enabled: false,
      models: [],
      rateLimits: {
        requestsPerMinute: 60,
        tokensPerMinute: 120000
      }
    }
  }
}

const defaultUsage: UsageStatistics = {
  today: { requests: 0, tokens: 0, cost: 0, documentsProcessed: 0, analysisCompleted: 0 },
  thisMonth: { requests: 0, tokens: 0, cost: 0, documentsProcessed: 0, analysisCompleted: 0 },
  total: { requests: 0, tokens: 0, cost: 0, documentsProcessed: 0, analysisCompleted: 0 }
}

export const useAIStore = create<AIState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        config: defaultAIConfig,
        availableModels: [],
        usage: defaultUsage,
        isProcessing: false,
        currentProvider: null,
        
        // Configuration actions
        updateConfig: (updates) => set((state) => ({
          config: { ...state.config, ...updates }
        })),
        
        setDefaultModel: (category, modelId) => set((state) => ({
          config: {
            ...state.config,
            defaultModels: {
              ...state.config.defaultModels,
              [category]: modelId
            }
          }
        })),
        
        setModuleOverride: (moduleId, modelId) => set((state) => ({
          config: {
            ...state.config,
            moduleOverrides: {
              ...state.config.moduleOverrides,
              [moduleId]: modelId
            }
          }
        })),
        
        removeModuleOverride: (moduleId) => set((state) => {
          const { [moduleId]: removed, ...rest } = state.config.moduleOverrides
          return {
            config: {
              ...state.config,
              moduleOverrides: rest
            }
          }
        }),
        
        // Provider management
        updateProvider: (provider, updates) => set((state) => ({
          config: {
            ...state.config,
            providers: {
              ...state.config.providers,
              [provider]: {
                ...state.config.providers[provider as keyof typeof state.config.providers],
                ...updates
              }
            }
          }
        })),
        
        setProviderStatus: (provider, enabled) => set((state) => ({
          config: {
            ...state.config,
            providers: {
              ...state.config.providers,
              [provider]: {
                ...state.config.providers[provider as keyof typeof state.config.providers],
                enabled
              }
            }
          }
        })),
        
        // Model management
        addModel: (model) => set((state) => ({
          availableModels: [...state.availableModels, model]
        })),
        
        updateModel: (modelId, updates) => set((state) => ({
          availableModels: state.availableModels.map(model =>
            model.id === modelId ? { ...model, ...updates } : model
          )
        })),
        
        removeModel: (modelId) => set((state) => ({
          availableModels: state.availableModels.filter(model => model.id !== modelId)
        })),
        
        getModelById: (modelId) => {
          const { availableModels } = get()
          return availableModels.find(model => model.id === modelId)
        },
        
        getModelsByProvider: (provider) => {
          const { availableModels } = get()
          return availableModels.filter(model => model.provider === provider)
        },
        
        // Usage tracking
        recordUsage: (provider, tokens, cost) => set((state) => ({
          usage: {
            today: {
              ...state.usage.today,
              requests: state.usage.today.requests + 1,
              tokens: state.usage.today.tokens + tokens,
              cost: state.usage.today.cost + cost
            },
            thisMonth: {
              ...state.usage.thisMonth,
              requests: state.usage.thisMonth.requests + 1,
              tokens: state.usage.thisMonth.tokens + tokens,
              cost: state.usage.thisMonth.cost + cost
            },
            total: {
              ...state.usage.total,
              requests: state.usage.total.requests + 1,
              tokens: state.usage.total.tokens + tokens,
              cost: state.usage.total.cost + cost
            }
          }
        })),
        
        resetUsage: (period) => set((state) => ({
          usage: {
            ...state.usage,
            [period === 'daily' ? 'today' : 'thisMonth']: {
              requests: 0, tokens: 0, cost: 0, documentsProcessed: 0, analysisCompleted: 0
            }
          }
        })),
        
        // Cost management
        checkCostLimits: () => {
          const { config, usage } = get()
          const dailyCost = usage.today.cost
          const monthlyCost = usage.thisMonth.cost
          
          const dailyWarning = dailyCost >= (config.costLimits.dailyLimit * config.costLimits.warningThreshold / 100)
          const monthlyWarning = monthlyCost >= (config.costLimits.monthlyLimit * config.costLimits.warningThreshold / 100)
          
          const dailyExceeded = dailyCost >= config.costLimits.dailyLimit
          const monthlyExceeded = monthlyCost >= config.costLimits.monthlyLimit
          
          return {
            exceeded: dailyExceeded || monthlyExceeded,
            warning: dailyWarning || monthlyWarning
          }
        },
        
        getRemainingBudget: () => {
          const { config, usage } = get()
          const remaining = config.costLimits.monthlyLimit - usage.thisMonth.cost
          return Math.max(0, remaining)
        },
        
        // Processing state
        setProcessing: (processing, provider) => set({
          isProcessing: processing,
          currentProvider: processing ? provider || null : null
        })
      }),
      {
        name: 'ai-storage',
        partialize: (state) => ({ 
          config: state.config,
          availableModels: state.availableModels,
          usage: state.usage
        })
      }
    ),
    { name: 'ai-store' }
  )
)