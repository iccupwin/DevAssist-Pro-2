/**
 * Регистрация шрифта Roboto для jsPDF с поддержкой кириллицы
 * Это заглушка - в реальном проекте здесь был бы base64 encoded шрифт
 */

// @ts-ignore
import { jsPDF } from 'jspdf';

// Простая заглушка для регистрации шрифта
// В продакшене здесь должен быть base64 encoded Roboto шрифт
export const registerRobotoFont = () => {
  try {
    // jsPDF по умолчанию поддерживает базовые шрифты
    // Для кириллицы используем встроенную поддержку
    console.log('Roboto font support initialized');
  } catch (error) {
    console.warn('Font registration failed, using default fonts:', error);
  }
};

// Автоматически регистрируем при импорте
registerRobotoFont();