/**
 * User Profile Dropdown Component
 * Shows user info, navigation, and logout in header
 */

import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  User, 
  Settings, 
  LogOut, 
  CreditCard, 
  Bell, 
  Shield, 
  HelpCircle,
  ChevronDown,
  Crown,
  Mail,
  Phone,
  Calendar
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/Button';

interface UserProfileDropdownProps {
  className?: string;
}

export const UserProfileDropdown: React.FC<UserProfileDropdownProps> = ({ className = '' }) => {
  const { user, logout, timeUntilExpiration } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      navigate('/auth/login');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLoggingOut(false);
      setIsOpen(false);
    }
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    setIsOpen(false);
  };

  const formatTimeRemaining = (milliseconds: number) => {
    const minutes = Math.floor(milliseconds / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}ч ${minutes % 60}м`;
    }
    return `${minutes}м`;
  };

  if (!user) {
    return null;
  }

  const menuItems = [
    {
      icon: User,
      label: 'Профиль',
      action: () => handleNavigation('/profile'),
      color: 'text-gray-600 dark:text-gray-400'
    },
    ...(user.role === 'admin' ? [{
      icon: Crown,
      label: 'Админ панель',
      action: () => handleNavigation('/admin'),
      color: 'text-yellow-600 dark:text-yellow-400'
    }] : []),
    {
      icon: Settings,
      label: 'Настройки',
      action: () => handleNavigation('/settings'),
      color: 'text-gray-600 dark:text-gray-400'
    },
    {
      icon: CreditCard,
      label: 'Биллинг',
      action: () => handleNavigation('/billing'),
      color: 'text-gray-600 dark:text-gray-400'
    },
    {
      icon: Bell,
      label: 'Уведомления',
      action: () => handleNavigation('/notifications'),
      color: 'text-gray-600 dark:text-gray-400'
    },
    {
      icon: Shield,
      label: 'Безопасность',
      action: () => handleNavigation('/security'),
      color: 'text-gray-600 dark:text-gray-400'
    },
    {
      icon: HelpCircle,
      label: 'Помощь',
      action: () => handleNavigation('/help'),
      color: 'text-gray-600 dark:text-gray-400'
    }
  ];

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* User Avatar Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {/* Avatar */}
        <div className="relative">
          {user.avatar ? (
            <img
              src={user.avatar}
              alt={user.full_name}
              className="w-10 h-10 rounded-full object-cover border-2 border-gray-200 dark:border-gray-700"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
              <span className="text-white font-semibold text-sm">
                {user.firstName?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase()}
              </span>
            </div>
          )}
          
          {/* Online Status Indicator */}
          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 border-2 border-white dark:border-gray-800 rounded-full"></div>
          
          {/* Role Badge */}
          {user.role === 'admin' && (
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full flex items-center justify-center">
              <Crown className="w-2.5 h-2.5 text-yellow-800" />
            </div>
          )}
        </div>

        {/* User Info */}
        <div className="hidden md:block text-left">
          <div className="flex items-center space-x-1">
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {user.full_name || `${user.firstName} ${user.lastName}` || 'Пользователь'}
            </p>
            <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
            {user.role === 'admin' ? 'Администратор' : 
             user.role === 'moderator' ? 'Модератор' : 'Пользователь'}
          </p>
        </div>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50">
          {/* User Info Header */}
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.full_name}
                  className="w-12 h-12 rounded-full object-cover"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                  <span className="text-white font-semibold">
                    {user.firstName?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase()}
                  </span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {user.full_name || `${user.firstName} ${user.lastName}` || 'Пользователь'}
                </p>
                <div className="flex items-center space-x-1 text-xs text-gray-500 dark:text-gray-400">
                  <Mail className="w-3 h-3" />
                  <span className="truncate">{user.email}</span>
                </div>
                {user.phone && (
                  <div className="flex items-center space-x-1 text-xs text-gray-500 dark:text-gray-400">
                    <Phone className="w-3 h-3" />
                    <span>{user.phone}</span>
                  </div>
                )}
              </div>
            </div>
            
            {/* Additional Info */}
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-2">
                <div className="flex items-center space-x-1 text-gray-500 dark:text-gray-400 mb-1">
                  <Calendar className="w-3 h-3" />
                  <span>Последний вход</span>
                </div>
                <p className="text-gray-900 dark:text-white font-medium">
                  {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString('ru-RU') : 'Сегодня'}
                </p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-2">
                <div className="flex items-center space-x-1 text-gray-500 dark:text-gray-400 mb-1">
                  <Shield className="w-3 h-3" />
                  <span>Сессия</span>
                </div>
                <p className="text-gray-900 dark:text-white font-medium">
                  {timeUntilExpiration ? formatTimeRemaining(timeUntilExpiration) : 'Активна'}
                </p>
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="py-2">
            {menuItems.map((item, index) => (
              <button
                key={index}
                onClick={item.action}
                className="w-full flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <item.icon className={`w-4 h-4 mr-3 ${item.color}`} />
                {item.label}
              </button>
            ))}
          </div>

          {/* Logout Section */}
          <div className="border-t border-gray-200 dark:border-gray-700 py-2">
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="w-full flex items-center px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
            >
              <LogOut className="w-4 h-4 mr-3" />
              {isLoggingOut ? 'Выход...' : 'Выйти'}
            </button>
          </div>

          {/* Session Warning */}
          {timeUntilExpiration && timeUntilExpiration < 300000 && (
            <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-3">
              <div className="flex items-center space-x-2 text-xs text-yellow-600 dark:text-yellow-400">
                <Shield className="w-3 h-3" />
                <span>Сессия скоро истечет</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Compact version for mobile
export const UserProfileDropdownCompact: React.FC<UserProfileDropdownProps> = ({ className = '' }) => {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/auth/login');
    setIsOpen(false);
  };

  if (!user) {
    return null;
  }

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-8 h-8 rounded-full overflow-hidden border-2 border-gray-200 dark:border-gray-700"
      >
        {user.avatar ? (
          <img src={user.avatar} alt={user.full_name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
            <span className="text-white text-xs font-semibold">
              {user.firstName?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase()}
            </span>
          </div>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50">
          <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
            <p className="text-sm font-medium text-gray-900 dark:text-white">{user.full_name || `${user.firstName} ${user.lastName}`}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
          </div>
          <button
            onClick={() => navigate('/profile')}
            className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            Профиль
          </button>
          {user.role === 'admin' && (
            <button
              onClick={() => navigate('/admin')}
              className="w-full text-left px-4 py-2 text-sm text-yellow-600 dark:text-yellow-400 hover:bg-yellow-50 dark:hover:bg-yellow-900/20"
            >
              👑 Админ панель
            </button>
          )}
          <button
            onClick={handleLogout}
            className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
          >
            Выйти
          </button>
        </div>
      )}
    </div>
  );
};

export default UserProfileDropdown;