/**
 * AuthDebug - Компонент для отладки аутентификации
 * Временный компонент для тестирования
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { AUTH_CONFIG } from '../../config/auth';
import { DEV_TEST_USERS } from '../../config/development';

export const AuthDebug: React.FC = () => {
  const { user, isAuthenticated, login, logout } = useAuth();
  const [localStorageData, setLocalStorageData] = useState<{
    user: string | null;
    token: string | null;
    refreshToken: string | null;
    tokenExpiresAt: string | null;
  }>({});

  const refreshLocalStorage = () => {
    const data = {
      user: localStorage.getItem(AUTH_CONFIG.USER_STORAGE_KEY),
      token: localStorage.getItem(AUTH_CONFIG.TOKEN_STORAGE_KEY),
      refreshToken: localStorage.getItem(AUTH_CONFIG.REFRESH_TOKEN_STORAGE_KEY),
      tokenExpiresAt: localStorage.getItem(AUTH_CONFIG.TOKEN_EXPIRES_AT_KEY)
    };
    setLocalStorageData(data);
  };

  useEffect(() => {
    refreshLocalStorage();
    const interval = setInterval(refreshLocalStorage, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleTestLogin = async () => {
    try {
      // [AuthDebug] Starting test login...
      const adminUser = DEV_TEST_USERS.find(user => user.role === 'admin');
      if (adminUser) {
        const result = await login({
          email: adminUser.email,
          password: adminUser.password
        });
        // [AuthDebug] Login result processed
      } else {
        // [AuthDebug] No admin test user found
      }
    } catch (error) {
      // [AuthDebug] Login error occurred
    }
  };

  const handleForceLogin = () => {
    // [AuthDebug] Force login - clearing localStorage and setting admin user...
    
    // Очищаем все
    localStorage.removeItem(AUTH_CONFIG.USER_STORAGE_KEY);
    localStorage.removeItem(AUTH_CONFIG.TOKEN_STORAGE_KEY);
    localStorage.removeItem(AUTH_CONFIG.REFRESH_TOKEN_STORAGE_KEY);
    localStorage.removeItem(AUTH_CONFIG.TOKEN_EXPIRES_AT_KEY);
    
    // Создаем администратора принудительно из тестовых данных
    const testAdminUser = DEV_TEST_USERS.find(user => user.role === 'admin');
    if (!testAdminUser) {
      console.error('[AuthDebug] No admin test user found');
      return;
    }
    const adminUser = testAdminUser.profile;

    const token = 'mock_jwt_token_force_' + Date.now();
    const refreshToken = 'mock_refresh_token_force_' + Date.now();
    const tokenExpiresAt = Date.now() + 3600 * 1000;

    localStorage.setItem(AUTH_CONFIG.USER_STORAGE_KEY, JSON.stringify(adminUser));
    localStorage.setItem(AUTH_CONFIG.TOKEN_STORAGE_KEY, token);
    localStorage.setItem(AUTH_CONFIG.REFRESH_TOKEN_STORAGE_KEY, refreshToken);
    localStorage.setItem(AUTH_CONFIG.TOKEN_EXPIRES_AT_KEY, tokenExpiresAt.toString());

    // [AuthDebug] Force login completed, refreshing page...
    setTimeout(() => window.location.reload(), 500);
  };

  const handleTestLogout = async () => {
    try {
      await logout();
      // Logout completed
    } catch (error) {
      // Logout error occurred
    }
  };

  const clearLocalStorage = () => {
    localStorage.removeItem(AUTH_CONFIG.USER_STORAGE_KEY);
    localStorage.removeItem(AUTH_CONFIG.TOKEN_STORAGE_KEY);
    localStorage.removeItem(AUTH_CONFIG.REFRESH_TOKEN_STORAGE_KEY);
    localStorage.removeItem(AUTH_CONFIG.TOKEN_EXPIRES_AT_KEY);
    refreshLocalStorage();
  };

  return (
    <div className="fixed bottom-4 right-4 bg-gray-800 text-white p-4 rounded-lg shadow-lg max-w-md z-50">
      <h3 className="font-bold mb-2">Auth Debug</h3>
      
      <div className="mb-4">
        <div className="text-sm">
          <div>Authenticated: {isAuthenticated ? '✅' : '❌'}</div>
          <div>User: {user ? `${user.email} (${user.role})` : 'None'}</div>
          {user && (
            <div className="text-xs text-gray-300">
              <div>Name: {user.full_name}</div>
              <div>Admin: {user.role === 'admin' ? '✅' : '❌'}</div>
            </div>
          )}
        </div>
      </div>

      <div className="mb-4">
        <div className="text-xs">
          <div className="font-semibold">LocalStorage:</div>
          <div>User: {localStorageData.user ? '✅' : '❌'}</div>
          <div>Token: {localStorageData.token ? '✅' : '❌'}</div>
          <div>Refresh: {localStorageData.refreshToken ? '✅' : '❌'}</div>
          <div>Expires: {localStorageData.tokenExpiresAt ? new Date(parseInt(localStorageData.tokenExpiresAt)).toLocaleTimeString() : '❌'}</div>
          {localStorageData.tokenExpiresAt && (
            <div className="text-xs text-gray-300">
              Valid: {parseInt(localStorageData.tokenExpiresAt) > Date.now() ? '✅' : '❌ EXPIRED'}
            </div>
          )}
        </div>
      </div>

      <div className="mb-4">
        <div className="text-xs">
          <div className="font-semibold">Quick Tests:</div>
          <button 
            onClick={() => window.open('/admin', '_blank')}
            className="bg-purple-600 hover:bg-purple-700 px-2 py-1 rounded text-xs mr-1 mb-1"
          >
            Open Admin
          </button>
          <button 
            onClick={() => window.open('/test-admin', '_blank')}
            className="bg-pink-600 hover:bg-pink-700 px-2 py-1 rounded text-xs mr-1 mb-1"
          >
            Test Admin
          </button>
          <button 
            onClick={() => window.open('/simple-admin', '_blank')}
            className="bg-cyan-600 hover:bg-cyan-700 px-2 py-1 rounded text-xs mr-1 mb-1"
          >
            Simple Admin
          </button>
          <button 
            onClick={() => window.open('/minimal-admin', '_blank')}
            className="bg-lime-600 hover:bg-lime-700 px-2 py-1 rounded text-xs mr-1 mb-1"
          >
            Minimal
          </button>
          <button 
            onClick={() => window.open('/auth', '_blank')}
            className="bg-orange-600 hover:bg-orange-700 px-2 py-1 rounded text-xs mr-1 mb-1"
          >
            Open Auth
          </button>
          <button 
            onClick={() => window.open('/test-dashboard', '_blank')}
            className="bg-indigo-600 hover:bg-indigo-700 px-2 py-1 rounded text-xs mr-1 mb-1"
          >
            Test Dashboard
          </button>
        </div>
      </div>

      <div className="flex flex-col space-y-2">
        <button 
          onClick={handleTestLogin}
          className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm"
        >
          Test Login
        </button>
        <button 
          onClick={handleForceLogin}
          className="bg-green-600 hover:bg-green-700 px-3 py-1 rounded text-sm"
        >
          Force Login
        </button>
        <button 
          onClick={handleTestLogout}
          className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-sm"
        >
          Test Logout
        </button>
        <button 
          onClick={clearLocalStorage}
          className="bg-gray-600 hover:bg-gray-700 px-3 py-1 rounded text-sm"
        >
          Clear Storage
        </button>
      </div>
    </div>
  );
};

export default AuthDebug;