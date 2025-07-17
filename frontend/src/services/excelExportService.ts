/**
 * Excel Export Service для генерации отчетов анализа КП в формате Excel
 * DevAssist Pro
 */

import * as ExcelJS from 'exceljs';
import { KPAnalysisResult } from '../types/kpAnalyzer';
import { ComprehensiveReport, VisualizationData } from './reportService';

export interface ExcelExportOptions {
  includeCharts: boolean;
  includeRawData: boolean;
  includeComparison: boolean;
  includeSummary: boolean;
  customTitle?: string;
  projectName?: string;
  companyName?: string;
}

export interface ExcelExportResult {
  blob: Blob;
  filename: string;
  size: number;
  sheetsCount: number;
  generatedAt: string;
  metadata: {
    options: ExcelExportOptions;
    analysisCount: number;
    processingTime: number;
  };
}

export interface ExcelGenerationProgress {
  stage: 'initializing' | 'processing' | 'formatting' | 'finalizing' | 'complete';
  progress: number;
  message: string;
  currentSheet?: string;
  errors?: string[];
}

export const DEFAULT_EXCEL_OPTIONS: ExcelExportOptions = {
  includeCharts: true,
  includeRawData: true,
  includeComparison: true,
  includeSummary: true,
  customTitle: 'Отчет по анализу коммерческих предложений',
  projectName: 'КП Анализ',
  companyName: 'DevAssist Pro'
};

export class ExcelExportService {
  private progressCallback?: (progress: ExcelGenerationProgress) => void;
  private currentProgress: ExcelGenerationProgress = {
    stage: 'initializing',
    progress: 0,
    message: 'Инициализация...',
  };

  /**
   * Установка callback для отслеживания прогресса
   */
  public setProgressCallback(callback: (progress: ExcelGenerationProgress) => void): void {
    this.progressCallback = callback;
  }

  /**
   * Обновление прогресса генерации
   */
  private updateProgress(
    stage: ExcelGenerationProgress['stage'], 
    progress: number, 
    message: string, 
    currentSheet?: string
  ): void {
    this.currentProgress = {
      stage,
      progress: Math.min(100, Math.max(0, progress)),
      message,
      currentSheet,
      errors: this.currentProgress.errors,
    };

    if (this.progressCallback) {
      this.progressCallback(this.currentProgress);
    }
  }

  /**
   * Экспорт комплексного отчета в Excel
   */
  public async exportComprehensiveReport(
    report: ComprehensiveReport,
    visualizationData: VisualizationData,
    options: Partial<ExcelExportOptions> = {}
  ): Promise<ExcelExportResult> {
    const startTime = performance.now();
    
    try {
      this.updateProgress('initializing', 0, 'Подготовка данных для экспорта...');
      
      const fullOptions = { ...DEFAULT_EXCEL_OPTIONS, ...options };
      
      this.validateReportData(report);

      this.updateProgress('processing', 5, 'Создание Excel документа...');
      
      const workbook = new ExcelJS.Workbook();
      this.setupWorkbookMetadata(workbook, fullOptions, report);

      let sheetsCount = 0;

      // 1. Сводный лист
      if (fullOptions.includeSummary) {
        this.updateProgress('processing', 15, 'Создание сводного листа...', 'Сводка');
        await this.createSummarySheet(workbook, report, visualizationData);
        sheetsCount++;
      }

      // 2. Детальный анализ
      this.updateProgress('processing', 30, 'Создание листа детального анализа...', 'Детальный анализ');
      await this.createDetailedAnalysisSheet(workbook, report);
      sheetsCount++;

      // 3. Сравнительная таблица
      if (fullOptions.includeComparison && report.analysis_results.length > 1) {
        this.updateProgress('processing', 50, 'Создание сравнительной таблицы...', 'Сравнение');
        await this.createComparisonSheet(workbook, report, visualizationData);
        sheetsCount++;
      }

      // 4. Сырые данные
      if (fullOptions.includeRawData) {
        this.updateProgress('processing', 70, 'Добавление сырых данных...', 'Данные');
        await this.createRawDataSheet(workbook, report);
        sheetsCount++;
      }

      // 5. Визуализация данных
      if (fullOptions.includeCharts) {
        this.updateProgress('formatting', 85, 'Создание графиков...', 'Графики');
        await this.createChartsSheet(workbook, visualizationData);
        sheetsCount++;
      }

      this.updateProgress('finalizing', 95, 'Финализация документа...');
      
      // Генерируем Excel файл
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      
      const processingTime = performance.now() - startTime;
      
      this.updateProgress('complete', 100, 'Excel отчет готов!');

      return {
        blob,
        filename: this.generateFilename(fullOptions, report),
        size: blob.size,
        sheetsCount,
        generatedAt: new Date().toISOString(),
        metadata: {
          options: fullOptions,
          analysisCount: report.analysis_results.length,
          processingTime,
        },
      };

    } catch (error) {
      this.handleExportError(error);
      throw error;
    }
  }

  /**
   * Экспорт результатов анализа в простом формате
   */
  public async exportSimpleAnalysis(
    analysisResults: KPAnalysisResult[],
    options: Partial<ExcelExportOptions> = {}
  ): Promise<ExcelExportResult> {
    const startTime = performance.now();
    
    try {
      this.updateProgress('initializing', 0, 'Подготовка данных...');
      
      const fullOptions = { ...DEFAULT_EXCEL_OPTIONS, ...options };
      
      const workbook = new ExcelJS.Workbook();
      this.setupWorkbookMetadata(workbook, fullOptions);

      this.updateProgress('processing', 20, 'Создание таблицы результатов...', 'Результаты');
      
      const worksheet = workbook.addWorksheet('Результаты анализа КП');
      
      // Заголовки
      const headers = [
        'Файл КП',
        'Компания',
        'Общий балл (%)',
        'Соответствие ТЗ (%)',
        'Техническая экспертиза (%)',
        'Коммерческая оценка (%)',
        'Опыт и компетенции (%)',
        'Рекомендация',
        'Дата анализа'
      ];

      worksheet.addRow(headers);
      
      // Применяем стили к заголовкам
      const headerRow = worksheet.getRow(1);
      headerRow.font = { bold: true, color: { argb: 'FFFFFF' } };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '4F46E5' }
      };
      headerRow.alignment = { horizontal: 'center', vertical: 'middle' };

      this.updateProgress('processing', 40, 'Заполнение данных...');

      // Добавляем данные
      analysisResults.forEach((result, index) => {
        const recommendation = result.score >= 80 ? 'Рекомендуется' :
                             result.score >= 60 ? 'Условно рекомендуется' : 'Не рекомендуется';
        
        const row = worksheet.addRow([
          result.kpFileName,
          result.extractedData?.companyName || 'Не указано',
          result.score,
          result.analysis.compliance,
          result.analysis.technical,
          result.analysis.commercial,
          result.analysis.experience,
          recommendation,
          new Date(result.analyzedAt).toLocaleDateString('ru-RU')
        ]);

        // Применяем условное форматирование для баллов
        this.applyCellFormatting(row, result.score);
      });

      this.updateProgress('formatting', 70, 'Применение форматирования...');

      // Автоматическая ширина колонок
      worksheet.columns.forEach(column => {
        column.width = 20;
      });

      // Замораживание заголовков
      worksheet.views = [{ state: 'frozen', ypane: 1 }];

      this.updateProgress('finalizing', 90, 'Создание файла...');

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      
      const processingTime = performance.now() - startTime;
      
      this.updateProgress('complete', 100, 'Excel файл готов!');

      return {
        blob,
        filename: this.generateSimpleFilename(fullOptions, analysisResults),
        size: blob.size,
        sheetsCount: 1,
        generatedAt: new Date().toISOString(),
        metadata: {
          options: fullOptions,
          analysisCount: analysisResults.length,
          processingTime,
        },
      };

    } catch (error) {
      this.handleExportError(error);
      throw error;
    }
  }

  /**
   * Создание сводного листа
   */
  private async createSummarySheet(
    workbook: ExcelJS.Workbook, 
    report: ComprehensiveReport, 
    visualizationData: VisualizationData
  ): Promise<void> {
    const worksheet = workbook.addWorksheet('Сводка');

    // Заголовок отчета
    worksheet.mergeCells('A1:F1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = report.title;
    titleCell.font = { size: 16, bold: true, color: { argb: '1F2937' } };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };

    // Основная информация
    worksheet.getCell('A3').value = 'Дата создания:';
    worksheet.getCell('B3').value = new Date(report.created_at).toLocaleDateString('ru-RU');
    
    worksheet.getCell('A4').value = 'Техническое задание:';
    worksheet.getCell('B4').value = report.tz_name;
    
    worksheet.getCell('A5').value = 'Количество КП:';
    worksheet.getCell('B5').value = report.analysis_results.length;
    
    worksheet.getCell('A6').value = 'Средний балл:';
    worksheet.getCell('B6').value = `${report.total_score}%`;

    // Исполнительное резюме
    worksheet.getCell('A8').value = 'Исполнительное резюме:';
    worksheet.getCell('A8').font = { bold: true, size: 14 };
    
    // Разбиваем длинный текст на строки
    const summaryLines = this.splitTextIntoLines(report.executive_summary, 80);
    summaryLines.forEach((line, index) => {
      worksheet.getCell(`A${9 + index}`).value = line;
    });

    const startRow = 9 + summaryLines.length + 2;

    // Топ КП
    worksheet.getCell(`A${startRow}`).value = 'Лучшие коммерческие предложения:';
    worksheet.getCell(`A${startRow}`).font = { bold: true, size: 12 };

    const sortedResults = [...report.analysis_results].sort((a, b) => b.score - a.score);
    const topResults = sortedResults.slice(0, 3);

    topResults.forEach((result, index) => {
      const row = startRow + 2 + index;
      worksheet.getCell(`A${row}`).value = `${index + 1}. ${result.kpFileName}`;
      worksheet.getCell(`B${row}`).value = `${result.score}%`;
      
      // Цветовое кодирование
      const cell = worksheet.getCell(`B${row}`);
      if (result.score >= 80) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'C7F6C7' } };
      } else if (result.score >= 60) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF2CC' } };
      } else {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE6E6' } };
      }
    });

    // Автоширина колонок
    worksheet.columns.forEach(column => {
      column.width = 25;
    });
  }

  /**
   * Создание листа детального анализа
   */
  private async createDetailedAnalysisSheet(
    workbook: ExcelJS.Workbook, 
    report: ComprehensiveReport
  ): Promise<void> {
    const worksheet = workbook.addWorksheet('Детальный анализ');

    // Заголовки
    const headers = [
      'Файл КП',
      'Общий балл (%)',
      'Соответствие ТЗ (%)',
      'Техническая экспертиза (%)',
      'Коммерческая оценка (%)',
      'Опыт и компетенции (%)',
      'Детальный анализ',
      'Рекомендации',
      'Дата анализа'
    ];

    worksheet.addRow(headers);
    
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '3B82F6' }
    };
    headerRow.alignment = { horizontal: 'center', vertical: 'middle' };

    // Данные
    report.analysis_results.forEach(result => {
      const row = worksheet.addRow([
        result.kpFileName,
        result.score,
        result.analysis.compliance,
        result.analysis.technical,
        result.analysis.commercial,
        result.analysis.experience,
        result.analysis.detailedAnalysis.substring(0, 200) + '...',
        result.analysis.recommendations.join('; '),
        new Date(result.analyzedAt).toLocaleDateString('ru-RU')
      ]);

      this.applyCellFormatting(row, result.score);
    });

    // Настройка колонок
    worksheet.getColumn(1).width = 25; // Файл КП
    worksheet.getColumn(2).width = 15; // Общий балл
    worksheet.getColumn(3).width = 15; // Соответствие ТЗ
    worksheet.getColumn(4).width = 15; // Техническая
    worksheet.getColumn(5).width = 15; // Коммерческая
    worksheet.getColumn(6).width = 15; // Опыт
    worksheet.getColumn(7).width = 40; // Детальный анализ
    worksheet.getColumn(8).width = 40; // Рекомендации
    worksheet.getColumn(9).width = 15; // Дата

    // Замораживание заголовков
    worksheet.views = [{ state: 'frozen', ypane: 1 }];
  }

  /**
   * Создание листа сравнения
   */
  private async createComparisonSheet(
    workbook: ExcelJS.Workbook, 
    report: ComprehensiveReport,
    visualizationData: VisualizationData
  ): Promise<void> {
    const worksheet = workbook.addWorksheet('Сравнение');

    // Сравнительная таблица по критериям
    const headers = ['КП', 'Соответствие ТЗ', 'Техническая', 'Коммерческая', 'Опыт', 'Общий балл'];
    worksheet.addRow(headers);

    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '10B981' }
    };

    visualizationData.ratings.forEach(rating => {
      worksheet.addRow([
        rating.name,
        rating.compliance,
        rating.technical,
        rating.commercial,
        rating.experience,
        (rating.compliance + rating.technical + rating.commercial + rating.experience) / 4
      ]);
    });

    // Добавляем итоговую строку
    const avgRow = worksheet.addRow([
      'СРЕДНЕЕ',
      Math.round(visualizationData.ratings.reduce((sum, r) => sum + r.compliance, 0) / visualizationData.ratings.length),
      Math.round(visualizationData.ratings.reduce((sum, r) => sum + r.technical, 0) / visualizationData.ratings.length),
      Math.round(visualizationData.ratings.reduce((sum, r) => sum + r.commercial, 0) / visualizationData.ratings.length),
      Math.round(visualizationData.ratings.reduce((sum, r) => sum + r.experience, 0) / visualizationData.ratings.length),
      report.total_score
    ]);

    avgRow.font = { bold: true };
    avgRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'F3F4F6' }
    };

    // Автоширина
    worksheet.columns.forEach(column => {
      column.width = 18;
    });
  }

  /**
   * Создание листа с сырыми данными
   */
  private async createRawDataSheet(
    workbook: ExcelJS.Workbook, 
    report: ComprehensiveReport
  ): Promise<void> {
    const worksheet = workbook.addWorksheet('Сырые данные');

    report.analysis_results.forEach((result, index) => {
      const startRow = index * 20 + 1;
      
      worksheet.getCell(`A${startRow}`).value = `КП ${index + 1}: ${result.kpFileName}`;
      worksheet.getCell(`A${startRow}`).font = { bold: true, size: 14 };
      
      worksheet.getCell(`A${startRow + 2}`).value = 'Извлеченные данные:';
      worksheet.getCell(`A${startRow + 2}`).font = { bold: true };
      
      if (result.extractedData) {
        worksheet.getCell(`A${startRow + 3}`).value = 'Компания:';
        worksheet.getCell(`B${startRow + 3}`).value = result.extractedData.companyName || 'Не указано';
        
        worksheet.getCell(`A${startRow + 4}`).value = 'Стоимость:';
        worksheet.getCell(`B${startRow + 4}`).value = result.extractedData.pricing || 'Не указано';
        
        worksheet.getCell(`A${startRow + 5}`).value = 'Сроки:';
        worksheet.getCell(`B${startRow + 5}`).value = result.extractedData.timeline || 'Не указано';
      }
      
      worksheet.getCell(`A${startRow + 7}`).value = 'Полный анализ:';
      worksheet.getCell(`A${startRow + 7}`).font = { bold: true };
      
      const analysisLines = this.splitTextIntoLines(result.analysis.detailedAnalysis, 80);
      analysisLines.forEach((line, lineIndex) => {
        worksheet.getCell(`A${startRow + 8 + lineIndex}`).value = line;
      });
    });

    worksheet.getColumn('A').width = 30;
    worksheet.getColumn('B').width = 50;
  }

  /**
   * Создание листа с графиками (заготовка)
   */
  private async createChartsSheet(
    workbook: ExcelJS.Workbook, 
    visualizationData: VisualizationData
  ): Promise<void> {
    const worksheet = workbook.addWorksheet('Графики');

    worksheet.getCell('A1').value = 'Данные для графиков';
    worksheet.getCell('A1').font = { bold: true, size: 16 };

    // Таблица для построения графиков соответствия
    worksheet.getCell('A3').value = 'Соответствие ТЗ по КП:';
    worksheet.getCell('A3').font = { bold: true };

    const headers = ['КП', 'Соответствие (%)'];
    worksheet.addRow(['', '']); // Пустая строка
    worksheet.addRow(headers);

    visualizationData.compliance.forEach(item => {
      worksheet.addRow([item.name, item.score]);
    });

    // Таблица рисков
    const riskStartRow = 4 + visualizationData.compliance.length + 3;
    worksheet.getCell(`A${riskStartRow}`).value = 'Уровень рисков:';
    worksheet.getCell(`A${riskStartRow}`).font = { bold: true };

    worksheet.addRow(['', '']);
    worksheet.addRow(['КП', 'Уровень риска', 'Балл']);

    visualizationData.risks.forEach(item => {
      worksheet.addRow([item.name, item.level, item.score]);
    });

    worksheet.columns.forEach(column => {
      column.width = 20;
    });
  }

  /**
   * Настройка метаданных workbook
   */
  private setupWorkbookMetadata(
    workbook: ExcelJS.Workbook, 
    options: ExcelExportOptions, 
    report?: ComprehensiveReport
  ): void {
    workbook.creator = options.companyName || 'DevAssist Pro';
    workbook.lastModifiedBy = options.companyName || 'DevAssist Pro';
    workbook.created = new Date();
    workbook.modified = new Date();
    workbook.subject = 'Анализ коммерческих предложений';
    workbook.keywords = 'КП, анализ, тендер, DevAssist Pro';
    workbook.description = report?.title || options.customTitle || 'Отчет по анализу КП';
  }

  /**
   * Применение форматирования к ячейкам на основе балла
   */
  private applyCellFormatting(row: ExcelJS.Row, score: number): void {
    // Применяем цветовое кодирование для балла
    const scoreCell = row.getCell(2); // Колонка с общим баллом
    
    if (score >= 80) {
      scoreCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'C7F6C7' } };
      scoreCell.font = { color: { argb: '166534' } };
    } else if (score >= 60) {
      scoreCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF2CC' } };
      scoreCell.font = { color: { argb: 'D97706' } };
    } else {
      scoreCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE6E6' } };
      scoreCell.font = { color: { argb: 'DC2626' } };
    }

    // Выравнивание числовых значений
    for (let i = 2; i <= 6; i++) {
      const cell = row.getCell(i);
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.numFmt = '0.0';
    }
  }

  /**
   * Разбивка длинного текста на строки
   */
  private splitTextIntoLines(text: string, maxLength: number): string[] {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    words.forEach(word => {
      if ((currentLine + word).length <= maxLength) {
        currentLine += (currentLine ? ' ' : '') + word;
      } else {
        if (currentLine) lines.push(currentLine);
        currentLine = word;
      }
    });

    if (currentLine) lines.push(currentLine);
    return lines;
  }

  /**
   * Генерация имени файла для комплексного отчета
   */
  private generateFilename(options: ExcelExportOptions, report: ComprehensiveReport): string {
    const date = new Date().toISOString().slice(0, 10);
    const projectName = (options.projectName || 'KP-Analysis').replace(/[^a-zA-Z0-9а-яА-Я]/g, '-');
    const count = report.analysis_results.length;
    
    return `${projectName}-${count}КП-Отчет-${date}.xlsx`;
  }

  /**
   * Генерация имени файла для простого анализа
   */
  private generateSimpleFilename(options: ExcelExportOptions, results: KPAnalysisResult[]): string {
    const date = new Date().toISOString().slice(0, 10);
    const projectName = (options.projectName || 'KP-Analysis').replace(/[^a-zA-Z0-9а-яА-Я]/g, '-');
    const count = results.length;
    
    return `${projectName}-${count}КП-${date}.xlsx`;
  }

  /**
   * Валидация данных отчета
   */
  private validateReportData(report: ComprehensiveReport): void {
    if (!report || !report.analysis_results || report.analysis_results.length === 0) {
      throw new Error('Отсутствуют данные для экспорта в Excel');
    }
  }

  /**
   * Обработка ошибок экспорта
   */
  private handleExportError(error: any): void {
    console.error('Excel Export Error:', error);
    
    this.updateProgress('complete', 0, 'Ошибка генерации Excel', undefined);
    
    if (this.currentProgress.errors) {
      this.currentProgress.errors.push(error.message || 'Неизвестная ошибка');
    } else {
      this.currentProgress.errors = [error.message || 'Неизвестная ошибка'];
    }
  }

  /**
   * Загрузка Excel файла
   */
  public downloadExcel(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

// Экспорт singleton instance
export const excelExportService = new ExcelExportService();