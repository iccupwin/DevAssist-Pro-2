/**
 * Секция прогресса анализа КП
 */

import React from 'react';
import { 
  Brain, 
  FileText, 
  BarChart3, 
  CheckCircle, 
  Clock,
  X
} from 'lucide-react';
import { AnalysisProgress, TechnicalSpecification, CommercialProposal } from '../../types/kpAnalyzer';

interface AnalysisProgressSectionProps {
  progress: AnalysisProgress | null;
  technicalSpec: TechnicalSpecification | null;
  commercialProposals: CommercialProposal[];
  selectedModels: {
    analysis: string;
    comparison: string;
  };
  onCancel: () => void;
}

const AnalysisProgressSection: React.FC<AnalysisProgressSectionProps> = ({
  progress,
  technicalSpec,
  commercialProposals,
  selectedModels,
  onCancel,
}) => {
  const getStageIcon = (stage: string, isActive: boolean, isCompleted: boolean) => {
    const iconClass = `w-8 h-8 ${
      isActive ? 'text-blue-400' : 
      isCompleted ? 'text-green-400' : 
      'text-gray-500'
    }`;

    switch (stage) {
      case 'upload':
        return <FileText className={iconClass} />;
      case 'processing':
        return <Brain className={iconClass} />;
      case 'analysis':
        return <BarChart3 className={iconClass} />;
      case 'comparison':
        return <CheckCircle className={iconClass} />;
      case 'completed':
        return <CheckCircle className={iconClass} />;
      default:
        return <Clock className={iconClass} />;
    }
  };

  const stages = [
    { id: 'upload', label: 'Подготовка документов', description: 'Загрузка и предобработка файлов' },
    { id: 'processing', label: 'Извлечение данных', description: 'Анализ структуры и содержания документов' },
    { id: 'analysis', label: 'Анализ КП', description: 'Оценка каждого предложения по критериям' },
    { id: 'comparison', label: 'Сравнение результатов', description: 'Составление рейтинга и рекомендаций' },
    { id: 'completed', label: 'Завершено', description: 'Результаты готовы к просмотру' },
  ];

  const getCurrentStageIndex = () => {
    if (!progress) return 0;
    return stages.findIndex(stage => stage.id === progress.stage);
  };

  const currentStageIndex = getCurrentStageIndex();

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-8">
      {/* Заголовок */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-2">Анализ в процессе</h2>
        <p className="text-gray-400">
          ИИ анализирует ваши документы и готовит детальное сравнение
        </p>
      </div>

      {/* Основной индикатор прогресса */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-8">
        <div className="text-center mb-8">
          <div className="text-4xl font-bold text-blue-400 mb-2">
            {progress?.progress || 0}%
          </div>
          <div className="w-full bg-gray-700 rounded-full h-3 mb-4">
            <div
              className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-500"
              style={{ width: `${progress?.progress || 0}%` }}
            />
          </div>
          <div className="text-lg text-white font-medium">
            {progress?.currentTask || 'Инициализация...'}
          </div>
        </div>

        {/* Этапы */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {stages.map((stage, index) => {
            const isActive = index === currentStageIndex;
            const isCompleted = index < currentStageIndex;
            
            return (
              <div
                key={stage.id}
                className={`text-center p-4 rounded-lg border ${
                  isActive ? 'border-blue-500 bg-blue-500/10' :
                  isCompleted ? 'border-green-500 bg-green-500/10' :
                  'border-gray-600 bg-gray-800'
                }`}
              >
                <div className="flex justify-center mb-3">
                  {getStageIcon(stage.id, isActive, isCompleted)}
                </div>
                <h3 className={`font-medium mb-1 ${
                  isActive ? 'text-blue-400' :
                  isCompleted ? 'text-green-400' :
                  'text-gray-400'
                }`}>
                  {stage.label}
                </h3>
                <p className="text-xs text-gray-500">{stage.description}</p>
                {isActive && (
                  <div className="mt-2">
                    <div className="w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto" />
                  </div>
                )}
                {isCompleted && (
                  <div className="mt-2">
                    <CheckCircle className="w-6 h-6 text-green-400 mx-auto" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Информация о документах */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-medium text-white mb-4">Анализируемые документы</h3>
          <div className="space-y-3">
            {technicalSpec && (
              <div className="flex items-center space-x-3 p-3 bg-gray-800 rounded">
                <FileText className="w-5 h-5 text-blue-400" />
                <div className="flex-1">
                  <div className="text-white font-medium">ТЗ: {technicalSpec.name}</div>
                  <div className="text-sm text-gray-400">
                    {(technicalSpec.size / 1024 / 1024).toFixed(2)} МБ
                  </div>
                </div>
                <CheckCircle className="w-5 h-5 text-green-400" />
              </div>
            )}
            
            {commercialProposals.map((kp, index) => (
              <div key={kp.id} className="flex items-center space-x-3 p-3 bg-gray-800 rounded">
                <FileText className="w-5 h-5 text-purple-400" />
                <div className="flex-1">
                  <div className="text-white font-medium">КП {index + 1}: {kp.name}</div>
                  <div className="text-sm text-gray-400">
                    {(kp.size / 1024 / 1024).toFixed(2)} МБ
                  </div>
                </div>
                <CheckCircle className="w-5 h-5 text-green-400" />
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-medium text-white mb-4">Настройки анализа</h3>
          <div className="space-y-4">
            <div>
              <div className="text-sm text-gray-400 mb-1">Модель для анализа</div>
              <div className="text-white font-medium">{selectedModels.analysis}</div>
            </div>
            
            <div>
              <div className="text-sm text-gray-400 mb-1">Модель для сравнения</div>
              <div className="text-white font-medium">{selectedModels.comparison}</div>
            </div>
            
            <div>
              <div className="text-sm text-gray-400 mb-1">Документов для анализа</div>
              <div className="text-white font-medium">
                {commercialProposals.length} КП + 1 ТЗ
              </div>
            </div>

            <div>
              <div className="text-sm text-gray-400 mb-1">Критерии оценки</div>
              <div className="text-white font-medium">6 основных критериев</div>
            </div>
          </div>
        </div>
      </div>

      {/* Статистика в реальном времени */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-medium text-white mb-4">Прогресс анализа</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-400">
              {currentStageIndex + 1}/5
            </div>
            <div className="text-sm text-gray-400">Этап</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-green-400">
              {commercialProposals.length}
            </div>
            <div className="text-sm text-gray-400">КП анализируется</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-400">
              {progress?.estimatedTimeRemaining ? formatTime(progress.estimatedTimeRemaining) : '--:--'}
            </div>
            <div className="text-sm text-gray-400">Осталось времени</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-400">
              6
            </div>
            <div className="text-sm text-gray-400">Критериев оценки</div>
          </div>
        </div>
      </div>

      {/* Живой лог активности */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-medium text-white mb-4">Активность ИИ</h3>
        <div className="space-y-2 max-h-40 overflow-y-auto">
          <div className="flex items-center space-x-3 text-sm">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-gray-300">[{new Date().toLocaleTimeString()}]</span>
            <span className="text-white">{progress?.currentTask || 'Ожидание...'}</span>
          </div>
          
          {progress && progress.progress > 20 && (
            <div className="flex items-center space-x-3 text-sm">
              <div className="w-2 h-2 bg-blue-400 rounded-full" />
              <span className="text-gray-300">[{new Date(Date.now() - 30000).toLocaleTimeString()}]</span>
              <span className="text-white">Извлечение текста из документов завершено</span>
            </div>
          )}
          
          {progress && progress.progress > 60 && (
            <div className="flex items-center space-x-3 text-sm">
              <div className="w-2 h-2 bg-purple-400 rounded-full" />
              <span className="text-gray-300">[{new Date(Date.now() - 60000).toLocaleTimeString()}]</span>
              <span className="text-white">Анализ технических требований завершен</span>
            </div>
          )}
        </div>
      </div>

      {/* Кнопка отмены */}
      <div className="text-center">
        <button
          onClick={onCancel}
          className="flex items-center space-x-2 mx-auto px-4 py-2 text-gray-400 hover:text-red-400 transition-colors"
        >
          <X className="w-4 h-4" />
          <span>Отменить анализ</span>
        </button>
      </div>
    </div>
  );
};

export default AnalysisProgressSection;