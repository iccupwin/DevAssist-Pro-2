import React, { useState, useCallback } from 'react';
import { Upload, FileText, Plus, X, AlertCircle, CheckCircle } from 'lucide-react';
import { fileService, FileValidationResult } from '../../services/fileService';

interface FileUploadSectionProps {
  onStepChange: (step: string) => void;
  uploadedFiles: {
    tz_file: File | null;
    kp_files: File[];
    additional_files: File[];
  };
  setUploadedFiles: React.Dispatch<React.SetStateAction<{
    tz_file: File | null;
    kp_files: File[];
    additional_files: File[];
  }>>;
  isDarkMode: boolean;
}

const FileUploadSection: React.FC<FileUploadSectionProps> = ({
  onStepChange,
  uploadedFiles,
  setUploadedFiles,
  isDarkMode
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [additionalText, setAdditionalText] = useState('');

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const validateAndSetFiles = (
    files: File[], 
    fileType: 'tz' | 'kp' | 'additional'
  ) => {
    // Очищаем предыдущие ошибки
    setErrors(prev => ({ ...prev, [fileType]: '' }));

    if (fileType === 'tz') {
      const validation = fileService.validateFile(files[0]);
      if (!validation.isValid) {
        setErrors(prev => ({ ...prev, [fileType]: validation.error || 'Ошибка валидации' }));
        return;
      }
      setUploadedFiles(prev => ({ ...prev, tz_file: files[0] }));
    } else {
      const validation = fileService.validateFiles(files, fileType);
      if (!validation.isValid) {
        setErrors(prev => ({ ...prev, [fileType]: validation.error || 'Ошибка валидации' }));
        return;
      }

      if (fileType === 'kp') {
        setUploadedFiles(prev => ({ ...prev, kp_files: [...prev.kp_files, ...files] }));
      } else {
        setUploadedFiles(prev => ({ ...prev, additional_files: [...prev.additional_files, ...files] }));
      }
    }
  };

  const handleDrop = useCallback((e: React.DragEvent, fileType: 'tz' | 'kp' | 'additional') => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      validateAndSetFiles(files, fileType);
    }
  }, [setUploadedFiles]);

  const handleFileSelect = (
    e: React.ChangeEvent<HTMLInputElement>, 
    fileType: 'tz' | 'kp' | 'additional'
  ) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      validateAndSetFiles(files, fileType);
    }
    // Сбрасываем значение input для возможности повторной загрузки того же файла
    e.target.value = '';
  };

  const removeFile = (fileType: 'tz' | 'kp' | 'additional', index?: number) => {
    if (fileType === 'tz') {
      setUploadedFiles(prev => ({ ...prev, tz_file: null }));
    } else if (fileType === 'kp' && typeof index === 'number') {
      setUploadedFiles(prev => ({
        ...prev,
        kp_files: prev.kp_files.filter((_, i) => i !== index)
      }));
    } else if (fileType === 'additional' && typeof index === 'number') {
      setUploadedFiles(prev => ({
        ...prev,
        additional_files: prev.additional_files.filter((_, i) => i !== index)
      }));
    }
  };

  const handleAdditionalTextSubmit = () => {
    if (additionalText.trim()) {
      // Создаем виртуальный файл из текста
      const textFile = fileService.createFileFromData(
        additionalText,
        `additional_text_${Date.now()}.txt`
      );
      
      setUploadedFiles(prev => ({
        ...prev,
        additional_files: [...prev.additional_files, textFile]
      }));
      
      setAdditionalText('');
    }
  };

  return (
    <div className="space-y-6">
      <div className={`backdrop-blur-md rounded-2xl shadow-xl p-8 ${
        isDarkMode 
          ? 'bg-white/[0.02] border border-gray-800' 
          : 'bg-black/[0.02] border border-gray-200'
      }`}>
        <div className="text-center mb-8">
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 ${
            isDarkMode ? 'bg-white' : 'bg-gray-900'
          }`}>
            <Upload className={`w-8 h-8 ${isDarkMode ? 'text-black' : 'text-white'}`} />
          </div>
          <h2 className={`text-3xl font-bold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Document Upload
          </h2>
          <p className={`text-lg max-w-2xl mx-auto ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Upload technical specifications and commercial proposals for AI-powered comparative analysis
          </p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* ТЗ файл */}
          <div className="space-y-4">
            <div
              className={`group relative bg-white/[0.02] backdrop-blur-sm border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-300 hover:shadow-lg hover:scale-105 ${
                dragActive 
                  ? 'border-blue-400 bg-white/[0.05] shadow-lg scale-105' 
                  : 'border-gray-700 hover:border-blue-400 hover:bg-white/[0.05]'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={(e) => handleDrop(e, 'tz')}
            >
              <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-black" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">
                Technical Specification
              </h3>
              <p className="text-sm text-gray-400 mb-6">
                Upload or drag & drop TS file in PDF or DOCX format
              </p>
              
              <input
                type="file"
                accept=".pdf,.docx"
                onChange={(e) => handleFileSelect(e, 'tz')}
                className="hidden"
                id="tz-upload"
              />
              <label
                htmlFor="tz-upload"
                className="inline-flex items-center px-6 py-3 bg-white text-black text-sm font-semibold rounded-xl hover:bg-gray-100 cursor-pointer transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
              >
                <Upload className="w-4 h-4 mr-2" />
                Choose File
              </label>
            </div>

            {/* Показать ошибки валидации ТЗ */}
            {errors.tz && (
              <div className="bg-red-500/10 backdrop-blur-sm border border-red-500/20 rounded-xl p-4">
                <div className="flex items-center">
                  <AlertCircle className="w-5 h-5 text-red-400 mr-3" />
                  <span className="text-sm text-red-300 font-medium">{errors.tz}</span>
                </div>
              </div>
            )}

            {/* Показать загруженный ТЗ файл */}
            {uploadedFiles.tz_file && (
              <div className="bg-green-500/10 backdrop-blur-sm border border-green-500/20 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center mr-3">
                      <CheckCircle className="w-5 h-5 text-green-400" />
                    </div>
                    <div>
                      <span className="text-sm font-semibold text-green-300">
                        {uploadedFiles.tz_file.name}
                      </span>
                      <div className="text-xs text-green-400">
                        {fileService.formatFileSize(uploadedFiles.tz_file.size)}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => removeFile('tz')}
                    className="w-8 h-8 bg-red-500/20 rounded-lg flex items-center justify-center text-red-400 hover:text-red-300 hover:bg-red-500/30 transition-colors"
                    title="Remove file"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* КП файлы */}
          <div className="space-y-4">
            <div
              className={`group relative bg-white/[0.02] backdrop-blur-sm border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-300 hover:shadow-lg hover:scale-105 ${
                dragActive 
                  ? 'border-blue-400 bg-white/[0.05] shadow-lg scale-105' 
                  : 'border-gray-700 hover:border-blue-400 hover:bg-white/[0.05]'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={(e) => handleDrop(e, 'kp')}
            >
              <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-black" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">
                Commercial Proposals
              </h3>
              <p className="text-sm text-gray-400 mb-6">
                Upload or drag & drop CP files in PDF or DOCX format
              </p>
              
              <input
                type="file"
                accept=".pdf,.docx"
                multiple
                onChange={(e) => handleFileSelect(e, 'kp')}
                className="hidden"
                id="kp-upload"
              />
              <label
                htmlFor="kp-upload"
                className="inline-flex items-center px-6 py-3 bg-white text-black text-sm font-semibold rounded-xl hover:bg-gray-100 cursor-pointer transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
              >
                <Plus className="w-4 h-4 mr-2" />
                Choose Files
              </label>
            </div>

            {/* Показать ошибки валидации КП */}
            {errors.kp && (
              <div className="bg-red-500/10 backdrop-blur-sm border border-red-500/20 rounded-xl p-4">
                <div className="flex items-center">
                  <AlertCircle className="w-5 h-5 text-red-400 mr-3" />
                  <span className="text-sm text-red-300 font-medium">{errors.kp}</span>
                </div>
              </div>
            )}

            {/* Показать загруженные КП файлы */}
            {uploadedFiles.kp_files.length > 0 && (
              <div className="space-y-3">
                {uploadedFiles.kp_files.map((file, index) => (
                  <div key={index} className="bg-green-500/10 backdrop-blur-sm border border-green-500/20 rounded-xl p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center mr-3">
                          <CheckCircle className="w-5 h-5 text-green-400" />
                        </div>
                        <div>
                          <span className="text-sm font-semibold text-green-300">
                            CP {index + 1}: {file.name}
                          </span>
                          <div className="text-xs text-green-400">
                            {fileService.formatFileSize(file.size)}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => removeFile('kp', index)}
                        className="w-8 h-8 bg-red-500/20 rounded-lg flex items-center justify-center text-red-400 hover:text-red-300 hover:bg-red-500/30 transition-colors"
                        title="Remove file"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Дополнительные файлы и текст */}
        <div className="mt-8">
          <div className="text-center mb-6">
            <h4 className="text-xl font-semibold text-white mb-2">
              Additional Information
            </h4>
            <p className="text-sm text-gray-400">(optional)</p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Загрузка дополнительных файлов */}
            <div className="space-y-4">
              <div
                className={`bg-gray-800/40 backdrop-blur-sm border-2 border-dashed rounded-2xl p-6 text-center transition-all duration-300 hover:shadow-lg hover:scale-105 ${
                  dragActive 
                    ? 'border-blue-400 bg-blue-900/50 shadow-lg scale-105' 
                    : 'border-gray-600 hover:border-blue-400 hover:bg-gray-700/60'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={(e) => handleDrop(e, 'additional')}
              >
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Plus className="w-6 h-6 text-black" />
                </div>
                <h5 className="font-semibold text-white mb-2">
                  Additional Files
                </h5>
                <p className="text-sm text-gray-400 mb-4">
                  Meeting protocols, reports, additional documentation
                </p>
                
                <input
                  type="file"
                  accept=".pdf,.docx,.txt"
                  multiple
                  onChange={(e) => handleFileSelect(e, 'additional')}
                  className="hidden"
                  id="additional-upload"
                />
                <label
                  htmlFor="additional-upload"
                  className="inline-flex items-center px-4 py-2 bg-white text-black text-sm font-medium rounded-xl hover:bg-gray-100 cursor-pointer transition-all duration-200 shadow-md hover:shadow-lg"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Files
                </label>
              </div>

              {/* Показать ошибки валидации дополнительных файлов */}
              {errors.additional && (
                <div className="bg-red-50/80 backdrop-blur-sm border border-red-200 rounded-xl p-4">
                  <div className="flex items-center">
                    <AlertCircle className="w-5 h-5 text-red-600 mr-3" />
                    <span className="text-sm text-red-800 font-medium">{errors.additional}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Поле для дополнительного текста */}
            <div className="space-y-4">
              <div className="bg-blue-50/80 backdrop-blur-sm border border-blue-200 rounded-2xl p-6">
                <div className="flex items-center mb-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                    <FileText className="w-4 h-4 text-blue-600" />
                  </div>
                  <h5 className="font-semibold text-blue-900">
                    Дополнительный текст
                  </h5>
                </div>
                <p className="text-sm text-blue-700 mb-4">
                  Информация о предыдущем опыте, компетенциях или важных факторах
                </p>
                <textarea
                  value={additionalText}
                  onChange={(e) => setAdditionalText(e.target.value)}
                  placeholder="For example: information about vendor's previous experience, reference check results, additional requirements..."
                  className="w-full p-4 border border-blue-500/50 rounded-xl text-sm resize-vertical min-h-[120px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/[0.05] backdrop-blur-sm text-white placeholder-gray-400"
                />
                <button
                  onClick={handleAdditionalTextSubmit}
                  disabled={!additionalText.trim()}
                  className="mt-4 inline-flex items-center px-5 py-2.5 bg-white text-black text-sm font-semibold rounded-xl hover:bg-gray-100 disabled:bg-gray-600 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Text
                </button>
              </div>
            </div>
          </div>

          {/* Показать все дополнительные файлы */}
          {uploadedFiles.additional_files.length > 0 && (
            <div className="mt-6">
              <h6 className="font-semibold text-white mb-4">Uploaded additional materials:</h6>
              <div className="space-y-3">
                {uploadedFiles.additional_files.map((file, index) => (
                  <div key={index} className="bg-white/[0.02] backdrop-blur-sm border border-gray-800 rounded-xl p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center mr-3">
                          <FileText className="w-5 h-5 text-gray-400" />
                        </div>
                        <div>
                          <span className="text-sm font-semibold text-gray-300">
                            {file.name}
                          </span>
                          <div className="text-xs text-gray-400">
                            {fileService.formatFileSize(file.size)}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => removeFile('additional', index)}
                        className="w-8 h-8 bg-red-500/20 rounded-lg flex items-center justify-center text-red-400 hover:text-red-300 hover:bg-red-500/30 transition-colors"
                        title="Remove file"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Кнопка для перехода к анализу */}
        <div className="mt-10 text-center">
          <button
            onClick={() => onStepChange('analysis')}
            disabled={!uploadedFiles.tz_file || uploadedFiles.kp_files.length === 0}
            className="inline-flex items-center px-8 py-4 bg-white text-black text-lg font-semibold rounded-2xl hover:bg-gray-100 disabled:bg-gray-600 disabled:text-gray-400 disabled:cursor-not-allowed transition-all duration-200 shadow-xl hover:shadow-2xl transform hover:-translate-y-1 disabled:transform-none"
          >
            <Upload className="w-5 h-5 mr-3" />
            Start Analysis
          </button>
          
          {(!uploadedFiles.tz_file || uploadedFiles.kp_files.length === 0) && (
            <p className="mt-4 text-sm text-gray-400 bg-white/[0.02] backdrop-blur-sm rounded-xl p-3 inline-block">
              Upload TS and at least one CP to start analysis
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default FileUploadSection;