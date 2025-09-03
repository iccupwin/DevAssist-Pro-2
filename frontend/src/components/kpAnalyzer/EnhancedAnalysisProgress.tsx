/**
 * Enhanced Analysis Progress Component - Realistic progress tracking (15-45 seconds)
 * Features: section-by-section progress, realistic timing, detailed status messages
 */

import React, { useState, useEffect } from 'react';
import {
  Brain,
  TrendingUp,
  Clock,
  Cog,
  Users,
  Target,
  Shield,
  Globe,
  MessageSquare,
  Sparkles,
  CheckCircle,
  Loader,
  Zap,
  FileText,
  BarChart3,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { ProgressUpdate, ANALYSIS_SECTIONS_CONFIG } from '../../types/enhancedKpAnalyzer';

interface EnhancedAnalysisProgressProps {
  progress: ProgressUpdate;
  isActive: boolean;
  onCancel?: () => void;
  documentName?: string;
  estimatedDuration?: number; // seconds
  className?: string;
}

interface SectionProgress {
  id: string;
  title: string;
  icon: React.ReactNode;
  status: 'pending' | 'processing' | 'completed';
  progress: number;
  duration?: number;
  message?: string;
}

export const EnhancedAnalysisProgress: React.FC<EnhancedAnalysisProgressProps> = ({
  progress,
  isActive,
  onCancel,
  documentName,
  estimatedDuration = 30,
  className = ''
}) => {
  const [sections, setSections] = useState<SectionProgress[]>([]);
  const [currentPhase, setCurrentPhase] = useState<string>('Подготовка...');
  const [elapsedTime, setElapsedTime] = useState(0);
  const [estimatedRemaining, setEstimatedRemaining] = useState(estimatedDuration);

  // Initialize sections
  useEffect(() => {
    const initialSections: SectionProgress[] = [
      { id: 'extraction', title: 'Извлечение данных', icon: <FileText className="w-4 h-4" />, status: 'pending', progress: 0 },
      { id: 'financial', title: 'Финансовый анализ', icon: <TrendingUp className="w-4 h-4" />, status: 'pending', progress: 0 },
      { id: 'budget', title: 'Бюджетный анализ', icon: <TrendingUp className="w-4 h-4" />, status: 'pending', progress: 0 },
      { id: 'timeline', title: 'Временные рамки', icon: <Clock className="w-4 h-4" />, status: 'pending', progress: 0 },
      { id: 'technical', title: 'Техническое решение', icon: <Cog className="w-4 h-4" />, status: 'pending', progress: 0 },
      { id: 'team', title: 'Команда и экспертиза', icon: <Users className="w-4 h-4" />, status: 'pending', progress: 0 },
      { id: 'functional', title: 'Функциональные требования', icon: <Target className="w-4 h-4" />, status: 'pending', progress: 0 },
      { id: 'security', title: 'Безопасность', icon: <Shield className="w-4 h-4" />, status: 'pending', progress: 0 },
      { id: 'methodology', title: 'Методология', icon: <Brain className="w-4 h-4" />, status: 'pending', progress: 0 },
      { id: 'scalability', title: 'Масштабируемость', icon: <Globe className="w-4 h-4" />, status: 'pending', progress: 0 },
      { id: 'communication', title: 'Коммуникация', icon: <MessageSquare className="w-4 h-4" />, status: 'pending', progress: 0 },
      { id: 'value', title: 'Ценностное предложение', icon: <Sparkles className="w-4 h-4" />, status: 'pending', progress: 0 },
      { id: 'compilation', title: 'Формирование отчета', icon: <BarChart3 className="w-4 h-4" />, status: 'pending', progress: 0 }
    ];
    setSections(initialSections);
  }, []);

  // Update elapsed time
  useEffect(() => {
    if (!isActive) return;

    const timer = setInterval(() => {
      setElapsedTime(prev => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [isActive]);

  // Update sections based on progress
  useEffect(() => {
    if (!progress) return;

    // Calculate which section should be active based on progress
    const totalSections = sections.length;
    const progressPerSection = 100 / totalSections;
    const currentSectionIndex = Math.floor(progress.progress / progressPerSection);
    const sectionProgress = (progress.progress % progressPerSection) / progressPerSection * 100;

    setSections(prev => prev.map((section, index) => {
      if (index < currentSectionIndex) {
        return { ...section, status: 'completed', progress: 100 };
      } else if (index === currentSectionIndex) {
        return { 
          ...section, 
          status: 'processing', 
          progress: Math.max(sectionProgress, 10),
          message: progress.message
        };
      } else {
        return { ...section, status: 'pending', progress: 0 };
      }
    }));

    // Update current phase
    if (progress.currentSection) {
      const sectionConfig = ANALYSIS_SECTIONS_CONFIG[progress.currentSection as keyof typeof ANALYSIS_SECTIONS_CONFIG];
      setCurrentPhase(sectionConfig ? `Анализ: ${sectionConfig.title}` : progress.message);
    } else {
      setCurrentPhase(progress.message);
    }

    // Update estimated remaining time
    if (progress.estimatedTimeRemaining) {
      setEstimatedRemaining(progress.estimatedTimeRemaining);
    } else {
      const remaining = estimatedDuration - elapsedTime;
      setEstimatedRemaining(Math.max(0, remaining));
    }
  }, [progress, elapsedTime, estimatedDuration]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusIcon = (status: SectionProgress['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'processing':
        return <Loader className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'pending':
      default:
        return <div className="w-4 h-4 rounded-full bg-gray-300" />;
    }
  };

  const getProgressColor = (status: SectionProgress['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500';
      case 'processing':
        return 'bg-blue-500';
      case 'pending':
      default:
        return 'bg-gray-300';
    }
  };

  const completedSections = sections.filter(s => s.status === 'completed').length;
  const currentSection = sections.find(s => s.status === 'processing');
  const overallProgressPercent = Math.round(progress.progress || 0);

  return (
    <div className={`max-w-4xl mx-auto ${className}`}>
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex justify-center mb-6">
          <div className="bg-blue-100 dark:bg-blue-900/30 p-4 rounded-2xl">
            <Brain className="w-12 h-12 text-blue-600 animate-pulse" />
          </div>
        </div>
        
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          🤖 AI Анализ коммерческого предложения
        </h1>
        
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Глубокий анализ по 10 критериям с использованием Claude 3.5 Sonnet
        </p>

        {documentName && (
          <div className="text-sm text-blue-600 dark:text-blue-400 mb-6">
            Документ: {documentName}
          </div>
        )}

        {/* Overall Progress */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="text-left">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {overallProgressPercent}%
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Завершено
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                {currentPhase}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Раздел {completedSections + 1} из {sections.length}
              </div>
            </div>
            
            <div className="text-right">
              <div className="text-xl font-bold text-gray-900 dark:text-white">
                {formatTime(elapsedTime)}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                ~ {formatTime(estimatedRemaining)} осталось
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="relative">
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-1000 ease-out"
                style={{ width: `${overallProgressPercent}%` }}
              />
            </div>
            <div className="absolute top-0 left-0 w-full h-3 flex">
              {Array.from({ length: 10 }, (_, i) => (
                <div
                  key={i}
                  className="absolute top-0 w-px h-3 bg-white dark:bg-gray-800 opacity-50"
                  style={{ left: `${(i + 1) * 10}%` }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Section Progress */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 mb-8">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-blue-600" />
          Прогресс анализа по разделам
        </h3>
        
        <div className="space-y-3">
          {sections.map((section) => (
            <div key={section.id} className="flex items-center gap-4 p-3 rounded-lg bg-gray-50 dark:bg-gray-700">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                {getStatusIcon(section.status)}
                <div className="text-gray-600 dark:text-gray-300">
                  {section.icon}
                </div>
                <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {section.title}
                </span>
              </div>
              
              <div className="flex items-center gap-3 min-w-[120px]">
                <div className="w-20 h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${getProgressColor(section.status)}`}
                    style={{ width: `${section.progress}%` }}
                  />
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400 w-8 text-right">
                  {Math.round(section.progress)}%
                </span>
              </div>
              
              {section.status === 'processing' && section.message && (
                <div className="text-xs text-blue-600 dark:text-blue-400 max-w-[150px] truncate">
                  {section.message}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Current Section Details */}
      {currentSection && (
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800 p-6 mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="text-blue-600 dark:text-blue-400">
              {currentSection.icon}
            </div>
            <h4 className="text-lg font-semibold text-blue-900 dark:text-blue-300">
              Текущий этап: {currentSection.title}
            </h4>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-yellow-500" />
              <span className="text-blue-800 dark:text-blue-300">
                AI обрабатывает данные...
              </span>
            </div>
            <div className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />
              <span className="text-blue-800 dark:text-blue-300">
                Анализ в реальном времени
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-green-500" />
              <span className="text-blue-800 dark:text-blue-300">
                ~{Math.ceil((100 - currentSection.progress) / 100 * 3)}с до завершения
              </span>
            </div>
          </div>
          
          {currentSection.message && (
            <div className="mt-4 p-3 bg-white dark:bg-gray-800 rounded-lg">
              <p className="text-sm text-gray-700 dark:text-gray-300">
                {currentSection.message}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Analysis Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 text-center border border-green-200 dark:border-green-800">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400 mb-1">
            {completedSections}
          </div>
          <div className="text-sm text-green-700 dark:text-green-300">
            Разделов завершено
          </div>
        </div>
        
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 text-center border border-blue-200 dark:border-blue-800">
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-1">
            {formatTime(elapsedTime)}
          </div>
          <div className="text-sm text-blue-700 dark:text-blue-300">
            Время анализа
          </div>
        </div>
        
        <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 text-center border border-purple-200 dark:border-purple-800">
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400 mb-1">
            {sections.length - completedSections - (currentSection ? 1 : 0)}
          </div>
          <div className="text-sm text-purple-700 dark:text-purple-300">
            Осталось разделов
          </div>
        </div>
      </div>

      {/* Cancel Button */}
      {onCancel && (
        <div className="text-center">
          <button
            onClick={onCancel}
            className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <AlertCircle className="w-4 h-4" />
            Отменить анализ
          </button>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            Анализ можно безопасно отменить в любой момент
          </p>
        </div>
      )}

      {/* Quality Information */}
      <div className="mt-8 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
          О качестве анализа
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-gray-600 dark:text-gray-400">
          <div>
            • Реальный AI анализ с Claude 3.5 Sonnet
            <br />
            • Обработка 15-45 секунд для точности
            <br />
            • 10 детальных разделов анализа
          </div>
          <div>
            • Поддержка 8 валют включая KGS
            <br />
            • Структурированные данные и таблицы
            <br />
            • Профессиональные рекомендации
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedAnalysisProgress;