// API Monitoring и Analytics Service
import { API_CONFIG } from '../config/api';

export interface ApiMetrics {
  requestCount: number;
  errorCount: number;
  averageResponseTime: number;
  lastRequestTime: Date | null;
  rateLimitStatus: {
    requestsPerMinute: number;
    analysisPerHour: number;
    fileUploadsPerHour: number;
  };
}

export interface RequestLog {
  id: string;
  endpoint: string;
  method: string;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  status: 'pending' | 'success' | 'error';
  error?: string;
  responseSize?: number;
}

class ApiMonitoringService {
  private metrics: ApiMetrics = {
    requestCount: 0,
    errorCount: 0,
    averageResponseTime: 0,
    lastRequestTime: null,
    rateLimitStatus: {
      requestsPerMinute: 0,
      analysisPerHour: 0,
      fileUploadsPerHour: 0,
    }
  };

  private requestLogs: RequestLog[] = [];
  private requestTimestamps: Date[] = [];
  private analysisTimestamps: Date[] = [];
  private uploadTimestamps: Date[] = [];

  // Начало отслеживания запроса
  startRequest(endpoint: string, method: string = 'GET'): string {
    const requestId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date();
    
    const log: RequestLog = {
      id: requestId,
      endpoint,
      method,
      startTime: now,
      status: 'pending'
    };

    this.requestLogs.push(log);
    this.requestTimestamps.push(now);
    
    // Очистка старых timestamp'ов (старше 1 часа)
    this.cleanupTimestamps();
    
    return requestId;
  }

  // Завершение отслеживания запроса
  endRequest(requestId: string, success: boolean, error?: string, responseSize?: number): void {
    const logIndex = this.requestLogs.findIndex(log => log.id === requestId);
    if (logIndex === -1) return;

    const log = this.requestLogs[logIndex];
    const now = new Date();
    const duration = now.getTime() - log.startTime.getTime();

    log.endTime = now;
    log.duration = duration;
    log.status = success ? 'success' : 'error';
    log.error = error;
    log.responseSize = responseSize;

    // Обновление метрик
    this.metrics.requestCount++;
    this.metrics.lastRequestTime = now;
    
    if (!success) {
      this.metrics.errorCount++;
    }

    // Пересчет среднего времени отклика
    const completedRequests = this.requestLogs.filter(r => r.duration);
    const totalDuration = completedRequests.reduce((sum, r) => sum + (r.duration || 0), 0);
    this.metrics.averageResponseTime = totalDuration / completedRequests.length;

    // Отслеживание специфических операций
    if (log.endpoint.includes('/analyze')) {
      this.analysisTimestamps.push(now);
    } else if (log.endpoint.includes('/upload')) {
      this.uploadTimestamps.push(now);
    }

    // Очистка старых логов (сохраняем только последние 100)
    if (this.requestLogs.length > 100) {
      this.requestLogs = this.requestLogs.slice(-100);
    }
  }

  // Проверка rate limits
  checkRateLimit(): { allowed: boolean; limits: Record<string, boolean> } {
    const now = new Date();
    const oneMinuteAgo = new Date(now.getTime() - 60 * 1000);
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    // Подсчет запросов за последнюю минуту
    const requestsLastMinute = this.requestTimestamps.filter(
      timestamp => timestamp > oneMinuteAgo
    ).length;

    // Подсчет анализов за последний час
    const analysisLastHour = this.analysisTimestamps.filter(
      timestamp => timestamp > oneHourAgo
    ).length;

    // Подсчет загрузок за последний час
    const uploadsLastHour = this.uploadTimestamps.filter(
      timestamp => timestamp > oneHourAgo
    ).length;

    // Обновление метрик rate limit
    this.metrics.rateLimitStatus = {
      requestsPerMinute: requestsLastMinute,
      analysisPerHour: analysisLastHour,
      fileUploadsPerHour: uploadsLastHour,
    };

    const limits = {
      requestsPerMinute: requestsLastMinute < API_CONFIG.RATE_LIMIT.REQUESTS_PER_MINUTE,
      analysisPerHour: analysisLastHour < API_CONFIG.RATE_LIMIT.ANALYSIS_PER_HOUR,
      fileUploadsPerHour: uploadsLastHour < API_CONFIG.RATE_LIMIT.FILE_UPLOADS_PER_HOUR,
    };

    const allowed = Object.values(limits).every(limit => limit);

    return { allowed, limits };
  }

  // Получение текущих метрик
  getMetrics(): ApiMetrics {
    return { ...this.metrics };
  }

  // Получение логов запросов
  getRequestLogs(limit: number = 50): RequestLog[] {
    return this.requestLogs.slice(-limit);
  }

  // Получение статистики ошибок
  getErrorStats(): { errorRate: number; commonErrors: Record<string, number> } {
    const errorLogs = this.requestLogs.filter(log => log.status === 'error');
    const errorRate = this.metrics.requestCount > 0 ? 
      (this.metrics.errorCount / this.metrics.requestCount) * 100 : 0;

    const commonErrors: Record<string, number> = {};
    errorLogs.forEach(log => {
      if (log.error) {
        commonErrors[log.error] = (commonErrors[log.error] || 0) + 1;
      }
    });

    return { errorRate, commonErrors };
  }

  // Получение статистики производительности
  getPerformanceStats(): {
    averageResponseTime: number;
    slowRequests: RequestLog[];
    fastestRequest?: RequestLog;
    slowestRequest?: RequestLog;
  } {
    const completedLogs = this.requestLogs.filter(log => log.duration);
    const slowRequests = completedLogs.filter(log => (log.duration || 0) > 5000); // > 5 секунд
    
    const sortedByDuration = [...completedLogs].sort((a, b) => (a.duration || 0) - (b.duration || 0));
    const fastestRequest = sortedByDuration[0];
    const slowestRequest = sortedByDuration[sortedByDuration.length - 1];

    return {
      averageResponseTime: this.metrics.averageResponseTime,
      slowRequests,
      fastestRequest,
      slowestRequest,
    };
  }

  // Очистка старых timestamp'ов
  private cleanupTimestamps(): void {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    
    this.requestTimestamps = this.requestTimestamps.filter(ts => ts > oneHourAgo);
    this.analysisTimestamps = this.analysisTimestamps.filter(ts => ts > oneHourAgo);
    this.uploadTimestamps = this.uploadTimestamps.filter(ts => ts > oneHourAgo);
  }

  // Сброс метрик
  resetMetrics(): void {
    this.metrics = {
      requestCount: 0,
      errorCount: 0,
      averageResponseTime: 0,
      lastRequestTime: null,
      rateLimitStatus: {
        requestsPerMinute: 0,
        analysisPerHour: 0,
        fileUploadsPerHour: 0,
      }
    };
    
    this.requestLogs = [];
    this.requestTimestamps = [];
    this.analysisTimestamps = [];
    this.uploadTimestamps = [];
  }

  // Экспорт метрик для аналитики
  exportMetrics(): string {
    const data = {
      metrics: this.metrics,
      logs: this.requestLogs,
      errorStats: this.getErrorStats(),
      performanceStats: this.getPerformanceStats(),
      exportedAt: new Date().toISOString(),
    };

    return JSON.stringify(data, null, 2);
  }
}

// Экспорт синглтона
export const apiMonitoring = new ApiMonitoringService();

// Hook для React компонентов
export const useApiMonitoring = () => {
  return {
    getMetrics: () => apiMonitoring.getMetrics(),
    checkRateLimit: () => apiMonitoring.checkRateLimit(),
    getErrorStats: () => apiMonitoring.getErrorStats(),
    getPerformanceStats: () => apiMonitoring.getPerformanceStats(),
    exportMetrics: () => apiMonitoring.exportMetrics(),
  };
};