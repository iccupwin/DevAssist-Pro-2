/**
 * ResultsVisualization - Основной компонент визуализации результатов анализа КП
 * Согласно ТЗ DevAssist Pro
 */

import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, 
  BarChart3, 
  PieChart as PieChartIcon, 
  Radar,
  Download,
  Filter,
  RefreshCw,
  Settings,
  Eye,
  EyeOff
} from 'lucide-react';
import { RadarChart, RadarChartComparison } from './RadarChart';
import { BarChart, GroupedBarChart } from './BarChart';
import { PieChart, PieChartComparison } from './PieChart';
import { Button } from '../ui/Button';

interface KPAnalysisResult {
  id: string;
  companyName: string;
  proposalName: string;
  overallScore: number;
  maxScore: number;
  criteria: {
    technical: number;
    commercial: number;
    timeline: number;
    experience: number;
    compliance: number;
  };
  budget: {
    total: number;
    breakdown: {
      development: number;
      testing: number;
      deployment: number;
      support: number;
      other: number;
    };
  };
  metadata: {
    submissionDate: string;
    evaluationDate: string;
    evaluator: string;
    status: 'evaluated' | 'pending' | 'rejected';
  };
}

interface ResultsVisualizationProps {
  results: KPAnalysisResult[];
  title?: string;
  className?: string;
  showFilters?: boolean;
  showExportOptions?: boolean;
  onExport?: (type: 'pdf' | 'excel' | 'image') => void;
  onRefresh?: () => void;
}

type VisualizationType = 'overview' | 'comparison' | 'criteria' | 'budget' | 'timeline';

export const ResultsVisualization: React.FC<ResultsVisualizationProps> = ({
  results,
  title = 'Визуализация результатов анализа КП',
  className = '',
  showFilters = true,
  showExportOptions = true,
  onExport,
  onRefresh
}) => {
  const [activeView, setActiveView] = useState<VisualizationType>('overview');
  const [selectedResults, setSelectedResults] = useState<string[]>([]);
  const [showAllResults, setShowAllResults] = useState(true);
  const [sortBy, setSortBy] = useState<'score' | 'company' | 'date'>('score');

  // Фильтрация и сортировка результатов
  const filteredResults = useMemo(() => {
    const filtered = showAllResults 
      ? results 
      : results.filter(r => selectedResults.includes(r.id));

    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'score':
          return b.overallScore - a.overallScore;
        case 'company':
          return a.companyName.localeCompare(b.companyName);
        case 'date':
          return new Date(b.metadata.evaluationDate).getTime() - new Date(a.metadata.evaluationDate).getTime();
        default:
          return 0;
      }
    });
  }, [results, selectedResults, showAllResults, sortBy]);

  // Подготовка данных для RadarChart
  const radarDataSingle = useMemo(() => {
    if (filteredResults.length !== 1) return [];
    
    const result = filteredResults[0];
    return [
      { label: 'Техническое соответствие', value: result.criteria.technical, maxValue: 100 },
      { label: 'Коммерческие условия', value: result.criteria.commercial, maxValue: 100 },
      { label: 'Сроки выполнения', value: result.criteria.timeline, maxValue: 100 },
      { label: 'Опыт команды', value: result.criteria.experience, maxValue: 100 },
      { label: 'Соответствие требованиям', value: result.criteria.compliance, maxValue: 100 },
    ];
  }, [filteredResults]);

  const radarDataComparison = useMemo(() => {
    if (filteredResults.length <= 1) return [];
    
    return filteredResults.slice(0, 5).map(result => ({
      name: result.companyName,
      data: [
        { label: 'Техническое', value: result.criteria.technical, maxValue: 100 },
        { label: 'Коммерческое', value: result.criteria.commercial, maxValue: 100 },
        { label: 'Сроки', value: result.criteria.timeline, maxValue: 100 },
        { label: 'Опыт', value: result.criteria.experience, maxValue: 100 },
        { label: 'Соответствие', value: result.criteria.compliance, maxValue: 100 },
      ]
    }));
  }, [filteredResults]);

  // Подготовка данных для BarChart
  const barData = useMemo(() => {
    return filteredResults.map(result => ({
      label: result.companyName,
      value: result.overallScore,
      maxValue: result.maxScore,
      metadata: {
        company: result.companyName,
        price: result.budget.total,
        timeline: '45 дней',
        compliance: Math.round((result.overallScore / result.maxScore) * 100)
      }
    }));
  }, [filteredResults]);

  // Подготовка данных для PieChart (бюджет) - одиночный КП
  const budgetDataSingle = useMemo(() => {
    if (filteredResults.length !== 1) return [];
    
    const result = filteredResults[0];
    const breakdown = result.budget.breakdown;
    
    return [
      { 
        label: 'Разработка', 
        value: breakdown.development,
        metadata: { 
          amount: breakdown.development, 
          currency: '₽',
          description: 'Основная разработка функционала'
        }
      },
      { 
        label: 'Тестирование', 
        value: breakdown.testing,
        metadata: { 
          amount: breakdown.testing, 
          currency: '₽',
          description: 'Тестирование и QA'
        }
      },
      { 
        label: 'Внедрение', 
        value: breakdown.deployment,
        metadata: { 
          amount: breakdown.deployment, 
          currency: '₽',
          description: 'Развертывание и настройка'
        }
      },
      { 
        label: 'Поддержка', 
        value: breakdown.support,
        metadata: { 
          amount: breakdown.support, 
          currency: '₽',
          description: 'Техническая поддержка'
        }
      },
      { 
        label: 'Прочее', 
        value: breakdown.other,
        metadata: { 
          amount: breakdown.other, 
          currency: '₽',
          description: 'Дополнительные расходы'
        }
      },
    ].filter(item => item.value > 0);
  }, [filteredResults]);

  // Подготовка данных для PieChart сравнения
  const budgetDataComparison = useMemo(() => {
    if (filteredResults.length <= 1) return [];
    
    return filteredResults.slice(0, 5).map(result => ({
      title: result.companyName,
      total: result.budget.total,
      data: [
        { label: 'Разработка', value: result.budget.breakdown.development },
        { label: 'Тестирование', value: result.budget.breakdown.testing },
        { label: 'Внедрение', value: result.budget.breakdown.deployment },
        { label: 'Поддержка', value: result.budget.breakdown.support },
        { label: 'Прочее', value: result.budget.breakdown.other },
      ].filter(item => item.value > 0)
    }));
  }, [filteredResults]);

  // Статистика
  const stats = useMemo(() => {
    if (filteredResults.length === 0) return null;

    const totalResults = filteredResults.length;
    const avgScore = filteredResults.reduce((sum, r) => sum + r.overallScore, 0) / totalResults;
    const maxScore = Math.max(...filteredResults.map(r => r.overallScore));
    const minScore = Math.min(...filteredResults.map(r => r.overallScore));
    const avgBudget = filteredResults.reduce((sum, r) => sum + r.budget.total, 0) / totalResults;

    return {
      totalResults,
      avgScore,
      maxScore,
      minScore,
      avgBudget,
      topProposal: filteredResults[0]
    };
  }, [filteredResults]);

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Статистика */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <BarChart3 className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                Всего КП
              </span>
            </div>
            <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
              {stats.totalResults}
            </div>
          </div>

          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-green-700 dark:text-green-300">
                Средний балл
              </span>
            </div>
            <div className="text-2xl font-bold text-green-900 dark:text-green-100">
              {stats.avgScore.toFixed(1)}
            </div>
          </div>

          <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <Radar className="h-4 w-4 text-purple-600" />
              <span className="text-sm font-medium text-purple-700 dark:text-purple-300">
                Лучший результат
              </span>
            </div>
            <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">
              {stats.maxScore.toFixed(1)}
            </div>
          </div>

          <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <PieChartIcon className="h-4 w-4 text-orange-600" />
              <span className="text-sm font-medium text-orange-700 dark:text-orange-300">
                Средний бюджет
              </span>
            </div>
            <div className="text-2xl font-bold text-orange-900 dark:text-orange-100">
              {(stats.avgBudget / 1000000).toFixed(1)}М
            </div>
          </div>
        </div>
      )}

      {/* Основные диаграммы */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BarChart
          data={barData}
          title="Рейтинг КП по общему баллу"
          showMetadata={true}
          sortBy="value"
        />
        
        {filteredResults.length === 1 ? (
          <RadarChart
            data={radarDataSingle}
            title="Оценка по критериям"
            showValues={true}
          />
        ) : (
          <RadarChartComparison
            datasets={radarDataComparison}
            title="Сравнение по критериям"
          />
        )}
      </div>

      {/* Бюджетная визуализация */}
      <div>
        {filteredResults.length === 1 ? (
          <PieChart
            data={budgetDataSingle}
            title="Распределение бюджета"
            donutMode={true}
            showLegend={true}
          />
        ) : (
          <PieChartComparison
            datasets={budgetDataComparison}
            title="Сравнение бюджетов"
          />
        )}
      </div>
    </div>
  );

  const renderComparison = () => (
    <div className="space-y-6">
      <GroupedBarChart
        data={filteredResults.map(result => ({
          label: result.companyName,
          groups: [
            { name: 'Техническое', value: result.criteria.technical },
            { name: 'Коммерческое', value: result.criteria.commercial },
            { name: 'Сроки', value: result.criteria.timeline },
            { name: 'Опыт', value: result.criteria.experience },
            { name: 'Соответствие', value: result.criteria.compliance },
          ]
        }))}
        title="Сравнение по всем критериям"
        height={400}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BarChart
          data={barData}
          title="Общий рейтинг"
          orientation="vertical"
          showMetadata={true}
        />
        
        <RadarChartComparison
          datasets={radarDataComparison}
          title="Профили компетенций"
        />
      </div>
    </div>
  );

  const viewTabs = [
    { id: 'overview', label: 'Обзор', icon: TrendingUp },
    { id: 'comparison', label: 'Сравнение', icon: BarChart3 },
    { id: 'criteria', label: 'Критерии', icon: Radar },
    { id: 'budget', label: 'Бюджет', icon: PieChartIcon },
  ];

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg p-6 ${className}`}>
      {/* Заголовок и управление */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 space-y-4 sm:space-y-0">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {title}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Анализ {filteredResults.length} коммерческих предложений
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {showFilters && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAllResults(!showAllResults)}
                className="flex items-center space-x-2"
              >
                {showAllResults ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                <span>{showAllResults ? 'Выбранные' : 'Все'}</span>
              </Button>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="score">По баллу</option>
                <option value="company">По компании</option>
                <option value="date">По дате</option>
              </select>
            </>
          )}

          {onRefresh && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              className="p-2"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          )}

          {showExportOptions && onExport && (
            <div className="flex items-center space-x-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onExport('pdf')}
                className="flex items-center space-x-1"
              >
                <Download className="h-4 w-4" />
                <span>PDF</span>
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Вкладки */}
      <div className="flex space-x-1 mb-6 bg-gray-100 dark:bg-gray-700 p-1 rounded-lg">
        {viewTabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveView(tab.id as VisualizationType)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeView === tab.id
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Контент */}
      <div className="min-h-96">
        {activeView === 'overview' && renderOverview()}
        {activeView === 'comparison' && renderComparison()}
        {activeView === 'criteria' && (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {filteredResults.length === 1 ? (
              <RadarChart
                data={radarDataSingle}
                title="Детальная оценка по критериям"
                size={400}
                showValues={true}
              />
            ) : (
              <RadarChartComparison
                datasets={radarDataComparison}
                title="Сравнение компетенций"
                size={400}
              />
            )}
            
            <BarChart
              data={filteredResults.map(r => ({
                label: 'Техническое соответствие',
                value: r.criteria.technical,
                maxValue: 100
              }))}
              title="Техническое соответствие"
              orientation="horizontal"
            />
          </div>
        )}
        {activeView === 'budget' && (
          <div className="space-y-6">
            {filteredResults.length === 1 ? (
              <PieChart
                data={budgetDataSingle}
                title="Детальное распределение бюджета"
                size={400}
                donutMode={true}
                showLegend={true}
              />
            ) : (
              <PieChartComparison
                datasets={budgetDataComparison}
                title="Сравнение структуры затрат"
                size={250}
              />
            )}

            <BarChart
              data={filteredResults.map(r => ({
                label: r.companyName,
                value: r.budget.total,
                metadata: { price: r.budget.total }
              }))}
              title="Общая стоимость предложений"
              showMetadata={true}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default ResultsVisualization;