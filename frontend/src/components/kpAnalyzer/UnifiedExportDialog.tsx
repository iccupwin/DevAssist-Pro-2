/**
 * Unified Export Dialog - диалог для экспорта отчетов в PDF и Excel
 * DevAssist Pro
 */

import React, { useState, useCallback } from 'react';
import { 
  Download, 
  FileText, 
  Table, 
  Settings, 
  AlertCircle, 
  CheckCircle2, 
  Loader2,
  FileDown,
  X
} from 'lucide-react';
import { 
  unifiedReportExportService, 
  UnifiedExportOptions, 
  UnifiedExportResult, 
  UnifiedExportProgress,
  ExportFormat,
  PDFEngine
} from '../../services/unifiedReportExportService';
import { KPAnalysisResult } from '../../types/kpAnalyzer';

interface UnifiedExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  analysisResults: KPAnalysisResult[];
  tzName: string;
  onExportComplete?: (result: UnifiedExportResult) => void;
}

interface ExportState {
  isExporting: boolean;
  progress: UnifiedExportProgress | null;
  result: UnifiedExportResult | null;
  error: string | null;
}

export const UnifiedExportDialog: React.FC<UnifiedExportDialogProps> = ({
  isOpen,
  onClose,
  analysisResults,
  tzName,
  onExportComplete
}) => {
  const [options, setOptions] = useState<UnifiedExportOptions>({
    format: 'both',
    pdfEngine: 'jspdf',
    generateReport: true,
    pdfOptions: {
      format: 'A4',
      orientation: 'portrait',
      includeExecutiveSummary: true,
      includeDetailedAnalysis: true,
      includeAppendices: true,
      customTitle: `Отчет по анализу КП - ${tzName}`
    },
    excelOptions: {
      includeCharts: true,
      includeRawData: true,
      includeComparison: true,
      includeSummary: true,
      customTitle: `Отчет по анализу КП - ${tzName}`,
      projectName: tzName
    }
  });

  const [exportState, setExportState] = useState<ExportState>({
    isExporting: false,
    progress: null,
    result: null,
    error: null
  });

  const [showAdvanced, setShowAdvanced] = useState(false);

  // Обработчик прогресса экспорта
  const handleProgress = useCallback((progress: UnifiedExportProgress) => {
    setExportState(prev => ({ ...prev, progress }));
  }, []);

  // Основная функция экспорта
  const handleExport = async () => {
    try {
      setExportState({
        isExporting: true,
        progress: null,
        result: null,
        error: null
      });

      unifiedReportExportService.setProgressCallback(handleProgress);

      const result = await unifiedReportExportService.exportAnalysisResults(
        analysisResults,
        tzName,
        options
      );

      setExportState(prev => ({
        ...prev,
        isExporting: false,
        result,
        error: result.success ? null : result.errors?.join('; ') || 'Неизвестная ошибка'
      }));

      if (result.success && onExportComplete) {
        onExportComplete(result);
      }

    } catch (error) {
      setExportState(prev => ({
        ...prev,
        isExporting: false,
        error: error.message || 'Ошибка экспорта'
      }));
    }
  };

  // Загрузка файлов
  const handleDownload = async () => {
    if (exportState.result) {
      await unifiedReportExportService.downloadResults(exportState.result);
    }
  };

  // Получение информации о файлах
  const getFilesInfo = () => {
    if (!exportState.result) return null;
    return unifiedReportExportService.getFilesInfo(exportState.result);
  };

  const formatOptions: { value: ExportFormat; label: string; icon: React.ReactNode }[] = [
    { value: 'pdf', label: 'Только PDF', icon: <FileText className="w-4 h-4" /> },
    { value: 'excel', label: 'Только Excel', icon: <Table className="w-4 h-4" /> },
    { value: 'both', label: 'PDF + Excel', icon: <FileDown className="w-4 h-4" /> }
  ];

  const pdfEngineOptions: { value: PDFEngine; label: string }[] = [
    { value: 'jspdf', label: 'jsPDF (быстрый)' },
    { value: 'react-pdf', label: 'React-PDF (качественный)' }
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Заголовок */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <Download className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Экспорт отчета
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Информация о данных */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
            <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
              Данные для экспорта
            </h3>
            <div className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
              <p>Техническое задание: <span className="font-medium">{tzName}</span></p>
              <p>Количество КП: <span className="font-medium">{analysisResults.length}</span></p>
              <p>Средний балл: <span className="font-medium">
                {Math.round(analysisResults.reduce((sum, r) => sum + r.score, 0) / analysisResults.length)}%
              </span></p>
            </div>
          </div>

          {/* Формат экспорта */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Формат экспорта
            </label>
            <div className="grid grid-cols-3 gap-3">
              {formatOptions.map(option => (
                <button
                  key={option.value}
                  onClick={() => setOptions(prev => ({ ...prev, format: option.value }))}
                  className={`p-3 rounded-lg border-2 transition-colors ${
                    options.format === option.value
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                  }`}
                >
                  <div className="flex flex-col items-center gap-2">
                    {option.icon}
                    <span className="text-sm font-medium">{option.label}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Дополнительные настройки */}
          <div>
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
            >
              <Settings className="w-4 h-4" />
              Дополнительные настройки
            </button>

            {showAdvanced && (
              <div className="mt-4 space-y-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                {/* PDF настройки */}
                {(options.format === 'pdf' || options.format === 'both') && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Настройки PDF
                    </h4>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                          Движок PDF
                        </label>
                        <select
                          value={options.pdfEngine}
                          onChange={(e) => setOptions(prev => ({ 
                            ...prev, 
                            pdfEngine: e.target.value as PDFEngine 
                          }))}
                          className="w-full p-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
                        >
                          {pdfEngineOptions.map(engine => (
                            <option key={engine.value} value={engine.value}>
                              {engine.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <label className="flex items-center gap-2 text-xs">
                          <input
                            type="checkbox"
                            checked={options.pdfOptions?.includeExecutiveSummary}
                            onChange={(e) => setOptions(prev => ({
                              ...prev,
                              pdfOptions: {
                                ...prev.pdfOptions,
                                includeExecutiveSummary: e.target.checked
                              }
                            }))}
                            className="rounded"
                          />
                          Исполнительное резюме
                        </label>
                        
                        <label className="flex items-center gap-2 text-xs">
                          <input
                            type="checkbox"
                            checked={options.pdfOptions?.includeDetailedAnalysis}
                            onChange={(e) => setOptions(prev => ({
                              ...prev,
                              pdfOptions: {
                                ...prev.pdfOptions,
                                includeDetailedAnalysis: e.target.checked
                              }
                            }))}
                            className="rounded"
                          />
                          Детальный анализ
                        </label>
                      </div>
                    </div>
                  </div>
                )}

                {/* Excel настройки */}
                {(options.format === 'excel' || options.format === 'both') && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Настройки Excel
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                      <label className="flex items-center gap-2 text-xs">
                        <input
                          type="checkbox"
                          checked={options.excelOptions?.includeCharts}
                          onChange={(e) => setOptions(prev => ({
                            ...prev,
                            excelOptions: {
                              ...prev.excelOptions,
                              includeCharts: e.target.checked
                            }
                          }))}
                          className="rounded"
                        />
                        Графики
                      </label>
                      
                      <label className="flex items-center gap-2 text-xs">
                        <input
                          type="checkbox"
                          checked={options.excelOptions?.includeRawData}
                          onChange={(e) => setOptions(prev => ({
                            ...prev,
                            excelOptions: {
                              ...prev.excelOptions,
                              includeRawData: e.target.checked
                            }
                          }))}
                          className="rounded"
                        />
                        Сырые данные
                      </label>
                    </div>
                  </div>
                )}

                {/* Общие настройки */}
                <div>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={options.generateReport}
                      onChange={(e) => setOptions(prev => ({ 
                        ...prev, 
                        generateReport: e.target.checked 
                      }))}
                      className="rounded"
                    />
                    Генерировать комплексный отчет с AI анализом
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* Прогресс экспорта */}
          {exportState.isExporting && exportState.progress && (
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  {exportState.progress.message}
                </span>
                <span className="text-sm text-blue-700 dark:text-blue-300">
                  {exportState.progress.overallProgress}%
                </span>
              </div>
              <div className="w-full bg-blue-200 dark:bg-blue-800 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${exportState.progress.overallProgress}%` }}
                />
              </div>
              {exportState.progress.pdfProgress && (
                <div className="mt-2 text-xs text-blue-700 dark:text-blue-300">
                  PDF: {exportState.progress.pdfProgress.message}
                </div>
              )}
              {exportState.progress.excelProgress && (
                <div className="mt-1 text-xs text-blue-700 dark:text-blue-300">
                  Excel: {exportState.progress.excelProgress.message}
                </div>
              )}
            </div>
          )}

          {/* Результат экспорта */}
          {exportState.result && (
            <div className={`rounded-lg p-4 ${
              exportState.result.success 
                ? 'bg-green-50 dark:bg-green-900/20' 
                : 'bg-red-50 dark:bg-red-900/20'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                {exportState.result.success ? (
                  <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                )}
                <span className={`font-medium ${
                  exportState.result.success 
                    ? 'text-green-900 dark:text-green-100' 
                    : 'text-red-900 dark:text-red-100'
                }`}>
                  {exportState.result.success ? 'Экспорт завершен успешно!' : 'Ошибка экспорта'}
                </span>
              </div>

              {exportState.result.success && (() => {
                const filesInfo = getFilesInfo();
                return filesInfo ? (
                  <div className="text-sm text-green-800 dark:text-green-200">
                    <div className="space-y-1">
                      {filesInfo.pdf && <p>PDF: {filesInfo.pdf}</p>}
                      {filesInfo.excel && <p>Excel: {filesInfo.excel}</p>}
                      <p className="font-medium">Общий размер: {filesInfo.total}</p>
                    </div>
                  </div>
                ) : null;
              })()}

              {exportState.error && (
                <p className="text-sm text-red-800 dark:text-red-200">
                  {exportState.error}
                </p>
              )}
            </div>
          )}

          {/* Кнопки действий */}
          <div className="flex gap-3">
            {exportState.result && exportState.result.success ? (
              <button
                onClick={handleDownload}
                className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                <Download className="w-4 h-4" />
                Скачать файлы
              </button>
            ) : (
              <button
                onClick={handleExport}
                disabled={exportState.isExporting || analysisResults.length === 0}
                className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                {exportState.isExporting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                {exportState.isExporting ? 'Экспорт...' : 'Начать экспорт'}
              </button>
            )}
            
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg font-medium transition-colors"
            >
              {exportState.result?.success ? 'Готово' : 'Отмена'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};