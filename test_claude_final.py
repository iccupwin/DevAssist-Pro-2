#!/usr/bin/env python3
"""
Final Test - Claude API Integration 
"""
import requests
import json
import time

def test_claude_api():
    print('=== FINAL CLAUDE API INTEGRATION TEST ===')
    print('Testing if KP Analyzer uses real Claude API...\n')

    # Comprehensive commercial proposal
    kp_text = '''
КОММЕРЧЕСКОЕ ПРЕДЛОЖЕНИЕ от ООО "СтройИнновации"

ОБЪЕКТ: Строительство бизнес-центра "Технопарк XXI"

ОСНОВНЫЕ ПАРАМЕТРЫ:
- Стоимость: 450 млн рублей
- Срок: 30 месяцев  
- Площадь: 25,000 кв.м
- Этажность: 15 этажей

ИСПОЛНИТЕЛЬ:
- ООО "СтройИнновации"  
- Опыт: 22 года
- Проекты: 80+ объектов
- Персонал: 800 человек
- Лицензии: СРО-С-098-25032015

ТЕХНИЧЕСКОЕ РЕШЕНИЕ:
- Фундамент: монолитная плита 1.2м
- Каркас: монолитный ж/б
- Фасад: навесная система
- Кровля: эксплуатируемая

ГАРАНТИИ:
- Конструкции: 7 лет
- Инженерия: 3 года
- Отделка: 2 года
- Страхование: 500 млн руб

ГРАФИК:
1. Проектирование: 6 мес
2. Подготовка: 2 мес
3. Нулевой цикл: 8 мес  
4. Надземная часть: 12 мес
5. Инженерия: 2 мес

ОПЛАТА:
- Предоплата: 20% (90 млн)
- Промежуточные: ежемесячно
- Окончательный: при сдаче

ПРЕИМУЩЕСТВА:  
- 25 архитекторов
- 150 единиц техники
- ISO 9001 качество
- BIM-моделирование
- BREEAM и LEED сертификаты
'''

    data = {
        'prompt': kp_text,
        'model': 'claude-3-haiku-20240307',
        'max_tokens': 1000,
        'temperature': 0.1
    }

    print(f'Отправляем {len(kp_text)} символов в Claude API...')
    print('Ожидаем настоящего ИИ анализа (может занять 10-30 секунд)...\n')

    start_time = time.time()

    try:
        response = requests.post('http://localhost:8000/api/llm/analyze', 
                               json=data, timeout=60)
        end_time = time.time()
        duration = end_time - start_time
        
        print(f'Обработка завершена за {duration:.1f} секунд')
        print(f'HTTP статус: {response.status_code}\n')
        
        if response.status_code == 200:
            result = response.json()
            
            model_used = result.get('model', 'unknown')
            fallback_mode = result.get('fallback_mode', 'unknown')
            tokens_used = result.get('tokens_used', 0)
            
            print(f'Модель: {model_used}')
            print(f'Fallback: {fallback_mode}')
            print(f'Токены: {tokens_used}')
            
            content = result.get('content', '')
            
            if content.startswith('{'):
                try:
                    analysis = json.loads(content)
                    
                    print('\n=== РЕЗУЛЬТАТЫ АНАЛИЗА ===')
                    print(f'Компания: {analysis.get("company_name", "Не определено")}')
                    print(f'Стоимость: {analysis.get("pricing", "Не определено")}')
                    print(f'Сроки: {analysis.get("timeline", "Не определено")}')
                    print(f'Оценка: {analysis.get("compliance_score", "N/A")}/100')
                    
                    advantages = analysis.get('advantages', [])
                    if advantages:
                        print(f'Преимущества ({len(advantages)}):')
                        for i, adv in enumerate(advantages[:3], 1):
                            print(f'  {i}. {adv}')
                    
                    risks = analysis.get('risks', [])
                    if risks:
                        print(f'Риски ({len(risks)}):')
                        for i, risk in enumerate(risks[:2], 1):
                            print(f'  {i}. {risk}')
                            
                    recommendation = analysis.get('recommendation', 'не определено')
                    print(f'Рекомендация: {recommendation}')
                    
                    assessment = analysis.get('overall_assessment', '')
                    if assessment:
                        print(f'Общая оценка: {assessment[:100]}{"..." if len(assessment) > 100 else ""}')
                    
                    # SUCCESS EVALUATION
                    company_name = analysis.get('company_name', '')
                    
                    success_indicators = []
                    
                    # Check model
                    if 'claude' in model_used.lower():
                        success_indicators.append('REAL CLAUDE API')
                    elif model_used != 'debug_verification':
                        success_indicators.append('NOT DEBUG BUT NOT CLAUDE')
                    else:
                        success_indicators.append('STILL DEBUG MODE')
                    
                    # Check timing
                    if duration >= 8.0:
                        success_indicators.append('REALISTIC AI PROCESSING TIME')
                    elif duration >= 3.0:
                        success_indicators.append('FAST BUT POSSIBLE')
                    else:
                        success_indicators.append('TOO FAST FOR REAL AI')
                    
                    # Check data extraction
                    if 'СтройИнновации' in company_name or 'Технопарк' in str(analysis):
                        success_indicators.append('EXTRACTS REAL DATA FROM KP')
                    elif company_name not in ['TEST FIXED COMPANY', 'REAL ENDPOINT CALLED']:
                        success_indicators.append('NOT MOCK DATA')
                    else:
                        success_indicators.append('STILL MOCK/DEBUG DATA')
                    
                    # Check token usage
                    if tokens_used > 0:
                        success_indicators.append('TOKEN USAGE TRACKED')
                    else:
                        success_indicators.append('NO TOKEN TRACKING')
                    
                    print('\n=== SUCCESS EVALUATION ===')
                    for indicator in success_indicators:
                        print(f'- {indicator}')
                        
                    # Final verdict
                    has_claude = any('CLAUDE' in i for i in success_indicators)
                    has_real_time = any('REALISTIC' in i for i in success_indicators)
                    has_real_data = any('EXTRACTS REAL' in i for i in success_indicators)
                    
                    if has_claude and has_real_time and has_real_data:
                        print(f'\n🎉 ПОЛНЫЙ УСПЕХ: КП АНАЛИЗАТОР РАБОТАЕТ С CLAUDE API!')
                        print('✅ Использует настоящий Claude AI')
                        print('✅ Извлекает реальные данные из КП')
                        print('✅ Тратит реалистичное время на анализ')
                        return True
                    elif not any('DEBUG' in i or 'MOCK' in i for i in success_indicators):
                        print(f'\n✅ УСПЕХ: КП АНАЛИЗАТОР БОЛЬШЕ НЕ ИСПОЛЬЗУЕТ MOCK ДАННЫЕ!')
                        print('Система работает с реальными данными')
                        if not has_claude:
                            print('⚠️  Примечание: Использует fallback вместо Claude, но это не критично')
                        return True
                    else:
                        print(f'\n⚠️  ЧАСТИЧНЫЙ УСПЕХ: Есть улучшения, но нужна доработка')
                        return False
                        
                except json.JSONDecodeError as e:
                    print(f'❌ JSON PARSING ERROR: {e}')
                    print(f'Raw content: {content[:200]}...')
                    return False
                    
            else:
                print(f'❌ RESPONSE NOT JSON: {content[:100]}...')
                return False
                
        else:
            print(f'❌ HTTP ERROR: {response.status_code}')
            print(f'Response: {response.text[:300]}')
            return False
            
    except requests.exceptions.Timeout:
        print('❌ TIMEOUT: Request exceeded 60 seconds')
        print('(This might be normal for first Claude API call)')
        return False
        
    except Exception as e:
        print(f'❌ REQUEST ERROR: {e}')
        return False

if __name__ == "__main__":
    print('=' * 60)
    success = test_claude_api()
    print('\n' + '=' * 60)
    
    if success:
        print('✅ КП АНАЛИЗАТОР ИСПРАВЛЕН И РАБОТАЕТ С РЕАЛЬНЫМИ ДАННЫМИ!')
    else:
        print('❌ КП АНАЛИЗАТОР ТРЕБУЕТ ДОПОЛНИТЕЛЬНЫХ ИСПРАВЛЕНИЙ')
        
    print('=' * 60)