/**
 * ScoreBadge Component
 * Displays scores with color-coded styling and visual indicators
 */

import React from 'react';
import { CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import { getScoreColor } from '../../utils/currencyUtils';

interface ScoreBadgeProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  showLabel?: boolean;
  label?: string;
  className?: string;
}

export const ScoreBadge: React.FC<ScoreBadgeProps> = ({
  score,
  size = 'md',
  showIcon = true,
  showLabel = false,
  label,
  className = ''
}) => {
  const getIcon = () => {
    if (score >= 80) return <CheckCircle className="w-4 h-4" />;
    if (score >= 60) return <AlertTriangle className="w-4 h-4" />;
    return <XCircle className="w-4 h-4" />;
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm': return 'px-2 py-1 text-xs';
      case 'lg': return 'px-4 py-2 text-base';
      default: return 'px-3 py-1.5 text-sm';
    }
  };

  const colorClasses = getScoreColor(score);

  return (
    <div className={`inline-flex items-center rounded-full font-medium border ${colorClasses} ${getSizeClasses()} ${className}`}>
      {showIcon && (
        <span className="mr-1.5">
          {getIcon()}
        </span>
      )}
      <span className="font-bold">{score}</span>
      <span className="ml-0.5 opacity-75">%</span>
      {showLabel && label && (
        <span className="ml-2 opacity-75">{label}</span>
      )}
    </div>
  );
};

export default ScoreBadge;