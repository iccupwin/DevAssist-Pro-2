/**
 * RankingTable - Таблица рейтинга коммерческих предложений
 * Согласно ТЗ DevAssist Pro
 */

import React, { useMemo, useState } from 'react';
import { 
  Trophy, 
  Medal, 
  Award, 
  TrendingUp, 
  TrendingDown,
  ArrowRight,
  Star,
  Target,
  DollarSign,
  Clock,
  Users,
  CheckCircle,
  AlertCircle,
  XCircle,
  Filter,
  Download,
  Eye,
  BarChart3
} from 'lucide-react';
import { Button } from '../ui/Button';

interface RankingProposal {
  id: string;
  companyName: string;
  proposalName: string;
  currentRank: number;
  previousRank?: number;
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
  };
  timeline: {
    estimated: number;
    unit: 'days' | 'weeks' | 'months';
  };
  team: {
    size: number;
    experience: number;
  };
  recommendation: 'recommend' | 'conditional' | 'not_recommend';
  status: 'evaluated' | 'pending' | 'rejected';
  change: 'up' | 'down' | 'same' | 'new';
  evaluationDate: string;
  strengths: string[];
  weaknesses: string[];
}

interface RankingTableProps {
  proposals: RankingProposal[];
  title?: string;
  className?: string;
  showPrevious?: boolean;
  showDetails?: boolean;
  maxItems?: number;
  onProposalClick?: (proposal: RankingProposal) => void;
  onCompareTop?: (proposals: RankingProposal[]) => void;
  highlightTop?: number;
  compactMode?: boolean;
  showTrends?: boolean;
  onExport?: () => void;
}

type SortField = 'rank' | 'score' | 'company' | 'budget' | 'timeline';

export const RankingTable: React.FC<RankingTableProps> = ({
  proposals,
  title = 'Рейтинг коммерческих предложений',
  className = '',
  showPrevious = true,
  showDetails = true,
  maxItems = 10,
  onProposalClick,
  onCompareTop,
  highlightTop = 3,
  compactMode = false,
  showTrends = true,
  onExport
}) => {
  const [sortBy, setSortBy] = useState<SortField>('rank');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [filterRecommendation, setFilterRecommendation] = useState<RankingProposal['recommendation'] | 'all'>('all');
  const [showOnlyTop, setShowOnlyTop] = useState(false);

  // Сортировка и фильтрация предложений
  const processedProposals = useMemo(() => {
    let filtered = [...proposals];

    // Фильтр по рекомендации
    if (filterRecommendation !== 'all') {
      filtered = filtered.filter(p => p.recommendation === filterRecommendation);
    }

    // Фильтр топ предложений
    if (showOnlyTop) {
      filtered = filtered.filter(p => p.currentRank <= highlightTop);
    }

    // Ограничение количества
    if (maxItems > 0) {
      filtered = filtered.slice(0, maxItems);
    }

    // Сортировка
    filtered.sort((a, b) => {
      let valueA: any, valueB: any;
      
      switch (sortBy) {
        case 'rank':
          valueA = a.currentRank;
          valueB = b.currentRank;
          break;
        case 'score':
          valueA = a.overallScore;
          valueB = b.overallScore;
          break;
        case 'company':
          valueA = a.companyName;
          valueB = b.companyName;
          break;
        case 'budget':
          valueA = a.budget.total;
          valueB = b.budget.total;
          break;
        case 'timeline':
          valueA = a.timeline.estimated;
          valueB = b.timeline.estimated;
          break;
        default:
          return 0;
      }

      if (typeof valueA === 'string') {
        return sortDirection === 'asc' 
          ? valueA.localeCompare(valueB)
          : valueB.localeCompare(valueA);
      }

      return sortDirection === 'asc' ? valueA - valueB : valueB - valueA;
    });

    return filtered;
  }, [proposals, sortBy, sortDirection, filterRecommendation, showOnlyTop, maxItems, highlightTop]);

  const handleSort = (field: SortField) => {
    if (sortBy === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDirection(field === 'rank' || field === 'timeline' ? 'asc' : 'desc');
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="h-5 w-5 text-yellow-500" />;
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />;
      case 3:
        return <Award className="h-5 w-5 text-orange-500" />;
      default:
        return (
          <div className="w-5 h-5 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center">
            <span className="text-xs font-bold text-gray-600 dark:text-gray-300">
              {rank}
            </span>
          </div>
        );
    }
  };

  const getRankChangeIcon = (change: RankingProposal['change'], rankDiff?: number) => {
    if (!showTrends || change === 'new') return null;
    
    switch (change) {
      case 'up':
        return (
          <div className="flex items-center space-x-1 text-green-600">
            <TrendingUp className="h-3 w-3" />
            {rankDiff && <span className="text-xs">+{rankDiff}</span>}
          </div>
        );
      case 'down':
        return (
          <div className="flex items-center space-x-1 text-red-600">
            <TrendingDown className="h-3 w-3" />
            {rankDiff && <span className="text-xs">-{rankDiff}</span>}
          </div>
        );
      case 'same':
        return <div className="w-3 h-3 rounded-full bg-gray-300"></div>;
      default:
        return null;
    }
  };

  const getRecommendationBadge = (recommendation: RankingProposal['recommendation']) => {
    const configs = {
      recommend: {
        color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
        icon: CheckCircle,
        text: 'Рекомендуется'
      },
      conditional: {
        color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
        icon: AlertCircle,
        text: 'Условно'
      },
      not_recommend: {
        color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
        icon: XCircle,
        text: 'Не рекомендуется'
      }
    };

    const config = configs[recommendation];
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="h-3 w-3" />
        <span>{config.text}</span>
      </span>
    );
  };

  const getScoreBar = (score: number, maxScore: number) => {
    const percentage = (score / maxScore) * 100;
    let colorClass = 'bg-red-500';
    
    if (percentage >= 80) colorClass = 'bg-green-500';
    else if (percentage >= 60) colorClass = 'bg-yellow-500';
    else if (percentage >= 40) colorClass = 'bg-orange-500';

    return (
      <div className="flex items-center space-x-2">
        <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2 max-w-20">
          <div
            className={`h-2 rounded-full ${colorClass}`}
            style={{ width: `${percentage}%` }}
          />
        </div>
        <span className="text-sm font-medium">
          {score.toFixed(1)}
        </span>
      </div>
    );
  };

  const topProposals = useMemo(() => 
    processedProposals.filter(p => p.currentRank <= 3),
    [processedProposals]
  );

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow ${className}`}>
      {/* Заголовок и управление */}
      <div className="px-4 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {title}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Рейтинг {processedProposals.length} предложений
              {showOnlyTop && ` (топ ${highlightTop})`}
            </p>
          </div>
          
          <div className="flex items-center space-x-2">
            {/* Фильтр по рекомендации */}
            <select
              value={filterRecommendation}
              onChange={(e) => setFilterRecommendation(e.target.value as any)}
              className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="all">Все рекомендации</option>
              <option value="recommend">Рекомендуемые</option>
              <option value="conditional">Условные</option>
              <option value="not_recommend">Не рекомендуемые</option>
            </select>

            {/* Переключатель топ предложений */}
            <Button
              variant={showOnlyTop ? "default" : "outline"}
              size="sm"
              onClick={() => setShowOnlyTop(!showOnlyTop)}
              className="flex items-center space-x-1"
            >
              <Star className="h-4 w-4" />
              <span>Топ {highlightTop}</span>
            </Button>

            {/* Сравнить топ */}
            {topProposals.length > 1 && onCompareTop && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onCompareTop(topProposals)}
                className="flex items-center space-x-1"
              >
                <BarChart3 className="h-4 w-4" />
                <span>Сравнить</span>
              </Button>
            )}

            {/* Экспорт */}
            {onExport && (
              <Button
                variant="outline"
                size="sm"
                onClick={onExport}
                className="flex items-center space-x-1"
              >
                <Download className="h-4 w-4" />
                <span>Экспорт</span>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Таблица */}
      <div className="overflow-auto">
        <table className="min-w-full">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th 
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                onClick={() => handleSort('rank')}
              >
                Рейтинг
              </th>
              <th 
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                onClick={() => handleSort('company')}
              >
                Компания
              </th>
              <th 
                className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                onClick={() => handleSort('score')}
              >
                Балл
              </th>
              <th 
                className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                onClick={() => handleSort('budget')}
              >
                Бюджет
              </th>
              <th 
                className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                onClick={() => handleSort('timeline')}
              >
                Сроки
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Рекомендация
              </th>
              {showDetails && (
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Детали
                </th>
              )}
            </tr>
          </thead>

          <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
            {processedProposals.length === 0 ? (
              <tr>
                <td 
                  colSpan={showDetails ? 7 : 6} 
                  className="px-4 py-8 text-center text-gray-500 dark:text-gray-400"
                >
                  Нет предложений для отображения
                </td>
              </tr>
            ) : (
              processedProposals.map((proposal, index) => {
                const isHighlighted = proposal.currentRank <= highlightTop;
                const rankDiff = proposal.previousRank 
                  ? Math.abs(proposal.currentRank - proposal.previousRank)
                  : undefined;

                return (
                  <tr 
                    key={proposal.id}
                    className={`hover:bg-gray-50 dark:hover:bg-gray-700 ${
                      onProposalClick ? 'cursor-pointer' : ''
                    } ${isHighlighted ? 'bg-yellow-50 dark:bg-yellow-900/10' : ''}`}
                    onClick={() => onProposalClick?.(proposal)}
                  >
                    {/* Рейтинг */}
                    <td className="px-4 py-4">
                      <div className="flex items-center space-x-3">
                        {getRankIcon(proposal.currentRank)}
                        <div className="flex flex-col">
                          <span className={`text-lg font-bold ${
                            isHighlighted ? 'text-yellow-600' : 'text-gray-900 dark:text-white'
                          }`}>
                            #{proposal.currentRank}
                          </span>
                          {showPrevious && proposal.previousRank && (
                            <div className="flex items-center space-x-1">
                              <span className="text-xs text-gray-500">
                                #{proposal.previousRank}
                              </span>
                              {getRankChangeIcon(proposal.change, rankDiff)}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Компания */}
                    <td className="px-4 py-4">
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${
                          proposal.status === 'evaluated' ? 'bg-green-400' :
                          proposal.status === 'pending' ? 'bg-yellow-400' : 'bg-red-400'
                        }`} />
                        <div className="min-w-0 flex-1">
                          <div className={`font-medium text-gray-900 dark:text-white ${
                            compactMode ? 'text-sm' : 'text-base'
                          }`}>
                            {proposal.companyName}
                          </div>
                          {!compactMode && (
                            <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                              {proposal.proposalName}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Балл */}
                    <td className="px-4 py-4 text-center">
                      {getScoreBar(proposal.overallScore, proposal.maxScore)}
                    </td>

                    {/* Бюджет */}
                    <td className="px-4 py-4 text-center">
                      <div className="flex items-center justify-center space-x-1">
                        <DollarSign className="h-4 w-4 text-gray-400" />
                        <span className="font-medium">
                          {(proposal.budget.total / 1000000).toFixed(1)}М
                        </span>
                        <span className="text-xs text-gray-500">
                          {proposal.budget.currency}
                        </span>
                      </div>
                    </td>

                    {/* Сроки */}
                    <td className="px-4 py-4 text-center">
                      <div className="flex items-center justify-center space-x-1">
                        <Clock className="h-4 w-4 text-gray-400" />
                        <span className="font-medium">
                          {proposal.timeline.estimated}
                        </span>
                        <span className="text-xs text-gray-500">
                          {proposal.timeline.unit === 'days' ? 'дн.' : 
                           proposal.timeline.unit === 'weeks' ? 'нед.' : 'мес.'}
                        </span>
                      </div>
                    </td>

                    {/* Рекомендация */}
                    <td className="px-4 py-4 text-center">
                      {getRecommendationBadge(proposal.recommendation)}
                    </td>

                    {/* Детали */}
                    {showDetails && (
                      <td className="px-4 py-4 text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            onProposalClick?.(proposal);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Статистика */}
      {processedProposals.length > 0 && (
        <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
          <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
            <div className="flex items-center space-x-4">
              <span>
                Средний балл: <strong className="text-gray-900 dark:text-white">
                  {(processedProposals.reduce((sum, p) => sum + p.overallScore, 0) / processedProposals.length).toFixed(1)}
                </strong>
              </span>
              <span>
                Рекомендуемых: <strong className="text-green-600">
                  {processedProposals.filter(p => p.recommendation === 'recommend').length}
                </strong>
              </span>
            </div>
            
            {topProposals.length > 0 && (
              <div className="flex items-center space-x-2">
                <Trophy className="h-4 w-4 text-yellow-500" />
                <span>
                  Лидер: <strong className="text-gray-900 dark:text-white">
                    {topProposals[0]?.companyName}
                  </strong>
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default RankingTable;