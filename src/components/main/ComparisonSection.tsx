import React, { useState, useEffect } from 'react';
import { BarChart3, Trophy, AlertCircle, ArrowLeft, ArrowRight, RefreshCw, Users, CheckCircle, TrendingUp, DollarSign, Clock, Zap, Settings } from 'lucide-react';
import { AnalysisResult } from '../../services/apiClient';
import { apiService } from '../../services/apiClient';
import { getModelById } from '../../config/models';

interface ComparisonSectionProps {
  onStepChange: (step: string) => void;
  analysisResults: AnalysisResult[];
  selectedComparisonModel: string;
  isDarkMode: boolean;
}

const ComparisonSection: React.FC<ComparisonSectionProps> = ({ 
  onStepChange, 
  analysisResults, 
  selectedComparisonModel,
  isDarkMode
}) => {
  const [comparisonReport, setComparisonReport] = useState<string>('');
  const [isGeneratingComparison, setIsGeneratingComparison] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedKP, setSelectedKP] = useState<number | null>(null);

  // Автоматически генерируем сравнение при загрузке компонента
  useEffect(() => {
    if (analysisResults.length > 0 && !comparisonReport) {
      generateComparison();
    }
  }, [analysisResults]);

  const generateComparison = async () => {
    if (analysisResults.length === 0) return;
    
    setIsGeneratingComparison(true);
    setError(null);
    
    try {
      const response = await apiService.compareAllKP(
        analysisResults,
        selectedComparisonModel
      );
      
      if (response.success) {
        setComparisonReport(response.data);
      } else {
        throw new Error(response.error || 'Ошибка генерации сравнения');
      }
    } catch (error) {
      console.error('Comparison error:', error);
      setError(error instanceof Error ? error.message : 'Произошла ошибка при сравнении');
    } finally {
      setIsGeneratingComparison(false);
    }
  };

  // Вычисляем общий рейтинг для каждого КП
  const calculateOverallScore = (result: AnalysisResult) => {
    const avgRating = Object.values(result.ratings).reduce((sum, val) => sum + val, 0) / Object.values(result.ratings).length;
    return ((avgRating * 10 + result.comparison_result.compliance_score) / 2).toFixed(1);
  };

  // Сортируем результаты по общему рейтингу
  const sortedResults = [...analysisResults].sort((a, b) => {
    const scoreA = parseFloat(calculateOverallScore(a));
    const scoreB = parseFloat(calculateOverallScore(b));
    return scoreB - scoreA;
  });

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-green-600 bg-green-50';
    if (score >= 70) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const currentComparisonModel = getModelById(selectedComparisonModel);

  return (
    <div className="space-y-6">
      <div className="bg-white/60 backdrop-blur-md rounded-2xl border border-white/20 shadow-xl p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <BarChart3 className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Сравнение коммерческих предложений
          </h2>
          <p className="text-gray-600">Комплексное сравнение и рейтинг поставщиков</p>
          
          {/* Current Model Info */}
          <div className="mt-4 inline-flex items-center space-x-2 px-3 py-1.5 bg-emerald-100/80 backdrop-blur-sm rounded-full">
            <Settings className="w-4 h-4 text-emerald-600" />
            <span className="text-sm font-medium text-emerald-800">
              Модель: {currentComparisonModel?.name || selectedComparisonModel}
            </span>
          </div>
        </div>
        
        {/* Показываем ошибку если есть */}
        {error && (
          <div className="bg-red-50/80 backdrop-blur-sm border border-red-200 rounded-2xl p-6 mb-8">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center mr-4">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <div className="flex-1">
                <p className="text-lg font-semibold text-red-800">Ошибка сравнения</p>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
            <button
              onClick={generateComparison}
              className="mt-4 inline-flex items-center px-6 py-3 bg-red-600 text-white text-sm font-semibold rounded-xl hover:bg-red-700 transition-all duration-200 shadow-md hover:shadow-lg"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Повторить сравнение
            </button>
          </div>
        )}
        
        {/* Показываем прогресс если идет генерация */}
        {isGeneratingComparison && (
          <div className="bg-blue-50/80 backdrop-blur-sm border border-blue-200 rounded-2xl p-6 mb-8">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center mr-4">
                <Zap className="w-6 h-6 text-blue-600 animate-pulse" />
              </div>
              <div>
                <p className="text-lg font-semibold text-blue-800">Генерация сравнительного анализа...</p>
                <p className="text-sm text-blue-700 mt-1">Используется модель: {selectedComparisonModel}</p>
              </div>
            </div>
          </div>
        )}
        
        {/* Показываем результаты только если есть данные */}
        {analysisResults.length === 0 ? (
          <div className="bg-yellow-50/80 backdrop-blur-sm border border-yellow-200 rounded-2xl p-6 mb-8">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-yellow-100 rounded-2xl flex items-center justify-center mr-4">
                <AlertCircle className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="flex-1">
                <p className="text-lg font-semibold text-yellow-800">
                  Нет данных для сравнения
                </p>
                <p className="text-sm text-yellow-700 mt-1">
                  Пожалуйста, сначала выполните анализ документов
                </p>
              </div>
            </div>
            <button
              onClick={() => onStepChange('analysis')}
              className="mt-4 inline-flex items-center px-6 py-3 bg-yellow-600 text-white text-sm font-semibold rounded-xl hover:bg-yellow-700 transition-all duration-200 shadow-md hover:shadow-lg"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Вернуться к анализу
            </button>
          </div>
        ) : (

          <>          
            {/* Общие результаты */}
            <div className={`grid grid-cols-1 gap-6 mb-8 ${
              analysisResults.length === 2 ? 'md:grid-cols-2' : 
              analysisResults.length === 3 ? 'md:grid-cols-3' : 
              'md:grid-cols-2 lg:grid-cols-3'
            }`}>
              {sortedResults.map((result, index) => {
                const overallScore = calculateOverallScore(result);
                const isWinner = index === 0;
                const bgGradient = isWinner 
                  ? 'bg-gradient-to-br from-green-50 to-emerald-50' 
                  : index === 1 
                  ? 'bg-gradient-to-br from-blue-50 to-indigo-50' 
                  : 'bg-gradient-to-br from-gray-50 to-slate-50';
                const borderColor = isWinner 
                  ? 'border-green-200' 
                  : index === 1 
                  ? 'border-blue-200' 
                  : 'border-gray-200';
                const textColor = isWinner ? 'text-green-900' : index === 1 ? 'text-blue-900' : 'text-gray-900';
                const scoreColor = isWinner ? 'text-green-700' : index === 1 ? 'text-blue-700' : 'text-gray-700';
                
                return (
                  <div 
                    key={result.company_name} 
                    className={`${bgGradient} backdrop-blur-sm border ${borderColor} p-6 rounded-2xl cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-105 ${
                      selectedKP === index ? 'ring-2 ring-blue-500 shadow-lg scale-105' : ''
                    }`}
                    onClick={() => setSelectedKP(selectedKP === index ? null : index)}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center mr-3 ${
                          isWinner ? 'bg-green-100' : index === 1 ? 'bg-blue-100' : 'bg-gray-100'
                        }`}>
                          {index === 0 ? <Trophy className="w-5 h-5 text-green-600" /> : 
                           index === 1 ? <TrendingUp className="w-5 h-5 text-blue-600" /> : 
                           <Users className="w-5 h-5 text-gray-600" />}
                        </div>
                        <h3 className={`font-semibold ${textColor}`}>
                          {result.company_name}
                        </h3>
                      </div>
                      {isWinner && (
                        <span className="bg-green-100 text-green-700 text-xs font-semibold px-2 py-1 rounded-full">
                          Лидер
                        </span>
                      )}
                    </div>
                    <div className={`text-3xl font-bold ${scoreColor} mb-2`}>{overallScore}</div>
                    <p className={`text-sm font-medium ${textColor.replace('900', '600')} mb-3`}>Общая оценка из 100</p>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Соответствие ТЗ:</span>
                        <span className="font-medium">{result.comparison_result.compliance_score}%</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Средний рейтинг:</span>
                        <span className="font-medium">{(Object.values(result.ratings).reduce((sum, val) => sum + val, 0) / Object.values(result.ratings).length).toFixed(1)}/10</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Детальная таблица сравнения */}
            <div className="bg-white/40 backdrop-blur-sm rounded-2xl border border-white/20 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200/50">
                  <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                        Критерий оценки
                      </th>
                      {analysisResults.map((result, index) => (
                        <th key={index} className="px-6 py-4 text-center text-sm font-semibold text-gray-700">
                          {result.company_name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white/60 backdrop-blur-sm divide-y divide-gray-200/50">
                    {/* Соответствие ТЗ */}
                    <tr className="hover:bg-white/60 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <CheckCircle className="w-4 h-4 text-blue-600 mr-2" />
                          <span className="text-sm font-semibold text-gray-900">Соответствие ТЗ</span>
                        </div>
                      </td>
                      {analysisResults.map((result, index) => (
                        <td key={index} className="px-6 py-4 text-center">
                          <div className={`inline-flex items-center px-4 py-2 rounded-xl text-sm font-semibold shadow-sm ${
                            result.comparison_result.compliance_score >= 85 ? 'bg-green-100 text-green-800' :
                            result.comparison_result.compliance_score >= 70 ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {result.comparison_result.compliance_score}%
                          </div>
                        </td>
                      ))}
                    </tr>
                  
                  {/* Отдельные рейтинги */}
                  {Object.keys(analysisResults[0]?.ratings || {}).map((criterion) => {
                    const criterionNames: Record<string, string> = {
                      technical_compliance: 'Техническое соответствие',
                      functional_completeness: 'Функциональная полнота',
                      cost_effectiveness: 'Экономическая эффективность',
                      timeline_realism: 'Реалистичность сроков',
                      vendor_reliability: 'Надежность поставщика'
                    };
                    
                    return (
                      <tr key={criterion} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {criterionNames[criterion] || criterion}
                          </div>
                        </td>
                        {analysisResults.map((result, index) => (
                          <td key={index} className="px-6 py-4 text-center">
                            <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getScoreColor(result.ratings[criterion] * 10)}`}>
                              {result.ratings[criterion]}/10
                            </div>
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                  
                    {/* Стоимость */}
                    <tr className="hover:bg-white/60 bg-blue-50/30 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <DollarSign className="w-4 h-4 text-green-600 mr-2" />
                          <span className="text-sm font-semibold text-gray-900">Стоимость</span>
                        </div>
                      </td>
                      {analysisResults.map((result, index) => (
                        <td key={index} className="px-6 py-4 text-center">
                          <div className="text-sm font-semibold text-gray-900 bg-white/60 rounded-lg p-2">{result.pricing}</div>
                        </td>
                      ))}
                    </tr>
                    
                    {/* Сроки */}
                    <tr className="hover:bg-white/60 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 text-orange-600 mr-2" />
                          <span className="text-sm font-semibold text-gray-900">Сроки реализации</span>
                        </div>
                      </td>
                      {analysisResults.map((result, index) => (
                        <td key={index} className="px-6 py-4 text-center">
                          <div className="text-sm font-semibold text-gray-900 bg-white/60 rounded-lg p-2">{result.timeline}</div>
                        </td>
                      ))}
                    </tr>
                    
                    {/* Технологии */}
                    <tr className="hover:bg-white/60 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <TrendingUp className="w-4 h-4 text-purple-600 mr-2" />
                          <span className="text-sm font-semibold text-gray-900">Технологический стек</span>
                        </div>
                      </td>
                      {analysisResults.map((result, index) => (
                        <td key={index} className="px-6 py-4 text-center">
                          <div className="text-sm font-semibold text-gray-900 bg-white/60 rounded-lg p-2">{result.tech_stack}</div>
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* AI Сравнительный отчет */}
            {comparisonReport && (
              <div className="mt-8">
                <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <Zap className="w-5 h-5 mr-2 text-purple-600" />
                  AI Сравнительный анализ
                </h3>
                <div className="bg-white/60 backdrop-blur-sm border border-white/20 rounded-2xl p-6">
                  <div 
                    className="prose prose-sm max-w-none text-gray-800"
                    dangerouslySetInnerHTML={{ __html: comparisonReport }}
                  />
                </div>
              </div>
            )}
            
            {/* Быстрая рекомендация */}
            {sortedResults.length > 0 && (
              <div className="mt-8 bg-gradient-to-r from-green-50 to-emerald-50 backdrop-blur-sm border border-green-200 rounded-2xl p-6">
                <div className="flex items-start">
                  <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center mr-4">
                    <Trophy className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-green-800 mb-2">Рекомендация системы</h3>
                    <p className="text-green-700 mb-4">
                      На основе комплексного анализа рекомендуется выбрать{' '}
                      <span className="font-bold text-green-800">{sortedResults[0].company_name}</span> с общей оценкой{' '}
                      <span className="font-bold text-green-800">{calculateOverallScore(sortedResults[0])}/100</span>.
                    </p>
                    <div className="bg-white/60 rounded-xl p-4">
                      <p className="text-sm font-semibold text-green-800 mb-3">Основные преимущества:</p>
                      <div className="space-y-2">
                        {sortedResults[0].preliminary_recommendation.strength.slice(0, 3).map((strength, index) => (
                          <div key={index} className="flex items-start">
                            <CheckCircle className="w-4 h-4 text-green-600 mr-2 mt-0.5" />
                            <span className="text-sm text-green-700">{strength}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Дополнительные метрики */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white/60 backdrop-blur-sm border border-white/20 rounded-2xl p-6 text-center">
                <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <BarChart3 className="w-6 h-6 text-gray-600" />
                </div>
                <div className="text-3xl font-bold text-gray-700 mb-1">{analysisResults.length}</div>
                <div className="text-sm text-gray-600 font-medium">Проанализировано КП</div>
              </div>
              <div className="bg-white/60 backdrop-blur-sm border border-white/20 rounded-2xl p-6 text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <CheckCircle className="w-6 h-6 text-blue-600" />
                </div>
                <div className="text-3xl font-bold text-blue-700 mb-1">
                  {(analysisResults.reduce((sum, result) => sum + result.comparison_result.compliance_score, 0) / analysisResults.length).toFixed(0)}%
                </div>
                <div className="text-sm text-blue-600 font-medium">Среднее соответствие ТЗ</div>
              </div>
              <div className="bg-white/60 backdrop-blur-sm border border-white/20 rounded-2xl p-6 text-center">
                <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <AlertCircle className="w-6 h-6 text-yellow-600" />
                </div>
                <div className="text-3xl font-bold text-yellow-700 mb-1">
                  {analysisResults.reduce((sum, result) => sum + result.comparison_result.missing_requirements.length, 0)}
                </div>
                <div className="text-sm text-yellow-600 font-medium">Пропущенных требований</div>
              </div>
              <div className="bg-white/60 backdrop-blur-sm border border-white/20 rounded-2xl p-6 text-center">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
                <div className="text-3xl font-bold text-green-700 mb-1">
                  {analysisResults.reduce((sum, result) => sum + result.comparison_result.additional_features.length, 0)}
                </div>
                <div className="text-sm text-green-600 font-medium">Дополнительных функций</div>
              </div>
            </div>
            
            {/* Детальная информация о выбранном КП */}
            {selectedKP !== null && (
              <div className="mt-8 bg-blue-50/80 backdrop-blur-sm border border-blue-200 rounded-2xl p-6">
                <h4 className="text-xl font-semibold text-blue-900 mb-4 flex items-center">
                  <Users className="w-5 h-5 mr-2" />
                  Детали: {analysisResults[selectedKP].company_name}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white/60 rounded-xl p-4">
                    <h5 className="text-sm font-semibold text-blue-800 mb-3 flex items-center">
                      <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                      Сильные стороны
                    </h5>
                    <div className="space-y-2">
                      {analysisResults[selectedKP].preliminary_recommendation.strength.map((strength, index) => (
                        <div key={index} className="flex items-start">
                          <CheckCircle className="w-4 h-4 text-green-600 mr-2 mt-0.5" />
                          <span className="text-sm text-blue-700">{strength}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="bg-white/60 rounded-xl p-4">
                    <h5 className="text-sm font-semibold text-blue-800 mb-3 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-2 text-red-600" />
                      Слабые стороны
                    </h5>
                    <div className="space-y-2">
                      {analysisResults[selectedKP].preliminary_recommendation.weakness.map((weakness, index) => (
                        <div key={index} className="flex items-start">
                          <AlertCircle className="w-4 h-4 text-red-600 mr-2 mt-0.5" />
                          <span className="text-sm text-blue-700">{weakness}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                
                {analysisResults[selectedKP].comparison_result.missing_requirements.length > 0 && (
                  <div className="mt-6 bg-white/60 rounded-xl p-4">
                    <h5 className="text-sm font-semibold text-blue-800 mb-3 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-2 text-orange-600" />
                      Пропущенные требования
                    </h5>
                    <div className="space-y-2">
                      {analysisResults[selectedKP].comparison_result.missing_requirements.slice(0, 5).map((req, index) => (
                        <div key={index} className="flex items-start">
                          <div className="w-2 h-2 bg-orange-600 rounded-full mr-3 mt-2"></div>
                          <span className="text-sm text-blue-700">{req}</span>
                        </div>
                      ))}
                      {analysisResults[selectedKP].comparison_result.missing_requirements.length > 5 && (
                        <div className="text-blue-600 text-xs font-medium bg-blue-100 rounded-lg p-2">
                          ...и еще {analysisResults[selectedKP].comparison_result.missing_requirements.length - 5} требований
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* Навигационные кнопки */}
        <div className="mt-10 flex justify-between items-center">
          <button
            onClick={() => onStepChange('analysis')}
            className="flex items-center px-6 py-3 bg-white/60 backdrop-blur-sm border border-white/20 rounded-xl text-gray-700 hover:bg-white/80 transition-all duration-200 shadow-md hover:shadow-lg"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Назад к анализу
          </button>
          
          <div className="flex space-x-4">
            {!comparisonReport && !isGeneratingComparison && analysisResults.length > 0 && (
              <button
                onClick={generateComparison}
                className="flex items-center px-6 py-3 bg-white/60 backdrop-blur-sm border border-blue-200 text-blue-600 rounded-xl hover:bg-blue-50/80 transition-all duration-200 shadow-md hover:shadow-lg"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Обновить сравнение
              </button>
            )}
            
            <button
              onClick={() => onStepChange('report')}
              className="flex items-center px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg font-semibold"
              disabled={analysisResults.length === 0}
            >
              Создать отчет
              <ArrowRight className="w-4 h-4 ml-2" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComparisonSection;