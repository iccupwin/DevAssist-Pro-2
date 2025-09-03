/**
 * Enhanced Currency Display Component - Modern UI with 8 currency support
 * Features: KGS, RUB, USD, EUR, KZT, UZS, TJS, UAH with proper formatting
 */

import React from 'react';
import { DollarSign, Euro, TrendingUp, TrendingDown, Minus } from 'lucide-react';

export interface CurrencyInfo {
  code: 'KGS' | 'RUB' | 'USD' | 'EUR' | 'KZT' | 'UZS' | 'TJS' | 'UAH';
  symbol: string;
  name: string;
  amount: number;
  originalText?: string;
  position?: number;
}

interface CurrencyDisplayProps {
  currency: CurrencyInfo;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showName?: boolean;
  showCode?: boolean;
  trend?: 'up' | 'down' | 'stable';
  highlight?: boolean;
  className?: string;
}

interface CurrencyGroupProps {
  currencies: CurrencyInfo[];
  title?: string;
  showTotal?: boolean;
  className?: string;
}

export const CurrencyDisplay: React.FC<CurrencyDisplayProps> = ({
  currency,
  size = 'md',
  showName = false,
  showCode = true,
  trend,
  highlight = false,
  className = ''
}) => {
  const formatCurrency = (currency: CurrencyInfo): string => {
    const formatter = new Intl.NumberFormat('ru-RU', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    });

    const formattedAmount = formatter.format(currency.amount);
    
    // Currency-specific formatting
    switch (currency.code) {
      case 'KGS':
        return `${formattedAmount} сом`;
      case 'RUB':
        return `${formattedAmount} ₽`;
      case 'USD':
        return `$${formattedAmount}`;
      case 'EUR':
        return `€${formattedAmount}`;
      case 'KZT':
        return `${formattedAmount} ₸`;
      case 'UZS':
        return `${formattedAmount} сум`;
      case 'TJS':
        return `${formattedAmount} сомони`;
      case 'UAH':
        return `${formattedAmount} ₴`;
      default:
        return `${formattedAmount} ${currency.symbol}`;
    }
  };

  const getCurrencyColor = (code: CurrencyInfo['code']) => {
    const colorMap = {
      'KGS': 'text-purple-600 bg-purple-50 dark:text-purple-400 dark:bg-purple-900/20',
      'RUB': 'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/20',
      'USD': 'text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-900/20',
      'EUR': 'text-indigo-600 bg-indigo-50 dark:text-indigo-400 dark:bg-indigo-900/20',
      'KZT': 'text-yellow-600 bg-yellow-50 dark:text-yellow-400 dark:bg-yellow-900/20',
      'UZS': 'text-orange-600 bg-orange-50 dark:text-orange-400 dark:bg-orange-900/20',
      'TJS': 'text-teal-600 bg-teal-50 dark:text-teal-400 dark:bg-teal-900/20',
      'UAH': 'text-cyan-600 bg-cyan-50 dark:text-cyan-400 dark:bg-cyan-900/20'
    };
    return colorMap[code] || 'text-gray-600 bg-gray-50 dark:text-gray-400 dark:bg-gray-900/20';
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'text-sm px-2 py-1';
      case 'md':
        return 'text-base px-3 py-1.5';
      case 'lg':
        return 'text-lg px-4 py-2';
      case 'xl':
        return 'text-xl px-4 py-2';
      default:
        return 'text-base px-3 py-1.5';
    }
  };

  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-3 h-3 text-green-500 ml-1" />;
      case 'down':
        return <TrendingDown className="w-3 h-3 text-red-500 ml-1" />;
      case 'stable':
        return <Minus className="w-3 h-3 text-gray-500 ml-1" />;
      default:
        return null;
    }
  };

  const currencyColors = getCurrencyColor(currency.code);
  const sizeClasses = getSizeClasses();
  const trendIcon = getTrendIcon();

  return (
    <span
      className={`
        inline-flex items-center rounded-lg font-medium transition-all duration-200
        ${currencyColors}
        ${sizeClasses}
        ${highlight ? 'ring-2 ring-blue-500 ring-opacity-50 shadow-md' : ''}
        ${className}
      `}
    >
      <span className="font-mono">
        {formatCurrency(currency)}
      </span>
      {showCode && currency.code !== 'USD' && currency.code !== 'EUR' && (
        <span className="ml-1 text-xs opacity-75">
          ({currency.code})
        </span>
      )}
      {showName && (
        <span className="ml-2 text-xs opacity-75">
          {currency.name}
        </span>
      )}
      {trendIcon}
    </span>
  );
};

export const CurrencyGroup: React.FC<CurrencyGroupProps> = ({
  currencies,
  title,
  showTotal = false,
  className = ''
}) => {
  const convertToUSD = (currency: CurrencyInfo): number => {
    // Simplified conversion rates (in production, use real-time rates)
    const rates: Record<CurrencyInfo['code'], number> = {
      USD: 1,
      EUR: 1.08,
      RUB: 0.011,
      KGS: 0.011,
      KZT: 0.002,
      UZS: 0.000079,
      TJS: 0.091,
      UAH: 0.024
    };
    return currency.amount * (rates[currency.code] || 1);
  };

  const totalUSD = currencies.reduce((sum, currency) => sum + convertToUSD(currency), 0);
  const primaryCurrency = currencies.length > 0 ? currencies[0] : null;

  const formatUSDTotal = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {title && (
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {title}
        </h4>
      )}
      
      <div className="flex flex-wrap gap-2">
        {currencies.map((currency, index) => (
          <CurrencyDisplay
            key={index}
            currency={currency}
            highlight={index === 0} // Highlight first (primary) currency
          />
        ))}
      </div>

      {showTotal && currencies.length > 1 && (
        <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-600 dark:text-gray-400">
              Всего валют: {currencies.length}
            </span>
            <div className="text-gray-700 dark:text-gray-300 font-medium">
              ≈ {formatUSDTotal(totalUSD)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Currency statistics component
export const CurrencyStats: React.FC<{ currencies: CurrencyInfo[] }> = ({ currencies }) => {
  const stats = currencies.reduce((acc, currency) => {
    acc[currency.code] = (acc[currency.code] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const totalAmount = currencies.reduce((sum, c) => sum + c.amount, 0);
  const avgAmount = currencies.length > 0 ? totalAmount / currencies.length : 0;

  return (
    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-3">
      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
        Статистика валют
      </h4>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="text-lg font-semibold text-gray-900 dark:text-white">
            {currencies.length}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400">
            Всего упоминаний
          </div>
        </div>
        
        <div>
          <div className="text-lg font-semibold text-gray-900 dark:text-white">
            {Object.keys(stats).length}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400">
            Уникальных валют
          </div>
        </div>
      </div>

      {Object.keys(stats).length > 1 && (
        <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
          <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">
            Распределение валют:
          </div>
          <div className="space-y-1">
            {Object.entries(stats)
              .sort(([,a], [,b]) => b - a)
              .map(([currency, count]) => (
                <div key={currency} className="flex justify-between">
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {currency}
                  </span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {count} {count === 1 ? 'раз' : 'раза'}
                  </span>
                </div>
              ))
            }
          </div>
        </div>
      )}
    </div>
  );
};

export default CurrencyDisplay;