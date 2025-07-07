import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  User, 
  ArrowLeft,
  Settings,
  Shield,
  CreditCard,
  Zap,
  Users,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import {
  UserAvatar,
  ProfileFormField,
  SettingsToggle,
  ProfileSection,
  ProfileStats,
  SecuritySection,
  BillingSection,
  UserProfile as IUserProfile,
  UserSettings as IUserSettings
} from '../components/profile';

// Типы теперь импортируются из компонентов профиля
// UserProfile и UserSettings определены в src/components/profile/index.ts

const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'profile' | 'settings' | 'security' | 'billing'>('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  const [profile, setProfile] = useState<IUserProfile>({
    name: 'Александр Петров',
    email: 'aleksandr.petrov@devcompany.ru',
    company: 'DevCompany',
    position: 'Руководитель проектов',
    phone: '+7 (495) 123-45-67',
    location: 'Москва, Россия',
    avatar: '',
    plan: 'Professional',
    joinDate: '2024-01-15',
    id: 'user-123',
    lastActive: new Date().toISOString(),
    isEmailVerified: true,
    isPhoneVerified: false
  });

  const [settings, setSettings] = useState<IUserSettings>({
    notifications: {
      email: true,
      push: true,
      sms: false,
      marketing: false,
      analysisComplete: true,
      reportGenerated: true,
      systemMaintenance: false
    },
    privacy: {
      profileVisible: true,
      activityVisible: false,
      dataSharing: true,
      analyticsTracking: true
    },
    preferences: {
      language: 'ru',
      timezone: 'Europe/Moscow',
      theme: 'system',
      defaultModel: 'claude-3-5-sonnet-20240620',
      autoSave: true,
      compactMode: false
    }
  });

  const handleProfileUpdate = (field: keyof IUserProfile, value: string) => {
    setProfile(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSettingsUpdate = (category: keyof IUserSettings, field: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [field]: value
      }
    }));
  };

  const handleSave = async () => {
    setSaveStatus('saving');
    try {
      // Имитируем сохранение
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSaveStatus('saved');
      setIsEditing(false);
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error) {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  const handleAvatarUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      setProfile(prev => ({
        ...prev,
        avatar: e.target?.result as string
      }));
    };
    reader.readAsDataURL(file);
  };

  // Обработчики для новых компонентов безопасности
  const handlePasswordChange = async (oldPassword: string, newPassword: string, confirmPassword: string) => {
    // Имитация API вызова
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('Password changed:', { oldPassword, newPassword, confirmPassword });
  };

  const handle2FAToggle = async (enabled: boolean) => {
    // Имитация API вызова
    await new Promise(resolve => setTimeout(resolve, 500));
    console.log('2FA toggled:', enabled);
  };

  const handleSessionTerminate = async (sessionId: string) => {
    // Имитация API вызова
    await new Promise(resolve => setTimeout(resolve, 500));
    console.log('Session terminated:', sessionId);
    // Удаляем сессию из мокового массива
    setMockSessions(prev => prev.filter(s => s.id !== sessionId));
  };

  // Обработчики для биллинга
  const handlePlanChange = () => {
    console.log('Plan change requested');
    // Здесь будет логика смены плана
  };

  const handleDownloadInvoice = (paymentId: string) => {
    console.log('Download invoice:', paymentId);
    // Здесь будет логика скачивания счета
  };

  const handleExportData = () => {
    console.log('Export data requested');
    // Здесь будет логика экспорта данных
  };

  const handleImportData = () => {
    console.log('Import data requested');
    // Здесь будет логика импорта данных
  };

  // Моковые данные для активных сессий
  const [mockSessions, setMockSessions] = useState([
    {
      id: 'session-1',
      device: 'Windows Desktop',
      browser: 'Chrome 122',
      location: 'Москва, Россия',
      lastActive: new Date().toISOString(),
      isCurrent: true,
      ipAddress: '192.168.1.1'
    },
    {
      id: 'session-2',
      device: 'iPhone 15',
      browser: 'Safari',
      location: 'Москва, Россия',
      lastActive: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      isCurrent: false,
      ipAddress: '10.0.1.15'
    }
  ]);

  // Моковые данные для подписки
  const mockSubscription = {
    name: 'Professional',
    price: 2999,
    currency: 'rub',
    interval: 'month' as const,
    features: [
      'Безлимитные анализы КП',
      'Доступ ко всем AI моделям',
      'Приоритетная поддержка',
      'Экспорт в разных форматах',
      'API доступ',
      'Командная работа'
    ],
    limits: {
      analysisPerMonth: 100,
      modelsAccess: ['Claude', 'GPT-4', 'Gemini'],
      supportLevel: 'Приоритетная',
      storageGB: 50
    },
    usage: {
      analysisUsed: 23,
      storageUsed: 12
    }
  };

  // Моковые данные для истории платежей
  const mockPaymentHistory = [
    {
      id: 'payment-1',
      date: '2024-07-01',
      amount: 2999,
      currency: 'rub',
      description: 'Подписка Professional - Июль 2024',
      status: 'paid' as const,
      invoiceUrl: '/invoices/payment-1.pdf'
    },
    {
      id: 'payment-2',
      date: '2024-06-01',
      amount: 2999,
      currency: 'rub',
      description: 'Подписка Professional - Июнь 2024',
      status: 'paid' as const,
      invoiceUrl: '/invoices/payment-2.pdf'
    }
  ];

  const tabs = [
    { id: 'profile', label: 'Профиль', icon: <User className="w-4 h-4" /> },
    { id: 'settings', label: 'Настройки', icon: <Settings className="w-4 h-4" /> },
    { id: 'security', label: 'Безопасность', icon: <Shield className="w-4 h-4" /> },
    { id: 'billing', label: 'Тарифы', icon: <CreditCard className="w-4 h-4" /> }
  ];

  const renderProfileTab = () => {
    // Статистика пользователя для отображения
    const userStats = [
      {
        title: 'Анализов выполнено',
        value: 142,
        subtitle: 'В этом месяце',
        icon: Zap,
        color: 'blue' as const,
        trend: { value: 12, isPositive: true }
      },
      {
        title: 'Успешных проектов',
        value: 23,
        subtitle: 'За всё время',
        icon: CheckCircle,
        color: 'green' as const,
        trend: { value: 8, isPositive: true }
      },
      {
        title: 'Команды',
        value: 5,
        subtitle: 'Активных участников',
        icon: Users,
        color: 'purple' as const
      }
    ];

    return (
      <div className="space-y-8">
        {/* Статистика пользователя */}
        <ProfileStats stats={userStats} />

        {/* Аватар и основная информация */}
        <ProfileSection
          title="Личная информация"
          icon={User}
          iconColor="text-blue-600"
          actions={
            !isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
              >
                Редактировать
              </button>
            ) : (
              <div className="flex space-x-3">
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition-colors"
                >
                  Отмена
                </button>
                <button
                  onClick={handleSave}
                  disabled={saveStatus === 'saving'}
                  className="px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center"
                >
                  {saveStatus === 'saving' && (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  )}
                  Сохранить
                </button>
              </div>
            )
          }
        >
          <div className="space-y-6">
            {/* Аватар */}
            <div className="flex items-center space-x-6">
              <UserAvatar
                name={profile.name}
                avatar={profile.avatar}
                size="xl"
                isEditable={isEditing}
                onAvatarChange={handleAvatarUpload}
              />
              
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{profile.name}</h2>
                <p className="text-gray-600">{profile.position}</p>
                <p className="text-sm text-gray-500">{profile.company}</p>
                <div className="flex items-center mt-2">
                  <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
                    {profile.plan}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Поля формы */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ProfileFormField
                label="Полное имя"
                value={profile.name}
                onChange={(value) => handleProfileUpdate('name', value)}
                icon={User}
                disabled={!isEditing}
                required
              />
              
              <ProfileFormField
                label="Email"
                value={profile.email}
                onChange={(value) => handleProfileUpdate('email', value)}
                type="email"
                disabled={!isEditing}
                required
              />
              
              <ProfileFormField
                label="Компания"
                value={profile.company}
                onChange={(value) => handleProfileUpdate('company', value)}
                disabled={!isEditing}
              />
              
              <ProfileFormField
                label="Должность"
                value={profile.position}
                onChange={(value) => handleProfileUpdate('position', value)}
                disabled={!isEditing}
              />
              
              <ProfileFormField
                label="Телефон"
                value={profile.phone}
                onChange={(value) => handleProfileUpdate('phone', value)}
                type="tel"
                disabled={!isEditing}
              />
              
              <ProfileFormField
                label="Местоположение"
                value={profile.location}
                onChange={(value) => handleProfileUpdate('location', value)}
                disabled={!isEditing}
              />
            </div>
          </div>
        </ProfileSection>

        {/* Статус сохранения */}
        {saveStatus !== 'idle' && (
          <div className={`p-4 rounded-xl flex items-center ${
            saveStatus === 'saved' ? 'bg-green-50 text-green-800' :
            saveStatus === 'error' ? 'bg-red-50 text-red-800' :
            'bg-blue-50 text-blue-800'
          }`}>
            {saveStatus === 'saved' && <CheckCircle className="w-5 h-5 mr-2" />}
            {saveStatus === 'error' && <AlertCircle className="w-5 h-5 mr-2" />}
            {saveStatus === 'saving' && <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-2" />}
            {saveStatus === 'saved' && 'Профиль успешно сохранен'}
            {saveStatus === 'error' && 'Ошибка при сохранении профиля'}
            {saveStatus === 'saving' && 'Сохранение...'}
          </div>
        )}
      </div>
    );
  };

  const renderSettingsTab = () => {
    const getNotificationTitle = (key: string) => {
      switch (key) {
        case 'email': return 'Email уведомления';
        case 'push': return 'Push уведомления';
        case 'sms': return 'SMS уведомления';
        case 'marketing': return 'Маркетинговые рассылки';
        case 'analysisComplete': return 'Завершение анализа';
        case 'reportGenerated': return 'Готовность отчета';
        case 'systemMaintenance': return 'Системные обслуживания';
        default: return key;
      }
    };

    const getNotificationDescription = (key: string) => {
      switch (key) {
        case 'email': return 'Получать уведомления на электронную почту';
        case 'push': return 'Получать push-уведомления в браузере';
        case 'sms': return 'Получать SMS на мобильный телефон';
        case 'marketing': return 'Получать информацию о новых функциях';
        case 'analysisComplete': return 'Уведомления о завершении анализа КП';
        case 'reportGenerated': return 'Уведомления о готовности отчетов';
        case 'systemMaintenance': return 'Уведомления о плановых работах';
        default: return '';
      }
    };

    const getPrivacyTitle = (key: string) => {
      switch (key) {
        case 'profileVisible': return 'Видимость профиля';
        case 'activityVisible': return 'Показывать активность';
        case 'dataSharing': return 'Обмен данными';
        case 'analyticsTracking': return 'Аналитика использования';
        default: return key;
      }
    };

    const getPrivacyDescription = (key: string) => {
      switch (key) {
        case 'profileVisible': return 'Позволить другим пользователям видеть ваш профиль';
        case 'activityVisible': return 'Показывать вашу активность в системе';
        case 'dataSharing': return 'Разрешить использование данных для улучшения сервиса';
        case 'analyticsTracking': return 'Собирать аналитику для улучшения UX';
        default: return '';
      }
    };

    return (
      <div className="space-y-8">
        {/* Уведомления */}
        <ProfileSection title="Уведомления" icon={Settings} iconColor="text-blue-600">
          <div className="space-y-4">
            {Object.entries(settings.notifications).map(([key, value]) => (
              <SettingsToggle
                key={key}
                title={getNotificationTitle(key)}
                description={getNotificationDescription(key)}
                checked={value}
                onChange={(checked) => handleSettingsUpdate('notifications', key, checked)}
                color="blue"
              />
            ))}
          </div>
        </ProfileSection>

        {/* Приватность */}
        <ProfileSection title="Приватность" icon={Shield} iconColor="text-green-600">
          <div className="space-y-4">
            {Object.entries(settings.privacy).map(([key, value]) => (
              <SettingsToggle
                key={key}
                title={getPrivacyTitle(key)}
                description={getPrivacyDescription(key)}
                checked={value}
                onChange={(checked) => handleSettingsUpdate('privacy', key, checked)}
                color="green"
              />
            ))}
          </div>
        </ProfileSection>

        {/* Предпочтения */}
        <ProfileSection title="Предпочтения" icon={Settings} iconColor="text-purple-600">
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Язык</label>
                <select
                  value={settings.preferences.language}
                  onChange={(e) => handleSettingsUpdate('preferences', 'language', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="ru">Русский</option>
                  <option value="en">English</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Часовой пояс</label>
                <select
                  value={settings.preferences.timezone}
                  onChange={(e) => handleSettingsUpdate('preferences', 'timezone', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="Europe/Moscow">Москва (UTC+3)</option>
                  <option value="Europe/Kiev">Киев (UTC+2)</option>
                  <option value="Asia/Almaty">Алматы (UTC+6)</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Тема</label>
                <select
                  value={settings.preferences.theme}
                  onChange={(e) => handleSettingsUpdate('preferences', 'theme', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="light">Светлая</option>
                  <option value="dark">Темная</option>
                  <option value="system">Системная</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">AI модель по умолчанию</label>
                <select
                  value={settings.preferences.defaultModel}
                  onChange={(e) => handleSettingsUpdate('preferences', 'defaultModel', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="claude-3-5-sonnet-20240620">Claude 3.5 Sonnet</option>
                  <option value="gpt-4o">GPT-4o</option>
                  <option value="gpt-4">GPT-4</option>
                </select>
              </div>
            </div>
            
            {/* Дополнительные настройки */}
            <div className="space-y-4">
              <SettingsToggle
                title="Автосохранение"
                description="Автоматически сохранять изменения в формах"
                checked={settings.preferences.autoSave}
                onChange={(checked) => handleSettingsUpdate('preferences', 'autoSave', checked)}
                color="purple"
              />
              
              <SettingsToggle
                title="Компактный режим"
                description="Уменьшить отступы и размеры элементов интерфейса"
                checked={settings.preferences.compactMode}
                onChange={(checked) => handleSettingsUpdate('preferences', 'compactMode', checked)}
                color="purple"
              />
            </div>
          </div>
        </ProfileSection>
      </div>
    );
  };

  const renderSecurityTab = () => (
    <SecuritySection
      sessions={mockSessions}
      is2FAEnabled={false}
      onPasswordChange={handlePasswordChange}
      on2FAToggle={handle2FAToggle}
      onSessionTerminate={handleSessionTerminate}
    />
  );

  const renderBillingTab = () => (
    <BillingSection
      currentPlan={mockSubscription}
      paymentHistory={mockPaymentHistory}
      onPlanChange={handlePlanChange}
      onDownloadInvoice={handleDownloadInvoice}
      onExportData={handleExportData}
      onImportData={handleImportData}
    />
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-white/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <button
              onClick={() => navigate('/')}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              <span className="text-sm font-medium">Dashboard</span>
            </button>
            
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">Профиль и настройки</h1>
                <div className="text-sm text-gray-500">Управление учетной записью</div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <div className="lg:w-64">
            <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-white/20 p-4 sticky top-24">
              <nav className="space-y-2">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-left transition-all duration-200 ${
                      activeTab === tab.id
                        ? 'bg-blue-100 text-blue-700 shadow-sm ring-1 ring-blue-200'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    {tab.icon}
                    <span className="font-medium">{tab.label}</span>
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1">
            {activeTab === 'profile' && renderProfileTab()}
            {activeTab === 'settings' && renderSettingsTab()}
            {activeTab === 'security' && renderSecurityTab()}
            {activeTab === 'billing' && renderBillingTab()}
          </div>
        </div>
      </main>
    </div>
  );
};

export default ProfilePage;