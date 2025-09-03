/**
 * CriteriaDisplay - Детальное отображение системы 10 критериев анализа КП
 * Показывает все критерии с весовыми коэффициентами, оценками и описанием
 */

import React, { useState } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus,
  ChevronDown,
  ChevronUp,
  Info,
  Star,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Target,
  BarChart3
} from 'lucide-react';

interface CriteriaScore {
  name: string;
  description: string;
  weight: number;
  score: number;
}

interface CriteriaDetails {
  technical_compliance: CriteriaScore;
  functional_completeness: CriteriaScore;
  cost_effectiveness: CriteriaScore;
  timeline_realism: CriteriaScore;
  vendor_reliability: CriteriaScore;
  solution_quality?: CriteriaScore;
  innovation_approach?: CriteriaScore;
  risk_management?: CriteriaScore;
  support_maintenance?: CriteriaScore;
  flexibility_adaptability?: CriteriaScore;
}

interface CriteriaDisplayProps {
  criteriaScores: Record<string, number>;
  criteriaDetails?: CriteriaDetails;
  weightedCalculation?: Record<string, any>;
  overallScore: number;
  className?: string;
}

export const CriteriaDisplay: React.FC<CriteriaDisplayProps> = ({
  criteriaScores,
  criteriaDetails,
  weightedCalculation,
  overallScore,
  className = ''
}) => {
  const [expandedCriteria, setExpandedCriteria] = useState<string | null>(null);
  const [showAllCriteria, setShowAllCriteria] = useState(false);

  // Система 10 критериев с иконками и цветами
  const criteriaConfig = [
    {
      key: 'technical_compliance',
      name: 'Техническое соответствие',
      shortName: 'Техника',
      icon: '🔧',
      color: 'blue',
      weight: 30,
      description: 'Насколько предложенное решение соответствует техническим требованиям ТЗ?'
    },
    {
      key: 'functional_completeness',
      name: 'Функциональная полнота',
      shortName: 'Функции',
      icon: '📋',
      color: 'green',
      weight: 30,
      description: 'Насколько полно реализованы требуемые функции?'
    },
    {
      key: 'cost_effectiveness',
      name: 'Экономическая эффективность',
      shortName: 'Экономика',
      icon: '💰',
      color: 'yellow',
      weight: 20,
      description: 'Насколько адекватна цена предложения рынку и бюджету?'
    },
    {
      key: 'timeline_realism',
      name: 'Реалистичность сроков',
      shortName: 'Сроки',
      icon: '⏰',
      color: 'purple',
      weight: 10,
      description: 'Насколько реалистичны предложенные сроки выполнения работ?'
    },
    {
      key: 'vendor_reliability',
      name: 'Надежность поставщика',
      shortName: 'Поставщик',
      icon: '🏢',
      color: 'indigo',
      weight: 10,
      description: 'Опыт, репутация и ресурсы поставщика.'
    },
    // Расширенные критерии
    {
      key: 'solution_quality',
      name: 'Качество решения',
      shortName: 'Качество',
      icon: '⭐',
      color: 'orange',
      weight: 0,
      description: 'Архитектурное решение, код-ревью, тестирование'
    },
    {
      key: 'innovation_approach',
      name: 'Инновационность подхода',
      shortName: 'Инновации',
      icon: '🚀',
      color: 'pink',
      weight: 0,
      description: 'Использование современных технологий и методик'
    },
    {
      key: 'risk_management',
      name: 'Управление рисками',
      shortName: 'Риски',
      icon: '🛡️',
      color: 'red',
      weight: 0,
      description: 'Предложения по минимизации проектных рисков'
    },
    {
      key: 'support_maintenance',
      name: 'Сопровождение и поддержка',
      shortName: 'Поддержка',
      icon: '🎧',
      color: 'teal',
      weight: 0,
      description: 'Условия технической поддержки после внедрения'
    },
    {
      key: 'flexibility_adaptability',
      name: 'Гибкость и адаптивность',
      shortName: 'Гибкость',
      icon: '🔄',
      color: 'cyan',
      weight: 0,
      description: 'Возможность внесения изменений в процессе разработки'
    }
  ];

  // Фильтруем критерии: основные всегда показываем, дополнительные - по флагу
  const mainCriteria = criteriaConfig.filter(c => c.weight > 0);
  const additionalCriteria = criteriaConfig.filter(c => c.weight === 0 && criteriaScores[c.key] !== undefined);
  const visibleCriteria = showAllCriteria ? [...mainCriteria, ...additionalCriteria] : mainCriteria;

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-green-600 bg-green-100';
    if (score >= 70) return 'text-green-600 bg-green-50';
    if (score >= 55) return 'text-yellow-600 bg-yellow-50';
    if (score >= 40) return 'text-orange-600 bg-orange-50';
    return 'text-red-600 bg-red-50';
  };

  const getScoreIcon = (score: number) => {
    if (score >= 85) return <CheckCircle className="w-4 h-4 text-green-600" />;
    if (score >= 70) return <TrendingUp className="w-4 h-4 text-green-600" />;
    if (score >= 55) return <Minus className="w-4 h-4 text-yellow-600" />;
    if (score >= 40) return <TrendingDown className="w-4 h-4 text-orange-600" />;
    return <XCircle className="w-4 h-4 text-red-600" />;
  };

  const getScoreLabel = (score: number) => {
    if (score >= 85) return 'Отлично';
    if (score >= 70) return 'Хорошо';
    if (score >= 55) return 'Средне';
    if (score >= 40) return 'Ниже среднего';
    return 'Плохо';
  };

  const toggleCriteria = (key: string) => {
    setExpandedCriteria(expandedCriteria === key ? null : key);
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Заголовок */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Target className="w-6 h-6 text-blue-600" />
          <h3 className="text-xl font-bold text-gray-900">
            Оценка по критериям
          </h3>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-blue-600">{overallScore}/100</div>
          <div className="text-sm text-gray-500">Общий балл</div>
        </div>
      </div>

      {/* Общая статистика */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
        <div className="text-center">
          <div className="text-lg font-semibold text-gray-900">
            {visibleCriteria.filter(c => (criteriaScores[c.key] || 0) >= 80).length}
          </div>
          <div className="text-sm text-green-600">Высокие оценки</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-semibold text-gray-900">
            {visibleCriteria.filter(c => {
              const score = criteriaScores[c.key] || 0;
              return score >= 60 && score < 80;
            }).length}
          </div>
          <div className="text-sm text-yellow-600">Средние оценки</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-semibold text-gray-900">
            {visibleCriteria.filter(c => (criteriaScores[c.key] || 0) < 60).length}
          </div>
          <div className="text-sm text-red-600">Низкие оценки</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-semibold text-gray-900">
            {Math.round(visibleCriteria.reduce((sum, c) => sum + (criteriaScores[c.key] || 0), 0) / visibleCriteria.length)}
          </div>
          <div className="text-sm text-blue-600">Средний балл</div>
        </div>
      </div>

      {/* Критерии */}
      <div className="space-y-3">
        {visibleCriteria.map((criteria) => {
          const score = criteriaScores[criteria.key] || 0;
          const details = criteriaDetails?.[criteria.key];
          const weightedCalc = weightedCalculation?.[criteria.key];
          const isExpanded = expandedCriteria === criteria.key;

          return (
            <div
              key={criteria.key}
              className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow"
            >
              <div
                className="p-4 cursor-pointer"
                onClick={() => toggleCriteria(criteria.key)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="text-xl">{criteria.icon}</div>
                    <div>
                      <div className="font-semibold text-gray-900">
                        {criteria.name}
                        {criteria.weight > 0 && (
                          <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                            {criteria.weight}%
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-600">
                        {criteria.description}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${getScoreColor(score)}`}>
                      {getScoreIcon(score)}
                      <span className="font-semibold">{score}</span>
                      <span className="text-xs">{getScoreLabel(score)}</span>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                </div>

                {/* Прогресс бар */}
                <div className="mt-3">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${
                        score >= 80 ? 'bg-green-500' :
                        score >= 60 ? 'bg-yellow-500' :
                        score >= 40 ? 'bg-orange-500' :
                        'bg-red-500'
                      }`}
                      style={{ width: `${score}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Расширенная информация */}
              {isExpanded && (
                <div className="px-4 pb-4 border-t border-gray-100 bg-gray-50">
                  <div className="mt-4 space-y-3">
                    
                    {/* Детали критерия */}
                    {details && (
                      <div>
                        <h5 className="font-medium text-gray-900 mb-2">Детальная информация</h5>
                        <div className="text-sm text-gray-600 space-y-1">
                          <div><strong>Описание:</strong> {details.description}</div>
                          {details.weight > 0 && (
                            <div><strong>Вес в общей оценке:</strong> {details.weight}%</div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Расчет весового коэффициента */}
                    {weightedCalc && (
                      <div>
                        <h5 className="font-medium text-gray-900 mb-2">Расчет оценки</h5>
                        <div className="bg-white p-3 rounded border text-sm">
                          <div className="grid grid-cols-3 gap-4">
                            <div>
                              <span className="text-gray-600">Баллы:</span>
                              <span className="ml-2 font-medium">{weightedCalc.score}/100</span>
                            </div>
                            <div>
                              <span className="text-gray-600">Вес:</span>
                              <span className="ml-2 font-medium">{weightedCalc.weight}%</span>
                            </div>
                            <div>
                              <span className="text-gray-600">Вклад:</span>
                              <span className="ml-2 font-medium text-blue-600">
                                {weightedCalc.weighted_value?.toFixed(1) || 0} баллов
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Рекомендации по критерию */}
                    <div>
                      <h5 className="font-medium text-gray-900 mb-2">Рекомендации</h5>
                      <div className="text-sm text-gray-600">
                        {score >= 80 ? (
                          <div className="text-green-700 bg-green-50 p-2 rounded">
                            ✅ Критерий полностью соответствует требованиям
                          </div>
                        ) : score >= 60 ? (
                          <div className="text-yellow-700 bg-yellow-50 p-2 rounded">
                            ⚠️ Есть возможности для улучшения
                          </div>
                        ) : (
                          <div className="text-red-700 bg-red-50 p-2 rounded">
                            ❌ Требует серьезной доработки
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Показать/скрыть дополнительные критерии */}
      {additionalCriteria.length > 0 && (
        <div className="text-center">
          <button
            onClick={() => setShowAllCriteria(!showAllCriteria)}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
          >
            <BarChart3 className="w-4 h-4" />
            {showAllCriteria ? 'Скрыть дополнительные критерии' : `Показать все критерии (+${additionalCriteria.length})`}
          </button>
        </div>
      )}

      {/* Итоговая сводка */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-2">
          <Info className="w-5 h-5 text-blue-600" />
          <h4 className="font-medium text-blue-900">Итоговая оценка</h4>
        </div>
        <p className="text-sm text-blue-800">
          Общий балл <strong>{overallScore}/100</strong> рассчитан на основе взвешенных оценок по {mainCriteria.length} основным критериям.
          {overallScore >= 80 && " Отличный результат, предложение рекомендуется к принятию."}
          {overallScore >= 60 && overallScore < 80 && " Хороший результат с возможностями для улучшения."}
          {overallScore < 60 && " Результат ниже ожиданий, требуется доработка предложения."}
        </p>
      </div>
    </div>
  );
};