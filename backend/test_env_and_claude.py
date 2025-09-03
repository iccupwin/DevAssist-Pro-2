#!/usr/bin/env python3
"""
ДИАГНОСТИЧЕСКИЙ СКРИПТ ДЛЯ ПРОБЛЕМ CLAUDE API
Тестирует загрузку environment variables и Claude API connection
"""
import os
import sys
from dotenv import load_dotenv

def test_environment_loading():
    print("ТЕСТИРОВАНИЕ ENVIRONMENT VARIABLES")
    print("=" * 50)
    
    # Test 1: Load from backend/.env
    print("Загружаем .env из backend/:")
    load_dotenv('.env')
    api_key = os.getenv('ANTHROPIC_API_KEY')
    
    print(f"   ANTHROPIC_API_KEY: {'НАЙДЕН' if api_key else 'НЕ НАЙДЕН'}")
    if api_key:
        print(f"   Длина ключа: {len(api_key)} символов")
        print(f"   Начинается с sk-ant-: {'ДА' if api_key.startswith('sk-ant-') else 'НЕТ'}")
        print(f"   Первые 20 символов: {api_key[:20]}...")
    
    # Test 2: Load from root .env  
    print("\nЗагружаем .env из root:")
    load_dotenv('../.env')
    api_key_root = os.getenv('ANTHROPIC_API_KEY')
    
    print(f"   ANTHROPIC_API_KEY: {'НАЙДЕН' if api_key_root else 'НЕ НАЙДЕН'}")
    if api_key_root:
        print(f"   Длина ключа: {len(api_key_root)} символов")
        print(f"   Первые 20 символов: {api_key_root[:20]}...")
    
    return api_key or api_key_root

def test_claude_api(api_key):
    print(f"\n🤖 ТЕСТИРОВАНИЕ CLAUDE API")
    print("=" * 50)
    
    if not api_key:
        print("❌ API key не найден, пропускаем тест Claude API")
        return False
        
    try:
        import anthropic
        print("✅ Библиотека anthropic импортирована")
        
        client = anthropic.Anthropic(api_key=api_key.strip())
        print("✅ Claude client создан")
        
        # Simple test request
        response = client.messages.create(
            model="claude-3-haiku-20240307",
            max_tokens=50,
            messages=[{"role": "user", "content": "Привет! Ты работаешь?"}]
        )
        
        print("✅ Запрос к Claude API выполнен успешно")
        print(f"   Ответ: {response.content[0].text}")
        print(f"   Использовано токенов: {getattr(response.usage, 'output_tokens', 0)}")
        return True
        
    except ImportError:
        print("❌ Библиотека anthropic не установлена")
        return False
    except anthropic.AuthenticationError as e:
        print(f"❌ Ошибка аутентификации: {e}")
        return False
    except anthropic.BadRequestError as e:
        print(f"❌ Неправильный запрос: {e}")
        return False
    except Exception as e:
        print(f"❌ Другая ошибка: {e}")
        return False

def test_kp_analysis_workflow():
    print(f"\n📋 ТЕСТИРОВАНИЕ WORKFLOW КП АНАЛИЗАТОРА")
    print("=" * 50)
    
    api_key = os.getenv('ANTHROPIC_API_KEY')
    if not api_key:
        print("❌ API key не найден, создаём mock анализ")
        return {
            "status": "mock",
            "company_name": "Тестовая Компания", 
            "compliance_score": 85,
            "overall_assessment": "Mock анализ - API key не настроен"
        }
    
    try:
        import anthropic
        client = anthropic.Anthropic(api_key=api_key.strip())
        
        # Simulate KP analysis request
        prompt = """
Проанализируй коммерческое предложение от компании СтройТех на строительство 
жилого комплекса стоимостью 75 млн рублей, сроки 18 месяцев, гарантия 3 года.

Верни результат в JSON формате:
{
  "company_name": "название компании",
  "compliance_score": оценка от 0 до 100,
  "overall_assessment": "общая оценка предложения",
  "recommendations": ["рекомендация 1", "рекомендация 2"]
}
"""
        
        response = client.messages.create(
            model="claude-3-haiku-20240307",
            max_tokens=500,
            temperature=0.1,
            messages=[{"role": "user", "content": prompt}]
        )
        
        result = response.content[0].text.strip()
        print("✅ КП анализ выполнен")
        print(f"   Длина ответа: {len(result)} символов")
        print(f"   Первые 200 символов: {result[:200]}...")
        
        # Try to parse JSON
        try:
            import json
            if result.startswith('{'):
                parsed = json.loads(result)
                print("✅ Ответ в валидном JSON формате")
                print(f"   Компания: {parsed.get('company_name', 'N/A')}")
                print(f"   Оценка: {parsed.get('compliance_score', 'N/A')}")
            else:
                print("⚠️ Ответ не в JSON формате")
        except json.JSONDecodeError:
            print("❌ Ошибка парсинга JSON")
            
        return {
            "status": "success",
            "content": result,
            "model": "claude-3-haiku-20240307"
        }
        
    except Exception as e:
        print(f"❌ Ошибка КП анализа: {e}")
        return {"status": "error", "error": str(e)}

if __name__ == "__main__":
    print("🚀 ДИАГНОСТИКА CLAUDE API INTEGRATION")
    print("=" * 60)
    
    # Step 1: Test environment loading
    api_key = test_environment_loading()
    
    # Step 2: Test Claude API  
    claude_works = test_claude_api(api_key)
    
    # Step 3: Test KP analysis workflow
    analysis_result = test_kp_analysis_workflow()
    
    # Summary
    print(f"\n📋 ИТОГИ ДИАГНОСТИКИ")
    print("=" * 50)
    print(f"Environment Variables: {'✅ OK' if api_key else '❌ FAILED'}")
    print(f"Claude API Connection: {'✅ OK' if claude_works else '❌ FAILED'}")
    print(f"KP Analysis Workflow: {'✅ OK' if analysis_result.get('status') == 'success' else '⚠️ MOCK' if analysis_result.get('status') == 'mock' else '❌ FAILED'}")
    
    if api_key and claude_works:
        print(f"\n🎉 ВСЁ ГОТОВО! Claude API работает корректно")
        print(f"Можно исправлять backend и тестировать КП Анализатор")
    else:
        print(f"\n⚠️ ТРЕБУЕТСЯ ИСПРАВЛЕНИЕ:")
        if not api_key:
            print(f"   - Настроить ANTHROPIC_API_KEY в .env файле")
        if not claude_works:
            print(f"   - Проверить подключение к Claude API")