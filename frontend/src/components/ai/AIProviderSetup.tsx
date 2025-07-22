/**
 * AI Provider Setup - Component for configuring AI API keys
 * Согласно ТЗ DevAssist Pro
 */

import React, { useState, useEffect } from 'react';
import {
  Settings,
  Key,
  Eye,
  EyeOff,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Save,
  TestTube,
  RefreshCw,
  Shield,
  Zap,
  DollarSign
} from 'lucide-react';
import { Button } from '../ui/Button';
import { AIProvider } from '../../types/aiConfig';

interface ProviderConfig {
  provider: AIProvider;
  displayName: string;
  apiKey: string;
  organization?: string;
  baseUrl?: string;
  isConnected: boolean;
  isLoading: boolean;
  lastTested?: string;
  error?: string;
}

interface AIProviderSetupProps {
  onConfigSave: (configs: Record<AIProvider, ProviderConfig>) => void;
  onTestConnection: (provider: AIProvider, config: ProviderConfig) => Promise<boolean>;
  initialConfigs?: Record<AIProvider, ProviderConfig>;
  className?: string;
}

const AIProviderSetup: React.FC<AIProviderSetupProps> = ({
  onConfigSave,
  onTestConnection,
  initialConfigs,
  className = ''
}) => {
  const [configs, setConfigs] = useState<Record<AIProvider, ProviderConfig>>({
    openai: {
      provider: 'openai',
      displayName: 'OpenAI',
      apiKey: '',
      organization: '',
      baseUrl: 'https://api.openai.com/v1',
      isConnected: false,
      isLoading: false
    },
    anthropic: {
      provider: 'anthropic',
      displayName: 'Anthropic Claude',
      apiKey: '',
      baseUrl: 'https://api.anthropic.com/v1',
      isConnected: false,
      isLoading: false
    },
    google: {
      provider: 'google',
      displayName: 'Google AI',
      apiKey: '',
      baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
      isConnected: false,
      isLoading: false
    },
    custom: {
      provider: 'custom',
      displayName: 'Custom Provider',
      apiKey: '',
      baseUrl: '',
      isConnected: false,
      isLoading: false
    }
  });

  const [showKeys, setShowKeys] = useState<Record<AIProvider, boolean>>({
    openai: false,
    anthropic: false,
    google: false,
    custom: false
  });

  const [hasChanges, setHasChanges] = useState(false);

  // Инициализация с переданными конфигурациями
  useEffect(() => {
    if (initialConfigs) {
      setConfigs(prev => ({ ...prev, ...initialConfigs }));
    }
  }, [initialConfigs]);

  // Обновление конфигурации провайдера
  const updateConfig = (provider: AIProvider, updates: Partial<ProviderConfig>) => {
    setConfigs(prev => ({
      ...prev,
      [provider]: { ...prev[provider], ...updates }
    }));
    setHasChanges(true);
  };

  // Тестирование соединения
  const testConnection = async (provider: AIProvider) => {
    const config = configs[provider];
    if (!config.apiKey.trim()) {
      updateConfig(provider, { error: 'API key is required' });
      return;
    }

    updateConfig(provider, { isLoading: true, error: undefined });

    try {
      const isConnected = await onTestConnection(provider, config);
      updateConfig(provider, {
        isConnected,
        isLoading: false,
        lastTested: new Date().toISOString(),
        error: isConnected ? undefined : 'Connection failed'
      });
    } catch (error) {
      updateConfig(provider, {
        isConnected: false,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Connection test failed'
      });
    }
  };

  // Тестирование всех подключений
  const testAllConnections = async () => {
    const providers = Object.keys(configs) as AIProvider[];
    await Promise.all(
      providers
        .filter(provider => configs[provider].apiKey.trim())
        .map(provider => testConnection(provider))
    );
  };

  // Сохранение конфигураций
  const saveConfigs = () => {
    onConfigSave(configs);
    setHasChanges(false);
  };

  // Переключение видимости API ключа
  const toggleKeyVisibility = (provider: AIProvider) => {
    setShowKeys(prev => ({ ...prev, [provider]: !prev[provider] }));
  };

  // Получение иконки статуса
  const getStatusIcon = (config: ProviderConfig) => {
    if (config.isLoading) {
      return <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />;
    }
    if (config.isConnected) {
      return <CheckCircle className="w-4 h-4 text-green-500" />;
    }
    if (config.error) {
      return <XCircle className="w-4 h-4 text-red-500" />;
    }
    return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
  };

  // Получение цвета статуса
  const getStatusColor = (config: ProviderConfig) => {
    if (config.isConnected) return 'text-green-500';
    if (config.error) return 'text-red-500';
    return 'text-yellow-500';
  };

  // Получение текста статуса
  const getStatusText = (config: ProviderConfig) => {
    if (config.isLoading) return 'Testing...';
    if (config.isConnected) return 'Connected';
    if (config.error) return config.error;
    return 'Not tested';
  };

  const getProviderIcon = (provider: AIProvider) => {
    switch (provider) {
      case 'openai': return '🤖';
      case 'anthropic': return '🎭';
      case 'google': return '🔍';
      case 'custom': return '🔧';
      default: return '🤖';
    }
  };

  const getProviderDescription = (provider: AIProvider) => {
    switch (provider) {
      case 'openai': return 'GPT models for text generation and analysis';
      case 'anthropic': return 'Claude models for conversational AI and analysis';
      case 'google': return 'Gemini models for multimodal AI tasks';
      case 'custom': return 'Custom API endpoint for specialized models';
      default: return '';
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <Settings className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">AI Provider Setup</h2>
            <p className="text-gray-400">Configure API keys and connection settings</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <Button
            onClick={testAllConnections}
            variant="outline"
            size="sm"
            disabled={!Object.values(configs).some(c => c.apiKey.trim())}
          >
            <TestTube className="h-4 w-4 mr-2" />
            Test All
          </Button>
          
          <Button
            onClick={saveConfigs}
            disabled={!hasChanges}
            size="sm"
          >
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </div>

      {/* Provider Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {(Object.keys(configs) as AIProvider[]).map(provider => {
          const config = configs[provider];
          
          return (
            <div
              key={provider}
              className="bg-gray-800 border border-gray-700 rounded-lg p-6 space-y-4"
            >
              {/* Provider Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{getProviderIcon(provider)}</span>
                  <div>
                    <h3 className="font-semibold text-white">{config.displayName}</h3>
                    <p className="text-sm text-gray-400">{getProviderDescription(provider)}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  {getStatusIcon(config)}
                  <span className={`text-sm ${getStatusColor(config)}`}>
                    {getStatusText(config)}
                  </span>
                </div>
              </div>

              {/* API Key Field */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">
                  API Key
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type={showKeys[provider] ? 'text' : 'password'}
                    value={config.apiKey}
                    onChange={(e) => updateConfig(provider, { apiKey: e.target.value })}
                    placeholder={`Enter ${config.displayName} API key`}
                    className="flex-1 bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
                  />
                  <button
                    onClick={() => toggleKeyVisibility(provider)}
                    className="p-2 bg-gray-700 border border-gray-600 rounded hover:bg-gray-600 transition-colors"
                  >
                    {showKeys[provider] ? (
                      <EyeOff className="w-4 h-4 text-gray-400" />
                    ) : (
                      <Eye className="w-4 h-4 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>

              {/* Organization Field (OpenAI only) */}
              {provider === 'openai' && (
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-300">
                    Organization ID (Optional)
                  </label>
                  <input
                    type="text"
                    value={config.organization || ''}
                    onChange={(e) => updateConfig(provider, { organization: e.target.value })}
                    placeholder="org-..."
                    className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
                  />
                </div>
              )}

              {/* Base URL Field */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">
                  Base URL
                </label>
                <input
                  type="url"
                  value={config.baseUrl || ''}
                  onChange={(e) => updateConfig(provider, { baseUrl: e.target.value })}
                  placeholder={`${config.displayName} API base URL`}
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
                />
              </div>

              {/* Status Information */}
              {config.lastTested && (
                <div className="pt-3 border-t border-gray-700">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Last tested:</span>
                    <span className="text-gray-300">
                      {new Date(config.lastTested).toLocaleString()}
                    </span>
                  </div>
                </div>
              )}

              {/* Error Message */}
              {config.error && (
                <div className="bg-red-900/20 border border-red-700 rounded p-3">
                  <div className="flex items-center space-x-2">
                    <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                    <span className="text-red-300 text-sm">{config.error}</span>
                  </div>
                </div>
              )}

              {/* Test Connection Button */}
              <Button
                onClick={() => testConnection(provider)}
                disabled={!config.apiKey.trim() || config.isLoading}
                variant="outline"
                size="sm"
                className="w-full"
              >
                {config.isLoading ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <TestTube className="h-4 w-4 mr-2" />
                )}
                Test Connection
              </Button>
            </div>
          );
        })}
      </div>

      {/* Security Notice */}
      <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <Shield className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-medium text-yellow-300">Security Notice</h4>
            <p className="text-sm text-yellow-200">
              API keys are stored securely in your browser's local storage and encrypted before transmission. 
              Never share your API keys with unauthorized users. Monitor your provider dashboards for unusual usage patterns.
            </p>
          </div>
        </div>
      </div>

      {/* Provider Information */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <div className="flex items-center space-x-3 mb-2">
            <Zap className="w-5 h-5 text-blue-500" />
            <h4 className="font-medium text-white">Performance</h4>
          </div>
          <p className="text-sm text-gray-400">
            Different providers have varying response times and capabilities. 
            Test performance for your specific use cases.
          </p>
        </div>

        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <div className="flex items-center space-x-3 mb-2">
            <DollarSign className="w-5 h-5 text-green-500" />
            <h4 className="font-medium text-white">Pricing</h4>
          </div>
          <p className="text-sm text-gray-400">
            Each provider has different pricing models. Monitor usage and costs 
            in the AI management dashboard.
          </p>
        </div>

        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <div className="flex items-center space-x-3 mb-2">
            <Settings className="w-5 h-5 text-purple-500" />
            <h4 className="font-medium text-white">Configuration</h4>
          </div>
          <p className="text-sm text-gray-400">
            Use the AI Configuration Panel to set up model preferences, 
            fallbacks, and performance modes.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AIProviderSetup;