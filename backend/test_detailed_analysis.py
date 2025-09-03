#!/usr/bin/env python3
"""
Тестовый скрипт для проверки endpoint /api/llm/analyze-detailed
Проверяет работоспособность детального анализа КП по 10 разделам
"""

import asyncio
import aiohttp
import json
import time
from typing import Dict, Any

# Тестовые данные
SAMPLE_TZ = """
Техническое задание на разработку веб-приложения для управления проектами

ОБЩИЕ ТРЕБОВАНИЯ:
- Создать веб-приложение для управления проектами
- Поддержка до 1000 пользователей
- Бюджет проекта: 2 500 000 рублей
- Срок выполнения: 6 месяцев

ТЕХНИЧЕСКИЕ ТРЕБОВАНИЯ:
- Frontend: React.js или Vue.js
- Backend: Python (Django/FastAPI) или Node.js
- База данных: PostgreSQL
- Развертывание: Docker контейнеры
- SSL сертификат и HTTPS

ФУНКЦИОНАЛЬНЫЕ ТРЕБОВАНИЯ:
- Авторизация и управление пользователями
- Создание и управление проектами
- Система задач с назначением исполнителей
- Файловый менеджер для проектов
- Отчетность и аналитика
- Уведомления (email + внутри системы)

БЕЗОПАСНОСТЬ:
- Двухфакторная аутентификация
- Шифрование данных
- Журналирование действий пользователей
- Регулярное резервное копирование
"""

SAMPLE_KP = """
Коммерческое предложение от ООО "ТехноСофт"

ПРЕДЛАГАЕМОЕ РЕШЕНИЕ:
Разработка современного веб-приложения для управления проектами на базе технологий:
- Frontend: React.js + TypeScript
- Backend: FastAPI (Python)
- База данных: PostgreSQL 14
- Контейнеризация: Docker + Docker Compose
- Облачное развертывание: AWS/Azure

СТОИМОСТЬ ПРОЕКТА:
Общая стоимость: 2 200 000 рублей
- Разработка frontend: 800 000 ₽
- Разработка backend: 900 000 ₽
- Интеграции и API: 300 000 ₽
- Тестирование: 200 000 ₽
- Развертывание: 100 000 ₽ (включая $500 за AWS)

СРОКИ ВЫПОЛНЕНИЯ:
Общий срок: 5.5 месяцев
1. Анализ и проектирование - 3 недели
2. Frontend разработка - 8 недель  
3. Backend разработка - 10 недель
4. Интеграция и тестирование - 6 недель
5. Развертывание и запуск - 2 недели

КОМАНДА:
- Руководитель проекта (3+ лет опыта)
- 2 Frontend разработчика (React.js, 2+ лет)
- 2 Backend разработчика (Python, FastAPI, 3+ лет)
- DevOps инженер (Docker, AWS, 2+ лет)
- QA инженер (автотесты, 2+ лет)

ГАРАНТИИ:
- Гарантия на разработку: 12 месяцев
- Поддержка после запуска: 6 месяцев бесплатно
- SLA 99.5% доступности системы
- Резервное копирование данных ежедневно

ДОПОЛНИТЕЛЬНЫЕ УСЛУГИ:
- Мобильное приложение (React Native) - 800 000 ₽
- Интеграция с 1С - 150 000 руб
- Система аналитики и BI - 400 000 руб.
- Обучение пользователей - €2000
"""

async def test_detailed_analysis():
    """Тестирование детального анализа"""
    url = "http://localhost:8000/api/llm/analyze-detailed"
    
    payload = {
        "tz_content": SAMPLE_TZ,
        "kp_content": SAMPLE_KP,
        "model": "claude-3-5-sonnet-20241022",
        "max_tokens": 4000,
        "temperature": 0.1
    }
    
    print("🎯 Запуск тестирования детального анализа КП...")
    print(f"📍 Endpoint: {url}")
    print(f"📊 Размер ТЗ: {len(SAMPLE_TZ)} символов")
    print(f"📊 Размер КП: {len(SAMPLE_KP)} символов")
    print("-" * 80)
    
    start_time = time.time()
    
    try:
        async with aiohttp.ClientSession() as session:
            print("📡 Отправляем запрос к backend...")
            
            async with session.post(url, json=payload, timeout=aiohttp.ClientTimeout(total=120)) as response:
                print(f"📨 Ответ получен: HTTP {response.status}")
                
                if response.status == 200:
                    result = await response.json()
                    processing_time = time.time() - start_time
                    
                    print(f"✅ Анализ завершен успешно за {processing_time:.2f}с")
                    print_analysis_summary(result)
                    
                    return result
                else:
                    error_text = await response.text()
                    print(f"❌ Ошибка HTTP {response.status}")
                    print(f"📋 Детали ошибки: {error_text}")
                    return None
                    
    except asyncio.TimeoutError:
        print("⏰ Таймаут запроса (более 2 минут)")
        return None
    except aiohttp.ClientError as e:
        print(f"🔗 Ошибка сетевого соединения: {e}")
        return None
    except Exception as e:
        print(f"❌ Неожиданная ошибка: {e}")
        return None

def print_analysis_summary(result: Dict[str, Any]):
    """Вывод краткой сводки анализа"""
    print("\n" + "="*80)
    print("📋 РЕЗУЛЬТАТЫ ДЕТАЛЬНОГО АНАЛИЗА")
    print("="*80)
    
    # Основная информация
    print(f"🆔 ID анализа: {result.get('analysis_id', 'N/A')}")
    print(f"⏱️  Время обработки: {result.get('processing_time', 'N/A')}с")
    print(f"🤖 Модель: {result.get('model_used', 'N/A')}")
    print(f"✅ Статус: {'Успешно' if result.get('success', True) else 'Ошибка'}")
    
    # Анализ
    analysis = result.get('detailed_analysis', {})
    if analysis:
        print(f"\n📊 ОБЩАЯ ОЦЕНКА: {analysis.get('overall_score', 'N/A')}%")
        
        # Валюты
        currencies = analysis.get('currencies_detected', [])
        if currencies:
            print(f"💰 Обнаружено валют: {len(currencies)}")
            for currency in currencies[:5]:  # Показываем первые 5
                print(f"   • {currency.get('symbol', '?')} {currency.get('name', 'Unknown')}")
        
        # Основные разделы
        print("\n🎯 ОЦЕНКИ ПО РАЗДЕЛАМ:")
        sections = [
            ('budget_compliance', '💰 Бюджет'),
            ('timeline_compliance', '⏱️ Сроки'),
            ('technical_compliance', '🔧 Технологии'),
            ('team_expertise', '👥 Команда'),
            ('functional_coverage', '📋 Функции'),
            ('security_quality', '🛡️ Безопасность'),
            ('methodology_processes', '⚙️ Процессы'),
            ('scalability_support', '📈 Масштаб'),
            ('communication_reporting', '📞 Коммуникации'),
            ('additional_value', '⭐ Доп.ценность')
        ]
        
        for section_key, section_name in sections:
            section_data = analysis.get(section_key, {})
            score = section_data.get('score', 0) if isinstance(section_data, dict) else 0
            risk = section_data.get('risk_level', 'medium') if isinstance(section_data, dict) else 'medium'
            print(f"   {section_name}: {score}% (риск: {risk})")
        
        # Рекомендации
        recommendation = analysis.get('final_recommendation', 'N/A')
        print(f"\n🎯 ФИНАЛЬНАЯ РЕКОМЕНДАЦИЯ: {recommendation.upper()}")
        
        # Краткое резюме
        summary = analysis.get('executive_summary', '')
        if summary:
            print(f"\n📄 РЕЗЮМЕ:")
            print(f"   {summary[:200]}{'...' if len(summary) > 200 else ''}")
    
    print("\n" + "="*80)

async def test_endpoint_availability():
    """Проверка доступности endpoint"""
    print("🔍 Проверка доступности backend...")
    
    health_url = "http://localhost:8000/health"
    
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(health_url, timeout=aiohttp.ClientTimeout(total=5)) as response:
                if response.status == 200:
                    print("✅ Backend доступен")
                    return True
                else:
                    print(f"⚠️ Backend отвечает с кодом {response.status}")
                    return False
    except Exception as e:
        print(f"❌ Backend недоступен: {e}")
        return False

async def main():
    """Основная функция"""
    print("🚀 ТЕСТИРОВАНИЕ СИСТЕМЫ ДЕТАЛЬНОГО АНАЛИЗА КП")
    print("="*80)
    
    # Проверяем доступность
    if not await test_endpoint_availability():
        print("\n❌ Тестирование прервано - backend недоступен")
        print("\n💡 Запустите backend командой:")
        print("   cd backend && python app.py")
        return
    
    # Запускаем тест
    result = await test_detailed_analysis()
    
    if result:
        print(f"\n✅ ТЕСТИРОВАНИЕ ЗАВЕРШЕНО УСПЕШНО")
        
        # Сохраняем результат
        timestamp = int(time.time())
        filename = f"test_result_{timestamp}.json"
        
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(result, f, ensure_ascii=False, indent=2)
        
        print(f"💾 Результат сохранен в файл: {filename}")
    else:
        print(f"\n❌ ТЕСТИРОВАНИЕ НЕ УДАЛОСЬ")
        print("\n🔧 Возможные проблемы:")
        print("   1. Backend не запущен (python app.py)")
        print("   2. Отсутствует ANTHROPIC_API_KEY в .env")
        print("   3. Проблемы с подключением к Claude API")
        print("   4. Неправильная конфигурация сервиса")

if __name__ == "__main__":
    asyncio.run(main())