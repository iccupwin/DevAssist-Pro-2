import React from 'react';
import { FileText, Sun, Moon } from 'lucide-react';

interface AuthLayoutProps {
  children: React.ReactNode;
  isDarkMode: boolean;
  onToggleTheme: () => void;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children, isDarkMode, onToggleTheme }) => {
  return (
    <div 
      className={`min-h-screen flex items-center justify-center p-4 transition-colors duration-300 ${
        isDarkMode 
          ? 'bg-black' 
          : 'bg-white'
      }`} 
      style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
    >
      <style dangerouslySetInnerHTML={{
        __html: `
          .theme-toggle {
            background: ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'};
            backdrop-filter: blur(10px);
            border: 1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)'};
            border-radius: 50%;
            width: 40px;
            height: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.3s ease;
            cursor: pointer;
          }
          
          .theme-toggle:hover {
            background: ${isDarkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)'};
            transform: scale(1.05);
          }
        `
      }} />

      {/* Theme Toggle Button - Fixed position */}
      <button
        onClick={onToggleTheme}
        className="theme-toggle fixed top-6 right-6 z-50"
        title={isDarkMode ? 'Переключить на светлую тему' : 'Переключить на тёмную тему'}
      >
        {isDarkMode ? (
          <Sun className="w-5 h-5 text-yellow-400" />
        ) : (
          <Moon className="w-5 h-5 text-gray-600" />
        )}
      </button>
      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 items-center">
        {/* Left side - Branding */}
        <div className="hidden lg:block space-y-8">
          {/* Logo and main heading */}
          <div className="space-y-6">
            <div className="flex items-center space-x-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors duration-300 ${
                isDarkMode ? 'bg-white' : 'bg-gray-900'
              }`}>
                <FileText className={`w-6 h-6 ${isDarkMode ? 'text-black' : 'text-white'}`} />
              </div>
              <h1 className={`text-5xl font-normal tracking-tight transition-colors duration-300 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                DevAssist Pro
              </h1>
            </div>
            
            <p className={`text-xl leading-relaxed max-w-lg transition-colors duration-300 ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Встречайте систему для современной разработки проектов в сфере недвижимости
            </p>
          </div>
          
          <div className="space-y-6">
            <div className="flex items-start space-x-4">
              <div className="w-8 h-8 bg-blue-500/10 border border-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              </div>
              <div>
                <h3 className={`text-lg font-medium mb-2 transition-colors duration-300 ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>Анализ с помощью ИИ</h3>
                <p className={`text-sm leading-relaxed transition-colors duration-300 ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  Интеграция с Claude 3.5 Sonnet и GPT-4o для максимальной точности анализа документов
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="w-8 h-8 bg-purple-500/10 border border-purple-500/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              </div>
              <div>
                <h3 className={`text-lg font-medium mb-2 transition-colors duration-300 ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>Специализация для недвижимости</h3>
                <p className={`text-sm leading-relaxed transition-colors duration-300 ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  Создан специально для застройщиков и девелоперов
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="w-8 h-8 bg-green-500/10 border border-green-500/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              </div>
              <div>
                <h3 className={`text-lg font-medium mb-2 transition-colors duration-300 ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>Модульная архитектура</h3>
                <p className={`text-sm leading-relaxed transition-colors duration-300 ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  Каждый модуль работает независимо в единой экосистеме
                </p>
              </div>
            </div>
          </div>

          {/* Decorative metrics card */}
          <div className={`rounded-xl p-6 transition-colors duration-300 ${
            isDarkMode 
              ? 'bg-gray-900 border border-gray-800' 
              : 'bg-gray-100 border border-gray-200'
          }`}>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className={`rounded-lg p-4 text-center transition-colors duration-300 ${
                isDarkMode ? 'bg-gray-800' : 'bg-gray-200'
              }`}>
                <div className={`text-2xl font-bold mb-1 transition-colors duration-300 ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>99.9%</div>
                <div className={`text-xs transition-colors duration-300 ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>Точность анализа</div>
              </div>
              <div className={`rounded-lg p-4 text-center transition-colors duration-300 ${
                isDarkMode ? 'bg-gray-800' : 'bg-gray-200'
              }`}>
                <div className={`text-2xl font-bold mb-1 transition-colors duration-300 ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>5x</div>
                <div className={`text-xs transition-colors duration-300 ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>Быстрее обработки</div>
              </div>
            </div>
            <div className={`text-center transition-colors duration-300 ${
              isDarkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>
              <p className="text-sm font-medium">Trusted by developers</p>
              <p className={`text-xs mt-1 transition-colors duration-300 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>Экономьте до 60% времени на рутинных задачах</p>
            </div>
          </div>
        </div>

        {/* Right side - Auth Form */}
        <div className="flex items-center justify-center">
          <div className="w-full max-w-md">
            <div className={`backdrop-blur-sm rounded-2xl shadow-xl p-8 transition-colors duration-300 ${
              isDarkMode 
                ? 'bg-gray-900/80 border border-gray-800' 
                : 'bg-white/80 border border-gray-200'
            }`}>
              {children}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile branding - appears above form on mobile */}
      <div className="lg:hidden absolute top-8 left-4 right-4">
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center space-x-2">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors duration-300 ${
              isDarkMode ? 'bg-white' : 'bg-gray-900'
            }`}>
              <FileText className={`w-4 h-4 ${isDarkMode ? 'text-black' : 'text-white'}`} />
            </div>
            <h1 className={`text-3xl font-bold tracking-tight transition-colors duration-300 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>DevAssist Pro</h1>
          </div>
          <p className={`transition-colors duration-300 ${
            isDarkMode ? 'text-gray-400' : 'text-gray-600'
          }`}>AI-платформа для девелоперов</p>
        </div>
      </div>
    </div>
  );
};