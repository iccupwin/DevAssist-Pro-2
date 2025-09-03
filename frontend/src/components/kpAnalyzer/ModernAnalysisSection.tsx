/**
 * Modern Analysis Section Component - Professional expandable section for detailed analysis
 * Features: score display, expandable content, interactive tables, recommendations
 */

import React, { useState } from 'react';
import { 
  ChevronDown, 
  ChevronUp, 
  TrendingUp,
  Clock,
  Cog,
  Users,
  Target,
  Shield,
  Brain,
  Globe,
  MessageSquare,
  Sparkles,
  Star,
  AlertTriangle,
  CheckCircle,
  LightbulbIcon,
  AlertCircle,
  TrendingDown
} from 'lucide-react';
import ScoreCard from './ScoreCard';
import BudgetTable, { BudgetItem } from './BudgetTable';
import { CurrencyGroup, CurrencyInfo } from './EnhancedCurrencyDisplay';

export interface AnalysisSection {
  id: string;
  title: string;
  score: number; // 0-100
  status: 'excellent' | 'good' | 'average' | 'poor' | 'critical';
  summary: string;
  details: string;
  keyPoints: string[];
  recommendations: string[];
  risks: string[];
  opportunities: string[];
  wordCount: number;
  confidence: number; // 0-100
  budgetData?: BudgetItem[];
  currencies?: CurrencyInfo[];
  tableData?: any[];
}

interface ModernAnalysisSectionProps {
  section: AnalysisSection;
  isExpanded?: boolean;
  onToggle?: () => void;
  showScore?: boolean;
  showDetails?: boolean;
  className?: string;
}

export const ModernAnalysisSection: React.FC<ModernAnalysisSectionProps> = ({
  section,
  isExpanded = false,
  onToggle,
  showScore = true,
  showDetails = true,
  className = ''
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'details' | 'recommendations' | 'risks'>('overview');

  const getSectionIcon = (sectionId: string) => {
    const iconMap = {
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
    const IconComponent = iconMap[sectionId as keyof typeof iconMap] || Brain;
    return <IconComponent className="w-5 h-5" />;
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-green-600';
    if (score >= 70) return 'text-blue-600';
    if (score >= 55) return 'text-yellow-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const getStatusBadge = (status: AnalysisSection['status']) => {
    const badges = {
      excellent: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 border-green-200',
      good: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 border-blue-200',
      average: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400 border-yellow-200',
      poor: 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-400 border-orange-200',
      critical: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400 border-red-200'
    };

    const texts = {
      excellent: 'Отлично',
      good: 'Хорошо',
      average: 'Средне',
      poor: 'Плохо',
      critical: 'Критично'
    };

    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium border ${badges[status]}`}>
        {texts[status]}
      </span>
    );
  };

  const confidenceColor = section.confidence >= 80 ? 'text-green-600' : 
                         section.confidence >= 60 ? 'text-yellow-600' : 'text-red-600';

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden transition-all duration-300 ${className}`}>
      {/* Header */}
      <div 
        className={`p-6 cursor-pointer transition-colors ${
          isExpanded ? 'bg-blue-50 dark:bg-blue-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-700'
        }`}
        onClick={onToggle}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="text-blue-600 dark:text-blue-400">
              {getSectionIcon(section.id)}
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                {section.title}
              </h3>
              <div className="flex items-center gap-4 mt-1">
                {showScore && (
                  <div className={`text-2xl font-bold ${getScoreColor(section.score)}`}>
                    {section.score}/100
                  </div>
                )}
                {getStatusBadge(section.status)}
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {section.wordCount} слов • {section.confidence}% уверенность
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {showScore && (
              <div className="text-right hidden sm:block">
                <div className={`text-3xl font-bold ${getScoreColor(section.score)}`}>
                  {section.score}
                </div>
                <div className={`text-xs ${confidenceColor}`}>
                  {section.confidence}% точность
                </div>
              </div>
            )}
            <button className="p-2 rounded-lg hover:bg-white dark:hover:bg-gray-600 transition-colors">
              {isExpanded ? (
                <ChevronUp className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              )}
            </button>
          </div>
        </div>

        {/* Summary (always visible) */}
        <div className="mt-4">
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
            {section.summary}
          </p>
        </div>
      </div>

      {/* Expandable Content */}
      {isExpanded && (
        <div className="border-t border-gray-200 dark:border-gray-700">
          {/* Tabs */}
          <div className="flex border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 ${
                activeTab === 'overview'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400 bg-white dark:bg-gray-800'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              Обзор
            </button>
            <button
              onClick={() => setActiveTab('details')}
              className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 ${
                activeTab === 'details'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400 bg-white dark:bg-gray-800'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              Детали
            </button>
            <button
              onClick={() => setActiveTab('recommendations')}
              className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 ${
                activeTab === 'recommendations'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400 bg-white dark:bg-gray-800'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              Рекомендации
            </button>
            <button
              onClick={() => setActiveTab('risks')}
              className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 ${
                activeTab === 'risks'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400 bg-white dark:bg-gray-800'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              Риски
            </button>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Key Points */}
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <Star className="w-5 h-5 text-yellow-500" />
                    Ключевые моменты
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {section.keyPoints.map((point, index) => (
                      <div key={index} className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <CheckCircle className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-blue-900 dark:text-blue-300">
                          {point}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Budget Data if available */}
                {section.budgetData && section.budgetData.length > 0 && (
                  <BudgetTable
                    items={section.budgetData}
                    title="Детализация бюджета"
                    showComparison={true}
                    showTotal={true}
                  />
                )}

                {/* Currency Data if available */}
                {section.currencies && section.currencies.length > 0 && (
                  <CurrencyGroup
                    currencies={section.currencies}
                    title="Обнаруженные валюты"
                    showTotal={true}
                  />
                )}
              </div>
            )}

            {activeTab === 'details' && showDetails && (
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <Brain className="w-5 h-5 text-purple-500" />
                  Детальный анализ
                </h4>
                <div className="prose dark:prose-invert max-w-none">
                  {section.details.split('\n\n').map((paragraph, index) => (
                    <p key={index} className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'recommendations' && (
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <LightbulbIcon className="w-5 h-5 text-yellow-500" />
                  Рекомендации по улучшению
                </h4>
                <div className="space-y-3">
                  {section.recommendations.map((recommendation, index) => (
                    <div key={index} className="flex items-start gap-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                      <LightbulbIcon className="w-4 h-4 text-green-600 dark:text-green-400 mt-1 flex-shrink-0" />
                      <span className="text-sm text-green-900 dark:text-green-300">
                        {recommendation}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Opportunities */}
                {section.opportunities.length > 0 && (
                  <div className="mt-6">
                    <h5 className="text-base font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-green-500" />
                      Возможности
                    </h5>
                    <div className="space-y-2">
                      {section.opportunities.map((opportunity, index) => (
                        <div key={index} className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                          <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                          <span className="text-sm text-blue-900 dark:text-blue-300">
                            {opportunity}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'risks' && (
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                  Выявленные риски
                </h4>
                <div className="space-y-3">
                  {section.risks.map((risk, index) => (
                    <div key={index} className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                      <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 mt-1 flex-shrink-0" />
                      <span className="text-sm text-red-900 dark:text-red-300">
                        {risk}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ModernAnalysisSection;