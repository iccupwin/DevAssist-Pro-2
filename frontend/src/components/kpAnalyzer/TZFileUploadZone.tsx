/**
 * TZ (Technical Specification) File Upload Zone
 * Single file upload component for Technical Specifications
 */

import React, { useState, useRef } from 'react';
import { Upload, FileText, X, AlertCircle, CheckCircle, Clock, HardDrive } from 'lucide-react';

interface TZUploadProps {
  onFileSelected?: (file: File | null) => void;
  acceptedTypes?: string[];
  disabled?: boolean;
  isProcessing?: boolean;
  selectedFile?: File | null;
  className?: string;
  placeholder?: string;
}

export const TZFileUploadZone: React.FC<TZUploadProps> = ({
  onFileSelected,
  acceptedTypes = ['.pdf', '.docx', '.doc', '.txt'],
  disabled = false,
  isProcessing = false,
  selectedFile = null,
  className = '',
  placeholder = 'Загрузите файл ТЗ для сравнения'
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    
    if (disabled) return;
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;
    
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleFileSelect = (file: File) => {
    setError(null);

    // Validate file type
    const fileName = file.name.toLowerCase();
    const isValidType = acceptedTypes.some(type => fileName.endsWith(type.slice(1)));
    
    if (!isValidType) {
      setError(`Неподдерживаемый тип файла. Разрешены: ${acceptedTypes.join(', ')}`);
      return;
    }

    // Validate file size (50MB max)
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      setError('Файл слишком большой. Максимальный размер: 50 МБ');
      return;
    }

    onFileSelected?.(file);
  };

  const removeFile = () => {
    onFileSelected?.(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Upload Zone */}
      {!selectedFile ? (
        <div
          className={`
            relative border-2 border-dashed rounded-xl p-6 transition-all duration-300
            ${isDragOver && !disabled
              ? 'border-blue-400 bg-blue-50 scale-[1.02]'
              : 'border-gray-300 hover:border-gray-400'
            }
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-gray-50'}
          `}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !disabled && fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={acceptedTypes.join(',')}
            onChange={handleFileInputChange}
            className="hidden"
            disabled={disabled}
          />

          <div className="text-center space-y-3">
            <div className={`
              mx-auto w-12 h-12 rounded-full flex items-center justify-center transition-colors
              ${isDragOver && !disabled
                ? 'bg-blue-100'
                : 'bg-gray-100'
              }
            `}>
              <Upload className={`w-6 h-6 ${isDragOver && !disabled ? 'text-blue-600' : 'text-gray-400'}`} />
            </div>

            <div>
              <h4 className="text-base font-medium text-gray-900 mb-1">
                {isDragOver ? 'Отпустите файл ТЗ' : '📄 Техническое Задание (ТЗ)'}
              </h4>
              <p className="text-sm text-gray-600 mb-2">
                {placeholder}
              </p>
              <div className="text-xs text-gray-500 space-y-1">
                <div>Поддерживаемые форматы: {acceptedTypes.join(', ')}</div>
                <div>Максимальный размер: 50 МБ</div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Selected File Display */
        <div className="border border-gray-200 rounded-xl p-4 bg-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  📄 {selectedFile.name}
                </p>
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <HardDrive className="w-3 h-3" />
                    {formatFileSize(selectedFile.size)}
                  </span>
                  {isProcessing && (
                    <span className="flex items-center gap-1 text-blue-600">
                      <Clock className="w-3 h-3" />
                      Обработка...
                    </span>
                  )}
                  {!isProcessing && (
                    <span className="flex items-center gap-1 text-green-600">
                      <CheckCircle className="w-3 h-3" />
                      ТЗ загружено
                    </span>
                  )}
                </div>
              </div>
            </div>

            <button
              onClick={removeFile}
              className="text-gray-400 hover:text-gray-600 p-1 rounded transition-colors"
              title="Удалить файл"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <span className="text-sm text-red-700">{error}</span>
          <button
            onClick={() => setError(null)}
            className="ml-auto text-red-600 hover:text-red-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};