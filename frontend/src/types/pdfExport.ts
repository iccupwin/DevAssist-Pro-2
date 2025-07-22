/**
 * Типы данных для PDF экспорта результатов анализа КП
 * DevAssist Pro
 */

// Основные интерфейсы для результатов анализа
export interface AnalysisResult {
  id: string;
  companyName: string;
  complianceScore: number; // 0-100
  technicalRating: number;
  financialRating: number;
  timelineRating: number;
  overallRating: number;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  detailedAnalysis: string;
  analyzedAt: string;
  model: string;
  fileName?: string;
  pricing?: number;
  timeline?: string;
}

export interface ComparisonResult {
  summary: string;
  ranking: Array<{
    kpId: string;
    rank: number;
    totalScore: number;
    summary: string;
  }>;
  recommendations: string[];
  bestChoice: string;
  analyzedAt: string;
}

// Настройки экспорта PDF
export interface PDFExportOptions {
  format: 'A4' | 'A3' | 'Letter';
  orientation: 'portrait' | 'landscape';
  includeCharts: boolean;
  includeDetailedAnalysis: boolean;
  includeAppendices: boolean;
  includeExecutiveSummary: boolean;
  logoUrl?: string;
  watermark?: string;
  companyName?: string;
  projectName?: string;
  customTitle?: string;
}

// Шаблоны отчетов
export type PDFReportTemplate = 'brief' | 'detailed' | 'executive' | 'react-pdf';

export interface PDFTemplateConfig {
  template: PDFReportTemplate;
  title: string;
  description: string;
  sections: {
    titlePage: boolean;
    summary: boolean;
    comparison: boolean;
    detailedAnalysis: boolean;
    charts: boolean;
    appendices: boolean;
  };
}

// Настройки внешнего вида
export interface PDFStylingOptions {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  fontFamily: 'Helvetica' | 'Arial' | 'Times';
  fontSize: {
    title: number;
    heading: number;
    body: number;
    caption: number;
  };
  margins: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  lineHeight: number;
  showPageNumbers: boolean;
  showWatermark: boolean;
}

// Прогресс генерации PDF
export interface PDFGenerationProgress {
  stage: 'initializing' | 'processing' | 'rendering' | 'finalizing' | 'complete';
  progress: number; // 0-100
  message: string;
  currentSection?: string;
  errors?: string[];
}

// Результат генерации PDF
export interface PDFExportResult {
  blob: Blob;
  filename: string;
  size: number;
  pages: number;
  generatedAt: string;
  metadata: {
    options: PDFExportOptions;
    analysisCount: number;
    template: PDFReportTemplate;
    processingTime: number;
  };
}

// Ошибки экспорта
export type PDFExportError = 
  | 'NO_DATA'
  | 'INVALID_OPTIONS'
  | 'GENERATION_FAILED'
  | 'FILE_TOO_LARGE'
  | 'BROWSER_NOT_SUPPORTED'
  | 'NETWORK_ERROR';

export interface PDFExportException extends Error {
  code: PDFExportError;
  details?: any;
  recoverable?: boolean;
}

// Конфигурация для отдельных секций
export interface PDFSectionConfig {
  enabled: boolean;
  title: string;
  order: number;
  pageBreakBefore?: boolean;
  pageBreakAfter?: boolean;
}

export interface PDFDocumentStructure {
  titlePage: PDFSectionConfig;
  executiveSummary: PDFSectionConfig;
  methodology: PDFSectionConfig;
  overallComparison: PDFSectionConfig;
  detailedAnalysis: PDFSectionConfig;
  recommendations: PDFSectionConfig;
  riskAnalysis: PDFSectionConfig;
  appendices: PDFSectionConfig;
}

// Метаданные документа
export interface PDFMetadata {
  title: string;
  author: string;
  subject: string;
  keywords: string[];
  creator: string;
  producer: string;
  creationDate: Date;
  modificationDate: Date;
}

// Настройки таблиц и диаграмм
export interface PDFTableConfig {
  showHeaders: boolean;
  alternateRowColors: boolean;
  headerBackgroundColor: string;
  headerTextColor: string;
  borderColor: string;
  borderWidth: number;
  cellPadding: number;
}

export interface PDFChartConfig {
  width: number;
  height: number;
  showLegend: boolean;
  showDataLabels: boolean;
  colorScheme: string[];
  backgroundColor: string;
}

// Константы для шаблонов
export const PDF_TEMPLATES: Record<PDFReportTemplate, PDFTemplateConfig> = {
  brief: {
    template: 'brief',
    title: 'Краткий отчет',
    description: 'Сводка и основные результаты анализа',
    sections: {
      titlePage: true,
      summary: true,
      comparison: true,
      detailedAnalysis: false,
      charts: true,
      appendices: false,
    },
  },
  detailed: {
    template: 'detailed',
    title: 'Подробный отчет',
    description: 'Полный анализ всех коммерческих предложений',
    sections: {
      titlePage: true,
      summary: true,
      comparison: true,
      detailedAnalysis: true,
      charts: true,
      appendices: true,
    },
  },
  executive: {
    template: 'executive',
    title: 'Исполнительный отчет',
    description: 'Отчет для руководства с ключевыми решениями',
    sections: {
      titlePage: true,
      summary: true,
      comparison: true,
      detailedAnalysis: false,
      charts: false,
      appendices: false,
    },
  },
  'react-pdf': {
    template: 'react-pdf',
    title: 'React-PDF отчет',
    description: 'Отчет с полной поддержкой кириллицы',
    sections: {
      titlePage: true,
      summary: true,
      comparison: true,
      detailedAnalysis: true,
      charts: false,
      appendices: true,
    },
  },
};

// Настройки по умолчанию
export const DEFAULT_PDF_OPTIONS: PDFExportOptions = {
  format: 'A4',
  orientation: 'portrait',
  includeCharts: true,
  includeDetailedAnalysis: true,
  includeAppendices: true,
  includeExecutiveSummary: true,
  companyName: 'DevAssist Pro',
  projectName: 'Анализ коммерческих предложений',
};

export const DEFAULT_STYLING_OPTIONS: PDFStylingOptions = {
  primaryColor: '#2563eb',
  secondaryColor: '#6b7280',
  accentColor: '#059669',
  fontFamily: 'Helvetica',
  fontSize: {
    title: 24,
    heading: 16,
    body: 12,
    caption: 10,
  },
  margins: {
    top: 30,
    right: 25,
    bottom: 40,
    left: 25,
  },
  lineHeight: 1.5,
  showPageNumbers: true,
  showWatermark: false,
};