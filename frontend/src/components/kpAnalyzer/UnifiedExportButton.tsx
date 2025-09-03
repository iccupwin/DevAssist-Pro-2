/**
 * Unified Export Button - кнопка для экспорта в PDF и Excel
 * DevAssist Pro
 */

import React, { useState, useCallback } from 'react';
import { 
  FileText, 
  Table, 
  Download, 
  CheckCircle, 
  AlertCircle, 
  Loader2, 
  FileDown 
} from 'lucide-react';
import { UnifiedExportDialog } from './UnifiedExportDialog';
import { 
  UnifiedExportResult, 
  ExportFormat 
} from '../../services/unifiedReportExportService';
import { KPAnalysisResult } from '../../types/kpAnalyzer';

interface UnifiedExportButtonProps {
  analysisResults: KPAnalysisResult[];
  tzName: string;
  defaultFormat?: ExportFormat;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  showIcon?: boolean;
  className?: string;
  onExportStart?: () => void;
  onExportComplete?: (result: UnifiedExportResult) => void;
  onExportError?: (error: Error) => void;
}

export const UnifiedExportButton: React.FC<UnifiedExportButtonProps> = ({
  analysisResults,
  tzName,
  defaultFormat = 'both',
  disabled = false,
  variant = 'primary',
  size = 'md',
  showText = true,
  showIcon = true,
  className = '',
  onExportStart,
  onExportComplete,
  onExportError
}) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [exportStatus, setExportStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [lastError, setLastError] = useState<string>('');

  // Определяем стили кнопки
  const getButtonStyles = () => {
    const baseStyles = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
    
    const sizeStyles = {
      sm: 'px-3 py-1.5 text-xs gap-1.5',
      md: 'px-4 py-2 text-sm gap-2',
      lg: 'px-6 py-3 text-base gap-3'
    };

    const variantStyles = {
      primary: 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500',
      secondary: 'bg-gray-600 hover:bg-gray-700 text-white focus:ring-gray-500',
      outline: 'border border-blue-600 text-blue-600 hover:bg-blue-50 focus:ring-blue-500 dark:border-blue-400 dark:text-blue-400 dark:hover:bg-blue-900/20'
    };

    const statusStyles = {
      idle: '',
      success: 'bg-green-600 hover:bg-green-700 focus:ring-green-500 text-white',
      error: 'bg-red-600 hover:bg-red-700 focus:ring-red-500 text-white'
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

  // Получаем иконку в зависимости от формата и состояния
  const getIcon = () => {
    if (!showIcon) return null;
    
    const iconSize = getIconSize();
    
    switch (exportStatus) {
      case 'success':
        return <CheckCircle size={iconSize} />;
      case 'error':
        return <AlertCircle size={iconSize} />;
      default:
        // Выбираем иконку в зависимости от формата по умолчанию
        switch (defaultFormat) {
          case 'pdf':
            return <FileText size={iconSize} />;
          case 'excel':
            return <Table size={iconSize} />;
          case 'both':
          default:
            return <FileDown size={iconSize} />;
        }
    }
  };

  // Получаем текст кнопки
  const getButtonText = () => {
    if (!showText) return null;
    
    switch (exportStatus) {
      case 'success':
        return 'Готово!';
      case 'error':
        return 'Ошибка';
      default:
        switch (defaultFormat) {
          case 'pdf':
            return 'PDF отчет';
          case 'excel':
            return 'Excel отчет';
          case 'both':
          default:
            return 'Экспорт отчета';
        }
    }
  };

  // Обработчик клика по кнопке
  const handleClick = useCallback(() => {
    if (disabled) return;
    
    if (analysisResults.length === 0) {
      setExportStatus('error');
      setLastError('Нет данных для экспорта');
      onExportError?.(new Error('Нет данных для экспорта'));
      
      // Сброс статуса через 3 секунды
      setTimeout(() => {
        setExportStatus('idle');
        setLastError('');
      }, 3000);
      return;
    }
    
    setIsDialogOpen(true);
    setExportStatus('idle');
    setLastError('');
  }, [disabled, analysisResults.length, onExportError]);

  // Обработчик завершения экспорта
  const handleExportComplete = useCallback((result: UnifiedExportResult) => {
    if (result.success) {
      setExportStatus('success');
      onExportComplete?.(result);
      
      // Сброс статуса через 3 секунды
      setTimeout(() => {
        setExportStatus('idle');
      }, 3000);
    } else {
      const errorMessage = result.errors?.join('; ') || 'Неизвестная ошибка экспорта';
      setExportStatus('error');
      setLastError(errorMessage);
      onExportError?.(new Error(errorMessage));
      
      // Сброс статуса через 5 секунд
      setTimeout(() => {
        setExportStatus('idle');
        setLastError('');
      }, 5000);
    }
  }, [onExportComplete, onExportError]);

  // Обработчик закрытия диалога
  const handleDialogClose = useCallback(() => {
    setIsDialogOpen(false);
  }, []);

  return (
    <>
      <button
        onClick={handleClick}
        disabled={disabled}
        className={getButtonStyles()}
        title={
          exportStatus === 'error' && lastError 
            ? `Ошибка: ${lastError}` 
            : `Экспорт результатов анализа (${analysisResults.length} КП)`
        }
      >
        {getIcon()}
        {getButtonText()}
      </button>

      {/* Диалог настроек экспорта */}
      <UnifiedExportDialog
        isOpen={isDialogOpen}
        onClose={handleDialogClose}
        analysisResults={analysisResults}
        tzName={tzName}
        onExportComplete={handleExportComplete}
      />
    </>
  );
};

// Специализированные варианты кнопки
export const PDFExportButton: React.FC<Omit<UnifiedExportButtonProps, 'defaultFormat'>> = (props) => (
  <UnifiedExportButton {...props} defaultFormat="pdf" />
);

export const ExcelExportButton: React.FC<Omit<UnifiedExportButtonProps, 'defaultFormat'>> = (props) => (
  <UnifiedExportButton {...props} defaultFormat="excel" />
);

export const UnifiedExportIconButton: React.FC<Omit<UnifiedExportButtonProps, 'showText'>> = (props) => (
  <UnifiedExportButton {...props} showText={false} size="sm" />
);

export const UnifiedExportMenuItem: React.FC<UnifiedExportButtonProps> = (props) => (
  <UnifiedExportButton 
    {...props} 
    variant="outline" 
    className="w-full justify-start"
    size="sm"
  />
);