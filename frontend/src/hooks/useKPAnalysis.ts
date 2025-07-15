/**
 * useKPAnalysis Hook - React hook for KP analysis functionality
 */

import { useState, useCallback } from 'react';
import { 
  kpAnalysisService, 
  AnalysisResult, 
  AnalysisProgress, 
  ModelId 
} from '../services/ai';

interface UseKPAnalysisOptions {
  modelId?: ModelId;
  onProgress?: (progress: AnalysisProgress) => void;
  onComplete?: (results: AnalysisResult[]) => void;
  onError?: (error: Error) => void;
}

export const useKPAnalysis = (options: UseKPAnalysisOptions = {}) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState<AnalysisResult[]>([]);
  const [progress, setProgress] = useState<AnalysisProgress>({
    currentKP: '',
    progress: 0,
    totalKPs: 0,
    completedKPs: 0,
    isAnalyzing: false
  });
  const [error, setError] = useState<string | null>(null);

  const analyzeKPs = useCallback(async (
    tzText: string,
    kpFiles: { text: string; fileName: string }[]
  ) => {
    setIsAnalyzing(true);
    setError(null);
    setResults([]);
    
    try {
      const progressCallback = (progressData: AnalysisProgress) => {
        setProgress(progressData);
        options.onProgress?.(progressData);
      };

      const analysisResults = await kpAnalysisService.analyzeAllKPs(
        tzText,
        kpFiles,
        progressCallback,
        options.modelId
      );

      setResults(analysisResults);
      options.onComplete?.(analysisResults);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      options.onError?.(err instanceof Error ? err : new Error(errorMessage));
    } finally {
      setIsAnalyzing(false);
      setProgress((prev: AnalysisProgress) => ({ ...prev, isAnalyzing: false }));
    }
  }, [options]);

  const analyzeSingleKP = useCallback(async (
    tzText: string,
    kpText: string,
    kpFileName: string
  ) => {
    setIsAnalyzing(true);
    setError(null);
    
    try {
      const progressCallback = (progressPercent: number) => {
        setProgress({
          currentKP: kpFileName,
          progress: progressPercent,
          totalKPs: 1,
          completedKPs: progressPercent === 100 ? 1 : 0,
          isAnalyzing: progressPercent < 100
        });
        
        options.onProgress?.({
          currentKP: kpFileName,
          progress: progressPercent,
          totalKPs: 1,
          completedKPs: progressPercent === 100 ? 1 : 0,
          isAnalyzing: progressPercent < 100
        });
      };

      const result = await kpAnalysisService.analyzeKP(
        tzText,
        kpText,
        kpFileName,
        progressCallback,
        options.modelId
      );

      setResults([result]);
      options.onComplete?.([result]);
      
      return result;
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      options.onError?.(err instanceof Error ? err : new Error(errorMessage));
      throw err;
    } finally {
      setIsAnalyzing(false);
      setProgress((prev: AnalysisProgress) => ({ ...prev, isAnalyzing: false }));
    }
  }, [options]);

  const reset = useCallback(() => {
    setIsAnalyzing(false);
    setResults([]);
    setProgress({
      currentKP: '',
      progress: 0,
      totalKPs: 0,
      completedKPs: 0,
      isAnalyzing: false
    });
    setError(null);
  }, []);

  return {
    isAnalyzing,
    results,
    progress,
    error,
    analyzeKPs,
    analyzeSingleKP,
    reset
  };
};