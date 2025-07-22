/**
 * PieChart - Круговая диаграмма для распределения бюджета и анализа
 * Согласно ТЗ DevAssist Pro
 */

import React, { useMemo, useState } from 'react';
import { PieChart as PieChartIcon, DollarSign, Percent, AlertCircle } from 'lucide-react';

interface PieChartDataPoint {
  label: string;
  value: number;
  color?: string;
  metadata?: {
    percentage?: number;
    description?: string;
    amount?: number;
    currency?: string;
  };
}

interface PieChartProps {
  data: PieChartDataPoint[];
  title?: string;
  className?: string;
  size?: number;
  showValues?: boolean;
  showPercentages?: boolean;
  showLegend?: boolean;
  donutMode?: boolean;
  animationDelay?: number;
  centerContent?: React.ReactNode;
}

export const PieChart: React.FC<PieChartProps> = ({
  data,
  title,
  className = '',
  size = 300,
  showValues = true,
  showPercentages = true,
  showLegend = true,
  donutMode = false,
  animationDelay = 0,
  centerContent
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  
  const defaultColors = [
    'rgb(59, 130, 246)',   // blue
    'rgb(16, 185, 129)',   // green
    'rgb(245, 158, 11)',   // amber
    'rgb(239, 68, 68)',    // red
    'rgb(139, 92, 246)',   // purple
    'rgb(236, 72, 153)',   // pink
    'rgb(14, 165, 233)',   // sky
    'rgb(34, 197, 94)',    // emerald
    'rgb(168, 85, 247)',   // violet
    'rgb(251, 146, 60)',   // orange
  ];

  // Подготовка данных
  const processedData = useMemo(() => {
    if (!data || data.length === 0) return [];

    const total = data.reduce((sum, item) => sum + item.value, 0);
    let currentAngle = -90; // Начинаем сверху

    return data.map((item, index) => {
      const percentage = (item.value / total) * 100;
      const angle = (item.value / total) * 360;
      const color = item.color || defaultColors[index % defaultColors.length];
      
      const result = {
        ...item,
        percentage,
        startAngle: currentAngle,
        endAngle: currentAngle + angle,
        color,
        total
      };
      
      currentAngle += angle;
      return result;
    });
  }, [data, defaultColors]);

  // Создание SVG path для сегмента
  const createArcPath = (
    centerX: number,
    centerY: number,
    radius: number,
    startAngle: number,
    endAngle: number,
    innerRadius = 0
  ) => {
    const start = {
      x: centerX + radius * Math.cos((startAngle * Math.PI) / 180),
      y: centerY + radius * Math.sin((startAngle * Math.PI) / 180)
    };
    
    const end = {
      x: centerX + radius * Math.cos((endAngle * Math.PI) / 180),
      y: centerY + radius * Math.sin((endAngle * Math.PI) / 180)
    };

    const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';

    if (innerRadius > 0) {
      // Donut mode
      const innerStart = {
        x: centerX + innerRadius * Math.cos((startAngle * Math.PI) / 180),
        y: centerY + innerRadius * Math.sin((startAngle * Math.PI) / 180)
      };
      
      const innerEnd = {
        x: centerX + innerRadius * Math.cos((endAngle * Math.PI) / 180),
        y: centerY + innerRadius * Math.sin((endAngle * Math.PI) / 180)
      };

      return [
        'M', start.x, start.y,
        'A', radius, radius, 0, largeArcFlag, 1, end.x, end.y,
        'L', innerEnd.x, innerEnd.y,
        'A', innerRadius, innerRadius, 0, largeArcFlag, 0, innerStart.x, innerStart.y,
        'Z'
      ].join(' ');
    } else {
      // Normal pie mode
      return [
        'M', centerX, centerY,
        'L', start.x, start.y,
        'A', radius, radius, 0, largeArcFlag, 1, end.x, end.y,
        'Z'
      ].join(' ');
    }
  };

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

  const center = size / 2;
  const radius = Math.min(size / 2 - 20, 120);
  const innerRadius = donutMode ? radius * 0.5 : 0;

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg p-6 ${className}`}>
      {title && (
        <div className="flex items-center space-x-2 mb-6">
          <PieChartIcon className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {title}
          </h3>
        </div>
      )}

      <div className="flex flex-col lg:flex-row items-center space-y-6 lg:space-y-0 lg:space-x-8">
        {/* Диаграмма */}
        <div className="flex-shrink-0 relative">
          <svg width={size} height={size} className="transform transition-transform">
            {processedData.map((item, index) => {
              const isHovered = hoveredIndex === index;
              const path = createArcPath(
                center,
                center,
                isHovered ? radius + 5 : radius,
                item.startAngle,
                item.endAngle,
                innerRadius
              );

              // Позиция для метки
              const midAngle = (item.startAngle + item.endAngle) / 2;
              const labelRadius = radius + 25;
              const labelX = center + labelRadius * Math.cos((midAngle * Math.PI) / 180);
              const labelY = center + labelRadius * Math.sin((midAngle * Math.PI) / 180);

              return (
                <g key={index}>
                  <path
                    d={path}
                    fill={item.color}
                    stroke="white"
                    strokeWidth="2"
                    className="transition-all duration-300 cursor-pointer"
                    onMouseEnter={() => setHoveredIndex(index)}
                    onMouseLeave={() => setHoveredIndex(null)}
                    style={{
                      opacity: isHovered ? 0.8 : 1,
                      filter: isHovered ? 'brightness(1.1)' : 'none',
                      animationDelay: `${animationDelay + index * 100}ms`
                    }}
                  />
                  
                  {/* Значения на диаграмме */}
                  {showValues && item.percentage > 5 && (
                    <text
                      x={center + (radius * 0.7) * Math.cos((midAngle * Math.PI) / 180)}
                      y={center + (radius * 0.7) * Math.sin((midAngle * Math.PI) / 180)}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      className="text-xs font-semibold fill-white"
                      style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.5)' }}
                    >
                      {showPercentages ? `${item.percentage.toFixed(1)}%` : item.value}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>

          {/* Центральный контент для donut режима */}
          {donutMode && centerContent && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                {centerContent}
              </div>
            </div>
          )}

          {/* Центральная статистика по умолчанию */}
          {donutMode && !centerContent && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {processedData[0]?.total.toLocaleString()}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Всего
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Легенда */}
        {showLegend && (
          <div className="flex-1 space-y-3">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Распределение:
            </h4>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {processedData.map((item, index) => {
                const isHovered = hoveredIndex === index;
                
                return (
                  <div
                    key={index}
                    className={`flex items-center justify-between p-3 rounded-lg transition-all cursor-pointer ${
                      isHovered 
                        ? 'bg-gray-100 dark:bg-gray-700 shadow-sm' 
                        : 'bg-gray-50 dark:bg-gray-750 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                    onMouseEnter={() => setHoveredIndex(index)}
                    onMouseLeave={() => setHoveredIndex(null)}
                  >
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      <div 
                        className="w-4 h-4 rounded-full flex-shrink-0"
                        style={{ backgroundColor: item.color }}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {item.label}
                        </div>
                        {item.metadata?.description && (
                          <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {item.metadata.description}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="text-right flex-shrink-0">
                      <div className="text-sm font-semibold text-gray-900 dark:text-white">
                        {item.metadata?.amount 
                          ? `${item.metadata.amount.toLocaleString()} ${item.metadata.currency || '₽'}`
                          : item.value.toLocaleString()
                        }
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {item.percentage.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Общая статистика */}
            <div className="border-t border-gray-200 dark:border-gray-600 pt-3 mt-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Итого:
                </span>
                <span className="text-sm font-bold text-gray-900 dark:text-white">
                  {processedData[0]?.total.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Компонент для сравнения нескольких круговых диаграмм
export const PieChartComparison: React.FC<{
  datasets: Array<{
    title: string;
    data: PieChartDataPoint[];
    total?: number;
  }>;
  title?: string;
  className?: string;
  size?: number;
}> = ({ datasets, title, className = '', size = 200 }) => {
  if (!datasets || datasets.length === 0) {
    return (
      <div className={`flex flex-col items-center justify-center p-8 bg-white dark:bg-gray-800 rounded-lg ${className}`}>
        <AlertCircle className="h-12 w-12 text-gray-400 mb-4" />
        <p className="text-gray-500 dark:text-gray-400 text-center">
          Нет данных для сравнения
        </p>
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg p-6 ${className}`}>
      {title && (
        <div className="flex items-center space-x-2 mb-6">
          <PieChartIcon className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {title}
          </h3>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {datasets.map((dataset, index) => (
          <div key={index} className="text-center">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              {dataset.title}
            </h4>
            
            <PieChart
              data={dataset.data}
              size={size}
              showLegend={false}
              donutMode={true}
              centerContent={
                <div>
                  <div className="text-lg font-bold text-gray-900 dark:text-white">
                    {(dataset.total || dataset.data.reduce((sum, item) => sum + item.value, 0)).toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Всего
                  </div>
                </div>
              }
            />
            
            {/* Мини-легенда */}
            <div className="mt-3 space-y-1">
              {dataset.data.slice(0, 3).map((item, itemIndex) => {
                const total = dataset.data.reduce((sum, d) => sum + d.value, 0);
                const percentage = (item.value / total) * 100;
                
                return (
                  <div key={itemIndex} className="flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-2">
                      <div 
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-gray-600 dark:text-gray-400 truncate">
                        {item.label}
                      </span>
                    </div>
                    <span className="text-gray-800 dark:text-gray-200">
                      {percentage.toFixed(0)}%
                    </span>
                  </div>
                );
              })}
              {dataset.data.length > 3 && (
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  +{dataset.data.length - 3} ещё
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PieChart;