import React from 'react';
import { useAuthGuard } from '../../hooks/useAuthGuard';
import LoadingSpinner from '../ui/LoadingSpinner';

interface AuthGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  requireRole?: string[];
  redirectTo?: string;
  onUnauthorized?: () => void;
}

/**
 * Компонент-обертка для условного рендеринга на основе авторизации
 * Не выполняет редирект, а показывает fallback контент
 */
const AuthGuard: React.FC<AuthGuardProps> = ({
  children,
  fallback,
  requireRole = [],
  redirectTo,
  onUnauthorized
}): React.ReactElement => {
  const { isAuthorized, isLoading, hasAnyRole } = useAuthGuard({
    requireRole,
    redirectTo,
    onUnauthorized
  });

  // Показываем загрузчик во время проверки
  if (isLoading) {
    return <LoadingSpinner />;
  }

  // Если пользователь не авторизован или не имеет нужных ролей
  if (!isAuthorized || (requireRole.length > 0 && !hasAnyRole(requireRole))) {
    return (fallback as React.ReactElement) || (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Доступ ограничен
          </h3>
          <p className="text-gray-600">
            У вас нет прав для просмотра этого содержимого
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default AuthGuard;