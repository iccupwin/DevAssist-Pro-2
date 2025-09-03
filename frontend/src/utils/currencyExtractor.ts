/**
 * Currency and Budget Extraction Utilities - DevAssist Pro
 * 💰 Извлечение сумм и валют из текста документов
 * 
 * Возможности:
 * - Распознавание различных форматов чисел и валют
 * - Поддержка русской и английской локализации
 * - Извлечение бюджетов из ТЗ и КП
 * - Нормализация валютных данных
 */

// Интерфейс для валютных данных
export interface CurrencyAmount {
  amount: number;
  currency: string;
  formatted: string;
  position: number;
}

// Паттерны для распознавания валют
const CURRENCY_PATTERNS = {
  // Рубли
  RUB: /(?:руб\.?|рублей?|₽|RUB)/gi,
  // Доллары
  USD: /(?:\$|USD|доллар[а-я]*)/gi,
  // Евро
  EUR: /(?:€|EUR|евро)/gi,
  // Казахстанский тенге
  KZT: /(?:₸|тенге|KZT)/gi,
  // Киргизский сом
  KGS: /(?:сом[а-я]*|KGS)/gi,
};

// Паттерны для распознавания чисел
const NUMBER_PATTERNS = [
  // Формат: 1 000 000 или 1,000,000
  /(\d{1,3}(?:[,\s]\d{3})+)/g,
  // Формат: 1000000
  /(\d{4,})/g,
  // Формат с десятичными: 1,500.50 или 1 500,50
  /(\d{1,3}(?:[,\s]\d{3})*[.,]\d{1,2})/g,
];

// Контекстные слова для бюджета/стоимости
const BUDGET_KEYWORDS = [
  'стоимость',
  'цена',
  'бюджет',
  'затрат[ы]?',
  'расход[ы]?',
  'сумма',
  'cost',
  'price',
  'budget',
  'amount',
  'всего',
  'итого',
  'общая',
  'полная',
  'окончательная'
];

// Создание регулярного выражения для поиска контекста
const BUDGET_CONTEXT_PATTERN = new RegExp(
  `(?:${BUDGET_KEYWORDS.join('|')})[:\\s-]*(?:составляет|равна|равен|is|equals?)?[:\\s-]*`,
  'gi'
);

/**
 * Нормализация строкового представления числа
 */
export const normalizeNumber = (numberStr: string): number => {
  // Убираем лишние пробелы и символы
  let normalized = numberStr.trim();
  
  // Заменяем пробелы на пустоту (для формата 1 000 000)
  normalized = normalized.replace(/\s/g, '');
  
  // Если есть запятая в качестве десятичного разделителя
  if (normalized.includes(',') && !normalized.includes('.')) {
    // Если запятая одна и после неё 1-2 цифры - это десятичный разделитель
    const commaCount = (normalized.match(/,/g) || []).length;
    if (commaCount === 1 && normalized.match(/,\d{1,2}$/)) {
      normalized = normalized.replace(',', '.');
    } else {
      // Иначе запятые - разделители тысяч
      normalized = normalized.replace(/,/g, '');
    }
  }
  
  // Убираем все запятые если есть точка (формат 1,000.50)
  if (normalized.includes('.')) {
    normalized = normalized.replace(/,/g, '');
  }
  
  return parseFloat(normalized) || 0;
};

/**
 * Определение валюты по тексту
 */
export const detectCurrency = (text: string, position: number = 0, windowSize: number = 50): string => {
  // Ищем валюту в окне вокруг позиции
  const start = Math.max(0, position - windowSize);
  const end = Math.min(text.length, position + windowSize);
  const window = text.substring(start, end);
  
  for (const [currency, pattern] of Object.entries(CURRENCY_PATTERNS)) {
    if (pattern.test(window)) {
      return currency;
    }
  }
  
  return 'RUB'; // По умолчанию рубли для российского рынка
};

/**
 * Форматирование валютной суммы
 */
export const formatCurrency = (amount: number, currency: string): string => {
  const currencySymbols: Record<string, string> = {
    'RUB': '₽',
    'USD': '$',
    'EUR': '€',
    'KZT': '₸',
    'KGS': 'сом'
  };

  const symbol = currencySymbols[currency] || currency;
  
  return new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount) + ' ' + symbol;
};

/**
 * Извлечение всех валютных сумм из текста
 */
export const extractCurrencyAmounts = (text: string): CurrencyAmount[] => {
  const results: CurrencyAmount[] = [];
  
  // Поиск по всем паттернам чисел
  for (const pattern of NUMBER_PATTERNS) {
    let match;
    const patternCopy = new RegExp(pattern.source, pattern.flags);
    
    while ((match = patternCopy.exec(text)) !== null) {
      const numberStr = match[1];
      const amount = normalizeNumber(numberStr);
      
      // Фильтруем слишком маленькие суммы (вероятно не бюджет)
      if (amount < 1000) continue;
      
      const position = match.index;
      const currency = detectCurrency(text, position);
      const formatted = formatCurrency(amount, currency);
      
      results.push({
        amount,
        currency,
        formatted,
        position
      });
    }
  }
  
  // Убираем дубликаты и сортируем по убыванию суммы
  const uniqueResults = results.filter((item, index, arr) => 
    arr.findIndex(other => 
      Math.abs(other.amount - item.amount) < 100 && other.currency === item.currency
    ) === index
  );
  
  return uniqueResults.sort((a, b) => b.amount - a.amount);
};

/**
 * Поиск бюджета в контексте ключевых слов
 */
export const extractBudgetFromContext = (text: string): CurrencyAmount | null => {
  const allAmounts = extractCurrencyAmounts(text);
  if (allAmounts.length === 0) return null;
  
  // Ищем суммы рядом с ключевыми словами бюджета
  const budgetContextMatches: Array<{amount: CurrencyAmount, score: number}> = [];
  
  let match;
  const contextPattern = new RegExp(BUDGET_CONTEXT_PATTERN.source, BUDGET_CONTEXT_PATTERN.flags);
  
  while ((match = contextPattern.exec(text)) !== null) {
    const contextPos = match.index;
    
    // Ищем ближайшую сумму к этому контексту
    for (const amount of allAmounts) {
      const distance = Math.abs(amount.position - contextPos);
      
      // Если сумма в пределах 200 символов от контекста
      if (distance <= 200) {
        const score = Math.max(0, 200 - distance) + amount.amount / 1000000; // Бонус за большую сумму
        budgetContextMatches.push({ amount, score });
      }
    }
  }
  
  if (budgetContextMatches.length > 0) {
    // Возвращаем сумму с лучшим score
    budgetContextMatches.sort((a, b) => b.score - a.score);
    return budgetContextMatches[0].amount;
  }
  
  // Если контекст не найден, возвращаем наибольшую сумму
  return allAmounts[0] || null;
};

/**
 * Извлечение бюджета из ТЗ
 */
export const extractTZBudget = (tzText: string): CurrencyAmount | null => {
  if (!tzText) return null;
  
  // Специфичные для ТЗ ключевые слова
  const tzSpecificPatterns = [
    /бюджет[а-я]*\s*проекта?[:\s-]*([^.;!?]*)/gi,
    /планируем[а-я]*\s*бюджет[:\s-]*([^.;!?]*)/gi,
    /выделен[а-я]*\s*средств?[а-я]*[:\s-]*([^.;!?]*)/gi,
    /лимит[а-я]*\s*затрат[:\s-]*([^.;!?]*)/gi,
  ];
  
  // Ищем по специфичным паттернам
  for (const pattern of tzSpecificPatterns) {
    let match;
    while ((match = pattern.exec(tzText)) !== null) {
      const context = match[1];
      const amounts = extractCurrencyAmounts(context);
      if (amounts.length > 0) {
        return amounts[0];
      }
    }
  }
  
  // Fallback к общему методу
  return extractBudgetFromContext(tzText);
};

/**
 * Извлечение бюджета из КП
 */
export const extractKPBudget = (kpText: string): CurrencyAmount | null => {
  if (!kpText) return null;
  
  // Специфичные для КП ключевые слова
  const kpSpecificPatterns = [
    /общая\s*стоимость[а-я]*[:\s-]*([^.;!?]*)/gi,
    /итого[в]?[а-я]*[:\s-]*([^.;!?]*)/gi,
    /всего\s*к\s*оплате[:\s-]*([^.;!?]*)/gi,
    /полная\s*стоимость[а-я]*[:\s-]*([^.;!?]*)/gi,
    /окончательная\s*цена[:\s-]*([^.;!?]*)/gi,
  ];
  
  // Ищем по специфичным паттернам
  for (const pattern of kpSpecificPatterns) {
    let match;
    while ((match = pattern.exec(kpText)) !== null) {
      const context = match[1];
      const amounts = extractCurrencyAmounts(context);
      if (amounts.length > 0) {
        return amounts[0];
      }
    }
  }
  
  // Fallback к общему методу
  return extractBudgetFromContext(kpText);
};

/**
 * Сравнение бюджетов и расчет отклонений
 */
export const compareBudgets = (tzBudget: CurrencyAmount | null, kpBudget: CurrencyAmount | null) => {
  if (!tzBudget || !kpBudget) {
    return {
      deviation_amount: 0,
      deviation_percentage: 0,
      status: 'unknown' as const,
      comparable: false
    };
  }
  
  // Конвертация валют (упрощенная - в реальном приложении нужен API курсов)
  const conversionRates: Record<string, number> = {
    'USD': 90, // К рублю
    'EUR': 100,
    'KZT': 0.2,
    'KGS': 1.1,
    'RUB': 1
  };
  
  const tzAmountInRub = tzBudget.amount * (conversionRates[tzBudget.currency] || 1);
  const kpAmountInRub = kpBudget.amount * (conversionRates[kpBudget.currency] || 1);
  
  const deviationAmount = kpAmountInRub - tzAmountInRub;
  const deviationPercentage = tzAmountInRub > 0 ? (deviationAmount / tzAmountInRub) * 100 : 0;
  
  const absDeviation = Math.abs(deviationPercentage);
  let status: 'excellent' | 'good' | 'warning' | 'critical';
  
  if (absDeviation <= 5) status = 'excellent';
  else if (absDeviation <= 15) status = 'good';
  else if (absDeviation <= 30) status = 'warning';
  else status = 'critical';
  
  return {
    deviation_amount: deviationAmount,
    deviation_percentage: deviationPercentage,
    status,
    comparable: true
  };
};

/**
 * Главная функция для извлечения бюджетных данных
 */
export const extractBudgetData = (tzText: string, kpText: string) => {
  const tzBudget = extractTZBudget(tzText);
  const kpBudget = extractKPBudget(kpText);
  const comparison = compareBudgets(tzBudget, kpBudget);
  
  return {
    tz_budget: tzBudget,
    kp_budget: kpBudget,
    deviation_amount: comparison.deviation_amount,
    deviation_percentage: comparison.deviation_percentage,
    status: comparison.status,
    comparable: comparison.comparable
  };
};