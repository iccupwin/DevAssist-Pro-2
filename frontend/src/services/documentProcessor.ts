import { pdfProcessor, PDFProcessingResult, PDFProcessingOptions } from './pdfProcessor';
import { FileMetadata } from './fileService';

// Интерфейсы для обработки документов
export interface DocumentProcessingResult {
  success: boolean;
  fileId: string;
  originalFile: File;
  text?: string;
  metadata?: DocumentMetadata;
  preview?: string;
  pages?: ProcessedPage[];
  processingTime?: number;
  error?: string;
}

export interface ProcessedPage {
  pageNumber: number;
  text: string;
  images?: ImageElement[];
  tables?: TableElement[];
  annotations?: AnnotationElement[];
  dimensions: {
    width: number;
    height: number;
  };
}

export interface DocumentMetadata {
  title?: string;
  author?: string;
  subject?: string;
  creator?: string;
  pageCount: number;
  fileSize: number;
  format: 'pdf' | 'docx' | 'txt' | 'image';
  language?: string;
  encrypted?: boolean;
  extractedAt: Date;
  processingOptions: DocumentProcessingOptions;
}

export interface ImageElement {
  id: string;
  position: { x: number; y: number; width: number; height: number };
  type: string;
  dataUrl?: string;
  description?: string;
}

export interface TableElement {
  id: string;
  position: { x: number; y: number; width: number; height: number };
  rows: string[][];
  headers?: string[];
  caption?: string;
}

export interface AnnotationElement {
  id: string;
  type: string;
  content: string;
  position: { x: number; y: number; width: number; height: number };
  author?: string;
  createdAt?: Date;
}

export interface DocumentProcessingOptions {
  extractText: boolean;
  extractImages: boolean;
  extractTables: boolean;
  extractAnnotations: boolean;
  generatePreview: boolean;
  enableOCR: boolean;
  ocrLanguages?: string[];
  maxPages?: number;
  password?: string;
  quality?: 'fast' | 'balanced' | 'high';
}

export interface DocumentProcessingProgress {
  fileId: string;
  fileName: string;
  stage: 'validating' | 'extracting_text' | 'extracting_images' | 'extracting_tables' | 'generating_preview' | 'completed' | 'failed';
  progress: number; // 0-100
  currentPage?: number;
  totalPages?: number;
  message?: string;
  error?: string;
}

// Основной класс для обработки документов
export class DocumentProcessor {
  private static instance: DocumentProcessor;
  private progressCallbacks: Map<string, (progress: DocumentProcessingProgress) => void> = new Map();

  static getInstance(): DocumentProcessor {
    if (!DocumentProcessor.instance) {
      DocumentProcessor.instance = new DocumentProcessor();
    }
    return DocumentProcessor.instance;
  }

  /**
   * Обработка документа с опциями
   */
  async processDocument(
    file: File,
    options: Partial<DocumentProcessingOptions> = {},
    onProgress?: (progress: DocumentProcessingProgress) => void
  ): Promise<DocumentProcessingResult> {
    const fileId = `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const startTime = Date.now();

    // Настройки по умолчанию
    const defaultOptions: DocumentProcessingOptions = {
      extractText: true,
      extractImages: false,
      extractTables: true,
      extractAnnotations: false,
      generatePreview: true,
      enableOCR: false,
      quality: 'balanced'
    };

    const processingOptions = { ...defaultOptions, ...options };

    // Регистрация callback для прогресса
    if (onProgress) {
      this.progressCallbacks.set(fileId, onProgress);
    }

    try {
      // Определение типа документа
      const documentType = this.getDocumentType(file);
      
      this.updateProgress(fileId, {
        fileId,
        fileName: file.name,
        stage: 'validating',
        progress: 10,
        message: 'Проверка документа...'
      });

      let result: DocumentProcessingResult;

      switch (documentType) {
        case 'pdf':
          result = await this.processPDF(file, fileId, processingOptions);
          break;
        case 'docx':
          result = await this.processDOCX(file, fileId, processingOptions);
          break;
        case 'txt':
          result = await this.processTXT(file, fileId, processingOptions);
          break;
        case 'image':
          result = await this.processImage(file, fileId, processingOptions);
          break;
        default:
          throw new Error(`Неподдерживаемый тип документа: ${file.type}`);
      }

      result.processingTime = Date.now() - startTime;

      this.updateProgress(fileId, {
        fileId,
        fileName: file.name,
        stage: 'completed',
        progress: 100,
        message: 'Обработка завершена'
      });

      return result;

    } catch (error) {
      const errorResult: DocumentProcessingResult = {
        success: false,
        fileId,
        originalFile: file,
        error: error instanceof Error ? error.message : 'Неизвестная ошибка',
        processingTime: Date.now() - startTime
      };

      this.updateProgress(fileId, {
        fileId,
        fileName: file.name,
        stage: 'failed',
        progress: 0,
        error: errorResult.error
      });

      return errorResult;
    } finally {
      // Очистка callback
      this.progressCallbacks.delete(fileId);
    }
  }

  /**
   * Обработка PDF документа
   */
  private async processPDF(
    file: File,
    fileId: string,
    options: DocumentProcessingOptions
  ): Promise<DocumentProcessingResult> {
    
    this.updateProgress(fileId, {
      fileId,
      fileName: file.name,
      stage: 'extracting_text',
      progress: 20,
      message: 'Извлечение текста из PDF...'
    });

    // Настройки для PDF процессора
    const pdfOptions: Partial<PDFProcessingOptions> = {
      extractText: options.extractText,
      extractImages: options.extractImages,
      extractTables: options.extractTables,
      extractAnnotations: options.extractAnnotations,
      extractMetadata: true,
      enableOCR: options.enableOCR,
      ocrLanguages: options.ocrLanguages,
      maxPages: options.maxPages,
      password: options.password
    };

    // Обработка PDF
    const pdfResult: PDFProcessingResult = await pdfProcessor.processFile(file, pdfOptions);

    if (!pdfResult.success) {
      throw new Error(pdfResult.error || 'Ошибка обработки PDF');
    }

    this.updateProgress(fileId, {
      fileId,
      fileName: file.name,
      stage: 'extracting_tables',
      progress: 60,
      totalPages: pdfResult.pages?.length,
      message: 'Извлечение таблиц...'
    });

    // Конвертация результатов
    const pages: ProcessedPage[] = pdfResult.pages?.map((page: any) => ({
      pageNumber: page.pageNumber,
      text: page.text,
      images: page.images?.map((img: any) => ({
        id: img.id,
        position: { x: img.x, y: img.y, width: img.width, height: img.height },
        type: img.type,
        dataUrl: img.dataUrl
      })),
      tables: page.tables?.map((table: any) => ({
        id: table.id,
        position: { x: table.x, y: table.y, width: table.width, height: table.height },
        rows: table.rows
      })),
      annotations: page.annotations?.map((annotation: any) => ({
        id: annotation.id,
        type: annotation.type,
        content: annotation.content || '',
        position: { x: annotation.x, y: annotation.y, width: annotation.width, height: annotation.height }
      })),
      dimensions: page.dimensions
    })) || [];

    // Генерация превью
    let preview: string | undefined;
    if (options.generatePreview) {
      this.updateProgress(fileId, {
        fileId,
        fileName: file.name,
        stage: 'generating_preview',
        progress: 80,
        message: 'Генерация превью...'
      });

      preview = await pdfProcessor.generatePreview(file, { scale: 0.5 }) || undefined;
    }

    // Формирование метаданных
    const metadata: DocumentMetadata = {
      title: pdfResult.metadata?.title,
      author: pdfResult.metadata?.author,
      subject: pdfResult.metadata?.subject,
      creator: pdfResult.metadata?.creator,
      pageCount: pdfResult.metadata?.pageCount || 0,
      fileSize: file.size,
      format: 'pdf',
      encrypted: pdfResult.metadata?.encrypted,
      extractedAt: new Date(),
      processingOptions: options
    };

    return {
      success: true,
      fileId,
      originalFile: file,
      text: pdfResult.text,
      metadata,
      preview,
      pages
    };
  }

  /**
   * Обработка DOCX документа (заглушка)
   */
  private async processDOCX(
    file: File,
    fileId: string,
    options: DocumentProcessingOptions
  ): Promise<DocumentProcessingResult> {
    
    this.updateProgress(fileId, {
      fileId,
      fileName: file.name,
      stage: 'extracting_text',
      progress: 50,
      message: 'Обработка DOCX документа...'
    });

    // Простое чтение как текст (для демонстрации)
    // В реальной реализации здесь должен быть полноценный DOCX парсер
    const text = `Текст из DOCX документа: ${file.name}\n\nРазмер файла: ${file.size} байт\nТип: ${file.type}`;

    const metadata: DocumentMetadata = {
      title: file.name,
      pageCount: 1,
      fileSize: file.size,
      format: 'docx',
      extractedAt: new Date(),
      processingOptions: options
    };

    return {
      success: true,
      fileId,
      originalFile: file,
      text,
      metadata,
      pages: [{
        pageNumber: 1,
        text,
        dimensions: { width: 210, height: 297 } // A4 размер
      }]
    };
  }

  /**
   * Обработка текстового файла
   */
  private async processTXT(
    file: File,
    fileId: string,
    options: DocumentProcessingOptions
  ): Promise<DocumentProcessingResult> {
    
    this.updateProgress(fileId, {
      fileId,
      fileName: file.name,
      stage: 'extracting_text',
      progress: 50,
      message: 'Чтение текстового файла...'
    });

    const text = await this.readTextFile(file);

    const metadata: DocumentMetadata = {
      title: file.name,
      pageCount: 1,
      fileSize: file.size,
      format: 'txt',
      extractedAt: new Date(),
      processingOptions: options
    };

    return {
      success: true,
      fileId,
      originalFile: file,
      text,
      metadata,
      pages: [{
        pageNumber: 1,
        text,
        dimensions: { width: 210, height: 297 }
      }]
    };
  }

  /**
   * Обработка изображения (заглушка для OCR)
   */
  private async processImage(
    file: File,
    fileId: string,
    options: DocumentProcessingOptions
  ): Promise<DocumentProcessingResult> {
    
    this.updateProgress(fileId, {
      fileId,
      fileName: file.name,
      stage: 'extracting_text',
      progress: 50,
      message: 'Обработка изображения...'
    });

    // Генерация превью
    const preview = await this.generateImagePreview(file);

    let text = '';
    if (options.enableOCR) {
      text = 'OCR текст (заглушка): содержимое изображения будет распознано здесь';
    }

    const metadata: DocumentMetadata = {
      title: file.name,
      pageCount: 1,
      fileSize: file.size,
      format: 'image',
      extractedAt: new Date(),
      processingOptions: options
    };

    return {
      success: true,
      fileId,
      originalFile: file,
      text,
      metadata,
      preview,
      pages: [{
        pageNumber: 1,
        text,
        dimensions: { width: 0, height: 0 } // Будет определено после загрузки изображения
      }]
    };
  }

  /**
   * Определение типа документа
   */
  private getDocumentType(file: File): 'pdf' | 'docx' | 'txt' | 'image' {
    const type = file.type.toLowerCase();
    
    if (type.includes('pdf')) return 'pdf';
    if (type.includes('wordprocessingml') || type.includes('msword')) return 'docx';
    if (type.includes('text')) return 'txt';
    if (type.includes('image')) return 'image';
    
    // Проверка по расширению
    const extension = file.name.toLowerCase().split('.').pop();
    
    switch (extension) {
      case 'pdf': return 'pdf';
      case 'docx': case 'doc': return 'docx';
      case 'txt': return 'txt';
      case 'jpg': case 'jpeg': case 'png': case 'gif': case 'bmp': return 'image';
      default: return 'txt'; // По умолчанию как текст
    }
  }

  /**
   * Чтение текстового файла
   */
  private readTextFile(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Ошибка чтения файла'));
      reader.readAsText(file, 'utf-8');
    });
  }

  /**
   * Генерация превью изображения
   */
  private generateImagePreview(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Ошибка создания превью'));
      reader.readAsDataURL(file);
    });
  }

  /**
   * Обновление прогресса
   */
  private updateProgress(fileId: string, progress: DocumentProcessingProgress) {
    const callback = this.progressCallbacks.get(fileId);
    if (callback) {
      callback(progress);
    }
  }

  /**
   * Валидация документа перед обработкой
   */
  async validateDocument(file: File): Promise<{ isValid: boolean; error?: string }> {
    // Проверка размера
    const maxSize = 100 * 1024 * 1024; // 100MB
    if (file.size > maxSize) {
      return { isValid: false, error: 'Файл слишком большой (максимум 100MB)' };
    }

    if (file.size === 0) {
      return { isValid: false, error: 'Файл пустой' };
    }

    // Проверка типа
    const supportedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'text/plain',
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/bmp'
    ];

    const documentType = this.getDocumentType(file);
    
    // Специальная валидация для PDF
    if (documentType === 'pdf') {
      return await pdfProcessor.validatePDF(file);
    }

    return { isValid: true };
  }

  /**
   * Получение поддерживаемых форматов
   */
  getSupportedFormats(): string[] {
    return [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'text/plain',
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/bmp'
    ];
  }

  /**
   * Получение рекомендуемых настроек для типа документа
   */
  getRecommendedOptions(file: File): DocumentProcessingOptions {
    const documentType = this.getDocumentType(file);
    
    const baseOptions: DocumentProcessingOptions = {
      extractText: true,
      extractImages: false,
      extractTables: false,
      extractAnnotations: false,
      generatePreview: true,
      enableOCR: false,
      quality: 'balanced'
    };

    switch (documentType) {
      case 'pdf':
        return {
          ...baseOptions,
          extractTables: true,
          extractImages: true,
          extractAnnotations: true
        };
      case 'image':
        return {
          ...baseOptions,
          enableOCR: true,
          extractImages: true
        };
      default:
        return baseOptions;
    }
  }
}

// Экспорт singleton instance
export const documentProcessor = DocumentProcessor.getInstance();
export default documentProcessor;