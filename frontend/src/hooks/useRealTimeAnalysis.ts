/**
 * Real-time Analysis Hook for KP Analyzer v2
 * Manages document analysis lifecycle with progress tracking
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { realKpAnalysisService } from '../services/ai/realKpAnalysisService';

interface DocumentUpload {
  id: string;
  file: File;
  name: string;
  size: number;
  type: string;
  uploadProgress: number;
  extractionProgress: number;
  status: 'uploading' | 'processing' | 'ready' | 'error';
  extractedText?: string;
  error?: string;
}

interface ProgressUpdate {
  stage: 'upload' | 'extraction' | 'analysis' | 'compilation' | 'complete';
  progress: number;
  message: string;
  timeElapsed: number;
  estimatedTimeRemaining?: number;
  currentSection?: string;
}

interface AnalysisRequest {
  documentId: string;
  tzContent?: string;
  analysisOptions: {
    aiModel?: 'claude-3-5-sonnet' | 'claude-3-opus' | 'gpt-4o' | 'gpt-4-turbo';
    detailLevel?: 'standard' | 'comprehensive' | 'executive';
    includeFinancialAnalysis?: boolean;
    includeTechnicalDeepDive?: boolean;
    includeRiskAssessment?: boolean;
  };
}

interface AnalysisSession {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  result?: ComprehensiveAnalysisResult;
}

interface ComprehensiveAnalysisResult {
  documentName: string;
  companyName: string;
  overallScore: number;
  aiModel: string;
  processingDuration: number;
  confidenceScore: number;
  complianceLevel: string;
  
  financials: {
    totalBudget?: {
      amount: number;
      currency: string;
      formatted: string;
    };
    currencies: Array<{
      amount: number;
      currency: string;
      formatted: string;
    }>;
  };
  
  sections: Record<string, {
    title: string;
    score: number;
    summary: string;
    details: string;
    keyPoints: string[];
    recommendations: string[];
    confidence: number;
    wordCount: number;
  }>;
  
  executiveSummary: {
    keyStrengths: string[];
    criticalWeaknesses: string[];
    recommendation: string;
  };
}

interface AnalysisHistory {
  id: string;
  name: string;
  documentName: string;
  companyName: string;
  overallScore: number;
  createdAt: string;
  aiModel: string;
  summary: string;
}

interface UseRealTimeAnalysisState {
  // Documents
  uploadedDocuments: DocumentUpload[];
  tzDocument: DocumentUpload | null;
  
  // Analysis
  currentSession: AnalysisSession | null;
  analysisResult: ComprehensiveAnalysisResult | null;
  
  // Progress
  isAnalyzing: boolean;
  progress: ProgressUpdate;
  
  // History
  analysisHistory: AnalysisHistory[];
  
  // UI State
  error: string | null;
  isLoading: boolean;
}

interface UseRealTimeAnalysisActions {
  // Document management
  uploadDocument: (file: File, type: 'kp' | 'tz') => Promise<void>;
  removeDocument: (documentId: string) => void;
  clearDocuments: () => void;
  
  // Analysis control
  startAnalysis: (options?: {
    aiModel?: 'claude-3-5-sonnet' | 'claude-3-opus' | 'gpt-4o' | 'gpt-4-turbo';
    detailLevel?: 'standard' | 'comprehensive' | 'executive';
    includeFinancialAnalysis?: boolean;
    includeTechnicalDeepDive?: boolean;
    includeRiskAssessment?: boolean;
  }) => Promise<void>;
  cancelAnalysis: () => void;
  retryAnalysis: () => void;
  
  // Results management
  getAnalysisResults: () => Promise<ComprehensiveAnalysisResult | null>;
  clearResults: () => void;
  saveToHistory: (name?: string) => void;
  loadFromHistory: (historyId: string) => Promise<void>;
  
  // Error handling
  clearError: () => void;
}

export const useRealTimeAnalysis = (): [UseRealTimeAnalysisState, UseRealTimeAnalysisActions] => {
  const [state, setState] = useState<UseRealTimeAnalysisState>({
    uploadedDocuments: [],
    tzDocument: null,
    currentSession: null,
    analysisResult: null,
    isAnalyzing: false,
    progress: {
      stage: 'upload',
      progress: 0,
      message: 'Готов к загрузке документов',
      timeElapsed: 0
    },
    analysisHistory: [],
    error: null,
    isLoading: false
  });

  const lastAnalysisRequestRef = useRef<AnalysisRequest | null>(null);
  const progressCallbackRef = useRef<((progress: ProgressUpdate) => void) | null>(null);
  const startTimeRef = useRef<number>(0);

  // Load analysis history on mount
  useEffect(() => {
    loadAnalysisHistory();
  }, []);

  // Set up progress callback
  progressCallbackRef.current = useCallback((progress: ProgressUpdate) => {
    setState(prev => ({
      ...prev,
      progress
    }));
  }, []);

  const loadAnalysisHistory = () => {
    try {
      const stored = localStorage.getItem('kp_analyzer_v2_history');
      if (stored) {
        const history: AnalysisHistory[] = JSON.parse(stored);
        setState(prev => ({ ...prev, analysisHistory: history }));
      }
    } catch (error) {
      console.error('Failed to load analysis history:', error);
    }
  };

  const saveAnalysisHistory = (history: AnalysisHistory[]) => {
    try {
      localStorage.setItem('kp_analyzer_v2_history', JSON.stringify(history));
      setState(prev => ({ ...prev, analysisHistory: history }));
    } catch (error) {
      console.error('Failed to save analysis history:', error);
    }
  };

  // Document management actions
  const uploadDocument = useCallback(async (file: File, type: 'kp' | 'tz') => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      // Создаем базовую запись документа
      const processingDocument: DocumentUpload = {
        id: `${file.name}_${Date.now()}`,
        file,
        name: file.name,
        size: file.size,
        type: file.type,
        uploadProgress: 50,
        extractionProgress: 0,
        status: 'processing'
      };

      // Обновляем состояние с документом в процессе обработки
      setState(prev => {
        if (type === 'tz') {
          return { ...prev, tzDocument: processingDocument };
        } else {
          return { 
            ...prev, 
            uploadedDocuments: [...prev.uploadedDocuments, processingDocument]
          };
        }
      });

      // Реальное извлечение текста из файла
      console.log(`🔄 Извлечение текста из файла: ${file.name}`);
      const extractionResult = await realKpAnalysisService.extractTextFromPDF(file);
      
      // Финальная обработка документа
      const processedDocument: DocumentUpload = {
        ...processingDocument,
        uploadProgress: 100,
        extractionProgress: 100,
        status: 'ready',
        extractedText: extractionResult.text
      };

      setState(prev => {
        if (type === 'tz') {
          return {
            ...prev,
            tzDocument: processedDocument,
            isLoading: false
          };
        } else {
          return {
            ...prev,
            uploadedDocuments: prev.uploadedDocuments.map(doc => 
              doc.id === processingDocument.id ? processedDocument : doc
            ),
            isLoading: false
          };
        }
      });

      console.log(`✅ Текст успешно извлечен из ${file.name}: ${extractionResult.text.length} символов`);

    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Ошибка загрузки файла',
        isLoading: false
      }));
    }
  }, []);

  const removeDocument = useCallback((documentId: string) => {
    setState(prev => ({
      ...prev,
      uploadedDocuments: prev.uploadedDocuments.filter(doc => doc.id !== documentId),
      tzDocument: prev.tzDocument?.id === documentId ? null : prev.tzDocument
    }));
  }, []);

  const clearDocuments = useCallback(() => {
    setState(prev => ({
      ...prev,
      uploadedDocuments: [],
      tzDocument: null,
      analysisResult: null,
      currentSession: null,
      error: null
    }));
  }, []);

  // Analysis control actions
  const startAnalysis = useCallback(async (options = {}) => {
    const { uploadedDocuments, tzDocument } = state;
    
    if (uploadedDocuments.length === 0) {
      setState(prev => ({ ...prev, error: 'Загрузите хотя бы одно коммерческое предложение' }));
      return;
    }

    startTimeRef.current = Date.now();
    setState(prev => ({ 
      ...prev, 
      isAnalyzing: true, 
      error: null,
      progress: {
        stage: 'upload',
        progress: 0,
        message: 'Подготовка к анализу...',
        timeElapsed: 0
      }
    }));

    try {
      // Process the first document
      const primaryDocument = uploadedDocuments[0];
      
      if (!primaryDocument.extractedText) {
        throw new Error('Текст документа не был извлечен');
      }

      // Create analysis request
      const analysisRequest: AnalysisRequest = {
        documentId: primaryDocument.id,
        tzContent: tzDocument?.extractedText,
        analysisOptions: {
          aiModel: (options as any).aiModel || 'claude-3-5-sonnet',
          detailLevel: (options as any).detailLevel || 'comprehensive',
          includeFinancialAnalysis: (options as any).includeFinancialAnalysis !== false,
          includeTechnicalDeepDive: (options as any).includeTechnicalDeepDive !== false,
          includeRiskAssessment: (options as any).includeRiskAssessment !== false
        }
      };

      lastAnalysisRequestRef.current = analysisRequest;

      // Use the real analysis service
      console.log('Starting real-time analysis...');
      const result = await realKpAnalysisService.analyzeDocument(
        primaryDocument.extractedText,
        tzDocument?.extractedText,
        (progress) => {
          const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
          setState(prev => ({
            ...prev,
            progress: {
              ...progress,
              timeElapsed: elapsed
            }
          }));
        }
      );

      const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
      setState(prev => ({
        ...prev,
        analysisResult: {
          ...result,
          processingDuration: elapsed,
          aiModel: (analysisRequest.analysisOptions as any).aiModel || 'claude-3-5-sonnet'
        },
        isAnalyzing: false,
        progress: {
          stage: 'complete',
          progress: 100,
          message: 'Анализ завершен успешно!',
          timeElapsed: elapsed
        }
      }));

    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Ошибка анализа',
        isAnalyzing: false
      }));
    }
  }, [state.uploadedDocuments, state.tzDocument]);

  const cancelAnalysis = useCallback(() => {
    if (state.currentSession) {
      // In a real implementation, cancel the session
      console.log('Cancelling analysis session:', state.currentSession.id);
    }

    setState(prev => ({
      ...prev,
      isAnalyzing: false,
      currentSession: null,
      progress: {
        stage: 'upload',
        progress: 0,
        message: 'Анализ отменен',
        timeElapsed: prev.progress.timeElapsed
      }
    }));
  }, [state.currentSession]);

  const retryAnalysis = useCallback(async () => {
    if (lastAnalysisRequestRef.current) {
      await startAnalysis(lastAnalysisRequestRef.current.analysisOptions as any);
    }
  }, [startAnalysis]);

  // Results management actions
  const getAnalysisResults = useCallback(async (): Promise<ComprehensiveAnalysisResult | null> => {
    return state.analysisResult;
  }, [state.analysisResult]);

  const clearResults = useCallback(() => {
    setState(prev => ({
      ...prev,
      analysisResult: null,
      currentSession: null,
      progress: {
        stage: 'upload',
        progress: 0,
        message: 'Готов к новому анализу',
        timeElapsed: 0
      }
    }));
  }, []);

  const saveToHistory = useCallback((name?: string) => {
    if (!state.analysisResult) return;

    const historyItem: AnalysisHistory = {
      id: `history_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: name || `Анализ ${new Date().toLocaleDateString()}`,
      documentName: state.analysisResult.documentName,
      companyName: state.analysisResult.companyName,
      overallScore: state.analysisResult.overallScore,
      createdAt: new Date().toISOString(),
      aiModel: state.analysisResult.aiModel,
      summary: state.analysisResult.executiveSummary.recommendation
    };

    const newHistory = [historyItem, ...state.analysisHistory].slice(0, 50); // Keep last 50
    saveAnalysisHistory(newHistory);
  }, [state.analysisResult, state.analysisHistory]);

  const loadFromHistory = useCallback(async (historyId: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      // In a real implementation, we'd load the full analysis result from storage
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Функция загрузки из истории будет добавлена в следующей версии'
      }));
      
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Ошибка загрузки из истории',
        isLoading: false
      }));
    }
  }, []);

  // Error handling
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // Check for session completion
  useEffect(() => {
    if (state.currentSession && state.currentSession.status === 'completed' && state.currentSession.result) {
      setState(prev => ({
        ...prev,
        analysisResult: state.currentSession!.result!,
        isAnalyzing: false
      }));
    }
  }, [state.currentSession]);

  const actions: UseRealTimeAnalysisActions = {
    uploadDocument,
    removeDocument,
    clearDocuments,
    startAnalysis,
    cancelAnalysis,
    retryAnalysis,
    getAnalysisResults,
    clearResults,
    saveToHistory,
    loadFromHistory,
    clearError
  };

  return [state, actions];
};