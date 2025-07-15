/**
 * Admin Panel Types - DevAssist Pro
 * Типы для административной панели
 */

import { User } from './shared';

// Системные метрики
export interface SystemMetrics {
  users: {
    total: number;
    change24h: number;
    active: number;
    premium: number;
    banned: number;
  };
  api: {
    calls: number;
    change1h: number;
    successRate: number;
    avgResponseTime: number;
  };
  ai: {
    costs: number;
    change24h: number;
    tokenUsage: number;
    providerStatus: Record<string, 'active' | 'limited' | 'error'>;
  };
  analyses: {
    total: number;
    change24h: number;
    successful: number;
    failed: number;
  };
  errors: {
    count: number;
    change24h: number;
    critical: number;
    warnings: number;
  };
  uptime: {
    percentage: number;
    days: number;
    lastDowntime: string | null;
  };
}

// Пользователь с админ информацией
export interface AdminUser extends User {
  lastActivity: string;
  apiCallsCount: number;
  analysesCount: number;
  totalCosts: number;
  ipAddress?: string;
  userAgent?: string;
  registrationSource: string;
  subscription: {
    plan: string;
    status: 'active' | 'inactive' | 'cancelled';
    expiresAt: string;
    autoRenew: boolean;
  };
}

// AI провайдер статус
export interface AIProvider {
  name: 'openai' | 'anthropic' | 'google';
  displayName: string;
  status: 'active' | 'limited' | 'error' | 'maintenance';
  usage: {
    current: number;
    limit: number;
    percentage: number;
  };
  costs: {
    current: number;
    monthly: number;
    budget: number;
  };
  models: {
    name: string;
    status: 'active' | 'deprecated' | 'error';
    requests: number;
    successRate: number;
    avgLatency: number;
  }[];
  lastUpdate: string;
}

// Системная активность
export interface SystemActivity {
  id: string;
  timestamp: string;
  type: 'user_action' | 'system_event' | 'api_call' | 'error' | 'admin_action';
  level: 'info' | 'warning' | 'error' | 'critical';
  message: string;
  details?: any;
  userId?: number;
  userEmail?: string;
  ipAddress?: string;
  metadata?: Record<string, any>;
}

// Алерты и уведомления
export interface SystemAlert {
  id: string;
  type: 'api_usage' | 'cost_limit' | 'error_rate' | 'user_registration' | 'system_health';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  timestamp: string;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
  actions?: {
    label: string;
    action: string;
    type: 'primary' | 'secondary' | 'danger';
  }[];
}

// Настройки системы
export interface SystemSettings {
  general: {
    siteName: string;
    siteUrl: string;
    supportEmail: string;
    maintenanceMode: boolean;
    registrationEnabled: boolean;
    emailVerificationRequired: boolean;
  };
  ai: {
    defaultModel: string;
    maxTokensPerRequest: number;
    maxRequestsPerUser: number;
    costAlertThreshold: number;
    providerPriority: string[];
  };
  security: {
    sessionTimeout: number;
    maxLoginAttempts: number;
    requireTwoFactor: boolean;
    allowedIPs: string[];
    passwordMinLength: number;
  };
  features: {
    kpAnalyzer: boolean;
    documentUpload: boolean;
    realTimeUpdates: boolean;
    analytics: boolean;
    export: boolean;
  };
  limits: {
    maxFileSize: number;
    maxFilesPerUser: number;
    maxAnalysesPerDay: number;
    storageQuota: number;
  };
}

// Статистика использования
export interface UsageStats {
  period: 'hour' | 'day' | 'week' | 'month';
  data: {
    timestamp: string;
    users: number;
    apiCalls: number;
    analyses: number;
    costs: number;
    errors: number;
  }[];
}

// Админ действие
export interface AdminAction {
  id: string;
  adminId: number;
  adminEmail: string;
  action: string;
  target: string;
  targetId?: string;
  previousValue?: any;
  newValue?: any;
  timestamp: string;
  ipAddress: string;
  userAgent?: string;
  success: boolean;
  error?: string;
}

// Фильтры для поиска
export interface UserFilters {
  role?: string;
  status?: string;
  plan?: string;
  registrationDate?: {
    from: string;
    to: string;
  };
  lastActivity?: {
    from: string;
    to: string;
  };
  search?: string;
}

export interface ActivityFilters {
  type?: string;
  level?: string;
  dateRange?: {
    from: string;
    to: string;
  };
  userId?: number;
  search?: string;
}

// Пагинация
export interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

// API ответы
export interface AdminApiResponse<T> {
  success: boolean;
  data: T;
  pagination?: Pagination;
  message?: string;
  error?: string;
}

// Bulk операции
export interface BulkOperation {
  action: 'ban' | 'unban' | 'upgrade' | 'downgrade' | 'delete' | 'export';
  userIds: number[];
  params?: any;
}

export interface BulkOperationResult {
  success: boolean;
  processed: number;
  failed: number;
  errors: string[];
  results: any[];
}

// Chart данные
export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string;
    borderColor?: string;
    fill?: boolean;
  }[];
}

// Backend Management Types
export interface BackendService {
  id: string;
  name: string;
  displayName: string;
  status: 'running' | 'stopped' | 'error' | 'starting' | 'stopping';
  port: number;
  url: string;
  description: string;
  cpu: number;
  memory: number;
  uptime: string;
  lastRestart: string;
  version: string;
  dependencies: string[];
  healthCheck?: {
    endpoint: string;
    status: 'healthy' | 'unhealthy' | 'unknown';
    lastCheck: string;
    responseTime: number;
  };
}

export interface BackendLog {
  id: string;
  service: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  details?: any;
  requestId?: string;
  userId?: number;
}

export interface DatabaseInfo {
  name: string;
  type: 'postgresql' | 'redis' | 'mongodb' | 'mysql';
  status: 'connected' | 'disconnected' | 'error';
  host: string;
  port: number;
  size: string;
  connections: number;
  uptime: string;
  performance: {
    queryTime: number;
    slowQueries: number;
    lockWaits: number;
  };
}

export interface InfrastructureMetrics {
  system: {
    cpuUsage: number;
    memoryUsage: number;
    diskUsage: number;
    networkIO: number;
  };
  docker: {
    containers: number;
    images: number;
    volumes: number;
    networks: number;
  };
  loadBalancer: {
    status: 'active' | 'inactive' | 'error';
    requestsPerSecond: number;
    activeConnections: number;
  };
  ssl: {
    status: 'valid' | 'expired' | 'expiring_soon';
    expiryDate: string;
    issuer: string;
  };
}

// Админ вкладки
export type AdminTab = 'dashboard' | 'users' | 'ai' | 'system' | 'backend';