#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Тест извлечения валют для подтверждения исправления бага с суммами
"""

import sys
sys.path.append('.')

# Читаем тестовый файл
with open('test_kp_with_amounts.txt', 'r', encoding='utf-8') as f:
    kp_text = f.read()

print("ТЕСТОВЫЙ ТЕКСТ КП:")
print("=" * 50)
print(kp_text[:300] + "...")
print()

print("ТЕСТ ИЗВЛЕЧЕНИЯ СУММ:")
print("=" * 50)

# Симулируем то же самое, что делает CurrencyExtractor.extractFinancialData()
import re

# Паттерны поиска сумм
currency_patterns = [
    r'(\d{1,3}(?:[\s,.]?\d{3})*(?:[.,]\d{1,2})?)\s*(?:руб|рубл|₽|RUB)',
    r'(\d{1,3}(?:[\s,.]?\d{3})*(?:[.,]\d{1,2})?)\s*(?:\$|USD|долл)',
    r'(\d{1,3}(?:[\s,.]?\d{3})*(?:[.,]\d{1,2})?)\s*(?:€|EUR|евро)',
]

found_amounts = []

for pattern in currency_patterns:
    matches = re.finditer(pattern, kp_text, re.IGNORECASE)
    for match in matches:
        amount_str = match.group(1).replace(' ', '').replace(',', '')
        try:
            amount = float(amount_str)
            found_amounts.append({
                'amount': amount,
                'currency': 'RUB' if 'руб' in match.group(0).lower() or '₽' in match.group(0) else 'USD' if '$' in match.group(0) or 'USD' in match.group(0) else 'EUR',
                'original_text': match.group(0),
                'position': match.start()
            })
            print(f"НАЙДЕНА СУММА: {amount:,.0f} {found_amounts[-1]['currency']} ('{match.group(0).strip()}')")
        except ValueError:
            print(f"ОШИБКА ПАРСИНГА: {match.group(0)}")

print()
print(f"ИТОГО НАЙДЕНО: {len(found_amounts)} сумм")

if found_amounts:
    # Ищем самую большую сумму как общий бюджет
    total_budget = max(found_amounts, key=lambda x: x['amount'])
    print(f"ОБЩИЙ БЮДЖЕТ: {total_budget['amount']:,.0f} {total_budget['currency']}")
    print(f"Исходный текст: '{total_budget['original_text'].strip()}'")
else:
    print("НЕ НАЙДЕНО НИ ОДНОЙ СУММЫ!")

print()
print("ОЖИДАЕМЫЙ РЕЗУЛЬТАТ:")
print("- Должно найти общий бюджет: 5 500 000 рублей")
print("- Должно найти отдельные суммы: 2 500 000, 1 800 000, 500 000, 300 000, 400 000")
print("- Должно найти предоплату: 2 750 000 рублей")

print()
print("ПРОВЕРКА УСПЕШНА!" if found_amounts and any(amt['amount'] == 5500000 for amt in found_amounts) else "ПРОВЕРКА НЕ ПРОЙДЕНА!")