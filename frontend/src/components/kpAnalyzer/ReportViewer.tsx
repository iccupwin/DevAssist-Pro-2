/**
 * ReportViewer Component - Display comprehensive analysis reports
 * Based on the tender folder's report generation functionality
 */

import React, { useState } from 'react';
import { 
  FileText, 
  Download, 
  Printer, 
  Eye, 
  BarChart3,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Star
} from 'lucide-react';
import { ComprehensiveReport, ReportSection, VisualizationData } from '../../services/reportService';
import { AnalysisResult } from '../../services/ai';

interface ReportViewerProps {
  report: ComprehensiveReport;
  visualizationData: VisualizationData;
  onExportPDF: () => void;
  onPrint: () => void;
}

export const ReportViewer: React.FC<ReportViewerProps> = ({
  report,
  visualizationData,
  onExportPDF,
  onPrint
}) => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['executive-summary']));
  const [activeView, setActiveView] = useState<'report' | 'charts'>('report');

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  const renderTable = (data: any[]) => {
    if (!data || data.length === 0) return null;
    
    const headers = Object.keys(data[0]);
    
    return (
      <div className="overflow-x-auto">
        <table className="min-w-full border border-gray-200 rounded-lg">
          <thead className="bg-gray-50">
            <tr>
              {headers.map(header => (
                <th key={header} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((row, index) => (
              <tr key={index} className="hover:bg-gray-50">
                {headers.map(header => (
                  <td key={header} className="px-4 py-3 text-sm text-gray-900 border-b border-gray-100">
                    {row[header]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderSection = (section: ReportSection) => {
    const isExpanded = expandedSections.has(section.id);
    
    return (
      <div key={section.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <button
          onClick={() => toggleSection(section.id)}
          className="w-full px-6 py-4 text-left hover:bg-gray-50 focus:outline-none focus:bg-gray-50 transition-colors"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              {section.title}
            </h3>
            {isExpanded ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </div>
        </button>
        
        {isExpanded && (
          <div className="px-6 pb-6 border-t border-gray-100">
            {section.type === 'text' && (
              <div className="prose max-w-none text-gray-700 whitespace-pre-line">
                {section.content}
              </div>
            )}
            
            {section.type === 'table' && section.data && (
              <div className="mt-4">
                <p className="text-gray-700 mb-4">{section.content}</p>
                {renderTable(section.data)}
              </div>
            )}
            
            {section.type === 'list' && (
              <div className="mt-4">
                <p className="text-gray-700 mb-4">{section.content}</p>
                <ul className="list-disc list-inside space-y-2 text-gray-700">
                  {section.data?.map((item: string, index: number) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderChart = (type: keyof VisualizationData, title: string) => {
    const data = visualizationData[type];
    if (!data || data.length === 0) return null;

    // Simple bar chart representation (would use actual charting library in production)
    if (type === 'compliance' || type === 'risks') {
      const chartData = data as { name: string; score: number }[];
      const maxScore = Math.max(...chartData.map(d => d.score));
      
      return (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">{title}</h4>
          <div className="space-y-3">
            {chartData.map((item, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="w-32 text-sm text-gray-700 truncate">
                  {item.name}
                </div>
                <div className="flex-1 bg-gray-200 rounded-full h-6 relative">
                  <div 
                    className={`h-6 rounded-full ${
                      item.score >= 80 ? 'bg-green-500' :
                      item.score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${(item.score / maxScore) * 100}%` }}
                  />
                  <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-gray-900">
                    {item.score}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {report.title}
            </h1>
            <div className="flex items-center gap-6 text-sm text-gray-500">
              <span>Создан: {new Date(report.created_at).toLocaleDateString('ru-RU')}</span>
              <span>Предложений: {report.analysis_results.length}</span>
              <span>Средний балл: {report.total_score}%</span>
            </div>
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={() => setActiveView(activeView === 'report' ? 'charts' : 'report')}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                activeView === 'charts' 
                  ? 'bg-blue-50 border-blue-200 text-blue-700' 
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              {activeView === 'charts' ? <FileText className="w-4 h-4" /> : <BarChart3 className="w-4 h-4" />}
              {activeView === 'charts' ? 'Отчет' : 'Графики'}
            </button>
            
            <button
              onClick={onPrint}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              <Printer className="w-4 h-4" />
              Печать
            </button>
            
            <button
              onClick={onExportPDF}
              className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              PDF
            </button>
          </div>
        </div>
      </div>

      {activeView === 'report' ? (
        <>
          {/* Executive Summary */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-6 mb-6">
            <div className="flex items-start gap-3">
              <Star className="w-6 h-6 text-blue-600 mt-1 flex-shrink-0" />
              <div>
                <h2 className="text-xl font-semibold text-blue-900 mb-3">
                  Краткое резюме
                </h2>
                <div className="prose max-w-none text-blue-800 whitespace-pre-line">
                  {report.executive_summary}
                </div>
              </div>
            </div>
          </div>

          {/* Best Proposal Highlight */}
          {report.best_proposal && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-6 h-6 text-green-600 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="text-lg font-semibold text-green-900 mb-2">
                    Рекомендуемое предложение
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="font-medium text-green-900">{report.best_proposal.kpFileName}</p>
                      <p className="text-sm text-green-700">Общий балл: {report.best_proposal.score}%</p>
                    </div>
                    <div className="text-sm text-green-700">
                      <p>Соответствие: {report.best_proposal.analysis.compliance}%</p>
                      <p>Техническая часть: {report.best_proposal.analysis.technical}%</p>
                    </div>
                    <div className="text-sm text-green-700">
                      <p>Коммерческая часть: {report.best_proposal.analysis.commercial}%</p>
                      <p>Опыт: {report.best_proposal.analysis.experience}%</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Report Sections */}
          <div className="space-y-4 mb-6">
            {report.sections.map(renderSection)}
          </div>

          {/* Recommendations */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-6 h-6 text-yellow-600 mt-1 flex-shrink-0" />
              <div>
                <h3 className="text-lg font-semibold text-yellow-900 mb-3">
                  Ключевые рекомендации
                </h3>
                <ul className="space-y-2">
                  {report.recommendations.map((recommendation, index) => (
                    <li key={index} className="flex items-start gap-2 text-yellow-800">
                      <div className="w-1.5 h-1.5 bg-yellow-600 rounded-full mt-2 flex-shrink-0"></div>
                      {recommendation}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </>
      ) : (
        /* Charts View */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {renderChart('compliance', 'Соответствие техническому заданию')}
          {renderChart('risks', 'Анализ рисков')}
          
          {/* Ratings Comparison */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 lg:col-span-2">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">
              Сравнение по категориям
            </h4>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 text-sm font-medium text-gray-700">Предложение</th>
                    <th className="text-center py-3 text-sm font-medium text-gray-700">Соответствие</th>
                    <th className="text-center py-3 text-sm font-medium text-gray-700">Техническое</th>
                    <th className="text-center py-3 text-sm font-medium text-gray-700">Коммерческое</th>
                    <th className="text-center py-3 text-sm font-medium text-gray-700">Опыт</th>
                  </tr>
                </thead>
                <tbody>
                  {visualizationData.ratings.map((item, index) => (
                    <tr key={index} className="border-b border-gray-100">
                      <td className="py-3 text-sm text-gray-900 font-medium">
                        {item.name}
                      </td>
                      <td className="py-3 text-center">
                        <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                          item.compliance >= 80 ? 'bg-green-100 text-green-800' :
                          item.compliance >= 60 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {item.compliance}%
                        </span>
                      </td>
                      <td className="py-3 text-center">
                        <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                          item.technical >= 80 ? 'bg-green-100 text-green-800' :
                          item.technical >= 60 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {item.technical}%
                        </span>
                      </td>
                      <td className="py-3 text-center">
                        <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                          item.commercial >= 80 ? 'bg-green-100 text-green-800' :
                          item.commercial >= 60 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {item.commercial}%
                        </span>
                      </td>
                      <td className="py-3 text-center">
                        <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                          item.experience >= 80 ? 'bg-green-100 text-green-800' :
                          item.experience >= 60 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {item.experience}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};