// Re-export User from shared types to maintain compatibility
import type { User } from './shared';
export type { User };

export interface LoginFormData {
  email: string;
  password: string;
  remember?: boolean;
}

export interface RegisterFormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  acceptTerms: boolean;
  organization?: string;
}

export interface ForgotPasswordFormData {
  email: string;
}

export interface ResetPasswordFormData {
  token: string;
  password: string;
  confirmPassword: string;
}

export interface AuthResponse {
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