/**
 * Система сохранения и синхронизации результатов анализа
 * Комбинирует локальное хранение (localStorage + IndexedDB) с серверным
 */

import { AnalysisResult, ComparisonResult, Document, Project } from '../../types/kpAnalyzer';

interface StoredAnalysis {
  id: string;
  timestamp: string;
  documents: Document[];
  results: AnalysisResult[];
  comparison: ComparisonResult;
  projectId?: string;
  projectName?: string;
  syncStatus: 'local' | 'synced' | 'sync_pending' | 'sync_failed';
  lastSyncAttempt?: string;
}

interface StoredProject {
  id: string;
  name: string;
  description?: string;
  projectType: string;
  status: string;
  createdAt: string;
  analysesCount: number;
  syncStatus: 'local' | 'synced' | 'sync_pending' | 'sync_failed';
}

class AnalysisStorageService {
  private dbName = 'devassist_analyses';
  private dbVersion = 1;
  private db: IDBDatabase | null = null;

  constructor() {
    this.initIndexedDB();
  }

  /**
   * Инициализация IndexedDB для больших объемов данных
   */
  private async initIndexedDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Хранилище для анализов
        if (!db.objectStoreNames.contains('analyses')) {
          const analysesStore = db.createObjectStore('analyses', { keyPath: 'id' });
          analysesStore.createIndex('timestamp', 'timestamp', { unique: false });
          analysesStore.createIndex('projectId', 'projectId', { unique: false });
          analysesStore.createIndex('syncStatus', 'syncStatus', { unique: false });
        }

        // Хранилище для проектов
        if (!db.objectStoreNames.contains('projects')) {
          const projectsStore = db.createObjectStore('projects', { keyPath: 'id' });
          projectsStore.createIndex('createdAt', 'createdAt', { unique: false });
          projectsStore.createIndex('syncStatus', 'syncStatus', { unique: false });
        }

        // Хранилище для файлов документов (для offline работы)
        if (!db.objectStoreNames.contains('documents')) {
          const documentsStore = db.createObjectStore('documents', { keyPath: 'id' });
          documentsStore.createIndex('analysisId', 'analysisId', { unique: false });
        }
      };
    });
  }

  /**
   * Сохранение результатов анализа (локально + попытка синхронизации)
   */
  async saveAnalysisResults(
    documents: Document[],
    results: AnalysisResult[],
    comparison: ComparisonResult,
    projectId?: string,
    projectName?: string
  ): Promise<string> {
    const analysisId = `analysis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const storedAnalysis: StoredAnalysis = {
      id: analysisId,
      timestamp: new Date().toISOString(),
      documents,
      results,
      comparison,
      projectId,
      projectName,
      syncStatus: 'local'
    };

    // 1. Сохраняем локально в IndexedDB
    await this.saveToIndexedDB('analyses', storedAnalysis);

    // 2. Сохраняем базовую информацию в localStorage для быстрого доступа
    this.saveToLocalStorage(`analysis_${analysisId}`, {
      id: analysisId,
      timestamp: storedAnalysis.timestamp,
      projectId,
      projectName,
      documentsCount: documents.length,
      overallScore: comparison.overallScore,
      syncStatus: 'local'
    });

    // 3. Пытаемся синхронизировать с сервером
    this.syncAnalysisWithServer(analysisId).catch(error => {
      console.warn('Failed to sync analysis to server:', error);
    });

    return analysisId;
  }

  /**
   * Получение истории анализов (комбинирует локальные и серверные данные)
   */
  async getAnalysisHistory(limit = 50): Promise<StoredAnalysis[]> {
    try {
      // 1. Получаем локальные данные
      const localAnalyses = await this.getFromIndexedDB('analyses', limit);

      // 2. Пытаемся получить серверные данные
      const serverAnalyses = await this.fetchServerAnalyses(limit);

      // 3. Объединяем и дедуплицируем
      const combined = this.mergeAnalysesData(localAnalyses, serverAnalyses);

      // 4. Сортируем по дате
      return combined.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
    } catch (error) {
      console.error('Error getting analysis history:', error);
      // Fallback к локальным данным
      return await this.getFromIndexedDB('analyses', limit);
    }
  }

  /**
   * Получение конкретного анализа по ID
   */
  async getAnalysisById(id: string): Promise<StoredAnalysis | null> {
    try {
      // Сначала пробуем локально
      const localAnalysis = await this.getFromIndexedDB('analyses', 1, id);
      if (localAnalysis.length > 0) {
        return localAnalysis[0];
      }

      // Если нет локально, пробуем сервер
      const serverAnalysis = await this.fetchServerAnalysis(id);
      if (serverAnalysis) {
        // Сохраняем локально для кеша
        await this.saveToIndexedDB('analyses', { ...serverAnalysis, syncStatus: 'synced' });
        return serverAnalysis;
      }

      return null;
    } catch (error) {
      console.error('Error getting analysis by ID:', error);
      return null;
    }
  }

  /**
   * Сохранение проекта
   */
  async saveProject(project: Omit<StoredProject, 'id' | 'createdAt' | 'analysesCount' | 'syncStatus'>): Promise<string> {
    const projectId = `project_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const storedProject: StoredProject = {
      id: projectId,
      ...project,
      createdAt: new Date().toISOString(),
      analysesCount: 0,
      syncStatus: 'local'
    };

    // Сохраняем локально
    await this.saveToIndexedDB('projects', storedProject);
    this.saveToLocalStorage(`project_${projectId}`, storedProject);

    // Синхронизируем с сервером
    this.syncProjectWithServer(projectId).catch(error => {
      console.warn('Failed to sync project to server:', error);
    });

    return projectId;
  }

  /**
   * Получение списка проектов
   */
  async getProjects(): Promise<StoredProject[]> {
    try {
      // Комбинируем локальные и серверные проекты
      const localProjects = await this.getFromIndexedDB('projects');
      const serverProjects = await this.fetchServerProjects();
      
      const combined = this.mergeProjectsData(localProjects, serverProjects);
      
      return combined.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    } catch (error) {
      console.error('Error getting projects:', error);
      return await this.getFromIndexedDB('projects');
    }
  }

  /**
   * Синхронизация всех несинхронизированных данных
   */
  async syncPendingData(): Promise<{ success: number; failed: number }> {
    let success = 0;
    let failed = 0;

    try {
      // Синхронизируем анализы
      const pendingAnalyses = await this.getFromIndexedDB('analyses', 100, null, { syncStatus: ['local', 'sync_failed'] });
      
      for (const analysis of pendingAnalyses) {
        try {
          await this.syncAnalysisWithServer(analysis.id);
          success++;
        } catch (error) {
          console.error(`Failed to sync analysis ${analysis.id}:`, error);
          failed++;
        }
      }

      // Синхронизируем проекты
      const pendingProjects = await this.getFromIndexedDB('projects', 100, null, { syncStatus: ['local', 'sync_failed'] });
      
      for (const project of pendingProjects) {
        try {
          await this.syncProjectWithServer(project.id);
          success++;
        } catch (error) {
          console.error(`Failed to sync project ${project.id}:`, error);
          failed++;
        }
      }

    } catch (error) {
      console.error('Error during data synchronization:', error);
    }

    return { success, failed };
  }

  /**
   * Очистка старых локальных данных
   */
  async cleanupOldData(daysOld = 30): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    try {
      const oldAnalyses = await this.getFromIndexedDB('analyses', 1000, null, {
        timestamp: { operator: '<', value: cutoffDate.toISOString() },
        syncStatus: ['synced']
      });

      for (const analysis of oldAnalyses) {
        await this.deleteFromIndexedDB('analyses', analysis.id);
        localStorage.removeItem(`analysis_${analysis.id}`);
      }

      console.log(`Cleaned up ${oldAnalyses.length} old analyses`);
    } catch (error) {
      console.error('Error cleaning up old data:', error);
    }
  }

  // ========================================
  // ПРИВАТНЫЕ МЕТОДЫ
  // ========================================

  private async saveToIndexedDB(storeName: string, data: any): Promise<void> {
    if (!this.db) await this.initIndexedDB();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(data);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  private async getFromIndexedDB(
    storeName: string, 
    limit?: number, 
    key?: string | null,
    filters?: any
  ): Promise<any[]> {
    if (!this.db) await this.initIndexedDB();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      
      let request: IDBRequest;
      
      if (key) {
        request = store.get(key);
        request.onsuccess = () => {
          resolve(request.result ? [request.result] : []);
        };
      } else {
        request = store.getAll();
        request.onsuccess = () => {
          let results = request.result || [];
          
          // Применяем фильтры если есть
          if (filters) {
            results = this.applyFilters(results, filters);
          }
          
          // Ограничиваем количество
          if (limit) {
            results = results.slice(0, limit);
          }
          
          resolve(results);
        };
      }

      request.onerror = () => reject(request.error);
    });
  }

  private async deleteFromIndexedDB(storeName: string, key: string): Promise<void> {
    if (!this.db) await this.initIndexedDB();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(key);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  private saveToLocalStorage(key: string, data: any): void {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to save to localStorage:', error);
    }
  }

  private getFromLocalStorage(key: string): any | null {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.warn('Failed to get from localStorage:', error);
      return null;
    }
  }

  private async syncAnalysisWithServer(analysisId: string): Promise<void> {
    const analysis = await this.getAnalysisById(analysisId);
    if (!analysis) return;

    const token = localStorage.getItem('devassist_token');
    if (!token) throw new Error('No authentication token');

    // Здесь будет реальный API вызов к серверу
    // const response = await fetch('/api/user/analyses', { ... });
    
    // Пока что помечаем как sync_pending
    analysis.syncStatus = 'sync_pending';
    analysis.lastSyncAttempt = new Date().toISOString();
    
    await this.saveToIndexedDB('analyses', analysis);
  }

  private async syncProjectWithServer(projectId: string): Promise<void> {
    // Аналогично для проектов
    console.log(`Syncing project ${projectId} with server...`);
  }

  private async fetchServerAnalyses(limit: number): Promise<StoredAnalysis[]> {
    try {
      const token = localStorage.getItem('devassist_token');
      if (!token) return [];

      const response = await fetch(`/api/user/analyses?limit=${limit}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        return data.analyses?.map(this.mapServerAnalysisToStored) || [];
      }
    } catch (error) {
      console.warn('Failed to fetch server analyses:', error);
    }
    return [];
  }

  private async fetchServerAnalysis(id: string): Promise<StoredAnalysis | null> {
    try {
      const token = localStorage.getItem('devassist_token');
      if (!token) return null;

      const response = await fetch(`/api/user/analyses/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        return this.mapServerAnalysisToStored(data.analysis);
      }
    } catch (error) {
      console.warn('Failed to fetch server analysis:', error);
    }
    return null;
  }

  private async fetchServerProjects(): Promise<StoredProject[]> {
    try {
      const token = localStorage.getItem('devassist_token');
      if (!token) return [];

      const response = await fetch('/api/user/projects', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        return data.projects?.map(this.mapServerProjectToStored) || [];
      }
    } catch (error) {
      console.warn('Failed to fetch server projects:', error);
    }
    return [];
  }

  private mapServerAnalysisToStored(serverAnalysis: any): StoredAnalysis {
    return {
      id: serverAnalysis.id.toString(),
      timestamp: serverAnalysis.created_at,
      documents: [], // Будет заполнено отдельно
      results: serverAnalysis.results ? [serverAnalysis.results] : [],
      comparison: serverAnalysis.results || {},
      syncStatus: 'synced'
    };
  }

  private mapServerProjectToStored(serverProject: any): StoredProject {
    return {
      id: serverProject.id.toString(),
      name: serverProject.name,
      description: serverProject.description,
      projectType: serverProject.project_type,
      status: serverProject.status,
      createdAt: serverProject.created_at,
      analysesCount: serverProject.analyses_count || 0,
      syncStatus: 'synced'
    };
  }

  private mergeAnalysesData(local: StoredAnalysis[], server: StoredAnalysis[]): StoredAnalysis[] {
    const merged = [...local];
    const localIds = new Set(local.map(a => a.id));

    for (const serverAnalysis of server) {
      if (!localIds.has(serverAnalysis.id)) {
        merged.push(serverAnalysis);
      }
    }

    return merged;
  }

  private mergeProjectsData(local: StoredProject[], server: StoredProject[]): StoredProject[] {
    const merged = [...local];
    const localIds = new Set(local.map(p => p.id));

    for (const serverProject of server) {
      if (!localIds.has(serverProject.id)) {
        merged.push(serverProject);
      }
    }

    return merged;
  }

  private applyFilters(data: any[], filters: any): any[] {
    return data.filter(item => {
      for (const [key, filter] of Object.entries(filters)) {
        const value = item[key];
        
        if (Array.isArray(filter)) {
          if (!filter.includes(value)) return false;
        } else if (typeof filter === 'object' && filter !== null) {
          const { operator, value: filterValue } = filter as any;
          if (operator === '<' && value >= filterValue) return false;
          if (operator === '>' && value <= filterValue) return false;
        } else {
          if (value !== filter) return false;
        }
      }
      return true;
    });
  }
}

export const analysisStorage = new AnalysisStorageService();
export type { StoredAnalysis, StoredProject };