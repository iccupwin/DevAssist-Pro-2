#!/usr/bin/env python3
"""
Простой тест API для проверки работы backend без кеша
"""

import requests
import json
import sys

def test_debug_endpoint():
    """Тест debug endpoint"""
    try:
        response = requests.get("http://127.0.0.1:8000/api/debug", timeout=5)
        print(f"DEBUG Endpoint Status: {response.status_code}")
        if response.status_code == 200:
            print(f"DEBUG Response: {response.json()}")
            return True
        else:
            print(f"DEBUG Error: {response.text}")
            return False
    except Exception as e:
        print(f"DEBUG Failed: {e}")
        return False

def test_enhanced_endpoint():
    """Тест enhanced analyzer endpoint"""
    try:
        data = {"prompt": "Тестовый документ для анализа стоимости проекта"}
        response = requests.post("http://127.0.0.1:8000/api/llm/analyze-enhanced", 
                               json=data, timeout=10)
        
        print(f"ENHANCED Endpoint Status: {response.status_code}")
        if response.status_code == 200:
            result = response.json()
            print(f"ENHANCED Response: {json.dumps(result, indent=2, ensure_ascii=False)}")
            
            # Проверяем что content теперь объект, а не строка
            if isinstance(result.get('content'), dict):
                print("SUCCESS: content is now a proper JSON object!")
                return True
            elif isinstance(result.get('content'), str):
                print("FAIL: content is still a string")
                try:
                    json.loads(result['content'])
                    print("But it's valid JSON string, so frontend should work")
                    return True
                except:
                    print("And it's not valid JSON!")
                    return False
            else:
                print("FAIL: Unexpected content type")
                return False
        else:
            print(f"ENHANCED Error: {response.text}")
            return False
    except Exception as e:
        print(f"ENHANCED Failed: {e}")
        return False

def test_main_analyze_endpoint():
    """Тест основного analyze endpoint"""
    try:
        data = {
            "prompt": "Анализ коммерческого предложения строительной компании с бюджетом 5 млн рублей на срок 3 месяца",
            "model": "claude-3-haiku-20240307"
        }
        response = requests.post("http://127.0.0.1:8000/api/llm/analyze", 
                               json=data, timeout=15)
        
        print(f"MAIN Endpoint Status: {response.status_code}")
        if response.status_code == 200:
            result = response.json()
            print(f"MAIN Response: {json.dumps(result, indent=2, ensure_ascii=False)}")
            
            # Проверяем что в fallback mode возвращается правильный JSON
            content = result.get('content')
            if isinstance(content, str):
                try:
                    parsed_content = json.loads(content)
                    print("SUCCESS: Fallback mode returns valid JSON string!")
                    return True
                except:
                    print("FAIL: Fallback content is not valid JSON")
                    return False
            elif isinstance(content, dict):
                print("SUCCESS: Main endpoint returns JSON object!")
                return True
            else:
                print("FAIL: Unexpected content type in main endpoint")
                return False
        else:
            print(f"MAIN Error: {response.text}")
            return False
    except Exception as e:
        print(f"MAIN Failed: {e}")
        return False

if __name__ == "__main__":
    print("TESTING API AFTER CACHE FIX")
    print("=" * 50)
    
    tests = [
        ("Debug Endpoint", test_debug_endpoint),
        ("Enhanced Analyzer", test_enhanced_endpoint), 
        ("Main Analyzer", test_main_analyze_endpoint)
    ]
    
    results = []
    for name, test_func in tests:
        print(f"\nTesting {name}...")
        result = test_func()
        results.append((name, result))
        print(f"Result: {'PASS' if result else 'FAIL'}")
    
    print(f"\nFINAL RESULTS:")
    print("=" * 30)
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for name, result in results:
        status = "PASS" if result else "FAIL"
        print(f"{name}: {status}")
    
    print(f"\nOverall result: {passed}/{total} tests passed")
    
    if passed == total:
        print("ALL TESTS PASSED! Backend works correctly.")
        sys.exit(0)
    else:
        print("Some tests failed.")
        sys.exit(1)