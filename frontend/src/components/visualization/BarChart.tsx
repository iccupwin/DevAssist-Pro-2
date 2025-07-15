/**
 * BarChart - Столбчатая диаграмма для сравнения КП
 * Согласно ТЗ DevAssist Pro
 */

import React, { useMemo, useState } from 'react';
import { BarChart3, TrendingUp, Award, DollarSign, Clock, AlertCircle } from 'lucide-react';

interface BarChartDataPoint {
  label: string;
  value: number;
  maxValue?: number;
  color?: string;
  metadata?: {
    company?: string;
    price?: number;
    timeline?: string;
    compliance?: number;
  };
}

interface BarChartProps {
  data: BarChartDataPoint[];
  title?: string;
  className?: string;
  height?: number;
  showValues?: boolean;
  showMetadata?: boolean;
  sortBy?: 'value' | 'label' | 'none';
  orientation?: 'vertical' | 'horizontal';
  animationDelay?: number;
}

export const BarChart: React.FC<BarChartProps> = ({
  data,
  title,
  className = '',
  height = 300,
  showValues = true,
  showMetadata = false,
  sortBy = 'none',
  orientation = 'vertical',
  animationDelay = 0
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Сортировка данных
  const sortedData = useMemo(() => {
    if (sortBy === 'none') return data;
    
    const sorted = [...data].sort((a, b) => {
      if (sortBy === 'value') return b.value - a.value;
      if (sortBy === 'label') return a.label.localeCompare(b.label);
      return 0;
    });
    
    return sorted;
  }, [data, sortBy]);

  // Нормализация данных
  const normalizedData = useMemo(() => {
    const maxValue = Math.max(...sortedData.map(d => d.maxValue || d.value));
    return sortedData.map(item => ({
      ...item,
      normalizedValue: (item.value / maxValue) * 100
    }));
  }, [sortedData]);

  const defaultColors = [
    'rgb(59, 130, 246)',   // blue
    'rgb(16, 185, 129)',   // green
    'rgb(245, 158, 11)',   // amber
    'rgb(239, 68, 68)',    // red
    'rgb(139, 92, 246)',   // purple
    'rgb(236, 72, 153)',   // pink
    'rgb(14, 165, 233)',   // sky
    'rgb(34, 197, 94)',    // emerald
  ];

  if (!data || data.length === 0) {
    return (
      <div className={`flex flex-col items-center justify-center p-8 bg-white dark:bg-gray-800 rounded-lg ${className}`}>
        <AlertCircle className="h-12 w-12 text-gray-400 mb-4" />
        <p className="text-gray-500 dark:text-gray-400 text-center">
          Нет данных для отображения
        </p>
      </div>
    );
  }

  const renderVerticalChart = () => (
    <div className="space-y-4">
      {/* Заголовки */}
      <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
        <span>Коммерческие предложения</span>
        <span>Баллы</span>
      </div>

      {/* Столбцы */}
      <div className="space-y-3" style={{ height: `${height}px` }}>
        {normalizedData.map((item, index) => {
          const color = item.color || defaultColors[index % defaultColors.length];
          const isHovered = hoveredIndex === index;
          
          return (
            <div
              key={index}
              className="group"
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              <div className="flex items-center space-x-3">
                {/* Метка */}
                <div className="w-32 flex-shrink-0">
                  <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {item.label}
                  </div>
                  {showMetadata && item.metadata?.company && (
                    <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {item.metadata.company}
                    </div>
                  )}
                </div>

                {/* Столбец */}
                <div className="flex-1 relative">
                  <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-8 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-1000 ease-out relative"
                      style={{
                        width: `${item.normalizedValue}%`,
                        backgroundColor: color,
                        animationDelay: `${animationDelay + index * 100}ms`,
                        transform: isHovered ? 'scaleY(1.1)' : 'scaleY(1)',
                      }}
                    >
                      {showValues && (
                        <div className="absolute inset-0 flex items-center justify-end pr-2">
                          <span className="text-xs font-semibold text-white">
                            {item.value.toFixed(1)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Tooltip */}
                  {isHovered && showMetadata && item.metadata && (
                    <div className="absolute top-10 left-0 z-10 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-lg p-3 shadow-lg min-w-48">
                      <div className="space-y-1">
                        <div className="font-semibold">{item.label}</div>
                        {item.metadata.company && (
                          <div className="flex items-center space-x-1">
                            <span className="text-gray-300">Компания:</span>
                            <span>{item.metadata.company}</span>
                          </div>
                        )}
                        <div className="flex items-center space-x-1">
                          <Award className="h-3 w-3" />
                          <span className="text-gray-300">Балл:</span>
                          <span className="font-semibold">{item.value.toFixed(1)}</span>
                        </div>
                        {item.metadata.price && (
                          <div className="flex items-center space-x-1">
                            <DollarSign className="h-3 w-3" />
                            <span className="text-gray-300">Цена:</span>
                            <span>{item.metadata.price.toLocaleString()} ₽</span>
                          </div>
                        )}
                        {item.metadata.timeline && (
                          <div className="flex items-center space-x-1">
                            <Clock className="h-3 w-3" />
                            <span className="text-gray-300">Срок:</span>
                            <span>{item.metadata.timeline}</span>
                          </div>
                        )}
                        {item.metadata.compliance && (
                          <div className="flex items-center space-x-1">
                            <TrendingUp className="h-3 w-3" />
                            <span className="text-gray-300">Соответствие:</span>
                            <span>{item.metadata.compliance}%</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Значение */}
                <div className="w-16 text-right">
                  <div className="text-sm font-semibold text-gray-900 dark:text-white">
                    {item.value.toFixed(1)}
                  </div>
                  {item.maxValue && (
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      из {item.maxValue}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderHorizontalChart = () => (
    <div className="flex" style={{ height: `${height}px` }}>
      {/* Ось Y (метки) */}
      <div className="flex flex-col justify-between py-4 pr-4 text-sm text-gray-700 dark:text-gray-300">
        {normalizedData.map((item, index) => (
          <div key={index} className="flex items-center h-8">
            <span className="truncate max-w-24">{item.label}</span>
          </div>
        ))}
      </div>

      {/* График */}
      <div className="flex-1 relative">
        {/* Сетка */}
        <div className="absolute inset-0 flex flex-col justify-between">
          {[0, 25, 50, 75, 100].map(percent => (
            <div key={percent} className="border-t border-gray-200 dark:border-gray-600 border-dashed opacity-30" />
          ))}
        </div>

        {/* Столбцы */}
        <div className="flex flex-col justify-between h-full py-4">
          {normalizedData.map((item, index) => {
            const color = item.color || defaultColors[index % defaultColors.length];
            const isHovered = hoveredIndex === index;
            
            return (
              <div
                key={index}
                className="relative h-8 group"
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                <div className="bg-gray-200 dark:bg-gray-700 rounded h-6 overflow-hidden">
                  <div
                    className="h-full rounded transition-all duration-1000 ease-out flex items-center justify-end pr-2"
                    style={{
                      width: `${item.normalizedValue}%`,
                      backgroundColor: color,
                      animationDelay: `${animationDelay + index * 100}ms`,
                      transform: isHovered ? 'scaleY(1.2)' : 'scaleY(1)',
                    }}
                  >
                    {showValues && (
                      <span className="text-xs font-semibold text-white">
                        {item.value.toFixed(1)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Ось X (значения) */}
        <div className="flex justify-between pt-2 text-xs text-gray-500 dark:text-gray-400">
          {[0, 25, 50, 75, 100].map(percent => {
            const maxValue = Math.max(...normalizedData.map(d => d.maxValue || d.value));
            const value = (percent / 100) * maxValue;
            return (
              <span key={percent}>
                {value.toFixed(0)}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg p-6 ${className}`}>
      {title && (
        <div className="flex items-center space-x-2 mb-6">
          <BarChart3 className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {title}
          </h3>
        </div>
      )}

      {orientation === 'vertical' ? renderVerticalChart() : renderHorizontalChart()}
    </div>
  );
};

// Компонент для группового сравнения
export const GroupedBarChart: React.FC<{
  data: Array<{
    label: string;
    groups: Array<{
      name: string;
      value: number;
      color?: string;
    }>;
  }>;
  title?: string;
  className?: string;
  height?: number;
  showLegend?: boolean;
}> = ({ data, title, className = '', height = 300, showLegend = true }) => {
  if (!data || data.length === 0) {
    return (
      <div className={`flex flex-col items-center justify-center p-8 bg-white dark:bg-gray-800 rounded-lg ${className}`}>
        <AlertCircle className="h-12 w-12 text-gray-400 mb-4" />
        <p className="text-gray-500 dark:text-gray-400 text-center">
          Нет данных для отображения
        </p>
      </div>
    );
  }

  const allValues = data.flatMap(item => item.groups.map(group => group.value));
  const maxValue = Math.max(...allValues);
  
  const defaultColors = [
    'rgb(59, 130, 246)',   // blue
    'rgb(16, 185, 129)',   // green
    'rgb(245, 158, 11)',   // amber
    'rgb(239, 68, 68)',    // red
    'rgb(139, 92, 246)',   // purple
  ];

  // Получение всех уникальных групп для легенды
  const allGroups = Array.from(
    new Set(data.flatMap(item => item.groups.map(group => group.name)))
  );

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg p-6 ${className}`}>
      {title && (
        <div className="flex items-center space-x-2 mb-6">
          <BarChart3 className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {title}
          </h3>
        </div>
      )}

      {showLegend && (
        <div className="flex flex-wrap gap-4 mb-6">
          {allGroups.map((groupName, index) => (
            <div key={groupName} className="flex items-center space-x-2">
              <div 
                className="w-3 h-3 rounded"
                style={{ backgroundColor: defaultColors[index % defaultColors.length] }}
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {groupName}
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="space-y-6" style={{ height: `${height}px`, overflowY: 'auto' }}>
        {data.map((item, itemIndex) => (
          <div key={itemIndex} className="space-y-2">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white">
              {item.label}
            </h4>
            
            <div className="flex space-x-2">
              {item.groups.map((group, groupIndex) => {
                const color = group.color || defaultColors[
                  allGroups.indexOf(group.name) % defaultColors.length
                ];
                const heightPercent = (group.value / maxValue) * 100;
                
                return (
                  <div
                    key={groupIndex}
                    className="flex-1 bg-gray-200 dark:bg-gray-700 rounded overflow-hidden relative group"
                    style={{ minHeight: '60px' }}
                  >
                    <div
                      className="w-full transition-all duration-1000 ease-out flex items-end justify-center"
                      style={{
                        height: `${Math.max(heightPercent, 5)}%`,
                        backgroundColor: color,
                        minHeight: '20px'
                      }}
                    >
                      <span className="text-xs font-semibold text-white p-1">
                        {group.value.toFixed(1)}
                      </span>
                    </div>
                    
                    {/* Tooltip */}
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white text-xs rounded p-2 whitespace-nowrap pointer-events-none">
                      {group.name}: {group.value.toFixed(1)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BarChart;