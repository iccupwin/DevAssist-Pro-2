/**
 * Budget Summary Demo Component - DevAssist Pro
 * 🎯 Демонстрация компонента BudgetSummary с различными сценариями
 */

import React from 'react';
import BudgetSummary from './BudgetSummary';
import { CurrencyAmount } from '../../utils/currencyExtractor';

// Тестовые данные для различных сценариев
const testScenarios = [
  {
    name: 'Отличное соответствие (в пределах 5%)',
    budgetData: {
      tz_budget: {
        amount: 2500000,
        currency: 'RUB',
        formatted: '2 500 000 ₽',
        position: 0
      } as CurrencyAmount,
      kp_budget: {
        amount: 2450000,
        currency: 'RUB',
        formatted: '2 450 000 ₽',
        position: 0
      } as CurrencyAmount,
      deviation_amount: -50000,
      deviation_percentage: -2.0,
      status: 'excellent' as const
    }
  },
  {
    name: 'Хорошее соответствие (5-15%)',
    budgetData: {
      tz_budget: {
        amount: 3000000,
        currency: 'RUB',
        formatted: '3 000 000 ₽',
        position: 0
      } as CurrencyAmount,
      kp_budget: {
        amount: 3300000,
        currency: 'RUB',
        formatted: '3 300 000 ₽',
        position: 0
      } as CurrencyAmount,
      deviation_amount: 300000,
      deviation_percentage: 10.0,
      status: 'good' as const
    }
  },
  {
    name: 'Требует внимания (15-30%)',
    budgetData: {
      tz_budget: {
        amount: 1800000,
        currency: 'RUB',
        formatted: '1 800 000 ₽',
        position: 0
      } as CurrencyAmount,
      kp_budget: {
        amount: 2250000,
        currency: 'RUB',
        formatted: '2 250 000 ₽',
        position: 0
      } as CurrencyAmount,
      deviation_amount: 450000,
      deviation_percentage: 25.0,
      status: 'warning' as const
    }
  },
  {
    name: 'Критическое отклонение (>30%)',
    budgetData: {
      tz_budget: {
        amount: 2000000,
        currency: 'RUB',
        formatted: '2 000 000 ₽',
        position: 0
      } as CurrencyAmount,
      kp_budget: {
        amount: 3000000,
        currency: 'RUB',
        formatted: '3 000 000 ₽',
        position: 0
      } as CurrencyAmount,
      deviation_amount: 1000000,
      deviation_percentage: 50.0,
      status: 'critical' as const
    }
  },
  {
    name: 'Разные валюты (USD vs RUB)',
    budgetData: {
      tz_budget: {
        amount: 50000,
        currency: 'USD',
        formatted: '$50,000',
        position: 0
      } as CurrencyAmount,
      kp_budget: {
        amount: 4200000,
        currency: 'RUB',
        formatted: '4 200 000 ₽',
        position: 0
      } as CurrencyAmount,
      deviation_amount: -300000, // После конвертации
      deviation_percentage: -6.7,
      status: 'good' as const
    }
  }
];

const BudgetSummaryDemo: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Демонстрация компонента Budget Summary
          </h1>
          <p className="text-gray-600">
            Различные сценарии отображения бюджетных данных
          </p>
        </div>

        <div className="space-y-12">
          {testScenarios.map((scenario, index) => (
            <div key={index} className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-800">
                {index + 1}. {scenario.name}
              </h2>
              <BudgetSummary budgetData={scenario.budgetData} />
            </div>
          ))}
        </div>

        {/* Сценарий с отсутствующими данными */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-800">
            6. Отсутствующие данные
          </h2>
          <BudgetSummary budgetData={{}} />
        </div>

        {/* Инструкция */}
        <div className="bg-blue-50 p-6 rounded-lg border border-blue-200 mt-12">
          <h3 className="text-lg font-semibold text-blue-800 mb-4">
            🔧 Инструкция по интеграции
          </h3>
          <div className="text-sm text-blue-700 space-y-2">
            <p>
              <strong>1. Импорт:</strong> <code>import BudgetSummary from './BudgetSummary';</code>
            </p>
            <p>
              <strong>2. Использование:</strong> <code>&lt;BudgetSummary budgetData=&#123;budgetData&#125; /&gt;</code>
            </p>
            <p>
              <strong>3. Данные:</strong> Используйте функцию <code>extractBudgetData(tzText, kpText)</code>
            </p>
            <p>
              <strong>4. Статусы:</strong> excellent, good, warning, critical
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BudgetSummaryDemo;