import React, { useState, useCallback } from 'react';
import { Upload, FileText, Plus, X, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { fileService, FileUploadResponse, FileUploadProgress } from '../../services/fileService';
import { useFileUpload } from '../../hooks/useFileUpload';
import { UploadedFile } from '../../utils/fileAdapters';

interface FileUploadSectionProps {
  onStepChange: (step: string) => void;
  uploadedFiles: {
    tz_file: UploadedFile | null;
    kp_files: UploadedFile[];
    additional_files: UploadedFile[];
  };
  setUploadedFiles: React.Dispatch<React.SetStateAction<{
    tz_file: UploadedFile | null;
    kp_files: UploadedFile[];
    additional_files: UploadedFile[];
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
  const [uploadProgress, setUploadProgress] = useState<Record<string, FileUploadProgress>>({});
  
  const {
    uploadFile,
    uploadMultipleFiles,
    uploading,
    hasErrors,
    clearErrors
  } = useFileUpload({
    onProgress: (fileId, progress) => {
      setUploadProgress(prev => ({ ...prev, [fileId]: progress }));
    },
    onError: (error) => {
      console.error('Upload error:', error);
    }
  });

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const uploadAndSetFiles = async (
    files: File[], 
    fileType: 'tz' | 'kp' | 'additional'
  ) => {
    // Очищаем предыдущие ошибки
    setErrors(prev => ({ ...prev, [fileType]: '' }));
    clearErrors();

    // Валидация файлов
    const validation = fileType === 'tz' 
      ? fileService.validateFile(files[0])
      : fileService.validateFiles(files);
      
    if (!validation.isValid) {
      setErrors(prev => ({ ...prev, [fileType]: validation.error || 'Ошибка валидации' }));
      return;
    }

    try {
      if (fileType === 'tz') {
        // Для ТЗ загружаем один файл
        const file = files[0];
        const uploadedFile: UploadedFile = {
          file,
          uploading: true,
          progress: 0
        };
        
        setUploadedFiles(prev => ({ ...prev, tz_file: uploadedFile }));
        
        const response = await uploadFile(file);
        
        setUploadedFiles(prev => ({
          ...prev,
          tz_file: {
            file,
            uploadResponse: response,
            uploading: false,
            progress: 100,
            error: response.success ? undefined : response.error
          }
        }));
      } else {
        // Для КП и дополнительных файлов загружаем множественно
        const uploadedFiles: UploadedFile[] = files.map(file => ({
          file,
          uploading: true,
          progress: 0
        }));
        
        if (fileType === 'kp') {
          setUploadedFiles(prev => ({ 
            ...prev, 
            kp_files: [...prev.kp_files, ...uploadedFiles] 
          }));
        } else {
          setUploadedFiles(prev => ({ 
            ...prev, 
            additional_files: [...prev.additional_files, ...uploadedFiles] 
          }));
        }
        
        const responses = await uploadMultipleFiles(files);
        
        // Обновляем состояние с результатами загрузки
        const completedFiles: UploadedFile[] = files.map((file, index) => {
          const response = responses[index];
          return {
            file,
            uploadResponse: response,
            uploading: false,
            progress: 100,
            error: response.success ? undefined : response.error
          };
        });
        
        if (fileType === 'kp') {
          setUploadedFiles(prev => {
            const existingFiles = prev.kp_files.filter(
              existingFile => !files.some(newFile => newFile.name === existingFile.file.name)
            );
            return { 
              ...prev, 
              kp_files: [...existingFiles, ...completedFiles] 
            };
          });
        } else {
          setUploadedFiles(prev => {
            const existingFiles = prev.additional_files.filter(
              existingFile => !files.some(newFile => newFile.name === existingFile.file.name)
            );
            return { 
              ...prev, 
              additional_files: [...existingFiles, ...completedFiles] 
            };
          });
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Ошибка загрузки файла';
      setErrors(prev => ({ ...prev, [fileType]: errorMessage }));
      
      // Помечаем файлы как ошибочные
      if (fileType === 'tz') {
        setUploadedFiles(prev => ({
          ...prev,
          tz_file: prev.tz_file ? {
            ...prev.tz_file,
            uploading: false,
            error: errorMessage
          } : null
        }));
      }
    }
  };

  const handleDrop = useCallback((e: React.DragEvent, fileType: 'tz' | 'kp' | 'additional') => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      uploadAndSetFiles(files, fileType);
    }
  }, [uploadAndSetFiles]);

  const handleFileSelect = (
    e: React.ChangeEvent<HTMLInputElement>, 
    fileType: 'tz' | 'kp' | 'additional'
  ) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      uploadAndSetFiles(files, fileType);
    }
    // Сбрасываем значение input для возможности повторной загрузки того же файла
    e.target.value = '';
  };

  const removeFile = async (fileType: 'tz' | 'kp' | 'additional', index?: number) => {
    if (fileType === 'tz' && uploadedFiles.tz_file) {
      // Удаляем файл с сервера если он был загружен
      if (uploadedFiles.tz_file.uploadResponse?.fileId) {
        try {
          await fileService.deleteFile(uploadedFiles.tz_file.uploadResponse.fileId);
        } catch (error) {
          console.error('Ошибка удаления файла с сервера:', error);
        }
      }
      setUploadedFiles(prev => ({ ...prev, tz_file: null }));
    } else if (fileType === 'kp' && typeof index === 'number') {
      const fileToRemove = uploadedFiles.kp_files[index];
      if (fileToRemove?.uploadResponse?.fileId) {
        try {
          await fileService.deleteFile(fileToRemove.uploadResponse.fileId);
        } catch (error) {
          console.error('Ошибка удаления файла с сервера:', error);
        }
      }
      setUploadedFiles(prev => ({
        ...prev,
        kp_files: prev.kp_files.filter((_, i) => i !== index)
      }));
    } else if (fileType === 'additional' && typeof index === 'number') {
      const fileToRemove = uploadedFiles.additional_files[index];
      if (fileToRemove?.uploadResponse?.fileId) {
        try {
          await fileService.deleteFile(fileToRemove.uploadResponse.fileId);
        } catch (error) {
          console.error('Ошибка удаления файла с сервера:', error);
        }
      }
      setUploadedFiles(prev => ({
        ...prev,
        additional_files: prev.additional_files.filter((_, i) => i !== index)
      }));
    }
  };

  const handleAdditionalTextSubmit = async () => {
    if (additionalText.trim()) {
      // Создаем виртуальный файл из текста
      const textFile = fileService.createFileFromData(
        additionalText,
        `additional_text_${Date.now()}.txt`
      );
      
      const uploadedFile: UploadedFile = {
        file: textFile,
        uploading: true,
        progress: 0
      };
      
      setUploadedFiles(prev => ({
        ...prev,
        additional_files: [...prev.additional_files, uploadedFile]
      }));
      
      try {
        const response = await uploadFile(textFile);
        
        setUploadedFiles(prev => {
          const updatedFiles = prev.additional_files.map(file => 
            file.file.name === textFile.name 
              ? {
                  ...file,
                  uploadResponse: response,
                  uploading: false,
                  progress: 100,
                  error: response.success ? undefined : response.error
                }
              : file
          );
          return { ...prev, additional_files: updatedFiles };
        });
        
        setAdditionalText('');
      } catch (error) {
        // Обновляем состояние с ошибкой
        setUploadedFiles(prev => {
          const updatedFiles = prev.additional_files.map(file => 
            file.file.name === textFile.name 
              ? {
                  ...file,
                  uploading: false,
                  error: error instanceof Error ? error.message : 'Ошибка загрузки'
                }
              : file
          );
          return { ...prev, additional_files: updatedFiles };
        });
      }
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
              <div className={`backdrop-blur-sm border rounded-xl p-4 ${
                uploadedFiles.tz_file.uploading
                  ? 'bg-blue-500/10 border-blue-500/20'
                  : uploadedFiles.tz_file.error
                  ? 'bg-red-500/10 border-red-500/20'
                  : 'bg-green-500/10 border-green-500/20'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center mr-3 ${
                      uploadedFiles.tz_file.uploading
                        ? 'bg-blue-500/20'
                        : uploadedFiles.tz_file.error
                        ? 'bg-red-500/20'
                        : 'bg-green-500/20'
                    }`}>
                      {uploadedFiles.tz_file.uploading ? (
                        <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
                      ) : uploadedFiles.tz_file.error ? (
                        <AlertCircle className="w-5 h-5 text-red-400" />
                      ) : (
                        <CheckCircle className="w-5 h-5 text-green-400" />
                      )}
                    </div>
                    <div>
                      <span className={`text-sm font-semibold ${
                        uploadedFiles.tz_file.uploading
                          ? 'text-blue-300'
                          : uploadedFiles.tz_file.error
                          ? 'text-red-300'
                          : 'text-green-300'
                      }`}>
                        {uploadedFiles.tz_file.file.name}
                      </span>
                      <div className={`text-xs ${
                        uploadedFiles.tz_file.uploading
                          ? 'text-blue-400'
                          : uploadedFiles.tz_file.error
                          ? 'text-red-400'
                          : 'text-green-400'
                      }`}>
                        {uploadedFiles.tz_file.uploading
                          ? `Загрузка... ${uploadedFiles.tz_file.progress || 0}%`
                          : uploadedFiles.tz_file.error
                          ? uploadedFiles.tz_file.error
                          : fileService.formatFileSize(uploadedFiles.tz_file.file.size)
                        }
                      </div>
                      {uploadedFiles.tz_file.uploading && uploadedFiles.tz_file.progress !== undefined && (
                        <div className="w-full bg-gray-200 rounded-full h-1 mt-2">
                          <div
                            className="bg-blue-600 h-1 rounded-full transition-all duration-300"
                            style={{ width: `${uploadedFiles.tz_file.progress}%` }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => removeFile('tz')}
                    disabled={uploadedFiles.tz_file.uploading}
                    className="w-8 h-8 bg-red-500/20 rounded-lg flex items-center justify-center text-red-400 hover:text-red-300 hover:bg-red-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                {uploadedFiles.kp_files.map((uploadedFile, index) => (
                  <div key={index} className={`backdrop-blur-sm border rounded-xl p-4 ${
                    uploadedFile.uploading
                      ? 'bg-blue-500/10 border-blue-500/20'
                      : uploadedFile.error
                      ? 'bg-red-500/10 border-red-500/20'
                      : 'bg-green-500/10 border-green-500/20'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center mr-3 ${
                          uploadedFile.uploading
                            ? 'bg-blue-500/20'
                            : uploadedFile.error
                            ? 'bg-red-500/20'
                            : 'bg-green-500/20'
                        }`}>
                          {uploadedFile.uploading ? (
                            <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
                          ) : uploadedFile.error ? (
                            <AlertCircle className="w-5 h-5 text-red-400" />
                          ) : (
                            <CheckCircle className="w-5 h-5 text-green-400" />
                          )}
                        </div>
                        <div>
                          <span className={`text-sm font-semibold ${
                            uploadedFile.uploading
                              ? 'text-blue-300'
                              : uploadedFile.error
                              ? 'text-red-300'
                              : 'text-green-300'
                          }`}>
                            CP {index + 1}: {uploadedFile.file.name}
                          </span>
                          <div className={`text-xs ${
                            uploadedFile.uploading
                              ? 'text-blue-400'
                              : uploadedFile.error
                              ? 'text-red-400'
                              : 'text-green-400'
                          }`}>
                            {uploadedFile.uploading
                              ? `Загрузка... ${uploadedFile.progress || 0}%`
                              : uploadedFile.error
                              ? uploadedFile.error
                              : fileService.formatFileSize(uploadedFile.file.size)
                            }
                          </div>
                          {uploadedFile.uploading && uploadedFile.progress !== undefined && (
                            <div className="w-full bg-gray-200 rounded-full h-1 mt-2">
                              <div
                                className="bg-blue-600 h-1 rounded-full transition-all duration-300"
                                style={{ width: `${uploadedFile.progress}%` }}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => removeFile('kp', index)}
                        disabled={uploadedFile.uploading}
                        className="w-8 h-8 bg-red-500/20 rounded-lg flex items-center justify-center text-red-400 hover:text-red-300 hover:bg-red-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                  disabled={!additionalText.trim() || uploading}
                  className="mt-4 inline-flex items-center px-5 py-2.5 bg-white text-black text-sm font-semibold rounded-xl hover:bg-gray-100 disabled:bg-gray-600 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg"
                >
                  {uploading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4 mr-2" />
                  )}
                  {uploading ? 'Загрузка...' : 'Add Text'}
                </button>
              </div>
            </div>
          </div>

          {/* Показать все дополнительные файлы */}
          {uploadedFiles.additional_files.length > 0 && (
            <div className="mt-6">
              <h6 className="font-semibold text-white mb-4">Uploaded additional materials:</h6>
              <div className="space-y-3">
                {uploadedFiles.additional_files.map((uploadedFile, index) => (
                  <div key={index} className={`backdrop-blur-sm border rounded-xl p-4 ${
                    uploadedFile.uploading
                      ? 'bg-blue-500/10 border-blue-500/20'
                      : uploadedFile.error
                      ? 'bg-red-500/10 border-red-500/20'
                      : 'bg-white/[0.02] border-gray-800'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center mr-3 ${
                          uploadedFile.uploading
                            ? 'bg-blue-500/20'
                            : uploadedFile.error
                            ? 'bg-red-500/20'
                            : 'bg-white/10'
                        }`}>
                          {uploadedFile.uploading ? (
                            <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
                          ) : uploadedFile.error ? (
                            <AlertCircle className="w-5 h-5 text-red-400" />
                          ) : (
                            <FileText className="w-5 h-5 text-gray-400" />
                          )}
                        </div>
                        <div>
                          <span className={`text-sm font-semibold ${
                            uploadedFile.uploading
                              ? 'text-blue-300'
                              : uploadedFile.error
                              ? 'text-red-300'
                              : 'text-gray-300'
                          }`}>
                            {uploadedFile.file.name}
                          </span>
                          <div className={`text-xs ${
                            uploadedFile.uploading
                              ? 'text-blue-400'
                              : uploadedFile.error
                              ? 'text-red-400'
                              : 'text-gray-400'
                          }`}>
                            {uploadedFile.uploading
                              ? `Загрузка... ${uploadedFile.progress || 0}%`
                              : uploadedFile.error
                              ? uploadedFile.error
                              : fileService.formatFileSize(uploadedFile.file.size)
                            }
                          </div>
                          {uploadedFile.uploading && uploadedFile.progress !== undefined && (
                            <div className="w-full bg-gray-200 rounded-full h-1 mt-2">
                              <div
                                className="bg-blue-600 h-1 rounded-full transition-all duration-300"
                                style={{ width: `${uploadedFile.progress}%` }}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => removeFile('additional', index)}
                        disabled={uploadedFile.uploading}
                        className="w-8 h-8 bg-red-500/20 rounded-lg flex items-center justify-center text-red-400 hover:text-red-300 hover:bg-red-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
            disabled={
              !uploadedFiles.tz_file || 
              uploadedFiles.kp_files.length === 0 || 
              uploading ||
              uploadedFiles.tz_file?.uploading ||
              uploadedFiles.kp_files.some(f => f.uploading) ||
              uploadedFiles.additional_files.some(f => f.uploading) ||
              !!uploadedFiles.tz_file?.error ||
              uploadedFiles.kp_files.some(f => f.error)
            }
            className="inline-flex items-center px-8 py-4 bg-white text-black text-lg font-semibold rounded-2xl hover:bg-gray-100 disabled:bg-gray-600 disabled:text-gray-400 disabled:cursor-not-allowed transition-all duration-200 shadow-xl hover:shadow-2xl transform hover:-translate-y-1 disabled:transform-none"
          >
            {uploading || uploadedFiles.tz_file?.uploading || uploadedFiles.kp_files.some(f => f.uploading) ? (
              <Loader2 className="w-5 h-5 mr-3 animate-spin" />
            ) : (
              <Upload className="w-5 h-5 mr-3" />
            )}
            {uploading ? 'Загрузка файлов...' : 'Start Analysis'}
          </button>
          
          {(!uploadedFiles.tz_file || uploadedFiles.kp_files.length === 0) && (
            <p className="mt-4 text-sm text-gray-400 bg-white/[0.02] backdrop-blur-sm rounded-xl p-3 inline-block">
              Upload TS and at least one CP to start analysis
            </p>
          )}
          
          {(uploadedFiles.tz_file?.error || uploadedFiles.kp_files.some(f => f.error)) && (
            <p className="mt-4 text-sm text-red-400 bg-red-500/10 backdrop-blur-sm rounded-xl p-3 inline-block">
              Исправьте ошибки загрузки файлов перед началом анализа
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default FileUploadSection;