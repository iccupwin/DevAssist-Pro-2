/**
 * Backend Service - Работа с backend API
 * Управление сервисами, логами и мониторингом
 */

import { BackendService, BackendLog, DatabaseInfo, InfrastructureMetrics } from '../types/admin';

export interface BackendApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

export interface ServiceAction {
  action: 'start' | 'stop' | 'restart' | 'reload';
  serviceId: string;
}

export interface LogFilter {
  service?: string;
  level?: 'info' | 'warn' | 'error' | 'debug';
  timeRange?: {
    from: string;
    to: string;
  };
  search?: string;
  limit?: number;
}

class BackendServiceApi {
  private baseURL: string;

  constructor() {
    this.baseURL = process.env.REACT_APP_BACKEND_API_URL || (
      process.env.NODE_ENV === 'production' 
        ? 'https://your-api-domain.com/admin' 
        : 'http://localhost:8000/admin'
    );
  }

  /**
   * Получить список всех backend сервисов
   */
  async getServices(): Promise<BackendApiResponse<BackendService[]>> {
    try {
      // В development режиме возвращаем mock данные
      if (process.env.NODE_ENV === 'development') {
        return this.getMockServices();
      }

      const response = await fetch(`${this.baseURL}/services`);
      const data = await response.json();
      
      return {
        success: response.ok,
        data: data.services || [],
        message: data.message,
        error: !response.ok ? data.error : undefined
      };
    } catch (error) {
      console.error('Failed to fetch services:', error);
      return {
        success: false,
        data: [],
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Выполнить действие над сервисом
   */
  async performServiceAction(action: ServiceAction): Promise<BackendApiResponse<{ message: string }>> {
    try {
      // В development режиме симулируем действие
      if (process.env.NODE_ENV === 'development') {
        return this.mockServiceAction(action);
      }

      const response = await fetch(`${this.baseURL}/services/${action.serviceId}/action`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: action.action })
      });
      
      const data = await response.json();
      
      return {
        success: response.ok,
        data: { message: data.message || `Service ${action.action} completed` },
        error: !response.ok ? data.error : undefined
      };
    } catch (error) {
      console.error('Service action failed:', error);
      return {
        success: false,
        data: { message: '' },
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Получить логи сервисов
   */
  async getLogs(filters: LogFilter = {}): Promise<BackendApiResponse<BackendLog[]>> {
    try {
      // В development режиме возвращаем mock данные
      if (process.env.NODE_ENV === 'development') {
        return this.getMockLogs(filters);
      }

      const params = new URLSearchParams();
      if (filters.service) params.append('service', filters.service);
      if (filters.level) params.append('level', filters.level);
      if (filters.search) params.append('search', filters.search);
      if (filters.limit) params.append('limit', filters.limit.toString());

      const response = await fetch(`${this.baseURL}/logs?${params}`);
      const data = await response.json();
      
      return {
        success: response.ok,
        data: data.logs || [],
        message: data.message,
        error: !response.ok ? data.error : undefined
      };
    } catch (error) {
      console.error('Failed to fetch logs:', error);
      return {
        success: false,
        data: [],
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Получить информацию о базах данных
   */
  async getDatabases(): Promise<BackendApiResponse<DatabaseInfo[]>> {
    try {
      // В development режиме возвращаем mock данные
      if (process.env.NODE_ENV === 'development') {
        return this.getMockDatabases();
      }

      const response = await fetch(`${this.baseURL}/databases`);
      const data = await response.json();
      
      return {
        success: response.ok,
        data: data.databases || [],
        message: data.message,
        error: !response.ok ? data.error : undefined
      };
    } catch (error) {
      console.error('Failed to fetch databases:', error);
      return {
        success: false,
        data: [],
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Получить метрики инфраструктуры
   */
  async getInfrastructureMetrics(): Promise<BackendApiResponse<InfrastructureMetrics>> {
    try {
      // В development режиме возвращаем mock данные
      if (process.env.NODE_ENV === 'development') {
        return this.getMockInfrastructureMetrics();
      }

      const response = await fetch(`${this.baseURL}/infrastructure/metrics`);
      const data = await response.json();
      
      return {
        success: response.ok,
        data: data.metrics || this.getDefaultMetrics(),
        message: data.message,
        error: !response.ok ? data.error : undefined
      };
    } catch (error) {
      console.error('Failed to fetch infrastructure metrics:', error);
      return {
        success: false,
        data: this.getDefaultMetrics(),
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Проверить здоровье сервиса
   */
  async checkServiceHealth(serviceId: string): Promise<BackendApiResponse<{ status: string; responseTime: number }>> {
    try {
      // В development режиме симулируем проверку
      if (process.env.NODE_ENV === 'development') {
        return {
          success: true,
          data: {
            status: Math.random() > 0.2 ? 'healthy' : 'unhealthy',
            responseTime: Math.floor(Math.random() * 500) + 50
          }
        };
      }

      const response = await fetch(`${this.baseURL}/services/${serviceId}/health`);
      const data = await response.json();
      
      return {
        success: response.ok,
        data: data.health || { status: 'unknown', responseTime: 0 },
        error: !response.ok ? data.error : undefined
      };
    } catch (error) {
      console.error('Health check failed:', error);
      return {
        success: false,
        data: { status: 'error', responseTime: 0 },
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Mock методы для development
  private getMockServices(): BackendApiResponse<BackendService[]> {
    const services: BackendService[] = [
      {
        id: 'api-gateway',
        name: 'api-gateway',
        displayName: 'API Gateway',
        status: 'running',
        port: 8000,
        url: 'http://localhost:8000',
        description: 'Центральный API Gateway для маршрутизации запросов',
        cpu: 15.4,
        memory: 256,
        uptime: '2d 14h 32m',
        lastRestart: '2024-01-13 10:15:00',
        version: '1.2.3',
        dependencies: ['auth-service', 'database'],
        healthCheck: {
          endpoint: '/health',
          status: 'healthy',
          lastCheck: new Date().toISOString(),
          responseTime: 120
        }
      },
      {
        id: 'auth-service',
        name: 'auth-service',
        displayName: 'Auth Service',
        status: 'running',
        port: 8001,
        url: 'http://localhost:8001',
        description: 'Сервис аутентификации и авторизации',
        cpu: 8.2,
        memory: 128,
        uptime: '2d 14h 30m',
        lastRestart: '2024-01-13 10:17:00',
        version: '1.1.5',
        dependencies: ['database', 'redis'],
        healthCheck: {
          endpoint: '/health',
          status: 'healthy',
          lastCheck: new Date().toISOString(),
          responseTime: 85
        }
      },
      {
        id: 'llm-service',
        name: 'llm-service',
        displayName: 'LLM Service',
        status: 'running',
        port: 8002,
        url: 'http://localhost:8002',
        description: 'Сервис управления AI моделями',
        cpu: 45.7,
        memory: 1024,
        uptime: '2d 14h 28m',
        lastRestart: '2024-01-13 10:19:00',
        version: '2.0.1',
        dependencies: ['database', 'redis'],
        healthCheck: {
          endpoint: '/health',
          status: 'healthy',
          lastCheck: new Date().toISOString(),
          responseTime: 230
        }
      },
      {
        id: 'documents-service',
        name: 'documents-service',
        displayName: 'Documents Service',
        status: 'running',
        port: 8003,
        url: 'http://localhost:8003',
        description: 'Сервис обработки документов',
        cpu: 22.1,
        memory: 512,
        uptime: '2d 14h 25m',
        lastRestart: '2024-01-13 10:22:00',
        version: '1.3.2',
        dependencies: ['database'],
        healthCheck: {
          endpoint: '/health',
          status: 'healthy',
          lastCheck: new Date().toISOString(),
          responseTime: 95
        }
      },
      {
        id: 'dashboard-service',
        name: 'dashboard-service',
        displayName: 'Dashboard Service',
        status: 'error',
        port: 8004,
        url: 'http://localhost:8004',
        description: 'Сервис дашборда и аналитики',
        cpu: 0,
        memory: 0,
        uptime: '0m',
        lastRestart: '2024-01-13 15:30:00',
        version: '1.0.8',
        dependencies: ['database', 'auth-service'],
        healthCheck: {
          endpoint: '/health',
          status: 'unhealthy',
          lastCheck: new Date().toISOString(),
          responseTime: 0
        }
      }
    ];

    return {
      success: true,
      data: services
    };
  }

  private mockServiceAction(action: ServiceAction): BackendApiResponse<{ message: string }> {
    const messages = {
      start: `Сервис ${action.serviceId} запускается...`,
      stop: `Сервис ${action.serviceId} останавливается...`,
      restart: `Сервис ${action.serviceId} перезапускается...`,
      reload: `Конфигурация сервиса ${action.serviceId} перезагружается...`
    };

    return {
      success: true,
      data: {
        message: messages[action.action] || 'Действие выполняется...'
      }
    };
  }

  private getMockLogs(filters: LogFilter): BackendApiResponse<BackendLog[]> {
    const logs: BackendLog[] = [
      {
        id: '1',
        service: 'api-gateway',
        timestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
        level: 'info',
        message: 'Request processed successfully: POST /api/auth/login',
        requestId: 'req-12345'
      },
      {
        id: '2',
        service: 'llm-service',
        timestamp: new Date(Date.now() - 4 * 60 * 1000).toISOString(),
        level: 'info',
        message: 'Claude API request completed in 2.3s',
        requestId: 'req-12346'
      },
      {
        id: '3',
        service: 'dashboard-service',
        timestamp: new Date(Date.now() - 17 * 60 * 1000).toISOString(),
        level: 'error',
        message: 'Database connection timeout after 30s',
        details: { timeout: 30000, host: 'localhost:5432' }
      },
      {
        id: '4',
        service: 'auth-service',
        timestamp: new Date(Date.now() - 19 * 60 * 1000).toISOString(),
        level: 'warn',
        message: 'Rate limit exceeded for IP 192.168.1.100',
        details: { ip: '192.168.1.100', limit: 100 }
      },
      {
        id: '5',
        service: 'documents-service',
        timestamp: new Date(Date.now() - 32 * 60 * 1000).toISOString(),
        level: 'info',
        message: 'PDF processing completed: document_12345.pdf',
        requestId: 'req-12347'
      }
    ];

    // Применяем фильтры
    let filteredLogs = logs;
    
    if (filters.service) {
      filteredLogs = filteredLogs.filter(log => log.service === filters.service);
    }
    
    if (filters.level) {
      filteredLogs = filteredLogs.filter(log => log.level === filters.level);
    }
    
    if (filters.search) {
      const search = filters.search.toLowerCase();
      filteredLogs = filteredLogs.filter(log => 
        log.message.toLowerCase().includes(search) ||
        log.service.toLowerCase().includes(search)
      );
    }
    
    if (filters.limit) {
      filteredLogs = filteredLogs.slice(0, filters.limit);
    }

    return {
      success: true,
      data: filteredLogs
    };
  }

  private getMockDatabases(): BackendApiResponse<DatabaseInfo[]> {
    const databases: DatabaseInfo[] = [
      {
        name: 'PostgreSQL',
        type: 'postgresql',
        status: 'connected',
        host: 'localhost',
        port: 5432,
        size: '2.4 GB',
        connections: 23,
        uptime: '5d 8h 15m',
        performance: {
          queryTime: 12.5,
          slowQueries: 3,
          lockWaits: 0
        }
      },
      {
        name: 'Redis',
        type: 'redis',
        status: 'connected',
        host: 'localhost',
        port: 6379,
        size: '128 MB',
        connections: 15,
        uptime: '5d 8h 12m',
        performance: {
          queryTime: 0.8,
          slowQueries: 0,
          lockWaits: 0
        }
      }
    ];

    return {
      success: true,
      data: databases
    };
  }

  private getMockInfrastructureMetrics(): BackendApiResponse<InfrastructureMetrics> {
    const metrics: InfrastructureMetrics = {
      system: {
        cpuUsage: 23.4,
        memoryUsage: 68.7,
        diskUsage: 45.2,
        networkIO: 125.8
      },
      docker: {
        containers: 12,
        images: 8,
        volumes: 6,
        networks: 3
      },
      loadBalancer: {
        status: 'active',
        requestsPerSecond: 45.2,
        activeConnections: 234
      },
      ssl: {
        status: 'valid',
        expiryDate: '2024-12-15',
        issuer: 'Let\'s Encrypt'
      }
    };

    return {
      success: true,
      data: metrics
    };
  }

  private getDefaultMetrics(): InfrastructureMetrics {
    return {
      system: {
        cpuUsage: 0,
        memoryUsage: 0,
        diskUsage: 0,
        networkIO: 0
      },
      docker: {
        containers: 0,
        images: 0,
        volumes: 0,
        networks: 0
      },
      loadBalancer: {
        status: 'inactive',
        requestsPerSecond: 0,
        activeConnections: 0
      },
      ssl: {
        status: 'valid',
        expiryDate: '',
        issuer: ''
      }
    };
  }
}

// Экспортируем singleton
export const backendService = new BackendServiceApi();
export default backendService;