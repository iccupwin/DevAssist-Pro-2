import { 
  FileUploadResponse, 
  FileUploadProgress, 
  FileMetadata
} from './fileService';

// API endpoints configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';
const FILE_ENDPOINTS = {
  UPLOAD: `${API_BASE_URL}/files/upload`,
  DELETE: (fileId: string) => `${API_BASE_URL}/files/${fileId}`,
  METADATA: (fileId: string) => `${API_BASE_URL}/files/${fileId}/metadata`,
  CONTENT: (fileId: string) => `${API_BASE_URL}/files/${fileId}/content`,
  DOWNLOAD: (fileId: string) => `${API_BASE_URL}/files/${fileId}/download`,
  BATCH_UPLOAD: `${API_BASE_URL}/files/batch-upload`,
  STATUS: (fileId: string) => `${API_BASE_URL}/files/${fileId}/status`,
} as const;

// File upload API client
export class FileUploadApi {
  
  /**
   * Upload a single file with progress tracking
   */
  static async uploadFile(
    file: File,
    onProgress?: (progress: FileUploadProgress) => void
  ): Promise<FileUploadResponse> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const formData = new FormData();
      
      // Prepare form data
      formData.append('file', file);
      formData.append('fileName', file.name);
      formData.append('fileSize', file.size.toString());
      formData.append('fileType', file.type);
      formData.append('uploadedAt', new Date().toISOString());
      
      // Generate temporary file ID for progress tracking
      const tempFileId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Set up progress tracking
      if (onProgress) {
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const percentage = Math.round((event.loaded / event.total) * 100);
            onProgress({
              fileId: tempFileId,
              fileName: file.name,
              loaded: event.loaded,
              total: event.total,
              percentage,
              status: 'uploading'
            });
          }
        });
      }
      
      // Handle upload completion
      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const result = JSON.parse(xhr.responseText);
            
            // Final progress update
            if (onProgress) {
              onProgress({
                fileId: result.id || tempFileId,
                fileName: file.name,
                loaded: file.size,
                total: file.size,
                percentage: 100,
                status: 'completed'
              });
            }
            
            resolve({
              success: true,
              fileId: result.id,
              fileName: file.name,
              size: file.size,
              url: result.url,
              uploadedAt: new Date(result.uploadedAt || Date.now()),
              processingStatus: result.processingStatus || 'pending',
              message: 'Файл успешно загружен'
            });
          } catch (error) {
            reject(new Error('Ошибка парсинга ответа сервера'));
          }
        } else {
          const errorMessage = `HTTP ${xhr.status}: ${xhr.statusText}`;
          
          if (onProgress) {
            onProgress({
              fileId: tempFileId,
              fileName: file.name,
              loaded: 0,
              total: file.size,
              percentage: 0,
              status: 'failed',
              error: errorMessage
            });
          }
          
          reject(new Error(errorMessage));
        }
      });
      
      // Handle errors
      xhr.addEventListener('error', () => {
        const errorMessage = 'Ошибка сети при загрузке файла';
        
        if (onProgress) {
          onProgress({
            fileId: tempFileId,
            fileName: file.name,
            loaded: 0,
            total: file.size,
            percentage: 0,
            status: 'failed',
            error: errorMessage
          });
        }
        
        reject(new Error(errorMessage));
      });
      
      xhr.addEventListener('abort', () => {
        reject(new Error('Загрузка файла прервана'));
      });
      
      // Set up request
      xhr.open('POST', FILE_ENDPOINTS.UPLOAD);
      
      // Add authentication header if available
      const authToken = localStorage.getItem('authToken');
      if (authToken) {
        xhr.setRequestHeader('Authorization', `Bearer ${authToken}`);
      }
      
      // Send request
      xhr.send(formData);
    });
  }
  
  /**
   * Upload multiple files concurrently
   */
  static async uploadMultipleFiles(
    files: File[],
    onProgress?: (fileId: string, progress: FileUploadProgress) => void,
    maxConcurrency: number = 3
  ): Promise<FileUploadResponse[]> {
    const results: FileUploadResponse[] = [];
    const chunks = [];
    
    // Split files into chunks for controlled concurrency
    for (let i = 0; i < files.length; i += maxConcurrency) {
      chunks.push(files.slice(i, i + maxConcurrency));
    }
    
    // Process chunks sequentially, files within chunks concurrently
    for (const chunk of chunks) {
      const chunkPromises = chunk.map(file => 
        this.uploadFile(
          file, 
          onProgress ? (progress) => onProgress(progress.fileId, progress) : undefined
        ).catch(error => ({
          success: false,
          error: error.message,
          fileName: file.name
        } as FileUploadResponse))
      );
      
      const chunkResults = await Promise.all(chunkPromises);
      results.push(...chunkResults);
    }
    
    return results;
  }
  
  /**
   * Delete a file from the server
   */
  static async deleteFile(fileId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const authToken = localStorage.getItem('authToken');
      const response = await fetch(FILE_ENDPOINTS.DELETE(fileId), {
        method: 'DELETE',
        headers: {
          'Authorization': authToken ? `Bearer ${authToken}` : '',
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      return { success: true };
    } catch (error) {
      console.error('Ошибка удаления файла:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Неизвестная ошибка при удалении файла'
      };
    }
  }
  
  /**
   * Get file metadata
   */
  static async getFileMetadata(fileId: string): Promise<FileMetadata | null> {
    try {
      const authToken = localStorage.getItem('authToken');
      const response = await fetch(FILE_ENDPOINTS.METADATA(fileId), {
        headers: {
          'Authorization': authToken ? `Bearer ${authToken}` : '',
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      return {
        ...result,
        uploadedAt: new Date(result.uploadedAt)
      };
    } catch (error) {
      console.error('Ошибка получения метаданных файла:', error);
      return null;
    }
  }
  
  /**
   * Get file content (for text files)
   */
  static async getFileContent(fileId: string): Promise<string | null> {
    try {
      const authToken = localStorage.getItem('authToken');
      const response = await fetch(FILE_ENDPOINTS.CONTENT(fileId), {
        headers: {
          'Authorization': authToken ? `Bearer ${authToken}` : '',
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      return result.content;
    } catch (error) {
      console.error('Ошибка получения содержимого файла:', error);
      return null;
    }
  }
  
  /**
   * Download a file
   */
  static async downloadFile(fileId: string, fileName: string): Promise<void> {
    try {
      const authToken = localStorage.getItem('authToken');
      const response = await fetch(FILE_ENDPOINTS.DOWNLOAD(fileId), {
        headers: {
          'Authorization': authToken ? `Bearer ${authToken}` : ''
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Ошибка скачивания файла:', error);
      throw error;
    }
  }
  
  /**
   * Check file processing status
   */
  static async getFileStatus(fileId: string): Promise<{
    processingStatus: 'pending' | 'processing' | 'completed' | 'failed';
    extractedText?: string;
    pageCount?: number;
    error?: string;
  } | null> {
    try {
      const authToken = localStorage.getItem('authToken');
      const response = await fetch(FILE_ENDPOINTS.STATUS(fileId), {
        headers: {
          'Authorization': authToken ? `Bearer ${authToken}` : '',
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Ошибка получения статуса файла:', error);
      return null;
    }
  }
  
  /**
   * Batch upload with queue management
   */
  static async batchUpload(
    fileGroups: {
      tz_files: File[];
      kp_files: File[];
      additional_files: File[];
    },
    onProgress?: (groupType: string, fileId: string, progress: FileUploadProgress) => void
  ): Promise<{
    tz_results: FileUploadResponse[];
    kp_results: FileUploadResponse[];
    additional_results: FileUploadResponse[];
  }> {
    const results = {
      tz_results: [] as FileUploadResponse[],
      kp_results: [] as FileUploadResponse[],
      additional_results: [] as FileUploadResponse[]
    };
    
    // Upload TZ files first (usually just one)
    if (fileGroups.tz_files.length > 0) {
      results.tz_results = await this.uploadMultipleFiles(
        fileGroups.tz_files,
        onProgress ? (fileId, progress) => onProgress('tz', fileId, progress) : undefined,
        1 // TZ files uploaded one at a time
      );
    }
    
    // Upload KP files (can be multiple, uploaded concurrently)
    if (fileGroups.kp_files.length > 0) {
      results.kp_results = await this.uploadMultipleFiles(
        fileGroups.kp_files,
        onProgress ? (fileId, progress) => onProgress('kp', fileId, progress) : undefined,
        3 // Up to 3 KP files uploaded concurrently
      );
    }
    
    // Upload additional files (lowest priority)
    if (fileGroups.additional_files.length > 0) {
      results.additional_results = await this.uploadMultipleFiles(
        fileGroups.additional_files,
        onProgress ? (fileId, progress) => onProgress('additional', fileId, progress) : undefined,
        2 // Up to 2 additional files uploaded concurrently
      );
    }
    
    return results;
  }
}

// Default export for convenience
export default FileUploadApi;