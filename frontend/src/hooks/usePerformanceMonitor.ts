import { useState, useEffect, useRef } from 'react';

interface PerformanceMetrics {
  loadTime: number;
  renderTime: number;
  memoryUsage: number;
  bundleSize: number;
  networkLatency: number;
}

/**
 * Hook для мониторинга производительности приложения
 */
export const usePerformanceMonitor = () => {
  const [metrics, setMetrics] = useState<Partial<PerformanceMetrics>>({});
  const [isMonitoring, setIsMonitoring] = useState(false);
  const observerRef = useRef<PerformanceObserver | null>(null);

  // Измерение времени загрузки страницы
  const measurePageLoad = () => {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (navigation) {
      const loadTime = navigation.loadEventEnd - navigation.loadEventStart;
      setMetrics(prev => ({ ...prev, loadTime }));
    }
  };

  // Измерение времени рендеринга компонентов
  const measureRenderTime = (componentName: string, startTime: number) => {
    const endTime = performance.now();
    const renderTime = endTime - startTime;
    
    console.log(`${componentName} render time: ${renderTime.toFixed(2)}ms`);
    setMetrics(prev => ({ ...prev, renderTime }));
  };

  // Мониторинг использования памяти
  const measureMemoryUsage = () => {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      const memoryUsage = memory.usedJSHeapSize / (1024 * 1024); // MB
      setMetrics(prev => ({ ...prev, memoryUsage }));
    }
  };

  // Измерение размера бандла
  const measureBundleSize = async () => {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      const bundleSize = (estimate.usage || 0) / (1024 * 1024); // MB
      setMetrics(prev => ({ ...prev, bundleSize }));
    }
  };

  // Измерение сетевой латентности
  const measureNetworkLatency = async (url: string = '/') => {
    const startTime = performance.now();
    
    try {
      await fetch(url, { method: 'HEAD' });
      const endTime = performance.now();
      const networkLatency = endTime - startTime;
      setMetrics(prev => ({ ...prev, networkLatency }));
    } catch (error) {
      console.error('Network latency measurement failed:', error);
    }
  };

  // Мониторинг производительности в реальном времени
  const startPerformanceObserver = () => {
    if ('PerformanceObserver' in window) {
      observerRef.current = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        
        entries.forEach(entry => {
          if (entry.entryType === 'measure') {
            console.log(`Performance measure: ${entry.name} - ${entry.duration.toFixed(2)}ms`);
          }
          
          if (entry.entryType === 'paint') {
            console.log(`Paint timing: ${entry.name} - ${entry.startTime.toFixed(2)}ms`);
          }
        });
      });

      observerRef.current.observe({ entryTypes: ['measure', 'paint', 'largest-contentful-paint'] });
      setIsMonitoring(true);
    }
  };

  // Остановка мониторинга
  const stopPerformanceObserver = () => {
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
      setIsMonitoring(false);
    }
  };

  // Получение Core Web Vitals
  const getCoreWebVitals = () => {
    const vitals = {
      LCP: 0, // Largest Contentful Paint
      FID: 0, // First Input Delay
      CLS: 0  // Cumulative Layout Shift
    };

    // LCP
    if ('PerformanceObserver' in window) {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        vitals.LCP = lastEntry.startTime;
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
    }

    return vitals;
  };

  // Автоматические измерения при инициализации
  useEffect(() => {
    measurePageLoad();
    measureMemoryUsage();
    measureBundleSize();
    measureNetworkLatency();

    // Периодические измерения
    const interval = setInterval(() => {
      measureMemoryUsage();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return {
    metrics,
    isMonitoring,
    measureRenderTime,
    measureMemoryUsage,
    measureBundleSize,
    measureNetworkLatency,
    startPerformanceObserver,
    stopPerformanceObserver,
    getCoreWebVitals
  };
};

/**
 * Hook для измерения производительности компонентов
 */
export const useComponentPerformance = (componentName: string) => {
  const renderStartTime = useRef(performance.now());
  const [renderCount, setRenderCount] = useState(0);
  const [averageRenderTime, setAverageRenderTime] = useState(0);
  const renderTimes = useRef<number[]>([]);

  useEffect(() => {
    const renderEndTime = performance.now();
    const renderTime = renderEndTime - renderStartTime.current;
    
    renderTimes.current.push(renderTime);
    setRenderCount(prev => prev + 1);
    
    // Вычисляем среднее время рендеринга
    const average = renderTimes.current.reduce((a, b) => a + b, 0) / renderTimes.current.length;
    setAverageRenderTime(average);
    
    // Логируем в development mode
    if (process.env.NODE_ENV === 'development') {
      console.log(`${componentName} render #${renderCount + 1}: ${renderTime.toFixed(2)}ms`);
    }
    
    // Обновляем время начала для следующего рендера
    renderStartTime.current = performance.now();
  });

  return {
    renderCount,
    averageRenderTime,
    lastRenderTime: renderTimes.current[renderTimes.current.length - 1] || 0
  };
};

/**
 * Hook для оптимизации рендеринга
 */
export const useRenderOptimization = (threshold: number = 16) => {
  const [shouldRender, setShouldRender] = useState(true);
  const lastRenderTime = useRef(performance.now());

  const requestRender = () => {
    const now = performance.now();
    const timeSinceLastRender = now - lastRenderTime.current;
    
    if (timeSinceLastRender >= threshold) {
      setShouldRender(true);
      lastRenderTime.current = now;
    } else {
      // Откладываем рендер до следующего кадра
      requestAnimationFrame(() => {
        setShouldRender(true);
        lastRenderTime.current = performance.now();
      });
    }
  };

  return { shouldRender, requestRender };
};

export default usePerformanceMonitor;