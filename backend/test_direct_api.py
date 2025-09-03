#!/usr/bin/env python3
"""
Direct test of the working /api/llm/analyze endpoint
This bypasses the service layer and tests the core API
"""

import asyncio
import httpx
import json
from pathlib import Path

async def test_direct_llm_api():
    """Test the /api/llm/analyze endpoint directly"""
    
    print("TESTING DIRECT LLM API ENDPOINT")
    print("=" * 50)
    
    # Read test files
    tz_file = Path("test_tz_sample.txt")
    kp_file = Path("test_kp_sample.txt")
    
    if not kp_file.exists():
        print("ERROR: test_kp_sample.txt not found")
        return False
    
    # Read KP content
    with open(kp_file, 'r', encoding='utf-8') as f:
        kp_content = f.read()
    
    print(f"KP content loaded: {len(kp_content)} characters")
    
    # Create analysis prompt
    analysis_prompt = f"""
Проанализируй коммерческое предложение и верни ТОЛЬКО валидный JSON:

КП:
{kp_content}

Верни JSON с полями:
{{
  "company_name": "название компании",
  "pricing": "стоимость", 
  "timeline": "сроки",
  "compliance_score": число от 70 до 95,
  "advantages": ["преимущество1", "преимущество2"],
  "risks": ["риск1"], 
  "overall_assessment": "краткая оценка"
}}
"""
    
    # Test the endpoint
    try:
        async with httpx.AsyncClient(timeout=120.0) as client:
            print("\nSending request to /api/llm/analyze...")
            
            response = await client.post(
                "http://localhost:8000/api/llm/analyze",
                json={
                    "prompt": analysis_prompt,
                    "model": "claude-3-haiku-20240307",
                    "max_tokens": 1000,
                    "temperature": 0.1
                }
            )
            
            if response.status_code == 200:
                result = response.json()
                print("SUCCESS: Got response from API")
                print(f"Response keys: {list(result.keys())}")
                
                content = result.get("content", "")
                if content:
                    print(f"\nAPI Response Content:")
                    print(content[:500] + "..." if len(content) > 500 else content)
                    
                    # Try to parse as JSON to verify it's valid
                    try:
                        parsed_content = json.loads(content)
                        print(f"\nParsed JSON successfully:")
                        print(f"Company: {parsed_content.get('company_name', 'N/A')}")
                        print(f"Pricing: {parsed_content.get('pricing', 'N/A')}")
                        print(f"Timeline: {parsed_content.get('timeline', 'N/A')}")
                        print(f"Score: {parsed_content.get('compliance_score', 'N/A')}")
                        
                        # Check for mock data
                        content_str = json.dumps(parsed_content).lower()
                        mock_indicators = ["mock", "fake", "fixed enhanced company", "test"]
                        found_mock = [ind for ind in mock_indicators if ind in content_str]
                        
                        if found_mock:
                            print(f"\nWARNING: Mock data indicators: {found_mock}")
                            return False
                        else:
                            print(f"\nVERIFIED: No mock data detected")
                            return True
                            
                    except json.JSONDecodeError as e:
                        print(f"\nERROR: Invalid JSON response: {e}")
                        return False
                
                else:
                    print("ERROR: No content in response")
                    return False
                    
            else:
                print(f"ERROR: API returned {response.status_code}: {response.text}")
                return False
                
    except httpx.ConnectError:
        print("ERROR: Cannot connect to http://localhost:8000 - server not running")
        return False
    except Exception as e:
        print(f"ERROR: Request failed: {e}")
        return False

if __name__ == "__main__":
    success = asyncio.run(test_direct_llm_api())
    print("=" * 50)
    if success:
        print("RESULT: DIRECT API TEST PASSED!")
        print("The /api/llm/analyze endpoint works with real Claude API")
    else:
        print("RESULT: DIRECT API TEST FAILED!")
        print("Check server status and API configuration")