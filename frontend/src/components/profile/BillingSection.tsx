import React from 'react';
import { CreditCard, Download, Upload, Calendar, Zap, Users, Clock } from 'lucide-react';
import ProfileSection from './ProfileSection';
import ProfileStats from './ProfileStats';

interface SubscriptionPlan {
  name: string;
  price: number;
  currency: string;
  interval: 'month' | 'year';
  features: string[];
  limits: {
    analysisPerMonth: number;
    modelsAccess: string[];
    supportLevel: string;
    storageGB: number;
  };
  usage: {
    analysisUsed: number;
    storageUsed: number;
  };
}

interface PaymentHistory {
  id: string;
  date: string;
  amount: number;
  currency: string;
  description: string;
  status: 'paid' | 'pending' | 'failed';
  invoiceUrl?: string;
}

interface BillingSectionProps {
  currentPlan: SubscriptionPlan;
  paymentHistory: PaymentHistory[];
  onPlanChange: () => void;
  onDownloadInvoice: (paymentId: string) => void;
  onExportData: () => void;
  onImportData: () => void;
  className?: string;
}

const BillingSection: React.FC<BillingSectionProps> = ({
  currentPlan,
  paymentHistory,
  onPlanChange,
  onDownloadInvoice,
  onExportData,
  onImportData,
  className = '',
}) => {
  const formatCurrency = (amount: number, currency: string): string => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount);
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('ru-RU');
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string): string => {
    switch (status) {
      case 'paid': return 'Оплачен';
      case 'pending': return 'Ожидает';
      case 'failed': return 'Ошибка';
      default: return 'Неизвестно';
    }
  };

  const usagePercentage = {
    analysis: (currentPlan.usage.analysisUsed / currentPlan.limits.analysisPerMonth) * 100,
    storage: (currentPlan.usage.storageUsed / currentPlan.limits.storageGB) * 100,
  };

  const planStats = [
    {
      title: 'Анализов в месяц',
      value: currentPlan.limits.analysisPerMonth === -1 ? '∞' : currentPlan.limits.analysisPerMonth,
      subtitle: `Использовано: ${currentPlan.usage.analysisUsed}`,
      icon: Zap,
      color: 'blue' as const,
      trend: usagePercentage.analysis > 80 ? {
        value: Math.round(usagePercentage.analysis),
        isPositive: false
      } : undefined
    },
    {
      title: 'AI модели',
      value: currentPlan.limits.modelsAccess.length,
      subtitle: currentPlan.limits.modelsAccess.slice(0, 2).join(', '),
      icon: Users,
      color: 'green' as const,
    },
    {
      title: 'Поддержка',
      value: currentPlan.limits.supportLevel,
      subtitle: 'Время отклика < 2ч',
      icon: Clock,
      color: 'purple' as const,
    },
  ];

  return (
    <div className={`space-y-8 ${className}`}>
      {/* Текущий план */}
      <ProfileSection
        title="Текущий план"
        icon={CreditCard}
        iconColor="text-blue-600"
        actions={
          <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
            {currentPlan.name}
          </span>
        }
      >
        <div className="space-y-6">
          {/* Статистика использования */}
          <ProfileStats stats={planStats} />
          
          {/* Детали плана */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900">Ограничения плана</h4>
              
              {/* Прогресс анализов */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Анализы КП</span>
                  <span>{currentPlan.usage.analysisUsed} / {currentPlan.limits.analysisPerMonth === -1 ? '∞' : currentPlan.limits.analysisPerMonth}</span>
                </div>
                {currentPlan.limits.analysisPerMonth !== -1 && (
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all ${
                        usagePercentage.analysis > 80 ? 'bg-red-500' : 
                        usagePercentage.analysis > 60 ? 'bg-yellow-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${Math.min(usagePercentage.analysis, 100)}%` }}
                    ></div>
                  </div>
                )}
              </div>
              
              {/* Прогресс хранилища */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Хранилище</span>
                  <span>{currentPlan.usage.storageUsed} / {currentPlan.limits.storageGB} ГБ</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all ${
                      usagePercentage.storage > 80 ? 'bg-red-500' : 
                      usagePercentage.storage > 60 ? 'bg-yellow-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${Math.min(usagePercentage.storage, 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900">Возможности</h4>
              <ul className="space-y-2">
                {currentPlan.features.map((feature, index) => (
                  <li key={index} className="flex items-center text-sm text-gray-600">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-3"></div>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          
          {/* Цена */}
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-gray-900">Стоимость</h4>
                <p className="text-sm text-gray-600">
                  Следующий платеж: {formatDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString())}
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(currentPlan.price, currentPlan.currency)}
                </p>
                <p className="text-sm text-gray-600">
                  /{currentPlan.interval === 'month' ? 'месяц' : 'год'}
                </p>
              </div>
            </div>
          </div>
          
          {/* Действия */}
          <div className="flex flex-wrap gap-4">
            <button
              onClick={onPlanChange}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
            >
              Изменить план
            </button>
            <button className="px-6 py-3 bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition-colors">
              История платежей
            </button>
          </div>
        </div>
      </ProfileSection>

      {/* История платежей */}
      <ProfileSection
        title="История платежей"
        icon={Calendar}
        iconColor="text-purple-600"
      >
        <div className="space-y-4">
          {paymentHistory.length === 0 ? (
            <p className="text-gray-600 text-center py-8">
              История платежей пуста
            </p>
          ) : (
            paymentHistory.map((payment) => (
              <div
                key={payment.id}
                className="flex items-center justify-between p-4 bg-white/60 rounded-xl"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                    <CreditCard className="w-5 h-5 text-blue-600" />
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-900">{payment.description}</h4>
                    <p className="text-sm text-gray-600">{formatDate(payment.date)}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">
                      {formatCurrency(payment.amount, payment.currency)}
                    </p>
                    <span className={`
                      px-2 py-1 text-xs font-medium rounded-full
                      ${getStatusColor(payment.status)}
                    `}>
                      {getStatusText(payment.status)}
                    </span>
                  </div>
                  
                  {payment.status === 'paid' && payment.invoiceUrl && (
                    <button
                      onClick={() => onDownloadInvoice(payment.id)}
                      className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Скачать счет"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </ProfileSection>

      {/* Экспорт/Импорт данных */}
      <ProfileSection
        title="Управление данными"
        icon={Download}
        iconColor="text-gray-600"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Экспортируйте или импортируйте ваши данные в удобном формате
          </p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              onClick={onExportData}
              className="flex items-center justify-center px-6 py-4 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors"
            >
              <Download className="w-5 h-5 mr-3" />
              <div className="text-left">
                <div className="font-medium">Экспорт данных</div>
                <div className="text-sm opacity-90">Скачать все данные</div>
              </div>
            </button>
            
            <button
              onClick={onImportData}
              className="flex items-center justify-center px-6 py-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
            >
              <Upload className="w-5 h-5 mr-3" />
              <div className="text-left">
                <div className="font-medium">Импорт данных</div>
                <div className="text-sm opacity-90">Загрузить архив</div>
              </div>
            </button>
          </div>
        </div>
      </ProfileSection>
    </div>
  );
};

export default BillingSection;