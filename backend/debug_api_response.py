#!/usr/bin/env python3
"""
Debug the exact API response to understand where mock data comes from
"""

import asyncio
import httpx
import json

async def debug_api_response():
    """Debug the API response step by step"""
    
    print("DEBUGGING API RESPONSE")
    print("=" * 50)
    
    # Very simple test prompt
    simple_prompt = "Company ABC offers web development for 100,000 rubles in 2 months"
    
    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            print("Sending simple test request...")
            
            response = await client.post(
                "http://localhost:8000/api/llm/analyze", 
                json={
                    "prompt": simple_prompt,
                    "model": "claude-3-haiku-20240307",
                    "max_tokens": 500,
                    "temperature": 0.1
                }
            )
            
            print(f"Status Code: {response.status_code}")
            print(f"Headers: {dict(response.headers)}")
            
            if response.status_code == 200:
                result = response.json()
                print("\nFull Response:")
                print(json.dumps(result, indent=2, ensure_ascii=False))
                
                # Check specific fields
                content = result.get("content", "")
                model = result.get("model", "")
                fallback_mode = result.get("fallback_mode", False)
                
                print(f"\nResponse Analysis:")
                print(f"Model used: {model}")
                print(f"Fallback mode: {fallback_mode}")
                print(f"Content type: {type(content)}")
                
                if isinstance(content, str):
                    print(f"Content (first 200 chars): {content[:200]}")
                    
                    # Check if it's JSON
                    try:
                        parsed = json.loads(content)
                        print(f"Parsed JSON keys: {list(parsed.keys())}")
                        company = parsed.get("company_name", "")
                        print(f"Company name in response: '{company}'")
                        
                        if "TEST" in company.upper() or "FIXED" in company.upper():
                            print("FOUND MOCK DATA!")
                        else:
                            print("No obvious mock data detected in company name")
                            
                    except json.JSONDecodeError:
                        print("Content is not valid JSON")
                        
            else:
                print(f"Error response: {response.text}")
                
    except httpx.ConnectError:
        print("ERROR: Cannot connect to localhost:8000")
        print("Make sure the backend server is running")
        return False
    except Exception as e:
        print(f"Request failed: {e}")
        return False
        
    return True

if __name__ == "__main__":
    asyncio.run(debug_api_response())