/**
 * Утилиты для оптимизации ресурсов и изображений
 */

// Типы изображений и их оптимальные форматы
export const imageFormats = {
  webp: 'image/webp',
  avif: 'image/avif',
  jpeg: 'image/jpeg',
  png: 'image/png',
  svg: 'image/svg+xml'
};

/**
 * Проверка поддержки современных форматов изображений
 */
export const checkImageSupport = {
  webp: () => {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
  },
  
  avif: () => {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    return canvas.toDataURL('image/avif').indexOf('data:image/avif') === 0;
  }
};

/**
 * Получение оптимального формата изображения
 */
export const getOptimalImageFormat = (originalFormat: string): string => {
  // Проверяем поддержку современных форматов
  if (checkImageSupport.avif()) {
    return 'avif';
  }
  
  if (checkImageSupport.webp()) {
    return 'webp';
  }
  
  // Возвращаем оригинальный формат если современные не поддерживаются
  return originalFormat;
};

/**
 * Генерация URL для изображения с оптимальными параметрами
 */
export const generateOptimizedImageUrl = (
  src: string,
  options: {
    width?: number;
    height?: number;
    quality?: number;
    format?: 'auto' | 'webp' | 'avif' | 'jpeg' | 'png';
    blur?: number;
    progressive?: boolean;
  } = {}
): string => {
  const {
    width,
    height,
    quality = 85,
    format = 'auto',
    blur,
    progressive = true
  } = options;

  // Если это локальное изображение, возвращаем как есть
  if (src.startsWith('/') || src.startsWith('data:')) {
    return src;
  }

  // Для внешних изображений можно использовать сервис оптимизации
  // В реальном проекте здесь был бы URL API оптимизации изображений
  const baseUrl = process.env.REACT_APP_IMAGE_OPTIMIZER_URL || src;
  
  if (baseUrl === src) {
    return src; // Если нет сервиса оптимизации, возвращаем оригинал
  }

  const params = new URLSearchParams();
  
  if (width) params.append('w', width.toString());
  if (height) params.append('h', height.toString());
  params.append('q', quality.toString());
  
  if (format === 'auto') {
    params.append('f', getOptimalImageFormat('jpeg'));
  } else {
    params.append('f', format);
  }
  
  if (blur) params.append('blur', blur.toString());
  if (progressive) params.append('progressive', 'true');
  
  return `${baseUrl}?${params.toString()}`;
};

/**
 * Сжатие изображения на клиенте
 */
export const compressImage = (
  file: File,
  options: {
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
    format?: 'jpeg' | 'png' | 'webp';
  } = {}
): Promise<File> => {
  return new Promise((resolve, reject) => {
    const {
      maxWidth = 1920,
      maxHeight = 1080,
      quality = 0.8,
      format = 'jpeg'
    } = options;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      // Вычисляем новые размеры с сохранением пропорций
      let { width, height } = img;
      
      if (width > maxWidth || height > maxHeight) {
        const aspectRatio = width / height;
        
        if (width > height) {
          width = maxWidth;
          height = width / aspectRatio;
        } else {
          height = maxHeight;
          width = height * aspectRatio;
        }
      }

      canvas.width = width;
      canvas.height = height;

      // Рисуем изображение на canvas
      ctx?.drawImage(img, 0, 0, width, height);

      // Конвертируем в blob
      canvas.toBlob((blob) => {
        if (blob) {
          const compressedFile = new File([blob], file.name, {
            type: `image/${format}`,
            lastModified: Date.now()
          });
          resolve(compressedFile);
        } else {
          reject(new Error('Failed to compress image'));
        }
      }, `image/${format}`, quality);
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
};

/**
 * Предзагрузка критических изображений
 */
export const preloadImages = (urls: string[]): Promise<void[]> => {
  return Promise.all(
    urls.map(url => new Promise<void>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve();
      img.onerror = () => reject(new Error(`Failed to preload ${url}`));
      img.src = url;
    }))
  );
};

/**
 * Создание placeholder для изображений
 */
export const generatePlaceholder = (
  width: number,
  height: number,
  color: string = '#f0f0f0'
): string => {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, width, height);
  }
  
  return canvas.toDataURL('image/png');
};

/**
 * Оптимизация CSS и JS ресурсов
 */
export const optimizeResource = {
  // Минификация CSS
  minifyCSS: (css: string): string => {
    return css
      .replace(/\/\*[\s\S]*?\*\//g, '') // Удаляем комментарии
      .replace(/\s+/g, ' ') // Заменяем множественные пробелы
      .replace(/;\s*}/g, '}') // Убираем лишние точки с запятой
      .replace(/\s*{\s*/g, '{') // Убираем пробелы вокруг скобок
      .replace(/}\s*/g, '}')
      .replace(/;\s*/g, ';')
      .trim();
  },

  // Удаление неиспользуемых CSS правил
  removeUnusedCSS: (css: string, usedSelectors: string[]): string => {
    // Простая реализация - в реальном проекте лучше использовать PurgeCSS
    const rules = css.split('}');
    const usedRules = rules.filter(rule => {
      const selector = rule.split('{')[0]?.trim();
      return usedSelectors.some(used => selector?.includes(used));
    });
    
    return usedRules.join('}');
  },

  // Сжатие данных
  compressData: (data: any): string => {
    // В реальном проекте можно использовать библиотеки сжатия
    return JSON.stringify(data);
  }
};

/**
 * Кэширование ресурсов
 */
export const resourceCache = {
  // Кэш для изображений
  imageCache: new Map<string, string>(),
  
  // Кэш для данных
  dataCache: new Map<string, any>(),
  
  // Установка кэша
  set: (key: string, value: any, type: 'image' | 'data' = 'data') => {
    if (type === 'image') {
      resourceCache.imageCache.set(key, value);
    } else {
      resourceCache.dataCache.set(key, value);
    }
  },
  
  // Получение из кэша
  get: (key: string, type: 'image' | 'data' = 'data') => {
    if (type === 'image') {
      return resourceCache.imageCache.get(key);
    } else {
      return resourceCache.dataCache.get(key);
    }
  },
  
  // Очистка кэша
  clear: (type?: 'image' | 'data') => {
    if (type === 'image') {
      resourceCache.imageCache.clear();
    } else if (type === 'data') {
      resourceCache.dataCache.clear();
    } else {
      resourceCache.imageCache.clear();
      resourceCache.dataCache.clear();
    }
  }
};

/**
 * Мониторинг производительности
 */
export const performanceMonitor = {
  // Измерение времени загрузки ресурса
  measureResourceLoad: (url: string, callback: (time: number) => void) => {
    const startTime = performance.now();
    
    fetch(url)
      .then(() => {
        const loadTime = performance.now() - startTime;
        callback(loadTime);
      })
      .catch(() => {
        callback(-1); // Ошибка загрузки
      });
  },
  
  // Мониторинг размера bundle
  getBundleSize: async (): Promise<number> => {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      return estimate.usage || 0;
    }
    return 0;
  }
};

const assetOptimizerUtils = {
  generateOptimizedImageUrl,
  compressImage,
  preloadImages,
  generatePlaceholder,
  optimizeResource,
  resourceCache,
  performanceMonitor
};

export default assetOptimizerUtils;