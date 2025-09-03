#!/usr/bin/env python3
"""Test Claude API key directly"""
import os
import anthropic
import asyncio
from dotenv import load_dotenv

# Load environment
load_dotenv()

async def test_claude_api():
    """Test Claude API with current environment"""
    api_key = os.getenv('ANTHROPIC_API_KEY')
    print(f"API Key loaded: {api_key[:20]}... (length: {len(api_key) if api_key else 0})")
    
    if not api_key:
        print("API key not found in environment")
        return False
    
    try:
        # Test with AsyncAnthropic (same as in app)
        client = anthropic.AsyncAnthropic(api_key=api_key)
        
        response = await client.messages.create(
            model='claude-3-haiku-20240307',
            max_tokens=10,
            messages=[
                {"role": "user", "content": "Hello"}
            ]
        )
        
        print("SUCCESS: AsyncAnthropic client works")
        print(f"Response: {response.content[0].text}")
        return True
        
    except anthropic.AuthenticationError as e:
        print(f"AUTHENTICATION ERROR: {e}")
        return False
    except Exception as e:
        print(f"OTHER ERROR: {e}")
        return False

if __name__ == "__main__":
    success = asyncio.run(test_claude_api())
    print(f"\nTest result: {'PASSED' if success else 'FAILED'}")