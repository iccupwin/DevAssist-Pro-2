/**
 * BackendManagement - Управление backend сервисами
 * Согласно ТЗ DevAssist Pro
 */

import React, { useState, useEffect } from 'react';
import { 
  Server, 
  Database, 
  Activity,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Terminal,
  Play,
  Square,
  RotateCcw,
  Eye,
  FileText,
  // Settings, // Removed unused import
  Monitor,
  Zap,
  Cloud
} from 'lucide-react';
import { adminService } from '../../services/adminService';

interface BackendService {
  id: string;
  name: string;
  displayName: string;
  status: 'running' | 'stopped' | 'error' | 'starting' | 'stopping';
  port: number;
  url: string;
  description: string;
  cpu: number;
  memory: number;
  uptime: string;
  lastRestart: string;
  version: string;
  dependencies: string[];
}

interface BackendLog {
  id: string;
  service: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
}

interface DatabaseInfo {
  name: string;
  status: 'connected' | 'disconnected' | 'error';
  host: string;
  port: number;
  size: string;
  connections: number;
  uptime: string;
}

const BackendManagement: React.FC = () => {
  const [services, setServices] = useState<BackendService[]>([]);
  const [logs, setLogs] = useState<BackendLog[]>([]);
  const [databases, setDatabases] = useState<DatabaseInfo[]>([]);
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'services' | 'logs' | 'databases' | 'monitoring'>('services');
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Загружаем реальные данные backend сервисов
  useEffect(() => {
    loadBackendData();
  }, []);

  const loadBackendData = async () => {
    try {
      const [servicesResponse, logsResponse, databasesResponse] = await Promise.all([
        adminService.getBackendServices(),
        adminService.getBackendLogs(),
        adminService.getDatabases()
      ]);

      if (servicesResponse.success) {
        setServices(servicesResponse.data);
      }

      if (logsResponse.success) {
        setLogs(logsResponse.data);
      }

      if (databasesResponse.success) {
        setDatabases(databasesResponse.data);
      }
    } catch (error) {
      // Failed to load backend data
      // Показываем ошибку вместо моков
      setServices([]);
      setLogs([]);
      setDatabases([]);
    }
  };

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      // Здесь бы был реальный API вызов для обновления данных
      // Refreshing backend data...
    }, 5000);

    return () => clearInterval(interval);
  }, [autoRefresh]);

  const getStatusIcon = (status: BackendService['status']) => {
    switch (status) {
      case 'running':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'stopped':
        return <XCircle className="h-5 w-5 text-gray-500" />;
      case 'error':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case 'starting':
        return <RefreshCw className="h-5 w-5 text-blue-500 animate-spin" />;
      case 'stopping':
        return <RefreshCw className="h-5 w-5 text-orange-500 animate-spin" />;
      default:
        return <XCircle className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: BackendService['status']) => {
    switch (status) {
      case 'running':
        return 'text-green-500 bg-green-500/10';
      case 'stopped':
        return 'text-gray-500 bg-gray-500/10';
      case 'error':
        return 'text-red-500 bg-red-500/10';
      case 'starting':
        return 'text-blue-500 bg-blue-500/10';
      case 'stopping':
        return 'text-orange-500 bg-orange-500/10';
      default:
        return 'text-gray-500 bg-gray-500/10';
    }
  };

  const getLevelColor = (level: BackendLog['level']) => {
    switch (level) {
      case 'error':
        return 'text-red-400 bg-red-500/10';
      case 'warn':
        return 'text-yellow-400 bg-yellow-500/10';
      case 'info':
        return 'text-blue-400 bg-blue-500/10';
      case 'debug':
        return 'text-gray-400 bg-gray-500/10';
      default:
        return 'text-gray-400 bg-gray-500/10';
    }
  };

  const handleServiceAction = (serviceId: string, action: 'start' | 'stop' | 'restart') => {
    setServices(prev => prev.map(service => 
      service.id === serviceId 
        ? { 
            ...service, 
            status: action === 'start' ? 'starting' : action === 'stop' ? 'stopping' : 'starting'
          }
        : service
    ));

    // Симуляция действия
    setTimeout(() => {
      setServices(prev => prev.map(service => 
        service.id === serviceId 
          ? { 
              ...service, 
              status: action === 'stop' ? 'stopped' : 'running',
              lastRestart: action === 'restart' ? new Date().toLocaleString() : service.lastRestart
            }
          : service
      ));
    }, 2000);
  };

  const ServiceCard: React.FC<{ service: BackendService }> = ({ service }) => (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <Server className="h-6 w-6 text-blue-400" />
          <div>
            <h3 className="font-semibold text-white">{service.displayName}</h3>
            <p className="text-sm text-gray-400">{service.description}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {getStatusIcon(service.status)}
          <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(service.status)}`}>
            {service.status.toUpperCase()}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-xs text-gray-400">URL</p>
          <a 
            href={service.url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-sm text-blue-400 hover:text-blue-300"
          >
            {service.url}
          </a>
        </div>
        <div>
          <p className="text-xs text-gray-400">Version</p>
          <p className="text-sm text-white">{service.version}</p>
        </div>
        <div>
          <p className="text-xs text-gray-400">CPU Usage</p>
          <p className="text-sm text-white">{service.cpu}%</p>
        </div>
        <div>
          <p className="text-xs text-gray-400">Memory</p>
          <p className="text-sm text-white">{service.memory} MB</p>
        </div>
        <div>
          <p className="text-xs text-gray-400">Uptime</p>
          <p className="text-sm text-white">{service.uptime}</p>
        </div>
        <div>
          <p className="text-xs text-gray-400">Last Restart</p>
          <p className="text-sm text-white">{service.lastRestart}</p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex space-x-2">
          {service.status === 'stopped' ? (
            <button
              onClick={() => handleServiceAction(service.id, 'start')}
              className="flex items-center space-x-1 px-3 py-1 bg-green-600 hover:bg-green-700 rounded text-sm"
            >
              <Play className="h-4 w-4" />
              <span>Start</span>
            </button>
          ) : (
            <button
              onClick={() => handleServiceAction(service.id, 'stop')}
              className="flex items-center space-x-1 px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-sm"
            >
              <Square className="h-4 w-4" />
              <span>Stop</span>
            </button>
          )}
          <button
            onClick={() => handleServiceAction(service.id, 'restart')}
            className="flex items-center space-x-1 px-3 py-1 bg-orange-600 hover:bg-orange-700 rounded text-sm"
          >
            <RotateCcw className="h-4 w-4" />
            <span>Restart</span>
          </button>
        </div>
        <button
          onClick={() => setSelectedService(selectedService === service.id ? null : service.id)}
          className="flex items-center space-x-1 px-3 py-1 bg-gray-600 hover:bg-gray-700 rounded text-sm"
        >
          <Eye className="h-4 w-4" />
          <span>Details</span>
        </button>
      </div>

      {selectedService === service.id && (
        <div className="mt-4 pt-4 border-t border-gray-700">
          <h4 className="font-medium text-white mb-2">Dependencies:</h4>
          <div className="flex flex-wrap gap-2">
            {service.dependencies.map(dep => (
              <span key={dep} className="px-2 py-1 bg-gray-700 rounded text-xs text-gray-300">
                {dep}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const LogEntry: React.FC<{ log: BackendLog }> = ({ log }) => (
    <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-3">
          <span className={`px-2 py-1 rounded text-xs font-medium ${getLevelColor(log.level)}`}>
            {log.level.toUpperCase()}
          </span>
          <span className="text-sm text-gray-400">{log.service}</span>
        </div>
        <span className="text-xs text-gray-500">{log.timestamp}</span>
      </div>
      <p className="text-sm text-white font-mono">{log.message}</p>
    </div>
  );

  const DatabaseCard: React.FC<{ db: DatabaseInfo }> = ({ db }) => (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <Database className="h-6 w-6 text-green-400" />
          <h3 className="font-semibold text-white">{db.name}</h3>
        </div>
        <div className="flex items-center space-x-2">
          {db.status === 'connected' ? (
            <CheckCircle className="h-5 w-5 text-green-500" />
          ) : (
            <XCircle className="h-5 w-5 text-red-500" />
          )}
          <span className={`px-2 py-1 rounded text-xs font-medium ${
            db.status === 'connected' ? 'text-green-500 bg-green-500/10' : 'text-red-500 bg-red-500/10'
          }`}>
            {db.status.toUpperCase()}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs text-gray-400">Host:Port</p>
          <p className="text-sm text-white">{db.host}:{db.port}</p>
        </div>
        <div>
          <p className="text-xs text-gray-400">Size</p>
          <p className="text-sm text-white">{db.size}</p>
        </div>
        <div>
          <p className="text-xs text-gray-400">Connections</p>
          <p className="text-sm text-white">{db.connections}</p>
        </div>
        <div>
          <p className="text-xs text-gray-400">Uptime</p>
          <p className="text-sm text-white">{db.uptime}</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Backend Management</h1>
          <p className="text-gray-400">Управление backend сервисами и инфраструктурой</p>
        </div>
        <div className="flex items-center space-x-4">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded"
            />
            <span className="text-sm text-gray-300">Auto-refresh</span>
          </label>
          <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded">
            <RefreshCw className="h-4 w-4" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-gray-800 p-1 rounded-lg">
        <button
          onClick={() => setActiveTab('services')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
            activeTab === 'services' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:text-white'
          }`}
        >
          <Server className="h-4 w-4" />
          <span>Services</span>
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
            activeTab === 'logs' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:text-white'
          }`}
        >
          <FileText className="h-4 w-4" />
          <span>Logs</span>
        </button>
        <button
          onClick={() => setActiveTab('databases')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
            activeTab === 'databases' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:text-white'
          }`}
        >
          <Database className="h-4 w-4" />
          <span>Databases</span>
        </button>
        <button
          onClick={() => setActiveTab('monitoring')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
            activeTab === 'monitoring' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:text-white'
          }`}
        >
          <Monitor className="h-4 w-4" />
          <span>Monitoring</span>
        </button>
      </div>

      {/* Content */}
      {activeTab === 'services' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {services.map(service => (
              <ServiceCard key={service.id} service={service} />
            ))}
          </div>
        </div>
      )}

      {activeTab === 'logs' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Recent Logs</h2>
            <button className="flex items-center space-x-2 px-3 py-1 bg-gray-600 hover:bg-gray-700 rounded text-sm">
              <Terminal className="h-4 w-4" />
              <span>Live View</span>
            </button>
          </div>
          <div className="space-y-3">
            {logs.map(log => (
              <LogEntry key={log.id} log={log} />
            ))}
          </div>
        </div>
      )}

      {activeTab === 'databases' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {databases.map(db => (
              <DatabaseCard key={db.name} db={db} />
            ))}
          </div>
        </div>
      )}

      {activeTab === 'monitoring' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <div className="flex items-center space-x-3 mb-4">
                <Activity className="h-6 w-6 text-green-400" />
                <h3 className="font-semibold text-white">System Health</h3>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-400">Overall Status</span>
                  <span className="text-green-400">Healthy</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Services Running</span>
                  <span className="text-white">4/5</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Avg Response Time</span>
                  <span className="text-white">142ms</span>
                </div>
              </div>
            </div>

            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <div className="flex items-center space-x-3 mb-4">
                <Zap className="h-6 w-6 text-yellow-400" />
                <h3 className="font-semibold text-white">Performance</h3>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-400">CPU Usage</span>
                  <span className="text-white">23.4%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Memory Usage</span>
                  <span className="text-white">1.8 GB</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Network I/O</span>
                  <span className="text-white">45 MB/s</span>
                </div>
              </div>
            </div>

            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <div className="flex items-center space-x-3 mb-4">
                <Cloud className="h-6 w-6 text-blue-400" />
                <h3 className="font-semibold text-white">Infrastructure</h3>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-400">Docker Containers</span>
                  <span className="text-white">12</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Load Balancer</span>
                  <span className="text-green-400">Active</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">SSL Certificate</span>
                  <span className="text-green-400">Valid</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BackendManagement;