import React, { useState, useEffect } from 'react';
import { Brain, ArrowLeft, ArrowRight, AlertCircle, CheckCircle, Clock, Zap, FileText, Users, Settings } from 'lucide-react';
import { apiService } from '../../services/apiClient';
import { AnalysisResult } from '../../services/apiClient';
import { getModelById } from '../../config/models';

interface AnalysisSectionProps {
  onStepChange: (step: string) => void;
  uploadedFiles: {
    tz_file: File | null;
    kp_files: File[];
    additional_files: File[];
  };
  analysisResults: AnalysisResult[];
  setAnalysisResults: React.Dispatch<React.SetStateAction<AnalysisResult[]>>;
  selectedModel: string;
  isDarkMode: boolean;
}

const AnalysisSection: React.FC<AnalysisSectionProps> = ({ 
  onStepChange, 
  uploadedFiles, 
  analysisResults, 
  setAnalysisResults, 
  selectedModel,
  isDarkMode
}) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentStep, setCurrentStep] = useState('');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [analysisStarted, setAnalysisStarted] = useState(false);

  // Автоматически начинаем анализ при загрузке компонента
  useEffect(() => {
    if (!analysisStarted && uploadedFiles.tz_file && uploadedFiles.kp_files.length > 0) {
      setAnalysisStarted(true);
      startAnalysis();
    }
  }, [uploadedFiles, analysisStarted]);

  const startAnalysis = async () => {
    setIsAnalyzing(true);
    setError(null);
    setProgress(0);
    
    try {
      // Шаг 1: Загрузка файлов
      setCurrentStep('Загрузка файлов на сервер...');
      setProgress(10);
      
      const uploadResponse = await apiService.uploadFiles({
        tzFile: uploadedFiles.tz_file!,
        kpFiles: uploadedFiles.kp_files,
        additionalFiles: uploadedFiles.additional_files
      });
      
      if (!uploadResponse.success) {
        throw new Error(uploadResponse.error || 'Ошибка загрузки файлов');
      }
      
      setProgress(20);
      
      // Шаг 2: Анализ каждого КП
      const results: AnalysisResult[] = [];
      const totalKP = uploadedFiles.kp_files.length;
      
      for (let i = 0; i < totalKP; i++) {
        setCurrentStep(`Анализ КП ${i + 1} из ${totalKP}: ${uploadedFiles.kp_files[i].name}`);
        setProgress(20 + (i / totalKP) * 60);
        
        const analysisResponse = await apiService.analyzeKP(
          uploadResponse.data.tz_file!.filePath,
          uploadResponse.data.kp_files[i].filePath,
          uploadResponse.data.additional_files.map((f: any) => f.filePath),
          selectedModel
        );
        
        if (!analysisResponse.success) {
          throw new Error(`Ошибка анализа КП ${i + 1}: ${analysisResponse.error}`);
        }
        
        results.push(analysisResponse.data);
      }
      
      setProgress(90);
      setCurrentStep('Завершение анализа...');
      
      // Небольшая задержка для показа завершения
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setProgress(100);
      setCurrentStep('Анализ завершен!');
      setAnalysisResults(results);
      
      // Автоматически переходим к следующему шагу через 2 секунды
      setTimeout(() => {
        onStepChange('comparison');
      }, 2000);
      
    } catch (error) {
      console.error('Analysis error:', error);
      setError(error instanceof Error ? error.message : 'Произошла ошибка при анализе');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const retryAnalysis = () => {
    setAnalysisStarted(false);
    setError(null);
  };

  const currentModel = getModelById(selectedModel);

  return (
    <div className="space-y-6">
      <div className="bg-white/60 backdrop-blur-md rounded-2xl border border-white/20 shadow-xl p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Brain className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Анализ документов
          </h2>
          <p className="text-gray-600">AI обрабатывает документы и создает детальный анализ</p>
          
          {/* Current Model Info */}
          <div className="mt-4 inline-flex items-center space-x-2 px-3 py-1.5 bg-purple-100/80 backdrop-blur-sm rounded-full">
            <Settings className="w-4 h-4 text-purple-600" />
            <span className="text-sm font-medium text-purple-800">
              Модель: {currentModel?.name || selectedModel}
            </span>
          </div>
        </div>
        
        {/* Показываем ошибку если есть */}
        {error && (
          <div className="bg-red-50/80 backdrop-blur-sm border border-red-200 rounded-2xl p-6 mb-8">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center mr-4">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <div className="flex-1">
                <p className="text-lg font-semibold text-red-800">Ошибка анализа</p>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
            <button
              onClick={retryAnalysis}
              className="mt-4 inline-flex items-center px-6 py-3 bg-red-600 text-white text-sm font-semibold rounded-xl hover:bg-red-700 transition-all duration-200 shadow-md hover:shadow-lg"
            >
              <AlertCircle className="w-4 h-4 mr-2" />
              Повторить анализ
            </button>
          </div>
        )}
        
        {/* Показываем прогресс если анализ идет */}
        {isAnalyzing && (
          <div className="bg-blue-50/80 backdrop-blur-sm border border-blue-200 rounded-2xl p-6 mb-8">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center mr-4">
                <Zap className="w-6 h-6 text-blue-600 animate-pulse" />
              </div>
              <div className="flex-1">
                <p className="text-lg font-semibold text-blue-800">{currentStep}</p>
                <p className="text-sm text-blue-600">AI модель обрабатывает документы...</p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="bg-blue-200/50 rounded-full h-3 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-blue-600 to-purple-600 h-3 rounded-full transition-all duration-500 ease-out" 
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-blue-600 font-medium">{Math.round(progress)}% завершено</span>
                <span className="text-blue-600">{isAnalyzing ? 'В процессе...' : 'Завершено'}</span>
              </div>
            </div>
          </div>
        )}
        
        {/* Показываем успешное завершение */}
        {!isAnalyzing && progress === 100 && !error && (
          <div className="bg-green-50/80 backdrop-blur-sm border border-green-200 rounded-2xl p-6 mb-8">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center mr-4">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-lg font-semibold text-green-800">Анализ завершен успешно!</p>
                <p className="text-sm text-green-700 mt-1">Переход к сравнению результатов...</p>
              </div>
            </div>
          </div>
        )}
        
        <div className="space-y-6">
          {/* Детальный прогресс анализа */}
          <div className="bg-white/40 backdrop-blur-sm rounded-2xl border border-white/20 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Clock className="w-5 h-5 mr-2 text-blue-600" />
              Ход выполнения
            </h3>
            <div className="space-y-4">
              <div className="flex items-center p-3 rounded-xl bg-white/50">
                <div className={`w-10 h-10 rounded-xl mr-4 flex items-center justify-center ${
                  progress >= 20 ? 'bg-green-100' : progress >= 10 ? 'bg-yellow-100' : 'bg-gray-100'
                }`}>
                  {progress >= 20 ? <CheckCircle className="w-5 h-5 text-green-600" /> : 
                   progress >= 10 ? <Zap className="w-5 h-5 text-yellow-600 animate-pulse" /> : 
                   <Clock className="w-5 h-5 text-gray-400" />}
                </div>
                <div className="flex-1">
                  <span className="font-medium text-gray-900">Загрузка и обработка файлов</span>
                  <p className="text-sm text-gray-600">Подготовка документов для AI анализа</p>
                </div>
                <span className={`text-sm font-medium px-3 py-1 rounded-full ${
                  progress >= 20 ? 'bg-green-100 text-green-700' : 
                  progress >= 10 ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-500'
                }`}>
                  {progress >= 20 ? 'Завершено' : progress >= 10 ? 'В процессе' : 'Ожидание'}
                </span>
              </div>
              <div className="flex items-center p-3 rounded-xl bg-white/50">
                <div className={`w-10 h-10 rounded-xl mr-4 flex items-center justify-center ${
                  progress >= 80 ? 'bg-green-100' : progress >= 20 ? 'bg-yellow-100' : 'bg-gray-100'
                }`}>
                  {progress >= 80 ? <CheckCircle className="w-5 h-5 text-green-600" /> : 
                   progress >= 20 ? <Brain className="w-5 h-5 text-yellow-600 animate-pulse" /> : 
                   <Clock className="w-5 h-5 text-gray-400" />}
                </div>
                <div className="flex-1">
                  <span className="font-medium text-gray-900">Анализ коммерческих предложений</span>
                  <p className="text-sm text-gray-600">AI сравнивает КП с техническим заданием</p>
                </div>
                <span className={`text-sm font-medium px-3 py-1 rounded-full ${
                  progress >= 80 ? 'bg-green-100 text-green-700' : 
                  progress >= 20 ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-500'
                }`}>
                  {progress >= 80 ? 'Завершено' : progress >= 20 ? 'В процессе' : 'Ожидание'}
                </span>
              </div>
              <div className="flex items-center p-3 rounded-xl bg-white/50">
                <div className={`w-10 h-10 rounded-xl mr-4 flex items-center justify-center ${
                  progress >= 100 ? 'bg-green-100' : progress >= 90 ? 'bg-yellow-100' : 'bg-gray-100'
                }`}>
                  {progress >= 100 ? <CheckCircle className="w-5 h-5 text-green-600" /> : 
                   progress >= 90 ? <FileText className="w-5 h-5 text-yellow-600 animate-pulse" /> : 
                   <Clock className="w-5 h-5 text-gray-400" />}
                </div>
                <div className="flex-1">
                  <span className="font-medium text-gray-900">Формирование результатов</span>
                  <p className="text-sm text-gray-600">Создание итогового отчета и рекомендаций</p>
                </div>
                <span className={`text-sm font-medium px-3 py-1 rounded-full ${
                  progress >= 100 ? 'bg-green-100 text-green-700' : 
                  progress >= 90 ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-500'
                }`}>
                  {progress >= 100 ? 'Завершено' : progress >= 90 ? 'В процессе' : 'Ожидание'}
                </span>
              </div>
            </div>
          </div>

          {/* Обрабатываемые файлы */}
          <div className="bg-blue-50/80 backdrop-blur-sm rounded-2xl border border-blue-200 p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center">
              <FileText className="w-5 h-5 mr-2" />
              Обрабатываемые файлы
            </h3>
            <div className="space-y-3">
              {uploadedFiles.tz_file && (
                <div className="flex items-center p-3 bg-white/60 rounded-xl">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                    <FileText className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <span className="font-medium text-gray-900">ТЗ: {uploadedFiles.tz_file.name}</span>
                    <p className="text-sm text-gray-600">Техническое задание</p>
                  </div>
                </div>
              )}
              {uploadedFiles.kp_files.map((file, index) => (
                <div key={index} className="flex items-center p-3 bg-white/60 rounded-xl">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                    <FileText className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <span className="font-medium text-gray-900">КП {index + 1}: {file.name}</span>
                    <p className="text-sm text-gray-600">Коммерческое предложение</p>
                  </div>
                </div>
              ))}
              {uploadedFiles.additional_files.map((file, index) => (
                <div key={`additional-${index}`} className="flex items-center p-3 bg-white/60 rounded-xl">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center mr-3">
                    <FileText className="w-5 h-5 text-gray-600" />
                  </div>
                  <div>
                    <span className="font-medium text-gray-900">Доп. файл: {file.name}</span>
                    <p className="text-sm text-gray-600">Дополнительная информация</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Результаты анализа */}
          {analysisResults.length > 0 && (
            <div className="bg-white/40 backdrop-blur-sm rounded-2xl border border-white/20 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <CheckCircle className="w-5 h-5 mr-2 text-green-600" />
                Результаты анализа
              </h3>
              <div className="space-y-4">
                {analysisResults.map((result, index) => (
                  <div key={index} className="bg-white/60 backdrop-blur-sm rounded-xl border border-white/20 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                          <Users className="w-5 h-5 text-blue-600" />
                        </div>
                        <span className="text-lg font-semibold text-gray-900">{result.company_name}</span>
                      </div>
                      <span className={`px-3 py-1.5 text-sm font-semibold rounded-full ${
                        result.comparison_result.compliance_score >= 80 ? 'bg-green-100 text-green-800' :
                        result.comparison_result.compliance_score >= 60 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {result.comparison_result.compliance_score}% соответствие
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div className="bg-white/50 rounded-lg p-3">
                        <p className="font-medium text-gray-900 mb-1">Технологии</p>
                        <p className="text-gray-600">{result.tech_stack}</p>
                      </div>
                      <div className="bg-white/50 rounded-lg p-3">
                        <p className="font-medium text-gray-900 mb-1">Стоимость</p>
                        <p className="text-gray-600">{result.pricing}</p>
                      </div>
                      <div className="bg-white/50 rounded-lg p-3">
                        <p className="font-medium text-gray-900 mb-1">Сроки</p>
                        <p className="text-gray-600">{result.timeline}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Промежуточные результаты во время анализа */}
          {isAnalyzing && (
            <div className="bg-purple-50/80 backdrop-blur-sm rounded-2xl border border-purple-200 p-6">
              <h3 className="text-lg font-semibold text-purple-900 mb-4 flex items-center">
                <Brain className="w-5 h-5 mr-2" />
                Текущий статус
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white/60 rounded-xl p-4">
                  <p className="font-medium text-gray-900 mb-2">AI Модель</p>
                  <p className="text-sm text-gray-600">{selectedModel}</p>
                </div>
                <div className="bg-white/60 rounded-xl p-4">
                  <p className="font-medium text-gray-900 mb-2">Прогресс КП</p>
                  <p className="text-sm text-gray-600">{analysisResults.length} из {uploadedFiles.kp_files.length} обработано</p>
                </div>
                <div className="bg-white/60 rounded-xl p-4">
                  <p className="font-medium text-gray-900 mb-2">Дополнительно</p>
                  <p className="text-sm text-gray-600">{uploadedFiles.additional_files.length} доп. файлов</p>
                </div>
                <div className="bg-white/60 rounded-xl p-4">
                  <p className="font-medium text-gray-900 mb-2">Текущая задача</p>
                  <p className="text-sm text-gray-600">{currentStep}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Навигационные кнопки */}
        <div className="mt-10 flex justify-between items-center">
          <button
            onClick={() => onStepChange('upload')}
            className="flex items-center px-6 py-3 bg-white/60 backdrop-blur-sm border border-white/20 rounded-xl text-gray-700 hover:bg-white/80 transition-all duration-200 shadow-md hover:shadow-lg"
            disabled={isAnalyzing}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Назад к загрузке
          </button>
          
          <button
            onClick={() => onStepChange('comparison')}
            className="flex items-center px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg font-semibold"
            disabled={isAnalyzing && analysisResults.length === 0}
          >
            К сравнению
            <ArrowRight className="w-4 h-4 ml-2" />
          </button>
        </div>

        {/* Опция принудительного перехода */}
        {isAnalyzing && analysisResults.length > 0 && (
          <div className="mt-6 text-center">
            <div className="bg-white/40 backdrop-blur-sm rounded-xl p-4 inline-block">
              <p className="text-sm text-gray-600 mb-3">
                Анализ еще не завершен, но уже есть результаты
              </p>
              <button
                onClick={() => onStepChange('comparison')}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium underline transition-colors"
              >
                Перейти к сравнению с текущими результатами
              </button>
            </div>
          </div>
        )}
        
        {/* Информация о процессе */}
        {!isAnalyzing && !error && progress === 0 && (
          <div className="mt-6 text-center">
            <div className="bg-white/40 backdrop-blur-sm rounded-xl p-4 inline-block">
              <p className="text-sm text-gray-600">
                Анализ начнется автоматически после загрузки компонента
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalysisSection;