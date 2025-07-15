/**
 * Activity Service - API интеграция для получения активности пользователя
 * Согласно ТЗ DevAssist Pro
 */

import { Activity, ActivityFeedRequest, ActivityFeedResponse, ActivityType } from '../types/shared';
import { apiClient } from './apiClient';

export class ActivityService {
  private baseUrl = '/activity';

  /**
   * Получить ленту активности пользователя
   */
  async getActivityFeed(params: ActivityFeedRequest = {}): Promise<ActivityFeedResponse> {
    try {
      const response = await apiClient.get<ActivityFeedResponse>(this.baseUrl, params);
      return response.data;
    } catch (error) {
      console.error('Error fetching activity feed:', error);
      // Возвращаем mock данные для разработки
      return this.getMockActivityFeed(params);
    }
  }

  /**
   * Получить активность для конкретного проекта
   */
  async getProjectActivity(projectId: number, params: ActivityFeedRequest = {}): Promise<ActivityFeedResponse> {
    try {
      const response = await apiClient.get<ActivityFeedResponse>(`${this.baseUrl}/project/${projectId}`, params);
      return response.data;
    } catch (error) {
      console.error('Error fetching project activity:', error);
      return this.getMockActivityFeed({ ...params, project_id: projectId });
    }
  }

  /**
   * Создать новую запись активности
   */
  async createActivity(activity: Omit<Activity, 'id' | 'created_at' | 'updated_at'>): Promise<Activity> {
    try {
      const response = await apiClient.post<Activity>(this.baseUrl, activity);
      return response.data;
    } catch (error) {
      console.error('Error creating activity:', error);
      throw error;
    }
  }

  /**
   * Mock данные для разработки
   */
  private getMockActivityFeed(params: ActivityFeedRequest): ActivityFeedResponse {
    const mockActivities: Activity[] = [
      {
        id: 1,
        type: ActivityType.ANALYSIS_COMPLETED,
        title: 'Анализ КП завершён',
        description: 'Анализ коммерческого предложения от ООО "СтройКомплект" успешно завершён',
        user_id: 1,
        project_id: 1,
        document_id: 15,
        analysis_id: 5,
        created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 минут назад
        updated_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        project_metadata: {
          compliance_score: 85,
          total_amount: 2500000
        }
      },
      {
        id: 2,
        type: ActivityType.DOCUMENT_UPLOADED,
        title: 'Документ загружен',
        description: 'Техническое задание "Строительство жилого комплекса" загружено в систему',
        user_id: 1,
        project_id: 1,
        document_id: 14,
        created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 часа назад
        updated_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        project_metadata: {
          document_size: 2456789,
          pages_count: 45
        }
      },
      {
        id: 3,
        type: ActivityType.REPORT_GENERATED,
        title: 'Отчёт сформирован',
        description: 'Сравнительный отчёт по результатам анализа КП экспортирован в PDF',
        user_id: 1,
        project_id: 1,
        analysis_id: 4,
        created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 часа назад
        updated_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        project_metadata: {
          report_type: 'comparative_analysis',
          format: 'pdf',
          file_size: 1234567
        }
      },
      {
        id: 4,
        type: ActivityType.ANALYSIS_STARTED,
        title: 'Анализ запущен',
        description: 'Начат анализ 3 коммерческих предложений с использованием Claude-3.5-Sonnet',
        user_id: 1,
        project_id: 1,
        analysis_id: 4,
        created_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6 часов назад
        updated_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
        project_metadata: {
          ai_model: 'claude-3.5-sonnet',
          documents_count: 3,
          analysis_type: 'comprehensive'
        }
      },
      {
        id: 5,
        type: ActivityType.PROJECT_CREATED,
        title: 'Проект создан',
        description: 'Новый проект "ЖК Северный" создан и настроен для анализа КП',
        user_id: 1,
        project_id: 1,
        created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 день назад
        updated_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        project_metadata: {
          project_type: 'residential',
          budget_range: '50M-100M'
        }
      },
      {
        id: 6,
        type: ActivityType.SETTINGS_UPDATED,
        title: 'Настройки обновлены',
        description: 'Обновлены настройки AI модели для анализа КП',
        user_id: 1,
        created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 дня назад
        updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        project_metadata: {
          settings_changed: ['ai_model', 'analysis_depth', 'notification_preferences']
        }
      }
    ];

    // Фильтрация по параметрам
    let filteredActivities = mockActivities;
    
    if (params.project_id) {
      filteredActivities = filteredActivities.filter(a => a.project_id === params.project_id);
    }
    
    if (params.activity_type) {
      filteredActivities = filteredActivities.filter(a => a.type === params.activity_type);
    }

    if (params.user_id) {
      filteredActivities = filteredActivities.filter(a => a.user_id === params.user_id);
    }

    // Пагинация
    const limit = params.limit || 10;
    const offset = params.offset || 0;
    const paginatedActivities = filteredActivities.slice(offset, offset + limit);

    return {
      activities: paginatedActivities,
      total: filteredActivities.length,
      has_more: offset + limit < filteredActivities.length
    };
  }

  /**
   * Получить иконку для типа активности
   */
  getActivityIcon(type: ActivityType): string {
    const icons = {
      [ActivityType.DOCUMENT_UPLOADED]: '📄',
      [ActivityType.ANALYSIS_STARTED]: '🔄',
      [ActivityType.ANALYSIS_COMPLETED]: '✅',
      [ActivityType.REPORT_GENERATED]: '📊',
      [ActivityType.USER_REGISTERED]: '👤',
      [ActivityType.PROJECT_CREATED]: '🏗️',
      [ActivityType.SETTINGS_UPDATED]: '⚙️',
    };
    return icons[type] || '📋';
  }

  /**
   * Получить цвет для типа активности
   */
  getActivityColor(type: ActivityType): string {
    const colors = {
      [ActivityType.DOCUMENT_UPLOADED]: 'text-blue-600',
      [ActivityType.ANALYSIS_STARTED]: 'text-yellow-600',
      [ActivityType.ANALYSIS_COMPLETED]: 'text-green-600',
      [ActivityType.REPORT_GENERATED]: 'text-purple-600',
      [ActivityType.USER_REGISTERED]: 'text-indigo-600',
      [ActivityType.PROJECT_CREATED]: 'text-emerald-600',
      [ActivityType.SETTINGS_UPDATED]: 'text-gray-600',
    };
    return colors[type] || 'text-gray-500';
  }

  /**
   * Форматирование времени для отображения
   */
  formatRelativeTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return 'только что';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} мин назад`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} ч назад`;
    } else if (diffInSeconds < 2592000) {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} дн назад`;
    } else {
      return date.toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    }
  }
}

export const activityService = new ActivityService();