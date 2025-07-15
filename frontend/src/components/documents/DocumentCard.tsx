import React from 'react';
import { 
  FileText, 
  Eye, 
  Download, 
  Trash2, 
  Clock, 
  AlertCircle,
  CheckCircle,
  FileIcon,
  Image as ImageIcon
} from 'lucide-react';
import { Button } from '../ui/Button';
import { DocumentFile } from './DocumentPreview';

interface DocumentCardProps {
  file: DocumentFile;
  onPreview: (file: DocumentFile) => void;
  onAnalyze?: (file: DocumentFile) => void;
  onDelete?: (file: DocumentFile) => void;
  onDownload?: (file: DocumentFile) => void;
  analysisStatus?: 'pending' | 'processing' | 'completed' | 'error';
  showActions?: boolean;
  className?: string;
}

const DocumentCard: React.FC<DocumentCardProps> = ({
  file,
  onPreview,
  onAnalyze,
  onDelete,
  onDownload,
  analysisStatus,
  showActions = true,
  className = ''
}) => {
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = () => {
    switch (file.type) {
      case 'pdf':
        return <FileText className="w-8 h-8 text-red-600" />;
      case 'docx':
        return <FileText className="w-8 h-8 text-blue-600" />;
      case 'image':
        return <ImageIcon className="w-8 h-8 text-green-600" />;
      default:
        return <FileIcon className="w-8 h-8 text-gray-600" />;
    }
  };

  const getStatusIcon = () => {
    switch (analysisStatus) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'processing':
        return <Clock className="w-5 h-5 text-blue-600 animate-spin" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      default:
        return null;
    }
  };

  const getStatusText = () => {
    switch (analysisStatus) {
      case 'completed':
        return 'Проанализирован';
      case 'processing':
        return 'Анализируется...';
      case 'error':
        return 'Ошибка анализа';
      case 'pending':
        return 'Ожидает анализа';
      default:
        return 'Готов к анализу';
    }
  };

  const getStatusColor = () => {
    switch (analysisStatus) {
      case 'completed':
        return 'text-green-600 bg-green-50';
      case 'processing':
        return 'text-blue-600 bg-blue-50';
      case 'error':
        return 'text-red-600 bg-red-50';
      case 'pending':
        return 'text-yellow-600 bg-yellow-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDownload) {
      onDownload(file);
    } else {
      // Default download behavior
      const link = document.createElement('a');
      link.href = file.url;
      link.download = file.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete(file);
    }
  };

  const handleAnalyze = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onAnalyze) {
      onAnalyze(file);
    }
  };

  const handlePreview = () => {
    onPreview(file);
  };

  return (
    <div 
      className={`bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200 cursor-pointer ${className}`}
      onClick={handlePreview}
    >
      {/* Thumbnail or Icon */}
      <div className="aspect-[4/3] relative bg-gray-50 rounded-t-lg overflow-hidden">
        {file.thumbnail ? (
          <img 
            src={file.thumbnail} 
            alt={file.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            {getFileIcon()}
          </div>
        )}
        
        {/* Status Badge */}
        {analysisStatus && (
          <div className={`absolute top-2 left-2 px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1 ${getStatusColor()}`}>
            {getStatusIcon()}
            <span>{getStatusText()}</span>
          </div>
        )}

        {/* Quick Actions Overlay */}
        {showActions && (
          <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 hover:opacity-100 transition-opacity duration-200 flex items-center justify-center space-x-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={handlePreview}
              className="bg-white text-gray-900 hover:bg-gray-100"
            >
              <Eye className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={handleDownload}
              className="bg-white text-gray-900 hover:bg-gray-100"
            >
              <Download className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>

      {/* File Info */}
      <div className="p-4">
        <h3 className="font-medium text-gray-900 truncate mb-1" title={file.name}>
          {file.name}
        </h3>
        
        <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
          <span>{formatFileSize(file.size)}</span>
          <span>{new Date(file.uploadedAt).toLocaleDateString('ru-RU')}</span>
        </div>

        {file.pageCount && (
          <div className="text-sm text-gray-500 mb-3">
            {file.pageCount} стр.
          </div>
        )}

        {/* Actions */}
        {showActions && (
          <div className="flex items-center justify-between">
            <Button
              size="sm"
              variant="outline"
              onClick={handlePreview}
              className="flex-1 mr-2"
            >
              <Eye className="w-4 h-4 mr-1" />
              Просмотр
            </Button>
            
            {onAnalyze && (
              <Button
                size="sm"
                onClick={handleAnalyze}
                disabled={analysisStatus === 'processing'}
                className="flex-1 mr-2 bg-blue-600 hover:bg-blue-700 text-white"
              >
                {analysisStatus === 'processing' ? 'Анализируется...' : 'Анализ'}
              </Button>
            )}

            {onDelete && (
              <Button
                size="sm"
                variant="ghost"
                onClick={handleDelete}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentCard;