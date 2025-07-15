// Authentication Context
export { AuthProvider, useAuth } from '../contexts/AuthContext';
export type { AuthState, RegisterData } from '../contexts/AuthContext';
export type { User } from '../types/auth';

// Authentication Hooks
export { useAuth as useAuthHook } from '../hooks/useAuth';
export { useAuthGuard } from '../hooks/useAuthGuard';
export { useSessionTimeout } from '../hooks/useSessionTimeout';
export { useAuthRedirect } from '../hooks/useAuthRedirect';
export { useSocialAuth } from '../hooks/useSocialAuth';

// Authentication Components
export { default as ProtectedRoute } from '../components/auth/ProtectedRoute';
export { default as AuthGuard } from '../components/auth/AuthGuard';
export { default as SessionTimeoutModal } from '../components/auth/SessionTimeoutModal';
export { default as SocialLoginButton } from '../components/auth/SocialLoginButton';
export { default as SocialLoginPanel } from '../components/auth/SocialLoginPanel';
export { default as SocialAuthCallback } from '../components/auth/SocialAuthCallback';
export { default as LoginForm } from '../components/auth/LoginForm';

// Authentication Service
export { authService } from '../services/authService';
export type { 
  LoginCredentials, 
  RegisterData as ServiceRegisterData, 
  AuthResponse, 
  ApiResponse 
} from '../services/authService';

// Authentication Utilities
export * from '../utils/authUtils';

// Authentication Configuration
export { VALIDATION_RULES, SOCIAL_PROVIDERS, AUTH_ENDPOINTS, AUTH_CONFIG } from '../config/auth';