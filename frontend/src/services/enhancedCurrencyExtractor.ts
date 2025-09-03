/**
 * Enhanced Currency Extraction Service - Migrated from v2 with improvements
 * Extracts and parses financial data from documents with support for 8 currencies including KGS
 */

import { CurrencyInfo, ExtractedFinancials, CURRENCY_PATTERNS } from '../types/enhancedKpAnalyzer';

export class EnhancedCurrencyExtractor {
  private static readonly NUMBER_PATTERNS = {
    // Various number formats: 1000, 1 000, 1,000, 1.000, etc.
    simple: /\d{1,3}(?:[\s,.]?\d{3})*(?:[.,]\d{1,2})?/g,
    withCurrency: /(?:\d{1,3}(?:[\s,.]?\d{3})*(?:[.,]\d{1,2})?)\s*(?:сом|som|KGS|₽|руб|рубл|RUB|\$|USD|долл|dollar|€|EUR|евро|euro|₸|тенге|KZT|тг|сум|UZS|soum|сомони|TJS|somoni|₴|грн|UAH|гривна)/gi,
    range: /(?:от\s+)?(\d{1,3}(?:[\s,.]?\d{3})*(?:[.,]\d{1,2})?)\s*(?:до\s+(\d{1,3}(?:[\s,.]?\d{3})*(?:[.,]\d{1,2})?))?\s*(?:сом|som|KGS|₽|руб|рубл|RUB|\$|USD|долл|dollar|€|EUR|евро|euro|₸|тенге|KZT|тг|сум|UZS|soum|сомони|TJS|somoni|₴|грн|UAH|гривна)/gi
  };

  private static readonly COST_CATEGORIES = {
    development: ['разработка', 'development', 'программирование', 'coding', 'создание', 'разработки'],
    infrastructure: ['инфраструктура', 'infrastructure', 'серверы', 'servers', 'хостинг', 'hosting', 'облако', 'cloud'],
    support: ['поддержка', 'support', 'обслуживание', 'maintenance', 'сопровождение'],
    testing: ['тестирование', 'testing', 'тестинг', 'QA', 'качество', 'quality', 'проверка'],
    deployment: ['внедрение', 'deployment', 'развертывание', 'установка', 'implementation', 'запуск'],
    project_management: ['управление', 'management', 'менеджмент', 'координация', 'coordination', 'управления'],
    design: ['дизайн', 'design', 'интерфейс', 'UI', 'UX', 'макеты', 'верстка'],
    documentation: ['документация', 'documentation', 'техписание', 'мануалы', 'manuals', 'описание']
  };

  private static readonly TOTAL_BUDGET_KEYWORDS = [
    'общая стоимость', 'total cost', 'итого', 'total', 'сумма проекта', 'project cost',
    'бюджет проекта', 'project budget', 'полная стоимость', 'full cost',
    'весь проект', 'entire project', 'общий бюджет', 'total budget',
    'итоговая сумма', 'final amount', 'общие затраты', 'total expenses'
  ];

  /**
   * Extract all financial information from document text
   */
  static extractFinancialData(text: string): ExtractedFinancials {
    console.log('[CurrencyExtractor] Starting financial data extraction...');
    
    const currencies = this.extractCurrencies(text);
    const totalBudget = this.identifyTotalBudget(currencies, text);
    const costBreakdown = this.extractCostBreakdown(text, currencies);
    const paymentTerms = this.extractPaymentTerms(text);
    const financialNotes = this.extractFinancialNotes(text);

    const result: ExtractedFinancials = {
      totalBudget,
      currencies,
      paymentTerms,
      costBreakdown,
      financialNotes
    };

    console.log('[CurrencyExtractor] Extraction completed:', {
      currenciesFound: currencies.length,
      totalBudget: totalBudget?.amount,
      categoriesFound: Object.keys(costBreakdown).length,
      paymentTerms: paymentTerms.length
    });

    return result;
  }

  /**
   * Extract all currency amounts from text with enhanced accuracy
   */
  private static extractCurrencies(text: string): CurrencyInfo[] {
    const currencies: CurrencyInfo[] = [];
    const processedPositions = new Set<number>();

    // Process each currency type
    for (const [code, config] of Object.entries(CURRENCY_PATTERNS)) {
      const matches = Array.from(text.matchAll(config.regex));

      for (const match of matches) {
        if (!match.index || processedPositions.has(match.index)) continue;

        const amount = this.parseAmount(match[0]);
        if (amount > 0) {
          currencies.push({
            code: code as CurrencyInfo['code'],
            symbol: config.symbols[0],
            name: config.name,
            amount,
            originalText: match[0].trim(),
            position: match.index
          });
          
          // Mark nearby positions as processed to avoid duplicates
          for (let i = -10; i <= 10; i++) {
            processedPositions.add(match.index + i);
          }
        }
      }
    }

    // Sort by position in text and remove very close duplicates
    const sortedCurrencies = currencies.sort((a, b) => a.position - b.position);
    const filteredCurrencies = this.removeDuplicateCurrencies(sortedCurrencies);

    console.log('[CurrencyExtractor] Currencies extracted:', filteredCurrencies.length);
    return filteredCurrencies;
  }

  /**
   * Remove duplicate or very similar currency entries
   */
  private static removeDuplicateCurrencies(currencies: CurrencyInfo[]): CurrencyInfo[] {
    const filtered: CurrencyInfo[] = [];
    
    for (const currency of currencies) {
      const isDuplicate = filtered.some(existing => 
        existing.code === currency.code && 
        Math.abs(existing.amount - currency.amount) < existing.amount * 0.01 && // Within 1%
        Math.abs(existing.position - currency.position) < 50 // Within 50 characters
      );
      
      if (!isDuplicate) {
        filtered.push(currency);
      }
    }
    
    return filtered;
  }

  /**
   * Parse amount from currency string with enhanced accuracy
   */
  private static parseAmount(text: string): number {
    // Extract just the number part
    const numberMatch = text.match(/\d[\d\s,.]*/);
    if (!numberMatch) return 0;

    let numberStr = numberMatch[0];
    
    // Clean up the number string
    // Remove spaces
    numberStr = numberStr.replace(/\s/g, '');
    
    // Handle different decimal separators
    // If there's a comma and it's likely a decimal separator (less than 3 digits after)
    if (numberStr.includes(',')) {
      const parts = numberStr.split(',');
      if (parts.length === 2 && parts[1].length <= 2) {
        // Comma is decimal separator
        numberStr = parts[0].replace(/\./g, '') + '.' + parts[1];
      } else {
        // Comma is thousands separator
        numberStr = numberStr.replace(/,/g, '');
      }
    }
    
    // Handle multiple dots (thousands separators)
    const dotParts = numberStr.split('.');
    if (dotParts.length > 2) {
      // Multiple dots - treat all but last as thousands separators
      numberStr = dotParts.slice(0, -1).join('') + '.' + dotParts[dotParts.length - 1];
    } else if (dotParts.length === 2 && dotParts[1].length > 2) {
      // Single dot with more than 2 digits after - treat as thousands separator
      numberStr = dotParts.join('');
    }
    
    // Convert to number
    const amount = parseFloat(numberStr);
    return isNaN(amount) ? 0 : amount;
  }

  /**
   * Identify the main budget/total cost from currencies list
   */
  private static identifyTotalBudget(currencies: CurrencyInfo[], text: string): CurrencyInfo | undefined {
    if (currencies.length === 0) return undefined;

    // Look for keywords that indicate total budget
    for (const keyword of this.TOTAL_BUDGET_KEYWORDS) {
      const keywordIndex = text.toLowerCase().indexOf(keyword.toLowerCase());
      if (keywordIndex !== -1) {
        // Find closest currency within 200 characters
        const nearbyCurrency = currencies.find(c => 
          Math.abs(c.position - keywordIndex) < 200
        );
        if (nearbyCurrency) {
          console.log('[CurrencyExtractor] Total budget found via keyword:', keyword, nearbyCurrency);
          return nearbyCurrency;
        }
      }
    }

    // If no specific total found, return the largest amount
    const largestCurrency = currencies.reduce((max, current) => 
      current.amount > max.amount ? current : max
    );
    
    console.log('[CurrencyExtractor] Total budget identified as largest amount:', largestCurrency);
    return largestCurrency;
  }

  /**
   * Extract cost breakdown by categories with enhanced matching
   */
  private static extractCostBreakdown(text: string, currencies: CurrencyInfo[]): ExtractedFinancials['costBreakdown'] {
    const breakdown: ExtractedFinancials['costBreakdown'] = {};

    for (const [category, keywords] of Object.entries(this.COST_CATEGORIES)) {
      for (const keyword of keywords) {
        const keywordRegex = new RegExp(`\\b${keyword}\\b`, 'gi');
        const matches = Array.from(text.matchAll(keywordRegex));

        for (const match of matches) {
          if (!match.index) continue;

          // Find nearby currency (within 150 characters, extended range)
          const nearbyCurrency = currencies.find(c => 
            Math.abs(c.position - match.index) < 150
          );

          if (nearbyCurrency) {
            const categoryKey = category as keyof ExtractedFinancials['costBreakdown'];
            
            if (categoryKey === 'other') {
              if (!breakdown.other) breakdown.other = [];
              breakdown.other.push(nearbyCurrency);
            } else {
              // Only update if this is a better match (closer or larger amount)
              if (!breakdown[categoryKey] || 
                  Math.abs(nearbyCurrency.position - match.index) < Math.abs((breakdown[categoryKey] as CurrencyInfo).position - match.index) ||
                  nearbyCurrency.amount > (breakdown[categoryKey] as CurrencyInfo).amount) {
                breakdown[categoryKey] = nearbyCurrency;
              }
            }
            break;
          }
        }
      }
    }

    console.log('[CurrencyExtractor] Cost breakdown extracted:', Object.keys(breakdown));
    return breakdown;
  }

  /**
   * Extract payment terms and conditions with enhanced patterns
   */
  private static extractPaymentTerms(text: string): string[] {
    const terms: string[] = [];
    
    const paymentPatterns = [
      // Russian patterns
      /(?:оплата|платеж|взнос)[\s\S]{0,150}?(?:предоплата|аванс|в течение \d+|по завершении|поэтапно|после подписания|при получении)/gi,
      /\d+%[\s\S]{0,80}?(?:предоплата|аванс|при подписании|авансом)/gi,
      /(?:50|40|30|25|20|15|10)%[\s\S]{0,120}?(?:предоплата|аванс|при подписании|авансом)/gi,
      /(?:оплата|платеж)[\s\S]{0,80}?(?:поэтапно|по этапам|по результатам|при приемке)/gi,
      /в течение \d+[\s\S]{0,30}?(?:дней|рабочих дней|банковских дней|календарных дней)/gi,
      /(?:рассрочка|отсрочка)[\s\S]{0,100}?(?:платежа|оплаты|на \d+)/gi,
      
      // English patterns
      /(?:payment|billing)[\s\S]{0,150}?(?:prepayment|advance|within \d+|upon completion|in stages|milestone)/gi,
      /\d+%[\s\S]{0,80}?(?:prepayment|advance|upfront|down payment)/gi,
      /(?:payment)[\s\S]{0,80}?(?:in stages|milestone|upon delivery|net \d+)/gi
    ];

    for (const pattern of paymentPatterns) {
      const matches = Array.from(text.matchAll(pattern));
      for (const match of matches) {
        const term = match[0].replace(/\s+/g, ' ').trim();
        if (term.length > 15 && term.length < 200 && !terms.some(t => this.similarityCheck(t, term) > 0.7)) {
          terms.push(term);
        }
      }
    }

    console.log('[CurrencyExtractor] Payment terms extracted:', terms.length);
    return terms.slice(0, 10); // Limit to top 10 most relevant terms
  }

  /**
   * Extract financial notes and important information
   */
  private static extractFinancialNotes(text: string): string[] {
    const notes: string[] = [];

    const notePatterns = [
      /(?:внимание|важно|примечание|note|important|обратите внимание)[\s\S]{0,250}?(?:\.|!|$)/gi,
      /(?:НДС|VAT|налог|tax|подоходный|налогообложение)[\s\S]{0,150}?(?:\.|!|$)/gi,
      /(?:скидка|discount|бонус|bonus|льгота|выгода)[\s\S]{0,150}?(?:\.|!|$)/gi,
      /(?:дополнительно|additional|extra|сверх того|помимо)[\s\S]{0,180}?(?:\.|!|$)/gi,
      /(?:условия|terms|оговорки|conditions|требования|ограничения)[\s\S]{0,250}?(?:\.|!|$)/gi,
      /(?:гарантия|warranty|поддержка|support|обслуживание)[\s\S]{0,200}?(?:\.|!|$)/gi
    ];

    for (const pattern of notePatterns) {
      const matches = Array.from(text.matchAll(pattern));
      for (const match of matches) {
        const note = match[0].replace(/\s+/g, ' ').trim();
        if (note.length > 20 && note.length < 300 && !notes.some(n => this.similarityCheck(n, note) > 0.6)) {
          notes.push(note);
        }
      }
    }

    console.log('[CurrencyExtractor] Financial notes extracted:', notes.length);
    return notes.slice(0, 15); // Limit to top 15 most relevant notes
  }

  /**
   * Check similarity between two strings (simple implementation)
   */
  private static similarityCheck(str1: string, str2: string): number {
    if (str1.length < str2.length) {
      [str1, str2] = [str2, str1];
    }
    
    const longer = str1.toLowerCase();
    const shorter = str2.toLowerCase();
    
    if (longer.length === 0) return 1.0;
    
    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  /**
   * Calculate Levenshtein distance between two strings
   */
  private static levenshteinDistance(str1: string, str2: string): number {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  /**
   * Format currency amount with proper symbol and locale
   */
  static formatCurrency(currency: CurrencyInfo): string {
    const formatter = new Intl.NumberFormat('ru-RU', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    });

    const formattedAmount = formatter.format(currency.amount);
    
    // Place symbol appropriately based on currency
    switch (currency.code) {
      case 'USD':
      case 'EUR':
        return `${currency.symbol}${formattedAmount}`;
      default:
        return `${formattedAmount} ${currency.symbol}`;
    }
  }

  /**
   * Convert currency to USD for comparison (enhanced with more accurate rates)
   */
  static convertToUSD(currency: CurrencyInfo): number {
    // Simplified conversion rates (in production, would use real-time rates)
    const rates: Record<CurrencyInfo['code'], number> = {
      USD: 1,
      EUR: 1.08,
      RUB: 0.011,
      KGS: 0.011, // ~90 KGS per USD
      KZT: 0.002, // ~450 KZT per USD
      UZS: 0.000079, // ~12,600 UZS per USD
      TJS: 0.091, // ~11 TJS per USD
      UAH: 0.024 // ~42 UAH per USD
    };

    return currency.amount * (rates[currency.code] || 1);
  }

  /**
   * Get comprehensive currency statistics from extracted data
   */
  static getCurrencyStatistics(financials: ExtractedFinancials): {
    totalCurrencies: number;
    uniqueCurrencies: number;
    primaryCurrency: CurrencyInfo['code'] | null;
    totalValueUSD: number;
    hasMixedCurrencies: boolean;
    currencyDistribution: Record<string, number>;
    averageAmount: number;
    medianAmount: number;
    largestAmount: CurrencyInfo | null;
  } {
    const currencies = financials.currencies;
    const totalCurrencies = currencies.length;
    
    if (totalCurrencies === 0) {
      return {
        totalCurrencies: 0,
        uniqueCurrencies: 0,
        primaryCurrency: null,
        totalValueUSD: 0,
        hasMixedCurrencies: false,
        currencyDistribution: {},
        averageAmount: 0,
        medianAmount: 0,
        largestAmount: null
      };
    }

    // Find primary currency (most used)
    const currencyGroups = currencies.reduce((groups, c) => {
      groups[c.code] = (groups[c.code] || 0) + 1;
      return groups;
    }, {} as Record<string, number>);

    const primaryCurrency = Object.keys(currencyGroups).reduce((a, b) => 
      currencyGroups[a] > currencyGroups[b] ? a : b
    ) as CurrencyInfo['code'];

    // Calculate total value in USD
    const totalValueUSD = currencies.reduce((sum, c) => 
      sum + this.convertToUSD(c), 0
    );

    const hasMixedCurrencies = Object.keys(currencyGroups).length > 1;
    const uniqueCurrencies = Object.keys(currencyGroups).length;

    // Statistical calculations
    const amounts = currencies.map(c => c.amount).sort((a, b) => a - b);
    const averageAmount = amounts.reduce((sum, amt) => sum + amt, 0) / amounts.length;
    const medianAmount = amounts.length % 2 === 0 
      ? (amounts[amounts.length / 2 - 1] + amounts[amounts.length / 2]) / 2
      : amounts[Math.floor(amounts.length / 2)];
    
    const largestAmount = currencies.reduce((max, curr) => 
      curr.amount > max.amount ? curr : max
    );

    return {
      totalCurrencies,
      uniqueCurrencies,
      primaryCurrency,
      totalValueUSD,
      hasMixedCurrencies,
      currencyDistribution: currencyGroups,
      averageAmount,
      medianAmount,
      largestAmount
    };
  }

  /**
   * Validate extracted financial data quality
   */
  static validateFinancialData(financials: ExtractedFinancials): {
    isValid: boolean;
    confidence: number; // 0-100
    issues: string[];
    suggestions: string[];
  } {
    const issues: string[] = [];
    const suggestions: string[] = [];
    let confidence = 100;

    // Check if any currencies were found
    if (financials.currencies.length === 0) {
      issues.push('Валютные данные не обнаружены');
      confidence -= 30;
      suggestions.push('Проверьте, содержит ли документ финансовую информацию');
    }

    // Check for unrealistic amounts
    const unrealisticAmounts = financials.currencies.filter(c => c.amount > 1000000000 || c.amount < 0.01);
    if (unrealisticAmounts.length > 0) {
      issues.push(`Обнаружены нереалистичные суммы: ${unrealisticAmounts.length}`);
      confidence -= 10;
      suggestions.push('Проверьте правильность извлечения числовых значений');
    }

    // Check if total budget makes sense
    if (financials.totalBudget && financials.currencies.length > 1) {
      const otherAmounts = financials.currencies.filter(c => c !== financials.totalBudget);
      const sumOfOthers = otherAmounts.reduce((sum, c) => sum + this.convertToUSD(c), 0);
      const totalInUSD = this.convertToUSD(financials.totalBudget);
      
      if (totalInUSD < sumOfOthers * 0.8) {
        issues.push('Общий бюджет меньше суммы составляющих');
        confidence -= 15;
        suggestions.push('Проверьте правильность определения общего бюджета');
      }
    }

    // Check cost breakdown coverage
    const breakdownCount = Object.keys(financials.costBreakdown).filter(
      key => key !== 'other' && financials.costBreakdown[key as keyof typeof financials.costBreakdown]
    ).length;
    
    if (breakdownCount === 0) {
      suggestions.push('Детализация расходов не найдена - рассмотрите добавление структурированных данных');
      confidence -= 5;
    }

    const isValid = confidence >= 60 && issues.length < 3;

    return {
      isValid,
      confidence: Math.max(0, Math.min(100, confidence)),
      issues,
      suggestions
    };
  }
}