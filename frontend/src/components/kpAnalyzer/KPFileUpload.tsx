import React from 'react';
import { Upload, FileText, X, AlertCircle } from 'lucide-react';

interface FileUploadInfo {
  file: File;
  name: string;
  size: number;
  type: string;
  uploadedAt: Date;
}

interface KPFileUploadProps {
  uploadedFiles: {
    tzFile: FileUploadInfo | null;
    kpFiles: FileUploadInfo[];
    additionalFiles: FileUploadInfo[];
  };
  onFileUpload: (type: 'tz' | 'kp' | 'additional', files: FileList | null) => void;
  onRemoveFile: (type: 'tz' | 'kp' | 'additional', index?: number) => void;
}

export const KPFileUpload: React.FC<KPFileUploadProps> = ({
  uploadedFiles,
  onFileUpload,
  onRemoveFile
}) => {
  // Функция для форматирования размера файла
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Функция для получения иконки по типу файла
  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf':
        return '📄';
      case 'docx':
      case 'doc':
        return '📝';
      case 'txt':
        return '📋';
      default:
        return '📄';
    }
  };

  // Функция для получения описания типа файла
  const getFileTypeDescription = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf':
        return 'PDF документ';
      case 'docx':
        return 'Word документ';
      case 'doc':
        return 'Word документ (старый формат)';
      case 'txt':
        return 'Текстовый файл';
      default:
        return 'Документ';
    }
  };

  // Компонент для отображения загруженного файла
  const FileDisplay: React.FC<{ file: FileUploadInfo; onRemove: () => void }> = ({ file, onRemove }) => (
    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
      <div className="flex items-center space-x-3">
        <div className="text-2xl">{getFileIcon(file.name)}</div>
        <div>
          <p className="text-sm font-medium text-gray-900 dark:text-white">{file.name}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {getFileTypeDescription(file.name)} • {formatFileSize(file.size)}
          </p>
        </div>
      </div>
      <button
        onClick={onRemove}
        className="p-1 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );

  // Компонент зоны загрузки
  const UploadZone: React.FC<{
    type: 'tz' | 'kp' | 'additional';
    title: string;
    description: string;
    accept: string;
    multiple?: boolean;
    files: FileUploadInfo[];
    maxFiles?: number;
  }> = ({ type, title, description, accept, multiple = false, files, maxFiles }) => (
    <div className="mb-8">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
        <FileText className="w-5 h-5 mr-2" />
        {title}
      </h2>
      
      <div className="space-y-3 mb-4">
        {files.map((file, index) => (
          <FileDisplay
            key={index}
            file={file}
            onRemove={() => onRemoveFile(type, index)}
          />
        ))}
      </div>
      
      {(!maxFiles || files.length < maxFiles) && (
        <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center hover:border-gray-400 dark:hover:border-gray-500 transition-colors">
          <Upload className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-300 mb-4">{description}</p>
          <input
            type="file"
            accept={accept}
            multiple={multiple}
            onChange={(e) => onFileUpload(type, e.target.files)}
            className="hidden"
            id={`${type}-upload`}
          />
          <label htmlFor={`${type}-upload`} className="cursor-pointer">
            <div className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              Выбрать файлы
            </div>
          </label>
        </div>
      )}
    </div>
  );

  return (
    <div>
      {/* Информационная панель */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-8">
        <div className="flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm text-blue-900 dark:text-blue-300 font-medium">
              Поддерживаемые форматы файлов для КП Анализатора
            </p>
            <p className="text-xs text-blue-700 dark:text-blue-400 mt-1">
              📄 PDF, 📝 DOC/DOCX, 📋 TXT файлы. Размер файла не должен превышать 50MB.
            </p>
            <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
              ✅ Загрузите 1 ТЗ и несколько КП разных форматов для сравнительного анализа
            </p>
          </div>
        </div>
      </div>

      {/* Загрузка ТЗ */}
      <UploadZone
        type="tz"
        title="1. Техническое задание (ТЗ)"
        description="Перетащите файл ТЗ сюда или нажмите для выбора"
        accept=".pdf,.doc,.docx,.txt"
        files={uploadedFiles.tzFile ? [uploadedFiles.tzFile] : []}
        maxFiles={1}
      />

      {/* Загрузка КП */}
      <UploadZone
        type="kp"
        title="2. Коммерческие предложения (КП)"
        description="Перетащите файлы КП сюда или нажмите для выбора (можно загрузить несколько)"
        accept=".pdf,.doc,.docx,.txt"
        multiple={true}
        files={uploadedFiles.kpFiles}
      />

      {/* Загрузка дополнительных файлов */}
      <UploadZone
        type="additional"
        title="3. Дополнительные файлы (опционально)"
        description="Дополнительные документы, спецификации, etc."
        accept=".pdf,.doc,.docx,.txt"
        multiple={true}
        files={uploadedFiles.additionalFiles}
      />

      {/* Статистика загруженных файлов */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Статистика загруженных файлов</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {uploadedFiles.tzFile ? 1 : 0}
            </div>
            <div className="text-sm text-blue-700 dark:text-blue-300">ТЗ</div>
          </div>
          <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {uploadedFiles.kpFiles.length}
            </div>
            <div className="text-sm text-green-700 dark:text-green-300">КП</div>
          </div>
          <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {uploadedFiles.additionalFiles.length}
            </div>
            <div className="text-sm text-purple-700 dark:text-purple-300">Дополнительные</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KPFileUpload;