import { lazy } from 'react';

// Lazy-loaded страницы
export const LazyDashboard = lazy(() => import('../../pages/Dashboard'));
export const LazyKPAnalyzer = lazy(() => import('../../pages/KPAnalyzer'));
export const LazyAdminPage = lazy(() => import('../../pages/AdminPage'));
export const LazyProfilePage = lazy(() => import('../../pages/ProfilePage'));

// Lazy-loaded компоненты КП анализатора
export const LazyKPAnalyzerMain = lazy(() => import('../kpAnalyzer/KPAnalyzerMain'));

// Lazy-loaded компоненты визуализации
export const LazyResultsVisualization = lazy(() => import('../visualization/ResultsVisualization'));

// Lazy-loaded компоненты администрирования
export const LazyAdminDashboard = lazy(() => import('../admin/AdminDashboard'));
export const LazyUserManagement = lazy(() => import('../admin/UserManagement'));
export const LazySystemSettings = lazy(() => import('../admin/SystemSettings'));
export const LazyAIManagement = lazy(() => import('../admin/AIManagement'));
export const LazyBackendManagement = lazy(() => import('../admin/BackendManagement'));


// Предзагрузка критических компонентов
export const preloadCriticalComponents = async () => {
  // Предзагружаем основные страницы
  await Promise.all([
    import('../../pages/Dashboard'),
    import('../../pages/KPAnalyzer'),
    import('../kpAnalyzer/KPAnalyzerMain')
  ]);
};

// Предзагрузка административных компонентов
export const preloadAdminComponents = async () => {
  await Promise.all([
    import('../../pages/AdminPage'),
    import('../admin/AdminDashboard'),
    import('../admin/UserManagement')
  ]);
};

// Предзагрузка компонентов визуализации
export const preloadVisualizationComponents = async () => {
  await Promise.all([
    import('../visualization/ResultsVisualization')
  ]);
};

const lazyComponents = {
  LazyDashboard,
  LazyKPAnalyzer,
  LazyAdminPage,
  LazyProfilePage,
  LazyKPAnalyzerMain,
  LazyResultsVisualization,
  LazyAdminDashboard,
  LazyUserManagement,
  LazySystemSettings,
  LazyAIManagement,
  LazyBackendManagement,
  preloadCriticalComponents,
  preloadAdminComponents,
  preloadVisualizationComponents
};

export default lazyComponents;