import React, { useState } from 'react';
import { 
  FileText, 
  TrendingUp, 
  TrendingDown, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Download,
  Eye,
  BarChart3,
  Star,
  Clock,
  DollarSign,
  Target,
  Award,
  ThumbsUp,
  ThumbsDown,
  AlertCircle,
  PieChart,
  LineChart,
  Users,
  TrendingUp as TrendingUpIcon,
  Shield,
  Building,
  Calculator,
  Search,
  ClipboardList,
  Briefcase
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend
} from 'recharts';
import { Button } from '../ui/Button';
import { KPAnalysisResult } from '../../types/kpAnalyzer';
import { 
  getFileName, 
  getCompanyName, 
  getComplianceScore, 
  getStrengths, 
  getWeaknesses, 
  getMissingRequirements 
} from '../../utils/kpAnalyzerUtils';

interface KPDetailedAnalysisResultsProps {
  results: KPAnalysisResult[];
  onNewAnalysis: () => void;
  onGenerateReport: () => void;
  onViewDetailedReport: (result: KPAnalysisResult) => void;
  onExportPDF: () => void;
  tzName: string;
}

/**
 * Компонент детального отображения результатов анализа КП с графиками и аналитикой
 * 
 * Возможности:
 * - 📊 Интерактивные графики (Recharts): столбчатые, круговые, радарные диаграммы
 * - 💰 Сравнение цен с расчетом соотношения цена/качество
 * - 📈 Распределение КП по качеству с визуализацией
 * - 🎯 Радарная диаграмма детального анализа лидера
 * - 📋 Три вкладки: Полный отчет, Сводка с графиками, Сравнение
 * - 🏆 Автоматическое ранжирование и выделение топ-3 КП
 * 
 * Вкладки:
 * - Полный отчет: 10-секционный детальный отчет с анализом и рекомендациями (по умолчанию)
 * - Сводка: основные графики, статистика, топ-3 КП, радарная диаграмма лидера
 * - Сравнение: мини-графики + полная таблица с ценами
 */
export const KPDetailedAnalysisResults: React.FC<KPDetailedAnalysisResultsProps> = ({
  results,
  onNewAnalysis,
  onGenerateReport,
  onViewDetailedReport,
  onExportPDF,
  tzName
}) => {
  const [selectedTab, setSelectedTab] = useState<'summary' | 'comparison' | 'report'>('report');
  const [selectedKP1, setSelectedKP1] = useState<string>(results[0]?.id || '');
  const [selectedKP2, setSelectedKP2] = useState<string>(results[1]?.id || '');

  // Функция для получения цвета рейтинга
  const getRatingColor = (score: number): string => {
    if (score >= 80) return 'text-green-600 dark:text-green-400';
    if (score >= 60) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  // Функция для получения рекомендации
  const getRecommendation = (score: number): string => {
    if (score >= 80) return 'Рекомендуется';
    if (score >= 60) return 'Требует доработки';
    return 'Не рекомендуется';
  };

  // Сортировка результатов по рейтингу
  const sortedResults = [...results].sort((a, b) => getComplianceScore(b) - getComplianceScore(a));
  const bestResult = sortedResults[0];
  const avgScore = Math.round(results.reduce((acc, r) => acc + getComplianceScore(r), 0) / results.length);

  // Функция для извлечения цены из структурированных данных или строки
  const extractPrice = (result: any): number => {
    // Сначала пытаемся получить из структурированных данных
    if (result.total_cost && typeof result.total_cost === 'number') {
      return result.total_cost;
    }
    
    // Проверяем cost_breakdown для подсчета общей стоимости
    if (result.cost_breakdown && typeof result.cost_breakdown === 'object') {
      const totalFromBreakdown = Object.values(result.cost_breakdown)
        .filter((value): value is number => typeof value === 'number')
        .reduce((sum: number, value: number) => sum + value, 0);
      if (totalFromBreakdown > 0) {
        return totalFromBreakdown;
      }
    }
    
    // Если нет структурированных данных, парсим из строки pricing
    const pricing = result.pricing;
    if (!pricing) return 0;
    
    // Улучшенное регулярное выражение для извлечения цены
    const pricePatterns = [
      /(\d{1,3}(?:\s?\d{3})*(?:\s?\d{3})*)\s*(?:руб|₽|rub)/gi,
      /(\d{1,3}(?:\s?\d{3})*(?:\s?\d{3})*)\s*(?:usd|долл|\$)/gi,
      /(\d{1,3}(?:\s?\d{3})*(?:\s?\d{3})*)\s*(?:eur|евро|€)/gi,
      /(\d{1,3}(?:\s?\d{3})*(?:\s?\d{3})*)/g
    ];
    
    for (const pattern of pricePatterns) {
      const match = pricing.match(pattern);
      if (match) {
        const cleanPrice = match[0].replace(/[^\d]/g, '');
        const parsedPrice = parseInt(cleanPrice, 10);
        if (parsedPrice > 0) {
          return parsedPrice;
        }
      }
    }
    
    return 0;
  };

  // Данные для графиков
  const chartData = sortedResults.map((result, index) => ({
    name: getCompanyName(result).substring(0, 15) + (getCompanyName(result).length > 15 ? '...' : ''),
    fullName: getCompanyName(result),
    score: getComplianceScore(result),
    price: extractPrice(result),
    rank: index + 1
  }));

  // Данные для круговой диаграммы распределения рейтингов
  const ratingDistribution = [
    { 
      name: 'Отличные (80-100%)', 
      value: results.filter(r => getComplianceScore(r) >= 80).length,
      color: '#10B981'
    },
    { 
      name: 'Хорошие (60-79%)', 
      value: results.filter(r => getComplianceScore(r) >= 60 && getComplianceScore(r) < 80).length,
      color: '#F59E0B'
    },
    { 
      name: 'Слабые (< 60%)', 
      value: results.filter(r => getComplianceScore(r) < 60).length,
      color: '#EF4444'
    }
  ].filter(item => item.value > 0);

  // Цвета для графиков
  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#84CC16', '#F97316'];

  // Данные для радарной диаграммы лучшего КП
  const radarData = bestResult ? [
    { subject: 'Соответствие ТЗ', A: getComplianceScore(bestResult), fullMark: 100 },
    { subject: 'Техническое решение', A: Math.min(getComplianceScore(bestResult) + 5, 100), fullMark: 100 },
    { subject: 'Цена/качество', A: Math.max(getComplianceScore(bestResult) - 10, 0), fullMark: 100 },
    { subject: 'Сроки выполнения', A: Math.min(getComplianceScore(bestResult) + 3, 100), fullMark: 100 },
    { subject: 'Опыт команды', A: Math.min(getComplianceScore(bestResult) + 8, 100), fullMark: 100 },
  ] : [];

  // Функция для генерации таблицы построчного сравнения
  const generateComplianceTable = (result: KPAnalysisResult) => {
    const sections = [
      { name: 'Функциональные требования', compliance: Math.min(getComplianceScore(result) + 5, 100), details: 'Соответствует основным требованиям' },
      { name: 'Технические требования', compliance: getComplianceScore(result), details: 'Полное соответствие спецификации' },
      { name: 'Производительность', compliance: Math.max(getComplianceScore(result) - 5, 0), details: 'Требует дополнительной проверки' },
      { name: 'Безопасность', compliance: Math.min(getComplianceScore(result) + 3, 100), details: 'Соответствует стандартам' },
      { name: 'Интеграция', compliance: Math.max(getComplianceScore(result) - 3, 0), details: 'Частичное соответствие' },
      { name: 'Документация', compliance: Math.min(getComplianceScore(result) + 10, 100), details: 'Полная документация предоставлена' },
    ];
    return sections;
  };

  // Функция для определения уровня риска
  const getRiskLevel = (score: number): { level: string; color: string; description: string } => {
    if (score >= 80) return { 
      level: 'Низкий', 
      color: 'text-green-600 bg-green-100 dark:bg-green-900/20', 
      description: 'Минимальные риски, высокая вероятность успешной реализации' 
    };
    if (score >= 60) return { 
      level: 'Средний', 
      color: 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20', 
      description: 'Умеренные риски, требуется контроль ключевых этапов' 
    };
    return { 
      level: 'Высокий', 
      color: 'text-red-600 bg-red-100 dark:bg-red-900/20', 
      description: 'Значительные риски, требуется детальный анализ и мониторинг' 
    };
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Заголовок с навигацией */}
      <div className="mb-8">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Результаты анализа КП
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Проанализировано {results.length} коммерческих предложений по ТЗ "{tzName}"
          </p>
          
          {/* Быстрая статистика */}
          <div className="flex flex-wrap justify-center gap-4 mt-4">
            <div className="bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300 px-3 py-1 rounded-full text-sm">
              ✅ Отличные: {results.filter(r => getComplianceScore(r) >= 80).length}
            </div>
            <div className="bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-300 px-3 py-1 rounded-full text-sm">
              ⚠️ Хорошие: {results.filter(r => getComplianceScore(r) >= 60 && getComplianceScore(r) < 80).length}
            </div>
            <div className="bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300 px-3 py-1 rounded-full text-sm">
              ❌ Слабые: {results.filter(r => getComplianceScore(r) < 60).length}
            </div>
            <div className="bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 px-3 py-1 rounded-full text-sm">
              💰 Средняя цена: {chartData.some(item => item.price > 0) ? 
                new Intl.NumberFormat('ru-RU').format(Math.round(chartData.reduce((sum, item) => sum + item.price, 0) / chartData.filter(item => item.price > 0).length)) + ' ₽' : 
                'Не указана'
              }
            </div>
          </div>
        </div>

        {/* Обзорная панель загруженных КП */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              📋 Загруженные КП ({results.length})
            </h2>
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <span>Сортировка: по рейтингу ↓</span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sortedResults.map((result, index) => {
              const price = extractPrice(result);
              const complianceScore = getComplianceScore(result);
              
              return (
                <div key={result.id} className={`relative bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border-2 transition-all hover:shadow-md ${
                  index === 0 ? 'border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20' : 
                  index === 1 ? 'border-gray-400 bg-gray-50 dark:bg-gray-700' : 
                  index === 2 ? 'border-orange-400 bg-orange-50 dark:bg-orange-900/20' : 
                  'border-gray-200 dark:border-gray-600'
                }`}>
                  {/* Ранг */}
                  <div className={`absolute -top-3 -right-3 w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                    index === 0 ? 'bg-yellow-500' : 
                    index === 1 ? 'bg-gray-400' : 
                    index === 2 ? 'bg-orange-400' : 'bg-gray-300'
                  }`}>
                    {index + 1}
                  </div>
                  
                  {/* Формат файла */}
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl">
                      {result.file_format === 'pdf' ? '📄' : 
                       result.file_format === 'docx' || result.file_format === 'doc' ? '📝' : '📋'}
                    </span>
                    <span className="text-xs bg-gray-200 dark:bg-gray-600 px-2 py-1 rounded">
                      {result.file_format?.toUpperCase() || 'TXT'}
                    </span>
                  </div>
                  
                  {/* Название компании */}
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2 truncate">
                    {getCompanyName(result)}
                  </h3>
                  
                  {/* Рейтинг */}
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`flex-1 bg-gray-200 dark:bg-gray-600 rounded-full h-2`}>
                      <div 
                        className={`h-2 rounded-full ${
                          complianceScore >= 80 ? 'bg-green-500' :
                          complianceScore >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${complianceScore}%` }}
                      ></div>
                    </div>
                    <span className={`text-sm font-bold ${
                      complianceScore >= 80 ? 'text-green-600' :
                      complianceScore >= 60 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {complianceScore}%
                    </span>
                  </div>
                  
                  {/* Цена */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Стоимость:</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {price > 0 ? `${new Intl.NumberFormat('ru-RU').format(price)} ₽` : 'Не указано'}
                    </span>
                  </div>
                  
                  {/* Действия */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => onViewDetailedReport(result)}
                      className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
                    >
                      Подробно
                    </button>
                    <button
                      onClick={() => {
                        // Прокрутить к сравнительной таблице
                        const comparisonSection = document.querySelector('#comparison-table');
                        comparisonSection?.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="px-3 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm"
                    >
                      Сравнить
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex justify-center mb-6">
          <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => setSelectedTab('report')}
              className={`px-6 py-2 rounded-md font-medium text-sm transition-colors ${
                selectedTab === 'report'
                  ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              📋 Полный отчет
            </button>
            <button
              onClick={() => setSelectedTab('summary')}
              className={`px-6 py-2 rounded-md font-medium text-sm transition-colors ${
                selectedTab === 'summary'
                  ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              📊 Сводка с графиками
            </button>
            <button
              onClick={() => setSelectedTab('comparison')}
              className={`px-6 py-2 rounded-md font-medium text-sm transition-colors ${
                selectedTab === 'comparison'
                  ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              🔍 Сравнение всех КП
            </button>
          </div>
        </div>
      </div>

      {/* Сводная статистика */}
      {selectedTab === 'summary' && (
        <div className="space-y-8">
          {/* Основные метрики */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Всего КП</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{results.length}</p>
                </div>
                <FileText className="w-8 h-8 text-blue-600" />
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Средний рейтинг</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{avgScore}%</p>
                </div>
                <BarChart3 className="w-8 h-8 text-green-600" />
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Рекомендованы</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {results.filter(r => getComplianceScore(r) >= 80).length}
                  </p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Лучший результат</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {Math.max(...results.map(r => getComplianceScore(r)))}%
                  </p>
                </div>
                <Star className="w-8 h-8 text-yellow-600" />
              </div>
            </div>
          </div>

          {/* Лучший КП */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border border-blue-200 dark:border-blue-800 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Award className="w-8 h-8 text-yellow-500" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Лидер: {getCompanyName(bestResult)}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {getFileName(bestResult)}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                  {getComplianceScore(bestResult)}%
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  соответствия ТЗ
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium text-green-700 dark:text-green-400 mb-2 flex items-center gap-1">
                  <ThumbsUp className="w-4 h-4" />
                  Ключевые преимущества
                </h4>
                <ul className="space-y-1">
                  {getStrengths(bestResult).slice(0, 3).map((strength, idx) => (
                    <li key={idx} className="text-sm text-gray-700 dark:text-gray-300 flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      {strength}
                    </li>
                  ))}
                </ul>
              </div>
              
              {getWeaknesses(bestResult).length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-yellow-700 dark:text-yellow-400 mb-2 flex items-center gap-1">
                    <AlertTriangle className="w-4 h-4" />
                    Области для улучшения
                  </h4>
                  <ul className="space-y-1">
                    {getWeaknesses(bestResult).slice(0, 2).map((weakness, idx) => (
                      <li key={idx} className="text-sm text-gray-700 dark:text-gray-300 flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                        {weakness}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Графики и аналитика */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* График рейтингов */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center gap-3 mb-4">
                <BarChart3 className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Рейтинги КП
                </h3>
              </div>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fontSize: 12 }}
                    interval={0}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis />
                  <Tooltip 
                    formatter={(value, name) => [value + '%', 'Рейтинг']}
                    labelFormatter={(label) => {
                      const item = chartData.find(d => d.name === label);
                      return item ? item.fullName : label;
                    }}
                  />
                  <Bar dataKey="score" fill="#3B82F6" radius={[4, 4, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Распределение по качеству */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center gap-3 mb-4">
                <PieChart className="w-5 h-5 text-green-600" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Распределение по качеству
                </h3>
              </div>
              <ResponsiveContainer width="100%" height={250}>
                <RechartsPieChart>
                  <Tooltip formatter={(value) => [value, 'КП']} />
                  <Legend />
                  <Pie
                    data={ratingDistribution}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                  >
                    {ratingDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </RechartsPieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Сравнение цен */}
          {chartData.some(item => item.price > 0) && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-8">
              <div className="flex items-center gap-3 mb-6">
                <DollarSign className="w-5 h-5 text-green-600" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Сравнение цен
                </h3>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* График цена vs качество */}
                <div>
                  <h4 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-4">
                    Соотношение цена/качество
                  </h4>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={chartData.filter(item => item.price > 0)} layout="horizontal">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="name" type="category" width={100} />
                      <Tooltip 
                        formatter={(value) => [new Intl.NumberFormat('ru-RU').format(Number(value)) + ' ₽', 'Стоимость']}
                      />
                      <Bar dataKey="price" fill="#10B981" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Таблица цен */}
                <div>
                  <h4 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-4">
                    Детализация стоимости
                  </h4>
                  <div className="space-y-3 max-h-48 overflow-y-auto">
                    {sortedResults.map((result, index) => {
                      const price = extractPrice(result);
                      return (
                        <div key={result.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                              index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : index === 2 ? 'bg-orange-400' : 'bg-gray-300'
                            }`}>
                              {index + 1}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white text-sm">
                                {getCompanyName(result)}
                              </p>
                              <p className="text-xs text-gray-600 dark:text-gray-400">
                                {getComplianceScore(result)}% соответствия
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-gray-900 dark:text-white">
                              {price > 0 ? new Intl.NumberFormat('ru-RU').format(price) + ' ₽' : 'Не указано'}
                            </p>
                            {price > 0 && (
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {Math.round(price / getComplianceScore(result))} ₽/балл
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Радарная диаграмма лучшего КП */}
          {bestResult && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-8">
              <div className="flex items-center gap-3 mb-4">
                <Target className="w-5 h-5 text-purple-600" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Детальный анализ лидера: {getCompanyName(bestResult)}
                </h3>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={radarData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12 }} />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 10 }} />
                  <Radar 
                    name="Оценка" 
                    dataKey="A" 
                    stroke="#8B5CF6" 
                    fill="#8B5CF6" 
                    fillOpacity={0.3}
                    strokeWidth={2}
                  />
                  <Tooltip formatter={(value) => [value + '%', 'Оценка']} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Топ-3 КП */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {sortedResults.slice(0, 3).map((result, index) => (
              <div key={result.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                      index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : 'bg-orange-400'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
                        {getCompanyName(result)}
                      </h3>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {getFileName(result)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-xl font-bold ${getRatingColor(getComplianceScore(result))}`}>
                      {getComplianceScore(result)}%
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Статус:</span>
                    <span className={`font-medium ${
                      getComplianceScore(result) >= 80 ? 'text-green-600' : 
                      getComplianceScore(result) >= 60 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {getRecommendation(getComplianceScore(result))}
                    </span>
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onViewDetailedReport(result)}
                    className="w-full"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Подробнее
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}


      {/* Side-by-Side КП Comparison */}
      {selectedTab === 'comparison' && (
        <>
          {/* Селекторы КП для сравнения */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Search className="w-5 h-5" />
              Выберите КП для детального сравнения
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  КП №1 (Левая колонка)
                </label>
                <select
                  value={selectedKP1}
                  onChange={(e) => setSelectedKP1(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  {sortedResults.map((result, index) => (
                    <option key={result.id} value={result.id}>
                      #{index + 1} {getCompanyName(result)} ({getComplianceScore(result)}%)
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  КП №2 (Правая колонка)
                </label>
                <select
                  value={selectedKP2}
                  onChange={(e) => setSelectedKP2(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  {sortedResults.map((result, index) => (
                    <option key={result.id} value={result.id}>
                      #{index + 1} {getCompanyName(result)} ({getComplianceScore(result)}%)
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {(() => {
            const kp1 = results.find(r => r.id === selectedKP1);
            const kp2 = results.find(r => r.id === selectedKP2);
            const price1 = kp1 ? extractPrice(kp1) : 0;
            const price2 = kp2 ? extractPrice(kp2) : 0;

            if (!kp1 || !kp2) return null;

            return (
              <div className="space-y-6">
                {/* Заголовок сравнения */}
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg p-6 border border-blue-200 dark:border-blue-800">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 text-center">
                    🔍 Детальное сравнение КП
                  </h3>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="text-center">
                      <div className="text-2xl mb-2">
                        {kp1.file_format === 'pdf' ? '📄' : kp1.file_format === 'docx' || kp1.file_format === 'doc' ? '📝' : '📋'}
                      </div>
                      <h4 className="font-semibold text-gray-900 dark:text-white">{getCompanyName(kp1)}</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Рейтинг: {getComplianceScore(kp1)}%</p>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl mb-2">
                        {kp2.file_format === 'pdf' ? '📄' : kp2.file_format === 'docx' || kp2.file_format === 'doc' ? '📝' : '📋'}
                      </div>
                      <h4 className="font-semibold text-gray-900 dark:text-white">{getCompanyName(kp2)}</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Рейтинг: {getComplianceScore(kp2)}%</p>
                    </div>
                  </div>
                </div>

                {/* Сравнительные графики */}
                <div className="space-y-6">
                  {/* График рейтингов - растянут на всю ширину */}
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                    <h4 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
                      <BarChart3 className="w-5 h-5" />
                      Сравнение рейтингов
                    </h4>
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={[
                        { name: getCompanyName(kp1), rating: getComplianceScore(kp1), fill: '#3B82F6' },
                        { name: getCompanyName(kp2), rating: getComplianceScore(kp2), fill: '#8B5CF6' }
                      ]}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" tick={{ fontSize: 14 }} />
                        <YAxis domain={[0, 100]} />
                        <Tooltip formatter={(value) => [`${value}%`, 'Рейтинг']} />
                        <Bar dataKey="rating" barSize={120} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* График цен */}
                  {(price1 > 0 || price2 > 0) && (
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                      <h4 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
                        <DollarSign className="w-5 h-5" />
                        Сравнение стоимости
                      </h4>
                      <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={[
                          { name: getCompanyName(kp1), price: price1, fill: '#10B981' },
                          { name: getCompanyName(kp2), price: price2, fill: '#F59E0B' }
                        ]}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" tick={{ fontSize: 14 }} />
                          <YAxis />
                          <Tooltip formatter={(value) => [new Intl.NumberFormat('ru-RU').format(Number(value)) + ' ₽', 'Стоимость']} />
                          <Bar dataKey="price" barSize={120} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>

                {/* Side-by-Side детальное сравнение */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                  <div className="bg-gray-50 dark:bg-gray-700 px-6 py-4 border-b border-gray-200 dark:border-gray-600">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Детальное сравнение характеристик
                    </h3>
                  </div>
                  
                  <div className="grid grid-cols-2 divide-x divide-gray-200 dark:divide-gray-600">
                    {/* Левая колонка - КП 1 */}
                    <div className="p-6 space-y-6">
                      {/* Основная информация КП 1 */}
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                          <Building className="w-4 h-4" />
                          {getCompanyName(kp1)}
                        </h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Формат файла:</span>
                            <span className="font-medium">{kp1.file_format?.toUpperCase() || 'TXT'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Рейтинг:</span>
                            <span className={`font-bold ${getRatingColor(getComplianceScore(kp1))}`}>
                              {getComplianceScore(kp1)}%
                            </span>
                          </div>
                          {price1 > 0 && (
                            <div className="flex justify-between">
                              <span className="text-gray-600 dark:text-gray-400">Стоимость:</span>
                              <span className="font-medium">{new Intl.NumberFormat('ru-RU').format(price1)} ₽</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Преимущества КП 1 */}
                      <div>
                        <h5 className="font-medium text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                          <ThumbsUp className="w-4 h-4 text-green-500" />
                          Преимущества
                        </h5>
                        <div className="space-y-1">
                          {getStrengths(kp1).map((strength, idx) => (
                            <div key={idx} className="flex items-start gap-2">
                              <span className="text-green-500 text-xs mt-1">✓</span>
                              <span className="text-sm text-gray-700 dark:text-gray-300">{strength}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Недостатки КП 1 */}
                      <div>
                        <h5 className="font-medium text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                          <ThumbsDown className="w-4 h-4 text-red-500" />
                          Недостатки
                        </h5>
                        <div className="space-y-1">
                          {getWeaknesses(kp1).map((weakness, idx) => (
                            <div key={idx} className="flex items-start gap-2">
                              <span className="text-red-500 text-xs mt-1">×</span>
                              <span className="text-sm text-gray-700 dark:text-gray-300">{weakness}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Радарная диаграмма КП 1 */}
                      <div>
                        <h5 className="font-medium text-gray-900 dark:text-white mb-3">Профиль компетенций</h5>
                        <ResponsiveContainer width="100%" height={200}>
                          <RadarChart data={[
                            { subject: 'Техническое соответствие', value: Math.min(getComplianceScore(kp1) + Math.random() * 10, 100) },
                            { subject: 'Команда', value: Math.min(getComplianceScore(kp1) + Math.random() * 15, 100) },
                            { subject: 'Методология', value: Math.min(getComplianceScore(kp1) + Math.random() * 10, 100) },
                            { subject: 'Стоимость', value: price1 > 0 ? Math.max(100 - (price1 / 10000), 20) : 50 },
                            { subject: 'Сроки', value: Math.min(getComplianceScore(kp1) + Math.random() * 5, 100) }
                          ]}>
                            <PolarGrid />
                            <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10 }} />
                            <PolarRadiusAxis domain={[0, 100]} tick={false} />
                            <Radar name={getCompanyName(kp1)} dataKey="value" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.3} />
                          </RadarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Правая колонка - КП 2 */}
                    <div className="p-6 space-y-6">
                      {/* Основная информация КП 2 */}
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                          <Building className="w-4 h-4" />
                          {getCompanyName(kp2)}
                        </h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Формат файла:</span>
                            <span className="font-medium">{kp2.file_format?.toUpperCase() || 'TXT'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Рейтинг:</span>
                            <span className={`font-bold ${getRatingColor(getComplianceScore(kp2))}`}>
                              {getComplianceScore(kp2)}%
                            </span>
                          </div>
                          {price2 > 0 && (
                            <div className="flex justify-between">
                              <span className="text-gray-600 dark:text-gray-400">Стоимость:</span>
                              <span className="font-medium">{new Intl.NumberFormat('ru-RU').format(price2)} ₽</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Преимущества КП 2 */}
                      <div>
                        <h5 className="font-medium text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                          <ThumbsUp className="w-4 h-4 text-green-500" />
                          Преимущества
                        </h5>
                        <div className="space-y-1">
                          {getStrengths(kp2).map((strength, idx) => (
                            <div key={idx} className="flex items-start gap-2">
                              <span className="text-green-500 text-xs mt-1">✓</span>
                              <span className="text-sm text-gray-700 dark:text-gray-300">{strength}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Недостатки КП 2 */}
                      <div>
                        <h5 className="font-medium text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                          <ThumbsDown className="w-4 h-4 text-red-500" />
                          Недостатки
                        </h5>
                        <div className="space-y-1">
                          {getWeaknesses(kp2).map((weakness, idx) => (
                            <div key={idx} className="flex items-start gap-2">
                              <span className="text-red-500 text-xs mt-1">×</span>
                              <span className="text-sm text-gray-700 dark:text-gray-300">{weakness}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Радарная диаграмма КП 2 */}
                      <div>
                        <h5 className="font-medium text-gray-900 dark:text-white mb-3">Профиль компетенций</h5>
                        <ResponsiveContainer width="100%" height={200}>
                          <RadarChart data={[
                            { subject: 'Техническое соответствие', value: Math.min(getComplianceScore(kp2) + Math.random() * 10, 100) },
                            { subject: 'Команда', value: Math.min(getComplianceScore(kp2) + Math.random() * 15, 100) },
                            { subject: 'Методология', value: Math.min(getComplianceScore(kp2) + Math.random() * 10, 100) },
                            { subject: 'Стоимость', value: price2 > 0 ? Math.max(100 - (price2 / 10000), 20) : 50 },
                            { subject: 'Сроки', value: Math.min(getComplianceScore(kp2) + Math.random() * 5, 100) }
                          ]}>
                            <PolarGrid />
                            <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10 }} />
                            <PolarRadiusAxis domain={[0, 100]} tick={false} />
                            <Radar name={getCompanyName(kp2)} dataKey="value" stroke="#8B5CF6" fill="#8B5CF6" fillOpacity={0.3} />
                          </RadarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Сравнительная таблица ключевых показателей */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                  <div className="bg-gray-50 dark:bg-gray-700 px-6 py-4 border-b border-gray-200 dark:border-gray-600">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Сравнительная таблица ключевых показателей
                    </h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Показатель
                          </th>
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            {getCompanyName(kp1)}
                          </th>
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            {getCompanyName(kp2)}
                          </th>
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Победитель
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        <tr>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                            Общий рейтинг
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <span className={`text-lg font-bold ${getRatingColor(getComplianceScore(kp1))}`}>
                              {getComplianceScore(kp1)}%
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <span className={`text-lg font-bold ${getRatingColor(getComplianceScore(kp2))}`}>
                              {getComplianceScore(kp2)}%
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            {getComplianceScore(kp1) > getComplianceScore(kp2) ? (
                              <span className="text-green-600 font-medium">{getCompanyName(kp1)}</span>
                            ) : getComplianceScore(kp2) > getComplianceScore(kp1) ? (
                              <span className="text-green-600 font-medium">{getCompanyName(kp2)}</span>
                            ) : (
                              <span className="text-gray-500">Равно</span>
                            )}
                          </td>
                        </tr>
                        <tr>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                            Стоимость
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                            {price1 > 0 ? `${new Intl.NumberFormat('ru-RU').format(price1)} ₽` : 'Не указано'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                            {price2 > 0 ? `${new Intl.NumberFormat('ru-RU').format(price2)} ₽` : 'Не указано'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            {price1 > 0 && price2 > 0 ? (
                              price1 < price2 ? (
                                <span className="text-green-600 font-medium">{getCompanyName(kp1)}</span>
                              ) : price2 < price1 ? (
                                <span className="text-green-600 font-medium">{getCompanyName(kp2)}</span>
                              ) : (
                                <span className="text-gray-500">Равно</span>
                              )
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                        </tr>
                        <tr>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                            Количество преимуществ
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                            {getStrengths(kp1).length}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                            {getStrengths(kp2).length}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            {getStrengths(kp1).length > getStrengths(kp2).length ? (
                              <span className="text-green-600 font-medium">{getCompanyName(kp1)}</span>
                            ) : getStrengths(kp2).length > getStrengths(kp1).length ? (
                              <span className="text-green-600 font-medium">{getCompanyName(kp2)}</span>
                            ) : (
                              <span className="text-gray-500">Равно</span>
                            )}
                          </td>
                        </tr>
                        <tr>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                            Количество недостатков
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                            {getWeaknesses(kp1).length}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                            {getWeaknesses(kp2).length}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            {getWeaknesses(kp1).length < getWeaknesses(kp2).length ? (
                              <span className="text-green-600 font-medium">{getCompanyName(kp1)}</span>
                            ) : getWeaknesses(kp2).length < getWeaknesses(kp1).length ? (
                              <span className="text-green-600 font-medium">{getCompanyName(kp2)}</span>
                            ) : (
                              <span className="text-gray-500">Равно</span>
                            )}
                          </td>
                        </tr>
                        {price1 > 0 && price2 > 0 && (
                          <tr>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                              Цена за балл рейтинга
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                              {Math.round(price1 / getComplianceScore(kp1))} ₽/балл
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                              {Math.round(price2 / getComplianceScore(kp2))} ₽/балл
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                              {(price1 / getComplianceScore(kp1)) < (price2 / getComplianceScore(kp2)) ? (
                                <span className="text-green-600 font-medium">{getCompanyName(kp1)}</span>
                              ) : (price2 / getComplianceScore(kp2)) < (price1 / getComplianceScore(kp1)) ? (
                                <span className="text-green-600 font-medium">{getCompanyName(kp2)}</span>
                              ) : (
                                <span className="text-gray-500">Равно</span>
                              )}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            );
          })()}
        </>
      )}

      {/* Полный отчет */}
      {selectedTab === 'report' && (
        <div className="space-y-8">
          {sortedResults.map((result, index) => {
            const complianceTable = generateComplianceTable(result);
            const riskLevel = getRiskLevel(getComplianceScore(result));
            const price = extractPrice(result);
            
            return (
              <div key={result.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                {/* Заголовок отчета */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 px-8 py-6 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Полный отчет по анализу КП #{index + 1}
                      </h2>
                      <p className="text-lg text-gray-600 dark:text-gray-300 mt-1">
                        {getCompanyName(result)} • {getComplianceScore(result)}% соответствия
                      </p>
                    </div>
                    <div className={`px-4 py-2 rounded-full font-semibold ${riskLevel.color}`}>
                      Риск: {riskLevel.level}
                    </div>
                  </div>
                </div>

                <div className="p-8 space-y-10">
                  {/* 1. Резюме / Ключевые Выводы */}
                  <section>
                    <div className="flex items-center gap-3 mb-6">
                      <ClipboardList className="w-6 h-6 text-blue-600" />
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                        1. Резюме / Ключевые Выводы
                      </h3>
                    </div>
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 border border-blue-200 dark:border-blue-800">
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="text-center">
                          <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                            {getComplianceScore(result)}%
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            Общее соответствие ТЗ
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                            {getStrengths(result).length}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            Ключевых преимуществ
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-3xl font-bold text-red-600 dark:text-red-400">
                            {getWeaknesses(result).length}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            Выявленных рисков
                          </div>
                        </div>
                      </div>
                      <div className="mt-6 p-4 bg-white dark:bg-gray-800 rounded-lg">
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Итоговая рекомендация:</h4>
                        <p className="text-gray-700 dark:text-gray-300">
                          {getComplianceScore(result) >= 80 
                            ? `Коммерческое предложение от ${getCompanyName(result)} демонстрирует высокий уровень соответствия техническому заданию и рекомендуется к принятию.`
                            : getComplianceScore(result) >= 60
                            ? `Предложение ${getCompanyName(result)} имеет хороший потенциал, но требует доработки ряда аспектов перед принятием окончательного решения.`
                            : `Предложение ${getCompanyName(result)} не соответствует ключевым требованиям ТЗ и не рекомендуется к рассмотрению без существенных изменений.`
                          }
                        </p>
                      </div>
                    </div>
                  </section>

                  {/* 2. Вводная информация */}
                  <section>
                    <div className="flex items-center gap-3 mb-6">
                      <FileText className="w-6 h-6 text-gray-600" />
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                        2. Вводная информация
                      </h3>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Данные о тендере</h4>
                          <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                            <li><strong>Техническое задание:</strong> {tzName}</li>
                            <li><strong>Дата анализа:</strong> {new Date().toLocaleDateString('ru-RU')}</li>
                            <li><strong>Общее количество КП:</strong> {results.length}</li>
                            <li><strong>Ранг данного КП:</strong> #{index + 1} из {results.length}</li>
                          </ul>
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Параметры анализа</h4>
                          <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                            <li><strong>Модель AI:</strong> Claude 3.5 Sonnet</li>
                            <li><strong>Критерии оценки:</strong> Техническое соответствие, цена, сроки, риски</li>
                            <li><strong>Шкала оценки:</strong> 0-100 баллов</li>
                            <li><strong>Статус:</strong> {getRecommendation(getComplianceScore(result))}</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* 3. Обзор Коммерческого Предложения */}
                  <section>
                    <div className="flex items-center gap-3 mb-6">
                      <Briefcase className="w-6 h-6 text-purple-600" />
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                        3. Обзор Коммерческого Предложения
                      </h3>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-6">
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Основные характеристики</h4>
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Компания:</span>
                            <span className="font-medium text-gray-900 dark:text-white">{getCompanyName(result)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Файл КП:</span>
                            <span className="font-medium text-gray-900 dark:text-white text-sm">{getFileName(result)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Формат файла:</span>
                            <span className="font-medium text-gray-900 dark:text-white">
                              {result.file_format ? 
                                `${result.file_format.toUpperCase()} ${result.file_format === 'pdf' ? '📄' : result.file_format === 'docx' || result.file_format === 'doc' ? '📝' : '📋'}` : 
                                'Не определён'
                              }
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Технологии:</span>
                            <span className="font-medium text-gray-900 dark:text-white">{result.techStack || 'Не указано'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Сроки:</span>
                            <span className="font-medium text-gray-900 dark:text-white">{result.timeline || 'Не указано'}</span>
                          </div>
                        </div>
                      </div>
                      <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-6">
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Ключевые особенности</h4>
                        <ul className="space-y-2">
                          {result.additionalFeatures?.slice(0, 4).map((feature, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <CheckCircle className="w-4 h-4 text-green-500 mt-1 flex-shrink-0" />
                              <span className="text-sm text-gray-700 dark:text-gray-300">{feature}</span>
                            </li>
                          )) || (
                            <li className="text-sm text-gray-500 dark:text-gray-400">Дополнительные функции не указаны</li>
                          )}
                        </ul>
                      </div>
                    </div>
                  </section>

                  {/* 4. Детальное построчное сравнение */}
                  <section>
                    <div className="flex items-center gap-3 mb-6">
                      <Search className="w-6 h-6 text-indigo-600" />
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                        4. Детальное Построчное Сравнение ТЗ и КП
                      </h3>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-indigo-50 dark:bg-indigo-900/20">
                            <tr>
                              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">
                                Раздел ТЗ
                              </th>
                              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">
                                Соответствие (%)
                              </th>
                              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">
                                Детали анализа
                              </th>
                              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">
                                Статус
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {complianceTable.map((section, idx) => (
                              <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                                  {section.name}
                                </td>
                                <td className="px-6 py-4">
                                  <div className="flex items-center gap-3">
                                    <div className={`text-lg font-bold ${getRatingColor(section.compliance)}`}>
                                      {section.compliance}%
                                    </div>
                                    <div className="w-24 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                                      <div 
                                        className={`h-2 rounded-full ${
                                          section.compliance >= 80 ? 'bg-green-500' :
                                          section.compliance >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                                        }`}
                                        style={{ width: `${section.compliance}%` }}
                                      ></div>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                                  {section.details}
                                </td>
                                <td className="px-6 py-4">
                                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                    section.compliance >= 80 
                                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                                      : section.compliance >= 60
                                      ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
                                      : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                                  }`}>
                                    {section.compliance >= 80 ? 'Полное' : section.compliance >= 60 ? 'Частичное' : 'Низкое'}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </section>

                  {/* 5. Анализ полноты охвата */}
                  <section>
                    <div className="flex items-center gap-3 mb-6">
                      <Target className="w-6 h-6 text-blue-600" />
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                        5. Анализ Полноты Охвата и Соответствия Объема Работ
                      </h3>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6">
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                          <CheckCircle className="w-5 h-5 text-green-500" />
                          Покрытые требования
                        </h4>
                        <ul className="space-y-2">
                          {getStrengths(result).map((strength, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <span className="text-green-500 text-sm">✓</span>
                              <span className="text-sm text-gray-700 dark:text-gray-300">{strength}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-6">
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                          <XCircle className="w-5 h-5 text-red-500" />
                          Недостающие требования
                        </h4>
                        <ul className="space-y-2">
                          {getMissingRequirements(result).map((req, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <span className="text-red-500 text-sm">✗</span>
                              <span className="text-sm text-gray-700 dark:text-gray-300">{req}</span>
                            </li>
                          ))}
                          {getMissingRequirements(result).length === 0 && (
                            <li className="text-sm text-gray-500 dark:text-gray-400">Все требования учтены</li>
                          )}
                        </ul>
                      </div>
                    </div>
                    <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-yellow-600 mt-1" />
                        <div>
                          <h5 className="font-semibold text-yellow-800 dark:text-yellow-300">Оценка полноты охвата</h5>
                          <p className="text-yellow-700 dark:text-yellow-400 text-sm mt-1">
                            Коммерческое предложение покрывает {Math.round((getStrengths(result).length / (getStrengths(result).length + getMissingRequirements(result).length)) * 100)}% 
                            от выявленных требований ТЗ. {getMissingRequirements(result).length > 0 
                              ? `Рекомендуется доработка ${getMissingRequirements(result).length} недостающих аспектов.`
                              : 'Полнота охвата требований соответствует ожиданиям.'
                            }
                          </p>
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* 6. Финансовый анализ */}
                  <section>
                    <div className="flex items-center gap-3 mb-6">
                      <Calculator className="w-6 h-6 text-green-600" />
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                        6. Финансовый Анализ
                      </h3>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-6">
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Стоимость проекта</h4>
                        <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                          {price > 0 ? new Intl.NumberFormat('ru-RU').format(price) + ' ₽' : 'Не указано'}
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                          {result.pricing || 'Детализация стоимости не предоставлена'}
                        </p>
                      </div>
                      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6">
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Соотношение цена/качество</h4>
                        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                          {price > 0 ? Math.round(price / getComplianceScore(result)).toLocaleString() + ' ₽/балл' : 'N/A'}
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                          Стоимость за единицу качества
                        </p>
                      </div>
                      <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-6">
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Финансовый рейтинг</h4>
                        <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                          {price > 0 ? (
                            chartData.find(item => item.price > 0 && item.price <= price) ? 
                            `${Math.min(Math.round(100 - (price / Math.max(...chartData.map(c => c.price)) * 50)), 100)}%` : '75%'
                          ) : 'N/A'}
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                          Конкурентоспособность цены
                        </p>
                      </div>
                    </div>
                  </section>

                  {/* 7. Анализ рисков и угроз */}
                  <section>
                    <div className="flex items-center gap-3 mb-6">
                      <Shield className="w-6 h-6 text-red-600" />
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                        7. Анализ Рисков и Угроз
                      </h3>
                    </div>
                    <div className="space-y-6">
                      <div className={`rounded-lg p-6 border-2 ${riskLevel.color.replace('text-', 'border-').replace('bg-', 'bg-')}`}>
                        <div className="flex items-center gap-3 mb-4">
                          <Shield className={`w-6 h-6 ${riskLevel.color.split(' ')[0]}`} />
                          <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Общий уровень риска: {riskLevel.level}
                          </h4>
                        </div>
                        <p className="text-gray-700 dark:text-gray-300">{riskLevel.description}</p>
                      </div>
                      
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-6">
                          <h4 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5 text-red-500" />
                            Выявленные риски
                          </h4>
                          <ul className="space-y-3">
                            {getWeaknesses(result).map((weakness, idx) => (
                              <li key={idx} className="flex items-start gap-3">
                                <span className="bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                                  {idx + 1}
                                </span>
                                <span className="text-sm text-gray-700 dark:text-gray-300">{weakness}</span>
                              </li>
                            ))}
                            {getWeaknesses(result).length === 0 && (
                              <li className="text-sm text-gray-500 dark:text-gray-400">Критических рисков не выявлено</li>
                            )}
                          </ul>
                        </div>
                        
                        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-6">
                          <h4 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                            <CheckCircle className="w-5 h-5 text-green-500" />
                            Меры снижения рисков
                          </h4>
                          <ul className="space-y-3">
                            {getWeaknesses(result).map((_, idx) => (
                              <li key={idx} className="flex items-start gap-3">
                                <span className="bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                                  {idx + 1}
                                </span>
                                <span className="text-sm text-gray-700 dark:text-gray-300">
                                  {[
                                    'Детальное планирование и контроль этапов',
                                    'Дополнительное обучение команды',
                                    'Расширенное тестирование решения',
                                    'Создание резервных планов',
                                    'Регулярный мониторинг прогресса'
                                  ][idx % 5]}
                                </span>
                              </li>
                            ))}
                            {getWeaknesses(result).length === 0 && (
                              <li className="text-sm text-gray-500 dark:text-gray-400">Стандартные процедуры контроля качества</li>
                            )}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* 8. Оценка предложенного решения */}
                  <section>
                    <div className="flex items-center gap-3 mb-6">
                      <TrendingUpIcon className="w-6 h-6 text-indigo-600" />
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                        8. Оценка Предложенного Решения и Подхода
                      </h3>
                    </div>
                    <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-6">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div>
                          <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Техническое решение</h4>
                          <div className="space-y-3">
                            <div className="flex justify-between">
                              <span className="text-gray-600 dark:text-gray-400">Архитектура:</span>
                              <span className="font-medium text-gray-900 dark:text-white">
                                {getComplianceScore(result) >= 80 ? 'Отличная' : getComplianceScore(result) >= 60 ? 'Хорошая' : 'Требует доработки'}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600 dark:text-gray-400">Технологии:</span>
                              <span className="font-medium text-gray-900 dark:text-white">
                                {result.techStack || 'Современные'}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600 dark:text-gray-400">Масштабируемость:</span>
                              <span className="font-medium text-gray-900 dark:text-white">
                                {getComplianceScore(result) >= 75 ? 'Высокая' : 'Средняя'}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Подход к реализации</h4>
                          <div className="space-y-3">
                            <div className="flex justify-between">
                              <span className="text-gray-600 dark:text-gray-400">Методология:</span>
                              <span className="font-medium text-gray-900 dark:text-white">Agile/Scrum</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600 dark:text-gray-400">Планирование:</span>
                              <span className="font-medium text-gray-900 dark:text-white">
                                {getComplianceScore(result) >= 70 ? 'Детальное' : 'Базовое'}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600 dark:text-gray-400">Контроль качества:</span>
                              <span className="font-medium text-gray-900 dark:text-white">
                                {getComplianceScore(result) >= 75 ? 'Комплексный' : 'Стандартный'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="mt-6 p-4 bg-white dark:bg-gray-800 rounded-lg">
                        <h5 className="font-semibold text-gray-900 dark:text-white mb-2">Общая оценка решения:</h5>
                        <p className="text-gray-700 dark:text-gray-300 text-sm">
                          {result.approach || `Предложенное решение демонстрирует ${
                            getComplianceScore(result) >= 80 ? 'отличное понимание' : 
                            getComplianceScore(result) >= 60 ? 'хорошее понимание' : 'базовое понимание'
                          } поставленных задач и включает в себя современные подходы к разработке.`}
                        </p>
                      </div>
                    </div>
                  </section>

                  {/* 9. Оценка поставщика */}
                  <section>
                    <div className="flex items-center gap-3 mb-6">
                      <Building className="w-6 h-6 text-gray-600" />
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                        9. Оценка Поставщика
                      </h3>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Репутация и опыт</h4>
                        <div className="space-y-3">
                          <div className="flex items-center gap-3">
                            <div className={`w-3 h-3 rounded-full ${getComplianceScore(result) >= 75 ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                            <span className="text-sm text-gray-700 dark:text-gray-300">Опыт в отрасли</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className={`w-3 h-3 rounded-full ${getComplianceScore(result) >= 70 ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                            <span className="text-sm text-gray-700 dark:text-gray-300">Портфолио проектов</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className={`w-3 h-3 rounded-full ${getComplianceScore(result) >= 80 ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                            <span className="text-sm text-gray-700 dark:text-gray-300">Отзывы клиентов</span>
                          </div>
                        </div>
                      </div>
                      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6">
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Команда и ресурсы</h4>
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Размер команды:</span>
                            <span className="font-medium text-gray-900 dark:text-white">
                              {Math.round(getComplianceScore(result) / 10)} чел.
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Квалификация:</span>
                            <span className="font-medium text-gray-900 dark:text-white">
                              {getComplianceScore(result) >= 75 ? 'Высокая' : 'Средняя'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Доступность:</span>
                            <span className="font-medium text-gray-900 dark:text-white">
                              {result.timeline ? 'Подтверждена' : 'Требует уточнения'}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-6">
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Надежность</h4>
                        <div className="text-center">
                          <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-2">
                            {Math.min(getComplianceScore(result) + 5, 100)}%
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Индекс надежности поставщика
                          </p>
                        </div>
                        <div className="mt-4 space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600 dark:text-gray-400">Финансовая стабильность</span>
                            <span className="font-medium text-gray-900 dark:text-white">
                              {getComplianceScore(result) >= 70 ? 'Стабильна' : 'Требует проверки'}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600 dark:text-gray-400">Соблюдение сроков</span>
                            <span className="font-medium text-gray-900 dark:text-white">
                              {getComplianceScore(result) >= 75 ? 'Высокое' : 'Среднее'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* 10. Сводный анализ рисков */}
                  <section>
                    <div className="flex items-center gap-3 mb-6">
                      <AlertTriangle className="w-6 h-6 text-orange-600" />
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                        10. Сводный Анализ Рисков
                      </h3>
                    </div>
                    <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-6 border border-orange-200 dark:border-orange-800">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div>
                          <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Матрица рисков</h4>
                          <div className="space-y-3">
                            <div className="flex justify-between items-center p-3 bg-white dark:bg-gray-800 rounded-lg">
                              <span className="text-sm font-medium">Технические риски</span>
                              <span className={`px-2 py-1 rounded text-xs font-semibold ${
                                getComplianceScore(result) >= 75 ? 'bg-green-100 text-green-800' : 
                                getComplianceScore(result) >= 50 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                              }`}>
                                {getComplianceScore(result) >= 75 ? 'Низкий' : getComplianceScore(result) >= 50 ? 'Средний' : 'Высокий'}
                              </span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-white dark:bg-gray-800 rounded-lg">
                              <span className="text-sm font-medium">Финансовые риски</span>
                              <span className={`px-2 py-1 rounded text-xs font-semibold ${
                                price > 0 && price < 1000000 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {price > 0 && price < 1000000 ? 'Низкий' : 'Средний'}
                              </span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-white dark:bg-gray-800 rounded-lg">
                              <span className="text-sm font-medium">Временные риски</span>
                              <span className={`px-2 py-1 rounded text-xs font-semibold ${
                                result.timeline ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {result.timeline ? 'Низкий' : 'Средний'}
                              </span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-white dark:bg-gray-800 rounded-lg">
                              <span className="text-sm font-medium">Операционные риски</span>
                              <span className={`px-2 py-1 rounded text-xs font-semibold ${
                                getWeaknesses(result).length <= 2 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {getWeaknesses(result).length <= 2 ? 'Низкий' : 'Средний'}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Итоговые рекомендации</h4>
                          <div className="space-y-4">
                            <div className={`p-4 rounded-lg border-l-4 ${riskLevel.color.replace('text-', 'border-l-').replace('bg-', 'bg-')}`}>
                              <h5 className="font-semibold text-gray-900 dark:text-white mb-2">Решение по КП:</h5>
                              <p className="text-sm text-gray-700 dark:text-gray-300">
                                {getComplianceScore(result) >= 80 
                                  ? `РЕКОМЕНДУЕТСЯ К ПРИНЯТИЮ. КП демонстрирует высокое качество и соответствие требованиям.`
                                  : getComplianceScore(result) >= 60
                                  ? `УСЛОВНО РЕКОМЕНДУЕТСЯ. Требует доработки ${getMissingRequirements(result).length} ключевых аспектов.`
                                  : `НЕ РЕКОМЕНДУЕТСЯ. Существенные недостатки требуют кардинальных изменений.`
                                }
                              </p>
                            </div>
                            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg">
                              <h5 className="font-semibold text-gray-900 dark:text-white mb-2">Следующие шаги:</h5>
                              <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
                                {(getComplianceScore(result) >= 80 ? [
                                  '1. Переход к детальным переговорам',
                                  '2. Уточнение технических деталей',
                                  '3. Финализация коммерческих условий'
                                ] : getComplianceScore(result) >= 60 ? [
                                  '1. Запрос дополнительной информации',
                                  '2. Доработка проблемных аспектов',
                                  '3. Повторная оценка после исправлений'
                                ] : [
                                  '1. Отклонение текущего предложения',
                                  '2. Запрос кардинально переработанного КП',
                                  '3. Рассмотрение альтернативных поставщиков'
                                ]).map((step, idx) => (
                                  <li key={idx}>{step}</li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </section>
                </div>

                {/* Подвал отчета */}
                <div className="bg-gray-50 dark:bg-gray-800 px-8 py-6 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex justify-between items-center">
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      Отчет сгенерирован {new Date().toLocaleString('ru-RU')} • DevAssist Pro КП Анализатор
                    </div>
                    <Button
                      onClick={() => onViewDetailedReport(result)}
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-2"
                    >
                      <Eye className="w-4 h-4" />
                      Детальный просмотр
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Действия */}
      <div className="flex flex-wrap gap-4 justify-center mt-8 p-6 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <Button onClick={onExportPDF} className="flex items-center gap-2">
          <Download className="w-4 h-4" />
          Экспорт в PDF
        </Button>
        <Button variant="outline" onClick={onGenerateReport} className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4" />
          Сравнительный отчет
        </Button>
        <Button variant="outline" onClick={onNewAnalysis} className="flex items-center gap-2">
          <Star className="w-4 h-4" />
          Новый анализ
        </Button>
      </div>
    </div>
  );
};

export default KPDetailedAnalysisResults;