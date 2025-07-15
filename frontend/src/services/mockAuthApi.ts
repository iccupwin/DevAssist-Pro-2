/**
 * Mock Authentication API for Development
 * Simulates backend auth endpoints with realistic responses
 */

import { User, AuthResponse, LoginCredentials, RegisterData } from './enhancedAuthService';

// Mock users database
const mockUsers: User[] = [
  {
    id: '1',
    email: 'admin@devassist.pro',
    name: 'Администратор Системы',
    firstName: 'Иван',
    lastName: 'Иванов',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
    role: 'admin',
    company: 'DevAssist Pro',
    department: 'Технический отдел',
    phone: '+7 (495) 123-45-67',
    verified: true,
    createdAt: '2024-01-15T10:00:00.000Z',
    lastLogin: new Date().toISOString(),
    preferences: {
      theme: 'dark',
      language: 'ru',
      timezone: 'Europe/Moscow',
      notifications: {
        email: true,
        push: true,
        sms: false
      },
      dashboard: {
        layout: 'grid',
        modules: ['kp-analyzer', 'tz-generator']
      }
    }
  },
  {
    id: '2',
    email: 'user@example.com',
    name: 'Пользователь Тестовый',
    firstName: 'Анна',
    lastName: 'Петрова',
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612de8e?w=150&h=150&fit=crop&crop=face',
    role: 'user',
    company: 'Строй Инвест',
    department: 'Отдел закупок',
    phone: '+7 (495) 987-65-43',
    verified: true,
    createdAt: '2024-02-10T14:30:00.000Z',
    lastLogin: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    preferences: {
      theme: 'light',
      language: 'ru',
      timezone: 'Europe/Moscow',
      notifications: {
        email: true,
        push: false,
        sms: false
      },
      dashboard: {
        layout: 'list',
        modules: ['kp-analyzer']
      }
    }
  },
  {
    id: '3',
    email: 'manager@company.ru',
    name: 'Менеджер Проектов',
    firstName: 'Сергей',
    lastName: 'Смирнов',
    role: 'manager',
    company: 'РосДевелопмент',
    department: 'Управление проектами',
    phone: '+7 (812) 555-12-34',
    verified: true,
    createdAt: '2024-01-20T09:15:00.000Z',
    lastLogin: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    preferences: {
      theme: 'auto',
      language: 'ru',
      timezone: 'Europe/Moscow',
      notifications: {
        email: true,
        push: true,
        sms: true
      },
      dashboard: {
        layout: 'grid',
        modules: ['kp-analyzer', 'tz-generator', 'project-analysis']
      }
    }
  }
];

// Mock tokens storage
const mockTokens = new Map<string, {
  userId: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}>();

class MockAuthAPI {
  private delay = 800; // Simulate network delay

  private async simulateDelay(): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, this.delay));
  }

  private generateToken(): string {
    return Math.random().toString(36).substr(2) + Date.now().toString(36);
  }

  private createTokenPair(userId: string) {
    const accessToken = this.generateToken();
    const refreshToken = this.generateToken();
    const expiresAt = Date.now() + (60 * 60 * 1000); // 1 hour

    mockTokens.set(accessToken, {
      userId,
      accessToken,
      refreshToken,
      expiresAt
    });

    return {
      accessToken,
      refreshToken,
      expiresAt: new Date(expiresAt).toISOString(),
      expiresIn: 3600 // 1 hour in seconds
    };
  }

  private findUserByToken(token: string): User | null {
    const tokenData = mockTokens.get(token);
    if (!tokenData || tokenData.expiresAt < Date.now()) {
      return null;
    }

    return mockUsers.find(user => user.id === tokenData.userId) || null;
  }

  /**
   * Mock login endpoint
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    await this.simulateDelay();

    const { email, password } = credentials;

    // Find user by email
    const user = mockUsers.find(u => u.email.toLowerCase() === email.toLowerCase());

    if (!user) {
      return {
        success: false,
        error: 'Пользователь с таким email не найден'
      };
    }

    // Mock password validation (in real app, this would be hashed)
    if (password !== 'password' && password !== '123456') {
      return {
        success: false,
        error: 'Неверный пароль'
      };
    }

    // Update last login
    user.lastLogin = new Date().toISOString();

    // Generate tokens
    const token = this.createTokenPair(user.id);

    return {
      success: true,
      user,
      token
    };
  }

  /**
   * Mock register endpoint
   */
  async register(userData: RegisterData): Promise<AuthResponse> {
    await this.simulateDelay();

    const { email, password, name, firstName, lastName, company, department, phone } = userData;

    // Check if user already exists
    const existingUser = mockUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (existingUser) {
      return {
        success: false,
        error: 'Пользователь с таким email уже существует'
      };
    }

    // Create new user
    const newUser: User = {
      id: (mockUsers.length + 1).toString(),
      email,
      name,
      firstName,
      lastName,
      role: 'user',
      company,
      department,
      phone,
      verified: false, // Would require email verification
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
      preferences: {
        theme: 'light',
        language: 'ru',
        timezone: 'Europe/Moscow',
        notifications: {
          email: true,
          push: false,
          sms: false
        },
        dashboard: {
          layout: 'grid',
          modules: ['kp-analyzer']
        }
      }
    };

    mockUsers.push(newUser);

    // Generate tokens
    const token = this.createTokenPair(newUser.id);

    return {
      success: true,
      user: newUser,
      token
    };
  }

  /**
   * Mock get current user endpoint
   */
  async getCurrentUser(authToken: string): Promise<AuthResponse> {
    await this.simulateDelay();

    const token = authToken.replace('Bearer ', '');
    const user = this.findUserByToken(token);

    if (!user) {
      return {
        success: false,
        error: 'Недействительный токен авторизации'
      };
    }

    return {
      success: true,
      user
    };
  }

  /**
   * Mock refresh token endpoint
   */
  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    await this.simulateDelay();

    // Find token by refresh token
    const tokenEntry = Array.from(mockTokens.values()).find(t => t.refreshToken === refreshToken);
    
    if (!tokenEntry) {
      return {
        success: false,
        error: 'Недействительный refresh token'
      };
    }

    const user = mockUsers.find(u => u.id === tokenEntry.userId);
    if (!user) {
      return {
        success: false,
        error: 'Пользователь не найден'
      };
    }

    // Remove old token
    mockTokens.delete(tokenEntry.accessToken);

    // Generate new token pair
    const token = this.createTokenPair(user.id);

    return {
      success: true,
      user,
      token
    };
  }

  /**
   * Mock update profile endpoint
   */
  async updateProfile(authToken: string, updates: Partial<User>): Promise<AuthResponse> {
    await this.simulateDelay();

    const token = authToken.replace('Bearer ', '');
    const user = this.findUserByToken(token);

    if (!user) {
      return {
        success: false,
        error: 'Недействительный токен авторизации'
      };
    }

    // Update user data
    Object.assign(user, updates);

    return {
      success: true,
      user,
      message: 'Профиль успешно обновлен'
    };
  }

  /**
   * Mock logout endpoint
   */
  async logout(authToken: string): Promise<AuthResponse> {
    await this.simulateDelay();

    const token = authToken.replace('Bearer ', '');
    mockTokens.delete(token);

    return {
      success: true,
      message: 'Выход выполнен успешно'
    };
  }

  /**
   * Mock change password endpoint
   */
  async changePassword(authToken: string, passwordData: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  }): Promise<AuthResponse> {
    await this.simulateDelay();

    const token = authToken.replace('Bearer ', '');
    const user = this.findUserByToken(token);

    if (!user) {
      return {
        success: false,
        error: 'Недействительный токен авторизации'
      };
    }

    const { currentPassword, newPassword, confirmPassword } = passwordData;

    // Mock current password validation
    if (currentPassword !== 'password' && currentPassword !== '123456') {
      return {
        success: false,
        error: 'Неверный текущий пароль'
      };
    }

    if (newPassword !== confirmPassword) {
      return {
        success: false,
        error: 'Пароли не совпадают'
      };
    }

    if (newPassword.length < 6) {
      return {
        success: false,
        error: 'Пароль должен содержать минимум 6 символов'
      };
    }

    return {
      success: true,
      message: 'Пароль успешно изменен'
    };
  }

  /**
   * Mock forgot password endpoint
   */
  async forgotPassword(email: string): Promise<AuthResponse> {
    await this.simulateDelay();

    const user = mockUsers.find(u => u.email.toLowerCase() === email.toLowerCase());

    if (!user) {
      return {
        success: false,
        error: 'Пользователь с таким email не найден'
      };
    }

    return {
      success: true,
      message: 'Инструкции по восстановлению пароля отправлены на ваш email'
    };
  }

  /**
   * Mock email verification endpoint
   */
  async verifyEmail(token: string): Promise<AuthResponse> {
    await this.simulateDelay();

    // In real implementation, token would be validated
    // For mock, we'll just find the first unverified user
    const user = mockUsers.find(u => !u.verified);

    if (!user) {
      return {
        success: false,
        error: 'Недействительный токен верификации'
      };
    }

    user.verified = true;

    return {
      success: true,
      user,
      message: 'Email успешно подтвержден'
    };
  }

  /**
   * Mock upload avatar endpoint
   */
  async uploadAvatar(authToken: string, file: File): Promise<AuthResponse> {
    await this.simulateDelay();

    const token = authToken.replace('Bearer ', '');
    const user = this.findUserByToken(token);

    if (!user) {
      return {
        success: false,
        error: 'Недействительный токен авторизации'
      };
    }

    // Mock file upload - create fake URL
    const avatarUrl = `https://images.unsplash.com/photo-${Date.now()}?w=150&h=150&fit=crop&crop=face`;
    user.avatar = avatarUrl;

    return {
      success: true,
      user,
      message: 'Аватар успешно обновлен'
    };
  }

  /**
   * Get all mock users (for development)
   */
  getMockUsers(): User[] {
    return mockUsers;
  }

  /**
   * Clear all tokens (for development)
   */
  clearAllTokens(): void {
    mockTokens.clear();
  }

  /**
   * Set API delay (for development)
   */
  setDelay(ms: number): void {
    this.delay = ms;
  }
}

// Export singleton instance
export const mockAuthAPI = new MockAuthAPI();
export default mockAuthAPI;