/**
 * Report Service - Generate comprehensive analysis reports
 * Based on the tender folder's report generation functionality
 */

import { kpAnalysisService, ModelId } from './ai';
import { KPAnalysisResult } from '../types/kpAnalyzer';
import { apiClient } from './apiClient';
import { 
  getComplianceScore, 
  getCompanyName, 
  getFileName, 
  getAnalysis,
  getExtractedData
} from '../utils/kpAnalyzerUtils';

export interface ReportSection {
  id: string;
  title: string;
  content: string;
  type: 'text' | 'list' | 'table' | 'chart';
  data?: any;
}

export interface ComprehensiveReport {
  id: string;
  title: string;
  created_at: string;
  tz_name: string;
  analysis_results: KPAnalysisResult[];
  sections: ReportSection[];
  executive_summary: string;
  recommendations: string[];
  total_score: number;
  best_proposal: KPAnalysisResult | null;
}

export interface VisualizationData {
  prices: { name: string; value: number; formatted: string }[];
  timelines: { name: string; days: number; formatted: string }[];
  compliance: { name: string; score: number }[];
  ratings: { name: string; compliance: number; technical: number; commercial: number; experience: number }[];
  risks: { name: string; level: 'low' | 'medium' | 'high'; score: number }[];
}

class ReportService {
  private baseUrl = '/api/v1/reports';

  /**
   * Generate comprehensive analytical report based on analysis results
   */
  async generateComprehensiveReport(
    tzName: string,
    analysisResults: KPAnalysisResult[],
    modelId?: ModelId
  ): Promise<ComprehensiveReport> {
    const reportId = Date.now().toString();
    const created_at = new Date().toISOString();

    try {
      // 1. Executive Summary
      const executiveSummary = await this.generateExecutiveSummary(analysisResults, modelId);
      
      // 2. Generate all report sections
      const sections = await this.generateReportSections(tzName, analysisResults, modelId);
      
      // 3. Generate consolidated recommendations
      const recommendations = await this.generateConsolidatedRecommendations(analysisResults, modelId);
      
      // 4. Calculate total score and find best proposal
      const totalScore = this.calculateAverageScore(analysisResults);
      const bestProposal = this.findBestProposal(analysisResults);

      return {
        id: reportId,
        title: `Отчет по анализу КП для "${tzName}"`,
        created_at,
        tz_name: tzName,
        analysis_results: analysisResults,
        sections,
        executive_summary: executiveSummary,
        recommendations,
        total_score: totalScore,
        best_proposal: bestProposal
      };

    } catch (error) {
      console.error('Error generating comprehensive report:', error);
      throw new Error('Не удалось сгенерировать отчет');
    }
  }

  /**
   * Generate executive summary using AI
   */
  private async generateExecutiveSummary(
    analysisResults: KPAnalysisResult[],
    modelId?: ModelId
  ): Promise<string> {
    const systemPrompt = `Ты — эксперт-аналитик, создающий краткое резюме по результатам анализа коммерческих предложений. 
Создай профессиональное резюме в 2-3 абзацах, которое включает:
1. Общую оценку качества предложений
2. Ключевые выводы и находки
3. Рекомендацию по выбору лучшего предложения

Ответь только текстом резюме на русском языке, без заголовков и форматирования.`;

    const analysisData = analysisResults.map(result => {
      const score = getComplianceScore(result);
      const analysis = getAnalysis(result);
      
      return {
        name: getFileName(result),
        score: score,
        rating: score >= 80 ? 'high' : score >= 60 ? 'medium' : 'low',
        compliance: analysis.compliance,
        technical: analysis.technical,
        commercial: analysis.commercial,
        details: analysis.detailedAnalysis
      };
    });

    const prompt = `Создай краткое резюме по результатам анализа ${analysisResults.length} коммерческих предложений:

${analysisData.map((data, index) => `
${index + 1}. ${data.name}
   - Общий балл: ${data.score}%
   - Рейтинг: ${data.rating}
   - Соответствие: ${data.compliance}%
   - Техническая часть: ${data.technical}%
   - Коммерческая часть: ${data.commercial}%
   - Детали: ${data.details}
`).join('')}

Средний балл всех предложений: ${Math.round(analysisResults.reduce((sum, r) => sum + getComplianceScore(r), 0) / analysisResults.length)}%`;

    try {
      const response = await apiClient.post('/api/v1/llm/analyze', {
        prompt,
        system_prompt: systemPrompt,
        model_id: modelId || 'gpt-4o',
        temperature: 0.3,
        max_tokens: 1000
      });

      return (response.data as any).response.trim();
    } catch (error) {
      console.error('Error generating executive summary:', error);
      return 'Не удалось сгенерировать краткое резюме анализа.';
    }
  }

  /**
   * Generate all report sections
   */
  private async generateReportSections(
    tzName: string,
    analysisResults: KPAnalysisResult[],
    modelId?: ModelId
  ): Promise<ReportSection[]> {
    const sections: ReportSection[] = [];

    // 1. Introduction
    sections.push({
      id: 'introduction',
      title: 'Введение',
      content: `Настоящий отчет содержит результаты автоматизированного анализа ${analysisResults.length} коммерческих предложений на соответствие техническому заданию "${tzName}". Анализ проведен с использованием технологий искусственного интеллекта для обеспечения объективности оценки.`,
      type: 'text'
    });

    // 2. Commercial Proposals Overview
    const proposalsOverview = analysisResults.map((result, index) => ({
      'No.': index + 1,
      'Название файла': result.kpFileName,
      'Общий балл': `${result.score}%`,
      'Рейтинг': result.score >= 80 ? 'Высокий' : result.score >= 60 ? 'Средний' : 'Низкий',
      'Соответствие ТЗ': `${result.analysis.compliance}%`
    }));

    sections.push({
      id: 'proposals-overview',
      title: 'Обзор коммерческих предложений',
      content: 'Общая информация о поступивших коммерческих предложениях:',
      type: 'table',
      data: proposalsOverview
    });

    // 3. Detailed Analysis for each proposal
    for (let index = 0; index < analysisResults.length; index++) {
      const result = analysisResults[index];
      sections.push({
        id: `detailed-analysis-${index}`,
        title: `Детальный анализ: ${result.kpFileName}`,
        content: `
**Общий балл:** ${result.score}%

**Детальные оценки:**
- Соответствие ТЗ: ${result.analysis.compliance}%
- Техническая экспертиза: ${result.analysis.technical}%
- Коммерческая оценка: ${result.analysis.commercial}%
- Опыт и компетенции: ${result.analysis.experience}%

**Анализ:**
${result.analysis.detailedAnalysis}

**Рекомендации:**
${result.analysis.recommendations.map((rec: string) => `• ${rec}`).join('\n')}
        `.trim(),
        type: 'text'
      });
    }

    // 4. Comparative Analysis
    if (analysisResults.length > 1) {
      const comparisonData = await this.generateComparisonAnalysis(analysisResults, modelId);
      sections.push({
        id: 'comparative-analysis',
        title: 'Сравнительный анализ',
        content: comparisonData,
        type: 'text'
      });
    }

    // 5. Risk Analysis
    const riskAnalysis = await this.generateRiskAnalysis(analysisResults, modelId);
    sections.push({
      id: 'risk-analysis',
      title: 'Анализ рисков',
      content: riskAnalysis,
      type: 'text'
    });

    return sections;
  }

  /**
   * Generate comparison analysis using AI
   */
  private async generateComparisonAnalysis(
    analysisResults: KPAnalysisResult[],
    modelId?: ModelId
  ): Promise<string> {
    const systemPrompt = `Ты — эксперт по закупкам и анализу предложений. Создай сравнительный анализ коммерческих предложений, выделив:
1. Ключевые различия между предложениями
2. Сильные и слабые стороны каждого
3. Рекомендации по выбору
Ответь структурированным текстом на русском языке.`;

    const prompt = `Проведи сравнительный анализ следующих коммерческих предложений:

${analysisResults.map((result, index) => `
Предложение ${index + 1}: ${result.kpFileName}
- Общий балл: ${result.score}%
- Соответствие: ${result.analysis.compliance}%
- Техническая часть: ${result.analysis.technical}%
- Коммерческая часть: ${result.analysis.commercial}%
- Опыт: ${result.analysis.experience}%
- Детали: ${result.analysis.detailedAnalysis}
`).join('')}`;

    try {
      const response = await apiClient.post('/api/v1/llm/analyze', {
        prompt,
        system_prompt: systemPrompt,
        model_id: modelId || 'gpt-4o',
        temperature: 0.2,
        max_tokens: 2000
      });

      return (response.data as any).response.trim();
    } catch (error) {
      console.error('Error generating comparison analysis:', error);
      return 'Не удалось сгенерировать сравнительный анализ.';
    }
  }

  /**
   * Generate risk analysis
   */
  private async generateRiskAnalysis(
    analysisResults: KPAnalysisResult[],
    modelId?: ModelId
  ): Promise<string> {
    const systemPrompt = `Ты — эксперт по управлению рисками в IT-проектах. Проанализируй риски по представленным коммерческим предложениям и дай рекомендации по их минимизации. Ответь структурированным текстом на русском языке.`;

    const prompt = `Проведи анализ рисков для коммерческих предложений:

${analysisResults.map((result, index) => `
${index + 1}. ${result.kpFileName} (балл: ${result.score}%)
Анализ: ${result.analysis.detailedAnalysis}
Рекомендации: ${result.analysis.recommendations.join('; ')}
`).join('')}

Выдели основные риски и способы их минимизации.`;

    try {
      const response = await apiClient.post('/api/v1/llm/analyze', {
        prompt,
        system_prompt: systemPrompt,
        model_id: modelId || 'gpt-4o',
        temperature: 0.2,
        max_tokens: 1500
      });

      return (response.data as any).response.trim();
    } catch (error) {
      console.error('Error generating risk analysis:', error);
      return 'Не удалось сгенерировать анализ рисков.';
    }
  }

  /**
   * Generate consolidated recommendations
   */
  private async generateConsolidatedRecommendations(
    analysisResults: KPAnalysisResult[],
    modelId?: ModelId
  ): Promise<string[]> {
    const systemPrompt = `Ты — эксперт-консультант по выбору подрядчиков. На основе анализа создай 3-5 ключевых рекомендаций для принятия решения. Каждая рекомендация должна быть конкретной и действенной. Ответь списком рекомендаций на русском языке.`;

    const bestProposal = this.findBestProposal(analysisResults);
    const averageScore = this.calculateAverageScore(analysisResults);

    const prompt = `На основе анализа ${analysisResults.length} коммерческих предложений со средним баллом ${averageScore}% дай ключевые рекомендации:

Лучшее предложение: ${bestProposal?.kpFileName} (${bestProposal?.score}%)
Худшее предложение: ${analysisResults.sort((a, b) => a.score - b.score)[0]?.kpFileName} (${analysisResults.sort((a, b) => a.score - b.score)[0]?.score}%)

Детали лучшего предложения: ${bestProposal?.analysis.detailedAnalysis}`;

    try {
      const response = await apiClient.post('/api/v1/llm/analyze', {
        prompt,
        system_prompt: systemPrompt,
        model_id: modelId || 'gpt-4o',
        temperature: 0.2,
        max_tokens: 1000
      });

      // Parse recommendations from response
      const recommendations = (response.data as any).response
        .split('\n')
        .filter((line: string) => line.trim().length > 0)
        .map((line: string) => line.replace(/^\d+\.\s*/, '').replace(/^[-•]\s*/, '').trim())
        .filter((line: string) => line.length > 20); // Filter out short lines

      return recommendations.slice(0, 5); // Return max 5 recommendations
    } catch (error) {
      console.error('Error generating recommendations:', error);
      return ['Не удалось сгенерировать рекомендации'];
    }
  }

  /**
   * Calculate average score across all proposals
   */
  private calculateAverageScore(analysisResults: KPAnalysisResult[]): number {
    if (analysisResults.length === 0) return 0;
    return Math.round(analysisResults.reduce((sum, result) => sum + result.score, 0) / analysisResults.length);
  }

  /**
   * Find the best proposal by score
   */
  private findBestProposal(analysisResults: KPAnalysisResult[]): KPAnalysisResult | null {
    if (analysisResults.length === 0) return null;
    return analysisResults.reduce((best, current) => 
      current.score > best.score ? current : best
    );
  }

  /**
   * Generate visualization data for charts
   */
  generateVisualizationData(analysisResults: KPAnalysisResult[]): VisualizationData {
    return {
      prices: analysisResults.map(result => ({
        name: result.kpFileName,
        value: 0, // Would need to extract from actual pricing data
        formatted: result.extractedData?.pricing || 'Не указано'
      })),
      timelines: analysisResults.map(result => ({
        name: result.kpFileName,
        days: 0, // Would need to extract from timeline data
        formatted: result.extractedData?.timeline || 'Не указано'
      })),
      compliance: analysisResults.map(result => ({
        name: result.kpFileName,
        score: result.analysis.compliance
      })),
      ratings: analysisResults.map(result => ({
        name: result.kpFileName,
        compliance: result.analysis.compliance,
        technical: result.analysis.technical,
        commercial: result.analysis.commercial,
        experience: result.analysis.experience
      })),
      risks: analysisResults.map(result => ({
        name: result.kpFileName,
        level: result.score >= 80 ? 'low' : result.score >= 60 ? 'medium' : 'high',
        score: result.score
      }))
    };
  }
}

export const reportService = new ReportService();