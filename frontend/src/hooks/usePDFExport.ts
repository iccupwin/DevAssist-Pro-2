/**
 * PDF Export Hook for KP Analyzer v2
 * Manages PDF generation state and provides export functionality
 */

import { useState, useCallback } from 'react';

// Types from the analysis result
interface ComprehensiveAnalysisResult {
  documentName: string;
  companyName: string;
  overallScore: number;
  aiModel: string;
  processingDuration: number;
  confidenceScore: number;
  complianceLevel: string;
  
  financials: {
    totalBudget?: {
      amount: number;
      currency: string;
      formatted: string;
    };
    currencies: Array<{
      amount: number;
      currency: string;
      formatted: string;
    }>;
  };
  
  sections: Record<string, {
    title: string;
    score: number;
    summary: string;
    details: string;
    keyPoints: string[];
    recommendations: string[];
    confidence: number;
    wordCount: number;
  }>;
  
  executiveSummary: {
    keyStrengths: string[];
    criticalWeaknesses: string[];
    recommendation: string;
  };
}

interface PDFExportState {
  isExporting: boolean;
  progress: number;
  error: string | null;
  lastExportedFile: string | null;
}

interface PDFExportOptions {
  includeExecutiveSummary?: boolean;
  includeSectionDetails?: boolean;
  includeFinancialBreakdown?: boolean;
  includeRecommendations?: boolean;
  filename?: string;
  companyInfo?: {
    name: string;
    address?: string;
    contact?: string;
  };
}

interface UsePDFExportActions {
  exportToPDF: (
    analysisResult: ComprehensiveAnalysisResult,
    options?: PDFExportOptions
  ) => Promise<void>;
  
  openPreview: (
    analysisResult: ComprehensiveAnalysisResult,
    options?: PDFExportOptions
  ) => void;
  
  generateBlob: (
    analysisResult: ComprehensiveAnalysisResult,
    options?: PDFExportOptions
  ) => Promise<Blob>;
  
  clearError: () => void;
  
  getExportHistory: () => string[];
  
  clearExportHistory: () => void;
}

// Mock PDF Export Service (replace with real implementation)
class MockPDFExportService {
  static async exportAnalysis(result: ComprehensiveAnalysisResult, options: any): Promise<Blob> {
    // Simulate PDF generation delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Create a simple text blob as a placeholder
    const content = `
KP АНАЛИЗ - ${result.documentName}
Компания: ${result.companyName}
Общий балл: ${result.overallScore}
AI Модель: ${result.aiModel}
Время обработки: ${result.processingDuration}с

ФИНАНСОВАЯ СВОДКА:
${result.financials.currencies.map(c => `- ${c.formatted}`).join('\n')}

РЕЗЮМЕ:
${result.executiveSummary.recommendation}

СИЛЬНЫЕ СТОРОНЫ:
${result.executiveSummary.keyStrengths.map(s => `- ${s}`).join('\n')}

СЛАБЫЕ СТОРОНЫ:
${result.executiveSummary.criticalWeaknesses.map(w => `- ${w}`).join('\n')}

ДЕТАЛЬНЫЕ РАЗДЕЛЫ:
${Object.entries(result.sections).map(([key, section]) => `
${section.title} (${section.score}/100):
${section.summary}

Ключевые моменты:
${section.keyPoints.map(p => `- ${p}`).join('\n')}

Рекомендации:
${section.recommendations.map(r => `- ${r}`).join('\n')}
`).join('\n')}
    `;
    
    return new Blob([content], { type: 'application/pdf' });
  }

  static async downloadPDF(result: ComprehensiveAnalysisResult, filename: string, options: any): Promise<void> {
    const blob = await this.exportAnalysis(result, options);
    
    // Create download link
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  static openPreview(result: ComprehensiveAnalysisResult, options: any): void {
    // In a real implementation, this would open a PDF preview
    alert(`Предпросмотр PDF для: ${result.documentName}\nОбщий балл: ${result.overallScore}`);
  }
}

export const usePDFExport = (): [PDFExportState, UsePDFExportActions] => {
  const [state, setState] = useState<PDFExportState>({
    isExporting: false,
    progress: 0,
    error: null,
    lastExportedFile: null
  });

  // Export to PDF with download
  const exportToPDF = useCallback(async (
    analysisResult: ComprehensiveAnalysisResult,
    options: PDFExportOptions = {}
  ) => {
    setState(prev => ({
      ...prev,
      isExporting: true,
      progress: 0,
      error: null
    }));

    try {
      // Simulate progress for better UX
      setState(prev => ({ ...prev, progress: 25 }));
      
      const filename = options.filename || generateDefaultFilename(analysisResult);
      
      setState(prev => ({ ...prev, progress: 50 }));

      // Generate PDF
      await MockPDFExportService.downloadPDF(analysisResult, filename, {
        includeExecutiveSummary: options.includeExecutiveSummary ?? true,
        includeSectionDetails: options.includeSectionDetails ?? true,
        includeFinancialBreakdown: options.includeFinancialBreakdown ?? true,
        includeRecommendations: options.includeRecommendations ?? true,
        companyInfo: options.companyInfo
      });

      setState(prev => ({ ...prev, progress: 75 }));

      // Save to history
      saveToExportHistory(filename);

      setState(prev => ({
        ...prev,
        progress: 100,
        lastExportedFile: filename,
        isExporting: false
      }));

      // Clear progress after delay
      setTimeout(() => {
        setState(prev => ({ ...prev, progress: 0 }));
      }, 2000);

    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Ошибка экспорта PDF',
        isExporting: false,
        progress: 0
      }));
    }
  }, []);

  // Open PDF preview in new window
  const openPreview = useCallback((
    analysisResult: ComprehensiveAnalysisResult,
    options: PDFExportOptions = {}
  ) => {
    try {
      MockPDFExportService.openPreview(analysisResult, {
        includeExecutiveSummary: options.includeExecutiveSummary ?? true,
        includeSectionDetails: options.includeSectionDetails ?? true,
        includeFinancialBreakdown: options.includeFinancialBreakdown ?? true,
        includeRecommendations: options.includeRecommendations ?? true,
        companyInfo: options.companyInfo
      });
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Ошибка предпросмотра PDF'
      }));
    }
  }, []);

  // Generate PDF blob without downloading
  const generateBlob = useCallback(async (
    analysisResult: ComprehensiveAnalysisResult,
    options: PDFExportOptions = {}
  ): Promise<Blob> => {
    setState(prev => ({
      ...prev,
      isExporting: true,
      error: null
    }));

    try {
      const blob = await MockPDFExportService.exportAnalysis(analysisResult, {
        includeExecutiveSummary: options.includeExecutiveSummary ?? true,
        includeSectionDetails: options.includeSectionDetails ?? true,
        includeFinancialBreakdown: options.includeFinancialBreakdown ?? true,
        includeRecommendations: options.includeRecommendations ?? true,
        companyInfo: options.companyInfo
      });

      setState(prev => ({
        ...prev,
        isExporting: false
      }));

      return blob;

    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Ошибка генерации PDF',
        isExporting: false
      }));
      throw error;
    }
  }, []);

  // Clear error state
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null, lastExportedFile: null }));
  }, []);

  // Get export history from localStorage
  const getExportHistory = useCallback((): string[] => {
    try {
      const history = localStorage.getItem('kp_analyzer_v2_pdf_history');
      return history ? JSON.parse(history) : [];
    } catch {
      return [];
    }
  }, []);

  // Clear export history
  const clearExportHistory = useCallback(() => {
    try {
      localStorage.removeItem('kp_analyzer_v2_pdf_history');
    } catch (error) {
      console.error('Failed to clear PDF export history:', error);
    }
  }, []);

  // Helper function to generate default filename
  const generateDefaultFilename = (analysisResult: ComprehensiveAnalysisResult): string => {
    const date = new Date().toISOString().split('T')[0];
    const companyName = analysisResult.companyName
      .replace(/[^a-zA-Z0-9а-яёА-ЯЁ]/g, '_')
      .substring(0, 20);
    
    return `KP_Analysis_${companyName}_${date}.pdf`;
  };

  // Helper function to save export to history
  const saveToExportHistory = (filename: string) => {
    try {
      const history = getExportHistory();
      const newHistory = [filename, ...history.filter(h => h !== filename)].slice(0, 10);
      localStorage.setItem('kp_analyzer_v2_pdf_history', JSON.stringify(newHistory));
    } catch (error) {
      console.error('Failed to save PDF export history:', error);
    }
  };

  const actions: UsePDFExportActions = {
    exportToPDF,
    openPreview,
    generateBlob,
    clearError,
    getExportHistory,
    clearExportHistory
  };

  return [state, actions];
};

export default usePDFExport;