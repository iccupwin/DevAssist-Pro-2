#!/usr/bin/env python3
# Test for JSON parsing fix

import json
import asyncio
import httpx
from dotenv import load_dotenv

load_dotenv('.env')

async def test_llm_analyze():
    """Test the /api/llm/analyze endpoint with our JSON fix"""
    
    test_prompt = """
    Коммерческое предложение от ООО "ТестСтрой"
    Стоимость: 5 000 000 рублей
    Срок выполнения: 6 месяцев
    Команда: 5 специалистов
    """
    
    data = {
        "prompt": test_prompt,
        "model": "claude-3-haiku-20240307",
        "max_tokens": 800,
        "temperature": 0.1
    }
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "http://localhost:8000/api/llm/analyze",
                json=data,
                timeout=60.0
            )
            
            print(f"Status: {response.status_code}")
            
            if response.status_code == 200:
                result = response.json()
                print(f"Response keys: {result.keys()}")
                
                # Check if content is valid JSON
                try:
                    content = json.loads(result['content'])
                    print(f"SUCCESS: Valid JSON response with keys: {content.keys()}")
                    print(f"Company name: {content.get('company_name', 'Not found')}")
                    print(f"Compliance score: {content.get('compliance_score', 'Not found')}")
                except json.JSONDecodeError as e:
                    print(f"ERROR: Invalid JSON in content: {e}")
                    print(f"Raw content: {result['content'][:200]}...")
                    
            else:
                print(f"Error response: {response.text}")
                
    except Exception as e:
        print(f"Request failed: {e}")

if __name__ == "__main__":
    asyncio.run(test_llm_analyze())