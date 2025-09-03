import React, { createContext, useContext, useState, useEffect } from 'react';
import { cn } from '../../lib/utils';
import { lightTheme, darkTheme, generateCSSVariables } from '../../design-tokens/theme';

interface DesignSystemContextType {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
    '2xl': string;
  };
  colors: {
    primary: string;
    secondary: string;
    success: string;
    warning: string;
    error: string;
    info: string;
  };
  typography: {
    fontFamily: string;
    fontSizes: {
      xs: string;
      sm: string;
      base: string;
      lg: string;
      xl: string;
      '2xl': string;
      '3xl': string;
    };
    fontWeights: {
      normal: string;
      medium: string;
      semibold: string;
      bold: string;
    };
    lineHeights: {
      tight: string;
      normal: string;
      relaxed: string;
    };
  };
  borderRadius: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
    full: string;
  };
  shadows: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  breakpoints: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
    '2xl': string;
  };
}

const DesignSystemContext = createContext<DesignSystemContextType | undefined>(undefined);

interface DesignSystemProviderProps {
  children: React.ReactNode;
  defaultTheme?: 'light' | 'dark';
}

/**
 * Провайдер единой дизайн-системы для всего приложения
 */
export const DesignSystemProvider: React.FC<DesignSystemProviderProps> = ({
  children,
  defaultTheme = 'light'
}) => {
  const [theme, setTheme] = useState<'light' | 'dark'>(defaultTheme);

  // Загружаем тему из localStorage при монтировании
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    if (savedTheme) {
      setTheme(savedTheme);
    } else {
      // Проверяем системную тему
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      setTheme(systemTheme);
    }
  }, []);

  // Применяем CSS переменные при изменении темы
  useEffect(() => {
    const currentTheme = theme === 'light' ? lightTheme : darkTheme;
    const cssVars = generateCSSVariables(currentTheme);
    
    // Применяем CSS переменные к корневому элементу
    const root = document.documentElement;
    Object.entries(cssVars).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });

    // Добавляем класс темы
    root.classList.remove('light', 'dark');
    root.classList.add(theme);

    // Сохраняем в localStorage
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  // Единая система дизайн-токенов
  const contextValue: DesignSystemContextType = {
    theme,
    toggleTheme,
    spacing: {
      xs: '0.25rem',   // 4px
      sm: '0.5rem',    // 8px
      md: '1rem',      // 16px
      lg: '1.5rem',    // 24px
      xl: '2rem',      // 32px
      '2xl': '3rem',   // 48px
    },
    colors: {
      primary: '#2563eb',
      secondary: '#64748b',
      success: '#059669', // Исправлено для WCAG AA
      warning: '#d97706', // Исправлено для WCAG AA
      error: '#dc2626',   // Исправлено для WCAG AA
      info: '#2563eb',    // Исправлено для WCAG AA
    },
    typography: {
      fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
      fontSizes: {
        xs: '0.75rem',    // 12px
        sm: '0.875rem',   // 14px
        base: '1rem',     // 16px
        lg: '1.125rem',   // 18px
        xl: '1.25rem',    // 20px
        '2xl': '1.5rem',  // 24px
        '3xl': '1.875rem', // 30px
      },
      fontWeights: {
        normal: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
      },
      lineHeights: {
        tight: '1.25',
        normal: '1.5',
        relaxed: '1.75',
      },
    },
    borderRadius: {
      sm: '0.25rem',   // 4px
      md: '0.5rem',    // 8px
      lg: '0.75rem',   // 12px
      xl: '1rem',      // 16px
      full: '9999px',  // полный радиус
    },
    shadows: {
      sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
      md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
      lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
      xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
    },
    breakpoints: {
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1536px',
    },
  };

  return (
    <DesignSystemContext.Provider value={contextValue}>
      {children}
    </DesignSystemContext.Provider>
  );
};

export const useDesignSystem = (): DesignSystemContextType => {
  const context = useContext(DesignSystemContext);
  if (!context) {
    throw new Error('useDesignSystem must be used within a DesignSystemProvider');
  }
  return context;
};

/**
 * Хук для получения утилитарных CSS классов
 */
export const useDesignTokens = () => {
  const ds = useDesignSystem();
  
  return {
    // Spacing utilities
    p: (size: keyof typeof ds.spacing) => `p-${size}`,
    m: (size: keyof typeof ds.spacing) => `m-${size}`,
    px: (size: keyof typeof ds.spacing) => `px-${size}`,
    py: (size: keyof typeof ds.spacing) => `py-${size}`,
    
    // Typography utilities
    textSize: (size: keyof typeof ds.typography.fontSizes) => `text-${size}`,
    font: (weight: keyof typeof ds.typography.fontWeights) => `font-${weight}`,
    
    // Color utilities
    bg: (color: keyof typeof ds.colors) => `bg-${color}`,
    textColor: (color: keyof typeof ds.colors) => `text-${color}`,
    border: (color: keyof typeof ds.colors) => `border-${color}`,
    
    // Border radius utilities
    rounded: (size: keyof typeof ds.borderRadius) => `rounded-${size}`,
    
    // Shadow utilities
    shadow: (size: keyof typeof ds.shadows) => `shadow-${size}`,
    
    // Responsive utilities
    responsive: (breakpoint: keyof typeof ds.breakpoints, className: string) => 
      `${breakpoint}:${className}`,
  };
};

/**
 * Компонент для применения единых стилей
 */
export const DesignSystemBox: React.FC<{
  children: React.ReactNode;
  className?: string;
  spacing?: keyof DesignSystemContextType['spacing'];
  bg?: keyof DesignSystemContextType['colors'];
  rounded?: keyof DesignSystemContextType['borderRadius'];
  shadow?: keyof DesignSystemContextType['shadows'];
  as?: keyof JSX.IntrinsicElements;
}> = ({
  children,
  className,
  spacing = 'md',
  bg,
  rounded = 'md',
  shadow,
  as: Component = 'div'
}) => {
  const ds = useDesignSystem();
  
  const classes = cn(
    `p-${spacing}`,
    bg && `bg-${bg}`,
    `rounded-${rounded}`,
    shadow && `shadow-${shadow}`,
    className
  );
  
  return (
    <Component className={classes}>
      {children}
    </Component>
  );
};

export default DesignSystemProvider;