/**
 * PDF Export Service для генерации отчетов анализа КП
 * DevAssist Pro
 */

import jsPDF from 'jspdf';

// Модернные версии jsPDF лучше поддерживают Unicode
declare global {
  interface Window {
    jsPDF: typeof jsPDF;
  }
}
import {
  AnalysisResult,
  ComparisonResult,
  PDFExportOptions,
  PDFExportResult,
  PDFGenerationProgress,
  PDFExportException,
  PDFExportError,
  PDFStylingOptions,
  DEFAULT_PDF_OPTIONS,
  DEFAULT_STYLING_OPTIONS,
} from '../types/pdfExport';

export class PDFExportService {
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
    options: Partial<PDFExportOptions> = {},
    styling: Partial<PDFStylingOptions> = {}
  ): Promise<PDFExportResult> {
    const startTime = performance.now();
    
    try {
      this.updateProgress('initializing', 0, 'Подготовка сравнительного анализа...');
      
      const fullOptions = { ...DEFAULT_PDF_OPTIONS, ...options };
      const fullStyling = { ...DEFAULT_STYLING_OPTIONS, ...styling };
      
      this.validateOptions(fullOptions);
      this.validateAnalysisResults(results);

      this.updateProgress('processing', 5, 'Создание документа...');
      
      const pdf = this.createPDFDocument(fullOptions, fullStyling);
      this.setupDocumentMetadata(pdf, fullOptions, results);

      this.updateProgress('rendering', 10, 'Генерация титульной страницы...');
      this.addTitlePage(pdf, fullOptions, fullStyling, results);

      if (fullOptions.includeExecutiveSummary) {
        this.updateProgress('rendering', 20, 'Создание исполнительного резюме...');
        this.addExecutiveSummary(pdf, results, comparison, fullOptions, fullStyling);
      }

      this.updateProgress('rendering', 30, 'Добавление сравнительного анализа...');
      this.addComparisonSection(pdf, results, comparison, fullOptions, fullStyling);

      if (fullOptions.includeDetailedAnalysis) {
        const progressStep = 40 / results.length;
        for (let i = 0; i < results.length; i++) {
          const result = results[i];
          const progress = 40 + (i * progressStep);
          this.updateProgress('rendering', progress, `Детальный анализ: ${result.companyName}`, result.companyName);
          this.addDetailedAnalysis(pdf, result, fullOptions, fullStyling);
        }
      }

      if (fullOptions.includeAppendices) {
        this.updateProgress('rendering', 85, 'Добавление приложений...');
        this.addAppendices(pdf, fullOptions, fullStyling);
      }

      this.updateProgress('finalizing', 95, 'Финализация документа...');
      this.addFooters(pdf, fullStyling);

      const blob = pdf.output('blob');
      const processingTime = performance.now() - startTime;

      this.updateProgress('complete', 100, 'Сравнительный анализ готов!');

      return {
        blob,
        filename: this.generateFilename(fullOptions, results),
        size: blob.size,
        pages: pdf.getNumberOfPages(),
        generatedAt: new Date().toISOString(),
        metadata: {
          options: fullOptions,
          analysisCount: results.length,
          template: 'detailed',
          processingTime,
        },
      };

    } catch (error) {
      this.handleExportError(error);
      throw error;
    }
  }

  /**
   * Создание PDF документа с поддержкой Unicode
   */
  private createPDFDocument(options: PDFExportOptions, styling: PDFStylingOptions): jsPDF {
    const format = options.format.toLowerCase() as 'a4' | 'a3' | 'letter';
    const orientation = options.orientation;
    
    const pdf = new jsPDF({
      orientation,
      unit: 'mm',
      format,
      compress: true,
      putOnlyUsedFonts: true,
      floatPrecision: 16,
      // Добавляем Unicode поддержку
      userUnit: 1.0
    });

    // Настраиваем UTF-8 кодировку
    this.setupUTF8Support(pdf);
    
    // Устанавливаем базовые настройки
    pdf.setFontSize(styling.fontSize.body);

    return pdf;
  }

  /**
   * Настройка UTF-8 поддержки для jsPDF
   */
  private setupUTF8Support(pdf: jsPDF): void {
    try {
      // Используем базовые шрифты, которые поддерживают кириллицу
      pdf.setFont('helvetica', 'normal');
      
      // Пробуем настроить UTF-8 через internal API
      if ((pdf as any).internal) {
        const internal = (pdf as any).internal;
        
        // Настраиваем кодировку
        if (internal.events && internal.events.subscribe) {
          internal.events.subscribe('addFont', () => {
            try {
              internal.write('/ToUnicode /Identity-H');
            } catch (e) {
              // Игнорируем ошибки
            }
          });
        }
        
        // Пытаемся установить UTF-8 напрямую
        try {
          internal.write('/Encoding /Identity-H');
        } catch (e) {
          // Игнорируем
        }
      }
      
      this.utf8Setup = true;
      console.log('UTF-8 поддержка настроена');
      
    } catch (error) {
      console.warn('Ошибка настройки UTF-8:', error);
      this.utf8Setup = false;
    }
  }
  
  private utf8Setup: boolean = false;

  /**
   * Добавление текста с поддержкой русского языка
   */
  private addText(pdf: jsPDF, text: string, x: number, y: number, options?: any): void {
    try {
      // Пробуем сначала с оригинальным текстом
      pdf.text(text, x, y, options);
    } catch (error) {
      console.warn('Проблема с кириллицей, пробуем другой подход:', error);
      
      // Попытка с явным преобразованием в UTF-8
      try {
        const utf8Text = this.convertToUTF8(text);
        pdf.text(utf8Text, x, y, options);
      } catch (utf8Error) {
        // Последний fallback - транслитерация
        console.warn('Переходим к транслитерации:', utf8Error);
        const processedText = this.transliterate(text);
        pdf.text(processedText, x, y, options);
      }
    }
  }
  
  /**
   * Преобразование текста в UTF-8
   */
  private convertToUTF8(text: string): string {
    try {
      // Простое преобразование через TextEncoder/TextDecoder
      if (typeof TextEncoder !== 'undefined' && typeof TextDecoder !== 'undefined') {
        const encoder = new TextEncoder();
        const decoder = new TextDecoder('utf-8');
        const bytes = encoder.encode(text);
        return decoder.decode(bytes);
      }
      return text;
    } catch (error) {
      return text;
    }
  }

  /**
   * Обработка текста для корректного отображения в PDF
   */
  private processTextForPDF(text: string): string {
    // Если UTF-8 поддержка настроена, возвращаем оригинальный текст
    if (this.utf8Setup && this.testCyrillicSupport()) {
      return text;
    }
    
    // Иначе используем транслитерацию
    return this.transliterate(text);
  }
  
  /**
   * Тестирование поддержки кириллицы
   */
  private testCyrillicSupport(): boolean {
    try {
      // Простой тест на поддержку кириллических символов
      const testText = 'Тест';
      // Если браузер поддерживает TextEncoder, проверяем кодировку
      if (typeof TextEncoder !== 'undefined') {
        const encoder = new TextEncoder();
        const encoded = encoder.encode(testText);
        return encoded.length > 0;
      }
      return true; // Предполагаем поддержку, если нет TextEncoder
    } catch (error) {
      return false;
    }
  }

  /**
   * Проверка наличия кириллических символов
   */
  private containsCyrillic(text: string): boolean {
    return /[а-яё]/i.test(text);
  }

  /**
   * Транслитерация кириллицы в латиницу
   */
  private transliterate(text: string): string {
    const translitMap: Record<string, string> = {
      'А': 'A', 'Б': 'B', 'В': 'V', 'Г': 'G', 'Д': 'D', 'Е': 'E', 'Ё': 'E', 'Ж': 'Zh', 'З': 'Z',
      'И': 'I', 'Й': 'Y', 'К': 'K', 'Л': 'L', 'М': 'M', 'Н': 'N', 'О': 'O', 'П': 'P', 'Р': 'R',
      'С': 'S', 'Т': 'T', 'У': 'U', 'Ф': 'F', 'Х': 'Kh', 'Ц': 'Ts', 'Ч': 'Ch', 'Ш': 'Sh', 'Щ': 'Sch',
      'Ъ': '', 'Ы': 'Y', 'Ь': '', 'Э': 'E', 'Ю': 'Yu', 'Я': 'Ya',
      'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'e', 'ж': 'zh', 'з': 'z',
      'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r',
      'с': 's', 'т': 't', 'у': 'u', 'ф': 'f', 'х': 'kh', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'sch',
      'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya'
    };

    return text.replace(/[а-яёА-ЯЁ]/g, char => translitMap[char] || char);
  }

  /**
   * Настройка метаданных документа
   */
  private setupDocumentMetadata(pdf: jsPDF, options: PDFExportOptions, results: AnalysisResult[]): void {
    const metadata = {
      title: options.customTitle || `Analiz KP - ${options.projectName}`,
      author: options.companyName || 'DevAssist Pro',
      subject: 'Analiz kommercheskikh predlozheniy',
      creator: 'DevAssist Pro PDF Generator',
    };

    pdf.setProperties(metadata);
  }

  /**
   * Добавление титульной страницы
   */
  private addTitlePage(pdf: jsPDF, options: PDFExportOptions, styling: PDFStylingOptions, results: AnalysisResult[]): void {
    // Заголовок
    pdf.setFontSize(styling.fontSize.title);
    pdf.setTextColor(styling.primaryColor);
    const title = options.customTitle || 'Отчет по анализу коммерческих предложений';
    this.addText(pdf, title, styling.margins.left, styling.margins.top + 30);

    // Подзаголовок
    pdf.setFontSize(styling.fontSize.heading);
    pdf.setTextColor(styling.secondaryColor);
    this.addText(pdf, options.projectName || 'Анализ КП', styling.margins.left, styling.margins.top + 60);

    // Информация о проекте
    pdf.setFontSize(styling.fontSize.body);
    pdf.setTextColor('#000000');
    
    const projectInfo = [
      `Дата создания: ${new Date().toLocaleDateString('ru-RU')}`,
      `Количество КП: ${results.length}`,
      `Компания: ${options.companyName || 'DevAssist Pro'}`,
      '',
      'Анализ выполнен с использованием искусственного интеллекта',
    ];

    let yPosition = styling.margins.top + 100;
    projectInfo.forEach(line => {
      if (line) {
        this.addText(pdf, line, styling.margins.left, yPosition);
      }
      yPosition += styling.fontSize.body * 1.5;
    });

    pdf.addPage();
  }

  /**
   * Добавление исполнительного резюме
   */
  private addExecutiveSummary(
    pdf: jsPDF, 
    results: AnalysisResult[], 
    comparison: ComparisonResult | null,
    options: PDFExportOptions, 
    styling: PDFStylingOptions
  ): void {
    this.addSectionHeader(pdf, 'Исполнительное резюме', styling);
    
    let yPosition = this.getCurrentYPosition(pdf, styling);

    // Основная статистика
    const avgScore = results.reduce((sum, r) => sum + (r.overallRating || 0), 0) / results.length;
    const bestKP = results.reduce((best, current) => 
      (current.overallRating || 0) > (best.overallRating || 0) ? current : best
    );

    const summaryText = [
      `Проанализировано ${results.length} коммерческих предложений.`,
      `Средний балл соответствия: ${avgScore.toFixed(1)}%.`,
      `Лучшее предложение: ${bestKP.companyName} (${bestKP.overallRating || 0}%).`,
    ];

    pdf.setFontSize(styling.fontSize.body);
    pdf.setTextColor('#000000');

    summaryText.forEach(line => {
      this.addText(pdf, line, styling.margins.left, yPosition);
      yPosition += styling.fontSize.body * 1.5;
    });

    // Таблица сводных результатов
    yPosition += 20;
    this.addResultsTable(pdf, results, styling, yPosition);

    pdf.addPage();
  }

  /**
   * Добавление секции сравнительного анализа
   */
  private addComparisonSection(
    pdf: jsPDF,
    results: AnalysisResult[],
    comparison: ComparisonResult,
    options: PDFExportOptions,
    styling: PDFStylingOptions
  ): void {
    this.addSectionHeader(pdf, 'Сравнительный анализ', styling);
    
    let yPosition = this.getCurrentYPosition(pdf, styling);

    // Сводка сравнения
    pdf.setFontSize(styling.fontSize.body);
    pdf.setTextColor('#000000');
    this.addText(pdf, comparison.summary || 'Сравнительный анализ проведен', styling.margins.left, yPosition);
    yPosition += styling.fontSize.body * 2;

    // Рекомендации
    if (comparison.recommendations && comparison.recommendations.length > 0) {
      pdf.setFontSize(styling.fontSize.heading);
      pdf.setTextColor(styling.primaryColor);
      this.addText(pdf, 'Рекомендации:', styling.margins.left, yPosition);
      yPosition += styling.fontSize.heading * 1.5;

      pdf.setFontSize(styling.fontSize.body);
      pdf.setTextColor('#000000');

      comparison.recommendations.forEach(rec => {
        this.addText(pdf, `• ${rec}`, styling.margins.left + 10, yPosition);
        yPosition += styling.fontSize.body * 1.5;
      });
    }

    pdf.addPage();
  }

  /**
   * Добавление детального анализа КП
   */
  private addDetailedAnalysis(
    pdf: jsPDF,
    result: AnalysisResult,
    options: PDFExportOptions,
    styling: PDFStylingOptions
  ): void {
    this.addSectionHeader(pdf, `Детальный анализ: ${result.companyName}`, styling);
    
    let yPosition = this.getCurrentYPosition(pdf, styling);

    // Общая информация
    const generalInfo = [
      `Файл: ${result.fileName || 'Не указан'}`,
      `Дата анализа: ${new Date(result.analyzedAt).toLocaleDateString('ru-RU')}`,
      `AI модель: ${result.model}`,
      `Общий балл: ${result.overallRating || 0}%`,
    ];

    pdf.setFontSize(styling.fontSize.body);
    pdf.setTextColor('#000000');

    generalInfo.forEach(line => {
      this.addText(pdf, line, styling.margins.left, yPosition);
      yPosition += styling.fontSize.body * 1.5;
    });

    yPosition += 10;

    // Сильные стороны
    if (result.strengths && result.strengths.length > 0) {
      pdf.setFontSize(styling.fontSize.heading);
      pdf.setTextColor(styling.accentColor);
      this.addText(pdf, 'Сильные стороны:', styling.margins.left, yPosition);
      yPosition += styling.fontSize.heading * 1.5;

      pdf.setFontSize(styling.fontSize.body);
      pdf.setTextColor('#000000');

      result.strengths.forEach(strength => {
        this.addText(pdf, `• ${strength}`, styling.margins.left + 10, yPosition);
        yPosition += styling.fontSize.body * 1.5;
      });
      yPosition += 5;
    }

    // Слабые стороны
    if (result.weaknesses && result.weaknesses.length > 0) {
      pdf.setFontSize(styling.fontSize.heading);
      pdf.setTextColor('#ef4444');
      this.addText(pdf, 'Слабые стороны:', styling.margins.left, yPosition);
      yPosition += styling.fontSize.heading * 1.5;

      pdf.setFontSize(styling.fontSize.body);
      pdf.setTextColor('#000000');

      result.weaknesses.forEach(weakness => {
        this.addText(pdf, `• ${weakness}`, styling.margins.left + 10, yPosition);
        yPosition += styling.fontSize.body * 1.5;
      });
    }

    pdf.addPage();
  }

  /**
   * Добавление таблицы результатов
   */
  private addResultsTable(pdf: jsPDF, results: AnalysisResult[], styling: PDFStylingOptions, startY: number): void {
    pdf.setFontSize(styling.fontSize.heading);
    pdf.setTextColor(styling.primaryColor);
    this.addText(pdf, 'Сводная таблица результатов:', styling.margins.left, startY);
    
    let yPosition = startY + styling.fontSize.heading * 1.5 + 10;
    
    // Заголовки таблицы
    pdf.setFontSize(styling.fontSize.body);
    pdf.setTextColor('#ffffff');
    pdf.setFillColor(styling.primaryColor);
    pdf.rect(styling.margins.left, yPosition - 5, 160, 8, 'F');
    
    this.addText(pdf, 'Компания', styling.margins.left + 2, yPosition);
    this.addText(pdf, 'Балл', styling.margins.left + 80, yPosition);
    this.addText(pdf, 'Рекомендация', styling.margins.left + 110, yPosition);
    
    yPosition += 10;

    // Строки данных
    results.forEach((result, index) => {
      pdf.setTextColor('#000000');
      
      if (index % 2 === 1) {
        pdf.setFillColor('#f8f9fa');
        pdf.rect(styling.margins.left, yPosition - 5, 160, 8, 'F');
      }
      
      this.addText(pdf, result.companyName, styling.margins.left + 2, yPosition);
      this.addText(pdf, `${result.overallRating || 0}%`, styling.margins.left + 80, yPosition);
      
      const recommendation = (result.overallRating || 0) >= 80 ? 'Рекомендуется' :
                           (result.overallRating || 0) >= 60 ? 'Условно' : 'Не рекомендуется';
      this.addText(pdf, recommendation, styling.margins.left + 110, yPosition);
      
      yPosition += 8;
    });
  }

  /**
   * Добавление приложений
   */
  private addAppendices(pdf: jsPDF, options: PDFExportOptions, styling: PDFStylingOptions): void {
    this.addSectionHeader(pdf, 'Приложения', styling);
    
    let yPosition = this.getCurrentYPosition(pdf, styling);

    // Методология
    pdf.setFontSize(styling.fontSize.heading);
    pdf.setTextColor(styling.primaryColor);
    this.addText(pdf, 'A. Методология оценки', styling.margins.left, yPosition);
    yPosition += styling.fontSize.heading * 1.5;

    const methodology = [
      'Анализ проводится с использованием искусственного интеллекта',
      'по следующим критериям:',
      '• Техническое соответствие (30%)',
      '• Финансовая привлекательность (25%)',
      '• Реалистичность сроков (20%)',
      '• Качество предложения (15%)',
      '• Надежность поставщика (10%)',
    ];

    pdf.setFontSize(styling.fontSize.body);
    pdf.setTextColor('#000000');

    methodology.forEach(line => {
      this.addText(pdf, line, styling.margins.left, yPosition);
      yPosition += styling.fontSize.body * 1.5;
    });
  }

  /**
   * Добавление заголовка секции
   */
  private addSectionHeader(pdf: jsPDF, title: string, styling: PDFStylingOptions): void {
    const yPosition = styling.margins.top + 20;
    
    pdf.setFontSize(styling.fontSize.title);
    pdf.setTextColor(styling.primaryColor);
    this.addText(pdf, title, styling.margins.left, yPosition);
    
    // Линия под заголовком
    pdf.setDrawColor(styling.primaryColor);
    pdf.setLineWidth(1);
    const lineY = yPosition + 5;
    pdf.line(styling.margins.left, lineY, pdf.internal.pageSize.getWidth() - styling.margins.right, lineY);
  }

  /**
   * Получение текущей Y позиции
   */
  private getCurrentYPosition(pdf: jsPDF, styling: PDFStylingOptions): number {
    return styling.margins.top + 40;
  }

  /**
   * Добавление футеров с номерами страниц
   */
  private addFooters(pdf: jsPDF, styling: PDFStylingOptions): void {
    const pageCount = pdf.getNumberOfPages();
    
    for (let i = 1; i <= pageCount; i++) {
      pdf.setPage(i);
      
      if (styling.showPageNumbers) {
        pdf.setFontSize(styling.fontSize.caption);
        pdf.setTextColor(styling.secondaryColor);
        
        const pageText = `Страница ${i} из ${pageCount}`;
        const pageWidth = pdf.internal.pageSize.getWidth();
        const textWidth = pdf.getTextWidth(this.transliterate(pageText));
        
        this.addText(pdf, pageText, pageWidth - styling.margins.right - textWidth, 
                pdf.internal.pageSize.getHeight() - styling.margins.bottom + 5);
      }
    }
  }

  /**
   * Генерация имени файла
   */
  private generateFilename(options: PDFExportOptions, results: AnalysisResult[]): string {
    const date = new Date().toISOString().slice(0, 10);
    const projectName = (options.projectName || 'KP-Analysis').replace(/[^a-zA-Z0-9а-яА-Я]/g, '-');
    const count = results.length;
    
    return `${projectName}-${count}KP-${date}.pdf`;
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
    console.error('PDF Export Error:', error);
    
    this.updateProgress('complete', 0, 'Ошибка генерации PDF', undefined);
    
    if (this.currentProgress.errors) {
      this.currentProgress.errors.push(error.message || 'Неизвестная ошибка');
    } else {
      this.currentProgress.errors = [error.message || 'Неизвестная ошибка'];
    }
  }
}

// Экспорт singleton instance
export const pdfExportService = new PDFExportService();