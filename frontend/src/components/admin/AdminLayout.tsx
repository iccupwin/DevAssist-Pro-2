/**
 * AdminLayout - Основной layout для админ панели
 * Согласно ТЗ DevAssist Pro
 */

import React, { useState } from 'react';
import { 
  Crown, 
  BarChart3, 
  Users, 
  Bot, 
  Settings,
  Bell,
  Menu,
  X,
  ChevronDown,
  LogOut,
  User,
  Shield,
  Server
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
// Button component import removed - not used in current implementation

interface AdminLayoutProps {
  children: React.ReactNode;
  activeTab: 'dashboard' | 'users' | 'ai' | 'system' | 'backend';
  onTabChange: (tab: 'dashboard' | 'users' | 'ai' | 'system' | 'backend') => void;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  children,
  activeTab,
  onTabChange
}) => {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  const navigationItems = [
    {
      id: 'dashboard' as const,
      name: 'Dashboard',
      icon: BarChart3,
      description: 'Системная аналитика'
    },
    {
      id: 'users' as const,
      name: 'Users',
      icon: Users,
      description: 'Управление пользователями'
    },
    {
      id: 'ai' as const,
      name: 'AI',
      icon: Bot,
      description: 'AI модели и провайдеры'
    },
    {
      id: 'backend' as const,
      name: 'Backend',
      icon: Server,
      description: 'Backend сервисы и инфраструктура'
    },
    {
      id: 'system' as const,
      name: 'System',
      icon: Settings,
      description: 'Системные настройки'
    }
  ];

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      // Logout failed
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Top Navigation Bar */}
      <header className="bg-gray-800 border-b border-gray-700 px-4 py-3 flex items-center justify-between">
        {/* Logo and Title */}
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden p-2 rounded-md hover:bg-gray-700 transition-colors"
          >
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          
          <div className="flex items-center space-x-3">
            <Crown className="h-8 w-8 text-yellow-500" />
            <div>
              <h1 className="text-xl font-bold text-white">DevAssist Pro Admin</h1>
              <p className="text-xs text-gray-400 hidden sm:block">Административная панель</p>
            </div>
          </div>
        </div>

        {/* Top Navigation Tabs - Desktop */}
        <nav className="hidden lg:flex items-center space-x-1">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'text-gray-300 hover:text-white hover:bg-gray-700'
                }`}
                title={item.description}
              >
                <Icon className="h-5 w-5" />
                <span className="font-medium">{item.name}</span>
              </button>
            );
          })}
        </nav>

        {/* Right Side */}
        <div className="flex items-center space-x-4">
          {/* Notifications */}
          <button className="relative p-2 rounded-lg hover:bg-gray-700 transition-colors">
            <Bell className="h-5 w-5" />
            <span className="absolute -top-1 -right-1 bg-red-500 text-xs rounded-full h-5 w-5 flex items-center justify-center">
              3
            </span>
          </button>

          {/* Admin Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
              className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-700 transition-colors"
            >
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <User className="h-4 w-4 text-white" />
              </div>
              <div className="text-left hidden sm:block">
                <p className="text-sm font-medium text-white">{user?.firstName} {user?.lastName}</p>
                <p className="text-xs text-gray-400 flex items-center">
                  <Shield className="h-3 w-3 mr-1" />
                  Admin
                </p>
              </div>
              <ChevronDown className="h-4 w-4 text-gray-400" />
            </button>

            {/* Dropdown Menu */}
            {profileDropdownOpen && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50">
                <div className="py-2">
                  <div className="px-4 py-2 border-b border-gray-700">
                    <p className="text-sm font-medium text-white">{user?.email}</p>
                    <p className="text-xs text-gray-400">Administrator</p>
                  </div>
                  
                  <button
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      // Navigate to profile
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:text-white hover:bg-gray-700 flex items-center space-x-2"
                  >
                    <User className="h-4 w-4" />
                    <span>Профиль</span>
                  </button>
                  
                  <button
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      onTabChange('system');
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:text-white hover:bg-gray-700 flex items-center space-x-2"
                  >
                    <Settings className="h-4 w-4" />
                    <span>Настройки</span>
                  </button>
                  
                  <div className="border-t border-gray-700 mt-2 pt-2">
                    <button
                      onClick={handleLogout}
                      className="w-full px-4 py-2 text-left text-sm text-red-400 hover:text-red-300 hover:bg-gray-700 flex items-center space-x-2"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Выйти</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile Navigation Sidebar */}
      <aside className={`fixed left-0 top-0 bottom-0 w-64 bg-gray-800 border-r border-gray-700 z-50 transform transition-transform duration-300 lg:hidden ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="p-4">
          <div className="flex items-center space-x-3 mb-6">
            <Crown className="h-8 w-8 text-yellow-500" />
            <div>
              <h2 className="text-lg font-bold text-white">Admin Panel</h2>
              <p className="text-xs text-gray-400">DevAssist Pro</p>
            </div>
          </div>

          <nav className="space-y-2">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onTabChange(item.id);
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'text-gray-300 hover:text-white hover:bg-gray-700'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <div className="text-left">
                    <p className="font-medium">{item.name}</p>
                    <p className="text-xs opacity-75">{item.description}</p>
                  </div>
                </button>
              );
            })}
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 py-6">
          {children}
        </div>
      </main>

      {/* Click outside handler for dropdowns */}
      {profileDropdownOpen && (
        <div 
          className="fixed inset-0 z-30"
          onClick={() => setProfileDropdownOpen(false)}
        />
      )}
    </div>
  );
};

export default AdminLayout;