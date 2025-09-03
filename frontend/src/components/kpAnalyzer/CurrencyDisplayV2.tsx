/**
 * Currency Display Component for KP Analyzer v2
 * Enhanced display for financial data with multi-currency support
 */

import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { ExtractedFinancials, CurrencyInfo } from '../../types/analysis.types';

interface CurrencyDisplayProps {
  financials: ExtractedFinancials;
  className?: string;
}

export const CurrencyDisplay: React.FC<CurrencyDisplayProps> = ({
  financials,
  className = ''
}) => {
  const formatCurrency = (currency: CurrencyInfo): string => {
    const formatter = new Intl.NumberFormat('ru-RU', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    });
    const formattedAmount = formatter.format(currency.amount);
    
    switch (currency.code) {
      case 'USD':
      case 'EUR':
        return `${currency.symbol}${formattedAmount}`;
      default:
        return `${formattedAmount} ${currency.symbol}`;
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Total Budget */}
      {financials.totalBudget && (
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <h4 className="text-sm font-medium text-blue-900 mb-1">Общий бюджет</h4>
          <div className="text-2xl font-bold text-blue-800">
            {formatCurrency(financials.totalBudget)}
          </div>
          {financials.totalBudget.originalText && (
            <div className="text-xs text-blue-600 mt-1">
              Источник: "{financials.totalBudget.originalText}"
            </div>
          )}
        </div>
      )}

      {/* All Currencies Found */}
      {financials.currencies.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-gray-900">
            Найдено валют ({financials.currencies.length})
          </h4>
          
          <div className="grid grid-cols-1 gap-2">
            {financials.currencies.map((currency, index) => (
              <div 
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                    <span className="text-xs font-medium text-gray-700">
                      {currency.code}
                    </span>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">
                      {formatCurrency(currency)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {currency.name}
                    </div>
                  </div>
                </div>
                
                {currency === financials.totalBudget && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    Основной
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Payment Terms */}
      {financials.paymentTerms.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-gray-900">Условия оплаты</h4>
          <div className="space-y-1">
            {financials.paymentTerms.slice(0, 3).map((term, index) => (
              <div key={index} className="text-sm text-gray-600 bg-gray-50 rounded px-3 py-2">
                {term}
              </div>
            ))}
            {financials.paymentTerms.length > 3 && (
              <div className="text-xs text-gray-500 px-3">
                И еще {financials.paymentTerms.length - 3} условий...
              </div>
            )}
          </div>
        </div>
      )}

      {/* Financial Notes */}
      {financials.financialNotes.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-gray-900">Важные заметки</h4>
          <div className="space-y-1">
            {financials.financialNotes.slice(0, 2).map((note, index) => (
              <div key={index} className="text-sm text-amber-800 bg-amber-50 rounded px-3 py-2 border border-amber-200">
                {note}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Currency Statistics */}
      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
        <h4 className="text-sm font-semibold text-gray-900 mb-3">Статистика валют</h4>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {financials.currencies.length}
            </div>
            <div className="text-xs text-gray-600">Валют найдено</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {new Set(financials.currencies.map(c => c.code)).size}
            </div>
            <div className="text-xs text-gray-600">Уникальных валют</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CurrencyDisplay;