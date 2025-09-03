import React, { useState, useEffect } from 'react';
import { Palette, CheckCircle, AlertTriangle, XCircle, RefreshCw } from 'lucide-react';
import { 
  validateColorSystem, 
  getColorSystemStats, 
  getColorSystemRecommendations,
  colorCombinations
} from '../../utils/colorValidator';
import { cn } from '../../lib/utils';

interface ColorSystemValidatorProps {
  isVisible?: boolean;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

/**
 * Компонент для валидации цветовой системы приложения
 */
export const ColorSystemValidator: React.FC<ColorSystemValidatorProps> = ({
  isVisible = process.env.NODE_ENV === 'development',
  position = 'bottom-left'
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [results, setResults] = useState<ReturnType<typeof validateColorSystem>>([]);
  const [stats, setStats] = useState<ReturnType<typeof getColorSystemStats>>({
    total: 0,
    passed: 0,
    failed: 0,
    aaCompliant: 0,
    aaaCompliant: 0,
    largeTextAA: 0,
    largeTextAAA: 0
  });
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [filter, setFilter] = useState<'all' | 'passed' | 'failed'>('all');
  const [isValidating, setIsValidating] = useState(false);

  const validateSystem = async () => {
    setIsValidating(true);
    
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const validationResults = validateColorSystem();
    const systemStats = getColorSystemStats();
    const systemRecommendations = getColorSystemRecommendations();
    
    setResults(validationResults);
    setStats(systemStats);
    setRecommendations(systemRecommendations);
    setIsValidating(false);
  };

  useEffect(() => {
    if (isVisible) {
      validateSystem();
    }
  }, [isVisible]);

  const getPositionClasses = () => {
    const baseClasses = 'fixed z-40 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-w-lg';
    
    switch (position) {
      case 'top-left':
        return `${baseClasses} top-4 left-4`;
      case 'top-right':
        return `${baseClasses} top-4 right-4`;
      case 'bottom-left':
        return `${baseClasses} bottom-4 left-4`;
      case 'bottom-right':
        return `${baseClasses} bottom-4 right-4`;
      default:
        return `${baseClasses} bottom-4 left-4`;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'fail':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pass':
        return 'text-green-600';
      case 'fail':
        return 'text-red-600';
      default:
        return 'text-yellow-600';
    }
  };

  const filteredResults = results.filter(result => {
    switch (filter) {
      case 'passed':
        return result.status === 'pass';
      case 'failed':
        return result.status === 'fail';
      default:
        return true;
    }
  });

  if (!isVisible) return null;

  return (
    <div className={cn(getPositionClasses())}>
      {/* Заголовок */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <Palette className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          <h3 className="font-semibold text-gray-900 dark:text-white">
            Цветовая система
          </h3>
          {stats.total > 0 && (
            <span className={cn(
              'px-2 py-1 rounded-full text-xs font-medium',
              stats.failed > 0 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
            )}>
              {stats.passed}/{stats.total}
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={validateSystem}
            disabled={isValidating}
            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title="Проверить заново"
          >
            <RefreshCw className={cn('w-4 h-4 text-gray-500', isValidating && 'animate-spin')} />
          </button>
          
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            {isExpanded ? '▼' : '▶'}
          </button>
        </div>
      </div>

      {/* Содержимое */}
      {isExpanded && (
        <div className="p-4 max-h-96 overflow-y-auto">
          {/* Статистика */}
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="text-center">
              <div className="text-xl font-bold text-green-600">{stats.aaCompliant}</div>
              <div className="text-xs text-gray-500">AA совместимых</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-blue-600">{stats.aaaCompliant}</div>
              <div className="text-xs text-gray-500">AAA совместимых</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-red-600">{stats.failed}</div>
              <div className="text-xs text-gray-500">Проблемных</div>
            </div>
          </div>

          {/* Рекомендации */}
          {recommendations.length > 0 && (
            <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <h4 className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">
                Рекомендации по улучшению
              </h4>
              <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
                {recommendations.slice(0, 3).map((rec, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-yellow-600 dark:text-yellow-400">•</span>
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Фильтры */}
          <div className="flex gap-2 mb-4">
            {['all', 'passed', 'failed'].map(filterType => (
              <button
                key={filterType}
                onClick={() => setFilter(filterType as typeof filter)}
                className={cn(
                  'px-3 py-1 rounded-full text-xs font-medium transition-colors',
                  filter === filterType
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300'
                )}
              >
                {filterType === 'all' ? 'Все' : 
                 filterType === 'passed' ? 'Прошедшие' : 'Проблемные'}
              </button>
            ))}
          </div>

          {/* Список цветовых комбинаций */}
          <div className="space-y-2">
            {filteredResults.map((result, index) => (
              <div
                key={index}
                className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(result.status)}
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {result.name}
                    </span>
                  </div>
                  <span className={cn(
                    'text-xs font-mono',
                    getStatusColor(result.status)
                  )}>
                    {result.contrastRatio.toFixed(1)}:1
                  </span>
                </div>
                
                {/* Цветовые образцы */}
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex items-center gap-1">
                    <div
                      className="w-4 h-4 rounded border border-gray-300"
                      style={{ backgroundColor: result.text }}
                      title={`Текст: ${result.text}`}
                    />
                    <span className="text-xs font-mono text-gray-600 dark:text-gray-400">
                      {result.text}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500">на</span>
                  <div className="flex items-center gap-1">
                    <div
                      className="w-4 h-4 rounded border border-gray-300"
                      style={{ backgroundColor: result.bg }}
                      title={`Фон: ${result.bg}`}
                    />
                    <span className="text-xs font-mono text-gray-600 dark:text-gray-400">
                      {result.bg}
                    </span>
                  </div>
                </div>

                {/* Соответствие WCAG */}
                <div className="flex items-center gap-4 text-xs">
                  <div className={cn(
                    'flex items-center gap-1',
                    result.normalText.aa ? 'text-green-600' : 'text-red-600'
                  )}>
                    {result.normalText.aa ? '✓' : '✗'} AA обычный текст
                  </div>
                  <div className={cn(
                    'flex items-center gap-1',
                    result.largeText.aa ? 'text-green-600' : 'text-red-600'
                  )}>
                    {result.largeText.aa ? '✓' : '✗'} AA крупный текст
                  </div>
                  <div className={cn(
                    'flex items-center gap-1',
                    result.normalText.aaa ? 'text-blue-600' : 'text-gray-400'
                  )}>
                    {result.normalText.aaa ? '✓' : '✗'} AAA
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Информация о стандартах */}
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
              Стандарты WCAG 2.1
            </h4>
            <div className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
              <div>• AA обычный текст: минимум 4.5:1</div>
              <div>• AA крупный текст: минимум 3:1</div>
              <div>• AAA обычный текст: минимум 7:1</div>
              <div>• AAA крупный текст: минимум 4.5:1</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ColorSystemValidator;