/**
 * PDF Export Button V2 - Кнопка экспорта результатов КП анализа в PDF
 * Поддержка кириллицы, professional дизайн, полная интеграция с КП Анализатором v2
 */

import React, { useState } from 'react';
import { 
  FileText, Download, Loader2, CheckCircle, AlertTriangle, 
  FileDown, Sparkles, Eye 
} from 'lucide-react';
import { getBackendApiUrl } from '../../config/app';

interface PDFExportButtonV2Props {
  /** Данные анализа для экспорта */
  analysisData?: any;
  /** ID сохраненного анализа (если экспортируем из истории) */
  analysisId?: string;
  /** Заголовок кнопки */
  title?: string;
  /** Размер кнопки */
  size?: 'sm' | 'md' | 'lg';
  /** Вариант отображения */
  variant?: 'primary' | 'secondary' | 'ghost';
  /** Показывать ли иконку */
  showIcon?: boolean;
  /** Дополнительные CSS классы */
  className?: string;
  /** Callback при успешном экспорте */
  onExportSuccess?: (filename: string) => void;
  /** Callback при ошибке экспорта */
  onExportError?: (error: string) => void;
}

const PDFExportButtonV2: React.FC<PDFExportButtonV2Props> = ({
  analysisData,
  analysisId,
  title = "Экспорт в PDF",
  size = 'md',
  variant = 'primary',
  showIcon = true,
  className = '',
  onExportSuccess,
  onExportError
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportStatus, setExportStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [lastExportTime, setLastExportTime] = useState<Date | null>(null);

  // Стили кнопки в зависимости от размера и варианта
  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'px-3 py-1.5 text-sm';
      case 'lg':
        return 'px-6 py-3 text-lg';
      default:
        return 'px-4 py-2 text-base';
    }
  };

  const getVariantClasses = () => {
    switch (variant) {
      case 'secondary':
        return 'bg-gray-600 hover:bg-gray-700 text-white border-gray-600';
      case 'ghost':
        return 'bg-transparent hover:bg-blue-50 text-blue-600 border-blue-600';
      default:
        return 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-transparent';
    }
  };

  const handleExportPDF = async () => {
    if (isExporting) return;

    setIsExporting(true);
    setExportStatus('idle');

    try {
      let response: Response;

      if (analysisId) {
        // Экспорт сохраненного анализа по ID
        response = await fetch(`${getBackendApiUrl()}/api/v2/kp-analyzer/export-pdf/${analysisId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });
      } else if (analysisData) {
        // Экспорт текущих данных анализа
        response = await fetch(`${getBackendApiUrl()}/api/v2/kp-analyzer/export-pdf`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(analysisData),
        });
      } else {
        throw new Error('Отсутствуют данные для экспорта');
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`);
      }

      // Получаем PDF blob
      const pdfBlob = await response.blob();
      
      // Извлекаем имя файла из заголовков ответа
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = 'kp_analysis_export.pdf';
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename=([^;]+)/);
        if (filenameMatch) {
          filename = filenameMatch[1].replace(/"/g, '');
        }
      }

      // Создаем URL для скачивания
      const downloadUrl = window.URL.createObjectURL(pdfBlob);
      
      // Создаем временную ссылку для скачивания
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      
      // Очистка
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
      
      // Обновляем состояние
      setExportStatus('success');
      setLastExportTime(new Date());
      
      // Вызываем callback при успехе
      onExportSuccess?.(filename);

      // Автоматически сбрасываем статус через 3 секунды
      setTimeout(() => {
        setExportStatus('idle');
      }, 3000);

    } catch (error) {
      console.error('Ошибка экспорта PDF:', error);
      setExportStatus('error');
      
      const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка экспорта';
      onExportError?.(errorMessage);

      // Автоматически сбрасываем статус ошибки через 5 секунд
      setTimeout(() => {
        setExportStatus('idle');
      }, 5000);
    } finally {
      setIsExporting(false);
    }
  };

  // Определяем содержимое кнопки в зависимости от состояния
  const getButtonContent = () => {
    if (isExporting) {
      return (
        <>
          <Loader2 className="w-4 h-4 animate-spin mr-2" />
          Генерация PDF...
        </>
      );
    }

    if (exportStatus === 'success') {
      return (
        <>
          <CheckCircle className="w-4 h-4 mr-2 text-green-200" />
          PDF готов!
        </>
      );
    }

    if (exportStatus === 'error') {
      return (
        <>
          <AlertTriangle className="w-4 h-4 mr-2 text-red-200" />
          Ошибка экспорта
        </>
      );
    }

    return (
      <>
        {showIcon && <FileDown className="w-4 h-4 mr-2" />}
        {title}
      </>
    );
  };

  const buttonClasses = `
    inline-flex items-center justify-center
    ${getSizeClasses()}
    ${getVariantClasses()}
    font-medium
    rounded-lg
    border
    transition-all
    duration-200
    shadow-sm
    hover:shadow-md
    focus:outline-none
    focus:ring-2
    focus:ring-blue-500
    focus:ring-offset-2
    disabled:opacity-50
    disabled:cursor-not-allowed
    ${className}
  `.trim().replace(/\s+/g, ' ');

  return (
    <div className="relative">
      <button
        onClick={handleExportPDF}
        disabled={isExporting || (!analysisData && !analysisId)}
        className={buttonClasses}
        title={isExporting ? 'Генерируется PDF...' : 'Скачать результаты анализа в PDF'}
      >
        {getButtonContent()}
      </button>

      {/* Tooltip с информацией о последнем экспорте */}
      {lastExportTime && exportStatus === 'success' && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-black text-white text-sm rounded-lg shadow-lg opacity-0 hover:opacity-100 transition-opacity duration-200 pointer-events-none">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4" />
            <span>PDF экспортирован: {lastExportTime.toLocaleTimeString('ru-RU')}</span>
          </div>
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-2 h-2 bg-black rotate-45"></div>
        </div>
      )}
    </div>
  );
};

// Дополнительный компонент для экспорта с превью
export const PDFExportWithPreview: React.FC<PDFExportButtonV2Props & {
  onPreview?: () => void;
}> = ({ onPreview, ...props }) => {
  return (
    <div className="flex items-center space-x-2">
      {/* Кнопка предварительного просмотра */}
      {onPreview && (
        <button
          onClick={onPreview}
          className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          title="Предварительный просмотр"
        >
          <Eye className="w-4 h-4 mr-1" />
          Просмотр
        </button>
      )}
      
      {/* Основная кнопка экспорта */}
      <PDFExportButtonV2 {...props} />
    </div>
  );
};

// Экспорт для типов
export type { PDFExportButtonV2Props };

export default PDFExportButtonV2;