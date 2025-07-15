/**
 * PDF Export Button - кнопка экспорта с интеграцией диалога настроек
 * DevAssist Pro
 */

import React, { useState, useCallback } from 'react';
import { FileText, Download, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { PDFExportDialog } from './PDFExportDialog';
import { reactPdfExportService } from '../../services/reactPdfExportService';
import {
  AnalysisResult,
  ComparisonResult,
  PDFExportOptions,
  PDFStylingOptions,
  PDFGenerationProgress,
  PDFExportResult
} from '../../types/pdfExport';

interface PDFExportButtonProps {
  results: AnalysisResult[];
  comparison?: ComparisonResult;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
  onExportStart?: () => void;
  onExportComplete?: (result: PDFExportResult) => void;
  onExportError?: (error: Error) => void;
}

export const PDFExportButton: React.FC<PDFExportButtonProps> = ({
  results,
  comparison,
  disabled = false,
  variant = 'primary',
  size = 'md',
  showText = true,
  className = '',
  onExportStart,
  onExportComplete,
  onExportError
}) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportStatus, setExportStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [progress, setProgress] = useState<PDFGenerationProgress | undefined>();
  const [lastError, setLastError] = useState<string>('');

  // Определяем стили кнопки
  const getButtonStyles = () => {
    const baseStyles = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
    
    const sizeStyles = {
      sm: 'px-3 py-1.5 text-xs',
      md: 'px-4 py-2 text-sm',
      lg: 'px-6 py-3 text-base'
    };

    const variantStyles = {
      primary: 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500',
      secondary: 'bg-gray-600 hover:bg-gray-700 text-white focus:ring-gray-500',
      outline: 'border border-blue-600 text-blue-600 hover:bg-blue-50 focus:ring-blue-500'
    };

    const statusStyles = {
      idle: '',
      success: 'bg-green-600 hover:bg-green-700 focus:ring-green-500',
      error: 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
    };

    return [
      baseStyles,
      sizeStyles[size],
      exportStatus === 'idle' ? variantStyles[variant] : statusStyles[exportStatus],
      className
    ].join(' ');
  };

  // Получаем размер иконки в зависимости от размера кнопки
  const getIconSize = () => {
    switch (size) {
      case 'sm': return 14;
      case 'md': return 16;
      case 'lg': return 20;
      default: return 16;
    }
  };

  // Получаем иконку в зависимости от состояния
  const getIcon = () => {
    const iconSize = getIconSize();
    
    if (isExporting) {
      return <Loader2 size={iconSize} className="animate-spin" />;
    }
    
    switch (exportStatus) {
      case 'success':
        return <CheckCircle size={iconSize} />;
      case 'error':
        return <AlertCircle size={iconSize} />;
      default:
        return <FileText size={iconSize} />;
    }
  };

  // Получаем текст кнопки
  const getButtonText = () => {
    if (!showText) return null;
    
    if (isExporting) {
      if (progress) {
        return `${progress.progress}%`;
      }
      return 'Генерация...';
    }
    
    switch (exportStatus) {
      case 'success':
        return 'Готово!';
      case 'error':
        return 'Ошибка';
      default:
        return 'PDF отчет';
    }
  };

  // Обработчик клика по кнопке
  const handleClick = useCallback(() => {
    if (disabled || isExporting) return;
    
    if (results.length === 0) {
      setExportStatus('error');
      setLastError('Нет данных для экспорта');
      return;
    }
    
    setIsDialogOpen(true);
    setExportStatus('idle');
  }, [disabled, isExporting, results.length]);

  // Обработчик экспорта
  const handleExport = useCallback(async (options: PDFExportOptions, styling: PDFStylingOptions) => {
    try {
      setIsExporting(true);
      setExportStatus('idle');
      setLastError('');
      onExportStart?.();

      // Устанавливаем callback для отслеживания прогресса
      reactPdfExportService.setProgressCallback(setProgress);

      // Адаптируем данные под формат сервиса
      const adaptedResults: AnalysisResult[] = results.map(result => ({
        id: result.id || `result-${Math.random()}`,
        companyName: result.companyName || 'Неизвестная компания',
        overallRating: result.overallRating || 0,
        technicalRating: result.technicalRating || 0,
        financialRating: result.financialRating || 0,
        timelineRating: result.timelineRating || 0,
        complianceScore: result.complianceScore || 0,
        strengths: result.strengths || [],
        weaknesses: result.weaknesses || [],
        recommendations: result.recommendations || [],
        detailedAnalysis: result.detailedAnalysis || '',
        analyzedAt: result.analyzedAt || new Date().toISOString(),
        model: result.model || 'Unknown',
        fileName: result.fileName,
        pricing: result.pricing,
        timeline: result.timeline,
      }));

      // Адаптируем данные сравнения
      const adaptedComparison: ComparisonResult = comparison || {
        summary: 'Проведен сравнительный анализ коммерческих предложений',
        ranking: adaptedResults.map((result, index) => ({
          kpId: result.id,
          rank: index + 1,
          totalScore: result.overallRating,
          summary: `Анализ ${result.companyName}`
        })),
        recommendations: ['Рекомендуется выбрать лучшее предложение'],
        bestChoice: adaptedResults.reduce((best, current) => 
          current.overallRating > best.overallRating ? current : best
        ).companyName,
        analyzedAt: new Date().toISOString()
      };

      // Выполняем экспорт с React-PDF
      const result = await reactPdfExportService.exportComparison(
        adaptedResults,
        adaptedComparison,
        options
      );

      // Скачиваем файл
      reactPdfExportService.downloadPDF(result.blob, result.filename);

      setExportStatus('success');
      setIsDialogOpen(false);
      onExportComplete?.(result);

      // Сброс статуса через 3 секунды
      setTimeout(() => {
        setExportStatus('idle');
      }, 3000);

    } catch (error) {
      console.error('Ошибка экспорта PDF:', error);
      const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
      setLastError(errorMessage);
      setExportStatus('error');
      onExportError?.(error instanceof Error ? error : new Error(errorMessage));

      // Сброс статуса через 5 секунд
      setTimeout(() => {
        setExportStatus('idle');
      }, 5000);
    } finally {
      setIsExporting(false);
      setProgress(undefined);
    }
  }, [results, comparison, onExportStart, onExportComplete, onExportError]);

  // Обработчик закрытия диалога
  const handleDialogClose = useCallback(() => {
    if (!isExporting) {
      setIsDialogOpen(false);
    }
  }, [isExporting]);

  return (
    <>
      <div className="relative">
        <button
          onClick={handleClick}
          disabled={disabled || isExporting}
          className={getButtonStyles()}
          title={
            exportStatus === 'error' && lastError 
              ? `Ошибка: ${lastError}` 
              : 'Экспорт результатов анализа в PDF'
          }
        >
          <span className="flex items-center space-x-2">
            {getIcon()}
            {getButtonText() && <span>{getButtonText()}</span>}
          </span>
        </button>

        {/* Индикатор прогресса для маленьких кнопок */}
        {isExporting && !showText && progress && (
          <div className="absolute -bottom-1 left-0 right-0 h-1 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-500 transition-all duration-300"
              style={{ width: `${progress.progress}%` }}
            />
          </div>
        )}
      </div>

      {/* Диалог настроек экспорта */}
      <PDFExportDialog
        isOpen={isDialogOpen}
        onClose={handleDialogClose}
        onExport={handleExport}
        results={results}
        comparison={comparison}
        progress={progress}
        isExporting={isExporting}
      />
    </>
  );
};

// Экспорт дополнительных компонентов для специальных случаев
export const PDFExportIconButton: React.FC<Omit<PDFExportButtonProps, 'showText'>> = (props) => (
  <PDFExportButton {...props} showText={false} size="sm" />
);

export const PDFExportMenuItem: React.FC<PDFExportButtonProps> = (props) => (
  <PDFExportButton 
    {...props} 
    variant="outline" 
    className="w-full justify-start"
    size="sm"
  />
);