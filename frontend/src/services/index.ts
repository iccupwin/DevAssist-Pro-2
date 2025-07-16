// API Services
export { apiClient } from './apiClient';
export { apiMonitoring } from './apiMonitoring';
export { devAssistApi } from './apiWrapper';
export { authBridge } from './authBridge';
export { authService } from './authService';
export { fileService } from './fileService';
export { default as fileUploadApi } from './fileUploadApi';
export { httpClient } from './httpClient';
export { httpClient as httpInterceptor } from './httpInterceptors';
export { integrationService } from './integrationService';
// mockApiService удален - используем только реальные API
export { realApiService } from './realApiService';
export { socketService } from './socketService';
export { unifiedApiClient } from './unifiedApiClient';
export { websocketBridge } from './websocketBridge';
export { queryClient } from './queryClient';

// Document Processing Services
export { documentProcessor } from './documentProcessor';
export { pdfProcessor } from './pdfProcessor';

// PDF Export Services
export { pdfExportService } from './pdfExportService';

// Types and interfaces
export type {
  FileMetadata,
  ApiResponse
} from './apiClient';

export type {
  DocumentProcessingResult,
  DocumentProcessingOptions,
  DocumentProcessingProgress,
  ProcessedPage,
  DocumentMetadata,
  ImageElement,
  TableElement,
  AnnotationElement
} from './documentProcessor';

export type {
  PDFProcessingResult,
  PDFProcessingOptions,
  PDFPageData,
  PDFMetadata,
  PDFPermissions,
  ImageData,
  TableData,
  AnnotationData
} from './pdfProcessor';

// PDF Export types are exported from types/pdfExport.ts