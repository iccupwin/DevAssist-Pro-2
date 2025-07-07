import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FileText, 
  PenTool, 
  TrendingUp, 
  Target, 
  Database,
  Sparkles,
  Users,
  BarChart3,
  Clock,
  CheckCircle,
  ArrowRight,
  Star,
  Activity,
  Settings,
  Sun,
  Moon
} from 'lucide-react';

interface DashboardModule {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  status: 'active' | 'coming_soon' | 'beta';
  href: string;
  aiModels: string[];
  lastUsed?: Date;
  quickStats?: {
    total: number;
    thisMonth: number;
    efficiency: number;
  };
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [userProfile] = useState({
    name: 'Александр Петров',
    email: 'aleksandr.petrov@devcompany.ru',
    company: 'DevCompany',
    plan: 'Professional'
  });

  // Load theme preference from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      setIsDarkMode(savedTheme === 'dark');
    } else {
      // Default to system preference
      setIsDarkMode(window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
  }, []);

  // Save theme preference and apply to document
  useEffect(() => {
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  const modules: DashboardModule[] = [
    {
      id: 'kp-analyzer',
      title: 'КП Анализатор',
      description: 'AI-анализ коммерческих предложений против технических заданий',
      icon: <FileText className="w-8 h-8" />,
      status: 'active',
      href: '/kp-analyzer',
      aiModels: ['Claude 3.5 Sonnet', 'GPT-4'],
      lastUsed: new Date('2024-01-15'),
      quickStats: {
        total: 156,
        thisMonth: 23,
        efficiency: 94.5
      }
    },
    {
      id: 'tz-generator',
      title: 'ТЗ Генератор',
      description: 'Автоматическая генерация технических заданий с помощью AI',
      icon: <PenTool className="w-8 h-8" />,
      status: 'coming_soon',
      href: '/tz-generator',
      aiModels: ['GPT-4', 'Claude 3 Opus'],
      quickStats: {
        total: 0,
        thisMonth: 0,
        efficiency: 0
      }
    },
    {
      id: 'project-evaluation',
      title: 'Оценка проектов',
      description: 'Мультикритериальный анализ и прогнозирование рисков проектов',
      icon: <TrendingUp className="w-8 h-8" />,
      status: 'coming_soon',
      href: '/project-evaluation',
      aiModels: ['Gemini Pro', 'Claude 3.5'],
      quickStats: {
        total: 0,
        thisMonth: 0,
        efficiency: 0
      }
    },
    {
      id: 'marketing-planner',
      title: 'Маркетинг планировщик',
      description: 'AI-генерация маркетинговых стратегий и контент-планов',
      icon: <Target className="w-8 h-8" />,
      status: 'coming_soon',
      href: '/marketing-planner',
      aiModels: ['GPT-4', 'Claude 3.5'],
      quickStats: {
        total: 0,
        thisMonth: 0,
        efficiency: 0
      }
    },
    {
      id: 'knowledge-base',
      title: 'База знаний',
      description: 'Накопление опыта и AI-поиск по документам проектов',
      icon: <Database className="w-8 h-8" />,
      status: 'coming_soon',
      href: '/knowledge-base',
      aiModels: ['Embedding Models', 'Vector Search'],
      quickStats: {
        total: 0,
        thisMonth: 0,
        efficiency: 0
      }
    }
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${
            isDarkMode 
              ? 'text-green-300 bg-green-500/20' 
              : 'text-green-700 bg-green-100'
          }`}>
            <CheckCircle className="w-3 h-3" />
            Активен
          </span>
        );
      case 'beta':
        return (
          <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${
            isDarkMode 
              ? 'text-blue-300 bg-blue-500/20' 
              : 'text-blue-700 bg-blue-100'
          }`}>
            <Star className="w-3 h-3" />
            Beta
          </span>
        );
      case 'coming_soon':
        return (
          <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${
            isDarkMode 
              ? 'text-gray-400 bg-gray-500/20' 
              : 'text-gray-700 bg-gray-100'
          }`}>
            <Clock className="w-3 h-3" />
            Скоро
          </span>
        );
      default:
        return null;
    }
  };

  const handleModuleClick = (module: DashboardModule) => {
    if (module.status === 'active') {
      navigate(module.href);
    }
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
      
      <div 
        className={`min-h-screen transition-colors duration-300 ${
          isDarkMode 
            ? 'bg-black text-white' 
            : 'bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 text-gray-900'
        }`} 
        style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
      >
        {/* Header */}
        <header className={`sticky top-0 z-50 backdrop-blur-md transition-colors duration-300 ${
          isDarkMode 
            ? 'bg-black/80 border-b border-gray-800' 
            : 'bg-white/80 border-b border-white/20'
        }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  isDarkMode ? 'bg-white' : 'bg-gradient-to-r from-blue-600 to-purple-600'
                }`}>
                  <Sparkles className={`w-5 h-5 ${isDarkMode ? 'text-black' : 'text-white'}`} />
                </div>
                <h1 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  DevAssist Pro
                </h1>
              </div>
              <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Web Portal
              </span>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className={`hidden md:flex items-center space-x-2 text-sm ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                <Activity className="w-4 h-4 text-green-500" />
                <span>AI Models: Online</span>
              </div>
              
              {/* Theme Toggle Button */}
              <button
                onClick={toggleTheme}
                className="theme-toggle"
                title={isDarkMode ? 'Переключить на светлую тему' : 'Переключить на тёмную тему'}
              >
                {isDarkMode ? (
                  <Sun className="w-5 h-5 text-yellow-400" />
                ) : (
                  <Moon className="w-5 h-5 text-gray-600" />
                )}
              </button>
              
              <div className="flex items-center space-x-3">
                <div className="text-right hidden sm:block">
                  <div className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {userProfile.name}
                  </div>
                  <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    {userProfile.company} • {userProfile.plan}
                  </div>
                </div>
                <button
                  onClick={() => navigate('/profile')}
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-medium transition-all duration-200 shadow-md hover:shadow-lg ${
                    isDarkMode 
                      ? 'bg-white text-black hover:bg-gray-100' 
                      : 'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600'
                  }`}
                  title="Профиль и настройки"
                >
                  <span className={isDarkMode ? 'text-black' : 'text-white'}>
                    {userProfile.name.split(' ').map(n => n[0]).join('')}
                  </span>
                </button>
                <button
                  onClick={() => navigate('/profile')}
                  className={`hidden md:flex items-center space-x-2 px-3 py-2 backdrop-blur-sm border rounded-xl transition-all duration-200 shadow-md hover:shadow-lg ${
                    isDarkMode 
                      ? 'bg-white/10 border-white/20 text-gray-300 hover:bg-white/20' 
                      : 'bg-white/60 border-white/20 text-gray-700 hover:bg-white/80'
                  }`}
                >
                  <Settings className="w-4 h-4" />
                  <span className="text-sm font-medium">Настройки</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <div className="text-center max-w-3xl mx-auto">
            <h2 className={`text-3xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Добро пожаловать в DevAssist Pro Portal! 🚀
            </h2>
            <p className={`text-lg mb-6 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              AI-powered веб-портал для автоматизации всех ключевых процессов в девелопменте недвижимости
            </p>
            <div className={`inline-flex items-center space-x-6 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4" />
                <span>5 модулей доступно</span>
              </div>
              <div className="flex items-center space-x-2">
                <BarChart3 className="w-4 h-4" />
                <span>94.5% точность AI</span>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4" />
                <span>60% экономия времени</span>
              </div>
            </div>
          </div>
        </div>

        {/* Modules Grid */}
        <div className="mb-8">
          <h3 className={`text-xl font-semibold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Выберите функцию для начала работы:
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {modules.map((module) => (
              <div
                key={module.id}
                onClick={() => handleModuleClick(module)}
                className={`group relative backdrop-blur-md rounded-2xl border p-6 transition-all duration-300 hover:shadow-xl hover:scale-105 ${
                  isDarkMode 
                    ? 'bg-white/[0.02] border-gray-800' 
                    : 'bg-white/60 border-white/20'
                } ${
                  module.status === 'active' 
                    ? isDarkMode 
                      ? 'cursor-pointer hover:bg-white/[0.05]' 
                      : 'cursor-pointer hover:bg-white/80'
                    : 'cursor-not-allowed opacity-75'
                }`}
              >
                {/* Status Badge */}
                <div className="absolute top-4 right-4">
                  {getStatusBadge(module.status)}
                </div>

                {/* Icon */}
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-colors ${
                  module.status === 'active'
                    ? isDarkMode 
                      ? 'bg-white text-black'
                      : 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'
                    : isDarkMode 
                      ? 'bg-gray-800 text-gray-600'
                      : 'bg-gray-100 text-gray-400'
                }`}>
                  {module.icon}
                </div>

                {/* Content */}
                <div className="mb-4">
                  <h4 className={`text-lg font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {module.title}
                  </h4>
                  <p className={`text-sm mb-3 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {module.description}
                  </p>
                  
                  {/* AI Models */}
                  <div className="flex flex-wrap gap-1 mb-3">
                    {module.aiModels.map((model, index) => (
                      <span
                        key={index}
                        className={`inline-block px-2 py-1 text-xs rounded-full ${
                          isDarkMode 
                            ? 'bg-gray-800 text-gray-400' 
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {model}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Stats */}
                {module.quickStats && module.status === 'active' && (
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Всего анализов:</span>
                      <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{module.quickStats.total}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>За этот месяц:</span>
                      <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{module.quickStats.thisMonth}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Точность AI:</span>
                      <span className="font-medium text-green-500">{module.quickStats.efficiency}%</span>
                    </div>
                  </div>
                )}

                {/* Action */}
                {module.status === 'active' && (
                  <div className={`flex items-center text-sm font-medium transition-colors ${
                    isDarkMode ? 'text-blue-400 group-hover:text-blue-300' : 'text-blue-600 group-hover:text-blue-700'
                  }`}>
                    <span>Открыть модуль</span>
                    <ArrowRight className="w-4 h-4 ml-2 transform group-hover:translate-x-1 transition-transform" />
                  </div>
                )}

                {module.status === 'coming_soon' && (
                  <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    Скоро будет доступен
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className={`backdrop-blur-md rounded-xl border p-6 ${
            isDarkMode 
              ? 'bg-white/[0.02] border-gray-800' 
              : 'bg-white/60 border-white/20'
          }`}>
            <div className="flex items-center space-x-3">
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                isDarkMode ? 'bg-blue-500/20' : 'bg-blue-100'
              }`}>
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <div className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>156</div>
                <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Документов обработано</div>
              </div>
            </div>
          </div>

          <div className={`backdrop-blur-md rounded-xl border p-6 ${
            isDarkMode 
              ? 'bg-white/[0.02] border-gray-800' 
              : 'bg-white/60 border-white/20'
          }`}>
            <div className="flex items-center space-x-3">
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                isDarkMode ? 'bg-green-500/20' : 'bg-green-100'
              }`}>
                <Clock className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <div className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>312</div>
                <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Часов сэкономлено</div>
              </div>
            </div>
          </div>

          <div className="bg-white/60 backdrop-blur-md rounded-xl border border-white/20 p-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">94.5%</div>
                <div className="text-sm text-gray-600">Точность анализа</div>
              </div>
            </div>
          </div>

          <div className="bg-white/60 backdrop-blur-md rounded-xl border border-white/20 p-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Activity className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">Online</div>
                <div className="text-sm text-gray-600">Статус AI моделей</div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className={`backdrop-blur-md rounded-xl border p-6 ${
          isDarkMode 
            ? 'bg-white/[0.02] border-gray-800' 
            : 'bg-white/60 border-white/20'
        }`}>
          <h3 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Недавняя активность</h3>
          <div className="space-y-3">
            <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-white/50">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-4 h-4 text-green-600" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900">Анализ КП завершен</div>
                <div className="text-xs text-gray-500">ООО "ТехСтрой" - 94% соответствие ТЗ</div>
              </div>
              <div className="text-xs text-gray-500">2 мин назад</div>
            </div>
            
            <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-white/50">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <FileText className="w-4 h-4 text-blue-600" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900">Отчет сгенерирован</div>
                <div className="text-xs text-gray-500">Сравнительный анализ 3 КП</div>
              </div>
              <div className="text-xs text-gray-500">15 мин назад</div>
            </div>
            
            <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-white/50">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <Users className="w-4 h-4 text-purple-600" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900">Новый пользователь добавлен</div>
                <div className="text-xs text-gray-500">Мария Иванова присоединилась к команде</div>
              </div>
              <div className="text-xs text-gray-500">1 час назад</div>
            </div>
          </div>
        </div>
      </main>
      </div>
    </>
  );
};

export default Dashboard;