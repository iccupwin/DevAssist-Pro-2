/**
 * Утилиты для оптимизации загрузки шрифтов
 */

export interface FontConfig {
  family: string;
  weights: number[];
  display?: 'auto' | 'block' | 'swap' | 'fallback' | 'optional';
  preload?: boolean;
  subset?: string;
}

/**
 * Предзагрузка критических шрифтов
 */
export const preloadFonts = (fonts: FontConfig[]) => {
  fonts.forEach(font => {
    if (font.preload) {
      font.weights.forEach(weight => {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'font';
        link.type = 'font/woff2';
        link.crossOrigin = 'anonymous';
        link.href = getFontUrl(font.family, weight, font.subset);
        document.head.appendChild(link);
      });
    }
  });
};

/**
 * Генерация URL для шрифта
 */
export const getFontUrl = (family: string, weight: number, subset?: string): string => {
  const baseUrl = 'https://fonts.googleapis.com/css2';
  const params = new URLSearchParams({
    family: `${family}:wght@${weight}`,
    display: 'swap'
  });
  
  if (subset) {
    params.append('subset', subset);
  }
  
  return `${baseUrl}?${params.toString()}`;
};

/**
 * Оптимизация CSS для шрифтов
 */
export const generateFontCSS = (fonts: FontConfig[]): string => {
  return fonts.map(font => {
    const weights = font.weights.join(';');
    const display = font.display || 'swap';
    
    return `
      @font-face {
        font-family: '${font.family}';
        font-weight: ${weights};
        font-display: ${display};
        src: url('${getFontUrl(font.family, font.weights[0], font.subset)}') format('woff2');
      }
    `;
  }).join('\n');
};

/**
 * Системные шрифты для fallback
 */
export const systemFonts = {
  sansSerif: [
    '-apple-system',
    'BlinkMacSystemFont',
    '"Segoe UI"',
    'Roboto',
    '"Helvetica Neue"',
    'Arial',
    'sans-serif'
  ],
  serif: [
    'Georgia',
    '"Times New Roman"',
    'Times',
    'serif'
  ],
  mono: [
    'Monaco',
    'Consolas',
    '"Liberation Mono"',
    '"Courier New"',
    'monospace'
  ]
};

/**
 * Генерация font-family с fallback
 */
export const createFontFamily = (primary: string, fallback: 'sans-serif' | 'serif' | 'mono'): string => {
  const fallbackFonts = systemFonts[fallback];
  return [`"${primary}"`, ...fallbackFonts].join(', ');
};

/**
 * Оптимизация для переменных шрифтов
 */
export const createVariableFont = (
  family: string,
  weightRange: { min: number; max: number },
  italicSupport: boolean = false
): string => {
  const axis = italicSupport ? 'wght,ital' : 'wght';
  const range = italicSupport 
    ? `${weightRange.min}..${weightRange.max},0..1` 
    : `${weightRange.min}..${weightRange.max}`;
  
  return `${family}:${axis}@${range}`;
};

/**
 * Мониторинг загрузки шрифтов
 */
export const monitorFontLoading = (fontFamily: string, weight: number = 400): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (!('fonts' in document)) {
      resolve(); // Fallback для старых браузеров
      return;
    }

    const font = new FontFace(fontFamily, `url(${getFontUrl(fontFamily, weight)})`, {
      weight: weight.toString(),
      display: 'swap'
    });

    font.load().then(() => {
      document.fonts.add(font);
      resolve();
    }).catch(reject);
  });
};

/**
 * Конфигурация шрифтов для приложения
 */
export const appFonts: FontConfig[] = [
  {
    family: 'Inter',
    weights: [400, 500, 600, 700],
    display: 'swap',
    preload: true,
    subset: 'latin,cyrillic'
  },
  {
    family: 'JetBrains Mono',
    weights: [400, 500],
    display: 'swap',
    preload: false,
    subset: 'latin,cyrillic'
  }
];

/**
 * Инициализация шрифтов
 */
export const initializeFonts = async () => {
  // Предзагрузка критических шрифтов
  preloadFonts(appFonts);
  
  // Мониторинг загрузки основного шрифта
  try {
    await monitorFontLoading('Inter', 400);
    console.log('✅ Inter font loaded successfully');
  } catch (error) {
    console.warn('⚠️ Inter font failed to load:', error);
  }
};

export default {
  preloadFonts,
  getFontUrl,
  generateFontCSS,
  createFontFamily,
  createVariableFont,
  monitorFontLoading,
  initializeFonts,
  appFonts
};