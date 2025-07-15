#!/usr/bin/env python3
"""
Интеграционные тесты Dashboard системы DevAssist Pro
Согласно ТЗ Этап 3: Главный портал
"""
import asyncio
import httpx
import json
from typing import Dict, Any, Optional

class DashboardSystemTest:
    def __init__(self, base_url: str = "http://localhost:8006", gateway_url: str = "http://localhost:8000"):
        self.base_url = base_url
        self.gateway_url = gateway_url
        self.access_token: Optional[str] = None

    async def setup_auth(self) -> bool:
        """Настройка авторизации для тестов"""
        try:
            # Регистрация тестового пользователя
            test_user = {
                "email": "dashboard_test@devassist.pro",
                "password": "TestPassword123!",
                "full_name": "Dashboard Test User",
                "company": "DevAssist Pro"
            }

            async with httpx.AsyncClient(timeout=10.0) as client:
                # Регистрация
                register_response = await client.post(
                    f"{self.gateway_url}/api/auth/register",
                    json=test_user
                )
                
                # Вход
                login_data = {
                    "email": test_user["email"],
                    "password": test_user["password"]
                }
                
                login_response = await client.post(
                    f"{self.gateway_url}/api/auth/login",
                    json=login_data
                )
                
                if login_response.status_code == 200:
                    self.access_token = login_response.json().get("access_token")
                    return True
                    
                return False
                
        except Exception as e:
            print(f"Auth setup error: {e}")
            return False

    async def test_dashboard_service_health(self) -> Dict[str, Any]:
        """Тест health check Dashboard Service"""
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
        """Запуск всех тестов Dashboard системы"""
        print("🎨 Тестирование Dashboard системы DevAssist Pro...")
        
        health_result = await self.test_dashboard_service_health()
        print(f"Health check: {health_result['status']}")

async def main():
    test = DashboardSystemTest()
    await test.run_all_tests()

if __name__ == "__main__":
    asyncio.run(main())