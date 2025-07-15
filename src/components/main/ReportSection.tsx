import React, { useState, useEffect } from 'react';
import { FileText, Download, Share2, Trophy, ArrowLeft, RefreshCw, AlertCircle, Zap, CheckCircle, Clock, TrendingUp, Users, Settings } from 'lucide-react';
import { AnalysisResult } from '../../services/apiClient';
import { apiService } from '../../services/apiClient';
import { getModelById } from '../../config/models';

interface ReportSectionProps {
  onStepChange: (step: string) => void;
  analysisResults: AnalysisResult[];
  selectedReportModel: string;
  isDarkMode: boolean;
}

const ReportSection: React.FC<ReportSectionProps> = ({ 
  onStepChange, 
  analysisResults, 
  selectedReportModel,
  isDarkMode
}) => {
  const [reportHtml, setReportHtml] = useState<string>('');
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reportStats, setReportStats] = useState<{
    processingTime: string;
    requirementsProcessed: number;
    kpAnalyzed: number;
    model: string;
  } | null>(null);

  // Автоматически генерируем отчет при загрузке компонента
  useEffect(() => {
    if (analysisResults.length > 0 && !reportHtml) {
      generateReport();
    }
  }, [analysisResults]);

  const generateReport = async () => {
    if (analysisResults.length === 0) return;
    
    setIsGeneratingReport(true);
    setError(null);
    const startTime = Date.now();
    
    try {
      const response = await apiService.generateReport(
        analysisResults,
        selectedReportModel
      );
      
      if (response.success) {
        setReportHtml(response.data);
        
        // Вычисляем статистики
        const processingTime = ((Date.now() - startTime) / 1000).toFixed(1);
        const totalMissingReqs = analysisResults.reduce((sum, result) => 
          sum + result.comparison_result.missing_requirements.length, 0
        );
        const totalAdditionalFeatures = analysisResults.reduce((sum, result) => 
          sum + result.comparison_result.additional_features.length, 0
        );
        
        setReportStats({
          processingTime: `${processingTime} сек`,
          requirementsProcessed: totalMissingReqs + totalAdditionalFeatures + 50, // базовые требования
          kpAnalyzed: analysisResults.length,
          model: selectedReportModel
        });
      } else {
        throw new Error(response.error || 'Ошибка генерации отчета');
      }
    } catch (error) {
      console.error('Report generation error:', error);
      setError(error instanceof Error ? error.message : 'Произошла ошибка при генерации отчета');
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const handleDownloadReport = () => {
    if (!reportHtml) return;
    
    // Создаем полный HTML документ
    const fullHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Отчет по анализу коммерческих предложений</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          @media print { body { margin: 0; } }
        </style>
      </head>
      <body>
        ${reportHtml}
      </body>
      </html>
    `;
    
    const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Tender_Analysis_Report_${new Date().toISOString().split('T')[0]}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleShareReport = () => {
    if (!reportHtml) return;
    
    // Копируем ссылку в буфер обмена (имитация)
    const shareText = `Отчет по анализу коммерческих предложений\nГенерировано: ${new Date().toLocaleString('ru-RU')}\nРекомендация: ${getBestKP()?.company_name || 'Не определено'}`;
    
    if (navigator.share) {
      navigator.share({
        title: 'Отчет по анализу тендера',
        text: shareText
      });
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(shareText).then(() => {
        alert('Информация скопирована в буфер обмена');
      });
    } else {
      alert('Функция недоступна в данном браузере');
    }
  };

  // Получаем лучшее КП
  const getBestKP = () => {
    if (analysisResults.length === 0) return null;
    
    return analysisResults.reduce((best, current) => {
      const avgCurrent = Object.values(current.ratings).reduce((sum, val) => sum + val, 0) / Object.values(current.ratings).length;
      const avgBest = Object.values(best.ratings).reduce((sum, val) => sum + val, 0) / Object.values(best.ratings).length;
      const overallCurrent = (avgCurrent * 10 + current.comparison_result.compliance_score) / 2;
      const overallBest = (avgBest * 10 + best.comparison_result.compliance_score) / 2;
      return overallCurrent > overallBest ? current : best;
    });
  };

  const currentReportModel = getModelById(selectedReportModel);

  return (
    <div className="space-y-6">
      <div className="bg-white/60 backdrop-blur-md rounded-2xl border border-white/20 shadow-xl p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Итоговый отчет
          </h2>
          <p className="text-gray-600">Полный анализ и рекомендации по тендеру</p>
          
          {/* Current Model Info */}
          <div className="mt-4 inline-flex items-center space-x-2 px-3 py-1.5 bg-green-100/80 backdrop-blur-sm rounded-full">
            <Settings className="w-4 h-4 text-green-600" />
            <span className="text-sm font-medium text-green-800">
              Модель: {currentReportModel?.name || selectedReportModel}
            </span>
          </div>
        </div>
        
        <div className="flex justify-between items-start mb-8">
          <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4">
            <div className="flex items-center mb-2">
              <Clock className="w-4 h-4 text-blue-600 mr-2" />
              <h3 className="font-semibold text-gray-900">Информация о генерации</h3>
            </div>
            <p className="text-sm text-gray-600 mb-1">
              Сгенерировано: {new Date().toLocaleDateString('ru-RU', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
            {reportStats && (
              <div className="text-xs text-gray-500 space-y-1">
                <p>Модель: {reportStats.model}</p>
                <p>Время генерации: {reportStats.processingTime}</p>
              </div>
            )}
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={handleShareReport}
              className="inline-flex items-center px-4 py-3 bg-white/60 backdrop-blur-sm border border-white/20 rounded-xl text-gray-700 hover:bg-white/80 transition-all duration-200 shadow-md hover:shadow-lg"
              disabled={!reportHtml || isGeneratingReport}
            >
              <Share2 className="w-4 h-4 mr-2" />
              Поделиться
            </button>
            <button
              onClick={handleDownloadReport}
              className="inline-flex items-center px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 transition-all duration-200 shadow-md hover:shadow-lg"
              disabled={!reportHtml || isGeneratingReport}
            >
              <Download className="w-4 h-4 mr-2" />
              Скачать HTML
            </button>
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
                <p className="text-lg font-semibold text-red-800">Ошибка генерации отчета</p>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
            <button
              onClick={generateReport}
              className="mt-4 inline-flex items-center px-6 py-3 bg-red-600 text-white text-sm font-semibold rounded-xl hover:bg-red-700 transition-all duration-200 shadow-md hover:shadow-lg"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Повторить генерацию
            </button>
          </div>
        )}
        
        {/* Показываем прогресс если идет генерация */}
        {isGeneratingReport && (
          <div className="bg-blue-50/80 backdrop-blur-sm border border-blue-200 rounded-2xl p-6 mb-8">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center mr-4">
                <Zap className="w-6 h-6 text-blue-600 animate-pulse" />
              </div>
              <div>
                <p className="text-lg font-semibold text-blue-800">Генерация детального отчета...</p>
                <p className="text-sm text-blue-700 mt-1">Используется модель: {selectedReportModel}</p>
              </div>
            </div>
          </div>
        )}
        
        {/* Показываем данные только если есть результаты */}
        {analysisResults.length === 0 ? (
          <div className="bg-yellow-50/80 backdrop-blur-sm border border-yellow-200 rounded-2xl p-6 mb-8">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-yellow-100 rounded-2xl flex items-center justify-center mr-4">
                <AlertCircle className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="flex-1">
                <p className="text-lg font-semibold text-yellow-800">
                  Нет данных для генерации отчета
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
            {/* Итоговая рекомендация */}
            {getBestKP() && (
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 backdrop-blur-sm border border-green-200 rounded-2xl p-8 mb-8">
                <div className="flex items-start">
                  <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mr-6">
                    <Trophy className="w-8 h-8 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-green-800 mb-3">
                      Рекомендация экспертной системы
                    </h3>
                    <p className="text-green-700 mb-6 text-lg">
                      <span className="font-bold text-green-800">Рекомендуется к выбору: {getBestKP()!.company_name}</span>
                    </p>
                    <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-green-200">
                      <h4 className="text-lg font-semibold text-green-800 mb-4 flex items-center">
                        <CheckCircle className="w-5 h-5 mr-2" />
                        Ключевые преимущества
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div className="bg-white/60 rounded-lg p-3">
                          <span className="text-sm text-green-700">Соответствие ТЗ:</span>
                          <div className="text-xl font-bold text-green-800">{getBestKP()!.comparison_result.compliance_score}%</div>
                        </div>
                        <div className="bg-white/60 rounded-lg p-3">
                          <span className="text-sm text-green-700">Общий рейтинг:</span>
                          <div className="text-xl font-bold text-green-800">{((Object.values(getBestKP()!.ratings).reduce((sum, val) => sum + val, 0) / Object.values(getBestKP()!.ratings).length * 10 + getBestKP()!.comparison_result.compliance_score) / 2).toFixed(1)}/100</div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        {getBestKP()!.preliminary_recommendation.strength.slice(0, 3).map((strength, index) => (
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

            {/* AI-сгенерированный отчет */}
            {reportHtml ? (
              <div className="prose max-w-none">
                <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                  <Zap className="w-6 h-6 mr-3 text-purple-600" />
                  Детальный AI-отчет
                </h3>
                <div 
                  className="bg-white/60 backdrop-blur-sm border border-white/20 rounded-2xl p-8"
                  dangerouslySetInnerHTML={{ __html: reportHtml }}
                />
              </div>
            ) : !isGeneratingReport && (
              <div className="prose max-w-none">
                <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                  <TrendingUp className="w-6 h-6 mr-3 text-blue-600" />
                  Краткий анализ
                </h3>
                
                <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-white/20 p-8 mb-8">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Users className="w-5 h-5 mr-2 text-blue-600" />
                    Методология оценки
                  </h4>
                  <p className="text-gray-700 mb-4">
                    Анализ проведен с использованием системы искусственного интеллекта, которая оценила каждое 
                    коммерческое предложение по пяти ключевым критериям:
                  </p>
                  <ul className="text-gray-700 space-y-2">
                    <li><strong>Техническое соответствие</strong> - соответствие требованиям ТЗ</li>
                    <li><strong>Функциональная полнота</strong> - покрытие всех требуемых функций</li>
                    <li><strong>Экономическая эффективность</strong> - соотношение цена/качество</li>
                    <li><strong>Реалистичность сроков</strong> - выполнимость предложенных временных рамок</li>
                    <li><strong>Надежность поставщика</strong> - опыт и репутация исполнителя</li>
                  </ul>
                </div>

                <div className={`grid grid-cols-1 gap-6 mb-8 ${
                  analysisResults.length === 2 ? 'md:grid-cols-2' : 
                  analysisResults.length === 3 ? 'md:grid-cols-3' : 
                  'md:grid-cols-2 lg:grid-cols-3'
                }`}>
                  {analysisResults.map((result, index) => {
                    const overallScore = ((Object.values(result.ratings).reduce((sum, val) => sum + val, 0) / Object.values(result.ratings).length * 10 + result.comparison_result.compliance_score) / 2).toFixed(1);
                    const isWinner = result === getBestKP();
                    
                    return (
                      <div 
                        key={result.company_name} 
                        className={`bg-white/60 backdrop-blur-sm border rounded-2xl p-6 transition-all duration-300 hover:shadow-lg ${
                          isWinner ? 'border-green-200 bg-gradient-to-br from-green-50 to-emerald-50' : 'border-white/20'
                        }`}
                      >
                        <div className="flex items-center mb-4">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center mr-3 ${
                            isWinner ? 'bg-green-100' : 'bg-gray-100'
                          }`}>
                            {isWinner ? <Trophy className="w-5 h-5 text-green-600" /> : <Users className="w-5 h-5 text-gray-600" />}
                          </div>
                          <h4 className={`font-semibold ${
                            isWinner ? 'text-green-900' : 'text-gray-900'
                          }`}>
                            {result.company_name}
                          </h4>
                          {isWinner && (
                            <div className="ml-auto bg-green-100 text-green-700 text-xs font-semibold px-2 py-1 rounded-full">
                              Лидер
                            </div>
                          )}
                        </div>
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Общая оценка:</span>
                            <span className={`font-medium ${
                              isWinner ? 'text-green-700' : 'text-blue-600'
                            }`}>{overallScore}/100</span>
                          </div>
                          <div className="bg-blue-50/80 backdrop-blur-sm p-4 rounded-xl text-sm">
                            <div className="flex items-center mb-2">
                              <CheckCircle className="w-4 h-4 text-blue-600 mr-2" />
                              <strong className="text-blue-800">Преимущества:</strong>
                            </div>
                            <div className="space-y-1">
                              {result.preliminary_recommendation.strength.slice(0, 3).map((strength, idx) => (
                                <div key={idx} className="flex items-start">
                                  <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mr-2 mt-2"></div>
                                  <span className="text-blue-700">{strength}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                          {result.preliminary_recommendation.weakness.length > 0 && (
                            <div className="bg-yellow-50/80 backdrop-blur-sm p-4 rounded-xl text-sm">
                              <div className="flex items-center mb-2">
                                <AlertCircle className="w-4 h-4 text-yellow-600 mr-2" />
                                <strong className="text-yellow-800">Недостатки:</strong>
                              </div>
                              <div className="space-y-1">
                                {result.preliminary_recommendation.weakness.slice(0, 2).map((weakness, idx) => (
                                  <div key={idx} className="flex items-start">
                                    <div className="w-1.5 h-1.5 bg-yellow-600 rounded-full mr-2 mt-2"></div>
                                    <span className="text-yellow-700">{weakness}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="bg-blue-50/80 backdrop-blur-sm rounded-2xl border border-blue-200 p-6">
                  <h4 className="text-lg font-semibold text-blue-900 mb-4 flex items-center">
                    <CheckCircle className="w-5 h-5 mr-2" />
                    Заключение
                  </h4>
                  <p className="text-blue-800">
                    {getBestKP() ? getBestKP()!.preliminary_recommendation.summary : 'Рекомендация недоступна'}
                  </p>
                </div>
              </div>
            )}

            {/* Дополнительная информация */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-white/20 p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2 text-blue-600" />
                  Статистика анализа
                </h4>
                <div className="space-y-2 text-sm text-gray-600">
                  {reportStats && (
                    <div className="flex justify-between">
                      <span>Время генерации отчета:</span>
                      <span>{reportStats.processingTime}</span>
                    </div>
                  )}
                  {reportStats && (
                    <div className="flex justify-between">
                      <span>Обработано требований:</span>
                      <span>{reportStats.requirementsProcessed}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Проанализировано КП:</span>
                    <span>{analysisResults.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Используемая модель:</span>
                    <span>{selectedReportModel}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Средний рейтинг соответствия:</span>
                    <span>{(analysisResults.reduce((sum, result) => sum + result.comparison_result.compliance_score, 0) / analysisResults.length).toFixed(1)}%</span>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50/80 backdrop-blur-sm rounded-2xl border border-yellow-200 p-6">
                <h4 className="text-lg font-semibold text-yellow-900 mb-4 flex items-center">
                  <CheckCircle className="w-5 h-5 mr-2 text-yellow-600" />
                  Следующие шаги
                </h4>
                <div className="space-y-3">
                  <div className="flex items-start">
                    <div className="w-6 h-6 bg-yellow-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
                      <span className="text-xs font-bold text-yellow-700">1</span>
                    </div>
                    <span className="text-sm text-yellow-800">Направить запрос на уточнение к {getBestKP()?.company_name || 'лидирующему поставщику'}</span>
                  </div>
                  <div className="flex items-start">
                    <div className="w-6 h-6 bg-yellow-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
                      <span className="text-xs font-bold text-yellow-700">2</span>
                    </div>
                    <span className="text-sm text-yellow-800">Запросить референсы и портфолио</span>
                  </div>
                  <div className="flex items-start">
                    <div className="w-6 h-6 bg-yellow-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
                      <span className="text-xs font-bold text-yellow-700">3</span>
                    </div>
                    <span className="text-sm text-yellow-800">Провести техническое интервью с командой</span>
                  </div>
                  <div className="flex items-start">
                    <div className="w-6 h-6 bg-yellow-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
                      <span className="text-xs font-bold text-yellow-700">4</span>
                    </div>
                    <span className="text-sm text-yellow-800">Обсудить возможность оптимизации условий</span>
                  </div>
                  <div className="flex items-start">
                    <div className="w-6 h-6 bg-yellow-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
                      <span className="text-xs font-bold text-yellow-700">5</span>
                    </div>
                    <span className="text-sm text-yellow-800">Согласовать детальный план-график работ</span>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Навигационные кнопки */}
        <div className="mt-10 flex justify-between items-center">
          <button
            onClick={() => onStepChange('comparison')}
            className="flex items-center px-6 py-3 bg-white/60 backdrop-blur-sm border border-white/20 rounded-xl text-gray-700 hover:bg-white/80 transition-all duration-200 shadow-md hover:shadow-lg"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Назад к сравнению
          </button>
          
          <div className="flex space-x-4">
            {!reportHtml && !isGeneratingReport && analysisResults.length > 0 && (
              <button
                onClick={generateReport}
                className="flex items-center px-6 py-3 bg-white/60 backdrop-blur-sm border border-blue-200 text-blue-600 rounded-xl hover:bg-blue-50/80 transition-all duration-200 shadow-md hover:shadow-lg"
              >
                <Zap className="w-4 h-4 mr-2" />
                Сгенерировать детальный отчет
              </button>
            )}
            
            <button
              onClick={() => onStepChange('upload')}
              className="flex items-center px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-200 shadow-md hover:shadow-lg font-semibold"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Новый анализ
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportSection;