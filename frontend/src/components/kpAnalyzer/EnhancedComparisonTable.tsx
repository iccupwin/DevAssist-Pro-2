/**
 * EnhancedComparisonTable Component
 * Advanced table component for displaying structured comparison data
 */

import React, { useState, useMemo } from 'react';
import { 
  ChevronUp, 
  ChevronDown, 
  Search, 
  Filter,
  Download,
  Eye,
  MoreVertical
} from 'lucide-react';
import { ComparisonTable, TableRow } from '../../types/kpAnalyzer';
import ScoreBadge from './ScoreBadge';
import CurrencyDisplay from './CurrencyDisplay';
import { formatPercentage, getPercentageColor } from '../../utils/currencyUtils';

interface EnhancedComparisonTableProps {
  table: ComparisonTable;
  className?: string;
  maxHeight?: string;
  showActions?: boolean;
  onRowClick?: (row: TableRow, index: number) => void;
  onExport?: () => void;
}

type SortDirection = 'asc' | 'desc' | null;

export const EnhancedComparisonTable: React.FC<EnhancedComparisonTableProps> = ({
  table,
  className = '',
  maxHeight = 'max-h-96',
  showActions = false,
  onRowClick,
  onExport
}) => {
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());

  // Memoized filtered and sorted data
  const processedData = useMemo(() => {
    let filteredData = table.rows;

    // Apply search filter
    if (searchTerm) {
      filteredData = filteredData.filter(row =>
        Object.values(row).some(value =>
          String(value).toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    // Apply sorting
    if (sortColumn && sortDirection) {
      filteredData = [...filteredData].sort((a, b) => {
        const aValue = a[sortColumn];
        const bValue = b[sortColumn];
        
        // Handle numeric values
        if (typeof aValue === 'number' && typeof bValue === 'number') {
          return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
        }
        
        // Handle string values
        const aStr = String(aValue).toLowerCase();
        const bStr = String(bValue).toLowerCase();
        
        if (sortDirection === 'asc') {
          return aStr < bStr ? -1 : aStr > bStr ? 1 : 0;
        } else {
          return aStr > bStr ? -1 : aStr < bStr ? 1 : 0;
        }
      });
    }

    return filteredData;
  }, [table.rows, searchTerm, sortColumn, sortDirection]);

  const handleSort = (column: string) => {
    if (!table.sortable) return;

    if (sortColumn === column) {
      // Cycle through: asc -> desc -> null
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else if (sortDirection === 'desc') {
        setSortDirection(null);
        setSortColumn(null);
      } else {
        setSortDirection('asc');
      }
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const toggleRowSelection = (index: number) => {
    const newSelection = new Set(selectedRows);
    if (newSelection.has(index)) {
      newSelection.delete(index);
    } else {
      newSelection.add(index);
    }
    setSelectedRows(newSelection);
  };

  const renderCellContent = (value: any, header: string) => {
    // Handle percentages
    if (typeof value === 'number' && (
      header.toLowerCase().includes('процент') ||
      header.toLowerCase().includes('отклонение') ||
      header.toLowerCase().includes('%')
    )) {
      return (
        <span className={getPercentageColor(value)}>
          {formatPercentage(value, { showSign: true })}
        </span>
      );
    }

    // Handle scores
    if (typeof value === 'number' && (
      header.toLowerCase().includes('оценка') ||
      header.toLowerCase().includes('балл') ||
      header.toLowerCase().includes('score')
    ) && value <= 100) {
      return <ScoreBadge score={value} size="sm" showIcon={false} />;
    }

    // Handle currency amounts
    if (typeof value === 'number' && value > 1000 && (
      header.toLowerCase().includes('стоимость') ||
      header.toLowerCase().includes('цена') ||
      header.toLowerCase().includes('бюджет') ||
      header.toLowerCase().includes('сумма')
    )) {
      return (
        <CurrencyDisplay 
          amount={value} 
          currency={{ code: 'RUB', symbol: '₽', name: 'Рубль', detected: true }}
          size="sm"
        />
      );
    }

    // Handle status values
    if (typeof value === 'string' && (
      ['выполнено', 'частично', 'не выполнено', 'отсутствует', 'compliant', 'partial', 'not_met', 'missing'].includes(value.toLowerCase())
    )) {
      const getStatusColor = (status: string) => {
        const lower = status.toLowerCase();
        if (lower.includes('выполнено') || lower === 'compliant') return 'bg-green-100 text-green-800';
        if (lower.includes('частично') || lower === 'partial') return 'bg-yellow-100 text-yellow-800';
        if (lower.includes('не выполнено') || lower === 'not_met') return 'bg-red-100 text-red-800';
        if (lower.includes('отсутствует') || lower === 'missing') return 'bg-gray-100 text-gray-800';
        return 'bg-gray-100 text-gray-800';
      };

      return (
        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(value)}`}>
          {value}
        </span>
      );
    }

    // Handle boolean values
    if (typeof value === 'boolean') {
      return (
        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
          value ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {value ? 'Да' : 'Нет'}
        </span>
      );
    }

    // Default string rendering
    return <span className="text-gray-900">{String(value)}</span>;
  };

  const SortIcon = ({ column }: { column: string }) => {
    if (!table.sortable || sortColumn !== column) {
      return <div className="w-4 h-4" />;
    }
    
    if (sortDirection === 'asc') {
      return <ChevronUp className="w-4 h-4 text-blue-500" />;
    } else if (sortDirection === 'desc') {
      return <ChevronDown className="w-4 h-4 text-blue-500" />;
    }
    
    return <div className="w-4 h-4" />;
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
      {/* Table Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">{table.title}</h3>
          <div className="flex items-center space-x-2">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Поиск..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            {/* Export */}
            {onExport && (
              <button
                onClick={onExport}
                className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <Download className="w-4 h-4 mr-1" />
                Экспорт
              </button>
            )}
          </div>
        </div>

        {/* Selection info */}
        {selectedRows.size > 0 && (
          <div className="mt-2 text-sm text-blue-600">
            Выбрано строк: {selectedRows.size}
          </div>
        )}
      </div>

      {/* Table Content */}
      <div className={`overflow-auto ${maxHeight}`}>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50 sticky top-0 z-10">
            <tr>
              {showActions && (
                <th className="px-3 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedRows.size === processedData.length && processedData.length > 0}
                    onChange={() => {
                      if (selectedRows.size === processedData.length) {
                        setSelectedRows(new Set());
                      } else {
                        setSelectedRows(new Set(processedData.map((_, i) => i)));
                      }
                    }}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
              )}
              
              {table.headers.map((header, index) => (
                <th
                  key={index}
                  className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
                    table.sortable ? 'cursor-pointer hover:bg-gray-100' : ''
                  }`}
                  onClick={() => handleSort(header)}
                >
                  <div className="flex items-center space-x-1">
                    <span>{header}</span>
                    <SortIcon column={header} />
                  </div>
                </th>
              ))}
              
              {showActions && (
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Действия
                </th>
              )}
            </tr>
          </thead>
          
          <tbody className="bg-white divide-y divide-gray-200">
            {processedData.length === 0 ? (
              <tr>
                <td colSpan={table.headers.length + (showActions ? 2 : 0)} className="px-6 py-12 text-center text-gray-500">
                  {searchTerm ? 'Ничего не найдено' : 'Нет данных для отображения'}
                </td>
              </tr>
            ) : (
              processedData.map((row, rowIndex) => (
                <tr
                  key={rowIndex}
                  className={`hover:bg-gray-50 ${
                    onRowClick ? 'cursor-pointer' : ''
                  } ${selectedRows.has(rowIndex) ? 'bg-blue-50' : ''}`}
                  onClick={() => onRowClick?.(row, rowIndex)}
                >
                  {showActions && (
                    <td className="px-3 py-4">
                      <input
                        type="checkbox"
                        checked={selectedRows.has(rowIndex)}
                        onChange={() => toggleRowSelection(rowIndex)}
                        onClick={(e) => e.stopPropagation()}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                  )}
                  
                  {table.headers.map((header, cellIndex) => (
                    <td key={cellIndex} className="px-6 py-4 whitespace-nowrap text-sm">
                      {renderCellContent(row[header], header)}
                    </td>
                  ))}
                  
                  {showActions && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            // Handle view action
                          }}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            // Handle more actions
                          }}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Table Footer */}
      <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>
            Показано {processedData.length} из {table.rows.length} записей
            {searchTerm && ` (фильтр: "${searchTerm}")`}
          </span>
          {selectedRows.size > 0 && (
            <button
              onClick={() => setSelectedRows(new Set())}
              className="text-blue-600 hover:text-blue-800"
            >
              Очистить выделение
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default EnhancedComparisonTable;