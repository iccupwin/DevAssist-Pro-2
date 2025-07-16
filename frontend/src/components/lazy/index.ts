import { lazy } from 'react';

// Lazy-loaded страницы
export const LazyDashboard = lazy(() => import('../../pages/Dashboard'));
export const LazyKPAnalyzer = lazy(() => import('../../pages/KPAnalyzer'));
export const LazyAdminPage = lazy(() => import('../../pages/AdminPage'));
export const LazyProfilePage = lazy(() => import('../../pages/ProfilePage'));

// Lazy-loaded компоненты КП анализатора
export const LazyKPAnalyzerMain = lazy(() => import('../kpAnalyzer/KPAnalyzerMain'));
export const LazyKPDetailedAnalysisResults = lazy(() => import('../kpAnalyzer/KPDetailedAnalysisResults'));
export const LazyKPDetailedReport = lazy(() => import('../kpAnalyzer/KPDetailedReport'));
export const LazyPDFExportDialog = lazy(() => import('../kpAnalyzer/PDFExportDialog'));

// Lazy-loaded компоненты визуализации
export const LazyResultsVisualization = lazy(() => import('../visualization/ResultsVisualization'));
export const LazyBarChart = lazy(() => import('../visualization/BarChart'));
export const LazyPieChart = lazy(() => import('../visualization/PieChart'));
export const LazyRadarChart = lazy(() => import('../visualization/RadarChart'));

// Lazy-loaded компоненты администрирования
export const LazyAdminDashboard = lazy(() => import('../admin/AdminDashboard'));
export const LazyUserManagement = lazy(() => import('../admin/UserManagement'));
export const LazySystemSettings = lazy(() => import('../admin/SystemSettings'));
export const LazyAIManagement = lazy(() => import('../admin/AIManagement'));
export const LazyBackendManagement = lazy(() => import('../admin/BackendManagement'));

// Lazy-loaded компоненты профиля
export const LazyProfileSection = lazy(() => import('../profile/ProfileSection'));
export const LazyBillingSection = lazy(() => import('../profile/BillingSection'));
export const LazySecuritySection = lazy(() => import('../profile/SecuritySection'));

// Lazy-loaded компоненты документов
export const LazyDocumentList = lazy(() => import('../documents/DocumentList'));
export const LazyDocumentPreview = lazy(() => import('../documents/DocumentPreview'));

// Lazy-loaded компоненты таблиц
export const LazyInteractiveTable = lazy(() => import('../tables/InteractiveTable'));
export const LazyComparisonTable = lazy(() => import('../tables/ComparisonTable'));
export const LazyInteractiveComparison = lazy(() => import('../tables/InteractiveComparison'));

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
    import('../visualization/ResultsVisualization'),
    import('../visualization/BarChart'),
    import('../visualization/PieChart')
  ]);
};

export default {
  LazyDashboard,
  LazyKPAnalyzer,
  LazyAdminPage,
  LazyProfilePage,
  LazyKPAnalyzerMain,
  LazyKPDetailedAnalysisResults,
  LazyKPDetailedReport,
  LazyResultsVisualization,
  LazyAdminDashboard,
  LazyUserManagement,
  LazySystemSettings,
  preloadCriticalComponents,
  preloadAdminComponents,
  preloadVisualizationComponents
};