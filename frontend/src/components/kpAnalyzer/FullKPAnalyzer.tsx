/**
 * Полноценный КП Анализатор с drag & drop и реальным ИИ анализом
 */

import React, { useState, useRef, useCallback } from 'react';
import { 
  Upload, 
  FileText, 
  X, 
  Brain, 
  Settings, 
  Play,
  CheckCircle,
  AlertCircle,
  Clock,
  BarChart3,
  Star,
  TrendingUp,
  TrendingDown,
  Target,
  ArrowRight,
  ArrowLeft
} from 'lucide-react';
import { getModelById } from '../../config/models';
import { realAIService } from '../../services/ai/realAIService';
import { documentProcessor } from '../../services/documentExtractor';

interface FullKPAnalyzerProps {
  currentStep: string;
  onStepChange: (step: string) => void;
  uploadedFiles: {
    tz_file: File | null;
    kp_files: File[];
    additional_files: File[];
  };
  onTZUpload: (file: File) => void;
  onKPUpload: (files: File[]) => void;
  onAdditionalUpload: (files: File[]) => void;
  onRemoveFile: (type: 'tz' | 'kp' | 'additional', index?: number) => void;
  selectedModel: string;
  selectedComparisonModel: string;
  onModelChange: (model: string) => void;
  onComparisonModelChange: (model: string) => void;
  isDarkMode: boolean;
}

const FullKPAnalyzer: React.FC<FullKPAnalyzerProps> = ({
  currentStep,
  onStepChange,
  uploadedFiles,
  onTZUpload,
  onKPUpload,
  onAdditionalUpload,
  onRemoveFile,
  selectedModel,
  selectedComparisonModel,
  onModelChange,
  onComparisonModelChange,
  isDarkMode
}) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTask, setCurrentTask] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [analysisResults, setAnalysisResults] = useState<any[]>([]);
  const [comparisonResult, setComparisonResult] = useState<any>(null);

  const tzFileRef = useRef<HTMLInputElement>(null);
  const kpFilesRef = useRef<HTMLInputElement>(null);
  const additionalFilesRef = useRef<HTMLInputElement>(null);

  // Доступные модели
  const availableModels = [
    { id: 'claude-3-5-sonnet', name: 'Claude 3.5 Sonnet' },
    { id: 'claude-3-opus', name: 'Claude 3 Opus' },
    { id: 'gpt-4o', name: 'GPT-4o' },
    { id: 'gpt-4-turbo', name: 'GPT-4 Turbo' },
    { id: 'gemini-pro', name: 'Gemini Pro' }
  ];

  // Drag and Drop обработчики
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, type: 'tz' | 'kp' | 'additional') => {
    e.preventDefault();
    e.stopPropagation();

    const files = Array.from(e.dataTransfer.files);
    const validFiles = files.filter(file => 
      file.type === 'application/pdf' || 
      file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      file.name.toLowerCase().endsWith('.pdf') ||
      file.name.toLowerCase().endsWith('.docx')
    );

    if (validFiles.length === 0) {
      setError('Поддерживаются только файлы PDF и DOCX');
      return;
    }

    if (type === 'tz') {
      if (validFiles.length > 1) {
        setError('Можно загрузить только один файл ТЗ');
        return;
      }
      onTZUpload(validFiles[0]);
    } else if (type === 'kp') {
      onKPUpload(validFiles);
    } else {
      onAdditionalUpload(validFiles);
    }
  }, [onTZUpload, onKPUpload, onAdditionalUpload]);

  // Анализ с реальным ИИ
  const startAnalysis = async () => {
    if (!uploadedFiles.tz_file || uploadedFiles.kp_files.length === 0) {
      setError('Необходимо загрузить ТЗ и как минимум одно КП');
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setProgress(0);
    setCurrentTask('Инициализация анализа...');

    try {
      // Этап 1: Извлечение текста из файлов
      setProgress(10);
      setCurrentTask('Извлечение текста из файлов...');
      
      const tzText = await extractTextFromFile(uploadedFiles.tz_file);
      const kpTexts = await Promise.all(
        uploadedFiles.kp_files.map(file => extractTextFromFile(file))
      );

      // Этап 2: Анализ каждого КП
      setProgress(30);
      setCurrentTask('Анализ коммерческих предложений...');
      
      const results = [];
      for (let i = 0; i < kpTexts.length; i++) {
        setProgress(30 + (i / kpTexts.length) * 50);
        setCurrentTask(`Анализ КП ${i + 1} из ${kpTexts.length}...`);
        
        const result = await analyzeKPWithAI(tzText, kpTexts[i], uploadedFiles.kp_files[i].name, selectedModel);
        results.push(result);
      }

      // Этап 3: Сравнение результатов
      setProgress(85);
      setCurrentTask('Сравнение и ранжирование результатов...');
      
      const comparison = await compareResultsWithAI(results, selectedComparisonModel);

      // Этап 4: Завершение
      setProgress(100);
      setCurrentTask('Анализ завершен!');
      
      setAnalysisResults(results);
      setComparisonResult(comparison);
      
      // Сохранение в историю
      saveToHistory(comparison);
      
      setTimeout(() => {
        onStepChange('results');
        setIsAnalyzing(false);
      }, 1000);

    } catch (error) {
      console.error('Analysis failed:', error);
      setError(error instanceof Error ? error.message : 'Ошибка анализа');
      setIsAnalyzing(false);
    }
  };

  // Извлечение текста из файла (используем documentProcessor)
  const extractTextFromFile = async (file: File): Promise<string> => {
    return await documentProcessor.extractTextFromFile(file);
  };

  // Анализ КП с помощью реального ИИ
  const analyzeKPWithAI = async (tzText: string, kpText: string, fileName: string, model: string) => {
    try {
      console.log(`[FullKPAnalyzer] Analyzing ${fileName} with ${model}`);
      const result = await realAIService.analyzeKPWithAI({
        tzText,
        kpText,
        fileName,
        model
      });
      console.log(`[FullKPAnalyzer] Analysis completed for ${fileName}:`, result);
      return result;
    } catch (error) {
      console.error(`[FullKPAnalyzer] AI analysis failed for ${fileName}:`, error);
      
      setError('Ошибка анализа: AI API недоступен. Проверьте подключение к серверу.');
      throw error;
    }
  };

  // Сравнение результатов с помощью реального ИИ
  const compareResultsWithAI = async (results: any[], model: string) => {
    try {
      console.log(`[FullKPAnalyzer] Comparing results with ${model}`);
      const comparison = await realAIService.compareResultsWithAI({
        results,
        model
      });
      console.log(`[FullKPAnalyzer] Comparison completed:`, comparison);
      return comparison;
    } catch (error) {
      console.error(`[FullKPAnalyzer] AI comparison failed:`, error);
      
      setError('Ошибка сравнения: AI API недоступен. Проверьте подключение к серверу.');
      throw error;
    }
  };

  // Сохранение в историю
  const saveToHistory = (comparison: any) => {
    try {
      const history = JSON.parse(localStorage.getItem('kp_analyzer_history') || '[]');
      const updatedHistory = [comparison, ...history.slice(0, 19)];
      localStorage.setItem('kp_analyzer_history', JSON.stringify(updatedHistory));
    } catch (error) {
      console.error('Failed to save to history:', error);
    }
  };

  // Форматирование размера файла
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Экран загрузки файлов
  if (currentStep === 'upload') {
    return (
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center space-x-3">
            <Upload className={`w-8 h-8 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
            <h2 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              КП Анализатор
            </h2>
          </div>
          <p className={`text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            Загрузите документы для анализа коммерческих предложений
          </p>
        </div>

        {/* Ошибки */}
        {error && (
          <div className="p-4 rounded-lg bg-red-900/50 border border-red-700">
            <div className="flex items-center space-x-3">
              <AlertCircle className="w-5 h-5 text-red-400" />
              <div className="flex-1">
                <h3 className="text-red-400 font-medium">Ошибка</h3>
                <p className="text-red-300 text-sm mt-1">{error}</p>
              </div>
              <button onClick={() => setError(null)} className="text-red-400 hover:text-red-300">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Техническое задание */}
          <div className={`p-6 rounded-xl border-2 border-dashed transition-colors ${
            isDarkMode 
              ? 'bg-gray-800 border-gray-600 hover:border-blue-500' 
              : 'bg-white border-gray-300 hover:border-blue-500'
          }`}
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, 'tz')}
          >
            <div className="text-center">
              <FileText className={`mx-auto w-12 h-12 mb-4 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
              <h3 className={`text-lg font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Техническое задание
              </h3>
              <p className={`text-sm mb-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Перетащите файл ТЗ или нажмите для выбора
              </p>
              
              {uploadedFiles.tz_file ? (
                <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <FileText className="w-4 h-4 text-green-500" />
                      <span className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {uploadedFiles.tz_file.name}
                      </span>
                    </div>
                    <button
                      onClick={() => onRemoveFile('tz')}
                      className="text-red-400 hover:text-red-300"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {formatFileSize(uploadedFiles.tz_file.size)}
                  </p>
                </div>
              ) : (
                <button
                  onClick={() => tzFileRef.current?.click()}
                  className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  Выбрать файл ТЗ
                </button>
              )}
              
              <input
                ref={tzFileRef}
                type="file"
                accept=".pdf,.docx"
                onChange={(e) => e.target.files?.[0] && onTZUpload(e.target.files[0])}
                className="hidden"
              />
            </div>
          </div>

          {/* Коммерческие предложения */}
          <div className={`p-6 rounded-xl border-2 border-dashed transition-colors ${
            isDarkMode 
              ? 'bg-gray-800 border-gray-600 hover:border-purple-500' 
              : 'bg-white border-gray-300 hover:border-purple-500'
          }`}
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, 'kp')}
          >
            <div className="text-center">
              <BarChart3 className={`mx-auto w-12 h-12 mb-4 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`} />
              <h3 className={`text-lg font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Коммерческие предложения
              </h3>
              <p className={`text-sm mb-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Загрузите файлы КП для анализа
              </p>
              
              {uploadedFiles.kp_files.length > 0 ? (
                <div className="space-y-2 mb-4">
                  {uploadedFiles.kp_files.map((file, index) => (
                    <div key={index} className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <FileText className="w-4 h-4 text-purple-500" />
                          <span className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            {file.name}
                          </span>
                        </div>
                        <button
                          onClick={() => onRemoveFile('kp', index)}
                          className="text-red-400 hover:text-red-300"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        {formatFileSize(file.size)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : null}
              
              <button
                onClick={() => kpFilesRef.current?.click()}
                className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
              >
                {uploadedFiles.kp_files.length > 0 ? 'Добавить КП' : 'Выбрать файлы КП'}
              </button>
              
              <input
                ref={kpFilesRef}
                type="file"
                accept=".pdf,.docx"
                multiple
                onChange={(e) => e.target.files && onKPUpload(Array.from(e.target.files))}
                className="hidden"
              />
            </div>
          </div>

          {/* Дополнительные файлы */}
          <div className={`p-6 rounded-xl border-2 border-dashed transition-colors ${
            isDarkMode 
              ? 'bg-gray-800 border-gray-600 hover:border-green-500' 
              : 'bg-white border-gray-300 hover:border-green-500'
          }`}
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, 'additional')}
          >
            <div className="text-center">
              <FileText className={`mx-auto w-12 h-12 mb-4 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
              <h3 className={`text-lg font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Дополнительные файлы
              </h3>
              <p className={`text-sm mb-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Приложения, спецификации (опционально)
              </p>
              
              {uploadedFiles.additional_files.length > 0 ? (
                <div className="space-y-2 mb-4">
                  {uploadedFiles.additional_files.map((file, index) => (
                    <div key={index} className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <FileText className="w-4 h-4 text-green-500" />
                          <span className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            {file.name}
                          </span>
                        </div>
                        <button
                          onClick={() => onRemoveFile('additional', index)}
                          className="text-red-400 hover:text-red-300"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        {formatFileSize(file.size)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : null}
              
              <button
                onClick={() => additionalFilesRef.current?.click()}
                className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
              >
                Выбрать файлы
              </button>
              
              <input
                ref={additionalFilesRef}
                type="file"
                accept=".pdf,.docx"
                multiple
                onChange={(e) => e.target.files && onAdditionalUpload(Array.from(e.target.files))}
                className="hidden"
              />
            </div>
          </div>
        </div>

        {/* Настройки анализа */}
        <div className={`p-6 rounded-xl border ${
          isDarkMode 
            ? 'bg-gray-800 border-gray-700' 
            : 'bg-white border-gray-200'
        }`}>
          <div className="flex items-center space-x-3 mb-6">
            <Settings className={`w-6 h-6 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
            <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Настройки анализа
            </h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Модель для анализа КП
              </label>
              <select
                value={selectedModel}
                onChange={(e) => onModelChange(e.target.value)}
                className={`w-full px-3 py-2 rounded-lg border ${
                  isDarkMode
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              >
                {availableModels.map(model => (
                  <option key={model.id} value={model.id}>{model.name}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Модель для сравнения
              </label>
              <select
                value={selectedComparisonModel}
                onChange={(e) => onComparisonModelChange(e.target.value)}
                className={`w-full px-3 py-2 rounded-lg border ${
                  isDarkMode
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              >
                {availableModels.map(model => (
                  <option key={model.id} value={model.id}>{model.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Кнопка запуска анализа */}
        <div className="flex justify-center">
          <button
            onClick={startAnalysis}
            disabled={!uploadedFiles.tz_file || uploadedFiles.kp_files.length === 0}
            className="flex items-center space-x-3 px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 disabled:from-gray-500 disabled:to-gray-600 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl font-semibold"
          >
            <Brain className="w-5 h-5" />
            <span>Начать анализ с ИИ</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  // Экран анализа
  if (isAnalyzing) {
    return (
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center space-x-3">
            <Brain className={`w-8 h-8 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'} animate-pulse`} />
            <h2 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              ИИ анализирует документы
            </h2>
          </div>
          <p className={`text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            Пожалуйста, подождите, это может занять несколько минут
          </p>
        </div>

        <div className={`p-8 rounded-xl border ${
          isDarkMode 
            ? 'bg-gray-800 border-gray-700' 
            : 'bg-white border-gray-200 shadow-lg'
        }`}>
          <div className="text-center space-y-6">
            <div className="space-y-4">
              <div className={`text-4xl font-bold ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                {progress}%
              </div>
              <div className={`w-full h-3 rounded-full ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                <div
                  className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-1000"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className={`text-lg font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {currentTask}
              </p>
            </div>

            <div className={`p-6 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
              <div className="flex items-center justify-center space-x-2 mb-4">
                <Brain className={`w-5 h-5 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`} />
                <h4 className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Обрабатывается с помощью ИИ
                </h4>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className={`block ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Модель анализа:</span>
                  <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {availableModels.find(m => m.id === selectedModel)?.name}
                  </span>
                </div>
                <div>
                  <span className={`block ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Файлов КП:</span>
                  <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {uploadedFiles.kp_files.length}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Экран результатов
  if (currentStep === 'results' && analysisResults.length > 0) {
    return (
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center space-x-3">
            <CheckCircle className={`w-8 h-8 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
            <h2 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Результаты анализа
            </h2>
          </div>
          <p className={`text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            ИИ проанализировал {analysisResults.length} коммерческих предложений
          </p>
        </div>

        {/* Рекомендуемое КП */}
        {comparisonResult && (
          <div className={`p-6 rounded-xl border ${
            isDarkMode 
              ? 'bg-gradient-to-r from-green-900/20 to-blue-900/20 border-green-700' 
              : 'bg-gradient-to-r from-green-50 to-blue-50 border-green-200 shadow-lg'
          }`}>
            <div className="flex items-center space-x-3 mb-4">
              <Star className={`w-6 h-6 ${isDarkMode ? 'text-yellow-400' : 'text-yellow-600'}`} />
              <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Рекомендация ИИ
              </h3>
            </div>
            <p className={`text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              {comparisonResult.recommendation.reasoning}
            </p>
          </div>
        )}

        {/* Детальные результаты */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {analysisResults.map((result, index) => (
            <div key={result.id} className={`p-6 rounded-xl border ${
              isDarkMode 
                ? 'bg-gray-800 border-gray-700' 
                : 'bg-white border-gray-200 shadow-lg'
            }`}>
              <div className="flex items-center justify-between mb-4">
                <h4 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {result.fileName}
                </h4>
                <div className={`text-2xl font-bold ${
                  result.complianceScore >= 85 ? 'text-green-400' : 
                  result.complianceScore >= 70 ? 'text-blue-400' : 
                  result.complianceScore >= 60 ? 'text-yellow-400' : 'text-red-400'
                }`}>
                  {result.complianceScore}%
                </div>
              </div>

              <div className="space-y-3 mb-6">
                {result.criteriaAnalysis.map((criteria: any, critIndex: number) => (
                  <div key={critIndex} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        {criteria.criterion}
                      </span>
                      <span className={`font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {criteria.score}%
                      </span>
                    </div>
                    <div className={`w-full h-2 rounded-full ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                      <div
                        className={`h-2 rounded-full ${
                          criteria.score >= 80 ? 'bg-green-400' :
                          criteria.score >= 60 ? 'bg-yellow-400' :
                          'bg-red-400'
                        }`}
                        style={{ width: `${criteria.score}%` }}
                      />
                    </div>
                    <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {criteria.comment}
                    </p>
                  </div>
                ))}
              </div>

              <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Анализ выполнен с помощью {availableModels.find(m => m.id === result.model)?.name}
              </div>
            </div>
          ))}
        </div>

        {/* Навигация */}
        <div className="flex items-center justify-between pt-8">
          <button
            onClick={() => onStepChange('upload')}
            className={`flex items-center space-x-2 px-6 py-3 rounded-lg border transition-colors ${
              isDarkMode
                ? 'border-gray-600 text-gray-300 hover:bg-gray-800'
                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Новый анализ</span>
          </button>
        </div>
      </div>
    );
  }

  return null;
};

export default FullKPAnalyzer;