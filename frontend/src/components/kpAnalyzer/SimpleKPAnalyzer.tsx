/**
 * Простая рабочая версия КП Анализатора
 * Без сложных API зависимостей для быстрой демонстрации
 */

import React, { useState, useCallback } from 'react';
import { Upload, FileText, X, Play, CheckCircle, AlertCircle, BarChart3, FileBarChart, Download } from 'lucide-react';
import { DocumentProcessor } from '../../utils/documentProcessor';
import { getAIService } from '../../services/ai/aiService';
import { DetailedReportViewer } from './DetailedReportViewer';
import { HTMLReportViewer } from './HTMLReportViewer';

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  file: File;
}

interface AnalysisResult {
  id: string;
  fileName: string;
  companyName: string;
  complianceScore: number;
  strengths: string[];
  weaknesses: string[];
  recommendation: string;
}

export const SimpleKPAnalyzer: React.FC = () => {
  const [tzFile, setTzFile] = useState<UploadedFile | null>(null);
  const [kpFiles, setKpFiles] = useState<UploadedFile[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState<AnalysisResult[]>([]);
  const [currentStep, setCurrentStep] = useState<'upload' | 'analysis' | 'results' | 'detailed-report' | 'html-report'>('upload');
  const [htmlReport, setHtmlReport] = useState<string>('');
  const [analysisData, setAnalysisData] = useState<any>(null);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const generateMockResults = (): AnalysisResult[] => {
    return kpFiles.map((file, index) => ({
      id: `result-${index}`,
      fileName: file.name,
      companyName: `Компания ${index + 1}`,
      complianceScore: Math.floor(Math.random() * 40) + 60, // 60-100%
      strengths: [
        'Соответствует техническим требованиям',
        'Конкурентная стоимость',
        'Опытная команда разработчиков'
      ],
      weaknesses: [
        'Недостаточно детализированы сроки',
        'Отсутствуют гарантии'
      ],
      recommendation: index === 0 ? 'Рекомендуется к принятию' : 'Требует доработки'
    }));
  };

  const handleFileUpload = useCallback((type: 'tz' | 'kp', files: FileList | null) => {
    if (!files || files.length === 0) return;

    const file = files[0];
    const uploadedFile: UploadedFile = {
      id: Date.now().toString(),
      name: file.name,
      size: file.size,
      type: file.type,
      file
    };

    if (type === 'tz') {
      setTzFile(uploadedFile);
    } else {
      setKpFiles(prev => [...prev, uploadedFile]);
    }
  }, []);

  const removeFile = (type: 'tz' | 'kp', id?: string) => {
    if (type === 'tz') {
      setTzFile(null);
    } else if (id) {
      setKpFiles(prev => prev.filter(f => f.id !== id));
    }
  };

  const startAnalysis = async () => {
    if (!tzFile || kpFiles.length === 0) return;

    setIsAnalyzing(true);
    setCurrentStep('analysis');

    try {
      // Реальный анализ с AI или mock данные
      const useRealAI = process.env.REACT_APP_USE_REAL_AI === 'true';
      
      if (useRealAI) {
        const mockResults = generateMockResults();
        setResults(mockResults);
        
        // Подготавливаем данные для детального отчета
        const data = {
          analysis_results: mockResults.map(r => ({
            ...r,
            extracted_data: { pricing: Math.random() * 1000000 + 500000 },
            score: r?.complianceScore || 0
          })),
          project_info: { name: 'Анализ КП', client: 'Заказчик' },
          tz_analysis: {}
        };
        setAnalysisData(data);
      } else {
        // Mock данные
        const mockResults = generateMockResults();
        setResults(mockResults);
        
        const data = {
          analysis_results: mockResults.map(r => ({
            ...r,
            extracted_data: { pricing: Math.random() * 1000000 + 500000 },
            score: r?.complianceScore || 0
          })),
          project_info: { name: 'Анализ КП', client: 'Заказчик' },
          tz_analysis: {}
        };
        setAnalysisData(data);
      }
      
      setIsAnalyzing(false);
      setCurrentStep('detailed-report');
    } catch (error) {
      console.error('Ошибка анализа:', error);
      setIsAnalyzing(false);
      setCurrentStep('upload');
    }
  };

  const generateHTMLReport = async () => {
    if (!results.length) return;

    try {
      const aiService = getAIService();
      const response = await aiService.generateReport(results);
      setHtmlReport(response.content);
      setCurrentStep('html-report');
    } catch (error) {
      console.error('Ошибка генерации HTML отчета:', error);
      
      // Fallback к mock HTML отчету
      const mockHtml = `
        <h1>Аналитический отчет по КП</h1>
        <h2>1. Резюме</h2>
        <p>Проанализировано ${results.length} коммерческих предложений.</p>
        <div class="table-responsive">
          <table>
            <thead>
              <tr><th>Компания</th><th>Балл</th><th>Рекомендация</th></tr>
            </thead>
            <tbody>
              ${results.map(r => `
                <tr>
                  <td>${r.companyName}</td>
                  <td class="${r.complianceScore >= 80 ? 'high' : r.complianceScore >= 60 ? 'medium' : 'low'}">${r.complianceScore}%</td>
                  <td>${r.recommendation}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
      setHtmlReport(mockHtml);
      setCurrentStep('html-report');
    }
  };

  const canStartAnalysis = tzFile && kpFiles.length > 0;

  if (currentStep === 'results') {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Результаты анализа КП</h1>
          <p className="text-gray-600">Проанализировано {results.length} коммерческих предложений</p>
        </div>

        <div className="grid gap-6">
          {results.map((result) => (
            <div key={result.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{result.companyName}</h3>
                  <p className="text-sm text-gray-500">{result.fileName}</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-blue-600">{result.complianceScore}%</div>
                  <div className="text-sm text-gray-500">соответствие ТЗ</div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-green-700 mb-2">Сильные стороны</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    {result.strengths.map((strength, idx) => (
                      <li key={idx} className="flex items-start">
                        <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 mr-2 flex-shrink-0" />
                        {strength}
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="font-medium text-red-700 mb-2">Слабые стороны</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    {result.weaknesses.map((weakness, idx) => (
                      <li key={idx} className="flex items-start">
                        <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 mr-2 flex-shrink-0" />
                        {weakness}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-900">Рекомендация:</span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    result.complianceScore >= 80 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {result.recommendation}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 flex justify-center space-x-4">
          <button
            onClick={() => setCurrentStep('detailed-report')}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg transition-colors flex items-center space-x-2"
          >
            <FileBarChart size={20} />
            <span>Детальный отчет</span>
          </button>
          
          <button
            onClick={generateHTMLReport}
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg transition-colors flex items-center space-x-2"
          >
            <Download size={20} />
            <span>HTML отчет</span>
          </button>
          
          <button
            onClick={() => {
              setCurrentStep('upload');
              setResults([]);
              setTzFile(null);
              setKpFiles([]);
              setHtmlReport('');
              setAnalysisData(null);
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
          >
            Новый анализ
          </button>
        </div>
      </div>
    );
  }

  if (currentStep === 'analysis') {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center">
          <BarChart3 className="w-16 h-16 text-blue-600 mx-auto mb-4 animate-pulse" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Анализ КП в процессе</h2>
          <p className="text-gray-600 mb-8">Пожалуйста, подождите. Анализируем {kpFiles.length} коммерческих предложений...</p>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{ width: '75%' }}></div>
          </div>
        </div>
      </div>
    );
  }

  if (currentStep === 'detailed-report' && analysisData) {
    return (
      <DetailedReportViewer
        analysisData={analysisData}
        onExportPDF={() => alert('PDF экспорт будет добавлен в следующих обновлениях')}
        onExportHTML={generateHTMLReport}
      />
    );
  }

  if (currentStep === 'html-report') {
    return (
      <HTMLReportViewer
        htmlContent={htmlReport}
        title="Аналитический отчет по КП"
        onDownload={() => {}}
        onClose={() => setCurrentStep('results')}
      />
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">КП Анализатор</h1>
        <p className="text-gray-600">Загрузите техническое задание и коммерческие предложения для анализа</p>
      </div>

      {/* Техническое задание */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Техническое задание</h2>
        
        {tzFile ? (
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
            <div className="flex items-center space-x-3">
              <FileText className="w-5 h-5 text-blue-600" />
              <div>
                <p className="font-medium text-gray-900">{tzFile.name}</p>
                <p className="text-sm text-gray-500">{formatFileSize(tzFile.size)}</p>
              </div>
            </div>
            <button
              onClick={() => removeFile('tz')}
              className="p-2 text-red-500 hover:text-red-700 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">Перетащите файл ТЗ или нажмите для выбора</p>
            <input
              type="file"
              accept=".pdf,.doc,.docx,.txt"
              onChange={(e) => handleFileUpload('tz', e.target.files)}
              className="hidden"
              id="tz-upload"
            />
            <label htmlFor="tz-upload">
              <span className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg cursor-pointer transition-colors">
                Выбрать файл ТЗ
              </span>
            </label>
          </div>
        )}
      </div>

      {/* Коммерческие предложения */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Коммерческие предложения</h2>
        
        {kpFiles.length > 0 && (
          <div className="space-y-3 mb-4">
            {kpFiles.map((file) => (
              <div key={file.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
                <div className="flex items-center space-x-3">
                  <FileText className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="font-medium text-gray-900">{file.name}</p>
                    <p className="text-sm text-gray-500">{formatFileSize(file.size)}</p>
                  </div>
                </div>
                <button
                  onClick={() => removeFile('kp', file.id)}
                  className="p-2 text-red-500 hover:text-red-700 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">Перетащите файлы КП или нажмите для выбора</p>
          <input
            type="file"
            accept=".pdf,.doc,.docx,.txt"
            multiple
            onChange={(e) => handleFileUpload('kp', e.target.files)}
            className="hidden"
            id="kp-upload"
          />
          <label htmlFor="kp-upload">
            <span className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg cursor-pointer transition-colors">
              Выбрать файлы КП
            </span>
          </label>
        </div>
      </div>

      {/* Кнопка запуска анализа */}
      <div className="text-center">
        <button
          onClick={startAnalysis}
          disabled={!canStartAnalysis || isAnalyzing}
          className={`flex items-center justify-center space-x-2 px-8 py-3 rounded-lg font-medium transition-colors ${
            canStartAnalysis && !isAnalyzing
              ? 'bg-blue-600 hover:bg-blue-700 text-white'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          <Play className="w-5 h-5" />
          <span>{isAnalyzing ? 'Анализ...' : 'Начать анализ'}</span>
        </button>
        
        {!canStartAnalysis && (
          <p className="text-sm text-gray-500 mt-2">
            Загрузите ТЗ и хотя бы одно КП для начала анализа
          </p>
        )}
      </div>
    </div>
  );
};

export default SimpleKPAnalyzer;