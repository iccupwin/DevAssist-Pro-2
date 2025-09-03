// Re-export types from shared types to maintain compatibility
import type { User, AuthResponse, RegisterRequest } from './shared';
export type { User, AuthResponse, RegisterRequest };

export interface LoginFormData {
  email: string;
  password: string;
  remember?: boolean;
}

export interface RegisterFormData {
  email: string;
  password: string;
  confirmPassword: string;
  acceptTerms: boolean;
  
  // Support both new and old name fields
  full_name?: string;
  firstName?: string;
  lastName?: string;
  
  // Support both company/organization field names
  company?: string;
  organization?: string;
  phone?: string;
}

export interface ForgotPasswordFormData {
  email: string;
}

export interface ResetPasswordFormData {
  token: string;
  password: string;
  confirmPassword: string;
}

// AuthResponse is now imported from shared.ts - keeping old interface for backward compatibility
export interface LegacyAuthResponse {
  success: boolean;
  user?: User;
  token?: string;
  refreshToken?: string;
  expiresIn?: number; // Time until token expires in seconds
  message?: string;
  error?: string;
}

export interface SocialLoginProvider {
  name: 'google' | 'microsoft' | 'yandex';
  displayName: string;
  icon: string;
  color: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (credentials: LoginFormData) => Promise<AuthResponse>;
  register: (userData: RegisterFormData) => Promise<AuthResponse>;
  logout: () => void;
  forgotPassword: (email: string) => Promise<AuthResponse>;
  resetPassword: (data: ResetPasswordFormData) => Promise<AuthResponse>;
  clearError: () => void;
  refreshToken: () => Promise<boolean>;
}