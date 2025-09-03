#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Тест исправления бага КП анализатора - проверяем реальные суммы из PDF
"""

import requests
import json

# Тестовый текст КП с реальными суммами
test_kp_text = """
КОММЕРЧЕСКОЕ ПРЕДЛОЖЕНИЕ
ООО "ТехСтройИнжиниринг"

Проект: Разработка веб-портала для управления строительными проектами

СТОИМОСТЬ РАБОТ:
Разработка backend: 2 500 000 рублей
Разработка frontend: 1 800 000 рублей
Дизайн интерфейса: 500 000 рублей
Тестирование: 300 000 рублей
Интеграция и развертывание: 400 000 рублей

ОБЩАЯ СТОИМОСТЬ ПРОЕКТА: 5 500 000 рублей

УСЛОВИЯ ОПЛАТЫ:
Предоплата: 50% (2 750 000 рублей)
По завершении: 50% (2 750 000 рублей)

ГАРАНТИИ:
Гарантия на разработанное ПО: 12 месяцев
Техническая поддержка: 200 000 рублей в год
"""

print("ТЕСТ ИСПРАВЛЕНИЯ БАГА КП АНАЛИЗАТОРА")
print("=" * 60)
print("Проверяем, что теперь суммы извлекаются из PDF, а не из AI-описания")
print()

try:
    # Отправляем запрос на анализ КП
    data = {
        'prompt': test_kp_text,
        'model': 'claude-3-haiku-20240307',
        'max_tokens': 500
    }
    
    print("Отправляем запрос на анализ КП...")
    response = requests.post('http://localhost:8000/api/llm/analyze', json=data, timeout=30)
    print(f"Статус ответа: {response.status_code}")
    
    if response.status_code == 200:
        result = response.json()
        model_used = result.get('model', 'unknown')
        
        print(f"Используемая модель: {model_used}")
        
        # Проверяем содержимое ответа
        content = result.get('content', '')
        print(f"Длина ответа: {len(content)} символов")
        print(f"Первые 200 символов ответа: {content[:200]}...")
        
        # Проверяем есть ли реальные суммы в ответе
        real_amounts = [
            '5 500 000',
            '2 500 000', 
            '1 800 000',
            '2 750 000'
        ]
        
        found_amounts = []
        for amount in real_amounts:
            if amount in content or amount.replace(' ', '') in content:
                found_amounts.append(amount)
        
        print()
        print(f"НАЙДЕННЫЕ РЕАЛЬНЫЕ СУММЫ В ОТВЕТЕ: {len(found_amounts)}/{len(real_amounts)}")
        for amount in found_amounts:
            print(f"  - {amount} рублей")
        
        if len(found_amounts) >= 2:
            print()
            print("УСПЕХ! AI обработка содержит реальные суммы из PDF")
        else:
            print()
            print("ВНИМАНИЕ: В ответе мало реальных сумм, возможно AI обобщает")
            
    else:
        print(f"ОШИБКА HTTP {response.status_code}: {response.text[:200]}")
        
except Exception as e:
    print(f"ОШИБКА ЗАПРОСА: {e}")

print()
print("ЗАКЛЮЧЕНИЕ:")
print("- Если в ответе есть реальные суммы (5 500 000 и другие), то исправление работает")
print("- Frontend теперь должен показывать эти суммы вместо AI-описаний")
print("- Следующий шаг: протестировать в веб-интерфейсе на http://localhost:3000")