import React, { useState } from 'react';
import { 
  FileText, 
  TrendingUp, 
  TrendingDown, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Download,
  ArrowLeft,
  DollarSign,
  Clock,
  Target,
  Building,
  Star,
  BarChart3,
  Shield,
  Users,
  Zap,
  Calendar,
  Award
} from 'lucide-react';
import { Button } from '../ui/Button';
import { KPAnalysisResult } from '../../types/kpAnalyzer';

interface KPDetailedReportProps {
  result: KPAnalysisResult;
  onBack: () => void;
  onExportPDF: () => void;
  tzName: string;
  allResults?: KPAnalysisResult[];
}

export const KPDetailedReport: React.FC<KPDetailedReportProps> = ({
  result,
  onBack,
  onExportPDF,
  tzName,
  allResults = []
}) => {
  const [activeSection, setActiveSection] = useState<string>('summary');

  // Функция для получения цвета рейтинга
  const getRatingColor = (score: number): string => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  // Функция для получения цвета фона рейтинга
  const getRatingBgColor = (score: number): string => {
    if (score >= 80) return 'bg-green-100 border-green-300';
    if (score >= 60) return 'bg-yellow-100 border-yellow-300';
    return 'bg-red-100 border-red-300';
  };

  // Функция для получения статуса рекомендации
  const getRecommendationStatus = (score: number): string => {
    if (score >= 80) return 'Рекомендуется к принятию';
    if (score >= 60) return 'Требует доработки';
    return 'Рекомендуется к отклонению';
  };

  // Функция для получения позиции в рейтинге
  const getRankPosition = (): number => {
    if (allResults.length === 0) return 1;
    const sortedResults = [...allResults].sort((a, b) => b.complianceScore - a.complianceScore);
    return sortedResults.findIndex(r => r.id === result.id) + 1;
  };

  // Навигация по разделам
  const sections = [
    { id: 'summary', name: 'Резюме', icon: Star },
    { id: 'overview', name: 'Обзор КП', icon: FileText },
    { id: 'compliance', name: 'Соответствие ТЗ', icon: Target },
    { id: 'financial', name: 'Финансовый анализ', icon: DollarSign },
    { id: 'technical', name: 'Техническое решение', icon: Zap },
    { id: 'risks', name: 'Анализ рисков', icon: Shield },
    { id: 'comparison', name: 'Сравнение', icon: BarChart3 },
    { id: 'recommendation', name: 'Рекомендации', icon: Award }
  ];

  const currentDate = new Date().toLocaleDateString('ru-RU');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Заголовок */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center">
          <Button
            variant="outline"
            onClick={onBack}
            className="mr-4 flex items-center"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Назад
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Детальный отчет: {result.companyName}
            </h1>
            <p className="text-gray-600 mt-1">
              Анализ КП по ТЗ "{tzName}" • {currentDate}
            </p>
          </div>
        </div>
        <Button
          onClick={onExportPDF}
          className="flex items-center"
        >
          <Download className="w-4 h-4 mr-2" />
          Сохранить PDF
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Навигация */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sticky top-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Разделы отчета</h3>
            <nav className="space-y-2">
              {sections.map((section) => {
                const IconComponent = section.icon;
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full flex items-center px-3 py-2 rounded-lg text-left transition-colors ${
                      activeSection === section.id
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <IconComponent className="w-4 h-4 mr-3" />
                    {section.name}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Содержание */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            
            {/* 1. Резюме */}
            {activeSection === 'summary' && (
              <div className="p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                  <Star className="w-6 h-6 mr-2 text-yellow-600" />
                  Резюме / Ключевые выводы
                </h2>

                {/* Общая оценка */}
                <div className={`p-6 rounded-lg border-2 mb-6 ${getRatingBgColor(result.complianceScore)}`}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Общая оценка соответствия
                    </h3>
                    <div className="flex items-center">
                      <div className="text-3xl font-bold mr-2">
                        {result.complianceScore}%
                      </div>
                      {result.complianceScore >= 80 ? (
                        <CheckCircle className="w-8 h-8 text-green-600" />
                      ) : result.complianceScore >= 60 ? (
                        <AlertTriangle className="w-8 h-8 text-yellow-600" />
                      ) : (
                        <XCircle className="w-8 h-8 text-red-600" />
                      )}
                    </div>
                  </div>
                  <p className="text-gray-700">
                    {getRecommendationStatus(result.complianceScore)}
                  </p>
                </div>

                {/* Статистики */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Позиция в рейтинге</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {getRankPosition()} из {allResults.length}
                        </p>
                      </div>
                      <Award className="w-8 h-8 text-blue-600" />
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Сильные стороны</p>
                        <p className="text-2xl font-bold text-green-600">
                          {result.strengths.length}
                        </p>
                      </div>
                      <TrendingUp className="w-8 h-8 text-green-600" />
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Недостатки</p>
                        <p className="text-2xl font-bold text-red-600">
                          {result.weaknesses.length}
                        </p>
                      </div>
                      <TrendingDown className="w-8 h-8 text-red-600" />
                    </div>
                  </div>
                </div>

                {/* Ключевые моменты */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-lg font-semibold text-green-700 mb-3 flex items-center">
                      <TrendingUp className="w-5 h-5 mr-2" />
                      Ключевые преимущества
                    </h4>
                    <ul className="space-y-2">
                      {result.strengths.slice(0, 5).map((strength, index) => (
                        <li key={index} className="flex items-start">
                          <CheckCircle className="w-4 h-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-gray-700">{strength}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-red-700 mb-3 flex items-center">
                      <TrendingDown className="w-5 h-5 mr-2" />
                      Ключевые недостатки
                    </h4>
                    <ul className="space-y-2">
                      {result.weaknesses.slice(0, 5).map((weakness, index) => (
                        <li key={index} className="flex items-start">
                          <XCircle className="w-4 h-4 text-red-600 mr-2 mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-gray-700">{weakness}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* 2. Обзор КП */}
            {activeSection === 'overview' && (
              <div className="p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                  <FileText className="w-6 h-6 mr-2 text-blue-600" />
                  Обзор коммерческого предложения
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                      <Building className="w-5 h-5 mr-2" />
                      Информация о компании
                    </h3>
                    <div className="space-y-2">
                      <p><strong>Название:</strong> {result.companyName}</p>
                      <p><strong>Файл КП:</strong> {result.fileName}</p>
                      <p><strong>Дата анализа:</strong> {currentDate}</p>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                      <Zap className="w-5 h-5 mr-2" />
                      Предложенное решение
                    </h3>
                    <div className="space-y-2">
                      <p><strong>Технологии:</strong> {result.techStack || 'Не указано'}</p>
                      <p><strong>Подход:</strong> {result.approach || 'Не указано'}</p>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                      <DollarSign className="w-5 h-5 mr-2" />
                      Финансовые условия
                    </h3>
                    <div className="space-y-2">
                      <p><strong>Стоимость:</strong> {result.pricing || 'Не указано'}</p>
                      <p><strong>Модель оплаты:</strong> {result.paymentModel || 'Не указано'}</p>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                      <Clock className="w-5 h-5 mr-2" />
                      Временные рамки
                    </h3>
                    <div className="space-y-2">
                      <p><strong>Сроки:</strong> {result.timeline || 'Не указано'}</p>
                      <p><strong>Этапы:</strong> {result.phases || 'Не указано'}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 3. Соответствие ТЗ */}
            {activeSection === 'compliance' && (
              <div className="p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                  <Target className="w-6 h-6 mr-2 text-green-600" />
                  Анализ соответствия ТЗ
                </h2>

                {/* Общее соответствие */}
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Общее соответствие техническому заданию
                    </h3>
                    <div className={`px-4 py-2 rounded-full text-lg font-bold ${getRatingBgColor(result.complianceScore)}`}>
                      {result.complianceScore}%
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full transition-all duration-300 ${
                        result.complianceScore >= 80 ? 'bg-green-500' :
                        result.complianceScore >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${result.complianceScore}%` }}
                    />
                  </div>
                </div>

                {/* Недостающие требования */}
                {result.missingRequirements.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-red-700 mb-3 flex items-center">
                      <XCircle className="w-5 h-5 mr-2" />
                      Недостающие требования ({result.missingRequirements.length})
                    </h3>
                    <div className="bg-red-50 rounded-lg p-4">
                      <ul className="space-y-2">
                        {result.missingRequirements.map((requirement, index) => (
                          <li key={index} className="flex items-start">
                            <span className="text-red-600 mr-2 mt-1">•</span>
                            <span className="text-gray-700">{requirement}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {/* Дополнительные возможности */}
                {result.additionalFeatures.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-green-700 mb-3 flex items-center">
                      <CheckCircle className="w-5 h-5 mr-2" />
                      Дополнительные возможности ({result.additionalFeatures.length})
                    </h3>
                    <div className="bg-green-50 rounded-lg p-4">
                      <ul className="space-y-2">
                        {result.additionalFeatures.map((feature, index) => (
                          <li key={index} className="flex items-start">
                            <span className="text-green-600 mr-2 mt-1">•</span>
                            <span className="text-gray-700">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 4. Финансовый анализ */}
            {activeSection === 'financial' && (
              <div className="p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                  <DollarSign className="w-6 h-6 mr-2 text-green-600" />
                  Финансовый анализ
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">
                      Структура цены
                    </h3>
                    <div className="space-y-2">
                      <p><strong>Общая стоимость:</strong> {result.pricing || 'Не указано'}</p>
                      <p><strong>Модель оплаты:</strong> {result.paymentModel || 'Не указано'}</p>
                      <p><strong>Валюта:</strong> {result.currency || 'RUB'}</p>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">
                      Анализ стоимости
                    </h3>
                    <div className="space-y-2">
                      <p><strong>Соотношение цена/качество:</strong> {
                        result.complianceScore >= 80 ? 'Отличное' :
                        result.complianceScore >= 60 ? 'Хорошее' : 'Требует анализа'
                      }</p>
                      <p><strong>Рыночная позиция:</strong> В пределах рынка</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 5. Техническое решение */}
            {activeSection === 'technical' && (
              <div className="p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                  <Zap className="w-6 h-6 mr-2 text-blue-600" />
                  Техническое решение
                </h2>

                <div className="space-y-6">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">
                      Технологический стек
                    </h3>
                    <p className="text-gray-700">{result.techStack || 'Не указано в КП'}</p>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">
                      Подход к реализации
                    </h3>
                    <p className="text-gray-700">{result.approach || 'Не указано в КП'}</p>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">
                      Архитектурные решения
                    </h3>
                    <p className="text-gray-700">
                      {result.architecture || 'Требует уточнения у исполнителя'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* 6. Анализ рисков */}
            {activeSection === 'risks' && (
              <div className="p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                  <Shield className="w-6 h-6 mr-2 text-red-600" />
                  Анализ рисков
                </h2>

                <div className="space-y-6">
                  <div className="bg-red-50 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-red-700 mb-3">
                      Высокие риски
                    </h3>
                    <ul className="space-y-2">
                      {result.missingRequirements.slice(0, 3).map((risk, index) => (
                        <li key={index} className="flex items-start">
                          <AlertTriangle className="w-4 h-4 text-red-600 mr-2 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-700">{risk}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-yellow-50 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-yellow-700 mb-3">
                      Средние риски
                    </h3>
                    <ul className="space-y-2">
                      {result.weaknesses.slice(0, 3).map((risk, index) => (
                        <li key={index} className="flex items-start">
                          <AlertTriangle className="w-4 h-4 text-yellow-600 mr-2 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-700">{risk}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* 7. Сравнение с другими КП */}
            {activeSection === 'comparison' && allResults.length > 1 && (
              <div className="p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                  <BarChart3 className="w-6 h-6 mr-2 text-purple-600" />
                  Сравнение с другими предложениями
                </h2>

                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    Позиция в общем рейтинге
                  </h3>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700">
                      {getRankPosition()} место из {allResults.length} предложений
                    </span>
                    <div className="flex items-center space-x-2">
                      {getRankPosition() === 1 && (
                        <Star className="w-6 h-6 text-yellow-500" />
                      )}
                      <span className="text-2xl font-bold text-gray-900">
                        {result.complianceScore}%
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  {allResults
                    .filter(r => r.id !== result.id)
                    .sort((a, b) => b.complianceScore - a.complianceScore)
                    .map((otherResult, index) => (
                      <div key={otherResult.id} className="bg-white border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-semibold text-gray-900">
                              {otherResult.companyName}
                            </h4>
                            <p className="text-sm text-gray-600">
                              {otherResult.complianceScore > result.complianceScore ? 'Выше' : 'Ниже'} текущего предложения
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-gray-900">
                              {otherResult.complianceScore}%
                            </div>
                            <div className={`text-sm ${
                              otherResult.complianceScore > result.complianceScore ? 'text-red-600' : 'text-green-600'
                            }`}>
                              {otherResult.complianceScore > result.complianceScore ? '+' : ''}
                              {otherResult.complianceScore - result.complianceScore}%
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* 8. Итоговые рекомендации */}
            {activeSection === 'recommendation' && (
              <div className="p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                  <Award className="w-6 h-6 mr-2 text-blue-600" />
                  Заключение и рекомендации
                </h2>

                <div className={`p-6 rounded-lg border-2 mb-6 ${getRatingBgColor(result.complianceScore)}`}>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    Итоговая рекомендация
                  </h3>
                  <p className="text-lg text-gray-700">
                    {getRecommendationStatus(result.complianceScore)}
                  </p>
                </div>

                <div className="space-y-6">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">
                      Критические вопросы для переговоров
                    </h3>
                    <ul className="space-y-2">
                      {[...result.missingRequirements, ...result.weaknesses]
                        .slice(0, 5)
                        .map((point, index) => (
                          <li key={index} className="flex items-start">
                            <span className="text-blue-600 mr-2 font-bold">{index + 1}.</span>
                            <span className="text-gray-700">{point}</span>
                          </li>
                        ))}
                    </ul>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">
                      Предлагаемые следующие шаги
                    </h3>
                    <ul className="space-y-2">
                      {result.complianceScore >= 80 ? (
                        <>
                          <li className="flex items-start">
                            <CheckCircle className="w-4 h-4 text-green-600 mr-2 mt-0.5" />
                            <span className="text-gray-700">Начать подготовку договора</span>
                          </li>
                          <li className="flex items-start">
                            <CheckCircle className="w-4 h-4 text-green-600 mr-2 mt-0.5" />
                            <span className="text-gray-700">Согласовать финальный план работ</span>
                          </li>
                        </>
                      ) : result.complianceScore >= 60 ? (
                        <>
                          <li className="flex items-start">
                            <AlertTriangle className="w-4 h-4 text-yellow-600 mr-2 mt-0.5" />
                            <span className="text-gray-700">Запросить разъяснения по критическим вопросам</span>
                          </li>
                          <li className="flex items-start">
                            <AlertTriangle className="w-4 h-4 text-yellow-600 mr-2 mt-0.5" />
                            <span className="text-gray-700">Провести встречу для обсуждения условий</span>
                          </li>
                        </>
                      ) : (
                        <>
                          <li className="flex items-start">
                            <XCircle className="w-4 h-4 text-red-600 mr-2 mt-0.5" />
                            <span className="text-gray-700">Уведомить поставщика об отклонении</span>
                          </li>
                          <li className="flex items-start">
                            <XCircle className="w-4 h-4 text-red-600 mr-2 mt-0.5" />
                            <span className="text-gray-700">Рассмотреть альтернативные предложения</span>
                          </li>
                        </>
                      )}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default KPDetailedReport;