/**
 * Экспорт всех утилит для приложения
 */

// Утилиты для работы с цветами и контрастностью
export * from './contrastChecker';
export * from './colorValidator';

// Утилиты для обработки документов
export * from './documentProcessor';

// Утилиты для работы с файлами
export * from './fileAdapters';

// Утилиты для KP анализатора
export * from './kpAnalyzerUtils';

// Утилиты для аутентификации
export * from './authUtils';

// Утилиты для оптимизации ресурсов
export * from './assetOptimizer';

// Импорт по умолчанию для контрастности
export { default as contrastChecker } from './contrastChecker';
export { default as colorValidator } from './colorValidator';

// Типы для удобства использования
export type { 
  ContrastAnalysis,
  ColorValidationResult,
  AssetOptimizationOptions,
  ImageCompressionOptions
} from './types';

// Создаем объект с основными утилитами
export const utils = {
  // Контрастность
  contrastChecker: () => import('./contrastChecker').then(m => m.default),
  colorValidator: () => import('./colorValidator').then(m => m.default),
  
  // Документы
  documentProcessor: () => import('./documentProcessor').then(m => (m as any).default || m),
  
  // Файлы
  fileAdapters: () => import('./fileAdapters').then(m => (m as any).default || m),
  
  // KP анализатор
  kpAnalyzerUtils: () => import('./kpAnalyzerUtils').then(m => (m as any).default || m),
  
  // Аутентификация
  authUtils: () => import('./authUtils').then(m => (m as any).default || m),
  
  // Оптимизация
  assetOptimizer: () => import('./assetOptimizer').then(m => (m as any).default || m)
};

export default utils;