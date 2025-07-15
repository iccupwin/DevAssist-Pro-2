import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../ui/LoadingSpinner';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  allowedRoles?: string[];
  fallbackPath?: string;
  loadingComponent?: React.ReactNode;
}

/**
 * Компонент для защиты маршрутов
 * Проверяет авторизацию и роли пользователя
 */
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireAuth = true,
  allowedRoles = [],
  fallbackPath = '/auth/login',
  loadingComponent
}): React.ReactElement | null => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  // Показываем загрузчик пока проверяем состояние
  if (isLoading) {
    return (loadingComponent as React.ReactElement) || <LoadingSpinner />;
  }

  // Если требуется авторизация, но пользователь не авторизован
  if (requireAuth && !isAuthenticated) {
    return (
      <Navigate
        to={fallbackPath}
        state={{ returnUrl: location.pathname + location.search }}
        replace
      />
    );
  }

  // Если пользователь авторизован, но маршрут не требует авторизации
  if (!requireAuth && isAuthenticated) {
    // Получаем URL для возврата или используем дефолтный
    const returnUrl = (location.state as any)?.returnUrl || '/dashboard';
    return <Navigate to={returnUrl} replace />;
  }

  // Проверка ролей, если они указаны
  if (allowedRoles.length > 0 && user) {
    if (!allowedRoles.includes(user.role)) {
      // Редиректим на главную страницу роли
      const roleBasedPath = getRoleBasedPath(user.role);
      return <Navigate to={roleBasedPath} replace />;
    }
  }

  // Все проверки пройдены, рендерим дочерние компоненты
  return <>{children}</>;
};

/**
 * Получение пути на основе роли пользователя
 */
const getRoleBasedPath = (role: string): string => {
  switch (role) {
    case 'admin':
      return '/admin/dashboard';
    case 'moderator':
      return '/moderator/dashboard';
    case 'user':
    default:
      return '/dashboard';
  }
};

export default ProtectedRoute;