/**
 * CriteriaMatrix - Матрица критериев оценки КП
 * Согласно ТЗ DevAssist Pro
 */

import React, { useMemo, useState } from 'react';
import { 
  Target, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  CheckCircle,
  XCircle,
  AlertCircle,
  Star,
  Trophy,
  Settings,
  Filter,
  Download,
  RotateCcw
} from 'lucide-react';
import { Button } from '../ui/Button';

interface CriteriaScore {
  value: number;
  maxValue: number;
  weight: number;
  threshold: {
    excellent: number;
    good: number;
    acceptable: number;
  };
}

interface CriteriaData {
  technical: CriteriaScore;
  commercial: CriteriaScore;
  timeline: CriteriaScore;
  experience: CriteriaScore;
  compliance: CriteriaScore;
}

interface KPProposalCriteria {
  id: string;
  companyName: string;
  proposalName: string;
  criteria: CriteriaData;
  overallScore: number;
  rank: number;
  status: 'evaluated' | 'pending' | 'rejected';
  evaluationDate: string;
  evaluator: string;
}

interface CriteriaMatrixProps {
  proposals: KPProposalCriteria[];
  title?: string;
  className?: string;
  showWeights?: boolean;
  showThresholds?: boolean;
  highlightBest?: boolean;
  enableEdit?: boolean;
  onProposalClick?: (proposal: KPProposalCriteria) => void;
  onCriteriaEdit?: (proposalId: string, criteriaKey: string, newValue: number) => void;
  onExport?: () => void;
  compactMode?: boolean;
}

type CriteriaKey = keyof CriteriaData;
type ScoreLevel = 'excellent' | 'good' | 'acceptable' | 'poor';

export const CriteriaMatrix: React.FC<CriteriaMatrixProps> = ({
  proposals,
  title = 'Матрица критериев оценки',
  className = '',
  showWeights = true,
  showThresholds = false,
  highlightBest = true,
  enableEdit = false,
  onProposalClick,
  onCriteriaEdit,
  onExport,
  compactMode = false
}) => {
  const [sortBy, setSortBy] = useState<CriteriaKey | 'overall' | 'company'>('overall');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [filterLevel, setFilterLevel] = useState<ScoreLevel | 'all'>('all');
  const [editingCell, setEditingCell] = useState<{proposalId: string, criteria: CriteriaKey} | null>(null);

  // Критерии с их названиями и описаниями
  const criteriaInfo = {
    technical: {
      name: 'Техническое соответствие',
      shortName: 'Техническое',
      description: 'Соответствие техническим требованиям ТЗ',
      icon: Target
    },
    commercial: {
      name: 'Коммерческие условия',
      shortName: 'Коммерческое',
      description: 'Цена, условия оплаты, гарантии',
      icon: TrendingUp
    },
    timeline: {
      name: 'Сроки выполнения',
      shortName: 'Сроки',
      description: 'Реалистичность и привлекательность сроков',
      icon: AlertCircle
    },
    experience: {
      name: 'Опыт команды',
      shortName: 'Опыт',
      description: 'Квалификация и опыт исполнителей',
      icon: Star
    },
    compliance: {
      name: 'Соответствие требованиям',
      shortName: 'Соответствие',
      description: 'Полнота ответа на требования ТЗ',
      icon: CheckCircle
    }
  };

  // Определяем лучшие показатели для каждого критерия
  const bestScores = useMemo((): Record<CriteriaKey | 'overall', number> => {
    const defaultScores: Record<CriteriaKey | 'overall', number> = {
      technical: 0,
      commercial: 0,
      timeline: 0,
      experience: 0,
      compliance: 0,
      overall: 0
    };

    if (!highlightBest || proposals.length === 0) return defaultScores;

    const result: Record<CriteriaKey | 'overall', number> = { ...defaultScores };
    
    Object.keys(criteriaInfo).forEach(key => {
      const criteriaKey = key as CriteriaKey;
      result[criteriaKey] = Math.max(...proposals.map(p => p.criteria[criteriaKey].value));
    });
    
    result.overall = Math.max(...proposals.map(p => p.overallScore));
    
    return result;
  }, [proposals, highlightBest]);

  // Функция для определения уровня оценки
  const getScoreLevel = (score: CriteriaScore): ScoreLevel => {
    const percentage = (score.value / score.maxValue) * 100;
    const thresholds = score.threshold;
    
    if (percentage >= thresholds.excellent) return 'excellent';
    if (percentage >= thresholds.good) return 'good';
    if (percentage >= thresholds.acceptable) return 'acceptable';
    return 'poor';
  };

  // Функция для получения цвета ячейки на основе уровня
  const getCellColor = (level: ScoreLevel, isBest: boolean = false) => {
    const baseColors = {
      excellent: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      good: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      acceptable: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      poor: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
    };

    const bestColors = {
      excellent: 'bg-green-200 text-green-900 dark:bg-green-800/50 dark:text-green-200 ring-2 ring-green-500',
      good: 'bg-blue-200 text-blue-900 dark:bg-blue-800/50 dark:text-blue-200 ring-2 ring-blue-500',
      acceptable: 'bg-yellow-200 text-yellow-900 dark:bg-yellow-800/50 dark:text-yellow-200 ring-2 ring-yellow-500',
      poor: 'bg-red-200 text-red-900 dark:bg-red-800/50 dark:text-red-200 ring-2 ring-red-500'
    };

    return isBest ? bestColors[level] : baseColors[level];
  };

  // Сортировка предложений
  const sortedProposals = useMemo(() => {
    return [...proposals].sort((a, b) => {
      let valueA: number, valueB: number;
      
      if (sortBy === 'overall') {
        valueA = a.overallScore;
        valueB = b.overallScore;
      } else if (sortBy === 'company') {
        return sortDirection === 'asc' 
          ? a.companyName.localeCompare(b.companyName)
          : b.companyName.localeCompare(a.companyName);
      } else {
        valueA = a.criteria[sortBy].value;
        valueB = b.criteria[sortBy].value;
      }
      
      return sortDirection === 'asc' ? valueA - valueB : valueB - valueA;
    });
  }, [proposals, sortBy, sortDirection]);

  // Фильтрация по уровню оценки
  const filteredProposals = useMemo(() => {
    if (filterLevel === 'all') return sortedProposals;
    
    return sortedProposals.filter(proposal => {
      return Object.values(proposal.criteria).some(criteria => 
        getScoreLevel(criteria) === filterLevel
      );
    });
  }, [sortedProposals, filterLevel]);

  const handleSort = (criteria: CriteriaKey | 'overall' | 'company') => {
    if (sortBy === criteria) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(criteria);
      setSortDirection('desc');
    }
  };

  const handleCellEdit = (proposalId: string, criteriaKey: CriteriaKey, value: string) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && onCriteriaEdit) {
      onCriteriaEdit(proposalId, criteriaKey, numValue);
    }
    setEditingCell(null);
  };

  const renderSortIcon = (criteria: CriteriaKey | 'overall' | 'company') => {
    if (sortBy !== criteria) return <Minus className="h-3 w-3 text-gray-400" />;
    return sortDirection === 'asc' 
      ? <TrendingUp className="h-3 w-3 text-blue-600" />
      : <TrendingDown className="h-3 w-3 text-blue-600" />;
  };

  const renderScoreCell = (proposal: KPProposalCriteria, criteriaKey: CriteriaKey) => {
    const criteria = proposal.criteria[criteriaKey];
    const level = getScoreLevel(criteria);
    const isBest = highlightBest && criteria.value === bestScores[criteriaKey];
    const isEditing = editingCell?.proposalId === proposal.id && editingCell?.criteria === criteriaKey;
    
    const cellContent = (
      <div className="flex items-center justify-between space-x-2">
        <div className="flex flex-col">
          <span className={`font-medium ${compactMode ? 'text-sm' : 'text-base'}`}>
            {criteria.value.toFixed(1)}
          </span>
          {!compactMode && (
            <span className="text-xs opacity-75">
              / {criteria.maxValue}
            </span>
          )}
        </div>
        {isBest && <Trophy className="h-3 w-3" />}
        {showWeights && (
          <span className="text-xs opacity-60">
            w:{criteria.weight}
          </span>
        )}
      </div>
    );

    return (
      <td
        key={criteriaKey}
        className={`px-3 py-2 text-center border-r border-gray-200 dark:border-gray-700 ${getCellColor(level, isBest)} ${
          enableEdit ? 'cursor-pointer hover:opacity-80' : ''
        } ${compactMode ? 'px-2 py-1' : 'px-3 py-2'}`}
        onClick={() => enableEdit && setEditingCell({proposalId: proposal.id, criteria: criteriaKey})}
      >
        {isEditing ? (
          <input
            type="number"
            defaultValue={criteria.value}
            onBlur={(e) => handleCellEdit(proposal.id, criteriaKey, e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleCellEdit(proposal.id, criteriaKey, (e.target as HTMLInputElement).value);
              } else if (e.key === 'Escape') {
                setEditingCell(null);
              }
            }}
            className="w-16 px-1 py-0 text-center bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-blue-500 rounded"
            autoFocus
          />
        ) : (
          cellContent
        )}
      </td>
    );
  };

  const renderOverallScoreCell = (proposal: KPProposalCriteria) => {
    const isBest = highlightBest && proposal.overallScore === bestScores.overall;
    const percentage = (proposal.overallScore / 100) * 100;
    
    let level: ScoreLevel = 'poor';
    if (percentage >= 85) level = 'excellent';
    else if (percentage >= 70) level = 'good';
    else if (percentage >= 50) level = 'acceptable';

    return (
      <td className={`px-3 py-2 text-center font-bold border-r border-gray-200 dark:border-gray-700 ${getCellColor(level, isBest)} ${compactMode ? 'px-2 py-1' : 'px-3 py-2'}`}>
        <div className="flex items-center justify-center space-x-2">
          {isBest && <Trophy className="h-4 w-4" />}
          <span>{proposal.overallScore.toFixed(1)}</span>
        </div>
      </td>
    );
  };

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
              Матрица оценки {filteredProposals.length} предложений по {Object.keys(criteriaInfo).length} критериям
            </p>
          </div>
          
          <div className="flex items-center space-x-2">
            {/* Фильтр по уровню */}
            <select
              value={filterLevel}
              onChange={(e) => setFilterLevel(e.target.value as ScoreLevel | 'all')}
              className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="all">Все уровни</option>
              <option value="excellent">Отличные</option>
              <option value="good">Хорошие</option>
              <option value="acceptable">Приемлемые</option>
              <option value="poor">Слабые</option>
            </select>

            {/* Кнопки управления */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSortBy('overall');
                setSortDirection('desc');
                setFilterLevel('all');
              }}
              className="p-2"
              title="Сбросить фильтры"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>

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
      <div className="overflow-auto max-h-96">
        <table className="min-w-full">
          <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0 z-10">
            <tr>
              {/* Заголовок компании */}
              <th 
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider border-r border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 sticky left-0 bg-gray-50 dark:bg-gray-700 z-20"
                onClick={() => handleSort('company')}
              >
                <div className="flex items-center space-x-1">
                  <span>Компания</span>
                  {renderSortIcon('company')}
                </div>
              </th>

              {/* Заголовки критериев */}
              {Object.entries(criteriaInfo).map(([key, info]) => {
                const Icon = info.icon;
                return (
                  <th 
                    key={key}
                    className="px-3 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider border-r border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                    onClick={() => handleSort(key as CriteriaKey)}
                    title={info.description}
                  >
                    <div className="flex flex-col items-center space-y-1">
                      <div className="flex items-center space-x-1">
                        <Icon className="h-3 w-3" />
                        {renderSortIcon(key as CriteriaKey)}
                      </div>
                      <span className={compactMode ? 'text-xs' : 'text-xs'}>
                        {compactMode ? info.shortName : info.name}
                      </span>
                    </div>
                  </th>
                );
              })}

              {/* Заголовок общего балла */}
              <th 
                className="px-3 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                onClick={() => handleSort('overall')}
              >
                <div className="flex flex-col items-center space-y-1">
                  <div className="flex items-center space-x-1">
                    <Trophy className="h-3 w-3" />
                    {renderSortIcon('overall')}
                  </div>
                  <span>Общий балл</span>
                </div>
              </th>
            </tr>
          </thead>

          <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
            {filteredProposals.length === 0 ? (
              <tr>
                <td 
                  colSpan={Object.keys(criteriaInfo).length + 2} 
                  className="px-4 py-8 text-center text-gray-500 dark:text-gray-400"
                >
                  Нет данных для отображения
                </td>
              </tr>
            ) : (
              filteredProposals.map((proposal, index) => (
                <tr 
                  key={proposal.id}
                  className={`hover:bg-gray-50 dark:hover:bg-gray-700 ${
                    onProposalClick ? 'cursor-pointer' : ''
                  } ${index % 2 === 0 ? 'bg-gray-50/50 dark:bg-gray-800/50' : ''}`}
                  onClick={() => onProposalClick?.(proposal)}
                >
                  {/* Информация о компании */}
                  <td className="px-4 py-3 border-r border-gray-200 dark:border-gray-700 sticky left-0 bg-white dark:bg-gray-900 z-10">
                    <div className="flex items-center space-x-3">
                      <div className={`w-2 h-2 rounded-full ${
                        proposal.status === 'evaluated' ? 'bg-green-400' :
                        proposal.status === 'pending' ? 'bg-yellow-400' : 'bg-red-400'
                      }`} />
                      <div className="min-w-0 flex-1">
                        <div className={`font-medium text-gray-900 dark:text-white ${compactMode ? 'text-sm' : 'text-base'}`}>
                          {proposal.companyName}
                        </div>
                        {!compactMode && (
                          <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {proposal.proposalName}
                          </div>
                        )}
                        <div className="flex items-center space-x-2 mt-1">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            proposal.rank <= 3 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                            proposal.rank <= 5 ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' :
                            'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
                          }`}>
                            #{proposal.rank}
                          </span>
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Ячейки критериев */}
                  {Object.keys(criteriaInfo).map(key => 
                    renderScoreCell(proposal, key as CriteriaKey)
                  )}

                  {/* Общий балл */}
                  {renderOverallScoreCell(proposal)}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Легенда */}
      {showThresholds && (
        <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
          <div className="flex items-center space-x-6 text-xs">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded bg-green-100 dark:bg-green-900/30"></div>
              <span className="text-gray-600 dark:text-gray-400">Отличный (≥85%)</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded bg-blue-100 dark:bg-blue-900/30"></div>
              <span className="text-gray-600 dark:text-gray-400">Хороший (≥70%)</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded bg-yellow-100 dark:bg-yellow-900/30"></div>
              <span className="text-gray-600 dark:text-gray-400">Приемлемый (≥50%)</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded bg-red-100 dark:bg-red-900/30"></div>
              <span className="text-gray-600 dark:text-gray-400">Слабый (&lt;50%)</span>
            </div>
            {highlightBest && (
              <div className="flex items-center space-x-2">
                <Trophy className="h-3 w-3 text-yellow-600" />
                <span className="text-gray-600 dark:text-gray-400">Лучший результат</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CriteriaMatrix;