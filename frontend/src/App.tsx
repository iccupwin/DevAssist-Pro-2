import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthPage } from './pages/AuthPage';
import Dashboard from './pages/Dashboard';
import MainPage from './pages/MainPage';
import KPAnalyzer from './pages/KPAnalyzer';
import ProfilePage from './pages/ProfilePage';
import LandingPage from './pages/LandingPage';
import CosmicLandingPage from './pages/CosmicLandingPage';
import AdminPage from './pages/AdminPage';
import ProtectedRoute from './components/auth/ProtectedRoute';
import { ThemeProvider } from './contexts/ThemeContext';
import { QueryProvider } from './providers/QueryProvider';
import AuthDebug from './components/debug/AuthDebug';
import ErrorBoundary from './components/ErrorBoundary';
import { ToastProvider } from './contexts/ToastContext';

const App: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<string>('dashboard');

  const handleStepChange = (step: string) => {
    setCurrentStep(step);
  };

  return (
    <QueryProvider>
      <ThemeProvider>
        <ToastProvider>
          <div className="App">
            <Routes>
              {/* Landing page */}
              <Route path="/" element={<CosmicLandingPage />} />
              <Route path="/landing" element={<LandingPage />} />
              
              {/* Dashboard - main portal page - PROTECTED */}
              <Route path="/dashboard" element={
                <ProtectedRoute requireAuth={true}>
                  <Dashboard />
                </ProtectedRoute>
              } />
              
              {/* KP Analyzer module - PROTECTED */}
              <Route path="/kp-analyzer" element={
                <ProtectedRoute requireAuth={true}>
                  <KPAnalyzer />
                </ProtectedRoute>
              } />
              
              {/* Profile page - PROTECTED */}
              <Route path="/profile" element={
                <ProtectedRoute requireAuth={true}>
                  <ProfilePage />
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
                    <AdminPage />
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
            
            {/* Debug component - only in development */}
            {process.env.NODE_ENV === 'development' && <AuthDebug />}
          </div>
        </ToastProvider>
      </ThemeProvider>
    </QueryProvider>
  );
};

export default App;