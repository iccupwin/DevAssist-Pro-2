import React, { Suspense, lazy } from 'react';
import { useLazyLoad } from '../../hooks/useLazyLoad';
import { Skeleton } from './SkeletonLoader';

interface LazyLoaderProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  threshold?: number;
  className?: string;
}

/**
 * Lazy loading wrapper component
 */
export const LazyLoader: React.FC<LazyLoaderProps> = ({
  children,
  fallback = <Skeleton />,
  threshold = 0.1,
  className = ''
}) => {
  const { ref, isIntersecting } = useLazyLoad(threshold);

  return (
    <div ref={ref} className={className}>
      {isIntersecting ? (
        <Suspense fallback={fallback}>
          {children}
        </Suspense>
      ) : (
        fallback
      )}
    </div>
  );
};

/**
 * HOC for lazy loading components
 */
export const withLazyLoad = <P extends object>(
  Component: React.ComponentType<P>,
  fallback?: React.ReactNode
) => {
  return React.forwardRef<any, P>((props, ref) => (
    <LazyLoader fallback={fallback}>
      <Component {...props} ref={ref} />
    </LazyLoader>
  ));
};

/**
 * Lazy loading container with intersection observer
 */
export const LazyContainer: React.FC<{
  children: React.ReactNode;
  height?: string;
  className?: string;
  fallback?: React.ReactNode;
}> = ({ children, height = '200px', className = '', fallback }) => {
  const { ref, isIntersecting } = useLazyLoad();

  return (
    <div
      ref={ref}
      className={className}
      style={{ minHeight: height }}
    >
      {isIntersecting ? children : (fallback || <Skeleton />)}
    </div>
  );
};

/**
 * Lazy loading for heavy components
 */
export const LazyComponent: React.FC<{
  loader: () => Promise<{ default: React.ComponentType<any> }>;
  props?: any;
  fallback?: React.ReactNode;
  errorFallback?: React.ReactNode;
}> = ({ loader, props = {}, fallback, errorFallback }) => {
  const LazyComp = lazy(loader);
  
  return (
    <Suspense fallback={fallback || <Skeleton />}>
      <ErrorBoundary fallback={errorFallback}>
        <LazyComp {...props} />
      </ErrorBoundary>
    </Suspense>
  );
};

/**
 * Error boundary for lazy components
 */
class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode; fallback?: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error('Lazy component error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700 text-sm">Ошибка загрузки компонента</p>
        </div>
      );
    }

    return this.props.children;
  }
}

export default LazyLoader;