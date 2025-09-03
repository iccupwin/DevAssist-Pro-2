/**
 * Budget Table Component for KP Analyzer v2  
 * Displays cost breakdown in tabular format
 */

import React from 'react';
import { TrendingUp, DollarSign } from 'lucide-react';
import { ExtractedFinancials, CurrencyInfo } from '../../types/analysis.types';

interface BudgetTableProps {
  breakdown: ExtractedFinancials['costBreakdown'];
  className?: string;
}

export const BudgetTable: React.FC<BudgetTableProps> = ({
  breakdown,
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

  const getCategoryName = (key: string): string => {
    const names = {
      development: 'Разработка',
      infrastructure: 'Инфраструктура', 
      support: 'Поддержка',
      testing: 'Тестирование',
      deployment: 'Внедрение',
      project_management: 'Управление проектом',
      design: 'Дизайн',
      documentation: 'Документация'
    };
    return names[key as keyof typeof names] || key;
  };

  const categories = Object.entries(breakdown).filter(([_, value]) => value && !Array.isArray(value));
  const otherItems = breakdown.other || [];

  if (categories.length === 0 && otherItems.length === 0) {
    return (
      <div className={`bg-gray-50 rounded-lg p-6 text-center ${className}`}>
        <DollarSign className="w-8 h-8 text-gray-400 mx-auto mb-2" />
        <p className="text-gray-600">Детализация бюджета не найдена</p>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center gap-2">
        <TrendingUp className="w-5 h-5 text-green-600" />
        <h4 className="text-lg font-semibold text-gray-900">Разбивка расходов</h4>
      </div>

      {/* Main Categories */}
      {categories.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">Категория</span>
              <span className="text-sm font-medium text-gray-700">Стоимость</span>
            </div>
          </div>
          
          <div className="divide-y divide-gray-200">
            {categories.map(([key, currency]) => (
              <div key={key} className="px-4 py-3 hover:bg-gray-50">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 rounded-full bg-blue-400"></div>
                    <span className="text-sm font-medium text-gray-900">
                      {getCategoryName(key)}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-gray-900">
                      {formatCurrency(currency as CurrencyInfo)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {(currency as CurrencyInfo).code}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Other Items */}
      {otherItems.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="bg-yellow-50 px-4 py-3 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-yellow-800">Прочие расходы</span>
              <span className="text-xs text-yellow-600">{otherItems.length} позиций</span>
            </div>
          </div>
          
          <div className="divide-y divide-gray-200">
            {otherItems.slice(0, 5).map((currency, index) => (
              <div key={index} className="px-4 py-2 hover:bg-gray-50">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">
                    {currency.originalText || `Позиция ${index + 1}`}
                  </span>
                  <div className="text-sm font-medium text-gray-900">
                    {formatCurrency(currency)}
                  </div>
                </div>
              </div>
            ))}
            {otherItems.length > 5 && (
              <div className="px-4 py-2 text-center text-xs text-gray-500">
                И еще {otherItems.length - 5} позиций...
              </div>
            )}
          </div>
        </div>
      )}

      {/* Summary */}
      <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
        <div className="text-center">
          <div className="text-sm text-blue-700">Найдено категорий расходов</div>
          <div className="text-2xl font-bold text-blue-800">
            {categories.length + (otherItems.length > 0 ? 1 : 0)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BudgetTable;