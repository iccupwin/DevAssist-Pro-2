/**
 * Enhanced PDF Export Button
 * Интеграция с backend PDF API с поддержкой кириллицы
 * Использует рабочий PDF экспортер из backend
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, FileText, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { KPAnalysisResult } from '../../types/kpAnalyzer';

interface EnhancedPDFExportButtonProps {
  /** Данные анализа для экспорта */
  analysisData: KPAnalysisResult;
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
  /** Показывать ли настройки экспорта */
  showSettings?: boolean;
}

interface ExportSettings {
  includeCharts: boolean;
  includeRecommendations: boolean;
  includeDetailedAnalysis: boolean;
  quality: 'standard' | 'high' | 'ultra';
}

const EnhancedPDFExportButton: React.FC<EnhancedPDFExportButtonProps> = ({
  analysisData,
  title = "Скачать PDF",
  size = 'md',
  variant = 'primary',
  showIcon = true,
  className = '',
  onExportSuccess,
  onExportError,
  showSettings = false
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportStatus, setExportStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [lastExportTime, setLastExportTime] = useState<Date | null>(null);
  const [showSettingsPanel, setShowSettingsPanel] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  
  const [settings, setSettings] = useState<ExportSettings>({
    includeCharts: true,
    includeRecommendations: true,
    includeDetailedAnalysis: true,
    quality: 'high'
  });

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
        return 'bg-gray-600 hover:bg-gray-700 text-white border-gray-600 shadow-md hover:shadow-lg';
      case 'ghost':
        return 'bg-transparent hover:bg-blue-50 text-blue-600 border-blue-600 hover:border-blue-700';
      default:
        return 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-transparent shadow-md hover:shadow-xl';
    }
  };

  const handleExportPDF = async () => {
    if (isExporting || !analysisData) return;

    setIsExporting(true);
    setExportStatus('idle');
    setExportProgress(0);

    try {
      // Имитация прогресса для UX
      const progressInterval = setInterval(() => {
        setExportProgress(prev => {
          if (prev < 90) return prev + 10;
          return prev;
        });
      }, 200);

      // Подготавливаем данные с учетом настроек
      const processedData: AnalysisData = {
        ...analysisData,
        sections: analysisData.sections.map(section => ({
          ...section,
          charts: settings.includeCharts ? section.charts : undefined,
          recommendations: settings.includeRecommendations ? section.recommendations : undefined,
          detailed_analysis: settings.includeDetailedAnalysis ? section.detailed_analysis : ''
        }))
      };

      // Экспортируем PDF
      await pdfExporter.exportAnalysisResults(processedData);
      
      clearInterval(progressInterval);
      setExportProgress(100);
      
      // Обновляем состояние
      setExportStatus('success');
      setLastExportTime(new Date());
      
      const filename = `analiz_kp_${processedData.id || 'export'}_${new Date().toISOString().split('T')[0]}.pdf`;
      onExportSuccess?.(filename);

      // Автоматически сбрасываем статус через 4 секунды
      setTimeout(() => {
        setExportStatus('idle');
        setExportProgress(0);
      }, 4000);

    } catch (error) {
      console.error('Ошибка экспорта PDF:', error);
      setExportStatus('error');
      setExportProgress(0);
      
      const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка экспорта PDF';
      onExportError?.(errorMessage);

      // Автоматически сбрасываем статус ошибки через 6 секунд
      setTimeout(() => {
        setExportStatus('idle');
      }, 6000);
    } finally {
      setIsExporting(false);
    }
  };

  // Определяем содержимое кнопки в зависимости от состояния
  const getButtonContent = () => {
    if (isExporting) {
      return (
        <div className="flex items-center">
          <Loader2 className="w-4 h-4 animate-spin mr-2" />
          <div className="flex flex-col items-start">
            <span>Создание PDF...</span>
            {exportProgress > 0 && (
              <div className="w-16 h-1 bg-white/20 rounded-full mt-1">
                <div 
                  className="h-full bg-white rounded-full transition-all duration-300"
                  style={{ width: `${exportProgress}%` }}
                />
              </div>
            )}
          </div>
        </div>
      );
    }

    if (exportStatus === 'success') {
      return (
        <>
          <CheckCircle className="w-4 h-4 mr-2 text-green-200" />
          PDF готов! ✨
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
        {showIcon && <DownloadIcon className="w-4 h-4 mr-2" />}
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
    duration-300
    focus:outline-none
    focus:ring-2
    focus:ring-blue-500
    focus:ring-offset-2
    disabled:opacity-50
    disabled:cursor-not-allowed
    transform
    hover:scale-105
    active:scale-95
    ${className}
  `.trim().replace(/\s+/g, ' ');

  return (
    <div className="relative">
      <div className="flex items-center space-x-2">
        {/* Основная кнопка экспорта */}
        <button
          onClick={handleExportPDF}
          disabled={isExporting || !analysisData}
          className={buttonClasses}
          title={isExporting ? 'Генерируется PDF...' : 'Скачать результаты анализа в формате PDF'}
        >
          {getButtonContent()}
        </button>

        {/* Кнопка настроек экспорта */}
        {showSettings && (
          <button
            onClick={() => setShowSettingsPanel(!showSettingsPanel)}
            disabled={isExporting}
            className="inline-flex items-center justify-center px-3 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200"
            title="Настройки экспорта"
          >
            <Settings className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Панель настроек */}
      {showSettingsPanel && (
        <div className="absolute top-full left-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-xl z-10 p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">⚙️ Настройки экспорта</h3>
          
          <div className="space-y-3">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={settings.includeCharts}
                onChange={(e) => setSettings(prev => ({ ...prev, includeCharts: e.target.checked }))}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">Включить графики и диаграммы</span>
            </label>
            
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={settings.includeRecommendations}
                onChange={(e) => setSettings(prev => ({ ...prev, includeRecommendations: e.target.checked }))}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">Включить рекомендации</span>
            </label>
            
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={settings.includeDetailedAnalysis}
                onChange={(e) => setSettings(prev => ({ ...prev, includeDetailedAnalysis: e.target.checked }))}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">Включить детальный анализ</span>
            </label>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Качество PDF</label>
              <select
                value={settings.quality}
                onChange={(e) => setSettings(prev => ({ ...prev, quality: e.target.value as any }))}
                className="w-full rounded border-gray-300 text-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="standard">Стандартное</option>
                <option value="high">Высокое (рекомендуется)</option>
                <option value="ultra">Ультра высокое</option>
              </select>
            </div>
          </div>
          
          <button
            onClick={() => setShowSettingsPanel(false)}
            className="mt-3 w-full px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
          >
            Закрыть
          </button>
        </div>
      )}

      {/* Успешный экспорт - уведомление */}
      {lastExportTime && exportStatus === 'success' && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-4 py-2 bg-green-600 text-white text-sm rounded-lg shadow-lg opacity-0 hover:opacity-100 transition-opacity duration-200 pointer-events-none">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4" />
            <span>PDF сохранен: {lastExportTime.toLocaleTimeString('ru-RU')}</span>
          </div>
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-2 h-2 bg-green-600 rotate-45"></div>
        </div>
      )}

      {/* Статусная полоса экспорта */}
      {isExporting && exportProgress > 0 && (
        <div className="absolute -bottom-1 left-0 right-0 h-1 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300"
            style={{ width: `${exportProgress}%` }}
          />
        </div>
      )}
    </div>
  );
};

// Компонент для быстрого экспорта без настроек
export const QuickPDFExportButton: React.FC<Omit<EnhancedPDFExportButtonProps, 'showSettings'>> = (props) => {
  return <EnhancedPDFExportButton {...props} showSettings={false} />;
};

// Компонент с полным набором функций
export const AdvancedPDFExportButton: React.FC<EnhancedPDFExportButtonProps> = (props) => {
  return <EnhancedPDFExportButton {...props} showSettings={true} />;
};

export default EnhancedPDFExportButton;