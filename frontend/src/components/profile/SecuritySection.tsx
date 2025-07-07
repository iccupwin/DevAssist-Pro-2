import React, { useState } from 'react';
import { Key, Shield, Smartphone, Globe, Clock, AlertTriangle } from 'lucide-react';
import ProfileSection from './ProfileSection';
import ProfileFormField from './ProfileFormField';

interface ActiveSession {
  id: string;
  device: string;
  browser: string;
  location: string;
  lastActive: string;
  isCurrent: boolean;
  ipAddress?: string;
}

interface SecuritySectionProps {
  sessions: ActiveSession[];
  is2FAEnabled: boolean;
  onPasswordChange: (oldPassword: string, newPassword: string, confirmPassword: string) => Promise<void>;
  on2FAToggle: (enabled: boolean) => Promise<void>;
  onSessionTerminate: (sessionId: string) => Promise<void>;
  className?: string;
}

const SecuritySection: React.FC<SecuritySectionProps> = ({
  sessions,
  is2FAEnabled,
  onPasswordChange,
  on2FAToggle,
  onSessionTerminate,
  className = '',
}) => {
  const [passwordForm, setPasswordForm] = useState({
    current: '',
    new: '',
    confirm: '',
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});

  const validatePasswordForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!passwordForm.current) {
      errors.current = 'Введите текущий пароль';
    }
    
    if (!passwordForm.new) {
      errors.new = 'Введите новый пароль';
    } else if (passwordForm.new.length < 8) {
      errors.new = 'Пароль должен содержать минимум 8 символов';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(passwordForm.new)) {
      errors.new = 'Пароль должен содержать заглавные и строчные буквы, цифры';
    }
    
    if (!passwordForm.confirm) {
      errors.confirm = 'Подтвердите новый пароль';
    } else if (passwordForm.new !== passwordForm.confirm) {
      errors.confirm = 'Пароли не совпадают';
    }

    setPasswordErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handlePasswordSubmit = async () => {
    if (!validatePasswordForm()) return;
    
    setIsChangingPassword(true);
    try {
      await onPasswordChange(passwordForm.current, passwordForm.new, passwordForm.confirm);
      setPasswordForm({ current: '', new: '', confirm: '' });
      setPasswordErrors({});
    } catch (error) {
      setPasswordErrors({
        current: error instanceof Error ? error.message : 'Ошибка смены пароля'
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleSessionTerminate = async (sessionId: string) => {
    if (window.confirm('Вы уверены, что хотите завершить эту сессию?')) {
      await onSessionTerminate(sessionId);
    }
  };

  const getDeviceIcon = (device: string): React.ReactNode => {
    if (device.toLowerCase().includes('mobile') || device.toLowerCase().includes('iphone')) {
      return <Smartphone className="w-5 h-5 text-gray-600" />;
    }
    return <Globe className="w-5 h-5 text-gray-600" />;
  };

  const formatLastActive = (lastActive: string): string => {
    const date = new Date(lastActive);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return 'Меньше часа назад';
    if (diffHours < 24) return `${diffHours} ч. назад`;
    if (diffDays < 7) return `${diffDays} дн. назад`;
    return date.toLocaleDateString('ru-RU');
  };

  return (
    <div className={`space-y-8 ${className}`}>
      {/* Смена пароля */}
      <ProfileSection
        title="Смена пароля"
        icon={Key}
        iconColor="text-red-600"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl">
          <div className="md:col-span-2">
            <ProfileFormField
              label="Текущий пароль"
              value={passwordForm.current}
              onChange={(value) => setPasswordForm(prev => ({ ...prev, current: value }))}
              type="password"
              error={passwordErrors.current}
              required
            />
          </div>
          
          <ProfileFormField
            label="Новый пароль"
            value={passwordForm.new}
            onChange={(value) => setPasswordForm(prev => ({ ...prev, new: value }))}
            type="password"
            error={passwordErrors.new}
            required
          />
          
          <ProfileFormField
            label="Подтвердите новый пароль"
            value={passwordForm.confirm}
            onChange={(value) => setPasswordForm(prev => ({ ...prev, confirm: value }))}
            type="password"
            error={passwordErrors.confirm}
            required
          />
          
          <div className="md:col-span-2">
            <button
              onClick={handlePasswordSubmit}
              disabled={isChangingPassword}
              className="px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center"
            >
              {isChangingPassword ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              ) : (
                <Key className="w-4 h-4 mr-2" />
              )}
              {isChangingPassword ? 'Изменение...' : 'Изменить пароль'}
            </button>
          </div>
        </div>
      </ProfileSection>

      {/* Двухфакторная аутентификация */}
      <ProfileSection
        title="Двухфакторная аутентификация"
        icon={Shield}
        iconColor="text-green-600"
        actions={
          <span className={`
            px-3 py-1 text-sm font-medium rounded-full
            ${is2FAEnabled 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
            }
          `}>
            {is2FAEnabled ? 'Включена' : 'Отключена'}
          </span>
        }
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Двухфакторная аутентификация добавляет дополнительный уровень защиты для вашей учетной записи. 
            При входе вам потребуется ввести код из мобильного приложения.
          </p>
          
          {!is2FAEnabled && (
            <div className="flex items-start space-x-3 p-4 bg-amber-50 rounded-xl">
              <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-amber-800">Рекомендуется включить 2FA</h4>
                <p className="text-sm text-amber-700 mt-1">
                  Это значительно повысит безопасность вашего аккаунта
                </p>
              </div>
            </div>
          )}
          
          <button
            onClick={() => on2FAToggle(!is2FAEnabled)}
            className={`
              px-6 py-3 rounded-xl transition-colors flex items-center
              ${is2FAEnabled 
                ? 'bg-red-600 hover:bg-red-700 text-white' 
                : 'bg-green-600 hover:bg-green-700 text-white'
              }
            `}
          >
            <Shield className="w-4 h-4 mr-2" />
            {is2FAEnabled ? 'Отключить 2FA' : 'Включить 2FA'}
          </button>
        </div>
      </ProfileSection>

      {/* Активные сессии */}
      <ProfileSection
        title="Активные сессии"
        icon={Clock}
        iconColor="text-blue-600"
        actions={
          <span className="text-sm text-gray-600">
            Всего сессий: {sessions.length}
          </span>
        }
      >
        <div className="space-y-4">
          <p className="text-gray-600 mb-4">
            Список всех устройств, с которых был выполнен вход в вашу учетную запись
          </p>
          
          {sessions.map((session) => (
            <div
              key={session.id}
              className="flex items-center justify-between p-4 bg-white/60 rounded-xl"
            >
              <div className="flex items-start space-x-4">
                <div className="mt-1">
                  {getDeviceIcon(session.device)}
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 flex items-center">
                    {session.browser} на {session.device}
                    {session.isCurrent && (
                      <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                        Текущая
                      </span>
                    )}
                  </h4>
                  <p className="text-sm text-gray-600">{session.location}</p>
                  <p className="text-xs text-gray-500">
                    Последняя активность: {formatLastActive(session.lastActive)}
                  </p>
                  {session.ipAddress && (
                    <p className="text-xs text-gray-400">IP: {session.ipAddress}</p>
                  )}
                </div>
              </div>
              
              {!session.isCurrent && (
                <button
                  onClick={() => handleSessionTerminate(session.id)}
                  className="px-3 py-1 bg-red-100 text-red-800 text-sm font-medium rounded-full hover:bg-red-200 transition-colors"
                >
                  Завершить
                </button>
              )}
            </div>
          ))}
        </div>
      </ProfileSection>
    </div>
  );
};

export default SecuritySection;