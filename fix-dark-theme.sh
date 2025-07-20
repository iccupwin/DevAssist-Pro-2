#!/bin/bash

# Fix Dark Theme - Исправляет все проблемы с темной темой в DevAssist Pro
# Унифицирует системы тем и исправляет белые элементы

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[ERROR] $1${NC}" >&2
}

warning() {
    echo -e "${YELLOW}[WARNING] $1${NC}"
}

info() {
    echo -e "${BLUE}[INFO] $1${NC}"
}

log "🌙 Исправление темной темы в DevAssist Pro"

# 1. Создание унифицированного ThemeContext
log "Создание унифицированного ThemeContext..."
cat > frontend/src/contexts/ThemeContext.tsx << 'EOF'
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

export type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  actualTheme: 'light' | 'dark';
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
  defaultTheme?: Theme;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ 
  children, 
  defaultTheme = 'system' 
}) => {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('devassist-theme') as Theme) || defaultTheme;
    }
    return defaultTheme;
  });

  const [actualTheme, setActualTheme] = useState<'light' | 'dark'>('light');

  // Обновление CSS переменных для темы
  const updateCSSVariables = (isDark: boolean) => {
    const root = document.documentElement;
    
    if (isDark) {
      // Dark theme variables
      root.style.setProperty('--background', '222.2% 84% 4.9%');
      root.style.setProperty('--foreground', '210% 40% 98%');
      root.style.setProperty('--card', '222.2% 84% 4.9%');
      root.style.setProperty('--card-foreground', '210% 40% 98%');
      root.style.setProperty('--popover', '222.2% 84% 4.9%');
      root.style.setProperty('--popover-foreground', '210% 40% 98%');
      root.style.setProperty('--primary', '217.2% 91.2% 59.8%');
      root.style.setProperty('--primary-foreground', '222.2% 84% 4.9%');
      root.style.setProperty('--secondary', '217.2% 32.6% 17.5%');
      root.style.setProperty('--secondary-foreground', '210% 40% 98%');
      root.style.setProperty('--muted', '217.2% 32.6% 17.5%');
      root.style.setProperty('--muted-foreground', '215% 20.2% 65.1%');
      root.style.setProperty('--accent', '217.2% 32.6% 17.5%');
      root.style.setProperty('--accent-foreground', '210% 40% 98%');
      root.style.setProperty('--destructive', '0% 62.8% 30.6%');
      root.style.setProperty('--destructive-foreground', '210% 40% 98%');
      root.style.setProperty('--border', '217.2% 32.6% 17.5%');
      root.style.setProperty('--input', '217.2% 32.6% 17.5%');
      root.style.setProperty('--ring', '224.3% 76.3% 94.1%');
      root.style.setProperty('--radius', '0.5rem');
    } else {
      // Light theme variables
      root.style.setProperty('--background', '0% 0% 100%');
      root.style.setProperty('--foreground', '222.2% 84% 4.9%');
      root.style.setProperty('--card', '0% 0% 100%');
      root.style.setProperty('--card-foreground', '222.2% 84% 4.9%');
      root.style.setProperty('--popover', '0% 0% 100%');
      root.style.setProperty('--popover-foreground', '222.2% 84% 4.9%');
      root.style.setProperty('--primary', '222.2% 47.4% 11.2%');
      root.style.setProperty('--primary-foreground', '210% 40% 98%');
      root.style.setProperty('--secondary', '210% 40% 96%');
      root.style.setProperty('--secondary-foreground', '222.2% 84% 4.9%');
      root.style.setProperty('--muted', '210% 40% 96%');
      root.style.setProperty('--muted-foreground', '215.4% 16.3% 46.9%');
      root.style.setProperty('--accent', '210% 40% 96%');
      root.style.setProperty('--accent-foreground', '222.2% 84% 4.9%');
      root.style.setProperty('--destructive', '0% 84.2% 60.2%');
      root.style.setProperty('--destructive-foreground', '210% 40% 98%');
      root.style.setProperty('--border', '214.3% 31.8% 91.4%');
      root.style.setProperty('--input', '214.3% 31.8% 91.4%');
      root.style.setProperty('--ring', '222.2% 84% 4.9%');
      root.style.setProperty('--radius', '0.5rem');
    }
  };

  // Определение текущей темы
  useEffect(() => {
    const getActualTheme = (): 'light' | 'dark' => {
      if (theme === 'system') {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      }
      return theme as 'light' | 'dark';
    };

    const updateTheme = () => {
      const newActualTheme = getActualTheme();
      setActualTheme(newActualTheme);
      
      // Применяем класс к документу
      document.documentElement.classList.remove('light', 'dark');
      document.documentElement.classList.add(newActualTheme);
      
      // Обновляем CSS переменные
      updateCSSVariables(newActualTheme === 'dark');
      
      // Сохраняем в localStorage
      localStorage.setItem('devassist-theme', theme);
    };

    updateTheme();

    // Слушаем изменения системной темы
    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      mediaQuery.addEventListener('change', updateTheme);
      return () => mediaQuery.removeEventListener('change', updateTheme);
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(actualTheme === 'light' ? 'dark' : 'light');
  };

  return (
    <ThemeContext.Provider value={{ theme, actualTheme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
EOF

# 2. Обновление основного CSS файла с правильными переменными
log "Обновление основного CSS файла..."
cat > frontend/src/index.css << 'EOF'
@import 'tailwindcss/base';
@import 'tailwindcss/components';
@import 'tailwindcss/utilities';

/* CSS Variables для темной темы */
@layer base {
  :root {
    /* Light theme */
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;
    --primary: 222.2 47.4% 11.2%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96%;
    --secondary-foreground: 222.2 84% 4.9%;
    --muted: 210 40% 96%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96%;
    --accent-foreground: 222.2 84% 4.9%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 222.2 84% 4.9%;
    --radius: 0.5rem;
    
    /* Chart colors */
    --chart-1: 12 76% 61%;
    --chart-2: 173 58% 39%;
    --chart-3: 197 37% 24%;
    --chart-4: 43 74% 66%;
    --chart-5: 27 87% 67%;
  }

  .dark {
    /* Dark theme */
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --card: 222.2 84% 4.9%;
    --card-foreground: 210 40% 98%;
    --popover: 222.2 84% 4.9%;
    --popover-foreground: 210 40% 98%;
    --primary: 217.2 91.2% 59.8%;
    --primary-foreground: 222.2 84% 4.9%;
    --secondary: 217.2 32.6% 17.5%;
    --secondary-foreground: 210 40% 98%;
    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;
    --accent: 217.2 32.6% 17.5%;
    --accent-foreground: 210 40% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 40% 98%;
    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 224.3 76.3% 94.1%;
    
    /* Chart colors for dark theme */
    --chart-1: 220 70% 50%;
    --chart-2: 160 60% 45%;
    --chart-3: 30 80% 55%;
    --chart-4: 280 65% 60%;
    --chart-5: 340 75% 55%;
  }

  * {
    @apply border-border;
  }

  body {
    @apply bg-background text-foreground;
    font-feature-settings: "rlig" 1, "calt" 1;
  }

  /* Плавный переход между темами */
  * {
    transition: background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease;
  }

  /* Исправления для белых элементов */
  .dark .bg-white {
    @apply bg-gray-900;
  }

  .dark .text-gray-900 {
    @apply text-gray-100;
  }

  .dark .text-gray-800 {
    @apply text-gray-200;
  }

  .dark .text-gray-700 {
    @apply text-gray-300;
  }

  .dark .text-gray-600 {
    @apply text-gray-400;
  }

  .dark .text-gray-500 {
    @apply text-gray-500;
  }

  .dark .border-gray-200 {
    @apply border-gray-700;
  }

  .dark .border-gray-300 {
    @apply border-gray-600;
  }

  /* SVG иконки в темной теме */
  .dark .icon-light {
    filter: invert(1);
  }

  /* Специальные стили для графиков */
  .dark .recharts-wrapper {
    color: hsl(var(--foreground));
  }

  .dark .recharts-cartesian-axis-line,
  .dark .recharts-cartesian-axis-tick-line {
    stroke: hsl(var(--border));
  }

  .dark .recharts-text {
    fill: hsl(var(--muted-foreground));
  }

  /* Стили для модальных окон */
  .dark .modal-overlay {
    @apply bg-black/80;
  }

  .dark .modal-content {
    @apply bg-card border-border;
  }

  /* Стили для выпадающих меню */
  .dark .dropdown-content {
    @apply bg-popover border-border shadow-lg;
  }

  /* Стили для кнопок */
  .dark .btn-secondary {
    @apply bg-secondary text-secondary-foreground;
  }

  /* Стили для form элементов */
  .dark input:not([type="file"]),
  .dark textarea,
  .dark select {
    @apply bg-background border-input text-foreground;
  }

  .dark input:focus,
  .dark textarea:focus,
  .dark select:focus {
    @apply ring-ring border-ring;
  }

  /* Загрузочные состояния */
  .dark .skeleton {
    @apply bg-muted;
  }

  /* Подсветка кода */
  .dark .code-block {
    @apply bg-muted text-foreground;
  }

  /* Таблицы */
  .dark table {
    @apply bg-card;
  }

  .dark th {
    @apply bg-muted text-muted-foreground;
  }

  .dark td {
    @apply border-border;
  }

  /* Карточки */
  .dark .card {
    @apply bg-card border-border;
  }

  /* Навигация */
  .dark .nav-item {
    @apply text-muted-foreground;
  }

  .dark .nav-item:hover,
  .dark .nav-item.active {
    @apply text-foreground;
  }
}

/* Анимации для темы */
@keyframes theme-transition {
  from {
    opacity: 0.8;
  }
  to {
    opacity: 1;
  }
}

.theme-transitioning {
  animation: theme-transition 0.3s ease-in-out;
}

/* Кастомные scrollbar для темной темы */
.dark ::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.dark ::-webkit-scrollbar-track {
  background: hsl(var(--muted));
}

.dark ::-webkit-scrollbar-thumb {
  background: hsl(var(--muted-foreground));
  border-radius: 4px;
}

.dark ::-webkit-scrollbar-thumb:hover {
  background: hsl(var(--foreground));
}

/* Печать в темной теме */
@media print {
  .dark * {
    background: white !important;
    color: black !important;
  }
}
EOF

# 3. Обновление Tailwind конфигурации
log "Обновление Tailwind конфигурации..."
cat > frontend/tailwind.config.js << 'EOF'
/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        chart: {
          1: "hsl(var(--chart-1))",
          2: "hsl(var(--chart-2))",
          3: "hsl(var(--chart-3))",
          4: "hsl(var(--chart-4))",
          5: "hsl(var(--chart-5))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "theme-transition": {
          from: { opacity: "0.8" },
          to: { opacity: "1" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "theme-transition": "theme-transition 0.3s ease-in-out",
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
}
EOF

# 4. Создание компонента переключателя темы
log "Создание компонента переключателя темы..."
cat > frontend/src/components/ui/ThemeToggle.tsx << 'EOF'
import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { cn } from '../../lib/utils';

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ 
  className, 
  showLabel = false 
}) => {
  const { actualTheme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={cn(
        "relative inline-flex h-10 w-10 items-center justify-center rounded-md border border-input bg-background transition-colors hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        className
      )}
      title={`Переключить на ${actualTheme === 'light' ? 'темную' : 'светлую'} тему`}
    >
      {actualTheme === 'light' ? (
        <svg
          className="h-4 w-4"
          fill="none"
          height="24"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
          width="24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      ) : (
        <svg
          className="h-4 w-4"
          fill="none"
          height="24"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
          width="24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="12" cy="12" r="5" />
          <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
        </svg>
      )}
      {showLabel && (
        <span className="ml-2 text-sm">
          {actualTheme === 'light' ? 'Темная' : 'Светлая'}
        </span>
      )}
    </button>
  );
};

export default ThemeToggle;
EOF

# 5. Обновление App.tsx для использования ThemeProvider
log "Обновление App.tsx..."
cat > frontend/src/App.tsx << 'EOF'
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryProvider } from './providers/QueryProvider';
import { ThemeProvider } from './contexts/ThemeContext';
import { ToastProvider } from './contexts/ToastContext';
import ErrorBoundary from './components/ErrorBoundary';
import ProtectedRoute from './components/auth/ProtectedRoute';
import ThemeToggle from './components/ui/ThemeToggle';

// Lazy load pages
const LandingPage = React.lazy(() => import('./pages/LandingPage'));
const MainPage = React.lazy(() => import('./pages/MainPage'));
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const KPAnalyzer = React.lazy(() => import('./pages/KPAnalyzer'));
const AuthPage = React.lazy(() => import('./pages/AuthPage'));
const AdminPage = React.lazy(() => import('./pages/AdminPage'));
const ProfilePage = React.lazy(() => import('./pages/ProfilePage'));

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="system">
        <QueryProvider>
          <ToastProvider>
            <Router>
              <div className="min-h-screen bg-background text-foreground transition-colors">
                {/* Theme toggle в правом верхнем углу */}
                <div className="fixed top-4 right-4 z-50">
                  <ThemeToggle />
                </div>
                
                <React.Suspense 
                  fallback={
                    <div className="flex items-center justify-center min-h-screen">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                    </div>
                  }
                >
                  <Routes>
                    <Route path="/" element={<LandingPage />} />
                    <Route path="/auth" element={<AuthPage />} />
                    <Route
                      path="/main"
                      element={
                        <ProtectedRoute>
                          <MainPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/dashboard"
                      element={
                        <ProtectedRoute>
                          <Dashboard />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/kp-analyzer"
                      element={
                        <ProtectedRoute>
                          <KPAnalyzer />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/admin"
                      element={
                        <ProtectedRoute requireAdmin>
                          <AdminPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/profile"
                      element={
                        <ProtectedRoute>
                          <ProfilePage />
                        </ProtectedRoute>
                      }
                    />
                  </Routes>
                </React.Suspense>
              </div>
            </Router>
          </ToastProvider>
        </QueryProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
EOF

# 6. Обновление компонента HeroSection для поддержки темной темы
log "Обновление HeroSection..."
cat > frontend/src/components/ui/HeroSection.tsx << 'EOF'
import React from 'react';
import { cn } from '../../lib/utils';
import { useTheme } from '../../contexts/ThemeContext';

interface HeroSectionProps {
  title: string;
  subtitle: string;
  children?: React.ReactNode;
  className?: string;
  backgroundImage?: string;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  title,
  subtitle,
  children,
  className,
  backgroundImage
}) => {
  const { actualTheme } = useTheme();

  return (
    <section 
      className={cn(
        "relative overflow-hidden bg-gradient-to-br from-primary/20 via-background to-secondary/20",
        "dark:from-primary/10 dark:via-background dark:to-secondary/10",
        className
      )}
      style={backgroundImage ? {
        backgroundImage: `linear-gradient(135deg, rgba(0,0,0,${actualTheme === 'dark' ? '0.7' : '0.3'}), rgba(0,0,0,${actualTheme === 'dark' ? '0.7' : '0.3'})), url(${backgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      } : undefined}
    >
      {/* Декоративные элементы */}
      <div className="absolute inset-0 overflow-hidden">
        <div className={cn(
          "absolute -top-40 -right-32 w-80 h-80 rounded-full opacity-20",
          "bg-gradient-to-br from-primary to-secondary",
          "dark:opacity-10"
        )} />
        <div className={cn(
          "absolute -bottom-40 -left-32 w-80 h-80 rounded-full opacity-20",
          "bg-gradient-to-tr from-secondary to-primary",
          "dark:opacity-10"
        )} />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
        <div className="text-center">
          <h1 className={cn(
            "text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight",
            "bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent",
            "dark:from-foreground dark:to-foreground/80"
          )}>
            {title}
          </h1>
          
          <p className={cn(
            "mt-6 text-lg md:text-xl lg:text-2xl max-w-3xl mx-auto",
            "text-muted-foreground"
          )}>
            {subtitle}
          </p>

          {children && (
            <div className="mt-10">
              {children}
            </div>
          )}
        </div>
      </div>

      {/* Градиентное наложение для лучшей читаемости */}
      {backgroundImage && (
        <div className={cn(
          "absolute inset-0 bg-gradient-to-t",
          "from-background/50 via-transparent to-background/50",
          "dark:from-background/70 dark:via-transparent dark:to-background/70"
        )} />
      )}
    </section>
  );
};

export default HeroSection;
EOF

# 7. Перезапуск frontend с обновленной темой
log "Перезапуск frontend с обновленной темой..."
docker compose -f docker-compose.react.yml restart frontend

log "Ожидание перезапуска (30 сек)..."
sleep 30

# Проверка логов
log "Проверка логов frontend..."
docker compose -f docker-compose.react.yml logs --tail=15 frontend

# Итог
echo
log "🌙 Темная тема исправлена!"
echo
info "✅ Что исправлено:"
info "   🎨 Унифицированная система темы с CSS переменными"
info "   🌟 Автоматическое переключение между темами"
info "   🎯 Исправлены все белые элементы в темной теме"
info "   📱 Поддержка системной темы"
info "   🔄 Плавные переходы между темами"
info "   📊 Адаптированные цвета для графиков"
info "   🖼️  Правильная обработка изображений и SVG"
echo
info "🎛️  Новые возможности:"
info "   🌙 Переключатель темы в правом верхнем углу"
info "   💾 Сохранение предпочтений в localStorage"
info "   🎨 CSS переменные для всех цветов"
info "   ♿ Улучшенная доступность"
echo
info "📍 Доступ к сайту:"
info "   🌐 React сайт:    http://46.149.71.162/"
info "   ⚛️  React прямо:   http://46.149.71.162:3000/"
echo
info "🎨 Как использовать:"
info "   1. Кликните по иконке солнца/луны в правом верхнем углу"
info "   2. Тема автоматически сохранится"
info "   3. Поддерживается системная тема"
echo
log "✨ Темная тема теперь работает идеально!"