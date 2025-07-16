import React, { useState, useEffect } from 'react';
import { usePerformanceMonitor } from '../../hooks/usePerformanceMonitor';
import { Activity, Clock, HardDrive, Network, Zap } from 'lucide-react';

interface PerformanceMonitorProps {
  isVisible?: boolean;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  collapsed?: boolean;
}

/**
 * Компонент для отображения метрик производительности (только для development)
 */
export const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({
  isVisible = process.env.NODE_ENV === 'development',
  position = 'bottom-right',
  collapsed = false
}) => {
  const [isCollapsed, setIsCollapsed] = useState(collapsed);
  const [showDetails, setShowDetails] = useState(false);
  const {
    metrics,
    isMonitoring,
    measureMemoryUsage,
    measureBundleSize,
    measureNetworkLatency,
    startPerformanceObserver,
    stopPerformanceObserver,
    getCoreWebVitals
  } = usePerformanceMonitor();

  const [webVitals, setWebVitals] = useState({ LCP: 0, FID: 0, CLS: 0 });

  useEffect(() => {
    if (isVisible) {
      startPerformanceObserver();
      const vitals = getCoreWebVitals();
      setWebVitals(vitals);
    }

    return () => {
      stopPerformanceObserver();
    };
  }, [isVisible, startPerformanceObserver, stopPerformanceObserver, getCoreWebVitals]);

  if (!isVisible) return null;

  const getPositionClasses = () => {
    const baseClasses = 'fixed z-[9999] bg-black bg-opacity-90 text-white rounded-lg shadow-lg';
    
    switch (position) {
      case 'top-left':
        return `${baseClasses} top-4 left-4`;
      case 'top-right':
        return `${baseClasses} top-4 right-4`;
      case 'bottom-left':
        return `${baseClasses} bottom-4 left-4`;
      case 'bottom-right':
        return `${baseClasses} bottom-4 right-4`;
      default:
        return `${baseClasses} bottom-4 right-4`;
    }
  };

  const formatMetric = (value: number | undefined, unit: string = 'ms') => {
    if (value === undefined) return 'N/A';
    return `${value.toFixed(2)}${unit}`;
  };

  const getPerformanceColor = (value: number, thresholds: { good: number; needs: number }) => {
    if (value <= thresholds.good) return 'text-green-400';
    if (value <= thresholds.needs) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className={getPositionClasses()}>
      {/* Header */}
      <div className="flex items-center justify-between p-2 border-b border-gray-600">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4" />
          <span className="text-sm font-medium">Performance</span>
          {isMonitoring && (
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-xs px-2 py-1 bg-gray-700 rounded hover:bg-gray-600 transition-colors"
          >
            {showDetails ? 'Hide' : 'Details'}
          </button>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="text-xs px-2 py-1 bg-gray-700 rounded hover:bg-gray-600 transition-colors"
          >
            {isCollapsed ? '▼' : '▲'}
          </button>
        </div>
      </div>

      {/* Content */}
      {!isCollapsed && (
        <div className="p-3 space-y-2 min-w-[200px]">
          {/* Basic Metrics */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-3 h-3" />
                <span className="text-xs">Load Time</span>
              </div>
              <span className={`text-xs font-mono ${getPerformanceColor(metrics.loadTime || 0, { good: 1000, needs: 2000 })}`}>
                {formatMetric(metrics.loadTime)}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="w-3 h-3" />
                <span className="text-xs">Render Time</span>
              </div>
              <span className={`text-xs font-mono ${getPerformanceColor(metrics.renderTime || 0, { good: 16, needs: 33 })}`}>
                {formatMetric(metrics.renderTime)}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HardDrive className="w-3 h-3" />
                <span className="text-xs">Memory</span>
              </div>
              <span className={`text-xs font-mono ${getPerformanceColor(metrics.memoryUsage || 0, { good: 50, needs: 100 })}`}>
                {formatMetric(metrics.memoryUsage, 'MB')}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Network className="w-3 h-3" />
                <span className="text-xs">Network</span>
              </div>
              <span className={`text-xs font-mono ${getPerformanceColor(metrics.networkLatency || 0, { good: 100, needs: 300 })}`}>
                {formatMetric(metrics.networkLatency)}
              </span>
            </div>
          </div>

          {/* Core Web Vitals */}
          {showDetails && (
            <>
              <div className="border-t border-gray-600 pt-2">
                <h4 className="text-xs font-medium mb-1">Core Web Vitals</h4>
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs">LCP</span>
                    <span className={`text-xs font-mono ${getPerformanceColor(webVitals.LCP, { good: 2500, needs: 4000 })}`}>
                      {formatMetric(webVitals.LCP)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs">FID</span>
                    <span className={`text-xs font-mono ${getPerformanceColor(webVitals.FID, { good: 100, needs: 300 })}`}>
                      {formatMetric(webVitals.FID)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs">CLS</span>
                    <span className={`text-xs font-mono ${getPerformanceColor(webVitals.CLS, { good: 0.1, needs: 0.25 })}`}>
                      {formatMetric(webVitals.CLS, '')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Bundle Size */}
              <div className="border-t border-gray-600 pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs">Bundle Size</span>
                  <span className={`text-xs font-mono ${getPerformanceColor(metrics.bundleSize || 0, { good: 1, needs: 5 })}`}>
                    {formatMetric(metrics.bundleSize, 'MB')}
                  </span>
                </div>
              </div>
            </>
          )}

          {/* Actions */}
          <div className="border-t border-gray-600 pt-2 flex gap-1">
            <button
              onClick={() => {
                measureMemoryUsage();
                measureBundleSize();
                measureNetworkLatency();
              }}
              className="text-xs px-2 py-1 bg-blue-600 rounded hover:bg-blue-700 transition-colors"
            >
              Refresh
            </button>
            <button
              onClick={() => {
                console.log('Performance Metrics:', metrics);
                console.log('Core Web Vitals:', webVitals);
              }}
              className="text-xs px-2 py-1 bg-green-600 rounded hover:bg-green-700 transition-colors"
            >
              Log
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * HOC для автоматического мониторинга производительности компонентов
 */
export const withPerformanceMonitoring = <P extends object>(
  Component: React.ComponentType<P>,
  componentName: string
) => {
  return React.forwardRef<any, P>((props, ref) => {
    const renderStartTime = performance.now();
    
    useEffect(() => {
      const renderEndTime = performance.now();
      const renderTime = renderEndTime - renderStartTime;
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`${componentName} render time: ${renderTime.toFixed(2)}ms`);
      }
    });

    return <Component {...props} ref={ref} />;
  });
};

export default PerformanceMonitor;