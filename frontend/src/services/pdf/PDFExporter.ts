/**
 * Frontend PDF Export Service
 * Генерация красивых PDF отчетов с использованием jsPDF и html2canvas
 * Поддержка кириллицы, профессиональный дизайн, высокое качество
 */

import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export interface AnalysisData {
  id?: string;
  title?: string;
  overall_score: number;
  compliance_percentage?: number;
  budget_deviation?: number;
  timeline_deviation?: number;
  created_at?: string;
  tz_filename?: string;
  kp_filenames?: string[];
  sections: AnalysisSection[];
}

export interface AnalysisSection {
  id: string;
  title: string;
  icon?: string;
  score: number;
  key_metrics?: MetricData[];
  tables?: TableData[];
  charts?: ChartData[];
  detailed_analysis: string;
  recommendations?: RecommendationData[];
}

export interface MetricData {
  name: string;
  value: string;
  color?: string;
}

export interface TableData {
  title: string;
  columns: string[];
  data: string[][];
}

export interface ChartData {
  type: 'bar' | 'pie' | 'line';
  title: string;
  data: any[];
}

export interface RecommendationData {
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  text: string;
}

export class PDFExporter {
  private readonly COLORS = {
    primary: '#1e40af',
    secondary: '#6366f1',
    success: '#059669',
    warning: '#d97706',
    danger: '#dc2626',
    muted: '#6b7280',
    background: '#ffffff',
    cardBg: '#f8fafc'
  };

  /**
   * Основной метод экспорта анализа в PDF
   */
  async exportAnalysisResults(analysisData: AnalysisData): Promise<void> {
    try {
      // Создаем HTML контейнер с результатами
      const pdfContainer = this.createPDFTemplate(analysisData);
      
      // Добавляем в DOM для рендеринга
      document.body.appendChild(pdfContainer);
      
      // Ожидаем полную загрузку изображений и стилей
      await this.waitForImagesLoad(pdfContainer);
      
      // Конвертируем в canvas с высоким качеством
      const canvas = await html2canvas(pdfContainer, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: this.COLORS.background,
        width: 1200,
        height: pdfContainer.scrollHeight,
        scrollX: 0,
        scrollY: 0
      });
      
      // Создаем PDF
      await this.generatePDF(canvas, analysisData);
      
      // Очистка
      document.body.removeChild(pdfContainer);
      
    } catch (error) {
      console.error('PDF Export Error:', error);
      throw new Error('Ошибка при создании PDF: ' + (error instanceof Error ? error.message : 'Неизвестная ошибка'));
    }
  }

  /**
   * Создание HTML шаблона для PDF
   */
  private createPDFTemplate(data: AnalysisData): HTMLElement {
    const container = document.createElement('div');
    container.style.cssText = `
      width: 1200px;
      min-height: 1600px;
      background: ${this.COLORS.background};
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      color: #1f2937;
      padding: 60px 40px;
      box-sizing: border-box;
      line-height: 1.6;
      position: absolute;
      left: -10000px;
      top: 0;
    `;

    container.innerHTML = `
      <!-- PDF Header -->
      <div style="border-bottom: 3px solid ${this.COLORS.primary}; padding-bottom: 30px; margin-bottom: 40px;">
        <div style="display: flex; align-items: center; justify-content: space-between;">
          <div>
            <h1 style="color: ${this.COLORS.primary}; font-size: 32px; font-weight: bold; margin: 0 0 8px 0;">
              📊 Анализ коммерческого предложения
            </h1>
            <p style="color: ${this.COLORS.muted}; font-size: 18px; margin: 0;">
              DevAssist Pro • ${new Date().toLocaleDateString('ru-RU', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          </div>
          <div style="text-align: right;">
            <div style="background: linear-gradient(135deg, ${this.COLORS.primary}, ${this.COLORS.secondary}); 
                       color: white; padding: 16px 24px; border-radius: 12px; font-size: 24px; font-weight: bold;">
              ${data.overall_score}/100
            </div>
            <p style="color: ${this.COLORS.muted}; margin: 8px 0 0 0; font-size: 14px;">Общая оценка</p>
          </div>
        </div>
      </div>

      <!-- Executive Summary -->
      <div style="margin-bottom: 40px;">
        <h2 style="color: ${this.COLORS.primary}; font-size: 24px; font-weight: bold; margin: 0 0 20px 0;">
          📈 Исполнительное резюме
        </h2>
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px;">
          ${this.createSummaryCard('🎯 Общий балл', `${data.overall_score}/100`, this.getScoreColor(data.overall_score))}
          ${this.createSummaryCard('✅ Соответствие ТЗ', `${data.compliance_percentage || 0}%`, this.COLORS.success)}
          ${this.createSummaryCard('💰 Отклонение бюджета', `${data.budget_deviation ? (data.budget_deviation > 0 ? '+' : '') + data.budget_deviation : 0}%`, 
            (data.budget_deviation && Math.abs(data.budget_deviation) > 10) ? this.COLORS.danger : this.COLORS.success)}
        </div>
      </div>

      <!-- File Information -->
      <div style="background: ${this.COLORS.cardBg}; padding: 24px; border-radius: 12px; margin-bottom: 40px;">
        <h3 style="color: ${this.COLORS.primary}; font-size: 18px; font-weight: bold; margin: 0 0 16px 0;">
          📄 Анализируемые документы
        </h3>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
          <div>
            <strong style="color: ${this.COLORS.muted};">Техническое задание:</strong>
            <p style="margin: 4px 0 0 0; color: #1f2937;">${data.tz_filename || 'Не указано'}</p>
          </div>
          <div>
            <strong style="color: ${this.COLORS.muted};">Коммерческие предложения:</strong>
            <p style="margin: 4px 0 0 0; color: #1f2937;">
              ${data.kp_filenames?.join(', ') || 'Не указано'}
            </p>
          </div>
        </div>
      </div>

      <!-- Detailed Sections -->
      ${data.sections.map((section, index) => this.createSectionHTML(section, index)).join('')}

      <!-- Footer -->
      <div style="margin-top: 60px; padding-top: 30px; border-top: 1px solid #e5e7eb; text-align: center;">
        <p style="color: ${this.COLORS.muted}; font-size: 14px; margin: 0;">
          Отчет сгенерирован с помощью DevAssist Pro AI • 
          ${new Date().toLocaleString('ru-RU')} • 
          Все права защищены
        </p>
      </div>
    `;

    return container;
  }

  /**
   * Создание карточки суммарных показателей
   */
  private createSummaryCard(title: string, value: string, color: string): string {
    return `
      <div style="background: white; padding: 24px; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); border-left: 4px solid ${color};">
        <h4 style="color: ${color}; font-size: 14px; font-weight: 600; margin: 0 0 8px 0; text-transform: uppercase; letter-spacing: 0.5px;">
          ${title}
        </h4>
        <div style="font-size: 28px; font-weight: bold; color: #1f2937; margin: 0;">
          ${value}
        </div>
      </div>
    `;
  }

  /**
   * Создание HTML для секции анализа
   */
  private createSectionHTML(section: AnalysisSection, index: number): string {
    return `
      <div style="background: white; border-radius: 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); margin-bottom: 32px; overflow: hidden;">
        <!-- Section Header -->
        <div style="background: linear-gradient(135deg, ${this.COLORS.primary}10, ${this.COLORS.secondary}10); 
                   padding: 24px; border-bottom: 1px solid #e5e7eb;">
          <div style="display: flex; align-items: center; justify-content: space-between;">
            <div style="display: flex; align-items: center;">
              <span style="font-size: 24px; margin-right: 12px;">${section.icon || '📊'}</span>
              <h3 style="color: ${this.COLORS.primary}; font-size: 20px; font-weight: bold; margin: 0;">
                ${section.title}
              </h3>
            </div>
            <div style="background: ${this.getScoreColor(section.score)}; color: white; 
                       padding: 8px 16px; border-radius: 20px; font-weight: bold; font-size: 16px;">
              ${section.score}/100
            </div>
          </div>
        </div>

        <!-- Section Content -->
        <div style="padding: 24px;">
          ${section.key_metrics ? this.createMetricsHTML(section.key_metrics) : ''}
          ${section.tables ? section.tables.map(table => this.createTableHTML(table)).join('') : ''}
          ${section.detailed_analysis ? this.createAnalysisHTML(section.detailed_analysis) : ''}
          ${section.recommendations ? this.createRecommendationsHTML(section.recommendations) : ''}
        </div>
      </div>
    `;
  }

  /**
   * Создание HTML для ключевых метрик
   */
  private createMetricsHTML(metrics: MetricData[]): string {
    return `
      <div style="margin-bottom: 24px;">
        <h4 style="color: ${this.COLORS.primary}; font-size: 16px; font-weight: 600; margin: 0 0 16px 0;">
          📈 Ключевые показатели
        </h4>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px;">
          ${metrics.map(metric => `
            <div style="background: ${this.COLORS.cardBg}; padding: 16px; border-radius: 8px; text-align: center;">
              <div style="color: ${metric.color || this.COLORS.primary}; font-size: 18px; font-weight: bold;">
                ${metric.value}
              </div>
              <div style="color: ${this.COLORS.muted}; font-size: 14px; margin-top: 4px;">
                ${metric.name}
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  /**
   * Создание HTML для таблиц
   */
  private createTableHTML(table: TableData): string {
    return `
      <div style="margin-bottom: 24px;">
        <h4 style="color: ${this.COLORS.primary}; font-size: 16px; font-weight: 600; margin: 0 0 16px 0;">
          📋 ${table.title}
        </h4>
        <div style="overflow-x: auto;">
          <table style="width: 100%; border-collapse: collapse; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
            <thead>
              <tr style="background: ${this.COLORS.primary}; color: white;">
                ${table.columns.map(col => `
                  <th style="padding: 12px 16px; text-align: left; font-weight: 600; font-size: 14px;">
                    ${col}
                  </th>
                `).join('')}
              </tr>
            </thead>
            <tbody>
              ${table.data.map((row, index) => `
                <tr style="background: ${index % 2 === 0 ? 'white' : this.COLORS.cardBg};">
                  ${row.map(cell => `
                    <td style="padding: 12px 16px; font-size: 14px; border-bottom: 1px solid #e5e7eb;">
                      ${cell}
                    </td>
                  `).join('')}
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  /**
   * Создание HTML для детального анализа
   */
  private createAnalysisHTML(analysis: string): string {
    return `
      <div style="margin-bottom: 24px;">
        <h4 style="color: ${this.COLORS.primary}; font-size: 16px; font-weight: 600; margin: 0 0 16px 0;">
          🔍 Детальный анализ
        </h4>
        <div style="background: ${this.COLORS.cardBg}; padding: 20px; border-radius: 8px; line-height: 1.7;">
          ${this.formatAnalysisText(analysis)}
        </div>
      </div>
    `;
  }

  /**
   * Создание HTML для рекомендаций
   */
  private createRecommendationsHTML(recommendations: RecommendationData[]): string {
    const getPriorityColor = (priority: string) => {
      switch (priority) {
        case 'HIGH': return this.COLORS.danger;
        case 'MEDIUM': return this.COLORS.warning;
        case 'LOW': return this.COLORS.success;
        default: return this.COLORS.muted;
      }
    };

    const getPriorityIcon = (priority: string) => {
      switch (priority) {
        case 'HIGH': return '🔴';
        case 'MEDIUM': return '🟡';
        case 'LOW': return '🟢';
        default: return '⚪';
      }
    };

    return `
      <div style="margin-bottom: 24px;">
        <h4 style="color: ${this.COLORS.primary}; font-size: 16px; font-weight: 600; margin: 0 0 16px 0;">
          💡 Рекомендации
        </h4>
        <div style="space-y: 12px;">
          ${recommendations.map(rec => `
            <div style="display: flex; align-items: flex-start; padding: 16px; background: white; 
                       border-left: 4px solid ${getPriorityColor(rec.priority)}; border-radius: 8px; 
                       box-shadow: 0 1px 3px rgba(0,0,0,0.1); margin-bottom: 12px;">
              <span style="font-size: 16px; margin-right: 12px;">${getPriorityIcon(rec.priority)}</span>
              <div>
                <div style="color: ${getPriorityColor(rec.priority)}; font-weight: 600; font-size: 12px; 
                           text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">
                  ${rec.priority === 'HIGH' ? 'Высокий приоритет' : 
                    rec.priority === 'MEDIUM' ? 'Средний приоритет' : 'Низкий приоритет'}
                </div>
                <div style="color: #1f2937; line-height: 1.6;">
                  ${rec.text}
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  /**
   * Форматирование текста анализа
   */
  private formatAnalysisText(text: string): string {
    // Разбиваем на параграфы и форматируем
    const paragraphs = text.split('\n').filter(p => p.trim().length > 0);
    return paragraphs.map(p => `<p style="margin: 0 0 12px 0; color: #374151;">${p.trim()}</p>`).join('');
  }

  /**
   * Получение цвета по оценке
   */
  private getScoreColor(score: number): string {
    if (score >= 80) return this.COLORS.success;
    if (score >= 60) return this.COLORS.warning;
    return this.COLORS.danger;
  }

  /**
   * Ожидание загрузки изображений
   */
  private async waitForImagesLoad(container: HTMLElement): Promise<void> {
    const images = container.querySelectorAll('img');
    const promises = Array.from(images).map(img => {
      return new Promise((resolve) => {
        if (img.complete) {
          resolve(true);
        } else {
          img.onload = () => resolve(true);
          img.onerror = () => resolve(true);
          // Fallback timeout
          setTimeout(() => resolve(true), 2000);
        }
      });
    });
    
    await Promise.all(promises);
    // Дополнительная пауза для рендеринга
    return new Promise(resolve => setTimeout(resolve, 500));
  }

  /**
   * Генерация PDF файла
   */
  private async generatePDF(canvas: HTMLCanvasElement, data: AnalysisData): Promise<void> {
    const imgData = canvas.toDataURL('image/png', 1.0);
    
    // Создаем PDF A4 формата
    const pdf = new jsPDF('p', 'mm', 'a4');
    
    const imgWidth = 210; // A4 width in mm
    const pageHeight = 295; // A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    let heightLeft = imgHeight;
    let position = 0;
    
    // Добавляем первую страницу
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
    heightLeft -= pageHeight;
    
    // Добавляем дополнительные страницы если необходимо
    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
      heightLeft -= pageHeight;
    }
    
    // Генерируем имя файла
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `analiz_kp_${data.id || 'export'}_${timestamp}.pdf`;
    
    // Сохраняем файл
    pdf.save(filename);
  }
}

// Экспорт singleton инстанса
export const pdfExporter = new PDFExporter();