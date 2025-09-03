#!/usr/bin/env python3
"""
Простой тест для проверки endpoint /api/llm/analyze
🔥 ТЕСТ ИСПРАВЛЕННОЙ СИСТЕМЫ АНАЛИЗА КП
"""

import requests
import json
import time
import os
from pathlib import Path

# Конфигурация
API_BASE_URL = "http://localhost:8000"
ENDPOINT = "/api/llm/analyze"

def load_test_document():
    """Загружаем тестовый документ КП"""
    test_file = Path(__file__).parent / "test_kp_simple.txt"
    if not test_file.exists():
        raise FileNotFoundError(f"Тестовый файл не найден: {test_file}")
    
    with open(test_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    print(f"✅ Загружен тестовый документ: {len(content)} символов")
    return content

def test_analyze_endpoint():
    """Тест основного endpoint анализа"""
    print("🚀 НАЧИНАЕМ ТЕСТ ИСПРАВЛЕННОЙ СИСТЕМЫ")
    print("=" * 60)
    
    try:
        # Загружаем тестовый документ
        document_content = load_test_document()
        
        # Подготавливаем запрос
        payload = {
            "prompt": document_content,
            "model": "claude-3-haiku-20240307",
            "max_tokens": 1500,
            "temperature": 0.1
        }
        
        print(f"📤 Отправляем запрос на {API_BASE_URL}{ENDPOINT}")
        print(f"📊 Размер payload: {len(json.dumps(payload))} байт")
        
        start_time = time.time()
        
        # Отправляем запрос с timeout
        response = requests.post(
            f"{API_BASE_URL}{ENDPOINT}",
            json=payload,
            timeout=120  # 2 минуты timeout
        )
        
        end_time = time.time()
        processing_time = end_time - start_time
        
        print(f"⏱️  Время выполнения: {processing_time:.2f} секунд")
        print(f"📡 Статус ответа: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            
            print("✅ УСПЕШНЫЙ ОТВЕТ!")
            print("-" * 40)
            
            # Проверяем ключевые поля
            required_fields = ['content', 'model', 'processing_time']
            missing_fields = [field for field in required_fields if field not in result]
            
            if missing_fields:
                print(f"⚠️  Отсутствуют поля: {missing_fields}")
            else:
                print("✅ Все обязательные поля присутствуют")
            
            # Выводим основную информацию
            print(f"🤖 Модель: {result.get('model', 'N/A')}")
            print(f"⏱️  Время обработки: {result.get('processing_time', 'N/A')}")
            print(f"🔄 Fallback режим: {result.get('fallback_mode', False)}")
            print(f"🎯 Качество анализа: {result.get('analysis_quality', 'N/A')}")
            
            # Проверяем содержимое ответа
            if 'content' in result:
                content = result['content']
                print(f"📄 Размер content: {len(content)} символов")
                
                # Пытаемся распарсить JSON из content
                try:
                    if isinstance(content, str):
                        parsed_content = json.loads(content)
                        print("✅ Content успешно распарсен как JSON")
                        
                        # Проверяем ключевые поля анализа
                        analysis_fields = ['company_name', 'compliance_score', 'overall_assessment']
                        for field in analysis_fields:
                            if field in parsed_content:
                                print(f"  📌 {field}: {parsed_content[field]}")
                    else:
                        print("ℹ️  Content не является строкой JSON")
                        
                except json.JSONDecodeError as e:
                    print(f"⚠️  Ошибка парсинга JSON content: {e}")
                    print(f"  Первые 200 символов: {content[:200]}...")
            
            if result.get('fallback_mode'):
                print("⚠️  ВНИМАНИЕ: Использован fallback режим")
                if 'warning' in result:
                    print(f"  Предупреждение: {result['warning']}")
            else:
                print("✅ Использован реальный Claude API")
                
        else:
            print(f"❌ ОШИБКА ЗАПРОСА: {response.status_code}")
            try:
                error_data = response.json()
                print(f"  Детали ошибки: {error_data}")
            except:
                print(f"  Ответ сервера: {response.text[:500]}...")
    
    except requests.exceptions.Timeout:
        print("⏰ TIMEOUT: Запрос превысил лимит времени (120 секунд)")
        print("❌ СИСТЕМА ПО-ПРЕЖНЕМУ ЗАВИСАЕТ!")
        
    except requests.exceptions.ConnectionError:
        print("🔌 ОШИБКА СОЕДИНЕНИЯ: Не удается подключиться к серверу")
        print("  Убедитесь что backend запущен на localhost:8000")
        
    except Exception as e:
        print(f"💥 НЕОЖИДАННАЯ ОШИБКА: {e}")
        print(f"  Тип ошибки: {type(e).__name__}")

def test_health_endpoint():
    """Тест health endpoint для проверки работы сервера"""
    print("\n🏥 Проверяем health endpoint...")
    
    try:
        response = requests.get(f"{API_BASE_URL}/health", timeout=5)
        if response.status_code == 200:
            print("✅ Сервер работает")
            return True
        else:
            print(f"⚠️  Сервер отвечает с кодом: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Сервер не отвечает: {e}")
        return False

if __name__ == "__main__":
    print("🔥 ТЕСТ ИСПРАВЛЕННОЙ СИСТЕМЫ КП АНАЛИЗАТОРА")
    print("=" * 60)
    
    # Сначала проверяем доступность сервера
    if test_health_endpoint():
        print("\n" + "="*60)
        test_analyze_endpoint()
    else:
        print("\n❌ Тест прерван - сервер недоступен")
        print("   Запустите backend командой: python3 app.py")
    
    print("\n" + "="*60)
    print("🏁 ТЕСТ ЗАВЕРШЕН")