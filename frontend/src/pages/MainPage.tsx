import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FileText, 
  Upload, 
  Brain, 
  BarChart3, 
  FileOutput,
  ArrowLeft,
  Sun,
  Moon,
  User,
  LogOut,
  ChevronRight,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
const logoLight = '/devent-logo.png';
const logoDark = '/devent-logo-white1.png';
import FileUploadSection from '../components/main/FileUploadSection';
import AnalysisSection from '../components/main/AnalysisSection';
import ComparisonSection from '../components/main/ComparisonSection';
import ReportSection from '../components/main/ReportSection';
import { AnalysisResult } from '../services/apiClient';
import { FileUploadResponse } from '../services/fileService';
import { UploadedFile, extractFilesFromUploaded } from '../utils/fileAdapters';

interface MainPageProps {
  currentStep: string;
  onStepChange: (step: string) => void;
}

const MainPage: React.FC<MainPageProps> = ({ currentStep, onStepChange }) => {
  const navigate = useNavigate();
  const [uploadedFiles, setUploadedFiles] = useState<{
    tz_file: UploadedFile | null;
    kp_files: UploadedFile[];
    additional_files: UploadedFile[];
  }>({
    tz_file: null,
    kp_files: [],
    additional_files: []
  });

  const [analysisResults, setAnalysisResults] = useState<AnalysisResult[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('claude-3-5-sonnet-20240620');
  const [selectedComparisonModel, setSelectedComparisonModel] = useState<string>('gpt-4o');
  const [selectedReportModel, setSelectedReportModel] = useState<string>('gpt-4o');
  const [isProcessing, setIsProcessing] = useState(false);
  const { isDarkMode, toggleTheme } = useTheme();

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/');
  };

  const steps = [
    { 
      id: 'upload', 
      title: 'Загрузка', 
      icon: Upload, 
      completed: uploadedFiles.tz_file && 
                 uploadedFiles.kp_files.length > 0 && 
                 !uploadedFiles.tz_file.uploading &&
                 !uploadedFiles.tz_file.error &&
                 uploadedFiles.kp_files.every(f => !f.uploading && !f.error)
    },
    { id: 'analysis', title: 'Анализ', icon: Brain, completed: analysisResults.length > 0 },
    { id: 'comparison', title: 'Сравнение', icon: BarChart3, completed: false },
    { id: 'report', title: 'Отчет', icon: FileOutput, completed: false }
  ];

  const currentStepIndex = steps.findIndex(step => step.id === currentStep);

  const handleStepChange = (step: string) => {
    if (step === 'upload' || 
        (step === 'analysis' && 
         uploadedFiles.tz_file && 
         uploadedFiles.kp_files.length > 0 &&
         !uploadedFiles.tz_file.uploading &&
         !uploadedFiles.tz_file.error &&
         uploadedFiles.kp_files.every(f => !f.uploading && !f.error)
        ) ||
        (step === 'comparison' && analysisResults.length > 0) ||
        (step === 'report' && analysisResults.length > 0)) {
      onStepChange(step);
    }
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
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
            uploadedFiles={extractFilesFromUploaded(uploadedFiles)}
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
          <FileUploadSection 
            onStepChange={onStepChange}
            uploadedFiles={uploadedFiles}
            setUploadedFiles={setUploadedFiles}
            isDarkMode={isDarkMode}
          />
        );
    }
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'
    }`}>
      {/* Header */}
      <header className={`border-b transition-colors duration-300 ${
        isDarkMode ? 'border-gray-800 bg-gray-900' : 'border-gray-200 bg-white'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/dashboard')}
                className={`p-2 rounded-lg transition-colors ${
                  isDarkMode 
                    ? 'hover:bg-gray-800 text-gray-400 hover:text-white' 
                    : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
                }`}
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              
              <div className="flex items-center space-x-3">
                <img 
                  src={isDarkMode ? logoDark : logoLight} 
                  alt="DevAssist Pro" 
                  className="w-8 h-8" 
                />
                <h1 className="text-xl font-semibold">КП Анализатор</h1>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={toggleTheme}
                className={`p-2 rounded-lg transition-colors ${
                  isDarkMode 
                    ? 'hover:bg-gray-800 text-gray-400 hover:text-white' 
                    : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
                }`}
              >
                {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              
              <button
                onClick={() => navigate('/profile')}
                className={`p-2 rounded-lg transition-colors ${
                  isDarkMode 
                    ? 'hover:bg-gray-800 text-gray-400 hover:text-white' 
                    : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
                }`}
              >
                <User className="w-5 h-5" />
              </button>
              
              <button
                onClick={handleLogout}
                className={`p-2 rounded-lg transition-colors ${
                  isDarkMode 
                    ? 'hover:bg-gray-800 text-gray-400 hover:text-white' 
                    : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
                }`}
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Progress Steps */}
      <div className={`border-b transition-colors duration-300 ${
        isDarkMode ? 'border-gray-800 bg-gray-900' : 'border-gray-200 bg-white'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            {steps.map((step, index) => {
              const StepIcon = step.icon;
              const isActive = currentStep === step.id;
              const isCompleted = step.completed;
              const isAccessible = index === 0 || steps[index - 1].completed;
              
              return (
                <div key={step.id} className="flex items-center">
                  <button
                    onClick={() => handleStepChange(step.id)}
                    disabled={!isAccessible}
                    className={`flex items-center space-x-2 p-2 rounded-lg transition-colors ${
                      isActive 
                        ? 'bg-blue-600 text-white' 
                        : isCompleted
                          ? isDarkMode 
                            ? 'bg-green-600 text-white hover:bg-green-700' 
                            : 'bg-green-100 text-green-800 hover:bg-green-200'
                          : isAccessible
                            ? isDarkMode 
                              ? 'hover:bg-gray-800 text-gray-400 hover:text-white' 
                              : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
                            : 'opacity-50 cursor-not-allowed text-gray-400'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center">
                      {isCompleted ? (
                        <CheckCircle className="w-5 h-5" />
                      ) : (
                        <StepIcon className="w-5 h-5" />
                      )}
                    </div>
                    <span className="text-sm font-medium">{step.title}</span>
                  </button>
                  
                  {index < steps.length - 1 && (
                    <ChevronRight className={`w-5 h-5 mx-2 ${
                      isDarkMode ? 'text-gray-600' : 'text-gray-400'
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Loading Overlay */}
      {isProcessing && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className={`rounded-lg p-8 max-w-md mx-auto ${
            isDarkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
            <div className="flex items-center space-x-4">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent"></div>
              <div>
                <h3 className="text-lg font-semibold">Обработка...</h3>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Пожалуйста, подождите
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className={`rounded-lg border transition-colors duration-300 ${
          isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          {renderCurrentStep()}
        </div>
      </main>
    </div>
  );
};

export default MainPage;