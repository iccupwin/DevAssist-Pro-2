import React, { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import LoadingSpinner from '../ui/LoadingSpinner';

// Lazy load main page components for better performance
const Dashboard = lazy(() => import('../../pages/Dashboard'));
const KPAnalyzer = lazy(() => import('../../pages/KPAnalyzer'));
const AdminPage = lazy(() => import('../../pages/AdminPage'));
const ProfilePage = lazy(() => import('../../pages/ProfilePage'));
const MainPage = lazy(() => import('../../pages/MainPage'));

// Lazy load component groups
const KPAnalyzerMain = lazy(() => import('../kpAnalyzer/KPAnalyzerMain'));
const ResultsVisualization = lazy(() => import('../visualization/ResultsVisualization'));

// Custom error boundary for lazy loading
class LazyLoadErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): { hasError: boolean } {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Lazy loading error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-slate-800 mb-2">
              Ошибка загрузки компонента
            </h2>
            <p className="text-slate-600 mb-4">
              Попробуйте обновить страницу
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors"
            >
              Обновить страницу
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Loading component with enhanced UX
const PageLoader: React.FC = () => (
  <div className="flex items-center justify-center min-h-[60vh]">
    <div className="text-center">
      <LoadingSpinner size="lg" />
      <p className="mt-4 text-slate-600">Загрузка...</p>
    </div>
  </div>
);

// Main lazy routes component
export const LazyRoutes: React.FC = () => {
  return (
    <LazyLoadErrorBoundary>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<MainPage currentStep="upload" onStepChange={() => {}} />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route 
            path="/kp-analyzer" 
            element={
              <Suspense fallback={<PageLoader />}>
                <KPAnalyzer />
              </Suspense>
            } 
          />
          <Route 
            path="/admin" 
            element={
              <Suspense fallback={<PageLoader />}>
                <AdminPage />
              </Suspense>
            } 
          />
          <Route 
            path="/profile" 
            element={
              <Suspense fallback={<PageLoader />}>
                <ProfilePage />
              </Suspense>
            } 
          />
        </Routes>
      </Suspense>
    </LazyLoadErrorBoundary>
  );
};

// HOC for lazy loading individual components
export const withLazyLoading = <T extends object>(
  importFn: () => Promise<{ default: React.ComponentType<T> }>,
  fallback?: React.ReactNode
) => {
  const LazyComponent = lazy(importFn);
  
  return (props: T) => (
    <LazyLoadErrorBoundary>
      <Suspense fallback={fallback || <LoadingSpinner />}>
        <LazyComponent {...(props as any)} />
      </Suspense>
    </LazyLoadErrorBoundary>
  );
};

// Component preloader for critical routes
export const preloadComponent = (
  importFn: () => Promise<{ default: React.ComponentType<any> }>
) => {
  // Preload on mouse enter for better UX
  return {
    onMouseEnter: () => {
      importFn().catch(error => {
        console.warn('Component preload failed:', error);
      });
    },
  };
};

export default LazyRoutes;