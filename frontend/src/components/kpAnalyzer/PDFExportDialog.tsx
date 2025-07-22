/**
 * PDF Export Dialog - модальное окно настроек экспорта
 * DevAssist Pro
 */

import React, { useState, useEffect } from 'react';
import { 
  X, 
  FileText, 
  Settings, 
  Download, 
  Check,
  AlertCircle,
  Loader2,
  Eye
} from 'lucide-react';
import {
  PDFExportOptions,
  PDFStylingOptions,
  PDFGenerationProgress,
  DEFAULT_PDF_OPTIONS,
  DEFAULT_STYLING_OPTIONS,
  PDF_TEMPLATES,
  PDFReportTemplate,
  AnalysisResult,
  ComparisonResult
} from '../../types/pdfExport';

interface PDFExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (options: PDFExportOptions, styling: PDFStylingOptions) => Promise<void>;
  results: AnalysisResult[];
  comparison?: ComparisonResult;
  progress?: PDFGenerationProgress;
  isExporting: boolean;
}

export const PDFExportDialog: React.FC<PDFExportDialogProps> = ({
  isOpen,
  onClose,
  onExport,
  results,
  comparison,
  progress,
  isExporting
}) => {
  const [options, setOptions] = useState<PDFExportOptions>(DEFAULT_PDF_OPTIONS);
  const [styling, setStyling] = useState<PDFStylingOptions>(DEFAULT_STYLING_OPTIONS);
  const [selectedTemplate, setSelectedTemplate] = useState<PDFReportTemplate>('detailed');
  const [activeTab, setActiveTab] = useState<'template' | 'options' | 'styling'>('template');
  
  // Обновляем настройки при выборе шаблона
  useEffect(() => {
    const template = PDF_TEMPLATES[selectedTemplate];
    setOptions(prev => ({
      ...prev,
      includeExecutiveSummary: template.sections.summary,
      includeDetailedAnalysis: template.sections.detailedAnalysis,
      includeCharts: template.sections.charts,
      includeAppendices: template.sections.appendices,
    }));
  }, [selectedTemplate]);

  const handleExport = async () => {
    try {
      await onExport(options, styling);
    } catch (error) {
      console.error('Ошибка экспорта:', error);
    }
  };

  const renderProgressBar = () => {
    if (!isExporting || !progress) return null;

    const getProgressColor = () => {
      if (progress.stage === 'complete' && progress.errors?.length) {
        return 'bg-red-500';
      }
      return progress.stage === 'complete' ? 'bg-green-500' : 'bg-blue-500';
    };

    return (
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">
            {progress.message}
          </span>
          <span className="text-sm text-gray-500">
            {progress.progress}%
          </span>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all duration-300 ${getProgressColor()}`}
            style={{ width: `${progress.progress}%` }}
          />
        </div>
        
        {progress.currentSection && (
          <div className="mt-2 text-xs text-gray-500">
            Текущий раздел: {progress.currentSection}
          </div>
        )}
        
        {progress.errors && progress.errors.length > 0 && (
          <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded">
            <div className="flex items-center text-red-700 text-sm">
              <AlertCircle size={16} className="mr-2" />
              Ошибки при генерации:
            </div>
            <ul className="mt-1 text-xs text-red-600">
              {progress.errors.map((error, index) => (
                <li key={index}>• {error}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

  const renderTemplateTab = () => (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-3">Выберите шаблон отчета</h3>
        <div className="grid gap-3">
          {Object.entries(PDF_TEMPLATES).map(([key, template]) => (
            <div
              key={key}
              className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                selectedTemplate === key
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setSelectedTemplate(key as PDFReportTemplate)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center">
                    <h4 className="font-medium text-gray-900">{template.title}</h4>
                    {selectedTemplate === key && (
                      <Check size={16} className="ml-2 text-blue-600" />
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{template.description}</p>
                  
                  <div className="mt-3 flex flex-wrap gap-2">
                    {Object.entries(template.sections).map(([section, enabled]) => (
                      enabled && (
                        <span
                          key={section}
                          className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded"
                        >
                          {section === 'titlePage' ? 'Титульная' :
                           section === 'summary' ? 'Резюме' :
                           section === 'comparison' ? 'Сравнение' :
                           section === 'detailedAnalysis' ? 'Детальный анализ' :
                           section === 'charts' ? 'Диаграммы' :
                           section === 'appendices' ? 'Приложения' : section}
                        </span>
                      )
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center text-blue-700 text-sm">
          <Eye size={16} className="mr-2" />
          <span className="font-medium">Предварительная информация</span>
        </div>
        <div className="mt-2 text-sm text-blue-600">
          <p>Результатов для экспорта: {results.length}</p>
          {comparison && <p>Сравнительный анализ: включен</p>}
          <p>Примерное количество страниц: {Math.ceil(results.length * 2 + 3)}</p>
        </div>
      </div>
    </div>
  );

  const renderOptionsTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Настройки документа</h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Формат
            </label>
            <select
              value={options.format}
              onChange={(e) => setOptions(prev => ({ ...prev, format: e.target.value as any }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="A4">A4</option>
              <option value="A3">A3</option>
              <option value="Letter">Letter</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ориентация
            </label>
            <select
              value={options.orientation}
              onChange={(e) => setOptions(prev => ({ ...prev, orientation: e.target.value as any }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="portrait">Портретная</option>
              <option value="landscape">Альбомная</option>
            </select>
          </div>
        </div>
      </div>

      <div>
        <h4 className="text-md font-medium text-gray-900 mb-3">Содержание отчета</h4>
        <div className="space-y-3">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={options.includeExecutiveSummary}
              onChange={(e) => setOptions(prev => ({ ...prev, includeExecutiveSummary: e.target.checked }))}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700">Исполнительное резюме</span>
          </label>
          
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={options.includeDetailedAnalysis}
              onChange={(e) => setOptions(prev => ({ ...prev, includeDetailedAnalysis: e.target.checked }))}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700">Детальный анализ каждого КП</span>
          </label>
          
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={options.includeCharts}
              onChange={(e) => setOptions(prev => ({ ...prev, includeCharts: e.target.checked }))}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700">Диаграммы и графики</span>
          </label>
          
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={options.includeAppendices}
              onChange={(e) => setOptions(prev => ({ ...prev, includeAppendices: e.target.checked }))}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700">Приложения</span>
          </label>
        </div>
      </div>

      <div>
        <h4 className="text-md font-medium text-gray-900 mb-3">Дополнительные настройки</h4>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Название проекта
            </label>
            <input
              type="text"
              value={options.projectName}
              onChange={(e) => setOptions(prev => ({ ...prev, projectName: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Анализ коммерческих предложений"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Компания
            </label>
            <input
              type="text"
              value={options.companyName}
              onChange={(e) => setOptions(prev => ({ ...prev, companyName: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="DevAssist Pro"
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderStylingTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Внешний вид</h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Основной цвет
            </label>
            <input
              type="color"
              value={styling.primaryColor}
              onChange={(e) => setStyling(prev => ({ ...prev, primaryColor: e.target.value }))}
              className="w-full h-10 border border-gray-300 rounded-lg cursor-pointer"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Акцентный цвет
            </label>
            <input
              type="color"
              value={styling.accentColor}
              onChange={(e) => setStyling(prev => ({ ...prev, accentColor: e.target.value }))}
              className="w-full h-10 border border-gray-300 rounded-lg cursor-pointer"
            />
          </div>
        </div>
      </div>

      <div>
        <h4 className="text-md font-medium text-gray-900 mb-3">Шрифт и размеры</h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Семейство шрифтов
            </label>
            <select
              value={styling.fontFamily}
              onChange={(e) => setStyling(prev => ({ ...prev, fontFamily: e.target.value as any }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Helvetica">Helvetica</option>
              <option value="Arial">Arial</option>
              <option value="Times">Times</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Размер основного текста
            </label>
            <input
              type="number"
              min="8"
              max="16"
              value={styling.fontSize.body}
              onChange={(e) => setStyling(prev => ({
                ...prev,
                fontSize: { ...prev.fontSize, body: parseInt(e.target.value) }
              }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      <div>
        <h4 className="text-md font-medium text-gray-900 mb-3">Дополнительно</h4>
        <div className="space-y-3">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={styling.showPageNumbers}
              onChange={(e) => setStyling(prev => ({ ...prev, showPageNumbers: e.target.checked }))}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700">Показывать номера страниц</span>
          </label>
          
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={styling.showWatermark}
              onChange={(e) => setStyling(prev => ({ ...prev, showWatermark: e.target.checked }))}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700">Добавить водяной знак</span>
          </label>
        </div>
      </div>
    </div>
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Заголовок */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <FileText className="text-blue-600" size={24} />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Экспорт в PDF</h2>
              <p className="text-sm text-gray-500">
                Настройте параметры экспорта отчета анализа КП
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isExporting}
            className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
          >
            <X size={24} />
          </button>
        </div>

        {/* Навигация */}
        <div className="flex border-b border-gray-200">
          {[
            { id: 'template', label: 'Шаблон', icon: FileText },
            { id: 'options', label: 'Настройки', icon: Settings },
            { id: 'styling', label: 'Оформление', icon: Eye },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <tab.icon size={16} />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Содержимое */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {activeTab === 'template' && renderTemplateTab()}
          {activeTab === 'options' && renderOptionsTab()}
          {activeTab === 'styling' && renderStylingTab()}
        </div>

        {/* Прогресс */}
        {renderProgressBar()}

        {/* Кнопки */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            disabled={isExporting}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
          >
            {isExporting ? 'Генерация...' : 'Отмена'}
          </button>
          <button
            onClick={handleExport}
            disabled={isExporting || results.length === 0}
            className="flex items-center space-x-2 px-6 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isExporting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Генерация PDF...</span>
              </>
            ) : (
              <>
                <Download size={16} />
                <span>Экспорт PDF</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PDFExportDialog;