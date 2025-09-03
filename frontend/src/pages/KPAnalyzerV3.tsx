/**
 * KP Analyzer v3 - Expert Analysis with 10-Criteria System
 * Advanced commercial proposal analysis with configurable weights and professional reporting
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  Brain, Settings, History, Download, RefreshCw, AlertCircle, 
  CheckCircle, FileText, Zap, Target, ArrowRight, Star,
  TrendingUp, Clock, Users, Shield, Cog, Globe, MessageSquare, Sparkles,
  Eye, FileDown, BarChart3, PieChart, Activity, Award, Layers
} from 'lucide-react';

type ViewMode = 'upload' | 'analysis' | 'results' | 'config';
type AnalysisTab = 'overview' | 'criteria' | 'charts' | 'tables' | 'history';

interface DocumentUpload {
  id: string;
  file: File;
  name: string;
  size: number;
  type: string;
  uploadProgress: number;
  extractionProgress: number;
  status: 'uploading' | 'processing' | 'ready' | 'error';
  extractedText?: string;
  error?: string;
}

interface CriteriaWeights {
  budget_compliance: number;
  timeline_compliance: number;
  technical_compliance: number;
  team_expertise: number;
  functional_coverage: number;
  quality_assurance: number;
  development_methodology: number;
  scalability: number;
  communication: number;
  added_value: number;
}

interface V3AnalysisResult {
  id: number;
  status: string;
  overall_score: number;
  weighted_score: number;
  company_name: string;
  summary: string;
  executive_summary: string;
  recommendations: string[];
  business_analysis: Record<string, any>;
  criteria_weights: CriteriaWeights;
  risk_level: string;
  analysis_type: string;
  processing_time: number;
  currency_data: any;
  extracted_tables: any[];
  charts_data: any;
  created_at: string;
}

const KPAnalyzerV3: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const [viewMode, setViewMode] = useState<ViewMode>('upload');
  const [analysisTab, setAnalysisTab] = useState<AnalysisTab>('overview');
  const [uploadedDocuments, setUploadedDocuments] = useState<DocumentUpload[]>([]);
  const [tzDocument, setTzDocument] = useState<DocumentUpload | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisResult, setAnalysisResult] = useState<V3AnalysisResult | null>(null);
  const [selectedWeightPreset, setSelectedWeightPreset] = useState('balanced');
  const [customWeights, setCustomWeights] = useState<CriteriaWeights | null>(null);
  const [availablePresets, setAvailablePresets] = useState<any>({});
  const [error, setError] = useState<string | null>(null);
  const [isExportingPDF, setIsExportingPDF] = useState(false);

  const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8000';

  useEffect(() => {
    loadWeightPresets();
  }, []);

  const loadWeightPresets = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/v3/criteria/weights/presets`);
      const data = await response.json();
      setAvailablePresets(data);
    } catch (error) {
      console.error('Failed to load weight presets:', error);
    }
  };

  const handleFileUpload = async (files: FileList, documentType: 'kp' | 'tz') => {
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const formData = new FormData();
      formData.append('file', file);

      try {
        const response = await fetch(`${API_BASE}/api/v3/documents/upload`, {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error('Upload failed');
        }

        const result = await response.json();
        
        const documentUpload: DocumentUpload = {
          id: result.id.toString(),
          file,
          name: file.name,
          size: file.size,
          type: file.type,
          uploadProgress: 100,
          extractionProgress: 100,
          status: 'ready',
          extractedText: 'Extracted via advanced v3 processing',
        };

        if (documentType === 'tz') {
          setTzDocument(documentUpload);
        } else {
          setUploadedDocuments(prev => [...prev, documentUpload]);
        }
      } catch (error) {
        console.error('Upload error:', error);
        setError(`Failed to upload ${file.name}: ${error}`);
      }
    }
  };

  const handleStartAnalysis = async () => {
    if (uploadedDocuments.length === 0) return;

    setIsAnalyzing(true);
    setAnalysisProgress(0);
    setViewMode('analysis');

    try {
      // Prepare analysis request
      const analysisRequest = {
        document_ids: uploadedDocuments.map(doc => parseInt(doc.id)),
        tz_document_id: tzDocument ? parseInt(tzDocument.id) : null,
        analysis_config: {
          preset: selectedWeightPreset,
          custom_weights: customWeights,
        },
        detailed_extraction: true,
        generate_charts: true,
      };

      const response = await fetch(`${API_BASE}/api/v3/kp-analyzer/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(analysisRequest),
      });

      if (!response.ok) {
        throw new Error('Analysis failed');
      }

      const result = await response.json();
      setAnalysisResult(result);
      setIsAnalyzing(false);
      setViewMode('results');
    } catch (error) {
      console.error('Analysis error:', error);
      setError(`Analysis failed: ${error}`);
      setIsAnalyzing(false);
    }
  };

  const handleExportPDF = async () => {
    if (!analysisResult) return;

    setIsExportingPDF(true);
    try {
      const response = await fetch(
        `${API_BASE}/api/v3/export/pdf/${analysisResult.id}`,
        { method: 'POST' }
      );

      if (!response.ok) {
        throw new Error('PDF export failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `KP_Analysis_V3_${analysisResult.company_name}_${new Date().getTime()}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('PDF export error:', error);
      setError(`PDF export failed: ${error}`);
    } finally {
      setIsExportingPDF(false);
    }
  };

  const getCriteriaIcon = (criterion: string) => {
    const icons = {
      budget_compliance: TrendingUp,
      timeline_compliance: Clock,
      technical_compliance: Cog,
      team_expertise: Users,
      functional_coverage: Target,
      quality_assurance: Shield,
      development_methodology: Brain,
      scalability: Globe,
      communication: MessageSquare,
      added_value: Sparkles,
    };
    return icons[criterion as keyof typeof icons] || Brain;
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-green-600 bg-green-100 dark:bg-green-900/30';
    if (score >= 70) return 'text-blue-600 bg-blue-100 dark:bg-blue-900/30';
    if (score >= 55) return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30';
    return 'text-red-600 bg-red-100 dark:bg-red-900/30';
  };

  const getComplianceColor = (level: string) => {
    const colors = {
      high: 'text-green-600 bg-green-100',
      medium: 'text-yellow-600 bg-yellow-100', 
      low: 'text-red-600 bg-red-100',
    };
    return colors[level as keyof typeof colors] || colors.medium;
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="bg-gray-900 p-8 rounded-lg text-white max-w-md text-center">
          <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-4">Требуется авторизация</h2>
          <p className="text-gray-300 mb-6">
            Для использования КП Анализатора v3 необходимо войти в систему
          </p>
          <button 
            onClick={() => window.location.href = '/auth'}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg"
          >
            Войти в систему
          </button>
        </div>
      </div>
    );
  }

  const renderUploadView = () => (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex justify-center mb-6">
          <div className="bg-gradient-to-br from-purple-500 to-pink-600 p-4 rounded-2xl">
            <Award className="w-12 h-12 text-white" />
          </div>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
          КП Анализатор v3 EXPERT
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Экспертная система анализа с 10 критериями, настраиваемыми весами и профессиональной отчетностью
        </p>
        
        {/* New V3 Features */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-8 max-w-5xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-purple-200 dark:border-purple-700">
            <Award className="w-6 h-6 text-purple-500 mb-2 mx-auto" />
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
              10 критериев анализа
            </h3>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Экспертная оценка по всем аспектам
            </p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-blue-200 dark:border-blue-700">
            <Settings className="w-6 h-6 text-blue-500 mb-2 mx-auto" />
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
              Настраиваемые веса
            </h3>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Персонализированная оценка
            </p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-green-200 dark:border-green-700">
            <BarChart3 className="w-6 h-6 text-green-500 mb-2 mx-auto" />
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
              Интерактивные графики
            </h3>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Визуализация результатов
            </p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-orange-200 dark:border-orange-700">
            <Layers className="w-6 h-6 text-orange-500 mb-2 mx-auto" />
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
              Извлечение таблиц
            </h3>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Структурированные данные
            </p>
          </div>
        </div>
      </div>

      {/* Configuration Section */}
      <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-6 border border-purple-200 dark:border-purple-800">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Settings className="w-5 h-5" />
          Конфигурация анализа
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Весовые коэффициенты критериев
            </label>
            <select
              value={selectedWeightPreset}
              onChange={(e) => setSelectedWeightPreset(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-700"
            >
              {Object.entries(availablePresets.presets || {}).map(([key, preset]: [string, any]) => (
                <option key={key} value={key}>
                  {preset.name} - {preset.description}
                </option>
              ))}
            </select>
          </div>
          
          <div className="flex items-end">
            <button
              onClick={() => setViewMode('config')}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Настроить вручную
            </button>
          </div>
        </div>
      </div>

      {/* Upload Sections - Similar to v2 but with v3 styling */}
      <div className="max-w-4xl mx-auto space-y-6">
        {/* TZ Upload */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border-2 border-dashed border-purple-200 dark:border-purple-700 overflow-hidden">
          <div className="p-6 border-b border-purple-200 dark:border-purple-700">
            <div className="flex items-center gap-3">
              <FileText className="w-6 h-6 text-purple-500" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Техническое задание (опционально)
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Загрузите ТЗ для сравнительного анализа соответствия
                </p>
              </div>
            </div>
          </div>
          
          <div className="p-6">
            {tzDocument ? (
              <div className="flex items-center justify-between p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-purple-600" />
                  <div>
                    <p className="font-medium text-purple-900 dark:text-purple-100">
                      {tzDocument.name}
                    </p>
                    <p className="text-sm text-purple-700 dark:text-purple-400">
                      Готов к экспертному анализу v3
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setTzDocument(null)}
                  className="text-purple-600 hover:text-purple-800"
                >
                  Удалить
                </button>
              </div>
            ) : (
              <div
                className="border-2 border-dashed border-purple-300 dark:border-purple-600 rounded-lg p-8 text-center hover:border-purple-400 transition-colors cursor-pointer"
                onClick={() => document.getElementById('tz-upload')?.click()}
              >
                <FileText className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                <p className="text-gray-600 dark:text-gray-400">
                  Нажмите для выбора файла ТЗ
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                  PDF, DOCX, DOC, TXT
                </p>
                <input
                  id="tz-upload"
                  type="file"
                  className="hidden"
                  accept=".pdf,.docx,.doc,.txt"
                  onChange={(e) => e.target.files && handleFileUpload(e.target.files, 'tz')}
                />
              </div>
            )}
          </div>
        </div>

        {/* KP Upload */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border-2 border-dashed border-blue-200 dark:border-blue-700 overflow-hidden">
          <div className="p-6 border-b border-blue-200 dark:border-blue-700">
            <div className="flex items-center gap-3">
              <Sparkles className="w-6 h-6 text-blue-500" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Коммерческие предложения
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Загрузите КП для экспертного анализа с извлечением таблиц
                </p>
              </div>
            </div>
          </div>
          
          <div className="p-6">
            {uploadedDocuments.length > 0 && (
              <div className="space-y-3 mb-6">
                {uploadedDocuments.map((doc, index) => (
                  <div 
                    key={doc.id}
                    className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-blue-600" />
                      <div>
                        <p className="font-medium text-blue-900 dark:text-blue-100">
                          {doc.name}
                        </p>
                        <p className="text-sm text-blue-700 dark:text-blue-400">
                          Обработан с расширенным извлечением данных
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setUploadedDocuments(prev => prev.filter((_, i) => i !== index))}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      Удалить
                    </button>
                  </div>
                ))}
              </div>
            )}
            
            <div
              className="border-2 border-dashed border-blue-300 dark:border-blue-600 rounded-lg p-8 text-center hover:border-blue-400 transition-colors cursor-pointer"
              onClick={() => document.getElementById('kp-upload')?.click()}
            >
              <Sparkles className="w-8 h-8 text-blue-400 mx-auto mb-2" />
              <p className="text-gray-600 dark:text-gray-400">
                Нажмите для выбора файлов КП
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                PDF, DOCX, DOC, TXT (до 5 файлов)
              </p>
              <input
                id="kp-upload"
                type="file"
                className="hidden"
                accept=".pdf,.docx,.doc,.txt"
                multiple
                onChange={(e) => e.target.files && handleFileUpload(e.target.files, 'kp')}
              />
            </div>
          </div>
        </div>

        {/* Analysis Control */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl p-6 text-white text-center">
          <h3 className="text-xl font-bold mb-4">
            Готов к экспертному анализу v3?
          </h3>
          
          <button
            onClick={handleStartAnalysis}
            disabled={uploadedDocuments.length === 0}
            className={`
              inline-flex items-center gap-3 px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300
              ${uploadedDocuments.length > 0
                ? 'bg-white text-purple-600 hover:bg-gray-100 transform hover:scale-105 shadow-lg hover:shadow-xl'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }
            `}
          >
            <Award className="w-6 h-6" />
            Запустить экспертный анализ v3
          </button>
          
          {uploadedDocuments.length === 0 && (
            <p className="text-purple-200 text-sm mt-3">
              ⚠️ Загрузите хотя бы одно коммерческое предложение
            </p>
          )}
        </div>
      </div>
    </div>
  );

  const renderAnalysisView = () => (
    <div className="max-w-4xl mx-auto text-center">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-8 border border-gray-200 dark:border-gray-700">
        <div className="mb-6">
          <div className="animate-spin w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Выполняется экспертный анализ v3
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Обработка документов с 10-критериальной системой оценки...
          </p>
        </div>
        
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-4">
          <div 
            className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${analysisProgress}%` }}
          />
        </div>
        
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Анализ займет 30-60 секунд для получения экспертных результатов
        </p>
      </div>
    </div>
  );

  const renderResultsView = () => {
    if (!analysisResult) return null;

    return (
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex justify-center mb-4">
            <div className="bg-green-100 dark:bg-green-900/30 p-4 rounded-2xl">
              <Award className="w-12 h-12 text-green-600" />
            </div>
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Экспертный анализ завершен
          </h1>
          
          {/* Score Card */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 max-w-2xl mx-auto">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {analysisResult.company_name}
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  v3 Expert Analysis • 10 критериев
                </p>
              </div>
              <div className="text-center">
                <div className={`text-3xl font-bold px-4 py-2 rounded-xl ${getScoreColor(analysisResult.overall_score)}`}>
                  {analysisResult.overall_score}
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  Взвешенный: {analysisResult.weighted_score?.toFixed(1)}
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
              <span>Время: {analysisResult.processing_time?.toFixed(1)}с</span>
              <span>Модель: Claude 3 Haiku</span>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getComplianceColor(analysisResult.risk_level?.includes('Низкий') ? 'high' : 'medium')}`}>
                {analysisResult.risk_level}
              </span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex justify-center space-x-8">
            {[
              { id: 'overview', name: 'Обзор', icon: Eye },
              { id: 'criteria', name: 'Критерии', icon: Target },
              { id: 'charts', name: 'Графики', icon: BarChart3 },
              { id: 'tables', name: 'Таблицы', icon: Layers },
              { id: 'history', name: 'История', icon: History },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setAnalysisTab(tab.id as AnalysisTab)}
                  className={`group inline-flex items-center px-1 py-4 border-b-2 font-medium text-sm ${
                    analysisTab === tab.id
                      ? 'border-purple-500 text-purple-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-5 h-5 mr-2" />
                  {tab.name}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="mt-8">
          {analysisTab === 'overview' && renderOverviewTab()}
          {analysisTab === 'criteria' && renderCriteriaTab()}
          {analysisTab === 'charts' && renderChartsTab()}
          {analysisTab === 'tables' && renderTablesTab()}
          {analysisTab === 'history' && renderHistoryTab()}
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={handleExportPDF}
            disabled={isExportingPDF}
            className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
          >
            {isExportingPDF ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Экспорт PDF...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                Скачать отчет PDF
              </>
            )}
          </button>
          
          <button
            onClick={() => {
              setViewMode('upload');
              setAnalysisResult(null);
              setUploadedDocuments([]);
              setTzDocument(null);
            }}
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Новый анализ
          </button>
        </div>
      </div>
    );
  };

  const renderOverviewTab = () => (
    <div className="space-y-6">
      {/* Executive Summary */}
      <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Star className="w-5 h-5 text-yellow-500" />
          Краткое резюме
        </h3>
        <p className="text-gray-700 dark:text-gray-300">
          {analysisResult?.executive_summary || analysisResult?.summary}
        </p>
      </div>

      {/* Recommendations */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Target className="w-5 h-5 text-blue-500" />
          Рекомендации
        </h3>
        <ul className="space-y-2">
          {(analysisResult?.recommendations || []).map((rec, index) => (
            <li key={index} className="flex items-start gap-2 text-gray-700 dark:text-gray-300">
              <ArrowRight className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
              {rec}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );

  const renderCriteriaTab = () => (
    <div className="space-y-4">
      {analysisResult?.business_analysis && Object.entries(analysisResult.business_analysis).map(([criterion, data]: [string, any]) => {
        const Icon = getCriteriaIcon(criterion);
        return (
          <div key={criterion} className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <Icon className="w-6 h-6 text-blue-500" />
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white">
                    {availablePresets.criteria_descriptions?.[criterion] || criterion}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Вес: {(data.weight * 100).toFixed(1)}%
                  </p>
                </div>
              </div>
              
              <div className="text-right">
                <div className={`text-2xl font-bold px-3 py-1 rounded-lg ${getScoreColor(data.score)}`}>
                  {data.score}
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${getComplianceColor(data.compliance_level)}`}>
                  {data.compliance_level}
                </span>
              </div>
            </div>
            
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              {data.details}
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h5 className="font-medium text-gray-900 dark:text-white mb-2">Рекомендации</h5>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  {(data.recommendations || []).map((rec: string, index: number) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 flex-shrink-0" />
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
              
              <div>
                <h5 className="font-medium text-gray-900 dark:text-white mb-2">Факторы риска</h5>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  {(data.risk_factors || []).map((risk: string, index: number) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 bg-red-500 rounded-full mt-2 flex-shrink-0" />
                      {risk}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );

  const renderChartsTab = () => (
    <div className="text-center py-12">
      <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
        Интерактивные графики
      </h3>
      <p className="text-gray-600 dark:text-gray-400">
        Графики будут добавлены в следующем обновлении
      </p>
    </div>
  );

  const renderTablesTab = () => (
    <div className="space-y-6">
      {analysisResult?.extracted_tables?.length > 0 ? (
        analysisResult.extracted_tables.map((table: any, index: number) => (
          <div key={index} className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-4">
              Таблица {index + 1} ({table.rows} строк, {table.columns} столбцов)
            </h4>
            
            {table.preview && (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {table.preview.map((row: any[], rowIndex: number) => (
                      <tr key={rowIndex}>
                        {row.map((cell: any, cellIndex: number) => (
                          <td key={cellIndex} className="px-3 py-2 text-sm text-gray-700 dark:text-gray-300">
                            {String(cell).substring(0, 100)}
                            {String(cell).length > 100 && '...'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ))
      ) : (
        <div className="text-center py-12">
          <Layers className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Таблицы не найдены
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            В загруженных документах не обнаружено структурированных таблиц
          </p>
        </div>
      )}
    </div>
  );

  const renderHistoryTab = () => (
    <div className="text-center py-12">
      <History className="w-16 h-16 text-gray-400 mx-auto mb-4" />
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
        История анализов
      </h3>
      <p className="text-gray-600 dark:text-gray-400">
        История анализов будет добавлена в следующем обновлении
      </p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
      {/* Error Display */}
      {error && (
        <div className="fixed top-4 right-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 shadow-lg z-50 max-w-md">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-900 dark:text-red-100">
                Ошибка
              </p>
              <p className="text-sm text-red-700 dark:text-red-400 mt-1">
                {error}
              </p>
              <button
                onClick={() => setError(null)}
                className="mt-2 text-sm text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200"
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      {viewMode === 'upload' && renderUploadView()}
      {viewMode === 'analysis' && renderAnalysisView()}
      {viewMode === 'results' && renderResultsView()}
    </div>
  );
};

export default KPAnalyzerV3;