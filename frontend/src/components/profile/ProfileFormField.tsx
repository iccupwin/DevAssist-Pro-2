import React from 'react';
import { LucideIcon } from 'lucide-react';

interface ProfileFormFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: 'text' | 'email' | 'tel' | 'password';
  icon?: LucideIcon;
  disabled?: boolean;
  placeholder?: string;
  required?: boolean;
  error?: string;
  className?: string;
}

const ProfileFormField: React.FC<ProfileFormFieldProps> = ({
  label,
  value,
  onChange,
  type = 'text',
  icon: Icon,
  disabled = false,
  placeholder,
  required = false,
  error,
  className = '',
}) => {
  return (
    <div className={`space-y-2 ${className}`}>
      <label className="text-sm font-medium text-gray-700 flex items-center">
        {Icon && <Icon className="w-4 h-4 mr-2" />}
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      <div className="relative">
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          placeholder={placeholder}
          className={`
            w-full p-3 border rounded-xl transition-colors
            focus:ring-2 focus:ring-blue-500 focus:border-blue-500 
            disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed
            ${error 
              ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
              : 'border-gray-300'
            }
          `}
          aria-invalid={!!error}
          aria-describedby={error ? `${label}-error` : undefined}
        />
      </div>
      
      {error && (
        <p id={`${label}-error`} className="text-sm text-red-600 flex items-center">
          <span className="w-1 h-1 bg-red-600 rounded-full mr-2"></span>
          {error}
        </p>
      )}
    </div>
  );
};

export default ProfileFormField;