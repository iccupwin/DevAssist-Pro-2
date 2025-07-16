import React, { useState } from 'react';
import { FileText, Files, Play, AlertCircle, CheckCircle, Star, BarChart3, AlertTriangle, Menu } from 'lucide-react';
import { KPFileUpload } from './KPFileUpload';
import { KPDetailedAnalysisResults } from './KPDetailedAnalysisResults';
import { KPDetailedReport } from './KPDetailedReport';
import { AnalysisProgress } from './AnalysisProgress';
import { AnalysisLoadingScreen } from './AnalysisLoadingScreen';
import KPAnalyzerSidebar from './KPAnalyzerSidebar';
import { useKPAnalyzer } from '../../hooks/useKPAnalyzer';
import { useAnalysisHistory } from '../../hooks/useAnalysisHistory';
import { KPAnalysisResult, AnalysisResult } from '../../types/kpAnalyzer';
import { kpPdfExportService } from '../../services/kpPdfExportService';

interface FileUploadInfo {
  file: File;
  name: string;
  size: number;
  type: string;
  uploadedAt: Date;
}

type AnalysisStep = 'upload' | 'analysis' | 'results' | 'report' | 'detailed';

export const KPAnalyzerMain: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<AnalysisStep>('upload');
  const [uploadedFiles, setUploadedFiles] = useState<{
    tzFile: FileUploadInfo | null;
    kpFiles: FileUploadInfo[];
    additionalFiles: FileUploadInfo[];
  }>({
    tzFile: null,
    kpFiles: [],
    additionalFiles: []
  });
  
  const [selectedKPResult, setSelectedKPResult] = useState<KPAnalysisResult | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true); // По умолчанию открыт
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isLoadingFromHistory, setIsLoadingFromHistory] = useState(false);
  
  // Хук для управления историей анализов
  const {
    history,
    currentAnalysisId,
    addToHistory,
    loadFromHistory,
    deleteFromHistory,
    setCurrentAnalysisId
  } = useAnalysisHistory();
  
  // Используем новый хук для КП анализа
  const {
    technicalSpec,
    commercialProposals,
    selectedModels,
    analysisResults,
    comparisonResult,
    isProcessing,
    progress,
    error,
    availableModels,
    uploadProgress,
    canProceedToAnalysis,
    hasResults,
    uploadDocument,
    removeDocument,
    updateModelSelection,
    startAnalysis,
    resetAnalyzer,
    clearError,
    goToStep
  } = useKPAnalyzer();

  const handleFileUpload = (type: 'tz' | 'kp' | 'additional', files: FileList | null) => {
    if (!files) return;

    const fileArray = Array.from(files);
    const fileInfoArray = fileArray.map(file => ({
      file,
      name: file.name,
      size: file.size,
      type: file.type,
      uploadedAt: new Date()
    }));

    setUploadedFiles(prev => {
      const newFiles = { ...prev };
      
      if (type === 'tz') {
        newFiles.tzFile = fileInfoArray[0];
        // Загружаем файл в хук
        uploadDocument(fileInfoArray[0].file, 'tz');
      } else if (type === 'kp') {
        newFiles.kpFiles = [...prev.kpFiles, ...fileInfoArray];
        // Загружаем файлы в хук
        fileInfoArray.forEach(fileInfo => {
          uploadDocument(fileInfo.file, 'kp');
        });
      } else if (type === 'additional') {
        newFiles.additionalFiles = [...prev.additionalFiles, ...fileInfoArray];
      }
      
      return newFiles;
    });
  };

  const handleRemoveFile = (type: 'tz' | 'kp' | 'additional', index?: number) => {
    setUploadedFiles(prev => {
      const newFiles = { ...prev };
      
      if (type === 'tz') {
        if (newFiles.tzFile) {
          removeDocument(newFiles.tzFile.name, 'tz');
        }
        newFiles.tzFile = null;
      } else if (type === 'kp' && index !== undefined) {
        const removedFile = newFiles.kpFiles[index];
        if (removedFile) {
          removeDocument(removedFile.name, 'kp');
        }
        newFiles.kpFiles = newFiles.kpFiles.filter((_, i) => i !== index);
      } else if (type === 'additional' && index !== undefined) {
        newFiles.additionalFiles = newFiles.additionalFiles.filter((_, i) => i !== index);
      }
      
      return newFiles;
    });
  };

  const handleStartAnalysis = async () => {
    if (!canProceedToAnalysis) {
      return;
    }

    setCurrentStep('analysis');
    try {
      await startAnalysis();
    } catch (error) {
      console.error('Analysis failed:', error);
    }
  };

  const handleViewDetailedReport = (result: KPAnalysisResult) => {
    setSelectedKPResult(result);
    setCurrentStep('detailed');
  };

  const handleNewAnalysis = () => {
    console.log('🔄 Запуск нового анализа - полная очистка состояния');
    
    // Сначала сбрасываем хук (включая кэш)
    resetAnalyzer();
    
    // Затем очищаем локальное состояние компонента
    setCurrentStep('upload');
    setUploadedFiles({
      tzFile: null,
      kpFiles: [],
      additionalFiles: []
    });
    setSelectedKPResult(null);
    
    // Очищаем текущий анализ в истории
    setCurrentAnalysisId(null);
    
    console.log('✅ Состояние полностью очищено, готов к новому анализу');
  };

  const handleGenerateReport = () => {
    setCurrentStep('report');
  };

  const handleExportPDF = async () => {
    try {
      if (!hasResults || analysisResults.length === 0) {
        alert('Нет результатов для экспорта');
        return;
      }

      console.log('🔄 Начинаем генерацию PDF отчета...');

      // Конвертируем результаты в правильный формат для PDF
      const convertedResults: KPAnalysisResult[] = analysisResults.map(result => ({
        id: result.id,
        fileName: result.kpId || 'Неизвестный файл',
        companyName: result.companyName || 'Неизвестная компания',
        complianceScore: result.complianceScore || 0,
        strengths: result.strengths || [],
        weaknesses: result.weaknesses || [],
        missingRequirements: result.missingRequirements || [],
        additionalFeatures: result.additionalFeatures || [],
        techStack: '', // Будет извлечено из detailedAnalysis
        pricing: '', // Будет извлечено из detailedAnalysis
        timeline: '', // Будет извлечено из detailedAnalysis
        approach: result.detailedAnalysis || '',
        analysisDate: result.analyzedAt || new Date().toISOString()
      }));

      console.log('📋 Формирование структуры отчета...');

      // Генерируем PDF
      await kpPdfExportService.exportAnalysisReport(
        convertedResults,
        comparisonResult,
        technicalSpec?.name || 'Техническое задание',
        {
          includeCharts: true,
          includeRawData: false,
          includeRecommendations: true
        }
      );

      console.log('✅ PDF отчет успешно сгенерирован');
      alert('PDF отчет успешно сгенерирован и сохранен!');

    } catch (error) {
      console.error('❌ Ошибка экспорта PDF:', error);
      alert(`Ошибка экспорта PDF: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
    }
  };

  const handleBackToResults = () => {
    setSelectedKPResult(null);
    setCurrentStep('results');
  };

  // Конвертируем analysisResults в KPAnalysisResult[] для отображения
  const convertedResults: KPAnalysisResult[] = analysisResults.map(result => ({
    id: result.id,
    fileName: result.kpId || 'Неизвестный файл',
    companyName: result.companyName,
    complianceScore: result.complianceScore,
    strengths: result.strengths,
    weaknesses: result.weaknesses,
    missingRequirements: result.missingRequirements,
    additionalFeatures: result.additionalFeatures,
    techStack: '', // Извлекается из детального анализа
    pricing: '', // Извлекается из детального анализа  
    timeline: '', // Извлекается из детального анализа
    approach: result.detailedAnalysis,
    analysisDate: result.analyzedAt
  }));

  // Логирование переходов для отладки
  React.useEffect(() => {
    console.log('🔄 Проверка состояния:', { 
      hasResults, 
      currentStep, 
      resultsCount: analysisResults.length,
      isProcessing 
    });
  }, [hasResults, currentStep, analysisResults.length, isProcessing]);

  // Синхронизируем состояние с хуком и автоматически переходим к результатам
  React.useEffect(() => {
    console.log('📊 Состояние КП анализатора:', {
      currentStep,
      isProcessing,
      hasResults,
      resultsCount: analysisResults.length,
      hasComparisonResult: !!comparisonResult,
      comparisonResult,
      tzLoaded: !!technicalSpec,
      kpCount: commercialProposals.length,
      progress: progress?.currentTask
    });

    // Автоматический переход к результатам после завершения анализа
    if (hasResults && !isProcessing && currentStep !== 'results') {
      console.log('🎯 Анализ завершен, автоматически переходим к результатам');
      setCurrentStep('results');
    }
  }, [currentStep, isProcessing, hasResults, analysisResults.length, comparisonResult, technicalSpec, commercialProposals.length, progress]);

  // Сохраняем завершенный анализ в историю
  React.useEffect(() => {
    if (hasResults && !isProcessing && analysisResults.length > 0 && !currentAnalysisId) {
      const analysisId = addToHistory(
        convertedResults,
        comparisonResult,
        technicalSpec,
        commercialProposals,
        selectedModels
      );
      
      console.log('📚 Анализ автоматически сохранен в историю:', analysisId);
    }
  }, [hasResults, isProcessing, analysisResults.length, currentAnalysisId, convertedResults, comparisonResult, technicalSpec, commercialProposals, selectedModels, addToHistory]);

  // Обработчики для сайдбара
  const handleToggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleCollapseSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  const handleLoadHistory = async (historyItem: any) => {
    console.log('📖 Загружаем анализ из истории:', historyItem.id);
    
    setIsLoadingFromHistory(true);
    
    try {
      const loadedData = loadFromHistory(historyItem);
      
      // Сброс текущего состояния анализатора
      resetAnalyzer();
      
      // Имитируем загрузку данных в хук
      // В реальном приложении здесь бы была загрузка в useKPAnalyzer
      setTimeout(() => {
        setCurrentStep('results');
        setIsLoadingFromHistory(false);
        setIsSidebarOpen(false);
        
        console.log('✅ Исторический анализ загружен:', {
          results: loadedData.results.length,
          hasComparison: !!loadedData.comparisonResult
        });
      }, 100); // Минимальная задержка для UX
      
    } catch (error) {
      console.error('❌ Ошибка загрузки из истории:', error);
      setIsLoadingFromHistory(false);
    }
  };

  const handleDeleteHistory = (id: string) => {
    if (confirm('Вы уверены, что хотите удалить этот анализ из истории?')) {
      deleteFromHistory(id);
    }
  };

  const handleExportHistory = async (id: string) => {
    const historyItem = history.find(item => item.id === id);
    if (historyItem) {
      try {
        console.log('📄 Экспорт PDF для анализа:', id);
        
        // Используем данные из истории
        await kpPdfExportService.exportAnalysisReport(
          historyItem.results,
          historyItem.comparisonResult,
          historyItem.tzName,
          {
            includeCharts: true,
            includeRawData: false,
            includeRecommendations: true
          }
        );
        
        console.log('✅ PDF для исторического анализа успешно сгенерирован');
        alert('Исторический отчет успешно экспортирован!');
        
      } catch (error) {
        console.error('❌ Ошибка экспорта исторического PDF:', error);
        alert(`Ошибка экспорта PDF: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-50 dark:bg-gray-900 flex overflow-hidden">
      {/* Sidebar */}
      <KPAnalyzerSidebar
        isOpen={isSidebarOpen}
        onToggle={handleToggleSidebar}
        onNewAnalysis={handleNewAnalysis}
        onLoadHistory={handleLoadHistory}
        onDeleteHistory={handleDeleteHistory}
        onExportHistory={handleExportHistory}
        history={history}
        currentAnalysisId={currentAnalysisId}
        isCollapsed={isSidebarCollapsed}
        onCollapse={handleCollapseSidebar}
      />
      
      {/* Main Content */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ${
        isSidebarOpen && !isSidebarCollapsed ? '' : isSidebarOpen && isSidebarCollapsed ? 'md:ml-16' : 'ml-0'
      }`}>
        {/* Top Bar */}
        <div className="h-12 md:h-14 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center px-4 md:px-6 gap-4">
          <button
            onClick={handleToggleSidebar}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors md:hidden"
          >
            <Menu className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
          
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              КП Анализатор
            </span>
          </div>
          
          <div className="flex-1"></div>
          
          {/* Статус сайдбара */}
          <div className="hidden md:flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <div className={`w-2 h-2 rounded-full ${
              isSidebarOpen ? 'bg-green-500' : 'bg-gray-400'
            }`}></div>
            <span>
              {isSidebarOpen ? (
                isSidebarCollapsed ? 'Свернут' : 'Развернут'
              ) : 'Скрыт'}
            </span>
          </div>
        </div>
        
        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Загрузочный экран анализа */}
          {isProcessing && (
            <AnalysisLoadingScreen
              progress={progress}
              isProcessing={isProcessing}
              technicalSpecName={technicalSpec?.name}
              commercialProposalsCount={commercialProposals.length}
            />
          )}

          <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8 py-6 md:py-8">
            
            {/* Заголовок */}
            <div className="text-center mb-6 md:mb-8">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-3 md:mb-4">
                КП Анализатор
              </h1>
              <p className="text-base md:text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto px-4">
                Загрузите техническое задание и коммерческие предложения для их сравнительного анализа с помощью AI
              </p>
            </div>

            {/* Этап загрузки */}
            {currentStep === 'upload' && (
              <>
                {/* Информационная карточка */}
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 md:p-6 mb-6 md:mb-8">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-blue-900 dark:text-blue-300 font-medium">
                        Загрузите документы для AI анализа
                      </p>
                      <p className="text-xs text-blue-700 dark:text-blue-400 mt-1">
                        После загрузки ТЗ и КП система автоматически запустит AI анализ и покажет детальные результаты
                      </p>
                    </div>
                  </div>
                </div>

                {/* Загрузка файлов */}
                <KPFileUpload
                  uploadedFiles={uploadedFiles}
                  onFileUpload={handleFileUpload}
                  onRemoveFile={handleRemoveFile}
                />

                {/* Выбор модели */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 md:p-6 mb-6 md:mb-8">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Выбор AI модели
                    </h3>
                    <div className="bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-400 px-3 py-1 rounded-full text-sm font-medium">
                      🤖 Реальный AI анализ
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Модель для анализа:
                      </label>
                      <select
                        value={selectedModels.analysis}
                        onChange={(e) => updateModelSelection('analysis', e.target.value)}
                        className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 text-sm md:text-base focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      >
                        <option value="claude-3-5-sonnet">Claude 3.5 Sonnet</option>
                        <option value="claude-3-opus">Claude 3 Opus</option>
                        <option value="gpt-4o">GPT-4o</option>
                        <option value="gpt-4-turbo">GPT-4 Turbo</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Модель для сравнения:
                      </label>
                      <select
                        value={selectedModels.comparison}
                        onChange={(e) => updateModelSelection('comparison', e.target.value)}
                        className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 text-sm md:text-base focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      >
                        <option value="gpt-4o">GPT-4o</option>
                        <option value="claude-3-5-sonnet">Claude 3.5 Sonnet</option>
                        <option value="gpt-4-turbo">GPT-4 Turbo</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Кнопка запуска анализа */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 md:p-6">
                  <div className="text-center">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-6">
                      <div className={`text-center p-3 md:p-4 rounded-lg border ${
                        technicalSpec 
                          ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' 
                          : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                      }`}>
                        <div className="flex items-center justify-center gap-2 mb-2">
                          {technicalSpec ? (
                            <CheckCircle className="w-5 h-5 text-green-600" />
                          ) : (
                            <AlertCircle className="w-5 h-5 text-red-600" />
                          )}
                          <span className={`font-medium ${
                            technicalSpec ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'
                          }`}>
                            ТЗ: {technicalSpec ? 'загружено' : 'не загружено'}
                          </span>
                        </div>
                      </div>

                      <div className={`text-center p-3 md:p-4 rounded-lg border ${
                        commercialProposals.length > 0 
                          ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' 
                          : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                      }`}>
                        <div className="flex items-center justify-center gap-2 mb-2">
                          {commercialProposals.length > 0 ? (
                            <CheckCircle className="w-5 h-5 text-green-600" />
                          ) : (
                            <AlertCircle className="w-5 h-5 text-red-600" />
                          )}
                          <span className={`font-medium ${
                            commercialProposals.length > 0 ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'
                          }`}>
                            КП: {commercialProposals.length > 0 ? `загружено ${commercialProposals.length}` : 'не загружено'}
                          </span>
                        </div>
                      </div>

                      <div className={`text-center p-3 md:p-4 rounded-lg border ${
                        uploadedFiles.additionalFiles.length > 0 
                          ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' 
                          : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                      }`}>
                        <div className="flex items-center justify-center gap-2 mb-2">
                          {uploadedFiles.additionalFiles.length > 0 ? (
                            <CheckCircle className="w-5 h-5 text-green-600" />
                          ) : (
                            <div className="w-5 h-5 rounded-full bg-gray-300 dark:bg-gray-600" />
                          )}
                          <span className={`font-medium ${
                            uploadedFiles.additionalFiles.length > 0 
                              ? 'text-green-700 dark:text-green-400' 
                              : 'text-gray-600 dark:text-gray-400'
                          }`}>
                            Доп: {uploadedFiles.additionalFiles.length > 0 ? 'загружено' : 'опционально'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {!canProceedToAnalysis && !hasResults && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                        ⚠️ Для запуска анализа необходимо загрузить ТЗ и хотя бы одно КП
                      </p>
                    )}
                    
                    {hasResults && currentStep === 'upload' && (
                      <div className="text-center mb-4">
                        <p className="text-sm text-green-600 dark:text-green-400 mb-2">
                          ✅ Анализ завершен! Результаты отображаются автоматически
                        </p>
                        <button
                          onClick={() => setCurrentStep('results')}
                          className="inline-flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                        >
                          <BarChart3 className="w-4 h-4" />
                          Просмотреть результаты
                        </button>
                      </div>
                    )}
                    
                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                      <button
                        onClick={handleStartAnalysis}
                        disabled={!canProceedToAnalysis || isProcessing}
                        className={`
                          inline-flex items-center gap-3 px-6 md:px-8 py-3 md:py-4 rounded-lg font-medium text-base md:text-lg
                          transition-all duration-200 min-w-[200px] md:min-w-[250px] justify-center
                          ${canProceedToAnalysis && !isProcessing
                            ? 'bg-blue-600 text-white hover:bg-blue-700 transform hover:scale-105 shadow-lg hover:shadow-xl'
                            : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                          }
                        `}
                      >
                        <Play className="w-6 h-6" />
                        {isProcessing ? 'Анализ запущен...' : 'Запустить анализ всех КП'}
                      </button>
                      
                      {hasResults && (
                        <button
                          onClick={handleNewAnalysis}
                          className="inline-flex items-center gap-3 px-6 md:px-8 py-3 md:py-4 rounded-lg font-medium text-base md:text-lg bg-green-600 text-white hover:bg-green-700 transform hover:scale-105 shadow-lg hover:shadow-xl transition-all duration-200 min-w-[200px] md:min-w-[250px] justify-center"
                        >
                          <Star className="w-6 h-6" />
                          Новый анализ
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Этап анализа */}
            {currentStep === 'analysis' && (
              <AnalysisProgress
                isAnalyzing={isProcessing}
                progress={progress?.progress || 0}
                currentKP={progress?.currentTask || ''}
                totalKPs={commercialProposals.length}
                completedKPs={Math.floor((progress?.progress || 0) / 100 * commercialProposals.length)}
              />
            )}

            {/* Этап результатов */}
            {currentStep === 'results' && (
              <>
                {isLoadingFromHistory ? (
                  <div className="text-center py-12">
                    <div className="mb-8">
                      <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                        Загрузка анализа из истории...
                      </h2>
                      <p className="text-gray-600 dark:text-gray-400">
                        Восстанавливаем данные анализа
                      </p>
                    </div>
                  </div>
                ) : convertedResults.length > 0 || (currentAnalysisId && history.find(h => h.id === currentAnalysisId)) ? (
                  (() => {
                    // Используем данные из истории если доступны
                    const historicalData = currentAnalysisId ? history.find(h => h.id === currentAnalysisId) : null;
                    const resultsToShow = convertedResults.length > 0 ? convertedResults : (historicalData?.results || []);
                    
                    return (
                      <KPDetailedAnalysisResults
                        results={resultsToShow}
                        onNewAnalysis={handleNewAnalysis}
                        onGenerateReport={handleGenerateReport}
                        onViewDetailedReport={handleViewDetailedReport}
                        onExportPDF={handleExportPDF}
                        tzName={technicalSpec?.title || historicalData?.tzName || 'Техническое задание'}
                      />
                    );
                  })()
                ) : (
                  <div className="text-center py-12">
                    <div className="mb-8">
                      <AlertTriangle className="w-16 h-16 text-yellow-600 mx-auto mb-4" />
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                        Результаты не найдены
                      </h2>
                      <p className="text-gray-600 dark:text-gray-400 mb-6">
                        Анализ завершен, но результаты не получены. Проверьте консоль для деталей.
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-500 mb-6">
                        Данные: {JSON.stringify({ 
                          analysisResults: analysisResults.length,
                          convertedResults: convertedResults.length,
                          hasResults,
                          comparisonResult: !!comparisonResult,
                          currentAnalysisId,
                          historyItem: currentAnalysisId ? !!history.find(h => h.id === currentAnalysisId) : false
                        })}
                      </p>
                    </div>
                    <button
                      onClick={handleNewAnalysis}
                      className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Попробовать снова
                    </button>
                  </div>
                )}
              </>
            )}

            {/* Детальный отчет */}
            {currentStep === 'detailed' && selectedKPResult && (
              (() => {
                const historicalData = currentAnalysisId ? history.find(h => h.id === currentAnalysisId) : null;
                const allResultsToShow = convertedResults.length > 0 ? convertedResults : (historicalData?.results || []);
                
                return (
                  <KPDetailedReport
                    result={selectedKPResult}
                    onBack={handleBackToResults}
                    onExportPDF={handleExportPDF}
                    tzName={technicalSpec?.title || historicalData?.tzName || 'Техническое задание'}
                    allResults={allResultsToShow}
                  />
                );
              })()
            )}

            {/* Сравнительный отчет */}
            {currentStep === 'report' && (
              <div className="text-center py-12">
                <div className="mb-8">
                  <BarChart3 className="w-16 h-16 text-blue-600 mx-auto mb-4" />
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                    Сравнительный отчет
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    Функция генерации сравнительного отчета будет добавлена в следующей версии
                  </p>
                </div>
                <button
                  onClick={() => setCurrentStep('results')}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Вернуться к результатам
                </button>
              </div>
            )}

            {/* Ошибки */}
            {error && (
              <div className="fixed bottom-4 right-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 shadow-lg z-50">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-red-900 dark:text-red-300 font-medium">
                      Ошибка анализа
                    </p>
                    <p className="text-xs text-red-700 dark:text-red-400 mt-1">
                      {error}
                    </p>
                    <button 
                      onClick={clearError}
                      className="mt-2 px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
                    >
                      Закрыть
                    </button>
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

export default KPAnalyzerMain;