/**
 * Секция результатов анализа КП
 */

import React, { useState } from 'react';
import { 
  Trophy, 
  TrendingUp, 
  TrendingDown, 
  CheckCircle, 
  AlertTriangle,
  Download,
  RefreshCw,
  ChevronLeft,
  BarChart3,
  FileText,
  Star,
  Target,
  Shield,
  Clock
} from 'lucide-react';
import { 
  AnalysisResult, 
  ComparisonResult, 
  TechnicalSpecification, 
  CommercialProposal 
} from '../../types/kpAnalyzer';

interface AnalysisResultsSectionProps {
  analysisResults: AnalysisResult[];
  comparisonResult: ComparisonResult | null;
  technicalSpec: TechnicalSpecification | null;
  commercialProposals: CommercialProposal[];
  onStartNewAnalysis: () => void;
  onGoBack: () => void;
}

const AnalysisResultsSection: React.FC<AnalysisResultsSectionProps> = ({
  analysisResults,
  comparisonResult,
  technicalSpec,
  commercialProposals,
  onStartNewAnalysis,
  onGoBack,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'detailed' | 'comparison'>('overview');
  const [selectedKP, setSelectedKP] = useState<string | null>(null);

  const getRatingColor = (rating: string) => {
    switch (rating) {
      case 'excellent': return 'text-green-400';
      case 'good': return 'text-blue-400';
      case 'satisfactory': return 'text-yellow-400';
      case 'poor': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getRatingIcon = (rating: string) => {
    switch (rating) {
      case 'excellent': return <Trophy className="w-5 h-5" />;
      case 'good': return <CheckCircle className="w-5 h-5" />;
      case 'satisfactory': return <Target className="w-5 h-5" />;
      case 'poor': return <AlertTriangle className="w-5 h-5" />;
      default: return <FileText className="w-5 h-5" />;
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'text-green-400 bg-green-400/10';
      case 'medium': return 'text-yellow-400 bg-yellow-400/10';
      case 'high': return 'text-red-400 bg-red-400/10';
      default: return 'text-gray-400 bg-gray-400/10';
    }
  };

  const getKPName = (kpId: string) => {
    const kp = commercialProposals.find(p => p.id === kpId);
    return kp?.name || `КП ${kpId}`;
  };

  const renderOverview = () => {
    if (!comparisonResult) return null;

    const winner = comparisonResult.ranking[0];
    const winnerResult = analysisResults.find(r => r.kpId === winner.kpId);

    return (
      <div className="space-y-8">
        {/* Победитель */}
        <div className="bg-gradient-to-r from-green-900/20 to-blue-900/20 border border-green-700 rounded-lg p-6">
          <div className="flex items-center space-x-3 mb-4">
            <Trophy className="w-8 h-8 text-yellow-400" />
            <div>
              <h3 className="text-xl font-bold text-white">Рекомендуемое КП</h3>
              <p className="text-gray-300">{getKPName(winner.kpId)}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-400 mb-1">
                {winner.totalScore}
              </div>
              <div className="text-sm text-gray-400">Общий балл</div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-400 mb-1">
                #{winner.rank}
              </div>
              <div className="text-sm text-gray-400">Место в рейтинге</div>
            </div>
            
            <div className="text-center">
              <div className={`text-3xl font-bold mb-1 ${getRatingColor(winnerResult?.summary?.overallRating || '')}`}>
                {winnerResult?.summary?.overallRating === 'excellent' ? 'A+' :
                 winnerResult?.summary?.overallRating === 'good' ? 'A' :
                 winnerResult?.summary?.overallRating === 'satisfactory' ? 'B' : 'C'}
              </div>
              <div className="text-sm text-gray-400">Оценка качества</div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-gray-800/50 rounded-lg">
            <h4 className="font-medium text-white mb-2">Обоснование выбора:</h4>
            <p className="text-gray-300 text-sm">{comparisonResult.recommendation?.reasoning || 'Обоснование недоступно'}</p>
          </div>
        </div>

        {/* Рейтинг всех КП */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-medium text-white mb-4">Рейтинг предложений</h3>
          <div className="space-y-3">
            {comparisonResult.ranking.map((item, index) => {
              const result = analysisResults.find(r => r.kpId === item.kpId);
              return (
                <div 
                  key={item.kpId}
                  className={`flex items-center justify-between p-4 rounded-lg border cursor-pointer transition-colors ${
                    index === 0 
                      ? 'border-green-500 bg-green-500/10 hover:bg-green-500/20'
                      : 'border-gray-700 bg-gray-800 hover:bg-gray-700'
                  }`}
                  onClick={() => setSelectedKP(item.kpId)}
                >
                  <div className="flex items-center space-x-4">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                      index === 0 ? 'bg-yellow-400 text-black' :
                      index === 1 ? 'bg-gray-300 text-black' :
                      index === 2 ? 'bg-orange-400 text-black' :
                      'bg-gray-600 text-white'
                    }`}>
                      {item.rank}
                    </div>
                    
                    <div>
                      <div className="font-medium text-white">{getKPName(item.kpId)}</div>
                      <div className="text-sm text-gray-400">{item.summary}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className={`px-3 py-1 rounded-full text-sm ${getRiskColor(result?.summary?.riskLevel || 'medium')}`}>
                      {result?.summary?.riskLevel === 'low' ? 'Низкий риск' :
                       result?.summary?.riskLevel === 'medium' ? 'Средний риск' :
                       'Высокий риск'}
                    </div>
                    
                    <div className="text-right">
                      <div className="text-lg font-bold text-white">{item.totalScore}</div>
                      <div className="text-xs text-gray-400">баллов</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Сравнение по критериям */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-medium text-white mb-4">Сравнение по критериям</h3>
          <div className="space-y-4">
            {comparisonResult.criteriaComparison?.map((criteria) => (
              <div key={criteria.criterion} className="space-y-2">
                <h4 className="font-medium text-gray-300">{criteria.criterion}</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                  {Object.entries(criteria.scores)
                    .sort(([,a], [,b]) => b - a)
                    .map(([kpId, score], index) => (
                    <div key={kpId} className="flex items-center justify-between p-2 bg-gray-800 rounded">
                      <span className="text-sm text-gray-300 truncate">
                        {getKPName(kpId)}
                      </span>
                      <span className={`font-medium ${
                        index === 0 ? 'text-green-400' :
                        index === 1 ? 'text-blue-400' :
                        'text-gray-400'
                      }`}>
                        {score}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderDetailedAnalysis = () => {
    const selectedResult = selectedKP 
      ? analysisResults.find(r => r.kpId === selectedKP)
      : analysisResults[0];

    if (!selectedResult) return null;

    return (
      <div className="space-y-6">
        {/* Селектор КП */}
        <div className="flex flex-wrap gap-2">
          {analysisResults.map((result) => (
            <button
              key={result.kpId}
              onClick={() => setSelectedKP(result.kpId)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedKP === result.kpId || (!selectedKP && result === analysisResults[0])
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              {getKPName(result.kpId)}
            </button>
          ))}
        </div>

        {/* Детальный анализ выбранного КП */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Основная информация */}
          <div className="lg:col-span-2 space-y-6">
            {/* Общая оценка */}
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-white">Общая оценка</h3>
                <div className={`flex items-center space-x-2 ${getRatingColor(selectedResult.summary?.overallRating || '')}`}>
                  {getRatingIcon(selectedResult.summary?.overallRating || '')}
                  <span className="font-medium capitalize">{selectedResult.summary?.overallRating || 'Не определено'}</span>
                </div>
              </div>
              
              <div className="text-center mb-4">
                <div className="text-4xl font-bold text-blue-400 mb-2">
                  {selectedResult.complianceScore}%
                </div>
                <div className="text-gray-400">Соответствие ТЗ</div>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium text-white">Ключевые выводы:</h4>
                <ul className="space-y-1">
                  {selectedResult.summary?.keyFindings?.map((finding, index) => (
                    <li key={index} className="text-gray-300 text-sm flex items-start space-x-2">
                      <span className="text-blue-400 mt-1">•</span>
                      <span>{finding}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Оценка по критериям */}
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-medium text-white mb-4">Оценка по критериям</h3>
              <div className="space-y-4">
                {selectedResult.criteriaAnalysis?.map((criteria, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-gray-300">{criteria.criterion}</h4>
                      <div className="flex items-center space-x-2">
                        {criteria.met ? (
                          <CheckCircle className="w-4 h-4 text-green-400" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-red-400" />
                        )}
                        <span className="font-bold text-white">{criteria.score}</span>
                      </div>
                    </div>
                    
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          criteria.score >= 80 ? 'bg-green-400' :
                          criteria.score >= 60 ? 'bg-yellow-400' :
                          'bg-red-400'
                        }`}
                        style={{ width: `${criteria.score}%` }}
                      />
                    </div>
                    
                    <p className="text-sm text-gray-400">{criteria.comment}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Сильные и слабые стороны */}
          <div className="space-y-6">
            {/* Сильные стороны */}
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
              <div className="flex items-center space-x-2 mb-4">
                <TrendingUp className="w-5 h-5 text-green-400" />
                <h3 className="text-lg font-medium text-white">Сильные стороны</h3>
              </div>
              <ul className="space-y-2">
                {selectedResult.strengths.map((strength, index) => (
                  <li key={index} className="text-gray-300 text-sm flex items-start space-x-2">
                    <span className="text-green-400 mt-1">+</span>
                    <span>{strength}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Слабые стороны */}
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
              <div className="flex items-center space-x-2 mb-4">
                <TrendingDown className="w-5 h-5 text-red-400" />
                <h3 className="text-lg font-medium text-white">Области улучшения</h3>
              </div>
              <ul className="space-y-2">
                {selectedResult.weaknesses.map((weakness, index) => (
                  <li key={index} className="text-gray-300 text-sm flex items-start space-x-2">
                    <span className="text-red-400 mt-1">-</span>
                    <span>{weakness}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Рекомендации */}
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
              <div className="flex items-center space-x-2 mb-4">
                <Star className="w-5 h-5 text-yellow-400" />
                <h3 className="text-lg font-medium text-white">Рекомендации</h3>
              </div>
              <ul className="space-y-2">
                {selectedResult.recommendations.map((recommendation, index) => (
                  <li key={index} className="text-gray-300 text-sm flex items-start space-x-2">
                    <span className="text-yellow-400 mt-1">→</span>
                    <span>{recommendation}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Метаинформация */}
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-medium text-white mb-4">Информация об анализе</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Модель ИИ:</span>
                  <span className="text-white">{selectedResult.aiModel}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Дата анализа:</span>
                  <span className="text-white">
                    {selectedResult.createdAt ? new Date(selectedResult.createdAt).toLocaleDateString('ru-RU') : 'Не указано'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Время анализа:</span>
                  <span className="text-white">
                    {selectedResult.createdAt ? new Date(selectedResult.createdAt).toLocaleTimeString('ru-RU') : 'Не указано'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Уровень риска:</span>
                  <span className={`px-2 py-1 rounded text-xs ${getRiskColor(selectedResult.summary?.riskLevel || 'medium')}`}>
                    {selectedResult.summary?.riskLevel === 'low' ? 'Низкий' :
                     selectedResult.summary?.riskLevel === 'medium' ? 'Средний' : 'Высокий'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {/* Заголовок и навигация */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <BarChart3 className="w-6 h-6 text-green-400" />
          <h2 className="text-xl font-semibold text-white">
            Результаты анализа
          </h2>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={() => {
              // Export functionality will be implemented
              console.warn('PDF export feature not yet implemented');
            }}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg"
          >
            <Download className="w-4 h-4" />
            <span>Экспорт</span>
          </button>
          
          <button
            onClick={onStartNewAnalysis}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Новый анализ</span>
          </button>
        </div>
      </div>

      {/* Табы */}
      <div className="border-b border-gray-800">
        <nav className="flex space-x-8">
          {[
            { id: 'overview', label: 'Обзор', icon: Trophy },
            { id: 'detailed', label: 'Детальный анализ', icon: FileText },
            { id: 'comparison', label: 'Сравнение', icon: BarChart3 },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id as any)}
              className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === id
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-gray-400 hover:text-gray-300'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Контент табов */}
      <div>
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'detailed' && renderDetailedAnalysis()}
        {activeTab === 'comparison' && renderOverview()} {/* Пока используем тот же контент */}
      </div>

      {/* Кнопки действий */}
      <div className="flex items-center justify-between pt-8 border-t border-gray-800">
        <button
          onClick={onGoBack}
          className="flex items-center space-x-2 px-4 py-2 text-gray-400 hover:text-white transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Назад к настройкам</span>
        </button>

        <div className="text-sm text-gray-400">
          Анализ завершен • {analysisResults.length} КП проанализировано • 
          {comparisonResult ? ` Рекомендация: ${getKPName(comparisonResult.recommendation?.winner || '')}` : ''}
        </div>
      </div>
    </div>
  );
};

export default AnalysisResultsSection;