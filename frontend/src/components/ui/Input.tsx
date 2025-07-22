import React, { forwardRef } from 'react';
import { LucideIcon } from 'lucide-react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: LucideIcon;
  iconPosition?: 'left' | 'right';
  helperText?: string;
  isDarkMode?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ 
    label, 
    error, 
    icon: Icon, 
    iconPosition = 'left',
    helperText,
    className = '',
    type = 'text',
    isDarkMode = true,
    ...props 
  }, ref) => {
    const hasError = !!error;
    
    return (
      <div className="w-full">
        {label && (
          <label className={`block text-sm font-medium mb-2 transition-colors duration-300 ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>
            {label}
          </label>
        )}
        
        <div className="relative">
          {Icon && iconPosition === 'left' && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Icon className={`h-5 w-5 transition-colors duration-300 ${
                hasError 
                  ? 'text-red-400' 
                  : isDarkMode 
                    ? 'text-gray-400' 
                    : 'text-gray-600'
              }`} />
            </div>
          )}
          
          <input
            ref={ref}
            type={type}
            className={`
              block w-full rounded-lg border transition-all duration-300
              ${Icon && iconPosition === 'left' ? 'pl-10' : 'pl-4'}
              ${Icon && iconPosition === 'right' ? 'pr-10' : 'pr-4'}
              py-3 text-base
              ${hasError 
                ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                : isDarkMode
                  ? 'border-gray-600 focus:border-blue-500 focus:ring-blue-500 bg-gray-800 text-white placeholder-gray-400 hover:border-gray-500'
                  : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500 bg-white text-gray-900 placeholder-gray-500 hover:border-gray-400'
              }
              focus:outline-none focus:ring-2 focus:ring-opacity-20
              ${className}
            `}
            {...props}
          />
          
          {Icon && iconPosition === 'right' && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <Icon className={`h-5 w-5 transition-colors duration-300 ${
                hasError 
                  ? 'text-red-400' 
                  : isDarkMode 
                    ? 'text-gray-400' 
                    : 'text-gray-600'
              }`} />
            </div>
          )}
        </div>
        
        {error && (
          <p className="mt-2 text-sm text-red-500 animate-fade-in">
            {error}
          </p>
        )}
        
        {helperText && !error && (
          <p className={`mt-2 text-sm transition-colors duration-300 ${
            isDarkMode ? 'text-gray-400' : 'text-gray-600'
          }`}>
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';