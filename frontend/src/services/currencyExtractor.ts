/**
 * Currency Extraction Service for KP Analyzer v2
 * Extracts and parses financial data from documents with support for 8 currencies
 */

import { CurrencyInfo, ExtractedFinancials, CURRENCY_PATTERNS } from '../types/analysis.types';

export class CurrencyExtractor {
  private static readonly NUMBER_PATTERNS = {
    // Various number formats: 1000, 1 000, 1,000, 1.000, etc.
    simple: /\d{1,3}(?:[\s,.]?\d{3})*(?:[.,]\d{1,2})?/g,
    withCurrency: /(?:\d{1,3}(?:[\s,.]?\d{3})*(?:[.,]\d{1,2})?)\s*(?:сом|som|KGS|₽|руб|рубл|RUB|\$|USD|долл|dollar|€|EUR|евро|euro|₸|тенге|KZT|тг|сум|UZS|soum|сомони|TJS|somoni|₴|грн|UAH|гривна)/gi,
    range: /(?:от\s+)?(\d{1,3}(?:[\s,.]?\d{3})*(?:[.,]\d{1,2})?)\s*(?:до\s+(\d{1,3}(?:[\s,.]?\d{3})*(?:[.,]\d{1,2})?))?\s*(?:сом|som|KGS|₽|руб|рубл|RUB|\$|USD|долл|dollar|€|EUR|евро|euro|₸|тенге|KZT|тг|сум|UZS|soum|сомони|TJS|somoni|₴|грн|UAH|гривна)/gi
  };

  private static readonly COST_CATEGORIES = {
    development: ['разработка', 'development', 'программирование', 'coding', 'создание'],
    infrastructure: ['инфраструктура', 'infrastructure', 'серверы', 'servers', 'хостинг', 'hosting', 'облако', 'cloud'],
    support: ['поддержка', 'support', 'обслуживание', 'maintenance', 'сопровождение'],
    testing: ['тестирование', 'testing', 'тестинг', 'QA', 'качество', 'quality'],
    deployment: ['внедрение', 'deployment', 'развертывание', 'установка', 'implementation'],
    project_management: ['управление', 'management', 'менеджмент', 'координация', 'coordination'],
    design: ['дизайн', 'design', 'интерфейс', 'UI', 'UX', 'макеты'],
    documentation: ['документация', 'documentation', 'техписание', 'мануалы', 'manuals']
  };

  /**
   * Extract all financial information from document text
   */
  static extractFinancialData(text: string): ExtractedFinancials {
    const currencies = this.extractCurrencies(text);
    const totalBudget = this.identifyTotalBudget(currencies, text);
    const costBreakdown = this.extractCostBreakdown(text);
    const paymentTerms = this.extractPaymentTerms(text);
    const financialNotes = this.extractFinancialNotes(text);

    return {
      totalBudget,
      currencies,
      paymentTerms,
      costBreakdown,
      financialNotes
    };
  }

  /**
   * Extract all currency amounts from text
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
          processedPositions.add(match.index);
        }
      }
    }

    // Sort by position in text
    return currencies.sort((a, b) => a.position - b.position);
  }

  /**
   * Parse amount from currency string
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
    const totalKeywords = [
      'общая стоимость', 'total cost', 'итого', 'total', 'сумма проекта', 'project cost',
      'бюджет проекта', 'project budget', 'полная стоимость', 'full cost',
      'весь проект', 'entire project', 'общий бюджет', 'total budget'
    ];

    // Find currencies near total budget keywords
    for (const keyword of totalKeywords) {
      const keywordIndex = text.toLowerCase().indexOf(keyword.toLowerCase());
      if (keywordIndex !== -1) {
        // Find closest currency within 200 characters
        const nearbyCurrency = currencies.find(c => 
          Math.abs(c.position - keywordIndex) < 200
        );
        if (nearbyCurrency) return nearbyCurrency;
      }
    }

    // If no specific total found, return the largest amount
    return currencies.reduce((max, current) => 
      current.amount > max.amount ? current : max
    );
  }

  /**
   * Extract cost breakdown by categories
   */
  private static extractCostBreakdown(text: string): ExtractedFinancials['costBreakdown'] {
    const breakdown: ExtractedFinancials['costBreakdown'] = {};
    const currencies = this.extractCurrencies(text);

    for (const [category, keywords] of Object.entries(this.COST_CATEGORIES)) {
      for (const keyword of keywords) {
        const keywordRegex = new RegExp(keyword, 'gi');
        const matches = Array.from(text.matchAll(keywordRegex));

        for (const match of matches) {
          if (!match.index) continue;

          // Find nearby currency (within 100 characters)
          const nearbyCurrency = currencies.find(c => 
            Math.abs(c.position - match.index) < 100
          );

          if (nearbyCurrency) {
            const categoryKey = category as keyof ExtractedFinancials['costBreakdown'];
            
            if (categoryKey === 'other') {
              if (!breakdown.other) breakdown.other = [];
              breakdown.other.push(nearbyCurrency);
            } else {
              if (!breakdown[categoryKey] || nearbyCurrency.amount > (breakdown[categoryKey]?.amount || 0)) {
                breakdown[categoryKey] = nearbyCurrency;
              }
            }
            break;
          }
        }
      }
    }

    return breakdown;
  }

  /**
   * Extract payment terms and conditions
   */
  private static extractPaymentTerms(text: string): string[] {
    const terms: string[] = [];
    
    const paymentPatterns = [
      /(?:оплата|payment|платеж)[\s\S]{0,100}?(?:предоплата|prepayment|аванс|advance|в течение \d+|within \d+|по завершении|upon completion|поэтапно|in stages)/gi,
      /\d+%[\s\S]{0,50}?(?:предоплата|prepayment|аванс|advance)/gi,
      /(?:50|40|30|25|20|10)%[\s\S]{0,100}?(?:предоплата|аванс|prepayment|advance)/gi,
      /(?:оплата|payment)[\s\S]{0,50}?(?:поэтапно|in stages|по этапам|milestone)/gi,
      /в течение \d+[\s\S]{0,20}?(?:дней|days|рабочих дней|business days)/gi
    ];

    for (const pattern of paymentPatterns) {
      const matches = Array.from(text.matchAll(pattern));
      for (const match of matches) {
        const term = match[0].replace(/\s+/g, ' ').trim();
        if (term.length > 10 && !terms.some(t => t.includes(term.slice(0, 20)))) {
          terms.push(term);
        }
      }
    }

    return terms;
  }

  /**
   * Extract financial notes and important information
   */
  private static extractFinancialNotes(text: string): string[] {
    const notes: string[] = [];

    const notePatterns = [
      /(?:внимание|важно|примечание|note|important)[\s\S]{0,200}?(?:\.|$)/gi,
      /(?:НДС|VAT|налог|tax)[\s\S]{0,100}?(?:\.|$)/gi,
      /(?:скидка|discount|бонус|bonus)[\s\S]{0,100}?(?:\.|$)/gi,
      /(?:дополнительно|additional|extra)[\s\S]{0,150}?(?:\.|$)/gi,
      /(?:условия|terms|оговорки|conditions)[\s\S]{0,200}?(?:\.|$)/gi
    ];

    for (const pattern of notePatterns) {
      const matches = Array.from(text.matchAll(pattern));
      for (const match of matches) {
        const note = match[0].replace(/\s+/g, ' ').trim();
        if (note.length > 15 && !notes.some(n => n.includes(note.slice(0, 30)))) {
          notes.push(note);
        }
      }
    }

    return notes;
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
   * Convert currency to USD for comparison (simplified rates)
   */
  static convertToUSD(currency: CurrencyInfo): number {
    // Simplified conversion rates (in production, would use real-time rates)
    const rates: Record<CurrencyInfo['code'], number> = {
      USD: 1,
      EUR: 1.08,
      RUB: 0.011,
      KGS: 0.011,
      KZT: 0.002,
      UZS: 0.000079,
      TJS: 0.091,
      UAH: 0.024
    };

    return currency.amount * (rates[currency.code] || 1);
  }

  /**
   * Get currency statistics from extracted data
   */
  static getCurrencyStatistics(financials: ExtractedFinancials): {
    totalCurrencies: number;
    primaryCurrency: CurrencyInfo['code'] | null;
    totalValueUSD: number;
    hasMixedCurrencies: boolean;
  } {
    const currencies = financials.currencies;
    const totalCurrencies = currencies.length;
    
    if (totalCurrencies === 0) {
      return {
        totalCurrencies: 0,
        primaryCurrency: null,
        totalValueUSD: 0,
        hasMixedCurrencies: false
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

    return {
      totalCurrencies,
      primaryCurrency,
      totalValueUSD,
      hasMixedCurrencies
    };
  }
}