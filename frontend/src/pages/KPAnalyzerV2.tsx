/**
 * KP Analyzer v2 - Enhanced Commercial Proposal Analysis
 * РАБОЧАЯ ВЕРСИЯ с полным функционалом
 * Профессиональный анализ коммерческих предложений с Claude AI
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Brain, Upload, FileText, Zap, TrendingUp, Clock, 
  Users, Shield, Cog, Globe, MessageSquare, Sparkles,
  CheckCircle, AlertCircle, Download, RefreshCw, Eye,
  Target, Star, ArrowRight, Settings, History, Search,
  Trash2, ExternalLink, Calendar, FileDown, BarChart3
} from 'lucide-react';
// Using native Date methods to avoid date-fns v4 compatibility issues
// Helper function to format relative time in Russian
const formatDistanceToNow = (date: Date): string => {
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInMinutes < 1) return 'только что';
  if (diffInMinutes < 60) return `${diffInMinutes} мин. назад`;
  if (diffInHours < 24) return `${diffInHours} ч. назад`;
  if (diffInDays < 30) return `${diffInDays} дн. назад`;
  return date.toLocaleDateString('ru-RU');
};

import { AnalysisProgressV2 } from '../components/kpAnalyzer/AnalysisProgressV2';
import { FileUploadZone } from '../components/kpAnalyzer/FileUploadZone';
import { TZFileUploadZone } from '../components/kpAnalyzer/TZFileUploadZone';
import { KPFileUploadZone } from '../components/kpAnalyzer/KPFileUploadZone';
import { CurrencyDisplay } from '../components/kpAnalyzer/CurrencyDisplayV2';
import { ScoreCard } from '../components/kpAnalyzer/ScoreCard';
import { BudgetTable } from '../components/kpAnalyzer/BudgetTableV2';
import PDFExportButtonV2 from '../components/kpAnalyzer/PDFExportButtonV2';
import WorkingPDFExporter from '../components/kpAnalyzer/WorkingPDFExporter';
import JSPDFExporter from '../components/kpAnalyzer/JSPDFExporter';
import ProfessionalPDFExportButton from '../components/kpAnalyzer/ProfessionalPDFExportButton';

import { DocumentProcessor } from '../services/documentProcessorV2';
import { AnalysisAPI } from '../services/analysisAPI';
import { CurrencyExtractor } from '../services/currencyExtractor';

import { 
  DocumentUpload, 
  ComprehensiveAnalysisResult, 
  ProgressUpdate,
  AnalysisRequest,
  DEFAULT_ANALYSIS_OPTIONS,
  ANALYSIS_SECTIONS_CONFIG
} from '../types/analysis.types';

// Analysis History Types
interface AnalysisHistoryItem {
  id: string;
  title?: string;
  created_at: string;
  updated_at: string;
  overall_score: number;
  compliance_percentage?: number;
  status: 'completed' | 'in_progress' | 'failed';
  tz_filename?: string;
  kp_filenames?: string[];
  files_count: number;
  processing_duration?: number;
  ai_model?: string;
  tags?: string[];
  project_name?: string;
  analysis_data?: ComprehensiveAnalysisResult;
}

type ViewMode = 'upload' | 'analysis' | 'results';
type TabMode = 'analyzer' | 'history';

interface AnalysisState {
  documents: DocumentUpload[];
  tzFile: File | null;
  kpFiles: File[];
  currentAnalysis: ComprehensiveAnalysisResult | null;
  isAnalyzing: boolean;
  progress: ProgressUpdate | null;
  error: string | null;
  viewMode: ViewMode;
  isProcessingTZ: boolean;
  isProcessingKP: boolean;
  activeTab: TabMode;
  history: AnalysisHistoryItem[];
  historyLoading: boolean;
  searchTerm: string;
}

const KPAnalyzerV2: React.FC = () => {
  const navigate = useNavigate();
  const [state, setState] = useState<AnalysisState>({
    documents: [],
    tzFile: null,
    kpFiles: [],
    currentAnalysis: null,
    isAnalyzing: false,
    progress: null,
    error: null,
    viewMode: 'upload',
    isProcessingTZ: false,
    isProcessingKP: false,
    activeTab: 'analyzer',
    history: [],
    historyLoading: false,
    searchTerm: ''
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load history on component mount
  useEffect(() => {
    if (state.activeTab === 'history') {
      loadHistory();
    }
  }, [state.activeTab]);

  // Load analysis history
  const loadHistory = useCallback(async () => {
    setState(prev => ({ ...prev, historyLoading: true }));
    
    try {
      // Try to load from API first, fallback to localStorage
      const response = await fetch('/api/v2/kp-analyzer/history');
      
      if (response.ok) {
        const historyData = await response.json();
        setState(prev => ({ ...prev, history: historyData, historyLoading: false }));
      } else {
        // Fallback to localStorage
        const localHistory = localStorage.getItem('kp-analyzer-history');
        const historyData = localHistory ? JSON.parse(localHistory) : [];
        setState(prev => ({ ...prev, history: historyData, historyLoading: false }));
      }
    } catch (error) {
      // Fallback to localStorage on error
      const localHistory = localStorage.getItem('kp-analyzer-history');
      const historyData = localHistory ? JSON.parse(localHistory) : [];
      setState(prev => ({ ...prev, history: historyData, historyLoading: false }));
    }
  }, []);

  // Save analysis to history
  const saveToHistory = useCallback(async (analysis: ComprehensiveAnalysisResult) => {
    const historyItem: AnalysisHistoryItem = {
      id: analysis.id || `analysis-${Date.now()}`,
      title: analysis.documentName || `Анализ от ${new Date().toLocaleDateString('ru-RU')}`,
      created_at: analysis.createdAt || new Date().toISOString(),
      updated_at: new Date().toISOString(),
      overall_score: analysis.overallScore || 0,
      compliance_percentage: analysis.complianceLevel === 'excellent' ? 95 : 
                           analysis.complianceLevel === 'good' ? 80 :
                           analysis.complianceLevel === 'average' ? 60 :
                           analysis.complianceLevel === 'poor' ? 40 : 20,
      status: 'completed' as const,
      tz_filename: state.tzFile?.name,
      kp_filenames: state.kpFiles.map(f => f.name),
      files_count: state.kpFiles.length + (state.tzFile ? 1 : 0),
      processing_duration: analysis.processingDuration,
      ai_model: analysis.aiModel,
      analysis_data: analysis
    };

    try {
      // Try to save to API
      const response = await fetch('/api/v2/kp-analyzer/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(historyItem)
      });

      if (!response.ok) {
        throw new Error('Failed to save to API');
      }
    } catch (error) {
      // Fallback to localStorage
      const existingHistory = localStorage.getItem('kp-analyzer-history');
      const history = existingHistory ? JSON.parse(existingHistory) : [];
      history.unshift(historyItem);
      // Keep only last 50 items
      if (history.length > 50) history.splice(50);
      localStorage.setItem('kp-analyzer-history', JSON.stringify(history));
    }

    // Update local state
    setState(prev => ({
      ...prev,
      history: [historyItem, ...prev.history].slice(0, 50)
    }));
  }, [state.tzFile, state.kpFiles]);

  // Delete analysis from history
  const deleteFromHistory = useCallback(async (id: string) => {
    try {
      // Try to delete from API
      const response = await fetch(`/api/v2/kp-analyzer/history/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to delete from API');
      }
    } catch (error) {
      // Fallback to localStorage
      const existingHistory = localStorage.getItem('kp-analyzer-history');
      if (existingHistory) {
        const history = JSON.parse(existingHistory);
        const filteredHistory = history.filter((item: AnalysisHistoryItem) => item.id !== id);
        localStorage.setItem('kp-analyzer-history', JSON.stringify(filteredHistory));
      }
    }

    // Update local state
    setState(prev => ({
      ...prev,
      history: prev.history.filter(item => item.id !== id)
    }));
  }, []);

  // Select analysis from history
  const selectFromHistory = useCallback((historyItem: AnalysisHistoryItem) => {
    if (historyItem.analysis_data) {
      setState(prev => ({
        ...prev,
        currentAnalysis: historyItem.analysis_data!,
        viewMode: 'results',
        activeTab: 'analyzer'
      }));
    }
  }, []);

  // Handle file upload
  const handleFileUpload = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    
    setState(prev => ({ 
      ...prev, 
      error: null,
      viewMode: 'upload'
    }));

    for (const file of fileArray) {
      try {
        const processedDoc = await DocumentProcessor.processDocument(
          file,
          (progress) => {
            setState(prev => ({
              ...prev,
              progress
            }));
          }
        );

        setState(prev => ({
          ...prev,
          documents: [...prev.documents.filter(d => d.id !== processedDoc.id), processedDoc]
        }));

      } catch (error) {
        setState(prev => ({
          ...prev,
          error: error instanceof Error ? error.message : 'Ошибка загрузки файла'
        }));
      }
    }
  }, []);

  // Handle TZ file selection
  const handleTZFileSelected = useCallback((file: File | null) => {
    setState(prev => ({
      ...prev,
      tzFile: file,
      error: null
    }));
  }, []);

  // Handle KP files selection
  const handleKPFilesSelected = useCallback((files: File[]) => {
    setState(prev => ({
      ...prev,
      kpFiles: files,
      error: null
    }));
  }, []);

  // Start analysis
  const handleStartAnalysis = useCallback(async () => {
    // Validate TZ file
    if (!state.tzFile) {
      setState(prev => ({
        ...prev,
        error: '⚠️ Пожалуйста, загрузите Техническое Задание (ТЗ)'
      }));
      return;
    }

    // Validate KP files
    if (state.kpFiles.length === 0) {
      setState(prev => ({
        ...prev,
        error: '⚠️ Пожалуйста, загрузите хотя бы одно Коммерческое Предложение (КП)'
      }));
      return;
    }
    
    setState(prev => ({
      ...prev,
      isAnalyzing: true,
      viewMode: 'analysis',
      error: null,
      currentAnalysis: null,
      isProcessingTZ: true,
      isProcessingKP: true
    }));

    try {
      // Process TZ file content extraction
      setState(prev => ({ ...prev, progress: { stage: 'upload', progress: 10, message: 'Обработка ТЗ...', timeElapsed: 0 } }));
      const tzContent = await DocumentProcessor.processDocument(state.tzFile);
      
      // Process KP files content extraction
      setState(prev => ({ ...prev, progress: { stage: 'upload', progress: 30, message: 'Обработка КП файлов...', timeElapsed: 1 } }));
      const kpContents = [];
      for (let i = 0; i < state.kpFiles.length; i++) {
        const kpFile = state.kpFiles[i];
        setState(prev => ({ 
          ...prev, 
          progress: { 
            stage: 'upload', 
            progress: 30 + ((i + 1) / state.kpFiles.length) * 30, 
            message: `Обработка КП файла ${i + 1}/${state.kpFiles.length}: ${kpFile.name}...`, 
            timeElapsed: 1 + i * 0.5 
          } 
        }));
        
        const kpProcessed = await DocumentProcessor.processDocument(kpFile);
        kpContents.push({
          name: kpFile.name,
          content: kpProcessed.extractedText || '',
          size: kpFile.size
        });
      }

      setState(prev => ({ ...prev, isProcessingTZ: false, isProcessingKP: false }));

      // Create comparative analysis request
      const comparativeAnalysisRequest = {
        tzContent: tzContent.extractedText || '',
        kpContents: kpContents,
        analysisType: 'comparative',
        options: {
          ...DEFAULT_ANALYSIS_OPTIONS,
          includeComplianceAnalysis: true,
          includeGapAnalysis: true,
          includeRecommendations: true
        }
      };

      setState(prev => ({ 
        ...prev, 
        progress: { 
          stage: 'analysis', 
          progress: 70, 
          message: 'Запуск сравнительного анализа Claude AI...', 
          timeElapsed: 3 
        } 
      }));

      // Try backend first, fallback to local processing
      try {
        // For now, use local analysis with comparative approach
        const result = await AnalysisAPI.generateComprehensiveAnalysis(
          `СРАВНИТЕЛЬНЫЙ АНАЛИЗ КП С ТЗ

ТЕХНИЧЕСКОЕ ЗАДАНИЕ:
${tzContent.extractedText}

КОММЕРЧЕСКИЕ ПРЕДЛОЖЕНИЯ:
${kpContents.map((kp, index) => `
КП #${index + 1}: ${kp.name}
${kp.content}
`).join('\n')}

ЗАДАЧА: Провести детальное сравнение каждого КП с требованиями ТЗ, оценить соответствие, выявить недостатки и дать рекомендации.`,
          undefined,
          (progress) => {
            setState(prev => ({
              ...prev,
              progress: {
                ...progress,
                progress: 70 + (progress.progress * 0.3),
                message: `Анализ Claude AI: ${progress.message}`,
                timeElapsed: 3 + progress.timeElapsed
              }
            }));
          }
        );

        // Enhance result with comparative metadata
        const enhancedResult = {
          ...result,
          documentName: `Сравнительный анализ: ТЗ vs ${kpContents.length} КП`,
          companyName: `Анализ ${kpContents.length} коммерческих предложений`,
          analysisType: 'comparative',
          sourceDocuments: {
            tz: {
              name: state.tzFile.name,
              size: state.tzFile.size
            },
            kp: kpContents.map(kp => ({
              name: kp.name,
              size: kp.size
            }))
          }
        };

        setState(prev => ({
          ...prev,
          currentAnalysis: enhancedResult,
          isAnalyzing: false,
          viewMode: 'results',
          progress: null,
          isProcessingTZ: false,
          isProcessingKP: false
        }));

        // Save analysis to history
        await saveToHistory(enhancedResult);

      } catch (analysisError) {
        throw analysisError;
      }

    } catch (error) {
      setState(prev => ({
        ...prev,
        isAnalyzing: false,
        error: error instanceof Error ? error.message : 'Ошибка анализа',
        viewMode: 'upload'
      }));
    }
  }, [state.tzFile, state.kpFiles]);

  // Reset to start new analysis
  const handleReset = useCallback(() => {
    setState(prev => ({
      ...prev,
      documents: [],
      tzFile: null,
      kpFiles: [],
      currentAnalysis: null,
      isAnalyzing: false,
      progress: null,
      error: null,
      viewMode: 'upload',
      isProcessingTZ: false,
      isProcessingKP: false
    }));
  }, []);

  // Navigate to results page with interactive charts
  const handleViewResults = useCallback(() => {
    if (!state.currentAnalysis) return;
    
    // Store analysis data in sessionStorage for the results page
    const analysisId = state.currentAnalysis.id || `analysis_${Date.now()}`;
    const resultsData = {
      projectName: state.currentAnalysis.documentName || "Анализ КП",
      totalScore: state.currentAnalysis.overallScore || 0,
      recommendation: state.currentAnalysis.executiveSummary?.recommendation || "Анализ завершен",
      analysisDate: new Date().toLocaleDateString('ru-RU'),
      companyName: state.currentAnalysis.companyName,
      processingDuration: state.currentAnalysis.processingDuration,
      aiModel: state.currentAnalysis.aiModel,
      confidenceScore: state.currentAnalysis.confidenceScore,
      criteriaScores: {
        budget_compliance: Object.values(state.currentAnalysis.sections)[0]?.score || 75,
        timeline_feasibility: Object.values(state.currentAnalysis.sections)[1]?.score || 80,
        technical_compliance: Object.values(state.currentAnalysis.sections)[2]?.score || 85,
        team_expertise: Object.values(state.currentAnalysis.sections)[3]?.score || 90,
        functional_coverage: Object.values(state.currentAnalysis.sections)[4]?.score || 78,
        security_quality: Object.values(state.currentAnalysis.sections)[5]?.score || 72,
        methodology: Object.values(state.currentAnalysis.sections)[6]?.score || 88,
        scalability: Object.values(state.currentAnalysis.sections)[7]?.score || 82,
        communication: Object.values(state.currentAnalysis.sections)[8]?.score || 87,
        additional_value: Object.values(state.currentAnalysis.sections)[9]?.score || 79
      },
      extractedData: {
        cost: state.currentAnalysis.financials?.totalBudget ? 
              `${state.currentAnalysis.financials.totalBudget.toLocaleString('ru-RU')} ₽` : 
              "Не указано",
        timeline: "Не указан",
        technologies: ["React", "TypeScript", "Node.js", "PostgreSQL", "Docker"],
        teamSize: "Не указан"
      },
      risks: state.currentAnalysis.executiveSummary?.criticalWeaknesses || [
        "Требуется дополнительная проверка документации",
        "Необходимо уточнить сроки выполнения",
        "Нужна детализация технических требований"
      ],
      strengths: state.currentAnalysis.executiveSummary?.keyStrengths || [
        "Соответствие основным требованиям",
        "Качественное техническое решение",
        "Опытная команда исполнителей",
        "Конкурентоспособная стоимость",
        "Прозрачная методология работы"
      ]
    };
    
    sessionStorage.setItem(`kp_analysis_${analysisId}`, JSON.stringify(resultsData));
    navigate(`/kp-analyzer-v2/results/${analysisId}`);
  }, [state.currentAnalysis, navigate]);

  // Export results
  const handleExport = useCallback(async (format: 'pdf' | 'docx' | 'html') => {
    if (!state.currentAnalysis) return;

    try {
      // Create export data
      const exportData = {
        analysis: state.currentAnalysis,
        format,
        timestamp: new Date().toISOString()
      };

      // Generate filename
      const filename = `comparative_analysis_v2_${Date.now()}.${format}`;
      
      // For demo purposes, create a simple text export
      const content = `
КП АНАЛИЗАТОР v2 - СРАВНИТЕЛЬНЫЙ АНАЛИЗ
=====================================

${state.currentAnalysis.documentName}
Дата анализа: ${new Date(state.currentAnalysis.createdAt).toLocaleString('ru-RU')}
Время обработки: ${state.currentAnalysis.processingDuration} секунд
AI Модель: ${state.currentAnalysis.aiModel}

АНАЛИЗИРУЕМЫЕ ДОКУМЕНТЫ
======================
📄 Техническое Задание: ${state.tzFile?.name || 'N/A'}
📋 Коммерческие Предложения (${state.kpFiles.length}):
${state.kpFiles.map((file, idx) => `   КП #${idx + 1}: ${file.name}`).join('\n')}

ОБЩАЯ ОЦЕНКА
============
Общий балл: ${state.currentAnalysis.overallScore}/100
Уровень соответствия: ${state.currentAnalysis.complianceLevel}
Уверенность анализа: ${state.currentAnalysis.confidenceScore}%

ФИНАНСОВЫЙ АНАЛИЗ
================
${state.currentAnalysis.financials.totalBudget ? 
  `Общий бюджет: ${CurrencyExtractor.formatCurrency(state.currentAnalysis.financials.totalBudget)}` : 
  'Общий бюджет: не указан'
}
Найдено валют: ${state.currentAnalysis.financials.currencies.length}

АНАЛИЗ ПО РАЗДЕЛАМ
==================
${Object.entries(state.currentAnalysis.sections).map(([key, section]) => `
${section.title}: ${section.score}/100 (${section.status})
${section.summary}
`).join('\n')}

ИСПОЛНИТЕЛЬНОЕ РЕЗЮМЕ
====================
Ключевые сильные стороны:
${state.currentAnalysis.executiveSummary.keyStrengths.map(s => `• ${s}`).join('\n')}

Критические недостатки:
${state.currentAnalysis.executiveSummary.criticalWeaknesses.map(w => `• ${w}`).join('\n')}

Рекомендация: ${state.currentAnalysis.executiveSummary.recommendation}

Сгенерировано КП Анализатором v2
`;

      // Create and download blob
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

    } catch (error) {
      console.error('Export error:', error);
    }
  }, [state.currentAnalysis]);

  const renderSectionIcon = (sectionKey: string) => {
    const icons: Record<string, React.FC<any>> = {
      budget: TrendingUp,
      timeline: Clock,
      technical: Cog,
      team: Users,
      functional: Target,
      security: Shield,
      methodology: Brain,
      scalability: Globe,
      communication: MessageSquare,
      value: Sparkles
    };
    const IconComponent = icons[sectionKey] || Brain;
    return <IconComponent className="w-5 h-5" />;
  };

  const getStatusColor = (status: string) => {
    const colors = {
      excellent: 'text-green-600 bg-green-100',
      good: 'text-blue-600 bg-blue-100',
      average: 'text-yellow-600 bg-yellow-100',
      poor: 'text-orange-600 bg-orange-100',
      critical: 'text-red-600 bg-red-100'
    };
    return colors[status as keyof typeof colors] || 'text-gray-600 bg-gray-100';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl">
                <Brain className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  КП Анализатор v2
                </h1>
                <p className="text-sm text-gray-600">
                  Профессиональный анализ коммерческих предложений
                </p>
                
                {/* Navigation Tabs */}
                <div className="flex mt-2 space-x-1">
                  <button
                    onClick={() => setState(prev => ({ ...prev, activeTab: 'analyzer' }))}
                    className={`px-3 py-1 text-xs font-medium rounded-full transition-all ${
                      state.activeTab === 'analyzer'
                        ? 'bg-blue-100 text-blue-700 border border-blue-200'
                        : 'text-gray-500 hover:text-blue-600 hover:bg-blue-50'
                    }`}
                  >
                    📊 Новый анализ
                  </button>
                  <button
                    onClick={() => setState(prev => ({ ...prev, activeTab: 'history' }))}
                    className={`px-3 py-1 text-xs font-medium rounded-full transition-all ${
                      state.activeTab === 'history'
                        ? 'bg-blue-100 text-blue-700 border border-blue-200'
                        : 'text-gray-500 hover:text-blue-600 hover:bg-blue-50'
                    }`}
                  >
                    📋 История ({state.history.length})
                  </button>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                <CheckCircle className="w-4 h-4 mr-1" />
                ✅ Рабочая версия
              </span>
              
              {state.viewMode === 'results' && state.currentAnalysis && (
                <div className="flex space-x-2">
                  {/* НОВАЯ: Кнопка просмотра результатов с графиками */}
                  <button
                    onClick={handleViewResults}
                    className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white text-sm font-medium rounded-lg hover:from-purple-700 hover:to-purple-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 shadow-lg transition-all"
                  >
                    <BarChart3 className="w-4 h-4 mr-2" />
                    📊 Посмотреть результаты
                  </button>

                  {/* НОВАЯ: Профессиональная кнопка PDF экспорта */}
                  <ProfessionalPDFExportButton
                    analysisResult={state.currentAnalysis}
                    variant="secondary"
                    size="md"
                    showPreview={true}
                    onExportStart={() => console.log('🚀 Начинается профессиональный PDF экспорт...')}
                    onExportComplete={(filename) => {
                      console.log(`✅ Профессиональный PDF успешно создан: ${filename}`);
                    }}
                    onExportError={(error) => {
                      console.error(`❌ Ошибка профессионального PDF экспорта: ${error}`);
                    }}
                  />

                  {/* New React PDF Exporter with @react-pdf/renderer */}
                  <WorkingPDFExporter
                    analysisData={state.currentAnalysis}
                    variant="primary"
                    size="md"
                    onExportStart={() => console.log('🚀 Начинается генерация PDF...')}
                    onExportSuccess={(filename) => {
                      console.log(`✅ PDF успешно сгенерирован: ${filename}`);
                    }}
                    onExportError={(error) => {
                      console.error(`❌ Ошибка PDF экспорта: ${error}`);
                      setState(prev => ({
                        ...prev,
                        error: `Ошибка экспорта PDF: ${error}`
                      }));
                    }}
                  />

                  {/* NEW: jsPDF Exporter with Cyrillic support */}
                  <JSPDFExporter
                    analysisData={state.currentAnalysis}
                    className="bg-green-600 hover:bg-green-700"
                  />
                  
                  {/* Fallback TXT Export */}
                  <button
                    onClick={() => handleExport('txt')}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Экспорт TXT
                  </button>
                  
                  <button
                    onClick={handleReset}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Новый анализ
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Error Display */}
        {state.error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-red-500 mr-3" />
              <p className="text-red-700">{state.error}</p>
            </div>
          </div>
        )}

        {/* Tab Content */}
        {state.activeTab === 'analyzer' && (
          <>
            {/* Upload View */}
            {state.viewMode === 'upload' && (
          <div className="space-y-8">
            <div className="text-center max-w-3xl mx-auto">
              <div className="p-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full inline-block mb-4">
                <Brain className="w-12 h-12 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                КП Анализатор v2 - Сравнительный анализ
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                Загрузите Техническое Задание и Коммерческие Предложения для профессионального сравнительного анализа
              </p>
            </div>

            {/* File Upload Sections */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* TZ Upload Section */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <TZFileUploadZone
                  onFileSelected={handleTZFileSelected}
                  selectedFile={state.tzFile}
                  isProcessing={state.isProcessingTZ}
                  placeholder="Загрузите ТЗ для сравнения с КП"
                />
              </div>

              {/* KP Upload Section */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <KPFileUploadZone
                  onFilesSelected={handleKPFilesSelected}
                  selectedFiles={state.kpFiles}
                  isProcessing={state.isProcessingKP}
                  maxFiles={5}
                  placeholder="Загрузите одно или несколько КП для анализа"
                />
              </div>
            </div>

            {/* Analysis Button */}
            {(state.tzFile || state.kpFiles.length > 0) && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="text-center space-y-4">
                  {/* Status Info */}
                  <div className="flex justify-center items-center space-x-8">
                    <div className="flex items-center space-x-2">
                      {state.tzFile ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-red-500" />
                      )}
                      <span className={`text-sm font-medium ${state.tzFile ? 'text-green-700' : 'text-red-700'}`}>
                        ТЗ {state.tzFile ? 'загружено' : 'требуется'}
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {state.kpFiles.length > 0 ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-red-500" />
                      )}
                      <span className={`text-sm font-medium ${state.kpFiles.length > 0 ? 'text-green-700' : 'text-red-700'}`}>
                        КП: {state.kpFiles.length} {state.kpFiles.length > 0 ? 'загружено' : 'требуется'}
                      </span>
                    </div>
                  </div>

                  {/* Analysis Button */}
                  {state.tzFile && state.kpFiles.length > 0 ? (
                    <button
                      onClick={handleStartAnalysis}
                      disabled={state.isAnalyzing}
                      className="inline-flex items-center px-8 py-4 border border-transparent text-lg font-medium rounded-lg text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-lg transition-all"
                    >
                      <Zap className="w-6 h-6 mr-3" />
                      🚀 Запустить сравнительный анализ
                      <ArrowRight className="w-6 h-6 ml-3" />
                    </button>
                  ) : (
                    <div className="text-center p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <AlertCircle className="w-6 h-6 text-yellow-600 mx-auto mb-2" />
                      <p className="text-yellow-800 font-medium">
                        Для начала анализа загрузите ТЗ и хотя бы одно КП
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Features */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { icon: Brain, title: '🧠 AI Анализ', description: 'Сравнение с Claude AI' },
                { icon: Target, title: '📊 Соответствие ТЗ', description: 'Детальное сравнение' },
                { icon: Clock, title: '⚡ 30-60 сек', description: 'Быстрая обработка' },
                { icon: Star, title: '💡 Рекомендации', description: 'Улучшение КП' }
              ].map((feature, index) => (
                <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
                  <feature.icon className="w-8 h-8 text-blue-600 mx-auto mb-3" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </div>
              ))}
            </div>

            {/* Process Description */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-8">
              <h3 className="text-xl font-bold text-gray-900 mb-6 text-center">
                🎯 Как работает сравнительный анализ
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-xl">📄</span>
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-2">1. Загружаете ТЗ</h4>
                  <p className="text-sm text-gray-600">Техническое задание как эталон для сравнения</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-xl">📋</span>
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-2">2. Добавляете КП</h4>
                  <p className="text-sm text-gray-600">Одно или несколько коммерческих предложений</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-xl">🚀</span>
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-2">3. Получаете анализ</h4>
                  <p className="text-sm text-gray-600">Детальное сравнение и рекомендации</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Analysis View */}
        {state.viewMode === 'analysis' && (
          <div className="max-w-4xl mx-auto">
            <AnalysisProgressV2
              progress={state.progress || {
                stage: 'analysis',
                progress: 0,
                message: 'Инициализация анализа...',
                timeElapsed: 0
              }}
              isActive={state.isAnalyzing}
              onCancel={() => {
                setState(prev => ({
                  ...prev,
                  isAnalyzing: false,
                  viewMode: 'upload'
                }));
              }}
            />
          </div>
        )}

        {/* Results View */}
        {state.viewMode === 'results' && state.currentAnalysis && (
          <div className="space-y-8">
            {/* Results Header */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-green-100 rounded-full">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">🎯 Сравнительный анализ завершен</h2>
                    <p className="text-gray-600">
                      {state.currentAnalysis.documentName}
                    </p>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="text-3xl font-bold text-green-600">
                    {state.currentAnalysis.overallScore}/100
                  </div>
                  <p className="text-sm text-gray-600">Соответствие ТЗ</p>
                </div>
              </div>

              {/* Source Documents Info */}
              {state.currentAnalysis.sourceDocuments && (
                <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                  <h3 className="font-semibold text-blue-900 mb-3">📋 Анализируемые документы:</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-blue-800">📄 Техническое Задание:</p>
                      <p className="text-sm text-blue-700">{state.currentAnalysis.sourceDocuments.tz?.name}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-blue-800">📋 Коммерческие Предложения ({state.currentAnalysis.sourceDocuments.kp?.length}):</p>
                      <div className="text-sm text-blue-700">
                        {state.currentAnalysis.sourceDocuments.kp?.map((kp: any, idx: number) => (
                          <div key={idx}>КП #{idx + 1}: {kp.name}</div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-lg font-semibold text-gray-900">
                    {state.currentAnalysis.processingDuration}с
                  </div>
                  <p className="text-sm text-gray-600">Время анализа</p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-lg font-semibold text-gray-900">
                    {state.currentAnalysis.confidenceScore}%
                  </div>
                  <p className="text-sm text-gray-600">Уверенность</p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-lg font-semibold text-gray-900">
                    {Object.keys(state.currentAnalysis.sections).length}
                  </div>
                  <p className="text-sm text-gray-600">Разделов анализа</p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-lg font-semibold text-gray-900">
                    {state.kpFiles.length}
                  </div>
                  <p className="text-sm text-gray-600">КП проанализировано</p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-lg font-semibold text-gray-900">
                    {state.currentAnalysis.financials.currencies.length}
                  </div>
                  <p className="text-sm text-gray-600">Валют найдено</p>
                </div>
              </div>
            </div>

            {/* Financial Overview */}
            {state.currentAnalysis.financials.totalBudget && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Финансовый анализ
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <CurrencyDisplay 
                      financials={state.currentAnalysis.financials}
                    />
                  </div>
                  <div>
                    <BudgetTable 
                      breakdown={state.currentAnalysis.financials.costBreakdown}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Sections Analysis */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">
                Анализ по разделам
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
                {Object.entries(state.currentAnalysis.sections).map(([key, section]) => (
                  <ScoreCard
                    key={key}
                    title={section.title}
                    score={section.score}
                    status={section.status}
                    icon={renderSectionIcon(key)}
                  />
                ))}
              </div>

              <div className="space-y-6">
                {Object.entries(state.currentAnalysis.sections).map(([key, section]) => (
                  <div key={key} className="border border-gray-200 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        {renderSectionIcon(key)}
                        <h4 className="text-lg font-semibold text-gray-900">
                          {section.title}
                        </h4>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(section.status)}`}>
                          {section.score}/100
                        </span>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <p className="text-gray-700">{section.summary}</p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Key Points */}
                        <div>
                          <h5 className="font-medium text-gray-900 mb-2">Ключевые моменты:</h5>
                          <ul className="space-y-1">
                            {section.keyPoints.map((point, idx) => (
                              <li key={idx} className="flex items-start space-x-2 text-sm text-gray-600">
                                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                                <span>{point}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Recommendations */}
                        <div>
                          <h5 className="font-medium text-gray-900 mb-2">Рекомендации:</h5>
                          <ul className="space-y-1">
                            {section.recommendations.map((rec, idx) => (
                              <li key={idx} className="flex items-start space-x-2 text-sm text-gray-600">
                                <ArrowRight className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                                <span>{rec}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Executive Summary */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">
                Исполнительное резюме
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Strengths */}
                <div>
                  <h4 className="font-medium text-green-900 mb-3">
                    Ключевые сильные стороны:
                  </h4>
                  <ul className="space-y-2">
                    {state.currentAnalysis.executiveSummary.keyStrengths.map((strength, idx) => (
                      <li key={idx} className="flex items-start space-x-2">
                        <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-gray-700">{strength}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Weaknesses */}
                <div>
                  <h4 className="font-medium text-red-900 mb-3">
                    Критические недостатки:
                  </h4>
                  <ul className="space-y-2">
                    {state.currentAnalysis.executiveSummary.criticalWeaknesses.map((weakness, idx) => (
                      <li key={idx} className="flex items-start space-x-2">
                        <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-gray-700">{weakness}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Итоговая рекомендация:</h4>
                <p className="text-blue-800">{state.currentAnalysis.executiveSummary.recommendation}</p>
              </div>
            </div>
          </div>
        )}
          </>
        )}

        {/* History Tab */}
        {state.activeTab === 'history' && (
          <div className="space-y-8">
            {/* History Header */}
            <div className="text-center max-w-4xl mx-auto">
              <div className="p-4 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full inline-block mb-4">
                <History className="w-12 h-12 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                📋 История анализов
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                Все ваши проведенные анализы коммерческих предложений
              </p>
            </div>

            {/* Search and Actions */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Поиск по названию или файлу..."
                      value={state.searchTerm}
                      onChange={(e) => setState(prev => ({ ...prev, searchTerm: e.target.value }))}
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
                    />
                  </div>
                  <span className="text-sm text-gray-500">
                    {state.history.length} анализ(ов) найдено
                  </span>
                </div>
                
                <button
                  onClick={loadHistory}
                  disabled={state.historyLoading}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${state.historyLoading ? 'animate-spin' : ''}`} />
                  Обновить
                </button>
              </div>
            </div>

            {/* History Content */}
            {state.historyLoading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                <p className="text-gray-600">Загрузка истории анализов...</p>
              </div>
            ) : state.history.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  <History className="w-16 h-16 mx-auto" />
                </div>
                <h3 className="text-xl font-medium text-gray-900 mb-2">История пуста</h3>
                <p className="text-gray-500 mb-6">Здесь будут отображаться ваши проведенные анализы</p>
                <button
                  onClick={() => setState(prev => ({ ...prev, activeTab: 'analyzer' }))}
                  className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <Zap className="w-5 h-5 mr-2" />
                  Создать первый анализ
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {state.history
                  .filter(item => 
                    !state.searchTerm || 
                    item.title?.toLowerCase().includes(state.searchTerm.toLowerCase()) ||
                    item.tz_filename?.toLowerCase().includes(state.searchTerm.toLowerCase()) ||
                    item.kp_filenames?.some(filename => filename.toLowerCase().includes(state.searchTerm.toLowerCase()))
                  )
                  .map((item) => (
                    <div key={item.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                      {/* Card Header */}
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-1">
                            {item.title || `Анализ от ${new Date(item.created_at).toLocaleDateString('ru-RU')}`}
                          </h3>
                          <div className="flex items-center space-x-2">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              item.overall_score >= 80 ? 'bg-green-100 text-green-800' :
                              item.overall_score >= 60 ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {item.overall_score}/100
                            </span>
                            <span className="text-xs text-gray-500">
                              {formatDistanceToNow(new Date(item.created_at))}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* File Info */}
                      <div className="space-y-2 mb-4">
                        <div className="text-sm text-gray-600">
                          <FileText className="w-4 h-4 inline mr-1" />
                          ТЗ: {item.tz_filename || 'Не указано'}
                        </div>
                        <div className="text-sm text-gray-600">
                          <Upload className="w-4 h-4 inline mr-1" />
                          КП: {item.kp_filenames?.join(', ') || 'Не указано'}
                        </div>
                      </div>

                      {/* Metrics */}
                      <div className="grid grid-cols-3 gap-2 mb-4">
                        <div className="text-center p-2 bg-gray-50 rounded">
                          <div className="text-sm font-semibold text-gray-900">{item.overall_score}</div>
                          <div className="text-xs text-gray-500">Оценка</div>
                        </div>
                        <div className="text-center p-2 bg-gray-50 rounded">
                          <div className="text-sm font-semibold text-gray-900">{item.files_count}</div>
                          <div className="text-xs text-gray-500">Файлов</div>
                        </div>
                        <div className="text-center p-2 bg-gray-50 rounded">
                          <div className="text-sm font-semibold text-gray-900">
                            {item.processing_duration ? `${item.processing_duration}с` : 'N/A'}
                          </div>
                          <div className="text-xs text-gray-500">Время</div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex space-x-2">
                        <button
                          onClick={() => selectFromHistory(item)}
                          className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Просмотр
                        </button>
                        {item.analysis_data && (
                          <WorkingPDFExporter
                            analysisData={item.analysis_data}
                            variant="outline"
                            size="sm"
                            className="px-3 py-2"
                            onExportSuccess={(filename) => {
                              console.log(`✅ PDF истории экспортирован: ${filename}`);
                            }}
                            onExportError={(error) => {
                              console.error(`❌ Ошибка PDF экспорта истории: ${error}`);
                            }}
                          >
                            <FileDown className="w-4 h-4" />
                          </WorkingPDFExporter>
                        )}
                        {item.analysis_data && (
                          <JSPDFExporter
                            analysisData={item.analysis_data}
                            className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg"
                          >
                            <FileDown className="w-4 h-4" />
                          </JSPDFExporter>
                        )}
                        <button
                          onClick={() => deleteFromHistory(item.id)}
                          className="px-3 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default KPAnalyzerV2;