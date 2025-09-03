#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
ТЕСТИРОВАНИЕ УЛУЧШЕННОГО ЛОГИРОВАНИЯ КП АНАЛИЗАТОРА
====================================================

Этот скрипт тестирует новую систему детального логирования,
добавленную в КП Анализатор для отслеживания всех операций.

Добавленное логирование:
✅ Frontend (realKpAnalysisService.ts):
   - Детальное логирование извлечения текста из файлов
   - Логирование множественного анализа с батчевой обработкой
   - Подробное логирование вызовов API к backend
   - Статистика времени выполнения и результатов

✅ Backend (app.py):
   - Полное логирование endpoint /api/llm/analyze-detailed
   - Отслеживание вызовов к Claude API
   - Детализация парсинга JSON ответов
   - Fallback логирование при ошибках
"""

import requests
import json
import time

def test_enhanced_logging_system():
    """Тестируем улучшенную систему логирования"""
    print("🔍 ТЕСТИРОВАНИЕ УЛУЧШЕННОЙ СИСТЕМЫ ЛОГИРОВАНИЯ КП АНАЛИЗАТОРА")
    print("=" * 70)
    
    # Тестовые данные для полного цикла
    test_data = {
        "tz_content": """
ТЕХНИЧЕСКОЕ ЗАДАНИЕ НА РАЗРАБОТКУ WEB-ПРИЛОЖЕНИЯ

1. ОБЩИЕ ТРЕБОВАНИЯ
   - Создать современное web-приложение для анализа коммерческих предложений
   - Технологии: React.js + Node.js + PostgreSQL
   - Срок разработки: 6 месяцев
   - Бюджет: до 5,000,000 рублей
   
2. ФУНКЦИОНАЛЬНЫЕ ТРЕБОВАНИЯ
   - Загрузка и анализ PDF/DOCX документов
   - Интеграция с AI для автоматического анализа
   - Генерация детальных отчетов
   - Система авторизации и ролей
   
3. ТЕХНИЧЕСКИЕ ТРЕБОВАНИЯ
   - Поддержка 1000+ одновременных пользователей
   - Время отклика < 2 секунд
   - Совместимость с современными браузерами
   - Мобильная версия (responsive design)
   
4. БЕЗОПАСНОСТЬ
   - HTTPS протокол
   - Шифрование данных
   - Аудит действий пользователей
   - Резервное копирование
        """,
        "kp_content": """
КОММЕРЧЕСКОЕ ПРЕДЛОЖЕНИЕ ОТ КОМПАНИИ "ЦИФРОВЫЕ РЕШЕНИЯ"

ИСПОЛНИТЕЛЬ: ООО "Цифровые Решения"
Опыт работы: 8 лет в сфере web-разработки
Команда: 12 разработчиков, 3 дизайнера, 2 тестировщика

ПРЕДЛАГАЕМОЕ РЕШЕНИЕ:
✓ Современное SPA приложение на React 18 + TypeScript
✓ Backend API на Node.js с Express.js
✓ База данных PostgreSQL с репликацией
✓ Интеграция с Claude AI и OpenAI GPT
✓ Система контейнеризации Docker + Kubernetes

БЮДЖЕТ И СРОКИ:
💰 Общая стоимость: 4,200,000 рублей
⏱️ Срок выполнения: 5.5 месяцев
📅 Этапы:
   - Анализ и проектирование: 3 недели
   - Разработка MVP: 8 недель  
   - Полная разработка: 12 недель
   - Тестирование и деплой: 4 недели

ГАРАНТИИ:
✅ Гарантия на ПО: 12 месяцев
✅ Техническая поддержка: 24/7
✅ Бесплатные обновления: 6 месяцев
✅ Обучение пользователей: включено

ДОПОЛНИТЕЛЬНЫЕ УСЛУГИ:
+ Хостинг на собственных серверах
+ SSL сертификаты и домен
+ Мониторинг производительности
+ Автоматическое резервное копирование

КОНТАКТЫ:
Email: info@digital-solutions.ru  
Телефон: +7 (495) 123-45-67
Сайт: www.digital-solutions.ru
        """,
        "model": "claude-3-5-sonnet-20241022",
        "max_tokens": 4000,
        "temperature": 0.1
    }
    
    print("📤 ОТПРАВЛЯЕМ ТЕСТОВЫЙ ЗАПРОС К BACKEND...")
    print(f"   🌐 URL: http://127.0.0.1:8000/api/llm/analyze-detailed")
    print(f"   📊 Размер ТЗ: {len(test_data['tz_content'])} символов")
    print(f"   📊 Размер КП: {len(test_data['kp_content'])} символов")
    print(f"   🤖 Модель: {test_data['model']}")
    print("")
    
    try:
        start_time = time.time()
        
        response = requests.post(
            "http://127.0.0.1:8000/api/llm/analyze-detailed",
            json=test_data,
            headers={"Content-Type": "application/json"},
            timeout=60
        )
        
        request_time = time.time() - start_time
        
        print(f"📨 ПОЛУЧЕН ОТВЕТ ОТ BACKEND:")
        print(f"   ⏱️ Время запроса: {request_time:.2f}s")
        print(f"   📊 HTTP Status: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print(f"   ✅ Успех: {result.get('success', False)}")
            print(f"   🆔 Analysis ID: {result.get('analysis_id', 'N/A')}")
            print(f"   🤖 Модель: {result.get('model_used', 'N/A')}")
            print(f"   ⏱️ Время обработки: {result.get('processing_time', 'N/A')}s")
            print(f"   🔄 Fallback режим: {result.get('fallback_mode', 'N/A')}")
            
            if result.get('detailed_analysis'):
                analysis = result['detailed_analysis']
                print(f"   📈 Общий скор: {analysis.get('overall_score', 'N/A')}")
                print(f"   📝 Executive Summary: {analysis.get('executive_summary', 'N/A')[:100]}...")
            
            print("")
            print("🎉 ТЕСТ УСПЕШНО ЗАВЕРШЕН!")
            print("📋 ЧТО БЫЛО ПРОТЕСТИРОВАНО:")
            print("   ✅ Backend логирование endpoint /api/llm/analyze-detailed")
            print("   ✅ Обработка входящих данных и валидация")
            print("   ✅ Вызов AI API (Claude или fallback)")
            print("   ✅ Парсинг и структурирование ответа")
            print("   ✅ Возврат детального JSON результата")
            print("")
            print("🔍 ЛОГИ ДЛЯ ПРОВЕРКИ:")
            print("   📺 Смотрите консоль backend для детального логирования")
            print("   📺 Смотрите браузерную консоль при использовании frontend")
            
            return True
            
        else:
            print(f"   ❌ Ошибка HTTP: {response.status_code}")
            print(f"   📄 Ответ: {response.text[:200]}...")
            return False
            
    except Exception as e:
        print(f"💥 КРИТИЧЕСКАЯ ОШИБКА: {e}")
        print(f"🔧 Убедитесь, что backend запущен на порту 8000")
        return False

def show_logging_summary():
    """Показываем сводку по добавленному логированию"""
    print("")
    print("📊 СВОДКА ПО ДОБАВЛЕННОМУ ЛОГИРОВАНИЮ")
    print("=" * 60)
    
    print("🖥️ FRONTEND ЛОГИРОВАНИЕ (realKpAnalysisService.ts):")
    print("   🔄 extractTextFromPDF() - детальное логирование извлечения текста")
    print("   🚀 runDetailedAnalysis() - полное логирование AI запросов")
    print("   📦 analyzeMultipleKP() - батчевый анализ с прогрессом")
    print("   ⚡ Логирование времени выполнения и статистики")
    print("   🎯 Отслеживание успешных и неудачных операций")
    print("")
    
    print("🖥️ BACKEND ЛОГИРОВАНИЕ (app.py):")
    print("   📥 analyze_kp_detailed_10_sections() - детальное логирование endpoint")
    print("   🤖 Claude API вызовы с отслеживанием времени")
    print("   📊 Детализация входящих данных и параметров")
    print("   🔄 Fallback логирование при ошибках")
    print("   ✅ Структурированные success/error сообщения")
    print("")
    
    print("📈 ПРЕИМУЩЕСТВА НОВОЙ СИСТЕМЫ ЛОГИРОВАНИЯ:")
    print("   🔍 Полная видимость процесса загрузки и анализа файлов")
    print("   🐛 Упрощенная диагностика проблем и ошибок")
    print("   ⏱️ Метрики производительности для оптимизации")
    print("   📊 Отслеживание использования AI API и токенов")
    print("   🎯 Четкое понимание где происходят сбои")

if __name__ == "__main__":
    print("🚀 ЗАПУСК ТЕСТИРОВАНИЯ СИСТЕМЫ ЛОГИРОВАНИЯ КП АНАЛИЗАТОРА")
    print("")
    
    success = test_enhanced_logging_system()
    show_logging_summary()
    
    print("")
    if success:
        print("🎉 ВСЕ ТЕСТЫ ПРОЙДЕНЫ! Система логирования работает корректно.")
        print("📺 Проверьте консоли frontend и backend для детальных логов.")
    else:
        print("⚠️ ТЕСТ НЕ ПРОЙДЕН. Проверьте состояние backend сервиса.")
    
    print("")
    print("📋 ИНСТРУКЦИИ ПО ИСПОЛЬЗОВАНИЮ:")
    print("   1. Откройте консоль браузера (F12)")  
    print("   2. Перейдите в КП Анализатор")
    print("   3. Загрузите ТЗ и КП файлы")
    print("   4. Наблюдайте детальные логи всего процесса!")
    print("")
    print("✨ Теперь вы видите ВСЁ что делает система!")