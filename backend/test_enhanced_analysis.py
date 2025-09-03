#!/usr/bin/env python3
"""
Test script for Enhanced Multi-Stage AI Analysis System
Tests the comprehensive KP analyzer with realistic processing times
"""

import asyncio
import httpx
import json
import time
from pathlib import Path

async def test_enhanced_analysis():
    """Test the enhanced /api/llm/analyze endpoint"""
    
    print("🚀 TESTING ENHANCED MULTI-STAGE AI ANALYSIS")
    print("=" * 60)
    
    # Sample KP content for testing
    test_kp_content = """
    Коммерческое предложение от ООО "ТехноПро"
    
    ИСПОЛНИТЕЛЬ: ООО "ТехноПро" - IT-компания с опытом разработки более 8 лет
    
    ТЕХНОЛОГИЧЕСКИЙ СТЕК:
    - Frontend: React 18, TypeScript, Tailwind CSS
    - Backend: Node.js, Express, PostgreSQL
    - DevOps: Docker, AWS, CI/CD
    - Мобильная разработка: React Native
    
    СТОИМОСТЬ ПРОЕКТА:
    - Разработка: 2 500 000 рублей
    - Тестирование: 300 000 рублей  
    - Внедрение: 200 000 рублей
    - Итого: 3 000 000 рублей
    
    СРОКИ ВЫПОЛНЕНИЯ:
    - Аналитика и проектирование: 2 недели
    - Разработка MVP: 8 недель
    - Тестирование: 2 недели
    - Внедрение и запуск: 1 неделя
    - Общий срок: 13 недель
    
    КОМАНДА ПРОЕКТА:
    - Технический директор (Senior)
    - Frontend разработчик (Middle+)
    - Backend разработчик (Senior)
    - QA инженер (Middle)
    - DevOps инженер (Middle)
    
    ОПЫТ И КОМПЕТЕНЦИИ:
    - Более 50 успешных проектов
    - Сертификаты AWS, Google Cloud
    - Методология Agile/Scrum
    - Гарантия качества 12 месяцев
    
    ПРЕИМУЩЕСТВА:
    - Современные технологии
    - Опытная команда
    - Фиксированная стоимость
    - Поэтапная оплата
    - Техническая поддержка
    
    КОНТАКТЫ:
    Email: info@technopro.ru
    Телефон: +7 (495) 123-45-67
    Адрес: г. Москва, ул. Технологическая, 10
    """
    
    start_time = time.time()
    
    try:
        print(f"📊 Отправка КП на анализ ({len(test_kp_content)} символов)")
        print("⏱️ Ожидаем 15-30 секунд обработки...")
        
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                "http://localhost:8000/api/llm/analyze",
                json={
                    "prompt": test_kp_content,
                    "model": "claude-3-5-sonnet-20241022",
                    "max_tokens": 2000,
                    "temperature": 0.1
                }
            )
            
            processing_time = time.time() - start_time
            
            print(f"📈 HTTP Status: {response.status_code}")
            print(f"⏱️ Время обработки: {processing_time:.1f} секунд")
            
            if response.status_code == 200:
                result = response.json()
                
                print("\n✅ УСПЕШНЫЙ РЕЗУЛЬТАТ:")
                print("=" * 40)
                
                # Parse the content JSON
                if "content" in result:
                    try:
                        analysis_data = json.loads(result["content"])
                        
                        print(f"🏢 Компания: {analysis_data.get('company_name', 'Не определено')}")
                        print(f"💰 Стоимость: {analysis_data.get('pricing', 'Не указано')}")
                        print(f"📅 Сроки: {analysis_data.get('timeline', 'Не указано')}")
                        print(f"🔧 Технологии: {analysis_data.get('tech_stack', 'Не указано')[:100]}...")
                        print(f"📊 Соответствие: {analysis_data.get('compliance_score', 0)}%")
                        
                        print(f"\n📋 Преимущества ({len(analysis_data.get('advantages', []))}):")
                        for i, adv in enumerate(analysis_data.get('advantages', [])[:3], 1):
                            print(f"  {i}. {adv}")
                            
                        print(f"\n⚠️ Риски ({len(analysis_data.get('risks', []))}):")
                        for i, risk in enumerate(analysis_data.get('risks', [])[:3], 1):
                            print(f"  {i}. {risk}")
                            
                        print(f"\n🎯 Рекомендация: {analysis_data.get('recommendation', 'Не определено')}")
                        
                        if 'business_analysis' in analysis_data:
                            ba = analysis_data['business_analysis']
                            print(f"\n💼 БИЗНЕС-АНАЛИЗ:")
                            print(f"   Финансовая стабильность: {ba.get('financial_stability', 0)}%")
                            print(f"   Конкурентоспособность: {ba.get('market_competitiveness', 0)}%")
                            print(f"   Уровень риска: {ba.get('risk_level', 'неопределен')}")
                            
                        if 'executive_summary' in analysis_data:
                            print(f"\n📄 Резюме для руководства:")
                            print(f"   {analysis_data['executive_summary']}")
                            
                        print(f"\n🔥 ТЕХНИЧЕСКИЕ ДЕТАЛИ:")
                        print(f"   Модель: {result.get('model', 'не указано')}")
                        print(f"   Время: {result.get('processing_time', 'не указано')}")
                        print(f"   Этапов: {result.get('analysis_stages', 'не указано')}")
                        print(f"   Токенов: {result.get('tokens_used', 'не указано')}")
                        print(f"   Качество: {result.get('analysis_quality', 'не указано')}")
                        
                    except json.JSONDecodeError as e:
                        print(f"❌ Ошибка парсинга JSON: {e}")
                        print(f"Raw content: {result.get('content', '')[:200]}...")
                        
                # Проверяем время обработки
                if processing_time >= 10 and processing_time <= 35:
                    print(f"\n✅ ВРЕМЯ ОБРАБОТКИ КОРРЕКТНО: {processing_time:.1f}с (цель: 10-30с)")
                elif processing_time < 10:
                    print(f"\n⚠️ СЛИШКОМ БЫСТРО: {processing_time:.1f}с (может быть недостаточно глубоким)")
                else:
                    print(f"\n⚠️ СЛИШКОМ МЕДЛЕННО: {processing_time:.1f}с (может потребовать оптимизации)")
                    
            else:
                print(f"\n❌ ОШИБКА HTTP {response.status_code}")
                print(f"Response: {response.text}")
                
    except Exception as e:
        processing_time = time.time() - start_time
        print(f"\n💥 ИСКЛЮЧЕНИЕ: {e}")
        print(f"Время до ошибки: {processing_time:.1f}с")


async def test_websocket_analysis():
    """Test the WebSocket analysis endpoint"""
    
    print("\n🔌 TESTING WEBSOCKET ANALYSIS")
    print("=" * 40)
    
    test_content = """
    Коммерческое предложение - Быстрый тест
    Компания: ТестСтрой
    Стоимость: 1 000 000 рублей
    Срок: 3 месяца
    """
    
    try:
        async with httpx.AsyncClient(timeout=45.0) as client:
            response = await client.post(
                "http://localhost:8000/api/llm/analyze-with-progress",
                json={
                    "prompt": test_content,
                    "model": "claude-3-5-sonnet-20241022",
                    "max_tokens": 2000,
                    "temperature": 0.1
                }
            )
            
            if response.status_code == 200:
                result = response.json()
                print(f"✅ WebSocket анализ запущен: {result.get('analysis_id', 'no ID')}")
                print(f"⏱️ Время: {result.get('processing_time', 'не указано')}")
            else:
                print(f"❌ WebSocket анализ failed: {response.status_code}")
                print(f"Response: {response.text}")
                
    except Exception as e:
        print(f"💥 WebSocket тест failed: {e}")


async def main():
    """Main test function"""
    
    print("🧪 ТЕСТИРОВАНИЕ ENHANCED KP ANALYZER")
    print("=" * 80)
    
    # Test 1: Standard enhanced analysis
    await test_enhanced_analysis()
    
    # Test 2: WebSocket analysis (if needed)
    await test_websocket_analysis()
    
    print("\n🏁 ТЕСТИРОВАНИЕ ЗАВЕРШЕНО")
    print("=" * 40)


if __name__ == "__main__":
    asyncio.run(main())