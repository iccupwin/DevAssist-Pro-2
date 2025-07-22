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
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-6 h-full">
      <div className="flex items-center gap-3 mb-4">
        {icon}
        <div>
          <h3 className="text-base md:text-lg font-semibold text-gray-900">{title}</h3>
          <p className="text-sm md:text-base text-gray-600">{description}</p>
        </div>
      </div>

      {/* Drag & Drop Zone */}
      <div
        {...getRootProps()}
        className={`
          relative border-2 border-dashed rounded-lg p-4 sm:p-6 md:p-8 text-center cursor-pointer
          transition-colors duration-200 ease-in-out min-h-[120px] sm:min-h-[140px] md:min-h-[160px]
          flex items-center justify-center
          ${isDragActive 
            ? 'border-blue-400 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
          }
          ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <input {...getInputProps()} />
        
        <div className="flex flex-col items-center gap-2 sm:gap-3">
          <Upload 
            className={`w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 ${
              isDragActive ? 'text-blue-500' : 'text-gray-400'
            }`} 
          />
          
          {isUploading ? (
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent"></div>
              <span className="text-xs sm:text-sm md:text-base text-gray-600">Загрузка...</span>
            </div>
          ) : (
            <>
              <div className="text-xs sm:text-sm md:text-base text-gray-600 text-center">
                {isDragActive ? (
                  <span className="text-blue-600 font-medium">
                    Отпустите файлы для загрузки
                  </span>
                ) : (
                  <span>
                    <span className="hidden sm:inline md:inline">Перетащите файлы сюда или </span>
                    <span className="text-blue-600 font-medium">выберите файлы</span>
                  </span>
                )}
              </div>
              <div className="text-xs md:text-sm text-gray-500 text-center">
                {Object.values(accept).flat().join(', ')}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Error Message */}
      {uploadError && (
        <div className="mt-3 p-3 md:p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-500" />
          <span className="text-sm md:text-base text-red-700">{uploadError}</span>
        </div>
      )}

      {/* Uploaded Files List */}
      {uploadedFiles.length > 0 && (
        <div className="mt-4 space-y-2">
          <h4 className="text-xs sm:text-sm md:text-base font-medium text-gray-700">
            Загруженные файлы ({uploadedFiles.length})
          </h4>
          
          <div className="space-y-2 max-h-32 sm:max-h-40 md:max-h-48 overflow-y-auto">
            {uploadedFiles.map((file) => (
              <div
                key={file.id}
                className="flex items-center justify-between p-2 sm:p-3 md:p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 sm:gap-3 md:gap-4 min-w-0 flex-1">
                  <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                    <File className="w-3 h-3 sm:w-4 sm:h-4 text-green-600" />
                    <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-green-500" />
                  </div>
                  
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm md:text-base font-medium text-gray-900 truncate">
                      {file.originalName}
                    </p>
                    <p className="text-xs md:text-sm text-gray-600">
                      {formatFileSize(file.size)} • {file.extension}
                    </p>
                  </div>
                </div>
                
                <button
                  onClick={() => removeFile(file.id)}
                  className="p-1 text-gray-400 hover:text-red-500 transition-colors rounded-full hover:bg-red-50 flex-shrink-0"
                  title="Удалить файл"
                >
                  <X className="w-3 h-3 sm:w-4 sm:h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};