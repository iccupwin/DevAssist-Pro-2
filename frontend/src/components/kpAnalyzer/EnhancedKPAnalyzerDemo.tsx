/**
 * Enhanced KP Analyzer Demo - Showcase of new modern UI and functionality
 * Demonstrates: Card design, currency support, realistic progress, interactive sections
 */

import React, { useState } from 'react';
import { 
  Play, 
  FileText, 
  Sparkles, 
  TrendingUp,
  Clock,
  Users,
  Target,
  Shield,
  Brain,
  Globe,
  MessageSquare,
  Cog,
  Award,
  RefreshCw
} from 'lucide-react';

// Import our new enhanced components
import EnhancedResultsDisplay from './EnhancedResultsDisplay';
import EnhancedAnalysisProgress from './EnhancedAnalysisProgress';
import ScoreCard from './ScoreCard';
import { CurrencyGroup, CurrencyStats } from './EnhancedCurrencyDisplay';
import BudgetTable from './BudgetTable';
import { EnhancedKpAnalysisService } from '../../services/enhancedKpAnalysisService';
import { ComprehensiveAnalysisResult, ProgressUpdate, CurrencyInfo } from '../../types/enhancedKpAnalyzer';

type DemoStep = 'intro' | 'analysis' | 'results';

export const EnhancedKPAnalyzerDemo: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<DemoStep>('intro');
  const [progress, setProgress] = useState<ProgressUpdate>({
    stage: 'upload',
    progress: 0,
    message: 'Готов к запуску',
    timeElapsed: 0
  });
  const [analysisResult, setAnalysisResult] = useState<ComprehensiveAnalysisResult | null>(null);

  // Demo data
  const demoCurrencies: CurrencyInfo[] = [
    {
      code: 'KGS',
      symbol: 'сом',
      name: 'Кыргызский сом',
      amount: 2500000,
      originalText: '2 500 000 сом',
      position: 100
    },
    {
      code: 'USD',
      symbol: '$',
      name: 'Доллар США',
      amount: 30000,
      originalText: '$30,000',
      position: 200
    },
    {
      code: 'EUR',
      symbol: '€',
      name: 'Евро',
      amount: 25000,
      originalText: '€25,000',
      position: 300
    }
  ];

  const demoMockKPText = `
Коммерческое предложение от компании "ИнноТех Решения"

Разработка веб-портала для автоматизации бизнес-процессов

Общая стоимость проекта: 2 500 000 сом
Альтернативный бюджет: $30,000 или €25,000

Этапы разработки:
1. Аналитика и проектирование - 350 000 сом (2 недели)
2. Backend разработка - 800 000 сом (4 недели) 
3. Frontend разработка - 750 000 сом (3 недели)
4. Тестирование и отладка - 300 000 сом (2 недели)
5. Развертывание и настройка - 200 000 сом (1 неделя)
6. Документация и обучение - 100 000 сом (1 неделя)

Технологии: React, Node.js, PostgreSQL, Docker, AWS
Команда: 5 специалистов (TeamLead, 2 разработчика, дизайнер, тестировщик)
Срок выполнения: 3 месяца

Условия оплаты: 30% предоплата, 70% по результатам этапов
`;

  const handleStartDemo = async () => {
    setCurrentStep('analysis');
    setProgress({
      stage: 'extraction',
      progress: 0,
      message: 'Начинаем демонстрационный анализ...',
      timeElapsed: 0
    });

    try {
      const result = await EnhancedKpAnalysisService.startComprehensiveAnalysis(
        demoMockKPText,
        undefined, // No TZ for demo
        {
          aiModel: 'claude-3-5-sonnet',
          detailLevel: 'comprehensive',
          includeFinancialAnalysis: true,
          includeTechnicalDeepDive: true,
          includeRiskAssessment: true,
          includeComplianceAnalysis: false
        },
        (progressUpdate) => {
          setProgress(progressUpdate);
        }
      );

      setAnalysisResult(result);
      setCurrentStep('results');
    } catch (error) {
      console.error('Demo analysis failed:', error);
    }
  };

  const handleNewDemo = () => {
    setCurrentStep('intro');
    setAnalysisResult(null);
    setProgress({
      stage: 'upload',
      progress: 0,
      message: 'Готов к запуску',
      timeElapsed: 0
    });
  };

  const renderIntroStep = () => (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center space-y-6">
        <div className="flex justify-center mb-6">
          <div className="bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 p-6 rounded-2xl">
            <Sparkles className="w-16 h-16 text-white" />
          </div>
        </div>
        
        <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
          🚀 КП Анализатор v2.0
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
          Кардинально улучшенный дизайн и функциональность с современными UI компонентами, 
          поддержкой валют включая KGS и реалистичным временем анализа
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-12">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-lg">
            <div className="text-blue-500 mb-4">
              <Award className="w-8 h-8" />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
              Современный UI
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Карточки, таблицы, интерактивные элементы вместо сплошного текста
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-lg">
            <div className="text-green-500 mb-4">
              <TrendingUp className="w-8 h-8" />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
              8 Валют
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              KGS, RUB, USD, EUR, KZT, UZS, TJS, UAH с правильным форматированием
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-lg">
            <div className="text-purple-500 mb-4">
              <Clock className="w-8 h-8" />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
              Реальное время
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              15-45 секунд анализа с прогрессом по разделам
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-lg">
            <div className="text-orange-500 mb-4">
              <Brain className="w-8 h-8" />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
              Claude AI
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Настоящие Claude 3.5 Sonnet вызовы для точного анализа
            </p>
          </div>
        </div>
      </div>

      {/* Features Showcase */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-lg border border-gray-200 dark:border-gray-700">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
          ✨ Что нового в v2.0
        </h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Score Cards Demo */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Award className="w-5 h-5 text-blue-500" />
              Карточки оценок
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <ScoreCard
                title="Общая оценка"
                score={85}
                icon={<Award className="w-4 h-4" />}
                trend="up"
                compact
              />
              <ScoreCard
                title="Соответствие ТЗ"
                score={72}
                icon={<Target className="w-4 h-4" />}
                trend="stable"
                compact
              />
            </div>
          </div>

          {/* Currency Display Demo */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-500" />
              Поддержка валют
            </h3>
            <CurrencyGroup
              currencies={demoCurrencies}
              title="Обнаруженные валюты"
              showTotal
            />
          </div>
        </div>

        {/* Budget Table Demo */}
        <div className="mt-8">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-purple-500" />
            Структурированные таблицы
          </h3>
          <BudgetTable
            items={[
              {
                id: '1',
                category: 'Разработка',
                kpAmount: demoCurrencies[0],
                deviation: 5,
                status: 'good'
              },
              {
                id: '2', 
                category: 'Тестирование',
                kpAmount: { ...demoCurrencies[0], amount: 300000 },
                deviation: -2,
                status: 'excellent'
              }
            ]}
            showComparison={false}
            showTotal={false}
          />
        </div>
      </div>

      {/* Start Demo Button */}
      <div className="text-center">
        <button
          onClick={handleStartDemo}
          className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white rounded-xl font-semibold text-lg hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl"
        >
          <Play className="w-6 h-6" />
          Запустить демонстрацию
        </button>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-4">
          Демо использует реальный анализ с временем обработки 25-35 секунд
        </p>
      </div>

      {/* Technical Details */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          🛠️ Технические улучшения
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">UI Компоненты</h4>
            <ul className="space-y-1 text-gray-600 dark:text-gray-400">
              <li>• ScoreCard с прогресс-барами</li>
              <li>• BudgetTable с сортировкой</li>
              <li>• ModernAnalysisSection</li>
              <li>• CurrencyDisplay для 8 валют</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">Валютная система</h4>
            <ul className="space-y-1 text-gray-600 dark:text-gray-400">
              <li>• Кыргызский сом (KGS)</li>
              <li>• Автоматическое извлечение</li>
              <li>• Конвертация в USD</li>
              <li>• Статистика и группировка</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">AI Интеграция</h4>
            <ul className="space-y-1 text-gray-600 dark:text-gray-400">
              <li>• Claude 3.5 Sonnet API</li>
              <li>• WebSocket прогресс</li>
              <li>• 10 разделов анализа</li>
              <li>• Структурированные данные</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );

  const renderAnalysisStep = () => (
    <EnhancedAnalysisProgress
      progress={progress}
      isActive={currentStep === 'analysis'}
      onCancel={handleNewDemo}
      documentName="Демо КП - ИнноТех Решения"
      estimatedDuration={30}
    />
  );

  const renderResultsStep = () => (
    analysisResult && (
      <EnhancedResultsDisplay
        result={analysisResult}
        onNewAnalysis={handleNewDemo}
        onExportPDF={() => alert('PDF экспорт будет реализован в полной версии')}
        onShare={() => alert('Функция поделиться будет реализована в полной версии')}
      />
    )
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-purple-900/20 py-8 px-4">
      {/* Progress indicator */}
      <div className="max-w-6xl mx-auto mb-8">
        <div className="flex items-center justify-center space-x-4">
          {(['intro', 'analysis', 'results'] as const).map((step, index) => (
            <div
              key={step}
              className={`flex items-center ${index > 0 ? 'ml-4' : ''}`}
            >
              {index > 0 && (
                <div className={`h-0.5 w-8 mx-2 ${
                  (['intro', 'analysis'].indexOf(currentStep) >= index || currentStep === 'results') 
                    ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'
                }`} />
              )}
              <div className={`
                w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                ${currentStep === step
                  ? 'bg-blue-500 text-white'
                  : (['intro', 'analysis'].indexOf(currentStep) > index || currentStep === 'results')
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-400'
                }
              `}>
                {index + 1}
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-center space-x-16 mt-2 text-sm text-gray-600 dark:text-gray-400">
          <span>Введение</span>
          <span>Анализ</span>
          <span>Результаты</span>
        </div>
      </div>

      {/* Content */}
      {currentStep === 'intro' && renderIntroStep()}
      {currentStep === 'analysis' && renderAnalysisStep()}
      {currentStep === 'results' && renderResultsStep()}

      {/* Footer */}
      <div className="text-center mt-12 text-sm text-gray-500 dark:text-gray-400">
        <p>
          КП Анализатор v2.0 - Enhanced version with 10 detailed analysis sections
        </p>
        <p className="mt-2">
          Современный дизайн • Поддержка валют • Реальные Claude AI вызовы • Интерактивность
        </p>
      </div>
    </div>
  );
};

export default EnhancedKPAnalyzerDemo;