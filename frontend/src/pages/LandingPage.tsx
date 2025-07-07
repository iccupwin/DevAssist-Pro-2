import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, ArrowRight, Menu, X, Sun, Moon } from 'lucide-react';
import DisplayCards from '../components/ui/DisplayCards';
import Pricing from '../components/ui/PricingCard';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [animatedWords, setAnimatedWords] = useState<boolean[]>([]);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // Initialize with saved theme or system preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      return savedTheme === 'dark';
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  const heroText = "DevAssist Pro предназначен для анализа и управления проектами";
  const words = heroText.split(' ');

  useEffect(() => {
    // Animate words one by one
    const timer = setTimeout(() => {
      const newAnimatedWords = words.map((_, index) => {
        return setTimeout(() => {
          setAnimatedWords(prev => {
            const newState = [...prev];
            newState[index] = true;
            return newState;
          });
        }, index * 120);
      });
      
      return () => newAnimatedWords.forEach(clearTimeout);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  // Apply theme to document on mount and changes
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
  }, []);

  // Save theme preference and apply to document when it changes
  useEffect(() => {
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  return (
    <div 
      className={`min-h-screen transition-colors duration-300 ${
        isDarkMode 
          ? 'bg-black text-white' 
          : 'bg-white text-gray-900'
      }`} 
      style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
    >
      <style dangerouslySetInnerHTML={{
        __html: `
          .layout-content-root {
            position: relative;
            z-index: 1;
          }
          
          .layout-content-root::before {
            content: '';
            position: absolute;
            top: 0;
            left: 50%;
            transform: translateX(-50%);
            width: 100vw;
            height: 100%;
            background: inherit;
            z-index: -1;
          }
          
          @media (min-width: 768px) {
            .layout-content-root {
              max-width: 1200px;
              margin: 0 auto;
              padding: 0 2rem;
            }
          }
          
          .page-section {
            position: relative;
            overflow: hidden;
          }
          
          [data-theme="dark"] .page-section::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: linear-gradient(180deg, 
              rgba(255, 255, 255, 0.01) 0%, 
              rgba(255, 255, 255, 0.02) 50%, 
              rgba(255, 255, 255, 0.01) 100%);
            pointer-events: none;
            z-index: 0;
          }
          
          [data-theme="light"] .page-section::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: linear-gradient(180deg, 
              rgba(0, 0, 0, 0.01) 0%, 
              rgba(0, 0, 0, 0.02) 50%, 
              rgba(0, 0, 0, 0.01) 100%);
            pointer-events: none;
            z-index: 0;
          }
          
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
      
      {/* Navigation */}
      <header className={`border-b transition-colors duration-300 ${
        isDarkMode ? 'border-gray-800' : 'border-gray-200'
      }`}>
        <nav className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-8">
            <div className="flex items-center space-x-2">
              <div className={`w-5 h-5 rounded flex items-center justify-center transition-colors duration-300 ${
                isDarkMode ? 'bg-white' : 'bg-gray-900'
              }`}>
                <FileText className={`w-3 h-3 ${isDarkMode ? 'text-black' : 'text-white'}`} />
              </div>
              <span className={`font-medium transition-colors duration-300 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>DevAssist Pro</span>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-6">
              <button className={`text-sm transition-colors ${
                isDarkMode 
                  ? 'text-gray-400 hover:text-white' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}>
                Модули
              </button>
              <button className={`text-sm transition-colors ${
                isDarkMode 
                  ? 'text-gray-400 hover:text-white' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}>
                Ресурсы
              </button>
              <a href="#pricing" className={`text-sm transition-colors ${
                isDarkMode 
                  ? 'text-gray-400 hover:text-white' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}>
                Цены
              </a>
              <a href="#customers" className={`text-sm transition-colors ${
                isDarkMode 
                  ? 'text-gray-400 hover:text-white' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}>
                Клиенты
              </a>
              <a href="#contact" className={`text-sm transition-colors ${
                isDarkMode 
                  ? 'text-gray-400 hover:text-white' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}>
                Контакты
              </a>
            </div>
          </div>

          {/* Desktop Buttons */}
          <div className="hidden md:flex items-center space-x-3">
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
            
            <button 
              onClick={() => navigate('/auth/login')}
              className={`text-sm transition-colors ${
                isDarkMode 
                  ? 'text-gray-400 hover:text-white' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Войти
            </button>
            <button 
              onClick={() => navigate('/auth/register')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                isDarkMode
                  ? 'bg-white text-black hover:bg-gray-100'
                  : 'bg-gray-900 text-white hover:bg-gray-800'
              }`}
            >
              Зарегистрироваться
            </button>
          </div>

          {/* Mobile Menu Button and Theme Toggle */}
          <div className="md:hidden flex items-center space-x-3">
            {/* Mobile Theme Toggle */}
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
            
            <button 
              className={`transition-colors ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </nav>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className={`md:hidden border-t transition-colors duration-300 ${
            isDarkMode 
              ? 'border-gray-800 bg-black' 
              : 'border-gray-200 bg-white'
          }`}>
            <div className="px-4 py-4 space-y-4">
              <a href="#features" className={`block text-sm transition-colors ${
                isDarkMode 
                  ? 'text-gray-400 hover:text-white' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}>Модули</a>
              <a href="#about" className={`block text-sm transition-colors ${
                isDarkMode 
                  ? 'text-gray-400 hover:text-white' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}>Ресурсы</a>
              <a href="#pricing" className={`block text-sm transition-colors ${
                isDarkMode 
                  ? 'text-gray-400 hover:text-white' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}>Цены</a>
              <a href="#customers" className={`block text-sm transition-colors ${
                isDarkMode 
                  ? 'text-gray-400 hover:text-white' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}>Клиенты</a>
              <a href="#contact" className={`block text-sm transition-colors ${
                isDarkMode 
                  ? 'text-gray-400 hover:text-white' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}>Контакты</a>
              <div className={`pt-4 border-t transition-colors duration-300 ${
                isDarkMode ? 'border-gray-800' : 'border-gray-200'
              }`}>
                <button 
                  onClick={() => navigate('/auth/login')}
                  className={`block w-full text-left text-sm mb-3 transition-colors ${
                    isDarkMode 
                      ? 'text-gray-400 hover:text-white' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Войти
                </button>
                <button 
                  onClick={() => navigate('/auth/register')}
                  className={`px-4 py-2 rounded-md text-sm font-medium w-full transition-colors ${
                    isDarkMode
                      ? 'bg-white text-black'
                      : 'bg-gray-900 text-white'
                  }`}
                >
                  Зарегистрироваться
                </button>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="overflow-hidden relative">
        {/* Background gradient and decorative elements */}
        <div aria-hidden className="z-[2] absolute inset-0 pointer-events-none isolate opacity-50 hidden lg:block">
          <div className={`absolute inset-x-0 top-0 -z-10 transform-gpu overflow-hidden blur-3xl sm:top-[-20rem] ${
            isDarkMode ? '' : 'opacity-70'
          }`}>
            <div className={`relative left-1/2 -z-10 aspect-[1155/678] w-[36.125rem] max-w-none -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr ${
              isDarkMode 
                ? 'from-blue-800 to-purple-900' 
                : 'from-blue-200 to-purple-300'
            } opacity-30 sm:left-[calc(50%-40rem)] sm:w-[72.1875rem]`} 
            style={{
              clipPath: 'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)'
            }}></div>
          </div>
        </div>

        <div className="relative pt-0 pb-16 page-section">
          <div className="mx-auto max-w-7xl px-6">
            <div className="text-center sm:mx-auto lg:mr-auto lg:mt-0">
              {/* Animated introduction link */}
              
              {/* Main headline */}
              <h1 className="mt-8 max-w-4xl mx-auto text-balance text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight lg:mt-16">
                <span className="block md:hidden">
                  {words.slice(0, 5).map((word, index) => (
                    <span 
                      key={index} 
                      className={`inline-block transition-all duration-700 ${
                        animatedWords[index] 
                          ? 'opacity-100 blur-0 translate-y-0' 
                          : 'opacity-0 blur-sm translate-y-[20%]'
                      }`}
                      style={{ transitionDelay: `${index * 120 + 600}ms` }}
                    >
                      {word}{' '}
                    </span>
                  ))}
                  <br />
                  {words.slice(5).map((word, index) => (
                    <span 
                      key={index + 5} 
                      className={`inline-block transition-all duration-700 ${
                        animatedWords[index + 5] 
                          ? 'opacity-100 blur-0 translate-y-0' 
                          : 'opacity-0 blur-sm translate-y-[20%]'
                      }`}
                      style={{ transitionDelay: `${(index + 5) * 120 + 600}ms` }}
                    >
                      {word}{' '}
                    </span>
                  ))}
                </span>
                
                <span className="hidden md:block">
                  {words.map((word, index) => (
                    <span 
                      key={index} 
                      className={`inline-block transition-all duration-700 ${
                        animatedWords[index] 
                          ? 'opacity-100 blur-0 translate-y-0' 
                          : 'opacity-0 blur-sm translate-y-[20%]'
                      }`}
                      style={{ transitionDelay: `${index * 120 + 600}ms` }}
                    >
                      {word}{' '}
                    </span>
                  ))}
                </span>
              </h1>

              {/* Subtitle */}
              <p className={`mt-6 max-w-2xl mx-auto text-lg leading-8 transition-all duration-700 delay-1000 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              } ${
                animatedWords.length > 5 
                  ? 'opacity-100 blur-0 translate-y-0' 
                  : 'opacity-0 blur-sm translate-y-[20%]'
              }`}>
                Встречайте систему для современной разработки проектов в сфере недвижимости. 
                Оптимизируйте задачи, проекты и дорожные карты продуктов.
              </p>

              {/* CTA Buttons */}
              <div className={`mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 transition-all duration-700 delay-1200 ${
                animatedWords.length > 7 
                  ? 'opacity-100 blur-0 translate-y-0' 
                  : 'opacity-0 blur-sm translate-y-[20%]'
              }`}>
                <button 
                  onClick={() => navigate('/kp-analyzer')}
                  className={`px-8 py-3 rounded-lg font-semibold text-sm transition-colors shadow-lg hover:shadow-xl ${
                    isDarkMode 
                      ? 'bg-white text-black hover:bg-gray-100' 
                      : 'bg-gray-900 text-white hover:bg-gray-800'
                  }`}
                >
                  Начать работу
                </button>
                <button className={`flex items-center gap-2 px-6 py-3 text-sm font-semibold transition-colors ${
                  isDarkMode 
                    ? 'text-gray-300 hover:text-white' 
                    : 'text-gray-700 hover:text-gray-900'
                }`}>
                  <span>Смотреть демо</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              {/* Product Image/Demo */}
              <div className={`mt-16 relative transition-all duration-1000 delay-1600 ${
                animatedWords.length > 8 
                  ? 'opacity-100 blur-0 translate-y-0' 
                  : 'opacity-0 blur-sm translate-y-[20%]'
              }`}>
                <div className="relative rounded-xl overflow-hidden shadow-2xl">
                  
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Preview */}
      <section className={`py-16 border-t page-section transition-colors duration-300 ${
        isDarkMode ? 'border-gray-800' : 'border-gray-200'
      }`}>
        <div className="max-w-7xl mx-auto px-4 layout-content-root">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-normal mb-4 tracking-tight">
              Создан для современных{' '}
              <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>команд разработчиков</span>
            </h2>
            <p className={`text-lg font-medium ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Каждый инструмент DevAssist Pro разработан для решения реальных задач в сфере недвижимости
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-500/10 border border-purple-500/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                <FileText className="w-6 h-6 text-purple-400" />
              </div>
              <h3 className="text-lg font-medium mb-2">КП Анализатор</h3>
              <p className={`text-sm ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Автоматический анализ коммерческих предложений с помощью ИИ
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-blue-500/10 border border-blue-500/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                <FileText className="w-6 h-6 text-blue-400" />
              </div>
              <h3 className="text-lg font-medium mb-2">ТЗ Генератор</h3>
              <p className={`text-sm ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Генерация технических заданий на основе требований
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-green-500/10 border border-green-500/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                <FileText className="w-6 h-6 text-green-400" />
              </div>
              <h3 className="text-lg font-medium mb-2">Аналитика</h3>
              <p className={`text-sm ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Подробная аналитика по проектам и поставщикам
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Display Cards Section - Performance Stats */}
      <section className={`py-20 border-t page-section transition-colors duration-300 ${
        isDarkMode ? 'border-gray-800' : 'border-gray-200'
      }`}>
        <div className="max-w-7xl mx-auto px-4 layout-content-root">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-normal mb-6 tracking-tight">
              Впечатляющие{' '}
              <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>результаты</span>
            </h2>
            <p className={`text-lg font-medium mb-12 ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Реальные метрики эффективности от наших клиентов
            </p>
            
          </div>

          {/* Main content layout with Stats Grid on the left and Display Cards on the right */}
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left side - Stats Grid */}
            <div>
              <h3 className="text-2xl font-semibold mb-8 text-center">
                Ключевые показатели
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-2 gap-6">
                <div className={`text-center p-6 rounded-xl backdrop-blur-md border transition-all duration-300 hover:scale-105 ${
                  isDarkMode 
                    ? 'bg-white/[0.02] border-white/10 hover:bg-white/[0.05]' 
                    : 'bg-black/[0.02] border-black/10 hover:bg-black/[0.05]'
                }`}>
                  <div className="text-3xl font-bold mb-2">156</div>
                  <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Компаний используют
                  </div>
                </div>
                
                <div className={`text-center p-6 rounded-xl backdrop-blur-md border transition-all duration-300 hover:scale-105 ${
                  isDarkMode 
                    ? 'bg-white/[0.02] border-white/10 hover:bg-white/[0.05]' 
                    : 'bg-black/[0.02] border-black/10 hover:bg-black/[0.05]'
                }`}>
                  <div className="text-3xl font-bold mb-2">2.4М</div>
                  <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Документов обработано
                  </div>
                </div>
                
                <div className={`text-center p-6 rounded-xl backdrop-blur-md border transition-all duration-300 hover:scale-105 ${
                  isDarkMode 
                    ? 'bg-white/[0.02] border-white/10 hover:bg-white/[0.05]' 
                    : 'bg-black/[0.02] border-black/10 hover:bg-black/[0.05]'
                }`}>
                  <div className="text-3xl font-bold mb-2">99.9%</div>
                  <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Uptime системы
                  </div>
                </div>
                
                <div className={`text-center p-6 rounded-xl backdrop-blur-md border transition-all duration-300 hover:scale-105 ${
                  isDarkMode 
                    ? 'bg-white/[0.02] border-white/10 hover:bg-white/[0.05]' 
                    : 'bg-black/[0.02] border-black/10 hover:bg-black/[0.05]'
                }`}>
                  <div className="text-3xl font-bold mb-2">24/7</div>
                  <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Техподдержка
                  </div>
                </div>
              </div>
            </div>

            {/* Right side - Display Cards */}
            <div className="flex justify-center">
              <DisplayCards cards={[
                {
                  icon: <FileText className="w-4 h-4 text-green-300" />,
                  title: "Обработано КП",
                  description: "1,200+ документов за месяц",
                  date: "↑ 340% рост эффективности",
                  titleClassName: "text-green-500 dark:text-green-400",
                  className: "[grid-area:stack] hover:-translate-y-10 before:absolute before:w-[100%] before:outline-1 before:rounded-xl before:outline-green-400 dark:before:outline-green-700 before:h-[100%] before:content-[''] before:bg-blend-overlay before:bg-white/40 dark:before:bg-green-900/50 grayscale-[100%] hover:before:opacity-0 before:transition-opacity before:duration-700 hover:grayscale-0 before:left-0 before:top-0",
                },
                {
                  icon: <ArrowRight className="w-4 h-4 text-blue-300 transform rotate-45" />,
                  title: "Точность анализа",
                  description: "97.8% средняя точность",
                  date: "Превосходит экспертов на 12%",
                  titleClassName: "text-blue-500 dark:text-blue-400",
                  className: "[grid-area:stack] translate-x-16 translate-y-10 hover:-translate-y-1 before:absolute before:w-[100%] before:outline-1 before:rounded-xl before:outline-blue-400 dark:before:outline-blue-700 before:h-[100%] before:content-[''] before:bg-blend-overlay before:bg-white/40 dark:before:bg-blue-900/50 grayscale-[100%] hover:before:opacity-0 before:transition-opacity before:duration-700 hover:grayscale-0 before:left-0 before:top-0",
                },
                {
                  icon: <Sun className="w-4 h-4 text-yellow-300" />,
                  title: "Экономия времени",
                  description: "480 часов в месяц",
                  date: "₽2.8M экономии на зарплате",
                  titleClassName: "text-yellow-500 dark:text-yellow-400",
                  className: "[grid-area:stack] translate-x-32 translate-y-20 hover:translate-y-10 before:absolute before:w-[100%] before:outline-1 before:rounded-xl before:outline-yellow-400 dark:before:outline-yellow-700 before:h-[100%] before:content-[''] before:bg-blend-overlay before:bg-white/40 dark:before:bg-yellow-900/50 grayscale-[100%] hover:before:opacity-0 before:transition-opacity before:duration-700 hover:grayscale-0 before:left-0 before:top-0",
                },
              ]} />
            </div>
          </div>
        </div>
      </section>

      {/* What makes DevAssist Pro different */}
      <section className={`py-20 border-t page-section transition-colors duration-300 ${
        isDarkMode ? 'border-gray-800' : 'border-gray-200'
      }`}>
        <div className="max-w-7xl mx-auto px-4 layout-content-root">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-normal mb-8 tracking-tight">
                Что делает DevAssist Pro{' '}
                <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>особенным</span>
              </h2>
              
              <div className="space-y-8">
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-blue-500/10 border border-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium mb-2">Искусственный интеллект</h3>
                    <p className={`text-sm leading-relaxed ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      Интеграция с Claude 3.5 Sonnet и GPT-4o для максимальной точности анализа документов и генерации отчетов
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-purple-500/10 border border-purple-500/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium mb-2">Специализация для недвижимости</h3>
                    <p className={`text-sm leading-relaxed ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      Создан специально для застройщиков и девелоперов с учетом особенностей российского рынка недвижимости
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-green-500/10 border border-green-500/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium mb-2">Модульная архитектура</h3>
                    <p className={`text-sm leading-relaxed ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      Каждый модуль работает независимо, но интегрируется в единую экосистему для комплексного управления проектами
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:pl-8">
              <div className={`rounded-xl p-6 transition-colors duration-300 ${
                isDarkMode 
                  ? 'bg-gray-900 border border-gray-800' 
                  : 'bg-gray-100 border border-gray-200'
              }`}>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className={`rounded-lg p-4 text-center transition-colors duration-300 ${
                    isDarkMode ? 'bg-gray-800' : 'bg-gray-200'
                  }`}>
                    <div className={`text-2xl font-bold mb-1 ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>99.9%</div>
                    <div className={`text-xs ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>Точность анализа</div>
                  </div>
                  <div className={`rounded-lg p-4 text-center transition-colors duration-300 ${
                    isDarkMode ? 'bg-gray-800' : 'bg-gray-200'
                  }`}>
                    <div className={`text-2xl font-bold mb-1 ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>5x</div>
                    <div className={`text-xs ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>Быстрее обработки</div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className={`flex items-center justify-between py-2 border-b transition-colors duration-300 ${
                    isDarkMode ? 'border-gray-800' : 'border-gray-200'
                  }`}>
                    <span className={`text-sm ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>Соответствие ГОСТ</span>
                    <div className="w-12 h-6 bg-green-500/20 border border-green-500/30 rounded-full flex items-center justify-end pr-1">
                      <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                    </div>
                  </div>
                  
                  <div className={`flex items-center justify-between py-2 border-b transition-colors duration-300 ${
                    isDarkMode ? 'border-gray-800' : 'border-gray-200'
                  }`}>
                    <span className={`text-sm ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>Защита данных</span>
                    <div className="w-12 h-6 bg-blue-500/20 border border-blue-500/30 rounded-full flex items-center justify-end pr-1">
                      <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                    </div>
                  </div>
                  
                  <div className={`flex items-center justify-between py-2 border-b transition-colors duration-300 ${
                    isDarkMode ? 'border-gray-800' : 'border-gray-200'
                  }`}>
                    <span className={`text-sm ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>Интеграция с 1С</span>
                    <div className="w-12 h-6 bg-purple-500/20 border border-purple-500/30 rounded-full flex items-center justify-end pr-1">
                      <div className="w-4 h-4 bg-purple-500 rounded-full"></div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between py-2">
                    <span className={`text-sm ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>API для разработчиков</span>
                    <div className="w-12 h-6 bg-yellow-500/20 border border-yellow-500/30 rounded-full flex items-center justify-end pr-1">
                      <div className="w-4 h-4 bg-yellow-500 rounded-full"></div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 grid grid-cols-3 gap-4">
                <div className={`rounded-lg p-3 text-center transition-colors duration-300 ${
                  isDarkMode 
                    ? 'bg-gray-900 border border-gray-800' 
                    : 'bg-gray-100 border border-gray-200'
                }`}>
                  <div className={`text-sm font-medium ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>SOC 2</div>
                  <div className={`text-xs mt-1 ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>Сертификат</div>
                </div>
                <div className={`rounded-lg p-3 text-center transition-colors duration-300 ${
                  isDarkMode 
                    ? 'bg-gray-900 border border-gray-800' 
                    : 'bg-gray-100 border border-gray-200'
                }`}>
                  <div className={`text-sm font-medium ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>ISO 27001</div>
                  <div className={`text-xs mt-1 ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>Стандарт</div>
                </div>
                <div className={`rounded-lg p-3 text-center transition-colors duration-300 ${
                  isDarkMode 
                    ? 'bg-gray-900 border border-gray-800' 
                    : 'bg-gray-100 border border-gray-200'
                }`}>
                  <div className={`text-sm font-medium ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>152-ФЗ</div>
                  <div className={`text-xs mt-1 ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>Соответствие</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* User Experience Section with Display Cards */}
      <section className={`py-20 border-t page-section transition-colors duration-300 ${
        isDarkMode ? 'border-gray-800' : 'border-gray-200'
      }`}>
        <div className="max-w-7xl mx-auto px-4 layout-content-root">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left side - Content */}
            <div>
              <h2 className="text-3xl md:text-4xl font-normal mb-8 tracking-tight">
                Опыт работы{' '}
                <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>наших клиентов</span>
              </h2>
              
              <div className="space-y-6 mb-8">
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-green-500/10 border border-green-500/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium mb-2">Мгновенные результаты</h3>
                    <p className={`text-sm leading-relaxed ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      Получайте детальный анализ КП за 2-3 минуты вместо нескольких часов ручной работы экспертов
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-blue-500/10 border border-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium mb-2">Объективность решений</h3>
                    <p className={`text-sm leading-relaxed ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      ИИ исключает человеческий фактор и субъективность при оценке коммерческих предложений
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-yellow-500/10 border border-yellow-500/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium mb-2">Масштабируемость</h3>
                    <p className={`text-sm leading-relaxed ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      Обрабатывайте неограниченное количество тендеров параллельно без потери качества анализа
                    </p>
                  </div>
                </div>
              </div>

              <button 
                onClick={() => navigate('/kp-analyzer')}
                className={`px-6 py-3 rounded-md font-medium transition-colors ${
                  isDarkMode
                    ? 'bg-white text-black hover:bg-gray-100'
                    : 'bg-gray-900 text-white hover:bg-gray-800'
                }`}
              >
                Попробовать бесплатно
              </button>
            </div>

            {/* Right side - Display Cards */}
            <div className="flex justify-center">
              <DisplayCards cards={[
                {
                  icon: <FileText className="w-4 h-4 text-purple-300" />,
                  title: "ООО \"СтройИнвест\"",
                  description: "Анализ 50+ КП в день",
                  date: "Экономия: 120 часов/месяц",
                  titleClassName: "text-purple-500 dark:text-purple-400",
                  className: "[grid-area:stack] hover:-translate-y-10 before:absolute before:w-[100%] before:outline-1 before:rounded-xl before:outline-purple-400 dark:before:outline-purple-700 before:h-[100%] before:content-[''] before:bg-blend-overlay before:bg-white/40 dark:before:bg-purple-900/50 grayscale-[100%] hover:before:opacity-0 before:transition-opacity before:duration-700 hover:grayscale-0 before:left-0 before:top-0",
                },
                {
                  icon: <Menu className="w-4 h-4 text-cyan-300" />,
                  title: "\"МегаДевелопмент\"",
                  description: "Точность выбора поставщиков: 98%",
                  date: "Снижение рисков на 45%",
                  titleClassName: "text-cyan-500 dark:text-cyan-400",
                  className: "[grid-area:stack] translate-x-16 translate-y-10 hover:-translate-y-1 before:absolute before:w-[100%] before:outline-1 before:rounded-xl before:outline-cyan-400 dark:before:outline-cyan-700 before:h-[100%] before:content-[''] before:bg-blend-overlay before:bg-white/40 dark:before:bg-cyan-900/50 grayscale-[100%] hover:before:opacity-0 before:transition-opacity before:duration-700 hover:grayscale-0 before:left-0 before:top-0",
                },
                {
                  icon: <Sun className="w-4 h-4 text-orange-300" />,
                  title: "\"Премиум Девелопмент\"",
                  description: "ROI увеличен на 280%",
                  date: "Оптимизация бюджета: ₽15M",
                  titleClassName: "text-orange-500 dark:text-orange-400",
                  className: "[grid-area:stack] translate-x-32 translate-y-20 hover:translate-y-10 before:absolute before:w-[100%] before:outline-1 before:rounded-xl before:outline-orange-400 dark:before:outline-orange-700 before:h-[100%] before:content-[''] before:bg-blend-overlay before:bg-white/40 dark:before:bg-orange-900/50 grayscale-[100%] hover:before:opacity-0 before:transition-opacity before:duration-700 hover:grayscale-0 before:left-0 before:top-0",
                },
              ]} />
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className={`py-20 border-t page-section transition-colors duration-300 ${
        isDarkMode ? 'border-gray-800' : 'border-gray-200'
      }`}>
        <div className="layout-content-root">
          <Pricing isDarkMode={isDarkMode} />
        </div>
      </section>

      {/* Footer */}
      <footer className={`py-12 border-t transition-colors duration-300 ${
        isDarkMode ? 'border-gray-800' : 'border-gray-200'
      }`}>
        <div className="max-w-7xl mx-auto px-4 layout-content-root">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className={`w-5 h-5 rounded flex items-center justify-center transition-colors duration-300 ${
                  isDarkMode ? 'bg-white' : 'bg-gray-900'
                }`}>
                  <FileText className={`w-3 h-3 ${
                    isDarkMode ? 'text-black' : 'text-white'
                  }`} />
                </div>
                <span className={`font-medium transition-colors duration-300 ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>DevAssist Pro</span>
              </div>
              <p className={`text-sm transition-colors duration-300 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Веб-портал для застройщиков нового поколения
              </p>
            </div>

            <div>
              <h4 className={`font-medium mb-3 transition-colors duration-300 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>Продукт</h4>
              <ul className={`space-y-2 text-sm transition-colors duration-300 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                <li><a href="#" className={`transition-colors ${
                  isDarkMode ? 'hover:text-white' : 'hover:text-gray-900'
                }`}>КП Анализатор</a></li>
                <li><a href="#" className={`transition-colors ${
                  isDarkMode ? 'hover:text-white' : 'hover:text-gray-900'
                }`}>ТЗ Генератор</a></li>
                <li><a href="#" className={`transition-colors ${
                  isDarkMode ? 'hover:text-white' : 'hover:text-gray-900'
                }`}>Аналитика</a></li>
              </ul>
            </div>

            <div>
              <h4 className={`font-medium mb-3 transition-colors duration-300 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>Компания</h4>
              <ul className={`space-y-2 text-sm transition-colors duration-300 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                <li><a href="#" className={`transition-colors ${
                  isDarkMode ? 'hover:text-white' : 'hover:text-gray-900'
                }`}>О нас</a></li>
                <li><a href="#" className={`transition-colors ${
                  isDarkMode ? 'hover:text-white' : 'hover:text-gray-900'
                }`}>Блог</a></li>
                <li><a href="#" className={`transition-colors ${
                  isDarkMode ? 'hover:text-white' : 'hover:text-gray-900'
                }`}>Карьера</a></li>
              </ul>
            </div>

            <div>
              <h4 className={`font-medium mb-3 transition-colors duration-300 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>Поддержка</h4>
              <ul className={`space-y-2 text-sm transition-colors duration-300 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                <li><a href="#" className={`transition-colors ${
                  isDarkMode ? 'hover:text-white' : 'hover:text-gray-900'
                }`}>Документация</a></li>
                <li><a href="#" className={`transition-colors ${
                  isDarkMode ? 'hover:text-white' : 'hover:text-gray-900'
                }`}>API</a></li>
                <li><a href="#" className={`transition-colors ${
                  isDarkMode ? 'hover:text-white' : 'hover:text-gray-900'
                }`}>Контакты</a></li>
              </ul>
            </div>
          </div>
          
          <div className={`pt-8 border-t text-center text-sm transition-colors duration-300 ${
            isDarkMode 
              ? 'border-gray-800 text-gray-400' 
              : 'border-gray-200 text-gray-600'
          }`}>
            <p>&copy; 2024 DevAssist Pro. Все права защищены.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;