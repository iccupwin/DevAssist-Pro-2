import { useState, useCallback } from 'react';
import { FileService, FileUploadResponse, FileUploadProgress, FileMetadata } from '../services/fileService';

interface UseFileUploadOptions {
  onProgress?: (fileId: string, progress: FileUploadProgress) => void;
  onComplete?: (response: FileUploadResponse) => void;
  onError?: (error: string) => void;
  multiple?: boolean;
  maxFiles?: number;
}

interface FileUploadState {
  uploading: boolean;
  progress: Record<string, FileUploadProgress>;
  uploadedFiles: FileUploadResponse[];
  errors: string[];
}

export const useFileUpload = (options: UseFileUploadOptions = {}) => {
  const [state, setState] = useState<FileUploadState>({
    uploading: false,
    progress: {},
    uploadedFiles: [],
    errors: []
  });

  const updateProgress = useCallback((progress: FileUploadProgress) => {
    setState(prev => ({
      ...prev,
      progress: {
        ...prev.progress,
        [progress.fileId]: progress
      }
    }));
    
    if (options.onProgress) {
      options.onProgress(progress.fileId, progress);
    }
  }, [options.onProgress]);

  const uploadFile = useCallback(async (file: File): Promise<FileUploadResponse> => {
    setState(prev => ({ ...prev, uploading: true, errors: [] }));

    try {
      const response = await FileService.uploadFile(file, updateProgress);
      
      setState(prev => ({
        ...prev,
        uploadedFiles: [...prev.uploadedFiles, response],
        uploading: false
      }));

      if (options.onComplete) {
        options.onComplete(response);
      }

      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Ошибка загрузки файла';
      
      setState(prev => ({
        ...prev,
        errors: [...prev.errors, errorMessage],
        uploading: false
      }));

      if (options.onError) {
        options.onError(errorMessage);
      }

      throw error;
    }
  }, [updateProgress, options.onComplete, options.onError]);

  const uploadMultipleFiles = useCallback(async (files: File[]): Promise<FileUploadResponse[]> => {
    if (!options.multiple) {
      throw new Error('Множественная загрузка не разрешена');
    }

    setState(prev => ({ ...prev, uploading: true, errors: [] }));

    try {
      const results = await FileService.uploadMultipleFiles(
        files,
        (fileId, progress) => updateProgress(progress),
        (results) => {
          setState(prev => ({
            ...prev,
            uploadedFiles: [...prev.uploadedFiles, ...results.filter(r => r.success)],
            uploading: false
          }));
        }
      );

      const errors = results
        .filter(r => !r.success)
        .map(r => r.error || 'Неизвестная ошибка');

      if (errors.length > 0) {
        setState(prev => ({
          ...prev,
          errors: [...prev.errors, ...errors]
        }));
      }

      return results;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Ошибка массовой загрузки';
      
      setState(prev => ({
        ...prev,
        errors: [...prev.errors, errorMessage],
        uploading: false
      }));

      throw error;
    }
  }, [options.multiple, updateProgress]);

  const removeFile = useCallback(async (fileId: string): Promise<void> => {
    try {
      const result = await FileService.deleteFile(fileId);
      
      if (result.success) {
        setState(prev => ({
          ...prev,
          uploadedFiles: prev.uploadedFiles.filter(f => f.fileId !== fileId),
          progress: Object.fromEntries(
            Object.entries(prev.progress).filter(([id]) => id !== fileId)
          )
        }));
      } else {
        throw new Error(result.error || 'Ошибка удаления файла');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Ошибка удаления файла';
      
      setState(prev => ({
        ...prev,
        errors: [...prev.errors, errorMessage]
      }));

      throw error;
    }
  }, []);

  const clearErrors = useCallback(() => {
    setState(prev => ({ ...prev, errors: [] }));
  }, []);

  const reset = useCallback(() => {
    setState({
      uploading: false,
      progress: {},
      uploadedFiles: [],
      errors: []
    });
  }, []);

  // Computed values
  const hasErrors = state.errors.length > 0;
  const isComplete = !state.uploading && Object.keys(state.progress).length > 0;
  const successfulUploads = state.uploadedFiles.filter(f => f.success);
  const totalProgress = Object.values(state.progress).length > 0 
    ? Object.values(state.progress).reduce((sum, p) => sum + p.percentage, 0) / Object.values(state.progress).length
    : 0;

  return {
    // State
    uploading: state.uploading,
    progress: state.progress,
    uploadedFiles: state.uploadedFiles,
    errors: state.errors,

    // Computed
    hasErrors,
    isComplete,
    successfulUploads,
    totalProgress,

    // Actions
    uploadFile,
    uploadMultipleFiles,
    removeFile,
    clearErrors,
    reset
  };
};

// Hook для получения метаданных файла
export const useFileMetadata = (fileId: string | null) => {
  const [metadata, setMetadata] = useState<FileMetadata | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMetadata = useCallback(async () => {
    if (!fileId) return;

    setLoading(true);
    setError(null);

    try {
      const data = await FileService.getFileMetadata(fileId);
      setMetadata(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки метаданных');
    } finally {
      setLoading(false);
    }
  }, [fileId]);

  // Загрузка метаданных при изменении fileId
  useState(() => {
    if (fileId) {
      fetchMetadata();
    }
  });

  return {
    metadata,
    loading,
    error,
    refetch: fetchMetadata
  };
};

// Hook для скачивания файлов
export const useFileDownload = () => {
  const [downloading, setDownloading] = useState<Record<string, boolean>>({});

  const downloadFile = useCallback(async (fileId: string, fileName: string) => {
    setDownloading(prev => ({ ...prev, [fileId]: true }));

    try {
      await FileService.downloadFile(fileId, fileName);
    } catch (error) {
      console.error('Ошибка скачивания файла:', error);
      throw error;
    } finally {
      setDownloading(prev => ({ ...prev, [fileId]: false }));
    }
  }, []);

  return {
    downloading,
    downloadFile
  };
};

export default useFileUpload;