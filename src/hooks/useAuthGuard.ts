import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface UseAuthGuardOptions {
  redirectTo?: string;
  requireRole?: string[];
  onUnauthorized?: () => void;
}

/**
 * Хук для защиты маршрутов от неавторизованных пользователей
 * @param options - Опции для настройки поведения guard'а
 * @returns объект с состоянием авторизации и методами проверки
 */
export const useAuthGuard = (options: UseAuthGuardOptions = {}) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const {
    redirectTo = '/auth/login',
    requireRole = [],
    onUnauthorized
  } = options;

  // Проверка авторизации
  useEffect(() => {
    if (isLoading) return; // Ждем загрузки состояния

    if (!isAuthenticated) {
      // Сохраняем текущий путь для редиректа после входа
      const returnUrl = location.pathname + location.search;
      
      if (onUnauthorized) {
        onUnauthorized();
      }
      
      navigate(redirectTo, { 
        replace: true,
        state: { returnUrl }
      });
      return;
    }

    // Проверка ролей, если они указаны
    if (requireRole.length > 0 && user) {
      if (!requireRole.includes(user.role)) {
        navigate('/dashboard', { replace: true });
        return;
      }
    }
  }, [isAuthenticated, isLoading, user, navigate, redirectTo, requireRole, onUnauthorized, location]);

  // Проверка, имеет ли пользователь нужную роль
  const hasRole = (role: string): boolean => {
    return user?.role === role;
  };

  // Проверка, имеет ли пользователь одну из указанных ролей
  const hasAnyRole = (roles: string[]): boolean => {
    return user ? roles.includes(user.role) : false;
  };

  // Проверка, является ли пользователь администратором
  const isAdmin = (): boolean => {
    return hasRole('admin');
  };

  // Проверка, может ли пользователь выполнить действие
  const canPerformAction = (action: string): boolean => {
    if (!user) return false;

    const permissions: Record<string, string[]> = {
      admin: ['create', 'read', 'update', 'delete', 'manage_users', 'view_analytics'],
      moderator: ['create', 'read', 'update', 'delete'],
      user: ['create', 'read', 'update']
    };

    return permissions[user.role]?.includes(action) || false;
  };

  return {
    isAuthenticated,
    isLoading,
    user,
    hasRole,
    hasAnyRole,
    isAdmin,
    canPerformAction,
    // Состояние для условного рендеринга
    isAuthorized: isAuthenticated && !isLoading,
    isUnauthorized: !isAuthenticated && !isLoading,
  };
};