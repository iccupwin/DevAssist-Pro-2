/**
 * Утилиты для обработки документов
 * Адаптированная версия file_utils.py под TypeScript/React
 */

export interface FileInfo {
  name: string;
  size: number;
  type: string;
  lastModified: number;
  isSupported: boolean;
  extension: string;
}

export interface ProcessedDocument {
  id: string;
  name: string;
  content: string;
  metadata: FileInfo;
  extractedData?: any;
  error?: string;
}

export class DocumentProcessor {
  private static readonly SUPPORTED_EXTENSIONS = new Set([
    '.pdf', '.docx', '.doc', '.txt', '.rtf'
  ]);

  private static readonly MAX_FILE_SIZE_MB = 50;

  /**
   * Проверяет поддерживается ли файл
   */
  static isFileSupported(file: File): boolean {
    const extension = this.getFileExtension(file.name);
    return this.SUPPORTED_EXTENSIONS.has(extension);
  }

  /**
   * Получает расширение файла
   */
  static getFileExtension(fileName: string): string {
    return fileName.toLowerCase().substring(fileName.lastIndexOf('.'));
  }

  /**
   * Получает информацию о файле
   */
  static getFileInfo(file: File): FileInfo {
    const extension = this.getFileExtension(file.name);
    
    return {
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: file.lastModified,
      extension,
      isSupported: this.SUPPORTED_EXTENSIONS.has(extension)
    };
  }

  /**
   * Валидация файла
   */
  static validateFile(file: File): { valid: boolean; error?: string; fileInfo?: FileInfo } {
    const fileInfo = this.getFileInfo(file);
    
    // Проверка размера
    if (file.size > this.MAX_FILE_SIZE_MB * 1024 * 1024) {
      return {
        valid: false,
        error: `Файл слишком большой: ${this.formatFileSize(file.size)} (максимум ${this.MAX_FILE_SIZE_MB} МБ)`,
        fileInfo
      };
    }

    // Проверка типа
    if (!fileInfo.isSupported) {
      return {
        valid: false,
        error: `Неподдерживаемый тип файла: ${fileInfo.extension}`,
        fileInfo
      };
    }

    return { valid: true, fileInfo };
  }

  /**
   * Форматирует размер файла
   */
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Б';
    
    const sizes = ['Б', 'КБ', 'МБ', 'ГБ'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    const size = bytes / Math.pow(1024, i);
    
    return `${size.toFixed(i === 0 ? 0 : 1)} ${sizes[i]}`;
  }

  /**
   * Читает содержимое файла как текст
   */
  static async readFileAsText(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        const content = event.target?.result as string;
        resolve(content || '');
      };
      
      reader.onerror = () => {
        reject(new Error('Ошибка чтения файла'));
      };
      
      // Пытаемся определить кодировку
      reader.readAsText(file, 'UTF-8');
    });
  }

  /**
   * Читает файл как ArrayBuffer (для PDF и других бинарных файлов)
   */
  static async readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        const content = event.target?.result as ArrayBuffer;
        resolve(content);
      };
      
      reader.onerror = () => {
        reject(new Error('Ошибка чтения файла'));
      };
      
      reader.readAsArrayBuffer(file);
    });
  }

  /**
   * Извлекает текст из файла в зависимости от типа
   */
  static async extractTextFromFile(file: File): Promise<string> {
    const validation = this.validateFile(file);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    const extension = this.getFileExtension(file.name);

    try {
      switch (extension) {
        case '.txt':
        case '.rtf':
          return await this.extractTextFromTxt(file);
        
        case '.pdf':
          return await this.extractTextFromPdf(file);
        
        case '.docx':
          return await this.extractTextFromDocx(file);
        
        case '.doc':
          return await this.extractTextFromDoc(file);
        
        default:
          throw new Error(`Неподдерживаемый тип файла: ${extension}`);
      }
    } catch (error) {
      console.error(`Ошибка обработки файла ${file.name}:`, error);
      throw new Error(`Ошибка извлечения текста: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
    }
  }

  /**
   * Извлекает текст из TXT файла
   */
  private static async extractTextFromTxt(file: File): Promise<string> {
    try {
      return await this.readFileAsText(file);
    } catch (error) {
      // Пытаемся с другими кодировками
      try {
        const arrayBuffer = await this.readFileAsArrayBuffer(file);
        const decoder = new TextDecoder('windows-1251');
        return decoder.decode(arrayBuffer);
      } catch {
        throw new Error('Не удалось определить кодировку текстового файла');
      }
    }
  }

  /**
   * Извлекает текст из PDF файла
   * Примечание: Для полноценной работы с PDF нужна библиотека типа pdf.js
   */
  private static async extractTextFromPdf(file: File): Promise<string> {
    // Временная заглушка - в реальной реализации нужно использовать pdf.js
    console.warn('PDF обработка требует интеграции с pdf.js библиотекой');
    
    // Простая проверка что это PDF файл
    const arrayBuffer = await this.readFileAsArrayBuffer(file);
    const uint8Array = new Uint8Array(arrayBuffer);
    const headerBytes = Array.from(uint8Array.slice(0, 4));
    const header = String.fromCharCode(...headerBytes);
    
    if (header !== '%PDF') {
      throw new Error('Файл не является корректным PDF документом');
    }

    // Возвращаем информацию о том, что нужна обработка на backend
    return `[PDF ФАЙЛ: ${file.name}]
Размер: ${this.formatFileSize(file.size)}
Примечание: Для извлечения текста из PDF файлов требуется обработка на сервере.
Загрузите файл для анализа через систему.`;
  }

  /**
   * Извлекает текст из DOCX файла
   * Примечание: Для полноценной работы с DOCX нужна специальная библиотека
   */
  private static async extractTextFromDocx(file: File): Promise<string> {
    // Временная заглушка - в реальной реализации можно использовать библиотеки типа mammoth.js
    console.warn('DOCX обработка требует интеграции со специальной библиотекой');
    
    return `[DOCX ФАЙЛ: ${file.name}]
Размер: ${this.formatFileSize(file.size)}
Примечание: Для извлечения текста из DOCX файлов требуется обработка на сервере.
Загрузите файл для анализа через систему.`;
  }

  /**
   * Извлекает текст из старого формата DOC
   */
  private static async extractTextFromDoc(file: File): Promise<string> {
    return `[DOC ФАЙЛ: ${file.name}]
Размер: ${this.formatFileSize(file.size)}
Примечание: Формат .doc не поддерживается. Пожалуйста, сохраните файл в формате .docx`;
  }

  /**
   * Обрабатывает несколько файлов параллельно
   */
  static async processMultipleFiles(files: FileList | File[]): Promise<ProcessedDocument[]> {
    const fileArray = Array.from(files);
    const results: ProcessedDocument[] = [];

    for (const file of fileArray) {
      try {
        const content = await this.extractTextFromFile(file);
        const metadata = this.getFileInfo(file);
        
        results.push({
          id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name: file.name,
          content,
          metadata
        });
      } catch (error) {
        const metadata = this.getFileInfo(file);
        
        results.push({
          id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name: file.name,
          content: '',
          metadata,
          error: error instanceof Error ? error.message : 'Неизвестная ошибка'
        });
      }
    }

    return results;
  }

  /**
   * Создает ссылку для скачивания файла
   */
  static createDownloadLink(content: string, filename: string, mimeType: string = 'text/plain'): string {
    const blob = new Blob([content], { type: mimeType });
    return URL.createObjectURL(blob);
  }

  /**
   * Скачивает контент как файл
   */
  static downloadFile(content: string, filename: string, mimeType: string = 'text/plain'): void {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    URL.revokeObjectURL(url);
  }

  /**
   * Создает превью документа (первые N символов)
   */
  static createPreview(content: string, maxLength: number = 500): string {
    if (content.length <= maxLength) {
      return content;
    }
    
    return content.substring(0, maxLength) + '...';
  }

  /**
   * Безопасное JSON парсинг (адаптация из ai_service.py)
   */
  static safeJsonParse(text: string): any {
    try {
      // Удаляем markdown форматирование
      let cleaned = text.trim();
      if (cleaned.startsWith("```json")) {
        cleaned = cleaned.substring(7);
      }
      if (cleaned.endsWith("```")) {
        cleaned = cleaned.substring(0, cleaned.length - 3);
      }
      cleaned = cleaned.trim();
      
      return JSON.parse(cleaned);
    } catch (error) {
      // Пытаемся извлечь JSON с помощью регулярных выражений
      const jsonMatch = text.match(/\{.*\}/s);
      if (jsonMatch) {
        try {
          return JSON.parse(jsonMatch[0]);
        } catch {
          // Игнорируем ошибку парсинга
        }
      }
      
      return {
        error: 'Ошибка парсинга JSON',
        raw_response: text.substring(0, 500)
      };
    }
  }
}

// Экспорт для совместимости
export const documentProcessor = DocumentProcessor;