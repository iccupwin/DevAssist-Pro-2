import React, { useState, useEffect } from 'react';
import { Ruler, AlertTriangle, CheckCircle, RefreshCw, Settings } from 'lucide-react';
import { cn } from '../../lib/utils';

interface DesignIssue {
  type: 'spacing' | 'typography' | 'color' | 'border' | 'shadow';
  severity: 'error' | 'warning' | 'info';
  element: HTMLElement;
  message: string;
  recommendation?: string;
  expectedValue?: string;
  actualValue?: string;
  selector: string;
}

interface DesignConsistencyAuditorProps {
  isVisible?: boolean;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  autoScan?: boolean;
}

/**
 * Аудитор единообразия дизайна
 */
export const DesignConsistencyAuditor: React.FC<DesignConsistencyAuditorProps> = ({
  isVisible = process.env.NODE_ENV === 'development',
  position = 'bottom-right',
  autoScan = true
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [issues, setIssues] = useState<DesignIssue[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [filter, setFilter] = useState<'all' | 'error' | 'warning' | 'info'>('all');
  const [selectedIssue, setSelectedIssue] = useState<DesignIssue | null>(null);

  // Правила дизайна для проверки
  const designRules = {
    spacing: {
      // Стандартные отступы: 4, 8, 16, 24, 32, 48px
      allowed: [4, 8, 16, 24, 32, 48],
      properties: ['margin', 'padding', 'gap']
    },
    typography: {
      // Стандартные размеры шрифта
      allowedSizes: [12, 14, 16, 18, 20, 24, 30, 36, 48],
      allowedWeights: ['400', '500', '600', '700'],
      allowedLineHeights: ['1.25', '1.5', '1.75']
    },
    colors: {
      // Разрешенные цвета из палитры
      allowed: [
        '#2563eb', '#1d4ed8', '#1e40af', // primary
        '#64748b', '#475569', '#334155', // secondary
        '#10b981', '#059669', '#047857', // success
        '#f59e0b', '#d97706', '#b45309', // warning
        '#ef4444', '#dc2626', '#b91c1c', // error
        '#3b82f6', '#2563eb', '#1d4ed8', // info
        '#ffffff', '#f9fafb', '#f3f4f6', '#e5e7eb', // grays
        '#000000', '#111827', '#1f2937', '#374151'
      ]
    },
    borderRadius: {
      // Стандартные радиусы
      allowed: [0, 4, 8, 12, 16, 9999]
    }
  };

  const scanDesignConsistency = async () => {
    setIsScanning(true);
    const foundIssues: DesignIssue[] = [];

    // Небольшая задержка для UI
    await new Promise(resolve => setTimeout(resolve, 100));

    // Получаем все элементы для анализа
    const elements = document.querySelectorAll('*');
    
    elements.forEach(element => {
      if (element instanceof HTMLElement) {
        const computedStyle = window.getComputedStyle(element);
        const selector = generateSelector(element);

        // Проверяем отступы
        checkSpacing(element, computedStyle, selector, foundIssues);
        
        // Проверяем типографику
        checkTypography(element, computedStyle, selector, foundIssues);
        
        // Проверяем цвета
        checkColors(element, computedStyle, selector, foundIssues);
        
        // Проверяем border-radius
        checkBorderRadius(element, computedStyle, selector, foundIssues);
      }
    });

    setIssues(foundIssues);
    setIsScanning(false);
  };

  const checkSpacing = (element: HTMLElement, style: CSSStyleDeclaration, selector: string, issues: DesignIssue[]) => {
    const spacingProperties = [
      'marginTop', 'marginRight', 'marginBottom', 'marginLeft',
      'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft'
    ];

    spacingProperties.forEach(prop => {
      const value = parseFloat(style.getPropertyValue(prop.replace(/([A-Z])/g, '-$1').toLowerCase()));
      
      if (value > 0 && !designRules.spacing.allowed.includes(value)) {
        issues.push({
          type: 'spacing',
          severity: 'warning',
          element,
          selector,
          message: `Нестандартный отступ: ${prop} = ${value}px`,
          recommendation: `Используйте стандартные отступы: ${designRules.spacing.allowed.join(', ')}px`,
          expectedValue: `Один из: ${designRules.spacing.allowed.join(', ')}px`,
          actualValue: `${value}px`
        });
      }
    });
  };

  const checkTypography = (element: HTMLElement, style: CSSStyleDeclaration, selector: string, issues: DesignIssue[]) => {
    const fontSize = parseFloat(style.fontSize);
    const fontWeight = style.fontWeight;
    const lineHeight = style.lineHeight;

    // Проверяем размер шрифта
    if (fontSize > 0 && !designRules.typography.allowedSizes.includes(fontSize)) {
      issues.push({
        type: 'typography',
        severity: 'info',
        element,
        selector,
        message: `Нестандартный размер шрифта: ${fontSize}px`,
        recommendation: `Используйте стандартные размеры: ${designRules.typography.allowedSizes.join(', ')}px`,
        expectedValue: `Один из: ${designRules.typography.allowedSizes.join(', ')}px`,
        actualValue: `${fontSize}px`
      });
    }

    // Проверяем вес шрифта
    if (fontWeight && !designRules.typography.allowedWeights.includes(fontWeight)) {
      issues.push({
        type: 'typography',
        severity: 'warning',
        element,
        selector,
        message: `Нестандартный вес шрифта: ${fontWeight}`,
        recommendation: `Используйте стандартные веса: ${designRules.typography.allowedWeights.join(', ')}`,
        expectedValue: `Один из: ${designRules.typography.allowedWeights.join(', ')}`,
        actualValue: fontWeight
      });
    }
  };

  const checkColors = (element: HTMLElement, style: CSSStyleDeclaration, selector: string, issues: DesignIssue[]) => {
    const color = style.color;
    const backgroundColor = style.backgroundColor;

    // Конвертируем RGB в HEX для проверки
    const rgbToHex = (rgb: string) => {
      const rgbMatch = rgb.match(/rgb\((\d+), (\d+), (\d+)\)/);
      if (rgbMatch) {
        const [, r, g, b] = rgbMatch;
        return `#${parseInt(r).toString(16).padStart(2, '0')}${parseInt(g).toString(16).padStart(2, '0')}${parseInt(b).toString(16).padStart(2, '0')}`;
      }
      return rgb;
    };

    // Проверяем цвет текста
    if (color && color !== 'rgba(0, 0, 0, 0)' && color !== 'transparent') {
      const hexColor = rgbToHex(color);
      if (!designRules.colors.allowed.includes(hexColor)) {
        issues.push({
          type: 'color',
          severity: 'info',
          element,
          selector,
          message: `Цвет текста не из палитры: ${color}`,
          recommendation: 'Используйте цвета из дизайн-системы',
          actualValue: color
        });
      }
    }

    // Проверяем цвет фона
    if (backgroundColor && backgroundColor !== 'rgba(0, 0, 0, 0)' && backgroundColor !== 'transparent') {
      const hexColor = rgbToHex(backgroundColor);
      if (!designRules.colors.allowed.includes(hexColor)) {
        issues.push({
          type: 'color',
          severity: 'info',
          element,
          selector,
          message: `Цвет фона не из палитры: ${backgroundColor}`,
          recommendation: 'Используйте цвета из дизайн-системы',
          actualValue: backgroundColor
        });
      }
    }
  };

  const checkBorderRadius = (element: HTMLElement, style: CSSStyleDeclaration, selector: string, issues: DesignIssue[]) => {
    const borderRadius = parseFloat(style.borderRadius);
    
    if (borderRadius > 0 && !designRules.borderRadius.allowed.includes(borderRadius)) {
      issues.push({
        type: 'border',
        severity: 'info',
        element,
        selector,
        message: `Нестандартный border-radius: ${borderRadius}px`,
        recommendation: `Используйте стандартные радиусы: ${designRules.borderRadius.allowed.join(', ')}px`,
        expectedValue: `Один из: ${designRules.borderRadius.allowed.join(', ')}px`,
        actualValue: `${borderRadius}px`
      });
    }
  };

  const generateSelector = (element: HTMLElement): string => {
    if (element.id) {
      return `#${element.id}`;
    }
    
    if (element.className) {
      return `.${element.className.split(' ').join('.')}`;
    }
    
    return element.tagName.toLowerCase();
  };

  const highlightElement = (element: HTMLElement) => {
    // Убираем предыдущее выделение
    document.querySelectorAll('.design-audit-highlight').forEach(el => {
      el.classList.remove('design-audit-highlight');
    });
    
    // Добавляем выделение
    element.classList.add('design-audit-highlight');
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    
    // Убираем выделение через 3 секунды
    setTimeout(() => {
      element.classList.remove('design-audit-highlight');
    }, 3000);
  };

  const getIssueIcon = (severity: string) => {
    switch (severity) {
      case 'error':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'info':
        return <CheckCircle className="w-4 h-4 text-blue-500" />;
      default:
        return <CheckCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getPositionClasses = () => {
    const baseClasses = 'fixed z-30 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-w-sm';
    
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
        return `${baseClasses} bottom-4 right-4`;
    }
  };

  const filteredIssues = issues.filter(issue => {
    if (filter === 'all') return true;
    return issue.severity === filter;
  });

  const stats = {
    total: issues.length,
    error: issues.filter(i => i.severity === 'error').length,
    warning: issues.filter(i => i.severity === 'warning').length,
    info: issues.filter(i => i.severity === 'info').length
  };

  useEffect(() => {
    if (isVisible && autoScan) {
      scanDesignConsistency();
    }
  }, [isVisible, autoScan]);

  if (!isVisible) return null;

  return (
    <>
      {/* Стили для выделения */}
      <style>
        {`
          .design-audit-highlight {
            outline: 2px solid #3b82f6 !important;
            outline-offset: 2px !important;
            background-color: rgba(59, 130, 246, 0.1) !important;
            animation: designPulse 2s infinite;
          }
          
          @keyframes designPulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.7; }
          }
        `}
      </style>

      <div className={cn(getPositionClasses())}>
        {/* Заголовок */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <Ruler className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Единообразие дизайна
            </h3>
            {stats.total > 0 && (
              <span className={cn(
                'px-2 py-1 rounded-full text-xs font-medium',
                stats.error > 0 ? 'bg-red-100 text-red-800' : 
                stats.warning > 0 ? 'bg-yellow-100 text-yellow-800' : 
                'bg-blue-100 text-blue-800'
              )}>
                {stats.total}
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={scanDesignConsistency}
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
            <div className="grid grid-cols-3 gap-2 mb-4">
              <div className="text-center">
                <div className="text-lg font-bold text-red-600">{stats.error}</div>
                <div className="text-xs text-gray-500">Ошибки</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-yellow-600">{stats.warning}</div>
                <div className="text-xs text-gray-500">Предупреждения</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-blue-600">{stats.info}</div>
                <div className="text-xs text-gray-500">Информация</div>
              </div>
            </div>

            {/* Фильтры */}
            <div className="flex gap-1 mb-4">
              {['all', 'error', 'warning', 'info'].map(filterType => (
                <button
                  key={filterType}
                  onClick={() => setFilter(filterType as typeof filter)}
                  className={cn(
                    'px-2 py-1 rounded text-xs font-medium transition-colors',
                    filter === filterType
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300'
                  )}
                >
                  {filterType === 'all' ? 'Все' : 
                   filterType === 'error' ? 'Ошибки' : 
                   filterType === 'warning' ? 'Предупреждения' : 'Информация'}
                </button>
              ))}
            </div>

            {/* Список проблем */}
            <div className="space-y-2">
              {filteredIssues.slice(0, 15).map((issue, index) => (
                <div
                  key={index}
                  className="p-2 bg-gray-50 dark:bg-gray-700 rounded cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                  onClick={() => {
                    setSelectedIssue(issue);
                    highlightElement(issue.element);
                  }}
                >
                  <div className="flex items-start gap-2 mb-1">
                    {getIssueIcon(issue.severity)}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {issue.type}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400 truncate">
                        {issue.message}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-500 truncate">
                        {issue.selector}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {filteredIssues.length > 15 && (
                <div className="text-center text-sm text-gray-500 dark:text-gray-400">
                  Показано 15 из {filteredIssues.length} проблем
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default DesignConsistencyAuditor;