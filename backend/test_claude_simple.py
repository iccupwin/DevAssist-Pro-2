#!/usr/bin/env python3
"""
Простой тест Claude API интеграции
"""
import os
import asyncio
from dotenv import load_dotenv

async def test_claude_api():
    """Простой тест Claude API"""
    
    load_dotenv()
    
    api_key = os.getenv('ANTHROPIC_API_KEY')
    if not api_key:
        print("ERROR: ANTHROPIC_API_KEY not found")
        return False
    
    print(f"Testing Claude API with key: {api_key[:20]}...")
    
    try:
        import anthropic
        
        client = anthropic.Anthropic(api_key=api_key)
        
        # Простой тестовый запрос
        message = client.messages.create(
            model="claude-3-5-sonnet-20241022",
            max_tokens=200,
            messages=[
                {"role": "user", "content": "Проанализируй коммерческое предложение на строительные работы стоимостью 500 млн рублей. Дай краткую оценку качества."}
            ]
        )
        
        response = message.content[0].text
        print("SUCCESS: Claude API connected!")
        print(f"Response length: {len(response)} characters")
        print("Sample response:")
        print(response[:200] + "..." if len(response) > 200 else response)
        return True
        
    except Exception as e:
        print(f"ERROR: {e}")
        return False

if __name__ == "__main__":
    success = asyncio.run(test_claude_api())
    print("Result:", "SUCCESS" if success else "FAILED")