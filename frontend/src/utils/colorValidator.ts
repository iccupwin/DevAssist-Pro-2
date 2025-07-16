/**
 * Валидатор цветов для проверки дизайн-системы на соответствие WCAG
 */

import { getContrastRatio, checkWCAGCompliance } from './contrastChecker';

/**
 * Базовые цвета приложения для проверки
 */
export const baseColors = {
  // Основные цвета
  primary: '#2563eb',
  secondary: '#64748b',
  accent: '#8b5cf6',
  
  // Функциональные цвета (исправлены для WCAG AA)
  success: '#059669', // Более темный зеленый (было #10b981)
  warning: '#d97706', // Более темный оранжевый (было #f59e0b) 
  error: '#dc2626',   // Более темный красный (было #ef4444)
  info: '#2563eb',    // Более темный синий (было #3b82f6)
  
  // Нейтральные цвета
  white: '#ffffff',
  black: '#000000',
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
    900: '#111827',
    950: '#030712'
  },
  
  // Цвета для темной темы
  dark: {
    background: '#0f172a',
    surface: '#1e293b',
    elevated: '#334155',
    text: '#f1f5f9',
    textSecondary: '#cbd5e1',
    border: '#475569'
  }
};

/**
 * Цветовые комбинации для проверки контрастности
 */
export const colorCombinations = [
  // Основные комбинации
  { name: 'Primary on White', text: baseColors.primary, bg: baseColors.white },
  { name: 'Primary on Gray 50', text: baseColors.primary, bg: baseColors.gray[50] },
  { name: 'White on Primary', text: baseColors.white, bg: baseColors.primary },
  
  // Функциональные комбинации
  { name: 'Success on White', text: baseColors.success, bg: baseColors.white },
  { name: 'Warning on White', text: baseColors.warning, bg: baseColors.white },
  { name: 'Error on White', text: baseColors.error, bg: baseColors.white },
  { name: 'Info on White', text: baseColors.info, bg: baseColors.white },
  
  // Нейтральные комбинации
  { name: 'Gray 900 on White', text: baseColors.gray[900], bg: baseColors.white },
  { name: 'Gray 700 on White', text: baseColors.gray[700], bg: baseColors.white },
  { name: 'Gray 600 on White', text: baseColors.gray[600], bg: baseColors.white },
  { name: 'Gray 500 on White', text: baseColors.gray[500], bg: baseColors.white },
  
  // Темная тема
  { name: 'White on Dark Background', text: baseColors.white, bg: baseColors.dark.background },
  { name: 'Text on Dark Surface', text: baseColors.dark.text, bg: baseColors.dark.surface },
  { name: 'Secondary Text on Dark Surface', text: baseColors.dark.textSecondary, bg: baseColors.dark.surface },
  
  // Интерактивные элементы
  { name: 'White on Success', text: baseColors.white, bg: baseColors.success },
  { name: 'White on Warning', text: baseColors.white, bg: baseColors.warning },
  { name: 'White on Error', text: baseColors.white, bg: baseColors.error },
  { name: 'White on Info', text: baseColors.white, bg: baseColors.info }
];

/**
 * Проверка всех цветовых комбинаций
 */
export const validateColorSystem = () => {
  const results = colorCombinations.map(combo => {
    const contrastRatio = getContrastRatio(combo.text, combo.bg);
    const normalCompliance = checkWCAGCompliance(contrastRatio, 'normal');
    const largeCompliance = checkWCAGCompliance(contrastRatio, 'large');
    
    return {
      ...combo,
      contrastRatio,
      normalText: normalCompliance,
      largeText: largeCompliance,
      status: normalCompliance.aa ? 'pass' : 'fail'
    };
  });
  
  return results;
};

/**
 * Получение статистики по цветовой системе
 */
export const getColorSystemStats = () => {
  const results = validateColorSystem();
  
  return {
    total: results.length,
    passed: results.filter(r => r.status === 'pass').length,
    failed: results.filter(r => r.status === 'fail').length,
    aaCompliant: results.filter(r => r.normalText.aa).length,
    aaaCompliant: results.filter(r => r.normalText.aaa).length,
    largeTextAA: results.filter(r => r.largeText.aa).length,
    largeTextAAA: results.filter(r => r.largeText.aaa).length
  };
};

/**
 * Рекомендации по улучшению цветовой системы
 */
export const getColorSystemRecommendations = () => {
  const results = validateColorSystem();
  const recommendations: string[] = [];
  
  const failedCombinations = results.filter(r => r.status === 'fail');
  
  if (failedCombinations.length > 0) {
    recommendations.push(`${failedCombinations.length} цветовых комбинаций не соответствуют WCAG AA`);
    
    failedCombinations.forEach(combo => {
      if (combo.contrastRatio < 3) {
        recommendations.push(`${combo.name}: критически низкий контраст (${combo.contrastRatio.toFixed(2)}:1)`);
      } else if (combo.contrastRatio < 4.5) {
        recommendations.push(`${combo.name}: подходит только для крупного текста (${combo.contrastRatio.toFixed(2)}:1)`);
      }
    });
  }
  
  // Проверяем специфические цвета
  const warningOnWhite = results.find(r => r.name === 'Warning on White');
  if (warningOnWhite && warningOnWhite.contrastRatio < 4.5) {
    recommendations.push('Цвет предупреждения (#f59e0b) имеет низкий контраст на белом фоне');
  }
  
  const grayOnWhite = results.filter(r => r.name.includes('Gray') && r.bg === baseColors.white);
  const lowContrastGray = grayOnWhite.filter(r => r.contrastRatio < 4.5);
  
  if (lowContrastGray.length > 0) {
    recommendations.push('Некоторые серые цвета имеют низкий контраст для обычного текста');
  }
  
  return recommendations;
};

/**
 * Улучшенная цветовая палитра с лучшей контрастностью
 */
export const improvedColorPalette = {
  // Основные цвета (улучшенные)
  primary: '#1d4ed8', // Более темный синий для лучшего контраста
  secondary: '#475569', // Более темный серый
  accent: '#7c3aed', // Более темный фиолетовый
  
  // Функциональные цвета (улучшенные)
  success: '#059669', // Более темный зеленый
  warning: '#d97706', // Более темный оранжевый
  error: '#dc2626', // Более темный красный
  info: '#2563eb', // Более темный синий
  
  // Нейтральные цвета (расширенные)
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
    900: '#111827',
    950: '#030712'
  },
  
  // Специальные цвета для интерактивных элементов
  interactive: {
    hover: '#1e40af', // Для :hover состояний
    active: '#1e3a8a', // Для :active состояний
    focus: '#3b82f6', // Для :focus состояний
    disabled: '#9ca3af' // Для disabled элементов
  }
};

/**
 * Генерация CSS переменных для улучшенной палитры
 */
export const generateImprovedCSSVariables = () => {
  const cssVars: Record<string, string> = {};
  
  // Основные цвета
  Object.entries(improvedColorPalette).forEach(([key, value]) => {
    if (typeof value === 'string') {
      cssVars[`--color-${key}`] = value;
    } else if (typeof value === 'object') {
      Object.entries(value).forEach(([subKey, subValue]) => {
        cssVars[`--color-${key}-${subKey}`] = subValue;
      });
    }
  });
  
  return cssVars;
};

/**
 * Валидация конкретного цвета
 */
export const validateSingleColor = (color: string, background: string = '#ffffff') => {
  const contrastRatio = getContrastRatio(color, background);
  const normalCompliance = checkWCAGCompliance(contrastRatio, 'normal');
  const largeCompliance = checkWCAGCompliance(contrastRatio, 'large');
  
  return {
    color,
    background,
    contrastRatio,
    normalText: normalCompliance,
    largeText: largeCompliance,
    recommendations: normalCompliance.aa ? 
      ['Цвет соответствует WCAG AA'] : 
      [
        `Контраст ${contrastRatio.toFixed(2)}:1 ниже минимального 4.5:1`,
        'Рекомендуется сделать цвет темнее или светлее',
        largeCompliance.aa ? 'Подходит для крупного текста (18px+)' : 'Не подходит даже для крупного текста'
      ]
  };
};

/**
 * Автоматическая корректировка цвета для достижения нужного контраста
 */
export const adjustColorForContrast = (
  color: string, 
  background: string, 
  targetRatio: number = 4.5
): string => {
  // Это упрощенная версия - в реальном приложении нужна более сложная логика
  // для сохранения оттенка при изменении яркости
  
  const currentRatio = getContrastRatio(color, background);
  
  if (currentRatio >= targetRatio) {
    return color; // Цвет уже подходит
  }
  
  // Простая корректировка - делаем цвет темнее или светлее
  const rgb = color.match(/\w\w/g);
  if (!rgb) return color;
  
  const [r, g, b] = rgb.map(x => parseInt(x, 16));
  
  // Определяем, нужно ли делать цвет темнее или светлее
  const backgroundRgb = background.match(/\w\w/g);
  if (!backgroundRgb) return color;
  
  const [bgR, bgG, bgB] = backgroundRgb.map(x => parseInt(x, 16));
  const bgBrightness = (bgR + bgG + bgB) / 3;
  
  let newR, newG, newB;
  
  if (bgBrightness > 128) {
    // Светлый фон - делаем цвет темнее
    const factor = 0.8;
    newR = Math.round(r * factor);
    newG = Math.round(g * factor);
    newB = Math.round(b * factor);
  } else {
    // Темный фон - делаем цвет светлее
    const factor = 1.2;
    newR = Math.min(255, Math.round(r * factor));
    newG = Math.min(255, Math.round(g * factor));
    newB = Math.min(255, Math.round(b * factor));
  }
  
  return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
};

export default {
  baseColors,
  colorCombinations,
  validateColorSystem,
  getColorSystemStats,
  getColorSystemRecommendations,
  improvedColorPalette,
  generateImprovedCSSVariables,
  validateSingleColor,
  adjustColorForContrast
};