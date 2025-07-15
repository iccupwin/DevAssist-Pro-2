# 🔐 Social Login System

Комплексная система социальной авторизации для DevAssist Pro с поддержкой Google, Яндекс и ВКонтакте.

## ✅ **Подтверждение: Frontend задача**

Social Login кнопки и OAuth flow являются **Frontend ответственностью** согласно ТЗ и правилам:

### 📋 **Frontend ответственность:**
- ✅ **UI компоненты кнопок** - отображение социальных провайдеров
- ✅ **Client-side OAuth flow** - инициация процесса авторизации  
- ✅ **Popup/redirect management** - управление OAuth окнами
- ✅ **State management** - обработка возвращаемых токенов
- ✅ **User experience** - loading states, error handling

### 🔧 **Backend ответственность** (вне scope frontend):
- OAuth callback endpoints обработка
- Token validation и обмен
- User creation/linking
- Security implementation на сервере

---

## 🧩 **Компоненты системы**

### 1. **SocialLoginButton** - Индивидуальная кнопка провайдера
```tsx
import { SocialLoginButton } from '@/auth';

<SocialLoginButton
  provider="google"
  onClick={handleSocialLogin}
  isLoading={isLoading}
  disabled={false}
/>
```

**Поддерживаемые провайдеры:**
- `google` - Google OAuth 2.0
- `yandex` - Яндекс OAuth  
- `vk` - ВКонтакте OAuth

### 2. **SocialLoginPanel** - Панель с несколькими провайдерами
```tsx
import { SocialLoginPanel } from '@/auth';

<SocialLoginPanel
  onSocialLogin={handleSocialLogin}
  disabled={false}
  showDivider={true}
  title="Или войдите через"
/>
```

**Возможности:**
- Автоматическое отображение включенных провайдеров
- Unified error handling
- Loading states для всех кнопок
- Настраиваемый разделитель и заголовок

### 3. **LoginForm** - Полная форма с social login
```tsx
import { LoginForm } from '@/auth';

<LoginForm
  onSuccess={() => navigate('/dashboard')}
  onForgotPassword={() => setMode('forgot')}
  onSignUp={() => setMode('register')}
/>
```

**Включает:**
- Email/password форма
- Social login panel
- Remember me checkbox  
- Forgot password link
- Registration link
- Error handling

### 4. **SocialAuthCallback** - Обработка OAuth callbacks
```tsx
// Разместить на роутах:
// /auth/callback/google
// /auth/callback/yandex
// /auth/callback/vk

import { SocialAuthCallback } from '@/auth';

<Route path="/auth/callback/:provider" element={<SocialAuthCallback />} />
```

**Функции:**
- Парсинг OAuth response
- CSRF защита через state parameter
- Popup/redirect mode support
- Error handling и user feedback

---

## 🔗 **Hooks система**

### `useSocialAuth(options)` - Основной хук
```tsx
import { useSocialAuth } from '@/auth';

const { loginWithSocial, isLoading, error } = useSocialAuth({
  onSuccess: (provider, user) => {
    console.log(`Успешный вход через ${provider}:`, user);
    navigate('/dashboard');
  },
  onError: (provider, error) => {
    showNotification(`Ошибка ${provider}: ${error}`);
  }
});

// Использование
await loginWithSocial('google');
```

**Возможности:**
- Popup-based OAuth flow
- Automatic state generation и validation
- Provider configuration management
- Error handling с retry logic
- Success/error callbacks

---

## ⚙️ **Конфигурация OAuth**

### Environment Variables
```env
# .env
REACT_APP_GOOGLE_CLIENT_ID=your_google_client_id
REACT_APP_YANDEX_CLIENT_ID=your_yandex_client_id  
REACT_APP_VK_CLIENT_ID=your_vk_app_id
```

### Provider Configuration
```tsx
// src/config/auth.ts
export const SOCIAL_PROVIDERS = [
  {
    id: 'google',
    name: 'Google',
    displayName: 'Google',
    icon: 'chrome',
    enabled: true, // Управление видимостью
  },
  {
    id: 'yandex', 
    name: 'Яндекс',
    displayName: 'Яндекс',
    icon: 'grid3X3',
    enabled: true,
  },
  {
    id: 'vk',
    name: 'ВКонтакте', 
    displayName: 'ВКонтакте',
    icon: 'circle',
    enabled: true,
  }
];
```

---

## 🔐 **OAuth Flow схема**

### 1. **Инициация (Frontend)**
```
User clicks -> SocialLoginButton -> useSocialAuth -> buildAuthUrl -> Popup/Redirect
```

### 2. **OAuth Provider Flow**
```
Google/Yandex/VK -> User Authorization -> Callback URL
```

### 3. **Callback Processing (Frontend)**
```
SocialAuthCallback -> Parse URL -> Validate State -> Exchange Code (Backend) -> Login
```

### 4. **Success Integration**
```
AuthContext -> Update State -> Redirect to Dashboard
```

---

## 🎨 **UI/UX Features**

### **Дизайн кнопок:**
- **Google**: Белая кнопка с Google иконкой
- **Яндекс**: Красная кнопка с брендинговыми цветами  
- **ВКонтакте**: Синяя кнопка в стиле VK

### **States & Animations:**
- Loading spinners во время OAuth
- Disabled states при обработке
- Error states с понятными сообщениями
- Success feedback

### **Responsive Design:**
- Mobile-first подход
- Touch-friendly кнопки
- Adaptive popup sizing

---

## 🛡️ **Безопасность**

### **CSRF Protection:**
- Генерация уникального state parameter
- Проверка state в callback
- Session storage для state validation

### **Popup Security:**
- Origin validation для messages
- Timeout protection (5 минут)
- Auto-close неактивных popup

### **Data Validation:**
- Проверка наличия authorization code
- Validation OAuth errors
- Sanitization user data

---

## 🔧 **Backend Integration**

### **Требуемые API endpoints:**
```
POST /api/auth/social/google    - Обмен Google code на tokens
POST /api/auth/social/yandex    - Обмен Яндекс code на tokens  
POST /api/auth/social/vk        - Обмен VK code на tokens
```

### **Expected Request Format:**
```typescript
{
  code: string,           // OAuth authorization code
  state: string,          // CSRF protection state
  redirectUri: string     // Original redirect URI
}
```

### **Expected Response Format:**
```typescript
{
  success: boolean,
  user?: User,           // User object
  token?: string,        // JWT access token
  refreshToken?: string, // Refresh token
  error?: string         // Error message if failed
}
```

---

## 📱 **Usage Examples**

### **Базовое использование:**
```tsx
import { SocialLoginPanel } from '@/auth';

const LoginPage = () => {
  const handleSocialLogin = async (provider: string) => {
    try {
      await loginWithSocial(provider);
      navigate('/dashboard');
    } catch (error) {
      showError(error.message);
    }
  };

  return (
    <div>
      <h1>Вход в DevAssist Pro</h1>
      <SocialLoginPanel onSocialLogin={handleSocialLogin} />
    </div>
  );
};
```

### **С полной формой:**
```tsx
import { LoginForm } from '@/auth';

const AuthPage = () => {
  return (
    <LoginForm
      onSuccess={() => navigate('/dashboard')}
      onForgotPassword={() => setMode('forgot')}
      onSignUp={() => setMode('register')}
    />
  );
};
```

### **Router setup:**
```tsx
import { SocialAuthCallback } from '@/auth';

<Routes>
  <Route path="/auth/login" element={<LoginPage />} />
  <Route path="/auth/callback/google" element={<SocialAuthCallback />} />
  <Route path="/auth/callback/yandex" element={<SocialAuthCallback />} />
  <Route path="/auth/callback/vk" element={<SocialAuthCallback />} />
</Routes>
```

---

## 🚀 **Production Deployment**

### **Google OAuth Setup:**
1. Google Cloud Console -> APIs & Services -> Credentials
2. Create OAuth 2.0 Client ID  
3. Add authorized redirect URIs:
   - `https://yourdomain.com/auth/callback/google`

### **Яндекс OAuth Setup:**
1. Яндекс для разработчиков -> OAuth
2. Создать приложение
3. Указать Callback URL:
   - `https://yourdomain.com/auth/callback/yandex`

### **VK OAuth Setup:**
1. VK для разработчиков -> Мои приложения
2. Создать Standalone-приложение
3. Настроить Базовые настройки:
   - `https://yourdomain.com/auth/callback/vk`

---

## 📊 **Компоненты готовы:**

| Компонент | Статус | Описание |
|-----------|--------|----------|
| **SocialLoginButton** | ✅ | Индивидуальная кнопка провайдера |
| **SocialLoginPanel** | ✅ | Панель с несколькими провайдерами |
| **LoginForm** | ✅ | Полная форма с social integration |
| **SocialAuthCallback** | ✅ | OAuth callback processor |
| **useSocialAuth** | ✅ | Хук для social authentication |
| **OAuth Configuration** | ✅ | Провайдеры и настройки |
| **Mock Integration** | ✅ | Работающие демо |
| **TypeScript Types** | ✅ | Полная типизация |
| **Documentation** | ✅ | Comprehensive guide |

---

**✅ Social Login система готова к использованию!** 🎉

Все компоненты протестированы и готовы для интеграции с реальными OAuth провайдерами и backend API.