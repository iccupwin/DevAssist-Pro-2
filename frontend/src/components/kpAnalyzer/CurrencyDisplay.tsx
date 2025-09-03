/**
 * CurrencyDisplay Component
 * Displays monetary amounts with proper currency formatting
 */

import React from 'react';
import { Currency, MonetaryAmount } from '../../types/kpAnalyzer';
import { formatMonetaryAmount, getPercentageColor, formatPercentage } from '../../utils/currencyUtils';

interface CurrencyDisplayProps {
  amount?: MonetaryAmount | number;
  currency?: Currency;
  size?: 'sm' | 'md' | 'lg';
  precision?: number;
  showSymbol?: boolean;
  className?: string;
}

interface CurrencyComparisonProps {
  originalAmount: MonetaryAmount | number;
  comparisonAmount: MonetaryAmount | number;
  currency?: Currency;
  showDeviation?: boolean;
  className?: string;
}

export const CurrencyDisplay: React.FC<CurrencyDisplayProps> = ({
  amount,
  currency,
  size = 'md',
  precision = 0,
  showSymbol = true,
  className = ''
}) => {
  if (!amount) return <span className="text-gray-400">Не указано</span>;

  const getSizeClasses = () => {
    switch (size) {
      case 'sm': return 'text-sm';
      case 'lg': return 'text-lg font-medium';
      default: return 'text-base';
    }
  };

  // Handle both MonetaryAmount and number types
  if (typeof amount === 'object' && 'currency' in amount) {
    return (
      <span className={`font-mono ${getSizeClasses()} ${className}`}>
        {formatMonetaryAmount(amount.amount, amount.currency, { 
          showSymbol, 
          precision 
        })}
      </span>
    );
  }

  if (typeof amount === 'number' && currency) {
    return (
      <span className={`font-mono ${getSizeClasses()} ${className}`}>
        {formatMonetaryAmount(amount, currency, { 
          showSymbol, 
          precision 
        })}
      </span>
    );
  }

  return <span className="text-gray-400">Формат не поддерживается</span>;
};

export const CurrencyComparison: React.FC<CurrencyComparisonProps> = ({
  originalAmount,
  comparisonAmount,
  currency,
  showDeviation = true,
  className = ''
}) => {
  // Extract numeric values
  const getNumericValue = (amount: MonetaryAmount | number): number => {
    return typeof amount === 'object' ? amount.amount : amount;
  };

  const getCurrency = (amount: MonetaryAmount | number): Currency | undefined => {
    if (typeof amount === 'object' && 'currency' in amount) return amount.currency;
    return currency;
  };

  const originalValue = getNumericValue(originalAmount);
  const comparisonValue = getNumericValue(comparisonAmount);
  const useCurrency = getCurrency(originalAmount) || getCurrency(comparisonAmount);

  const deviation = originalValue > 0 ? 
    ((comparisonValue - originalValue) / originalValue * 100) : 0;

  return (
    <div className={`space-y-1 ${className}`}>
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-600">Ожидается:</span>
        <CurrencyDisplay amount={originalValue} currency={useCurrency} size="sm" />
      </div>
      
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-600">Предложено:</span>
        <CurrencyDisplay amount={comparisonValue} currency={useCurrency} size="sm" />
      </div>
      
      {showDeviation && (
        <div className="flex items-center justify-between pt-1 border-t border-gray-100">
          <span className="text-xs text-gray-500">Отклонение:</span>
          <span className={`text-xs font-medium ${getPercentageColor(deviation)}`}>
            {formatPercentage(deviation, { showSign: true })}
          </span>
        </div>
      )}
    </div>
  );
};

interface CurrencyListProps {
  currencies: Currency[];
  className?: string;
}

export const CurrencyList: React.FC<CurrencyListProps> = ({
  currencies,
  className = ''
}) => {
  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {currencies.map((currency, index) => (
        <div
          key={`${currency.code}-${index}`}
          className={`inline-flex items-center px-2 py-1 rounded-md text-xs border ${
            currency.detected 
              ? 'bg-blue-50 text-blue-700 border-blue-200' 
              : 'bg-gray-50 text-gray-600 border-gray-200'
          }`}
        >
          <span className="font-mono font-bold mr-1">{currency.symbol}</span>
          <span>{currency.code}</span>
          {currency.detected && (
            <span className="ml-1 text-blue-500">✓</span>
          )}
        </div>
      ))}
    </div>
  );
};

export default CurrencyDisplay;