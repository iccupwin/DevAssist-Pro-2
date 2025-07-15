import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthPage } from './pages/AuthPage';
import Dashboard from './pages/Dashboard';
import MainPage from './pages/MainPage';
import ProfilePage from './pages/ProfilePage';
import LandingPage from './pages/LandingPage';

const App: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<string>('dashboard');

  const handleStepChange = (step: string) => {
    setCurrentStep(step);
  };

  return (
    <div className="App">
      <Routes>
        {/* Landing page */}
        <Route path="/" element={<LandingPage />} />
        
        {/* Dashboard - main portal page */}
        <Route path="/dashboard" element={<Dashboard />} />
        
        {/* KP Analyzer module */}
        <Route 
          path="/kp-analyzer" 
          element={
            <MainPage 
              currentStep={currentStep} 
              onStepChange={handleStepChange} 
            />
          } 
        />
        
        {/* Profile page */}
        <Route path="/profile" element={<ProfilePage />} />
        
        {/* Auth routes */}
        <Route path="/auth/*" element={<AuthPage />} />
        
        {/* Future modules */}
        <Route path="/tz-generator" element={<div className="p-8 text-center text-gray-500">ТЗ Генератор - Скоро...</div>} />
        <Route path="/project-evaluation" element={<div className="p-8 text-center text-gray-500">Оценка проектов - Скоро...</div>} />
        <Route path="/marketing-planner" element={<div className="p-8 text-center text-gray-500">Маркетинг планировщик - Скоро...</div>} />
        <Route path="/knowledge-base" element={<div className="p-8 text-center text-gray-500">База знаний - Скоро...</div>} />
        
        {/* Catch all route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
};

export default App;