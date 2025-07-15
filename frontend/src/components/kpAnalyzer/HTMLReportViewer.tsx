/**
 * HTML Report Viewer для КП Анализатора
 * Отображение HTML отчетов с профессиональными стилями
 */

import React, { useState, useRef } from 'react';
import { Download, ExternalLink, Eye, Code } from 'lucide-react';

interface HTMLReportViewerProps {
  htmlContent: string;
  title?: string;
  onDownload?: () => void;
  onClose?: () => void;
}

export const HTMLReportViewer: React.FC<HTMLReportViewerProps> = ({
  htmlContent,
  title = 'Аналитический отчет',
  onDownload,
  onClose
}) => {
  const [viewMode, setViewMode] = useState<'preview' | 'source'>('preview');
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // CSS стили для отчета (адаптированные из report_styles.css)
  const reportStyles = `
    <style>
      :root {
        --primary-color: #2E75D6;
        --secondary-color: #1A1E3A;
        --accent-color: #FF5F08;
        --success-color: #10B981;
        --warning-color: #F59E0B;
        --danger-color: #EF4444;
        --background-color: #F4F7FC;
        --surface-color: #FFFFFF;
        --text-primary: #0F172A;
        --text-secondary: #64748B;
        --border-color: #E2E8F0;
        --border-radius: 8px;
      }

      body {
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
        line-height: 1.6;
        color: var(--text-primary);
        background-color: var(--background-color);
        margin: 0;
        padding: 20px;
      }

      .report-container {
        max-width: 1200px;
        margin: 0 auto;
        background-color: var(--surface-color);
        border-radius: 12px;
        box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1);
        padding: 32px;
      }

      h1 {
        font-size: 2.5rem;
        font-weight: 700;
        color: var(--primary-color);
        border-bottom: 3px solid var(--accent-color);
        padding-bottom: 16px;
        margin-bottom: 32px;
      }

      h2 {
        font-size: 2rem;
        color: var(--secondary-color);
        margin-top: 48px;
        margin-bottom: 24px;
      }

      h3 {
        font-size: 1.5rem;
        color: var(--primary-color);
        margin-top: 32px;
        margin-bottom: 16px;
      }

      .high {
        color: var(--success-color);
        background-color: rgba(16, 185, 129, 0.1);
        padding: 4px 8px;
        border-radius: var(--border-radius);
        border-left: 4px solid var(--success-color);
        font-weight: 600;
      }

      .medium {
        color: var(--warning-color);
        background-color: rgba(245, 158, 11, 0.1);
        padding: 4px 8px;
        border-radius: var(--border-radius);
        border-left: 4px solid var(--warning-color);
        font-weight: 600;
      }

      .low {
        color: var(--danger-color);
        background-color: rgba(239, 68, 68, 0.1);
        padding: 4px 8px;
        border-radius: var(--border-radius);
        border-left: 4px solid var(--danger-color);
        font-weight: 600;
      }

      .warning {
        background-color: rgba(245, 158, 11, 0.1);
        border: 1px solid var(--warning-color);
        border-radius: var(--border-radius);
        padding: 16px;
        margin: 16px 0;
      }

      .warning::before {
        content: "⚠️ ";
        font-weight: bold;
        color: var(--warning-color);
      }

      .recommendation {
        background-color: rgba(46, 117, 214, 0.1);
        border: 1px solid var(--primary-color);
        border-radius: var(--border-radius);
        padding: 16px;
        margin: 16px 0;
      }

      .recommendation::before {
        content: "💡 ";
        font-weight: bold;
        color: var(--primary-color);
      }

      .table-responsive {
        overflow-x: auto;
        margin: 24px 0;
        border-radius: var(--border-radius);
        box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
      }

      table {
        width: 100%;
        border-collapse: collapse;
        background-color: var(--surface-color);
      }

      thead {
        background-color: var(--primary-color);
        color: white;
      }

      thead th {
        padding: 16px;
        text-align: left;
        font-weight: 600;
        font-size: 0.875rem;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }

      tbody tr {
        border-bottom: 1px solid var(--border-color);
      }

      tbody tr:hover {
        background-color: #F8FAFC;
      }

      td {
        padding: 16px;
        color: var(--text-secondary);
      }

      .metric-card {
        background-color: var(--surface-color);
        border-radius: var(--border-radius);
        padding: 24px;
        text-align: center;
        box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);
        border: 1px solid var(--border-color);
        margin: 16px 0;
      }

      .metric-value {
        font-size: 2rem;
        font-weight: 700;
        color: var(--primary-color);
        margin-bottom: 4px;
      }

      .metric-label {
        font-size: 0.875rem;
        color: var(--text-secondary);
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }

      @media print {
        body { background: white; }
        .report-container { box-shadow: none; }
      }
    </style>
  `;

  // Полный HTML с стилями
  const fullHTML = `
    <!DOCTYPE html>
    <html lang="ru">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
      ${reportStyles}
    </head>
    <body>
      <div class="report-container">
        ${htmlContent}
      </div>
    </body>
    </html>
  `;

  const handleDownload = () => {
    const blob = new Blob([fullHTML], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    if (onDownload) {
      onDownload();
    }
  };

  const handleOpenInNewTab = () => {
    const newWindow = window.open();
    if (newWindow) {
      newWindow.document.write(fullHTML);
      newWindow.document.close();
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(fullHTML);
      alert('HTML код скопирован в буфер обмена');
    } catch (err) {
      console.error('Ошибка копирования:', err);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Заголовок */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <p className="text-sm text-gray-500">HTML отчет готов к просмотру</p>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Переключатель режима просмотра */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('preview')}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                viewMode === 'preview' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Eye size={16} className="inline mr-1" />
              Предпросмотр
            </button>
            <button
              onClick={() => setViewMode('source')}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                viewMode === 'source' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Code size={16} className="inline mr-1" />
              Исходный код
            </button>
          </div>

          {/* Кнопки действий */}
          <button
            onClick={handleOpenInNewTab}
            className="flex items-center space-x-1 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            title="Открыть в новой вкладке"
          >
            <ExternalLink size={16} />
            <span>Открыть</span>
          </button>

          <button
            onClick={handleDownload}
            className="flex items-center space-x-1 px-3 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            <Download size={16} />
            <span>Скачать</span>
          </button>

          {onClose && (
            <button
              onClick={onClose}
              className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
            >
              Закрыть
            </button>
          )}
        </div>
      </div>

      {/* Содержимое */}
      <div className="flex-1 overflow-hidden">
        {viewMode === 'preview' ? (
          <iframe
            ref={iframeRef}
            srcDoc={fullHTML}
            className="w-full h-full border-none"
            title="HTML Report Preview"
            sandbox="allow-same-origin"
          />
        ) : (
          <div className="h-full overflow-auto bg-gray-50">
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Исходный код HTML</h3>
                <button
                  onClick={copyToClipboard}
                  className="px-3 py-1 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded transition-colors"
                >
                  Копировать
                </button>
              </div>
              <pre className="bg-white border border-gray-200 rounded-lg p-4 overflow-auto text-sm">
                <code className="language-html">{fullHTML}</code>
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};