import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, File, CheckCircle, X, AlertCircle } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { documentProcessor } from '../../services/documentExtractor';

interface UploadedFile {
  id: string;
  originalName: string;
  filePath: string;
  extension: string;
  size: number;
  type: 'tz' | 'kp' | 'additional';
  text?: string;
}

interface FileUploadZoneProps {
  onFilesUpload: (files: UploadedFile[], type: 'tz' | 'kp' | 'additional') => void;
  accept: Record<string, string[]>;
  multiple?: boolean;
  type: 'tz' | 'kp' | 'additional';
  title: string;
  description: string;
  icon: React.ReactNode;
  uploadedFiles?: UploadedFile[];
  maxFiles?: number;
}

export const FileUploadZone: React.FC<FileUploadZoneProps> = ({
  onFilesUpload,
  accept,
  multiple = false,
  type,
  title,
  description,
  icon,
  uploadedFiles = [],
  maxFiles
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (maxFiles && uploadedFiles.length + acceptedFiles.length > maxFiles) {
      setUploadError(`Максимальное количество файлов: ${maxFiles}`);
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      const uploadPromises = acceptedFiles.map(async (file) => {
        const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
        const uniqueId = uuidv4();
        const uniqueFilename = `${type}_${uniqueId}${fileExtension}`;
        
        // Извлекаем текст из файла с помощью реального сервиса
        let extractedText = '';
        try {
          extractedText = await documentProcessor.extractTextFromFile(file);
        } catch (error) {
          console.error('Error extracting text from file:', error);
          extractedText = `Ошибка извлечения текста из файла: ${file.name}`;
        }
        
        const uploadedFile: UploadedFile = {
          id: uniqueId,
          originalName: file.name,
          filePath: `/uploads/${uniqueFilename}`,
          extension: fileExtension,
          size: file.size,
          type,
          text: extractedText
        };

        return uploadedFile;
      });

      const uploadedFiles = await Promise.all(uploadPromises);
      onFilesUpload(uploadedFiles, type);
    } catch (error) {
      setUploadError('Ошибка при загрузке файлов');
      console.error('Upload error:', error);
    } finally {
      setIsUploading(false);
    }
  }, [onFilesUpload, type, maxFiles, uploadedFiles.length]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    multiple,
    disabled: isUploading
  });

  const removeFile = (fileId: string) => {
    const updatedFiles = uploadedFiles.filter(file => file.id !== fileId);
    onFilesUpload(updatedFiles, type);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 h-full">
      <div className="flex items-center gap-3 mb-4">
        {icon}
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <p className="text-sm text-gray-600">{description}</p>
        </div>
      </div>

      {/* Drag & Drop Zone */}
      <div
        {...getRootProps()}
        className={`
          relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer
          transition-colors duration-200 ease-in-out
          ${isDragActive 
            ? 'border-blue-400 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
          }
          ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <input {...getInputProps()} />
        
        <div className="flex flex-col items-center gap-3">
          <Upload 
            className={`w-10 h-10 ${
              isDragActive ? 'text-blue-500' : 'text-gray-400'
            }`} 
          />
          
          {isUploading ? (
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent"></div>
              <span className="text-sm text-gray-600">Загрузка...</span>
            </div>
          ) : (
            <>
              <div className="text-sm text-gray-600">
                {isDragActive ? (
                  <span className="text-blue-600 font-medium">
                    Отпустите файлы для загрузки
                  </span>
                ) : (
                  <span>
                    Перетащите файлы сюда или{' '}
                    <span className="text-blue-600 font-medium">выберите файлы</span>
                  </span>
                )}
              </div>
              <div className="text-xs text-gray-500">
                Поддерживаемые форматы: {Object.values(accept).flat().join(', ')}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Error Message */}
      {uploadError && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-500" />
          <span className="text-sm text-red-700">{uploadError}</span>
        </div>
      )}

      {/* Uploaded Files List */}
      {uploadedFiles.length > 0 && (
        <div className="mt-4 space-y-2">
          <h4 className="text-sm font-medium text-gray-700">
            Загруженные файлы ({uploadedFiles.length})
          </h4>
          
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {uploadedFiles.map((file) => (
              <div
                key={file.id}
                className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <File className="w-4 h-4 text-green-600" />
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  </div>
                  
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {file.originalName}
                    </p>
                    <p className="text-xs text-gray-600">
                      {formatFileSize(file.size)} • {file.extension}
                    </p>
                  </div>
                </div>
                
                <button
                  onClick={() => removeFile(file.id)}
                  className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                  title="Удалить файл"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};