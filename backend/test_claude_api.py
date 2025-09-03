#!/usr/bin/env python3
"""
Simple test script to verify Claude API is working
"""
import os
import asyncio
import anthropic
from dotenv import load_dotenv

async def test_claude_api():
    """Test Claude API connection"""
    print("Testing Claude API connection...")
    
    # Load environment variables
    load_dotenv('.env', override=True)
    
    api_key = os.getenv('ANTHROPIC_API_KEY')
    if not api_key:
        print("ERROR: ANTHROPIC_API_KEY not found in environment")
        return False
    
    print(f"API Key found: {api_key[:20]}...")
    
    try:
        # Create Claude client
        client = anthropic.AsyncAnthropic(api_key=api_key.strip())
        
        # Test message
        response = await client.messages.create(
            model="claude-3-haiku-20240307",
            max_tokens=100,
            temperature=0.1,
            messages=[{
                "role": "user", 
                "content": "Please respond with a simple JSON object containing your status and a brief test message."
            }]
        )
        
        content = response.content[0].text
        print("Claude API Response:")
        print(content)
        print(f"\nTokens used: {response.usage.output_tokens if hasattr(response, 'usage') else 'unknown'}")
        
        # Test with longer KP-like analysis
        kp_test_prompt = """
        Проанализируй следующий короткий КП и верни JSON:
        
        "Компания ТехноСтрой предлагает разработку веб-приложения за 500,000 рублей в течение 3 месяцев."
        
        Верни JSON с полями: company_name, pricing, timeline, compliance_score (число 0-100).
        """
        
        print("\nTesting KP analysis...")
        response2 = await client.messages.create(
            model="claude-3-haiku-20240307",
            max_tokens=200,
            temperature=0.1,
            messages=[{"role": "user", "content": kp_test_prompt}]
        )
        
        content2 = response2.content[0].text
        print("KP Analysis Response:")
        print(content2)
        
        return True
        
    except Exception as e:
        print(f"Claude API Error: {str(e)}")
        return False

if __name__ == "__main__":
    success = asyncio.run(test_claude_api())
    if success:
        print("\nClaude API is working correctly!")
    else:
        print("\nClaude API test failed!")