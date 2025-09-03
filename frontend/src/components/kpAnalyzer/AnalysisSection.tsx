/**
 * AnalysisSection Component
 * Expandable section for detailed analysis results
 */

import React, { useState } from 'react';
import { 
  ChevronDown, 
  ChevronUp, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle,
  XCircle,
  Info,
  Target,
  Clock,
  DollarSign,
  Users,
  Shield,
  Settings,
  Zap,
  MessageCircle,
  Star
} from 'lucide-react';
import { DetailedAnalysisSection } from '../../types/kpAnalyzer';
import ScoreBadge from './ScoreBadge';
import EnhancedComparisonTable from './EnhancedComparisonTable';
import { getRiskLevelColor } from '../../utils/currencyUtils';

interface AnalysisSectionProps {
  section: DetailedAnalysisSection;
  sectionType: string;
  isExpanded?: boolean;
  onToggle?: () => void;
  className?: string;
}

const SECTION_ICONS: Record<string, React.ReactNode> = {
  budget_compliance: <DollarSign className="w-5 h-5" />,
  timeline_compliance: <Clock className="w-5 h-5" />,
  technical_compliance: <Settings className="w-5 h-5" />,
  team_expertise: <Users className="w-5 h-5" />,
  functional_coverage: <CheckCircle className="w-5 h-5" />,
  security_quality: <Shield className="w-5 h-5" />,
  methodology_processes: <Target className="w-5 h-5" />,
  scalability_support: <Zap className="w-5 h-5" />,
  communication_reporting: <MessageCircle className="w-5 h-5" />,
  additional_value: <Star className="w-5 h-5" />
};

const SECTION_TITLES: Record<string, string> = {
  budget_compliance: '💰 Бюджетное соответствие',
  timeline_compliance: '⏱️ Временное соответствие',
  technical_compliance: '🔧 Техническое соответствие',
  team_expertise: '👥 Команда и экспертиза',
  functional_coverage: '📋 Функциональное покрытие',
  security_quality: '🛡️ Безопасность и качество',
  methodology_processes: '🔧 Методология и процессы',
  scalability_support: '📈 Масштабируемость и поддержка',
  communication_reporting: '📞 Коммуникации и отчетность',
  additional_value: '⭐ Дополнительная ценность'
};

export const AnalysisSection: React.FC<AnalysisSectionProps> = ({
  section,
  sectionType,
  isExpanded = false,
  onToggle,
  className = ''
}) => {
  const [internalExpanded, setInternalExpanded] = useState(isExpanded);
  
  const expanded = onToggle ? isExpanded : internalExpanded;
  const handleToggle = onToggle || (() => setInternalExpanded(!internalExpanded));

  const sectionIcon = SECTION_ICONS[sectionType] || <Info className="w-5 h-5" />;
  const sectionTitle = SECTION_TITLES[sectionType] || section.title;

  const getRiskIcon = () => {
    switch (section.risk_level) {
      case 'low': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'medium': return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      case 'high': return <XCircle className="w-4 h-4 text-red-600" />;
      default: return <Info className="w-4 h-4 text-gray-600" />;
    }
  };

  const getRiskText = () => {
    switch (section.risk_level) {
      case 'low': return 'Низкий риск';
      case 'medium': return 'Средний риск';
      case 'high': return 'Высокий риск';
      default: return 'Риск не определен';
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
      {/* Section Header */}
      <div 
        className="px-6 py-4 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={handleToggle}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="text-blue-600">
              {sectionIcon}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {sectionTitle}
              </h3>
              <div className="flex items-center space-x-2 mt-1">
                <ScoreBadge score={section.score} size="sm" showIcon={false} />
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getRiskLevelColor(section.risk_level)}`}>
                  {getRiskIcon()}
                  <span className="ml-1">{getRiskText()}</span>
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className="text-right text-sm text-gray-600">
              <div>{section.key_findings?.length || 0} находок</div>
              <div>{section.recommendations?.length || 0} рекомендаций</div>
            </div>
            {expanded ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </div>
        </div>
      </div>

      {/* Expandable Content */}
      {expanded && (
        <div className="px-6 pb-6 border-t border-gray-100">
          {/* Description */}
          {section.description && (
            <div className="mt-4">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Детальный анализ</h4>
              <div className="text-sm text-gray-700 leading-relaxed bg-gray-50 p-4 rounded-md">
                {section.description}
              </div>
            </div>
          )}

          {/* Key Findings */}
          {section.key_findings && section.key_findings.length > 0 && (
            <div className="mt-6">
              <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                <TrendingUp className="w-4 h-4 text-blue-600 mr-1" />
                Ключевые находки
              </h4>
              <div className="space-y-2">
                {section.key_findings.map((finding, index) => (
                  <div 
                    key={index} 
                    className="flex items-start space-x-2 text-sm text-gray-700 bg-blue-50 p-3 rounded-md"
                  >
                    <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <span>{finding}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tables */}
          {section.tables && section.tables.length > 0 && (
            <div className="mt-6">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Детализированные данные</h4>
              <div className="space-y-4">
                {section.tables.map((table, index) => (
                  <EnhancedComparisonTable 
                    key={index} 
                    table={table}
                    maxHeight="max-h-64"
                  />
                ))}
              </div>
            </div>
          )}

          {/* Recommendations */}
          {section.recommendations && section.recommendations.length > 0 && (
            <div className="mt-6">
              <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                <Target className="w-4 h-4 text-green-600 mr-1" />
                Рекомендации
              </h4>
              <div className="space-y-2">
                {section.recommendations.map((recommendation, index) => (
                  <div 
                    key={index} 
                    className="flex items-start space-x-2 text-sm text-gray-700 bg-green-50 p-3 rounded-md"
                  >
                    <Target className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>{recommendation}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Risk Assessment */}
          <div className="mt-6 pt-4 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-600">Уровень риска:</span>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getRiskLevelColor(section.risk_level)}`}>
                  {getRiskIcon()}
                  <span className="ml-1">{getRiskText()}</span>
                </span>
              </div>
              
              <div className="text-right">
                <div className="text-xs text-gray-500">Оценка раздела</div>
                <ScoreBadge score={section.score} size="sm" />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalysisSection;