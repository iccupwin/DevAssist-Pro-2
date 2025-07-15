import React from 'react';
import { LucideIcon } from 'lucide-react';

interface ProfileSectionProps {
  title: string;
  icon?: LucideIcon;
  iconColor?: string;
  children: React.ReactNode;
  className?: string;
  actions?: React.ReactNode;
}

const ProfileSection: React.FC<ProfileSectionProps> = ({
  title,
  icon: Icon,
  iconColor = 'text-blue-600',
  children,
  className = '',
  actions,
}) => {
  return (
    <div className={`bg-white/60 backdrop-blur-sm rounded-2xl border border-white/20 p-8 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          {Icon && <Icon className={`w-6 h-6 ${iconColor} mr-3`} />}
          <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
        </div>
        {actions && (
          <div className="flex items-center space-x-3">
            {actions}
          </div>
        )}
      </div>
      
      {children}
    </div>
  );
};

export default ProfileSection;