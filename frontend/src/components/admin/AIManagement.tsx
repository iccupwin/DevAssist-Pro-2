/**
 * AIManagement - Управление AI моделями и провайдерами в админ панели
 * Согласно ТЗ DevAssist Pro
 */

import React, { useState, useEffect } from 'react';
import {
  Bot,
  Settings,
  BarChart3,
  DollarSign,
  Zap,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  TrendingDown,
  Minus,
  RefreshCw,
  Eye,
  Edit,
  Power,
  PieChart,
  Activity,
  Brain
} from 'lucide-react';
import { AIProvider } from '../../types/admin';
import { Button } from '../ui/Button';
import UnifiedAIConfigPanel from '../ai/UnifiedAIConfigPanel';
import { useAIConfig } from '../../hooks/useAIConfig';
import { adminService } from '../../services/adminService';

interface AIManagementProps {
  className?: string;
}

// Mock данные AI провайдеров
const mockProviders: AIProvider[] = [
  {
    name: 'openai',
    displayName: 'OpenAI',
    status: 'active',
    usage: {
      current: 850000,
      limit: 1000000,
      percentage: 85
    },
    costs: {
      current: 124.50,
      monthly: 890.25,
      budget: 1000
    },
    models: [
      {
        name: 'gpt-4o',
        status: 'active',
        requests: 12543,
        successRate: 98.2,
        avgLatency: 2.1
      },
      {
        name: 'gpt-4-turbo',
        status: 'active',
        requests: 8901,
        successRate: 97.8,
        avgLatency: 1.8
      },
      {
        name: 'gpt-3.5-turbo',
        status: 'active',
        requests: 23456,
        successRate: 99.1,
        avgLatency: 1.2
      }
    ],
    lastUpdate: new Date().toISOString()
  },
  {
    name: 'anthropic',
    displayName: 'Anthropic',
    status: 'active',
    usage: {
      current: 670000,
      limit: 1000000,
      percentage: 67
    },
    costs: {
      current: 89.30,
      monthly: 456.78,
      budget: 800
    },
    models: [
      {
        name: 'claude-3-5-sonnet',
        status: 'active',
        requests: 9876,
        successRate: 98.5,
        avgLatency: 2.4
      },
      {
        name: 'claude-3-opus',
        status: 'active',
        requests: 3456,
        successRate: 97.9,
        avgLatency: 3.1
      },
      {
        name: 'claude-3-haiku',
        status: 'active',
        requests: 15678,
        successRate: 99.3,
        avgLatency: 1.5
      }
    ],
    lastUpdate: new Date().toISOString()
  },
  {
    name: 'google',
    displayName: 'Google AI',
    status: 'limited',
    usage: {
      current: 450000,
      limit: 1000000,
      percentage: 45
    },
    costs: {
      current: 34.20,
      monthly: 123.45,
      budget: 500
    },
    models: [
      {
        name: 'gemini-pro',
        status: 'active',
        requests: 5432,
        successRate: 96.1,
        avgLatency: 2.8
      },
      {
        name: 'gemini-pro-vision',
        status: 'error',
        requests: 123,
        successRate: 87.2,
        avgLatency: 4.2
      }
    ],
    lastUpdate: new Date(Date.now() - 5 * 60 * 1000).toISOString()
  }
];

export const AIManagement: React.FC<AIManagementProps> = ({
  className = ''
}) => {
  const [providers, setProviders] = useState<AIProvider[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<AIProvider | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isConfigPanelOpen, setIsConfigPanelOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Интеграция с unified AI config
  const { config, saveConfig } = useAIConfig();

  // Загружаем реальных провайдеров при монтировании компонента
  useEffect(() => {
    loadProviders();
  }, []);

  const loadProviders = async () => {
    setIsLoading(true);
    try {
      const response = await adminService.getAIProviders();
      if (response.success) {
        setProviders(response.data);
      } else {
        // Fallback к mock данным
        setProviders(mockProviders);
      }
    } catch (error) {
      console.error('Failed to load AI providers:', error);
      // Fallback к mock данным
      setProviders(mockProviders);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshData = async () => {
    setIsRefreshing(true);
    try {
      await loadProviders();
    } catch (error) {
      console.error('Failed to refresh AI data:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return CheckCircle;
      case 'limited': return AlertTriangle;
      case 'error': return AlertTriangle;
      case 'maintenance': return Clock;
      default: return Minus;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-500';
      case 'limited': return 'text-yellow-500';
      case 'error': return 'text-red-500';
      case 'maintenance': return 'text-blue-500';
      default: return 'text-gray-500';
    }
  };

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 75) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const ProviderCard: React.FC<{ provider: AIProvider }> = ({ provider }) => {
    const StatusIcon = getStatusIcon(provider.status);
    const statusColor = getStatusColor(provider.status);
    const usageColor = getUsageColor(provider.usage.percentage);

    return (
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 hover:border-gray-600 transition-all duration-200">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Bot className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">{provider.displayName}</h3>
              <div className="flex items-center space-x-2">
                <StatusIcon className={`h-4 w-4 ${statusColor}`} />
                <span className={`text-sm capitalize ${statusColor}`}>{provider.status}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Button size="sm" variant="outline">
              <Eye className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="outline">
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Usage Bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">Usage</span>
            <span className="text-sm text-white">{provider.usage.percentage}%</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div 
              className={`h-2 rounded-full ${usageColor}`}
              style={{ width: `${provider.usage.percentage}%` }}
            />
          </div>
          <div className="flex items-center justify-between mt-1">
            <span className="text-xs text-gray-500">
              {(provider.usage.current / 1000).toFixed(0)}K
            </span>
            <span className="text-xs text-gray-500">
              {(provider.usage.limit / 1000).toFixed(0)}K
            </span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-gray-900 rounded-lg p-3">
            <div className="flex items-center space-x-2 mb-1">
              <DollarSign className="h-4 w-4 text-green-500" />
              <span className="text-xs text-gray-400">Current Cost</span>
            </div>
            <p className="text-lg font-bold text-white">${provider.costs.current.toFixed(2)}</p>
            <p className="text-xs text-gray-500">
              Budget: ${provider.costs.budget}
            </p>
          </div>

          <div className="bg-gray-900 rounded-lg p-3">
            <div className="flex items-center space-x-2 mb-1">
              <Activity className="h-4 w-4 text-blue-500" />
              <span className="text-xs text-gray-400">Models</span>
            </div>
            <p className="text-lg font-bold text-white">{provider.models.length}</p>
            <p className="text-xs text-gray-500">
              {provider.models.filter(m => m.status === 'active').length} active
            </p>
          </div>
        </div>

        {/* Models List */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-300">Models</h4>
          {provider.models.slice(0, 3).map((model, index) => (
            <div key={index} className="flex items-center justify-between bg-gray-900 rounded p-2">
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${
                  model.status === 'active' ? 'bg-green-500' : 
                  model.status === 'error' ? 'bg-red-500' : 'bg-yellow-500'
                }`} />
                <span className="text-sm text-white">{model.name}</span>
              </div>
              <div className="flex items-center space-x-3 text-xs text-gray-400">
                <span>{model.successRate.toFixed(1)}%</span>
                <span>{model.avgLatency.toFixed(1)}s</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Общая статистика
  const totalCosts = providers.reduce((sum, p) => sum + p.costs.current, 0);
  const totalRequests = providers.reduce((sum, p) => 
    sum + p.models.reduce((modelSum, m) => modelSum + m.requests, 0), 0
  );
  const avgSuccessRate = providers.reduce((sum, p) => 
    sum + p.models.reduce((modelSum, m) => modelSum + m.successRate, 0) / p.models.length, 0
  ) / providers.length;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center space-x-3">
            <Bot className="h-8 w-8" />
            <span>AI Management</span>
          </h1>
          <p className="text-gray-400 mt-1">
            Monitor AI providers, models, and usage
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Button
            onClick={refreshData}
            disabled={isRefreshing}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button 
            size="sm"
            onClick={() => setIsConfigPanelOpen(true)}
          >
            <Brain className="h-4 w-4 mr-2" />
            AI Configuration
          </Button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
          <div className="flex items-center space-x-3 mb-2">
            <DollarSign className="h-5 w-5 text-green-500" />
            <span className="text-sm text-gray-400">Total Costs</span>
          </div>
          <p className="text-2xl font-bold text-white">${totalCosts.toFixed(2)}</p>
          <p className="text-sm text-gray-500">This month</p>
        </div>

        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
          <div className="flex items-center space-x-3 mb-2">
            <Activity className="h-5 w-5 text-blue-500" />
            <span className="text-sm text-gray-400">Total Requests</span>
          </div>
          <p className="text-2xl font-bold text-white">{totalRequests.toLocaleString()}</p>
          <p className="text-sm text-gray-500">Today</p>
        </div>

        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
          <div className="flex items-center space-x-3 mb-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <span className="text-sm text-gray-400">Success Rate</span>
          </div>
          <p className="text-2xl font-bold text-white">{avgSuccessRate.toFixed(1)}%</p>
          <p className="text-sm text-gray-500">Average</p>
        </div>

        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
          <div className="flex items-center space-x-3 mb-2">
            <Bot className="h-5 w-5 text-purple-500" />
            <span className="text-sm text-gray-400">Active Providers</span>
          </div>
          <p className="text-2xl font-bold text-white">
            {providers.filter(p => p.status === 'active').length}
          </p>
          <p className="text-sm text-gray-500">of {providers.length}</p>
        </div>
      </div>

      {/* Providers Grid */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white">Provider Status</h2>
          <div className="flex items-center space-x-2 text-sm text-gray-400">
            <Clock className="h-4 w-4" />
            <span>Last updated: {new Date().toLocaleTimeString('ru-RU')}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {providers.map((provider) => (
            <ProviderCard key={provider.name} provider={provider} />
          ))}
        </div>
      </div>

      {/* Model Performance Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Model Performance</h3>
            <Button size="sm" variant="outline">
              <BarChart3 className="h-4 w-4 mr-2" />
              Analytics
            </Button>
          </div>
          
          <div className="h-64 bg-gray-900 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <BarChart3 className="h-12 w-12 text-gray-600 mx-auto mb-2" />
              <p className="text-gray-500">Performance chart coming soon</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Cost Distribution</h3>
            <Button size="sm" variant="outline">
              <DollarSign className="h-4 w-4 mr-2" />
              Billing
            </Button>
          </div>
          
          <div className="h-64 bg-gray-900 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <PieChart className="h-12 w-12 text-gray-600 mx-auto mb-2" />
              <p className="text-gray-500">Cost breakdown coming soon</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Recent AI Activity</h3>
        
        <div className="space-y-3">
          {[
            { time: '2 min ago', action: 'OpenAI GPT-4o completed analysis', status: 'success' },
            { time: '5 min ago', action: 'Claude 3.5 Sonnet processing document', status: 'processing' },
            { time: '8 min ago', action: 'Gemini Pro rate limit warning', status: 'warning' },
            { time: '12 min ago', action: 'Batch processing completed (23 items)', status: 'success' }
          ].map((activity, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-900 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className={`w-2 h-2 rounded-full ${
                  activity.status === 'success' ? 'bg-green-500' :
                  activity.status === 'warning' ? 'bg-yellow-500' :
                  activity.status === 'processing' ? 'bg-blue-500 animate-pulse' : 'bg-gray-500'
                }`} />
                <span className="text-white">{activity.action}</span>
              </div>
              <span className="text-sm text-gray-400">{activity.time}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Unified AI Config Panel */}
      {config && (
        <UnifiedAIConfigPanel
          isOpen={isConfigPanelOpen}
          onClose={() => setIsConfigPanelOpen(false)}
          config={config}
          onConfigChange={saveConfig}
          userRole="admin"
        />
      )}
    </div>
  );
};

export default AIManagement;