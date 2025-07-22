/**
 * AdminPage - Главная страница админ панели
 * Согласно ТЗ DevAssist Pro
 */

import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { DEV_TEST_USERS, DEV_CONFIG } from '../config/development';
import AdminLayout from '../components/admin/AdminLayout';
import AdminDashboard from '../components/admin/AdminDashboard';
import UserManagement from '../components/admin/UserManagement';
import AIManagement from '../components/admin/AIManagement';
import SystemSettings from '../components/admin/SystemSettings';
import BackendManagement from '../components/admin/BackendManagement';

const AdminPage: React.FC = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'ai' | 'system' | 'backend'>('dashboard');

  // Прямая проверка localStorage для быстрого доступа (используем useMemo для предотвращения бесконечных рендеров)
  const directAuth = React.useMemo(() => {
    try {
      const userStr = localStorage.getItem('devassist_user');
      const tokenStr = localStorage.getItem('devassist_simple_token');
      const tokenExpiresAtStr = localStorage.getItem('devassist_token_expires_at');

      console.log('[AdminPage] Direct localStorage check:', {
        hasUser: !!userStr,
        hasToken: !!tokenStr,
        hasExpires: !!tokenExpiresAtStr
      });

      if (userStr && tokenStr && tokenExpiresAtStr) {
        const user = JSON.parse(userStr);
        const tokenExpiresAt = parseInt(tokenExpiresAtStr);
        const isValid = tokenExpiresAt > Date.now();
        
        console.log('[AdminPage] Parsed data:', {
          userEmail: user.email,
          userRole: user.role,
          tokenValid: isValid
        });
        
        if (isValid && user.role === 'admin') {
          return { isValid: true, user, isAdmin: true };
        }
      }
      
      return { isValid: false, user: null, isAdmin: false };
    } catch (error) {
      console.error('[AdminPage] Error in direct auth check:', error);
      return { isValid: false, user: null, isAdmin: false };
    }
  }, []); // Пустой массив зависимостей - проверяем только один раз

  // Используем либо контекст, либо прямую проверку
  const effectiveUser = user || directAuth.user;
  const effectiveAuth = isAuthenticated || directAuth.isValid;
  const effectiveAdmin = (user?.role === 'admin') || directAuth.isAdmin;

  console.log('[AdminPage] Final auth check:', {
    contextUser: user?.email,
    contextAuth: isAuthenticated,
    contextLoading: isLoading,
    directUser: directAuth.user?.email,
    directAuth: directAuth.isValid,
    directAdmin: directAuth.isAdmin,
    effectiveUser: effectiveUser?.email,
    effectiveAuth,
    effectiveAdmin
  });

  // Простая проверка - если есть валидный админ в любом источнике, разрешаем доступ
  if (effectiveAuth && effectiveUser && effectiveAdmin) {
    console.log('[AdminPage] ✅ Access granted to admin user:', effectiveUser.email);
    
    // Показываем админ панель
    const renderContent = () => {
      switch (activeTab) {
        case 'dashboard':
          return <AdminDashboard />;
        case 'users':
          return <UserManagement />;
        case 'ai':
          return <AIManagement />;
        case 'backend':
          return <BackendManagement />;
        case 'system':
          return <SystemSettings />;
        default:
          return <AdminDashboard />;
      }
    };

    return (
      <AdminLayout 
        activeTab={activeTab} 
        onTabChange={setActiveTab}
      >
        {renderContent()}
      </AdminLayout>
    );
  }

  // Показываем кнопку принудительного входа в режиме разработки
  if (process.env.NODE_ENV === 'development') {
    const handleForceLogin = () => {
      const testAdminUser = DEV_TEST_USERS.find(user => user.role === 'admin');
      if (!testAdminUser) {
        console.error('[AdminPage] No admin test user found');
        return;
      }
      const adminUser = testAdminUser.profile;
      
      localStorage.setItem('devassist_user', JSON.stringify(adminUser));
      localStorage.setItem('devassist_simple_token', 'mock_token_' + Date.now());
      localStorage.setItem('devassist_simple_refresh_token', 'mock_refresh_' + Date.now());
      localStorage.setItem('devassist_token_expires_at', (Date.now() + 3600 * 1000).toString());
      
      window.location.reload();
    };

    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="bg-gray-800 p-8 rounded-lg text-white max-w-md text-center">
          <h2 className="text-2xl font-bold mb-4">Admin Access Required</h2>
          <p className="mb-4">
            {directAuth.isValid ? '✅ Valid session found but not admin' : '❌ No valid admin session found'}
          </p>
          <div className="space-y-4">
            <button 
              onClick={handleForceLogin}
              className="w-full bg-green-600 hover:bg-green-700 px-4 py-2 rounded"
            >
              Force Admin Login (Dev Mode)
            </button>
            <button 
              onClick={() => window.location.href = '/test-admin-auth'}
              className="w-full bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded"
            >
              Debug Auth Status
            </button>
            <button 
              onClick={() => window.location.href = '/auth'}
              className="w-full bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded"
            >
              Go to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  // В production режиме перенаправляем на авторизацию
  console.log('[AdminPage] ❌ Access denied, redirecting to /auth');
  return <Navigate to="/auth" replace />;
};

export default AdminPage;