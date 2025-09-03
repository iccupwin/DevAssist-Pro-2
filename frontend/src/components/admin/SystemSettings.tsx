/**
 * SystemSettings - Системные настройки в админ панели
 * Согласно ТЗ DevAssist Pro
 */

import React, { useState } from 'react';
import {
  Settings,
  Globe,
  Shield,
  Save,
  RefreshCw,
  CheckCircle,
  XCircle,
  HardDrive,
  FileText
} from 'lucide-react';
import { SystemSettings as SystemSettingsType } from '../../types/admin';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

interface SystemSettingsProps {
  className?: string;
}

// Mock данные настроек
const mockSettings: SystemSettingsType = {
  general: {
    siteName: 'DevAssist Pro',
    siteUrl: 'https://devassist.pro',
    supportEmail: 'support@devassist.pro',
    maintenanceMode: false,
    registrationEnabled: true,
    emailVerificationRequired: true
  },
  ai: {
    defaultModel: 'claude-3-5-sonnet',
    maxTokensPerRequest: 4000,
    maxRequestsPerUser: 100,
    costAlertThreshold: 80,
    providerPriority: ['openai', 'anthropic', 'google']
  },
  security: {
    sessionTimeout: 3600,
    maxLoginAttempts: 5,
    requireTwoFactor: false,
    allowedIPs: [],
    passwordMinLength: 8
  },
  features: {
    kpAnalyzer: true,
    documentUpload: true,
    realTimeUpdates: true,
    analytics: true,
    export: true
  },
  limits: {
    maxFileSize: 10,
    maxFilesPerUser: 50,
    maxAnalysesPerDay: 20,
    storageQuota: 1000
  }
};

export const SystemSettings: React.FC<SystemSettingsProps> = ({
  className = ''
}) => {
  const [settings, setSettings] = useState<SystemSettingsType>(mockSettings);
  const [activeSection, setActiveSection] = useState<'general' | 'ai' | 'security' | 'features' | 'limits'>('general');
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleSave = async () => {
    setIsSaving(true);
    setSaveStatus('idle');
    
    try {
      // Will be replaced with actual API call to backend settings service
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error) {
      setSaveStatus('error');
      // Failed to save settings
    } finally {
      setIsSaving(false);
    }
  };

  const sections = [
    { id: 'general' as const, name: 'General', icon: Globe, description: 'Basic site configuration' },
    { id: 'ai' as const, name: 'AI Models', icon: Zap, description: 'AI provider settings' },
    { id: 'security' as const, name: 'Security', icon: Shield, description: 'Security and authentication' },
    { id: 'features' as const, name: 'Features', icon: FileText, description: 'Feature toggles' },
    { id: 'limits' as const, name: 'Limits', icon: HardDrive, description: 'Usage limits and quotas' }
  ];

  const SettingCard: React.FC<{
    title: string;
    description?: string;
    children: React.ReactNode;
  }> = ({ title, description, children }) => (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        {description && (
          <p className="text-sm text-gray-400 mt-1">{description}</p>
        )}
      </div>
      {children}
    </div>
  );

  const Toggle: React.FC<{
    label: string;
    description?: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
  }> = ({ label, description, checked, onChange }) => (
    <div className="flex items-start justify-between py-3">
      <div className="flex-1">
        <label className="text-sm font-medium text-white">{label}</label>
        {description && (
          <p className="text-xs text-gray-400 mt-1">{description}</p>
        )}
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          checked ? 'bg-blue-600' : 'bg-gray-600'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );

  const renderGeneralSettings = () => (
    <div className="space-y-6">
      <SettingCard title="Site Configuration" description="Basic site information and settings">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Site Name</label>
            <Input
              value={settings.general.siteName}
              onChange={(e) => setSettings(prev => ({
                ...prev,
                general: { ...prev.general, siteName: e.target.value }
              }))}
              className="bg-gray-900 border-gray-600"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Site URL</label>
            <Input
              value={settings.general.siteUrl}
              onChange={(e) => setSettings(prev => ({
                ...prev,
                general: { ...prev.general, siteUrl: e.target.value }
              }))}
              className="bg-gray-900 border-gray-600"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Support Email</label>
            <Input
              type="email"
              value={settings.general.supportEmail}
              onChange={(e) => setSettings(prev => ({
                ...prev,
                general: { ...prev.general, supportEmail: e.target.value }
              }))}
              className="bg-gray-900 border-gray-600"
            />
          </div>
        </div>
      </SettingCard>

      <SettingCard title="Registration & Access" description="Control user registration and access">
        <div className="space-y-2">
          <Toggle
            label="Maintenance Mode"
            description="Temporarily disable access to the site"
            checked={settings.general.maintenanceMode}
            onChange={(checked) => setSettings(prev => ({
              ...prev,
              general: { ...prev.general, maintenanceMode: checked }
            }))}
          />
          
          <Toggle
            label="User Registration"
            description="Allow new users to register accounts"
            checked={settings.general.registrationEnabled}
            onChange={(checked) => setSettings(prev => ({
              ...prev,
              general: { ...prev.general, registrationEnabled: checked }
            }))}
          />
          
          <Toggle
            label="Email Verification Required"
            description="Require email verification for new accounts"
            checked={settings.general.emailVerificationRequired}
            onChange={(checked) => setSettings(prev => ({
              ...prev,
              general: { ...prev.general, emailVerificationRequired: checked }
            }))}
          />
        </div>
      </SettingCard>
    </div>
  );

  const renderAISettings = () => (
    <div className="space-y-6">
      <SettingCard title="AI Model Configuration" description="Default AI model and usage settings">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Default Model</label>
            <select
              value={settings.ai.defaultModel}
              onChange={(e) => setSettings(prev => ({
                ...prev,
                ai: { ...prev.ai, defaultModel: e.target.value }
              }))}
              className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-white"
            >
              <option value="claude-3-5-sonnet">Claude 3.5 Sonnet</option>
              <option value="gpt-4o">GPT-4o</option>
              <option value="gpt-4-turbo">GPT-4 Turbo</option>
              <option value="gemini-pro">Gemini Pro</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Max Tokens per Request</label>
            <Input
              type="number"
              value={settings.ai.maxTokensPerRequest}
              onChange={(e) => setSettings(prev => ({
                ...prev,
                ai: { ...prev.ai, maxTokensPerRequest: parseInt(e.target.value) }
              }))}
              className="bg-gray-900 border-gray-600"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Max Requests per User (daily)</label>
            <Input
              type="number"
              value={settings.ai.maxRequestsPerUser}
              onChange={(e) => setSettings(prev => ({
                ...prev,
                ai: { ...prev.ai, maxRequestsPerUser: parseInt(e.target.value) }
              }))}
              className="bg-gray-900 border-gray-600"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Cost Alert Threshold (%)</label>
            <Input
              type="number"
              min="0"
              max="100"
              value={settings.ai.costAlertThreshold}
              onChange={(e) => setSettings(prev => ({
                ...prev,
                ai: { ...prev.ai, costAlertThreshold: parseInt(e.target.value) }
              }))}
              className="bg-gray-900 border-gray-600"
            />
          </div>
        </div>
      </SettingCard>
    </div>
  );

  const renderSecuritySettings = () => (
    <div className="space-y-6">
      <SettingCard title="Authentication & Sessions" description="Security and session management">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Session Timeout (seconds)</label>
            <Input
              type="number"
              value={settings.security.sessionTimeout}
              onChange={(e) => setSettings(prev => ({
                ...prev,
                security: { ...prev.security, sessionTimeout: parseInt(e.target.value) }
              }))}
              className="bg-gray-900 border-gray-600"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Max Login Attempts</label>
            <Input
              type="number"
              value={settings.security.maxLoginAttempts}
              onChange={(e) => setSettings(prev => ({
                ...prev,
                security: { ...prev.security, maxLoginAttempts: parseInt(e.target.value) }
              }))}
              className="bg-gray-900 border-gray-600"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Minimum Password Length</label>
            <Input
              type="number"
              min="6"
              max="50"
              value={settings.security.passwordMinLength}
              onChange={(e) => setSettings(prev => ({
                ...prev,
                security: { ...prev.security, passwordMinLength: parseInt(e.target.value) }
              }))}
              className="bg-gray-900 border-gray-600"
            />
          </div>
        </div>
      </SettingCard>

      <SettingCard title="Advanced Security" description="Additional security measures">
        <div className="space-y-2">
          <Toggle
            label="Require Two-Factor Authentication"
            description="Force all users to enable 2FA"
            checked={settings.security.requireTwoFactor}
            onChange={(checked) => setSettings(prev => ({
              ...prev,
              security: { ...prev.security, requireTwoFactor: checked }
            }))}
          />
        </div>
      </SettingCard>
    </div>
  );

  const renderFeatureSettings = () => (
    <div className="space-y-6">
      <SettingCard title="Feature Toggles" description="Enable or disable application features">
        <div className="space-y-2">
          <Toggle
            label="КП Анализатор"
            description="Document analysis and comparison features"
            checked={settings.features.kpAnalyzer}
            onChange={(checked) => setSettings(prev => ({
              ...prev,
              features: { ...prev.features, kpAnalyzer: checked }
            }))}
          />
          
          <Toggle
            label="Document Upload"
            description="Allow users to upload documents"
            checked={settings.features.documentUpload}
            onChange={(checked) => setSettings(prev => ({
              ...prev,
              features: { ...prev.features, documentUpload: checked }
            }))}
          />
          
          <Toggle
            label="Real-time Updates"
            description="Enable WebSocket real-time features"
            checked={settings.features.realTimeUpdates}
            onChange={(checked) => setSettings(prev => ({
              ...prev,
              features: { ...prev.features, realTimeUpdates: checked }
            }))}
          />
          
          <Toggle
            label="Analytics"
            description="Track usage analytics and metrics"
            checked={settings.features.analytics}
            onChange={(checked) => setSettings(prev => ({
              ...prev,
              features: { ...prev.features, analytics: checked }
            }))}
          />
          
          <Toggle
            label="Export Functions"
            description="Allow data export to PDF/Excel"
            checked={settings.features.export}
            onChange={(checked) => setSettings(prev => ({
              ...prev,
              features: { ...prev.features, export: checked }
            }))}
          />
        </div>
      </SettingCard>
    </div>
  );

  const renderLimitSettings = () => (
    <div className="space-y-6">
      <SettingCard title="Usage Limits" description="Control resource usage and quotas">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Max File Size (MB)</label>
            <Input
              type="number"
              value={settings.limits.maxFileSize}
              onChange={(e) => setSettings(prev => ({
                ...prev,
                limits: { ...prev.limits, maxFileSize: parseInt(e.target.value) }
              }))}
              className="bg-gray-900 border-gray-600"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Max Files per User</label>
            <Input
              type="number"
              value={settings.limits.maxFilesPerUser}
              onChange={(e) => setSettings(prev => ({
                ...prev,
                limits: { ...prev.limits, maxFilesPerUser: parseInt(e.target.value) }
              }))}
              className="bg-gray-900 border-gray-600"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Max Analyses per Day</label>
            <Input
              type="number"
              value={settings.limits.maxAnalysesPerDay}
              onChange={(e) => setSettings(prev => ({
                ...prev,
                limits: { ...prev.limits, maxAnalysesPerDay: parseInt(e.target.value) }
              }))}
              className="bg-gray-900 border-gray-600"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Storage Quota per User (MB)</label>
            <Input
              type="number"
              value={settings.limits.storageQuota}
              onChange={(e) => setSettings(prev => ({
                ...prev,
                limits: { ...prev.limits, storageQuota: parseInt(e.target.value) }
              }))}
              className="bg-gray-900 border-gray-600"
            />
          </div>
        </div>
      </SettingCard>
    </div>
  );

  const renderContent = () => {
    switch (activeSection) {
      case 'general': return renderGeneralSettings();
      case 'ai': return renderAISettings();
      case 'security': return renderSecuritySettings();
      case 'features': return renderFeatureSettings();
      case 'limits': return renderLimitSettings();
      default: return renderGeneralSettings();
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center space-x-3">
            <Settings className="h-8 w-8" />
            <span>System Settings</span>
          </h1>
          <p className="text-gray-400 mt-1">
            Configure system behavior and features
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {saveStatus === 'success' && (
            <div className="flex items-center space-x-2 text-green-400">
              <CheckCircle className="h-4 w-4" />
              <span className="text-sm">Settings saved</span>
            </div>
          )}
          
          {saveStatus === 'error' && (
            <div className="flex items-center space-x-2 text-red-400">
              <XCircle className="h-4 w-4" />
              <span className="text-sm">Save failed</span>
            </div>
          )}

          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center space-x-2"
          >
            {isSaving ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
          </Button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar Navigation */}
        <div className="lg:w-64 bg-gray-800 border border-gray-700 rounded-lg p-4">
          <nav className="space-y-2">
            {sections.map((section) => {
              const Icon = section.icon;
              const isActive = activeSection === section.id;
              
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 text-left ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'text-gray-300 hover:text-white hover:bg-gray-700'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <div>
                    <p className="font-medium">{section.name}</p>
                    <p className="text-xs opacity-75">{section.description}</p>
                  </div>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default SystemSettings;