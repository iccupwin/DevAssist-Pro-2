import React, { forwardRef } from 'react';
import { cn } from '../../lib/utils';
import { useDesignSystem } from './DesignSystemProvider';

// Типы для единообразных компонентов
interface UnifiedButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'ghost';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  fullWidth?: boolean;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

interface UnifiedInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  variant?: 'default' | 'error' | 'success';
  size?: 'sm' | 'md' | 'lg';
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

interface UnifiedCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'outlined' | 'ghost';
  padding?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  spacing?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

interface UnifiedTextProps extends React.HTMLAttributes<HTMLElement> {
  variant?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'body1' | 'body2' | 'caption' | 'overline';
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info' | 'text' | 'muted';
  weight?: 'normal' | 'medium' | 'semibold' | 'bold';
  align?: 'left' | 'center' | 'right';
  truncate?: boolean;
  as?: keyof JSX.IntrinsicElements;
}

/**
 * Унифицированная кнопка
 */
export const UnifiedButton = forwardRef<HTMLButtonElement, UnifiedButtonProps>(
  ({ 
    variant = 'primary', 
    size = 'md', 
    fullWidth = false, 
    loading = false, 
    leftIcon, 
    rightIcon, 
    children, 
    className,
    disabled,
    ...props 
  }, ref) => {
    const ds = useDesignSystem();

    const baseStyles = 'inline-flex items-center justify-center font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
    
    const variantStyles = {
      primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
      secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-500 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600',
      success: 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500',
      warning: 'bg-yellow-600 text-white hover:bg-yellow-700 focus:ring-yellow-500',
      error: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
      ghost: 'text-gray-700 hover:bg-gray-100 focus:ring-gray-500 dark:text-gray-300 dark:hover:bg-gray-800'
    };

    const sizeStyles = {
      xs: 'px-2 py-1 text-xs rounded',
      sm: 'px-3 py-1.5 text-sm rounded',
      md: 'px-4 py-2 text-sm rounded-md',
      lg: 'px-6 py-3 text-base rounded-md',
      xl: 'px-8 py-4 text-lg rounded-lg'
    };

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          baseStyles,
          variantStyles[variant],
          sizeStyles[size],
          fullWidth && 'w-full',
          className
        )}
        {...props}
      >
        {loading && (
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
        )}
        {leftIcon && <span className="mr-2">{leftIcon}</span>}
        {children}
        {rightIcon && <span className="ml-2">{rightIcon}</span>}
      </button>
    );
  }
);

/**
 * Унифицированное поле ввода
 */
export const UnifiedInput = forwardRef<HTMLInputElement, UnifiedInputProps>(
  ({ 
    variant = 'default', 
    size = 'md', 
    leftIcon, 
    rightIcon, 
    fullWidth = false, 
    className,
    ...props 
  }, ref) => {
    const baseStyles = 'border transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
    
    const variantStyles = {
      default: 'border-gray-300 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white',
      error: 'border-red-500 focus:border-red-500 focus:ring-red-500 text-red-900 dark:text-red-100',
      success: 'border-green-500 focus:border-green-500 focus:ring-green-500 text-green-900 dark:text-green-100'
    };

    const sizeStyles = {
      sm: 'px-2 py-1 text-sm rounded',
      md: 'px-3 py-2 text-sm rounded-md',
      lg: 'px-4 py-3 text-base rounded-md'
    };

    return (
      <div className={cn('relative', fullWidth && 'w-full')}>
        {leftIcon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            {leftIcon}
          </div>
        )}
        <input
          ref={ref}
          className={cn(
            baseStyles,
            variantStyles[variant],
            sizeStyles[size],
            leftIcon && 'pl-10',
            rightIcon && 'pr-10',
            fullWidth && 'w-full',
            className
          )}
          {...props}
        />
        {rightIcon && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            {rightIcon}
          </div>
        )}
      </div>
    );
  }
);

/**
 * Унифицированная карточка
 */
export const UnifiedCard: React.FC<UnifiedCardProps> = ({ 
  variant = 'default', 
  padding = 'md', 
  spacing = 'md',
  children, 
  className,
  ...props 
}) => {
  const baseStyles = 'rounded-lg';
  
  const variantStyles = {
    default: 'bg-white dark:bg-gray-800 shadow-sm',
    elevated: 'bg-white dark:bg-gray-800 shadow-lg',
    outlined: 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700',
    ghost: 'bg-transparent'
  };

  const paddingStyles = {
    xs: 'p-2',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
    xl: 'p-8'
  };

  const spacingStyles = {
    xs: 'space-y-1',
    sm: 'space-y-2',
    md: 'space-y-4',
    lg: 'space-y-6',
    xl: 'space-y-8'
  };

  return (
    <div
      className={cn(
        baseStyles,
        variantStyles[variant],
        paddingStyles[padding],
        spacingStyles[spacing],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

/**
 * Унифицированный текст
 */
export const UnifiedText: React.FC<UnifiedTextProps> = ({ 
  variant = 'body1', 
  color = 'text', 
  weight = 'normal', 
  align = 'left', 
  truncate = false,
  as,
  children, 
  className,
  ...props 
}) => {
  const variantStyles = {
    h1: 'text-3xl font-bold leading-tight',
    h2: 'text-2xl font-semibold leading-tight',
    h3: 'text-xl font-semibold leading-tight',
    h4: 'text-lg font-medium leading-tight',
    h5: 'text-base font-medium leading-tight',
    h6: 'text-sm font-medium leading-tight',
    body1: 'text-base leading-relaxed',
    body2: 'text-sm leading-relaxed',
    caption: 'text-xs leading-normal',
    overline: 'text-xs font-medium uppercase tracking-wide leading-normal'
  };

  const colorStyles = {
    primary: 'text-blue-600 dark:text-blue-400',
    secondary: 'text-gray-600 dark:text-gray-400',
    success: 'text-green-600 dark:text-green-400',
    warning: 'text-yellow-600 dark:text-yellow-400',
    error: 'text-red-600 dark:text-red-400',
    info: 'text-blue-600 dark:text-blue-400',
    text: 'text-gray-900 dark:text-white',
    muted: 'text-gray-500 dark:text-gray-400'
  };

  const weightStyles = {
    normal: 'font-normal',
    medium: 'font-medium',
    semibold: 'font-semibold',
    bold: 'font-bold'
  };

  const alignStyles = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right'
  };

  const tagMapping = {
    h1: 'h1',
    h2: 'h2',
    h3: 'h3',
    h4: 'h4',
    h5: 'h5',
    h6: 'h6',
    body1: 'p',
    body2: 'p',
    caption: 'span',
    overline: 'span'
  };

  const Component = (as || tagMapping[variant]) as keyof JSX.IntrinsicElements;

  return (
    <Component
      className={cn(
        variantStyles[variant],
        colorStyles[color],
        weightStyles[weight],
        alignStyles[align],
        truncate && 'truncate',
        className
      )}
      {...(props as any)}
    >
      {children}
    </Component>
  );
};

/**
 * Унифицированная сетка
 */
export const UnifiedGrid: React.FC<{
  children: React.ReactNode;
  cols?: 1 | 2 | 3 | 4 | 5 | 6 | 12;
  gap?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  responsive?: boolean;
  className?: string;
}> = ({ 
  children, 
  cols = 1, 
  gap = 'md', 
  responsive = false,
  className 
}) => {
  const colsStyles = {
    1: 'grid-cols-1',
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4',
    5: 'grid-cols-5',
    6: 'grid-cols-6',
    12: 'grid-cols-12'
  };

  const gapStyles = {
    xs: 'gap-1',
    sm: 'gap-2',
    md: 'gap-4',
    lg: 'gap-6',
    xl: 'gap-8'
  };

  const responsiveStyles = responsive && cols > 1 ? 
    `grid-cols-1 sm:grid-cols-2 ${cols > 2 ? `md:${colsStyles[cols]}` : ''}` : 
    colsStyles[cols];

  return (
    <div className={cn('grid', responsiveStyles, gapStyles[gap], className)}>
      {children}
    </div>
  );
};

/**
 * Унифицированный флекс контейнер
 */
export const UnifiedFlex: React.FC<{
  children: React.ReactNode;
  direction?: 'row' | 'col' | 'row-reverse' | 'col-reverse';
  wrap?: boolean;
  justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
  align?: 'start' | 'center' | 'end' | 'stretch' | 'baseline';
  gap?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}> = ({ 
  children, 
  direction = 'row', 
  wrap = false, 
  justify = 'start', 
  align = 'start',
  gap = 'md',
  className 
}) => {
  const directionStyles = {
    row: 'flex-row',
    col: 'flex-col',
    'row-reverse': 'flex-row-reverse',
    'col-reverse': 'flex-col-reverse'
  };

  const justifyStyles = {
    start: 'justify-start',
    center: 'justify-center',
    end: 'justify-end',
    between: 'justify-between',
    around: 'justify-around',
    evenly: 'justify-evenly'
  };

  const alignStyles = {
    start: 'items-start',
    center: 'items-center',
    end: 'items-end',
    stretch: 'items-stretch',
    baseline: 'items-baseline'
  };

  const gapStyles = {
    xs: 'gap-1',
    sm: 'gap-2',
    md: 'gap-4',
    lg: 'gap-6',
    xl: 'gap-8'
  };

  return (
    <div className={cn(
      'flex',
      directionStyles[direction],
      wrap && 'flex-wrap',
      justifyStyles[justify],
      alignStyles[align],
      gapStyles[gap],
      className
    )}>
      {children}
    </div>
  );
};

// Устанавливаем displayName для компонентов
UnifiedButton.displayName = 'UnifiedButton';
UnifiedInput.displayName = 'UnifiedInput';

const unifiedComponents = {
  UnifiedButton,
  UnifiedInput,
  UnifiedCard,
  UnifiedText,
  UnifiedGrid,
  UnifiedFlex
};

export default unifiedComponents;