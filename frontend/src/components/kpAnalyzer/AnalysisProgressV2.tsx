/**
 * Real-time Analysis Progress Component for KP Analyzer v2
 * Professional progress tracking with detailed stage information
 */

import React, { useEffect, useState } from 'react';
import { 
  Brain, Clock, CheckCircle, AlertCircle, FileSearch, Zap, 
  TrendingUp, Target, Users, Shield, Cog, Globe, MessageSquare, 
  Sparkles, Activity, RotateCw
} from 'lucide-react';

interface ProgressUpdate {
  stage: 'upload' | 'extraction' | 'analysis' | 'compilation' | 'complete';
  progress: number;
  message: string;
  timeElapsed: number;
  estimatedTimeRemaining?: number;
  currentSection?: string;
}

// Analysis sections configuration
const ANALYSIS_SECTIONS_CONFIG = {
  budget: { title: 'Бюджет и финансы', description: 'Анализ финансовых показателей' },
  timeline: { title: 'Сроки и планирование', description: 'Оценка временных рамок' },
  technical: { title: 'Техническое решение', description: 'Технический анализ' },
  team: { title: 'Команда и ресурсы', description: 'Оценка команды' },
  functional: { title: 'Функциональность', description: 'Функциональный анализ' },
  security: { title: 'Безопасность', description: 'Анализ безопасности' },
  methodology: { title: 'Методология', description: 'Методологический подход' },
  scalability: { title: 'Масштабируемость', description: 'Возможности масштабирования' },
  communication: { title: 'Коммуникация', description: 'Процессы взаимодействия' },
  value: { title: 'Ценностное предложение', description: 'Анализ ценности' }
};

interface AnalysisProgressProps {
  progress: ProgressUpdate;
  isActive?: boolean;
  onCancel?: () => void;
  className?: string;
}

export const AnalysisProgressV2: React.FC<AnalysisProgressProps> = ({
  progress,
  isActive = true,
  onCancel,
  className = ''
}) => {
  const [animatedProgress, setAnimatedProgress] = useState(0);

  // Animate progress updates smoothly
  useEffect(() => {
    const targetProgress = progress.progress;
    const currentProgress = animatedProgress;
    
    if (Math.abs(targetProgress - currentProgress) > 0.5) {
      const steps = 20;
      const increment = (targetProgress - currentProgress) / steps;
      
      let step = 0;
      const timer = setInterval(() => {
        step++;
        setAnimatedProgress(prev => {
          const newProgress = currentProgress + (increment * step);
          return Math.min(Math.max(newProgress, 0), 100);
        });
        
        if (step >= steps) {
          clearInterval(timer);
          setAnimatedProgress(targetProgress);
        }
      }, 50);
      
      return () => clearInterval(timer);
    }
  }, [progress.progress, animatedProgress]);

  const getStageInfo = () => {
    const stages = [
      {
        id: 'upload',
        title: 'Загрузка и подготовка',
        description: 'Загрузка документов и извлечение текста',
        icon: FileSearch,
        progressRange: [0, 15],
        color: 'blue'
      },
      {
        id: 'extraction',
        title: 'Извлечение данных',
        description: 'Анализ структуры и извлечение финансовых данных',
        icon: Zap,
        progressRange: [15, 25],
        color: 'purple'
      },
      {
        id: 'analysis',
        title: 'AI Анализ по разделам',
        description: 'Детальный анализ каждого раздела Claude AI',
        icon: Brain,
        progressRange: [25, 90],
        color: 'green'
      },
      {
        id: 'compilation',
        title: 'Формирование отчета',
        description: 'Сборка итогового анализа и рекомендаций',
        icon: Sparkles,
        progressRange: [90, 99],
        color: 'yellow'
      },
      {
        id: 'complete',
        title: 'Анализ завершен',
        description: 'Профессиональный отчет готов к просмотру',
        icon: CheckCircle,
        progressRange: [99, 100],
        color: 'emerald'
      }
    ];

    // Find current stage based on progress
    const currentStage = stages.find(stage => {
      const [min, max] = stage.progressRange;
      return progress.progress >= min && progress.progress <= max;
    }) || stages[0];

    return { stages, currentStage };
  };

  const getSectionIcon = (sectionKey: string) => {
    const icons: Record<string, any> = {
      budget: TrendingUp,
      timeline: Clock,
      technical: Cog,
      team: Users,
      functional: Target,
      security: Shield,
      methodology: Activity,
      scalability: Globe,
      communication: MessageSquare,
      value: Sparkles
    };
    return icons[sectionKey] || Brain;
  };

  const formatTime = (seconds: number): string => {
    if (seconds < 60) return `${seconds}с`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}м ${remainingSeconds}с`;
  };

  const { stages, currentStage } = getStageInfo();
  const isCompleted = progress.progress >= 100;
  const currentSection = progress.currentSection;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="relative">
          <div className={`
            w-20 h-20 mx-auto rounded-full flex items-center justify-center
            ${isCompleted 
              ? 'bg-green-100 dark:bg-green-900/30' 
              : 'bg-blue-100 dark:bg-blue-900/30'
            }
            ${isActive ? 'animate-pulse' : ''}
          `}>
            {React.createElement(currentStage.icon, {
              className: `w-10 h-10 ${isCompleted ? 'text-green-600' : 'text-blue-600'}`
            })}
          </div>
          
          {isActive && !isCompleted && (
            <div className="absolute -inset-1 rounded-full border-2 border-blue-300 animate-ping" />
          )}
        </div>

        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            КП Анализатор v2
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            {currentStage.title}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
            {currentStage.description}
          </p>
        </div>
      </div>

      {/* Main Progress Bar */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Общий прогресс
          </span>
          <span className="text-sm font-bold text-gray-900 dark:text-white">
            {Math.round(animatedProgress)}%
          </span>
        </div>
        
        <div className="relative">
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
            <div
              className={`
                h-3 rounded-full transition-all duration-500 ease-out
                ${isCompleted 
                  ? 'bg-green-500' 
                  : 'bg-gradient-to-r from-blue-500 to-purple-500'
                }
              `}
              style={{ width: `${animatedProgress}%` }}
            />
          </div>
          
          {/* Progress indicator */}
          <div
            className={`
              absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 border-white
              ${isCompleted ? 'bg-green-500' : 'bg-blue-500'}
              ${isActive && !isCompleted ? 'animate-pulse' : ''}
            `}
            style={{ left: `calc(${animatedProgress}% - 8px)` }}
          />
        </div>
      </div>

      {/* Stage Progress */}
      <div className="grid grid-cols-5 gap-2">
        {stages.map((stage, index) => {
          const [min, max] = stage.progressRange;
          const isStageActive = progress.progress >= min;
          const isStageCompleted = progress.progress > max;
          const isCurrent = stage.id === currentStage.id;
          
          return (
            <div
              key={stage.id}
              className={`
                text-center p-2 rounded-lg border transition-all duration-300
                ${isCurrent 
                  ? 'border-blue-300 bg-blue-50 dark:bg-blue-900/20' 
                  : isStageCompleted 
                  ? 'border-green-300 bg-green-50 dark:bg-green-900/20'
                  : 'border-gray-200 dark:border-gray-700'
                }
              `}
            >
              <div className="flex justify-center mb-1">
                {React.createElement(stage.icon, {
                  className: `w-4 h-4 ${
                    isStageCompleted 
                      ? 'text-green-600' 
                      : isCurrent 
                      ? 'text-blue-600' 
                      : 'text-gray-400'
                  }`
                })}
              </div>
              <p className={`
                text-xs font-medium
                ${isStageCompleted ? 'text-green-700 dark:text-green-400' : 
                  isCurrent ? 'text-blue-700 dark:text-blue-400' : 'text-gray-500'}
              `}>
                {stage.title.split(' ')[0]}
              </p>
            </div>
          );
        })}
      </div>

      {/* Current Status */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Текущий статус
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <Clock className="w-3 h-3" />
            {formatTime(progress.timeElapsed)}
            {progress.estimatedTimeRemaining && (
              <span>/ ~{formatTime(progress.estimatedTimeRemaining)}</span>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-sm text-gray-900 dark:text-white font-medium">
            {progress.message}
          </p>

          {/* Section-specific progress for analysis stage */}
          {progress.stage === 'analysis' && currentSection && (
            <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                {React.createElement(getSectionIcon(currentSection), {
                  className: 'w-4 h-4 text-purple-600'
                })}
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Анализ раздела: {ANALYSIS_SECTIONS_CONFIG[currentSection as keyof typeof ANALYSIS_SECTIONS_CONFIG]?.title || currentSection}
                </span>
              </div>
              
              <div className="text-xs text-gray-600 dark:text-gray-400">
                Детальный AI анализ по 10 критериям с рекомендациями
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Analysis Sections Overview (during analysis stage) */}
      {progress.stage === 'analysis' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Brain className="w-4 h-4 text-purple-600" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Разделы анализа
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {Object.entries(ANALYSIS_SECTIONS_CONFIG).map(([key, config]) => {
              const SectionIcon = getSectionIcon(key);
              const isAnalyzing = currentSection === key;
              const isCompleted = false; // We don't track individual section completion in progress
              
              return (
                <div
                  key={key}
                  className={`
                    p-2 rounded text-center transition-all duration-300
                    ${isAnalyzing 
                      ? 'bg-purple-100 dark:bg-purple-900/30 border border-purple-300' 
                      : isCompleted
                      ? 'bg-green-100 dark:bg-green-900/30 border border-green-300'
                      : 'bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700'
                    }
                  `}
                >
                  <SectionIcon className={`
                    w-3 h-3 mx-auto mb-1
                    ${isAnalyzing ? 'text-purple-600 animate-pulse' : 
                      isCompleted ? 'text-green-600' : 'text-gray-400'}
                  `} />
                  <p className={`
                    text-xs
                    ${isAnalyzing ? 'text-purple-700 dark:text-purple-400 font-medium' : 
                      isCompleted ? 'text-green-700 dark:text-green-400' : 'text-gray-500'}
                  `}>
                    {config.title.split(' ')[0]}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Processing Info */}
      <div className="grid grid-cols-3 gap-4 text-center">
        <div className="space-y-1">
          <p className="text-2xl font-bold text-blue-600">
            {isActive && !isCompleted ? <RotateCw className="w-6 h-6 mx-auto animate-spin" /> : '✓'}
          </p>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            Реальный AI
          </p>
        </div>
        <div className="space-y-1">
          <p className="text-2xl font-bold text-purple-600">10</p>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            Разделов анализа
          </p>
        </div>
        <div className="space-y-1">
          <p className="text-2xl font-bold text-green-600">
            {formatTime(progress.timeElapsed)}
          </p>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            Время обработки
          </p>
        </div>
      </div>

      {/* Cancel Button */}
      {isActive && !isCompleted && onCancel && (
        <div className="text-center pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
          >
            Отменить анализ
          </button>
        </div>
      )}

      {/* Completion Message */}
      {isCompleted && (
        <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
          <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
          <p className="text-green-700 dark:text-green-400 font-medium">
            Профессиональный анализ готов!
          </p>
          <p className="text-xs text-green-600 dark:text-green-500 mt-1">
            Результаты содержат детальные рекомендации по всем разделам
          </p>
        </div>
      )}
    </div>
  );
};

export default AnalysisProgressV2;