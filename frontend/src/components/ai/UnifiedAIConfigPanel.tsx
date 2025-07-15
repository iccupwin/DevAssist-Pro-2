/**
 * UnifiedAIConfigPanel - Единая панель конфигурации AI
 * Согласно ТЗ DevAssist Pro (раздел 3.2)
 */

import React, { useState, useEffect } from 'react';
import {
  Settings,
  Brain,
  Zap,
  DollarSign,
  BarChart3,
  Key,
  Shield,
  Workflow,
  Sliders,
  Database,
  Clock,
  AlertTriangle,
  CheckCircle,
  Download,
  Upload,
  RotateCcw,
  Save,
  Eye,
  EyeOff,
  HelpCircle,
  Star,
  Trash2,
  Plus,
  Edit3
} from 'lucide-react';
import { UnifiedAIConfiguration, AIConfigUIState, ModelConfig, ProviderSettings, AIModel } from '../../types/aiConfig';

interface UnifiedAIConfigPanelProps {
  isOpen: boolean;
  onClose: () => void;
  config: UnifiedAIConfiguration;
  onConfigChange: (config: UnifiedAIConfiguration) => void;
  userRole?: 'admin' | 'user' | 'developer';
}

const UnifiedAIConfigPanel: React.FC<UnifiedAIConfigPanelProps> = ({
  isOpen,
  onClose,
  config,
  onConfigChange,
  userRole = 'user'
}) => {
  const [uiState, setUIState] = useState<AIConfigUIState>({
    activeTab: 'models',
    filters: {},
    viewMode: 'grid',
    showAdvanced: false
  });

  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showAPIKeys, setShowAPIKeys] = useState(false);

  // Мок данные для демонстрации
  const mockModels: AIModel[] = [
    {
      id: 'gpt-4-turbo',
      name: 'gpt-4-turbo',
      displayName: 'GPT-4 Turbo',
      provider: 'openai',
      type: 'chat',
      maxTokens: 128000,
      costPerToken: { input: 0.01, output: 0.03 },
      capabilities: ['text-analysis', 'data-extraction', 'report-generation', 'code-generation'],
      status: 'active',
      description: 'Наиболее продвинутая модель GPT с улучшенной производительностью',
      version: '2024-04-09'
    },
    {
      id: 'claude-3-sonnet',
      name: 'claude-3-sonnet-20240229',
      displayName: 'Claude 3 Sonnet',
      provider: 'anthropic',
      type: 'chat',
      maxTokens: 200000,
      costPerToken: { input: 0.003, output: 0.015 },
      capabilities: ['text-analysis', 'data-extraction', 'summarization', 'comparison'],
      status: 'active',
      description: 'Сбалансированная модель Claude с отличным качеством анализа',
      version: '2024-02-29'
    },
    {
      id: 'gemini-pro',
      name: 'gemini-pro',
      displayName: 'Gemini Pro',
      provider: 'google',
      type: 'chat',
      maxTokens: 32000,
      costPerToken: { input: 0.0005, output: 0.0015 },
      capabilities: ['text-analysis', 'web-search', 'classification'],
      status: 'active',
      description: 'Мультимодальная модель Google с поддержкой изображений',
      version: '1.0'
    }
  ];

  if (!isOpen) return null;

  const handleTabChange = (tab: AIConfigUIState['activeTab']) => {
    setUIState(prev => ({ ...prev, activeTab: tab }));
  };

  const handleSaveConfig = async () => {
    setIsLoading(true);
    try {
      // Здесь будет реальный API вызов
      await new Promise(resolve => setTimeout(resolve, 1000));
      onConfigChange(config);
      setUnsavedChanges(false);
    } catch (error) {
      console.error('Failed to save config:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case 'openai': return '🤖';
      case 'anthropic': return '🎭';
      case 'google': return '🔍';
      default: return '🔧';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-500 bg-green-500/10';
      case 'deprecated': return 'text-orange-500 bg-orange-500/10';
      case 'beta': return 'text-blue-500 bg-blue-500/10';
      case 'unavailable': return 'text-red-500 bg-red-500/10';
      default: return 'text-gray-500 bg-gray-500/10';
    }
  };

  const renderModelsTab = () => (
    <div className="space-y-6">
      {/* Фильтры */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <select 
            className="bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
            value={uiState.filters.provider || ''}
            onChange={(e) => setUIState(prev => ({
              ...prev,
              filters: { ...prev.filters, provider: e.target.value as any }
            }))}
          >
            <option value="">Все провайдеры</option>
            <option value="openai">OpenAI</option>
            <option value="anthropic">Anthropic</option>
            <option value="google">Google</option>
          </select>
          
          <select 
            className="bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
            value={uiState.filters.status || ''}
            onChange={(e) => setUIState(prev => ({
              ...prev,
              filters: { ...prev.filters, status: e.target.value }
            }))}
          >
            <option value="">Все статусы</option>
            <option value="active">Активные</option>
            <option value="deprecated">Устаревшие</option>
            <option value="beta">Бета</option>
          </select>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setUIState(prev => ({ ...prev, viewMode: 'grid' }))}
            className={`p-2 rounded ${uiState.viewMode === 'grid' ? 'bg-blue-600' : 'bg-gray-700'}`}
          >
            <div className="w-4 h-4 grid grid-cols-2 gap-0.5">
              <div className="bg-current rounded-sm"></div>
              <div className="bg-current rounded-sm"></div>
              <div className="bg-current rounded-sm"></div>
              <div className="bg-current rounded-sm"></div>
            </div>
          </button>
          <button
            onClick={() => setUIState(prev => ({ ...prev, viewMode: 'list' }))}
            className={`p-2 rounded ${uiState.viewMode === 'list' ? 'bg-blue-600' : 'bg-gray-700'}`}
          >
            <BarChart3 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Модели */}
      <div className={uiState.viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-3'}>
        {mockModels.map(model => {
          const isSelected = config.general.defaultModels.textAnalysis.modelId === model.id;
          
          return (
            <div
              key={model.id}
              className={`p-4 rounded-lg border transition-all cursor-pointer ${
                isSelected 
                  ? 'border-blue-500 bg-blue-500/10' 
                  : 'border-gray-700 bg-gray-800 hover:border-gray-600'
              }`}
              onClick={() => {
                // Здесь будет логика выбора модели
                setUnsavedChanges(true);
              }}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <span className="text-2xl">{getProviderIcon(model.provider)}</span>
                  <div>
                    <h3 className="font-semibold text-white">{model.displayName}</h3>
                    <p className="text-sm text-gray-400">{model.provider}</p>
                  </div>
                </div>
                <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(model.status)}`}>
                  {model.status}
                </span>
              </div>

              <p className="text-sm text-gray-300 mb-3">{model.description}</p>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Max Tokens:</span>
                  <span className="text-white">{model.maxTokens.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Input Cost:</span>
                  <span className="text-white">${model.costPerToken.input}/1K tokens</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Output Cost:</span>
                  <span className="text-white">${model.costPerToken.output}/1K tokens</span>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-1">
                {model.capabilities.slice(0, 3).map(cap => (
                  <span key={cap} className="px-2 py-1 bg-gray-700 rounded text-xs text-gray-300">
                    {cap}
                  </span>
                ))}
                {model.capabilities.length > 3 && (
                  <span className="px-2 py-1 bg-gray-700 rounded text-xs text-gray-300">
                    +{model.capabilities.length - 3}
                  </span>
                )}
              </div>

              {isSelected && (
                <div className="mt-3 pt-3 border-t border-gray-700">
                  <button className="w-full py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm font-medium transition-colors">
                    Настроить параметры
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderProvidersTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {(['openai', 'anthropic', 'google'] as const).map(provider => (
          <div key={provider} className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <span className="text-3xl">{getProviderIcon(provider)}</span>
                <div>
                  <h3 className="font-semibold text-white capitalize">{provider}</h3>
                  <p className="text-sm text-gray-400">AI Provider</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span className="text-sm text-green-500">Connected</span>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  API Key
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type={showAPIKeys ? 'text' : 'password'}
                    value="••••••••••••••••••••••••••••••••••••"
                    className="flex-1 bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
                    readOnly
                  />
                  <button
                    onClick={() => setShowAPIKeys(!showAPIKeys)}
                    className="p-2 bg-gray-700 border border-gray-600 rounded hover:bg-gray-600"
                  >
                    {showAPIKeys ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Timeout (s)
                  </label>
                  <input
                    type="number"
                    defaultValue="30"
                    className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Priority
                  </label>
                  <select className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white">
                    <option value="1">High</option>
                    <option value="2">Medium</option>
                    <option value="3">Low</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Rate Limits
                </label>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div>
                    <span className="text-gray-400">RPM:</span>
                    <span className="text-white ml-1">3,500</span>
                  </div>
                  <div>
                    <span className="text-gray-400">TPM:</span>
                    <span className="text-white ml-1">40,000</span>
                  </div>
                  <div>
                    <span className="text-gray-400">RPD:</span>
                    <span className="text-white ml-1">10,000</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-gray-700">
                <label className="flex items-center space-x-2">
                  <input type="checkbox" defaultChecked className="rounded" />
                  <span className="text-sm text-gray-300">Enabled</span>
                </label>
                <button className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm">
                  Test Connection
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderPerformanceTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {(['quality', 'balanced', 'speed'] as const).map(mode => (
          <div
            key={mode}
            className={`p-6 rounded-lg border cursor-pointer transition-all ${
              config.general.performanceMode === mode
                ? 'border-blue-500 bg-blue-500/10'
                : 'border-gray-700 bg-gray-800 hover:border-gray-600'
            }`}
            onClick={() => {
              // Здесь будет логика изменения режима
              setUnsavedChanges(true);
            }}
          >
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-700 rounded-full flex items-center justify-center">
                {mode === 'quality' && <Star className="w-8 h-8 text-yellow-500" />}
                {mode === 'balanced' && <Sliders className="w-8 h-8 text-blue-500" />}
                {mode === 'speed' && <Zap className="w-8 h-8 text-green-500" />}
              </div>
              <h3 className="font-semibold text-white capitalize mb-2">{mode}</h3>
              <p className="text-sm text-gray-400 mb-4">
                {mode === 'quality' && 'Максимальное качество результатов'}
                {mode === 'balanced' && 'Оптимальный баланс качества и скорости'}
                {mode === 'speed' && 'Максимальная скорость обработки'}
              </p>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Timeout:</span>
                  <span className="text-white">
                    {mode === 'quality' && '60s'}
                    {mode === 'balanced' && '30s'}
                    {mode === 'speed' && '15s'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Retries:</span>
                  <span className="text-white">
                    {mode === 'quality' && '3'}
                    {mode === 'balanced' && '2'}
                    {mode === 'speed' && '1'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Cache:</span>
                  <span className="text-white">
                    {mode === 'quality' ? 'Disabled' : 'Enabled'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Дополнительные настройки производительности */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h3 className="font-semibold text-white mb-4">Дополнительные настройки</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <label className="flex items-center justify-between">
              <span className="text-gray-300">Параллельная обработка</span>
              <input type="checkbox" defaultChecked className="rounded" />
            </label>
            <label className="flex items-center justify-between">
              <span className="text-gray-300">Интеллектуальные повторы</span>
              <input type="checkbox" defaultChecked className="rounded" />
            </label>
            <label className="flex items-center justify-between">
              <span className="text-gray-300">Адаптивный timeout</span>
              <input type="checkbox" className="rounded" />
            </label>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Максимальное время ожидания (сек)
              </label>
              <input
                type="number"
                defaultValue="120"
                className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Стратегия выбора модели
              </label>
              <select className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white">
                <option value="best">Лучшая модель</option>
                <option value="fastest">Самая быстрая</option>
                <option value="cheapest">Самая дешевая</option>
                <option value="balanced">Сбалансированная</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderCostsTab = () => (
    <div className="space-y-6">
      {/* Общие лимиты */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h3 className="font-semibold text-white mb-4">Лимиты расходов</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Дневной лимит ($)
            </label>
            <input
              type="number"
              defaultValue="100"
              className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Месячный лимит ($)
            </label>
            <input
              type="number"
              defaultValue="2000"
              className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Лимит на запрос ($)
            </label>
            <input
              type="number"
              step="0.01"
              defaultValue="5.00"
              className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
            />
          </div>
        </div>

        <div className="mt-6 space-y-4">
          <label className="flex items-center justify-between">
            <span className="text-gray-300">Автоматическая остановка при достижении лимита</span>
            <input type="checkbox" defaultChecked className="rounded" />
          </label>
          <label className="flex items-center justify-between">
            <span className="text-gray-300">Уведомления о превышении бюджета</span>
            <input type="checkbox" defaultChecked className="rounded" />
          </label>
        </div>
      </div>

      {/* Распределение бюджета по модулям */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h3 className="font-semibold text-white mb-4">Распределение бюджета по модулям</h3>
        <div className="space-y-4">
          {[
            { id: 'kp-analyzer', name: 'КП Анализатор', percentage: 40 },
            { id: 'tz-generator', name: 'ТЗ Генератор', percentage: 25 },
            { id: 'project-evaluation', name: 'Оценка проектов', percentage: 20 },
            { id: 'marketing-planner', name: 'Маркетинг планировщик', percentage: 10 },
            { id: 'knowledge-base', name: 'База знаний', percentage: 5 }
          ].map(module => (
            <div key={module.id} className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-gray-300">{module.name}</span>
                <span className="text-white">{module.percentage}%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full"
                  style={{ width: `${module.percentage}%` }}
                ></div>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                defaultValue={module.percentage}
                className="w-full"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Статистика расходов */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h3 className="font-semibold text-white mb-4">Текущие расходы</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-500">$47.83</div>
            <div className="text-sm text-gray-400">Сегодня</div>
            <div className="text-xs text-gray-500">из $100</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-500">$1,247.92</div>
            <div className="text-sm text-gray-400">Этот месяц</div>
            <div className="text-xs text-gray-500">из $2,000</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-500">$2.14</div>
            <div className="text-sm text-gray-400">Средний запрос</div>
            <div className="text-xs text-gray-500">лимит $5.00</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-500">2,847</div>
            <div className="text-sm text-gray-400">Запросов</div>
            <div className="text-xs text-gray-500">за месяц</div>
          </div>
        </div>
      </div>
    </div>
  );

  const tabs = [
    { id: 'models' as const, name: 'Модели', icon: Brain },
    { id: 'providers' as const, name: 'Провайдеры', icon: Settings },
    { id: 'performance' as const, name: 'Производительность', icon: Zap },
    { id: 'costs' as const, name: 'Расходы', icon: DollarSign },
    { id: 'monitoring' as const, name: 'Мониторинг', icon: BarChart3 }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-lg w-full max-w-7xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center space-x-3">
            <Brain className="w-8 h-8 text-blue-500" />
            <div>
              <h2 className="text-2xl font-bold text-white">AI Configuration</h2>
              <p className="text-gray-400">Unified AI Configuration Panel</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            {unsavedChanges && (
              <span className="text-orange-500 text-sm flex items-center space-x-1">
                <AlertTriangle className="w-4 h-4" />
                <span>Несохраненные изменения</span>
              </span>
            )}
            
            <button
              onClick={handleSaveConfig}
              disabled={isLoading || !unsavedChanges}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded flex items-center space-x-2 transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>{isLoading ? 'Сохранение...' : 'Сохранить'}</span>
            </button>
            
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-800 rounded transition-colors"
            >
              <span className="sr-only">Закрыть</span>
              <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-700">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = uiState.activeTab === tab.id;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors ${
                    isActive
                      ? 'border-blue-500 text-blue-500'
                      : 'border-transparent text-gray-400 hover:text-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.name}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {uiState.activeTab === 'models' && renderModelsTab()}
          {uiState.activeTab === 'providers' && renderProvidersTab()}
          {uiState.activeTab === 'performance' && renderPerformanceTab()}
          {uiState.activeTab === 'costs' && renderCostsTab()}
          {uiState.activeTab === 'monitoring' && (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <BarChart3 className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-400 mb-2">Мониторинг</h3>
                <p className="text-gray-500">Раздел мониторинга будет реализован в следующих версиях</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UnifiedAIConfigPanel;