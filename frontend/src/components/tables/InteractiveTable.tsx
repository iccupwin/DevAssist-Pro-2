/**
 * InteractiveTable - Базовый компонент интерактивной таблицы
 * Согласно ТЗ DevAssist Pro
 */

import React, { useState, useMemo } from 'react';
import { 
  ChevronUp, 
  ChevronDown, 
  Search, 
  Filter,
  Download,
  MoreVertical,
  Eye,
  EyeOff,
  ArrowUpDown
} from 'lucide-react';
import { Button } from '../ui/Button';

export interface TableColumn<T = any> {
  key: string;
  label: string;
  sortable?: boolean;
  filterable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
  render?: (value: any, row: T, index: number) => React.ReactNode;
  headerRender?: () => React.ReactNode;
  className?: string;
  sticky?: boolean;
}

export interface TableFilter {
  column: string;
  value: string;
  operator?: 'equals' | 'contains' | 'gt' | 'lt' | 'gte' | 'lte';
}

export interface InteractiveTableProps<T = any> {
  data: T[];
  columns: TableColumn<T>[];
  title?: string;
  className?: string;
  searchable?: boolean;
  filterable?: boolean;
  sortable?: boolean;
  pagination?: boolean;
  pageSize?: number;
  striped?: boolean;
  bordered?: boolean;
  hover?: boolean;
  compact?: boolean;
  loading?: boolean;
  emptyMessage?: string;
  onRowClick?: (row: T, index: number) => void;
  onRowSelect?: (selectedRows: T[]) => void;
  selectable?: boolean;
  exportable?: boolean;
  onExport?: (data: T[]) => void;
  stickyHeader?: boolean;
  maxHeight?: string;
}

type SortDirection = 'asc' | 'desc' | null;

export const InteractiveTable = <T extends Record<string, any>>({
  data,
  columns,
  title,
  className = '',
  searchable = true,
  filterable = true,
  sortable = true,
  pagination = true,
  pageSize = 10,
  striped = true,
  bordered = true,
  hover = true,
  compact = false,
  loading = false,
  emptyMessage = 'Нет данных для отображения',
  onRowClick,
  onRowSelect,
  selectable = false,
  exportable = false,
  onExport,
  stickyHeader = false,
  maxHeight = '600px'
}: InteractiveTableProps<T>) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [filters, setFilters] = useState<TableFilter[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(
    new Set(columns.map(col => col.key))
  );

  // Фильтрация данных
  const filteredData = useMemo(() => {
    let filtered = [...data];

    // Поиск
    if (searchTerm && searchable) {
      filtered = filtered.filter(row =>
        Object.values(row).some(value =>
          String(value).toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    // Фильтры
    filters.forEach(filter => {
      filtered = filtered.filter(row => {
        const value = row[filter.column];
        const filterValue = filter.value;

        switch (filter.operator) {
          case 'equals':
            return String(value) === filterValue;
          case 'contains':
            return String(value).toLowerCase().includes(filterValue.toLowerCase());
          case 'gt':
            return Number(value) > Number(filterValue);
          case 'lt':
            return Number(value) < Number(filterValue);
          case 'gte':
            return Number(value) >= Number(filterValue);
          case 'lte':
            return Number(value) <= Number(filterValue);
          default:
            return String(value).toLowerCase().includes(filterValue.toLowerCase());
        }
      });
    });

    return filtered;
  }, [data, searchTerm, filters, searchable]);

  // Сортировка данных
  const sortedData = useMemo(() => {
    if (!sortColumn || !sortDirection || !sortable) return filteredData;

    return [...filteredData].sort((a, b) => {
      const aValue = a[sortColumn];
      const bValue = b[sortColumn];

      if (aValue === bValue) return 0;

      let comparison = 0;
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        comparison = aValue - bValue;
      } else {
        comparison = String(aValue).localeCompare(String(bValue));
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [filteredData, sortColumn, sortDirection, sortable]);

  // Пагинация
  const paginatedData = useMemo(() => {
    if (!pagination) return sortedData;

    const startIndex = (currentPage - 1) * pageSize;
    return sortedData.slice(startIndex, startIndex + pageSize);
  }, [sortedData, currentPage, pageSize, pagination]);

  const totalPages = Math.ceil(sortedData.length / pageSize);

  // Обработчики
  const handleSort = (columnKey: string) => {
    if (!sortable) return;

    const column = columns.find(col => col.key === columnKey);
    if (!column?.sortable) return;

    if (sortColumn === columnKey) {
      setSortDirection(current => {
        if (current === 'asc') return 'desc';
        if (current === 'desc') return null;
        return 'asc';
      });
    } else {
      setSortColumn(columnKey);
      setSortDirection('asc');
    }
  };

  const handleRowSelect = (index: number) => {
    if (!selectable) return;

    const newSelected = new Set(selectedRows);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedRows(newSelected);

    if (onRowSelect) {
      const selectedData = Array.from(newSelected).map(i => sortedData[i]);
      onRowSelect(selectedData);
    }
  };

  const handleSelectAll = () => {
    if (!selectable) return;

    if (selectedRows.size === paginatedData.length) {
      setSelectedRows(new Set());
      onRowSelect?.([]);
    } else {
      const allIndexes = new Set(Array.from({ length: paginatedData.length }, (_, i) => i));
      setSelectedRows(allIndexes);
      onRowSelect?.(paginatedData);
    }
  };

  const handleColumnVisibility = (columnKey: string) => {
    const newVisible = new Set(visibleColumns);
    if (newVisible.has(columnKey)) {
      newVisible.delete(columnKey);
    } else {
      newVisible.add(columnKey);
    }
    setVisibleColumns(newVisible);
  };

  const visibleColumnsData = columns.filter(col => visibleColumns.has(col.key));

  const renderSortIcon = (columnKey: string) => {
    if (!sortable || sortColumn !== columnKey) {
      return <ArrowUpDown className="h-4 w-4 text-gray-400" />;
    }

    if (sortDirection === 'asc') {
      return <ChevronUp className="h-4 w-4 text-blue-600" />;
    } else if (sortDirection === 'desc') {
      return <ChevronDown className="h-4 w-4 text-blue-600" />;
    }

    return <ArrowUpDown className="h-4 w-4 text-gray-400" />;
  };

  const renderTableHeader = () => (
    <thead className={`${stickyHeader ? 'sticky top-0 z-10' : ''} bg-gray-50 dark:bg-gray-800`}>
      <tr>
        {selectable && (
          <th className="px-3 py-3 text-left">
            <input
              type="checkbox"
              checked={selectedRows.size === paginatedData.length && paginatedData.length > 0}
              onChange={handleSelectAll}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
          </th>
        )}
        {visibleColumnsData.map((column) => (
          <th
            key={column.key}
            className={`px-4 py-3 text-${column.align || 'left'} text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider ${
              column.sortable && sortable ? 'cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700' : ''
            } ${column.sticky ? 'sticky left-0 z-10 bg-gray-50 dark:bg-gray-800' : ''} ${column.className || ''}`}
            style={{ width: column.width }}
            onClick={() => column.sortable && handleSort(column.key)}
          >
            <div className="flex items-center space-x-1">
              <span>{column.label}</span>
              {column.sortable && sortable && renderSortIcon(column.key)}
            </div>
          </th>
        ))}
      </tr>
    </thead>
  );

  const renderTableBody = () => (
    <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
      {loading ? (
        <tr>
          <td colSpan={visibleColumnsData.length + (selectable ? 1 : 0)} className="px-4 py-8 text-center">
            <div className="flex items-center justify-center space-x-2">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span className="text-gray-500 dark:text-gray-400">Загрузка...</span>
            </div>
          </td>
        </tr>
      ) : paginatedData.length === 0 ? (
        <tr>
          <td colSpan={visibleColumnsData.length + (selectable ? 1 : 0)} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
            {emptyMessage}
          </td>
        </tr>
      ) : (
        paginatedData.map((row, index) => (
          <tr
            key={index}
            className={`${
              striped && index % 2 === 0 ? 'bg-gray-50 dark:bg-gray-800' : ''
            } ${
              hover ? 'hover:bg-gray-100 dark:hover:bg-gray-700' : ''
            } ${
              onRowClick ? 'cursor-pointer' : ''
            } ${
              selectedRows.has(index) ? 'bg-blue-50 dark:bg-blue-900/20' : ''
            }`}
            onClick={() => onRowClick?.(row, index)}
          >
            {selectable && (
              <td className="px-3 py-4">
                <input
                  type="checkbox"
                  checked={selectedRows.has(index)}
                  onChange={() => handleRowSelect(index)}
                  onClick={(e) => e.stopPropagation()}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              </td>
            )}
            {visibleColumnsData.map((column) => (
              <td
                key={column.key}
                className={`px-4 py-4 text-${column.align || 'left'} text-sm ${
                  compact ? 'py-2' : 'py-4'
                } ${column.sticky ? 'sticky left-0 z-10 bg-white dark:bg-gray-900' : ''} ${column.className || ''}`}
              >
                {column.render 
                  ? column.render(row[column.key], row, index)
                  : String(row[column.key] || '')
                }
              </td>
            ))}
          </tr>
        ))
      )}
    </tbody>
  );

  const renderPagination = () => {
    if (!pagination || totalPages <= 1) return null;

    return (
      <div className="flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-2 text-sm text-gray-700 dark:text-gray-300">
          <span>
            Показано {((currentPage - 1) * pageSize) + 1} - {Math.min(currentPage * pageSize, sortedData.length)} из {sortedData.length}
          </span>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(1)}
            disabled={currentPage === 1}
          >
            Первая
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            Назад
          </Button>
          
          <div className="flex items-center space-x-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const page = currentPage <= 3 
                ? i + 1 
                : currentPage >= totalPages - 2 
                  ? totalPages - 4 + i 
                  : currentPage - 2 + i;
              
              if (page < 1 || page > totalPages) return null;
              
              return (
                <Button
                  key={page}
                  variant={page === currentPage ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentPage(page)}
                  className="w-8"
                >
                  {page}
                </Button>
              );
            })}
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
          >
            Вперед
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(totalPages)}
            disabled={currentPage === totalPages}
          >
            Последняя
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow ${className}`}>
      {/* Header */}
      {(title || searchable || filterable || exportable) && (
        <div className="px-4 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              {title && (
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {title}
                </h3>
              )}
            </div>
            
            <div className="flex items-center space-x-3">
              {searchable && (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Поиск..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}
              
              {/* Column visibility */}
              <div className="relative">
                <Button variant="outline" size="sm" className="flex items-center space-x-1">
                  <Eye className="h-4 w-4" />
                  <span>Колонки</span>
                </Button>
                {/* TODO: Dropdown menu for column visibility */}
              </div>
              
              {exportable && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onExport?.(sortedData)}
                  className="flex items-center space-x-1"
                >
                  <Download className="h-4 w-4" />
                  <span>Экспорт</span>
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div 
        className={`overflow-auto ${maxHeight ? `max-h-[${maxHeight}]` : ''}`}
        style={{ maxHeight }}
      >
        <table className={`min-w-full divide-y divide-gray-200 dark:divide-gray-700 ${bordered ? 'border border-gray-200 dark:border-gray-700' : ''}`}>
          {renderTableHeader()}
          {renderTableBody()}
        </table>
      </div>

      {/* Pagination */}
      {renderPagination()}
    </div>
  );
};

export default InteractiveTable;