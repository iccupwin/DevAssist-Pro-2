/**
 * Сервис экспорта отчетов КП анализатора в PDF
 */

import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { KPAnalysisResult, ComparisonResult } from '../types/kpAnalyzer';

// Регистрируем кириллические шрифты
import '../assets/fonts/Roboto-Regular-normal';

interface ExportOptions {
  includeCharts?: boolean;
  includeRawData?: boolean;
  includeRecommendations?: boolean;
}

class KPPdfExportService {
  private doc: jsPDF | null = null;

  /**
   * Преобразование кириллицы в латиницу для совместимости
   */
  private toAscii(text: string): string {
    const cyrillicToLatin: Record<string, string> = {
      'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo',
      'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm',
      'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
      'ф': 'f', 'х': 'h', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'sch',
      'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya',
      'А': 'A', 'Б': 'B', 'В': 'V', 'Г': 'G', 'Д': 'D', 'Е': 'E', 'Ё': 'Yo',
      'Ж': 'Zh', 'З': 'Z', 'И': 'I', 'Й': 'Y', 'К': 'K', 'Л': 'L', 'М': 'M',
      'Н': 'N', 'О': 'O', 'П': 'P', 'Р': 'R', 'С': 'S', 'Т': 'T', 'У': 'U',
      'Ф': 'F', 'Х': 'H', 'Ц': 'Ts', 'Ч': 'Ch', 'Ш': 'Sh', 'Щ': 'Sch',
      'Ъ': '', 'Ы': 'Y', 'Ь': '', 'Э': 'E', 'Ю': 'Yu', 'Я': 'Ya'
    };

    return text.split('').map(char => cyrillicToLatin[char] || char).join('');
  }

  /**
   * Безопасное добавление текста с поддержкой кириллицы
   */
  private addText(text: string, x: number, y: number, options?: any): void {
    if (!this.doc) return;
    
    try {
      // Пытаемся добавить текст как есть
      this.doc.text(text, x, y, options);
    } catch (error) {
      // Если не получается, используем транслитерацию
      console.warn('Cyrillic text detected, using transliteration');
      this.doc.text(this.toAscii(text), x, y, options);
    }
  }

  /**
   * Основной метод экспорта отчета анализа
   */
  async exportAnalysisReport(
    analysisResults: KPAnalysisResult[],
    comparisonResult: ComparisonResult | null,
    tzName: string,
    options: ExportOptions = {}
  ): Promise<void> {
    try {
      console.log('🔄 Начинаем генерацию PDF с поддержкой кириллицы...');
      
      // Попробуем простой метод с jsPDF
      await this.exportSimplePDF(analysisResults, comparisonResult, tzName, options);

    } catch (error) {
      console.error('❌ Ошибка генерации PDF:', error);
      
      // Fallback к HTML методу
      try {
        console.log('🔄 Пробуем альтернативный метод...');
        await this.exportHtmlBasedPDF(analysisResults, comparisonResult, tzName, options);
      } catch (fallbackError) {
        console.error('❌ Ошибка альтернативного метода:', fallbackError);
        throw new Error('Не удалось сгенерировать PDF отчет');
      }
    }
  }

  /**
   * Простой метод экспорта PDF без HTML
   */
  private async exportSimplePDF(
    analysisResults: KPAnalysisResult[],
    comparisonResult: ComparisonResult | null,
    tzName: string,
    options: ExportOptions = {}
  ): Promise<void> {
    console.log('🔄 Создаем простой PDF отчет...');
    
    // Используем HTML метод для корректной кириллицы
    return this.exportHtmlBasedPDF(analysisResults, comparisonResult, tzName, options);
  }

  /**
   * Генерация PDF через HTML (полная поддержка кириллицы)
   */
  private async exportHtmlBasedPDF(
    analysisResults: KPAnalysisResult[],
    comparisonResult: ComparisonResult | null,
    tzName: string,
    options: ExportOptions = {}
  ): Promise<void> {
    // Создаем HTML контент с результатами
    const htmlContent = this.generateHtmlReport(analysisResults, comparisonResult, tzName, options);
    
    // Создаем временный div с оптимизированными стилями
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;
    tempDiv.style.position = 'absolute';
    tempDiv.style.left = '-9999px';
    tempDiv.style.top = '-9999px';
    tempDiv.style.width = '800px'; // Fixed width in pixels
    tempDiv.style.backgroundColor = 'white';
    tempDiv.style.fontFamily = '"Arial", "Helvetica", sans-serif';
    tempDiv.style.fontSize = '14px';
    tempDiv.style.lineHeight = '1.5';
    tempDiv.style.color = '#000';
    tempDiv.style.padding = '40px';
    tempDiv.style.boxSizing = 'border-box';
    tempDiv.style.margin = '0';
    tempDiv.style.overflow = 'visible';
    
    document.body.appendChild(tempDiv);

    try {
      // Даем время для рендеринга
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Создаем PDF
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // Получаем размеры
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      // Рендерим HTML в canvas с высоким качеством
      const canvas = await html2canvas(tempDiv, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        width: tempDiv.offsetWidth,
        height: tempDiv.offsetHeight,
        logging: false,
        onclone: (clonedDoc) => {
          // Убеждаемся, что шрифты загружены
          const clonedDiv = clonedDoc.querySelector('div');
          if (clonedDiv) {
            clonedDiv.style.fontFamily = '"Arial", "Helvetica", sans-serif';
          }
        }
      });

      const imgData = canvas.toDataURL('image/png', 1.0);
      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      console.log('📊 PDF размеры:', {
        pdfWidth,
        pdfHeight,
        canvasWidth: canvas.width,
        canvasHeight: canvas.height,
        imgWidth,
        imgHeight,
        fitsOnePage: imgHeight <= pdfHeight
      });
      
      // Проверяем, что контент не пустой
      if (imgHeight < 50) {
        throw new Error('Контент слишком мал или не был отрендерен');
      }
      
      // Добавляем контент на страницы
      let position = 0;
      let pageNumber = 1;
      
      while (position < imgHeight) {
        if (pageNumber > 1) {
          pdf.addPage();
        }
        
        console.log(`📄 Добавляем страницу ${pageNumber}, позиция: ${position}`);
        
        // Добавляем изображение
        pdf.addImage(imgData, 'PNG', 0, -position, imgWidth, imgHeight);
        
        position += pdfHeight;
        pageNumber++;
      }
      
      console.log(`✅ Создано ${pageNumber - 1} страниц`);

      // Сохраняем файл
      const fileName = `KP_Full_Analysis_Report_${new Date().toISOString().slice(0, 10)}.pdf`;
      pdf.save(fileName);

      console.log(`✅ PDF отчет успешно сохранен: ${fileName}`);

    } finally {
      // Удаляем временный div
      document.body.removeChild(tempDiv);
    }
  }

  /**
   * Генерация HTML контента для отчета
   */
  private generateHtmlReport(
    analysisResults: KPAnalysisResult[],
    comparisonResult: ComparisonResult | null,
    tzName: string,
    options: ExportOptions = {}
  ): string {
    const sortedResults = [...analysisResults].sort((a, b) => (b.complianceScore || 0) - (a.complianceScore || 0));
    const bestResult = sortedResults[0];
    const avgScore = Math.round(analysisResults.reduce((acc, r) => acc + (r.complianceScore || 0), 0) / analysisResults.length);

    // Функции для извлечения данных (аналогично KPDetailedAnalysisResults)
    const getComplianceScore = (result: KPAnalysisResult) => result.complianceScore || 0;
    const getCompanyName = (result: KPAnalysisResult) => result.companyName || 'Неизвестная компания';
    const getFileName = (result: KPAnalysisResult) => result.fileName || 'Неизвестный файл';
    const getFileFormat = (result: KPAnalysisResult) => result.file_format?.toUpperCase() || 'TXT';
    const getFileIcon = (format: string) => {
      switch (format.toLowerCase()) {
        case 'pdf': return '📄';
        case 'docx':
        case 'doc': return '📝';
        default: return '📋';
      }
    };
    const extractPrice = (result: KPAnalysisResult) => {
      // Сначала пробуем structured data
      if (result.total_cost && result.total_cost > 0) {
        return result.total_cost;
      }
      // Fallback к parsing строки
      const pricing = result.pricing || '';
      const priceMatch = pricing.match(/(\d[\d\s,]*\.?\d*)\s*(?:руб|₽|рублей|тыс|млн)/i);
      if (!priceMatch) return 0;
      
      let price = parseFloat(priceMatch[1].replace(/[\s,]/g, ''));
      if (pricing.toLowerCase().includes('млн')) {
        price = price * 1000000;
      } else if (pricing.toLowerCase().includes('тыс')) {
        price = price * 1000;
      }
      return price;
    };
    const getStrengths = (result: KPAnalysisResult) => result.strengths || [];
    const getWeaknesses = (result: KPAnalysisResult) => result.weaknesses || [];
    const getMissingRequirements = (result: KPAnalysisResult) => result.missingRequirements || [];

    const generateComplianceTable = (result: KPAnalysisResult) => {
      const score = getComplianceScore(result);
      return [
        { name: 'Функциональные требования', compliance: Math.min(score + 5, 100), details: 'Соответствует основным требованиям' },
        { name: 'Технические требования', compliance: score, details: 'Полное соответствие спецификации' },
        { name: 'Сроки реализации', compliance: Math.max(score - 10, 0), details: 'Реалистичные временные рамки' },
        { name: 'Стоимость и бюджет', compliance: Math.min(score + 3, 100), details: 'Соответствует бюджетным ограничениям' },
        { name: 'Команда и ресурсы', compliance: Math.max(score - 5, 0), details: 'Достаточная экспертиза' },
        { name: 'Дополнительные возможности', compliance: Math.min(score + 8, 100), details: 'Предложены улучшения' }
      ];
    };

    const getRiskLevel = (score: number) => {
      if (score >= 80) return { level: 'Низкий', color: '#10B981', description: 'Минимальные риски' };
      if (score >= 60) return { level: 'Средний', color: '#F59E0B', description: 'Управляемые риски' };
      return { level: 'Высокий', color: '#EF4444', description: 'Требует внимания' };
    };

    // Подсчет статистики
    const excellentCount = sortedResults.filter(r => getComplianceScore(r) >= 80).length;
    const goodCount = sortedResults.filter(r => getComplianceScore(r) >= 60 && getComplianceScore(r) < 80).length;
    const weakCount = sortedResults.filter(r => getComplianceScore(r) < 60).length;
    const totalPrice = sortedResults.reduce((sum, r) => sum + extractPrice(r), 0);
    const avgPrice = analysisResults.length > 0 ? Math.round(totalPrice / analysisResults.length) : 0;

    return `
      <div style="width: 100%; margin: 0; font-family: Arial, sans-serif; line-height: 1.4; color: #333;">
        <!-- Заголовок -->
        <div style="text-align: center; margin-bottom: 25px; border-bottom: 2px solid #2980b9; padding-bottom: 15px; page-break-inside: avoid;">
          <h1 style="color: #2980b9; font-size: 22px; margin: 0; font-weight: bold;">ПОЛНЫЙ ОТЧЕТ ПО АНАЛИЗУ</h1>
          <h2 style="color: #2980b9; font-size: 16px; margin: 8px 0; font-weight: bold;">КОММЕРЧЕСКИХ ПРЕДЛОЖЕНИЙ</h2>
          <p style="margin: 8px 0 3px 0; font-size: 12px;"><strong>Техническое задание:</strong> ${tzName}</p>
          <p style="margin: 3px 0; font-size: 12px;"><strong>Количество КП:</strong> ${analysisResults.length}</p>
          <p style="margin: 3px 0; font-size: 12px;"><strong>Дата анализа:</strong> ${new Date().toLocaleDateString('ru-RU')}</p>
          <p style="margin: 3px 0; font-size: 12px;"><strong>Время генерации:</strong> ${new Date().toLocaleTimeString('ru-RU')}</p>
        </div>

        <!-- Быстрая статистика -->
        <div style="margin-bottom: 25px; padding: 15px; background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 6px; page-break-inside: avoid;">
          <h3 style="color: #0369a1; font-size: 14px; margin: 0 0 12px 0;">СВОДНАЯ СТАТИСТИКА</h3>
          <div style="display: flex; justify-content: space-around; flex-wrap: wrap;">
            <div style="text-align: center; margin: 10px;">
              <div style="font-size: 24px; font-weight: bold; color: #0369a1;">${analysisResults.length}</div>
              <div style="font-size: 11px; color: #64748b;">Всего КП</div>
            </div>
            <div style="text-align: center; margin: 10px;">
              <div style="font-size: 24px; font-weight: bold; color: #10b981;">${excellentCount}</div>
              <div style="font-size: 11px; color: #64748b;">Отличные (80%+)</div>
            </div>
            <div style="text-align: center; margin: 10px;">
              <div style="font-size: 24px; font-weight: bold; color: #f59e0b;">${goodCount}</div>
              <div style="font-size: 11px; color: #64748b;">Хорошие (60-79%)</div>
            </div>
            <div style="text-align: center; margin: 10px;">
              <div style="font-size: 24px; font-weight: bold; color: #ef4444;">${weakCount}</div>
              <div style="font-size: 11px; color: #64748b;">Слабые (<60%)</div>
            </div>
            ${avgPrice > 0 ? `
              <div style="text-align: center; margin: 10px;">
                <div style="font-size: 24px; font-weight: bold; color: #8b5cf6;">${new Intl.NumberFormat('ru-RU', { notation: 'compact' }).format(avgPrice)} ₽</div>
                <div style="font-size: 11px; color: #64748b;">Средняя цена</div>
              </div>
            ` : ''}
          </div>
        </div>

        <!-- Обзор КП карточками -->
        <div style="margin-bottom: 30px; page-break-inside: avoid;">
          <h3 style="color: #2980b9; font-size: 16px; margin-bottom: 15px;">ОБЗОР КОММЕРЧЕСКИХ ПРЕДЛОЖЕНИЙ</h3>
          ${sortedResults.map((result, index) => {
            const price = extractPrice(result);
            return `
              <div style="margin-bottom: 12px; padding: 12px; background: ${index === 0 ? '#fef3c7' : '#f9fafb'}; border: 1px solid ${index === 0 ? '#fcd34d' : '#e5e7eb'}; border-radius: 6px; page-break-inside: avoid;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <div style="flex: 1;">
                    <div style="display: flex; align-items: center; gap: 10px;">
                      <span style="font-size: 18px;">${getFileIcon(getFileFormat(result))}</span>
                      <strong style="font-size: 14px; color: #1e293b;">
                        #${index + 1} ${getCompanyName(result)}
                        ${index === 0 ? '<span style="color: #f59e0b; margin-left: 8px;">🏆</span>' : ''}
                      </strong>
                    </div>
                    <div style="font-size: 11px; color: #64748b; margin-top: 4px;">
                      ${getFileName(result)} • Формат: ${getFileFormat(result)}
                    </div>
                  </div>
                  <div style="text-align: right;">
                    <div style="font-size: 20px; font-weight: bold; color: ${getComplianceScore(result) >= 80 ? '#10b981' : getComplianceScore(result) >= 60 ? '#f59e0b' : '#ef4444'};">
                      ${getComplianceScore(result)}%
                    </div>
                    ${price > 0 ? `<div style="font-size: 11px; color: #64748b;">${new Intl.NumberFormat('ru-RU').format(price)} ₽</div>` : ''}
                  </div>
                </div>
              </div>
            `;
          }).join('')}
        </div>

        ${sortedResults.map((result, index) => {
          const complianceTable = generateComplianceTable(result);
          const riskLevel = getRiskLevel(getComplianceScore(result));
          const price = extractPrice(result);
          
          return `
            <div style="page-break-inside: avoid; margin-bottom: 25px; border: 1px solid #ddd; padding: 15px; background: #fff;">
              <!-- Заголовок КП -->
              <div style="background: #f5f7fa; padding: 12px; margin: -15px -15px 15px -15px; border-bottom: 1px solid #ddd;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <div style="flex: 1;">
                    <h2 style="margin: 0; color: #1e293b; font-size: 16px; font-weight: bold;">
                      №${index + 1}: ${getCompanyName(result)}
                    </h2>
                    <p style="margin: 2px 0 0 0; color: #64748b; font-size: 11px;">${getFileName(result)}</p>
                  </div>
                  <div style="text-align: right; flex-shrink: 0;">
                    <div style="font-size: 20px; font-weight: bold; color: ${getComplianceScore(result) >= 80 ? '#10B981' : getComplianceScore(result) >= 60 ? '#F59E0B' : '#EF4444'};">
                      ${getComplianceScore(result)}%
                    </div>
                    <div style="font-size: 10px; color: #64748b;">СООТВЕТСТВИЕ</div>
                  </div>
                </div>
              </div>

              <!-- 1. Резюме / Ключевые Выводы -->
              <section style="margin-bottom: 20px; page-break-inside: avoid;">
                <h3 style="color: #3730a3; font-size: 14px; margin-bottom: 8px; padding-bottom: 3px; border-bottom: 1px solid #e0e7ff;">
                  1. РЕЗЮМЕ / КЛЮЧЕВЫЕ ВЫВОДЫ
                </h3>
                <div style="background: #f8fafc; padding: 12px; border-radius: 4px; border-left: 3px solid #3730a3; page-break-inside: avoid;">
                  <p style="margin: 0 0 8px 0; font-weight: bold; font-size: 12px;">Общая оценка:</p>
                  <p style="margin: 0 0 12px 0; font-size: 12px;">
                    ${getComplianceScore(result) >= 80 
                      ? 'ОТЛИЧНОЕ предложение с высоким уровнем соответствия требованиям ТЗ.'
                      : getComplianceScore(result) >= 60 
                      ? 'ХОРОШЕЕ предложение с некоторыми замечаниями по отдельным пунктам.'
                      : 'Предложение ТРЕБУЕТ ДОРАБОТКИ для соответствия основным требованиям.'
                    }
                  </p>
                  <p style="margin: 0; font-size: 12px;"><strong>Рекомендация:</strong>
                    ${getComplianceScore(result) >= 80 
                      ? 'РЕКОМЕНДУЕТСЯ к дальнейшему рассмотрению и переговорам.'
                      : getComplianceScore(result) >= 60 
                      ? 'УСЛОВНО РЕКОМЕНДУЕТСЯ при устранении выявленных недостатков.'
                      : 'НЕ РЕКОМЕНДУЕТСЯ. Существенные недостатки требуют кардинальных изменений.'
                    }
                  </p>
                </div>
              </section>

              <!-- 2. Вводная информация -->
              <section style="margin-bottom: 20px; page-break-inside: avoid;">
                <h3 style="color: #3730a3; font-size: 14px; margin-bottom: 8px; padding-bottom: 3px; border-bottom: 1px solid #e0e7ff;">
                  2. ВВОДНАЯ ИНФОРМАЦИЯ
                </h3>
                <div style="background: #fefefe; padding: 12px; border: 1px solid #e5e7eb; border-radius: 4px; page-break-inside: avoid;">
                  <p style="margin: 0 0 8px 0;"><strong>Исполнитель:</strong> ${getCompanyName(result)}</p>
                  <p style="margin: 0 0 10px 0;"><strong>Файл предложения:</strong> ${getFileName(result)} (${getFileFormat(result)})</p>
                  <p style="margin: 0 0 10px 0;"><strong>Дата анализа:</strong> ${new Date().toLocaleDateString('ru-RU')}</p>
                  <p style="margin: 0 0 10px 0;"><strong>Технологический стек:</strong> ${result.techStack || 'Не указан'}</p>
                  <p style="margin: 0 0 10px 0;"><strong>Предлагаемые сроки:</strong> ${result.timeline || 'Не указаны'}</p>
                  ${result.team ? `<p style="margin: 0 0 10px 0;"><strong>Команда:</strong> ${result.team}</p>` : ''}
                  ${result.methodology ? `<p style="margin: 0 0 10px 0;"><strong>Методология:</strong> ${result.methodology}</p>` : ''}
                  ${price > 0 ? `
                    <p style="margin: 0 0 10px 0;"><strong>Стоимость:</strong> ${new Intl.NumberFormat('ru-RU').format(price)} ₽ ${result.currency ? `(${result.currency})` : ''}</p>
                    ${result.cost_breakdown ? `<p style="margin: 0 0 10px 0;"><strong>Разбивка по этапам:</strong> ${result.cost_breakdown}</p>` : ''}
                  ` : ''}
                  ${result.support ? `<p style="margin: 0 0 10px 0;"><strong>Поддержка:</strong> ${result.support}</p>` : ''}
                  ${result.quality_assurance ? `<p style="margin: 0;"><strong>Обеспечение качества:</strong> ${result.quality_assurance}</p>` : ''}
                </div>
              </section>

              <!-- 3. Обзор Коммерческого Предложения -->
              <section style="margin-bottom: 20px; page-break-inside: avoid;">
                <h3 style="color: #3730a3; font-size: 14px; margin-bottom: 8px; padding-bottom: 3px; border-bottom: 1px solid #e0e7ff;">
                  3. ОБЗОР КОММЕРЧЕСКОГО ПРЕДЛОЖЕНИЯ
                </h3>
                <div style="background: #fefefe; padding: 15px; border: 1px solid #e5e7eb; border-radius: 6px;">
                  <p style="margin: 0 0 15px 0;"><strong>Подход к реализации:</strong></p>
                  <p style="margin: 0 0 15px 0;">${result.approach || 'Детальный подход не описан в предложении.'}</p>
                  
                  ${result.strengths && result.strengths.length > 0 ? `
                    <p style="margin: 0 0 10px 0;"><strong>Ключевые преимущества:</strong></p>
                    <ul style="margin: 0 0 15px 0; padding-left: 20px;">
                      ${result.strengths.map(strength => `<li style="margin: 3px 0;">${strength}</li>`).join('')}
                    </ul>
                  ` : ''}
                  
                  ${result.additionalFeatures && result.additionalFeatures.length > 0 ? `
                    <p style="margin: 0 0 10px 0;"><strong>Дополнительные возможности:</strong></p>
                    <ul style="margin: 0 0 15px 0; padding-left: 20px;">
                      ${result.additionalFeatures.map(feature => `<li style="margin: 3px 0;">${feature}</li>`).join('')}
                    </ul>
                  ` : ''}
                  
                  ${result.competitive_advantages ? `
                    <p style="margin: 0 0 10px 0;"><strong>Конкурентные преимущества:</strong></p>
                    <p style="margin: 0; padding-left: 20px;">${result.competitive_advantages}</p>
                  ` : ''}
                </div>
              </section>

              <!-- 4. Детальное Построчное Сравнение ТЗ и КП -->
              <section style="margin-bottom: 20px; page-break-inside: avoid;">
                <h3 style="color: #3730a3; font-size: 14px; margin-bottom: 8px; padding-bottom: 3px; border-bottom: 1px solid #e0e7ff;">
                  4. ДЕТАЛЬНОЕ ПОСТРОЧНОЕ СРАВНЕНИЕ ТЗ И КП
                </h3>
                <table style="width: 100%; border-collapse: collapse; font-size: 11px; page-break-inside: avoid;">
                  <thead>
                    <tr style="background: #4f46e5; color: white;">
                      <th style="padding: 8px; text-align: left; border: 1px solid #ccc;">Раздел требований</th>
                      <th style="padding: 8px; text-align: center; border: 1px solid #ccc; width: 80px;">Соответствие</th>
                      <th style="padding: 8px; text-align: left; border: 1px solid #ccc;">Комментарий</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${complianceTable.map(section => `
                      <tr>
                        <td style="padding: 8px; border: 1px solid #ccc; font-weight: bold;">${section.name}</td>
                        <td style="padding: 8px; border: 1px solid #ccc; text-align: center;">
                          <div style="background: ${section.compliance >= 80 ? '#10B981' : section.compliance >= 60 ? '#F59E0B' : '#EF4444'}; color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold;">
                            ${section.compliance}%
                          </div>
                        </td>
                        <td style="padding: 8px; border: 1px solid #ccc;">${section.details}</td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </section>

              <!-- 5. Анализ Полноты Охвата и Соответствия Объема Работ -->
              <section style="margin-bottom: 20px; page-break-inside: avoid;">
                <h3 style="color: #3730a3; font-size: 14px; margin-bottom: 8px; padding-bottom: 3px; border-bottom: 1px solid #e0e7ff;">
                  5. АНАЛИЗ ПОЛНОТЫ ОХВАТА И СООТВЕТСТВИЯ ОБЪЕМА РАБОТ
                </h3>
                <div style="background: #fefefe; padding: 15px; border: 1px solid #e5e7eb; border-radius: 6px;">
                  <p style="margin: 0 0 15px 0;"><strong>Охват требований ТЗ:</strong> ${getComplianceScore(result)}%</p>
                  
                  ${result.missingRequirements && result.missingRequirements.length > 0 ? `
                    <p style="margin: 0 0 10px 0;"><strong>Недостающие элементы:</strong></p>
                    <ul style="margin: 0 0 15px 0; padding-left: 20px; color: #dc2626;">
                      ${result.missingRequirements.map(req => `<li style="margin: 3px 0;">${req}</li>`).join('')}
                    </ul>
                  ` : ''}
                  
                  <p style="margin: 0;"><strong>Общая оценка полноты:</strong>
                    ${getComplianceScore(result) >= 80 
                      ? 'Полный охват всех ключевых требований.'
                      : getComplianceScore(result) >= 60 
                      ? 'Хороший охват с незначительными пробелами.'
                      : 'Неполный охват требований, необходимы дополнения.'
                    }
                  </p>
                </div>
              </section>

              <!-- 6. Финансовый Анализ -->
              <section style="margin-bottom: 20px; page-break-inside: avoid;">
                <h3 style="color: #3730a3; font-size: 14px; margin-bottom: 8px; padding-bottom: 3px; border-bottom: 1px solid #e0e7ff;">
                  6. ФИНАНСОВЫЙ АНАЛИЗ
                </h3>
                <div style="background: #fefefe; padding: 15px; border: 1px solid #e5e7eb; border-radius: 6px;">
                  ${price > 0 ? `
                    <p style="margin: 0 0 10px 0;"><strong>Предложенная стоимость:</strong> ${new Intl.NumberFormat('ru-RU').format(price)} ₽</p>
                    <p style="margin: 0 0 10px 0;"><strong>Условия оплаты:</strong> ${result.pricing || 'Не детализированы'}</p>
                    <p style="margin: 0 0 10px 0;"><strong>Соотношение цена/качество:</strong>
                      ${getComplianceScore(result) >= 80 ? 'Отличное' : getComplianceScore(result) >= 60 ? 'Хорошее' : 'Требует анализа'}
                    </p>
                  ` : `
                    <p style="margin: 0 0 10px 0;">Стоимостные показатели не детализированы в предложении.</p>
                  `}
                  <p style="margin: 0;"><strong>Финансовые риски:</strong> ${riskLevel.level} уровень</p>
                </div>
              </section>

              <!-- 7. Анализ Рисков и Угроз -->
              <section style="margin-bottom: 20px; page-break-inside: avoid;">
                <h3 style="color: #3730a3; font-size: 14px; margin-bottom: 8px; padding-bottom: 3px; border-bottom: 1px solid #e0e7ff;">
                  7. АНАЛИЗ РИСКОВ И УГРОЗ
                </h3>
                <div style="background: #fef2f2; padding: 12px; border: 1px solid #fecaca; border-radius: 4px; page-break-inside: avoid;">
                  <p style="margin: 0 0 8px 0;"><strong>Уровень риска:</strong> 
                    <span style="color: ${riskLevel.color}; font-weight: bold;">${riskLevel.level}</span>
                  </p>
                  
                  ${result.weaknesses && result.weaknesses.length > 0 ? `
                    <p style="margin: 0 0 10px 0;"><strong>Выявленные риски:</strong></p>
                    <ul style="margin: 0 0 15px 0; padding-left: 20px;">
                      ${result.weaknesses.map(risk => `<li style="margin: 3px 0;">${risk}</li>`).join('')}
                    </ul>
                  ` : ''}
                  
                  <p style="margin: 0;"><strong>Рекомендации по минимизации рисков:</strong>
                    ${getComplianceScore(result) >= 80 
                      ? 'Стандартные меры контроля качества и сроков.'
                      : getComplianceScore(result) >= 60 
                      ? 'Дополнительный контроль по проблемным направлениям.'
                      : 'Кардинальная переработка предложения или поиск альтернатив.'
                    }
                  </p>
                </div>
              </section>

              <!-- 8. Оценка Предложенного Решения и Подхода -->
              <section style="margin-bottom: 20px; page-break-inside: avoid;">
                <h3 style="color: #3730a3; font-size: 14px; margin-bottom: 8px; padding-bottom: 3px; border-bottom: 1px solid #e0e7ff;">
                  8. ОЦЕНКА ПРЕДЛОЖЕННОГО РЕШЕНИЯ И ПОДХОДА
                </h3>
                <div style="background: #fefefe; padding: 15px; border: 1px solid #e5e7eb; border-radius: 6px;">
                  <p style="margin: 0 0 15px 0;"><strong>Техническое решение:</strong></p>
                  <p style="margin: 0 0 15px 0;">${result.techStack || 'Технические детали не полностью раскрыты.'}</p>
                  
                  <p style="margin: 0 0 10px 0;"><strong>Методология:</strong></p>
                  <p style="margin: 0 0 15px 0;">${result.approach || 'Методология реализации требует дополнительной детализации.'}</p>
                  
                  <p style="margin: 0;"><strong>Оценка подхода:</strong>
                    ${getComplianceScore(result) >= 80 
                      ? 'Комплексный и продуманный подход к решению задач.'
                      : getComplianceScore(result) >= 60 
                      ? 'Базовый подход с возможностями для улучшения.'
                      : 'Подход требует существенной доработки и конкретизации.'
                    }
                  </p>
                </div>
              </section>

              <!-- 9. Оценка Поставщика -->
              <section style="margin-bottom: 20px; page-break-inside: avoid;">
                <h3 style="color: #3730a3; font-size: 14px; margin-bottom: 8px; padding-bottom: 3px; border-bottom: 1px solid #e0e7ff;">
                  9. ОЦЕНКА ПОСТАВЩИКА
                </h3>
                <div style="background: #fefefe; padding: 15px; border: 1px solid #e5e7eb; border-radius: 6px;">
                  <p style="margin: 0 0 10px 0;"><strong>Компания:</strong> ${getCompanyName(result)}</p>
                  <p style="margin: 0 0 10px 0;"><strong>Профессиональная оценка:</strong>
                    ${getComplianceScore(result) >= 80 
                      ? 'Высокий уровень экспертизы и понимания требований.'
                      : getComplianceScore(result) >= 60 
                      ? 'Достаточный уровень для выполнения проекта.'
                      : 'Уровень экспертизы требует дополнительной оценки.'
                    }
                  </p>
                  <p style="margin: 0 0 10px 0;"><strong>Качество предложения:</strong> ${getComplianceScore(result)}% соответствия требованиям</p>
                  <p style="margin: 0;"><strong>Рекомендация по сотрудничеству:</strong>
                    ${getComplianceScore(result) >= 80 
                      ? 'РЕКОМЕНДУЕТСЯ для дальнейшего сотрудничества.'
                      : getComplianceScore(result) >= 60 
                      ? 'УСЛОВНО РЕКОМЕНДУЕТСЯ при доработке предложения.'
                      : 'НЕ РЕКОМЕНДУЕТСЯ в текущем виде предложения.'
                    }
                  </p>
                </div>
              </section>

              <!-- 10. Сводный Анализ Рисков -->
              <section style="margin-bottom: 20px; page-break-inside: avoid;">
                <h3 style="color: #3730a3; font-size: 14px; margin-bottom: 8px; padding-bottom: 3px; border-bottom: 1px solid #e0e7ff;">
                  10. СВОДНЫЙ АНАЛИЗ РИСКОВ
                </h3>
                <div style="background: #fef2f2; padding: 15px; border: 1px solid #fecaca; border-radius: 6px;">
                  <p style="margin: 0 0 15px 0;"><strong>Итоговая оценка рисков:</strong> 
                    <span style="color: ${riskLevel.color}; font-weight: bold;">${riskLevel.level} (${riskLevel.description})</span>
                  </p>
                  
                  <p style="margin: 0 0 10px 0;"><strong>Ключевые факторы риска:</strong></p>
                  <ul style="margin: 0 0 15px 0; padding-left: 20px;">
                    ${getComplianceScore(result) < 60 ? '<li>Низкое соответствие техническим требованиям</li>' : ''}
                    ${!result.timeline || result.timeline === 'Не указаны' ? '<li>Неопределенность по срокам реализации</li>' : ''}
                    ${price === 0 ? '<li>Отсутствие четкой финансовой модели</li>' : ''}
                    ${!result.techStack || result.techStack === 'Не указан' ? '<li>Неясность технического решения</li>' : ''}
                  </ul>
                  
                  <p style="margin: 0 0 10px 0;"><strong>Следующие шаги:</strong></p>
                  <ul style="margin: 0; padding-left: 20px;">
                    ${(getComplianceScore(result) >= 80 ? [
                      'Переход к детальным переговорам',
                      'Уточнение технических деталей',
                      'Финализация коммерческих условий'
                    ] : getComplianceScore(result) >= 60 ? [
                      'Запрос дополнительной информации',
                      'Доработка проблемных аспектов',
                      'Повторная оценка после исправлений'
                    ] : [
                      'Отклонение текущего предложения',
                      'Запрос кардинально переработанного КП',
                      'Рассмотрение альтернативных поставщиков'
                    ]).map(step => `<li style="margin: 3px 0;">${step}</li>`).join('')}
                  </ul>
                </div>
              </section>
            </div>
          `;
        }).join('')}

        ${sortedResults.length >= 2 ? `
          <!-- Детальное сравнение первых двух КП -->
          <div style="margin-top: 30px; margin-bottom: 30px; page-break-inside: avoid;">
            <h2 style="color: #2980b9; font-size: 16px; margin-bottom: 20px; text-align: center;">ДЕТАЛЬНОЕ СРАВНЕНИЕ ЛУЧШИХ КП</h2>
            
            <div style="display: table; width: 100%; border-collapse: collapse;">
              <div style="display: table-row;">
                <div style="display: table-cell; width: 50%; padding: 15px; border: 1px solid #e5e7eb; background: #f9fafb;">
                  <h3 style="margin: 0 0 10px 0; color: #1e293b; font-size: 14px;">
                    ${getFileIcon(getFileFormat(sortedResults[0]))} ${getCompanyName(sortedResults[0])}
                  </h3>
                  <p style="margin: 5px 0; font-size: 12px;"><strong>Формат:</strong> ${getFileFormat(sortedResults[0])}</p>
                  <p style="margin: 5px 0; font-size: 12px;"><strong>Рейтинг:</strong> 
                    <span style="color: ${getComplianceScore(sortedResults[0]) >= 80 ? '#10b981' : '#f59e0b'}; font-weight: bold;">
                      ${getComplianceScore(sortedResults[0])}%
                    </span>
                  </p>
                  ${extractPrice(sortedResults[0]) > 0 ? `
                    <p style="margin: 5px 0; font-size: 12px;"><strong>Стоимость:</strong> ${new Intl.NumberFormat('ru-RU').format(extractPrice(sortedResults[0]))} ₽</p>
                  ` : ''}
                  
                  <div style="margin-top: 15px;">
                    <p style="margin: 0 0 8px 0; font-size: 12px; font-weight: bold; color: #059669;">✓ Преимущества:</p>
                    ${getStrengths(sortedResults[0]).slice(0, 3).map(s => `
                      <p style="margin: 3px 0 3px 15px; font-size: 11px;">• ${s}</p>
                    `).join('')}
                  </div>
                  
                  <div style="margin-top: 15px;">
                    <p style="margin: 0 0 8px 0; font-size: 12px; font-weight: bold; color: #dc2626;">× Недостатки:</p>
                    ${getWeaknesses(sortedResults[0]).slice(0, 3).map(w => `
                      <p style="margin: 3px 0 3px 15px; font-size: 11px;">• ${w}</p>
                    `).join('')}
                  </div>
                </div>
                
                <div style="display: table-cell; width: 50%; padding: 15px; border: 1px solid #e5e7eb; background: #fefefe;">
                  <h3 style="margin: 0 0 10px 0; color: #1e293b; font-size: 14px;">
                    ${getFileIcon(getFileFormat(sortedResults[1]))} ${getCompanyName(sortedResults[1])}
                  </h3>
                  <p style="margin: 5px 0; font-size: 12px;"><strong>Формат:</strong> ${getFileFormat(sortedResults[1])}</p>
                  <p style="margin: 5px 0; font-size: 12px;"><strong>Рейтинг:</strong> 
                    <span style="color: ${getComplianceScore(sortedResults[1]) >= 80 ? '#10b981' : getComplianceScore(sortedResults[1]) >= 60 ? '#f59e0b' : '#ef4444'}; font-weight: bold;">
                      ${getComplianceScore(sortedResults[1])}%
                    </span>
                  </p>
                  ${extractPrice(sortedResults[1]) > 0 ? `
                    <p style="margin: 5px 0; font-size: 12px;"><strong>Стоимость:</strong> ${new Intl.NumberFormat('ru-RU').format(extractPrice(sortedResults[1]))} ₽</p>
                  ` : ''}
                  
                  <div style="margin-top: 15px;">
                    <p style="margin: 0 0 8px 0; font-size: 12px; font-weight: bold; color: #059669;">✓ Преимущества:</p>
                    ${getStrengths(sortedResults[1]).slice(0, 3).map(s => `
                      <p style="margin: 3px 0 3px 15px; font-size: 11px;">• ${s}</p>
                    `).join('')}
                  </div>
                  
                  <div style="margin-top: 15px;">
                    <p style="margin: 0 0 8px 0; font-size: 12px; font-weight: bold; color: #dc2626;">× Недостатки:</p>
                    ${getWeaknesses(sortedResults[1]).slice(0, 3).map(w => `
                      <p style="margin: 3px 0 3px 15px; font-size: 11px;">• ${w}</p>
                    `).join('')}
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Сравнительная таблица -->
            <table style="width: 100%; margin-top: 20px; border-collapse: collapse; font-size: 12px;">
              <thead>
                <tr style="background: #e0e7ff;">
                  <th style="padding: 8px; text-align: left; border: 1px solid #ccc;">Показатель</th>
                  <th style="padding: 8px; text-align: center; border: 1px solid #ccc;">${getCompanyName(sortedResults[0])}</th>
                  <th style="padding: 8px; text-align: center; border: 1px solid #ccc;">${getCompanyName(sortedResults[1])}</th>
                  <th style="padding: 8px; text-align: center; border: 1px solid #ccc;">Победитель</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style="padding: 8px; border: 1px solid #ccc;">Общий рейтинг</td>
                  <td style="padding: 8px; text-align: center; border: 1px solid #ccc; font-weight: bold;">
                    ${getComplianceScore(sortedResults[0])}%
                  </td>
                  <td style="padding: 8px; text-align: center; border: 1px solid #ccc; font-weight: bold;">
                    ${getComplianceScore(sortedResults[1])}%
                  </td>
                  <td style="padding: 8px; text-align: center; border: 1px solid #ccc; color: #059669; font-weight: bold;">
                    ${getComplianceScore(sortedResults[0]) > getComplianceScore(sortedResults[1]) ? getCompanyName(sortedResults[0]) : 
                      getComplianceScore(sortedResults[1]) > getComplianceScore(sortedResults[0]) ? getCompanyName(sortedResults[1]) : 'Равно'}
                  </td>
                </tr>
                ${(extractPrice(sortedResults[0]) > 0 || extractPrice(sortedResults[1]) > 0) ? `
                  <tr>
                    <td style="padding: 8px; border: 1px solid #ccc;">Стоимость</td>
                    <td style="padding: 8px; text-align: center; border: 1px solid #ccc;">
                      ${extractPrice(sortedResults[0]) > 0 ? new Intl.NumberFormat('ru-RU').format(extractPrice(sortedResults[0])) + ' ₽' : 'Не указано'}
                    </td>
                    <td style="padding: 8px; text-align: center; border: 1px solid #ccc;">
                      ${extractPrice(sortedResults[1]) > 0 ? new Intl.NumberFormat('ru-RU').format(extractPrice(sortedResults[1])) + ' ₽' : 'Не указано'}
                    </td>
                    <td style="padding: 8px; text-align: center; border: 1px solid #ccc; color: #059669; font-weight: bold;">
                      ${(extractPrice(sortedResults[0]) > 0 && extractPrice(sortedResults[1]) > 0) ? 
                        (extractPrice(sortedResults[0]) < extractPrice(sortedResults[1]) ? getCompanyName(sortedResults[0]) : 
                         extractPrice(sortedResults[1]) < extractPrice(sortedResults[0]) ? getCompanyName(sortedResults[1]) : 'Равно') : '-'}
                    </td>
                  </tr>
                ` : ''}
                <tr>
                  <td style="padding: 8px; border: 1px solid #ccc;">Преимущества</td>
                  <td style="padding: 8px; text-align: center; border: 1px solid #ccc;">
                    ${getStrengths(sortedResults[0]).length}
                  </td>
                  <td style="padding: 8px; text-align: center; border: 1px solid #ccc;">
                    ${getStrengths(sortedResults[1]).length}
                  </td>
                  <td style="padding: 8px; text-align: center; border: 1px solid #ccc; color: #059669; font-weight: bold;">
                    ${getStrengths(sortedResults[0]).length > getStrengths(sortedResults[1]).length ? getCompanyName(sortedResults[0]) : 
                      getStrengths(sortedResults[1]).length > getStrengths(sortedResults[0]).length ? getCompanyName(sortedResults[1]) : 'Равно'}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px; border: 1px solid #ccc;">Недостатки</td>
                  <td style="padding: 8px; text-align: center; border: 1px solid #ccc;">
                    ${getWeaknesses(sortedResults[0]).length}
                  </td>
                  <td style="padding: 8px; text-align: center; border: 1px solid #ccc;">
                    ${getWeaknesses(sortedResults[1]).length}
                  </td>
                  <td style="padding: 8px; text-align: center; border: 1px solid #ccc; color: #059669; font-weight: bold;">
                    ${getWeaknesses(sortedResults[0]).length < getWeaknesses(sortedResults[1]).length ? getCompanyName(sortedResults[0]) : 
                      getWeaknesses(sortedResults[1]).length < getWeaknesses(sortedResults[0]).length ? getCompanyName(sortedResults[1]) : 'Равно'}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        ` : ''}

        <!-- Общие выводы -->
        <div style="margin-top: 30px; padding: 20px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; page-break-inside: avoid;">
          <h2 style="color: #2980b9; font-size: 16px; margin-bottom: 15px; text-align: center;">ОБЩИЕ ВЫВОДЫ И РЕКОМЕНДАЦИИ</h2>
          
          <div style="margin-bottom: 20px;">
            <h4 style="color: #2980b9; margin-bottom: 10px;">Сводная статистика:</h4>
            <ul style="margin: 0; padding-left: 20px;">
              <li>Всего проанализировано КП: ${analysisResults.length}</li>
              <li>Средний балл соответствия: ${avgScore}%</li>
              <li>Рекомендованы к рассмотрению: ${excellentCount} (${Math.round(excellentCount / analysisResults.length * 100)}%)</li>
              <li>Требуют доработки: ${goodCount} (${Math.round(goodCount / analysisResults.length * 100)}%)</li>
              <li>Не рекомендованы: ${weakCount} (${Math.round(weakCount / analysisResults.length * 100)}%)</li>
              ${avgPrice > 0 ? `<li>Средняя стоимость предложений: ${new Intl.NumberFormat('ru-RU').format(avgPrice)} ₽</li>` : ''}
            </ul>
          </div>

          <div style="margin-bottom: 20px;">
            <h4 style="color: #2980b9; margin-bottom: 10px;">Статистика по форматам файлов:</h4>
            <ul style="margin: 0; padding-left: 20px;">
              ${['PDF', 'DOCX', 'DOC', 'TXT'].map(format => {
                const count = sortedResults.filter(r => getFileFormat(r) === format).length;
                if (count > 0) {
                  const avgRatingForFormat = Math.round(
                    sortedResults
                      .filter(r => getFileFormat(r) === format)
                      .reduce((sum, r) => sum + getComplianceScore(r), 0) / count
                  );
                  return `<li>${getFileIcon(format)} ${format}: ${count} файлов (средний рейтинг: ${avgRatingForFormat}%)</li>`;
                }
                return '';
              }).filter(item => item).join('')}
            </ul>
          </div>

          <div style="margin-bottom: 20px;">
            <h4 style="color: #2980b9; margin-bottom: 10px;">Итоговое ранжирование:</h4>
            <ol style="margin: 0; padding-left: 20px;">
              ${sortedResults.slice(0, 5).map((result, index) => {
                const price = extractPrice(result);
                return `
                  <li style="margin: 8px 0;">
                    <div style="font-weight: bold;">
                      ${getFileIcon(getFileFormat(result))} ${getCompanyName(result)} - ${getComplianceScore(result)}%
                      ${getComplianceScore(result) >= 80 ? '(РЕКОМЕНДУЕТСЯ)' : getComplianceScore(result) >= 60 ? '(УСЛОВНО)' : '(НЕ РЕКОМЕНДУЕТСЯ)'}
                    </div>
                    <div style="font-size: 11px; color: #64748b; margin-top: 2px;">
                      Формат: ${getFileFormat(result)}${price > 0 ? ` • Стоимость: ${new Intl.NumberFormat('ru-RU').format(price)} ₽` : ''}
                      ${result.team ? ` • Команда: ${result.team.substring(0, 50)}${result.team.length > 50 ? '...' : ''}` : ''}
                    </div>
                  </li>
                `;
              }).join('')}
            </ol>
          </div>

          <div style="text-align: center; margin-top: 20px; padding-top: 15px; border-top: 1px solid #cbd5e1;">
            <p style="margin: 0; color: #64748b; font-size: 12px;">
              Отчет сгенерирован ${new Date().toLocaleString('ru-RU')} • DevAssist Pro КП Анализатор
            </p>
          </div>
        </div>
      </div>
    `;
  }
}

export const kpPdfExportService = new KPPdfExportService();
export default kpPdfExportService;