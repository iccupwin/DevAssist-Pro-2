/**
 * JSPDF Exporter - Решение проблемы с кириллицей в PDF
 * Использует jsPDF с правильной поддержкой UTF-8 и кириллицы
 */

import React, { useState } from 'react';
import { jsPDF } from 'jspdf';
import { saveAs } from 'file-saver';
import { FileDown, Loader } from 'lucide-react';

// Тестовая строка кириллицы для проверки
const CYRILLIC_TEST = 'Анализ коммерческого предложения - тест кириллицы: АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ абвгдеёжзийклмнопрстуфхцчшщъыьэюя 1234567890';

interface JSPDFExporterProps {
  analysisData: any;
  filename?: string;
  className?: string;
  children?: React.ReactNode;
}

const JSPDFExporter: React.FC<JSPDFExporterProps> = ({
  analysisData,
  filename,
  className = '',
  children
}) => {
  const [isGenerating, setIsGenerating] = useState(false);

  const generatePDF = async () => {
    if (!analysisData) {
      console.error('Нет данных для экспорта PDF');
      return;
    }

    setIsGenerating(true);

    try {
      // Создаем новый PDF документ
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // Устанавливаем шрифт с поддержкой кириллицы
      doc.setFont('helvetica');
      
      let yPos = 20;
      const pageHeight = 297; // A4 height in mm
      const margin = 20;
      const lineHeight = 7;

      // Функция для добавления новой страницы при необходимости
      const checkNewPage = (requiredSpace: number = 15) => {
        if (yPos + requiredSpace > pageHeight - margin) {
          doc.addPage();
          yPos = margin;
        }
      };

      // Функция для безопасного добавления текста с кириллицей
      const addTextSafe = (text: string, x: number, y: number, options?: any) => {
        try {
          // Конвертируем текст в UTF-8
          const utf8Text = unescape(encodeURIComponent(text));
          doc.text(utf8Text, x, y, options);
        } catch (error) {
          console.warn('Ошибка при добавлении текста:', error);
          // Fallback - пытаемся добавить текст как есть
          doc.text(text, x, y, options);
        }
      };

      // Заголовок документа
      doc.setFontSize(22);
      doc.setTextColor(40, 116, 240); // Синий цвет
      addTextSafe('DevAssist Pro v2', margin, yPos);
      yPos += 10;

      doc.setFontSize(16);
      doc.setTextColor(0, 0, 0); // Черный цвет
      addTextSafe('Отчет по анализу коммерческого предложения', margin, yPos);
      yPos += lineHeight * 2;

      // Тест кириллицы
      checkNewPage(20);
      doc.setFontSize(12);
      doc.setTextColor(0, 100, 200);
      addTextSafe('🧪 ТЕСТ КИРИЛЛИЦЫ:', margin, yPos);
      yPos += lineHeight;
      
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      // Разбиваем длинный текст на строки
      const testLines = doc.splitTextToSize(CYRILLIC_TEST, 170);
      testLines.forEach((line: string) => {
        addTextSafe(line, margin, yPos);
        yPos += lineHeight;
      });
      yPos += lineHeight;

      // Информация о документе
      checkNewPage(30);
      doc.setDrawColor(200, 200, 200);
      doc.rect(margin, yPos - 5, 170, 25);
      
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      addTextSafe('Информация о документе:', margin + 5, yPos + 5);
      yPos += lineHeight * 2;

      const docInfo = [
        `Дата создания: ${new Date().toLocaleDateString('ru-RU', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })}`,
        `Документ: ${analysisData.documentName || 'Не указан'}`,
        `Компания: ${analysisData.companyName || 'Не указана'}`,
        `AI Модель: ${analysisData.aiModel || 'claude-3-haiku-20240307'}`
      ];

      doc.setFontSize(10);
      docInfo.forEach(info => {
        addTextSafe(info, margin + 5, yPos);
        yPos += lineHeight;
      });
      yPos += lineHeight;

      // Общая оценка
      checkNewPage(25);
      doc.setFillColor(240, 248, 255);
      doc.rect(margin, yPos - 5, 170, 20, 'F');
      
      doc.setFontSize(14);
      doc.setTextColor(30, 64, 175);
      addTextSafe('📊 ОБЩАЯ ОЦЕНКА ПРОЕКТА', margin + 5, yPos + 5);
      yPos += lineHeight * 2;

      doc.setFontSize(20);
      doc.setTextColor(analysisData.overallScore >= 80 ? 34 : analysisData.overallScore >= 60 ? 245 : 239, 
                       analysisData.overallScore >= 80 ? 197 : analysisData.overallScore >= 60 ? 158 : 68,
                       analysisData.overallScore >= 80 ? 94 : analysisData.overallScore >= 60 ? 11 : 68);
      addTextSafe(`${analysisData.overallScore || 0}/100 баллов`, margin + 5, yPos);
      yPos += lineHeight * 2;

      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      const recommendation = analysisData.overallScore >= 80 ? '✅ РЕКОМЕНДУЕТСЯ К ПРИНЯТИЮ' :
                            analysisData.overallScore >= 60 ? '⚠️ ПРИНЯТЬ С ОГОВОРКАМИ' :
                            '❌ НЕ РЕКОМЕНДУЕТСЯ';
      addTextSafe(recommendation, margin + 5, yPos);
      yPos += lineHeight * 2;

      // Финансовый анализ
      if (analysisData.financials?.totalBudget) {
        checkNewPage(20);
        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);
        addTextSafe('💰 ФИНАНСОВЫЙ АНАЛИЗ', margin, yPos);
        yPos += lineHeight * 2;

        doc.setFontSize(10);
        const budget = analysisData.financials.totalBudget;
        const budgetText = `Общий бюджет: ${typeof budget.amount === 'number' ? 
          budget.amount.toLocaleString('ru-RU') : 'Не указан'} ${budget.symbol || '₽'}`;
        addTextSafe(budgetText, margin + 5, yPos);
        yPos += lineHeight;

        if (analysisData.financials.currencies?.length > 0) {
          addTextSafe(`Валют обнаружено: ${analysisData.financials.currencies.length}`, margin + 5, yPos);
          yPos += lineHeight;
        }
        yPos += lineHeight;
      }

      // Сильные стороны
      if (analysisData.executiveSummary?.keyStrengths?.length > 0) {
        checkNewPage(20 + analysisData.executiveSummary.keyStrengths.length * lineHeight);
        doc.setFontSize(12);
        doc.setTextColor(34, 197, 94);
        addTextSafe('✅ СИЛЬНЫЕ СТОРОНЫ', margin, yPos);
        yPos += lineHeight * 2;

        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);
        analysisData.executiveSummary.keyStrengths.forEach((strength: string, index: number) => {
          const strengthText = `• ${strength}`;
          const lines = doc.splitTextToSize(strengthText, 165);
          lines.forEach((line: string) => {
            addTextSafe(line, margin + 5, yPos);
            yPos += lineHeight;
          });
        });
        yPos += lineHeight;
      }

      // Слабые стороны
      if (analysisData.executiveSummary?.criticalWeaknesses?.length > 0) {
        checkNewPage(20 + analysisData.executiveSummary.criticalWeaknesses.length * lineHeight);
        doc.setFontSize(12);
        doc.setTextColor(239, 68, 68);
        addTextSafe('❌ КРИТИЧЕСКИЕ НЕДОСТАТКИ', margin, yPos);
        yPos += lineHeight * 2;

        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);
        analysisData.executiveSummary.criticalWeaknesses.forEach((weakness: string) => {
          const weaknessText = `• ${weakness}`;
          const lines = doc.splitTextToSize(weaknessText, 165);
          lines.forEach((line: string) => {
            addTextSafe(line, margin + 5, yPos);
            yPos += lineHeight;
          });
        });
        yPos += lineHeight;
      }

      // Итоговая рекомендация
      checkNewPage(30);
      doc.setFillColor(255, 247, 237);
      doc.rect(margin, yPos - 5, 170, 25, 'F');
      
      doc.setFontSize(12);
      doc.setTextColor(146, 64, 14);
      addTextSafe('🎯 ИТОГОВАЯ РЕКОМЕНДАЦИЯ', margin + 5, yPos + 5);
      yPos += lineHeight * 2;

      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      const recommendationText = analysisData.executiveSummary?.recommendation || 
        'На основе проведенного анализа рекомендуется принять взвешенное решение с учетом выявленных факторов.';
      
      const recLines = doc.splitTextToSize(recommendationText, 160);
      recLines.forEach((line: string) => {
        addTextSafe(line, margin + 5, yPos);
        yPos += lineHeight;
      });

      // Подвал документа
      const totalPages = doc.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(128, 128, 128);
        addTextSafe('DevAssist Pro v2 - Система анализа коммерческих предложений', margin, pageHeight - 15);
        addTextSafe(`Страница ${i} из ${totalPages}`, 170, pageHeight - 15);
        addTextSafe(`Создано: ${new Date().toLocaleDateString('ru-RU')}`, margin, pageHeight - 10);
      }

      // Сохраняем PDF
      const finalFilename = filename || `DevAssist_Pro_KP_Analysis_${Date.now()}.pdf`;
      doc.save(finalFilename);

      console.log('PDF успешно создан с поддержкой кириллицы');

    } catch (error) {
      console.error('Ошибка создания PDF:', error);
      alert('Ошибка при создании PDF файла. Проверьте консоль для подробностей.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <button
      onClick={generatePDF}
      disabled={isGenerating || !analysisData}
      className={`inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 ${className}`}
    >
      {isGenerating ? (
        <>
          <Loader className="w-4 h-4 mr-2 animate-spin" />
          Создание PDF...
        </>
      ) : (
        children || (
          <>
            <FileDown className="w-4 h-4 mr-2" />
            Экспорт PDF (jsPDF)
          </>
        )
      )}
    </button>
  );
};

export default JSPDFExporter;