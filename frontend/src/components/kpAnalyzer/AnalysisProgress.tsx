import React from 'react';
import { Brain, FileText, CheckCircle, Clock, ArrowRight } from 'lucide-react';

interface AnalysisProgressProps {
  isAnalyzing: boolean;
  progress: number;
  currentKP: string;
  totalKPs: number;
  completedKPs: number;
}

export const AnalysisProgress: React.FC<AnalysisProgressProps> = ({
  isAnalyzing,
  progress,
  currentKP,
  totalKPs,
  completedKPs
}) => {
  const progressPercentage = Math.round(progress);

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-3 mb-4">
          <Brain className="w-8 h-8 text-blue-600 animate-pulse" />
          <h1 className="text-3xl font-bold text-gray-900">
            Анализ коммерческих предложений
          </h1>
        </div>
        <p className="text-lg text-gray-600">
          Искусственный интеллект анализирует КП на соответствие техническому заданию
        </p>
      </div>

      {/* Main Progress Card */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        {/* Progress Header */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
              <span className="text-lg font-semibold text-gray-900">
                Обработка документов
              </span>
            </div>
            <div className="text-sm text-gray-600">
              {completedKPs} из {totalKPs} КП
            </div>
          </div>
        </div>

        {/* Progress Content */}
        <div className="p-6">
          {/* Current Processing */}
          {currentKP && (
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-2">
                <FileText className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-medium text-gray-700">
                  Сейчас анализируется:
                </span>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-900 font-medium truncate">
                  {currentKP}
                </p>
              </div>
            </div>
          )}

          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">
                Общий прогресс
              </span>
              <span className="text-sm font-semibold text-blue-600">
                {progressPercentage}%
              </span>
            </div>
            
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div 
                className="h-3 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${progressPercentage}%` }}
              >
                <div className="h-full bg-white bg-opacity-20 animate-pulse"></div>
              </div>
            </div>
          </div>

          {/* Process Steps */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-green-900">
                  Загрузка завершена
                </p>
                <p className="text-xs text-green-700">
                  Документы подготовлены
                </p>
              </div>
            </div>

            <div className={`flex items-center gap-3 p-3 rounded-lg border ${
              isAnalyzing 
                ? 'bg-blue-50 border-blue-200' 
                : 'bg-gray-50 border-gray-200'
            }`}>
              {isAnalyzing ? (
                <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Clock className="w-5 h-5 text-gray-400" />
              )}
              <div>
                <p className={`text-sm font-medium ${
                  isAnalyzing ? 'text-blue-900' : 'text-gray-700'
                }`}>
                  AI анализ
                </p>
                <p className={`text-xs ${
                  isAnalyzing ? 'text-blue-700' : 'text-gray-500'
                }`}>
                  {isAnalyzing ? 'Выполняется...' : 'Ожидание'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
              <ArrowRight className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-700">
                  Результаты
                </p>
                <p className="text-xs text-gray-500">
                  Подготовка отчета
                </p>
              </div>
            </div>
          </div>

          {/* Analysis Details */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="text-sm font-medium text-gray-900 mb-2">
              Что анализирует AI:
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-gray-600">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                Соответствие техническому заданию
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                Техническая экспертиза
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                Коммерческая оценка
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                Опыт и компетенции
              </div>
            </div>
          </div>

          {/* Estimated Time */}
          <div className="mt-4 text-center">
            <p className="text-xs text-gray-500">
              Среднее время анализа одного КП: ~30-60 секунд
            </p>
          </div>
        </div>
      </div>

      {/* Animation Indicator */}
      <div className="mt-8 flex justify-center">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        </div>
      </div>
    </div>
  );
};