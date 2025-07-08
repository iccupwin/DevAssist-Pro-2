#!/usr/bin/env python3
"""
Интеграционные тесты LLM Service DevAssist Pro
Согласно ТЗ Этап 4: AI Integrations
"""
import asyncio
import httpx
import json
import time
from typing import Dict, Any, Optional

class LLMSystemTest:
    def __init__(self, base_url: str = "http://localhost:8002", gateway_url: str = "http://localhost:8000"):
        self.base_url = base_url
        self.gateway_url = gateway_url

    async def test_llm_service_health(self) -> Dict[str, Any]:
        """Тест health check LLM Service"""
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(f"{self.base_url}/health")
                return {
                    "status": "✅ OK" if response.status_code == 200 else "❌ FAIL",
                    "response_code": response.status_code,
                    "response_time": f"{response.elapsed.total_seconds():.2f}s"
                }
        except Exception as e:
            return {
                "status": "❌ FAIL",
                "error": str(e)
            }

    async def run_all_tests(self):
        """Запуск всех тестов LLM системы"""
        print("🤖 Тестирование LLM Service DevAssist Pro...")
        
        health_result = await self.test_llm_service_health()
        print(f"Health check: {health_result['status']}")

async def main():
    test = LLMSystemTest()
    await test.run_all_tests()

if __name__ == "__main__":
    asyncio.run(main())