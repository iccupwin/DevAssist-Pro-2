import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getBackendApiUrl } from '../config/app';
import { 
  FileText, 
  PenTool, 
  TrendingUp, 
  Target, 
  Database,
  Sun,
  Moon,
  User,
  LogOut,
  ChevronRight,
  Table,
  BarChart3,
  CheckCircle,
  XCircle,
  RefreshCw
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { RecentActivityFeed } from '../components/main';
import { ResultsVisualization } from '../components/visualization';
import { ModernSidebar } from '../components/ui/ModernSidebar';
import { useAIConfig } from '../hooks/useAIConfig';
import type { AIProvider } from '../types/aiConfig';
import { kpAnalyzerService } from '../services/ai/kpAnalyzerService';

interface DashboardModule {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  status: 'active' | 'coming_soon';
  href: string;
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { isDarkMode, toggleTheme } = useTheme();
  const { isAuthenticated, isLoading, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'modules' | 'visualization' | 'comparison'>('modules');
  useAIConfig(); // Using hook for configuration
  const [aiStatus, setAIStatus] = useState<{ openai: boolean | null; anthropic: boolean | null }>({ openai: null, anthropic: null });
  const [aiStatusDetails, setAIStatusDetails] = useState<
    Map<AIProvider, { ok: boolean; error?: { code: string; status?: number; message?: string } }>
  >(new Map());
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Security check - redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      // User not authenticated, redirecting to login
      navigate('/auth/login', { replace: true });
      return;
    }
  }, [isAuthenticated, isLoading, navigate]);

  // Dashboard lifecycle tracking
  useEffect(() => {
    // Component mounted
    
    return () => {
      // Component unmounted
    };
  }, []);

  // Theme change tracking
  useEffect(() => {
    // Theme changed
  }, [isDarkMode]);

  useEffect(() => {
    const checkAIProviders = async () => {
      setCheckingStatus(true);
      
      try {
        // Используем backend API Gateway вместо прямых вызовов к AI сервисам
        const apiUrl = getBackendApiUrl();
        const response = await fetch(`${apiUrl}/api/llm/providers`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (!response.ok) {
          throw new Error(`Backend API error: ${response.status}`);
        }
        
        const data = await response.json();
        const providersData = data.providers || {};
        
        // Проверяем статус каждого провайдера через health check
        const healthResponse = await fetch(`${apiUrl}/api/llm/health`);
        const healthData = healthResponse.ok ? await healthResponse.json() : null;
        
        const statusDetails = new Map();
        const status = { openai: false, anthropic: false };
        
        // OpenAI статус
        if (providersData.openai) {
          // Используем правильную структуру ответа от backend
          const isHealthy = healthData?.providers?.openai?.configured === true && 
                           healthData?.providers?.openai?.status === 'healthy';
          status.openai = isHealthy;
          statusDetails.set('openai', {
            ok: isHealthy,
            error: isHealthy ? undefined : {
              code: 'SERVICE_ERROR',
              message: 'OpenAI provider не готов или недоступен'
            }
          });
        } else {
          status.openai = false;
          statusDetails.set('openai', {
            ok: false,
            error: {
              code: 'NO_API_KEY',
              message: 'OpenAI API key not configured'
            }
          });
        }
        
        // Anthropic статус
        if (providersData.anthropic) {
          // Используем правильную структуру ответа от backend
          const isHealthy = healthData?.providers?.anthropic?.configured === true && 
                           healthData?.providers?.anthropic?.status === 'healthy';
          status.anthropic = isHealthy;
          statusDetails.set('anthropic', {
            ok: isHealthy,
            error: isHealthy ? undefined : {
              code: 'SERVICE_ERROR',
              message: 'Anthropic provider не готов или недоступен'
            }
          });
        } else {
          status.anthropic = false;
          statusDetails.set('anthropic', {
            ok: false,
            error: {
              code: 'NO_API_KEY',
              message: 'Anthropic API key not configured'
            }
          });
        }
        
        setAIStatus(status);
        setAIStatusDetails(statusDetails);
        
      } catch (error) {
        // Failed to check AI providers via backend
        
        // Безопасное извлечение сообщения об ошибке
        const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
        
        // Fallback к прямой проверке при ошибке бэкенда
        setAIStatus({ openai: false, anthropic: false });
        setAIStatusDetails(new Map([
          ['openai', { ok: false, error: { code: 'BACKEND_ERROR', message: `Backend недоступен: ${errorMessage}` } }],
          ['anthropic', { ok: false, error: { code: 'BACKEND_ERROR', message: `Backend недоступен: ${errorMessage}` } }]
        ]));
      }
      
      setCheckingStatus(false);
    };
    
    // Запускаем проверку при монтировании компонента
    checkAIProviders();
  }, []);

  // Реальные данные для визуализации
  const [analysisResults, setAnalysisResults] = useState<any[]>([]);
  const [isLoadingResults, setIsLoadingResults] = useState(false);

  // Загрузка реальных данных анализа
  const loadAnalysisResults = async () => {
    setIsLoadingResults(true);
    try {
      // Получаем историю анализов из localStorage
      const history = await kpAnalyzerService.getAnalysisHistory();
      
      // Преобразуем данные для компонента визуализации
      const transformedResults = history.map((item: any, index: number) => {
        const kpResults = item.kp_results || [];
        const firstKp = kpResults[0] || {};
        
        return {
          id: item.analysis_id?.toString() || index.toString(),
          companyName: firstKp.company_name || `Компания ${index + 1}`,
          proposalName: firstKp.proposal_name || 'Коммерческое предложение',
          overallScore: firstKp.overall_score || 0,
          maxScore: 100,
          criteria: {
            technical: firstKp.technical_score || 0,
            commercial: firstKp.commercial_score || 0,
            timeline: firstKp.timeline_score || 0,
            experience: firstKp.experience_score || 0,
            compliance: firstKp.compliance_score || 0,
          },
          budget: {
            total: firstKp.total_budget || 0,
            breakdown: {
              development: firstKp.development_cost || 0,
              testing: firstKp.testing_cost || 0,
              deployment: firstKp.deployment_cost || 0,
              support: firstKp.support_cost || 0,
              other: firstKp.other_cost || 0,
            },
          },
          metadata: {
            submissionDate: item.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
            evaluationDate: item.updated_at?.split('T')[0] || new Date().toISOString().split('T')[0],
            evaluator: 'AI Система',
            status: 'evaluated' as const,
          },
        };
      });
      
      setAnalysisResults(transformedResults);
    } catch (error) {
      // Error loading analysis data
      setAnalysisResults([]);
    } finally {
      setIsLoadingResults(false);
    }
  };

  // Загружаем данные при монтировании
  useEffect(() => {
    loadAnalysisResults();
  }, []);

  // Заглушка для совместимости с существующим кодом

  // Расширенные данные для интерактивного сравнения

  const modules: DashboardModule[] = [
    {
      id: 'kp-analyzer',
      title: 'КП Анализатор',
      description: 'Анализ коммерческих предложений против технических заданий с помощью AI',
      icon: <FileText className="w-6 h-6" />,
      status: 'active',
      href: '/kp-analyzer'
    },
    {
      id: 'tz-generator',
      title: 'ТЗ Генератор',
      description: 'Генерация технических заданий',
      icon: <PenTool className="w-6 h-6" />,
      status: 'coming_soon',
      href: '/tz-generator'
    },
    {
      id: 'project-evaluation',
      title: 'Оценка проектов',
      description: 'Анализ и оценка проектов недвижимости',
      icon: <TrendingUp className="w-6 h-6" />,
      status: 'coming_soon',
      href: '/project-evaluation'
    },
    {
      id: 'marketing-planner',
      title: 'Маркетинг планировщик',
      description: 'Планирование маркетинговых стратегий',
      icon: <Target className="w-6 h-6" />,
      status: 'coming_soon',
      href: '/marketing-planner'
    },
    {
      id: 'knowledge-base',
      title: 'База знаний',
      description: 'Управление документами и знаниями',
      icon: <Database className="w-6 h-6" />,
      status: 'coming_soon',
      href: '/knowledge-base'
    }
  ];

  const handleModuleClick = (module: DashboardModule) => {
    if (module.status === 'active') {
      navigate(module.href);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/auth/login');
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'
    }`}>
      {/* Modern Sidebar */}
      <ModernSidebar 
        isCollapsed={sidebarCollapsed} 
        onToggle={setSidebarCollapsed} 
      />

      {/* Main Content Area */}
      <div className={`transition-all duration-300 ${
        sidebarCollapsed ? 'md:ml-16' : 'md:ml-64'
      }`}>
        {/* Header */}
        <header className={`border-b transition-colors duration-300 ${
          isDarkMode ? 'border-gray-800 bg-gray-900' : 'border-gray-200 bg-white'
        }`}>
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-3 md:ml-0 ml-12">
                <h1 className="text-xl font-semibold">Дашборд</h1>
                <span className={`text-sm px-2 py-1 rounded-full ${
                  isDarkMode ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-600'
                }`}>
                  DevAssist Pro
                </span>
              </div>
              
              <div className="flex items-center space-x-4">
                <button
                  onClick={toggleTheme}
                  className={`p-2 rounded-lg transition-colors ${
                    isDarkMode 
                      ? 'hover:bg-gray-800 text-gray-400 hover:text-white' 
                      : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </button>
                
                <button
                  onClick={() => navigate('/profile')}
                  className={`p-2 rounded-lg transition-colors ${
                    isDarkMode 
                      ? 'hover:bg-gray-800 text-gray-400 hover:text-white' 
                      : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <User className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-2">Добро пожаловать в DevAssist Pro</h2>
          <p className={`text-lg ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Выберите модуль для начала работы
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-8">
          <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg w-fit">
            <button
              onClick={() => setActiveTab('modules')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'modules'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Модули системы</span>
            </button>
            <button
              onClick={() => setActiveTab('visualization')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'visualization'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Визуализация</span>
            </button>
            <button
              onClick={() => setActiveTab('comparison')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'comparison'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Table className="w-4 h-4" />
              <span>Сравнение КП</span>
            </button>
          </div>
        </div>

        {/* Main Dashboard Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          {/* Left Column - Modules, Visualization, or Comparison */}
          <div className="lg:col-span-2">
            {activeTab === 'modules' ? (
              <>
                <h3 className="text-base sm:text-lg font-semibold mb-4">Модули системы</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  {modules.map((module) => (
                    <div
                      key={module.id}
                      onClick={() => handleModuleClick(module)}
                      className={`group relative rounded-xl border p-4 sm:p-6 transition-all duration-200 ${
                        isDarkMode 
                          ? 'bg-gray-800 border-gray-700 hover:bg-gray-750' 
                          : 'bg-white border-gray-200 hover:bg-gray-50'
                      } ${
                        module.status === 'active' 
                          ? 'cursor-pointer hover:shadow-lg' 
                          : 'cursor-not-allowed opacity-60'
                      }`}
                    >
                      {/* Status Badge */}
                      <div className="absolute top-3 right-3 sm:top-4 sm:right-4">
                        {module.status === 'active' ? (
                          <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                            Активен
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700">
                            Скоро
                          </span>
                        )}
                      </div>

                      {/* Icon */}
                      <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center mb-3 sm:mb-4 ${
                        module.status === 'active'
                          ? 'bg-blue-600 text-white'
                          : isDarkMode 
                            ? 'bg-gray-700 text-gray-400'
                            : 'bg-gray-100 text-gray-400'
                      }`}>
                        {module.icon}
                      </div>

                      {/* Content */}
                      <div className="mb-4">
                        <h3 className="text-lg font-semibold mb-2">{module.title}</h3>
                        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          {module.description}
                        </p>
                      </div>

                      {/* Action */}
                      {module.status === 'active' && (
                        <div className="flex items-center text-sm font-medium text-blue-600 group-hover:text-blue-700">
                          <span>Открыть</span>
                          <ChevronRight className="w-4 h-4 ml-1 transform group-hover:translate-x-1 transition-transform" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </>
            ) : activeTab === 'visualization' ? (
              <ResultsVisualization
                results={analysisResults}
                showFilters={true}
                showExportOptions={true}
                onExport={(type) => {
                  // Export functionality
                  // Export as: ${type}
                }}
                onRefresh={() => {
                  // Data refresh functionality - перезагружаем реальные данные
                  loadAnalysisResults();
                }}
              />
            ) : (
              <div className="text-gray-400 text-center py-8">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Нет данных для сравнения</p>
                <p className="text-sm mt-2">Загрузите КП для анализа</p>
              </div>
            )}
          </div>

          {/* Right Column - Recent Activity */}
          <div className="lg:col-span-1">
            {/* Индикаторы статуса AI API */}
            <div className="flex flex-col gap-2 mb-4">
              <div className="flex items-center gap-2">
                <span className="font-semibold">Claude API</span>
                {checkingStatus ? (
                  <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />
                ) : aiStatus.anthropic === true ? (
                  <span title="Подключено"><CheckCircle className="w-4 h-4 text-green-500" /></span>
                ) : (
                  <span title="Нет подключения"><XCircle className="w-4 h-4 text-red-500" /></span>
                )}
              </div>
              {/* Лог Anthropic */}
              {aiStatusDetails.get('anthropic')?.error && (
                <div className="ml-6 text-xs text-red-400 break-all">
                  <div>Код: {aiStatusDetails.get('anthropic')?.error?.code}</div>
                  {aiStatusDetails.get('anthropic')?.error?.status && (
                    <div>HTTP: {aiStatusDetails.get('anthropic')?.error?.status}</div>
                  )}
                  <div>Ошибка: {aiStatusDetails.get('anthropic')?.error?.message}</div>
                  {aiStatusDetails.get('anthropic')?.error?.code === 'NO_API_KEY' && (
                    <div className="mt-1 text-yellow-400">
                      💡 Добавьте REACT_APP_ANTHROPIC_API_KEY в .env файл
                    </div>
                  )}
                  {aiStatusDetails.get('anthropic')?.error?.code === 'TypeError' && (
                    <div className="mt-1 text-yellow-400">
                      🌐 CORS проблема - попробуйте mock режим или backend proxy
                    </div>
                  )}
                  {aiStatusDetails.get('anthropic')?.error?.code === 'BACKEND_ERROR' && (
                    <div className="mt-1 text-yellow-400">
                      🔌 Проблема с backend API - проверьте, что сервисы запущены
                    </div>
                  )}
                  {aiStatusDetails.get('anthropic')?.error?.code === 'SERVICE_ERROR' && (
                    <div className="mt-1 text-yellow-400">
                      ⚠️ Сервис запущен, но provider недоступен
                    </div>
                  )}
                </div>
              )}
              <div className="flex items-center gap-2">
                <span className="font-semibold">ChatGPT API</span>
                {checkingStatus ? (
                  <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />
                ) : aiStatus.openai === true ? (
                  <span title="Подключено"><CheckCircle className="w-4 h-4 text-green-500" /></span>
                ) : (
                  <span title="Нет подключения"><XCircle className="w-4 h-4 text-red-500" /></span>
                )}
              </div>
              {/* Лог OpenAI */}
              {aiStatusDetails.get('openai')?.error && (
                <div className="ml-6 text-xs text-red-400 break-all">
                  <div>Код: {aiStatusDetails.get('openai')?.error?.code}</div>
                  {aiStatusDetails.get('openai')?.error?.status && (
                    <div>HTTP: {aiStatusDetails.get('openai')?.error?.status}</div>
                  )}
                  <div>Ошибка: {aiStatusDetails.get('openai')?.error?.message}</div>
                  {aiStatusDetails.get('openai')?.error?.code === 'NO_API_KEY' && (
                    <div className="mt-1 text-yellow-400">
                      💡 Добавьте REACT_APP_OPENAI_API_KEY в .env файл
                    </div>
                  )}
                  {aiStatusDetails.get('openai')?.error?.code === 'invalid_api_key' && (
                    <div className="mt-1 text-yellow-400">
                      🔑 Неправильный формат ключа! Должен начинаться с "sk-"
                    </div>
                  )}
                  {aiStatusDetails.get('openai')?.error?.code === 'BACKEND_ERROR' && (
                    <div className="mt-1 text-yellow-400">
                      🔌 Проблема с backend API - проверьте, что сервисы запущены
                    </div>
                  )}
                  {aiStatusDetails.get('openai')?.error?.code === 'SERVICE_ERROR' && (
                    <div className="mt-1 text-yellow-400">
                      ⚠️ Сервис запущен, но provider недоступен
                    </div>
                  )}
                </div>
              )}
            </div>
            <RecentActivityFeed 
              limit={8}
              showFilters={false}
              autoRefresh={true}
              refreshInterval={60}
              className="h-fit"
            />
          </div>
        </div>
      </main>
      </div>
    </div>
  );
};

export default Dashboard;