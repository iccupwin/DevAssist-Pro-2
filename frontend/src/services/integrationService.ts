/**
 * Integration Service
 * Объединяет React frontend с FastAPI backend для seamless интеграции
 */

import { unifiedApiClient } from './unifiedApiClient';
import { 
  User, 
  Project, 
  Document, 
  Analysis,
  KPAnalysisRequest,
  KPAnalysisResult,
  DocumentUploadResponse,
  DashboardStats,
  PaginationParams,
  APIResponse,
  WebSocketMessage,
  WebSocketEvent
} from '../types/shared';
import { LoginFormData, RegisterFormData, AuthResponse } from '../types/auth';

class IntegrationService {
  private wsConnection: WebSocket | null = null;
  private eventListeners: Map<string, ((event: WebSocketEvent) => void)[]> = new Map();

  constructor() {
    this.setupWebSocket();
  }

  // ===== AUTHENTICATION BRIDGE =====
  async authenticateUser(credentials: LoginFormData): Promise<AuthResponse> {
    try {
      const response = await unifiedApiClient.login(credentials);
      
      // После успешной авторизации инициализируем WebSocket
      if (response.success) {
        this.setupWebSocket();
      }
      
      return response;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Authentication failed'
      };
    }
  }

  async registerUser(userData: RegisterFormData): Promise<AuthResponse> {
    try {
      const response = await unifiedApiClient.register(userData);
      
      if (response.success) {
        this.setupWebSocket();
      }
      
      return response;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Registration failed'
      };
    }
  }

  async logoutUser(): Promise<void> {
    try {
      await unifiedApiClient.logout();
      this.closeWebSocket();
    } catch (error) {
      console.error('Logout error:', error);
    }
  }

  async refreshUserToken(): Promise<boolean> {
    return unifiedApiClient.refreshAccessToken();
  }

  // ===== OAUTH BRIDGE =====
  async handleOAuthCallback(provider: string, code: string, redirectUri: string): Promise<AuthResponse> {
    try {
      const response = await unifiedApiClient.loginWithOAuth(provider, code, redirectUri);
      
      if (response.success) {
        this.setupWebSocket();
      }
      
      return response;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'OAuth login failed'
      };
    }
  }

  // ===== PROJECT MANAGEMENT BRIDGE =====
  async getProjectsWithDocuments(params?: PaginationParams): Promise<Project[]> {
    try {
      const response = await unifiedApiClient.getProjects(params);
      
      // Для каждого проекта получаем документы
      const projectsWithDocuments = await Promise.all(
        (response.data || []).map(async (project: Project) => {
          const documents = await unifiedApiClient.getDocuments(Number(project.id));
          return { ...project, documents };
        })
      );
      
      return projectsWithDocuments;
    } catch (error) {
      console.error('Error fetching projects with documents:', error);
      return [];
    }
  }

  async createProjectWithInitialSetup(projectData: {
    name: string;
    description?: string;
    project_type: string;
    organization_id: number;
  }): Promise<Project | null> {
    try {
      const project = await unifiedApiClient.createProject(projectData);
      
      // Создаем начальную активность
      this.trackActivity({
        type: 'project_created',
        description: `Создан проект: ${project.name}`,
        project_id: Number(project.id),
      });
      
      return project;
    } catch (error) {
      console.error('Error creating project:', error);
      return null;
    }
  }

  // ===== DOCUMENT MANAGEMENT BRIDGE =====
  async uploadDocumentWithProcessing(
    file: File,
    documentType: string,
    projectId?: number,
    onProgress?: (progress: number) => void
  ): Promise<Document | null> {
    try {
      // Загружаем файл
      const document = await unifiedApiClient.uploadDocument(file, documentType, projectId);
      
      // Отслеживаем прогресс обработки через WebSocket
      this.subscribeToEvent('document_processed', (event) => {
        if (event.data.document_id === document.id) {
          onProgress?.(100);
        }
      });
      
      // Создаем активность
      this.trackActivity({
        type: 'document_uploaded',
        description: `Загружен документ: ${file.name}`,
        document_id: Number(document.id),
        project_id: Number(projectId),
      });
      
      return document;
    } catch (error) {
      console.error('Error uploading document:', error);
      return null;
    }
  }

  async batchUploadDocuments(
    files: File[],
    documentType: string,
    projectId?: number,
    onProgress?: (progress: { file: string; status: string; progress: number }) => void
  ): Promise<Document[]> {
    const uploadedDocuments: Document[] = [];
    
    for (const file of files) {
      try {
        onProgress?.({ file: file.name, status: 'uploading', progress: 0 });
        
        const document = await this.uploadDocumentWithProcessing(
          file,
          documentType,
          projectId,
          (progress) => {
            onProgress?.({ file: file.name, status: 'processing', progress });
          }
        );
        
        if (document) {
          uploadedDocuments.push(document);
          onProgress?.({ file: file.name, status: 'completed', progress: 100 });
        } else {
          onProgress?.({ file: file.name, status: 'error', progress: 0 });
        }
      } catch (error) {
        console.error(`Error uploading ${file.name}:`, error);
        onProgress?.({ file: file.name, status: 'error', progress: 0 });
      }
    }
    
    return uploadedDocuments;
  }

  // ===== KP ANALYSIS BRIDGE =====
  async startKPAnalysis(
    request: KPAnalysisRequest,
    onProgress?: (progress: { stage: string; progress: number }) => void
  ): Promise<Analysis | null> {
    try {
      const analysis = await unifiedApiClient.startKpAnalysis(request);
      
      // Подписываемся на события прогресса
      this.subscribeToEvent('analysis_progress', (event) => {
        if (event.data.analysis_id === analysis.id) {
          onProgress?.({
            stage: event.data.stage,
            progress: event.data.progress,
          });
        }
      });
      
      // Подписываемся на завершение анализа
      this.subscribeToEvent('analysis_complete', (event) => {
        if (event.data.analysis_id === analysis.id) {
          this.trackActivity({
            type: 'analysis_completed',
            description: `Анализ КП завершен для проекта ${request.project_id}`,
            project_id: request.project_id,
          });
        }
      });
      
      return analysis;
    } catch (error) {
      console.error('Error starting KP analysis:', error);
      return null;
    }
  }

  async getKPAnalysisResults(analysisId: number): Promise<KPAnalysisResult | null> {
    try {
      const analysis = await unifiedApiClient.getAnalysis(analysisId);
      
      if (analysis.status === 'completed' && analysis.results) {
        return {
          analysis_id: Number(analysis.id),
          project_id: Number(analysis.project_id),
          tz_document_id: analysis.tz_document_id || 0,
          overall_results: analysis.results.overall_results,
          kp_results: analysis.results.kp_results,
          comparison_matrix: analysis.results.comparison_matrix,
          recommendations: analysis.results.recommendations,
          created_at: analysis.created_at,
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error getting KP analysis results:', error);
      return null;
    }
  }

  // ===== DASHBOARD BRIDGE =====
  async getDashboardData(): Promise<DashboardStats | null> {
    try {
      const stats = await unifiedApiClient.getDashboardStats();
      return stats;
    } catch (error) {
      console.error('Error getting dashboard data:', error);
      return null;
    }
  }

  async getUserProfile(): Promise<User | null> {
    try {
      const user = await unifiedApiClient.getCurrentUser();
      return user;
    } catch (error) {
      console.error('Error getting user profile:', error);
      return null;
    }
  }

  async updateUserProfile(data: Partial<User>): Promise<User | null> {
    try {
      const user = await unifiedApiClient.updateProfile(data);
      
      this.trackActivity({
        type: 'profile_updated',
        description: 'Профиль пользователя обновлен',
      });
      
      return user;
    } catch (error) {
      console.error('Error updating user profile:', error);
      return null;
    }
  }

  // ===== WEBSOCKET BRIDGE =====
  private setupWebSocket(): void {
    if (this.wsConnection) {
      this.closeWebSocket();
    }
    
    try {
      this.wsConnection = unifiedApiClient.connectWebSocket();
      
      this.wsConnection.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          this.handleWebSocketMessage(message);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };
      
      this.wsConnection.onclose = () => {
        console.log('WebSocket connection closed');
        // Попытка переподключения через 5 секунд
        setTimeout(() => this.setupWebSocket(), 5000);
      };
      
      this.wsConnection.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
    } catch (error) {
      console.error('Error setting up WebSocket:', error);
    }
  }

  private closeWebSocket(): void {
    if (this.wsConnection) {
      this.wsConnection.close();
      this.wsConnection = null;
    }
  }

  private handleWebSocketMessage(message: WebSocketMessage): void {
    const listeners = this.eventListeners.get(message.type) || [];
    listeners.forEach(listener => {
      try {
        listener(message as WebSocketEvent);
      } catch (error) {
        console.error('Error in WebSocket event listener:', error);
      }
    });
  }

  subscribeToEvent(eventType: string, listener: (event: WebSocketEvent) => void): void {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, []);
    }
    this.eventListeners.get(eventType)!.push(listener);
  }

  unsubscribeFromEvent(eventType: string, listener: (event: WebSocketEvent) => void): void {
    const listeners = this.eventListeners.get(eventType) || [];
    const index = listeners.indexOf(listener);
    if (index > -1) {
      listeners.splice(index, 1);
    }
  }

  // ===== ACTIVITY TRACKING =====
  private async trackActivity(activity: {
    type: string;
    description: string;
    project_id?: number;
    document_id?: number;
    metadata?: Record<string, any>;
  }): Promise<void> {
    try {
      // Отправляем через WebSocket для real-time обновлений
      if (this.wsConnection && this.wsConnection.readyState === WebSocket.OPEN) {
        this.wsConnection.send(JSON.stringify({
          type: 'activity',
          data: activity,
        }));
      }
    } catch (error) {
      console.error('Error tracking activity:', error);
    }
  }

  // ===== ERROR HANDLING =====
  handleError(error: any, context?: string): void {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    console.error(`Error in ${context}:`, error);
    
    // Отправляем ошибку через WebSocket для мониторинга
    if (this.wsConnection && this.wsConnection.readyState === WebSocket.OPEN) {
      this.wsConnection.send(JSON.stringify({
        type: 'error',
        data: {
          message: errorMessage,
          context,
          timestamp: new Date().toISOString(),
        },
      }));
    }
  }

  // ===== HEALTH CHECK =====
  async checkSystemHealth(): Promise<boolean> {
    try {
      const health = await unifiedApiClient.healthCheck();
      return health.status === 'healthy';
    } catch (error) {
      console.error('Health check failed:', error);
      return false;
    }
  }

  // ===== CLEANUP =====
  cleanup(): void {
    this.closeWebSocket();
    this.eventListeners.clear();
  }
}

// Singleton instance
export const integrationService = new IntegrationService();

export default integrationService;