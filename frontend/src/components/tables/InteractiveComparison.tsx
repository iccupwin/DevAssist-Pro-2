/**
 * InteractiveComparison - Основной компонент интерактивного сравнения КП
 * Согласно ТЗ DevAssist Pro
 */

import React, { useState, useMemo } from 'react';
import { 
  Table, 
  BarChart3, 
  Grid3X3, 
  Trophy,
  Eye,
  Download,
  Filter,
  Settings,
  RefreshCw,
  Plus,
  Search,
  SlidersHorizontal,
  FileText,
  TrendingUp
} from 'lucide-react';
import { InteractiveTable, TableColumn } from './InteractiveTable';
import { ComparisonTable } from './ComparisonTable';
import { CriteriaMatrix } from './CriteriaMatrix';
import { RankingTable } from './RankingTable';
import { Button } from '../ui/Button';

// Объединенный интерфейс для всех типов предложений
interface UnifiedKPProposal {
  id: string;
  companyName: string;
  proposalName: string;
  submissionDate: string;
  evaluationDate: string;
  evaluator: string;
  status: 'evaluated' | 'pending' | 'rejected';
  
  // Оценки и рейтинг
  overallScore: number;
  maxScore: number;
  currentRank: number;
  previousRank?: number;
  change: 'up' | 'down' | 'same' | 'new';
  
  // Критерии оценки
  criteria: {
    technical: {
      value: number;
      maxValue: number;
      weight: number;
      threshold: {
        excellent: number;
        good: number;
        acceptable: number;
      };
    };
    commercial: {
      value: number;
      maxValue: number;
      weight: number;
      threshold: {
        excellent: number;
        good: number;
        acceptable: number;
      };
    };
    timeline: {
      value: number;
      maxValue: number;
      weight: number;
      threshold: {
        excellent: number;
        good: number;
        acceptable: number;
      };
    };
    experience: {
      value: number;
      maxValue: number;
      weight: number;
      threshold: {
        excellent: number;
        good: number;
        acceptable: number;
      };
    };
    compliance: {
      value: number;
      maxValue: number;
      weight: number;
      threshold: {
        excellent: number;
        good: number;
        acceptable: number;
      };
    };
  };
  
  // Бюджет и сроки
  budget: {
    total: number;
    currency: string;
    breakdown: {
      development: number;
      testing: number;
      deployment: number;
      support: number;
      other: number;
    };
  };
  timeline: {
    estimated: number;
    unit: 'days' | 'weeks' | 'months';
    startDate?: string;
    endDate?: string;
  };
  
  // Команда и риски
  team: {
    size: number;
    experience: number;
    certifications: string[];
  };
  risks: {
    level: 'low' | 'medium' | 'high';
    factors: string[];
  };
  
  // Рекомендации
  advantages: string[];
  disadvantages: string[];
  recommendation: 'recommend' | 'conditional' | 'not_recommend';
  strengths: string[];
  weaknesses: string[];
}

interface InteractiveComparisonProps {
  proposals: UnifiedKPProposal[];
  title?: string;
  className?: string;
  defaultView?: ViewType;
  showViewTabs?: boolean;
  enableExport?: boolean;
  enableFilters?: boolean;
  onProposalSelect?: (proposal: UnifiedKPProposal) => void;
  onProposalsCompare?: (proposals: UnifiedKPProposal[]) => void;
  onExport?: (data: any, format: 'pdf' | 'excel' | 'csv') => void;
  onRefresh?: () => void;
  loading?: boolean;
}

type ViewType = 'table' | 'comparison' | 'matrix' | 'ranking';

export const InteractiveComparison: React.FC<InteractiveComparisonProps> = ({
  proposals,
  title = 'Интерактивное сравнение коммерческих предложений',
  className = '',
  defaultView = 'table',
  showViewTabs = true,
  enableExport = true,
  enableFilters = true,
  onProposalSelect,
  onProposalsCompare,
  onExport,
  onRefresh,
  loading = false
}) => {
  const [activeView, setActiveView] = useState<ViewType>(defaultView);
  const [selectedProposals, setSelectedProposals] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'evaluated' | 'pending' | 'rejected'>('all');
  const [recommendationFilter, setRecommendationFilter] = useState<'all' | 'recommend' | 'conditional' | 'not_recommend'>('all');
  const [scoreFilter, setScoreFilter] = useState<{ min: number; max: number }>({ min: 0, max: 100 });
  const [showFilters, setShowFilters] = useState(false);

  // Фильтрация предложений
  const filteredProposals = useMemo(() => {
    let filtered = [...proposals];

    // Поиск по названию компании или предложения
    if (searchTerm) {
      filtered = filtered.filter(p => 
        p.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.proposalName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Фильтр по статусу
    if (statusFilter !== 'all') {
      filtered = filtered.filter(p => p.status === statusFilter);
    }

    // Фильтр по рекомендации
    if (recommendationFilter !== 'all') {
      filtered = filtered.filter(p => p.recommendation === recommendationFilter);
    }

    // Фильтр по баллу
    filtered = filtered.filter(p => 
      p.overallScore >= scoreFilter.min && p.overallScore <= scoreFilter.max
    );

    return filtered;
  }, [proposals, searchTerm, statusFilter, recommendationFilter, scoreFilter]);

  // Адаптеры данных для разных компонентов
  const comparisonTableData = useMemo(() => 
    filteredProposals.map(p => ({
      id: p.id,
      companyName: p.companyName,
      proposalName: p.proposalName,
      submissionDate: p.submissionDate,
      evaluationDate: p.evaluationDate,
      evaluator: p.evaluator,
      status: p.status,
      overallScore: p.overallScore,
      maxScore: p.maxScore,
      criteria: {
        technical: p.criteria.technical.value,
        commercial: p.criteria.commercial.value,
        timeline: p.criteria.timeline.value,
        experience: p.criteria.experience.value,
        compliance: p.criteria.compliance.value,
      },
      budget: p.budget,
      timeline: p.timeline,
      team: p.team,
      risks: p.risks,
      advantages: p.advantages,
      disadvantages: p.disadvantages,
      recommendation: p.recommendation,
    })),
    [filteredProposals]
  );

  const criteriaMatrixData = useMemo(() => 
    filteredProposals.map(p => ({
      id: p.id,
      companyName: p.companyName,
      proposalName: p.proposalName,
      criteria: p.criteria,
      overallScore: p.overallScore,
      rank: p.currentRank,
      status: p.status,
      evaluationDate: p.evaluationDate,
      evaluator: p.evaluator,
    })),
    [filteredProposals]
  );

  const rankingTableData = useMemo(() => 
    filteredProposals.map(p => ({
      id: p.id,
      companyName: p.companyName,
      proposalName: p.proposalName,
      currentRank: p.currentRank,
      previousRank: p.previousRank,
      overallScore: p.overallScore,
      maxScore: p.maxScore,
      criteria: {
        technical: p.criteria.technical.value,
        commercial: p.criteria.commercial.value,
        timeline: p.criteria.timeline.value,
        experience: p.criteria.experience.value,
        compliance: p.criteria.compliance.value,
      },
      budget: p.budget,
      timeline: p.timeline,
      team: p.team,
      recommendation: p.recommendation,
      status: p.status,
      change: p.change,
      evaluationDate: p.evaluationDate,
      strengths: p.strengths,
      weaknesses: p.weaknesses,
    })),
    [filteredProposals]
  );

  // Обработчики событий
  const handleProposalSelect = (proposal: any) => {
    const fullProposal = proposals.find(p => p.id === proposal.id);
    if (fullProposal) {
      onProposalSelect?.(fullProposal);
    }
  };

  const handleProposalsCompare = (selectedProposals: any[]) => {
    const fullProposals = selectedProposals.map(sp => 
      proposals.find(p => p.id === sp.id)
    ).filter(Boolean) as UnifiedKPProposal[];
    
    onProposalsCompare?.(fullProposals);
  };

  const handleExport = (format: 'pdf' | 'excel' | 'csv') => {
    const exportData = {
      view: activeView,
      proposals: filteredProposals,
      filters: {
        search: searchTerm,
        status: statusFilter,
        recommendation: recommendationFilter,
        score: scoreFilter
      }
    };
    onExport?.(exportData, format);
  };

  // Конфигурация вкладок
  const viewTabs = [
    {
      id: 'table' as ViewType,
      label: 'Таблица',
      icon: Table,
      description: 'Подробная таблица с возможностью сортировки и фильтрации'
    },
    {
      id: 'comparison' as ViewType,
      label: 'Сравнение',
      icon: BarChart3,
      description: 'Сравнительный анализ коммерческих предложений'
    },
    {
      id: 'matrix' as ViewType,
      label: 'Матрица',
      icon: Grid3X3,
      description: 'Матрица оценки по критериям'
    },
    {
      id: 'ranking' as ViewType,
      label: 'Рейтинг',
      icon: Trophy,
      description: 'Рейтинговая таблица с трендами'
    }
  ];

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-96">
          <div className="flex flex-col items-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="text-gray-500 dark:text-gray-400">Загрузка данных...</p>
          </div>
        </div>
      );
    }

    if (filteredProposals.length === 0) {
      return (
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Нет данных для отображения
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              Попробуйте изменить параметры фильтрации или добавить новые предложения
            </p>
          </div>
        </div>
      );
    }

    switch (activeView) {
      case 'table':
        return (
          <InteractiveTable
            data={filteredProposals}
            columns={[
              { key: 'companyName', label: 'Компания', sortable: true, sticky: true },
              { key: 'overallScore', label: 'Балл', sortable: true, align: 'center' },
              { key: 'currentRank', label: 'Рейтинг', sortable: true, align: 'center' },
              { key: 'budget.total', label: 'Бюджет', sortable: true, align: 'center' },
              { key: 'recommendation', label: 'Рекомендация', sortable: true, align: 'center' },
              { key: 'status', label: 'Статус', sortable: true, align: 'center' }
            ]}
            searchable={false} // Поиск реализован на уровне компонента
            pagination={true}
            pageSize={15}
            selectable={true}
            exportable={false} // Экспорт реализован на уровне компонента
            onRowClick={handleProposalSelect}
            onRowSelect={handleProposalsCompare}
            emptyMessage="Нет предложений для отображения"
          />
        );

      case 'comparison':
        return (
          <ComparisonTable
            proposals={comparisonTableData}
            showDetailedView={true}
            onProposalSelect={handleProposalSelect}
            onCompareSelected={handleProposalsCompare}
            highlightBest={true}
          />
        );

      case 'matrix':
        return (
          <CriteriaMatrix
            proposals={criteriaMatrixData}
            showWeights={true}
            showThresholds={true}
            highlightBest={true}
            onProposalClick={handleProposalSelect}
          />
        );

      case 'ranking':
        return (
          <RankingTable
            proposals={rankingTableData}
            showPrevious={true}
            showDetails={true}
            onProposalClick={handleProposalSelect}
            onCompareTop={handleProposalsCompare}
            highlightTop={3}
            showTrends={true}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg ${className}`}>
      {/* Заголовок и управление */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between space-y-4 lg:space-y-0">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {title}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Анализ {filteredProposals.length} из {proposals.length} коммерческих предложений
            </p>
          </div>

          <div className="flex items-center space-x-3">
            {/* Поиск */}
            {enableFilters && (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Поиск по компании..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}

            {/* Кнопка фильтров */}
            {enableFilters && (
              <Button
                variant={showFilters ? "default" : "outline"}
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center space-x-1"
              >
                <SlidersHorizontal className="h-4 w-4" />
                <span>Фильтры</span>
              </Button>
            )}

            {/* Обновить */}
            {onRefresh && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRefresh}
                disabled={loading}
                className="p-2"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            )}

            {/* Экспорт */}
            {enableExport && (
              <div className="flex items-center space-x-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExport('excel')}
                  className="flex items-center space-x-1"
                >
                  <Download className="h-4 w-4" />
                  <span>Excel</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExport('pdf')}
                  className="flex items-center space-x-1"
                >
                  <Download className="h-4 w-4" />
                  <span>PDF</span>
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Расширенные фильтры */}
        {enableFilters && showFilters && (
          <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Фильтр по статусу */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Статус
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                >
                  <option value="all">Все статусы</option>
                  <option value="evaluated">Оценен</option>
                  <option value="pending">В ожидании</option>
                  <option value="rejected">Отклонен</option>
                </select>
              </div>

              {/* Фильтр по рекомендации */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Рекомендация
                </label>
                <select
                  value={recommendationFilter}
                  onChange={(e) => setRecommendationFilter(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                >
                  <option value="all">Все рекомендации</option>
                  <option value="recommend">Рекомендуется</option>
                  <option value="conditional">Условно</option>
                  <option value="not_recommend">Не рекомендуется</option>
                </select>
              </div>

              {/* Фильтр по минимальному баллу */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Мин. балл
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={scoreFilter.min}
                  onChange={(e) => setScoreFilter(prev => ({ ...prev, min: Number(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                />
              </div>

              {/* Фильтр по максимальному баллу */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Макс. балл
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={scoreFilter.max}
                  onChange={(e) => setScoreFilter(prev => ({ ...prev, max: Number(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Вкладки представлений */}
      {showViewTabs && (
        <div className="px-6 py-3 border-b border-gray-200 dark:border-gray-700">
          <div className="flex space-x-1">
            {viewTabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveView(tab.id)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeView === tab.id
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                  title={tab.description}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Основной контент */}
      <div className="p-6">
        {renderContent()}
      </div>
    </div>
  );
};

// Export types
export type { UnifiedKPProposal };

export default InteractiveComparison;