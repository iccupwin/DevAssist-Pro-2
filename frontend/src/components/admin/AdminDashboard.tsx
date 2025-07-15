/**
 * AdminDashboard - Главная панель администратора с метриками
 * Согласно ТЗ DevAssist Pro
 */

import React, { useState, useEffect } from 'react';
import {
  Users,
  Activity,
  DollarSign,
  FileSearch,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Zap,
  Shield,
  Clock,
  Minus,
  RefreshCw,
  Eye,
  Bell,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { SystemMetrics, SystemAlert } from '../../types/admin';
import { Button } from '../ui/Button';
import { adminService } from '../../services/adminService';

interface AdminDashboardProps {
  className?: string;
}

// Заглушка для fallback (пустые данные, если API недоступен)
const emptyMetrics: SystemMetrics = {
  users: { total: 0, change24h: 0, active: 0, premium: 0, banned: 0 },
  api: { calls: 0, change1h: 0, successRate: 0, avgResponseTime: 0 },
  ai: { costs: 0, change24h: 0, tokenUsage: 0, providerStatus: {} },
  analyses: { total: 0, change24h: 0, successful: 0, failed: 0 },
  errors: { count: 0, change24h: 0, critical: 0, warnings: 0 },
  uptime: { percentage: 0, days: 0, lastDowntime: null }
};

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  className = ''
}) => {
  const [metrics, setMetrics] = useState<SystemMetrics>(emptyMetrics);
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Загружаем реальные данные при монтировании компонента
  useEffect(() => {
    loadRealData();
  }, []);

  const loadRealData = async () => {
    try {
      setError(null);
      console.log('[AdminDashboard] Loading real data from backend...');
      
      const [metricsResponse, alertsResponse] = await Promise.all([
        adminService.getSystemMetrics(),
        adminService.getSystemAlerts()
      ]);

      const metricsData = metricsResponse.data;
      const alertsData = alertsResponse.data;

      console.log('[AdminDashboard] Real data loaded:', {
        metrics: metricsData,
        alerts: alertsData
      });

      setMetrics(metricsData);
      setAlerts(alertsData);
      
    } catch (error) {
      console.error('[AdminDashboard] Failed to load real data:', error);
      setError(error instanceof Error ? error.message : 'Failed to load data');
      // Устанавливаем пустые данные в случае ошибки
      setMetrics(emptyMetrics);
      setAlerts([]);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshData = async () => {
    setIsRefreshing(true);
    try {
      await loadRealData();
    } catch (error) {
      console.error('Failed to refresh data:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const acknowledgeAlert = (alertId: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId 
        ? { ...alert, acknowledged: true, acknowledgedAt: new Date().toISOString() }
        : alert
    ));
  };

  const formatChange = (value: number) => {
    if (value === 0) return { icon: Minus, color: 'text-gray-400', text: '0' };
    if (value > 0) return { icon: TrendingUp, color: 'text-green-500', text: `+${value}` };
    return { icon: TrendingDown, color: 'text-red-500', text: `${value}` };
  };

  // Helper function to safely format numbers
  const safeNumberFormat = (value: number | undefined | null, decimals: number = 0): string => {
    if (value === undefined || value === null) return '0';
    if (decimals > 0) return value.toFixed(decimals);
    return value.toLocaleString();
  };

  // Helper function to safely calculate percentages
  const safePercentage = (numerator: number | undefined | null, denominator: number | undefined | null): string => {
    if (!numerator || !denominator || denominator === 0) return '0%';
    return `${((numerator / denominator) * 100).toFixed(1)}%`;
  };

  // Helper function to safely format currency
  const safeCurrencyFormat = (value: number | undefined | null): string => {
    if (value === undefined || value === null) return '$0.00';
    return `$${value.toFixed(2)}`;
  };

  const MetricCard: React.FC<{
    title: string;
    value: string | number;
    change?: number;
    changeLabel?: string;
    icon: React.ComponentType<any>;
    color: string;
    subtitle?: string;
  }> = ({ title, value, change, changeLabel, icon: Icon, color, subtitle }) => {
    const changeInfo = change !== undefined ? formatChange(change) : null;
    const ChangeIcon = changeInfo?.icon;

    return (
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 hover:border-gray-600 transition-colors">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              <div className={`p-2 rounded-lg ${color}`}>
                <Icon className="h-5 w-5 text-white" />
              </div>
              <h3 className="text-sm font-medium text-gray-400">{title}</h3>
            </div>
            
            <div className="mb-2">
              <p className="text-2xl font-bold text-white">{value}</p>
              {subtitle && (
                <p className="text-sm text-gray-500">{subtitle}</p>
              )}
            </div>

            {changeInfo && (
              <div className={`flex items-center space-x-1 ${changeInfo.color}`}>
                {React.createElement(changeInfo.icon, { className: "h-4 w-4" })}
                <span className="text-sm font-medium">{changeInfo.text}</span>
                {changeLabel && (
                  <span className="text-sm text-gray-500">{changeLabel}</span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const AlertItem: React.FC<{ alert: SystemAlert }> = ({ alert }) => {
    const severityColors = {
      low: 'bg-blue-500',
      medium: 'bg-yellow-500',
      high: 'bg-orange-500',
      critical: 'bg-red-500'
    };

    const severityIcons = {
      low: CheckCircle,
      medium: AlertCircle,
      high: AlertTriangle,
      critical: XCircle
    };

    const SeverityIcon = severityIcons[alert.severity];
    const timeAgo = Math.floor((Date.now() - new Date(alert.timestamp).getTime()) / (60 * 1000));

    return (
      <div className={`p-4 border-l-4 ${alert.acknowledged ? 'bg-gray-800/50 border-gray-600' : 'bg-gray-800 border-' + alert.severity === 'critical' ? 'red' : alert.severity === 'high' ? 'orange' : alert.severity === 'medium' ? 'yellow' : 'blue'}-500`}>
        <div className="flex items-start space-x-3">
          <div className={`p-1 rounded-full ${severityColors[alert.severity]}`}>
            <SeverityIcon className="h-4 w-4 text-white" />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h4 className={`text-sm font-medium ${alert.acknowledged ? 'text-gray-400' : 'text-white'}`}>
                {alert.title}
              </h4>
              <span className="text-xs text-gray-500">
                {timeAgo}m ago
              </span>
            </div>
            
            <p className={`text-sm mt-1 ${alert.acknowledged ? 'text-gray-500' : 'text-gray-300'}`}>
              {alert.message}
            </p>
            
            {!alert.acknowledged && (
              <button
                onClick={() => acknowledgeAlert(alert.id)}
                className="text-xs text-blue-400 hover:text-blue-300 mt-2"
              >
                Acknowledge
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Показываем загрузку при первом рендере
  if (isLoading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 text-blue-500 animate-spin mx-auto mb-4" />
            <p className="text-gray-400">Loading real admin data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">System Overview</h1>
          <p className="text-gray-400">Real-time system metrics from database</p>
        </div>
        
        <div className="flex items-center space-x-3">
          {error && (
            <div className="text-red-400 text-sm">
              <AlertTriangle className="h-4 w-4 inline mr-1" />
              {error}
            </div>
          )}
          <Button
            onClick={refreshData}
            disabled={isRefreshing}
            className="flex items-center space-x-2"
            variant="outline"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <MetricCard
          title="Users"
          value={safeNumberFormat(metrics.users?.total)}
          change={metrics.users?.change24h}
          changeLabel="24h"
          icon={Users}
          color="bg-blue-600"
          subtitle={`${safeNumberFormat(metrics.users?.active)} active`}
        />
        
        <MetricCard
          title="API Calls"
          value={safeNumberFormat(metrics.api?.calls)}
          change={metrics.api?.change1h}
          changeLabel="1h"
          icon={Activity}
          color="bg-green-600"
          subtitle={`${safeNumberFormat(metrics.api?.successRate, 1)}% success rate`}
        />
        
        <MetricCard
          title="AI Costs"
          value={safeCurrencyFormat(metrics.ai?.costs)}
          change={metrics.ai?.change24h}
          changeLabel="24h"
          icon={DollarSign}
          color="bg-purple-600"
          subtitle={`${safeNumberFormat((metrics.ai?.tokenUsage || 0) / 1000000, 1)}M tokens`}
        />
        
        <MetricCard
          title="Analyses"
          value={safeNumberFormat(metrics.analyses?.total)}
          change={metrics.analyses?.change24h}
          changeLabel="24h"
          icon={FileSearch}
          color="bg-indigo-600"
          subtitle={`${safePercentage(metrics.analyses?.successful, metrics.analyses?.total)} success`}
        />
        
        <MetricCard
          title="Errors"
          value={safeNumberFormat(metrics.errors?.count)}
          change={metrics.errors?.change24h}
          changeLabel="24h"
          icon={AlertTriangle}
          color="bg-red-600"
          subtitle={`${safeNumberFormat(metrics.errors?.critical)} critical`}
        />
        
        <MetricCard
          title="Uptime"
          value={`${safeNumberFormat(metrics.uptime?.percentage, 1)}%`}
          icon={Shield}
          color="bg-green-600"
          subtitle={`${safeNumberFormat(metrics.uptime?.days)} days`}
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* API Usage Chart Placeholder */}
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">API Usage</h3>
            <div className="flex items-center space-x-2 text-sm text-gray-400">
              <Clock className="h-4 w-4" />
              <span>Last 24 hours</span>
            </div>
          </div>
          
          {/* Chart placeholder */}
          <div className="h-48 bg-gray-900 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <Activity className="h-12 w-12 text-gray-600 mx-auto mb-2" />
              <p className="text-gray-500">Chart coming soon</p>
            </div>
          </div>
        </div>

        {/* User Activity Chart Placeholder */}
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">User Activity</h3>
            <div className="flex items-center space-x-2 text-sm text-gray-400">
              <Users className="h-4 w-4" />
              <span>Last 7 days</span>
            </div>
          </div>
          
          {/* Chart placeholder */}
          <div className="h-48 bg-gray-900 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <Users className="h-12 w-12 text-gray-600 mx-auto mb-2" />
              <p className="text-gray-500">Chart coming soon</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Alerts */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg">
        <div className="p-6 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Bell className="h-5 w-5 text-yellow-500" />
              <h3 className="text-lg font-semibold text-white">Recent Alerts</h3>
            </div>
            
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-400">
                {alerts.filter(a => !a.acknowledged).length} unacknowledged
              </span>
              <Button size="sm" variant="outline">
                <Eye className="h-4 w-4 mr-2" />
                View All
              </Button>
            </div>
          </div>
        </div>

        <div className="divide-y divide-gray-700">
          {alerts.length > 0 ? (
            alerts.map(alert => (
              <AlertItem key={alert.id} alert={alert} />
            ))
          ) : (
            <div className="p-8 text-center">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
              <p className="text-gray-400">No recent alerts</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;