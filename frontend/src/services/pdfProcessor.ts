// Dynamic imports to avoid TypeScript module resolution issues
// @ts-ignore
let pdfjsLib: any;

// Initialize PDF.js library
const initializePDFJS = async () => {
  if (!pdfjsLib) {
    try {
      pdfjsLib = await import('pdfjs-dist');
    } catch {
      // Fallback to require if dynamic import fails
      pdfjsLib = require('pdfjs-dist');
    }
    
    // Настройка PDF.js worker
    if (pdfjsLib) {
      pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
    }
  }
};

// Интерфейсы для обработки PDF
export interface PDFProcessingResult {
  success: boolean;
  text?: string;
  pages?: PDFPageData[];
  metadata?: PDFMetadata;
  error?: string;
  processingTime?: number;
}

export interface PDFPageData {
  pageNumber: number;
  text: string;
  images?: ImageData[];
  tables?: TableData[];
  annotations?: AnnotationData[];
  dimensions: {
    width: number;
    height: number;
  };
}

export interface PDFMetadata {
  title?: string;
  author?: string;
  subject?: string;
  creator?: string;
  producer?: string;
  creationDate?: Date;
  modificationDate?: Date;
  pageCount: number;
  fileSize: number;
  version?: string;
  encrypted?: boolean;
  permissions?: PDFPermissions;
}

export interface PDFPermissions {
  printing: boolean;
  copying: boolean;
  editing: boolean;
  commenting: boolean;
  formFilling: boolean;
  contentAccessibility: boolean;
  documentAssembly: boolean;
}

export interface ImageData {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  type: string;
  dataUrl?: string;
}

export interface TableData {
  id: string;
  rows: string[][];
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface AnnotationData {
  id: string;
  type: string;
  content?: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface PDFProcessingOptions {
  extractText: boolean;
  extractImages: boolean;
  extractTables: boolean;
  extractAnnotations: boolean;
  extractMetadata: boolean;
  enableOCR: boolean;
  ocrLanguages?: string[];
  maxPages?: number;
  password?: string;
}

// Основной класс для обработки PDF
export class PDFProcessor {
  private static instance: PDFProcessor;
  private isInitialized = false;

  static getInstance(): PDFProcessor {
    if (!PDFProcessor.instance) {
      PDFProcessor.instance = new PDFProcessor();
    }
    return PDFProcessor.instance;
  }

  private constructor() {
    this.initialize();
  }

  private async initialize() {
    try {
      // Проверяем доступность PDF.js
      if (typeof pdfjsLib === 'undefined') {
        throw new Error('PDF.js не загружен');
      }
      this.isInitialized = true;
    } catch (error) {
      console.error('Ошибка инициализации PDF процессора:', error);
    }
  }

  /**
   * Обработка PDF файла из File объекта
   */
  async processFile(
    file: File, 
    options: Partial<PDFProcessingOptions> = {}
  ): Promise<PDFProcessingResult> {
    // Initialize PDF.js first
    await initializePDFJS();
    
    const startTime = Date.now();
    
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      // Проверка типа файла
      if (!file.type.includes('pdf')) {
        throw new Error('Файл не является PDF');
      }

      // Чтение файла как ArrayBuffer
      const arrayBuffer = await this.fileToArrayBuffer(file);
      
      // Обработка PDF из ArrayBuffer
      const result = await this.processPDF(arrayBuffer, {
        extractText: true,
        extractImages: false,
        extractTables: false,
        extractAnnotations: false,
        extractMetadata: true,
        enableOCR: false,
        ...options
      });

      result.processingTime = Date.now() - startTime;
      return result;

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Неизвестная ошибка при обработке PDF',
        processingTime: Date.now() - startTime
      };
    }
  }

  /**
   * Обработка PDF из URL
   */
  async processURL(
    url: string, 
    options: Partial<PDFProcessingOptions> = {}
  ): Promise<PDFProcessingResult> {
    const startTime = Date.now();
    
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      // Загрузка PDF по URL
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Ошибка загрузки PDF: ${response.status}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      
      const result = await this.processPDF(arrayBuffer, {
        extractText: true,
        extractImages: false,
        extractTables: false,
        extractAnnotations: false,
        extractMetadata: true,
        enableOCR: false,
        ...options
      });

      result.processingTime = Date.now() - startTime;
      return result;

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Неизвестная ошибка при обработке PDF по URL',
        processingTime: Date.now() - startTime
      };
    }
  }

  /**
   * Основная функция обработки PDF из ArrayBuffer
   */
  private async processPDF(
    arrayBuffer: ArrayBuffer, 
    options: PDFProcessingOptions
  ): Promise<PDFProcessingResult> {
    try {
      // Загрузка PDF документа
      const loadingTask = pdfjsLib.getDocument({
        data: arrayBuffer,
        password: options.password
      });
      
      const pdf = await loadingTask.promise;
      
      // Извлечение метаданных
      let metadata: PDFMetadata | undefined;
      if (options.extractMetadata) {
        metadata = await this.extractMetadata(pdf, arrayBuffer.byteLength);
      }

      // Определение количества страниц для обработки
      const maxPages = options.maxPages || pdf.numPages;
      const pagesToProcess = Math.min(maxPages, pdf.numPages);

      // Обработка страниц
      const pages: PDFPageData[] = [];
      let allText = '';

      for (let pageNum = 1; pageNum <= pagesToProcess; pageNum++) {
        try {
          const page = await pdf.getPage(pageNum);
          const pageData = await this.processPage(page, pageNum, options);
          
          pages.push(pageData);
          allText += pageData.text + '\n\n';
          
          // Прогресс можно отправлять через callback если нужно
          console.log(`Обработана страница ${pageNum}/${pagesToProcess}`);
          
        } catch (pageError) {
          console.warn(`Ошибка обработки страницы ${pageNum}:`, pageError);
          // Продолжаем обработку остальных страниц
        }
      }

      return {
        success: true,
        text: allText.trim(),
        pages,
        metadata
      };

    } catch (error) {
      throw new Error(`Ошибка обработки PDF: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
    }
  }

  /**
   * Обработка отдельной страницы PDF
   */
  private async processPage(
    page: any, 
    pageNumber: number, 
    options: PDFProcessingOptions
  ): Promise<PDFPageData> {
    const viewport = page.getViewport({ scale: 1.0 });
    
    // Извлечение текста
    let text = '';
    if (options.extractText) {
      text = await this.extractTextFromPage(page);
    }

    // Извлечение изображений
    let images: ImageData[] = [];
    if (options.extractImages) {
      images = await this.extractImagesFromPage(page);
    }

    // Извлечение таблиц (базовая реализация)
    let tables: TableData[] = [];
    if (options.extractTables) {
      tables = await this.extractTablesFromPage(page, text);
    }

    // Извлечение аннотаций
    let annotations: AnnotationData[] = [];
    if (options.extractAnnotations) {
      annotations = await this.extractAnnotationsFromPage(page);
    }

    return {
      pageNumber,
      text,
      images,
      tables,
      annotations,
      dimensions: {
        width: viewport.width,
        height: viewport.height
      }
    };
  }

  /**
   * Извлечение текста со страницы
   */
  private async extractTextFromPage(page: any): Promise<string> {
    try {
      const textContent = await page.getTextContent();
      const textItems = textContent.items;
      
      // Сборка текста с учетом позиционирования
      let text = '';
      let lastY = -1;
      
      for (const item of textItems) {
        // Если это новая строка (изменилась Y координата)
        if (lastY !== -1 && Math.abs(item.transform[5] - lastY) > 5) {
          text += '\n';
        }
        
        text += item.str;
        
        // Добавляем пробел если нужно
        if (item.hasEOL || (item.str && !item.str.endsWith(' ') && !item.str.endsWith('\n'))) {
          text += ' ';
        }
        
        lastY = item.transform[5];
      }
      
      return text.trim();
    } catch (error) {
      console.warn('Ошибка извлечения текста:', error);
      return '';
    }
  }

  /**
   * Извлечение изображений со страницы
   */
  private async extractImagesFromPage(page: any): Promise<ImageData[]> {
    try {
      const operatorList = await page.getOperatorList();
      const images: ImageData[] = [];
      
      // Поиск операций рисования изображений
      for (let i = 0; i < operatorList.fnArray.length; i++) {
        if (operatorList.fnArray[i] === pdfjsLib.OPS.paintImageXObject) {
          // Здесь можно извлекать изображения, но это сложная операция
          // Пока что создаем заглушку
          images.push({
            id: `img_${i}`,
            x: 0,
            y: 0,
            width: 100,
            height: 100,
            type: 'image'
          });
        }
      }
      
      return images;
    } catch (error) {
      console.warn('Ошибка извлечения изображений:', error);
      return [];
    }
  }

  /**
   * Базовое извлечение таблиц из текста
   */
  private async extractTablesFromPage(page: any, text: string): Promise<TableData[]> {
    try {
      const tables: TableData[] = [];
      
      // Простейший алгоритм поиска таблиц по паттернам
      const lines = text.split('\n');
      let currentTable: string[][] = [];
      let inTable = false;
      
      for (const line of lines) {
        // Простая эвристика: если в строке много пробелов/табов, это может быть таблица
        const columns = line.split(/\s{2,}|\t/).filter(col => col.trim().length > 0);
        
        if (columns.length > 1) {
          if (!inTable) {
            inTable = true;
            currentTable = [];
          }
          currentTable.push(columns);
        } else if (inTable && currentTable.length > 1) {
          // Завершаем таблицу
          tables.push({
            id: `table_${tables.length}`,
            rows: currentTable,
            x: 0,
            y: 0,
            width: 100,
            height: currentTable.length * 20
          });
          inTable = false;
        }
      }
      
      return tables;
    } catch (error) {
      console.warn('Ошибка извлечения таблиц:', error);
      return [];
    }
  }

  /**
   * Извлечение аннотаций
   */
  private async extractAnnotationsFromPage(page: any): Promise<AnnotationData[]> {
    try {
      const annotations = await page.getAnnotations();
      
      return annotations.map((annotation: any, index: number) => ({
        id: `annotation_${index}`,
        type: annotation.subtype || 'unknown',
        content: annotation.contents || '',
        x: annotation.rect[0] || 0,
        y: annotation.rect[1] || 0,
        width: (annotation.rect[2] || 0) - (annotation.rect[0] || 0),
        height: (annotation.rect[3] || 0) - (annotation.rect[1] || 0)
      }));
    } catch (error) {
      console.warn('Ошибка извлечения аннотаций:', error);
      return [];
    }
  }

  /**
   * Извлечение метаданных PDF
   */
  private async extractMetadata(pdf: any, fileSize: number): Promise<PDFMetadata> {
    try {
      const metadata = await pdf.getMetadata();
      const info = metadata.info;
      
      return {
        title: info.Title || undefined,
        author: info.Author || undefined,
        subject: info.Subject || undefined,
        creator: info.Creator || undefined,
        producer: info.Producer || undefined,
        creationDate: info.CreationDate ? new Date(info.CreationDate) : undefined,
        modificationDate: info.ModDate ? new Date(info.ModDate) : undefined,
        pageCount: pdf.numPages,
        fileSize,
        version: info.PDFFormatVersion || undefined,
        encrypted: pdf.isEncrypted || false,
        permissions: {
          printing: true, // PDF.js не всегда предоставляет эту информацию
          copying: true,
          editing: true,
          commenting: true,
          formFilling: true,
          contentAccessibility: true,
          documentAssembly: true
        }
      };
    } catch (error) {
      console.warn('Ошибка извлечения метаданных:', error);
      return {
        pageCount: pdf.numPages,
        fileSize,
        encrypted: false,
        permissions: {
          printing: true,
          copying: true,
          editing: true,
          commenting: true,
          formFilling: true,
          contentAccessibility: true,
          documentAssembly: true
        }
      };
    }
  }

  /**
   * Конвертация File в ArrayBuffer
   */
  private fileToArrayBuffer(file: File): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as ArrayBuffer);
      reader.onerror = () => reject(new Error('Ошибка чтения файла'));
      reader.readAsArrayBuffer(file);
    });
  }

  /**
   * Валидация PDF файла
   */
  async validatePDF(file: File): Promise<{ isValid: boolean; error?: string }> {
    try {
      if (!file.type.includes('pdf')) {
        return { isValid: false, error: 'Файл не является PDF' };
      }

      if (file.size === 0) {
        return { isValid: false, error: 'Файл пустой' };
      }

      if (file.size > 50 * 1024 * 1024) { // 50MB limit
        return { isValid: false, error: 'Файл слишком большой (максимум 50MB)' };
      }

      // Попытка загрузить PDF для проверки валидности
      const arrayBuffer = await this.fileToArrayBuffer(file);
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      await loadingTask.promise;

      return { isValid: true };
    } catch (error) {
      return { 
        isValid: false, 
        error: `Невалидный PDF файл: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}` 
      };
    }
  }

  /**
   * Получение превью первой страницы PDF как изображение
   */
  async generatePreview(
    file: File, 
    options: { width?: number; height?: number; scale?: number } = {}
  ): Promise<string | null> {
    try {
      const arrayBuffer = await this.fileToArrayBuffer(file);
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;
      
      const page = await pdf.getPage(1);
      const scale = options.scale || 1.0;
      const viewport = page.getViewport({ scale });
      
      // Создание canvas для рендеринга
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      
      if (!context) {
        throw new Error('Не удалось создать 2D контекст');
      }

      canvas.height = viewport.height;
      canvas.width = viewport.width;

      // Рендеринг страницы
      await page.render({
        canvasContext: context,
        viewport: viewport
      }).promise;

      return canvas.toDataURL('image/jpeg', 0.8);
    } catch (error) {
      console.error('Ошибка генерации превью PDF:', error);
      return null;
    }
  }
}

// Экспорт singleton instance
export const pdfProcessor = PDFProcessor.getInstance();
export default pdfProcessor;