import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  SortAsc, 
  SortDesc, 
  Grid3X3, 
  List,
  Plus,
  FileText,
  AlertCircle
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import DocumentCard from './DocumentCard';
import DocumentPreview, { DocumentFile } from './DocumentPreview';

interface DocumentListProps {
  documents: DocumentFile[];
  onAnalyze?: (file: DocumentFile) => void;
  onDelete?: (file: DocumentFile) => void;
  onUpload?: () => void;
  analysisStatuses?: Record<string, 'pending' | 'processing' | 'completed' | 'error'>;
  title?: string;
  emptyMessage?: string;
  showUpload?: boolean;
  className?: string;
}

type SortField = 'name' | 'size' | 'uploadedAt' | 'type';
type SortOrder = 'asc' | 'desc';
type ViewMode = 'grid' | 'list';

const DocumentList: React.FC<DocumentListProps> = ({
  documents,
  onAnalyze,
  onDelete,
  onUpload,
  analysisStatuses = {},
  title = 'Документы',
  emptyMessage = 'Нет загруженных документов',
  showUpload = true,
  className = ''
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('uploadedAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [selectedFile, setSelectedFile] = useState<DocumentFile | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [filterType, setFilterType] = useState<string>('all');

  // Filter and sort documents
  const filteredAndSortedDocuments = React.useMemo(() => {
    let filtered = documents.filter(doc => {
      const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = filterType === 'all' || doc.type === filterType;
      return matchesSearch && matchesType;
    });

    return filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortField) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'size':
          aValue = a.size;
          bValue = b.size;
          break;
        case 'uploadedAt':
          aValue = new Date(a.uploadedAt).getTime();
          bValue = new Date(b.uploadedAt).getTime();
          break;
        case 'type':
          aValue = a.type;
          bValue = b.type;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [documents, searchTerm, sortField, sortOrder, filterType]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const handlePreview = (file: DocumentFile) => {
    setSelectedFile(file);
    setIsPreviewOpen(true);
  };

  const handleClosePreview = () => {
    setIsPreviewOpen(false);
    setSelectedFile(null);
  };

  const getDocumentTypeOptions = () => {
    const types = Array.from(new Set(documents.map(doc => doc.type)));
    return [
      { value: 'all', label: 'Все типы' },
      ...types.map(type => ({
        value: type,
        label: type.toUpperCase()
      }))
    ];
  };

  const SortButton = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => handleSort(field)}
      className={`flex items-center space-x-1 ${sortField === field ? 'bg-blue-50 text-blue-600' : ''}`}
    >
      <span>{children}</span>
      {sortField === field && (
        sortOrder === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />
      )}
    </Button>
  );

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
          <p className="text-gray-600 mt-1">
            {documents.length} документов • {filteredAndSortedDocuments.length} показано
          </p>
        </div>
        
        {showUpload && onUpload && (
          <Button onClick={onUpload} className="bg-blue-600 hover:bg-blue-700 text-white">
            <Plus className="w-4 h-4 mr-2" />
            Загрузить документы
          </Button>
        )}
      </div>

      {/* Filters and Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex-1 max-w-md">
          <Input
            placeholder="Поиск документов..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            icon={Search}
          />
        </div>

        <div className="flex items-center space-x-2">
          {/* Type Filter */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {getDocumentTypeOptions().map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          {/* Sort Options */}
          <div className="flex items-center space-x-1 bg-gray-100 rounded-md p-1">
            <SortButton field="name">Имя</SortButton>
            <SortButton field="uploadedAt">Дата</SortButton>
            <SortButton field="size">Размер</SortButton>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center bg-gray-100 rounded-md p-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode('grid')}
              className={viewMode === 'grid' ? 'bg-white shadow-sm' : ''}
            >
              <Grid3X3 className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode('list')}
              className={viewMode === 'list' ? 'bg-white shadow-sm' : ''}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Document List/Grid */}
      {filteredAndSortedDocuments.length === 0 ? (
        <div className="text-center py-12">
          {documents.length === 0 ? (
            <div>
              <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">{emptyMessage}</h3>
              <p className="text-gray-500 mb-6">
                Загрузите документы для анализа и обработки
              </p>
              {showUpload && onUpload && (
                <Button onClick={onUpload} className="bg-blue-600 hover:bg-blue-700 text-white">
                  <Plus className="w-4 h-4 mr-2" />
                  Загрузить первый документ
                </Button>
              )}
            </div>
          ) : (
            <div>
              <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Ничего не найдено</h3>
              <p className="text-gray-500">
                Попробуйте изменить критерии поиска или фильтры
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className={
          viewMode === 'grid' 
            ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6' 
            : 'space-y-4'
        }>
          {filteredAndSortedDocuments.map((file) => (
            <DocumentCard
              key={file.id}
              file={file}
              onPreview={handlePreview}
              onAnalyze={onAnalyze}
              onDelete={onDelete}
              analysisStatus={analysisStatuses[file.id]}
              className={viewMode === 'list' ? 'flex-row' : ''}
            />
          ))}
        </div>
      )}

      {/* Document Preview Modal */}
      {selectedFile && (
        <DocumentPreview
          file={selectedFile}
          isOpen={isPreviewOpen}
          onClose={handleClosePreview}
          onAnalyze={onAnalyze}
          showAnalyzeButton={!!onAnalyze}
        />
      )}
    </div>
  );
};

export default DocumentList;