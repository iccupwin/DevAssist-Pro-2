/**
 * Hook для управления сохранением и загрузкой результатов анализа
 */

import { useState, useCallback } from 'react';
import { analysisStorage, StoredAnalysis, StoredProject } from '../services/storage/analysisStorage';
import { AnalysisResult, ComparisonResult, Document } from '../types/kpAnalyzer';

interface UseAnalysisStorageReturn {
  // Состояние
  saving: boolean;
  loading: boolean;
  error: string | null;
  lastSavedId: string | null;

  // Методы для анализов
  saveAnalysisResults: (
    documents: Document[],
    results: AnalysisResult[],
    comparison: ComparisonResult,
    projectId?: string,
    projectName?: string
  ) => Promise<string>;
  
  getAnalysisHistory: () => Promise<StoredAnalysis[]>;
  getAnalysisById: (id: string) => Promise<StoredAnalysis | null>;
  
  // Методы для проектов
  createProject: (project: Omit<StoredProject, 'id' | 'createdAt' | 'analysesCount' | 'syncStatus'>) => Promise<string>;
  getProjects: () => Promise<StoredProject[]>;
  
  // Синхронизация
  syncData: () => Promise<{ success: number; failed: number }>;
  
  // Утилиты
  clearError: () => void;
}

export const useAnalysisStorage = (): UseAnalysisStorageReturn => {
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSavedId, setLastSavedId] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const saveAnalysisResults = useCallback(async (
    documents: Document[],
    results: AnalysisResult[],
    comparison: ComparisonResult,
    projectId?: string,
    projectName?: string
  ) => {
    setSaving(true);
    setError(null);

    try {
      // Добавляем метаданные для сохранения
      const enrichedComparison = {
        ...comparison,
        savedAt: new Date().toISOString(),
        documentsCount: documents.length,
        analysisType: 'kp_analysis'
      };

      const analysisId = await analysisStorage.saveAnalysisResults(
        documents,
        results,
        enrichedComparison,
        projectId,
        projectName
      );

      setLastSavedId(analysisId);
      
      // Показываем уведомление об успешном сохранении
      if (window.dispatchEvent) {
        window.dispatchEvent(new CustomEvent('analysisStorage:saved', {
          detail: { analysisId, projectName, documentsCount: documents.length }
        }));
      }

      return analysisId;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Ошибка сохранения анализа';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setSaving(false);
    }
  }, []);

  const getAnalysisHistory = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const history = await analysisStorage.getAnalysisHistory(50);
      return history;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Ошибка загрузки истории';
      setError(errorMessage);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const getAnalysisById = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);

    try {
      const analysis = await analysisStorage.getAnalysisById(id);
      return analysis;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Ошибка загрузки анализа';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const createProject = useCallback(async (project: Omit<StoredProject, 'id' | 'createdAt' | 'analysesCount' | 'syncStatus'>) => {
    setSaving(true);
    setError(null);

    try {
      const projectId = await analysisStorage.saveProject(project);
      
      // Уведомляем о создании проекта
      if (window.dispatchEvent) {
        window.dispatchEvent(new CustomEvent('analysisStorage:projectCreated', {
          detail: { projectId, projectName: project.name }
        }));
      }

      return projectId;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Ошибка создания проекта';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setSaving(false);
    }
  }, []);

  const getProjects = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const projects = await analysisStorage.getProjects();
      return projects;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Ошибка загрузки проектов';
      setError(errorMessage);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const syncData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await analysisStorage.syncPendingData();
      
      // Уведомляем о результатах синхронизации
      if (window.dispatchEvent) {
        window.dispatchEvent(new CustomEvent('analysisStorage:synced', {
          detail: result
        }));
      }

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Ошибка синхронизации';
      setError(errorMessage);
      return { success: 0, failed: 0 };
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    // Состояние
    saving,
    loading,
    error,
    lastSavedId,

    // Методы для анализов
    saveAnalysisResults,
    getAnalysisHistory,
    getAnalysisById,

    // Методы для проектов
    createProject,
    getProjects,

    // Синхронизация
    syncData,

    // Утилиты
    clearError
  };
};