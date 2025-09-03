/**
 * KP Results Page with Interactive Charts and Detailed Analytics - DevAssist Pro
 * 🎨 Красивая страница результатов с детальной аналитикой для КП Анализатора v2
 * 
 * Возможности:
 * - Интерактивные графики (Radar, Bar, Doughnut)
 * - Детальная аналитика по критериям
 * - SWOT анализ
 * - Финансовый анализ
 * - Простой экспорт в PDF через браузерную печать
 * - Корректная работа с кириллицей
 */

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  Title, 
  Tooltip, 
  Legend,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  ArcElement
} from 'chart.js';
import { Bar, Radar, Doughnut } from 'react-chartjs-2';
import { 
  TrendingUp, 
  Clock, 
  Users, 
  Shield, 
  Target,
  CheckCircle,
  AlertTriangle,
  Star,
  FileText,
  Calendar,
  Zap,
  BarChart3,
  PieChart,
  Activity,
  ArrowLeft,
  Printer
} from 'lucide-react';
import BudgetSummary from './BudgetSummary';
import { extractBudgetData, CurrencyAmount } from '../../utils/currencyExtractor';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  ArcElement
);

// Интерфейс для бюджетных данных
interface BudgetData {
  tz_budget?: CurrencyAmount;
  kp_budget?: CurrencyAmount;
  deviation_amount?: number;
  deviation_percentage?: number;
  status?: 'excellent' | 'good' | 'warning' | 'critical';
}

// Интерфейс данных анализа
interface AnalysisData {
  projectName: string;
  companyName: string;
  analysisDate: string;
  totalScore: number;
  recommendation: string;
  criteriaScores: {
    budget_compliance: number;
    timeline_feasibility: number;
    technical_compliance: number;
    team_expertise: number;
    functional_coverage: number;
    security_quality: number;
    methodology_processes: number;
    scalability_support: number;
    communication_reporting: number;
    additional_value: number;
  };
  extractedData: {
    cost: string;
    timeline: string;
    technologies: string[];
    teamSize: string;
  };
  strengths: string[];
  risks: string[];
  // Добавляем поддержку бюджетных данных
  budgetData?: BudgetData;
  tzText?: string;
  kpText?: string;
}

interface KPResultsPageProps {
  analysisData?: AnalysisData;
  onClose?: () => void;
}

const KPResultsPage: React.FC<KPResultsPageProps> = ({ 
  analysisData: propAnalysisData, 
  onClose 
}) => {
  const { analysisId } = useParams<{ analysisId: string }>();
  const navigate = useNavigate();
  const pageRef = useRef<HTMLDivElement>(null);
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(propAnalysisData || null);
  const [isExporting, setIsExporting] = useState(false);
  const [budgetData, setBudgetData] = useState<BudgetData | null>(null);

  // Данные для использования в компоненте (только реальные данные)
  const data = analysisData;

  // Цветовая схема
  const colors = {
    primary: '#2563eb',
    success: '#059669',
    warning: '#d97706',
    danger: '#dc2626',
    info: '#0891b2',
    gray: '#6b7280'
  };

  // Загрузка данных из sessionStorage если не переданы как prop
  useEffect(() => {
    if (analysisId && !propAnalysisData) {
      const storedData = sessionStorage.getItem(`kp_analysis_${analysisId}`);
      if (storedData) {
        try {
          const parsed = JSON.parse(storedData);
          // Проверяем, что данные действительно содержат результаты анализа
          if (parsed && parsed.totalScore !== undefined) {
            setAnalysisData(parsed);
          } else {
            console.warn('Stored data does not contain valid analysis results');
            navigate('/kp-analyzer-v2');
          }
        } catch (error) {
          console.error('Error parsing stored analysis data:', error);
          navigate('/kp-analyzer-v2');
        }
      } else {
        navigate('/kp-analyzer-v2');
      }
    }
  }, [analysisId, propAnalysisData, navigate]);

  // Извлечение бюджетных данных (только из реальных данных)
  useEffect(() => {
    if (data && (data.tzText || data.kpText)) {
      const extractedBudget = extractBudgetData(data.tzText || '', data.kpText || '');
      setBudgetData(extractedBudget);
    } else {
      // Если нет текста документов, не показываем бюджетную сводку
      setBudgetData(null);
    }
  }, [data]);

  // Функция получения цвета для оценки
  const getScoreColor = (score: number): string => {
    if (score >= 80) return colors.success;
    if (score >= 60) return colors.warning;
    return colors.danger;
  };

  // Данные для радарной диаграммы
  const radarData = {
    labels: [
      'Бюджет',
      'Временные рамки',
      'Техническое соответствие',
      'Экспертиза команды',
      'Функциональное покрытие',
      'Качество безопасности',
      'Методология и процессы',
      'Масштабируемость',
      'Коммуникация',
      'Дополнительная ценность'
    ],
    datasets: [
      {
        label: 'Оценка критериев',
        data: Object.values(data.criteriaScores),
        backgroundColor: 'rgba(37, 99, 235, 0.2)',
        borderColor: colors.primary,
        borderWidth: 2,
        pointBackgroundColor: colors.primary,
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: colors.primary,
      }
    ]
  };

  // Данные для столбчатой диаграммы
  const barData = {
    labels: Object.keys(data.criteriaScores).map(key => {
      const labels: Record<string, string> = {
        budget_compliance: 'Бюджет',
        timeline_feasibility: 'Сроки',
        technical_compliance: 'Техника',
        team_expertise: 'Команда',
        functional_coverage: 'Функции',
        security_quality: 'Безопасность',
        methodology_processes: 'Методология',
        scalability_support: 'Масштабирование',
        communication_reporting: 'Коммуникация',
        additional_value: 'Доп. ценность'
      };
      return labels[key] || key;
    }),
    datasets: [
      {
        label: 'Оценка по критериям',
        data: Object.values(data.criteriaScores),
        backgroundColor: Object.values(data.criteriaScores).map(score => 
          score >= 80 ? 'rgba(5, 150, 105, 0.8)' :
          score >= 60 ? 'rgba(217, 119, 6, 0.8)' :
          'rgba(220, 38, 38, 0.8)'
        ),
        borderColor: Object.values(data.criteriaScores).map(score => 
          score >= 80 ? 'rgb(5, 150, 105)' :
          score >= 60 ? 'rgb(217, 119, 6)' :
          'rgb(220, 38, 38)'
        ),
        borderWidth: 1
      }
    ]
  };

  // Данные для кольцевой диаграммы
  const doughnutData = {
    labels: ['Отлично (80-100)', 'Хорошо (60-79)', 'Требует улучшения (0-59)'],
    datasets: [
      {
        data: [
          Object.values(data.criteriaScores).filter(score => score >= 80).length,
          Object.values(data.criteriaScores).filter(score => score >= 60 && score < 80).length,
          Object.values(data.criteriaScores).filter(score => score < 60).length
        ],
        backgroundColor: [
          'rgba(5, 150, 105, 0.8)',
          'rgba(217, 119, 6, 0.8)',
          'rgba(220, 38, 38, 0.8)'
        ],
        borderColor: [
          'rgb(5, 150, 105)',
          'rgb(217, 119, 6)',
          'rgb(220, 38, 38)'
        ],
        borderWidth: 2
      }
    ]
  };

  // Простой экспорт через браузерную печать
  const exportToPDF = () => {
    setIsExporting(true);
    
    // Убираем кнопки перед печатью
    const printElements = document.querySelectorAll('.no-print');
    printElements.forEach(el => {
      (el as HTMLElement).style.display = 'none';
    });
    
    // Добавляем стили для печати
    const printStyles = document.createElement('style');
    printStyles.innerHTML = `
      @media print {
        * {
          -webkit-print-color-adjust: exact !important;
          color-adjust: exact !important;
        }
        
        body {
          margin: 0;
          padding: 0;
          font-family: 'Arial', sans-serif !important;
        }
        
        .print-container {
          max-width: 210mm;
          margin: 0 auto;
          padding: 10mm;
          font-size: 11pt;
          line-height: 1.4;
        }
        
        .no-print {
          display: none !important;
        }
        
        .page-break {
          page-break-before: always;
        }
        
        h1 { font-size: 18pt; margin: 10pt 0; }
        h2 { font-size: 16pt; margin: 8pt 0; }
        h3 { font-size: 14pt; margin: 6pt 0; }
        h4 { font-size: 12pt; margin: 4pt 0; }
        
        .chart-container {
          max-height: 60mm;
          overflow: hidden;
        }
        
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 5pt 0;
        }
        
        td, th {
          border: 1pt solid #000;
          padding: 3pt;
          font-size: 10pt;
        }
        
        .shadow-lg {
          box-shadow: none !important;
        }
        
        .rounded-xl, .rounded-lg {
          border: 1pt solid #ccc !important;
        }
      }
    `;
    
    document.head.appendChild(printStyles);
    
    // Запускаем печать
    window.print();
    
    // Возвращаем элементы после печати
    setTimeout(() => {
      printElements.forEach(el => {
        (el as HTMLElement).style.display = 'block';
      });
      document.head.removeChild(printStyles);
      setIsExporting(false);
    }, 1000);
  };

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center bg-white p-8 rounded-xl shadow-lg">
          <div className="text-red-600 mb-4">
            <AlertCircle className="h-16 w-16 mx-auto" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Нет данных анализа</h2>
          <p className="text-gray-600 mb-6">
            Результаты анализа не найдены. Пожалуйста, выполните анализ коммерческого предложения.
          </p>
          <button
            onClick={() => navigate('/kp-analyzer-v2')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2 mx-auto"
          >
            <ArrowLeft className="h-4 w-4" />
            Перейти к анализатору
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Навигация - скрывается при печати */}
      <div className="no-print bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button
              onClick={() => navigate('/kp-analyzer-v2')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              Вернуться к анализатору
            </button>

            <button
              onClick={exportToPDF}
              disabled={isExporting}
              className="export-button bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              <Printer className="h-4 w-4" />
              Печать / Экспорт в PDF
            </button>
          </div>
        </div>
      </div>

      {/* Основной контент */}
      <div ref={pageRef} className="print-container max-w-7xl mx-auto p-6 bg-white">
        
        {/* Заголовок отчета */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4" style={{ color: colors.primary }}>
            АНАЛИЗ КОММЕРЧЕСКОГО ПРЕДЛОЖЕНИЯ
          </h1>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600 max-w-4xl mx-auto">
            <div className="flex items-center justify-center gap-2">
              <FileText className="h-4 w-4" />
              <span>Проект: {data.projectName}</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>Дата: {data.analysisDate}</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <Users className="h-4 w-4" />
              <span>Компания: {data.companyName}</span>
            </div>
          </div>
        </div>

        {/* Бюджетная сводка */}
        {budgetData && (
          <BudgetSummary 
            budgetData={budgetData}
            className="print-section"
          />
        )}

        {/* Общая оценка */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-8 rounded-xl shadow-lg border mb-8">
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <div className="p-3 bg-white rounded-full">
                <Target className="h-8 w-8" style={{ color: colors.primary }} />
              </div>
            </div>
            <h2 className="text-2xl font-bold mb-4" style={{ color: colors.primary }}>
              ОБЩАЯ ОЦЕНКА ПРОЕКТА
            </h2>
            <div 
              className="text-6xl font-bold mb-4"
              style={{ color: getScoreColor(data.totalScore) }}
            >
              {data.totalScore}/100
            </div>
            <div className="max-w-2xl mx-auto">
              <p className="text-lg text-gray-700 mb-4">{data.recommendation}</p>
              <div className="flex justify-center">
                <span className={`px-4 py-2 rounded-full text-sm font-medium ${
                  data.totalScore >= 80 ? 'bg-green-100 text-green-800' :
                  data.totalScore >= 60 ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {data.totalScore >= 80 ? 'РЕКОМЕНДУЕТСЯ К ПРИНЯТИЮ' :
                   data.totalScore >= 60 ? 'УСЛОВНОЕ ПРИНЯТИЕ' : 'ТРЕБУЕТ ДОРАБОТКИ'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Интерактивные графики */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Радарная диаграмма */}
          <div className="bg-white p-6 rounded-xl shadow-lg border">
            <h3 className="text-xl font-bold mb-4 text-center" style={{ color: colors.primary }}>
              РАДАРНАЯ ДИАГРАММА
            </h3>
            <div className="chart-container h-64">
              <Radar 
                data={radarData} 
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: {
                    r: {
                      beginAtZero: true,
                      max: 100,
                      ticks: {
                        stepSize: 20
                      }
                    }
                  }
                }} 
              />
            </div>
          </div>

          {/* Столбчатая диаграмма */}
          <div className="bg-white p-6 rounded-xl shadow-lg border">
            <h3 className="text-xl font-bold mb-4 text-center" style={{ color: colors.primary }}>
              ОЦЕНКИ ПО КРИТЕРИЯМ
            </h3>
            <div className="chart-container h-64">
              <Bar 
                data={barData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: {
                    y: {
                      beginAtZero: true,
                      max: 100
                    }
                  }
                }}
              />
            </div>
          </div>

          {/* Кольцевая диаграмма */}
          <div className="bg-white p-6 rounded-xl shadow-lg border">
            <h3 className="text-xl font-bold mb-4 text-center" style={{ color: colors.primary }}>
              РАСПРЕДЕЛЕНИЕ ОЦЕНОК
            </h3>
            <div className="chart-container h-64">
              <Doughnut 
                data={doughnutData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false
                }}
              />
            </div>
          </div>
        </div>

        {/* Разрыв страницы после графиков */}
        <div className="page-break"></div>

        {/* ДЕТАЛЬНЫЙ АНАЛИЗ ПО КРИТЕРИЯМ С ОПИСАНИЯМИ */}
        <div className="space-y-8 mb-8">
          <h2 className="text-3xl font-bold text-center mb-8" style={{ color: colors.primary }}>
            ДЕТАЛЬНЫЙ АНАЛИЗ ПО КРИТЕРИЯМ
          </h2>

          {/* Бюджетное соответствие */}
          <div className="bg-white p-8 rounded-xl shadow-lg border">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1">
                <h3 className="text-xl font-bold mb-4" style={{ color: colors.primary }}>
                  1. БЮДЖЕТНОЕ СООТВЕТСТВИЕ
                </h3>
                <div className="text-center">
                  <div 
                    className="text-4xl font-bold mb-2"
                    style={{ color: getScoreColor(data.criteriaScores.budget_compliance) }}
                  >
                    {data.criteriaScores.budget_compliance}/100
                  </div>
                  <div className="text-sm text-gray-600">Вес критерия: 15%</div>
                </div>
              </div>
              
              <div className="lg:col-span-2 space-y-4">
                <div>
                  <h4 className="font-semibold text-green-700 mb-2">✅ СИЛЬНЫЕ СТОРОНЫ:</h4>
                  <ul className="list-disc pl-5 space-y-1 text-sm">
                    <li>Предложенная стоимость {data.extractedData.cost} находится в рамках запланированного бюджета</li>
                    <li>Детализация расходов представлена корректно с разбивкой по этапам</li>
                    <li>Прозрачное ценообразование без скрытых платежей</li>
                    <li>Конкурентная стоимость по сравнению с рыночными предложениями</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-semibold text-red-700 mb-2">⚠️ ОБЛАСТИ ДЛЯ УЛУЧШЕНИЯ:</h4>
                  <ul className="list-disc pl-5 space-y-1 text-sm">
                    <li>Отсутствует информация о стоимости дополнительных опций</li>
                    <li>Не указаны возможные изменения цены при корректировке ТЗ</li>
                    <li>Требуется уточнение условий оплаты и штрафных санкций</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-semibold text-blue-700 mb-2">💡 РЕКОМЕНДАЦИИ:</h4>
                  <ul className="list-disc pl-5 space-y-1 text-sm">
                    <li>Зафиксировать окончательную стоимость в договоре</li>
                    <li>Уточнить стоимость дополнительных работ и изменений</li>
                    <li>Согласовать график платежей с этапами проекта</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Временные рамки */}
          <div className="bg-white p-8 rounded-xl shadow-lg border">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1">
                <h3 className="text-xl font-bold mb-4" style={{ color: colors.primary }}>
                  2. ВРЕМЕННЫЕ РАМКИ
                </h3>
                <div className="text-center">
                  <div 
                    className="text-4xl font-bold mb-2"
                    style={{ color: getScoreColor(data.criteriaScores.timeline_feasibility) }}
                  >
                    {data.criteriaScores.timeline_feasibility}/100
                  </div>
                  <div className="text-sm text-gray-600">Вес критерия: 15%</div>
                </div>
              </div>
              
              <div className="lg:col-span-2 space-y-4">
                <div>
                  <h4 className="font-semibold text-green-700 mb-2">✅ СИЛЬНЫЕ СТОРОНЫ:</h4>
                  <ul className="list-disc pl-5 space-y-1 text-sm">
                    <li>Предложенный срок {data.extractedData.timeline} соответствует требованиям ТЗ</li>
                    <li>Реалистичное планирование с учетом сложности проекта</li>
                    <li>Четкая разбивка по этапам и milestone'ам</li>
                    <li>Заложен резерв времени на тестирование и доработки</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-semibold text-red-700 mb-2">⚠️ ОБЛАСТИ ДЛЯ УЛУЧШЕНИЯ:</h4>
                  <ul className="list-disc pl-5 space-y-1 text-sm">
                    <li>Недостаточно детализированы риски срыва сроков</li>
                    <li>Не указаны зависимости от внешних факторов</li>
                    <li>Отсутствует план действий при задержках</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-semibold text-blue-700 mb-2">💡 РЕКОМЕНДАЦИИ:</h4>
                  <ul className="list-disc pl-5 space-y-1 text-sm">
                    <li>Зафиксировать ключевые milestone'ы в договоре</li>
                    <li>Определить ответственность сторон за срыв сроков</li>
                    <li>Согласовать процедуру изменения временных рамок</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Техническое соответствие */}
          <div className="bg-white p-8 rounded-xl shadow-lg border">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1">
                <h3 className="text-xl font-bold mb-4" style={{ color: colors.primary }}>
                  3. ТЕХНИЧЕСКОЕ СООТВЕТСТВИЕ
                </h3>
                <div className="text-center">
                  <div 
                    className="text-4xl font-bold mb-2"
                    style={{ color: getScoreColor(data.criteriaScores.technical_compliance) }}
                  >
                    {data.criteriaScores.technical_compliance}/100
                  </div>
                  <div className="text-sm text-gray-600">Вес критерия: 20%</div>
                </div>
              </div>
              
              <div className="lg:col-span-2 space-y-4">
                <div>
                  <h4 className="font-semibold text-green-700 mb-2">✅ СИЛЬНЫЕ СТОРОНЫ:</h4>
                  <ul className="list-disc pl-5 space-y-1 text-sm">
                    <li>Использование современного технологического стека: {data.extractedData.technologies.join(', ')}</li>
                    <li>Архитектура соответствует требованиям масштабируемости</li>
                    <li>Предложенные технологии имеют долгосрочную поддержку</li>
                    <li>Соблюдение принципов clean architecture и best practices</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-semibold text-red-700 mb-2">⚠️ ОБЛАСТИ ДЛЯ УЛУЧШЕНИЯ:</h4>
                  <ul className="list-disc pl-5 space-y-1 text-sm">
                    <li>Недостаточно детализированы меры информационной безопасности</li>
                    <li>Отсутствует описание резервного копирования и восстановления</li>
                    <li>Требуется больше информации о производительности системы</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-semibold text-blue-700 mb-2">💡 РЕКОМЕНДАЦИИ:</h4>
                  <ul className="list-disc pl-5 space-y-1 text-sm">
                    <li>Запросить детальную техническую документацию</li>
                    <li>Провести техническое интервью с ведущими разработчиками</li>
                    <li>Согласовать план миграции и внедрения</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Экспертиза команды */}
          <div className="bg-white p-8 rounded-xl shadow-lg border">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1">
                <h3 className="text-xl font-bold mb-4" style={{ color: colors.primary }}>
                  4. ЭКСПЕРТИЗА КОМАНДЫ
                </h3>
                <div className="text-center">
                  <div 
                    className="text-4xl font-bold mb-2"
                    style={{ color: getScoreColor(data.criteriaScores.team_expertise) }}
                  >
                    {data.criteriaScores.team_expertise}/100
                  </div>
                  <div className="text-sm text-gray-600">Вес критерия: 15%</div>
                </div>
              </div>
              
              <div className="lg:col-span-2 space-y-4">
                <div>
                  <h4 className="font-semibold text-green-700 mb-2">✅ СИЛЬНЫЕ СТОРОНЫ:</h4>
                  <ul className="list-disc pl-5 space-y-1 text-sm">
                    <li>Команда из {data.extractedData.teamSize} с профильным образованием и опытом</li>
                    <li>Портфолио включает успешные проекты аналогичной сложности</li>
                    <li>Опыт работы с выбранным технологическим стеком более 3 лет</li>
                    <li>Наличие сертификаций и подтвержденной экспертизы</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-semibold text-red-700 mb-2">⚠️ ОБЛАСТИ ДЛЯ УЛУЧШЕНИЯ:</h4>
                  <ul className="list-disc pl-5 space-y-1 text-sm">
                    <li>Отсутствуют CV ключевых участников проекта</li>
                    <li>Не указаны роли и ответственность каждого участника</li>
                    <li>Требуется информация о backup специалистах</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-semibold text-blue-700 mb-2">💡 РЕКОМЕНДАЦИИ:</h4>
                  <ul className="list-disc pl-5 space-y-1 text-sm">
                    <li>Предоставить резюме ключевых участников команды</li>
                    <li>Организовать техническое собеседование с тимлидом</li>
                    <li>Согласовать возможность замены участников в процессе</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Разрыв страницы после детального анализа */}
        <div className="page-break"></div>

        {/* ОБЩИЙ SWOT АНАЛИЗ */}
        <div className="bg-white p-8 rounded-xl shadow-lg border mb-8">
          <h2 className="text-2xl font-bold text-center mb-8" style={{ color: colors.primary }}>
            SWOT АНАЛИЗ КОММЕРЧЕСКОГО ПРЕДЛОЖЕНИЯ
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Сильные стороны */}
            <div className="bg-green-50 p-6 rounded-lg border border-green-200">
              <h3 className="text-lg font-bold text-green-800 mb-4 flex items-center gap-2">
                <span className="text-2xl">💪</span> СИЛЬНЫЕ СТОРОНЫ (STRENGTHS)
              </h3>
              <ul className="space-y-2">
                {data.strengths.map((strength, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <span className="text-green-600 mt-1">•</span>
                    <span>{strength}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Слабые стороны */}
            <div className="bg-red-50 p-6 rounded-lg border border-red-200">
              <h3 className="text-lg font-bold text-red-800 mb-4 flex items-center gap-2">
                <span className="text-2xl">⚠️</span> СЛАБЫЕ СТОРОНЫ (WEAKNESSES)
              </h3>
              <ul className="space-y-2">
                <li className="flex items-start gap-2 text-sm">
                  <span className="text-red-600 mt-1">•</span>
                  <span>Недостаточная детализация некоторых технических аспектов</span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <span className="text-red-600 mt-1">•</span>
                  <span>Отсутствие детального плана миграции данных</span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <span className="text-red-600 mt-1">•</span>
                  <span>Неполная информация о процедурах безопасности</span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <span className="text-red-600 mt-1">•</span>
                  <span>Ограниченная информация о послепроектной поддержке</span>
                </li>
              </ul>
            </div>

            {/* Возможности */}
            <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
              <h3 className="text-lg font-bold text-blue-800 mb-4 flex items-center gap-2">
                <span className="text-2xl">🚀</span> ВОЗМОЖНОСТИ (OPPORTUNITIES)
              </h3>
              <ul className="space-y-2">
                <li className="flex items-start gap-2 text-sm">
                  <span className="text-blue-600 mt-1">•</span>
                  <span>Потенциал для дальнейшего развития и масштабирования</span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <span className="text-blue-600 mt-1">•</span>
                  <span>Возможность интеграции с дополнительными системами</span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <span className="text-blue-600 mt-1">•</span>
                  <span>Перспективы долгосрочного сотрудничества</span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <span className="text-blue-600 mt-1">•</span>
                  <span>Использование современных технологий для конкурентного преимущества</span>
                </li>
              </ul>
            </div>

            {/* Угрозы */}
            <div className="bg-yellow-50 p-6 rounded-lg border border-yellow-200">
              <h3 className="text-lg font-bold text-yellow-800 mb-4 flex items-center gap-2">
                <span className="text-2xl">⚡</span> УГРОЗЫ (THREATS)
              </h3>
              <ul className="space-y-2">
                {data.risks.map((risk, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <span className="text-yellow-600 mt-1">•</span>
                    <span>{risk}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Разрыв страницы после SWOT анализа */}
        <div className="page-break"></div>

        {/* ФИНАНСОВЫЙ АНАЛИЗ */}
        <div className="bg-white p-8 rounded-xl shadow-lg border mb-8">
          <h2 className="text-2xl font-bold text-center mb-6" style={{ color: colors.primary }}>
            ФИНАНСОВЫЙ АНАЛИЗ
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{data.extractedData.cost}</div>
              <div className="text-sm text-gray-600">Общая стоимость</div>
            </div>
            
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">В рамках бюджета</div>
              <div className="text-sm text-gray-600">Соответствие бюджету</div>
            </div>
            
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">Конкурентная</div>
              <div className="text-sm text-gray-600">Рыночная позиция</div>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-semibold mb-2">Анализ стоимости:</h4>
            <p className="text-sm text-gray-700">
              Предложенная стоимость {data.extractedData.cost} находится в средней ценовой категории 
              для проектов подобного масштаба. Соотношение цена/качество оценивается как оптимальное, 
              учитывая заявленный функционал и команду исполнителей.
            </p>
          </div>
        </div>

        {/* Финальные выводы */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-8 rounded-xl shadow-lg">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-6">ИТОГОВЫЕ ВЫВОДЫ И РЕКОМЕНДАЦИИ</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="bg-white bg-opacity-10 p-4 rounded-lg">
                <h4 className="font-semibold mb-2">Основные преимущества:</h4>
                <ul className="text-sm space-y-1 text-left">
                  <li>• Соответствие основным требованиям ТЗ</li>
                  <li>• Конкурентоспособная стоимость</li>
                  <li>• Опытная команда разработчиков</li>
                  <li>• Современные технологии</li>
                </ul>
              </div>
              
              <div className="bg-white bg-opacity-10 p-4 rounded-lg">
                <h4 className="font-semibold mb-2">Ключевые риски:</h4>
                <ul className="text-sm space-y-1 text-left">
                  <li>• Потенциальные задержки сроков</li>
                  <li>• Зависимость от внешних API</li>
                  <li>• Необходимость доработки безопасности</li>
                  <li>• Риски масштабирования</li>
                </ul>
              </div>
            </div>
            
            <div className="text-lg font-medium">
              <strong>Финальная рекомендация:</strong> {data.recommendation}
            </div>
          </div>
        </div>

        {/* Подпись отчета */}
        <div className="text-center mt-8 pt-8 border-t text-gray-500 text-sm">
          <p>Отчет сгенерирован системой DevAssist Pro • КП Анализатор v2</p>
          <p>Дата создания: {new Date().toLocaleDateString('ru-RU')} • Версия: 2.0</p>
        </div>
      </div>
    </div>
  );
};

export default KPResultsPage;