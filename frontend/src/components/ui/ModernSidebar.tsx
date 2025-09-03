import React, { useState } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  BarChart3, 
  FileText, 
  Settings, 
  Users, 
  Home,
  Search,
  Bell,
  User,
  LogOut,
  Menu,
  X
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface SidebarItem {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
  path: string;
  badge?: string;
}

interface ModernSidebarProps {
  isCollapsed?: boolean;
  onToggle?: (collapsed: boolean) => void;
}

const sidebarItems: SidebarItem[] = [
  { id: 'dashboard', label: 'Дашборд', icon: Home, path: '/dashboard' },
  { id: 'kp-analyzer', label: 'КП Анализатор', icon: FileText, path: '/kp-analyzer' },
  { id: 'analytics', label: 'Аналитика', icon: BarChart3, path: '/analytics' },
  { id: 'users', label: 'Пользователи', icon: Users, path: '/users' },
  { id: 'settings', label: 'Настройки', icon: Settings, path: '/settings' },
];

export const ModernSidebar: React.FC<ModernSidebarProps> = ({ 
  isCollapsed: controlledCollapsed, 
  onToggle 
}) => {
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const isCollapsed = controlledCollapsed !== undefined ? controlledCollapsed : internalCollapsed;

  const handleToggle = () => {
    if (onToggle) {
      onToggle(!isCollapsed);
    } else {
      setInternalCollapsed(!isCollapsed);
    }
  };

  const handleItemClick = (path: string) => {
    navigate(path);
    setIsMobileOpen(false);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/auth/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
        {!isCollapsed && (
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">DA</span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900 dark:text-white">DevAssist</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">Pro</p>
            </div>
          </div>
        )}
        <button
          onClick={handleToggle}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          {isCollapsed ? (
            <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          ) : (
            <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          )}
        </button>
      </div>

      {/* Search */}
      {!isCollapsed && (
        <div className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Поиск..."
              className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-4 py-2">
        <ul className="space-y-1">
          {sidebarItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            
            return (
              <li key={item.id}>
                <button
                  onClick={() => handleItemClick(item.path)}
                  className={`
                    w-full flex items-center px-3 py-2.5 rounded-lg text-left transition-all duration-200
                    ${isActive 
                      ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-r-2 border-blue-500' 
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                    }
                    ${isCollapsed ? 'justify-center' : 'justify-start'}
                  `}
                >
                  <Icon className={`w-5 h-5 ${isCollapsed ? '' : 'mr-3'} flex-shrink-0`} />
                  {!isCollapsed && (
                    <span className="text-sm font-medium">{item.label}</span>
                  )}
                  {!isCollapsed && item.badge && (
                    <span className="ml-auto bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 text-xs px-2 py-0.5 rounded-full">
                      {item.badge}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
          {!isCollapsed && (
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {user?.name || 'Пользователь'}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {user?.email || 'user@example.com'}
                </p>
              </div>
            </div>
          )}
          <button
            onClick={handleLogout}
            className={`p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${
              isCollapsed ? 'w-full flex justify-center' : ''
            }`}
            title="Выйти"
          >
            <LogOut className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Mobile Toggle Button */}
      <button
        onClick={() => setIsMobileOpen(true)}
        className="fixed top-4 left-4 z-50 p-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg md:hidden"
      >
        <Menu className="w-5 h-5 text-gray-600 dark:text-gray-400" />
      </button>

      {/* Desktop Sidebar */}
      <div
        className={`
          hidden md:flex md:flex-col md:fixed md:inset-y-0 md:left-0 md:z-30
          bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700
          transition-all duration-300 ease-in-out
          ${isCollapsed ? 'md:w-16' : 'md:w-64'}
        `}
      >
        <SidebarContent />
      </div>

      {/* Mobile Sidebar */}
      <div
        className={`
          fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700
          transform transition-transform duration-300 ease-in-out md:hidden
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Mobile Close Button */}
        <div className="absolute top-4 right-4">
          <button
            onClick={() => setIsMobileOpen(false)}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
        </div>
        <SidebarContent />
      </div>
    </>
  );
};

export default ModernSidebar;