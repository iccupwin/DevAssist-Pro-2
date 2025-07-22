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
  Target
} from 'lucide-react';
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

interface KPAnalysisResultsProps {
  results: KPAnalysisResult[];
  onNewAnalysis: () => void;
  onGenerateReport: () => void;
  onViewDetailedReport: (result: KPAnalysisResult) => void;
  onExportPDF: () => void;
  tzName: string;
}

export const KPAnalysisResults: React.FC<KPAnalysisResultsProps> = ({
  results,
  onNewAnalysis,
  onGenerateReport,
  onViewDetailedReport,
  onExportPDF,
  tzName
}) => {
  const [selectedResult, setSelectedResult] = useState<KPAnalysisResult | null>(null);

  // Функция для получения цвета рейтинга
  const getRatingColor = (score: number): string => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  // Функция для получения цвета фона рейтинга
  const getRatingBgColor = (score: number): string => {
    if (score >= 80) return 'bg-green-50 border-green-200';
    if (score >= 60) return 'bg-yellow-50 border-yellow-200';
    return 'bg-red-50 border-red-200';
  };

  // Функция для получения иконки рейтинга
  const getRatingIcon = (score: number) => {
    if (score >= 80) return <CheckCircle className="w-5 h-5 text-green-600" />;
    if (score >= 60) return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
    return <XCircle className="w-5 h-5 text-red-600" />;
  };

  // Функция для получения статуса рекомендации
  const getRecommendationStatus = (score: number): string => {
    if (score >= 80) return 'Рекомендуется к принятию';
    if (score >= 60) return 'Требует доработки';
    return 'Рекомендуется к отклонению';
  };

  // Сортировка результатов по рейтингу
  const sortedResults = [...results].sort((a, b) => getComplianceScore(b) - getComplianceScore(a));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Заголовок */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Результаты анализа КП
        </h1>
        <p className="text-lg text-gray-600 max-w-3xl mx-auto">
          Проанализировано {results.length} коммерческих предложений по ТЗ "{tzName}"
        </p>
      </div>

      {/* Сводная статистика */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Всего КП</p>
              <p className="text-2xl font-bold text-gray-900">{results.length}</p>
            </div>
            <FileText className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Средний рейтинг</p>
              <p className="text-2xl font-bold text-gray-900">
                {Math.round(results.reduce((acc, r) => acc + getComplianceScore(r), 0) / results.length)}%
              </p>
            </div>
            <BarChart3 className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Рекомендованы</p>
              <p className="text-2xl font-bold text-gray-900">
                {results.filter(r => getComplianceScore(r) >= 80).length}
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Лучший рейтинг</p>
              <p className="text-2xl font-bold text-gray-900">
                {Math.max(...results.map(r => getComplianceScore(r)))}%
              </p>
            </div>
            <Star className="w-8 h-8 text-yellow-600" />
          </div>
        </div>
      </div>

      {/* Сравнительная таблица */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <BarChart3 className="w-5 h-5 mr-2" />
            Сравнительная таблица КП
          </h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ранг
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Компания
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Соответствие ТЗ
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Стоимость
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Сроки
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Рекомендация
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Действия
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedResults.map((result, index) => (
                <tr key={result.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {index === 0 && <Star className="w-4 h-4 text-yellow-500 mr-1" />}
                      <span className="text-sm font-medium text-gray-900">
                        {index + 1}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <FileText className="w-5 h-5 text-blue-600" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {getCompanyName(result)}
                        </div>
                        <div className="text-sm text-gray-500">
                          {getFileName(result)}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getRatingBgColor(getComplianceScore(result))}`}>
                      {getRatingIcon(getComplianceScore(result))}
                      <span className={`ml-1 ${getRatingColor(getComplianceScore(result))}`}>
                        {getComplianceScore(result)}%
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-900">
                      <DollarSign className="w-4 h-4 mr-1 text-gray-400" />
                      {result.pricing || 'Не указано'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-900">
                      <Clock className="w-4 h-4 mr-1 text-gray-400" />
                      {result.timeline || 'Не указано'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRatingBgColor(getComplianceScore(result))}`}>
                      <Target className="w-3 h-3 mr-1" />
                      {getRecommendationStatus(getComplianceScore(result))}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => onViewDetailedReport(result)}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setSelectedResult(result)}
                      className="text-gray-600 hover:text-gray-900"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Детальные карточки результатов */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {results.map((result) => (
          <div key={result.id} className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  {getCompanyName(result)}
                </h3>
                <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getRatingBgColor(getComplianceScore(result))}`}>
                  {getRatingIcon(getComplianceScore(result))}
                  <span className={`ml-1 ${getRatingColor(getComplianceScore(result))}`}>
                    {getComplianceScore(result)}%
                  </span>
                </div>
              </div>
            </div>
            
            <div className="px-6 py-4">
              {/* Сильные стороны */}
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center">
                  <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
                  Сильные стороны
                </h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  {getStrengths(result).slice(0, 3).map((strength, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-green-600 mr-2">+</span>
                      {strength}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Слабые стороны */}
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center">
                  <TrendingDown className="w-4 h-4 text-red-600 mr-1" />
                  Слабые стороны
                </h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  {getWeaknesses(result).slice(0, 3).map((weakness, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-red-600 mr-2">-</span>
                      {weakness}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Недостающие требования */}
              {getMissingRequirements(result).length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center">
                    <AlertTriangle className="w-4 h-4 text-yellow-600 mr-1" />
                    Недостающие требования ({getMissingRequirements(result).length})
                  </h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    {getMissingRequirements(result).slice(0, 2).map((requirement, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-yellow-600 mr-2">!</span>
                        {requirement}
                      </li>
                    ))}
                    {getMissingRequirements(result).length > 2 && (
                      <li className="text-gray-500 text-xs">
                        ... и еще {getMissingRequirements(result).length - 2}
                      </li>
                    )}
                  </ul>
                </div>
              )}

              {/* Кнопки действий */}
              <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-200">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onViewDetailedReport(result)}
                  className="flex items-center"
                >
                  <Eye className="w-4 h-4 mr-1" />
                  Подробно
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedResult(result)}
                  className="flex items-center"
                >
                  <Download className="w-4 h-4 mr-1" />
                  PDF
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Кнопки управления */}
      <div className="flex justify-center space-x-4">
        <Button
          variant="outline"
          onClick={onNewAnalysis}
          className="flex items-center"
        >
          <FileText className="w-4 h-4 mr-2" />
          Новый анализ
        </Button>
        <Button
          onClick={onGenerateReport}
          className="flex items-center"
        >
          <BarChart3 className="w-4 h-4 mr-2" />
          Сравнительный отчет
        </Button>
        <Button
          variant="outline"
          onClick={onExportPDF}
          className="flex items-center"
        >
          <Download className="w-4 h-4 mr-2" />
          Экспорт в PDF
        </Button>
      </div>
    </div>
  );
};

export default KPAnalysisResults;