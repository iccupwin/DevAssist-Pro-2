// Сервис для работы с файлами
export interface FileUploadResponse {
  success: boolean;
  fileId?: string;
  fileName?: string;
  size?: number;
  message?: string;
  error?: string;
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

  static async uploadFile(file: File): Promise<FileUploadResponse> {
    try {
      // Валидация файла
      const validation = this.validateFile(file);
      if (!validation.isValid) {
        return {
          success: false,
          error: validation.error,
        };
      }

      // Создание FormData для отправки
      const formData = new FormData();
      formData.append('file', file);

      // Отправка файла на сервер
      const response = await fetch('/api/files/upload', {
        method: 'POST',
        body: formData,
        headers: {
          // Не устанавливаем Content-Type, браузер сам установит для FormData
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      return {
        success: true,
        fileId: result.id,
        fileName: file.name,
        size: file.size,
        message: 'Файл успешно загружен',
      };
    } catch (error) {
      console.error('Ошибка загрузки файла:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Неизвестная ошибка при загрузке файла',
      };
    }
  }

  static async deleteFile(fileId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`/api/files/${fileId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return { success: true };
    } catch (error) {
      console.error('Ошибка удаления файла:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Неизвестная ошибка при удалении файла',
      };
    }
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

  static validateFiles(files: File[], fileType: string): FileValidationResult {
    for (const file of files) {
      const validation = this.validateFile(file);
      if (!validation.isValid) {
        return validation;
      }
    }
    return { isValid: true };
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
  deleteFile: FileService.deleteFile,
  formatFileSize: FileService.formatFileSize,
  getFileIcon: FileService.getFileIcon,
  createFileFromData: FileService.createFileFromData,
};