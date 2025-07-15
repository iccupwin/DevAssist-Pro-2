import React from 'react';
import { LucideIcon } from 'lucide-react';

interface ProfileStatProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  color?: 'blue' | 'green' | 'purple' | 'orange' | 'red';
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

interface ProfileStatsProps {
  stats: ProfileStatProps[];
  className?: string;
}

const ProfileStats: React.FC<ProfileStatsProps> = ({ stats, className = '' }) => {
  const colorClasses = {
    blue: 'text-blue-600 bg-blue-50',
    green: 'text-green-600 bg-green-50',
    purple: 'text-purple-600 bg-purple-50',
    orange: 'text-orange-600 bg-orange-50',
    red: 'text-red-600 bg-red-50',
  };

  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 ${className}`}>
      {stats.map((stat, index) => (
        <div key={index} className="bg-white/60 backdrop-blur-sm rounded-2xl border border-white/20 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className={`
              w-12 h-12 rounded-xl flex items-center justify-center
              ${stat.color ? colorClasses[stat.color] : colorClasses.blue}
            `}>
              {stat.icon && <stat.icon className="w-6 h-6" />}
            </div>
            
            {stat.trend && (
              <div className={`
                flex items-center text-sm font-medium
                ${stat.trend.isPositive ? 'text-green-600' : 'text-red-600'}
              `}>
                <span className={`
                  inline-block w-0 h-0 mr-1
                  ${stat.trend.isPositive 
                    ? 'border-l-2 border-r-2 border-b-2 border-l-transparent border-r-transparent border-b-green-600'
                    : 'border-l-2 border-r-2 border-t-2 border-l-transparent border-r-transparent border-t-red-600'
                  }
                `}></span>
                {Math.abs(stat.trend.value)}%
              </div>
            )}
          </div>
          
          <div>
            <h4 className="text-sm font-medium text-gray-600 mb-1">{stat.title}</h4>
            <p className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</p>
            {stat.subtitle && (
              <p className="text-sm text-gray-500">{stat.subtitle}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ProfileStats;