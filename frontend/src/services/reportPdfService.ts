/**
 * Report PDF Service - Generate PDF reports from analysis results
 * Based on the tender folder's PDF export functionality
 */

import { ComprehensiveReport, VisualizationData } from './reportService';
import { KPAnalysisResult } from '../types/kpAnalyzer';

// Dynamic imports to avoid TypeScript module resolution issues
let jsPDF: any;

// Initialize PDF libraries
const initializePDFLibraries = async () => {
  if (!jsPDF) {
    try {
      const jsPDFModule = await import('jspdf');
      jsPDF = jsPDFModule.jsPDF;
    } catch {
      // Fallback to require if dynamic import fails
      jsPDF = require('jspdf').jsPDF;
    }
  }
  return jsPDF;
};

class ReportPDFService {
  private readonly pageWidth = 210; // A4 width in mm
  private readonly pageHeight = 297; // A4 height in mm
  private readonly margin = 20;
  private readonly contentWidth = this.pageWidth - (this.margin * 2);

  /**
   * Export comprehensive report to PDF
   */
  async exportReportToPDF(
    report: ComprehensiveReport,
    visualizationData: VisualizationData
  ): Promise<void> {
    try {
      await initializePDFLibraries();
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      // Set font (supports Cyrillic)
      pdf.setFont('helvetica');
      
      let currentY = this.margin;

      // Title Page
      currentY = this.addTitlePage(pdf, report);
      
      // Executive Summary
      if (currentY > this.pageHeight - 60) {
        pdf.addPage();
        currentY = this.margin;
      }
      currentY = this.addExecutiveSummary(pdf, report, currentY);

      // Best Proposal Highlight
      if (report.best_proposal) {
        if (currentY > this.pageHeight - 60) {
          pdf.addPage();
          currentY = this.margin;
        }
        currentY = this.addBestProposal(pdf, report.best_proposal, currentY);
      }

      // Analysis Results Table
      if (currentY > this.pageHeight - 80) {
        pdf.addPage();
        currentY = this.margin;
      }
      currentY = this.addAnalysisTable(pdf, report.analysis_results, currentY);

      // Detailed Analysis for each proposal
      for (const result of report.analysis_results) {
        pdf.addPage();
        currentY = this.margin;
        currentY = this.addDetailedAnalysis(pdf, result, currentY);
      }

      // Recommendations
      pdf.addPage();
      currentY = this.margin;
      currentY = this.addRecommendations(pdf, report.recommendations, currentY);

      // Charts (if available)
      if (visualizationData.ratings.length > 0) {
        pdf.addPage();
        currentY = this.margin;
        await this.addVisualizationCharts(pdf, visualizationData, currentY);
      }

      // Save the PDF
      const fileName = `КП_Анализ_${report.tz_name}_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);

    } catch (error) {
      console.error('Error exporting PDF:', error);
      throw new Error('Не удалось экспортировать PDF отчет');
    }
  }

  /**
   * Add title page
   */
  private addTitlePage(pdf: any, report: ComprehensiveReport): number {
    let y = 60;

    // Main title
    pdf.setFontSize(24);
    pdf.setFont('helvetica', 'bold');
    const title = this.splitText(pdf, 'ОТЧЕТ ПО АНАЛИЗУ', this.contentWidth);
    title.forEach((line: string) => {
      pdf.text(line, this.pageWidth / 2, y, { align: 'center' });
      y += 12;
    });

    y += 10;
    const subtitle = this.splitText(pdf, 'КОММЕРЧЕСКИХ ПРЕДЛОЖЕНИЙ', this.contentWidth);
    subtitle.forEach((line: string) => {
      pdf.text(line, this.pageWidth / 2, y, { align: 'center' });
      y += 12;
    });

    y += 30;

    // Project info
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'normal');
    const projectTitle = this.splitText(pdf, report.tz_name, this.contentWidth);
    projectTitle.forEach((line: string) => {
      pdf.text(line, this.pageWidth / 2, y, { align: 'center' });
      y += 8;
    });

    y += 40;

    // Summary stats
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('КРАТКАЯ ИНФОРМАЦИЯ', this.pageWidth / 2, y, { align: 'center' });
    y += 20;

    pdf.setFont('helvetica', 'normal');
    const stats = [
      `Дата создания: ${new Date(report.created_at).toLocaleDateString('ru-RU')}`,
      `Количество предложений: ${report.analysis_results.length}`,
      `Средний балл: ${report.total_score}%`,
      `Лучшее предложение: ${report.best_proposal?.kpFileName || 'Не определено'} (${report.best_proposal?.score || 0}%)`
    ];

    stats.forEach((stat: string) => {
      pdf.text(stat, this.pageWidth / 2, y, { align: 'center' });
      y += 8;
    });

    return y;
  }

  /**
   * Add executive summary
   */
  private addExecutiveSummary(pdf: any, report: ComprehensiveReport, startY: number): number {
    let y = startY + 10;

    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text('КРАТКОЕ РЕЗЮМЕ', this.margin, y);
    y += 15;

    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'normal');
    
    const summaryLines = this.splitText(pdf, report.executive_summary, this.contentWidth);
    summaryLines.forEach((line: string) => {
      if (y > this.pageHeight - this.margin - 10) {
        pdf.addPage();
        y = this.margin;
      }
      pdf.text(line, this.margin, y);
      y += 6;
    });

    return y + 10;
  }

  /**
   * Add best proposal highlight
   */
  private addBestProposal(pdf: any, bestProposal: KPAnalysisResult, startY: number): number {
    let y = startY + 10;

    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('РЕКОМЕНДУЕМОЕ ПРЕДЛОЖЕНИЕ', this.margin, y);
    y += 12;

    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    const fileName = this.splitText(pdf, bestProposal.kpFileName, this.contentWidth);
    fileName.forEach((line: string) => {
      pdf.text(line, this.margin, y);
      y += 6;
    });

    y += 5;
    pdf.setFont('helvetica', 'normal');
    
    const details = [
      `Общий балл: ${bestProposal.score}%`,
      `Соответствие ТЗ: ${bestProposal.analysis.compliance}%`,
      `Техническая экспертиза: ${bestProposal.analysis.technical}%`,
      `Коммерческая оценка: ${bestProposal.analysis.commercial}%`,
      `Опыт и компетенции: ${bestProposal.analysis.experience}%`
    ];

    details.forEach((detail: string) => {
      pdf.text(detail, this.margin + 5, y);
      y += 6;
    });

    return y + 10;
  }

  /**
   * Add analysis results table
   */
  private addAnalysisTable(pdf: any, results: KPAnalysisResult[], startY: number): number {
    let y = startY + 10;

    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('СВОДНАЯ ТАБЛИЦА РЕЗУЛЬТАТОВ', this.margin, y);
    y += 15;

    // Table headers
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'bold');
    
    const colWidths = [60, 25, 25, 25, 25, 25];
    const headers = ['Предложение', 'Общий', 'Соотв.', 'Техн.', 'Комм.', 'Опыт'];
    
    let x = this.margin;
    headers.forEach((header, index) => {
      pdf.text(header, x, y);
      x += colWidths[index];
    });
    
    // Draw header line
    pdf.line(this.margin, y + 2, this.margin + this.contentWidth, y + 2);
    y += 8;

    // Table rows
    pdf.setFont('helvetica', 'normal');
    results.forEach((result) => {
      if (y > this.pageHeight - this.margin - 15) {
        pdf.addPage();
        y = this.margin;
      }

      x = this.margin;
      
      // Truncate long filenames
      const fileName = result.kpFileName.length > 25 ? 
        result.kpFileName.substring(0, 22) + '...' : 
        result.kpFileName;
      
      const rowData = [
        fileName,
        `${result.score}%`,
        `${result.analysis.compliance}%`,
        `${result.analysis.technical}%`,
        `${result.analysis.commercial}%`,
        `${result.analysis.experience}%`
      ];

      rowData.forEach((data, colIndex) => {
        pdf.text(data, x, y);
        x += colWidths[colIndex];
      });

      y += 6;
    });

    return y + 10;
  }

  /**
   * Add detailed analysis for a single proposal
   */
  private addDetailedAnalysis(pdf: any, result: KPAnalysisResult, startY: number): number {
    let y = startY;

    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    const title = this.splitText(pdf, `ДЕТАЛЬНЫЙ АНАЛИЗ: ${result.kpFileName}`, this.contentWidth);
    title.forEach((line: string) => {
      pdf.text(line, this.margin, y);
      y += 8;
    });
    y += 10;

    // Scores section
    pdf.setFontSize(12);
    pdf.text('Оценки:', this.margin, y);
    y += 8;

    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    
    const scores = [
      `Общий балл: ${result.score}%`,
      `Соответствие ТЗ: ${result.analysis.compliance}%`,
      `Техническая экспертиза: ${result.analysis.technical}%`,
      `Коммерческая оценка: ${result.analysis.commercial}%`,
      `Опыт и компетенции: ${result.analysis.experience}%`
    ];

    scores.forEach((score: string) => {
      pdf.text(`• ${score}`, this.margin + 5, y);
      y += 6;
    });

    y += 10;

    // Details section
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Анализ:', this.margin, y);
    y += 8;

    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    const detailLines = this.splitText(pdf, result.analysis.detailedAnalysis, this.contentWidth);
    detailLines.forEach((line: string) => {
      if (y > this.pageHeight - this.margin - 10) {
        pdf.addPage();
        y = this.margin;
      }
      pdf.text(line, this.margin, y);
      y += 6;
    });

    y += 10;

    // Recommendations section
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Рекомендации:', this.margin, y);
    y += 8;

    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    result.analysis.recommendations.forEach((rec: string) => {
      const recLines = this.splitText(pdf, `• ${rec}`, this.contentWidth - 5);
      recLines.forEach((line: string) => {
        if (y > this.pageHeight - this.margin - 10) {
          pdf.addPage();
          y = this.margin;
        }
        pdf.text(line, this.margin + 5, y);
        y += 6;
      });
      y += 2;
    });

    return y;
  }

  /**
   * Add recommendations section
   */
  private addRecommendations(pdf: any, recommendations: string[], startY: number): number {
    let y = startY;

    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text('КЛЮЧЕВЫЕ РЕКОМЕНДАЦИИ', this.margin, y);
    y += 15;

    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'normal');

    recommendations.forEach((rec: string, index: number) => {
      const recLines = this.splitText(pdf, `${index + 1}. ${rec}`, this.contentWidth);
      recLines.forEach((line: string) => {
        if (y > this.pageHeight - this.margin - 10) {
          pdf.addPage();
          y = this.margin;
        }
        pdf.text(line, this.margin, y);
        y += 6;
      });
      y += 4;
    });

    return y;
  }

  /**
   * Add visualization charts (placeholder - would capture charts from DOM)
   */
  private async addVisualizationCharts(pdf: any, visualizationData: VisualizationData, startY: number): Promise<number> {
    let y = startY;

    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text('ГРАФИКИ И ДИАГРАММЫ', this.margin, y);
    y += 15;

    // Simple text-based chart representation
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Сравнение по соответствию ТЗ:', this.margin, y);
    y += 10;

    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');

    visualizationData.compliance.forEach((item) => {
      const barLength = Math.round((item.score / 100) * 50);
      const bar = '■'.repeat(barLength) + '□'.repeat(50 - barLength);
      
      pdf.text(`${item.name}: ${bar} ${item.score}%`, this.margin, y);
      y += 6;
    });

    return y;
  }

  /**
   * Split text to fit within specified width
   */
  private splitText(pdf: any, text: string, maxWidth: number): string[] {
    return pdf.splitTextToSize(text, maxWidth);
  }
}

export const reportPdfService = new ReportPDFService();