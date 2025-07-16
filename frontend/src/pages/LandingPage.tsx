import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Features } from '../components/blocks/features-8';
import { 
  FileText, 
  ArrowRight, 
  Menu, 
  X, 
  Sun, 
  Moon, 
  SunDim,
  Check,
  ChevronRight,
  ChevronDown,
  Blocks,
  Zap,
  Shield,
  Crown,
  Vegan,
  Ghost,
  Puzzle,
  Squirrel,
  Cookie,
  Drama,
  Star,
  Mail,
  Phone,
  MapPin,
  User,
  LogOut
} from 'lucide-react';
import DisplayCards from '../components/ui/DisplayCards';
import Pricing from '../components/ui/PricingCard';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuth();
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

  const heroText = "Оптимизируйте свой веб-сайт с поддержкой ИИ";
  const words = heroText.split(' ');

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/', { replace: true });
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

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
      className={`min-h-screen transition-colors duration-300 scroll-smooth ${
        isDarkMode 
          ? 'bg-gradient-to-tl from-gray-900 to-primary/5 text-white' 
          : 'bg-gradient-to-tl from-gray-50 to-primary/5 text-gray-900'
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
      <header className="sticky top-2 z-40 lg:top-5">
        <div className="container mx-auto px-4">
          <div className={`flex items-center justify-between rounded-2xl border p-3 backdrop-blur-sm transition-colors duration-300 ${
            isDarkMode 
              ? 'bg-gray-900/70 border-gray-700' 
              : 'bg-white/70 border-gray-200'
          }`}>
            {/* Logo */}
            <a href="#" className="flex font-bold items-center">
              <span className={`flex items-center justify-center size-7 lg:size-8 mr-2 rounded-lg border border-secondary transition-colors duration-300 ${
                isDarkMode 
                  ? 'bg-gradient-to-tr from-primary via-primary/70 to-primary' 
                  : 'bg-gradient-to-tr from-primary via-primary/70 to-primary'
              }`}>
                <SunDim className="size-5 lg:size-6 text-white" />
              </span>
              <h5 className="text-lg lg:text-xl">DevAssist Pro</h5>
            </a>

            {/* Mobile menu button */}
            <div className="flex items-center lg:hidden">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="cursor-pointer lg:hidden"
                type="button"
              >
                <Menu className="w-6 h-6" />
              </button>
            </div>
            
            {/* Desktop Navigation */}
            <nav className="group/navigation-menu relative max-w-max flex-1 items-center justify-center mx-auto hidden lg:block">
              <div className="relative">
                <ul className="group flex flex-1 list-none items-center justify-center gap-1 space-x-0">
                  <li className="relative">
                    <button className={`group inline-flex h-9 w-max items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                      isDarkMode 
                        ? 'hover:bg-gray-700 hover:text-white focus:bg-gray-700 focus:text-white' 
                        : 'hover:bg-gray-100 hover:text-gray-900 focus:bg-gray-100 focus:text-gray-900'
                    }`}>
                      Продукты
                      <ChevronDown className="relative top-[1px] ml-1 size-3 transition duration-300 group-data-[state=open]:rotate-180" />
                    </button>
                  </li>
                  <li className="relative">
                    <a href="#solutions" className={`inline-flex h-9 w-max items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                      isDarkMode 
                        ? 'hover:bg-gray-700 hover:text-white focus:bg-gray-700 focus:text-white' 
                        : 'hover:bg-gray-100 hover:text-gray-900 focus:bg-gray-100 focus:text-gray-900'
                    }`}>
                      Решения
                    </a>
                  </li>
                  <li className="relative">
                    <a href="#pricing" className={`inline-flex h-9 w-max items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                      isDarkMode 
                        ? 'hover:bg-gray-700 hover:text-white focus:bg-gray-700 focus:text-white' 
                        : 'hover:bg-gray-100 hover:text-gray-900 focus:bg-gray-100 focus:text-gray-900'
                    }`}>
                      Цены
                    </a>
                  </li>
                  <li className="relative">
                    <a href="#team" className={`inline-flex h-9 w-max items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                      isDarkMode 
                        ? 'hover:bg-gray-700 hover:text-white focus:bg-gray-700 focus:text-white' 
                        : 'hover:bg-gray-100 hover:text-gray-900 focus:bg-gray-100 focus:text-gray-900'
                    }`}>
                      Команда
                    </a>
                  </li>
                  <li className="relative">
                    <a href="#contact" className={`inline-flex h-9 w-max items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                      isDarkMode 
                        ? 'hover:bg-gray-700 hover:text-white focus:bg-gray-700 focus:text-white' 
                        : 'hover:bg-gray-100 hover:text-gray-900 focus:bg-gray-100 focus:text-gray-900'
                    }`}>
                      Контакты
                    </a>
                  </li>
                </ul>
              </div>
            </nav>

            {/* Desktop Buttons */}
            <div className="hidden items-center lg:flex">
              <button
                onClick={toggleTheme}
                className={`inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 size-9 ${
                  isDarkMode 
                    ? 'hover:bg-gray-700 hover:text-white' 
                    : 'hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <div className={`flex items-center gap-2 ${isDarkMode ? 'hidden' : ''}`}>
                  <Moon className="w-5 h-5" />
                  <span className="block lg:hidden">Тёмная</span>
                </div>
                <div className={`flex items-center gap-2 ${isDarkMode ? '' : 'hidden'}`}>
                  <Sun className="w-5 h-5" />
                  <span className="block lg:hidden">Светлая</span>
                </div>
                <span className="sr-only">Изменить тему</span>
              </button>
              <div className="flex gap-2">
                {isAuthenticated && user ? (
                  <div className="flex items-center gap-3">
                    <div className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      Добро пожаловать, {user.firstName || user.email}
                    </div>
                    <button 
                      onClick={() => navigate('/dashboard')}
                      className={`inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-all h-10 rounded-md px-6 ${
                        isDarkMode
                          ? 'bg-white text-black hover:bg-gray-100 shadow-sm'
                          : 'bg-gray-900 text-white hover:bg-gray-800 shadow-sm'
                      }`}
                    >
                      <User className="w-4 h-4" />
                      Панель управления
                    </button>
                    <button 
                      onClick={handleLogout}
                      className={`inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-all h-10 rounded-md px-4 border ${
                        isDarkMode 
                          ? 'border-gray-600 hover:bg-gray-700 hover:text-white' 
                          : 'border-gray-300 hover:bg-gray-100 hover:text-gray-900'
                      }`}
                    >
                      <LogOut className="w-4 h-4" />
                      Выйти
                    </button>
                  </div>
                ) : (
                  <>
                    <button 
                      onClick={() => navigate('/auth/login')}
                      className={`inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 h-10 rounded-md px-6 ${
                        isDarkMode 
                          ? 'hover:bg-gray-700 hover:text-white' 
                          : 'hover:bg-gray-100 hover:text-gray-900'
                      }`}
                    >
                      Войти
                    </button>
                    <button 
                      onClick={() => navigate('/auth/register')}
                      className={`inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 h-10 rounded-md px-6 ${
                        isDarkMode
                          ? 'bg-white text-black hover:bg-gray-100 shadow-sm'
                          : 'bg-gray-900 text-white hover:bg-gray-800 shadow-sm'
                      }`}
                    >
                      Начать
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            </div>

          </div>
        </div>

      </header>

      {/* Hero Section */}
      <section className="container w-full">
        <div className="mx-auto grid place-items-center py-16 pb-8 md:py-32 md:pb-14 lg:max-w-5xl">
          <div className="relative flex w-full items-center justify-center overflow-hidden">
            {/* Animated background lines */}
            <div className="absolute inset-0 flex items-center justify-center">
              {[30, 100, 400, 600, 800, 1000, 1200].map((x, i) => (
                <div 
                  key={i}
                  className={`absolute top-20 left-0 w-px rounded-full bg-gradient-to-t from-primary via-secondary to-transparent ${
                    [14, 6, 14, 14, 20, 12, 6][i] === 14 ? 'h-14' : 
                    [14, 6, 14, 14, 20, 12, 6][i] === 20 ? 'h-20' : 
                    [14, 6, 14, 14, 20, 12, 6][i] === 12 ? 'h-12' : 'h-6'
                  }`} 
                  style={{
                    transform: `translateX(${x}px) translateY(-200px)`
                  }}
                />
              ))}
            </div>

            <div className="space-y-8 pb-8 text-center lg:pb-20">
              {/* Badge */}
              <span className={`inline-flex items-center justify-center rounded-md border px-2 font-medium w-fit whitespace-nowrap py-2 text-sm transition-colors ${
                isDarkMode 
                  ? 'bg-gray-800 border-gray-700 text-gray-200' 
                  : 'bg-gray-100 border-gray-200 text-gray-700'
              }`}>
                <span className="text-primary mr-2">
                  <span className={`inline-flex items-center justify-center rounded-md border px-2 py-0.5 text-xs font-medium border-transparent ${
                    isDarkMode 
                      ? 'bg-gray-700 text-gray-200' 
                      : 'bg-white text-gray-700'
                  }`}>
                    Новое
                  </span>
                </span>
                <span>AI-Powered Оптимизация</span>
              </span>

              {/* Main headline */}
              <div className="mx-auto max-w-4xl text-center text-4xl font-bold md:text-6xl">
                <h1>
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
                </h1>
              </div>

              {/* Subtitle */}
              <p className={`mx-auto max-w-2xl text-xl transition-all duration-700 delay-1000 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              } ${
                animatedWords.length > 5 
                  ? 'opacity-100 blur-0 translate-y-0' 
                  : 'opacity-0 blur-sm translate-y-[20%]'
              }`}>
                Встречайте наше AI-решение для SaaS, которое упростит вашу работу, 
                повысит эффективность и поможет принимать более точные решения.
              </p>

              {/* CTA Buttons */}
              <div className={`mt-8 flex flex-col justify-center gap-4 md:flex-row transition-all duration-700 delay-1200 ${
                animatedWords.length > 7 
                  ? 'opacity-100 blur-0 translate-y-0' 
                  : 'opacity-0 blur-sm translate-y-[20%]'
              }`}>
                <button 
                  onClick={() => navigate('/kp-analyzer')}
                  className={`inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-all rounded-lg shadow-sm py-2 h-12 px-10 text-base ${
                    isDarkMode 
                      ? 'bg-white text-black hover:bg-gray-100' 
                      : 'bg-gray-900 text-white hover:bg-gray-800'
                  }`}
                >
                  Начать бесплатно
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button className={`inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium transition-all border shadow-sm py-2 h-12 px-10 text-base ${
                  isDarkMode 
                    ? 'bg-gray-800 border-gray-700 hover:bg-gray-700 hover:text-white' 
                    : 'bg-white border-gray-200 hover:bg-gray-50 hover:text-gray-900'
                }`}>
                  Запросить демо
                </button>
              </div>

              {/* Features list */}
              <div className={`mt-6 flex flex-col items-center justify-center gap-4 text-sm md:flex-row transition-all duration-700 delay-1400 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              } ${
                animatedWords.length > 8 
                  ? 'opacity-100 blur-0 translate-y-0' 
                  : 'opacity-0 blur-sm translate-y-[20%]'
              }`}>
                <div className="flex items-center gap-1">
                  <Check className="text-primary size-4" />
                  <span>Без карты</span>
                </div>
                <div className="flex items-center gap-1">
                  <Check className="text-primary size-4" />
                  <span>14-дневная пробная версия</span>
                </div>
                <div className="flex items-center gap-1">
                  <Check className="text-primary size-4" />
                  <span>Отмена в любое время</span>
                </div>
              </div>
            </div>
          </div>

          {/* Hero Image */}
          <div className={`group relative transition-all duration-1000 delay-1600 ${
            animatedWords.length > 8 
              ? 'opacity-100 blur-0 translate-y-0' 
              : 'opacity-0 blur-sm translate-y-[20%]'
          }`}>
            <div className={`absolute top-2 left-1/2 mx-auto h-24 w-[90%] -translate-x-1/2 transform rounded-full blur-3xl lg:-top-8 lg:h-80 ${
              isDarkMode ? 'bg-primary/60' : 'bg-primary/60'
            }`} />
            <img 
              alt="DevAssist Pro landing page" 
              loading="lazy" 
              width={1240} 
              height={1200} 
              className="rounded-lg relative mx-auto flex w-full items-center rounded-lg leading-none"
              style={{
                maskImage: 'linear-gradient(to bottom, black 20%, transparent 90%)',
                WebkitMaskImage: 'linear-gradient(to bottom, black 20%, transparent 90%)'
              }}
              src="/hero.png" 
            />
          </div>
        </div>
      </section>

      {/* Company Logos Section */}
      <section className="pb-12 lg:pb-24">
        <div className="container">
          <div className="overflow-hidden">
            <div className="flex w-max" style={{ gap: '50px', flexDirection: 'row' }}>
              {[
                { icon: Crown, name: 'Amazon' },
                { icon: Vegan, name: 'Linkedin' },
                { icon: Ghost, name: 'Google' },
                { icon: Puzzle, name: 'Apple' },
                { icon: Squirrel, name: 'Android' },
                { icon: Cookie, name: 'Acmee' },
                { icon: Drama, name: 'Shadcn' },
                { icon: Crown, name: 'Amazon' },
                { icon: Vegan, name: 'Linkedin' },
                { icon: Ghost, name: 'Google' },
                { icon: Puzzle, name: 'Apple' },
                { icon: Squirrel, name: 'Android' },
                { icon: Cookie, name: 'Acmee' },
                { icon: Drama, name: 'Shadcn' },
              ].map((company, index) => {
                const IconComponent = company.icon;
                return (
                  <div key={index} className="flex items-center text-xl font-medium md:text-2xl">
                    <IconComponent className={`mr-3 size-6 ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`} />
                    {company.name}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <Features />

      {/* Solutions/Features Section */}
      <section id="solutions" className={`py-20 border-t transition-colors duration-300 ${
        isDarkMode ? 'border-gray-800' : 'border-gray-200'
      }`}>
        <div className="container">
          <div className="text-center mb-16">
            <div className={`mb-4 bg-gradient-to-b from-primary/60 to-primary bg-clip-text font-semibold tracking-wider text-transparent uppercase`}>
              Решения
            </div>
            <h2 className="mb-4 text-3xl font-bold md:text-4xl">
              Мощные инструменты для вашего бизнеса
            </h2>
            <p className={`text-lg max-w-2xl mx-auto ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Комплексная система для автоматизации процессов в сфере недвижимости
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: FileText,
                title: "КП Анализатор",
                description: "Автоматический анализ коммерческих предложений с помощью ИИ. Сравнение, оценка и ранжирование поставщиков.",
                color: "blue"
              },
              {
                icon: Zap,
                title: "ТЗ Генератор",
                description: "Автоматическая генерация технических заданий на основе требований проекта и лучших практик.",
                color: "purple"
              },
              {
                icon: Shield,
                title: "Аналитика",
                description: "Подробная аналитика по проектам, поставщикам и эффективности процессов принятия решений.",
                color: "green"
              }
            ].map((feature, index) => {
              const IconComponent = feature.icon;
              return (
                <div key={index} className={`text-center p-6 rounded-xl border transition-all duration-300 hover:scale-105 ${
                  isDarkMode 
                    ? 'bg-gray-900 border-gray-800 hover:bg-gray-800' 
                    : 'bg-white border-gray-200 hover:bg-gray-50'
                }`}>
                  <div className={`w-12 h-12 mx-auto mb-4 rounded-lg flex items-center justify-center ${
                    feature.color === 'blue' 
                      ? 'bg-blue-500/10 border border-blue-500/20' 
                      : feature.color === 'purple' 
                      ? 'bg-purple-500/10 border border-purple-500/20' 
                      : 'bg-green-500/10 border border-green-500/20'
                  }`}>
                    <IconComponent className={`w-6 h-6 ${
                      feature.color === 'blue' 
                        ? 'text-blue-400' 
                        : feature.color === 'purple' 
                        ? 'text-purple-400' 
                        : 'text-green-400'
                    }`} />
                  </div>
                  <h3 className="text-lg font-medium mb-2">{feature.title}</h3>
                  <p className={`text-sm leading-relaxed ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section id="team" className={`py-20 border-t transition-colors duration-300 ${
        isDarkMode ? 'border-gray-800' : 'border-gray-200'
      }`}>
        <div className="container">
          <div className="text-center mb-16">
            <div className={`mb-4 bg-gradient-to-b from-primary/60 to-primary bg-clip-text font-semibold tracking-wider text-transparent uppercase`}>
              Команда
            </div>
            <h2 className="mb-4 text-3xl font-bold md:text-4xl">
              Эксперты в своем деле
            </h2>
            <p className={`text-lg max-w-2xl mx-auto ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Профессиональная команда разработчиков и экспертов в сфере недвижимости
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: "Алексей Петров",
                role: "Главный архитектор",
                description: "15+ лет опыта в разработке AI-решений для недвижимости",
                avatar: "AP"
              },
              {
                name: "Мария Смирнова",
                role: "Ведущий Data Scientist",
                description: "Эксперт по машинному обучению и анализу документов",
                avatar: "МС"
              },
              {
                name: "Дмитрий Козлов",
                role: "Продуктовый директор",
                description: "Специалист по недвижимости с 12-летним опытом",
                avatar: "ДК"
              }
            ].map((member, index) => (
              <div key={index} className={`text-center p-6 rounded-xl border transition-all duration-300 hover:scale-105 ${
                isDarkMode 
                  ? 'bg-gray-900 border-gray-800 hover:bg-gray-800' 
                  : 'bg-white border-gray-200 hover:bg-gray-50'
              }`}>
                <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center text-white font-bold text-lg ${
                  index === 0 ? 'bg-blue-500' : index === 1 ? 'bg-purple-500' : 'bg-green-500'
                }`}>
                  {member.avatar}
                </div>
                <h3 className="text-lg font-medium mb-1">{member.name}</h3>
                <p className={`text-sm font-medium mb-2 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  {member.role}
                </p>
                <p className={`text-sm leading-relaxed ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  {member.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className={`py-20 border-t transition-colors duration-300 ${
        isDarkMode ? 'border-gray-800' : 'border-gray-200'
      }`}>
        <div className="container">
          <div className="text-center mb-16">
            <div className={`mb-4 bg-gradient-to-b from-primary/60 to-primary bg-clip-text font-semibold tracking-wider text-transparent uppercase`}>
              Цены
            </div>
            <h2 className="mb-4 text-3xl font-bold md:text-4xl">
              Выберите подходящий план
            </h2>
            <p className={`text-lg max-w-2xl mx-auto ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Гибкие тарифы для компаний любого размера
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: "Базовый",
                price: "₽29,900",
                period: "месяц",
                description: "Идеально для малого бизнеса",
                features: [
                  "До 50 КП в месяц",
                  "Базовая аналитика",
                  "Email поддержка",
                  "Стандартные отчеты"
                ],
                highlighted: false
              },
              {
                name: "Профессиональный",
                price: "₽79,900",
                period: "месяц",
                description: "Для растущих компаний",
                features: [
                  "До 500 КП в месяц",
                  "Расширенная аналитика",
                  "Приоритетная поддержка",
                  "Кастомные отчеты",
                  "Интеграция с 1С"
                ],
                highlighted: true
              },
              {
                name: "Корпоративный",
                price: "₽199,900",
                period: "месяц",
                description: "Для крупных организаций",
                features: [
                  "Неограниченное количество КП",
                  "Полная аналитика",
                  "Персональный менеджер",
                  "Белые списки",
                  "API доступ",
                  "Обучение команды"
                ],
                highlighted: false
              }
            ].map((plan, index) => (
              <div key={index} className={`p-8 rounded-xl border transition-all duration-300 hover:scale-105 ${
                plan.highlighted 
                  ? isDarkMode 
                    ? 'bg-gray-900 border-primary shadow-lg ring-1 ring-primary' 
                    : 'bg-white border-primary shadow-lg ring-1 ring-primary'
                  : isDarkMode 
                    ? 'bg-gray-900 border-gray-800 hover:bg-gray-800' 
                    : 'bg-white border-gray-200 hover:bg-gray-50'
              }`}>
                {plan.highlighted && (
                  <div className="text-center mb-4">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                      isDarkMode ? 'bg-primary/20 text-primary' : 'bg-primary/20 text-primary'
                    }`}>
                      Популярный
                    </span>
                  </div>
                )}
                <div className="text-center mb-6">
                  <h3 className="text-xl font-semibold mb-2">{plan.name}</h3>
                  <div className="mb-2">
                    <span className="text-3xl font-bold">{plan.price}</span>
                    <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>/{plan.period}</span>
                  </div>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {plan.description}
                  </p>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, fIndex) => (
                    <li key={fIndex} className="flex items-start">
                      <Check className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                      <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>
                <button className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                  plan.highlighted 
                    ? isDarkMode
                      ? 'bg-white text-black hover:bg-gray-100'
                      : 'bg-gray-900 text-white hover:bg-gray-800'
                    : isDarkMode
                      ? 'bg-gray-800 text-white hover:bg-gray-700 border border-gray-700'
                      : 'bg-gray-100 text-gray-900 hover:bg-gray-200 border border-gray-200'
                }`}>
                  Выбрать план
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className={`py-20 border-t transition-colors duration-300 ${
        isDarkMode ? 'border-gray-800' : 'border-gray-200'
      }`}>
        <div className="container">
          <div className="text-center mb-16">
            <div className={`mb-4 bg-gradient-to-b from-primary/60 to-primary bg-clip-text font-semibold tracking-wider text-transparent uppercase`}>
              Контакты
            </div>
            <h2 className="mb-4 text-3xl font-bold md:text-4xl">
              Свяжитесь с нами
            </h2>
            <p className={`text-lg max-w-2xl mx-auto ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Готовы обсудить ваш проект? Мы поможем выбрать лучшее решение
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12">
            <div className="space-y-8">
              <div className="flex items-start space-x-4">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                  isDarkMode ? 'bg-gray-800' : 'bg-gray-100'
                }`}>
                  <Mail className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-medium mb-2">Email</h3>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    info@devassist.pro
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                  isDarkMode ? 'bg-gray-800' : 'bg-gray-100'
                }`}>
                  <Phone className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-medium mb-2">Телефон</h3>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    +7 (495) 123-45-67
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                  isDarkMode ? 'bg-gray-800' : 'bg-gray-100'
                }`}>
                  <MapPin className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-medium mb-2">Адрес</h3>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Москва, ул. Тверская, д. 123
                  </p>
                </div>
              </div>
            </div>

            <div className={`p-8 rounded-xl border ${
              isDarkMode 
                ? 'bg-gray-900 border-gray-800' 
                : 'bg-white border-gray-200'
            }`}>
              <h3 className="text-xl font-semibold mb-6">Отправьте сообщение</h3>
              <form className="space-y-4">
                <div>
                  <input 
                    type="text" 
                    placeholder="Ваше имя"
                    className={`w-full px-4 py-3 rounded-lg border transition-colors ${
                      isDarkMode 
                        ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-400' 
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    }`}
                  />
                </div>
                <div>
                  <input 
                    type="email" 
                    placeholder="Email"
                    className={`w-full px-4 py-3 rounded-lg border transition-colors ${
                      isDarkMode 
                        ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-400' 
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    }`}
                  />
                </div>
                <div>
                  <textarea 
                    placeholder="Ваше сообщение"
                    rows={4}
                    className={`w-full px-4 py-3 rounded-lg border transition-colors ${
                      isDarkMode 
                        ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-400' 
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    }`}
                  />
                </div>
                <button className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                  isDarkMode
                    ? 'bg-white text-black hover:bg-gray-100'
                    : 'bg-gray-900 text-white hover:bg-gray-800'
                }`}>
                  Отправить сообщение
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={`py-12 border-t transition-colors duration-300 ${
        isDarkMode ? 'border-gray-800' : 'border-gray-200'
      }`}>
        <div className="container">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className={`w-5 h-5 rounded flex items-center justify-center transition-colors duration-300 ${
                  isDarkMode ? 'bg-white' : 'bg-gray-900'
                }`}>
                  <SunDim className={`w-3 h-3 ${
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
                AI-powered SaaS решение для оптимизации и автоматизации бизнес-процессов
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