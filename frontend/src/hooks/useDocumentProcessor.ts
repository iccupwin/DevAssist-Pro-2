import { useState, useCallback } from 'react';
import { 
  documentProcessor, 
  DocumentProcessingResult, 
  DocumentProcessingOptions,
  DocumentProcessingProgress 
} from '../services/documentProcessor';

interface UseDocumentProcessorState {
  processing: boolean;
  results: Map<string, DocumentProcessingResult>;
  progress: Map<string, DocumentProcessingProgress>;
  errors: Map<string, string>;
}

interface UseDocumentProcessorOptions {
  onProgress?: (fileId: string, progress: DocumentProcessingProgress) => void;
  onComplete?: (fileId: string, result: DocumentProcessingResult) => void;
  onError?: (fileId: string, error: string) => void;
  defaultOptions?: Partial<DocumentProcessingOptions>;
}

export const useDocumentProcessor = (options: UseDocumentProcessorOptions = {}) => {
  const [state, setState] = useState<UseDocumentProcessorState>({
    processing: false,
    results: new Map(),
    progress: new Map(),
    errors: new Map()
  });

  // Обработка одного документа
  const processDocument = useCallback(async (
    file: File,
    processingOptions?: Partial<DocumentProcessingOptions>
  ): Promise<DocumentProcessingResult> => {
    const fileId = `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    setState(prev => ({
      ...prev,
      processing: true,
      errors: new Map(prev.errors).set(fileId, '')
    }));

    try {
      // Валидация файла
      const validation = await documentProcessor.validateDocument(file);
      if (!validation.isValid) {
        throw new Error(validation.error || 'Невалидный документ');
      }

      // Объединение опций
      const finalOptions = {
        ...documentProcessor.getRecommendedOptions(file),
        ...options.defaultOptions,
        ...processingOptions
      };

      // Обработка с отслеживанием прогресса
      const result = await documentProcessor.processDocument(
        file,
        finalOptions,
        (progress) => {
          setState(prev => ({
            ...prev,
            progress: new Map(prev.progress).set(fileId, progress)
          }));
          
          if (options.onProgress) {
            options.onProgress(fileId, progress);
          }
        }
      );

      // Обновление результатов
      setState(prev => ({
        ...prev,
        processing: false,
        results: new Map(prev.results).set(fileId, result)
      }));

      if (options.onComplete) {
        options.onComplete(fileId, result);
      }

      return result;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
      
      setState(prev => ({
        ...prev,
        processing: false,
        errors: new Map(prev.errors).set(fileId, errorMessage)
      }));

      if (options.onError) {
        options.onError(fileId, errorMessage);
      }

      throw error;
    }
  }, [options.defaultOptions, options.onProgress, options.onComplete, options.onError]);

  // Обработка множественных документов
  const processMultipleDocuments = useCallback(async (
    files: File[],
    processingOptions?: Partial<DocumentProcessingOptions>
  ): Promise<DocumentProcessingResult[]> => {
    const results: DocumentProcessingResult[] = [];
    
    setState(prev => ({ ...prev, processing: true }));

    try {
      // Обрабатываем файлы последовательно для контроля нагрузки
      for (const file of files) {
        try {
          const result = await processDocument(file, processingOptions);
          results.push(result);
        } catch (error) {
          console.error(`Ошибка обработки файла ${file.name}:`, error);
          // Продолжаем обработку остальных файлов
          results.push({
            success: false,
            fileId: `error_${Date.now()}`,
            originalFile: file,
            error: error instanceof Error ? error.message : 'Ошибка обработки'
          });
        }
      }

      return results;
    } finally {
      setState(prev => ({ ...prev, processing: false }));
    }
  }, [processDocument]);

  // Получение результата по ID
  const getResult = useCallback((fileId: string): DocumentProcessingResult | undefined => {
    return state.results.get(fileId);
  }, [state.results]);

  // Получение прогресса по ID
  const getProgress = useCallback((fileId: string): DocumentProcessingProgress | undefined => {
    return state.progress.get(fileId);
  }, [state.progress]);

  // Получение ошибки по ID
  const getError = useCallback((fileId: string): string | undefined => {
    return state.errors.get(fileId);
  }, [state.errors]);

  // Очистка результатов
  const clearResults = useCallback(() => {
    setState({
      processing: false,
      results: new Map(),
      progress: new Map(),
      errors: new Map()
    });
  }, []);

  // Удаление конкретного результата
  const removeResult = useCallback((fileId: string) => {
    setState(prev => {
      const newResults = new Map(prev.results);
      const newProgress = new Map(prev.progress);
      const newErrors = new Map(prev.errors);
      
      newResults.delete(fileId);
      newProgress.delete(fileId);
      newErrors.delete(fileId);
      
      return {
        ...prev,
        results: newResults,
        progress: newProgress,
        errors: newErrors
      };
    });
  }, []);

  // Валидация файла
  const validateDocument = useCallback(async (file: File) => {
    return await documentProcessor.validateDocument(file);
  }, []);

  // Получение поддерживаемых форматов
  const getSupportedFormats = useCallback(() => {
    return documentProcessor.getSupportedFormats();
  }, []);

  // Получение рекомендуемых настроек
  const getRecommendedOptions = useCallback((file: File) => {
    return documentProcessor.getRecommendedOptions(file);
  }, []);

  // Вычисляемые значения
  const allResults = Array.from(state.results.values());
  const allProgress = Array.from(state.progress.values());
  const allErrors = Array.from(state.errors.values()).filter(error => error.length > 0);
  
  const successfulResults = allResults.filter(result => result.success);
  const failedResults = allResults.filter(result => !result.success);
  
  const totalProgress = allProgress.length > 0
    ? allProgress.reduce((sum, progress) => sum + progress.progress, 0) / allProgress.length
    : 0;

  const isComplete = !state.processing && allProgress.length > 0 && 
    allProgress.every(progress => progress.stage === 'completed' || progress.stage === 'failed');

  return {
    // State
    processing: state.processing,
    results: state.results,
    progress: state.progress,
    errors: state.errors,

    // Computed values
    allResults,
    successfulResults,
    failedResults,
    totalProgress,
    isComplete,
    hasErrors: allErrors.length > 0,

    // Actions
    processDocument,
    processMultipleDocuments,
    validateDocument,
    clearResults,
    removeResult,

    // Utilities
    getResult,
    getProgress,
    getError,
    getSupportedFormats,
    getRecommendedOptions
  };
};

// Специализированный хук для PDF обработки
export const usePDFProcessor = (options: UseDocumentProcessorOptions = {}) => {
  const defaultPDFOptions: Partial<DocumentProcessingOptions> = {
    extractText: true,
    extractImages: true,
    extractTables: true,
    extractAnnotations: true,
    generatePreview: true,
    enableOCR: false,
    quality: 'high'
  };

  return useDocumentProcessor({
    ...options,
    defaultOptions: { ...defaultPDFOptions, ...options.defaultOptions }
  });
};

// Хук для быстрой текстовой экстракции
export const useTextExtractor = (options: UseDocumentProcessorOptions = {}) => {
  const defaultTextOptions: Partial<DocumentProcessingOptions> = {
    extractText: true,
    extractImages: false,
    extractTables: false,
    extractAnnotations: false,
    generatePreview: false,
    enableOCR: false,
    quality: 'fast'
  };

  return useDocumentProcessor({
    ...options,
    defaultOptions: { ...defaultTextOptions, ...options.defaultOptions }
  });
};

export default useDocumentProcessor;