import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, AlertTriangle, RefreshCw } from 'lucide-react';

interface ServiceStatus {
  name: string;
  url: string;
  status: 'healthy' | 'unhealthy' | 'unknown';
  responseTime?: number;
  error?: string;
}

export const BackendDiagnostics: React.FC = () => {
  const [services, setServices] = useState<ServiceStatus[]>([
    { name: 'API Gateway', url: 'http://localhost:8000', status: 'unknown' },
    { name: 'Auth Service', url: 'http://localhost:8001', status: 'unknown' },
    { name: 'Database', url: 'http://localhost:5433', status: 'unknown' },
  ]);
  const [isChecking, setIsChecking] = useState(false);

  const checkService = async (service: ServiceStatus): Promise<ServiceStatus> => {
    try {
      const startTime = Date.now();
      const response = await fetch(`${service.url}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      const responseTime = Date.now() - startTime;

      if (response.ok) {
        return {
          ...service,
          status: 'healthy',
          responseTime,
        };
      } else {
        return {
          ...service,
          status: 'unhealthy',
          error: `HTTP ${response.status}`,
        };
      }
    } catch (error) {
      return {
        ...service,
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Connection failed',
      };
    }
  };

  const checkAllServices = async () => {
    setIsChecking(true);
    const results = await Promise.all(services.map(checkService));
    setServices(results);
    setIsChecking(false);
  };

  useEffect(() => {
    checkAllServices();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'unhealthy':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'text-green-500';
      case 'unhealthy':
        return 'text-red-500';
      default:
        return 'text-yellow-500';
    }
  };

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Backend Diagnostics</h3>
        <button
          onClick={checkAllServices}
          disabled={isChecking}
          className="flex items-center space-x-2 px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${isChecking ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      <div className="space-y-3">
        {services.map((service) => (
          <div
            key={service.name}
            className="flex items-center justify-between p-3 bg-gray-700 rounded-lg"
          >
            <div className="flex items-center space-x-3">
              {getStatusIcon(service.status)}
              <div>
                <p className="text-white font-medium">{service.name}</p>
                <p className="text-gray-400 text-sm">{service.url}</p>
              </div>
            </div>
            
            <div className="text-right">
              <p className={`font-medium ${getStatusColor(service.status)}`}>
                {service.status}
              </p>
              {service.responseTime && (
                <p className="text-gray-400 text-sm">
                  {service.responseTime}ms
                </p>
              )}
              {service.error && (
                <p className="text-red-400 text-sm">{service.error}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 p-3 bg-gray-700 rounded-lg">
        <h4 className="text-white font-medium mb-2">Troubleshooting Tips:</h4>
        <ul className="text-gray-300 text-sm space-y-1">
          <li>• Make sure Docker containers are running: <code className="bg-gray-600 px-1 rounded">docker-compose up</code></li>
          <li>• Check if ports are available: 8000, 8001, 5433</li>
          <li>• Verify environment variables are set correctly</li>
          <li>• Check Docker logs for service errors</li>
        </ul>
      </div>
    </div>
  );
}; 