#!/usr/bin/env python3
import os
from dotenv import load_dotenv

print("=== ДИАГНОСТИКА CLAUDE API ===")

# Load environment variables
print("1. Загружаем environment variables...")
load_dotenv('.env')
api_key = os.getenv('ANTHROPIC_API_KEY')

print(f"   API Key найден: {bool(api_key)}")
if api_key:
    print(f"   Длина: {len(api_key)} символов")
    print(f"   Начинается с sk-ant-: {api_key.startswith('sk-ant-')}")
    print(f"   Первые символы: {api_key[:15]}...")

# Test Claude API
if api_key:
    print("\n2. Тестируем Claude API...")
    try:
        import anthropic
        client = anthropic.Anthropic(api_key=api_key.strip())
        
        response = client.messages.create(
            model="claude-3-haiku-20240307",
            max_tokens=50,
            messages=[{"role": "user", "content": "Hello"}]
        )
        
        print(f"   SUCCESS: Claude API работает!")
        print(f"   Ответ: {response.content[0].text}")
        
    except Exception as e:
        print(f"   ERROR: {e}")
else:
    print("\n2. API key не найден, пропускаем тест")

print("\n=== КОНЕЦ ДИАГНОСТИКИ ===")