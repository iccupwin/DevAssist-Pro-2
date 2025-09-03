/**
 * Enhanced Results Display - Modern comprehensive analysis results page
 * Features: card-based design, structured tables, interactive sections, currency support
 */

import React, { useState } from 'react';
import {
  CheckCircle,
  Brain,
  TrendingUp,
  Clock,
  Award,
  Target,
  Star,
  FileDown,
  Share,
  RefreshCw,
  AlertTriangle,
  BarChart3,
  Eye,
  Calendar,
  Zap,
  MapPin
} from 'lucide-react';
import ScoreCard from './ScoreCard';
import BudgetTable, { BudgetItem } from './BudgetTable';
import ModernAnalysisSection, { AnalysisSection } from './ModernAnalysisSection';
import { CurrencyGroup, CurrencyStats, CurrencyInfo } from './EnhancedCurrencyDisplay';

// Import types from v2
interface ComprehensiveAnalysisResult {
  id: string;
  documentId: string;
  documentName: string;
  companyName: string;
  createdAt: string;
  processingDuration: number;
  aiModel: string;
  
  overallScore: number;
  complianceLevel: 'excellent' | 'good' | 'average' | 'poor' | 'critical';
  confidenceScore: number;
  
  financials: {
    totalBudget?: CurrencyInfo;
    currencies: CurrencyInfo[];
    paymentTerms: string[];
    costBreakdown: {
      development?: CurrencyInfo;
      infrastructure?: CurrencyInfo;
      support?: CurrencyInfo;
      testing?: CurrencyInfo;
      deployment?: CurrencyInfo;
      other?: CurrencyInfo[];
    };
    financialNotes: string[];
  };
  
  sections: {
    budget: AnalysisSection;
    timeline: AnalysisSection;
    technical: AnalysisSection;
    team: AnalysisSection;
    functional: AnalysisSection;
    security: AnalysisSection;
    methodology: AnalysisSection;
    scalability: AnalysisSection;
    communication: AnalysisSection;
    value: AnalysisSection;
  };
  
  executiveSummary: {
    keyStrengths: string[];
    criticalWeaknesses: string[];
    riskAssessment: string;
    recommendation: string;
    nextSteps: string[];
  };
  
  complianceAnalysis?: {
    requirementsCovered: number;
    missingRequirements: string[];
    additionalFeatures: string[];
    technicalAlignment: number;
  };
}

interface EnhancedResultsDisplayProps {
  result: ComprehensiveAnalysisResult;
  onNewAnalysis?: () => void;
  onExportPDF?: () => void;
  onShare?: () => void;
  className?: string;
}

export const EnhancedResultsDisplay: React.FC<EnhancedResultsDisplayProps> = ({
  result,
  onNewAnalysis,
  onExportPDF,
  onShare,
  className = ''
}) => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['budget']));
  const [selectedSection, setSelectedSection] = useState<string | null>(null);

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  const getComplianceIcon = (level: ComprehensiveAnalysisResult['complianceLevel']) => {
    switch (level) {
      case 'excellent':
        return <Award className="w-6 h-6 text-green-600" />;
      case 'good':
        return <CheckCircle className="w-6 h-6 text-blue-600" />;
      case 'average':
        return <Target className="w-6 h-6 text-yellow-600" />;
      case 'poor':
        return <AlertTriangle className="w-6 h-6 text-orange-600" />;
      case 'critical':
        return <AlertTriangle className="w-6 h-6 text-red-600" />;
    }
  };

  const getComplianceText = (level: ComprehensiveAnalysisResult['complianceLevel']) => {
    const textMap = {
      excellent: 'Полное соответствие',
      good: 'Хорошее соответствие',
      average: 'Частичное соответствие',
      poor: 'Слабое соответствие',
      critical: 'Несоответствие'
    };
    return textMap[level];
  };

  // Convert financial breakdown to BudgetTable format
  const budgetTableData: BudgetItem[] = React.useMemo(() => {
    const items: BudgetItem[] = [];
    const { costBreakdown } = result.financials;

    if (costBreakdown.development) {
      items.push({
        id: 'development',
        category: 'Разработка',
        kpAmount: costBreakdown.development,
        deviation: 0, // Would be calculated vs TZ if available
        status: 'good'
      });
    }

    if (costBreakdown.infrastructure) {
      items.push({
        id: 'infrastructure',
        category: 'Инфраструктура',
        kpAmount: costBreakdown.infrastructure,
        deviation: 0,
        status: 'good'
      });
    }

    if (costBreakdown.support) {
      items.push({
        id: 'support',
        category: 'Поддержка',
        kpAmount: costBreakdown.support,
        deviation: 0,
        status: 'good'
      });
    }

    if (costBreakdown.testing) {
      items.push({
        id: 'testing',
        category: 'Тестирование',
        kpAmount: costBreakdown.testing,
        deviation: 0,
        status: 'good'
      });
    }

    if (costBreakdown.deployment) {
      items.push({
        id: 'deployment',
        category: 'Развертывание',
        kpAmount: costBreakdown.deployment,
        deviation: 0,
        status: 'good'
      });
    }

    return items;
  }, [result.financials.costBreakdown]);

  return (
    <div className={`max-w-7xl mx-auto space-y-8 ${className}`}>
      {/* Header */}
      <div className="text-center space-y-6">
        <div className="flex justify-center mb-6">
          <div className="bg-green-100 dark:bg-green-900/30 p-4 rounded-2xl">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
        </div>
        
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
          🎯 Результаты анализа КП
        </h1>
        
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 max-w-4xl mx-auto shadow-lg">
          <div className="flex items-center justify-between mb-6">
            <div className="text-left">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                {result.companyName}
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {result.documentName}
              </p>
              <div className="flex items-center gap-4 mt-2 text-sm text-gray-500 dark:text-gray-400">
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {new Date(result.createdAt).toLocaleDateString('ru-RU')}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {result.processingDuration}с анализа
                </span>
                <span className="flex items-center gap-1">
                  <Brain className="w-4 h-4" />
                  {result.aiModel}
                </span>
              </div>
            </div>
            
            <div className="text-right">
              <div className="text-5xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                {result.overallScore}
              </div>
              <div className="flex items-center gap-2 justify-end">
                {getComplianceIcon(result.complianceLevel)}
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {getComplianceText(result.complianceLevel)}
                </span>
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                AI уверенность: {result.confidenceScore}%
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3 justify-center border-t border-gray-200 dark:border-gray-700 pt-4">
            {onExportPDF && (
              <button
                onClick={onExportPDF}
                className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <FileDown className="w-4 h-4" />
                Экспорт PDF
              </button>
            )}
            {onShare && (
              <button
                onClick={onShare}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Share className="w-4 h-4" />
                Поделиться
              </button>
            )}
            {onNewAnalysis && (
              <button
                onClick={onNewAnalysis}
                className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Новый анализ
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Score Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <ScoreCard
          title="Общая оценка"
          score={result.overallScore}
          icon={<Award className="w-5 h-5" />}
          description="Комплексная оценка КП"
          trend="up"
        />
        
        <ScoreCard
          title="Соответствие ТЗ"
          score={result.complianceAnalysis?.requirementsCovered || 75}
          icon={<Target className="w-5 h-5" />}
          description="Покрытие требований ТЗ"
          trend="stable"
        />
        
        <ScoreCard
          title="Уверенность AI"
          score={result.confidenceScore}
          icon={<Brain className="w-5 h-5" />}
          description="Точность анализа"
          trend="up"
        />
      </div>

      {/* Financial Summary */}
      {result.financials.currencies.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-lg">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-green-600" />
            💰 Финансовая сводка
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {result.financials.totalBudget && (
              <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-1">
                  {result.financials.totalBudget.amount.toLocaleString('ru-RU')} {result.financials.totalBudget.symbol}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Общий бюджет проекта
                </div>
              </div>
            )}
            
            <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400 mb-1">
                {result.financials.currencies.length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Валют обнаружено
              </div>
            </div>
            
            <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400 mb-1">
                {result.financials.paymentTerms.length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Условий оплаты
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <CurrencyGroup
              currencies={result.financials.currencies}
              title="Обнаруженные валюты"
              showTotal={true}
            />
            
            <CurrencyStats currencies={result.financials.currencies} />
          </div>

          {/* Budget Breakdown Table */}
          {budgetTableData.length > 0 && (
            <div className="mt-6">
              <BudgetTable
                items={budgetTableData}
                title="Детализация бюджета"
                showComparison={false}
                showTotal={true}
              />
            </div>
          )}
        </div>
      )}

      {/* Analysis Sections */}
      <div className="space-y-6">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            📊 Детальный анализ по разделам
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Комплексная оценка коммерческого предложения по 10 ключевым критериям
          </p>
        </div>

        {Object.entries(result.sections).map(([sectionId, sectionData]) => (
          <ModernAnalysisSection
            key={sectionId}
            section={{ ...sectionData, id: sectionId }}
            isExpanded={expandedSections.has(sectionId)}
            onToggle={() => toggleSection(sectionId)}
            showScore={true}
            showDetails={true}
          />
        ))}
      </div>

      {/* Executive Summary */}
      <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl border border-blue-200 dark:border-blue-800 p-6 shadow-lg">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Star className="w-6 h-6 text-yellow-500" />
          ⭐ Итоговое заключение
        </h3>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Strengths */}
          <div>
            <h4 className="font-semibold text-green-700 dark:text-green-400 mb-3 flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              Сильные стороны
            </h4>
            <ul className="space-y-2">
              {result.executiveSummary.keyStrengths.map((strength, index) => (
                <li key={index} className="flex items-start gap-2 text-gray-700 dark:text-gray-300">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0" />
                  <span className="text-sm">{strength}</span>
                </li>
              ))}
            </ul>
          </div>
          
          {/* Weaknesses */}
          <div>
            <h4 className="font-semibold text-red-700 dark:text-red-400 mb-3 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Области для улучшения
            </h4>
            <ul className="space-y-2">
              {result.executiveSummary.criticalWeaknesses.map((weakness, index) => (
                <li key={index} className="flex items-start gap-2 text-gray-700 dark:text-gray-300">
                  <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0" />
                  <span className="text-sm">{weakness}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
        
        {/* Recommendation */}
        <div className="mt-6 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
            <Zap className="w-5 h-5 text-blue-500" />
            Итоговая рекомендация
          </h4>
          <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed mb-4">
            {result.executiveSummary.recommendation}
          </p>
          
          {/* Next Steps */}
          <div>
            <h5 className="font-medium text-gray-900 dark:text-white mb-2">
              Следующие шаги:
            </h5>
            <ul className="space-y-1">
              {result.executiveSummary.nextSteps.map((step, index) => (
                <li key={index} className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                  <MapPin className="w-3 h-3 text-blue-500 flex-shrink-0" />
                  {step}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Risk Assessment */}
        <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
          <h4 className="font-semibold text-amber-800 dark:text-amber-400 mb-2">
            Оценка рисков
          </h4>
          <p className="text-sm text-amber-700 dark:text-amber-300">
            {result.executiveSummary.riskAssessment}
          </p>
        </div>
      </div>

      {/* Compliance Analysis */}
      {result.complianceAnalysis && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-lg">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-blue-600" />
            Анализ соответствия ТЗ
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ScoreCard
              title="Покрытие требований"
              score={result.complianceAnalysis.requirementsCovered}
              icon={<Target className="w-5 h-5" />}
              description="Процент покрытых требований ТЗ"
              compact
            />
            
            <ScoreCard
              title="Техническое соответствие"
              score={result.complianceAnalysis.technicalAlignment}
              icon={<Zap className="w-5 h-5" />}
              description="Соответствие технических решений"
              compact
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            {/* Missing Requirements */}
            <div>
              <h4 className="font-semibold text-red-700 dark:text-red-400 mb-3">
                Недостающие требования
              </h4>
              <ul className="space-y-2">
                {result.complianceAnalysis.missingRequirements.map((req, index) => (
                  <li key={index} className="text-sm text-gray-700 dark:text-gray-300 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                    {req}
                  </li>
                ))}
              </ul>
            </div>
            
            {/* Additional Features */}
            <div>
              <h4 className="font-semibold text-green-700 dark:text-green-400 mb-3">
                Дополнительные возможности
              </h4>
              <ul className="space-y-2">
                {result.complianceAnalysis.additionalFeatures.map((feature, index) => (
                  <li key={index} className="text-sm text-gray-700 dark:text-gray-300 flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedResultsDisplay;