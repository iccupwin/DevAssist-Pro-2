/**
 * RadarChart - Радиальная диаграмма для отображения оценок по критериям
 * Согласно ТЗ DevAssist Pro
 */

import React, { useMemo } from 'react';
import { BarChart3, TrendingUp, AlertCircle } from 'lucide-react';

interface RadarDataPoint {
  label: string;
  value: number;
  maxValue: number;
  color?: string;
}

interface RadarChartProps {
  data: RadarDataPoint[];
  size?: number;
  className?: string;
  title?: string;
  showValues?: boolean;
  showGrid?: boolean;
  animationDelay?: number;
}

export const RadarChart: React.FC<RadarChartProps> = ({
  data,
  size = 300,
  className = '',
  title,
  showValues = true,
  showGrid = true,
  animationDelay = 0
}) => {
  const center = size / 2;
  const radius = Math.min(size / 2 - 40, 120);
  const gridLevels = 5;

  // Вычисление точек для полигона
  const points = useMemo(() => {
    if (!data || data.length === 0) return '';

    return data.map((item, index) => {
      const angle = (index * 2 * Math.PI) / data.length - Math.PI / 2;
      const normalizedValue = Math.min(item.value / item.maxValue, 1);
      const pointRadius = normalizedValue * radius;
      
      const x = center + pointRadius * Math.cos(angle);
      const y = center + pointRadius * Math.sin(angle);
      
      return `${x},${y}`;
    }).join(' ');
  }, [data, center, radius]);

  // Генерация сетки
  const gridCircles = useMemo(() => {
    return Array.from({ length: gridLevels }, (_, i) => {
      const circleRadius = ((i + 1) / gridLevels) * radius;
      return (
        <circle
          key={i}
          cx={center}
          cy={center}
          r={circleRadius}
          fill="none"
          stroke="currentColor"
          strokeWidth="0.5"
          className="text-gray-300 dark:text-gray-600"
          opacity={0.3}
        />
      );
    });
  }, [center, radius, gridLevels]);

  // Генерация осей
  const axisLines = useMemo(() => {
    if (!data || data.length === 0) return [];

    return data.map((_, index) => {
      const angle = (index * 2 * Math.PI) / data.length - Math.PI / 2;
      const x2 = center + radius * Math.cos(angle);
      const y2 = center + radius * Math.sin(angle);

      return (
        <line
          key={index}
          x1={center}
          y1={center}
          x2={x2}
          y2={y2}
          stroke="currentColor"
          strokeWidth="0.5"
          className="text-gray-300 dark:text-gray-600"
          opacity={0.3}
        />
      );
    });
  }, [data, center, radius]);

  // Генерация меток
  const labels = useMemo(() => {
    if (!data || data.length === 0) return [];

    return data.map((item, index) => {
      const angle = (index * 2 * Math.PI) / data.length - Math.PI / 2;
      const labelRadius = radius + 25;
      const x = center + labelRadius * Math.cos(angle);
      const y = center + labelRadius * Math.sin(angle);

      // Определение выравнивания текста
      let textAnchor: 'start' | 'middle' | 'end' = 'middle';
      if (x < center - 10) textAnchor = 'end';
      else if (x > center + 10) textAnchor = 'start';

      return (
        <g key={index}>
          <text
            x={x}
            y={y}
            textAnchor={textAnchor}
            dominantBaseline="middle"
            className="text-xs font-medium text-gray-700 dark:text-gray-300"
            fill="currentColor"
          >
            {item.label}
          </text>
          {showValues && (
            <text
              x={x}
              y={y + 12}
              textAnchor={textAnchor}
              dominantBaseline="middle"
              className="text-xs text-gray-500 dark:text-gray-400"
              fill="currentColor"
            >
              {item.value.toFixed(1)}/{item.maxValue}
            </text>
          )}
        </g>
      );
    });
  }, [data, center, radius, showValues]);

  // Статистика
  const stats = useMemo(() => {
    if (!data || data.length === 0) return null;

    const total = data.reduce((sum, item) => sum + item.value, 0);
    const maxTotal = data.reduce((sum, item) => sum + item.maxValue, 0);
    const average = total / data.length;
    const maxAverage = maxTotal / data.length;
    const completionRate = (total / maxTotal) * 100;

    return {
      total,
      maxTotal,
      average,
      maxAverage,
      completionRate
    };
  }, [data]);

  if (!data || data.length === 0) {
    return (
      <div className={`flex flex-col items-center justify-center p-8 ${className}`}>
        <AlertCircle className="h-12 w-12 text-gray-400 mb-4" />
        <p className="text-gray-500 dark:text-gray-400 text-center">
          Нет данных для отображения
        </p>
      </div>
    );
  }

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

      <div className="flex flex-col lg:flex-row items-center space-y-6 lg:space-y-0 lg:space-x-8">
        {/* График */}
        <div className="flex-shrink-0">
          <svg width={size} height={size} className="overflow-visible">
            {/* Сетка */}
            {showGrid && (
              <g>
                {gridCircles}
                {axisLines}
              </g>
            )}

            {/* Область данных */}
            <polygon
              points={points}
              fill="rgba(59, 130, 246, 0.1)"
              stroke="rgb(59, 130, 246)"
              strokeWidth="2"
              className="transition-all duration-1000"
              style={{
                animationDelay: `${animationDelay}ms`,
                transformOrigin: `${center}px ${center}px`
              }}
            />

            {/* Точки данных */}
            {data.map((item, index) => {
              const angle = (index * 2 * Math.PI) / data.length - Math.PI / 2;
              const normalizedValue = Math.min(item.value / item.maxValue, 1);
              const pointRadius = normalizedValue * radius;
              const x = center + pointRadius * Math.cos(angle);
              const y = center + pointRadius * Math.sin(angle);

              return (
                <circle
                  key={index}
                  cx={x}
                  cy={y}
                  r="4"
                  fill={item.color || "rgb(59, 130, 246)"}
                  stroke="white"
                  strokeWidth="2"
                  className="transition-all duration-1000 hover:r-6"
                  style={{
                    animationDelay: `${animationDelay + index * 100}ms`,
                  }}
                />
              );
            })}

            {/* Метки */}
            {labels}
          </svg>
        </div>

        {/* Статистика */}
        {stats && (
          <div className="flex-1 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Общий балл
                  </span>
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.total.toFixed(1)}
                  <span className="text-sm text-gray-500 dark:text-gray-400 ml-1">
                    / {stats.maxTotal}
                  </span>
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <BarChart3 className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Средний балл
                  </span>
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.average.toFixed(1)}
                  <span className="text-sm text-gray-500 dark:text-gray-400 ml-1">
                    / {stats.maxAverage.toFixed(1)}
                  </span>
                </div>
              </div>
            </div>

            {/* Прогресс-бар */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Выполнение критериев
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {stats.completionRate.toFixed(0)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-1000"
                  style={{ 
                    width: `${Math.min(stats.completionRate, 100)}%`,
                    animationDelay: `${animationDelay + 500}ms`
                  }}
                />
              </div>
            </div>

            {/* Детализация по критериям */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Детализация по критериям:
              </h4>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {data.map((item, index) => (
                  <div key={index} className="flex items-center justify-between text-xs">
                    <span className="text-gray-600 dark:text-gray-400 truncate flex-1">
                      {item.label}
                    </span>
                    <span className="text-gray-800 dark:text-gray-200 ml-2">
                      {item.value.toFixed(1)}/{item.maxValue}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Компонент сравнения нескольких RadarChart
export const RadarChartComparison: React.FC<{
  datasets: Array<{
    name: string;
    data: RadarDataPoint[];
    color?: string;
  }>;
  size?: number;
  title?: string;
  className?: string;
}> = ({ datasets, size = 300, title, className = '' }) => {
  const center = size / 2;
  const radius = Math.min(size / 2 - 40, 120);

  if (!datasets || datasets.length === 0) {
    return (
      <div className={`flex flex-col items-center justify-center p-8 ${className}`}>
        <AlertCircle className="h-12 w-12 text-gray-400 mb-4" />
        <p className="text-gray-500 dark:text-gray-400 text-center">
          Нет данных для сравнения
        </p>
      </div>
    );
  }

  const colors = [
    'rgb(59, 130, 246)',    // blue
    'rgb(16, 185, 129)',    // green  
    'rgb(245, 158, 11)',    // yellow
    'rgb(239, 68, 68)',     // red
    'rgb(139, 92, 246)',    // purple
  ];

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

      <div className="flex flex-col lg:flex-row items-start space-y-6 lg:space-y-0 lg:space-x-8">
        {/* График */}
        <div className="flex-shrink-0">
          <svg width={size} height={size} className="overflow-visible">
            {/* Сетка */}
            <g>
              {Array.from({ length: 5 }, (_, i) => (
                <circle
                  key={i}
                  cx={center}
                  cy={center}
                  r={((i + 1) / 5) * radius}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="0.5"
                  className="text-gray-300 dark:text-gray-600"
                  opacity={0.3}
                />
              ))}
              
              {datasets[0]?.data.map((_, index) => {
                const angle = (index * 2 * Math.PI) / datasets[0].data.length - Math.PI / 2;
                const x2 = center + radius * Math.cos(angle);
                const y2 = center + radius * Math.sin(angle);

                return (
                  <line
                    key={index}
                    x1={center}
                    y1={center}
                    x2={x2}
                    y2={y2}
                    stroke="currentColor"
                    strokeWidth="0.5"
                    className="text-gray-300 dark:text-gray-600"
                    opacity={0.3}
                  />
                );
              })}
            </g>

            {/* Полигоны для каждого датасета */}
            {datasets.map((dataset, datasetIndex) => {
              const points = dataset.data.map((item, index) => {
                const angle = (index * 2 * Math.PI) / dataset.data.length - Math.PI / 2;
                const normalizedValue = Math.min(item.value / item.maxValue, 1);
                const pointRadius = normalizedValue * radius;
                
                const x = center + pointRadius * Math.cos(angle);
                const y = center + pointRadius * Math.sin(angle);
                
                return `${x},${y}`;
              }).join(' ');

              const color = dataset.color || colors[datasetIndex % colors.length];

              return (
                <g key={datasetIndex}>
                  <polygon
                    points={points}
                    fill={color.replace('rgb', 'rgba').replace(')', ', 0.1)')}
                    stroke={color}
                    strokeWidth="2"
                    className="transition-all duration-1000"
                  />
                  
                  {dataset.data.map((item, index) => {
                    const angle = (index * 2 * Math.PI) / dataset.data.length - Math.PI / 2;
                    const normalizedValue = Math.min(item.value / item.maxValue, 1);
                    const pointRadius = normalizedValue * radius;
                    const x = center + pointRadius * Math.cos(angle);
                    const y = center + pointRadius * Math.sin(angle);

                    return (
                      <circle
                        key={index}
                        cx={x}
                        cy={y}
                        r="3"
                        fill={color}
                        stroke="white"
                        strokeWidth="1"
                      />
                    );
                  })}
                </g>
              );
            })}

            {/* Метки */}
            {datasets[0]?.data.map((item, index) => {
              const angle = (index * 2 * Math.PI) / datasets[0].data.length - Math.PI / 2;
              const labelRadius = radius + 25;
              const x = center + labelRadius * Math.cos(angle);
              const y = center + labelRadius * Math.sin(angle);

              let textAnchor: 'start' | 'middle' | 'end' = 'middle';
              if (x < center - 10) textAnchor = 'end';
              else if (x > center + 10) textAnchor = 'start';

              return (
                <text
                  key={index}
                  x={x}
                  y={y}
                  textAnchor={textAnchor}
                  dominantBaseline="middle"
                  className="text-xs font-medium text-gray-700 dark:text-gray-300"
                  fill="currentColor"
                >
                  {item.label}
                </text>
              );
            })}
          </svg>
        </div>

        {/* Легенда */}
        <div className="flex-1 space-y-4">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Сравниваемые КП:
          </h4>
          <div className="space-y-2">
            {datasets.map((dataset, index) => {
              const color = dataset.color || colors[index % colors.length];
              const total = dataset.data.reduce((sum, item) => sum + item.value, 0);
              const maxTotal = dataset.data.reduce((sum, item) => sum + item.maxValue, 0);
              const completionRate = (total / maxTotal) * 100;

              return (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: color }}
                    />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {dataset.name}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-gray-900 dark:text-white">
                      {total.toFixed(1)} / {maxTotal}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {completionRate.toFixed(0)}%
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RadarChart;