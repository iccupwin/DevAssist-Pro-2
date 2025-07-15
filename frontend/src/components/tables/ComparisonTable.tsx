/**
 * ComparisonTable - Таблица сопоставления коммерческих предложений
 * Согласно ТЗ DevAssist Pro
 */

import React, { useMemo, useState } from 'react';
import { 
  Award, 
  DollarSign, 
  Clock, 
  Users,
  CheckCircle,
  XCircle,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Trophy,
  Star,
  Eye
} from 'lucide-react';
import { InteractiveTable, TableColumn } from './InteractiveTable';

interface KPProposal {
  id: string;
  companyName: string;
  proposalName: string;
  submissionDate: string;
  evaluationDate: string;
  evaluator: string;
  status: 'evaluated' | 'pending' | 'rejected';
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
  team: {
    size: number;
    experience: number;
    certifications: string[];
  };
  risks: {
    level: 'low' | 'medium' | 'high';
    factors: string[];
  };
  advantages: string[];
  disadvantages: string[];
  recommendation: 'recommend' | 'conditional' | 'not_recommend';
}

interface ComparisonTableProps {
  proposals: KPProposal[];
  title?: string;
  className?: string;
  showDetailedView?: boolean;
  onProposalSelect?: (proposal: KPProposal) => void;
  onCompareSelected?: (proposals: KPProposal[]) => void;
  highlightBest?: boolean;
  compactMode?: boolean;
}

export const ComparisonTable: React.FC<ComparisonTableProps> = ({
  proposals,
  title = 'Сравнение коммерческих предложений',
  className = '',
  showDetailedView = false,
  onProposalSelect,
  onCompareSelected,
  highlightBest = true,
  compactMode = false
}) => {
  const [selectedProposals, setSelectedProposals] = useState<KPProposal[]>([]);

  // Определяем лучшие показатели для подсветки
  const bestMetrics = useMemo(() => {
    if (!highlightBest || proposals.length === 0) return {};

    return {
      bestScore: Math.max(...proposals.map(p => p.overallScore)),
      lowestPrice: Math.min(...proposals.map(p => p.budget.total)),
      shortestTimeline: Math.min(...proposals.map(p => p.timeline.estimated)),
      highestExperience: Math.max(...proposals.map(p => p.team.experience)),
    };
  }, [proposals, highlightBest]);

  // Функции рендеринга для ячеек
  const renderCompanyName = (value: string, row: KPProposal) => (
    <div className="flex items-center space-x-3">
      <div className={`w-3 h-3 rounded-full ${
        row.status === 'evaluated' ? 'bg-green-400' :
        row.status === 'pending' ? 'bg-yellow-400' : 'bg-red-400'
      }`} />
      <div>
        <div className="font-medium text-gray-900 dark:text-white">{value}</div>
        <div className="text-sm text-gray-500 dark:text-gray-400">{row.proposalName}</div>
      </div>
    </div>
  );

  const renderScore = (value: number, row: KPProposal) => {
    const percentage = (value / row.maxScore) * 100;
    const isBest = highlightBest && value === bestMetrics.bestScore;
    
    return (
      <div className="flex items-center space-x-2">
        <div className={`flex items-center space-x-1 ${isBest ? 'text-green-600 font-bold' : ''}`}>
          {isBest && <Trophy className="h-4 w-4" />}
          <span>{value.toFixed(1)}</span>
          <span className="text-sm text-gray-500">/ {row.maxScore}</span>
        </div>
        <div className="flex-1 max-w-20">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full ${
                percentage >= 80 ? 'bg-green-500' :
                percentage >= 60 ? 'bg-yellow-500' : 'bg-red-500'
              }`}
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>
      </div>
    );
  };

  const renderBudget = (value: number, row: KPProposal) => {
    const isBest = highlightBest && value === bestMetrics.lowestPrice;
    
    return (
      <div className={`${isBest ? 'text-green-600 font-bold' : ''}`}>
        <div className="flex items-center space-x-1">
          {isBest && <Star className="h-4 w-4" />}
          <DollarSign className="h-4 w-4" />
          <span>{(value / 1000000).toFixed(1)}М ₽</span>
        </div>
        {!compactMode && (
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {row.budget.currency}
          </div>
        )}
      </div>
    );
  };

  const renderTimeline = (value: number, row: KPProposal) => {
    const isBest = highlightBest && value === bestMetrics.shortestTimeline;
    
    return (
      <div className={`${isBest ? 'text-green-600 font-bold' : ''}`}>
        <div className="flex items-center space-x-1">
          {isBest && <Star className="h-4 w-4" />}
          <Clock className="h-4 w-4" />
          <span>{value} {row.timeline.unit === 'days' ? 'дн.' : row.timeline.unit === 'weeks' ? 'нед.' : 'мес.'}</span>
        </div>
      </div>
    );
  };

  const renderCriteria = (criteria: KPProposal['criteria']) => (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span>Техническое:</span>
        <span className={`font-medium ${criteria.technical >= 80 ? 'text-green-600' : criteria.technical >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
          {criteria.technical}
        </span>
      </div>
      <div className="flex items-center justify-between text-xs">
        <span>Коммерческое:</span>
        <span className={`font-medium ${criteria.commercial >= 80 ? 'text-green-600' : criteria.commercial >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
          {criteria.commercial}
        </span>
      </div>
      <div className="flex items-center justify-between text-xs">
        <span>Сроки:</span>
        <span className={`font-medium ${criteria.timeline >= 80 ? 'text-green-600' : criteria.timeline >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
          {criteria.timeline}
        </span>
      </div>
    </div>
  );

  const renderTeam = (team: KPProposal['team']) => {
    const isBest = highlightBest && team.experience === bestMetrics.highestExperience;
    
    return (
      <div className={`${isBest ? 'text-green-600 font-bold' : ''}`}>
        <div className="flex items-center space-x-1 text-sm">
          {isBest && <Star className="h-4 w-4" />}
          <Users className="h-4 w-4" />
          <span>{team.size} чел.</span>
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400">
          Опыт: {team.experience} лет
        </div>
        {!compactMode && team.certifications.length > 0 && (
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Сертификаты: {team.certifications.slice(0, 2).join(', ')}
            {team.certifications.length > 2 && ` +${team.certifications.length - 2}`}
          </div>
        )}
      </div>
    );
  };

  const renderRisks = (risks: KPProposal['risks']) => {
    const riskColors = {
      low: 'text-green-600 bg-green-100 dark:bg-green-900',
      medium: 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900',
      high: 'text-red-600 bg-red-100 dark:bg-red-900'
    };

    const RiskIcon = risks.level === 'low' ? CheckCircle : 
                    risks.level === 'medium' ? AlertCircle : XCircle;

    return (
      <div>
        <div className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${riskColors[risks.level]}`}>
          <RiskIcon className="h-3 w-3" />
          <span>{risks.level === 'low' ? 'Низкий' : risks.level === 'medium' ? 'Средний' : 'Высокий'}</span>
        </div>
        {!compactMode && risks.factors.length > 0 && (
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {risks.factors.slice(0, 2).join(', ')}
            {risks.factors.length > 2 && ` +${risks.factors.length - 2}`}
          </div>
        )}
      </div>
    );
  };

  const renderRecommendation = (recommendation: KPProposal['recommendation']) => {
    const recColors = {
      recommend: 'text-green-600 bg-green-100 dark:bg-green-900',
      conditional: 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900',
      not_recommend: 'text-red-600 bg-red-100 dark:bg-red-900'
    };

    const RecIcon = recommendation === 'recommend' ? CheckCircle :
                   recommendation === 'conditional' ? AlertCircle : XCircle;

    const recText = recommendation === 'recommend' ? 'Рекомендуется' :
                   recommendation === 'conditional' ? 'Условно' : 'Не рекомендуется';

    return (
      <div className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-medium ${recColors[recommendation]}`}>
        <RecIcon className="h-3 w-3" />
        <span>{recText}</span>
      </div>
    );
  };

  const renderStatus = (status: KPProposal['status']) => {
    const statusColors = {
      evaluated: 'text-green-600 bg-green-100 dark:bg-green-900',
      pending: 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900',
      rejected: 'text-red-600 bg-red-100 dark:bg-red-900'
    };

    const statusText = {
      evaluated: 'Оценен',
      pending: 'В ожидании',
      rejected: 'Отклонен'
    };

    return (
      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${statusColors[status]}`}>
        {statusText[status]}
      </span>
    );
  };

  // Определение колонок таблицы
  const columns: TableColumn<KPProposal>[] = [
    {
      key: 'companyName',
      label: 'Компания',
      sortable: true,
      sticky: true,
      width: '250px',
      render: renderCompanyName
    },
    {
      key: 'overallScore',
      label: 'Общий балл',
      sortable: true,
      align: 'center',
      width: '180px',
      render: (value, row) => renderScore(value, row)
    },
    {
      key: 'budget.total',
      label: 'Бюджет',
      sortable: true,
      align: 'center',
      width: '120px',
      render: (_, row) => renderBudget(row.budget.total, row)
    },
    {
      key: 'timeline.estimated',
      label: 'Сроки',
      sortable: true,
      align: 'center',
      width: '100px',
      render: (_, row) => renderTimeline(row.timeline.estimated, row)
    },
    {
      key: 'team',
      label: 'Команда',
      align: 'center',
      width: '120px',
      render: (_, row) => renderTeam(row.team)
    }
  ];

  // Добавляем дополнительные колонки в детальном режиме
  if (showDetailedView) {
    columns.push(
      {
        key: 'criteria',
        label: 'Критерии',
        align: 'center',
        width: '120px',
        render: (_, row) => renderCriteria(row.criteria)
      },
      {
        key: 'risks',
        label: 'Риски',
        align: 'center',
        width: '100px',
        render: (_, row) => renderRisks(row.risks)
      }
    );
  }

  columns.push(
    {
      key: 'recommendation',
      label: 'Рекомендация',
      sortable: true,
      align: 'center',
      width: '140px',
      render: (value, row) => renderRecommendation(row.recommendation)
    },
    {
      key: 'status',
      label: 'Статус',
      sortable: true,
      align: 'center',
      width: '100px',
      render: (value) => renderStatus(value)
    }
  );

  const handleRowSelect = (selectedRows: KPProposal[]) => {
    setSelectedProposals(selectedRows);
    onCompareSelected?.(selectedRows);
  };

  const handleRowClick = (proposal: KPProposal) => {
    onProposalSelect?.(proposal);
  };

  return (
    <div className={className}>
      <InteractiveTable<KPProposal>
        data={proposals}
        columns={columns}
        title={title}
        searchable={true}
        filterable={true}
        sortable={true}
        pagination={true}
        pageSize={compactMode ? 20 : 10}
        selectable={true}
        exportable={true}
        hover={true}
        striped={true}
        bordered={true}
        compact={compactMode}
        stickyHeader={true}
        maxHeight="800px"
        onRowSelect={handleRowSelect}
        onRowClick={handleRowClick}
        emptyMessage="Нет коммерческих предложений для сравнения"
      />

      {/* Панель действий для выбранных предложений */}
      {selectedProposals.length > 0 && (
        <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-blue-600" />
              <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                Выбрано предложений: {selectedProposals.length}
              </span>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => onCompareSelected?.(selectedProposals)}
                className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
              >
                <Eye className="h-4 w-4 inline mr-1" />
                Детальное сравнение
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ComparisonTable;