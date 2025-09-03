import React, { useState, useEffect } from 'react';
import { Eye, AlertTriangle, CheckCircle, RefreshCw, X } from 'lucide-react';
import { scanPageContrast, getContrastRecommendations, suggestBetterColors } from '../../utils/contrastChecker';
import { cn } from '../../lib/utils';

interface ContrastAnalyzerProps {
  isVisible?: boolean;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  autoScan?: boolean;
}

/**
 * Компонент для анализа контрастности текста на странице
 */
export const ContrastAnalyzer: React.FC<ContrastAnalyzerProps> = ({
  isVisible = process.env.NODE_ENV === 'development',
  position = 'top-right',
  autoScan = true
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [results, setResults] = useState<ReturnType<typeof scanPageContrast>>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    passed: 0,
    failed: 0,
    aaCompliant: 0,
    aaaCompliant: 0
  });
  const [selectedElement, setSelectedElement] = useState<typeof results[0] | null>(null);
  const [filter, setFilter] = useState<'all' | 'passed' | 'failed'>('all');

  const scanContrast = async () => {
    setIsScanning(true);
    
    // Небольшая задержка для UI
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const scanResults = scanPageContrast();
    setResults(scanResults);
    
    // Вычисляем статистику
    const newStats = {
      total: scanResults.length,
      passed: scanResults.filter(r => r.analysis.compliance.aa).length,
      failed: scanResults.filter(r => !r.analysis.compliance.aa).length,
      aaCompliant: scanResults.filter(r => r.analysis.compliance.aa).length,
      aaaCompliant: scanResults.filter(r => r.analysis.compliance.aaa).length
    };
    
    setStats(newStats);
    setIsScanning(false);
  };

  useEffect(() => {
    if (isVisible && autoScan) {
      scanContrast();
    }
  }, [isVisible, autoScan]);

  const getPositionClasses = () => {
    const baseClasses = 'fixed z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-w-md';
    
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
        return `${baseClasses} top-4 right-4`;
    }
  };

  const getContrastColor = (ratio: number) => {
    if (ratio >= 7) return 'text-green-600';
    if (ratio >= 4.5) return 'text-yellow-600';
    if (ratio >= 3) return 'text-orange-600';
    return 'text-red-600';
  };

  const getContrastIcon = (compliance: { aa: boolean; aaa: boolean }) => {
    if (compliance.aaa) return <CheckCircle className="w-4 h-4 text-green-500" />;
    if (compliance.aa) return <CheckCircle className="w-4 h-4 text-yellow-500" />;
    return <AlertTriangle className="w-4 h-4 text-red-500" />;
  };

  const filteredResults = results.filter(result => {
    switch (filter) {
      case 'passed':
        return result.analysis.compliance.aa;
      case 'failed':
        return !result.analysis.compliance.aa;
      default:
        return true;
    }
  });

  const highlightElement = (element: HTMLElement) => {
    // Убираем предыдущее выделение
    document.querySelectorAll('.contrast-highlight').forEach(el => {
      el.classList.remove('contrast-highlight');
    });
    
    // Добавляем выделение
    element.classList.add('contrast-highlight');
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    
    // Убираем выделение через 3 секунды
    setTimeout(() => {
      element.classList.remove('contrast-highlight');
    }, 3000);
  };

  if (!isVisible) return null;

  return (
    <>
      {/* Стили для выделения */}
      <style>
        {`
          .contrast-highlight {
            outline: 3px solid #ef4444 !important;
            outline-offset: 2px !important;
            background-color: rgba(239, 68, 68, 0.1) !important;
            animation: pulse 2s infinite;
          }
          
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
        `}
      </style>

      <div className={cn(getPositionClasses())}>
        {/* Заголовок */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <Eye className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Контрастность
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
              onClick={scanContrast}
              disabled={isScanning}
              className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title="Пересканировать"
            >
              <RefreshCw className={cn('w-4 h-4 text-gray-500', isScanning && 'animate-spin')} />
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
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{stats.aaCompliant}</div>
                <div className="text-xs text-gray-500">AA совместимых</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{stats.aaaCompliant}</div>
                <div className="text-xs text-gray-500">AAA совместимых</div>
              </div>
            </div>

            {/* Фильтры */}
            <div className="flex gap-2 mb-4">
              {['all', 'passed', 'failed'].map(filterType => (
                <button
                  key={filterType}
                  onClick={() => setFilter(filterType as typeof filter)}
                  className={cn(
                    'px-3 py-1 rounded-full text-xs font-medium transition-colors',
                    filter === filterType
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300'
                  )}
                >
                  {filterType === 'all' ? 'Все' : 
                   filterType === 'passed' ? 'Прошедшие' : 'Проблемные'}
                </button>
              ))}
            </div>

            {/* Список элементов */}
            <div className="space-y-2">
              {filteredResults.slice(0, 20).map((result, index) => (
                <div
                  key={index}
                  className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                  onClick={() => {
                    setSelectedElement(result);
                    highlightElement(result.element);
                  }}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      {getContrastIcon(result.analysis.compliance)}
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {result.element.tagName.toLowerCase()}
                      </span>
                    </div>
                    <span className={cn(
                      'text-xs font-mono',
                      getContrastColor(result.analysis.contrastRatio)
                    )}>
                      {result.analysis.contrastRatio.toFixed(1)}:1
                    </span>
                  </div>
                  
                  <div className="text-xs text-gray-600 dark:text-gray-400 truncate">
                    {result.element.textContent?.slice(0, 40)}...
                  </div>
                  
                  <div className="flex items-center gap-2 mt-1">
                    <div
                      className="w-3 h-3 rounded border border-gray-300"
                      style={{ backgroundColor: result.analysis.textColor }}
                      title={`Текст: ${result.analysis.textColor}`}
                    />
                    <div
                      className="w-3 h-3 rounded border border-gray-300"
                      style={{ backgroundColor: result.analysis.backgroundColor }}
                      title={`Фон: ${result.analysis.backgroundColor}`}
                    />
                  </div>
                </div>
              ))}
              
              {filteredResults.length > 20 && (
                <div className="text-center text-sm text-gray-500 dark:text-gray-400">
                  Показано 20 из {filteredResults.length} элементов
                </div>
              )}
            </div>
          </div>
        )}

        {/* Детали выбранного элемента */}
        {selectedElement && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  Детали контрастности
                </h3>
                <button
                  onClick={() => setSelectedElement(null)}
                  className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>
              
              <div className="p-4 space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">Элемент</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {selectedElement.selector}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {selectedElement.element.textContent?.slice(0, 100)}...
                  </p>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">Цвета</h4>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-8 h-8 rounded border border-gray-300"
                        style={{ backgroundColor: selectedElement.analysis.textColor }}
                      />
                      <span className="text-sm font-mono">
                        {selectedElement.analysis.textColor}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-8 h-8 rounded border border-gray-300"
                        style={{ backgroundColor: selectedElement.analysis.backgroundColor }}
                      />
                      <span className="text-sm font-mono">
                        {selectedElement.analysis.backgroundColor}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">Контрастность</h4>
                  <div className="flex items-center gap-2">
                    {getContrastIcon(selectedElement.analysis.compliance)}
                    <span className={cn(
                      'font-mono text-lg',
                      getContrastColor(selectedElement.analysis.contrastRatio)
                    )}>
                      {selectedElement.analysis.contrastRatio.toFixed(2)}:1
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Размер текста: {selectedElement.analysis.textSize}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">Рекомендации</h4>
                  <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                    {getContrastRecommendations(selectedElement.analysis).map((rec, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-blue-600 dark:text-blue-400">•</span>
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">Лучшие комбинации</h4>
                  <div className="space-y-2">
                    {suggestBetterColors(
                      selectedElement.analysis.textColor,
                      selectedElement.analysis.backgroundColor
                    ).slice(0, 3).map((suggestion, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-700 rounded">
                        <div
                          className="w-6 h-6 rounded border border-gray-300"
                          style={{ backgroundColor: suggestion.textColor }}
                        />
                        <div
                          className="w-6 h-6 rounded border border-gray-300"
                          style={{ backgroundColor: suggestion.backgroundColor }}
                        />
                        <span className="text-sm font-mono">
                          {suggestion.contrast.toFixed(1)}:1
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default ContrastAnalyzer;