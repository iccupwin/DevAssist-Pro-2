/**
 * useAIService - React hook для работы с AI сервисом
 * Согласно ТЗ DevAssist Pro
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { AIService, TaskRequest, TaskResponse, AIServiceConfig } from '../services/ai/aiService';
import { AIProvider, AIModel } from '../types/aiConfig';
import { AIClientError } from '../services/ai/aiClient';

interface UseAIServiceReturn {
  // State
  isLoading: boolean;
  error: string | null;
  availableModels: AIModel[];
  providerStatus: Map<AIProvider, boolean>;
  currentTask: string | null;
  
  // Methods
  executeTask: (request: TaskRequest) => Promise<TaskResponse>;
  executeTaskStream: (request: TaskRequest) => AsyncGenerator<any, void, unknown>;
  analyzeKP: (kpContent: string, tzContent: string, criteria?: string[]) => Promise<TaskResponse>;
  compareKPs: (kps: Array<{ id: string; content: string; title: string }>, tzContent: string) => Promise<TaskResponse>;
  generateReport: (analysisResults: any[], options?: any) => Promise<TaskResponse>;
  
  // Status methods
  checkProviderStatus: () => Promise<void>;
  getUsageStatistics: (provider?: AIProvider) => any;
  getTotalCost: (provider?: AIProvider) => number;
  
  // Control methods
  cancelCurrentTask: () => void;
  retryLastTask: () => Promise<TaskResponse | null>;
}

export const useAIService = (config?: AIServiceConfig): UseAIServiceReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availableModels, setAvailableModels] = useState<AIModel[]>([]);
  const [providerStatus, setProviderStatus] = useState<Map<AIProvider, boolean>>(new Map());
  const [currentTask, setCurrentTask] = useState<string | null>(null);
  
  const aiServiceRef = useRef<AIService | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const lastTaskRef = useRef<TaskRequest | null>(null);

  // Инициализация AI сервиса
  useEffect(() => {
    if (config && !aiServiceRef.current) {
      try {
        aiServiceRef.current = new AIService(config);
        aiServiceRef.current.loadAIConfig();
        
        // Загружаем доступные модели и проверяем статус провайдеров
        loadAvailableModels();
        checkProviderStatus();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to initialize AI service');
      }
    }
  }, [config]);

  // Загрузка доступных моделей
  const loadAvailableModels = useCallback(async () => {
    if (!aiServiceRef.current) return;

    try {
      setIsLoading(true);
      const models = await aiServiceRef.current.getAvailableModels();
      setAvailableModels(models);
    } catch (err) {
      console.warn('Failed to load available models:', err);
      setAvailableModels([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Проверка статуса провайдеров
  const checkProviderStatus = useCallback(async () => {
    if (!aiServiceRef.current) return;

    try {
      const status = await aiServiceRef.current.checkProviderAvailability();
      setProviderStatus(new Map(status));
    } catch (err) {
      console.warn('Failed to check provider status:', err);
      setProviderStatus(new Map());
    }
  }, []);

  // Выполнение задачи
  const executeTask = useCallback(async (request: TaskRequest): Promise<TaskResponse> => {
    if (!aiServiceRef.current) {
      throw new Error('AI service not initialized');
    }

    setIsLoading(true);
    setError(null);
    setCurrentTask(request.taskType);
    lastTaskRef.current = request;

    // Создаем AbortController для возможности отмены
    abortControllerRef.current = new AbortController();

    try {
      const response = await aiServiceRef.current.executeTask(request);
      return response;
    } catch (err) {
      const errorMessage = err instanceof AIClientError 
        ? `${err.type}: ${err.message}` 
        : err instanceof Error 
        ? err.message 
        : 'Unknown error occurred';
      
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
      setCurrentTask(null);
      abortControllerRef.current = null;
    }
  }, []);

  // Стриминг выполнение задачи
  const executeTaskStream = useCallback(async function* (request: TaskRequest) {
    if (!aiServiceRef.current) {
      throw new Error('AI service not initialized');
    }

    setIsLoading(true);
    setError(null);
    setCurrentTask(request.taskType);
    lastTaskRef.current = request;

    // Создаем AbortController для возможности отмены
    abortControllerRef.current = new AbortController();

    try {
      for await (const chunk of aiServiceRef.current.executeTaskStream(request)) {
        // Проверяем, не была ли задача отменена
        if (abortControllerRef.current?.signal.aborted) {
          throw new Error('Task was cancelled');
        }
        
        yield chunk;
        
        if (chunk.isComplete) {
          setIsLoading(false);
          setCurrentTask(null);
        }
      }
    } catch (err) {
      const errorMessage = err instanceof AIClientError 
        ? `${err.type}: ${err.message}` 
        : err instanceof Error 
        ? err.message 
        : 'Unknown error occurred';
      
      setError(errorMessage);
      setIsLoading(false);
      setCurrentTask(null);
      throw err;
    } finally {
      abortControllerRef.current = null;
    }
  }, []);

  // Анализ КП
  const analyzeKP = useCallback(async (
    kpContent: string, 
    tzContent: string, 
    criteria?: string[]
  ): Promise<TaskResponse> => {
    if (!aiServiceRef.current) {
      throw new Error('AI service not initialized');
    }

    return aiServiceRef.current.analyzeKP(kpContent, tzContent, criteria);
  }, []);

  // Сравнение КП
  const compareKPs = useCallback(async (
    kps: Array<{ id: string; content: string; title: string }>, 
    tzContent: string
  ): Promise<TaskResponse> => {
    if (!aiServiceRef.current) {
      throw new Error('AI service not initialized');
    }

    return aiServiceRef.current.compareKPs(kps, tzContent);
  }, []);

  // Генерация отчета
  const generateReport = useCallback(async (
    analysisResults: any[], 
    options?: any
  ): Promise<TaskResponse> => {
    if (!aiServiceRef.current) {
      throw new Error('AI service not initialized');
    }

    return aiServiceRef.current.generateReport(analysisResults, options);
  }, []);

  // Получение статистики использования
  const getUsageStatistics = useCallback((provider?: AIProvider) => {
    if (!aiServiceRef.current) return {};
    return aiServiceRef.current.getUsageStatistics(provider);
  }, []);

  // Получение общей стоимости
  const getTotalCost = useCallback((provider?: AIProvider): number => {
    if (!aiServiceRef.current) return 0;
    return aiServiceRef.current.getTotalCost(provider);
  }, []);

  // Отмена текущей задачи
  const cancelCurrentTask = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsLoading(false);
      setCurrentTask(null);
      setError('Task was cancelled');
    }
  }, []);

  // Повтор последней задачи
  const retryLastTask = useCallback(async (): Promise<TaskResponse | null> => {
    if (!lastTaskRef.current) {
      setError('No task to retry');
      return null;
    }

    try {
      setError(null);
      return await executeTask(lastTaskRef.current);
    } catch (err) {
      // Ошибка уже обработана в executeTask
      return null;
    }
  }, [executeTask]);

  return {
    // State
    isLoading,
    error,
    availableModels,
    providerStatus,
    currentTask,
    
    // Methods
    executeTask,
    executeTaskStream,
    analyzeKP,
    compareKPs,
    generateReport,
    
    // Status methods
    checkProviderStatus,
    getUsageStatistics,
    getTotalCost,
    
    // Control methods
    cancelCurrentTask,
    retryLastTask
  };
};

// Hook для специфических задач КП Анализатора
export const useKPAnalyzer = (config?: AIServiceConfig) => {
  const aiService = useAIService(config);
  
  const [analysisHistory, setAnalysisHistory] = useState<TaskResponse[]>([]);
  const [comparisonResults, setComparisonResults] = useState<TaskResponse | null>(null);

  // Анализ одного КП с сохранением в историю
  const analyzeKPWithHistory = useCallback(async (
    kpContent: string,
    tzContent: string,
    criteria?: string[]
  ): Promise<TaskResponse> => {
    try {
      const result = await aiService.analyzeKP(kpContent, tzContent, criteria);
      setAnalysisHistory(prev => [result, ...prev.slice(0, 9)]); // Сохраняем последние 10
      return result;
    } catch (error) {
      throw error;
    }
  }, [aiService]);

  // Сравнение КП с сохранением результатов
  const compareKPsWithResults = useCallback(async (
    kps: Array<{ id: string; content: string; title: string }>,
    tzContent: string
  ): Promise<TaskResponse> => {
    try {
      const result = await aiService.compareKPs(kps, tzContent);
      setComparisonResults(result);
      return result;
    } catch (error) {
      throw error;
    }
  }, [aiService]);

  // Очистка истории
  const clearAnalysisHistory = useCallback(() => {
    setAnalysisHistory([]);
  }, []);

  // Очистка результатов сравнения
  const clearComparisonResults = useCallback(() => {
    setComparisonResults(null);
  }, []);

  return {
    ...aiService,
    
    // KP-specific state
    analysisHistory,
    comparisonResults,
    
    // KP-specific methods
    analyzeKPWithHistory,
    compareKPsWithResults,
    clearAnalysisHistory,
    clearComparisonResults
  };
};

export default useAIService;