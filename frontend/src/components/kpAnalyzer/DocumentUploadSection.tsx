/**
 * Секция загрузки документов для КП Анализатора
 */

import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { 
  Upload, 
  FileText, 
  Trash2, 
  CheckCircle, 
  AlertCircle,
  Download,
  Eye
} from 'lucide-react';
import { TechnicalSpecification, CommercialProposal } from '../../types/kpAnalyzer';

interface DocumentUploadSectionProps {
  technicalSpec: TechnicalSpecification | null;
  commercialProposals: CommercialProposal[];
  uploadProgress: Record<string, number>;
  onUploadDocument: (file: File, role: 'tz' | 'kp') => Promise<void>;
  onRemoveDocument: (documentId: string, role: 'tz' | 'kp') => void;
  onProceed: () => void;
  canProceed: boolean;
  isProcessing: boolean;
}

const DocumentUploadSection: React.FC<DocumentUploadSectionProps> = ({
  technicalSpec,
  commercialProposals,
  uploadProgress,
  onUploadDocument,
  onRemoveDocument,
  onProceed,
  canProceed,
  isProcessing,
}) => {
  const onDropTZ = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      onUploadDocument(acceptedFiles[0], 'tz');
    }
  }, [onUploadDocument]);

  const onDropKP = useCallback((acceptedFiles: File[]) => {
    acceptedFiles.forEach(file => {
      onUploadDocument(file, 'kp');
    });
  }, [onUploadDocument]);

  const {
    getRootProps: getTZRootProps,
    getInputProps: getTZInputProps,
    isDragActive: isTZDragActive,
  } = useDropzone({
    onDrop: onDropTZ,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
    multiple: false,
    disabled: isProcessing,
  });

  const {
    getRootProps: getKPRootProps,
    getInputProps: getKPInputProps,
    isDragActive: isKPDragActive,
  } = useDropzone({
    onDrop: onDropKP,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
    multiple: true,
    disabled: isProcessing,
  });

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileTypeIcon = (type: string) => {
    return <FileText className="w-8 h-8 text-blue-400" />;
  };

  const renderUploadZone = (
    title: string,
    description: string,
    getRootProps: any,
    getInputProps: any,
    isDragActive: boolean,
    maxFiles?: number
  ) => (
    <div
      {...getRootProps()}
      className={`
        border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
        ${isDragActive ? 'border-blue-400 bg-blue-400/10' : 'border-gray-600 hover:border-gray-500'}
        ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}
      `}
    >
      <input {...getInputProps()} />
      <Upload className={`w-12 h-12 mx-auto mb-4 ${isDragActive ? 'text-blue-400' : 'text-gray-400'}`} />
      <h3 className="text-lg font-medium text-white mb-2">{title}</h3>
      <p className="text-gray-400 mb-4">{description}</p>
      <div className="text-sm text-gray-500">
        <p>Перетащите файлы сюда или нажмите для выбора</p>
        <p className="mt-1">Поддерживаются форматы: PDF, DOCX</p>
        {maxFiles && <p className="mt-1">Максимум файлов: {maxFiles}</p>}
      </div>
    </div>
  );

  const renderDocumentCard = (
    document: TechnicalSpecification | CommercialProposal,
    role: 'tz' | 'kp'
  ) => (
    <div key={document.id} className="bg-gray-800 border border-gray-700 rounded-lg p-4">
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3 flex-1">
          {getFileTypeIcon(document.type)}
          <div className="flex-1 min-w-0">
            <h4 className="text-white font-medium truncate">{document.name}</h4>
            <div className="text-sm text-gray-400 mt-1">
              <span>{formatFileSize(document.size)}</span>
              <span className="mx-2">•</span>
              <span className="capitalize">{document.type.toUpperCase()}</span>
              <span className="mx-2">•</span>
              <span>{new Date(document.uploadedAt).toLocaleDateString('ru-RU')}</span>
            </div>
            <div className="flex items-center mt-2">
              {document.status === 'ready' && (
                <div className="flex items-center text-green-400 text-sm">
                  <CheckCircle className="w-4 h-4 mr-1" />
                  <span>Готов к анализу</span>
                </div>
              )}
              {document.status === 'processing' && (
                <div className="flex items-center text-yellow-400 text-sm">
                  <div className="w-4 h-4 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin mr-1" />
                  <span>Обработка...</span>
                </div>
              )}
              {document.status === 'error' && (
                <div className="flex items-center text-red-400 text-sm">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  <span>{document.error || 'Ошибка обработки'}</span>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2 ml-4">
          <button
            className="p-2 text-gray-400 hover:text-white transition-colors"
            title="Просмотреть"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            className="p-2 text-gray-400 hover:text-white transition-colors"
            title="Скачать"
          >
            <Download className="w-4 h-4" />
          </button>
          <button
            onClick={() => onRemoveDocument(document.id, role)}
            className="p-2 text-gray-400 hover:text-red-400 transition-colors"
            title="Удалить"
            disabled={isProcessing}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Техническое задание */}
      <div>
        <h2 className="text-xl font-semibold text-white mb-4">
          1. Техническое задание
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            {!technicalSpec ? (
              renderUploadZone(
                'Загрузите ТЗ',
                'Техническое задание для анализа коммерческих предложений',
                getTZRootProps,
                getTZInputProps,
                isTZDragActive,
                1
              )
            ) : (
              renderDocumentCard(technicalSpec, 'tz')
            )}
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-medium text-white mb-3">О техническом задании</h3>
            <ul className="text-gray-400 text-sm space-y-2">
              <li>• ТЗ используется как эталон для сравнения КП</li>
              <li>• ИИ извлекает ключевые требования и критерии</li>
              <li>• Поддерживаются форматы PDF и DOCX</li>
              <li>• Максимальный размер файла: 50 МБ</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Коммерческие предложения */}
      <div>
        <h2 className="text-xl font-semibold text-white mb-4">
          2. Коммерческие предложения
        </h2>
        <div className="space-y-4">
          {commercialProposals.length === 0 ? (
            renderUploadZone(
              'Загрузите КП',
              'Коммерческие предложения для анализа и сравнения',
              getKPRootProps,
              getKPInputProps,
              isKPDragActive
            )
          ) : (
            <>
              <div className="grid grid-cols-1 gap-4">
                {commercialProposals.map(kp => renderDocumentCard(kp, 'kp'))}
              </div>
              <div className="border-2 border-dashed border-gray-600 hover:border-gray-500 rounded-lg p-6">
                <div 
                  {...getKPRootProps()}
                  className="text-center cursor-pointer"
                >
                  <input {...getKPInputProps()} />
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-400">Добавить еще КП</p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Статистика и кнопка продолжения */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-white mb-2">Статус загрузки</h3>
            <div className="flex items-center space-x-6 text-sm">
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${technicalSpec ? 'bg-green-400' : 'bg-gray-600'}`} />
                <span className="text-gray-400">
                  ТЗ: {technicalSpec ? 'Загружено' : 'Не загружено'}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${commercialProposals.length > 0 ? 'bg-green-400' : 'bg-gray-600'}`} />
                <span className="text-gray-400">
                  КП: {commercialProposals.length} файл(ов)
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onProceed}
            disabled={!canProceed || isProcessing}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              canProceed && !isProcessing
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-gray-700 text-gray-400 cursor-not-allowed'
            }`}
          >
            {isProcessing ? 'Обработка...' : 'Продолжить'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DocumentUploadSection;