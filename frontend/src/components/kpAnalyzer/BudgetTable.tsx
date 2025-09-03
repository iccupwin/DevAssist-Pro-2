/**
 * Budget Table Component - Professional data table for financial analysis
 * Features: currency display, deviation calculation, status badges
 */

import React from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Info,
  ExternalLink,
  Filter
} from 'lucide-react';
import { CurrencyInfo, CurrencyDisplay } from './EnhancedCurrencyDisplay';

export interface BudgetItem {
  id: string;
  category: string;
  categoryIcon?: React.ReactNode;
  tzAmount?: CurrencyInfo;
  kpAmount: CurrencyInfo;
  deviation: number; // percentage
  status: 'excellent' | 'good' | 'warning' | 'critical';
  notes?: string;
  subItems?: BudgetItem[];
}

interface BudgetTableProps {
  items: BudgetItem[];
  title?: string;
  showComparison?: boolean;
  showTotal?: boolean;
  allowExpand?: boolean;
  className?: string;
  onItemClick?: (item: BudgetItem) => void;
}

export const BudgetTable: React.FC<BudgetTableProps> = ({
  items,
  title,
  showComparison = true,
  showTotal = true,
  allowExpand = true,
  className = '',
  onItemClick
}) => {
  const [expandedRows, setExpandedRows] = React.useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = React.useState<'category' | 'amount' | 'deviation'>('category');
  const [sortOrder, setSortOrder] = React.useState<'asc' | 'desc'>('asc');

  const getStatusIcon = (status: BudgetItem['status']) => {
    switch (status) {
      case 'excellent':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'good':
        return <CheckCircle className="w-4 h-4 text-blue-500" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'critical':
        return <XCircle className="w-4 h-4 text-red-500" />;
    }
  };

  const getStatusBadge = (status: BudgetItem['status']) => {
    const badgeMap = {
      excellent: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 border-green-200 dark:border-green-800',
      good: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 border-blue-200 dark:border-blue-800',
      warning: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800',
      critical: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400 border-red-200 dark:border-red-800'
    };
    
    const textMap = {
      excellent: 'Отлично',
      good: 'Хорошо',
      warning: 'Внимание',
      critical: 'Критично'
    };

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${badgeMap[status]}`}>
        {getStatusIcon(status)}
        {textMap[status]}
      </span>
    );
  };

  const getDeviationDisplay = (deviation: number) => {
    const isPositive = deviation > 0;
    const icon = isPositive ? 
      <TrendingUp className="w-3 h-3" /> : 
      <TrendingDown className="w-3 h-3" />;
    
    const colorClass = isPositive 
      ? 'text-red-600 dark:text-red-400'  // Over budget is red
      : 'text-green-600 dark:text-green-400'; // Under budget is green

    return (
      <div className={`flex items-center gap-1 ${colorClass}`}>
        {Math.abs(deviation) > 0.1 && icon}
        <span className="font-medium">
          {isPositive ? '+' : ''}{deviation.toFixed(1)}%
        </span>
      </div>
    );
  };

  const toggleRowExpansion = (id: string) => {
    if (!allowExpand) return;
    
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  const handleSort = (column: 'category' | 'amount' | 'deviation') => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  const sortedItems = React.useMemo(() => {
    return [...items].sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'category':
          comparison = a.category.localeCompare(b.category, 'ru');
          break;
        case 'amount':
          comparison = a.kpAmount.amount - b.kpAmount.amount;
          break;
        case 'deviation':
          comparison = a.deviation - b.deviation;
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [items, sortBy, sortOrder]);

  const totalKPAmount = items.reduce((sum, item) => sum + item.kpAmount.amount, 0);
  const totalTZAmount = items.reduce((sum, item) => sum + (item.tzAmount?.amount || 0), 0);
  const totalDeviation = totalTZAmount > 0 ? ((totalKPAmount - totalTZAmount) / totalTZAmount) * 100 : 0;

  const SortButton = ({ column, children }: { column: typeof sortBy, children: React.ReactNode }) => (
    <button
      onClick={() => handleSort(column)}
      className="flex items-center gap-1 text-left font-semibold text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
    >
      {children}
      {sortBy === column && (
        sortOrder === 'asc' ? 
          <TrendingUp className="w-3 h-3" /> : 
          <TrendingDown className="w-3 h-3" />
      )}
    </button>
  );

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden ${className}`}>
      {/* Header */}
      {title && (
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {title}
          </h3>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-900">
            <tr>
              <th className="px-6 py-3 text-left">
                <SortButton column="category">Категория</SortButton>
              </th>
              {showComparison && (
                <th className="px-6 py-3 text-left">
                  <div className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    ТЗ Бюджет
                  </div>
                </th>
              )}
              <th className="px-6 py-3 text-left">
                <SortButton column="amount">КП Бюджет</SortButton>
              </th>
              {showComparison && (
                <th className="px-6 py-3 text-left">
                  <SortButton column="deviation">Отклонение</SortButton>
                </th>
              )}
              <th className="px-6 py-3 text-left">
                <div className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Статус
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {sortedItems.map((item) => (
              <React.Fragment key={item.id}>
                <tr 
                  className={`
                    hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors
                    ${onItemClick ? 'cursor-pointer' : ''}
                    ${expandedRows.has(item.id) ? 'bg-blue-50 dark:bg-blue-900/10' : ''}
                  `}
                  onClick={() => {
                    onItemClick?.(item);
                    if (item.subItems?.length) {
                      toggleRowExpansion(item.id);
                    }
                  }}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {item.categoryIcon && (
                        <div className="text-gray-500 dark:text-gray-400">
                          {item.categoryIcon}
                        </div>
                      )}
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {item.category}
                        </div>
                        {item.notes && (
                          <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {item.notes}
                          </div>
                        )}
                      </div>
                      {item.subItems?.length && allowExpand && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleRowExpansion(item.id);
                          }}
                          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        >
                          <ExternalLink className={`w-4 h-4 transform transition-transform ${
                            expandedRows.has(item.id) ? 'rotate-45' : ''
                          }`} />
                        </button>
                      )}
                    </div>
                  </td>
                  {showComparison && (
                    <td className="px-6 py-4">
                      {item.tzAmount ? (
                        <CurrencyDisplay currency={item.tzAmount} size="sm" />
                      ) : (
                        <span className="text-gray-400 dark:text-gray-500 text-sm italic">
                          Не указано
                        </span>
                      )}
                    </td>
                  )}
                  <td className="px-6 py-4">
                    <CurrencyDisplay currency={item.kpAmount} size="sm" highlight />
                  </td>
                  {showComparison && (
                    <td className="px-6 py-4">
                      {getDeviationDisplay(item.deviation)}
                    </td>
                  )}
                  <td className="px-6 py-4">
                    {getStatusBadge(item.status)}
                  </td>
                </tr>

                {/* Expanded sub-items */}
                {expandedRows.has(item.id) && item.subItems && (
                  item.subItems.map((subItem) => (
                    <tr key={subItem.id} className="bg-gray-50 dark:bg-gray-800">
                      <td className="px-6 py-3 pl-12">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            {subItem.category}
                          </span>
                        </div>
                      </td>
                      {showComparison && (
                        <td className="px-6 py-3">
                          {subItem.tzAmount ? (
                            <CurrencyDisplay currency={subItem.tzAmount} size="sm" />
                          ) : (
                            <span className="text-gray-400 dark:text-gray-500 text-xs">—</span>
                          )}
                        </td>
                      )}
                      <td className="px-6 py-3">
                        <CurrencyDisplay currency={subItem.kpAmount} size="sm" />
                      </td>
                      {showComparison && (
                        <td className="px-6 py-3">
                          {getDeviationDisplay(subItem.deviation)}
                        </td>
                      )}
                      <td className="px-6 py-3">
                        {getStatusIcon(subItem.status)}
                      </td>
                    </tr>
                  ))
                )}
              </React.Fragment>
            ))}
          </tbody>
          
          {/* Total row */}
          {showTotal && items.length > 0 && (
            <tfoot className="bg-gray-100 dark:bg-gray-800 border-t-2 border-gray-300 dark:border-gray-600">
              <tr className="font-semibold">
                <td className="px-6 py-4 text-gray-900 dark:text-white">
                  ИТОГО
                </td>
                {showComparison && (
                  <td className="px-6 py-4">
                    {totalTZAmount > 0 && (
                      <CurrencyDisplay 
                        currency={{
                          code: items[0]?.kpAmount?.code || 'USD',
                          symbol: items[0]?.kpAmount?.symbol || '$',
                          name: items[0]?.kpAmount?.name || 'USD',
                          amount: totalTZAmount
                        }}
                        size="md"
                      />
                    )}
                  </td>
                )}
                <td className="px-6 py-4">
                  <CurrencyDisplay 
                    currency={{
                      code: items[0]?.kpAmount?.code || 'USD',
                      symbol: items[0]?.kpAmount?.symbol || '$',
                      name: items[0]?.kpAmount?.name || 'USD',
                      amount: totalKPAmount
                    }}
                    size="md"
                    highlight
                  />
                </td>
                {showComparison && (
                  <td className="px-6 py-4">
                    {getDeviationDisplay(totalDeviation)}
                  </td>
                )}
                <td className="px-6 py-4">
                  <Info className="w-4 h-4 text-gray-500" />
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* Footer info */}
      {items.length > 0 && (
        <div className="px-6 py-3 bg-gray-50 dark:bg-gray-900 text-sm text-gray-600 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700">
          Показано {items.length} категор{items.length === 1 ? 'ия' : items.length < 5 ? 'ии' : 'ий'} бюджета
          {showComparison && totalTZAmount > 0 && (
            <span className="ml-4">
              Общее отклонение: {getDeviationDisplay(totalDeviation)}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default BudgetTable;