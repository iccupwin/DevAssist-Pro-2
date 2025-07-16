import React, { useEffect, useRef, useState } from 'react';
import { useFocusTrap, useFocusRoaming } from '../../hooks/useKeyboardNavigation';
import { cn } from '../../lib/utils';

interface FocusManagerProps {
  children: React.ReactNode;
  trapFocus?: boolean;
  restoreFocus?: boolean;
  className?: string;
}

/**
 * Менеджер фокуса с ловушкой и восстановлением фокуса
 */
export const FocusManager: React.FC<FocusManagerProps> = ({
  children,
  trapFocus = false,
  restoreFocus = true,
  className
}) => {
  const containerRef = useFocusTrap(trapFocus);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (restoreFocus) {
      previousFocusRef.current = document.activeElement as HTMLElement;
    }

    return () => {
      if (restoreFocus && previousFocusRef.current) {
        previousFocusRef.current.focus();
      }
    };
  }, [restoreFocus]);

  return (
    <div ref={containerRef} className={className}>
      {children}
    </div>
  );
};

/**
 * Компонент для пропуска к контенту
 */
export const SkipToContent: React.FC<{
  targetId: string;
  className?: string;
}> = ({ targetId, className }) => {
  const handleSkip = () => {
    const target = document.getElementById(targetId);
    if (target) {
      target.focus();
      target.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <button
      onClick={handleSkip}
      className={cn(
        'sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-50',
        'bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg',
        'focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
        className
      )}
    >
      Перейти к основному содержимому
    </button>
  );
};

/**
 * Индикатор фокуса
 */
export const FocusIndicator: React.FC<{
  show?: boolean;
  className?: string;
}> = ({ show = true, className }) => {
  const [focusedElement, setFocusedElement] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (!show) return;

    const handleFocusIn = (event: FocusEvent) => {
      setFocusedElement(event.target as HTMLElement);
    };

    const handleFocusOut = () => {
      setFocusedElement(null);
    };

    document.addEventListener('focusin', handleFocusIn);
    document.addEventListener('focusout', handleFocusOut);

    return () => {
      document.removeEventListener('focusin', handleFocusIn);
      document.removeEventListener('focusout', handleFocusOut);
    };
  }, [show]);

  if (!show || !focusedElement) return null;

  return (
    <div
      className={cn(
        'fixed pointer-events-none z-50',
        'border-2 border-blue-500 rounded-lg',
        'animate-pulse',
        className
      )}
      style={{
        left: focusedElement.offsetLeft - 2,
        top: focusedElement.offsetTop - 2,
        width: focusedElement.offsetWidth + 4,
        height: focusedElement.offsetHeight + 4
      }}
    />
  );
};

/**
 * Контейнер для управления фокусом в секциях
 */
export const FocusSection: React.FC<{
  children: React.ReactNode;
  sectionId: string;
  label: string;
  className?: string;
}> = ({ children, sectionId, label, className }) => {
  return (
    <section
      data-section={sectionId}
      className={className}
      aria-label={label}
      tabIndex={-1}
    >
      {children}
    </section>
  );
};

/**
 * Навигация по секциям с помощью F6
 */
export const SectionNavigation: React.FC<{
  sections: Array<{
    id: string;
    label: string;
  }>;
  children: React.ReactNode;
  className?: string;
}> = ({ sections, children, className }) => {
  const sectionIds = sections.map(s => s.id);
  const { currentSection, focusSection } = useFocusRoaming(sectionIds);

  return (
    <div className={className}>
      {/* Навигация по секциям */}
      <div className="sr-only">
        <h2>Навигация по секциям</h2>
        <p>Используйте F6 для перехода между секциями</p>
        <ul>
          {sections.map((section, index) => (
            <li key={section.id}>
              <button
                onClick={() => focusSection(index)}
                className={cn(
                  'text-blue-600 underline',
                  currentSection === index && 'font-bold'
                )}
              >
                {section.label}
              </button>
            </li>
          ))}
        </ul>
      </div>
      
      {children}
    </div>
  );
};

/**
 * Улучшенная кнопка с индикацией фокуса
 */
export const FocusableButton: React.FC<{
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  className?: string;
  ariaLabel?: string;
}> = ({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled = false,
  className,
  ariaLabel
}) => {
  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
    secondary: 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500',
    outline: 'border border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-blue-500'
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className={cn(
        // Базовые стили
        'inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all duration-200',
        // Фокус
        'focus:outline-none focus:ring-2 focus:ring-offset-2',
        // Состояние disabled
        disabled && 'opacity-50 cursor-not-allowed',
        // Варианты
        variantClasses[variant],
        // Размеры
        sizeClasses[size],
        // Дополнительные классы
        className
      )}
    >
      {children}
    </button>
  );
};

/**
 * Улучшенный input с индикацией фокуса
 */
export const FocusableInput: React.FC<{
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url';
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  label?: string;
  error?: string;
  helperText?: string;
}> = ({
  type = 'text',
  placeholder,
  value,
  onChange,
  disabled = false,
  required = false,
  className,
  label,
  error,
  helperText
}) => {
  const inputId = React.useId();
  const errorId = React.useId();
  const helperId = React.useId();

  return (
    <div className="space-y-1">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <input
        id={inputId}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        disabled={disabled}
        required={required}
        aria-invalid={!!error}
        aria-describedby={cn(
          error && errorId,
          helperText && helperId
        )}
        className={cn(
          // Базовые стили
          'block w-full px-3 py-2 border rounded-lg shadow-sm transition-colors',
          // Фокус
          'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
          // Состояния
          error 
            ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
            : 'border-gray-300 dark:border-gray-600',
          disabled && 'opacity-50 cursor-not-allowed bg-gray-50 dark:bg-gray-700',
          // Темная тема
          'dark:bg-gray-800 dark:text-white',
          // Дополнительные классы
          className
        )}
      />
      
      {error && (
        <p id={errorId} className="text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
      
      {helperText && !error && (
        <p id={helperId} className="text-sm text-gray-500 dark:text-gray-400">
          {helperText}
        </p>
      )}
    </div>
  );
};

export default FocusManager;