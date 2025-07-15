# Промт для создания админ панели DevAssist Pro

Ты работаешь над проектом DevAssist Pro - AI-powered веб-порталом для автоматизации работы девелоперов недвижимости.

Мне нужно создать **Админ панель** для управления системой и пользователями.

## Макет Админ панели:

```
┌─────────────────────────────────────────────┐
│ 👑 DevAssist Pro Admin | [Admin Profile] ▼ │
├─────────────────────────────────────────────┤
│ 📊 Dashboard │ 👥 Users │ 🤖 AI │ ⚙️ System │
├─────────────────────────────────────────────┤
│                                             │
│ 📈 System Overview                          │
│ ┌─────────┐ ┌─────────┐ ┌─────────┐         │
│ │ Users   │ │API Calls│ │AI Costs │         │
│ │  1,247  │ │ 45,891  │ │ $247.82 │         │
│ │ +12 24h │ │ +234 1h │ │ +$12 24h│         │
│ └─────────┘ └─────────┘ └─────────┘         │
│                                             │
│ ┌─────────┐ ┌─────────┐ ┌─────────┐         │
│ │Analyses │ │ Errors  │ │Uptime   │         │
│ │  3,421  │ │   12    │ │ 99.8%   │         │
│ │ +89 24h │ │  -3 24h │ │ 30 days │         │
│ └─────────┘ └─────────┘ └─────────┘         │
│                                             │
│ 📊 Real-time Charts                         │
│ [API Usage] [User Activity] [AI Models]    │
│                                             │
│ 🚨 Recent Alerts                           │
│ • High API usage detected                   │
│ • OpenAI rate limit approaching             │
│ • New user registrations spike             │
└─────────────────────────────────────────────┘
```

## Основные разделы:

### 1. 📊 Admin Dashboard:
- System overview с ключевыми метриками
- Real-time графики использования
- Alerts и уведомления
- Quick actions кнопки
- Health check всех сервисов

### 2. 👥 User Management:
- Список всех пользователей с поиском/фильтрацией
- User profiles с деталями активности
- Управление ролями: Admin, User, Premium, Banned
- Usage statistics по пользователям
- Bulk operations (export, ban, upgrade)

### 3. 🤖 AI Management:
- Статус AI провайдеров (OpenAI, Anthropic, Google)
- Cost tracking и budget alerts
- Usage limits по пользователям
- Model performance metrics
- Prompt library management
- Rate limiting configuration

### 4. ⚙️ System Settings:
- Global system configuration
- Feature flags management
- Database administration
- Backup/restore operations
- Security settings
- Integration management

## Детальная функциональность:

### User Management раздел:
```
┌─────────────────────────────────────────────┐
│ 👥 User Management                          │
│ [Search users...] [+ Add User] [📊 Export] │
├─────────────────────────────────────────────┤
│ │ User │ Email │ Role │ Status │ Actions │    │
│ │ John │john@..│Admin │ Active │ [👁][✏][🚫] │
│ │ Jane │jane@..│ User │Premium │ [👁][✏][⬆] │
│ │ Mike │mike@..│ User │Banned  │ [👁][✏][✅] │
├─────────────────────────────────────────────┤
│ [◀ Previous] Page 1 of 45 [Next ▶]         │
└─────────────────────────────────────────────┘
```

### AI Management раздел:
```
┌─────────────────────────────────────────────┐
│ 🤖 AI Models & Usage                        │
├─────────────────────────────────────────────┤
│ Provider Status:                            │
│ OpenAI    ✅ Active   | Usage: 85% | $124   │
│ Anthropic ✅ Active   | Usage: 67% | $89    │
│ Google    ⚠️ Limited  | Usage: 45% | $34    │
│                                             │
│ Model Performance:                          │
│ ┌─────────────────┐ ┌─────────────────┐     │
│ │ Success Rate    │ │ Avg Response    │     │
│ │     97.3%       │ │    2.4s        │     │
│ └─────────────────┘ └─────────────────┘     │
│                                             │
│ [⚙️ Configure] [📊 Analytics] [💰 Billing] │
└─────────────────────────────────────────────┘
```

## Технические требования:

### Frontend (React + TypeScript):
- Protected admin routes (role-based access)
- Real-time dashboard с WebSocket updates
- Charts и graphs (Recharts/Chart.js)
- Data tables с поиском/фильтрацией/пагинацией
- Form management для настроек
- Bulk operations UI
- Export functionality
- Mobile-responsive admin interface

### Backend интеграция:
- Admin API endpoints:
  - GET /admin/dashboard/stats
  - GET /admin/users + pagination/search
  - PUT /admin/users/{id}/role
  - GET /admin/ai/status
  - GET /admin/system/health
  - POST /admin/system/backup
- Role-based permissions middleware
- Activity logging для admin actions
- Real-time metrics через WebSocket

### Security & Permissions:
- Admin role verification
- Activity audit logging
- Secure admin session management
- Two-factor authentication для админов
- IP whitelist для admin access
- Sensitive data masking

### UI/UX особенности:
- Dark admin theme по умолчанию
- Профессиональный dashboard дизайн
- Quick actions и shortcuts
- Contextual help tooltips
- Confirmation modals для критических действий
- Breadcrumb navigation
- Advanced search и filtering

### Monitoring & Analytics:
- Real-time system metrics
- User behavior analytics
- Cost tracking dashboards
- Performance monitoring
- Error tracking и alerting
- Usage trend analysis

Создай полную админ панель с современным интерфейсом, comprehensive functionality и proper security measures.