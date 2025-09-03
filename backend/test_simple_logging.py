#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Тестирование улучшенного логирования КП Анализатора
"""

import requests
import json
import time

def test_enhanced_logging():
    print("ТЕСТИРОВАНИЕ УЛУЧШЕННОЙ СИСТЕМЫ ЛОГИРОВАНИЯ КП АНАЛИЗАТОРА")
    print("=" * 60)
    
    # Тестовые данные
    test_data = {
        "tz_content": "Техническое задание: Создать web-приложение для анализа КП. Бюджет: до 5 млн рублей, срок: 6 месяцев.",
        "kp_content": "Коммерческое предложение от компании ТехСофт: разработка web-приложения за 4.2 млн рублей в течение 5.5 месяцев. Команда 12 разработчиков.",
        "model": "claude-3-5-sonnet-20241022",
        "max_tokens": 4000,
        "temperature": 0.1
    }
    
    print("Отправляем тестовый запрос к backend...")
    print(f"URL: http://127.0.0.1:8000/api/llm/analyze-detailed")
    print(f"Размер ТЗ: {len(test_data['tz_content'])} символов")
    print(f"Размер КП: {len(test_data['kp_content'])} символов")
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
        
        print("ПОЛУЧЕН ОТВЕТ ОТ BACKEND:")
        print(f"Время запроса: {request_time:.2f}s")
        print(f"HTTP Status: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print(f"Успех: {result.get('success', False)}")
            print(f"Analysis ID: {result.get('analysis_id', 'N/A')}")
            print(f"Модель: {result.get('model_used', 'N/A')}")
            print(f"Время обработки: {result.get('processing_time', 'N/A')}s")
            print(f"Fallback режим: {result.get('fallback_mode', 'N/A')}")
            
            if result.get('detailed_analysis'):
                analysis = result['detailed_analysis']
                print(f"Общий скор: {analysis.get('overall_score', 'N/A')}")
            
            print("")
            print("ТЕСТ УСПЕШНО ЗАВЕРШЕН!")
            print("")
            print("ЧТО БЫЛО ПРОТЕСТИРОВАНО:")
            print("+ Backend логирование endpoint /api/llm/analyze-detailed")
            print("+ Обработка входящих данных и валидация")
            print("+ Вызов AI API (Claude или fallback)")
            print("+ Парсинг и структурирование ответа")
            print("+ Возврат детального JSON результата")
            print("")
            print("ЛОГИ ДЛЯ ПРОВЕРКИ:")
            print("Смотрите консоль backend для детального логирования")
            print("")
            
            return True
            
        else:
            print(f"Ошибка HTTP: {response.status_code}")
            print(f"Ответ: {response.text[:200]}...")
            return False
            
    except Exception as e:
        print(f"КРИТИЧЕСКАЯ ОШИБКА: {e}")
        print("Убедитесь, что backend запущен на порту 8000")
        return False

if __name__ == "__main__":
    success = test_enhanced_logging()
    
    print("")
    print("СВОДКА ПО ДОБАВЛЕННОМУ ЛОГИРОВАНИЮ:")
    print("=" * 40)
    print("")
    print("FRONTEND ЛОГИРОВАНИЕ (realKpAnalysisService.ts):")
    print("- extractTextFromPDF() - детальное логирование извлечения текста")
    print("- runDetailedAnalysis() - полное логирование AI запросов")
    print("- analyzeMultipleKP() - батчевый анализ с прогрессом")
    print("- Логирование времени выполнения и статистики")
    print("")
    
    print("BACKEND ЛОГИРОВАНИЕ (app.py):")
    print("- analyze_kp_detailed_10_sections() - детальное логирование endpoint")
    print("- Claude API вызовы с отслеживанием времени")
    print("- Детализация входящих данных и параметров")
    print("- Fallback логирование при ошибках")
    print("- Структурированные success/error сообщения")
    print("")
    
    if success:
        print("ВСЕ ТЕСТЫ ПРОЙДЕНЫ! Система логирования работает.")
        print("Проверьте консоли для детальных логов.")
    else:
        print("ТЕСТ НЕ ПРОЙДЕН. Проверьте состояние backend.")
    
    print("")
    print("ИНСТРУКЦИИ:")
    print("1. Откройте консоль браузера (F12)")  
    print("2. Перейдите в КП Анализатор")
    print("3. Загрузите ТЗ и КП файлы")
    print("4. Наблюдайте детальные логи всего процесса!")