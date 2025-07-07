import React, { useState, useEffect } from 'react';
import HeaderImproved from '../components/main/HeaderImproved';
import FileUploadSection from '../components/main/FileUploadSection';
import AnalysisSection from '../components/main/AnalysisSection';
import ComparisonSection from '../components/main/ComparisonSection';
import ReportSection from '../components/main/ReportSection';
import BentoSection from '../components/main/BentoSection';
import { AnalysisResult } from '../services/apiClient';

interface MainPageProps {
  currentStep: string;
  onStepChange: (step: string) => void;
}

const MainPage: React.FC<MainPageProps> = ({ currentStep, onStepChange }) => {
  const [uploadedFiles, setUploadedFiles] = useState<{
    tz_file: File | null;
    kp_files: File[];
    additional_files: File[];
  }>({
    tz_file: null,
    kp_files: [],
    additional_files: []
  });

  const [analysisResults, setAnalysisResults] = useState<AnalysisResult[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('claude-3-5-sonnet-20240620');
  const [selectedComparisonModel, setSelectedComparisonModel] = useState<string>('gpt-4o');
  const [selectedReportModel, setSelectedReportModel] = useState<string>('gpt-4o');
  const [isDarkMode, setIsDarkMode] = useState(true);

  // Load theme preference from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      setIsDarkMode(savedTheme === 'dark');
    } else {
      // Default to system preference
      setIsDarkMode(window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
  }, []);

  // Save theme preference and apply to document
  useEffect(() => {
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  // Главная страница с навигацией между шагами
  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'dashboard':
        return (
          <BentoSection 
            onStepChange={onStepChange}
            isDarkMode={isDarkMode}
          />
        );
      case 'upload':
        return (
          <FileUploadSection 
            onStepChange={onStepChange}
            uploadedFiles={uploadedFiles}
            setUploadedFiles={setUploadedFiles}
            isDarkMode={isDarkMode}
          />
        );
      case 'analysis':
        return (
          <AnalysisSection 
            onStepChange={onStepChange}
            uploadedFiles={uploadedFiles}
            analysisResults={analysisResults}
            setAnalysisResults={setAnalysisResults}
            selectedModel={selectedModel}
            isDarkMode={isDarkMode}
          />
        );
      case 'comparison':
        return (
          <ComparisonSection 
            onStepChange={onStepChange}
            analysisResults={analysisResults}
            selectedComparisonModel={selectedComparisonModel}
            isDarkMode={isDarkMode}
          />
        );
      case 'report':
        return (
          <ReportSection 
            onStepChange={onStepChange}
            analysisResults={analysisResults}
            selectedReportModel={selectedReportModel}
            isDarkMode={isDarkMode}
          />
        );
      default:
        return (
          <BentoSection 
            onStepChange={onStepChange}
            isDarkMode={isDarkMode}
          />
        );
    }
  };


  return (
    <div 
      className={`min-h-screen transition-colors duration-300 ${
        isDarkMode 
          ? 'bg-black text-white' 
          : 'bg-white text-gray-900'
      }`} 
      style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
    >
      <HeaderImproved 
        currentStep={currentStep} 
        onStepChange={onStepChange}
        selectedModel={selectedModel}
        selectedComparisonModel={selectedComparisonModel}
        onModelChange={setSelectedModel}
        onComparisonModelChange={(model) => {
          setSelectedComparisonModel(model);
          setSelectedReportModel(model);
        }}
        isDarkMode={isDarkMode}
        onToggleTheme={toggleTheme}
      />
      
      {/* Основное содержимое */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`backdrop-blur-sm rounded-2xl shadow-xl p-6 ${
          isDarkMode 
            ? 'bg-white/[0.02] border border-gray-800' 
            : 'bg-black/[0.02] border border-gray-200'
        }`}>
          {renderCurrentStep()}
        </div>
      </main>
    </div>
  );
};

export default MainPage;