/**
 * Сайдбар KP анализатора в стиле Dashboard
 * Лого вверху, кнопка "Новый анализ", история анализов и профиль внизу
 */

import React, { useState } from 'react';
import { 
  Plus,
  History,
  FileText,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  Trash2,
  Download,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  User,
  LogOut,
  Search
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';

const logoLight = '/devent-logo.png';
const logoDark = '/devent-logo-white1.png';

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
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();

  const handleToggle = () => {
    if (onCollapse) {
      onCollapse();
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/auth/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const getStatusIcon = (status: AnalysisHistoryItem['status']) => {
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

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
        {!isCollapsed && (
          <div className="flex items-center space-x-3">
            <img 
              src={isDarkMode ? logoDark : logoLight} 
              alt="DevAssist Pro" 
              className="w-8 h-8 rounded-lg"
            />
            <div>
              <h1 className="text-lg font-bold text-gray-900 dark:text-white">DevAssist</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">Pro</p>
            </div>
          </div>
        )}
        {isCollapsed && (
          <img 
            src={isDarkMode ? logoDark : logoLight} 
            alt="DevAssist Pro" 
            className="w-8 h-8 rounded-lg mx-auto"
          />
        )}
        <button
          onClick={handleToggle}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          {isCollapsed ? (
            <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          ) : (
            <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          )}
        </button>
      </div>

      {/* New Analysis Button */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={onNewAnalysis}
          className={`w-full flex items-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium ${
            isCollapsed ? 'justify-center' : 'justify-start space-x-3'
          }`}
          title={isCollapsed ? 'Новый анализ' : ''}
        >
          <Plus className="w-5 h-5 flex-shrink-0" />
          {!isCollapsed && <span>Новый анализ</span>}
        </button>
      </div>

      {/* History Section */}
      <div className="flex-1 overflow-y-auto px-4 py-2">
        <div className="mb-4">
          {!isCollapsed && (
            <div className="flex items-center space-x-2 mb-4 px-3 py-2">
              <History className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                История анализов
              </h3>
            </div>
          )}
          {isCollapsed && (
            <div className="flex justify-center mb-4 py-2" title="История анализов">
              <History className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </div>
          )}
        </div>

        {history.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            {!isCollapsed && (
              <>
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                  Нет сохраненных анализов
                </p>
                <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">
                  Создайте новый анализ для начала работы
                </p>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-1">
            {history.map((item) => (
              <div 
                key={item.id} 
                className={`group rounded-lg transition-all duration-200 ${
                  currentAnalysisId === item.id 
                    ? 'bg-blue-50 dark:bg-blue-900/20' 
                    : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              >
                <button
                  onClick={() => onLoadHistory(item)}
                  className={`w-full flex items-center px-3 py-2.5 text-left transition-all duration-200 ${
                    isCollapsed ? 'justify-center' : 'justify-start'
                  }`}
                >
                  <div className={`flex items-center ${isCollapsed ? '' : 'space-x-3 w-full'}`}>
                    {getStatusIcon(item.status)}
                    {!isCollapsed && (
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {item.name}
                          </p>
                          <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {onExportHistory && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onExportHistory(item.id);
                                }}
                                className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
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
                              className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                              title="Удалить"
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </button>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 mt-1">
                          <Calendar className="w-3 h-3 text-gray-400" />
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {formatDate(item.date)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {item.kpCount} КП
                          </span>
                          <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                            {item.avgScore.toFixed(1)}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* User Profile */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
          {!isCollapsed && (
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {user?.name || 'Пользователь'}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {user?.email || 'user@example.com'}
                </p>
              </div>
            </div>
          )}
          <button
            onClick={handleLogout}
            className={`p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${
              isCollapsed ? 'w-full flex justify-center' : ''
            }`}
            title="Выйти"
          >
            <LogOut className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Mobile Toggle Button */}
      <button
        onClick={() => setIsMobileOpen(true)}
        className="fixed top-4 left-4 z-50 p-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg md:hidden"
      >
        <Menu className="w-5 h-5 text-gray-600 dark:text-gray-400" />
      </button>

      {/* Sidebar */}
      <div
        className={`
          fixed left-0 top-0 h-full bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 z-50
          transform transition-transform duration-300 ease-in-out
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0 md:static md:z-0
          ${isCollapsed ? 'w-16' : 'w-80'}
        `}
      >
        <SidebarContent />
      </div>
    </>
  );
};

export default KPAnalyzerSidebar;