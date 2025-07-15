/**
 * Детальный отчет с 11-пунктовой структурой для КП Анализатора
 * Интеграция новой системы генерации отчетов
 */

import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  FileText, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle,
  Users,
  DollarSign,
  Clock,
  Target,
  Shield,
  Award
} from 'lucide-react';
import { PDFExportButton } from './PDFExportButton';

interface AnalysisData {
  analysis_results: any[];
  project_info: any;
  tz_analysis: any;
}

interface DetailedReportViewerProps {
  analysisData: AnalysisData;
  onExportPDF?: () => void;
  onExportHTML?: () => void;
}

const REPORT_SECTIONS = [
  { id: 'summary', title: 'Резюме / Ключевые Выводы', icon: Target },
  { id: 'introduction', title: 'Вводная информация', icon: FileText },
  { id: 'overview', title: 'Обзор документа', icon: BarChart3 },
  { id: 'comparison', title: 'Детальное сравнение', icon: TrendingUp },
  { id: 'completeness', title: 'Анализ полноты охвата', icon: CheckCircle },
  { id: 'financial', title: 'Финансовый анализ', icon: DollarSign },
  { id: 'risks', title: 'Анализ рисков и угроз', icon: AlertTriangle },
  { id: 'solution', title: 'Оценка предложенного решения', icon: Award },
  { id: 'vendor', title: 'Оценка поставщика', icon: Users },
  { id: 'consolidated', title: 'Сводный анализ рисков', icon: Shield },
  { id: 'conclusion', title: 'Заключение и рекомендации', icon: Target }
];

export const DetailedReportViewer: React.FC<DetailedReportViewerProps> = ({
  analysisData,
  onExportPDF,
  onExportHTML
}) => {
  const [activeSection, setActiveSection] = useState('summary');
  const [sectionData, setSectionData] = useState<Record<string, any>>({});

  useEffect(() => {
    // Подготавливаем данные для каждого раздела
    prepareSectionData();
  }, [analysisData]);

  const prepareSectionData = () => {
    const results = analysisData.analysis_results || [];
    
    // Вычисляем основные метрики
    const avgScore = results.length > 0 
      ? results.reduce((sum, r) => sum + (r?.score || 0), 0) / results.length 
      : 0;
    
    const topProposal = results.length > 0 ? results.reduce((best, current) => 
      (current?.score || 0) > (best?.score || 0) ? current : best, 
      results[0]
    ) : null;

    setSectionData({
      summary: {
        avgScore,
        topProposal,
        totalProposals: results.length,
        criticalIssues: results.filter(r => (r?.score || 0) < 60).length
      },
      financial: {
        minPrice: results.length > 0 ? Math.min(...results.map(r => r?.extracted_data?.pricing || 0)) : 0,
        maxPrice: results.length > 0 ? Math.max(...results.map(r => r?.extracted_data?.pricing || 0)) : 0,
        avgPrice: results.length > 0 ? results.reduce((sum, r) => sum + (r?.extracted_data?.pricing || 0), 0) / results.length : 0
      }
    });
  };

  const renderSummarySection = () => {
    const data = sectionData.summary || {};
    
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Общий балл соответствия</p>
                <p className="text-2xl font-bold text-blue-600">{data?.avgScore?.toFixed(1) || 0}%</p>
              </div>
              <div className={`text-2xl ${(data?.avgScore || 0) >= 80 ? 'text-green-500' : (data?.avgScore || 0) >= 60 ? 'text-yellow-500' : 'text-red-500'}`}>
                <BarChart3 />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Проанализировано КП</p>
                <p className="text-2xl font-bold text-green-600">{data?.totalProposals || 0}</p>
              </div>
              <div className="text-2xl text-blue-500">
                <FileText />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Рекомендуемое решение</p>
                <p className="text-lg font-semibold text-gray-900 truncate">
                  {data?.topProposal?.company_name || 'Не определено'}
                </p>
              </div>
              <div className="text-2xl text-yellow-500">
                <Award />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Топ-3 предложения</h3>
          <div className="space-y-4">
            {analysisData?.analysis_results
              ?.sort((a, b) => (b?.score || 0) - (a?.score || 0))
              ?.slice(0, 3)
              ?.map((proposal, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold
                      ${index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : 'bg-orange-400'}`}>
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{proposal?.company_name || `Компания ${index + 1}`}</p>
                      <p className="text-sm text-gray-500">
                        {proposal?.extracted_data?.timeline || 'Сроки не указаны'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-lg font-bold ${
                      (proposal?.score || 0) >= 80 ? 'text-green-600' : 
                      (proposal?.score || 0) >= 60 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {proposal?.score || 0}%
                    </p>
                    <p className="text-sm text-gray-500">
                      {proposal?.extracted_data?.pricing ? 
                        `${proposal.extracted_data.pricing.toLocaleString()} ₽` : 
                        'Цена не указана'
                      }
                    </p>
                  </div>
                </div>
              ))
            }
          </div>
        </div>
      </div>
    );
  };

  const renderIntroductionSection = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Информация о проекте</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium text-gray-600">Название проекта</p>
            <p className="text-gray-900">{analysisData?.project_info?.name || 'Не указано'}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">Дата анализа</p>
            <p className="text-gray-900">{new Date().toLocaleDateString('ru-RU')}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">Количество КП</p>
            <p className="text-gray-900">{analysisData?.analysis_results?.length || 0}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">Заказчик</p>
            <p className="text-gray-900">{analysisData?.project_info?.client || 'Не указан'}</p>
          </div>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-4">Методология анализа</h3>
        <div className="space-y-2 text-blue-800">
          <p><strong>Критерии оценки:</strong></p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li>Техническое соответствие (30%)</li>
            <li>Функциональная полнота (30%)</li>
            <li>Экономическая эффективность (20%)</li>
            <li>Реалистичность сроков (10%)</li>
            <li>Надежность поставщика (10%)</li>
          </ul>
          <p className="mt-4"><strong>AI модели:</strong> Claude 3.5 Sonnet, GPT-4o для анализа и сравнения</p>
        </div>
      </div>
    </div>
  );

  const renderFinancialSection = () => {
    const data = sectionData.financial || {};
    
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <p className="text-sm font-medium text-gray-600">Минимальная цена</p>
            <p className="text-2xl font-bold text-green-600">
              {data?.minPrice?.toLocaleString() || 0} ₽
            </p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <p className="text-sm font-medium text-gray-600">Максимальная цена</p>
            <p className="text-2xl font-bold text-red-600">
              {data?.maxPrice?.toLocaleString() || 0} ₽
            </p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <p className="text-sm font-medium text-gray-600">Средняя цена</p>
            <p className="text-2xl font-bold text-blue-600">
              {data?.avgPrice?.toLocaleString() || 0} ₽
            </p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <p className="text-sm font-medium text-gray-600">Разброс</p>
            <p className="text-2xl font-bold text-purple-600">
              {data?.maxPrice && data?.minPrice && data?.avgPrice ? 
                ((data.maxPrice - data.minPrice) / data.avgPrice * 100).toFixed(1) : 0}%
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Сравнение стоимости</h3>
          <div className="space-y-4">
            {analysisData?.analysis_results?.map((result, index) => {
              const price = result?.extracted_data?.pricing || 0;
              const maxPrice = data?.maxPrice || 1;
              const widthPercent = (price / maxPrice) * 100;
              
              return (
                <div key={index} className="flex items-center space-x-4">
                  <div className="w-32 text-sm font-medium text-gray-900 truncate">
                    {result?.company_name || `Компания ${index + 1}`}
                  </div>
                  <div className="flex-1 bg-gray-200 rounded-full h-6 relative">
                    <div 
                      className="bg-blue-600 h-6 rounded-full flex items-center justify-end pr-2"
                      style={{ width: `${widthPercent}%` }}
                    >
                      <span className="text-white text-xs font-medium">
                        {price.toLocaleString()} ₽
                      </span>
                    </div>
                  </div>
                  <div className="w-20 text-right">
                    <span className={`text-sm font-medium ${
                      (result?.score || 0) >= 80 ? 'text-green-600' : 
                      (result?.score || 0) >= 60 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {result?.score || 0}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const renderSection = (sectionId: string) => {
    switch (sectionId) {
      case 'summary':
        return renderSummarySection();
      case 'introduction':
        return renderIntroductionSection();
      case 'financial':
        return renderFinancialSection();
      default:
        return (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <FileText size={48} />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Раздел в разработке
              </h3>
              <p className="text-gray-500">
                Этот раздел отчета будет добавлен в следующих обновлениях
              </p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="flex h-full bg-gray-50">
      {/* Навигация по разделам */}
      <div className="w-80 bg-white border-r border-gray-200 overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Детальный отчет</h2>
          <p className="text-sm text-gray-500 mt-1">11-пунктовая структура анализа</p>
        </div>
        
        <nav className="p-4">
          <ul className="space-y-2">
            {REPORT_SECTIONS.map((section, index) => {
              const Icon = section.icon;
              const isActive = activeSection === section.id;
              
              return (
                <li key={section.id}>
                  <button
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                      isActive 
                        ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <div className={`flex-shrink-0 ${isActive ? 'text-blue-600' : 'text-gray-400'}`}>
                      <Icon size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className={`text-xs font-medium px-2 py-1 rounded ${
                          isActive ? 'bg-blue-200 text-blue-800' : 'bg-gray-200 text-gray-600'
                        }`}>
                          {index + 1}
                        </span>
                        <span className="text-sm font-medium truncate">{section.title}</span>
                      </div>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Кнопки экспорта */}
        <div className="p-4 border-t border-gray-200">
          <div className="space-y-2">
            <button
              onClick={onExportHTML}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              Экспорт HTML
            </button>
            <PDFExportButton
              results={analysisData?.analysis_results?.map(result => ({
                id: result.id || `result-${Math.random()}`,
                companyName: result.company_name || result.companyName || 'Неизвестная компания',
                overallRating: result.score || result.overallRating || 0,
                technicalRating: result.technicalRating || 0,
                financialRating: result.financialRating || 0,
                timelineRating: result.timelineRating || 0,
                complianceScore: result.score || result.complianceScore || 0,
                strengths: result.strengths || [],
                weaknesses: result.weaknesses || [],
                recommendations: result.recommendations || [],
                detailedAnalysis: result.detailedAnalysis || '',
                analyzedAt: result.analyzedAt || new Date().toISOString(),
                model: result.model || 'Unknown',
                fileName: result.fileName,
                pricing: result.extracted_data?.pricing,
                timeline: result.extracted_data?.timeline,
              })) || []}
              comparison={{
                summary: 'Проведен детальный анализ коммерческих предложений',
                ranking: analysisData?.analysis_results?.map((result, index) => ({
                  kpId: result.id || `result-${index}`,
                  rank: index + 1,
                  totalScore: result.score || 0,
                  summary: `Анализ ${result.company_name || result.companyName || 'КП'}`
                })) || [],
                recommendations: ['Выберите предложение с лучшим соотношением цена-качество'],
                bestChoice: analysisData?.analysis_results?.reduce((best, current) => 
                  (current.score || 0) > (best.score || 0) ? current : best
                )?.company_name || 'Не определено',
                analyzedAt: new Date().toISOString()
              }}
              className="w-full"
              variant="secondary"
            />
          </div>
        </div>
      </div>

      {/* Содержимое раздела */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">
              {REPORT_SECTIONS.find(s => s.id === activeSection)?.title}
            </h1>
            <p className="text-gray-500 mt-1">
              Раздел {REPORT_SECTIONS.findIndex(s => s.id === activeSection) + 1} из {REPORT_SECTIONS.length}
            </p>
          </div>
          
          {renderSection(activeSection)}
        </div>
      </div>
    </div>
  );
};