import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { AnimatedHero } from '../components/ui/animated-hero';
import { Features } from '../components/blocks/features-8';
const logoLight = '/devent-logo.png';
const logoDark = '/devent-logo-white1.png';
import { 
  ChevronDown, 
  ChevronRight, 
  Menu, 
  Moon, 
  Sun, 
  Check, 
  Crown,
  Vegan,
  Ghost,
  Puzzle,
  Squirrel,
  Cookie,
  Drama,
  SunDim,
  Blocks,
  Zap,
  Shield,
  Users,
  Mail,
  Phone,
  MapPin,
  Linkedin,
  Twitter,
  Github,
  User,
  LogOut
} from 'lucide-react';

const CosmicLandingPage: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { isDarkMode, toggleTheme } = useTheme();
  const { isAuthenticated, user, logout } = useAuth();

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/', { replace: true });
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 from-muted to-primary/5 bg-gradient-to-tl ${
      isDarkMode ? 'dark' : ''
    }`}>
      {/* Header */}
      <header className="sticky top-2 z-40 lg:top-5">
        <div className="container max-w-7xl">
          <div className="bg-background/70 flex items-center justify-between rounded-2xl border p-3 backdrop-blur-sm min-h-[60px]">
            {/* Logo */}
            <a className="flex font-bold items-center" href="#home">
              <img 
                src={isDarkMode ? logoDark : logoLight} 
                alt="DevAssist Pro" 
                className="size-7 lg:size-8 mr-2" 
              />
              <h5 className="text-lg lg:text-xl">DevAssist Pro</h5>
            </a>

            {/* Mobile Menu Button */}
            <div className="flex items-center gap-2 lg:hidden">
              {isAuthenticated && user ? (
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => navigate('/dashboard')}
                    className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-all hover:bg-accent hover:text-accent-foreground h-8 rounded-md px-3 border border-border"
                  >
                    <User className="w-4 h-4" />
                    {user.firstName || user.email}
                  </button>
                </div>
              ) : (
                <button 
                  onClick={() => navigate('/auth/login')}
                  className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-all hover:bg-accent hover:text-accent-foreground h-8 rounded-md px-3 border border-border"
                >
                  Войти
                </button>
              )}
              <Menu 
                className="cursor-pointer" 
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              />
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden lg:block">
              <ul className="flex items-center justify-center gap-1 space-x-0">
                <li>
                  <button className="group inline-flex h-9 w-max items-center justify-center rounded-md px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground transition-all bg-transparent">
                    Продукты
                    <ChevronDown className="ml-1 size-3 transition duration-300 group-hover:rotate-180" />
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => scrollToSection('solutions')}
                    className="inline-flex h-9 w-max items-center justify-center rounded-md px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-all bg-transparent"
                  >
                    Решения
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => scrollToSection('pricing')}
                    className="inline-flex h-9 w-max items-center justify-center rounded-md px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-all bg-transparent"
                  >
                    Тарифы
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => scrollToSection('team')}
                    className="inline-flex h-9 w-max items-center justify-center rounded-md px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-all bg-transparent"
                  >
                    Команда
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => scrollToSection('contact')}
                    className="inline-flex h-9 w-max items-center justify-center rounded-md px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-all bg-transparent"
                  >
                    Контакты
                  </button>
                </li>
              </ul>
            </nav>

            {/* Theme Toggle & Actions */}
            <div className="hidden items-center lg:flex gap-2">
              <button 
                onClick={toggleTheme}
                className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all hover:bg-accent hover:text-accent-foreground size-9 mr-2"
              >
                <div className="flex items-center gap-2 dark:hidden">
                  <Moon />
                </div>
                <div className="dark:flex items-center gap-2 hidden">
                  <Sun />
                </div>
              </button>
              <div className="flex gap-2">
                {isAuthenticated && user ? (
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => navigate('/dashboard')}
                      className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-all bg-primary text-primary-foreground shadow-xs hover:bg-primary/90 h-10 rounded-md px-4"
                    >
                      <User className="w-4 h-4" />
                      Панель управления
                    </button>
                    <button 
                      onClick={handleLogout}
                      className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-all hover:bg-accent hover:text-accent-foreground h-10 rounded-md px-4 border border-border"
                    >
                      <LogOut className="w-4 h-4" />
                      Выйти
                    </button>
                  </div>
                ) : (
                  <>
                    <button 
                      onClick={() => navigate('/auth/login')}
                      className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-all hover:bg-accent hover:text-accent-foreground h-10 rounded-md px-6 border border-border"
                    >
                      Войти
                    </button>
                    <button 
                      onClick={() => navigate('/auth/register')}
                      className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-all bg-primary text-primary-foreground shadow-xs hover:bg-primary/90 h-10 rounded-md px-6"
                    >
                      Начать
                      <ChevronRight />
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="lg:hidden">
            <div className="container">
              <div className="bg-background/95 backdrop-blur-sm border rounded-2xl mt-2 p-4">
                <nav className="space-y-4">
                  <button 
                    onClick={() => {
                      scrollToSection('solutions');
                      setIsMenuOpen(false);
                    }}
                    className="block w-full text-left px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground rounded-md transition-all"
                  >
                    Решения
                  </button>
                  <button 
                    onClick={() => {
                      scrollToSection('pricing');
                      setIsMenuOpen(false);
                    }}
                    className="block w-full text-left px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground rounded-md transition-all"
                  >
                    Тарифы
                  </button>
                  <button 
                    onClick={() => {
                      scrollToSection('team');
                      setIsMenuOpen(false);
                    }}
                    className="block w-full text-left px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground rounded-md transition-all"
                  >
                    Команда
                  </button>
                  <button 
                    onClick={() => {
                      scrollToSection('contact');
                      setIsMenuOpen(false);
                    }}
                    className="block w-full text-left px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground rounded-md transition-all"
                  >
                    Контакты
                  </button>
                  <div className="border-t pt-4 space-y-2">
                    {isAuthenticated && user ? (
                      <>
                        <div className="px-4 py-2 text-sm text-muted-foreground">
                          {user.firstName || user.email}
                        </div>
                        <button 
                          onClick={() => {
                            navigate('/dashboard');
                            setIsMenuOpen(false);
                          }}
                          className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-all"
                        >
                          <User className="w-4 h-4" />
                          Панель управления
                        </button>
                        <button 
                          onClick={() => {
                            handleLogout();
                            setIsMenuOpen(false);
                          }}
                          className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm font-medium border border-border rounded-md hover:bg-accent hover:text-accent-foreground transition-all"
                        >
                          <LogOut className="w-4 h-4" />
                          Выйти
                        </button>
                      </>
                    ) : (
                      <button 
                        onClick={() => {
                          navigate('/auth/register');
                          setIsMenuOpen(false);
                        }}
                        className="block w-full text-left px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-all"
                      >
                        Начать
                      </button>
                    )}
                  </div>
                </nav>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Animated Hero Section */}
      <AnimatedHero
        title="Революция в анализе коммерческих предложений для девелоперов"
        animatedWords={[
          'КП и ТЗ',
          'документации',
          'бизнес-планов',
          'проектов',
          'предложений'
        ]}
        subtitle="🚀 Новинка - AI-Powered анализ"
        description="Встречайте DevAssist Pro — первую в России AI-платформу для автоматизации процессов анализа КП в сфере недвижимости. Экономьте время, повышайте точность решений и опережайте конкурентов."
        primaryButtonText="Попробовать бесплатно"
        secondaryButtonText="Демо за 5 минут"
        onPrimaryClick={() => navigate('/auth/register')}
        onSecondaryClick={() => navigate('/dashboard')}
        features={[
          'Без кредитной карты',
          '14-дневный пробный период',
          'Отмена в любое время'
        ]}
        className="pt-8"
      />

      {/* Company Logos */}
      <section className="pb-12 lg:pb-24">
        <div className="container overflow-hidden">
          <div className="flex w-max animate-scroll" style={{gap: '50px'}}>
            {Array(2).fill(null).map((_, index) => (
              <React.Fragment key={index}>
                <div className="flex items-center text-xl font-medium md:text-2xl">
                  <Crown className="text-foreground mr-3 size-6" />
                  ПИК
                </div>
                <div className="flex items-center text-xl font-medium md:text-2xl">
                  <Vegan className="text-foreground mr-3 size-6" />
                  Сбербанк
                </div>
                <div className="flex items-center text-xl font-medium md:text-2xl">
                  <Ghost className="text-foreground mr-3 size-6" />
                  МТС
                </div>
                <div className="flex items-center text-xl font-medium md:text-2xl">
                  <Puzzle className="text-foreground mr-3 size-6" />
                  Лидер Групп
                </div>
                <div className="flex items-center text-xl font-medium md:text-2xl">
                  <Squirrel className="text-foreground mr-3 size-6" />
                  А101
                </div>
                <div className="flex items-center text-xl font-medium md:text-2xl">
                  <Cookie className="text-foreground mr-3 size-6" />
                  Самолет
                </div>
                <div className="flex items-center text-xl font-medium md:text-2xl">
                  <Drama className="text-foreground mr-3 size-6" />
                  Инград
                </div>
              </React.Fragment>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <Features />

      {/* Solutions Section */}
      <section id="solutions" className="py-20 sm:py-32">
        <div className="container">
          <div className="mx-auto max-w-4xl text-center">
            <div className="from-primary/60 to-primary mb-4 bg-gradient-to-b bg-clip-text font-semibold tracking-wider text-transparent uppercase animate-fade-in-up">
              Решения
            </div>
            <h2 className="mb-4 text-3xl font-bold md:text-4xl animate-fade-in-up">
              Полная экосистема для девелоперов недвижимости
            </h2>
            <p className="text-muted-foreground mb-16 text-lg animate-fade-in-up">
              От анализа КП до оценки проектов — все инструменты в одной платформе. Увеличьте эффективность работы на 300% с помощью AI-автоматизации.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {/* Solution 1 */}
            <div className="text-card-foreground rounded-xl border bg-background p-6 shadow-xs hover:shadow-lg transition-all duration-300 hover:scale-105 animate-fade-in-up">
              <div className="mb-4">
                <Blocks className="text-primary bg-primary/20 ring-primary/10 size-12 rounded-full p-3 ring-8 animate-float" />
              </div>
              <h3 className="mb-3 text-xl font-semibold">КП Анализатор</h3>
              <p className="text-muted-foreground mb-4">
                Революционная AI-система для анализа коммерческих предложений. Автоматическое сравнение с ТЗ, оценка соответствия и генерация детальных отчетов за минуты.
              </p>
              <button className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline">
                Попробовать ✓ Доступно <ChevronRight className="size-4" />
              </button>
            </div>

            {/* Solution 2 */}
            <div className="text-card-foreground rounded-xl border bg-background p-6 shadow-xs hover:shadow-lg transition-all duration-300 hover:scale-105 animate-fade-in-up">
              <div className="mb-4">
                <Zap className="text-primary bg-primary/20 ring-primary/10 size-12 rounded-full p-3 ring-8 animate-pulse-slow" />
              </div>
              <h3 className="mb-3 text-xl font-semibold">ТЗ Генератор</h3>
              <p className="text-muted-foreground mb-4">
                Умная система создания технических заданий с учетом специфики недвижимости. Шаблоны, чек-листы и автоматические рекомендации.
              </p>
              <button className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground">
                🚀 Скоро в 2024 <ChevronRight className="size-4" />
              </button>
            </div>

            {/* Solution 3 */}
            <div className="text-card-foreground rounded-xl border bg-background p-6 shadow-xs hover:shadow-lg transition-all duration-300 hover:scale-105 animate-fade-in-up">
              <div className="mb-4">
                <Shield className="text-primary bg-primary/20 ring-primary/10 size-12 rounded-full p-3 ring-8 animate-wiggle" />
              </div>
              <h3 className="mb-3 text-xl font-semibold">Оценка проектов</h3>
              <p className="text-muted-foreground mb-4">
                Комплексная оценка инвестиционной привлекательности проектов недвижимости с использованием машинного обучения и рыночных данных.
              </p>
              <button className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground">
                📊 В разработке <ChevronRight className="size-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 sm:py-32">
        <div className="container">
          <div className="mx-auto max-w-4xl text-center">
            <div className="from-primary/60 to-primary mb-4 bg-gradient-to-b bg-clip-text font-semibold tracking-wider text-transparent uppercase">
              Тарифы
            </div>
            <h2 className="mb-4 text-3xl font-bold md:text-4xl">
              Выберите подходящий план
            </h2>
            <p className="text-muted-foreground mb-16 text-lg">
              Гибкие тарифные планы для команд любого размера
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {/* Starter Plan */}
            <div className="text-card-foreground rounded-xl border bg-background p-6 shadow-xs">
              <div className="mb-6">
                <h3 className="text-xl font-semibold">Starter</h3>
                <p className="text-muted-foreground text-sm">Для небольших компаний</p>
              </div>
              <div className="mb-6">
                <span className="text-3xl font-bold">₽49,900</span>
                <span className="text-muted-foreground">/месяц</span>
              </div>
              <ul className="mb-6 space-y-3">
                <li className="flex items-center gap-2">
                  <Check className="text-primary size-4" />
                  <span className="text-sm">До 5 пользователей</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="text-primary size-4" />
                  <span className="text-sm">200 анализов КП/месяц</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="text-primary size-4" />
                  <span className="text-sm">Базовая поддержка</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="text-primary size-4" />
                  <span className="text-sm">Экспорт отчетов</span>
                </li>
              </ul>
              <button 
                onClick={() => navigate('/auth/register')}
                className="w-full inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground h-10 px-6"
              >
                Начать
              </button>
            </div>

            {/* Professional Plan */}
            <div className="text-card-foreground rounded-xl border-2 border-primary bg-background p-6 shadow-xs relative">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-medium">
                  Популярный
                </span>
              </div>
              <div className="mb-6">
                <h3 className="text-xl font-semibold">Professional</h3>
                <p className="text-muted-foreground text-sm">Для средних девелоперов</p>
              </div>
              <div className="mb-6">
                <span className="text-3xl font-bold">₽129,900</span>
                <span className="text-muted-foreground">/месяц</span>
              </div>
              <ul className="mb-6 space-y-3">
                <li className="flex items-center gap-2">
                  <Check className="text-primary size-4" />
                  <span className="text-sm">До 25 пользователей</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="text-primary size-4" />
                  <span className="text-sm">Безлимитные анализы КП</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="text-primary size-4" />
                  <span className="text-sm">Приоритетная поддержка</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="text-primary size-4" />
                  <span className="text-sm">API интеграция</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="text-primary size-4" />
                  <span className="text-sm">Персональный менеджер</span>
                </li>
              </ul>
              <button 
                onClick={() => navigate('/auth/register')}
                className="w-full inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all bg-primary text-primary-foreground shadow-xs hover:bg-primary/90 h-10 px-6"
              >
                Начать
              </button>
            </div>

            {/* Enterprise Plan */}
            <div className="text-card-foreground rounded-xl border bg-background p-6 shadow-xs">
              <div className="mb-6">
                <h3 className="text-xl font-semibold">Enterprise</h3>
                <p className="text-muted-foreground text-sm">Для крупных девелоперов</p>
              </div>
              <div className="mb-6">
                <span className="text-3xl font-bold">от ₽299,900</span>
                <span className="text-muted-foreground">/месяц</span>
              </div>
              <ul className="mb-6 space-y-3">
                <li className="flex items-center gap-2">
                  <Check className="text-primary size-4" />
                  <span className="text-sm">Безлимитные пользователи</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="text-primary size-4" />
                  <span className="text-sm">On-premise развертывание</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="text-primary size-4" />
                  <span className="text-sm">Выделенная поддержка</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="text-primary size-4" />
                  <span className="text-sm">Кастомная интеграция</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="text-primary size-4" />
                  <span className="text-sm">SLA 99.9%</span>
                </li>
              </ul>
              <button 
                onClick={() => scrollToSection('contact')}
                className="w-full inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground h-10 px-6"
              >
                Связаться
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section id="team" className="py-20 sm:py-32">
        <div className="container">
          <div className="mx-auto max-w-4xl text-center">
            <div className="from-primary/60 to-primary mb-4 bg-gradient-to-b bg-clip-text font-semibold tracking-wider text-transparent uppercase">
              Команда
            </div>
            <h2 className="mb-4 text-3xl font-bold md:text-4xl">
              Познакомьтесь с нашей командой
            </h2>
            <p className="text-muted-foreground mb-16 text-lg">
              Опытные профессионалы в области недвижимости и технологий
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {/* Team Member 1 */}
            <div className="text-card-foreground rounded-xl border bg-background p-6 shadow-xs text-center">
              <div className="mb-4">
                <div className="mx-auto size-20 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                  <Users className="size-8 text-white" />
                </div>
              </div>
              <h3 className="mb-2 text-xl font-semibold">Александр Петров</h3>
              <p className="text-muted-foreground text-sm mb-4">CEO & Основатель</p>
              <p className="text-muted-foreground text-sm mb-4">
                15+ лет в девелопменте, эксперт в области коммерческой недвижимости
              </p>
              <div className="flex justify-center gap-2">
                <Linkedin className="size-5 text-muted-foreground hover:text-primary cursor-pointer" />
                <Twitter className="size-5 text-muted-foreground hover:text-primary cursor-pointer" />
              </div>
            </div>

            {/* Team Member 2 */}
            <div className="text-card-foreground rounded-xl border bg-background p-6 shadow-xs text-center">
              <div className="mb-4">
                <div className="mx-auto size-20 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                  <Users className="size-8 text-white" />
                </div>
              </div>
              <h3 className="mb-2 text-xl font-semibold">Мария Смирнова</h3>
              <p className="text-muted-foreground text-sm mb-4">CTO</p>
              <p className="text-muted-foreground text-sm mb-4">
                Ведущий AI инженер, специалист по машинному обучению и обработке данных
              </p>
              <div className="flex justify-center gap-2">
                <Linkedin className="size-5 text-muted-foreground hover:text-primary cursor-pointer" />
                <Github className="size-5 text-muted-foreground hover:text-primary cursor-pointer" />
              </div>
            </div>

            {/* Team Member 3 */}
            <div className="text-card-foreground rounded-xl border bg-background p-6 shadow-xs text-center">
              <div className="mb-4">
                <div className="mx-auto size-20 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                  <Users className="size-8 text-white" />
                </div>
              </div>
              <h3 className="mb-2 text-xl font-semibold">Дмитрий Козлов</h3>
              <p className="text-muted-foreground text-sm mb-4">Продуктовый директор</p>
              <p className="text-muted-foreground text-sm mb-4">
                Эксперт в области UX/UI дизайна и продуктовой аналитики
              </p>
              <div className="flex justify-center gap-2">
                <Linkedin className="size-5 text-muted-foreground hover:text-primary cursor-pointer" />
                <Twitter className="size-5 text-muted-foreground hover:text-primary cursor-pointer" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 sm:py-32">
        <div className="container">
          <div className="mx-auto max-w-4xl text-center">
            <div className="from-primary/60 to-primary mb-4 bg-gradient-to-b bg-clip-text font-semibold tracking-wider text-transparent uppercase">
              Контакты
            </div>
            <h2 className="mb-4 text-3xl font-bold md:text-4xl">
              Свяжитесь с нами
            </h2>
            <p className="text-muted-foreground mb-16 text-lg">
              Готовы начать? Мы здесь, чтобы помочь вам на каждом этапе
            </p>
          </div>

          <div className="grid gap-12 lg:grid-cols-2">
            {/* Contact Form */}
            <div className="text-card-foreground rounded-xl border bg-background p-6 shadow-xs">
              <h3 className="mb-6 text-xl font-semibold">Отправить сообщение</h3>
              <form className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="text-sm font-medium block mb-2">Имя</label>
                    <input 
                      type="text" 
                      className="w-full px-3 py-2 border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                      placeholder="Ваше имя"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium block mb-2">Email</label>
                    <input 
                      type="email" 
                      className="w-full px-3 py-2 border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                      placeholder="your@email.com"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium block mb-2">Тема</label>
                  <input 
                    type="text" 
                    className="w-full px-3 py-2 border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="Тема сообщения"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-2">Сообщение</label>
                  <textarea 
                    rows={6}
                    className="w-full px-3 py-2 border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                    placeholder="Расскажите нам о вашем проекте..."
                  />
                </div>
                <button 
                  type="submit"
                  className="w-full inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all bg-primary text-primary-foreground shadow-xs hover:bg-primary/90 h-10 px-6"
                >
                  Отправить сообщение
                  <ChevronRight className="size-4" />
                </button>
              </form>
            </div>

            {/* Contact Info */}
            <div className="space-y-8">
              <div className="text-card-foreground rounded-xl border bg-background p-6 shadow-xs">
                <div className="flex items-start gap-4">
                  <Mail className="text-primary size-6 mt-1" />
                  <div>
                    <h4 className="font-semibold mb-2">Email</h4>
                    <p className="text-muted-foreground">hello@devassist.pro</p>
                    <p className="text-muted-foreground">support@devassist.pro</p>
                  </div>
                </div>
              </div>

              <div className="text-card-foreground rounded-xl border bg-background p-6 shadow-xs">
                <div className="flex items-start gap-4">
                  <Phone className="text-primary size-6 mt-1" />
                  <div>
                    <h4 className="font-semibold mb-2">Телефон</h4>
                    <p className="text-muted-foreground">+7 (495) 123-45-67</p>
                    <p className="text-muted-foreground">+7 (800) 123-45-67</p>
                  </div>
                </div>
              </div>

              <div className="text-card-foreground rounded-xl border bg-background p-6 shadow-xs">
                <div className="flex items-start gap-4">
                  <MapPin className="text-primary size-6 mt-1" />
                  <div>
                    <h4 className="font-semibold mb-2">Офис</h4>
                    <p className="text-muted-foreground">
                      Москва, ул. Тверская, 1<br />
                      БЦ "Технопарк", офис 501
                    </p>
                  </div>
                </div>
              </div>

              <div className="text-card-foreground rounded-xl border bg-background p-6 shadow-xs">
                <h4 className="font-semibold mb-4">Часы работы</h4>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Пн - Пт:</span>
                    <span>9:00 - 18:00</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Сб:</span>
                    <span>10:00 - 16:00</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Вс:</span>
                    <span>Выходной</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-background">
        <div className="container py-12">
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {/* Company Info */}
            <div>
              <div className="flex items-center mb-4">
                <img 
                  src={isDarkMode ? logoDark : logoLight} 
                  alt="DevAssist Pro" 
                  className="size-8 mr-2" 
                />
                <h5 className="text-xl font-bold">DevAssist Pro</h5>
              </div>
              <p className="text-muted-foreground text-sm mb-4">
                AI-powered решения для оптимизации процессов в девелопменте недвижимости.
              </p>
              <div className="flex gap-2">
                <Linkedin className="size-5 text-muted-foreground hover:text-primary cursor-pointer" />
                <Twitter className="size-5 text-muted-foreground hover:text-primary cursor-pointer" />
                <Github className="size-5 text-muted-foreground hover:text-primary cursor-pointer" />
              </div>
            </div>

            {/* Products */}
            <div>
              <h6 className="font-semibold mb-4">Продукты</h6>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-primary">КП Анализатор</a></li>
                <li><a href="#" className="hover:text-primary">ТЗ Генератор</a></li>
                <li><a href="#" className="hover:text-primary">Оценка проектов</a></li>
                <li><a href="#" className="hover:text-primary">База знаний</a></li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h6 className="font-semibold mb-4">Компания</h6>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-primary">О нас</a></li>
                <li><a href="#" className="hover:text-primary">Команда</a></li>
                <li><a href="#" className="hover:text-primary">Карьера</a></li>
                <li><a href="#" className="hover:text-primary">Новости</a></li>
              </ul>
            </div>

            {/* Support */}
            <div>
              <h6 className="font-semibold mb-4">Поддержка</h6>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-primary">Документация</a></li>
                <li><a href="#" className="hover:text-primary">API</a></li>
                <li><a href="#" className="hover:text-primary">Поддержка</a></li>
                <li><a href="#" className="hover:text-primary">Статус</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-muted-foreground text-sm">
              © 2024 DevAssist Pro. Все права защищены.
            </p>
            <div className="flex gap-6 text-sm text-muted-foreground mt-4 md:mt-0">
              <a href="#" className="hover:text-primary">Конфиденциальность</a>
              <a href="#" className="hover:text-primary">Условия</a>
              <a href="#" className="hover:text-primary">Cookies</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default CosmicLandingPage;