import React from 'react';
import { cn } from '../../lib/utils';

interface TabletLayoutProps {
  children: React.ReactNode;
  className?: string;
}

// Адаптивная обертка для планшетов
export const TabletLayout: React.FC<TabletLayoutProps> = ({ children, className }) => {
  return (
    <div className={cn(
      // Базовые отступы для планшетов
      'px-4 sm:px-6 md:px-8 lg:px-12',
      // Отступы сверху/снизу для планшетов
      'py-4 sm:py-6 md:py-8',
      // Максимальная ширина для планшетов
      'max-w-full md:max-w-6xl xl:max-w-7xl mx-auto',
      className
    )}>
      {children}
    </div>
  );
};

// Компонент для двухколоночной сетки на планшетах
export const TabletGrid: React.FC<{
  children: React.ReactNode;
  cols?: 1 | 2 | 3 | 4;
  gap?: 'sm' | 'md' | 'lg';
  className?: string;
}> = ({ children, cols = 2, gap = 'md', className }) => {
  const colsClass = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
  };
  
  const gapClass = {
    sm: 'gap-3 md:gap-4',
    md: 'gap-4 md:gap-6',
    lg: 'gap-6 md:gap-8'
  };
  
  return (
    <div className={cn(
      'grid',
      colsClass[cols],
      gapClass[gap],
      className
    )}>
      {children}
    </div>
  );
};

// Компонент для карточек на планшетах
export const TabletCard: React.FC<{
  children: React.ReactNode;
  padding?: 'sm' | 'md' | 'lg';
  className?: string;
}> = ({ children, padding = 'md', className }) => {
  const paddingClass = {
    sm: 'p-3 md:p-4',
    md: 'p-4 md:p-6',
    lg: 'p-6 md:p-8'
  };
  
  return (
    <div className={cn(
      'bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700',
      paddingClass[padding],
      className
    )}>
      {children}
    </div>
  );
};

// Компонент для заголовков на планшетах
export const TabletHeading: React.FC<{
  children: React.ReactNode;
  level?: 1 | 2 | 3 | 4;
  className?: string;
}> = ({ children, level = 1, className }) => {
  const levelClass = {
    1: 'text-xl md:text-2xl lg:text-3xl',
    2: 'text-lg md:text-xl lg:text-2xl',
    3: 'text-base md:text-lg lg:text-xl',
    4: 'text-sm md:text-base lg:text-lg'
  };
  
  const Tag = `h${level}` as keyof JSX.IntrinsicElements;
  
  return (
    <Tag className={cn(
      'font-semibold text-gray-900 dark:text-white',
      levelClass[level],
      className
    )}>
      {children}
    </Tag>
  );
};

// Компонент для текста на планшетах
export const TabletText: React.FC<{
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}> = ({ children, size = 'md', className }) => {
  const sizeClass = {
    sm: 'text-xs md:text-sm',
    md: 'text-sm md:text-base',
    lg: 'text-base md:text-lg'
  };
  
  return (
    <p className={cn(
      'text-gray-600 dark:text-gray-300',
      sizeClass[size],
      className
    )}>
      {children}
    </p>
  );
};

// Компонент для кнопок на планшетах
export const TabletButton: React.FC<{
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
}> = ({ children, variant = 'primary', size = 'md', className, onClick, disabled }) => {
  const variantClass = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700',
    secondary: 'bg-gray-600 text-white hover:bg-gray-700',
    outline: 'border border-gray-300 text-gray-700 hover:bg-gray-50'
  };
  
  const sizeClass = {
    sm: 'px-3 py-2 text-sm md:text-base min-h-[40px] md:min-h-[44px]',
    md: 'px-4 py-3 text-base md:text-lg min-h-[44px] md:min-h-[48px]',
    lg: 'px-6 py-4 text-lg md:text-xl min-h-[48px] md:min-h-[52px]'
  };
  
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors',
        'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
        variantClass[variant],
        sizeClass[size],
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      {children}
    </button>
  );
};

// Компонент для центрального содержимого на планшетах
export const TabletContent: React.FC<{
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  className?: string;
}> = ({ children, maxWidth = 'lg', className }) => {
  const maxWidthClass = {
    sm: 'max-w-md',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl',
    full: 'max-w-full'
  };
  
  return (
    <div className={cn(
      'mx-auto',
      maxWidthClass[maxWidth],
      className
    )}>
      {children}
    </div>
  );
};

export default TabletLayout;