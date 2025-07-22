/**
 * КП Анализатор - главная страница модуля
 * Обновленная версия с новыми компонентами из папки tender
 */

import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { AlertTriangle } from 'lucide-react';
import { KPAnalyzerMain } from '../components/kpAnalyzer/KPAnalyzerMain';
import { useTheme } from '../contexts/ThemeContext';
const logoLight = '/devent-logo.png';
const logoDark = '/devent-logo-white1.png';

const KPAnalyzer: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const { isDarkMode } = useTheme();

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="bg-gray-900 p-8 rounded-lg text-white max-w-md text-center">
          <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-4">Требуется авторизация</h2>
          <p className="text-gray-300 mb-6">
            Для использования КП Анализатора необходимо войти в систему
          </p>
          <button 
            onClick={() => window.location.href = '/auth'}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg"
          >
            Войти в систему
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Логотип и возврат на dashboard */}
      <div className="max-w-7xl mx-auto flex items-center pt-6 pb-2 px-4">
        <button
          onClick={() => window.location.href = '/dashboard'}
          className="flex items-center space-x-2 group focus:outline-none"
          aria-label="На главную"
        >
          <img
            src={isDarkMode ? logoDark : logoLight}
            alt="DevAssist Pro"
            className="w-10 h-10 rounded-lg shadow-md group-hover:scale-105 transition-transform"
          />
          <span className="text-lg font-bold text-gray-700 dark:text-white group-hover:text-blue-600 transition-colors">DevAssist Pro</span>
        </button>
      </div>
      <KPAnalyzerMain />
    </div>
  );
};

export default KPAnalyzer;