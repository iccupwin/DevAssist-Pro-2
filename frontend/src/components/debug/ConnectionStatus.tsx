import React, { useState, useEffect } from 'react';
import { getBackendApiUrl } from '../../config/app';
import { Wifi, WifiOff, AlertTriangle } from 'lucide-react';

interface ConnectionStatusProps {
  className?: string;
}

export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({ className = '' }) => {
  const [status, setStatus] = useState<'connected' | 'disconnected' | 'checking'>('checking');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    setStatus('checking');
    try {
      const response = await fetch(`${getBackendApiUrl()}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        setStatus('connected');
        setError('');
      } else {
        setStatus('disconnected');
        setError(`HTTP ${response.status}`);
      }
    } catch (err) {
      setStatus('disconnected');
      setError(err instanceof Error ? err.message : 'Connection failed');
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'connected':
        return <Wifi className="h-4 w-4 text-green-500" />;
      case 'disconnected':
        return <WifiOff className="h-4 w-4 text-red-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'connected':
        return 'Backend Connected';
      case 'disconnected':
        return 'Backend Disconnected';
      default:
        return 'Checking Connection...';
    }
  };

  return (
    <div className={`flex items-center space-x-2 text-sm ${className}`}>
      {getStatusIcon()}
      <span className={status === 'connected' ? 'text-green-500' : status === 'disconnected' ? 'text-red-500' : 'text-yellow-500'}>
        {getStatusText()}
      </span>
      {error && (
        <span className="text-red-400 text-xs">({error})</span>
      )}
      <button
        onClick={checkConnection}
        className="text-blue-400 hover:text-blue-300 text-xs underline"
      >
        Retry
      </button>
    </div>
  );
}; 