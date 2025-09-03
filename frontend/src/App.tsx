import React, { Suspense, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthPage } from './pages/AuthPage';
import LandingPage from './pages/LandingPage';
import CosmicLandingPage from './pages/CosmicLandingPage';
import ProtectedRoute from './components/auth/ProtectedRoute';
import { ThemeProvider } from './contexts/ThemeContext';
import { QueryProvider } from './providers/QueryProvider';
import AuthDebug from './components/debug/AuthDebug';
import ErrorBoundary from './components/ErrorBoundary';
import { ToastProvider } from './contexts/ToastContext';
import { ScreenReaderProvider } from './contexts/ScreenReaderContext';
import { LoadingSpinner } from './components/ui/LoadingSpinner';
import { 
  LazyDashboard, 
  LazyKPAnalyzer, 
  LazyProfilePage, 
  LazyAdminPage,
  preloadCriticalComponents 
} from './components/lazy';
import { GlobalHotkeyProvider, AccessibilityHelper, SkipToContent } from './components/ui';
import ContrastAnalyzer from './components/debug/ContrastAnalyzer';
import ColorSystemValidator from './components/debug/ColorSystemValidator';
import DesignConsistencyAuditor from './components/debug/DesignConsistencyAuditor';

const App: React.FC = () => {

  // Предзагружаем критические компоненты
  useEffect(() => {
    preloadCriticalComponents();
  }, []);

  return (
    <QueryProvider>
      <ThemeProvider>
        <ToastProvider>
          <ScreenReaderProvider>
          <GlobalHotkeyProvider
            onNewAnalysis={() => window.location.href = '/kp-analyzer'}
            onOpenProfile={() => window.location.href = '/profile'}
            onSearch={() => { /* TODO: Implement search functionality */ }}
            onToggleTheme={() => { /* TODO: Implement theme toggle */ }}
          >
            <div className="App">
              <SkipToContent targetId="main-content" />
              <main id="main-content" className="focus:outline-none" tabIndex={-1}>
                <Routes>
              {/* Landing page */}
              <Route path="/" element={<CosmicLandingPage />} />
              <Route path="/landing" element={<LandingPage />} />
              
              {/* Dashboard - main portal page - PROTECTED */}
              <Route path="/dashboard" element={
                <ProtectedRoute requireAuth={true}>
                  <Suspense fallback={<LoadingSpinner />}>
                    <LazyDashboard />
                  </Suspense>
                </ProtectedRoute>
              } />
              
              {/* KP Analyzer module - PROTECTED */}
              <Route path="/kp-analyzer" element={
                <ProtectedRoute requireAuth={true}>
                  <Suspense fallback={<LoadingSpinner />}>
                    <LazyKPAnalyzer />
                  </Suspense>
                </ProtectedRoute>
              } />
              
              {/* Profile page - PROTECTED */}
              <Route path="/profile" element={
                <ProtectedRoute requireAuth={true}>
                  <Suspense fallback={<LoadingSpinner />}>
                    <LazyProfilePage />
                  </Suspense>
                </ProtectedRoute>
              } />
              
              {/* Auth routes - PUBLIC (redirect if already logged in) */}
              <Route path="/auth/*" element={
                <ProtectedRoute requireAuth={false}>
                  <AuthPage />
                </ProtectedRoute>
              } />
              
              {/* Admin panel - PROTECTED (admin only) */}
              <Route path="/admin" element={
                <ProtectedRoute requireAuth={true} allowedRoles={['admin']}>
                  <ErrorBoundary>
                    <Suspense fallback={<LoadingSpinner />}>
                      <LazyAdminPage />
                    </Suspense>
                  </ErrorBoundary>
                </ProtectedRoute>
              } />
              
              {/* Future modules - PROTECTED */}
              <Route path="/tz-generator" element={
                <ProtectedRoute requireAuth={true}>
                  <div className="p-8 text-center text-gray-500">ТЗ Генератор - Скоро...</div>
                </ProtectedRoute>
              } />
              <Route path="/project-evaluation" element={
                <ProtectedRoute requireAuth={true}>
                  <div className="p-8 text-center text-gray-500">Оценка проектов - Скоро...</div>
                </ProtectedRoute>
              } />
              <Route path="/marketing-planner" element={
                <ProtectedRoute requireAuth={true}>
                  <div className="p-8 text-center text-gray-500">Маркетинг планировщик - Скоро...</div>
                </ProtectedRoute>
              } />
              <Route path="/knowledge-base" element={
                <ProtectedRoute requireAuth={true}>
                  <div className="p-8 text-center text-gray-500">База знаний - Скоро...</div>
                </ProtectedRoute>
              } />
              
                {/* Catch all route */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
            
            {/* Debug component - only in development */}
            {process.env.NODE_ENV === 'development' && <AuthDebug />}
            
            {/* Помощник доступности */}
            <AccessibilityHelper showHelper={process.env.NODE_ENV === 'development'} />
            
            {/* Анализатор контрастности */}
            <ContrastAnalyzer isVisible={process.env.NODE_ENV === 'development'} position="top-right" />
            
            {/* Валидатор цветовой системы */}
            <ColorSystemValidator isVisible={process.env.NODE_ENV === 'development'} position="bottom-left" />
            
            {/* Аудитор единообразия дизайна */}
            <DesignConsistencyAuditor isVisible={process.env.NODE_ENV === 'development'} position="bottom-right" />
          </div>
        </GlobalHotkeyProvider>
      </ScreenReaderProvider>
    </ToastProvider>
  </ThemeProvider>
</QueryProvider>
  );
};

export default App;