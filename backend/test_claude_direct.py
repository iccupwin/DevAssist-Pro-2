#!/usr/bin/env python3
"""
Direct test of Claude API to isolate the issue
"""
import asyncio
import os
from dotenv import load_dotenv

async def test_claude_api():
    """Test Claude API directly"""
    try:
        print("=== CLAUDE API TEST ===")
        
        # Load environment
        load_dotenv('.env', override=True)
        
        # Check API key
        api_key = os.getenv('ANTHROPIC_API_KEY')
        if not api_key:
            print("ERROR: No API key found")
            return False
            
        print(f"OK API key found: {api_key[:20]}... (length: {len(api_key)})")
        
        # Import anthropic
        try:
            import anthropic
            print("OK Anthropic package imported successfully")
        except ImportError as e:
            print(f"ERROR: Failed to import anthropic: {e}")
            return False
        
        # Create client
        try:
            client = anthropic.AsyncAnthropic(api_key=api_key.strip())
            print("OK AsyncAnthropic client created")
        except Exception as e:
            print(f"ERROR: Failed to create client: {e}")
            return False
            
        # Make API call
        try:
            print("INFO: Making API call...")
            response = await client.messages.create(
                model="claude-3-haiku-20240307",
                max_tokens=50,
                messages=[{"role": "user", "content": "Hello, please respond with just 'API working'"}]
            )
            
            print("SUCCESS: API call successful!")
            print(f"Response: {response.content[0].text}")
            print(f"Usage: {response.usage.output_tokens if hasattr(response, 'usage') else 'N/A'} tokens")
            return True
            
        except Exception as e:
            print(f"ERROR: API call failed: {type(e).__name__}: {e}")
            import traceback
            print(f"Traceback: {traceback.format_exc()}")
            return False
            
    except Exception as e:
        print(f"ERROR: Test failed: {e}")
        return False

if __name__ == "__main__":
    result = asyncio.run(test_claude_api())
    print(f"\n=== RESULT: {'SUCCESS' if result else 'FAILED'} ===")