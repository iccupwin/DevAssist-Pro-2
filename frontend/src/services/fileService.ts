// Сервис для работы с файлами
import FileUploadApi from './fileUploadApi';
export interface FileUploadResponse {
  success: boolean;
  fileId?: string;
  fileName?: string;
  size?: number;
  message?: string;
  error?: string;
  url?: string;
  uploadedAt?: Date;
  processingStatus?: 'pending' | 'processing' | 'completed' | 'failed';
}

export interface FileUploadProgress {
  fileId: string;
  fileName: string;
  loaded: number;
  total: number;
  percentage: number;
  status: 'uploading' | 'processing' | 'completed' | 'failed';
  error?: string;
}

export interface FileMetadata {
  id: string;
  fileName: string;
  originalName: string;
  size: number;
  type: string;
  url: string;
  uploadedAt: Date;
  processingStatus: 'pending' | 'processing' | 'completed' | 'failed';
  extractedText?: string;
  pageCount?: number;
  metadata?: Record<string, any>;
}

export interface FileValidationResult {
  isValid: boolean;
  error?: string;
}

// Конфигурация загрузки файлов
export const FILE_CONFIG = {
  MAX_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_TYPES: [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
    'text/plain',
  ],
  ALLOWED_EXTENSIONS: ['.pdf', '.docx', '.doc', '.txt'],
} as const;

export class FileService {
  static validateFile(file: File): FileValidationResult {
    // Проверка размера файла
    if (file.size > FILE_CONFIG.MAX_SIZE) {
      return {
        isValid: false,
        error: `Файл слишком большой. Максимальный размер: ${FILE_CONFIG.MAX_SIZE / 1024 / 1024}MB`,
      };
    }

    // Проверка типа файла
    if (!FILE_CONFIG.ALLOWED_TYPES.includes(file.type as any)) {
      return {
        isValid: false,
        error: `Неподдерживаемый тип файла. Разрешены: ${FILE_CONFIG.ALLOWED_EXTENSIONS.join(', ')}`,
      };
    }

    return { isValid: true };
  }

  static async uploadFile(
    file: File,
    onProgress?: (progress: FileUploadProgress) => void
  ): Promise<FileUploadResponse> {
    try {
      // Валидация файла
      const validation = this.validateFile(file);
      if (!validation.isValid) {
        return {
          success: false,
          error: validation.error,
        };
      }

      // Используем API клиент для загрузки
      return await FileUploadApi.uploadFile(file, onProgress);
    } catch (error) {
      console.error('Ошибка загрузки файла:', error);
      
      // Уведомление об ошибке
      if (onProgress) {
        onProgress({
          fileId: `temp_${Date.now()}`,
          fileName: file.name,
          loaded: 0,
          total: file.size,
          percentage: 0,
          status: 'failed',
          error: error instanceof Error ? error.message : 'Неизвестная ошибка'
        });
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Неизвестная ошибка при загрузке файла',
      };
    }
  }

  static async deleteFile(fileId: string): Promise<{ success: boolean; error?: string }> {
    return await FileUploadApi.deleteFile(fileId);
  }

  static async getFileMetadata(fileId: string): Promise<FileMetadata | null> {
    return await FileUploadApi.getFileMetadata(fileId);
  }

  static async getFileContent(fileId: string): Promise<string | null> {
    return await FileUploadApi.getFileContent(fileId);
  }

  static async downloadFile(fileId: string, fileName: string): Promise<void> {
    return await FileUploadApi.downloadFile(fileId, fileName);
  }

  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  static getFileIcon(fileName: string): string {
    const extension = fileName.toLowerCase().split('.').pop();
    
    switch (extension) {
      case 'pdf':
        return 'file-text';
      case 'doc':
      case 'docx':
        return 'file-text';
      case 'txt':
        return 'file-text';
      default:
        return 'file';
    }
  }

  static validateFiles(files: File[], fileType?: string): FileValidationResult {
    if (files.length === 0) {
      return {
        isValid: false,
        error: 'Не выбраны файлы для загрузки'
      };
    }

    // Проверка максимального количества файлов
    const MAX_FILES = 10;
    if (files.length > MAX_FILES) {
      return {
        isValid: false,
        error: `Превышено максимальное количество файлов. Максимум: ${MAX_FILES}`
      };
    }

    // Проверка общего размера файлов
    const totalSize = files.reduce((sum, file) => sum + file.size, 0);
    const MAX_TOTAL_SIZE = 100 * 1024 * 1024; // 100MB
    if (totalSize > MAX_TOTAL_SIZE) {
      return {
        isValid: false,
        error: `Общий размер файлов превышает лимит. Максимум: ${MAX_TOTAL_SIZE / 1024 / 1024}MB`
      };
    }

    // Проверка каждого файла
    for (const file of files) {
      const validation = this.validateFile(file);
      if (!validation.isValid) {
        return {
          isValid: false,
          error: `Файл "${file.name}": ${validation.error}`
        };
      }
    }

    return { isValid: true };
  }

  static async uploadMultipleFiles(
    files: File[],
    onProgress?: (fileId: string, progress: FileUploadProgress) => void,
    onComplete?: (results: FileUploadResponse[]) => void
  ): Promise<FileUploadResponse[]> {
    const validation = this.validateFiles(files);
    if (!validation.isValid) {
      throw new Error(validation.error);
    }

    try {
      const results = await FileUploadApi.uploadMultipleFiles(files, onProgress, 3);

      if (onComplete) {
        onComplete(results);
      }

      return results;
    } catch (error) {
      console.error('Ошибка массовой загрузки:', error);
      throw error;
    }
  }

  static async getFileStatus(fileId: string) {
    return await FileUploadApi.getFileStatus(fileId);
  }

  static async batchUpload(
    fileGroups: {
      tz_files: File[];
      kp_files: File[];
      additional_files: File[];
    },
    onProgress?: (groupType: string, fileId: string, progress: FileUploadProgress) => void
  ) {
    return await FileUploadApi.batchUpload(fileGroups, onProgress);
  }

  static createFileFromData(data: string, fileName: string): File {
    const blob = new Blob([data], { type: 'text/plain' });
    return new File([blob], fileName, { type: 'text/plain' });
  }
}

// Экспорт статических методов как объект для удобства использования
export const fileService = {
  validateFile: FileService.validateFile,
  validateFiles: FileService.validateFiles,
  uploadFile: FileService.uploadFile,
  uploadMultipleFiles: FileService.uploadMultipleFiles,
  deleteFile: FileService.deleteFile,
  getFileMetadata: FileService.getFileMetadata,
  getFileContent: FileService.getFileContent,
  downloadFile: FileService.downloadFile,
  getFileStatus: FileService.getFileStatus,
  batchUpload: FileService.batchUpload,
  formatFileSize: FileService.formatFileSize,
  getFileIcon: FileService.getFileIcon,
  createFileFromData: FileService.createFileFromData,
};

// Экспорт для совместимости с существующим кодом
export default fileService;