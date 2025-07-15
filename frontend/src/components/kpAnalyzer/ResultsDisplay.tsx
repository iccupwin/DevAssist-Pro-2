import React, { useState } from 'react';
import { 
  Trophy, 
  TrendingUp, 
  TrendingDown, 
  FileText, 
  Download, 
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Star,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Eye,
  FileSpreadsheet,
  BarChart3,
  Table
} from 'lucide-react';
import { reportService, ComprehensiveReport } from '../../services/reportService';
import { reportPdfService } from '../../services/reportPdfService';
import { ReportViewer } from './ReportViewer';
import { ComparisonTable } from './ComparisonTable';
import { DataVisualization } from './DataVisualization';
import { KPAnalysisResult } from '../../types/kpAnalyzer';

interface ResultsDisplayProps {
  results: KPAnalysisResult[];
  onNewAnalysis: () => void;
  onGenerateReport: () => void;
  tzName?: string;
}

export const ResultsDisplay: React.FC<ResultsDisplayProps> = ({
  results,
  onNewAnalysis,
  onGenerateReport,
  tzName = 'Техническое задание'
}) => {
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'score' | 'name'>('score');
  const [showReport, setShowReport] = useState(false);
  const [generatedReport, setGeneratedReport] = useState<ComprehensiveReport | null>(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [viewMode, setViewMode] = useState<'cards' | 'table' | 'charts'>('cards');

  const toggleCard = (id: string) => {
    setExpandedCard(expandedCard === id ? null : id);
  };

  const getRatingFromScore = (score: number): 'high' | 'medium' | 'low' => {
    if (score >= 80) return 'high';
    if (score >= 60) return 'medium';
    return 'low';
  };

  const getRatingColor = (score: number) => {
    const rating = getRatingFromScore(score);
    switch (rating) {
      case 'high':
        return 'text-green-700 bg-green-100 border-green-200';
      case 'medium':
        return 'text-yellow-700 bg-yellow-100 border-yellow-200';
      case 'low':
        return 'text-red-700 bg-red-100 border-red-200';
    }
  };

  const getRatingIcon = (score: number) => {
    const rating = getRatingFromScore(score);
    switch (rating) {
      case 'high':
        return <CheckCircle className="w-4 h-4" />;
      case 'medium':
        return <AlertTriangle className="w-4 h-4" />;
      case 'low':
        return <XCircle className="w-4 h-4" />;
    }
  };

  const getRatingText = (score: number) => {
    const rating = getRatingFromScore(score);
    switch (rating) {
      case 'high':
        return 'Высокий';
      case 'medium':
        return 'Средний';
      case 'low':
        return 'Низкий';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const sortedResults = [...results].sort((a, b) => {
    if (sortBy === 'score') {
      return b.score - a.score;
    }
    return a.kpFileName.localeCompare(b.kpFileName);
  });

  const bestResult = results.reduce((best, current) => 
    current.score > best.score ? current : best, results[0]
  );

  const handleGenerateComprehensiveReport = async () => {
    setIsGeneratingReport(true);
    try {
      const report = await reportService.generateComprehensiveReport(tzName, results);
      setGeneratedReport(report);
      setShowReport(true);
    } catch (error) {
      console.error('Error generating report:', error);
      // Error handling will be implemented with user-friendly notifications
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const handleExportPDF = async () => {
    if (!generatedReport) return;
    
    try {
      const visualizationData = reportService.generateVisualizationData(results);
      await reportPdfService.exportReportToPDF(generatedReport, visualizationData);
    } catch (error) {
      console.error('Error exporting PDF:', error);
      // Error handling will be implemented with user-friendly notifications
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (showReport && generatedReport) {
    const visualizationData = reportService.generateVisualizationData(results);
    return (
      <div>
        <div className="mb-6">
          <button
            onClick={() => setShowReport(false)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            <Eye className="w-4 h-4" />
            Вернуться к результатам
          </button>
        </div>
        <ReportViewer
          report={generatedReport}
          visualizationData={visualizationData}
          onExportPDF={handleExportPDF}
          onPrint={handlePrint}
        />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-3 mb-4">
          <Trophy className="w-8 h-8 text-yellow-500" />
          <h1 className="text-3xl font-bold text-gray-900">
            Результаты анализа
          </h1>
        </div>
        <p className="text-lg text-gray-600">
          Анализ завершен. Ознакомьтесь с результатами и рекомендациями
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center gap-3">
            <FileText className="w-6 h-6 text-blue-600" />
            <div>
              <p className="text-sm text-gray-600">Проанализировано КП</p>
              <p className="text-2xl font-bold text-gray-900">{results.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center gap-3">
            <Star className="w-6 h-6 text-yellow-500" />
            <div>
              <p className="text-sm text-gray-600">Лучший результат</p>
              <p className={`text-2xl font-bold ${getScoreColor(bestResult?.score || 0)}`}>
                {bestResult?.score || 0}%
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-6 h-6 text-green-600" />
            <div>
              <p className="text-sm text-gray-600">Средний балл</p>
              <p className="text-2xl font-bold text-gray-900">
                {Math.round(results.reduce((sum, r) => sum + r.score, 0) / results.length)}%
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-6 h-6 text-green-600" />
            <div>
              <p className="text-sm text-gray-600">Рекомендуемых</p>
              <p className="text-2xl font-bold text-green-600">
                {results.filter(r => getRatingFromScore(r.score) === 'high').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          {/* View Mode Selector */}
          <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('cards')}
              className={`flex items-center gap-1 px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'cards' 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <Eye className="w-4 h-4" />
              Карточки
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1 px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'table' 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <Table className="w-4 h-4" />
              Таблица
            </button>
            <button
              onClick={() => setViewMode('charts')}
              className={`flex items-center gap-1 px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'charts' 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              Графики
            </button>
          </div>

          {viewMode === 'cards' && (
            <>
              <label className="text-sm font-medium text-gray-700">
                Сортировать по:
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'score' | 'name')}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="score">Баллу (по убыванию)</option>
                <option value="name">Названию файла</option>
              </select>
            </>
          )}
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleGenerateComprehensiveReport}
            disabled={isGeneratingReport}
            className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            <FileSpreadsheet className="w-4 h-4" />
            {isGeneratingReport ? 'Генерация...' : 'Полный отчет'}
          </button>

          <button
            onClick={onGenerateReport}
            className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            PDF отчет
          </button>
          
          <button
            onClick={onNewAnalysis}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Новый анализ
          </button>
        </div>
      </div>

      {/* Results Display */}
      {viewMode === 'table' && (
        <ComparisonTable 
          results={results} 
          onSelectKP={(kpId) => setExpandedCard(kpId)}
          className="mb-6"
        />
      )}

      {viewMode === 'charts' && (
        <DataVisualization 
          results={results}
          className="mb-6"
        />
      )}

      {viewMode === 'cards' && (
        <div className="space-y-4">
          {sortedResults.map((result, index) => (
            <div
              key={result.id}
              className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
            >
              {/* Card Header */}
              <div 
                className="p-6 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => toggleCard(result.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {/* Rank */}
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      index === 0 ? 'bg-yellow-100 text-yellow-800' :
                      index === 1 ? 'bg-gray-100 text-gray-800' :
                      index === 2 ? 'bg-orange-100 text-orange-800' :
                      'bg-gray-50 text-gray-600'
                    }`}>
                      {index + 1}
                    </div>

                    {/* File Info */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 truncate max-w-md">
                        {result.kpFileName}
                      </h3>
                      <div className="flex items-center gap-3 mt-1">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getRatingColor(result.score)}`}>
                          {getRatingIcon(result.score)}
                          {getRatingText(result.score)} рейтинг
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {/* Score */}
                    <div className="text-right">
                      <div className={`text-3xl font-bold ${getScoreColor(result.score)}`}>
                        {result.score}%
                      </div>
                      <div className="text-sm text-gray-500">общий балл</div>
                    </div>

                    {/* Expand Icon */}
                    {expandedCard === result.id ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                </div>

                {/* Quick Metrics */}
                <div className="grid grid-cols-4 gap-4 mt-4">
                  <div className="text-center">
                    <div className={`text-lg font-semibold ${getScoreColor(result.analysis.compliance)}`}>
                      {result.analysis.compliance}%
                    </div>
                    <div className="text-xs text-gray-500">Соответствие</div>
                  </div>
                  <div className="text-center">
                    <div className={`text-lg font-semibold ${getScoreColor(result.analysis.technical)}`}>
                      {result.analysis.technical}%
                    </div>
                    <div className="text-xs text-gray-500">Техническое</div>
                  </div>
                  <div className="text-center">
                    <div className={`text-lg font-semibold ${getScoreColor(result.analysis.commercial)}`}>
                      {result.analysis.commercial}%
                    </div>
                    <div className="text-xs text-gray-500">Коммерческое</div>
                  </div>
                  <div className="text-center">
                    <div className={`text-lg font-semibold ${getScoreColor(result.analysis.experience)}`}>
                      {result.analysis.experience}%
                    </div>
                    <div className="text-xs text-gray-500">Опыт</div>
                  </div>
                </div>
              </div>

              {/* Expanded Content */}
              {expandedCard === result.id && (
                <div className="border-t border-gray-200 p-6 bg-gray-50">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Company Info */}
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-3">
                        Информация о компании
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="font-medium text-gray-700">Компания:</span>
                          <span className="text-gray-600 ml-2">{result.extractedData.company_name}</span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Технологии:</span>
                          <span className="text-gray-600 ml-2">{result.extractedData.tech_stack}</span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Стоимость:</span>
                          <span className="text-gray-600 ml-2">{result.extractedData.pricing}</span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Сроки:</span>
                          <span className="text-gray-600 ml-2">{result.extractedData.timeline}</span>
                        </div>
                      </div>
                    </div>

                    {/* Analysis Details */}
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-3">
                        Детальный анализ
                      </h4>
                      <p className="text-gray-700 text-sm leading-relaxed">
                        {result.analysis.detailedAnalysis}
                      </p>
                    </div>

                    {/* Strengths */}
                    {result.analysis.strengths.length > 0 && (
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900 mb-3">
                          Сильные стороны
                        </h4>
                        <ul className="space-y-2">
                          {result.analysis.strengths.map((strength, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                              <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                              {strength}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Weaknesses & Recommendations */}
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-3">
                        Рекомендации
                      </h4>
                      <ul className="space-y-2">
                        {result.analysis.recommendations.map((rec, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                            {rec}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};