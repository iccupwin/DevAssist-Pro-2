#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
ДЕМОНСТРАЦИЯ ДЕТАЛЬНОГО ЛОГИРОВАНИЯ КП АНАЛИЗАТОРА
"""

import requests
import json
import time

def demo_enhanced_logging():
    print("🔥 ДЕМОНСТРАЦИЯ ДЕТАЛЬНОГО ЛОГИРОВАНИЯ")
    print("=" * 50)
    
    # Демо данные
    demo_data = {
        "tz_content": "ТЕХНИЧЕСКОЕ ЗАДАНИЕ: Создать веб-приложение для анализа КП. Бюджет до 10 млн рублей, срок 12 месяцев.",
        "kp_content": "КОММЕРЧЕСКОЕ ПРЕДЛОЖЕНИЕ: Компания ТехСофт предлагает разработку за 8 млн рублей в течение 10 месяцев. Команда 15 разработчиков.",
        "model": "claude-3-5-sonnet-20241022",
        "max_tokens": 2000,
        "temperature": 0.1
    }
    
    print("📤 Отправляем запрос с детальным логированием...")
    print("🔍 Смотрите консоль backend для полного логирования!")
    print("")
    
    try:
        response = requests.post(
            "http://127.0.0.1:8000/api/llm/analyze-detailed",
            json=demo_data,
            headers={"Content-Type": "application/json"},
            timeout=30
        )
        
        if response.status_code == 200:
            result = response.json()
            print("✅ УСПЕХ! Детальное логирование работает!")
            print(f"📋 Analysis ID: {result.get('analysis_id')}")
            print(f"🤖 Модель: {result.get('model_used')}")
            print(f"⏱️ Время: {result.get('processing_time')}s")
            print(f"🔄 Fallback: {result.get('fallback_mode')}")
            
            if result.get('detailed_analysis'):
                analysis = result['detailed_analysis']
                print(f"📊 Общий скор: {analysis.get('overall_score')}")
                
            print("")
            print("🎉 ДЕТАЛЬНОЕ ЛОГИРОВАНИЕ АКТИВНО!")
            print("📺 Проверьте консоль backend выше ⬆️")
            return True
        else:
            print(f"❌ Ошибка: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"💥 Ошибка: {e}")
        return False

if __name__ == "__main__":
    print("🚀 ЗАПУСК ДЕМОНСТРАЦИИ ДЕТАЛЬНОГО ЛОГИРОВАНИЯ")
    print("")
    demo_enhanced_logging()
    print("")
    print("📋 ЧТО БЫЛО ДОБАВЛЕНО:")
    print("✅ Frontend: детальное логирование всех операций с файлами")
    print("✅ Backend: полное логирование API запросов и обработки")  
    print("✅ Отслеживание: времени выполнения, ошибок, статистики")
    print("")
    print("🔍 ТЕПЕРЬ ВЫ ВИДИТЕ ВСЁ ЧТО ДЕЛАЕТ СИСТЕМА!")