/**
 * RecentActivityFeed - Компонент ленты активности пользователя
 * Согласно ТЗ DevAssist Pro - Recent activity feed
 */

import React, { useState, useEffect } from 'react';
import { Activity, ActivityType, ActivityFeedRequest } from '../../types/shared';
import { activityService } from '../../services/activityService';
import ActivityFeedItem from './ActivityFeedItem';
import LoadingSpinner from '../ui/LoadingSpinner';

interface RecentActivityFeedProps {
  projectId?: number;
  limit?: number;
  showFilters?: boolean;
  showHeader?: boolean;
  className?: string;
  autoRefresh?: boolean;
  refreshInterval?: number; // в секундах
}

export const RecentActivityFeed: React.FC<RecentActivityFeedProps> = ({
  projectId,
  limit = 10,
  showFilters = true,
  showHeader = true,
  className = '',
  autoRefresh = false,
  refreshInterval = 30
}) => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState<ActivityFeedRequest>({
    limit,
    offset: 0
  });

  // Загрузка активности
  const loadActivity = async (params: ActivityFeedRequest = filters) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = projectId 
        ? await activityService.getProjectActivity(projectId, params)
        : await activityService.getActivityFeed(params);
      
      if (params.offset === 0) {
        setActivities(response.activities);
      } else {
        setActivities(prev => [...prev, ...response.activities]);
      }
      
      setHasMore(response.has_more);
      setTotal(response.total);
    } catch (err) {
      setError('Ошибка загрузки активности');
      console.error('Error loading activity:', err);
    } finally {
      setLoading(false);
    }
  };

  // Первичная загрузка
  useEffect(() => {
    loadActivity({ ...filters, offset: 0 });
  }, [projectId, filters.activity_type, filters.limit]);

  // Автообновление
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      loadActivity({ ...filters, offset: 0 });
    }, refreshInterval * 1000);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, filters]);

  // Загрузка дополнительных данных
  const loadMore = () => {
    if (!hasMore || loading) return;
    
    const newFilters = {
      ...filters,
      offset: activities.length
    };
    
    setFilters(newFilters);
    loadActivity(newFilters);
  };

  // Фильтрация по типу активности
  const handleFilterChange = (activityType?: ActivityType) => {
    const newFilters = {
      ...filters,
      activity_type: activityType,
      offset: 0
    };
    setFilters(newFilters);
  };

  // Обновление
  const handleRefresh = () => {
    loadActivity({ ...filters, offset: 0 });
  };

  const filterOptions = [
    { value: undefined, label: 'Все события' },
    { value: ActivityType.DOCUMENT_UPLOADED, label: 'Загрузка документов' },
    { value: ActivityType.ANALYSIS_STARTED, label: 'Начало анализа' },
    { value: ActivityType.ANALYSIS_COMPLETED, label: 'Завершение анализа' },
    { value: ActivityType.REPORT_GENERATED, label: 'Создание отчётов' },
    { value: ActivityType.PROJECT_CREATED, label: 'Создание проектов' },
    { value: ActivityType.SETTINGS_UPDATED, label: 'Изменение настроек' },
  ];

  if (error) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border p-6 ${className}`}>
        <div className="text-center">
          <div className="text-red-500 mb-2">⚠️</div>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Попробовать снова
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border ${className}`}>
      {/* Header */}
      {showHeader && (
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Последняя активность
              </h3>
              {total > 0 && (
                <p className="text-sm text-gray-500 mt-1">
                  Всего событий: {total}
                </p>
              )}
            </div>
            
            <div className="flex items-center gap-3">
              {autoRefresh && (
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  Автообновление
                </div>
              )}
              
              <button
                onClick={handleRefresh}
                disabled={loading}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
                title="Обновить"
              >
                <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>
          </div>
          
          {/* Filters */}
          {showFilters && (
            <div className="mt-4">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm text-gray-500">Фильтр:</span>
                {filterOptions.map((option) => (
                  <button
                    key={option.label}
                    onClick={() => handleFilterChange(option.value)}
                    className={`px-3 py-1 rounded-full text-xs transition-colors ${
                      filters.activity_type === option.value
                        ? 'bg-blue-100 text-blue-800 border-blue-200'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border-gray-200'
                    } border`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Content */}
      <div className="p-6">
        {loading && activities.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <LoadingSpinner size="md" />
            <span className="ml-3 text-gray-500">Загружаем активность...</span>
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-400 text-4xl mb-4">📋</div>
            <h4 className="text-lg font-medium text-gray-900 mb-2">
              Активность не найдена
            </h4>
            <p className="text-gray-500">
              {filters.activity_type 
                ? 'Нет событий выбранного типа' 
                : 'Пока нет активности для отображения'
              }
            </p>
          </div>
        ) : (
          <>
            {/* Timeline */}
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-1 top-0 bottom-0 w-px bg-gray-200"></div>
              
              {/* Activity items */}
              <div className="space-y-1">
                {activities.map((activity, index) => (
                  <ActivityFeedItem
                    key={`${activity.id}-${index}`}
                    activity={activity}
                    showProject={!projectId}
                  />
                ))}
              </div>
            </div>
            
            {/* Load more */}
            {hasMore && (
              <div className="mt-6 text-center">
                <button
                  onClick={loadMore}
                  disabled={loading}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <LoadingSpinner size="sm" />
                      Загружаем...
                    </div>
                  ) : (
                    'Показать ещё'
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default RecentActivityFeed;