/**
 * KP Analyzer v2 - Comprehensive Type Definitions
 * Professional-grade analysis with multi-currency support and detailed sections
 */

export interface CurrencyInfo {
  code: 'KGS' | 'RUB' | 'USD' | 'EUR' | 'KZT' | 'UZS' | 'TJS' | 'UAH';
  symbol: string;
  name: string;
  amount: number;
  originalText: string;
  position: number;
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
}

export interface ComprehensiveAnalysisResult {
  id: string;
  documentId: string;
  documentName: string;
  companyName: string;
  createdAt: string;
  processingDuration: number; // seconds
  aiModel: string;
  
  // Overall metrics
  overallScore: number; // 0-100
  complianceLevel: 'excellent' | 'good' | 'average' | 'poor' | 'critical';
  confidenceScore: number; // 0-100
  
  // Financial data
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
  };
  
  // Comparison data (if TZ provided)
  complianceAnalysis?: {
    requirementsCovered: number; // percentage
    missingRequirements: string[];
    additionalFeatures: string[];
    technicalAlignment: number; // 0-100
  };
}

export interface ProgressUpdate {
  stage: 'upload' | 'extraction' | 'analysis' | 'compilation' | 'complete';
  progress: number; // 0-100
  message: string;
  currentSection?: string;
  timeElapsed: number; // seconds
  estimatedTimeRemaining?: number; // seconds
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
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: ProgressUpdate;
  result?: ComprehensiveAnalysisResult;
  error?: string;
  startedAt: string;
  completedAt?: string;
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
}

export interface ComparisonResult {
  tzCompliance: number; // 0-100
  competitiveRanking: number; // 1-based ranking
  strengthsVsCompetitors: string[];
  weaknessesVsCompetitors: string[];
  recommendedImprovements: string[];
  marketPosition: 'leading' | 'competitive' | 'below_average' | 'concerning';
}

export interface ExportOptions {
  format: 'pdf' | 'docx' | 'html';
  includeCharts: boolean;
  includeRawData: boolean;
  includeExecutiveSummary: boolean;
  includeDetailedSections: boolean;
  includeFinancialBreakdown: boolean;
  language: 'ru' | 'en' | 'ky';
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
}

// WebSocket message types
export interface WebSocketMessage {
  type: 'progress' | 'complete' | 'error' | 'ping';
  sessionId: string;
  data: ProgressUpdate | ComprehensiveAnalysisResult | { error: string } | {};
}

// API response types
export interface AnalysisApiResponse {
  success: boolean;
  data?: any;
  error?: string;
  sessionId?: string;
}

export interface UploadApiResponse {
  success: boolean;
  documentId?: string;
  extractedText?: string;
  error?: string;
}

// Currency patterns for extraction
export const CURRENCY_PATTERNS = {
  KGS: {
    symbols: ['сом', 'som', 'KGS', 'сом.'],
    name: 'Кыргызский сом',
    regex: /(?:\d[\d\s]*(?:\.\d+)?)\s*(?:сом|som|KGS)/gi
  },
  RUB: {
    symbols: ['₽', 'руб', 'рубл', 'RUB', 'руб.'],
    name: 'Российский рубль',
    regex: /(?:\d[\d\s]*(?:\.\d+)?)\s*(?:₽|руб|рубл|RUB)/gi
  },
  USD: {
    symbols: ['$', 'USD', 'долл', 'dollar'],
    name: 'Доллар США',
    regex: /(?:\$\s*)?(?:\d[\d\s]*(?:\.\d+)?)\s*(?:\$|USD|долл|dollar)/gi
  },
  EUR: {
    symbols: ['€', 'EUR', 'евро', 'euro'],
    name: 'Евро',
    regex: /(?:€\s*)?(?:\d[\d\s]*(?:\.\d+)?)\s*(?:€|EUR|евро|euro)/gi
  },
  KZT: {
    symbols: ['₸', 'тенге', 'KZT', 'тг'],
    name: 'Казахский тенге',
    regex: /(?:\d[\d\s]*(?:\.\d+)?)\s*(?:₸|тенге|KZT|тг)/gi
  },
  UZS: {
    symbols: ['сум', 'UZS', 'soum'],
    name: 'Узбекский сум',
    regex: /(?:\d[\d\s]*(?:\.\d+)?)\s*(?:сум|UZS|soum)/gi
  },
  TJS: {
    symbols: ['сомони', 'TJS', 'somoni'],
    name: 'Таджикский сомони',
    regex: /(?:\d[\d\s]*(?:\.\d+)?)\s*(?:сомони|TJS|somoni)/gi
  },
  UAH: {
    symbols: ['₴', 'грн', 'UAH', 'гривна'],
    name: 'Украинская гривна',
    regex: /(?:\d[\d\s]*(?:\.\d+)?)\s*(?:₴|грн|UAH|гривна)/gi
  }
} as const;

// Section templates for analysis
export const ANALYSIS_SECTIONS_CONFIG = {
  budget: {
    title: 'Бюджетный анализ',
    weight: 0.15,
    minWords: 200,
    focusAreas: ['cost_breakdown', 'value_for_money', 'payment_terms', 'currency_analysis']
  },
  timeline: {
    title: 'Временные рамки',
    weight: 0.12,
    minWords: 180,
    focusAreas: ['project_phases', 'milestones', 'delivery_schedule', 'timeline_realism']
  },
  technical: {
    title: 'Техническое решение',
    weight: 0.15,
    minWords: 220,
    focusAreas: ['technology_stack', 'architecture', 'scalability', 'performance']
  },
  team: {
    title: 'Команда и экспертиза',
    weight: 0.10,
    minWords: 160,
    focusAreas: ['team_composition', 'expertise', 'experience', 'certifications']
  },
  functional: {
    title: 'Функциональные требования',
    weight: 0.13,
    minWords: 200,
    focusAreas: ['feature_coverage', 'user_experience', 'business_logic', 'integration']
  },
  security: {
    title: 'Безопасность',
    weight: 0.08,
    minWords: 150,
    focusAreas: ['data_protection', 'authentication', 'compliance', 'risk_mitigation']
  },
  methodology: {
    title: 'Методология разработки',
    weight: 0.10,
    minWords: 170,
    focusAreas: ['development_process', 'quality_assurance', 'project_management', 'communication']
  },
  scalability: {
    title: 'Масштабируемость',
    weight: 0.07,
    minWords: 140,
    focusAreas: ['performance_scaling', 'infrastructure', 'future_growth', 'maintenance']
  },
  communication: {
    title: 'Коммуникация и поддержка',
    weight: 0.05,
    minWords: 120,
    focusAreas: ['communication_plan', 'reporting', 'support_model', 'documentation']
  },
  value: {
    title: 'Ценностное предложение',
    weight: 0.05,
    minWords: 160,
    focusAreas: ['unique_value', 'competitive_advantage', 'roi', 'business_impact']
  }
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