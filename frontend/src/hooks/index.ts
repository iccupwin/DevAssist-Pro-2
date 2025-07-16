// Authentication hooks
export { useAuth } from './useAuth';
export { useAuthGuard } from './useAuthGuard';
export { useAuthRedirect } from './useAuthRedirect';
export { useSessionTimeout } from './useSessionTimeout';
export { useSocialAuth } from './useSocialAuth';

// Document processing hooks
export { 
  useDocumentProcessor,
  usePDFProcessor,
  useTextExtractor
} from './useDocumentProcessor';

// File upload hooks
export { useFileUpload } from './useFileUpload';

// PDF export hooks (implemented in kpAnalyzer components)

// Real-time hooks
export { useSocket } from './useSocket';

// Query hooks
export * from './queries';

// UI и UX hooks
export { useToast } from './useToast';

// Lazy loading hooks
export { useLazyLoad, usePreload, useLazyImage, useLazyData } from './useLazyLoad';

// Мониторинг производительности
export { usePerformanceMonitor, useComponentPerformance, useRenderOptimization } from './usePerformanceMonitor';

// Клавиатурная навигация
export { 
  useKeyboardNavigation, 
  useFocusManagement, 
  useFocusTrap, 
  useHotkeys, 
  useFocusRoaming 
} from './useKeyboardNavigation';