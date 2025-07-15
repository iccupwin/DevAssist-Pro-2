import React from 'react';

interface SettingsToggleProps {
  title: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  color?: 'blue' | 'green' | 'purple' | 'red';
  className?: string;
}

const SettingsToggle: React.FC<SettingsToggleProps> = ({
  title,
  description,
  checked,
  onChange,
  disabled = false,
  color = 'blue',
  className = '',
}) => {
  const colorClasses = {
    blue: {
      focus: 'peer-focus:ring-blue-300',
      checked: 'peer-checked:bg-blue-600',
    },
    green: {
      focus: 'peer-focus:ring-green-300',
      checked: 'peer-checked:bg-green-600',
    },
    purple: {
      focus: 'peer-focus:ring-purple-300',
      checked: 'peer-checked:bg-purple-600',
    },
    red: {
      focus: 'peer-focus:ring-red-300',
      checked: 'peer-checked:bg-red-600',
    },
  };

  return (
    <div className={`flex items-center justify-between p-4 bg-white/60 rounded-xl ${className}`}>
      <div className="flex-1 mr-4">
        <h4 className="font-medium text-gray-900">{title}</h4>
        <p className="text-sm text-gray-600 mt-1">{description}</p>
      </div>
      
      <label className="relative inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
          className="sr-only peer"
          aria-label={title}
        />
        <div className={`
          w-11 h-6 bg-gray-200 rounded-full peer 
          peer-focus:outline-none peer-focus:ring-4 
          ${colorClasses[color].focus}
          peer-checked:after:translate-x-full 
          peer-checked:after:border-white 
          after:content-[''] after:absolute after:top-[2px] after:left-[2px] 
          after:bg-white after:border-gray-300 after:border after:rounded-full 
          after:h-5 after:w-5 after:transition-all 
          ${colorClasses[color].checked}
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}></div>
      </label>
    </div>
  );
};

export default SettingsToggle;