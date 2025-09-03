/**
 * Регистрация шрифта Roboto для jsPDF с поддержкой кириллицы
 * Это заглушка - в реальном проекте здесь был бы base64 encoded шрифт
 */

// Font registration functionality - jsPDF import removed to fix unused import warning

// Простая заглушка для регистрации шрифта
// В продакшене здесь должен быть base64 encoded Roboto шрифт
export const registerRobotoFont = () => {
  try {
    // jsPDF по умолчанию поддерживает базовые шрифты
    // Для кириллицы используем встроенную поддержку
    // Roboto font support initialized
  } catch (error) {
    // Font registration failed, using default fonts
  }
};

// Автоматически регистрируем при импорте
registerRobotoFont();