import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FileText, 
  Upload, 
  Brain, 
  BarChart3, 
  FileCheck,
  ChevronRight,
  ArrowLeft,
  Settings,
  ChevronDown,
  Sun,
  Moon,
  Grid3X3
} from 'lucide-react';

interface HeaderProps {
  currentStep: string;
  onStepChange: (step: string) => void;
  selectedModel?: string;
  selectedComparisonModel?: string;
  onModelChange?: (model: string) => void;
  onComparisonModelChange?: (model: string) => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
}

const HeaderImproved: React.FC<HeaderProps> = ({ 
  currentStep, 
  onStepChange,
  selectedModel = 'claude-3-5-sonnet-20240620',
  selectedComparisonModel = 'gpt-4o',
  onModelChange,
  onComparisonModelChange,
  isDarkMode,
  onToggleTheme
}) => {
  const navigate = useNavigate();
  const [showModelSettings, setShowModelSettings] = useState(false);
  const [tempSelectedModel, setTempSelectedModel] = useState(selectedModel);
  const [tempSelectedComparisonModel, setTempSelectedComparisonModel] = useState(selectedComparisonModel);
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  
  const navigationItems = [
    { key: 'dashboard', label: 'Dashboard', icon: <Grid3X3 className="w-4 h-4" /> },
    { key: 'upload', label: 'Upload', icon: <Upload className="w-4 h-4" /> },
    { key: 'analysis', label: 'Analysis', icon: <Brain className="w-4 h-4" /> },
    { key: 'comparison', label: 'Comparison', icon: <BarChart3 className="w-4 h-4" /> },
    { key: 'report', label: 'Report', icon: <FileCheck className="w-4 h-4" /> }
  ];

  const getCurrentStepLabel = () => {
    const step = navigationItems.find(s => s.key === currentStep);
    return step ? step.label : 'КП Анализатор';
  };

  const modelNames: Record<string, string> = {
    'claude-3-5-sonnet-20240620': 'Claude 3.5 Sonnet',
    'claude-3-opus-20240229': 'Claude 3 Opus',
    'claude-3-haiku-20240307': 'Claude 3 Haiku',
    'gpt-4o': 'GPT-4o',
    'gpt-4-turbo': 'GPT-4 Turbo',
    'gpt-4': 'GPT-4',
    'gpt-3.5-turbo': 'GPT-3.5 Turbo'
  };

  // Синхронизируем временные значения с пропсами
  useEffect(() => {
    setTempSelectedModel(selectedModel);
    setTempSelectedComparisonModel(selectedComparisonModel);
  }, [selectedModel, selectedComparisonModel]);

  // Обработчик клика вне панели
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        showModelSettings &&
        panelRef.current &&
        buttonRef.current &&
        !panelRef.current.contains(event.target as Node) &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        // Сохраняем изменения при закрытии
        if (tempSelectedModel !== selectedModel) {
          onModelChange?.(tempSelectedModel);
        }
        if (tempSelectedComparisonModel !== selectedComparisonModel) {
          onComparisonModelChange?.(tempSelectedComparisonModel);
        }
        setShowModelSettings(false);
      }
    };

    if (showModelSettings) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showModelSettings]);


  // Обработчик открытия/закрытия панели
  const togglePanel = () => {
    if (showModelSettings) {
      // При закрытии сохраняем настройки
      if (tempSelectedModel !== selectedModel) {
        onModelChange?.(tempSelectedModel);
      }
      if (tempSelectedComparisonModel !== selectedComparisonModel) {
        onComparisonModelChange?.(tempSelectedComparisonModel);
      }
    }
    setShowModelSettings(!showModelSettings);
  };

  return (
    <>
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
      
      <header className={`sticky top-0 z-40 backdrop-blur-md transition-colors duration-300 ${
        isDarkMode 
          ? 'border-b border-gray-800 bg-black/80' 
          : 'border-b border-gray-200 bg-white/80'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
          {/* Left side - Breadcrumb */}
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/dashboard')}
              className={`flex items-center space-x-2 transition-colors group ${
                isDarkMode 
                  ? 'text-gray-400 hover:text-white' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              <span className="text-sm font-medium">Dashboard</span>
            </button>
            
            <ChevronRight className={`w-4 h-4 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`} />
            
            <div className="flex items-center space-x-3">
              <div className={`w-5 h-5 rounded flex items-center justify-center ${
                isDarkMode ? 'bg-white' : 'bg-gray-900'
              }`}>
                <FileText className={`w-3 h-3 ${isDarkMode ? 'text-black' : 'text-white'}`} />
              </div>
              <div>
                <h1 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  KP Analyzer
                </h1>
                <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {getCurrentStepLabel()}
                </div>
              </div>
            </div>
          </div>

          {/* Right side - Settings and Step Navigation */}
          <div className="flex items-center space-x-3">
            {/* Theme Toggle Button */}
            <button
              onClick={onToggleTheme}
              className="theme-toggle"
              title={isDarkMode ? 'Переключить на светлую тему' : 'Переключить на тёмную тему'}
            >
              {isDarkMode ? (
                <Sun className="w-5 h-5 text-yellow-400" />
              ) : (
                <Moon className="w-5 h-5 text-gray-600" />
              )}
            </button>
            
            {/* Model Settings Button */}
            <div className="relative">
              <button
                ref={buttonRef}
                onClick={togglePanel}
                className={`flex items-center space-x-2 px-3 py-2 backdrop-blur-sm border rounded-xl transition-all duration-200 shadow-md hover:shadow-lg ${
                  showModelSettings 
                    ? isDarkMode 
                      ? 'bg-white/20 border-white/30 text-white' 
                      : 'bg-black/20 border-black/30 text-gray-900'
                    : isDarkMode 
                      ? 'bg-white/10 border-white/20 text-gray-300 hover:bg-white/20'
                      : 'bg-black/10 border-black/20 text-gray-700 hover:bg-black/20'
                }`}
                title="Настройки моделей ИИ"
              >
                <Settings className="w-4 h-4" />
                <span className="hidden sm:block text-sm font-medium">Модели ИИ</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${showModelSettings ? 'rotate-180' : ''}`} />
              </button>

              {/* Model Settings Panel */}
              {showModelSettings && (
                <div 
                  ref={panelRef}
                  className={`absolute right-0 top-full mt-2 w-80 md:w-96 backdrop-blur-md rounded-xl shadow-xl z-50 p-4 max-h-96 overflow-y-auto ${
                    isDarkMode 
                      ? 'bg-black/95 border border-gray-800' 
                      : 'bg-white/95 border border-gray-200'
                  }`}
                >
                  <h3 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    Настройки моделей ИИ
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        Модель для анализа
                      </label>
                      <select 
                        value={tempSelectedModel}
                        onChange={(e) => setTempSelectedModel(e.target.value)}
                        className={`w-full p-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                          isDarkMode 
                            ? 'border-gray-700 bg-white/5 text-white' 
                            : 'border-gray-300 bg-black/5 text-gray-900'
                        }`}
                      >
                        <option value="claude-3-5-sonnet-20240620">Claude 3.5 Sonnet</option>
                        <option value="claude-3-opus-20240229">Claude 3 Opus</option>
                        <option value="claude-3-haiku-20240307">Claude 3 Haiku</option>
                        <option value="gpt-4o">GPT-4o</option>
                        <option value="gpt-4-turbo">GPT-4 Turbo</option>
                        <option value="gpt-4">GPT-4</option>
                        <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        Модель для сравнения и отчетов
                      </label>
                      <select 
                        value={tempSelectedComparisonModel}
                        onChange={(e) => setTempSelectedComparisonModel(e.target.value)}
                        className={`w-full p-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                          isDarkMode 
                            ? 'border-gray-700 bg-white/5 text-white' 
                            : 'border-gray-300 bg-black/5 text-gray-900'
                        }`}
                      >
                        <option value="claude-3-5-sonnet-20240620">Claude 3.5 Sonnet</option>
                        <option value="claude-3-opus-20240229">Claude 3 Opus</option>
                        <option value="claude-3-haiku-20240307">Claude 3 Haiku</option>
                        <option value="gpt-4o">GPT-4o</option>
                        <option value="gpt-4-turbo">GPT-4 Turbo</option>
                        <option value="gpt-4">GPT-4</option>
                        <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                      </select>
                    </div>
                  </div>
                  
                  {/* Current Selection Display */}
                  <div className={`mt-4 pt-4 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-300'}`}>
                    <div className={`text-sm space-y-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      <div className="flex justify-between">
                        <span>Анализ:</span>
                        <span className={`font-medium ${tempSelectedModel !== selectedModel ? 'text-orange-400' : 'text-purple-400'}`}>
                          {modelNames[tempSelectedModel] || tempSelectedModel}
                          {tempSelectedModel !== selectedModel && ' *'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Сравнение:</span>
                        <span className={`font-medium ${tempSelectedComparisonModel !== selectedComparisonModel ? 'text-orange-400' : 'text-blue-400'}`}>
                          {modelNames[tempSelectedComparisonModel] || tempSelectedComparisonModel}
                          {tempSelectedComparisonModel !== selectedComparisonModel && ' *'}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className={`mt-4 pt-3 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-300'}`}>
                    <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      💡 <strong>Рекомендация:</strong> Claude отлично подходит для детального анализа документов, 
                      GPT-4 - для сравнения и создания отчетов.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Desktop Step Navigation */}
            <nav className="hidden md:flex space-x-1">
              {navigationItems.map((item, index) => {
                const isActive = currentStep === item.key;
                const isCompleted = navigationItems.findIndex(s => s.key === currentStep) > index;
                
                return (
                  <button
                    key={item.key}
                    onClick={() => onStepChange(item.key)}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? isDarkMode 
                          ? 'bg-white text-black shadow-sm'
                          : 'bg-gray-900 text-white shadow-sm'
                        : isCompleted
                        ? 'text-green-400 hover:bg-opacity-10 hover:bg-current'
                        : isDarkMode
                          ? 'text-gray-400 hover:text-gray-200 hover:bg-white/10'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-black/10'
                    }`}
                  >
                    <div className={`transition-colors ${
                      isActive 
                        ? isDarkMode ? 'text-black' : 'text-white'
                        : isCompleted 
                          ? 'text-green-400' 
                          : isDarkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      {item.icon}
                    </div>
                    <span>{item.label}</span>
                    {isCompleted && (
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    )}
                  </button>
                );
              })}
            </nav>
            
            {/* Mobile step indicator */}
            <div className="md:hidden flex items-center space-x-2">
              <div className="flex space-x-1">
                {navigationItems.map((item, index) => {
                  const isActive = currentStep === item.key;
                  const isCompleted = navigationItems.findIndex(s => s.key === currentStep) > index;
                  
                  return (
                    <div
                      key={item.key}
                      className={`w-2 h-2 rounded-full transition-all duration-300 ${
                        isActive ? 'bg-blue-500 scale-125' : isCompleted ? 'bg-green-400' : 'bg-gray-600'
                      }`}
                    />
                  );
                })}
              </div>
              <span className={`text-xs font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {navigationItems.findIndex(s => s.key === currentStep) + 1}/{navigationItems.length}
              </span>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="hidden md:block absolute bottom-0 left-0 right-0">
          <div className={`h-1 ${isDarkMode ? 'bg-gray-800' : 'bg-gray-200'}`}>
            <div 
              className="h-1 bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500 ease-out"
              style={{ 
                width: `${((navigationItems.findIndex(s => s.key === currentStep) + 1) / navigationItems.length) * 100}%` 
              }}
            />
          </div>
        </div>

      </div>
    </header>
    </>
  );
};

export default HeaderImproved;