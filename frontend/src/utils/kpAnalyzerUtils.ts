import { KPAnalysisResult, AnalysisResult } from '../types/kpAnalyzer';

/**
 * Конвертирует AnalysisResult в KPAnalysisResult для обратной совместимости
 */
export function convertAnalysisResultToKPResult(result: AnalysisResult): KPAnalysisResult {
  return {
    id: result.id,
    fileName: result.kpId || 'Неизвестный файл',
    kpFileName: result.kpId || 'Неизвестный файл',
    companyName: result.companyName || 'Неизвестная компания',
    complianceScore: result.complianceScore || 0,
    score: result.complianceScore || 0,
    strengths: result.strengths || [],
    weaknesses: result.weaknesses || [],
    missingRequirements: result.missingRequirements || [],
    additionalFeatures: result.additionalFeatures || [],
    analysisDate: result.analyzedAt || new Date().toISOString(),
    timestamp: result.analyzedAt ? new Date(result.analyzedAt) : new Date(),
    status: result.status || 'completed',
    
    // Заполняем analysis объект для старых компонентов
    analysis: {
      compliance: result.complianceScore || 0,
      technical: result.technicalRating || 0,
      commercial: result.financialRating || 0,
      experience: result.overallRating || 0,
      timeline: result.timelineRating || 0,
      strengths: result.strengths || [],
      weaknesses: result.weaknesses || [],
      recommendations: result.recommendations || [],
      detailedAnalysis: result.detailedAnalysis || ''
    },
    
    // Заполняем extractedData для старых компонентов
    extractedData: {
      company_name: result.companyName || '',
      tech_stack: '',
      pricing: '',
      timeline: '',
      experience: '',
      approach: result.detailedAnalysis || '',
      team_structure: '',
      guarantees: '',
      risks: result.risks?.join('; ') || '',
      additional_services: result.additionalFeatures?.join('; ') || ''
    }
  };
}

/**
 * Получает значение поля с поддержкой обратной совместимости
 */
export function getKPResultField<T>(
  result: KPAnalysisResult, 
  newField: keyof KPAnalysisResult, 
  oldField?: keyof KPAnalysisResult,
  defaultValue?: T
): T {
  const newValue = result[newField];
  if (newValue !== undefined) return newValue as T;
  
  if (oldField) {
    const oldValue = result[oldField];
    if (oldValue !== undefined) return oldValue as T;
  }
  
  return defaultValue as T;
}

/**
 * Получает название файла с поддержкой обратной совместимости
 */
export function getFileName(result: KPAnalysisResult): string {
  return getKPResultField(result, 'fileName', 'kpFileName', 'Неизвестный файл');
}

/**
 * Получает название компании с поддержкой обратной совместимости
 */
export function getCompanyName(result: KPAnalysisResult): string {
  return getKPResultField(result, 'companyName', undefined, 'Неизвестная компания');
}

/**
 * Получает оценку соответствия с поддержкой обратной совместимости
 */
export function getComplianceScore(result: KPAnalysisResult): number {
  return getKPResultField(result, 'complianceScore', 'score', 0);
}

/**
 * Получает сильные стороны с поддержкой обратной совместимости
 */
export function getStrengths(result: KPAnalysisResult): string[] {
  const direct = getKPResultField(result, 'strengths', undefined, []);
  if (direct.length > 0) return direct;
  
  return result.analysis?.strengths || [];
}

/**
 * Получает слабые стороны с поддержкой обратной совместимости
 */
export function getWeaknesses(result: KPAnalysisResult): string[] {
  const direct = getKPResultField(result, 'weaknesses', undefined, []);
  if (direct.length > 0) return direct;
  
  return result.analysis?.weaknesses || [];
}

/**
 * Получает недостающие требования с поддержкой обратной совместимости
 */
export function getMissingRequirements(result: KPAnalysisResult): string[] {
  return getKPResultField(result, 'missingRequirements', undefined, []);
}

/**
 * Получает дополнительные возможности с поддержкой обратной совместимости  
 */
export function getAdditionalFeatures(result: KPAnalysisResult): string[] {
  return getKPResultField(result, 'additionalFeatures', undefined, []);
}

/**
 * Получает анализ с поддержкой обратной совместимости
 */
export function getAnalysis(result: KPAnalysisResult) {
  return result.analysis || {
    compliance: 0,
    technical: 0,
    commercial: 0,
    experience: 0,
    timeline: 0,
    strengths: [],
    weaknesses: [],
    recommendations: [],
    detailedAnalysis: ''
  };
}

/**
 * Получает извлеченные данные с поддержкой обратной совместимости
 */
export function getExtractedData(result: KPAnalysisResult) {
  return result.extractedData || {
    company_name: '',
    tech_stack: '',
    pricing: '',
    timeline: '',
    experience: '',
    approach: '',
    team_structure: '',
    guarantees: '',
    risks: '',
    additional_services: ''
  };
}

/**
 * Создает пустой результат анализа КП
 */
export function createEmptyKPResult(id: string): KPAnalysisResult {
  return {
    id,
    fileName: 'Новый анализ',
    companyName: 'Не указано',
    complianceScore: 0,
    score: 0,
    strengths: [],
    weaknesses: [],
    missingRequirements: [],
    additionalFeatures: [],
    analysisDate: new Date().toISOString(),
    timestamp: new Date(),
    status: 'pending',
    analysis: {
      compliance: 0,
      technical: 0,
      commercial: 0,
      experience: 0,
      timeline: 0,
      strengths: [],
      weaknesses: [],
      recommendations: [],
      detailedAnalysis: ''
    },
    extractedData: {
      company_name: '',
      tech_stack: '',
      pricing: '',
      timeline: '',
      experience: '',
      approach: '',
      team_structure: '',
      guarantees: '',
      risks: '',
      additional_services: ''
    }
  };
}