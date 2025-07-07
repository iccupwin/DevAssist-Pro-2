import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface UseAuthRedirectOptions {
  requireAuth?: boolean;
  redirectWhenAuthenticated?: string;
  redirectWhenUnauthenticated?: string;
  allowedRoles?: string[];
}

/**
 * Хук для автоматического редиректа на основе состояния аутентификации
 * @param options - Опции для настройки редиректов
 */
export const useAuthRedirect = (options: UseAuthRedirectOptions = {}) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const {
    requireAuth = false,
    redirectWhenAuthenticated = '/dashboard',
    redirectWhenUnauthenticated = '/auth/login',
    allowedRoles = []
  } = options;

  useEffect(() => {
    // Ждем завершения загрузки состояния
    if (isLoading) return;

    // Получаем URL для возврата из state
    const returnUrl = (location.state as any)?.returnUrl || redirectWhenAuthenticated;

    // Если требуется авторизация, но пользователь не авторизован
    if (requireAuth && !isAuthenticated) {
      navigate(redirectWhenUnauthenticated, {
        replace: true,
        state: { returnUrl: location.pathname + location.search }
      });
      return;
    }

    // Если пользователь авторизован, но на странице, где не должен быть
    if (!requireAuth && isAuthenticated) {
      navigate(returnUrl, { replace: true });
      return;
    }

    // Проверка ролей
    if (allowedRoles.length > 0 && user && isAuthenticated) {
      if (!allowedRoles.includes(user.role)) {
        // Редиректим в зависимости от роли
        const roleBasedRedirect = getRoleBasedRedirect(user.role);
        navigate(roleBasedRedirect, { replace: true });
        return;
      }
    }
  }, [
    isAuthenticated,
    isLoading,
    user,
    requireAuth,
    redirectWhenAuthenticated,
    redirectWhenUnauthenticated,
    allowedRoles,
    navigate,
    location
  ]);

  // Получение редиректа на основе роли пользователя
  const getRoleBasedRedirect = (role: string): string => {
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

  return {
    isRedirecting: isLoading,
    isAuthenticated,
    user
  };
};