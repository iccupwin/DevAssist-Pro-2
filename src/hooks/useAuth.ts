import { useAuth as useAuthContext } from '../contexts/AuthContext';

// Реэкспорт для удобства использования
export const useAuth = useAuthContext;

// Дополнительные хуки для специфичных случаев
export { useAuthGuard } from './useAuthGuard';
export { useSessionTimeout } from './useSessionTimeout';
export { useAuthRedirect } from './useAuthRedirect';