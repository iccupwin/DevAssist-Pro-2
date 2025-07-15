import React from 'react';
import { Camera } from 'lucide-react';

interface UserAvatarProps {
  name: string;
  avatar?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  isEditable?: boolean;
  onAvatarChange?: (file: File) => void;
  className?: string;
}

const UserAvatar: React.FC<UserAvatarProps> = ({
  name,
  avatar,
  size = 'md',
  isEditable = false,
  onAvatarChange,
  className = '',
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-12 h-12 text-base',
    lg: 'w-20 h-20 text-lg',
    xl: 'w-32 h-32 text-3xl',
  };

  const editButtonSize = {
    sm: 'w-6 h-6 -bottom-1 -right-1',
    md: 'w-7 h-7 -bottom-1 -right-1', 
    lg: 'w-8 h-8 -bottom-2 -right-2',
    xl: 'w-10 h-10 -bottom-2 -right-2',
  };

  const iconSize = {
    sm: 'w-3 h-3',
    md: 'w-3 h-3',
    lg: 'w-4 h-4',
    xl: 'w-5 h-5',
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && onAvatarChange) {
      onAvatarChange(file);
    }
  };

  const getInitials = (fullName: string): string => {
    return fullName
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className={`relative ${className}`}>
      <div className={`
        ${sizeClasses[size]} 
        bg-gradient-to-r from-blue-500 to-purple-500 
        rounded-2xl flex items-center justify-center 
        text-white font-bold overflow-hidden
        ring-4 ring-white shadow-lg
      `}>
        {avatar ? (
          <img 
            src={avatar} 
            alt={`${name} avatar`}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="select-none">
            {getInitials(name)}
          </span>
        )}
      </div>
      
      {isEditable && (
        <label className={`
          absolute ${editButtonSize[size]}
          bg-blue-600 rounded-full flex items-center justify-center 
          cursor-pointer hover:bg-blue-700 transition-colors 
          shadow-lg ring-2 ring-white
        `}>
          <Camera className={`${iconSize[size]} text-white`} />
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
            aria-label="Изменить аватар"
          />
        </label>
      )}
    </div>
  );
};

export default UserAvatar;