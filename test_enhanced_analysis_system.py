#!/usr/bin/env python3
"""
Тест системы анализа DevAssist Pro после применения исправлений
Проверяет:
1. 10-критериальную систему анализа
2. Интеграцию frontend-backend
3. Claude API работу
4. Структурированные JSON ответы
"""

import requests
import json
import time
import os

# Конфигурация
BACKEND_URL = "http://localhost:8000"
TEST_KP_CONTENT = """
Коммерческое предложение от ООО "ТехИнновации"

Предмет: Разработка веб-платформы для управления проектами

Техническое решение:
- Фронтенд: React 18, TypeScript, Tailwind CSS
- Бекенд: Python 3.11, FastAPI, PostgreSQL
- Деплоймент: Docker, Nginx, AWS

Команда проекта:
- Руководитель проекта (5 лет опыта)
- Архитектор решений (7 лет опыта)
- 3 разработчика React (от 3 лет опыта)
- 2 Python разработчика (от 4 лет опыта)
- QA инженер (3 года опыта)

Стоимость и сроки:
- Общая стоимость: 2,800,000 рублей с НДС
- Срок реализации: 6 месяцев
- Модель оплаты: 30% предоплата, 70% по этапам

Этапы реализации:
1. Анализ и проектирование (6 недель) - 420,000 руб.
2. Разработка MVP (16 недель) - 1,680,000 руб.
3. Тестирование и доработка (4 недели) - 560,000 руб.
4. Внедрение и обучение (2 недели) - 140,000 руб.

Гарантии:
- Гарантия на разработку: 12 месяцев
- Техническая поддержка: 6 месяцев бесплатно
- SLA: время отклика 4 часа, время решения 24 часа

Методология:
- Agile/Scrum подход
- Еженедельные демонстрации
- Непрерывная интеграция и доставка
- Code review и автоматизированное тестирование
"""

TEST_TZ_CONTENT = """
Техническое задание на разработку веб-платформы управления проектами

Требования к технологиям:
- Современный фронтенд: React или Vue.js
- Надежный бекенд: Python или Node.js
- База данных: PostgreSQL
- Обязательно: TypeScript для типизации

Функциональные требования:
- Управление пользователями и ролями
- Создание и управление проектами
- Система задач с отслеживанием статуса
- Календарь и планирование
- Отчетность и аналитика
- Уведомления в реальном времени

Требования к команде:
- Опыт разработки от 3 лет
- Портфолио аналогичных проектов
- Сертификации в области разработки

Бюджет: до 3,000,000 рублей
Срок: не более 7 месяцев

Обязательные требования:
- Адаптивный дизайн
- Безопасность данных
- Масштабируемость архитектуры
- Документация кода
- Покрытие тестами минимум 80%
"""

def test_health_check():
    """Тест доступности backend"""
    print("🔍 Тестируем доступность backend...")
    try:
        response = requests.get(f"{BACKEND_URL}/health", timeout=5)
        if response.status_code == 200:
            print("✅ Backend доступен")
            return True
        else:
            print(f"❌ Backend вернул статус {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Backend недоступен: {e}")
        return False

def test_basic_analysis():
    """Тест базового анализа через /api/llm/analyze"""
    print("\n📊 Тестируем базовый анализ...")
    
    data = {
        "prompt": TEST_KP_CONTENT,
        "model": "claude-3-5-sonnet-20241022",
        "max_tokens": 2000,
        "temperature": 0.05
    }
    
    try:
        response = requests.post(f"{BACKEND_URL}/api/llm/analyze", 
                               json=data, timeout=120)
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Базовый анализ успешен")
            print(f"   📋 Модель: {result.get('model', 'N/A')}")
            print(f"   📝 Размер ответа: {len(str(result.get('content', '')))}")
            
            # Проверяем наличие структурированных данных
            content = result.get('content', '')
            if 'company_name' in content and 'compliance_score' in content:
                print("✅ Структурированные данные найдены")
                return True
            else:
                print("⚠️ Структурированные данные отсутствуют")
                return False
        else:
            print(f"❌ Базовый анализ неуспешен: {response.status_code}")
            print(f"   📄 Ответ: {response.text[:200]}")
            return False
            
    except Exception as e:
        print(f"❌ Ошибка базового анализа: {e}")
        return False

def test_detailed_analysis():
    """Тест детального 10-критериального анализа"""
    print("\n🔬 Тестируем детальный анализ...")
    
    data = {
        "kp_content": TEST_KP_CONTENT,
        "tz_content": TEST_TZ_CONTENT,
        "model": "claude-3-5-sonnet-20241022",
        "max_tokens": 4000,
        "temperature": 0.1
    }
    
    try:
        start_time = time.time()
        response = requests.post(f"{BACKEND_URL}/api/llm/analyze-detailed", 
                               json=data, timeout=180)
        
        request_time = time.time() - start_time
        print(f"   ⏱️ Время запроса: {request_time:.2f}s")
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Детальный анализ успешен")
            print(f"   📋 ID анализа: {result.get('analysis_id', 'N/A')}")
            print(f"   🤖 Модель: {result.get('model_used', 'N/A')}")
            print(f"   ⏱️ Время обработки: {result.get('processing_time', 'N/A')}s")
            print(f"   🔄 Fallback режим: {result.get('fallback_mode', False)}")
            
            # Проверяем структуру детального анализа
            detailed = result.get('detailed_analysis', {})
            if detailed:
                print("✅ Детальный анализ найден")
                
                # Проверяем наличие всех 10 критериев
                required_sections = [
                    "budget_compliance", "timeline_compliance", "technical_compliance",
                    "team_expertise", "functional_coverage", "security_quality",
                    "methodology_processes", "scalability_support", 
                    "communication_reporting", "additional_value"
                ]
                
                found_sections = [s for s in required_sections if s in detailed]
                missing_sections = [s for s in required_sections if s not in detailed]
                
                print(f"   📊 Найдено секций: {len(found_sections)}/10")
                print(f"   ✅ Найденные: {found_sections[:3]}..." if found_sections else "   ❌ Секции не найдены")
                
                if missing_sections:
                    print(f"   ⚠️ Отсутствующие: {missing_sections}")
                
                # Проверяем общий скор
                overall_score = detailed.get('overall_score')
                if overall_score:
                    print(f"   📈 Общий скор: {overall_score}")
                
                # Проверяем выводы
                if 'executive_summary' in detailed:
                    summary = detailed['executive_summary'][:100]
                    print(f"   📋 Резюме: {summary}...")
                
                return len(found_sections) >= 8  # Минимум 8 из 10 секций
            else:
                print("❌ Детальный анализ отсутствует")
                return False
                
        else:
            print(f"❌ Детальный анализ неуспешен: {response.status_code}")
            error_text = response.text
            print(f"   📄 Ответ: {error_text[:300]}")
            
            # Проверяем информативность ошибки
            if "Claude API" in error_text:
                print("ℹ️ Ошибка связана с Claude API")
            elif "timeout" in error_text.lower():
                print("ℹ️ Ошибка таймаута")
            
            return False
            
    except Exception as e:
        print(f"❌ Ошибка детального анализа: {e}")
        return False

def test_api_endpoints():
    """Тест доступности ключевых endpoints"""
    print("\n🔗 Тестируем API endpoints...")
    
    endpoints = [
        "/api/llm/providers",
        "/health"
    ]
    
    results = []
    for endpoint in endpoints:
        try:
            response = requests.get(f"{BACKEND_URL}{endpoint}", timeout=10)
            status = "✅" if response.status_code == 200 else "❌"
            print(f"   {status} {endpoint}: {response.status_code}")
            results.append(response.status_code == 200)
        except Exception as e:
            print(f"   ❌ {endpoint}: {e}")
            results.append(False)
    
    return all(results)

def validate_json_structure(data, required_fields):
    """Валидация структуры JSON"""
    missing = [field for field in required_fields if field not in data]
    return len(missing) == 0, missing

def main():
    """Основная функция тестирования"""
    print("🚀 Запуск тестирования системы анализа DevAssist Pro")
    print("=" * 60)
    
    tests = [
        ("Проверка доступности backend", test_health_check),
        ("Проверка API endpoints", test_api_endpoints),
        ("Базовый анализ", test_basic_analysis),
        ("Детальный 10-критериальный анализ", test_detailed_analysis)
    ]
    
    results = []
    for test_name, test_func in tests:
        print(f"\n🧪 {test_name}")
        try:
            result = test_func()
            results.append((test_name, result))
            status = "✅ ПРОЙДЕН" if result else "❌ НЕ ПРОЙДЕН"
            print(f"   {status}")
        except Exception as e:
            print(f"   ❌ ОШИБКА: {e}")
            results.append((test_name, False))
    
    # Итоговый отчет
    print("\n" + "=" * 60)
    print("📊 ИТОГОВЫЙ ОТЧЕТ ТЕСТИРОВАНИЯ")
    print("=" * 60)
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for test_name, result in results:
        status = "✅" if result else "❌"
        print(f"{status} {test_name}")
    
    print(f"\n📈 Результат: {passed}/{total} тестов пройдено")
    
    if passed == total:
        print("🎉 ВСЕ ТЕСТЫ УСПЕШНО ПРОЙДЕНЫ!")
        print("💡 Система анализа работает корректно")
        return True
    else:
        print("⚠️ ОБНАРУЖЕНЫ ПРОБЛЕМЫ")
        print("💡 Требуется дополнительная диагностика")
        return False

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)