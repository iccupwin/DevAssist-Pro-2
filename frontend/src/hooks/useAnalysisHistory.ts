/**
 * Хук для управления историей анализов КП
 */

import { useState, useEffect, useCallback } from 'react';
import { KPAnalysisResult, ComparisonResult } from '../types/kpAnalyzer';

export interface AnalysisHistoryItem {
  id: string;
  name: string;
  date: string;
  tzName: string;
  kpCount: number;
  avgScore: number;
  status: 'completed' | 'in-progress' | 'failed';
  results: KPAnalysisResult[];
  comparisonResult: ComparisonResult | null;
  technicalSpec: {
    name: string;
    title: string;
    content: string;
  } | null;
  commercialProposals: Array<{
    name: string;
    title: string;
    content: string;
  }>;
  selectedModels: {
    analysis: string;
    comparison: string;
  };
}

const STORAGE_KEY = 'kp-analyzer-history';

export const useAnalysisHistory = () => {
  const [history, setHistory] = useState<AnalysisHistoryItem[]>([]);
  const [currentAnalysisId, setCurrentAnalysisId] = useState<string | null>(null);

  // Загрузка истории из localStorage при инициализации
  useEffect(() => {
    try {
      const savedHistory = localStorage.getItem(STORAGE_KEY);
      if (savedHistory) {
        const parsedHistory = JSON.parse(savedHistory);
        setHistory(parsedHistory);
      }
    } catch (error) {
      // Error loading analysis history
    }
  }, []);

  // Сохранение истории в localStorage
  const saveHistory = useCallback((newHistory: AnalysisHistoryItem[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newHistory));
      setHistory(newHistory);
    } catch (error) {
      // Error saving analysis history
    }
  }, []);

  // Добавление нового анализа в историю
  const addToHistory = useCallback((
    results: KPAnalysisResult[],
    comparisonResult: ComparisonResult | null,
    technicalSpec: {
      name: string;
      title: string;
      content: string;
    } | null,
    commercialProposals: Array<{
      name: string;
      title: string;
      content: string;
    }>,
    selectedModels: { analysis: string; comparison: string },
    name?: string
  ) => {
    const avgScore = results.length > 0 
      ? Math.round(results.reduce((acc, r) => acc + (r.complianceScore || 0), 0) / results.length)
      : 0;

    const analysisId = `analysis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const newItem: AnalysisHistoryItem = {
      id: analysisId,
      name: name || `Анализ ${new Date().toLocaleDateString('ru-RU')}`,
      date: new Date().toISOString(),
      tzName: technicalSpec?.title || technicalSpec?.name || 'Техническое задание',
      kpCount: results.length,
      avgScore,
      status: 'completed',
      results,
      comparisonResult,
      technicalSpec: technicalSpec ? {
        name: technicalSpec.name,
        title: technicalSpec.title,
        content: technicalSpec.content
      } : null,
      commercialProposals: commercialProposals.map(cp => ({
        name: cp.name,
        title: cp.title,
        content: cp.content
      })),
      selectedModels
    };

    const newHistory = [newItem, ...history].slice(0, 50); // Ограничиваем историю 50 элементами
    saveHistory(newHistory);
    setCurrentAnalysisId(analysisId);
    
    // Analysis added to history

    return analysisId;
  }, [history, saveHistory]);

  // Загрузка анализа из истории
  const loadFromHistory = useCallback((historyItem: AnalysisHistoryItem) => {
    setCurrentAnalysisId(historyItem.id);
    
    // Analysis loaded from history

    return {
      results: historyItem.results,
      comparisonResult: historyItem.comparisonResult,
      technicalSpec: historyItem.technicalSpec,
      commercialProposals: historyItem.commercialProposals,
      selectedModels: historyItem.selectedModels
    };
  }, []);

  // Удаление анализа из истории
  const deleteFromHistory = useCallback((id: string) => {
    const newHistory = history.filter(item => item.id !== id);
    saveHistory(newHistory);
    
    if (currentAnalysisId === id) {
      setCurrentAnalysisId(null);
    }
    
    // Analysis deleted from history
  }, [history, saveHistory, currentAnalysisId]);

  // Обновление статуса анализа
  const updateAnalysisStatus = useCallback((id: string, status: 'completed' | 'in-progress' | 'failed') => {
    const newHistory = history.map(item => 
      item.id === id ? { ...item, status } : item
    );
    saveHistory(newHistory);
  }, [history, saveHistory]);

  // Очистка всей истории
  const clearHistory = useCallback(() => {
    saveHistory([]);
    setCurrentAnalysisId(null);
    // Analysis history cleared
  }, [saveHistory]);

  // Получение текущего анализа
  const getCurrentAnalysis = useCallback(() => {
    if (!currentAnalysisId) return null;
    return history.find(item => item.id === currentAnalysisId) || null;
  }, [currentAnalysisId, history]);

  return {
    history,
    currentAnalysisId,
    addToHistory,
    loadFromHistory,
    deleteFromHistory,
    updateAnalysisStatus,
    clearHistory,
    getCurrentAnalysis,
    setCurrentAnalysisId
  };
};