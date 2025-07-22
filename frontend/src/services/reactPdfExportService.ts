/**
 * React-PDF Export Service для генерации отчетов анализа КП
 * DevAssist Pro
 */

import { generatePDFSafe } from '../components/pdf/PDFReportSafe';
import {
  AnalysisResult,
  ComparisonResult,
  PDFExportOptions,
  PDFExportResult,
  PDFGenerationProgress,
  PDFExportException,
  PDFExportError,
  DEFAULT_PDF_OPTIONS,
} from '../types/pdfExport';

export class ReactPDFExportService {
  private progressCallback?: (progress: PDFGenerationProgress) => void;
  private currentProgress: PDFGenerationProgress = {
    stage: 'initializing',
    progress: 0,
    message: 'Инициализация...',
  };

  /**
   * Установка callback для отслеживания прогресса
   */
  public setProgressCallback(callback: (progress: PDFGenerationProgress) => void): void {
    this.progressCallback = callback;
  }

  /**
   * Обновление прогресса генерации
   */
  private updateProgress(stage: PDFGenerationProgress['stage'], progress: number, message: string, currentSection?: string): void {
    this.currentProgress = {
      stage,
      progress: Math.min(100, Math.max(0, progress)),
      message,
      currentSection,
      errors: this.currentProgress.errors,
    };

    if (this.progressCallback) {
      this.progressCallback(this.currentProgress);
    }
  }

  /**
   * Экспорт сравнительного анализа нескольких КП
   */
  public async exportComparison(
    results: AnalysisResult[],
    comparison: ComparisonResult,
    options: Partial<PDFExportOptions> = {}
  ): Promise<PDFExportResult> {
    const startTime = performance.now();
    
    try {
      this.updateProgress('initializing', 0, 'Подготовка сравнительного анализа...');
      
      const fullOptions = { ...DEFAULT_PDF_OPTIONS, ...options };
      
      this.validateOptions(fullOptions);
      this.validateAnalysisResults(results);

      this.updateProgress('processing', 10, 'Создание PDF документа...');
      
      // Генерируем PDF с помощью React-PDF (безопасная версия с транслитерацией)
      this.updateProgress('rendering', 30, 'Рендеринг страниц...');
      
      const blob = await generatePDFSafe(results, comparison, fullOptions);
      
      this.updateProgress('finalizing', 90, 'Финализация документа...');
      
      const processingTime = performance.now() - startTime;
      
      this.updateProgress('complete', 100, 'Сравнительный анализ готов!');

      return {
        blob,
        filename: this.generateFilename(fullOptions, results),
        size: blob.size,
        pages: this.estimatePageCount(results, fullOptions),
        generatedAt: new Date().toISOString(),
        metadata: {
          options: fullOptions,
          analysisCount: results.length,
          template: 'react-pdf',
          processingTime,
        },
      };

    } catch (error) {
      this.handleExportError(error);
      throw error;
    }
  }

  /**
   * Экспорт одного результата анализа
   */
  public async exportSingle(
    result: AnalysisResult,
    options: Partial<PDFExportOptions> = {}
  ): Promise<PDFExportResult> {
    return this.exportComparison([result], undefined as any, options);
  }

  /**
   * Оценка количества страниц (приблизительно)
   */
  private estimatePageCount(results: AnalysisResult[], options: PDFExportOptions): number {
    let pages = 1; // Титульная страница
    
    if (options.includeExecutiveSummary) {
      pages += 1;
    }
    
    if (options.includeDetailedAnalysis) {
      pages += results.length; // По странице на каждый КП
    }
    
    if (options.includeAppendices) {
      pages += 1;
    }
    
    return pages;
  }

  /**
   * Генерация имени файла
   */
  private generateFilename(options: PDFExportOptions, results: AnalysisResult[]): string {
    const date = new Date().toISOString().slice(0, 10);
    const projectName = (options.projectName || 'KP-Analysis').replace(/[^a-zA-Z0-9а-яА-Я]/g, '-');
    const count = results.length;
    
    return `${projectName}-${count}КП-${date}.pdf`;
  }

  /**
   * Валидация настроек экспорта
   */
  private validateOptions(options: PDFExportOptions): void {
    if (!options.format || !['A4', 'A3', 'Letter'].includes(options.format)) {
      throw this.createExportError('INVALID_OPTIONS', 'Неверный формат документа');
    }
    
    if (!options.orientation || !['portrait', 'landscape'].includes(options.orientation)) {
      throw this.createExportError('INVALID_OPTIONS', 'Неверная ориентация документа');
    }
  }

  /**
   * Валидация результатов анализа
   */
  private validateAnalysisResults(results: AnalysisResult[]): void {
    if (!results || results.length === 0) {
      throw this.createExportError('NO_DATA', 'Отсутствуют результаты анализа для экспорта');
    }
    
    for (const result of results) {
      if (!result.id || !result.companyName) {
        throw this.createExportError('INVALID_OPTIONS', 'Неполные данные результата анализа');
      }
    }
  }

  /**
   * Создание ошибки экспорта
   */
  private createExportError(code: PDFExportError, message: string, details?: any): PDFExportException {
    const error = new Error(message) as PDFExportException;
    error.code = code;
    error.details = details;
    error.recoverable = code !== 'BROWSER_NOT_SUPPORTED';
    return error;
  }

  /**
   * Обработка ошибок экспорта
   */
  private handleExportError(error: any): void {
    console.error('React-PDF Export Error:', error);
    
    this.updateProgress('complete', 0, 'Ошибка генерации PDF', undefined);
    
    if (this.currentProgress.errors) {
      this.currentProgress.errors.push(error.message || 'Неизвестная ошибка');
    } else {
      this.currentProgress.errors = [error.message || 'Неизвестная ошибка'];
    }
  }

  /**
   * Загрузка файла
   */
  public downloadPDF(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Предварительный просмотр PDF
   */
  public previewPDF(blob: Blob): void {
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  }
}

// Экспорт singleton instance
export const reactPdfExportService = new ReactPDFExportService();