import React, { useState, useMemo } from 'react';
import { ChevronDown, ChevronUp, TrendingUp, TrendingDown, Award, AlertTriangle } from 'lucide-react';
import { KPAnalysisResult } from '../../types/kpAnalyzer';
import { 
  getComplianceScore, 
  getCompanyName, 
  getFileName, 
  getStrengths, 
  getWeaknesses, 
  getKPResultField,
  getAnalysis,
  getExtractedData
} from '../../utils/kpAnalyzerUtils';

interface ComparisonTableProps {
  results: KPAnalysisResult[];
  onSelectKP?: (kpId: string) => void;
  className?: string;
}

type SortField = 'score' | 'compliance' | 'technical' | 'commercial' | 'experience' | 'company';
type SortDirection = 'asc' | 'desc';

export const ComparisonTable: React.FC<ComparisonTableProps> = ({
  results,
  onSelectKP,
  className = ''
}) => {
  const [sortField, setSortField] = useState<SortField>('score');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [selectedKP, setSelectedKP] = useState<string | null>(null);

  // Сортировка результатов
  const sortedResults = useMemo(() => {
    return [...results].sort((a, b) => {
      let aValue: number | string;
      let bValue: number | string;

      switch (sortField) {
        case 'score':
          aValue = getComplianceScore(a);
          bValue = getComplianceScore(b);
          break;
        case 'compliance':
          aValue = getAnalysis(a).compliance;
          bValue = getAnalysis(b).compliance;
          break;
        case 'technical':
          aValue = getAnalysis(a).technical;
          bValue = getAnalysis(b).technical;
          break;
        case 'commercial':
          aValue = getAnalysis(a).commercial;
          bValue = getAnalysis(b).commercial;
          break;
        case 'experience':
          aValue = getAnalysis(a).experience;
          bValue = getAnalysis(b).experience;
          break;
        case 'company':
          aValue = getCompanyName(a);
          bValue = getCompanyName(b);
          break;
        default:
          aValue = getComplianceScore(a);
          bValue = getComplianceScore(b);
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc' 
          ? aValue.localeCompare(bValue, 'ru')
          : bValue.localeCompare(aValue, 'ru');
      }

      return sortDirection === 'asc' 
        ? (aValue as number) - (bValue as number)
        : (bValue as number) - (aValue as number);
    });
  }, [results, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const handleRowClick = (kp: KPAnalysisResult) => {
    setSelectedKP(selectedKP === kp.id ? null : kp.id);
    onSelectKP?.(kp.id);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50';
    if (score >= 60) return 'text-orange-600 bg-orange-50';
    return 'text-red-600 bg-red-50';
  };

  const getScoreIcon = (score: number) => {
    if (score >= 80) return <TrendingUp className="w-4 h-4 text-green-600" />;
    if (score >= 60) return <TrendingDown className="w-4 h-4 text-orange-600" />;
    return <AlertTriangle className="w-4 h-4 text-red-600" />;
  };

  const getRankIcon = (index: number) => {
    if (index === 0) return <Award className="w-5 h-5 text-yellow-500" />;
    if (index === 1) return <Award className="w-5 h-5 text-gray-400" />;
    if (index === 2) return <Award className="w-5 h-5 text-orange-500" />;
    return null;
  };

  const SortButton: React.FC<{ field: SortField; children: React.ReactNode }> = ({ field, children }) => (
    <button
      onClick={() => handleSort(field)}
      className="flex items-center gap-1 text-left font-medium text-gray-700 hover:text-gray-900 transition-colors"
    >
      {children}
      {sortField === field && (
        sortDirection === 'asc' 
          ? <ChevronUp className="w-4 h-4" />
          : <ChevronDown className="w-4 h-4" />
      )}
    </button>
  );

  if (results.length === 0) {
    return (
      <div className={`bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center ${className}`}>
        <div className="text-gray-500">
          <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-semibold mb-2">Нет результатов для сравнения</h3>
          <p>Проведите анализ КП для отображения сравнительной таблицы</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden ${className}`}>
      {/* Заголовок */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Сравнение КП</h3>
            <p className="text-sm text-gray-600 mt-1">
              Проанализировано {results.length} коммерческих предложений
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500">Средний балл</div>
            <div className="text-xl font-bold text-gray-900">
              {Math.round(results.reduce((sum, r) => sum + getComplianceScore(r), 0) / results.length)}%
            </div>
          </div>
        </div>
      </div>

      {/* Таблица */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-4 text-left">
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Ранг</span>
              </th>
              <th className="px-6 py-4 text-left">
                <SortButton field="company">Компания</SortButton>
              </th>
              <th className="px-6 py-4 text-center">
                <SortButton field="score">Общий балл</SortButton>
              </th>
              <th className="px-6 py-4 text-center">
                <SortButton field="compliance">Соответствие</SortButton>
              </th>
              <th className="px-6 py-4 text-center">
                <SortButton field="technical">Техническая часть</SortButton>
              </th>
              <th className="px-6 py-4 text-center">
                <SortButton field="commercial">Коммерческая часть</SortButton>
              </th>
              <th className="px-6 py-4 text-center">
                <SortButton field="experience">Опыт</SortButton>
              </th>
              <th className="px-6 py-4 text-left">
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Статус</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {sortedResults.map((kp, index) => (
              <React.Fragment key={kp.id}>
                <tr
                  onClick={() => handleRowClick(kp)}
                  className={`
                    hover:bg-gray-50 cursor-pointer transition-colors
                    ${selectedKP === kp.id ? 'bg-blue-50' : ''}
                  `}
                >
                  {/* Ранг */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {getRankIcon(index)}
                      <span className="text-sm font-medium text-gray-900">#{index + 1}</span>
                    </div>
                  </td>

                  {/* Компания */}
                  <td className="px-6 py-4">
                    <div>
                      <div className="font-medium text-gray-900 truncate max-w-[200px]">
                        {getCompanyName(kp)}
                      </div>
                      <div className="text-xs text-gray-500 truncate max-w-[200px]">
                        {getFileName(kp)}
                      </div>
                    </div>
                  </td>

                  {/* Общий балл */}
                  <td className="px-6 py-4 text-center">
                    <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${getScoreColor(getComplianceScore(kp))}`}>
                      {getScoreIcon(getComplianceScore(kp))}
                      {getComplianceScore(kp)}%
                    </div>
                  </td>

                  {/* Соответствие */}
                  <td className="px-6 py-4 text-center">
                    <div className="text-sm font-medium text-gray-900">
                      {getAnalysis(kp).compliance}%
                    </div>
                  </td>

                  {/* Техническая часть */}
                  <td className="px-6 py-4 text-center">
                    <div className="text-sm font-medium text-gray-900">
                      {getAnalysis(kp).technical}%
                    </div>
                  </td>

                  {/* Коммерческая часть */}
                  <td className="px-6 py-4 text-center">
                    <div className="text-sm font-medium text-gray-900">
                      {getAnalysis(kp).commercial}%
                    </div>
                  </td>

                  {/* Опыт */}
                  <td className="px-6 py-4 text-center">
                    <div className="text-sm font-medium text-gray-900">
                      {getAnalysis(kp).experience}%
                    </div>
                  </td>

                  {/* Статус */}
                  <td className="px-6 py-4">
                    <span className={`
                      inline-flex px-2 py-1 text-xs font-medium rounded-full
                      ${kp.status === 'completed' 
                        ? 'bg-green-100 text-green-800' 
                        : kp.status === 'error'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                      }
                    `}>
                      {kp.status === 'completed' ? 'Завершен' 
                       : kp.status === 'error' ? 'Ошибка'
                       : 'В процессе'}
                    </span>
                  </td>
                </tr>

                {/* Детальная информация (раскрывающаяся) */}
                {selectedKP === kp.id && (
                  <tr>
                    <td colSpan={8} className="px-6 py-4 bg-gray-50">
                      <div className="space-y-4">
                        {/* Основная информация */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <h4 className="font-medium text-gray-900 mb-2">Техническое решение</h4>
                            <p className="text-sm text-gray-700">{getExtractedData(kp).tech_stack}</p>
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900 mb-2">Коммерческие условия</h4>
                            <p className="text-sm text-gray-700">{getExtractedData(kp).pricing}</p>
                          </div>
                        </div>

                        {/* Сильные стороны */}
                        {getStrengths(kp).length > 0 && (
                          <div>
                            <h4 className="font-medium text-gray-900 mb-2">Сильные стороны</h4>
                            <ul className="text-sm text-gray-700 space-y-1">
                              {getStrengths(kp).map((strength, idx) => (
                                <li key={idx} className="flex items-start gap-2">
                                  <span className="text-green-500 mt-1">•</span>
                                  {strength}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Слабые стороны */}
                        {getWeaknesses(kp).length > 0 && (
                          <div>
                            <h4 className="font-medium text-gray-900 mb-2">Слабые стороны</h4>
                            <ul className="text-sm text-gray-700 space-y-1">
                              {getWeaknesses(kp).map((weakness, idx) => (
                                <li key={idx} className="flex items-start gap-2">
                                  <span className="text-red-500 mt-1">•</span>
                                  {weakness}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Рекомендации */}
                        {getAnalysis(kp).recommendations.length > 0 && (
                          <div>
                            <h4 className="font-medium text-gray-900 mb-2">Рекомендации</h4>
                            <ul className="text-sm text-gray-700 space-y-1">
                              {getAnalysis(kp).recommendations.map((recommendation, idx) => (
                                <li key={idx} className="flex items-start gap-2">
                                  <span className="text-blue-500 mt-1">•</span>
                                  {recommendation}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {/* Футер с дополнительной информацией */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div>
            Лучший результат: <span className="font-medium text-gray-900">
              {getCompanyName(sortedResults[0] || {} as KPAnalysisResult)} ({getComplianceScore(sortedResults[0] || {} as KPAnalysisResult)}%)
            </span>
          </div>
          <div>
            Нажмите на строку для просмотра деталей
          </div>
        </div>
      </div>
    </div>
  );
};