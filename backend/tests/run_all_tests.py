#!/usr/bin/env python3
"""
Запуск всех тестов DevAssist Pro
"""
import asyncio
import sys
import os

# Добавляем корневую папку в путь для импортов
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from tests.integration.test_dashboard_system import DashboardSystemTest
from tests.integration.test_llm_system import LLMSystemTest

async def run_all_tests():
    """Запуск всех интеграционных тестов"""
    print("🚀 Запуск всех тестов DevAssist Pro...\n")
    
    # Dashboard тесты
    print("=" * 50)
    dashboard_test = DashboardSystemTest()
    await dashboard_test.run_all_tests()
    
    print("\n" + "=" * 50)
    # LLM тесты  
    llm_test = LLMSystemTest()
    await llm_test.run_all_tests()
    
    print("\n" + "=" * 50)
    print("✅ Все тесты завершены!")

if __name__ == "__main__":
    asyncio.run(run_all_tests())