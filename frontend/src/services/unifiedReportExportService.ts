/**
 * Unified Report Export Service - единый интерфейс для экспорта отчетов
 * Управляет PDF и Excel экспортом для КП анализатора
 * DevAssist Pro
 */

import { pdfExportService, PDFExportService } from './pdfExportService';
import { reactPdfExportService, ReactPDFExportService } from './reactPdfExportService';
import { excelExportService, ExcelExportService } from './excelExportService';
import { reportService, ComprehensiveReport, VisualizationData } from './reportService';
import { KPAnalysisResult } from '../types/kpAnalyzer';
import { 
  PDFExportOptions, 
  PDFExportResult, 
  PDFGenerationProgress,
  AnalysisResult as PDFAnalysisResult,
  ComparisonResult as PDFComparisonResult 
} from '../types/pdfExport';
import { 
  ExcelExportOptions, 
  ExcelExportResult, 
  ExcelGenerationProgress 
} from './excelExportService';

export type ExportFormat = 'pdf' | 'excel' | 'both';
export type PDFEngine = 'jspdf' | 'react-pdf';

export interface UnifiedExportOptions {
  format: ExportFormat;
  pdfEngine?: PDFEngine;
  pdfOptions?: Partial<PDFExportOptions>;
  excelOptions?: Partial<ExcelExportOptions>;
  generateReport?: boolean; // Генерировать ли комплексный отчет или экспортировать только данные
}

export interface UnifiedExportResult {
  format: ExportFormat;
  pdf?: PDFExportResult;
  excel?: ExcelExportResult;
  success: boolean;
  errors?: string[];
  totalProcessingTime: number;
}

export interface UnifiedExportProgress {
  format: ExportFormat;
  stage: 'initializing' | 'generating_report' | 'exporting_pdf' | 'exporting_excel' | 'complete';
  overallProgress: number;
  message: string;
  pdfProgress?: PDFGenerationProgress;
  excelProgress?: ExcelGenerationProgress;
  errors?: string[];
}

export const DEFAULT_UNIFIED_OPTIONS: UnifiedExportOptions = {
  format: 'both',
  pdfEngine: 'jspdf',
  generateReport: true,
  pdfOptions: {
    format: 'A4',
    orientation: 'portrait',
    includeExecutiveSummary: true,
    includeDetailedAnalysis: true,
    includeAppendices: true,
    customTitle: 'Отчет по анализу коммерческих предложений'
  },
  excelOptions: {
    includeCharts: true,
    includeRawData: true,
    includeComparison: true,
    includeSummary: true,
    customTitle: 'Отчет по анализу коммерческих предложений'
  }
};

export class UnifiedReportExportService {
  private progressCallback?: (progress: UnifiedExportProgress) => void;
  private currentProgress: UnifiedExportProgress = {
    format: 'both',
    stage: 'initializing',
    overallProgress: 0,
    message: 'Инициализация...',
  };

  /**
   * Установка callback для отслеживания прогресса
   */
  public setProgressCallback(callback: (progress: UnifiedExportProgress) => void): void {
    this.progressCallback = callback;
  }

  /**
   * Обновление общего прогресса
   */
  private updateProgress(
    stage: UnifiedExportProgress['stage'], 
    overallProgress: number, 
    message: string, 
    pdfProgress?: PDFGenerationProgress,
    excelProgress?: ExcelGenerationProgress
  ): void {
    this.currentProgress = {
      ...this.currentProgress,
      stage,
      overallProgress: Math.min(100, Math.max(0, overallProgress)),
      message,
      pdfProgress,
      excelProgress,
    };

    if (this.progressCallback) {
      this.progressCallback(this.currentProgress);
    }
  }

  /**
   * Основной метод экспорта - принимает результаты КП анализа
   */
  public async exportAnalysisResults(
    analysisResults: KPAnalysisResult[],
    tzName: string,
    options: Partial<UnifiedExportOptions> = {}
  ): Promise<UnifiedExportResult> {
    const startTime = performance.now();
    const fullOptions = { ...DEFAULT_UNIFIED_OPTIONS, ...options };
    
    try {
      this.updateProgress('initializing', 0, 'Подготовка к экспорту...');
      
      let comprehensiveReport: ComprehensiveReport | null = null;
      let visualizationData: VisualizationData | null = null;

      // Генерируем комплексный отчет если нужно
      if (fullOptions.generateReport) {
        this.updateProgress('generating_report', 10, 'Генерация комплексного отчета...');
        comprehensiveReport = await reportService.generateComprehensiveReport(
          tzName, 
          analysisResults, 
          'gpt-4o'
        );
        visualizationData = reportService.generateVisualizationData(analysisResults);
      }

      const results: UnifiedExportResult = {
        format: fullOptions.format,
        success: true,
        errors: [],
        totalProcessingTime: 0
      };

      // Экспорт PDF
      if (fullOptions.format === 'pdf' || fullOptions.format === 'both') {
        try {
          this.updateProgress('exporting_pdf', 30, 'Экспорт в PDF...');
          
          if (comprehensiveReport) {
            results.pdf = await this.exportToPDF(
              comprehensiveReport, 
              fullOptions.pdfEngine || 'jspdf',
              fullOptions.pdfOptions
            );
          } else {
            results.pdf = await this.exportSimplePDF(
              analysisResults,
              fullOptions.pdfEngine || 'jspdf',
              fullOptions.pdfOptions
            );
          }
        } catch (error) {
          console.error('PDF export failed:', error);
          results.errors?.push(`Ошибка экспорта PDF: ${error.message}`);
        }
      }

      // Экспорт Excel
      if (fullOptions.format === 'excel' || fullOptions.format === 'both') {
        try {
          this.updateProgress('exporting_excel', 70, 'Экспорт в Excel...');
          
          if (comprehensiveReport && visualizationData) {
            results.excel = await excelExportService.exportComprehensiveReport(
              comprehensiveReport,
              visualizationData,
              fullOptions.excelOptions
            );
          } else {
            results.excel = await excelExportService.exportSimpleAnalysis(
              analysisResults,
              fullOptions.excelOptions
            );
          }
        } catch (error) {
          console.error('Excel export failed:', error);
          results.errors?.push(`Ошибка экспорта Excel: ${error.message}`);
        }
      }

      results.totalProcessingTime = performance.now() - startTime;
      results.success = (results.errors?.length || 0) === 0;

      this.updateProgress('complete', 100, 'Экспорт завершен!');

      return results;

    } catch (error) {
      console.error('Unified export failed:', error);
      return {
        format: fullOptions.format,
        success: false,
        errors: [error.message || 'Неизвестная ошибка экспорта'],
        totalProcessingTime: performance.now() - startTime
      };
    }
  }

  /**
   * Экспорт в PDF с комплексным отчетом
   */
  private async exportToPDF(
    report: ComprehensiveReport,
    engine: PDFEngine,
    options?: Partial<PDFExportOptions>
  ): Promise<PDFExportResult> {
    // Конвертируем данные для PDF экспорта
    const pdfResults: PDFAnalysisResult[] = report.analysis_results.map(result => ({
      id: result.id,
      companyName: result.extractedData?.companyName || 'Неизвестная компания',
      fileName: result.kpFileName,
      analyzedAt: result.analyzedAt,
      model: result.model,
      overallRating: result.score,
      strengths: result.analysis.recommendations.slice(0, 3), // Используем рекомендации как сильные стороны
      weaknesses: [], // Можно добавить логику для выявления слабых сторон
      riskLevel: result.score >= 80 ? 'low' : result.score >= 60 ? 'medium' : 'high'
    }));

    const comparison: PDFComparisonResult = {
      summary: report.executive_summary,
      recommendations: report.recommendations,
      bestProposal: report.best_proposal ? {
        id: report.best_proposal.id,
        companyName: report.best_proposal.extractedData?.companyName || 'Неизвестная компания',
        score: report.best_proposal.score,
        reasons: ['Высший балл среди всех предложений']
      } : undefined
    };

    if (engine === 'react-pdf') {
      return await reactPdfExportService.exportComparison(pdfResults, comparison, options);
    } else {
      return await pdfExportService.exportComparison(pdfResults, comparison, options);
    }
  }

  /**
   * Простой экспорт в PDF без комплексного отчета
   */
  private async exportSimplePDF(
    analysisResults: KPAnalysisResult[],
    engine: PDFEngine,
    options?: Partial<PDFExportOptions>
  ): Promise<PDFExportResult> {
    const pdfResults: PDFAnalysisResult[] = analysisResults.map(result => ({
      id: result.id,
      companyName: result.extractedData?.companyName || 'Неизвестная компания',
      fileName: result.kpFileName,
      analyzedAt: result.analyzedAt,
      model: result.model,
      overallRating: result.score,
      strengths: result.analysis.recommendations.slice(0, 3),
      weaknesses: [],
      riskLevel: result.score >= 80 ? 'low' : result.score >= 60 ? 'medium' : 'high'
    }));

    // Простое сравнение
    const bestResult = analysisResults.reduce((best, current) => 
      current.score > best.score ? current : best
    );

    const comparison: PDFComparisonResult = {
      summary: `Проанализировано ${analysisResults.length} коммерческих предложений. Лучший результат: ${bestResult.kpFileName} (${bestResult.score}%).`,
      recommendations: [`Рекомендуется ${bestResult.kpFileName} как лучшее предложение`],
      bestProposal: {
        id: bestResult.id,
        companyName: bestResult.extractedData?.companyName || 'Неизвестная компания',
        score: bestResult.score,
        reasons: ['Высший балл среди всех предложений']
      }
    };

    if (engine === 'react-pdf') {
      return await reactPdfExportService.exportComparison(pdfResults, comparison, options);
    } else {
      return await pdfExportService.exportComparison(pdfResults, comparison, options);
    }
  }

  /**
   * Автоматическая загрузка файлов
   */
  public async downloadResults(result: UnifiedExportResult): Promise<void> {
    if (result.pdf) {
      pdfExportService.downloadPDF(result.pdf.blob, result.pdf.filename);
    }

    if (result.excel) {
      // Небольшая задержка между загрузками, чтобы браузер не блокировал
      if (result.pdf) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      excelExportService.downloadExcel(result.excel.blob, result.excel.filename);
    }
  }

  /**
   * Получение информации о размерах файлов
   */
  public getFilesInfo(result: UnifiedExportResult): { pdf?: string; excel?: string; total: string } {
    const formatSize = (bytes: number): string => {
      if (bytes === 0) return '0 Bytes';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const info: { pdf?: string; excel?: string; total: string } = {
      total: '0 Bytes'
    };

    let totalSize = 0;

    if (result.pdf) {
      info.pdf = formatSize(result.pdf.size);
      totalSize += result.pdf.size;
    }

    if (result.excel) {
      info.excel = formatSize(result.excel.size);
      totalSize += result.excel.size;
    }

    info.total = formatSize(totalSize);

    return info;
  }

  /**
   * Валидация возможности экспорта
   */
  public validateExportCapability(): { canExportPDF: boolean; canExportExcel: boolean; errors: string[] } {
    const errors: string[] = [];
    let canExportPDF = true;
    let canExportExcel = true;

    // Проверка PDF возможностей
    try {
      if (typeof window === 'undefined') {
        canExportPDF = false;
        errors.push('PDF экспорт недоступен в серверной среде');
      }
    } catch (error) {
      canExportPDF = false;
      errors.push('Ошибка инициализации PDF библиотеки');
    }

    // Проверка Excel возможностей
    try {
      if (typeof ExcelJS === 'undefined') {
        canExportExcel = false;
        errors.push('Excel библиотека не загружена');
      }
    } catch (error) {
      canExportExcel = false;
      errors.push('Ошибка инициализации Excel библиотеки');
    }

    return { canExportPDF, canExportExcel, errors };
  }
}

// Экспорт singleton instance
export const unifiedReportExportService = new UnifiedReportExportService();