/**
 * Enhanced KP Analyzer Types - Migrated from v2 with improvements
 * Complete type system for professional commercial proposal analysis
 */

// Currency support for 8 currencies including KGS
export interface CurrencyInfo {
  code: 'KGS' | 'RUB' | 'USD' | 'EUR' | 'KZT' | 'UZS' | 'TJS' | 'UAH';
  symbol: string;
  name: string;
  amount: number;
  originalText?: string;
  position?: number;
}

export interface ExtractedFinancials {
  totalBudget?: CurrencyInfo;
  currencies: CurrencyInfo[];
  paymentTerms: string[];
  costBreakdown: {
    development?: CurrencyInfo;
    infrastructure?: CurrencyInfo;
    support?: CurrencyInfo;
    testing?: CurrencyInfo;
    deployment?: CurrencyInfo;
    project_management?: CurrencyInfo;
    design?: CurrencyInfo;
    documentation?: CurrencyInfo;
    other?: CurrencyInfo[];
  };
  financialNotes: string[];
}

export interface AnalysisSection {
  id: string;
  title: string;
  score: number; // 0-100
  status: 'excellent' | 'good' | 'average' | 'poor' | 'critical';
  summary: string;
  details: string;
  keyPoints: string[];
  recommendations: string[];
  risks: string[];
  opportunities: string[];
  wordCount: number;
  confidence: number; // 0-100
  // Additional structured data
  budgetData?: any[];
  currencies?: CurrencyInfo[];
  tableData?: any[];
  metrics?: Record<string, number>;
  technicalDetails?: Record<string, any>;
}

export interface ComprehensiveAnalysisResult {
  id: string;
  documentId: string;
  documentName: string;
  companyName: string;
  createdAt: string;
  processingDuration: number; // seconds (15-45 seconds realistic)
  aiModel: string;
  
  // Overall metrics
  overallScore: number; // 0-100
  complianceLevel: 'excellent' | 'good' | 'average' | 'poor' | 'critical';
  confidenceScore: number; // 0-100
  
  // Financial analysis
  financials: ExtractedFinancials;
  
  // 10 detailed analysis sections
  sections: {
    budget: AnalysisSection;
    timeline: AnalysisSection;
    technical: AnalysisSection;
    team: AnalysisSection;
    functional: AnalysisSection;
    security: AnalysisSection;
    methodology: AnalysisSection;
    scalability: AnalysisSection;
    communication: AnalysisSection;
    value: AnalysisSection;
  };
  
  // Executive summary
  executiveSummary: {
    keyStrengths: string[];
    criticalWeaknesses: string[];
    riskAssessment: string;
    recommendation: string;
    nextSteps: string[];
    businessImpact?: string;
    technicalFeasibility?: string;
  };
  
  // Comparison data (if TZ provided)
  complianceAnalysis?: {
    requirementsCovered: number; // percentage 0-100
    missingRequirements: string[];
    additionalFeatures: string[];
    technicalAlignment: number; // 0-100
    functionalGaps: string[];
    budgetAlignment: number; // 0-100
  };

  // Analysis metadata
  metadata?: {
    analysisVersion: string;
    processingSteps: string[];
    qualityMetrics: Record<string, number>;
    dataExtraction: {
      textLength: number;
      structuredDataPoints: number;
      currenciesFound: number;
      technicalTermsCount: number;
    };
  };
}

export interface ProgressUpdate {
  stage: 'upload' | 'extraction' | 'analysis' | 'compilation' | 'complete';
  progress: number; // 0-100
  message: string;
  currentSection?: string;
  timeElapsed: number; // seconds
  estimatedTimeRemaining?: number; // seconds
  processingDetails?: {
    sectionsCompleted: number;
    totalSections: number;
    currentOperation: string;
  };
}

export interface AnalysisRequest {
  documentId: string;
  documentContent: string;
  tzContent?: string; // Technical specification content
  analysisOptions: {
    aiModel: 'claude-3-5-sonnet' | 'claude-3-opus' | 'gpt-4o' | 'gpt-4-turbo';
    detailLevel: 'standard' | 'comprehensive' | 'executive';
    includeFinancialAnalysis: boolean;
    includeTechnicalDeepDive: boolean;
    includeRiskAssessment: boolean;
    includeComplianceAnalysis: boolean;
    language: 'ru' | 'en' | 'ky';
    maxTokens?: number;
    temperature?: number;
  };
}

export interface AnalysisSession {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  progress: ProgressUpdate;
  result?: ComprehensiveAnalysisResult;
  error?: string;
  startedAt: string;
  completedAt?: string;
  estimatedDuration?: number;
}

export interface DocumentUpload {
  id: string;
  file: File;
  name: string;
  size: number;
  type: string;
  uploadProgress: number;
  extractedText?: string;
  extractionProgress?: number;
  status: 'uploading' | 'processing' | 'ready' | 'error';
  error?: string;
  metadata?: {
    pageCount?: number;
    wordCount?: number;
    language?: string;
    extractionMethod?: 'text' | 'ocr' | 'hybrid';
  };
}

export interface ExportOptions {
  format: 'pdf' | 'docx' | 'html' | 'xlsx';
  includeCharts: boolean;
  includeRawData: boolean;
  includeExecutiveSummary: boolean;
  includeSectionDetails: boolean;
  includeDetailedSections: boolean;
  includeFinancialBreakdown: boolean;
  includeRecommendations: boolean;
  language: 'ru' | 'en' | 'ky';
  companyInfo?: {
    name: string;
    logo?: string;
    address?: string;
    contact?: string;
  };
}

export interface AnalysisHistory {
  id: string;
  name: string;
  documentName: string;
  companyName: string;
  overallScore: number;
  createdAt: string;
  aiModel: string;
  summary: string;
  tags?: string[];
  favorite?: boolean;
  result?: ComprehensiveAnalysisResult; // Full result cached
}

// WebSocket message types for real-time progress
export interface WebSocketMessage {
  type: 'progress' | 'complete' | 'error' | 'ping' | 'section_update';
  sessionId: string;
  data: ProgressUpdate | ComprehensiveAnalysisResult | { error: string } | {} | {
    section: string;
    status: string;
    score?: number;
  };
}

// API response types
export interface AnalysisApiResponse {
  success: boolean;
  data?: ComprehensiveAnalysisResult;
  session?: AnalysisSession;
  error?: string;
  sessionId?: string;
  processingTime?: number;
  metadata?: Record<string, any>;
}

export interface UploadApiResponse {
  success: boolean;
  documentId?: string;
  extractedText?: string;
  metadata?: DocumentUpload['metadata'];
  error?: string;
}

// Analysis configuration templates
export const ANALYSIS_SECTIONS_CONFIG = {
  budget: {
    title: 'Бюджетный анализ',
    icon: 'TrendingUp',
    weight: 0.15,
    minWords: 200,
    focusAreas: ['cost_breakdown', 'value_for_money', 'payment_terms', 'currency_analysis'],
    description: 'Анализ стоимости, валют и условий оплаты'
  },
  timeline: {
    title: 'Временные рамки',
    icon: 'Clock',
    weight: 0.12,
    minWords: 180,
    focusAreas: ['project_phases', 'milestones', 'delivery_schedule', 'timeline_realism'],
    description: 'Оценка сроков выполнения и планирования проекта'
  },
  technical: {
    title: 'Техническое решение',
    icon: 'Cog',
    weight: 0.15,
    minWords: 220,
    focusAreas: ['technology_stack', 'architecture', 'scalability', 'performance'],
    description: 'Техническая архитектура и используемые технологии'
  },
  team: {
    title: 'Команда и экспертиза',
    icon: 'Users',
    weight: 0.10,
    minWords: 160,
    focusAreas: ['team_composition', 'expertise', 'experience', 'certifications'],
    description: 'Состав команды и уровень экспертизы специалистов'
  },
  functional: {
    title: 'Функциональные требования',
    icon: 'Target',
    weight: 0.13,
    minWords: 200,
    focusAreas: ['feature_coverage', 'user_experience', 'business_logic', 'integration'],
    description: 'Покрытие функциональных требований и возможности'
  },
  security: {
    title: 'Безопасность',
    icon: 'Shield',
    weight: 0.08,
    minWords: 150,
    focusAreas: ['data_protection', 'authentication', 'compliance', 'risk_mitigation'],
    description: 'Меры безопасности и защита данных'
  },
  methodology: {
    title: 'Методология разработки',
    icon: 'Brain',
    weight: 0.10,
    minWords: 170,
    focusAreas: ['development_process', 'quality_assurance', 'project_management', 'communication'],
    description: 'Подходы к разработке и управлению проектом'
  },
  scalability: {
    title: 'Масштабируемость',
    icon: 'Globe',
    weight: 0.07,
    minWords: 140,
    focusAreas: ['performance_scaling', 'infrastructure', 'future_growth', 'maintenance'],
    description: 'Возможности масштабирования и развития системы'
  },
  communication: {
    title: 'Коммуникация и поддержка',
    icon: 'MessageSquare',
    weight: 0.05,
    minWords: 120,
    focusAreas: ['communication_plan', 'reporting', 'support_model', 'documentation'],
    description: 'План коммуникации и поддержки проекта'
  },
  value: {
    title: 'Ценностное предложение',
    icon: 'Sparkles',
    weight: 0.05,
    minWords: 160,
    focusAreas: ['unique_value', 'competitive_advantage', 'roi', 'business_impact'],
    description: 'Уникальная ценность и конкурентные преимущества'
  }
} as const;

// Currency patterns for extraction (8 currencies)
export const CURRENCY_PATTERNS = {
  KGS: {
    symbols: ['сом', 'som', 'KGS', 'сом.'],
    name: 'Кыргызский сом',
    regex: /(?:\d[\d\s,]*(?:[.,]\d+)?)\s*(?:сом|som|KGS)/gi
  },
  RUB: {
    symbols: ['₽', 'руб', 'рубл', 'RUB', 'руб.'],
    name: 'Российский рубль',
    regex: /(?:\d[\d\s,]*(?:[.,]\d+)?)\s*(?:₽|руб|рубл|RUB)/gi
  },
  USD: {
    symbols: ['$', 'USD', 'долл', 'dollar'],
    name: 'Доллар США',
    regex: /(?:\$\s*)?(?:\d[\d\s,]*(?:[.,]\d+)?)\s*(?:\$|USD|долл|dollar)/gi
  },
  EUR: {
    symbols: ['€', 'EUR', 'евро', 'euro'],
    name: 'Евро',
    regex: /(?:€\s*)?(?:\d[\d\s,]*(?:[.,]\d+)?)\s*(?:€|EUR|евро|euro)/gi
  },
  KZT: {
    symbols: ['₸', 'тенге', 'KZT', 'тг'],
    name: 'Казахский тенге',
    regex: /(?:\d[\d\s,]*(?:[.,]\d+)?)\s*(?:₸|тенге|KZT|тг)/gi
  },
  UZS: {
    symbols: ['сум', 'UZS', 'soum'],
    name: 'Узбекский сум',
    regex: /(?:\d[\d\s,]*(?:[.,]\d+)?)\s*(?:сум|UZS|soum)/gi
  },
  TJS: {
    symbols: ['сомони', 'TJS', 'somoni'],
    name: 'Таджикский сомони',
    regex: /(?:\d[\d\s,]*(?:[.,]\d+)?)\s*(?:сомони|TJS|somoni)/gi
  },
  UAH: {
    symbols: ['₴', 'грн', 'UAH', 'гривна'],
    name: 'Украинская гривна',
    regex: /(?:\d[\d\s,]*(?:[.,]\d+)?)\s*(?:₴|грн|UAH|гривна)/gi
  }
} as const;

// Quality thresholds for analysis validation
export const QUALITY_THRESHOLDS = {
  minConfidence: 70,
  minWordCount: 100,
  minSectionScore: 40,
  maxProcessingTime: 300, // 5 minutes maximum
  optimalProcessingTime: [15, 45], // 15-45 seconds range
} as const;

// Default analysis options
export const DEFAULT_ANALYSIS_OPTIONS: AnalysisRequest['analysisOptions'] = {
  aiModel: 'claude-3-5-sonnet',
  detailLevel: 'comprehensive',
  includeFinancialAnalysis: true,
  includeTechnicalDeepDive: true,
  includeRiskAssessment: true,
  includeComplianceAnalysis: true,
  language: 'ru',
  maxTokens: 4000,
  temperature: 0.1
} as const;