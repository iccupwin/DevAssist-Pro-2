import React, { useRef, useCallback } from 'react';
import { AlertCircle, Check } from 'lucide-react';
import { cn } from '../../lib/utils';

interface AccessibleFormProps {
  children: React.ReactNode;
  onSubmit: (e: React.FormEvent) => void;
  className?: string;
  title?: string;
  description?: string;
  errors?: Record<string, string>;
  isSubmitting?: boolean;
}

interface AccessibleFieldProps {
  children: React.ReactNode;
  label: string;
  id: string;
  error?: string;
  required?: boolean;
  description?: string;
  className?: string;
}

/**
 * Доступная форма с поддержкой screen reader
 */
export const AccessibleForm: React.FC<AccessibleFormProps> = ({
  children,
  onSubmit,
  className,
  title,
  description,
  errors = {},
  isSubmitting = false
}) => {
  const formRef = useRef<HTMLFormElement>(null);
  const errorCount = Object.keys(errors).length;

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    
    // Фокус на первую ошибку при наличии
    if (errorCount > 0) {
      const firstErrorField = Object.keys(errors)[0];
      const errorElement = formRef.current?.querySelector(`[data-field="${firstErrorField}"]`);
      if (errorElement instanceof HTMLElement) {
        errorElement.focus();
      }
      return;
    }

    onSubmit(e);
  }, [onSubmit, errors, errorCount]);

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className={cn('space-y-6', className)}
      noValidate
      aria-label={title}
      aria-describedby={description ? 'form-description' : undefined}
    >
      {title && (
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
          {title}
        </h2>
      )}
      
      {description && (
        <p id="form-description" className="text-gray-600 dark:text-gray-400">
          {description}
        </p>
      )}

      {/* Сводка ошибок */}
      {errorCount > 0 && (
        <div
          role="alert"
          aria-live="polite"
          className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
        >
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
            <h3 className="font-medium text-red-800 dark:text-red-200">
              Исправьте следующие ошибки ({errorCount}):
            </h3>
          </div>
          <ul className="space-y-1 text-sm text-red-700 dark:text-red-300">
            {Object.entries(errors).map(([field, message]) => (
              <li key={field}>
                <button
                  type="button"
                  onClick={() => {
                    const element = formRef.current?.querySelector(`[data-field="${field}"]`);
                    if (element instanceof HTMLElement) {
                      element.focus();
                    }
                  }}
                  className="underline hover:no-underline"
                >
                  {message}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {children}

      {/* Индикатор отправки */}
      {isSubmitting && (
        <div
          role="status"
          aria-live="polite"
          className="flex items-center gap-2 text-blue-600 dark:text-blue-400"
        >
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 dark:border-blue-400"></div>
          <span>Отправка формы...</span>
        </div>
      )}
    </form>
  );
};

/**
 * Доступное поле формы
 */
export const AccessibleField: React.FC<AccessibleFieldProps> = ({
  children,
  label,
  id,
  error,
  required = false,
  description,
  className
}) => {
  const errorId = `${id}-error`;
  const descriptionId = `${id}-description`;

  return (
    <div className={cn('space-y-2', className)}>
      <label
        htmlFor={id}
        className={cn(
          'block text-sm font-medium',
          error ? 'text-red-700 dark:text-red-300' : 'text-gray-700 dark:text-gray-300'
        )}
      >
        {label}
        {required && (
          <span className="text-red-500 ml-1" aria-label="обязательное поле">
            *
          </span>
        )}
      </label>

      {description && (
        <p id={descriptionId} className="text-sm text-gray-600 dark:text-gray-400">
          {description}
        </p>
      )}

      <div className="relative">
        {React.Children.map(children, child => {
          if (React.isValidElement(child)) {
            return React.cloneElement(child as React.ReactElement<any>, {
              id,
              'data-field': id,
              'aria-invalid': error ? 'true' : 'false',
              'aria-describedby': [
                error ? errorId : '',
                description ? descriptionId : ''
              ].filter(Boolean).join(' ') || undefined,
              'aria-required': required,
              className: cn(
                child.props.className,
                error && 'border-red-500 dark:border-red-400 focus:border-red-500 focus:ring-red-500'
              )
            });
          }
          return child;
        })}

        {error && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <AlertCircle className="w-5 h-5 text-red-500" />
          </div>
        )}
      </div>

      {error && (
        <p
          id={errorId}
          role="alert"
          aria-live="polite"
          className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1"
        >
          <AlertCircle className="w-4 h-4" />
          {error}
        </p>
      )}
    </div>
  );
};

/**
 * Доступная кнопка отправки
 */
export const AccessibleSubmitButton: React.FC<{
  children: React.ReactNode;
  isSubmitting?: boolean;
  disabled?: boolean;
  className?: string;
}> = ({ children, isSubmitting = false, disabled = false, className }) => {
  return (
    <button
      type="submit"
      disabled={disabled || isSubmitting}
      className={cn(
        'w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors',
        className
      )}
      aria-describedby={isSubmitting ? 'submit-status' : undefined}
    >
      {isSubmitting ? (
        <>
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          <span>Отправка...</span>
        </>
      ) : (
        children
      )}
    </button>
  );
};

/**
 * Индикатор успешной отправки
 */
export const AccessibleSuccess: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className }) => {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg',
        className
      )}
    >
      <div className="flex items-center gap-2 text-green-800 dark:text-green-200">
        <Check className="w-5 h-5" />
        <span className="font-medium">{children}</span>
      </div>
    </div>
  );
};

export default AccessibleForm;