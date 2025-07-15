/**
 * ActivityFeedItem - Компонент для отображения отдельного элемента активности
 * Согласно ТЗ DevAssist Pro - Recent activity feed
 */

import React from 'react';
import { Activity, ActivityType } from '../../types/shared';
import { activityService } from '../../services/activityService';

interface ActivityFeedItemProps {
  activity: Activity;
  showProject?: boolean;
  className?: string;
}

export const ActivityFeedItem: React.FC<ActivityFeedItemProps> = ({
  activity,
  showProject = true,
  className = ''
}) => {
  const icon = activityService.getActivityIcon(activity.type);
  const color = activityService.getActivityColor(activity.type);
  const relativeTime = activityService.formatRelativeTime(activity.created_at);

  const getActivityDetails = () => {
    const metadata = activity.project_metadata || {};
    
    switch (activity.type) {
      case ActivityType.ANALYSIS_COMPLETED:
        return (
          <div className="flex items-center gap-2 mt-1">
            {metadata.compliance_score && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                Соответствие: {metadata.compliance_score}%
              </span>
            )}
            {metadata.total_amount && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                {new Intl.NumberFormat('ru-RU', { 
                  style: 'currency', 
                  currency: 'RUB' 
                }).format(metadata.total_amount)}
              </span>
            )}
          </div>
        );
      
      case ActivityType.DOCUMENT_UPLOADED:
        return (
          <div className="flex items-center gap-2 mt-1">
            {metadata.pages_count && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-700">
                {metadata.pages_count} стр.
              </span>
            )}
            {metadata.document_size && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-700">
                {(metadata.document_size / 1024 / 1024).toFixed(1)} МБ
              </span>
            )}
          </div>
        );
      
      case ActivityType.ANALYSIS_STARTED:
        return (
          <div className="flex items-center gap-2 mt-1">
            {metadata.ai_model && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-800">
                {metadata.ai_model}
              </span>
            )}
            {metadata.documents_count && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800">
                {metadata.documents_count} документов
              </span>
            )}
          </div>
        );
      
      case ActivityType.REPORT_GENERATED:
        return (
          <div className="flex items-center gap-2 mt-1">
            {metadata.format && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-indigo-100 text-indigo-800">
                {metadata.format.toUpperCase()}
              </span>
            )}
            {metadata.file_size && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-700">
                {(metadata.file_size / 1024 / 1024).toFixed(1)} МБ
              </span>
            )}
          </div>
        );
      
      default:
        return null;
    }
  };

  const getActionButton = () => {
    switch (activity.type) {
      case ActivityType.ANALYSIS_COMPLETED:
        return (
          <button className="text-xs text-blue-600 hover:text-blue-800 hover:underline">
            Посмотреть результат
          </button>
        );
      
      case ActivityType.REPORT_GENERATED:
        return (
          <button className="text-xs text-purple-600 hover:text-purple-800 hover:underline">
            Скачать отчёт
          </button>
        );
      
      case ActivityType.DOCUMENT_UPLOADED:
        return (
          <button className="text-xs text-green-600 hover:text-green-800 hover:underline">
            Открыть документ
          </button>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className={`group relative ${className}`}>
      {/* Timeline dot */}
      <div className="absolute left-0 top-3 w-2 h-2 bg-gray-300 rounded-full group-hover:bg-blue-500 transition-colors"></div>
      
      {/* Content */}
      <div className="ml-6 pb-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            {/* Activity header */}
            <div className="flex items-center gap-2">
              <span className="text-lg">{icon}</span>
              <h4 className={`text-sm font-medium ${color}`}>
                {activity.title}
              </h4>
              <span className="text-xs text-gray-500 whitespace-nowrap">
                {relativeTime}
              </span>
            </div>
            
            {/* Activity description */}
            <p className="text-sm text-gray-600 mt-1 leading-relaxed">
              {activity.description}
            </p>
            
            {/* Activity details */}
            {getActivityDetails()}
            
            {/* Project info */}
            {showProject && activity.project && (
              <div className="mt-2">
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-50 text-gray-600">
                  🏗️ {activity.project.name}
                </span>
              </div>
            )}
          </div>
          
          {/* Action button */}
          <div className="ml-4 flex-shrink-0">
            {getActionButton()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActivityFeedItem;