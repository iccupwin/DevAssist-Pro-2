/**
 * Currency Detection and Processing Utilities
 * DevAssist Pro - KP Analyzer Enhanced Results
 */

import { Currency, MonetaryAmount } from '../types/kpAnalyzer';

// Supported currencies with their patterns and display information
export const SUPPORTED_CURRENCIES: Currency[] = [
  {
    code: 'RUB',
    symbol: '₽',
    name: 'Российский рубль',
    detected: false
  },
  {
    code: 'USD',
    symbol: '$',
    name: 'Доллар США',
    detected: false
  },
  {
    code: 'EUR',
    symbol: '€',
    name: 'Евро',
    detected: false
  },
  {
    code: 'KZT',
    symbol: '₸',
    name: 'Казахстанский тенге',
    detected: false
  },
  {
    code: 'UAH',
    symbol: '₴',
    name: 'Украинская гривна',
    detected: false
  },
  {
    code: 'BYN',
    symbol: 'Br',
    name: 'Белорусский рубль',
    detected: false
  }
];

// Currency detection patterns
const CURRENCY_PATTERNS: Record<string, RegExp[]> = {
  RUB: [
    /₽/g,
    /рубл[ьяей]/gi,
    /руб\.?/gi,
    /rub/gi,
    /российских?\s+рублей/gi
  ],
  USD: [
    /\$/g,
    /долл[ара]/gi,
    /usd/gi,
    /доллар[ов]/gi,
    /американских?\s+долларов/gi
  ],
  EUR: [
    /€/g,
    /евро/gi,
    /eur/gi,
    /европейских?\s+евро/gi
  ],
  KZT: [
    /₸/g,
    /тенге/gi,
    /kzt/gi,
    /казахстанских?\s+тенге/gi
  ],
  UAH: [
    /₴/g,
    /гривн[ыаы]/gi,
    /uah/gi,
    /украинских?\s+гривен/gi
  ],
  BYN: [
    /br/gi,
    /бел\.\s*рубл/gi,
    /белорусских?\s+рублей/gi,
    /byn/gi
  ]
};

// Number extraction patterns
const NUMBER_PATTERNS = [
  // With spaces as thousand separators: 1 000 000
  /(\d{1,3}(?:\s\d{3})*(?:[.,]\d{1,2})?)/g,
  // With commas as thousand separators: 1,000,000
  /(\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?)/g,
  // Simple numbers: 1000000
  /(\d+(?:[.,]\d{1,2})?)/g
];

/**
 * Detect currencies in text
 */
export function detectCurrencies(text: string): Currency[] {
  const detected: Currency[] = [];
  
  for (const currency of SUPPORTED_CURRENCIES) {
    const patterns = CURRENCY_PATTERNS[currency.code];
    let isDetected = false;
    
    for (const pattern of patterns) {
      if (pattern.test(text)) {
        isDetected = true;
        break;
      }
    }
    
    if (isDetected) {
      detected.push({
        ...currency,
        detected: true
      });
    }
  }
  
  // If no currency detected, default to RUB
  if (detected.length === 0) {
    detected.push({
      ...SUPPORTED_CURRENCIES.find(c => c.code === 'RUB')!,
      detected: false
    });
  }
  
  return detected;
}

/**
 * Extract monetary amounts from text
 */
export function extractMonetaryAmounts(text: string): MonetaryAmount[] {
  const amounts: MonetaryAmount[] = [];
  const detectedCurrencies = detectCurrencies(text);
  
  // For each detected currency, try to find associated amounts
  for (const currency of detectedCurrencies) {
    const patterns = CURRENCY_PATTERNS[currency.code];
    
    for (const currencyPattern of patterns) {
      const currencyMatches = [...text.matchAll(currencyPattern)];
      
      for (const currencyMatch of currencyMatches) {
        const currencyIndex = currencyMatch.index!;
        
        // Look for numbers near the currency symbol (within 50 characters)
        const searchStart = Math.max(0, currencyIndex - 50);
        const searchEnd = Math.min(text.length, currencyIndex + 50);
        const searchText = text.slice(searchStart, searchEnd);
        
        for (const numberPattern of NUMBER_PATTERNS) {
          const numberMatches = [...searchText.matchAll(numberPattern)];
          
          for (const numberMatch of numberMatches) {
            const numberStr = numberMatch[1];
            const cleanNumber = parseNumberString(numberStr);
            
            if (cleanNumber > 0) {
              amounts.push({
                amount: cleanNumber,
                currency,
                formatted: formatMonetaryAmount(cleanNumber, currency),
                original_text: numberStr
              });
            }
          }
        }
      }
    }
  }
  
  // Remove duplicates and sort by amount
  return deduplicateAmounts(amounts).sort((a, b) => b.amount - a.amount);
}

/**
 * Parse number string to float
 */
function parseNumberString(str: string): number {
  // Remove spaces and replace comma decimal separators
  const cleaned = str.replace(/\s/g, '').replace(',', '.');
  return parseFloat(cleaned) || 0;
}

/**
 * Format monetary amount with currency
 */
export function formatMonetaryAmount(
  amount: number, 
  currency: Currency, 
  options: { 
    showSymbol?: boolean;
    precision?: number;
    locale?: string;
  } = {}
): string {
  const {
    showSymbol = true,
    precision = 0,
    locale = 'ru-RU'
  } = options;
  
  try {
    const formatted = new Intl.NumberFormat(locale, {
      minimumFractionDigits: precision,
      maximumFractionDigits: precision
    }).format(amount);
    
    return showSymbol ? `${formatted} ${currency.symbol}` : formatted;
  } catch (error) {
    // Fallback formatting
    const formatted = amount.toLocaleString();
    return showSymbol ? `${formatted} ${currency.symbol}` : formatted;
  }
}

/**
 * Remove duplicate amounts (same value and currency)
 */
function deduplicateAmounts(amounts: MonetaryAmount[]): MonetaryAmount[] {
  const seen = new Set<string>();
  return amounts.filter(amount => {
    const key = `${amount.amount}-${amount.currency.code}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

/**
 * Convert amount between currencies (mock conversion rates)
 */
export function convertCurrency(
  amount: number,
  fromCurrency: Currency,
  toCurrency: Currency
): number {
  // Mock conversion rates (in real app, these would come from an API)
  const rates: Record<string, Record<string, number>> = {
    USD: { RUB: 95, EUR: 0.92, KZT: 450, UAH: 37, BYN: 3.2 },
    EUR: { RUB: 103, USD: 1.09, KZT: 490, UAH: 40, BYN: 3.5 },
    RUB: { USD: 0.0105, EUR: 0.0097, KZT: 4.8, UAH: 0.39, BYN: 0.034 },
    KZT: { USD: 0.0022, EUR: 0.002, RUB: 0.21, UAH: 0.081, BYN: 0.007 },
    UAH: { USD: 0.027, EUR: 0.025, RUB: 2.56, KZT: 12.3, BYN: 0.086 },
    BYN: { USD: 0.31, EUR: 0.29, RUB: 29.4, KZT: 141, UAH: 11.6 }
  };
  
  if (fromCurrency.code === toCurrency.code) {
    return amount;
  }
  
  const rate = rates[fromCurrency.code]?.[toCurrency.code] || 1;
  return amount * rate;
}

/**
 * Get primary currency from detected currencies
 */
export function getPrimaryCurrency(currencies: Currency[]): Currency {
  // Priority: detected currencies first, then RUB as default
  const detected = currencies.filter(c => c.detected);
  if (detected.length > 0) {
    return detected[0];
  }
  
  return SUPPORTED_CURRENCIES.find(c => c.code === 'RUB')!;
}

/**
 * Format percentage with proper styling
 */
export function formatPercentage(
  value: number,
  options: {
    precision?: number;
    showSign?: boolean;
  } = {}
): string {
  const { precision = 1, showSign = false } = options;
  
  const formatted = value.toFixed(precision);
  const sign = showSign && value > 0 ? '+' : '';
  
  return `${sign}${formatted}%`;
}

/**
 * Get color class for percentage values
 */
export function getPercentageColor(value: number): string {
  if (value > 10) return 'text-red-600';
  if (value > 0) return 'text-yellow-600';
  if (value > -10) return 'text-green-600';
  return 'text-green-700';
}

/**
 * Get color class for risk levels
 */
export function getRiskLevelColor(riskLevel: 'low' | 'medium' | 'high'): string {
  switch (riskLevel) {
    case 'low': return 'text-green-600 bg-green-50 border-green-200';
    case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    case 'high': return 'text-red-600 bg-red-50 border-red-200';
    default: return 'text-gray-600 bg-gray-50 border-gray-200';
  }
}

/**
 * Get score color based on value
 */
export function getScoreColor(score: number): string {
  if (score >= 80) return 'text-green-600 bg-green-50 border-green-200';
  if (score >= 60) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
  return 'text-red-600 bg-red-50 border-red-200';
}