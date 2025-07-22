# 🔐 Authentication System

Комплексная система аутентификации для DevAssist Pro с поддержкой JWT токенов, управления сессиями и защиты маршрутов.

## 📦 Компоненты системы

### 🎯 **AuthContext** - Центральное управление состоянием
Глобальный контекст для управления состоянием аутентификации приложения.

```tsx
import { AuthProvider, useAuth } from '@/auth';

// Оборачиваем приложение в провайдер
<AuthProvider>
  <App />
</AuthProvider>

// Используем в компонентах
const { state, login, logout, updateProfile } = useAuth();
```

**Возможности:**
- Автоматическое восстановление сессии при перезагрузке
- Управление JWT и refresh токенами
- Автоматическое обновление токенов
- Проверка истечения сессии
- Централизованная обработка ошибок

### 🛡️ **ProtectedRoute** - Защита маршрутов
Компонент для защиты страниц от неавторизованных пользователей.

```tsx
import { ProtectedRoute } from '@/auth';

<ProtectedRoute requireAuth={true} allowedRoles={['admin', 'user']}>
  <AdminPanel />
</ProtectedRoute>

<ProtectedRoute requireAuth={false}> {/* Только для неавторизованных */}
  <LoginPage />
</ProtectedRoute>
```

### 🔒 **AuthGuard** - Условный рендеринг
Компонент для показа/скрытия контента на основе авторизации.

```tsx
import { AuthGuard } from '@/auth';

<AuthGuard requireRole={['admin']}>
  <AdminButton />
</AuthGuard>

<AuthGuard fallback={<LoginForm />}>
  <UserContent />
</AuthGuard>
```

### ⏰ **SessionTimeout** - Управление сессиями
Автоматическое отслеживание и предупреждение об истечении сессии.

```tsx
import { SessionTimeoutModal, useSessionTimeout } from '@/auth';

const { showWarning, timeLeftFormatted, extendSession } = useSessionTimeout({
  warningTime: 5 * 60 * 1000, // 5 минут до истечения
  autoExtend: true // Автопродление при активности
});

<SessionTimeoutModal onExtend={extendSession} onLogout={logout} />
```

## 🔧 Hooks (Хуки)

### `useAuth()`
Основной хук для работы с аутентификацией.

```tsx
const {
  state: { user, isAuthenticated, isLoading, error },
  login,
  logout,
  register,
  updateProfile,
  refreshToken,
  forgotPassword,
  resetPassword,
  clearError
} = useAuth();
```

### `useAuthGuard(options)`
Хук для защиты компонентов и проверки прав.

```tsx
const {
  isAuthenticated,
  isLoading,
  user,
  hasRole,
  hasAnyRole,
  isAdmin,
  canPerformAction
} = useAuthGuard({
  requireRole: ['admin'],
  redirectTo: '/login',
  onUnauthorized: () => showNotification('Нет доступа')
});
```

### `useSessionTimeout(options)`
Хук для управления тайм-аутом сессии.

```tsx
const {
  timeUntilExpiry,
  showWarning,
  isExpired,
  timeLeftFormatted,
  extendSession,
  dismissWarning
} = useSessionTimeout({
  warningTime: 5 * 60 * 1000,
  onWarning: () => showToast('Сессия истекает'),
  autoExtend: true
});
```

### `useAuthRedirect(options)`
Хук для автоматических редиректов на основе состояния авторизации.

```tsx
const { isRedirecting } = useAuthRedirect({
  requireAuth: false, // Страница логина
  redirectWhenAuthenticated: '/dashboard',
  allowedRoles: ['user', 'admin']
});
```

## 🛠️ Утилиты

### Работа с токенами
```tsx
import { 
  isTokenValid, 
  getTokenPayload, 
  isTokenExpiringSoon,
  getAuthHeaders 
} from '@/auth';

// Проверка валидности токена
if (isTokenValid(token)) {
  // Токен действителен
}

// Получение данных из токена
const payload = getTokenPayload(token);

// Проверка скорого истечения
if (isTokenExpiringSoon(token, 5)) {
  // Токен истекает в течение 5 минут
}

// Заголовки для API запросов
const headers = getAuthHeaders();
```

### Управление данными
```tsx
import { 
  clearAuthData, 
  getStoredUser, 
  storeToken,
  isAuthenticated 
} from '@/auth';

// Очистка всех данных авторизации
clearAuthData();

// Получение пользователя из localStorage
const user = getStoredUser();

// Проверка авторизации
if (isAuthenticated()) {
  // Пользователь авторизован
}
```

### Безопасность
```tsx
import { 
  checkPasswordStrength, 
  generateSecurePassword,
  isValidEmail,
  getBrowserInfo 
} from '@/auth';

// Проверка силы пароля
const { score, feedback, isStrong } = checkPasswordStrength(password);

// Генерация безопасного пароля
const securePassword = generateSecurePassword(12);

// Валидация email
if (isValidEmail(email)) {
  // Email корректный
}

// Информация о браузере для логов
const browserInfo = getBrowserInfo();
```

## 🔌 API Service

### Основные методы
```tsx
import { authService } from '@/auth';

// Вход в систему
try {
  const response = await authService.login({
    email: 'user@example.com',
    password: 'password',
    rememberMe: true
  });
  
  if (response.success) {
    // Успешный вход
  }
} catch (error) {
  // Обработка ошибки
}

// Регистрация
const registerResult = await authService.register({
  email: 'new@example.com',
  password: 'newpassword',
  firstName: 'Иван',
  lastName: 'Петров',
  acceptTerms: true
});

// Выход
await authService.logout();

// Обновление токена
const refreshResult = await authService.refreshToken(refreshToken);

// Восстановление пароля
await authService.forgotPassword('user@example.com');

// Смена пароля
await authService.changePassword('oldPassword', 'newPassword');
```

## 🎨 Конфигурация

### Настройка аутентификации
```tsx
// src/config/auth.ts
export const AUTH_CONFIG = {
  TOKEN_STORAGE_KEY: 'devassist_token',
  REFRESH_TOKEN_STORAGE_KEY: 'devassist_refresh_token',
  USER_STORAGE_KEY: 'devassist_user',
  SESSION_TIMEOUT: 24 * 60 * 60 * 1000, // 24 часа
};

export const VALIDATION_RULES = {
  email: { required: true, pattern: /email-regex/ },
  password: { required: true, minLength: 8 }
};
```

### Социальные провайдеры
```tsx
export const SOCIAL_PROVIDERS = [
  { id: 'google', name: 'Google', enabled: true },
  { id: 'yandex', name: 'Яндекс', enabled: true },
  { id: 'vk', name: 'ВКонтакте', enabled: true }
];
```

## 📱 Использование в компонентах

### Страница логина
```tsx
import { useAuth, useAuthRedirect } from '@/auth';

const LoginPage = () => {
  const { login, state } = useAuth();
  useAuthRedirect({ requireAuth: false });

  const handleLogin = async (email: string, password: string) => {
    try {
      await login(email, password);
      // Автоматический редирект произойдет через useAuthRedirect
    } catch (error) {
      // Показать ошибку
    }
  };

  return (
    <div>
      {/* Форма логина */}
    </div>
  );
};
```

### Защищенная страница
```tsx
import { ProtectedRoute, useAuthGuard } from '@/auth';

const AdminPage = () => {
  const { user, canPerformAction } = useAuthGuard();

  return (
    <ProtectedRoute requireAuth={true} allowedRoles={['admin']}>
      <div>
        <h1>Админ панель</h1>
        {canPerformAction('manage_users') && (
          <UserManagement />
        )}
      </div>
    </ProtectedRoute>
  );
};
```

### Основное приложение
```tsx
import { AuthProvider, SessionTimeoutModal } from '@/auth';

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/admin" element={<AdminPage />} />
        </Routes>
      </Router>
      <SessionTimeoutModal />
    </AuthProvider>
  );
};
```

## 🔐 Типы пользователей

```tsx
interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'user' | 'admin' | 'moderator';
  avatar?: string;
  isEmailVerified: boolean;
  subscription: {
    plan: string;
    status: 'active' | 'inactive' | 'cancelled';
    expiresAt: string;
  };
  preferences: {
    language: string;
    theme: 'light' | 'dark' | 'system';
    notifications: {
      email: boolean;
      push: boolean;
    };
  };
  createdAt: string;
  lastLoginAt: string;
}
```

## 🚀 Интеграция с Backend

Система готова для интеграции с реальным backend API. Для этого нужно:

1. **Заменить mock функции** в `authService.ts` на реальные API вызовы
2. **Настроить переменные окружения** в `.env`:
   ```env
   REACT_APP_API_URL=https://api.devassist.ru
   ```
3. **Обновить эндпоинты** в `config/auth.ts` если необходимо

## 🔧 Backend Requirements

Система ожидает следующие API эндпоинты:

```
POST /api/auth/login       - Вход в систему
POST /api/auth/register    - Регистрация
POST /api/auth/logout      - Выход
POST /api/auth/refresh     - Обновление токена
POST /api/auth/forgot-password - Восстановление пароля
POST /api/auth/reset-password  - Сброс пароля
GET  /api/user/profile     - Получение профиля
PUT  /api/user/profile     - Обновление профиля
POST /api/user/password    - Смена пароля
```

## 🛡️ Безопасность

- **JWT токены** с автоматическим обновлением
- **Проверка ролей** и прав доступа
- **Защита от XSS** через правильное хранение токенов
- **Автоматический logout** при истечении сессии
- **Валидация данных** на клиенте
- **Отслеживание активности** для автопродления сессий

---

**✅ Система аутентификации готова к использованию!** 🎉

Все компоненты протестированы и готовы для интеграции с реальным backend API.