import React, { useState, useRef, useEffect } from 'react';
import { 
  FileText, 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  Download, 
  X, 
  Eye,
  Search,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  AlertCircle,
  FileIcon,
  Image as ImageIcon
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import LoadingSpinner from '../ui/LoadingSpinner';

export interface DocumentFile {
  id: string;
  name: string;
  type: 'pdf' | 'docx' | 'txt' | 'image';
  size: number;
  url: string;
  uploadedAt: Date;
  status: 'uploading' | 'uploaded' | 'processing' | 'error';
  pageCount?: number;
  extractedText?: string;
  thumbnail?: string;
}

interface DocumentPreviewProps {
  file: DocumentFile;
  isOpen: boolean;
  onClose: () => void;
  onAnalyze?: (file: DocumentFile) => void;
  showAnalyzeButton?: boolean;
  className?: string;
}

const DocumentPreview: React.FC<DocumentPreviewProps> = ({
  file,
  isOpen,
  onClose,
  onAnalyze,
  showAnalyzeButton = true,
  className = ''
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [extractedText, setExtractedText] = useState<string>('');

  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && file) {
      setIsLoading(true);
      setError(null);
      // Simulate document loading and text extraction
      setTimeout(() => {
        setIsLoading(false);
        if (file.extractedText) {
          setExtractedText(file.extractedText);
        } else {
          // Mock extracted text for demo
          setExtractedText(`
Извлеченный текст из документа "${file.name}"

Этот текст был автоматически извлечен из документа с помощью OCR технологии.
Здесь могут содержаться технические требования, коммерческие предложения,
спецификации и другая важная информация для анализа.

Ключевые разделы:
1. Общие требования
2. Технические характеристики  
3. Сроки выполнения
4. Стоимость работ
5. Условия поставки

Документ готов для AI-анализа в системе DevAssist Pro.
          `);
        }
      }, 1500);
    }
  }, [isOpen, file]);

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 25, 300));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 25, 50));
  };

  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  const handleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = file.url;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleAnalyze = () => {
    if (onAnalyze) {
      onAnalyze(file);
      onClose();
    }
  };

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
        return <FileText className="w-6 h-6 text-red-600" />;
      case 'docx':
        return <FileText className="w-6 h-6 text-blue-600" />;
      case 'image':
        return <ImageIcon className="w-6 h-6 text-green-600" />;
      default:
        return <FileIcon className="w-6 h-6 text-gray-600" />;
    }
  };

  const highlightSearchTerm = (text: string, term: string) => {
    if (!term) return text;
    const regex = new RegExp(`(${term})`, 'gi');
    return text.replace(regex, '<mark class="bg-yellow-200 text-yellow-900">$1</mark>');
  };

  if (!isOpen) return null;

  return (
    <div className={`fixed inset-0 z-50 bg-black bg-opacity-75 flex items-center justify-center p-4 ${className}`}>
      <div className={`bg-white rounded-lg shadow-2xl flex flex-col ${
        isFullscreen ? 'w-full h-full' : 'w-full max-w-6xl h-5/6'
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-gray-50 rounded-t-lg">
          <div className="flex items-center space-x-3">
            {getFileIcon()}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 truncate max-w-md">
                {file.name}
              </h3>
              <p className="text-sm text-gray-500">
                {formatFileSize(file.size)} • {new Date(file.uploadedAt).toLocaleDateString('ru-RU')}
                {file.pageCount && ` • ${file.pageCount} стр.`}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {showAnalyzeButton && (
              <Button 
                onClick={handleAnalyze}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Eye className="w-4 h-4 mr-2" />
                Анализировать
              </Button>
            )}
            <Button variant="ghost" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between p-3 border-b bg-gray-50">
          <div className="flex items-center space-x-2">
            {file.pageCount && (
              <>
                <Button variant="ghost" size="sm" onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-sm text-gray-600 min-w-[80px] text-center">
                  {currentPage} / {file.pageCount}
                </span>
                <Button variant="ghost" size="sm" onClick={() => setCurrentPage(Math.min(file.pageCount!, currentPage + 1))}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm" onClick={handleZoomOut}>
              <ZoomOut className="w-4 h-4" />
            </Button>
            <span className="text-sm text-gray-600 min-w-[60px] text-center">
              {zoom}%
            </span>
            <Button variant="ghost" size="sm" onClick={handleZoomIn}>
              <ZoomIn className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={handleRotate}>
              <RotateCw className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={handleFullscreen}>
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </Button>
            <Button variant="ghost" size="sm" onClick={handleDownload}>
              <Download className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Main Preview Area */}
          <div className="flex-1 flex flex-col">
            {isLoading ? (
              <div className="flex-1 flex items-center justify-center">
                <LoadingSpinner size="lg" text="Загружаем документ..." />
              </div>
            ) : error ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Ошибка загрузки</h3>
                  <p className="text-gray-500">{error}</p>
                </div>
              </div>
            ) : (
              <div 
                ref={previewRef}
                className="flex-1 overflow-auto bg-gray-100 p-4"
                style={{
                  transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
                  transformOrigin: 'center center'
                }}
              >
                {file.type === 'image' ? (
                  <img 
                    src={file.url} 
                    alt={file.name}
                    className="max-w-full h-auto mx-auto shadow-lg"
                  />
                ) : file.type === 'pdf' ? (
                  <div className="bg-white shadow-lg mx-auto max-w-4xl min-h-[800px] p-8">
                    <div className="border-2 border-dashed border-gray-300 h-full flex items-center justify-center">
                      <div className="text-center">
                        <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500">PDF Viewer будет интегрирован</p>
                        <p className="text-sm text-gray-400 mt-2">
                          Страница {currentPage} из {file.pageCount}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white shadow-lg mx-auto max-w-4xl min-h-[600px] p-8">
                    <div 
                      className="prose max-w-none"
                      dangerouslySetInnerHTML={{
                        __html: highlightSearchTerm(extractedText, searchTerm)
                      }}
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sidebar with extracted text and search */}
          {file.type !== 'image' && (
            <div className="w-80 border-l bg-gray-50 flex flex-col">
              <div className="p-4 border-b">
                <h4 className="font-medium text-gray-900 mb-3">Извлеченный текст</h4>
                <Input
                  placeholder="Поиск по тексту..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  icon={Search}
                  className="mb-3"
                />
              </div>
              
              <div className="flex-1 overflow-auto p-4">
                {isLoading ? (
                  <LoadingSpinner size="sm" text="Извлекаем текст..." />
                ) : (
                  <div 
                    className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap"
                    dangerouslySetInnerHTML={{
                      __html: highlightSearchTerm(extractedText, searchTerm)
                    }}
                  />
                )}
              </div>

              {showAnalyzeButton && (
                <div className="p-4 border-t">
                  <Button 
                    onClick={handleAnalyze}
                    fullWidth
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Начать AI-анализ
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DocumentPreview;