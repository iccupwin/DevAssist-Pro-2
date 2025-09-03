/**
 * KP (Commercial Proposal) File Upload Zone
 * Multiple file upload component for Commercial Proposals
 */

import React, { useState, useRef } from 'react';
import { Upload, FileText, X, AlertCircle, CheckCircle, Clock, HardDrive, Plus } from 'lucide-react';

interface KPUploadProps {
  onFilesSelected?: (files: File[]) => void;
  acceptedTypes?: string[];
  disabled?: boolean;
  isProcessing?: boolean;
  selectedFiles?: File[];
  maxFiles?: number;
  className?: string;
  placeholder?: string;
}

export const KPFileUploadZone: React.FC<KPUploadProps> = ({
  onFilesSelected,
  acceptedTypes = ['.pdf', '.docx', '.doc', '.txt'],
  disabled = false,
  isProcessing = false,
  selectedFiles = [],
  maxFiles = 5,
  className = '',
  placeholder = 'Загрузите одно или несколько КП для анализа'
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
    handleFileSelection(files);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;
    
    const files = e.target.files ? Array.from(e.target.files) : [];
    handleFileSelection(files);
  };

  const handleFileSelection = (newFiles: File[]) => {
    setError(null);

    if (newFiles.length === 0) return;

    // Check file limit
    if (selectedFiles.length + newFiles.length > maxFiles) {
      setError(`Максимум ${maxFiles} файлов можно загрузить одновременно`);
      return;
    }

    // Validate each file
    const validFiles: File[] = [];
    for (const file of newFiles) {
      // Check file type
      const fileName = file.name.toLowerCase();
      const isValidType = acceptedTypes.some(type => fileName.endsWith(type.slice(1)));
      
      if (!isValidType) {
        setError(`Файл "${file.name}" имеет неподдерживаемый тип. Разрешены: ${acceptedTypes.join(', ')}`);
        return;
      }

      // Check file size (50MB max)
      const maxSize = 50 * 1024 * 1024;
      if (file.size > maxSize) {
        setError(`Файл "${file.name}" слишком большой. Максимальный размер: 50 МБ`);
        return;
      }

      // Check for duplicates
      if (selectedFiles.some(existing => existing.name === file.name && existing.size === file.size)) {
        setError(`Файл "${file.name}" уже добавлен`);
        return;
      }

      validFiles.push(file);
    }

    // Add new files to existing ones
    const updatedFiles = [...selectedFiles, ...validFiles];
    onFilesSelected?.(updatedFiles);
  };

  const removeFile = (fileToRemove: File) => {
    const updatedFiles = selectedFiles.filter(file => 
      !(file.name === fileToRemove.name && file.size === fileToRemove.size)
    );
    onFilesSelected?.(updatedFiles);
    setError(null);
  };

  const clearAllFiles = () => {
    onFilesSelected?.([]);
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

  const canAddMore = selectedFiles.length < maxFiles;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Upload Zone */}
      <div
        className={`
          relative border-2 border-dashed rounded-xl p-6 transition-all duration-300
          ${isDragOver && !disabled && canAddMore
            ? 'border-green-400 bg-green-50 scale-[1.02]'
            : 'border-gray-300 hover:border-gray-400'
          }
          ${!canAddMore ? 'opacity-50' : ''}
          ${disabled ? 'opacity-50 cursor-not-allowed' : canAddMore ? 'cursor-pointer hover:bg-gray-50' : 'cursor-not-allowed'}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !disabled && canAddMore && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={acceptedTypes.join(',')}
          onChange={handleFileInputChange}
          className="hidden"
          disabled={disabled || !canAddMore}
        />

        <div className="text-center space-y-3">
          <div className={`
            mx-auto w-12 h-12 rounded-full flex items-center justify-center transition-colors
            ${isDragOver && !disabled && canAddMore
              ? 'bg-green-100'
              : 'bg-gray-100'
            }
          `}>
            {selectedFiles.length > 0 && canAddMore ? (
              <Plus className={`w-6 h-6 ${isDragOver && canAddMore ? 'text-green-600' : 'text-gray-400'}`} />
            ) : (
              <Upload className={`w-6 h-6 ${isDragOver && canAddMore ? 'text-green-600' : 'text-gray-400'}`} />
            )}
          </div>

          <div>
            <h4 className="text-base font-medium text-gray-900 mb-1">
              {selectedFiles.length > 0 
                ? `📋 Коммерческие Предложения (${selectedFiles.length}/${maxFiles})`
                : '📋 Коммерческие Предложения (КП)'
              }
            </h4>
            <p className="text-sm text-gray-600 mb-2">
              {canAddMore ? (
                selectedFiles.length > 0 ? 'Добавьте ещё КП или перетащите сюда' : placeholder
              ) : (
                `Достигнут лимит файлов (${maxFiles})`
              )}
            </p>
            <div className="text-xs text-gray-500 space-y-1">
              <div>Поддерживаемые форматы: {acceptedTypes.join(', ')}</div>
              <div>Максимум {maxFiles} файлов, до 50МБ каждый</div>
            </div>
          </div>
        </div>
      </div>

      {/* Selected Files Display */}
      {selectedFiles.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h5 className="text-sm font-medium text-gray-900">
              Загруженные КП ({selectedFiles.length})
            </h5>
            <button
              onClick={clearAllFiles}
              className="text-xs text-gray-500 hover:text-red-600 transition-colors"
            >
              Очистить все
            </button>
          </div>

          {selectedFiles.map((file, index) => (
            <div key={`${file.name}-${file.size}`} className="border border-gray-200 rounded-lg p-3 bg-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <FileText className="w-4 h-4 text-green-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      📋 {file.name}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <HardDrive className="w-3 h-3" />
                        {formatFileSize(file.size)}
                      </span>
                      {isProcessing ? (
                        <span className="flex items-center gap-1 text-blue-600">
                          <Clock className="w-3 h-3" />
                          Обработка...
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-green-600">
                          <CheckCircle className="w-3 h-3" />
                          КП #{index + 1} готово
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => removeFile(file)}
                  className="text-gray-400 hover:text-gray-600 p-1 rounded transition-colors"
                  title="Удалить файл"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
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