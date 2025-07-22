// API Configuration для DevAssist Pro
// 🔒 PRODUCTION READY: All URLs use environment variables with secure fallbacks
export const API_CONFIG = {
  // Base URL для backend API
  BASE_URL: process.env.REACT_APP_API_URL || (
    process.env.NODE_ENV === 'production' 
      ? 'https://your-api-domain.com' 
      : 'http://localhost:8000'
  ),
  
  // Использовать реальное API или mock
  USE_REAL_API: process.env.REACT_APP_USE_REAL_API === 'true',
  
  // Эндпоинты API для Monolith Backend
  ENDPOINTS: {
    // КП Анализатор - загрузка файлов
    UPLOAD: '/api/documents/upload',
    
    // КП Анализатор - анализ документа
    ANALYZE: '/api/documents',
    
    // КП Анализатор - полный анализ (загрузка + анализ + отчет)
    FULL_ANALYSIS: '/api/kp-analyzer/full-analysis',
    
    // Генерация отчетов
    GENERATE_PDF_REPORT: '/api/reports/generate/pdf',
    GENERATE_EXCEL_REPORT: '/api/reports/generate/excel',
    
    // Аналитика
    ANALYTICS_PROCESS: '/api/analytics/process',
    ANALYTICS_DASHBOARD: '/api/analytics/dashboard',
    ANALYTICS_METRICS: '/api/analytics/metrics',
    
    // Проверка здоровья сервиса
    HEALTH: '/health',
    
    // Административные endpoints
    ADMIN_STATUS: '/api/admin/status',
    ADMIN_STATS: '/api/admin/stats',
    
    // Статистика использования
    USAGE_STATS: '/api/admin/stats',
    
    // Dashboard данные
    DASHBOARD_STATS: '/api/analytics/dashboard',
  },
  
  // Конфигурация запросов
  REQUEST: {
    TIMEOUT: 120000, // 2 минуты для AI операций
    UPLOAD_TIMEOUT: 60000, // 1 минута для загрузки файлов
    RETRY_ATTEMPTS: 3,
    RETRY_DELAY: 1000,
  },
  
  // Заголовки по умолчанию
  DEFAULT_HEADERS: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  
  // Конфигурация файлов
  FILE_UPLOAD: {
    MAX_SIZE: parseInt(process.env.REACT_APP_MAX_FILE_SIZE || '10485760'), // 10MB
    SUPPORTED_FORMATS: (process.env.REACT_APP_SUPPORTED_FORMATS || 'pdf,docx,doc,txt').split(','),
    CHUNK_SIZE: 1024 * 1024, // 1MB chunks для больших файлов
  },
  
  // AI модели
  AI_MODELS: {
    DEFAULT_ANALYSIS: process.env.REACT_APP_DEFAULT_ANALYSIS_MODEL || 'claude-3-5-sonnet-20240620',
    DEFAULT_COMPARISON: process.env.REACT_APP_DEFAULT_COMPARISON_MODEL || 'gpt-4o',
    
    // Доступные модели (будут загружены с backend)
    AVAILABLE: {
      CLAUDE: [
        'claude-3-5-sonnet-20240620',
        'claude-3-sonnet-20240229',
        'claude-3-opus-20240229'
      ],
      OPENAI: [
        'gpt-4o',
        'gpt-4-turbo',
        'gpt-4',
        'gpt-3.5-turbo'
      ]
    }
  },
  
  // Streaming конфигурация
  STREAMING: {
    ENABLED: process.env.REACT_APP_ENABLE_STREAMING === 'true',
    CHUNK_TIMEOUT: 10000,
    RECONNECT_ATTEMPTS: 5,
  },
  
  // Rate limiting (клиентская сторона)
  RATE_LIMIT: {
    REQUESTS_PER_MINUTE: 30,
    ANALYSIS_PER_HOUR: 50,
    FILE_UPLOADS_PER_HOUR: 100,
  }
} as const;

// Типы для TypeScript
export type APIEndpoint = keyof typeof API_CONFIG.ENDPOINTS;
export type AIModel = string;
export type FileFormat = 'pdf' | 'docx' | 'doc' | 'txt';

// Утилитарные функции
export const buildApiUrl = (endpoint: APIEndpoint, params?: Record<string, string>): string => {
  let url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS[endpoint]}`;
  
  if (params) {
    const searchParams = new URLSearchParams(params);
    url += `?${searchParams.toString()}`;
  }
  
  return url;
};

export const isValidFileFormat = (filename: string): boolean => {
  const extension = filename.toLowerCase().split('.').pop();
  return extension ? API_CONFIG.FILE_UPLOAD.SUPPORTED_FORMATS.includes(extension) : false;
};

export const getFileSizeLimit = (): number => {
  return API_CONFIG.FILE_UPLOAD.MAX_SIZE;
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};