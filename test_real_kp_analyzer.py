#!/usr/bin/env python3
"""
Test Real KP Analyzer - проверяет работу с реальными данными
"""

import requests
import json
import time

def test_real_kp_analyzer():
    print("=== ТЕСТИРОВАНИЕ КП АНАЛИЗАТОРА С РЕАЛЬНЫМИ ДАННЫМИ ===")
    
    # Реальный текст коммерческого предложения
    real_kp_text = '''
Коммерческое предложение на строительство жилого комплекса "Солнечные Сады"

ИСПОЛНИТЕЛЬ: ООО "ПремиумСтройТехнологии"
СТОИМОСТЬ: 250 000 000 рублей
СРОКИ ВЫПОЛНЕНИЯ: 36 месяцев с момента подписания договора
ГАРАНТИЯ: 5 лет на все строительные работы
ОПЫТ РАБОТЫ: 25 лет в сфере жилищного строительства
ЛИЦЕНЗИИ: Член СРО "Союз Строителей", лицензия №12345

ТЕХНИЧЕСКОЕ ОПИСАНИЕ:
- Общая площадь: 15,000 кв.м
- Количество квартир: 120 единиц
- Этажность: 12 этажей
- Материалы: монолитно-каркасная технология
- Фундамент: свайно-ростверковый
- Фасад: навесной вентилируемый

ВКЛЮЧЕНО В СТОИМОСТЬ:
- Проектирование и согласование
- Все строительно-монтажные работы
- Благоустройство территории
- Подключение всех коммуникаций
- Сдача объекта под ключ

ЭТАПЫ ВЫПОЛНЕНИЯ:
1. Проектирование и согласования - 6 месяцев
2. Подготовительные работы - 3 месяца  
3. Основное строительство - 24 месяца
4. Финишные работы и сдача - 3 месяца

ФИНАНСОВЫЕ УСЛОВИЯ:
- Предоплата 30% при подписании договора
- Поэтапные платежи согласно календарному плану
- Окончательный расчет при сдаче объекта

ДОПОЛНИТЕЛЬНЫЕ ПРЕИМУЩЕСТВА:
- Собственная проектная организация
- Современное строительное оборудование
- Опытные специалисты и прорабы
- Контроль качества на всех этапах
- Страхование строительных рисков
'''

    # Данные для запроса
    data = {
        'prompt': real_kp_text,
        'model': 'claude-3-haiku-20240307',
        'max_tokens': 1000,
        'temperature': 0.1
    }

    print(f"Отправляем {len(real_kp_text)} символов реального КП в Claude API...")
    start_time = time.time()

    try:
        response = requests.post('http://localhost:8000/api/llm/analyze', json=data, timeout=60)
        end_time = time.time()
        processing_time = end_time - start_time
        
        print(f"⏱️  Время обработки: {processing_time:.1f} секунд")
        
        if response.status_code == 200:
            result = response.json()
            model_used = result.get('model', 'unknown')
            fallback_mode = result.get('fallback_mode', 'unknown')
            
            print(f"🤖 Используемая модель: {model_used}")
            print(f"🔄 Режим fallback: {fallback_mode}")
            
            # Анализ результата
            if 'claude' in model_used.lower():
                print("✅ SUCCESS: Используется реальный Claude API!")
                
                content = result.get('content', '')
                if content.startswith('{'):
                    try:
                        analysis = json.loads(content)
                        print("\n📊 РЕЗУЛЬТАТЫ АНАЛИЗА:")
                        print(f"   Компания: {analysis.get('company_name', 'N/A')}")
                        print(f"   Стоимость: {analysis.get('pricing', 'N/A')}")
                        print(f"   Сроки: {analysis.get('timeline', 'N/A')}")
                        print(f"   Оценка: {analysis.get('compliance_score', 'N/A')}")
                        print(f"   Рекомендация: {analysis.get('recommendation', 'N/A')}")
                        
                        # Проверка на mock данные
                        company_name = analysis.get('company_name', '')
                        if company_name != 'TEST FIXED COMPANY' and 'FIXED' not in company_name:
                            print("🎉 SUCCESS: НЕТ MOCK ДАННЫХ! Claude работает с реальными данными!")
                            return True
                        else:
                            print(f"⚠️  WARNING: Все еще получаем тестовые данные: {company_name}")
                            return False
                            
                    except json.JSONDecodeError as e:
                        print(f"❌ ERROR: Не удалось распарсить JSON: {e}")
                        return False
                else:
                    print("❌ ERROR: Ответ не в формате JSON")
                    return False
            else:
                print(f"⚠️  WARNING: Используется fallback анализатор: {model_used}")
                return False
                
            # Анализ времени обработки
            if processing_time > 8.0:
                print(f"✅ SUCCESS: Время обработки ({processing_time:.1f}с) показывает реальную ИИ обработку!")
            elif processing_time > 2.0:
                print(f"ℹ️  INFO: Время обработки ({processing_time:.1f}с) быстрое, но возможно для легкого анализа")
            else:
                print(f"⚠️  WARNING: Очень быстрая обработка ({processing_time:.1f}с) указывает на mock данные")
                
        else:
            print(f"❌ ERROR: HTTP {response.status_code}")
            print(f"Response: {response.text[:300]}")
            return False
            
    except Exception as e:
        print(f"❌ ОШИБКА ЗАПРОСА: {e}")
        return False

if __name__ == "__main__":
    success = test_real_kp_analyzer()
    print("\n" + "="*60)
    if success:
        print("🎉 КП АНАЛИЗАТОР РАБОТАЕТ С РЕАЛЬНЫМИ ДАННЫМИ!")
    else:
        print("❌ КП АНАЛИЗАТОР ЕЩЕ СОДЕРЖИТ MOCK ДАННЫЕ!")
    print("="*60)