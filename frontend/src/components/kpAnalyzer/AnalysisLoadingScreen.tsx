import React, { useEffect, useState } from 'react';
import { Brain, FileText, BarChart3, CheckCircle, Loader2, Sparkles, Zap, Target } from 'lucide-react';
import { AnalysisProgress } from '../../types/kpAnalyzer';

interface AnalysisLoadingScreenProps {
  progress: AnalysisProgress | null;
  isProcessing: boolean;
  technicalSpecName?: string;
  commercialProposalsCount?: number;
}

interface AnalysisStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  stage: string;
  estimatedDuration: number; // в секундах
}

export const AnalysisLoadingScreen: React.FC<AnalysisLoadingScreenProps> = ({
  progress,
  isProcessing,
  technicalSpecName,
  commercialProposalsCount = 0
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [animationText, setAnimationText] = useState('');
  const [elapsedTime, setElapsedTime] = useState(0);

  const analysisSteps: AnalysisStep[] = [
    {
      id: 'upload',
      title: 'Обработка документов',
      description: 'Извлечение текста из ТЗ и коммерческих предложений',
      icon: <FileText className="w-6 h-6" />,
      stage: 'upload',
      estimatedDuration: 3
    },
    {
      id: 'processing',
      title: 'Подготовка к анализу',
      description: 'Структурирование данных и подготовка промптов для ИИ',
      icon: <Zap className="w-6 h-6" />,
      stage: 'processing',
      estimatedDuration: 2
    },
    {
      id: 'analysis',
      title: 'ИИ анализ предложений',
      description: `Анализ ${commercialProposalsCount} КП с помощью Claude AI`,
      icon: <Brain className="w-6 h-6 animate-pulse" />,
      stage: 'analysis',
      estimatedDuration: 15
    },
    {
      id: 'comparison',
      title: 'Сравнение с ТЗ',
      description: 'Оценка соответствия требованиям технического задания',
      icon: <Target className="w-6 h-6" />,
      stage: 'comparison',
      estimatedDuration: 8
    },
    {
      id: 'completed',
      title: 'Генерация отчёта',
      description: 'Формирование итогового отчёта с рекомендациями',
      icon: <BarChart3 className="w-6 h-6" />,
      stage: 'completed',
      estimatedDuration: 3
    }
  ];

  // Анимация точек
  useEffect(() => {
    const interval = setInterval(() => {
      setAnimationText(prev => {
        if (prev.length >= 3) return '';
        return prev + '.';
      });
    }, 500);

    return () => clearInterval(interval);
  }, []);

  // Отслеживание времени
  useEffect(() => {
    if (!isProcessing) {
      setElapsedTime(0);
      return;
    }

    const startTime = Date.now();
    const interval = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [isProcessing]);

  // Определение текущего шага на основе прогресса
  useEffect(() => {
    if (!progress) return;

    const stageIndex = analysisSteps.findIndex(step => step.stage === progress.stage);
    if (stageIndex !== -1) {
      setCurrentStepIndex(stageIndex);
    }
  }, [progress?.stage]);

  const getCurrentStep = () => {
    return analysisSteps[currentStepIndex] || analysisSteps[0];
  };

  const getProgressPercentage = () => {
    if (!progress) return 0;
    
    // Базовый прогресс по этапам
    const baseProgress = (currentStepIndex / analysisSteps.length) * 100;
    // Детальный прогресс внутри этапа
    const stepProgress = (progress.progress / analysisSteps.length);
    
    return Math.min(baseProgress + stepProgress, 100);
  };

  const getEstimatedTimeRemaining = () => {
    if (!progress || currentStepIndex >= analysisSteps.length) return 0;
    
    const remainingSteps = analysisSteps.slice(currentStepIndex + 1);
    const currentStepRemaining = analysisSteps[currentStepIndex].estimatedDuration * (1 - progress.progress / 100);
    const totalRemaining = remainingSteps.reduce((sum, step) => sum + step.estimatedDuration, 0);
    
    return Math.ceil(currentStepRemaining + totalRemaining);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}м ${secs}с` : `${secs}с`;
  };

  if (!isProcessing && !progress) {
    return null;
  }

  const currentStep = getCurrentStep();
  const progressPercentage = getProgressPercentage();
  const estimatedTime = getEstimatedTimeRemaining();

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-2xl w-full mx-4 overflow-hidden">
        {/* Заголовок */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Sparkles className="w-8 h-8 animate-spin" />
              <div className="absolute inset-0 bg-white/20 rounded-full animate-ping"></div>
            </div>
            <div>
              <h2 className="text-2xl font-bold">ИИ анализ КП</h2>
              <p className="text-blue-100">
                Анализируем {commercialProposalsCount} предложени{commercialProposalsCount === 1 ? 'е' : commercialProposalsCount < 5 ? 'я' : 'й'}
              </p>
            </div>
          </div>
        </div>

        {/* Прогресс бар */}
        <div className="px-6 pt-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Общий прогресс
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {Math.round(progressPercentage)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mb-4 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-blue-500 to-purple-500 h-full rounded-full transition-all duration-500 ease-out relative"
              style={{ width: `${progressPercentage}%` }}
            >
              <div className="absolute inset-0 bg-white/30 animate-pulse rounded-full"></div>
            </div>
          </div>
        </div>

        {/* Текущий этап */}
        <div className="px-6 pb-4">
          <div className="flex items-center space-x-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
            <div className="flex-shrink-0 text-blue-600 dark:text-blue-400">
              {currentStep.icon}
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 dark:text-white">
                {currentStep.title}{animationText}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {progress?.currentTask || currentStep.description}
              </p>
            </div>
            <div className="flex-shrink-0">
              {currentStepIndex < analysisSteps.length - 1 ? (
                <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
              ) : (
                <CheckCircle className="w-5 h-5 text-green-600" />
              )}
            </div>
          </div>
        </div>

        {/* Этапы анализа */}
        <div className="px-6 pb-4">
          <div className="space-y-2">
            {analysisSteps.map((step, index) => {
              const isCompleted = index < currentStepIndex;
              const isCurrent = index === currentStepIndex;
              const isPending = index > currentStepIndex;

              return (
                <div 
                  key={step.id}
                  className={`flex items-center space-x-3 p-3 rounded-lg transition-all duration-300 ${
                    isCurrent 
                      ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700' 
                      : isCompleted 
                        ? 'bg-green-50 dark:bg-green-900/20' 
                        : 'bg-gray-50 dark:bg-gray-800'
                  }`}
                >
                  <div className={`flex-shrink-0 ${
                    isCompleted 
                      ? 'text-green-600' 
                      : isCurrent 
                        ? 'text-blue-600' 
                        : 'text-gray-400'
                  }`}>
                    {isCompleted ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : isCurrent ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <div className="w-5 h-5 rounded-full border-2 border-current"></div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className={`text-sm font-medium ${
                      isCompleted 
                        ? 'text-green-700 dark:text-green-300' 
                        : isCurrent 
                          ? 'text-blue-700 dark:text-blue-300' 
                          : 'text-gray-500 dark:text-gray-400'
                    }`}>
                      {step.title}
                    </div>
                    <div className={`text-xs ${
                      isCompleted 
                        ? 'text-green-600 dark:text-green-400' 
                        : isCurrent 
                          ? 'text-blue-600 dark:text-blue-400' 
                          : 'text-gray-400'
                    }`}>
                      {step.description}
                    </div>
                  </div>
                  {isCurrent && (
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      ~{step.estimatedDuration}с
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Статистика */}
        <div className="px-6 pb-6">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="text-lg font-bold text-gray-900 dark:text-white">
                {formatTime(elapsedTime)}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Прошло времени
              </div>
            </div>
            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="text-lg font-bold text-gray-900 dark:text-white">
                {estimatedTime > 0 ? formatTime(estimatedTime) : '—'}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Осталось
              </div>
            </div>
            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="text-lg font-bold text-gray-900 dark:text-white">
                {commercialProposalsCount}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                КП анализируется
              </div>
            </div>
          </div>
        </div>

        {/* Подсказки */}
        <div className="px-6 pb-6">
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4">
            <div className="flex items-start space-x-2">
              <Sparkles className="w-4 h-4 text-yellow-600 dark:text-yellow-400 mt-0.5" />
              <div className="text-sm text-yellow-700 dark:text-yellow-300">
                <div className="font-medium mb-1">ИИ анализирует ваши документы</div>
                <div className="text-xs text-yellow-600 dark:text-yellow-400">
                  Мы используем Claude AI для глубокого анализа коммерческих предложений. 
                  Анализ может занять до {analysisSteps.reduce((sum, step) => sum + step.estimatedDuration, 0)} секунд в зависимости от объёма документов.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalysisLoadingScreen;