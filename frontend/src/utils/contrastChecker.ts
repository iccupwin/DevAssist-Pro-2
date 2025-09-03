/**
 * Утилиты для проверки контрастности цветов в соответствии с WCAG 2.1
 */

/**
 * Конвертация hex цвета в RGB
 */
export const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
};

/**
 * Вычисление относительной яркости цвета
 */
export const getLuminance = (r: number, g: number, b: number): number => {
  const [rs, gs, bs] = [r, g, b].map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
};

/**
 * Вычисление коэффициента контрастности между двумя цветами
 */
export const getContrastRatio = (color1: string, color2: string): number => {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);
  
  if (!rgb1 || !rgb2) return 0;
  
  const lum1 = getLuminance(rgb1.r, rgb1.g, rgb1.b);
  const lum2 = getLuminance(rgb2.r, rgb2.g, rgb2.b);
  
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  
  return (brightest + 0.05) / (darkest + 0.05);
};

/**
 * Проверка соответствия WCAG уровням
 */
export const checkWCAGCompliance = (contrastRatio: number, textSize: 'normal' | 'large' = 'normal') => {
  const thresholds = {
    normal: {
      aa: 4.5,
      aaa: 7
    },
    large: {
      aa: 3,
      aaa: 4.5
    }
  };
  
  const threshold = thresholds[textSize];
  
  return {
    aa: contrastRatio >= threshold.aa,
    aaa: contrastRatio >= threshold.aaa,
    ratio: contrastRatio
  };
};

/**
 * Получение цвета элемента из DOM
 */
export const getElementColor = (element: HTMLElement, property: 'color' | 'backgroundColor'): string => {
  const computedStyle = window.getComputedStyle(element);
  const color = computedStyle.getPropertyValue(property);
  
  // Конвертируем rgb в hex
  const rgbMatch = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  if (rgbMatch) {
    const r = parseInt(rgbMatch[1]);
    const g = parseInt(rgbMatch[2]);
    const b = parseInt(rgbMatch[3]);
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
  }
  
  return color;
};

/**
 * Анализ контрастности элемента
 */
export const analyzeElementContrast = (element: HTMLElement) => {
  const textColor = getElementColor(element, 'color');
  const backgroundColor = getElementColor(element, 'backgroundColor');
  
  // Если фон прозрачный, ищем фон родительского элемента
  let bgColor = backgroundColor;
  if (backgroundColor === 'rgba(0, 0, 0, 0)' || backgroundColor === 'transparent') {
    let parent = element.parentElement;
    while (parent) {
      const parentBg = getElementColor(parent, 'backgroundColor');
      if (parentBg !== 'rgba(0, 0, 0, 0)' && parentBg !== 'transparent') {
        bgColor = parentBg;
        break;
      }
      parent = parent.parentElement;
    }
    
    // Если не найден фон, используем белый по умолчанию
    if (bgColor === 'rgba(0, 0, 0, 0)' || bgColor === 'transparent') {
      bgColor = '#ffffff';
    }
  }
  
  const contrastRatio = getContrastRatio(textColor, bgColor);
  const fontSize = parseFloat(window.getComputedStyle(element).fontSize);
  const textSize = fontSize >= 18 || (fontSize >= 14 && window.getComputedStyle(element).fontWeight === 'bold') ? 'large' : 'normal';
  
  return {
    textColor,
    backgroundColor: bgColor,
    contrastRatio,
    textSize,
    compliance: checkWCAGCompliance(contrastRatio, textSize)
  };
};

/**
 * Сканирование всех текстовых элементов на странице
 */
export const scanPageContrast = () => {
  const textElements = document.querySelectorAll('p, h1, h2, h3, h4, h5, h6, span, div, a, button, input, label, td, th, li');
  const results: Array<{
    element: HTMLElement;
    selector: string;
    analysis: ReturnType<typeof analyzeElementContrast>;
  }> = [];
  
  textElements.forEach(element => {
    if (element instanceof HTMLElement && element.textContent?.trim()) {
      const analysis = analyzeElementContrast(element);
      const selector = generateSelector(element);
      
      results.push({
        element,
        selector,
        analysis
      });
    }
  });
  
  return results;
};

/**
 * Генерация CSS селектора для элемента
 */
const generateSelector = (element: HTMLElement): string => {
  if (element.id) {
    return `#${element.id}`;
  }
  
  if (element.className) {
    return `.${element.className.split(' ').join('.')}`;
  }
  
  const tagName = element.tagName.toLowerCase();
  const parent = element.parentElement;
  
  if (parent) {
    const siblings = Array.from(parent.children);
    const index = siblings.indexOf(element);
    return `${generateSelector(parent)} > ${tagName}:nth-child(${index + 1})`;
  }
  
  return tagName;
};

/**
 * Получение рекомендаций по улучшению контрастности
 */
export const getContrastRecommendations = (analysis: ReturnType<typeof analyzeElementContrast>) => {
  const recommendations: string[] = [];
  
  if (!analysis.compliance.aa) {
    recommendations.push(`Текущий контраст ${analysis.contrastRatio.toFixed(2)}:1 не соответствует WCAG AA (требуется ${analysis.textSize === 'large' ? '3' : '4.5'}:1)`);
    
    if (analysis.textSize === 'normal') {
      recommendations.push('Рассмотрите возможность увеличения размера шрифта до 18px или сделайте его жирным');
    }
    
    recommendations.push('Увеличьте контрастность между текстом и фоном');
    recommendations.push('Используйте более темный цвет текста или более светлый фон');
  }
  
  if (analysis.compliance.aa && !analysis.compliance.aaa) {
    recommendations.push(`Соответствует WCAG AA, но не AAA (требуется ${analysis.textSize === 'large' ? '4.5' : '7'}:1 для AAA)`);
    recommendations.push('Для улучшенной доступности рассмотрите дальнейшее увеличение контрастности');
  }
  
  if (analysis.compliance.aaa) {
    recommendations.push('Отличная контрастность! Соответствует WCAG AAA');
  }
  
  return recommendations;
};

/**
 * Предлагаемые цвета для улучшения контрастности
 */
export const suggestBetterColors = (currentTextColor: string, currentBgColor: string, targetLevel: 'aa' | 'aaa' = 'aa') => {
  const suggestions: { textColor: string; backgroundColor: string; contrast: number }[] = [];
  
  // Базовые цветовые комбинации с хорошей контрастностью
  const goodCombinations = [
    { text: '#000000', bg: '#ffffff', name: 'Черный на белом' },
    { text: '#ffffff', bg: '#000000', name: 'Белый на черном' },
    { text: '#212529', bg: '#ffffff', name: 'Темно-серый на белом' },
    { text: '#ffffff', bg: '#212529', name: 'Белый на темно-сером' },
    { text: '#495057', bg: '#ffffff', name: 'Серый на белом' },
    { text: '#ffffff', bg: '#495057', name: 'Белый на сером' },
    { text: '#0d6efd', bg: '#ffffff', name: 'Синий на белом' },
    { text: '#ffffff', bg: '#0d6efd', name: 'Белый на синем' },
    { text: '#dc3545', bg: '#ffffff', name: 'Красный на белом' },
    { text: '#ffffff', bg: '#dc3545', name: 'Белый на красном' },
    { text: '#198754', bg: '#ffffff', name: 'Зеленый на белом' },
    { text: '#ffffff', bg: '#198754', name: 'Белый на зеленом' }
  ];
  
  const requiredRatio = targetLevel === 'aa' ? 4.5 : 7;
  
  goodCombinations.forEach(combo => {
    const contrast = getContrastRatio(combo.text, combo.bg);
    if (contrast >= requiredRatio) {
      suggestions.push({
        textColor: combo.text,
        backgroundColor: combo.bg,
        contrast
      });
    }
  });
  
  return suggestions.sort((a, b) => b.contrast - a.contrast);
};

/**
 * Цветовая палитра приложения с проверкой контрастности
 */
export const appColorPalette = {
  // Основные цвета
  primary: '#2563eb',
  secondary: '#64748b',
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#3b82f6',
  
  // Нейтральные цвета
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827'
  },
  
  // Проверка контрастности палитры
  checkPalette: () => {
    const results: Record<string, any> = {};
    
    // Проверяем основные цвета на белом фоне
    ['primary', 'secondary', 'success', 'warning', 'error', 'info'].forEach(color => {
      const colorValue = appColorPalette[color as keyof typeof appColorPalette] as string;
      const whiteContrast = getContrastRatio(colorValue, '#ffffff');
      const blackContrast = getContrastRatio(colorValue, '#000000');
      
      results[color] = {
        onWhite: checkWCAGCompliance(whiteContrast),
        onBlack: checkWCAGCompliance(blackContrast)
      };
    });
    
    return results;
  }
};

const contrastCheckerUtils = {
  hexToRgb,
  getLuminance,
  getContrastRatio,
  checkWCAGCompliance,
  analyzeElementContrast,
  scanPageContrast,
  getContrastRecommendations,
  suggestBetterColors,
  appColorPalette
};

export default contrastCheckerUtils;