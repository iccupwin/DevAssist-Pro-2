/**
 * Заголовок KP анализатора
 * Навигация, пользователь, переключатель темы
 */

import React from 'react';
import { 
  ArrowLeft, 
  User, 
  LogOut, 
  Sun, 
  Moon,
  Bell,
  Search,
  Settings
} from 'lucide-react';

interface KPAnalyzerHeaderProps {
  user: any;
  isDarkMode: boolean;
  toggleTheme: () => void;
  onLogout: () => void;
  onBackToDashboard: () => void;
}

const KPAnalyzerHeader: React.FC<KPAnalyzerHeaderProps> = ({
  user,
  isDarkMode,
  toggleTheme,
  onLogout,
  onBackToDashboard
}) => {
  return (
    <header className={`sticky top-0 z-50 border-b backdrop-blur-md ${
      isDarkMode 
        ? 'bg-gray-950/80 border-gray-800' 
        : 'bg-white/80 border-gray-200'
    }`}>
      <div className="flex items-center justify-between px-6 py-4">
        {/* Левая часть - навигация */}
        <div className="flex items-center space-x-4">
          <button
            onClick={onBackToDashboard}
            className={`p-2 rounded-lg transition-colors ${
              isDarkMode 
                ? 'hover:bg-gray-800 text-gray-300 hover:text-white' 
                : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
            }`}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          
          <div className="flex items-center space-x-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              isDarkMode ? 'bg-blue-600' : 'bg-blue-500'
            }`}>
              <span className="text-white font-semibold text-sm">КП</span>
            </div>
            <div>
              <h1 className="text-xl font-bold">КП Анализатор</h1>
              <p className={`text-sm ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                AI-powered анализ коммерческих предложений
              </p>
            </div>
          </div>
        </div>

        {/* Центральная часть - поиск */}
        <div className="flex-1 max-w-md mx-8">
          <div className={`relative ${
            isDarkMode ? 'bg-gray-800' : 'bg-gray-100'
          } rounded-lg`}>
            <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${
              isDarkMode ? 'text-gray-400' : 'text-gray-500'
            }`} />
            <input
              type="text"
              placeholder="Поиск анализов..."
              className={`w-full pl-10 pr-4 py-2 bg-transparent border-none outline-none text-sm ${
                isDarkMode ? 'text-white placeholder-gray-400' : 'text-gray-900 placeholder-gray-500'
              }`}
            />
          </div>
        </div>

        {/* Правая часть - пользователь и действия */}
        <div className="flex items-center space-x-3">
          {/* Уведомления */}
          <button className={`p-2 rounded-lg transition-colors relative ${
            isDarkMode 
              ? 'hover:bg-gray-800 text-gray-300 hover:text-white' 
              : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
          }`}>
            <Bell className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
          </button>

          {/* Переключатель темы */}
          <button
            onClick={toggleTheme}
            className={`p-2 rounded-lg transition-colors ${
              isDarkMode 
                ? 'hover:bg-gray-800 text-gray-300 hover:text-white' 
                : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
            }`}
          >
            {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>

          {/* Настройки */}
          <button className={`p-2 rounded-lg transition-colors ${
            isDarkMode 
              ? 'hover:bg-gray-800 text-gray-300 hover:text-white' 
              : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
          }`}>
            <Settings className="w-5 h-5" />
          </button>

          {/* Пользователь */}
          <div className="flex items-center space-x-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium">
                {user?.name || user?.email || 'Пользователь'}
              </p>
              <p className={`text-xs ${
                isDarkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>
                {user?.role || 'Аналитик'}
              </p>
            </div>
            
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              isDarkMode ? 'bg-gray-800' : 'bg-gray-200'
            }`}>
              <User className="w-5 h-5" />
            </div>
            
            <button
              onClick={onLogout}
              className={`p-2 rounded-lg transition-colors ${
                isDarkMode 
                  ? 'hover:bg-gray-800 text-gray-300 hover:text-white' 
                  : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
              }`}
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default KPAnalyzerHeader; 