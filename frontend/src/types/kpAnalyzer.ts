/**
 * Типы для КП Анализатора
 * Согласно ТЗ DevAssist Pro
 */

export interface Document {
  id: string;
  name: string;
  size: number;
  type: 'pdf' | 'docx';
  uploadedAt: string;
  content?: string;
  status: 'uploading' | 'processing' | 'ready' | 'error';
  error?: string;
}

export interface TechnicalSpecification extends Document {
  role: 'tz';
  title: string;
  content: string;
  criteria?: string[];
  requirements?: string[];
}

export interface CommercialProposal extends Document {
  role: 'kp';
  title: string;
  content: string;
  companyName?: string;
  contactInfo?: {
    email?: string;
    phone?: string;
    address?: string;
  };
  pricing?: {
    totalCost?: number;
    currency?: string;
    breakdown?: Array<{
      item: string;
      cost: number;
      unit?: string;
    }>;
  };
  technicalData?: {
    specifications?: string[];
    equipment?: string[];
    timeline?: string;
  };
}

export interface AnalysisResult {
  id: string;
  kpId: string;
  tzId?: string;
  status?: 'pending' | 'analyzing' | 'completed' | 'error';
  createdAt?: string;
  completedAt?: string;
  aiModel?: string;
  
  // Результаты анализа
  companyName: string;
  complianceScore: number; // 0-100
  strengths: string[];
  weaknesses: string[];
  missingRequirements: string[];
  additionalFeatures: string[];
  technicalRating: number;
  financialRating: number;
  timelineRating: number;
  overallRating: number;
  recommendations: string[];
  risks: string[];
  detailedAnalysis: string;
  analyzedAt: string;
  model: string;
  
  criteriaAnalysis?: Array<{
    criterion: string;
    score: number;
    comment: string;
    met: boolean;
  }>;
  
  summary?: {
    overallRating: 'excellent' | 'good' | 'satisfactory' | 'poor';
    keyFindings: string[];
    riskLevel: 'low' | 'medium' | 'high';
  };
  
  error?: string;
}

export interface ComparisonResult {
  id: string;
  tzId?: string;
  kpIds?: string[];
  results?: AnalysisResult[];
  createdAt?: string;
  
  summary: string;
  ranking: Array<{
    kpId: string;
    rank: number;
    totalScore: number;
    summary: string;
  }>;
  recommendations: string[];
  riskAssessment: string;
  bestChoice: string;
  comparisonMatrix: any[];
  analyzedAt: string;
  model: string;
  
  criteriaComparison?: Array<{
    criterion: string;
    scores: Record<string, number>; // kpId -> score
  }>;
  
  recommendation?: {
    winner: string;
    reasoning: string;
    alternatives: string[];
  };
}

export interface AIModelConfig {
  id: string;
  name: string;
  provider: 'openai' | 'anthropic' | 'google';
  model: string;
  temperature: number;
  maxTokens: number;
  available: boolean;
}

export interface AnalysisProgress {
  stage: 'upload' | 'processing' | 'analysis' | 'comparison' | 'completed';
  progress: number; // 0-100
  currentTask: string;
  estimatedTimeRemaining?: number;
}

export interface KPAnalyzerState {
  // Документы
  technicalSpec: TechnicalSpecification | null;
  commercialProposals: CommercialProposal[];
  
  // Настройки анализа
  selectedModels: {
    analysis: string;
    comparison: string;
  };
  
  // Результаты
  analysisResults: AnalysisResult[];
  comparisonResult: ComparisonResult | null;
  
  // UI состояние
  currentStep: 'upload' | 'configure' | 'analyze' | 'analysis' | 'results';
  isProcessing: boolean;
  progress: AnalysisProgress | null;
  error: string | null;
}

export interface UploadedFile {
  file: File;
  id: string;
  role: 'tz' | 'kp';
  progress: number;
  status: 'pending' | 'uploading' | 'processing' | 'completed' | 'error';
  error?: string;
}

// API типы
export interface StartAnalysisRequest {
  tzId: string;
  kpIds: string[];
  analysisModel: string;
  comparisonModel: string;
  criteria?: string[];
}

export interface StartAnalysisResponse {
  analysisId: string;
  estimatedDuration: number;
}

export interface AnalysisStatusResponse {
  status: 'pending' | 'processing' | 'completed' | 'error';
  progress: number;
  currentTask: string;
  results?: AnalysisResult[];
  comparison?: ComparisonResult;
  error?: string;
}

// Дополнительные типы для совместимости с AI сервисом
export interface KPSummaryData {
  company_name: string;
  tech_stack: string;
  pricing: string;
  timeline: string;
  experience?: string;
  approach?: string;
  team_structure?: string;
  guarantees?: string;
  risks?: string;
  additional_services?: string;
}

export interface ComparisonAIResult {
  overall_score: number;
  compliance_percentage: number;
  technical_score: number;
  commercial_score: number;
  experience_score: number;
  timeline_score: number;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  detailed_analysis: string;
}

export interface RecommendationResult {
  executive_summary: string;
  detailed_comparison: string;
  risk_analysis: string;
  final_recommendation: string;
  recommended_vendor: string;
  confidence_level: string;
}

export interface KPAnalysisResult {
  id: string;
  fileName?: string;
  kpFileName?: string; // Backward compatibility
  companyName?: string;
  complianceScore?: number;
  score?: number; // Backward compatibility
  strengths?: string[];
  weaknesses?: string[];
  missingRequirements?: string[];
  additionalFeatures?: string[];
  techStack?: string;
  pricing?: string;
  timeline?: string;
  approach?: string;
  paymentModel?: string;
  currency?: string;
  phases?: string;
  architecture?: string;
  analysisDate?: string;
  timestamp?: Date; // Backward compatibility
  status?: 'pending' | 'analyzing' | 'completed' | 'error';
  
  // Backward compatibility with old interface
  extractedData?: KPSummaryData;
  analysis?: {
    compliance: number;
    technical: number;
    commercial: number;
    experience: number;
    timeline?: number;
    strengths: string[];
    weaknesses: string[];
    recommendations: string[];
    detailedAnalysis: string;
  };
}

export interface KPAnalysisProgress {
  currentKP: string;
  progress: number;
  totalKPs: number;
  completedKPs: number;
  isAnalyzing: boolean;
}

// Types for realKpAnalysisService
export interface RealKPSummaryData {
  company_name: string;
  tech_stack: string;
  pricing: string;
  timeline: string;
  team_size?: string;
  experience?: string;
  key_features?: string[];
  contact_info?: string;
}

export interface RealComparisonResult {
  compliance_score: number;
  sections?: Array<{
    name: string;
    compliance: number;
    details: string;
  }>;
  missing_requirements?: string[];
  additional_features?: string[];
  risks?: string[];
  advantages?: string[];
  overall_assessment?: string;
  strengths?: string[];
  weaknesses?: string[];
  recommendation?: 'accept' | 'conditional' | 'reject';
}

export interface RealAnalysisResult {
  id: string;
  tz_name: string;
  kp_name: string;
  company_name: string;
  tech_stack: string;
  pricing: string;
  timeline: string;
  summary: RealKPSummaryData;
  comparison: RealComparisonResult;
  recommendation: string;
  created_at: string;
  model_used: string;
  confidence_score: number;
}

export interface RealKPAnalysisProgress {
  stage: 'extracting' | 'analyzing' | 'comparing' | 'generating' | 'completed';
  message: string;
  progress: number;
}