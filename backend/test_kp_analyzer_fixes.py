#!/usr/bin/env python3
"""
ДИАГНОСТИКА КП АНАЛИЗАТОРА
Тестирование критических endpoint'ов для определения точки сбоя
"""
import requests
import json
import sys

def test_health():
    """Тест health endpoint"""
    try:
        print("Тестируем health endpoint...")
        response = requests.get("http://127.0.0.1:8000/health", timeout=5)
        print(f"✅ Health Status: {response.status_code}")
        print(f"   Response: {response.json()}")
        return True
    except Exception as e:
        print(f"❌ Health endpoint failed: {e}")
        return False

def test_llm_basic():
    """Тест базового LLM endpoint /api/llm/analyze"""
    try:
        print("🔍 Тестируем /api/llm/analyze...")
        
        test_data = {
            "prompt": "Проверка работы AI сервиса",
            "max_tokens": 100,
            "temperature": 0.1,
            "model": "claude-3-5-sonnet-20241022"
        }
        
        response = requests.post(
            "http://127.0.0.1:8000/api/llm/analyze",
            json=test_data,
            headers={"Content-Type": "application/json"},
            timeout=30
        )
        
        print(f"✅ LLM Analyze Status: {response.status_code}")
        if response.status_code == 200:
            result = response.json()
            print(f"   Content: {result.get('content', 'No content')[:100]}...")
            return True
        else:
            print(f"   Error: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ LLM analyze endpoint failed: {e}")
        return False

def test_llm_detailed():
    """Тест восстановленного endpoint /api/llm/analyze-detailed"""
    try:
        print("🔍 Тестируем НОВЫЙ /api/llm/analyze-detailed (должен работать)...")
        
        test_data = {
            "tz_content": "Техническое задание: Создать веб-приложение для анализа коммерческих предложений",
            "kp_content": "Коммерческое предложение: Компания ТехСофт предлагает создание веб-приложения за 1,000,000 рублей в течение 3 месяцев.",
            "model": "claude-3-5-sonnet-20241022"
        }
        
        response = requests.post(
            "http://127.0.0.1:8000/api/llm/analyze-detailed",
            json=test_data,
            headers={"Content-Type": "application/json"},
            timeout=30
        )
        
        print(f"✅ LLM Analyze-Detailed Status: {response.status_code}")
        if response.status_code == 200:
            result = response.json()
            print(f"   Success: {result.get('success', False)}")
            print(f"   Analysis ID: {result.get('analysis_id', 'No ID')}")
            print(f"   Fallback Mode: {result.get('fallback_mode', False)}")
            if result.get('detailed_analysis'):
                print(f"   Overall Score: {result['detailed_analysis'].get('overall_score', 'N/A')}")
            return True
        else:
            print(f"   Error: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ LLM analyze-detailed test failed: {e}")
        return False

def test_v3_kp_analyzer():
    """Тест V3 API endpoint /api/v3/kp-analyzer/analyze"""
    try:
        print("🔍 Тестируем /api/v3/kp-analyzer/analyze...")
        
        test_data = {
            "tz_document_id": 1,
            "kp_document_ids": [2],
            "analysis_config": {
                "model": "claude-3-5-sonnet-20241022",
                "criteria_weights": {
                    "budget_compliance": 15,
                    "timeline_compliance": 15,
                    "technical_compliance": 20,
                    "team_expertise": 15,
                    "functional_coverage": 10,
                    "security_quality": 10,
                    "methodology_processes": 5,
                    "scalability_support": 5,
                    "communication_reporting": 3,
                    "additional_value": 2
                }
            }
        }
        
        response = requests.post(
            "http://127.0.0.1:8000/api/v3/kp-analyzer/analyze",
            json=test_data,
            headers={"Content-Type": "application/json"},
            timeout=30
        )
        
        print(f"✅ V3 KP Analyzer Status: {response.status_code}")
        if response.status_code == 200:
            result = response.json()
            print(f"   Success: {result.get('success', False)}")
            print(f"   Analysis ID: {result.get('analysis_id', 'No ID')}")
            return True
        else:
            print(f"   Error: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ V3 KP analyzer endpoint failed: {e}")
        return False

def test_document_upload():
    """Тест загрузки документов"""
    try:
        print("🔍 Тестируем загрузку документа...")
        
        # Создаем тестовый файл
        test_content = "Тестовое техническое задание для проверки системы."
        files = {"file": ("test_tz.txt", test_content, "text/plain")}
        
        response = requests.post(
            "http://127.0.0.1:8000/api/documents/upload",
            files=files,
            timeout=15
        )
        
        print(f"✅ Document Upload Status: {response.status_code}")
        if response.status_code == 200:
            result = response.json()
            print(f"   Document ID: {result.get('document_id', 'No ID')}")
            return True
        else:
            print(f"   Error: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Document upload failed: {e}")
        return False

def main():
    """Запуск всех тестов диагностики"""
    print("=" * 60)
    print("ДИАГНОСТИКА КП АНАЛИЗАТОРА - ПОИСК ТОЧКИ СБОЯ")
    print("=" * 60)
    
    tests = [
        ("Health Check", test_health),
        ("Document Upload", test_document_upload),
        ("LLM Basic Analyze", test_llm_basic),
        ("LLM Detailed (FIXED)", test_llm_detailed),
        ("V3 KP Analyzer", test_v3_kp_analyzer),
    ]
    
    results = {}
    for test_name, test_func in tests:
        print(f"\n{'─' * 50}")
        print(f"🧪 ТЕСТ: {test_name}")
        print(f"{'─' * 50}")
        results[test_name] = test_func()
    
    print("\n" + "=" * 60)
    print("📊 РЕЗУЛЬТАТЫ ДИАГНОСТИКИ:")
    print("=" * 60)
    
    for test_name, passed in results.items():
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"{status} {test_name}")
    
    # Анализ результатов
    if not results.get("Health Check"):
        print("\n🚨 КРИТИЧЕСКАЯ ПРОБЛЕМА: Backend не отвечает")
    elif not results.get("LLM Basic Analyze"):
        print("\n🚨 ПРОБЛЕМА: LLM сервис не работает (ANTHROPIC_API_KEY?)")
    elif results.get("LLM Detailed (404 Expected)"):
        print("\n✅ ПОДТВЕРЖДЕНА ПРОБЛЕМА: /api/llm/analyze-detailed НЕ СУЩЕСТВУЕТ")
        print("   Frontend пытается вызвать несуществующий endpoint!")
    
    if results.get("V3 KP Analyzer"):
        print("\n💡 РЕШЕНИЕ: Можно использовать V3 API вместо analyze-detailed")
    
    print("\n" + "=" * 60)

if __name__ == "__main__":
    main()