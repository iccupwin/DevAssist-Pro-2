/**
 * Сайдбар KP анализатора в стиле Claude
 * Кнопка "Новый анализ" сверху и история анализов снизу
 */

import React, { useState } from 'react';
import { 
  Plus,
  History,
  FileText,
  Calendar,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  Trash2,
  Download,
  Menu,
  X,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

export interface AnalysisHistoryItem {
  id: string;
  name: string;
  date: string;
  tzName: string;
  kpCount: number;
  avgScore: number;
  status: 'completed' | 'in-progress' | 'failed';
  results?: any[];
  comparisonResult?: any;
}

interface KPAnalyzerSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  onNewAnalysis: () => void;
  onLoadHistory: (historyItem: AnalysisHistoryItem) => void;
  onDeleteHistory: (id: string) => void;
  onExportHistory?: (id: string) => void;
  history: AnalysisHistoryItem[];
  currentAnalysisId?: string;
  isCollapsed?: boolean;
  onCollapse?: () => void;
}

const KPAnalyzerSidebar: React.FC<KPAnalyzerSidebarProps> = ({
  isOpen,
  onToggle,
  onNewAnalysis,
  onLoadHistory,
  onDeleteHistory,
  onExportHistory,
  history,
  currentAnalysisId,
  isCollapsed = false,
  onCollapse
}) => {
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'in-progress':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <FileText className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-500';
      case 'in-progress':
        return 'text-yellow-500';
      case 'failed':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Сегодня';
    if (diffDays === 1) return 'Вчера';
    if (diffDays < 7) return `${diffDays} дн. назад`;
    return date.toLocaleDateString('ru-RU', { 
      day: 'numeric', 
      month: 'short',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  return (
    <>
      {/* Backdrop для мобильных устройств */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}
      
      {/* Кнопка для открытия меню на мобильных */}
      <button
        onClick={onToggle}
        className="fixed top-4 left-4 z-50 lg:hidden p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg"
      >
        {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>
      
      {/* Sidebar */}
      <div className={`
        fixed left-0 top-0 h-full bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 
        transform transition-all duration-300 ease-in-out z-50 relative
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:z-0
        ${isCollapsed ? 'w-16' : 'w-80'}
        group/sidebar hover:shadow-lg
      `}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              {!isCollapsed && (
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  КП Анализатор
                </h2>
              )}
              {isCollapsed && (
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-white" />
                </div>
              )}
              <button
                onClick={onToggle}
                className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
            </div>
          </div>

          {/* New Analysis Button */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={onNewAnalysis}
              className={`w-full flex items-center gap-3 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium ${
                isCollapsed ? 'justify-center' : ''
              }`}
              title={isCollapsed ? 'Новый анализ' : ''}
            >
              <Plus className="w-5 h-5" />
              {!isCollapsed && 'Новый анализ'}
            </button>
          </div>

          {/* History Section */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-4">
              {!isCollapsed && (
                <div className="flex items-center gap-2 mb-4">
                  <History className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    История анализов
                  </h3>
                </div>
              )}
              {isCollapsed && (
                <div className="flex justify-center mb-4" title="История анализов">
                  <History className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </div>
              )}

              {history.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  {!isCollapsed && (
                    <>
                      <p className="text-gray-500 dark:text-gray-400 text-sm">
                        Пока нет анализов
                      </p>
                      <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">
                        Создайте первый анализ
                      </p>
                    </>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  {history.map((item) => (
                    <div
                      key={item.id}
                      className={`
                        relative group rounded-lg border transition-all duration-200 cursor-pointer
                        ${item.id === currentAnalysisId 
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                        }
                      `}
                      onMouseEnter={() => setHoveredItem(item.id)}
                      onMouseLeave={() => setHoveredItem(null)}
                      onClick={() => onLoadHistory(item)}
                      title={isCollapsed ? item.name : ''}
                    >
                      <div className={`p-3 ${isCollapsed ? 'px-2' : ''}`}>
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className={getStatusColor(item.status)}>
                              {getStatusIcon(item.status)}
                            </div>
                            {!isCollapsed && (
                              <span className="font-medium text-gray-900 dark:text-white text-sm truncate">
                                {item.name}
                              </span>
                            )}
                          </div>
                          
                          {hoveredItem === item.id && !isCollapsed && (
                            <div className="flex items-center gap-1">
                              {onExportHistory && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onExportHistory(item.id);
                                  }}
                                  className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                                  title="Экспорт"
                                >
                                  <Download className="w-4 h-4 text-gray-500" />
                                </button>
                              )}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDeleteHistory(item.id);
                                }}
                                className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors"
                                title="Удалить"
                              >
                                <Trash2 className="w-4 h-4 text-red-500" />
                              </button>
                            </div>
                          )}
                        </div>

                        {!isCollapsed && (
                          <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
                            <div className="flex items-center gap-1">
                              <FileText className="w-3 h-3" />
                              <span className="truncate">{item.tzName}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                <span>{formatDate(item.date)}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span>{item.kpCount} КП</span>
                                {item.status === 'completed' && (
                                  <span className="text-green-600 dark:text-green-400 font-medium">
                                    {item.avgScore}%
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            {!isCollapsed && (
              <div className="text-center text-xs text-gray-500 dark:text-gray-400">
                DevAssist Pro • КП Анализатор
              </div>
            )}
            {isCollapsed && (
              <div className="text-center">
                <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center mx-auto">
                  <span className="text-white text-xs font-bold">DA</span>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Кнопка скрытия/разворачивания на границе */}
        {isOpen && onCollapse && (
          <button
            onClick={onCollapse}
            className={`
              absolute -right-3 top-1/2 transform -translate-y-1/2 
              w-6 h-10 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 
              rounded-r-lg shadow-lg hover:shadow-xl transition-all duration-200
              flex items-center justify-center group
              hover:bg-gray-50 dark:hover:bg-gray-700
              hover:border-gray-300 dark:hover:border-gray-600
              hover:w-7 hover:-right-3.5
              z-10 hidden lg:flex
              opacity-0 group-hover/sidebar:opacity-100
              ${isCollapsed ? 'opacity-100' : ''}
            `}
            title={isCollapsed ? 'Развернуть сайдбар' : 'Свернуть сайдбар'}
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4 text-gray-600 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
            ) : (
              <ChevronLeft className="w-4 h-4 text-gray-600 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
            )}
          </button>
        )}
      </div>
    </>
  );
};

export default KPAnalyzerSidebar; 