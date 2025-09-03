/**
 * Executive Budget Summary Component - DevAssist Pro
 * 🎯 Отображение сравнения бюджетов ТЗ и КП с отклонениями
 * 
 * Возможности:
 * - Визуальное сравнение бюджетов ТЗ и КП
 * - Расчет и отображение отклонений
 * - Цветовая индикация статуса (зеленый/желтый/красный)
 * - Поддержка различных валют (RUB, USD, EUR, KGS, KZT)
 * - Адаптивный дизайн для мобильных устройств
 */

import React from 'react';
import { TrendingUp, TrendingDown, AlertCircle, CheckCircle, Minus } from 'lucide-react';

// Интерфейс для валютных данных
interface CurrencyAmount {
  amount: number;
  currency: string;
  formatted: string;
}

// Интерфейс для данных бюджета
interface BudgetData {
  tz_budget?: CurrencyAmount;
  kp_budget?: CurrencyAmount;
  deviation_amount?: number;
  deviation_percentage?: number;
  status?: 'excellent' | 'good' | 'warning' | 'critical';
}

interface BudgetSummaryProps {
  budgetData: BudgetData;
  className?: string;
}

// Функция для форматирования валюты
const formatCurrency = (amount: number, currency: string): string => {
  const currencySymbols: Record<string, string> = {
    'RUB': '₽',
    'RUB.': '₽',
    'руб': '₽',
    'рублей': '₽',
    'USD': '$',
    'EUR': '€',
    'KGS': 'сом',
    'KZT': '₸',
    'тенге': '₸'
  };

  const symbol = currencySymbols[currency.toUpperCase()] || currency;
  
  return new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount) + ' ' + symbol;
};

// Функция для определения статуса на основе отклонения
const getDeviationStatus = (deviationPercentage: number): 'excellent' | 'good' | 'warning' | 'critical' => {
  const absDeviation = Math.abs(deviationPercentage);
  
  if (absDeviation <= 5) return 'excellent';
  if (absDeviation <= 15) return 'good';
  if (absDeviation <= 30) return 'warning';
  return 'critical';
};

// Функция для получения цвета статуса
const getStatusColor = (status: string) => {
  switch (status) {
    case 'excellent': return {
      bg: 'bg-green-50',
      border: 'border-green-200',
      text: 'text-green-800',
      icon: 'text-green-600',
      label: 'Отличное соответствие'
    };
    case 'good': return {
      bg: 'bg-blue-50',
      border: 'border-blue-200', 
      text: 'text-blue-800',
      icon: 'text-blue-600',
      label: 'Хорошее соответствие'
    };
    case 'warning': return {
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      text: 'text-yellow-800', 
      icon: 'text-yellow-600',
      label: 'Требует внимания'
    };
    case 'critical': return {
      bg: 'bg-red-50',
      border: 'border-red-200',
      text: 'text-red-800',
      icon: 'text-red-600',
      label: 'Критическое отклонение'
    };
    default: return {
      bg: 'bg-gray-50',
      border: 'border-gray-200',
      text: 'text-gray-800',
      icon: 'text-gray-600',
      label: 'Не определено'
    };
  }
};

const BudgetSummary: React.FC<BudgetSummaryProps> = ({ 
  budgetData,
  className = "" 
}) => {
  // Расчет отклонений если не переданы
  const calculateDeviation = () => {
    if (!budgetData.tz_budget || !budgetData.kp_budget) {
      return { amount: 0, percentage: 0 };
    }

    const tzAmount = budgetData.tz_budget.amount;
    const kpAmount = budgetData.kp_budget.amount;
    
    const deviationAmount = kpAmount - tzAmount;
    const deviationPercentage = tzAmount > 0 ? (deviationAmount / tzAmount) * 100 : 0;
    
    return {
      amount: deviationAmount,
      percentage: deviationPercentage
    };
  };

  const deviation = {
    amount: budgetData.deviation_amount ?? calculateDeviation().amount,
    percentage: budgetData.deviation_percentage ?? calculateDeviation().percentage
  };

  const status = budgetData.status || getDeviationStatus(deviation.percentage);
  const statusColors = getStatusColor(status);

  // Иконка для отклонения
  const DeviationIcon = () => {
    if (Math.abs(deviation.percentage) <= 2) return <Minus className="h-5 w-5" />;
    if (deviation.percentage > 0) return <TrendingUp className="h-5 w-5" />;
    return <TrendingDown className="h-5 w-5" />;
  };

  // Статусная иконка
  const StatusIcon = () => {
    switch (status) {
      case 'excellent': case 'good': return <CheckCircle className="h-6 w-6" />;
      default: return <AlertCircle className="h-6 w-6" />;
    }
  };

  return (
    <div className={`bg-white rounded-xl shadow-lg border p-6 mb-8 ${className}`}>
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          ИСПОЛНИТЕЛЬНАЯ СВОДКА ПО БЮДЖЕТУ
        </h2>
        <p className="text-gray-600">
          Сравнение планируемых и предложенных затрат по проекту
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* Бюджет ТЗ */}
        <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
          <div className="text-center">
            <div className="text-sm font-medium text-blue-600 mb-2">
              БЮДЖЕТ ПО ТЗ
            </div>
            <div className="text-3xl font-bold text-blue-800 mb-2">
              {budgetData.tz_budget?.formatted || 
               (budgetData.tz_budget ? 
                 formatCurrency(budgetData.tz_budget.amount, budgetData.tz_budget.currency) : 
                 'Не указан')}
            </div>
            <div className="text-xs text-blue-600">
              Планируемые затраты
            </div>
          </div>
        </div>

        {/* Бюджет КП */}
        <div className="bg-purple-50 p-6 rounded-lg border border-purple-200">
          <div className="text-center">
            <div className="text-sm font-medium text-purple-600 mb-2">
              БЮДЖЕТ ПО КП
            </div>
            <div className="text-3xl font-bold text-purple-800 mb-2">
              {budgetData.kp_budget?.formatted || 
               (budgetData.kp_budget ? 
                 formatCurrency(budgetData.kp_budget.amount, budgetData.kp_budget.currency) : 
                 'Не указан')}
            </div>
            <div className="text-xs text-purple-600">
              Предложенная стоимость
            </div>
          </div>
        </div>

        {/* Отклонение */}
        <div className={`p-6 rounded-lg border ${statusColors.bg} ${statusColors.border}`}>
          <div className="text-center">
            <div className={`text-sm font-medium mb-2 ${statusColors.text}`}>
              ОТКЛОНЕНИЕ
            </div>
            <div className={`text-3xl font-bold mb-2 flex items-center justify-center gap-2 ${statusColors.text}`}>
              <DeviationIcon />
              {deviation.percentage.toFixed(1)}%
            </div>
            <div className={`text-xs ${statusColors.text}`}>
              {Math.abs(deviation.amount) > 0 && budgetData.kp_budget ? 
                formatCurrency(Math.abs(deviation.amount), budgetData.kp_budget.currency) : 
                'В пределах нормы'}
            </div>
          </div>
        </div>
      </div>

      {/* Статус и рекомендации */}
      <div className={`p-4 rounded-lg ${statusColors.bg} ${statusColors.border} border`}>
        <div className="flex items-center justify-center gap-3 mb-3">
          <div className={statusColors.icon}>
            <StatusIcon />
          </div>
          <div className={`font-semibold ${statusColors.text}`}>
            {statusColors.label}
          </div>
        </div>
        
        <div className="text-center">
          <div className={`text-sm ${statusColors.text}`}>
            {status === 'excellent' && 'Предложенный бюджет полностью соответствует планируемым затратам. Отличный показатель для принятия решения.'}
            {status === 'good' && 'Предложенный бюджет находится в приемлемых рамках отклонения от планируемого.'}
            {status === 'warning' && 'Отклонение превышает комфортные рамки. Рекомендуется детальный анализ причин расхождения.'}
            {status === 'critical' && 'Критическое отклонение от планируемого бюджета. Требуется пересмотр предложения или корректировка ТЗ.'}
          </div>
        </div>
      </div>

      {/* Дополнительная аналитика */}
      {(budgetData.tz_budget && budgetData.kp_budget) && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center text-sm">
            <div>
              <div className="font-medium text-gray-600">Экономия</div>
              <div className={`font-bold ${deviation.amount < 0 ? 'text-green-600' : 'text-gray-400'}`}>
                {deviation.amount < 0 ? formatCurrency(Math.abs(deviation.amount), budgetData.kp_budget.currency) : '0'}
              </div>
            </div>
            <div>
              <div className="font-medium text-gray-600">Превышение</div>
              <div className={`font-bold ${deviation.amount > 0 ? 'text-red-600' : 'text-gray-400'}`}>
                {deviation.amount > 0 ? formatCurrency(deviation.amount, budgetData.kp_budget.currency) : '0'}
              </div>
            </div>
            <div>
              <div className="font-medium text-gray-600">Соответствие</div>
              <div className="font-bold text-blue-600">
                {Math.max(0, 100 - Math.abs(deviation.percentage)).toFixed(0)}%
              </div>
            </div>
            <div>
              <div className="font-medium text-gray-600">Статус</div>
              <div className={`font-bold ${statusColors.text}`}>
                {status === 'excellent' && '✅'}
                {status === 'good' && '✓'}
                {status === 'warning' && '⚠️'}
                {status === 'critical' && '❌'}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BudgetSummary;