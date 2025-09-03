/**
 * Типы для утилит приложения
 */

// Типы для контрастности
export interface ContrastAnalysis {
  textColor: string;
  backgroundColor: string;
  contrastRatio: number;
  textSize: 'normal' | 'large';
  compliance: {
    aa: boolean;
    aaa: boolean;
    ratio: number;
  };
}

export interface ColorValidationResult {
  color: string;
  background: string;
  contrastRatio: number;
  normalText: {
    aa: boolean;
    aaa: boolean;
    ratio: number;
  };
  largeText: {
    aa: boolean;
    aaa: boolean;
    ratio: number;
  };
  recommendations: string[];
}

// Типы для оптимизации ресурсов
export interface AssetOptimizationOptions {
  quality?: number;
  format?: 'webp' | 'jpeg' | 'png' | 'avif';
  maxWidth?: number;
  maxHeight?: number;
  progressive?: boolean;
  lossless?: boolean;
}

export interface ImageCompressionOptions {
  quality?: number;
  maxWidth?: number;
  maxHeight?: number;
  format?: 'webp' | 'jpeg' | 'png';
  progressive?: boolean;
}

// Типы для обработки документов
export interface DocumentProcessingResult {
  success: boolean;
  text?: string;
  metadata?: {
    title?: string;
    author?: string;
    pages?: number;
    size?: number;
    format?: string;
  };
  error?: string;
}

// Типы для KP анализатора
export interface KPAnalysisConfig {
  enableComparison: boolean;
  enableRecommendations: boolean;
  outputFormat: 'json' | 'html' | 'pdf';
  analysisDepth: 'basic' | 'detailed' | 'comprehensive';
}

// Типы для файловых адаптеров
export interface FileUploadConfig {
  maxSize: number;
  allowedTypes: string[];
  enablePreview: boolean;
  enableProgress: boolean;
}

// Типы для аутентификации
export interface AuthConfig {
  enableSocialAuth: boolean;
  providers: ('google' | 'yandex' | 'vk')[];
  sessionTimeout: number;
  enableRememberMe: boolean;
}

// Типы для валидации
export interface ValidationResult<T = any> {
  isValid: boolean;
  data?: T;
  errors?: string[];
  warnings?: string[];
}

// Типы для производительности
export interface PerformanceMetrics {
  loadTime: number;
  renderTime: number;
  interactionTime: number;
  memoryUsage: number;
}

// Типы для доступности
export interface AccessibilityCheck {
  element: HTMLElement;
  issues: {
    type: 'error' | 'warning' | 'info';
    message: string;
    recommendation?: string;
  }[];
  score: number;
}

// Все типы уже экспортируются через export interface выше

// Типы для отчетов и анализа
export interface ComparisonResult {
  summary: string;
  recommendations: string[];
  bestProposal?: {
    id: string;
    companyName: string;
    score: number;
    reasons: string[];
  };
}

export interface RealAnalysisResult {
  id: string;
  tz_name: string;
  kp_name: string;
  company_name: any;
  tech_stack: any;
  pricing: any;
  timeline: any;
  total_cost: any;
  currency: any;
  cost_breakdown: any;
  competitive_advantages: any;
  team_expertise: any;
  methodology: any;
  quality_assurance: any;
  // Опциональные поля
  post_launch_support?: any;
  document_quality?: any;
  file_format?: any;
  summary: any;
  confidence_score: any;
}