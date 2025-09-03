/**
 * ScoreCard Component - Modern UI for displaying analysis scores
 * Features color-coded scores, progress bars, and status badges
 */

import React from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Star,
  Award,
  AlertTriangle,
  Check,
  X
} from 'lucide-react';

export interface ScoreCardProps {
  title: string;
  score: number; // 0-100
  status?: 'excellent' | 'good' | 'average' | 'poor' | 'critical';
  icon?: React.ReactNode;
  description?: string;
  trend?: 'up' | 'down' | 'stable';
  compact?: boolean;
  className?: string;
  onClick?: () => void;
}

export const ScoreCard: React.FC<ScoreCardProps> = ({
  title,
  score,
  status,
  icon,
  description,
  trend,
  compact = false,
  className = '',
  onClick
}) => {
  // Calculate color scheme based on score
  const getScoreColor = (score: number) => {
    if (score >= 85) return {
      bg: 'bg-green-50 dark:bg-green-900/20',
      border: 'border-green-200 dark:border-green-800',
      text: 'text-green-700 dark:text-green-300',
      scoreText: 'text-green-800 dark:text-green-200',
      progress: 'bg-green-500',
      badge: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
    };
    if (score >= 70) return {
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      border: 'border-blue-200 dark:border-blue-800',
      text: 'text-blue-700 dark:text-blue-300',
      scoreText: 'text-blue-800 dark:text-blue-200',
      progress: 'bg-blue-500',
      badge: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300'
    };
    if (score >= 55) return {
      bg: 'bg-yellow-50 dark:bg-yellow-900/20',
      border: 'border-yellow-200 dark:border-yellow-800',
      text: 'text-yellow-700 dark:text-yellow-300',
      scoreText: 'text-yellow-800 dark:text-yellow-200',
      progress: 'bg-yellow-500',
      badge: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
    };
    if (score >= 40) return {
      bg: 'bg-orange-50 dark:bg-orange-900/20',
      border: 'border-orange-200 dark:border-orange-800',
      text: 'text-orange-700 dark:text-orange-300',
      scoreText: 'text-orange-800 dark:text-orange-200',
      progress: 'bg-orange-500',
      badge: 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300'
    };
    return {
      bg: 'bg-red-50 dark:bg-red-900/20',
      border: 'border-red-200 dark:border-red-800',
      text: 'text-red-700 dark:text-red-300',
      scoreText: 'text-red-800 dark:text-red-200',
      progress: 'bg-red-500',
      badge: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
    };
  };

  const getStatusText = (score: number, status?: string) => {
    if (status) {
      const statusMap = {
        excellent: 'Отлично',
        good: 'Хорошо', 
        average: 'Средне',
        poor: 'Плохо',
        critical: 'Критично'
      };
      return statusMap[status as keyof typeof statusMap] || 'Неизвестно';
    }
    
    if (score >= 85) return 'Отлично';
    if (score >= 70) return 'Хорошо';
    if (score >= 55) return 'Удовлетворительно';
    if (score >= 40) return 'Требует внимания';
    return 'Критично';
  };

  const getStatusIcon = (score: number) => {
    if (score >= 85) return <Award className="w-4 h-4" />;
    if (score >= 70) return <Star className="w-4 h-4" />;
    if (score >= 55) return <Check className="w-4 h-4" />;
    if (score >= 40) return <AlertTriangle className="w-4 h-4" />;
    return <X className="w-4 h-4" />;
  };

  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-3 h-3 text-green-500" />;
      case 'down':
        return <TrendingDown className="w-3 h-3 text-red-500" />;
      case 'stable':
        return <Minus className="w-3 h-3 text-gray-500" />;
      default:
        return null;
    }
  };

  const colors = getScoreColor(score);
  const statusText = getStatusText(score, status);
  const statusIcon = getStatusIcon(score);
  const trendIcon = getTrendIcon();

  return (
    <div
      className={`
        ${colors.bg} ${colors.border} border rounded-xl p-4 transition-all duration-200
        ${onClick ? 'cursor-pointer hover:shadow-md transform hover:scale-[1.02]' : ''}
        ${compact ? 'min-h-[120px]' : 'min-h-[140px]'}
        ${className}
      `}
      onClick={onClick}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          {icon && (
            <div className={`${colors.text} opacity-80`}>
              {icon}
            </div>
          )}
          <div>
            <h3 className={`font-semibold ${colors.text} ${compact ? 'text-sm' : 'text-base'}`}>
              {title}
            </h3>
            {description && (
              <p className={`text-xs ${colors.text} opacity-75 mt-1`}>
                {description}
              </p>
            )}
          </div>
        </div>
        {trendIcon && (
          <div className="flex items-center">
            {trendIcon}
          </div>
        )}
      </div>

      {/* Score Display */}
      <div className="flex items-center justify-between mb-3">
        <div className={`text-3xl font-bold ${colors.scoreText}`}>
          {score}
        </div>
        <div className={`
          px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1
          ${colors.badge}
        `}>
          {statusIcon}
          {statusText}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="relative">
        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div 
            className={`h-full ${colors.progress} transition-all duration-1000 ease-out`}
            style={{ width: `${Math.min(Math.max(score, 0), 100)}%` }}
          />
        </div>
        {/* Score markers */}
        <div className="absolute top-0 left-0 w-full h-2 flex">
          {[25, 50, 75].map((marker) => (
            <div
              key={marker}
              className="absolute top-0 w-px h-2 bg-white dark:bg-gray-800 opacity-50"
              style={{ left: `${marker}%` }}
            />
          ))}
        </div>
      </div>

      {/* Score scale indicators */}
      {!compact && (
        <div className="flex justify-between text-xs mt-2 opacity-60">
          <span className={colors.text}>0</span>
          <span className={colors.text}>25</span>
          <span className={colors.text}>50</span>
          <span className={colors.text}>75</span>
          <span className={colors.text}>100</span>
        </div>
      )}
    </div>
  );
};

export default ScoreCard;