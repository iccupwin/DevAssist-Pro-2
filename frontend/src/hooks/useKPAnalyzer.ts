/**
 * Hook для управления состоянием КП Анализатора
 */

import { useState, useCallback, useEffect } from 'react';
import { 
  KPAnalyzerState, 
  Document, 
  TechnicalSpecification, 
  CommercialProposal,
  AnalysisResult,
  ComparisonResult,
  UploadedFile,
  AIModelConfig,
  AnalysisProgress
} from '../types/kpAnalyzer';
import { kpAnalyzerService } from '../services/ai/kpAnalyzerService';
import { realKpAnalysisService } from '../services/ai/realKpAnalysisService';

const initialState: KPAnalyzerState = {
  technicalSpec: null,
  commercialProposals: [],
  selectedModels: {
    analysis: 'claude-3-5-sonnet',
    comparison: 'gpt-4o',
  },
  analysisResults: [],
  comparisonResult: null,
  currentStep: 'upload',
  isProcessing: false,
  progress: null,
  error: null,
};

export const useKPAnalyzer = () => {
  const [state, setState] = useState<KPAnalyzerState>(initialState);
  const [availableModels, setAvailableModels] = useState<AIModelConfig[]>([]);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});

  // Загрузка доступных моделей при инициализации
  useEffect(() => {
    loadAvailableModels();
  }, []);

  const loadAvailableModels = useCallback(async () => {
    try {
      // Используем статический список моделей пока что
      const staticModels = [
        { id: 'claude-3-5-sonnet', name: 'Claude 3.5 Sonnet', provider: 'anthropic', model: 'claude-3-5-sonnet-20240620', temperature: 0.1, maxTokens: 4000, available: true },
        { id: 'claude-3-opus', name: 'Claude 3 Opus', provider: 'anthropic', model: 'claude-3-opus-20240229', temperature: 0.1, maxTokens: 4000, available: true },
        { id: 'gpt-4o', name: 'GPT-4o', provider: 'openai', model: 'gpt-4o', temperature: 0.1, maxTokens: 4000, available: true },
        { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', provider: 'openai', model: 'gpt-4-turbo', temperature: 0.1, maxTokens: 4000, available: true },
      ];
      setAvailableModels(staticModels as AIModelConfig[]);
    } catch (error) {
      // Failed to load models
    }
  }, []);

  // Внутренняя функция для запуска анализа
  const startAnalysisInternal = useCallback(async (currentState: KPAnalyzerState) => {
    // Starting internal analysis

    if (!currentState.technicalSpec || currentState.commercialProposals.length === 0) {
      // Insufficient data for analysis
      return;
    }

    setState(prev => ({
      ...prev,
      isProcessing: true,
      error: null,
      currentStep: 'analyze',
      progress: {
        stage: 'processing',
        progress: 0,
        currentTask: 'Подготовка документов для анализа...',
      }
    }));

    try {
      // Обновляем прогресс: подготовка файлов
      setState(prev => ({
        ...prev,
        progress: {
          stage: 'processing',
          progress: 20,
          currentTask: 'Создание файлов для анализа...',
        }
      }));

      // Создаем файлы из загруженных документов
      const tzFile = new File([currentState.technicalSpec.content], currentState.technicalSpec.title, { type: 'text/plain' });
      const kpFiles = currentState.commercialProposals.map(kp => 
        new File([kp.content], kp.title, { type: 'text/plain' })
      );

      // Files prepared for analysis

      // Обновляем прогресс: запуск AI анализа
      setState(prev => ({
        ...prev,
        progress: {
          stage: 'analysis',
          progress: 10,
          currentTask: 'Запуск Claude AI для анализа документов...',
        }
      }));

      // Используем новый сервис для полного анализа
      const results = await realKpAnalysisService.analyzeMultipleKP(
        tzFile,
        kpFiles,
        currentState.selectedModels.analysis,
        (overallProgress, currentMessage) => {
          // Analysis progress update
          setState(prev => ({
            ...prev,
            progress: {
              stage: 'analysis',
              progress: overallProgress,
              currentTask: currentMessage,
            }
          }));
        }
      );

      // Analysis completed

      // Преобразуем результаты в формат AnalysisResult
      const convertedResults: AnalysisResult[] = results.map(result => ({
        id: result.id,
        kpId: result.id,
        companyName: result.company_name,
        complianceScore: result.comparison.compliance_score,
        strengths: result.comparison.advantages || [],
        weaknesses: result.comparison.risks || [],
        missingRequirements: result.comparison.missing_requirements || [],
        additionalFeatures: result.comparison.additional_features || [],
        technicalRating: Math.round(result.comparison.compliance_score * 0.8),
        financialRating: Math.round(result.comparison.compliance_score * 0.9),
        timelineRating: Math.round(result.comparison.compliance_score * 0.7),
        overallRating: result.comparison.compliance_score,
        recommendations: result.comparison.strengths || [],
        risks: result.comparison.risks || [],
        detailedAnalysis: result.comparison.overall_assessment || '',
        analyzedAt: result.created_at,
        model: result.model_used,
        summary: {
          overallRating: result.comparison.compliance_score >= 80 ? 'excellent' : 
                        result.comparison.compliance_score >= 60 ? 'good' : 
                        result.comparison.compliance_score >= 40 ? 'satisfactory' : 'poor',
          keyFindings: result.comparison.advantages || [],
          riskLevel: result.comparison.risks?.length > 2 ? 'high' : 
                    result.comparison.risks?.length > 0 ? 'medium' : 'low'
        }
      }));

      // Генерируем сравнительный отчет
      const comparisonResult: ComparisonResult = {
        id: `comparison-${Date.now()}`,
        summary: `Проанализировано ${convertedResults.length} коммерческих предложений`,
        ranking: convertedResults
          .map((r, index) => ({
            kpId: r.id,
            rank: index + 1,
            totalScore: r.complianceScore,
            summary: `${r.companyName} - ${r.complianceScore}% соответствие`
          }))
          .sort((a, b) => b.totalScore - a.totalScore)
          .map((item, index) => ({ ...item, rank: index + 1 })),
        recommendations: [
          'Рекомендуется детально изучить КП с наивысшими оценками',
          'Обратите внимание на недостающие требования в анализе',
          'Рассмотрите дополнительные функции, предлагаемые подрядчиками'
        ],
        riskAssessment: 'Основные риски связаны с соответствием техническим требованиям и соблюдением сроков',
        bestChoice: convertedResults.length > 0 ? convertedResults
          .sort((a, b) => b.complianceScore - a.complianceScore)[0].id : '',
        comparisonMatrix: convertedResults.map(r => ({
          kpId: r.id,
          technical: r.technicalRating,
          financial: r.financialRating,
          timeline: r.timelineRating,
          overall: r.overallRating
        })),
        analyzedAt: new Date().toISOString(),
        model: currentState.selectedModels.comparison
      };

      // Report generated, transitioning to results

      setState(prev => ({
        ...prev,
        analysisResults: convertedResults,
        comparisonResult,
        isProcessing: false,
        currentStep: 'results', // Сразу переходим к результатам
        progress: null,
      }));

    } catch (error) {
      // Analysis failed
      setState(prev => ({
        ...prev,
        isProcessing: false,
        error: error instanceof Error ? error.message : 'Ошибка запуска анализа',
        progress: null,
      }));
    }
  }, []);

  const uploadDocument = useCallback(async (file: File, role: 'tz' | 'kp') => {
    const fileId = `${role}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Uploading file
    setState(prev => ({ ...prev, isProcessing: true, error: null }));
    setUploadProgress(prev => ({ ...prev, [fileId]: 0 }));

    try {
      // Имитация прогресса загрузки
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => ({
          ...prev,
          [fileId]: Math.min(prev[fileId] + 10, 90)
        }));
      }, 200);

      // Используем новый сервис для извлечения текста из файла
      const extractedData = await realKpAnalysisService.extractTextFromPDF(file);
      
      clearInterval(progressInterval);
      setUploadProgress(prev => ({ ...prev, [fileId]: 100 }));

      setState(prev => {
        const newState = { 
          ...prev, 
          isProcessing: false,
          // Очищаем предыдущие результаты при загрузке новых файлов
          analysisResults: [],
          comparisonResult: null,
          currentStep: 'upload' as const
        };
        
        if (role === 'tz') {
          // Заменяем ТЗ (может быть только одно)
          // Replacing technical specification
          newState.technicalSpec = {
            id: fileId,
            name: file.name,
            size: file.size,
            type: file.name.endsWith('.pdf') ? 'pdf' : 'docx',
            uploadedAt: new Date().toISOString(),
            content: extractedData.text,
            status: 'ready',
            role: 'tz',
            title: file.name,
          } as TechnicalSpecification;
        } else {
          // Добавляем КП, проверяя на дубликаты по имени файла
          const existingKP = prev.commercialProposals.find(kp => kp.name === file.name);
          if (existingKP) {
            // Commercial proposal already loaded, skipping
            newState.commercialProposals = prev.commercialProposals;
          } else {
            // Adding commercial proposal
            const newKP: CommercialProposal = {
              id: fileId,
              name: file.name,
              size: file.size,
              type: file.name.endsWith('.pdf') ? 'pdf' : 'docx',
              uploadedAt: new Date().toISOString(),
              content: extractedData.text,
              status: 'ready',
              role: 'kp',
              title: file.name,
            };
            newState.commercialProposals = [
              ...prev.commercialProposals,
              newKP
            ];
          }
        }
        
        return newState;
      });

      // Автоматический анализ отключен - пользователь должен нажать кнопку "Анализ"
      // Раньше здесь был автоматический запуск анализа, но теперь он происходит только по нажатию кнопки

      // Убираем прогресс через небольшую задержку
      setTimeout(() => {
        setUploadProgress(prev => {
          const newProgress = { ...prev };
          delete newProgress[fileId];
          return newProgress;
        });
      }, 1000);

    } catch (error) {
      // Upload failed
      setState(prev => ({ 
        ...prev, 
        isProcessing: false,
        error: error instanceof Error ? error.message : 'Ошибка загрузки файла'
      }));
      setUploadProgress(prev => {
        const newProgress = { ...prev };
        delete newProgress[fileId];
        return newProgress;
      });
    }
  }, []);

  const removeDocument = useCallback((documentId: string, role: 'tz' | 'kp') => {
    setState(prev => {
      const newState = { ...prev };
      
      if (role === 'tz') {
        newState.technicalSpec = null;
      } else {
        newState.commercialProposals = prev.commercialProposals.filter(
          doc => doc.id !== documentId
        );
      }
      
      return newState;
    });
  }, []);

  const updateModelSelection = useCallback((type: 'analysis' | 'comparison', modelId: string) => {
    setState(prev => ({
      ...prev,
      selectedModels: {
        ...prev.selectedModels,
        [type]: modelId
      }
    }));
  }, []);

  const startAnalysis = useCallback(async () => {
    if (!state.technicalSpec || state.commercialProposals.length === 0) {
      setState(prev => ({ 
        ...prev, 
        error: 'Необходимо загрузить ТЗ и как минимум одно КП' 
      }));
      return;
    }

    setState(prev => ({
      ...prev,
      isProcessing: true,
      error: null,
      currentStep: 'analyze',
      progress: {
        stage: 'analysis',
        progress: 0,
        currentTask: 'Инициализация анализа...',
      }
    }));

    try {
      const analysisResults: AnalysisResult[] = [];

      // Создаем файлы из загруженных документов
      const tzFile = new File([state.technicalSpec.content], state.technicalSpec.title, { type: 'text/plain' });
      const kpFiles = state.commercialProposals.map(kp => 
        new File([kp.content], kp.title, { type: 'text/plain' })
      );

      // Используем новый сервис для полного анализа
      const results = await realKpAnalysisService.analyzeMultipleKP(
        tzFile,
        kpFiles,
        state.selectedModels.analysis,
        (overallProgress, currentMessage) => {
          setState(prev => ({
            ...prev,
            progress: {
              stage: 'analysis',
              progress: overallProgress,
              currentTask: currentMessage,
            }
          }));
        }
      );

      // Преобразуем результаты в формат AnalysisResult
      const convertedResults: AnalysisResult[] = results.map(result => ({
        id: result.id,
        kpId: result.id,
        companyName: result.company_name,
        complianceScore: result.comparison.compliance_score,
        strengths: result.comparison.advantages || [],
        weaknesses: result.comparison.risks || [],
        missingRequirements: result.comparison.missing_requirements || [],
        additionalFeatures: result.comparison.additional_features || [],
        technicalRating: Math.round(result.comparison.compliance_score * 0.8), // Примерный расчет
        financialRating: Math.round(result.comparison.compliance_score * 0.9),
        timelineRating: Math.round(result.comparison.compliance_score * 0.7),
        overallRating: result.comparison.compliance_score,
        recommendations: result.comparison.strengths || [],
        risks: result.comparison.risks || [],
        detailedAnalysis: result.comparison.overall_assessment || '',
        analyzedAt: result.created_at,
        model: result.model_used,
        summary: {
          overallRating: result.comparison.compliance_score >= 80 ? 'excellent' : 
                        result.comparison.compliance_score >= 60 ? 'good' : 
                        result.comparison.compliance_score >= 40 ? 'satisfactory' : 'poor',
          keyFindings: result.comparison.advantages || [],
          riskLevel: result.comparison.risks?.length > 2 ? 'high' : 
                    result.comparison.risks?.length > 0 ? 'medium' : 'low'
        }
      }));

      // Генерируем базовый сравнительный отчет
      setState(prev => ({
        ...prev,
        progress: {
          stage: 'comparison',
          progress: 90,
          currentTask: 'Генерируем сравнительный отчет...',
        }
      }));

      const comparisonResult: ComparisonResult = {
        id: `comparison-${Date.now()}`,
        summary: `Проанализировано ${convertedResults.length} коммерческих предложений`,
        ranking: convertedResults
          .map((r, index) => ({
            kpId: r.id,
            rank: index + 1,
            totalScore: r.complianceScore,
            summary: `${r.companyName} - ${r.complianceScore}% соответствие`
          }))
          .sort((a, b) => b.totalScore - a.totalScore)
          .map((item, index) => ({ ...item, rank: index + 1 })),
        recommendations: [
          'Рекомендуется детально изучить КП с наивысшими оценками',
          'Обратите внимание на недостающие требования в анализе',
          'Рассмотрите дополнительные функции, предлагаемые подрядчиками'
        ],
        riskAssessment: 'Основные риски связаны с соответствием техническим требованиям и соблюдением сроков',
        bestChoice: convertedResults.length > 0 ? convertedResults
          .sort((a, b) => b.complianceScore - a.complianceScore)[0].id : '',
        comparisonMatrix: convertedResults.map(r => ({
          kpId: r.id,
          technical: r.technicalRating,
          financial: r.financialRating,
          timeline: r.timelineRating,
          overall: r.overallRating
        })),
        analyzedAt: new Date().toISOString(),
        model: state.selectedModels.comparison
      };

      setState(prev => ({
        ...prev,
        analysisResults: convertedResults,
        comparisonResult,
        isProcessing: false,
        currentStep: 'results', // Сразу переходим к результатам
        progress: null,
      }));

    } catch (error) {
      // Analysis failed
      setState(prev => ({
        ...prev,
        isProcessing: false,
        error: error instanceof Error ? error.message : 'Ошибка запуска анализа',
        progress: null,
      }));
    }
  }, [state.technicalSpec, state.commercialProposals, state.selectedModels]);

  const resetAnalyzer = useCallback(() => {
    // Full analyzer reset
    // Полностью очищаем состояние
    setState({
      technicalSpec: null,
      commercialProposals: [],
      selectedModels: {
        analysis: 'claude-3-5-sonnet',
        comparison: 'gpt-4o',
      },
      analysisResults: [],
      comparisonResult: null,
      currentStep: 'upload',
      isProcessing: false,
      progress: null,
      error: null,
    });
    setUploadProgress({});
    
    // Очищаем кэш в сервисе анализа
    if (realKpAnalysisService && typeof realKpAnalysisService.clearCache === 'function') {
      // Clearing cache
      realKpAnalysisService.clearCache();
    }
  }, []);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  const goToStep = useCallback((step: KPAnalyzerState['currentStep']) => {
    setState(prev => ({ ...prev, currentStep: step }));
  }, []);

  return {
    // Состояние
    ...state,
    availableModels,
    uploadProgress,
    
    // Проверки готовности - убрали требование отсутствия результатов для повторного анализа
    canProceedToAnalysis: state.technicalSpec && state.commercialProposals.length > 0 && !state.isProcessing,
    hasResults: state.analysisResults.length > 0 && state.comparisonResult,
    
    // Действия
    uploadDocument,
    removeDocument,
    updateModelSelection,
    startAnalysis,
    resetAnalyzer,
    clearError,
    goToStep,
  };
};

// Вспомогательная функция для извлечения названия компании из имени файла
const extractCompanyName = (fileName: string): string => {
  // Удаляем расширение файла
  const nameWithoutExtension = fileName.replace(/\.[^/.]+$/, '');
  
  // Ищем паттерны для извлечения названия компании
  const patterns = [
    /КП[_\s-]?(.+)/i,
    /Предложение[_\s-]?(.+)/i,
    /Commercial[_\s-]?(.+)/i,
    /Proposal[_\s-]?(.+)/i
  ];

  for (const pattern of patterns) {
    const match = nameWithoutExtension.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }

  // Если паттерн не найден, возвращаем имя файла как есть
  return nameWithoutExtension;
};