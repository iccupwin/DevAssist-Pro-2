# 👤 User Profile Components

Модульные компоненты для управления профилем пользователя в DevAssist Pro.

## 📦 Компоненты

### 🖼️ UserAvatar
Компонент аватара пользователя с возможностью редактирования.

```tsx
import { UserAvatar } from '@/components/profile';

<UserAvatar
  name="Александр Петров"
  avatar="/path/to/avatar.jpg"
  size="xl"
  isEditable={true}
  onAvatarChange={(file) => handleAvatarUpload(file)}
/>
```

**Props:**
- `name` - имя пользователя для инициалов
- `avatar?` - URL аватара
- `size?` - размер ('sm' | 'md' | 'lg' | 'xl')
- `isEditable?` - возможность редактирования
- `onAvatarChange?` - callback при загрузке нового аватара

### 📝 ProfileFormField
Универсальное поле формы профиля с валидацией.

```tsx
import { ProfileFormField } from '@/components/profile';
import { Mail } from 'lucide-react';

<ProfileFormField
  label="Email"
  value={profile.email}
  onChange={(value) => setEmail(value)}
  type="email"
  icon={Mail}
  error={errors.email}
  required
/>
```

**Props:**
- `label` - подпись поля
- `value` - текущее значение
- `onChange` - callback изменения
- `type?` - тип поля
- `icon?` - иконка Lucide
- `disabled?` - блокировка редактирования
- `error?` - текст ошибки
- `required?` - обязательное поле

### 🔘 SettingsToggle
Переключатель для настроек с описанием.

```tsx
import { SettingsToggle } from '@/components/profile';

<SettingsToggle
  title="Email уведомления"
  description="Получать уведомления на электронную почту"
  checked={settings.notifications.email}
  onChange={(checked) => updateSetting('email', checked)}
  color="blue"
/>
```

**Props:**
- `title` - заголовок настройки
- `description` - описание
- `checked` - состояние переключателя
- `onChange` - callback изменения
- `color?` - цветовая схема

### 📋 ProfileSection
Контейнер секции профиля с заголовком и действиями.

```tsx
import { ProfileSection } from '@/components/profile';
import { User } from 'lucide-react';

<ProfileSection
  title="Личная информация"
  icon={User}
  iconColor="text-blue-600"
  actions={<EditButton />}
>
  {/* Содержимое секции */}
</ProfileSection>
```

### 📊 ProfileStats
Компонент статистики с трендами и иконками.

```tsx
import { ProfileStats } from '@/components/profile';
import { Zap, Users } from 'lucide-react';

const stats = [
  {
    title: 'Анализов выполнено',
    value: 142,
    subtitle: 'В этом месяце',
    icon: Zap,
    color: 'blue',
    trend: { value: 12, isPositive: true }
  },
  // ...
];

<ProfileStats stats={stats} />
```

### 🔐 SecuritySection
Комплексная секция безопасности с управлением паролем, 2FA и сессиями.

```tsx
import { SecuritySection } from '@/components/profile';

<SecuritySection
  sessions={activeSessions}
  is2FAEnabled={user.is2FAEnabled}
  onPasswordChange={handlePasswordChange}
  on2FAToggle={handle2FAToggle}
  onSessionTerminate={handleSessionTerminate}
/>
```

### 💳 BillingSection
Секция тарифного плана и платежей.

```tsx
import { BillingSection } from '@/components/profile';

<BillingSection
  currentPlan={subscription}
  paymentHistory={payments}
  onPlanChange={handlePlanChange}
  onDownloadInvoice={handleInvoiceDownload}
  onExportData={handleDataExport}
  onImportData={handleDataImport}
/>
```

## 🎨 Дизайн система

### Цветовая схема
- **Blue** - основная информация, действия
- **Green** - успех, активные состояния
- **Red** - ошибки, опасные действия
- **Purple** - аналитика, статистика
- **Orange** - предупреждения

### Адаптивность
- **Mobile-first** подход
- **Glassmorphism** стиль с backdrop-blur
- **Плавные анимации** и переходы
- **Доступность** (ARIA labels, keyboard navigation)

## 🔧 Интеграция с API

### Структура данных

```typescript
interface UserProfile {
  id: string;
  name: string;
  email: string;
  company: string;
  position: string;
  phone: string;
  location: string;
  avatar: string;
  plan: string;
  joinDate: string;
  lastActive: string;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
}

interface UserSettings {
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
    marketing: boolean;
  };
  privacy: {
    profileVisible: boolean;
    activityVisible: boolean;
    dataSharing: boolean;
  };
  preferences: {
    language: string;
    timezone: string;
    theme: 'light' | 'dark' | 'system';
    defaultModel: string;
  };
}
```

### API методы (требуют backend реализации)

```typescript
// Профиль пользователя
GET /api/user/profile
PUT /api/user/profile
POST /api/user/avatar

// Настройки
GET /api/user/settings
PUT /api/user/settings

// Безопасность
POST /api/user/password
POST /api/user/2fa/enable
DELETE /api/user/2fa/disable
GET /api/user/sessions
DELETE /api/user/sessions/:id

// Тарифы и платежи
GET /api/user/subscription
GET /api/user/payments
POST /api/user/data/export
POST /api/user/data/import
```

## 📱 Использование

### Базовое использование

```tsx
import { 
  UserAvatar, 
  ProfileFormField, 
  ProfileSection,
  UserProfile,
  UserSettings 
} from '@/components/profile';

const ProfilePage = () => {
  const [profile, setProfile] = useState<UserProfile>({...});
  const [settings, setSettings] = useState<UserSettings>({...});
  
  return (
    <div className="space-y-8">
      <ProfileSection title="Профиль" icon={User}>
        <UserAvatar
          name={profile.name}
          avatar={profile.avatar}
          size="xl"
          isEditable={true}
          onAvatarChange={handleAvatarChange}
        />
        
        <ProfileFormField
          label="Имя"
          value={profile.name}
          onChange={(value) => updateProfile('name', value)}
          icon={User}
          required
        />
      </ProfileSection>
    </div>
  );
};
```

### Валидация

```tsx
const [errors, setErrors] = useState<Record<string, string>>({});

const validateProfile = (profile: UserProfile): Record<string, string> => {
  const errors: Record<string, string> = {};
  
  if (!profile.name.trim()) {
    errors.name = 'Имя обязательно';
  }
  
  if (!profile.email.includes('@')) {
    errors.email = 'Некорректный email';
  }
  
  return errors;
};
```

## 🎯 Backend Requirements

⚠️ **Следующие API эндпоинты должны быть реализованы в backend:**

1. **User Profile Management**
   - `GET /api/user/profile` - получение профиля
   - `PUT /api/user/profile` - обновление профиля
   - `POST /api/user/avatar` - загрузка аватара

2. **Settings Management**
   - `GET /api/user/settings` - получение настроек
   - `PUT /api/user/settings` - обновление настроек

3. **Security Management**
   - `POST /api/user/password` - смена пароля
   - `POST /api/user/2fa/enable` - включение 2FA
   - `GET /api/user/sessions` - активные сессии
   - `DELETE /api/user/sessions/:id` - завершение сессии

4. **Subscription & Billing**
   - `GET /api/user/subscription` - текущий план
   - `GET /api/user/payments` - история платежей
   - `POST /api/user/data/export` - экспорт данных

---

**✅ User Profile компоненты готовы к использованию!** 🎉