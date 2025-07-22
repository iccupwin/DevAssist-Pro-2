/**
 * Статистика KP анализатора
 * Карточки с ключевыми метриками
 */

import React from 'react';
import { 
  TrendingUp, 
  FileText, 
  CheckCircle, 
  Target,
  BarChart3,
  Clock,
  Zap
} from 'lucide-react';

interface KPAnalyzerStatsProps {
  stats: {
    totalAnalyses: number;
    completedAnalyses: number;
    averageScore: number;
    totalFiles: number;
    thisMonth: number;
    accuracy: number;
  };
  isDarkMode: boolean;
}

const KPAnalyzerStats: React.FC<KPAnalyzerStatsProps> = ({ stats, isDarkMode }) => {
  const statCards = [
    {
      title: 'Всего анализов',
      value: stats.totalAnalyses,
      icon: BarChart3,
      color: 'blue',
      change: '+12%',
      changeType: 'increase'
    },
    {
      title: 'Завершено',
      value: stats.completedAnalyses,
      icon: CheckCircle,
      color: 'green',
      change: '+8%',
      changeType: 'increase'
    },
    {
      title: 'Средний балл',
      value: `${stats.averageScore}%`,
      icon: Target,
      color: 'purple',
      change: '+2.3%',
      changeType: 'increase'
    },
    {
      title: 'Файлов обработано',
      value: stats.totalFiles,
      icon: FileText,
      color: 'orange',
      change: '+15%',
      changeType: 'increase'
    },
    {
      title: 'В этом месяце',
      value: stats.thisMonth,
      icon: Clock,
      color: 'cyan',
      change: '+5',
      changeType: 'increase'
    },
    {
      title: 'Точность AI',
      value: `${stats.accuracy}%`,
      icon: Zap,
      color: 'yellow',
      change: '+1.2%',
      changeType: 'increase'
    }
  ];

  const getColorClasses = (color: string) => {
    const colors = {
      blue: {
        bg: isDarkMode ? 'bg-blue-500/10' : 'bg-blue-50',
        border: isDarkMode ? 'border-blue-500/20' : 'border-blue-200',
        icon: 'text-blue-500',
        change: 'text-blue-600'
      },
      green: {
        bg: isDarkMode ? 'bg-green-500/10' : 'bg-green-50',
        border: isDarkMode ? 'border-green-500/20' : 'border-green-200',
        icon: 'text-green-500',
        change: 'text-green-600'
      },
      purple: {
        bg: isDarkMode ? 'bg-purple-500/10' : 'bg-purple-50',
        border: isDarkMode ? 'border-purple-500/20' : 'border-purple-200',
        icon: 'text-purple-500',
        change: 'text-purple-600'
      },
      orange: {
        bg: isDarkMode ? 'bg-orange-500/10' : 'bg-orange-50',
        border: isDarkMode ? 'border-orange-500/20' : 'border-orange-200',
        icon: 'text-orange-500',
        change: 'text-orange-600'
      },
      cyan: {
        bg: isDarkMode ? 'bg-cyan-500/10' : 'bg-cyan-50',
        border: isDarkMode ? 'border-cyan-500/20' : 'border-cyan-200',
        icon: 'text-cyan-500',
        change: 'text-cyan-600'
      },
      yellow: {
        bg: isDarkMode ? 'bg-yellow-500/10' : 'bg-yellow-50',
        border: isDarkMode ? 'border-yellow-500/20' : 'border-yellow-200',
        icon: 'text-yellow-500',
        change: 'text-yellow-600'
      }
    };
    return colors[color as keyof typeof colors];
  };

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Статистика анализа</h2>
          <p className={`text-sm ${
            isDarkMode ? 'text-gray-400' : 'text-gray-600'
          }`}>
            Ключевые метрики производительности системы
          </p>
        </div>
        <div className={`px-4 py-2 rounded-lg ${
          isDarkMode ? 'bg-gray-800' : 'bg-gray-100'
        }`}>
          <span className={`text-sm font-medium ${
            isDarkMode ? 'text-gray-300' : 'text-gray-700'
          }`}>
            Последние 30 дней
          </span>
        </div>
      </div>

      {/* Карточки статистики */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((card, index) => {
          const Icon = card.icon;
          const colors = getColorClasses(card.color);
          
          return (
            <div
              key={index}
              className={`p-6 rounded-2xl border backdrop-blur-md transition-all hover:scale-105 ${
                isDarkMode 
                  ? 'bg-white/[0.02] border-gray-800 hover:border-gray-700' 
                  : 'bg-white border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-xl ${colors.bg} ${colors.border} border`}>
                  <Icon className={`w-6 h-6 ${colors.icon}`} />
                </div>
                <div className={`flex items-center space-x-1 text-sm font-medium ${
                  card.changeType === 'increase' ? colors.change : 'text-red-500'
                }`}>
                  <TrendingUp className="w-4 h-4" />
                  <span>{card.change}</span>
                </div>
              </div>
              
              <div className="mb-2">
                <div className="text-3xl font-bold">{card.value}</div>
                <div className={`text-sm ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  {card.title}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Дополнительная статистика */}
      <div className={`p-6 rounded-2xl backdrop-blur-md border ${
        isDarkMode 
          ? 'bg-white/[0.02] border-gray-800' 
          : 'bg-white border-gray-200'
      }`}>
        <h3 className="text-lg font-semibold mb-4">Прогресс месяца</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className={`text-sm ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Цель анализов
              </span>
              <span className="text-sm font-medium">200</span>
            </div>
            <div className={`w-full h-2 rounded-full ${
              isDarkMode ? 'bg-gray-800' : 'bg-gray-200'
            }`}>
              <div 
                className="h-2 bg-blue-500 rounded-full transition-all"
                style={{ width: `${(stats.thisMonth / 200) * 100}%` }}
              ></div>
            </div>
          </div>
          
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className={`text-sm ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Точность AI
              </span>
              <span className="text-sm font-medium">{stats.accuracy}%</span>
            </div>
            <div className={`w-full h-2 rounded-full ${
              isDarkMode ? 'bg-gray-800' : 'bg-gray-200'
            }`}>
              <div 
                className="h-2 bg-green-500 rounded-full transition-all"
                style={{ width: `${stats.accuracy}%` }}
              ></div>
            </div>
          </div>
          
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className={`text-sm ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Средний балл
              </span>
              <span className="text-sm font-medium">{stats.averageScore}%</span>
            </div>
            <div className={`w-full h-2 rounded-full ${
              isDarkMode ? 'bg-gray-800' : 'bg-gray-200'
            }`}>
              <div 
                className="h-2 bg-purple-500 rounded-full transition-all"
                style={{ width: `${stats.averageScore}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KPAnalyzerStats; 