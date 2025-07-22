import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '../../services/queryClient'
import { ModelConfig, AIConfiguration, UsageStatistics, ProviderConfig } from '../../stores/types'

// Mock AI API service
const aiApi = {
  getModels: async (): Promise<ModelConfig[]> => {
    await new Promise(resolve => setTimeout(resolve, 800))
    return [
      {
        id: 'gpt-4o',
        name: 'GPT-4o',
        provider: 'openai',
        model: 'gpt-4o',
        temperature: 0.7,
        maxTokens: 4000,
        costPerToken: 0.00005,
        description: 'Most advanced GPT model with vision capabilities'
      },
      {
        id: 'gpt-4o-mini',
        name: 'GPT-4o Mini',
        provider: 'openai',
        model: 'gpt-4o-mini',
        temperature: 0.7,
        maxTokens: 4000,
        costPerToken: 0.00015,
        description: 'Faster and more cost-effective version of GPT-4o'
      },
      {
        id: 'claude-3-5-sonnet',
        name: 'Claude 3.5 Sonnet',
        provider: 'anthropic',
        model: 'claude-3-5-sonnet-20241022',
        temperature: 0.7,
        maxTokens: 4000,
        costPerToken: 0.00003,
        description: 'Latest Claude model with enhanced reasoning'
      },
      {
        id: 'claude-3-haiku',
        name: 'Claude 3 Haiku',
        provider: 'anthropic',
        model: 'claude-3-haiku-20240307',
        temperature: 0.7,
        maxTokens: 4000,
        costPerToken: 0.000025,
        description: 'Fast and efficient Claude model'
      },
      {
        id: 'gemini-pro',
        name: 'Gemini Pro',
        provider: 'google',
        model: 'gemini-pro',
        temperature: 0.7,
        maxTokens: 4000,
        costPerToken: 0.000125,
        description: 'Google\'s advanced AI model'
      }
    ]
  },
  
  getProviders: async (): Promise<Record<string, ProviderConfig>> => {
    await new Promise(resolve => setTimeout(resolve, 600))
    return {
      openai: {
        apiKey: '••••••••••••••••••••••••••••••••••••',
        enabled: true,
        models: [],
        rateLimits: {
          requestsPerMinute: 60,
          tokensPerMinute: 150000
        }
      },
      anthropic: {
        apiKey: '••••••••••••••••••••••••••••••••••••',
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
  },
  
  getConfiguration: async (): Promise<AIConfiguration> => {
    await new Promise(resolve => setTimeout(resolve, 500))
    return {
      defaultModels: {
        textAnalysis: 'claude-3-5-sonnet',
        dataExtraction: 'gpt-4o',
        reportGeneration: 'claude-3-5-sonnet',
        webSearch: 'gpt-4o-mini'
      },
      moduleOverrides: {
        'kp-analyzer': 'claude-3-5-sonnet'
      },
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
          rateLimits: { requestsPerMinute: 60, tokensPerMinute: 10000 }
        },
        anthropic: {
          enabled: true,
          models: [],
          rateLimits: { requestsPerMinute: 60, tokensPerMinute: 10000 }
        },
        google: {
          enabled: false,
          models: [],
          rateLimits: { requestsPerMinute: 60, tokensPerMinute: 10000 }
        }
      }
    }
  },
  
  updateConfiguration: async (config: Partial<AIConfiguration>): Promise<AIConfiguration> => {
    await new Promise(resolve => setTimeout(resolve, 800))
    const current = await aiApi.getConfiguration()
    return { ...current, ...config }
  },
  
  getUsage: async (): Promise<UsageStatistics> => {
    await new Promise(resolve => setTimeout(resolve, 700))
    return {
      today: {
        requests: 87,
        tokens: 23500,
        cost: 4.67,
        documentsProcessed: 12,
        analysisCompleted: 8
      },
      thisMonth: {
        requests: 1456,
        tokens: 387000,
        cost: 78.45,
        documentsProcessed: 234,
        analysisCompleted: 167
      },
      total: {
        requests: 4567,
        tokens: 1234000,
        cost: 245.89,
        documentsProcessed: 789,
        analysisCompleted: 456
      }
    }
  },
  
  getProviderStatus: async (): Promise<Record<string, 'online' | 'offline' | 'degraded'>> => {
    await new Promise(resolve => setTimeout(resolve, 400))
    return {
      openai: 'online',
      anthropic: 'online',
      google: 'offline'
    }
  },
  
  testProvider: async (provider: string): Promise<{ success: boolean; latency: number; error?: string }> => {
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // Mock test results
    const results = {
      openai: { success: true, latency: 340 },
      anthropic: { success: true, latency: 280 },
      google: { success: false, latency: 0, error: 'API key not configured' }
    }
    
    return results[provider as keyof typeof results] || { success: false, latency: 0, error: 'Unknown provider' }
  }
}

// Available AI models query
export const useAIModels = () => {
  return useQuery({
    queryKey: queryKeys.ai.models,
    queryFn: aiApi.getModels,
    staleTime: 30 * 60 * 1000, // 30 minutes (models don't change often)
  })
}

// AI providers query
export const useAIProviders = () => {
  return useQuery({
    queryKey: queryKeys.ai.providers,
    queryFn: aiApi.getProviders,
    staleTime: 15 * 60 * 1000, // 15 minutes
  })
}

// AI configuration query
export const useAIConfiguration = () => {
  return useQuery({
    queryKey: queryKeys.ai.config,
    queryFn: aiApi.getConfiguration,
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}

// AI configuration mutation
export const useUpdateAIConfiguration = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: aiApi.updateConfiguration,
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.ai.config, data)
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: queryKeys.ai.config })
    },
    onError: (error) => {
      console.error('Failed to update AI configuration:', error)
    }
  })
}

// AI usage statistics query
export const useAIUsage = () => {
  return useQuery({
    queryKey: queryKeys.ai.usage,
    queryFn: aiApi.getUsage,
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 2 * 60 * 1000, // Refetch every 2 minutes
  })
}

// Provider status query
export const useProviderStatus = () => {
  return useQuery({
    queryKey: queryKeys.ai.status,
    queryFn: aiApi.getProviderStatus,
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // Refetch every minute
  })
}

// Test provider mutation
export const useTestProvider = () => {
  return useMutation({
    mutationFn: aiApi.testProvider,
    onSuccess: (data, provider) => {
      console.log(`Provider ${provider} test result:`, data)
    },
    onError: (error, provider) => {
      console.error(`Failed to test provider ${provider}:`, error)
    }
  })
}

// Combined hook for AI dashboard
export const useAIDashboard = () => {
  const models = useAIModels()
  const providers = useAIProviders()
  const configuration = useAIConfiguration()
  const usage = useAIUsage()
  const status = useProviderStatus()
  
  return {
    models,
    providers,
    configuration,
    usage,
    status,
    isLoading: models.isLoading || providers.isLoading || configuration.isLoading || usage.isLoading || status.isLoading,
    error: models.error || providers.error || configuration.error || usage.error || status.error
  }
}

// Hook for model selection with filtering
export const useModelSelection = (provider?: string) => {
  const { data: models, ...rest } = useAIModels()
  
  const filteredModels = provider 
    ? models?.filter(model => model.provider === provider)
    : models
  
  return {
    data: filteredModels,
    ...rest
  }
}