// Экспорт всех компонентов профиля
export { default as UserAvatar } from './UserAvatar';
export { default as ProfileFormField } from './ProfileFormField';
export { default as SettingsToggle } from './SettingsToggle';
export { default as ProfileSection } from './ProfileSection';
export { default as ProfileStats } from './ProfileStats';
export { default as SecuritySection } from './SecuritySection';
export { default as BillingSection } from './BillingSection';

// Типы для использования в других компонентах
export interface UserProfile {
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

export interface UserSettings {
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
    marketing: boolean;
    analysisComplete: boolean;
    reportGenerated: boolean;
    systemMaintenance: boolean;
  };
  privacy: {
    profileVisible: boolean;
    activityVisible: boolean;
    dataSharing: boolean;
    analyticsTracking: boolean;
  };
  preferences: {
    language: string;
    timezone: string;
    theme: 'light' | 'dark' | 'system';
    defaultModel: string;
    autoSave: boolean;
    compactMode: boolean;
  };
}