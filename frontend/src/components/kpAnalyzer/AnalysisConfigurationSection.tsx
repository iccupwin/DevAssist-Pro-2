/**
 * Секция настройки анализа КП
 */

import React from 'react';
import { Settings, Brain, Zap, ChevronLeft } from 'lucide-react';
import { AIModelConfig, TechnicalSpecification, CommercialProposal } from '../../types/kpAnalyzer';

interface AnalysisConfigurationSectionProps {
  selectedModels: {
    analysis: string;
    comparison: string;
  };
  availableModels: AIModelConfig[];
  technicalSpec: TechnicalSpecification | null;
  commercialProposals: CommercialProposal[];
  onUpdateModelSelection: (type: 'analysis' | 'comparison', modelId: string) => void;
  onStartAnalysis: () => void;
  onGoBack: () => void;
  canStartAnalysis: boolean;
  isProcessing: boolean;
}

const AnalysisConfigurationSection: React.FC<AnalysisConfigurationSectionProps> = ({
  selectedModels,
  availableModels,
  technicalSpec,
  commercialProposals,
  onUpdateModelSelection,
  onStartAnalysis,
  onGoBack,
  canStartAnalysis,
  isProcessing,
}) => {
  const getModelIcon = (provider: string) => {
    switch (provider) {
      case 'anthropic':
        return '🤖';
      case 'openai':
        return '🧠';
      case 'google':
        return '⚡';
      default:
        return '🔬';
    }
  };

  const getProviderColor = (provider: string) => {
    switch (provider) {
      case 'anthropic':
        return 'text-purple-400';
      case 'openai':
        return 'text-green-400';
      case 'google':
        return 'text-blue-400';
      default:
        return 'text-gray-400';
    }
  };

  const renderModelSelector = (
    title: string,
    description: string,
    type: 'analysis' | 'comparison',
    selectedModelId: string
  ) => (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
      <h3 className="text-lg font-medium text-white mb-2">{title}</h3>
      <p className="text-gray-400 text-sm mb-4">{description}</p>
      
      <div className="space-y-3">
        {availableModels.map((model) => (
          <label
            key={model.id}
            className={`flex items-center p-3 rounded-lg border cursor-pointer transition-colors ${
              selectedModelId === model.id
                ? 'border-blue-500 bg-blue-500/10'
                : 'border-gray-600 hover:border-gray-500'
            }`}
          >
            <input
              type="radio"
              name={`model-${type}`}
              value={model.id}
              checked={selectedModelId === model.id}
              onChange={() => onUpdateModelSelection(type, model.id)}
              className="sr-only"
            />
            <div className="flex items-center space-x-3 flex-1">
              <span className="text-2xl">{getModelIcon(model.provider)}</span>
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <span className="text-white font-medium">{model.name}</span>
                  {!model.available && (
                    <span className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded">
                      Недоступна
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-4 text-sm text-gray-400 mt-1">
                  <span className={getProviderColor(model.provider)}>
                    {model.provider.toUpperCase()}
                  </span>
                  <span>Temp: {model.temperature}</span>
                  <span>Max tokens: {model.maxTokens}</span>
                </div>
              </div>
            </div>
            {selectedModelId === model.id && (
              <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-full" />
              </div>
            )}
          </label>
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Заголовок секции */}
      <div className="flex items-center space-x-3">
        <Settings className="w-6 h-6 text-blue-400" />
        <h2 className="text-xl font-semibold text-white">
          Настройка анализа
        </h2>
      </div>

      {/* Обзор документов */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-medium text-white mb-4">Документы для анализа</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-sm font-medium text-gray-300 mb-2">Техническое задание</h4>
            {technicalSpec ? (
              <div className="bg-gray-800 border border-gray-700 rounded p-3">
                <div className="text-white font-medium">{technicalSpec.name}</div>
                <div className="text-sm text-gray-400">
                  {(technicalSpec.size / 1024 / 1024).toFixed(2)} МБ • {technicalSpec.type.toUpperCase()}
                </div>
              </div>
            ) : (
              <div className="text-gray-500">Не загружено</div>
            )}
          </div>
          
          <div>
            <h4 className="text-sm font-medium text-gray-300 mb-2">
              Коммерческие предложения ({commercialProposals.length})
            </h4>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {commercialProposals.map((kp) => (
                <div key={kp.id} className="bg-gray-800 border border-gray-700 rounded p-2">
                  <div className="text-white text-sm font-medium truncate">{kp.name}</div>
                  <div className="text-xs text-gray-400">
                    {(kp.size / 1024 / 1024).toFixed(2)} МБ
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Выбор моделей ИИ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {renderModelSelector(
          'Модель для анализа',
          'ИИ модель для детального анализа каждого КП отдельно',
          'analysis',
          selectedModels.analysis
        )}
        
        {renderModelSelector(
          'Модель для сравнения',
          'ИИ модель для сравнения КП между собой и составления рекомендаций',
          'comparison',
          selectedModels.comparison
        )}
      </div>

      {/* Дополнительные настройки */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-medium text-white mb-4">Критерии анализа</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <label className="flex items-center space-x-3">
            <input 
              type="checkbox" 
              defaultChecked 
              className="rounded border-gray-600 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-gray-300">Техническое соответствие</span>
          </label>
          <label className="flex items-center space-x-3">
            <input 
              type="checkbox" 
              defaultChecked 
              className="rounded border-gray-600 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-gray-300">Ценовое предложение</span>
          </label>
          <label className="flex items-center space-x-3">
            <input 
              type="checkbox" 
              defaultChecked 
              className="rounded border-gray-600 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-gray-300">Сроки выполнения</span>
          </label>
          <label className="flex items-center space-x-3">
            <input 
              type="checkbox" 
              defaultChecked 
              className="rounded border-gray-600 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-gray-300">Качество команды</span>
          </label>
          <label className="flex items-center space-x-3">
            <input 
              type="checkbox" 
              defaultChecked 
              className="rounded border-gray-600 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-gray-300">Опыт и портфолио</span>
          </label>
          <label className="flex items-center space-x-3">
            <input 
              type="checkbox" 
              defaultChecked 
              className="rounded border-gray-600 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-gray-300">Гарантии и поддержка</span>
          </label>
        </div>
      </div>

      {/* Информация о процессе */}
      <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-6">
        <div className="flex items-start space-x-3">
          <Brain className="w-6 h-6 text-blue-400 mt-1" />
          <div>
            <h3 className="text-lg font-medium text-blue-300 mb-2">Процесс анализа</h3>
            <ul className="text-blue-200 text-sm space-y-1">
              <li>• Извлечение текста и структурирование документов</li>
              <li>• Анализ каждого КП по критериям из ТЗ</li>
              <li>• Оценка соответствия требованиям (0-100 баллов)</li>
              <li>• Сравнительный анализ всех предложений</li>
              <li>• Формирование рекомендаций и рейтинга</li>
            </ul>
            <div className="text-blue-300 text-sm mt-3">
              <strong>Примерное время:</strong> 2-5 минут в зависимости от объема документов
            </div>
          </div>
        </div>
      </div>

      {/* Кнопки действий */}
      <div className="flex items-center justify-between">
        <button
          onClick={onGoBack}
          className="flex items-center space-x-2 px-4 py-2 text-gray-400 hover:text-white transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Назад к загрузке</span>
        </button>

        <button
          onClick={onStartAnalysis}
          disabled={!canStartAnalysis || isProcessing}
          className={`flex items-center space-x-3 px-8 py-3 rounded-lg font-medium transition-colors ${
            canStartAnalysis && !isProcessing
              ? 'bg-blue-600 hover:bg-blue-700 text-white'
              : 'bg-gray-700 text-gray-400 cursor-not-allowed'
          }`}
        >
          <Zap className="w-5 h-5" />
          <span>{isProcessing ? 'Запуск...' : 'Начать анализ'}</span>
        </button>
      </div>
    </div>
  );
};

export default AnalysisConfigurationSection;