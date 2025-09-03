/**
 * Detailed Analysis Results - Полностью переделанное отображение результатов КП анализа
 * Карточки, интерактивные таблицы, графики, структурированная информация
 */

import React, { useState, useEffect } from 'react';
import {
  ChevronDown,
  ChevronUp,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle,
  Star,
  Target,
  DollarSign,
  Clock,
  Users,
  Shield,
  Zap,
  BarChart3,
  PieChart,
  Eye,
  EyeOff,
  Filter,
  Search
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart as RechartsPieChart, Cell, ResponsiveContainer, LineChart, Line } from 'recharts';
import { AnalysisData, AnalysisSection, MetricData, TableData, ChartData, RecommendationData } from '../../services/pdf/PDFExporter';
import EnhancedPDFExportButton from './EnhancedPDFExportButton';
import SaveAnalysisDialog from './SaveAnalysisDialog';

interface DetailedAnalysisResultsProps {
  analysisData: AnalysisData;
  onNewAnalysis?: () => void;
  className?: string;
}

interface ViewMode {
  showCharts: boolean;
  showTables: boolean;
  showRecommendations: boolean;
  expandAll: boolean;
}

// Цветовая схема для графиков
const COLORS = ['#1e40af', '#7c3aed', '#059669', '#dc2626', '#d97706', '#db2777'];

const DetailedAnalysisResults: React.FC<DetailedAnalysisResultsProps> = ({
  analysisData,
  onNewAnalysis,
  className = ''
}) => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['budget_analysis']));
  const [viewMode, setViewMode] = useState<ViewMode>({
    showCharts: true,
    showTables: true,
    showRecommendations: true,
    expandAll: false
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [showSaveDialog, setShowSaveDialog] = useState(false);

  // Фильтрация секций по поисковому запросу
  const filteredSections = React.useMemo(() => {
    if (!searchQuery.trim()) return analysisData.sections;
    
    const query = searchQuery.toLowerCase();
    return analysisData.sections.filter(section =>
      section.title.toLowerCase().includes(query) ||
      section.detailed_analysis.toLowerCase().includes(query) ||
      section.recommendations?.some(rec => rec.text.toLowerCase().includes(query))
    );
  }, [analysisData.sections, searchQuery]);

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  const toggleExpandAll = () => {
    if (viewMode.expandAll) {
      setExpandedSections(new Set());
    } else {
      setExpandedSections(new Set(filteredSections.map(s => s.id)));
    }
    setViewMode(prev => ({ ...prev, expandAll: !prev.expandAll }));
  };

  const getScoreColor = (score: number): string => {
    if (score >= 80) return 'text-green-600 bg-green-50 border-green-200';
    if (score >= 60) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getScoreIcon = (score: number) => {
    if (score >= 80) return <CheckCircle className="w-5 h-5 text-green-600" />;
    if (score >= 60) return <AlertCircle className="w-5 h-5 text-yellow-600" />;
    return <AlertCircle className="w-5 h-5 text-red-600" />;
  };

  const renderMetricCard = (metric: MetricData, index: number) => {
    return (
      <div
        key={index}
        className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
      >
        <div className="text-center">
          <div className={`text-2xl font-bold ${metric.color === 'red' ? 'text-red-600' : 
            metric.color === 'green' ? 'text-green-600' : 
            metric.color === 'yellow' ? 'text-yellow-600' : 'text-blue-600'}`}>
            {metric.value}
          </div>
          <div className="text-sm text-gray-600 mt-1">{metric.name}</div>
        </div>
      </div>
    );
  };

  const renderDataTable = (table: TableData, sectionId: string) => {
    return (
      <div key={table.title} className="bg-gray-50 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-3 flex items-center">
          <BarChart3 className="w-4 h-4 mr-2 text-blue-600" />
          {table.title}
        </h4>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white rounded-lg shadow-sm">
            <thead>
              <tr className="bg-blue-600 text-white">
                {table.columns.map((column, index) => (
                  <th key={index} className="px-4 py-3 text-left text-sm font-semibold">
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {table.data.map((row, rowIndex) => (
                <tr 
                  key={rowIndex}
                  className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                >
                  {row.map((cell, cellIndex) => (
                    <td key={cellIndex} className="px-4 py-3 text-sm text-gray-900">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderChart = (chart: ChartData, sectionId: string) => {
    return (
      <div key={chart.title} className="bg-white rounded-lg border border-gray-200 p-4">
        <h4 className="font-medium text-gray-900 mb-3 flex items-center">
          <PieChart className="w-4 h-4 mr-2 text-purple-600" />
          {chart.title}
        </h4>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            {chart.type === 'bar' ? (
              <BarChart data={chart.data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value: any) => typeof value === 'number' ? value.toLocaleString('ru-RU') : value} />
                <Legend />
                {Object.keys(chart.data[0] || {}).filter(key => key !== 'name').map((key, index) => (
                  <Bar key={key} dataKey={key} fill={COLORS[index % COLORS.length]} />
                ))}
              </BarChart>
            ) : chart.type === 'pie' ? (
              <RechartsPieChart>
                <Tooltip />
                <RechartsPieChart data={chart.data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}>
                  {chart.data.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </RechartsPieChart>
              </RechartsPieChart>
            ) : (
              <LineChart data={chart.data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="value" stroke={COLORS[0]} strokeWidth={2} />
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  const renderRecommendations = (recommendations: RecommendationData[]) => {
    const groupedRecs = {
      HIGH: recommendations.filter(r => r.priority === 'HIGH'),
      MEDIUM: recommendations.filter(r => r.priority === 'MEDIUM'),
      LOW: recommendations.filter(r => r.priority === 'LOW')
    };

    return (
      <div className="space-y-4">
        {Object.entries(groupedRecs).map(([priority, recs]) => {
          if (recs.length === 0) return null;
          
          const priorityColors = {
            HIGH: 'border-red-200 bg-red-50 text-red-800',
            MEDIUM: 'border-yellow-200 bg-yellow-50 text-yellow-800',
            LOW: 'border-green-200 bg-green-50 text-green-800'
          };

          const priorityLabels = {
            HIGH: 'Высокий приоритет',
            MEDIUM: 'Средний приоритет',
            LOW: 'Низкий приоритет'
          };

          return (
            <div key={priority}>
              <h5 className={`font-medium mb-2 px-3 py-1 rounded text-sm ${priorityColors[priority as keyof typeof priorityColors]}`}>
                {priorityLabels[priority as keyof typeof priorityLabels]} ({recs.length})
              </h5>
              <div className="space-y-2">
                {recs.map((rec, index) => (
                  <div key={index} className="flex items-start p-3 bg-white border border-gray-200 rounded-lg">
                    <div className={`w-3 h-3 rounded-full mt-1 mr-3 flex-shrink-0 ${
                      priority === 'HIGH' ? 'bg-red-500' : 
                      priority === 'MEDIUM' ? 'bg-yellow-500' : 'bg-green-500'
                    }`} />
                    <p className="text-sm text-gray-700">{rec.text}</p>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className={`max-w-7xl mx-auto space-y-8 ${className}`}>
      {/* Header Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl p-8 shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">📊 Результаты анализа КП</h1>
            <p className="text-blue-100 text-lg">
              {analysisData.title || `Анализ от ${new Date(analysisData.created_at || '').toLocaleDateString('ru-RU')}`}
            </p>
            <div className="flex items-center mt-4 space-x-6 text-sm text-blue-100">
              <span>📄 ТЗ: {analysisData.tz_filename || 'Не указано'}</span>
              <span>📑 КП: {analysisData.kp_filenames?.length || 0} файл(ов)</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-6xl font-bold mb-2">{analysisData.overall_score}</div>
            <div className="text-xl">из 100</div>
            <div className="mt-2 text-blue-200">Общая оценка</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3 mt-6 pt-6 border-t border-blue-400">
          <EnhancedPDFExportButton
            analysisData={analysisData}
            variant="secondary"
            size="md"
            title="Скачать PDF"
            showSettings={true}
          />
          <button
            onClick={() => setShowSaveDialog(true)}
            className="inline-flex items-center px-4 py-2 bg-white bg-opacity-20 text-white rounded-lg hover:bg-opacity-30 transition-all"
          >
            <Star className="w-4 h-4 mr-2" />
            Сохранить анализ
          </button>
          {onNewAnalysis && (
            <button
              onClick={onNewAnalysis}
              className="inline-flex items-center px-4 py-2 bg-white bg-opacity-20 text-white rounded-lg hover:bg-opacity-30 transition-all"
            >
              <Target className="w-4 h-4 mr-2" />
              Новый анализ
            </button>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6 text-center shadow-sm">
          <div className="text-3xl font-bold text-blue-600 mb-2">{analysisData.overall_score}</div>
          <div className="text-sm text-gray-600">Общий балл</div>
          <div className="mt-2">{getScoreIcon(analysisData.overall_score)}</div>
        </div>
        
        <div className="bg-white rounded-xl border border-gray-200 p-6 text-center shadow-sm">
          <div className="text-3xl font-bold text-green-600 mb-2">{analysisData.compliance_percentage || 0}%</div>
          <div className="text-sm text-gray-600">Соответствие ТЗ</div>
          <div className="mt-2"><CheckCircle className="w-5 h-5 text-green-600 mx-auto" /></div>
        </div>
        
        <div className="bg-white rounded-xl border border-gray-200 p-6 text-center shadow-sm">
          <div className={`text-3xl font-bold mb-2 ${
            (analysisData.budget_deviation || 0) > 0 ? 'text-red-600' : 'text-green-600'
          }`}>
            {(analysisData.budget_deviation || 0) > 0 ? '+' : ''}{analysisData.budget_deviation || 0}%
          </div>
          <div className="text-sm text-gray-600">Бюджетное отклонение</div>
          <div className="mt-2">
            {(analysisData.budget_deviation || 0) > 0 ? 
              <TrendingUp className="w-5 h-5 text-red-600 mx-auto" /> :
              <TrendingDown className="w-5 h-5 text-green-600 mx-auto" />
            }
          </div>
        </div>
        
        <div className="bg-white rounded-xl border border-gray-200 p-6 text-center shadow-sm">
          <div className="text-3xl font-bold text-purple-600 mb-2">{analysisData.sections.length}</div>
          <div className="text-sm text-gray-600">Разделов анализа</div>
          <div className="mt-2"><BarChart3 className="w-5 h-5 text-purple-600 mx-auto" /></div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Поиск по разделам..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setViewMode(prev => ({ ...prev, showCharts: !prev.showCharts }))}
              className={`inline-flex items-center px-3 py-2 rounded-lg text-sm ${
                viewMode.showCharts 
                  ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                  : 'bg-gray-100 text-gray-700 border border-gray-200'
              }`}
            >
              {viewMode.showCharts ? <Eye className="w-4 h-4 mr-1" /> : <EyeOff className="w-4 h-4 mr-1" />}
              Графики
            </button>

            <button
              onClick={() => setViewMode(prev => ({ ...prev, showTables: !prev.showTables }))}
              className={`inline-flex items-center px-3 py-2 rounded-lg text-sm ${
                viewMode.showTables 
                  ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                  : 'bg-gray-100 text-gray-700 border border-gray-200'
              }`}
            >
              {viewMode.showTables ? <Eye className="w-4 h-4 mr-1" /> : <EyeOff className="w-4 h-4 mr-1" />}
              Таблицы
            </button>

            <button
              onClick={toggleExpandAll}
              className="inline-flex items-center px-3 py-2 bg-gray-100 text-gray-700 border border-gray-200 rounded-lg text-sm hover:bg-gray-200 transition-colors"
            >
              {viewMode.expandAll ? <ChevronUp className="w-4 h-4 mr-1" /> : <ChevronDown className="w-4 h-4 mr-1" />}
              {viewMode.expandAll ? 'Свернуть все' : 'Развернуть все'}
            </button>
          </div>
        </div>
      </div>

      {/* Analysis Sections */}
      <div className="space-y-6">
        {filteredSections.map((section, index) => {
          const isExpanded = expandedSections.has(section.id);
          
          return (
            <div key={section.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              {/* Section Header */}
              <div
                onClick={() => toggleSection(section.id)}
                className="flex items-center justify-between p-6 cursor-pointer hover:bg-gray-50 transition-colors border-b border-gray-100"
              >
                <div className="flex items-center space-x-4">
                  <div className="text-2xl">{section.icon || '📊'}</div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">{section.title}</h3>
                    <div className="flex items-center space-x-4 mt-1">
                      <div className={`px-3 py-1 rounded-full text-sm font-medium border ${getScoreColor(section.score)}`}>
                        {section.score}/100
                      </div>
                      <div className="text-sm text-gray-500">
                        {section.key_metrics?.length || 0} показателей
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  {getScoreIcon(section.score)}
                  {isExpanded ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                </div>
              </div>

              {/* Section Content */}
              {isExpanded && (
                <div className="p-6 space-y-6">
                  {/* Score Progress Bar */}
                  <div className="bg-gray-100 rounded-full h-2">
                    <div 
                      className={`h-full rounded-full transition-all duration-300 ${
                        section.score >= 80 ? 'bg-green-600' : 
                        section.score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${section.score}%` }}
                    />
                  </div>

                  {/* Key Metrics */}
                  {section.key_metrics && section.key_metrics.length > 0 && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">📈 Ключевые показатели</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {section.key_metrics.map((metric, metricIndex) => renderMetricCard(metric, metricIndex))}
                      </div>
                    </div>
                  )}

                  {/* Data Tables */}
                  {viewMode.showTables && section.tables && section.tables.length > 0 && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">📋 Детальные данные</h4>
                      <div className="space-y-4">
                        {section.tables.map(table => renderDataTable(table, section.id))}
                      </div>
                    </div>
                  )}

                  {/* Charts */}
                  {viewMode.showCharts && section.charts && section.charts.length > 0 && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">📊 Визуализация данных</h4>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {section.charts.map(chart => renderChart(chart, section.id))}
                      </div>
                    </div>
                  )}

                  {/* Detailed Analysis */}
                  {section.detailed_analysis && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">🔍 Детальный анализ</h4>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="prose max-w-none text-gray-700 text-sm leading-relaxed">
                          {section.detailed_analysis.split('\n').map((paragraph, index) => (
                            paragraph.trim() && <p key={index} className="mb-3">{paragraph}</p>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Recommendations */}
                  {viewMode.showRecommendations && section.recommendations && section.recommendations.length > 0 && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">💡 Рекомендации</h4>
                      {renderRecommendations(section.recommendations)}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* No Results */}
      {filteredSections.length === 0 && searchQuery && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <Search className="w-12 h-12 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Ничего не найдено</h3>
          <p className="text-gray-500">Попробуйте изменить поисковый запрос</p>
          <button
            onClick={() => setSearchQuery('')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Очистить поиск
          </button>
        </div>
      )}

      {/* Save Analysis Dialog */}
      {showSaveDialog && (
        <SaveAnalysisDialog
          documents={[]} // Would need to be passed from parent
          results={[]} // Would need to be passed from parent
          comparison={{} as any} // Would need to be passed from parent
          isOpen={showSaveDialog}
          onClose={() => setShowSaveDialog(false)}
        />
      )}
    </div>
  );
};

export default DetailedAnalysisResults;