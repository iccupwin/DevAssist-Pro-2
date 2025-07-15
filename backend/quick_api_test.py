#!/usr/bin/env python3
"""
Быстрый тест API сервисов DevAssist Pro
"""
import asyncio
import json
import subprocess
import time
import signal
import os
from pathlib import Path

# Пути к сервисам
SERVICES = {
    "analytics": {
        "path": "services/analytics",
        "port": 8004,
        "module": "main:app"
    },
    "reports": {
        "path": "services/reports", 
        "port": 8005,
        "module": "main:app"
    }
}

class ServiceManager:
    def __init__(self):
        self.processes = {}
    
    def start_service(self, name, config):
        """Запуск сервиса"""
        print(f"🚀 Запуск {name} сервиса на порту {config['port']}...")
        
        # Переходим в директорию сервиса
        service_path = Path(config['path'])
        
        # Добавляем shared в PYTHONPATH
        env = os.environ.copy()
        env['PYTHONPATH'] = f"{Path.cwd()}/shared:{env.get('PYTHONPATH', '')}"
        
        # Запускаем uvicorn
        cmd = [
            "uvicorn", 
            config['module'],
            "--host", "0.0.0.0",
            "--port", str(config['port']),
            "--reload"
        ]
        
        process = subprocess.Popen(
            cmd,
            cwd=service_path,
            env=env,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE
        )
        
        self.processes[name] = process
        print(f"✅ {name} запущен (PID: {process.pid})")
        return process
    
    def stop_all(self):
        """Остановка всех сервисов"""
        print("\n🛑 Остановка всех сервисов...")
        for name, process in self.processes.items():
            if process.poll() is None:
                print(f"   Остановка {name}...")
                process.terminate()
                try:
                    process.wait(timeout=5)
                except subprocess.TimeoutExpired:
                    process.kill()
        self.processes.clear()

async def test_service_api(name, port):
    """Тест API сервиса"""
    import httpx
    
    base_url = f"http://localhost:{port}"
    
    try:
        async with httpx.AsyncClient() as client:
            # Тест health endpoint
            response = await client.get(f"{base_url}/health", timeout=5.0)
            
            if response.status_code == 200:
                health_data = response.json()
                print(f"✅ {name}: {health_data.get('status', 'unknown')}")
                return True
            else:
                print(f"❌ {name}: HTTP {response.status_code}")
                return False
                
    except Exception as e:
        print(f"❌ {name}: {str(e)}")
        return False

async def test_analytics_endpoints():
    """Тест специфичных эндпоинтов Analytics"""
    import httpx
    
    print("\n📊 Тест Analytics API:")
    base_url = "http://localhost:8004"
    
    try:
        async with httpx.AsyncClient() as client:
            # Тест dashboard статистики
            response = await client.get(f"{base_url}/statistics/dashboard?period=7d", timeout=10.0)
            
            if response.status_code == 200:
                data = response.json()
                stats = data.get('statistics', {})
                overview = stats.get('overview', {})
                
                print(f"   ✅ Dashboard статистика получена")
                print(f"   📈 Проектов: {overview.get('total_projects', 0)}")
                print(f"   📊 Анализов: {overview.get('total_analyses', 0)}")
                print(f"   📄 Документов: {overview.get('total_documents', 0)}")
                return True
            else:
                print(f"   ❌ Dashboard API: HTTP {response.status_code}")
                return False
                
    except Exception as e:
        print(f"   ❌ Dashboard API: {str(e)}")
        return False

async def test_reports_endpoints():
    """Тест специфичных эндпоинтов Reports"""
    import httpx
    
    print("\n📊 Тест Reports API:")
    base_url = "http://localhost:8005"
    
    try:
        async with httpx.AsyncClient() as client:
            # Тест списка шаблонов
            response = await client.get(f"{base_url}/templates", timeout=10.0)
            
            if response.status_code == 200:
                data = response.json()
                templates = data.get('templates', [])
                
                print(f"   ✅ Шаблоны получены")
                print(f"   📝 Доступно шаблонов: {len(templates)}")
                
                for template in templates[:3]:
                    print(f"      • {template.get('name', 'Unknown')}")
                
                return True
            else:
                print(f"   ❌ Templates API: HTTP {response.status_code}")
                return False
                
    except Exception as e:
        print(f"   ❌ Templates API: {str(e)}")
        return False

async def main():
    """Главная функция"""
    print("🎯 DevAssist Pro - Быстрый тест API")
    print("=" * 50)
    
    # Проверка доступности библиотек
    try:
        import httpx
        print("✅ httpx библиотека доступна")
    except ImportError:
        print("❌ httpx не установлен. Установите: pip install httpx")
        return False
    
    # Создание менеджера сервисов
    manager = ServiceManager()
    
    try:
        # Запуск сервисов
        print("\n🚀 Запуск сервисов:")
        print("-" * 30)
        
        for name, config in SERVICES.items():
            manager.start_service(name, config)
        
        # Ждем запуска
        print("\n⏳ Ожидание инициализации сервисов...")
        await asyncio.sleep(5)
        
        # Тестирование
        print("\n🔍 Тестирование API:")
        print("-" * 30)
        
        results = {}
        
        # Базовые health checks
        for name, config in SERVICES.items():
            results[name] = await test_service_api(name, config['port'])
        
        # Специфичные тесты
        if results.get('analytics'):
            results['analytics_detailed'] = await test_analytics_endpoints()
        
        if results.get('reports'):
            results['reports_detailed'] = await test_reports_endpoints()
        
        # Итоги
        print("\n" + "=" * 50)
        print("📊 РЕЗУЛЬТАТЫ:")
        print("=" * 50)
        
        passed = sum(1 for result in results.values() if result)
        total = len(results)
        
        for test_name, result in results.items():
            status = "✅ ПРОЙДЕН" if result else "❌ ОШИБКА"
            print(f"{test_name.upper():>20}: {status}")
        
        print("-" * 50)
        print(f"ИТОГО: {passed}/{total} тестов пройдено")
        
        if passed == total:
            print("\n🎉 ВСЕ ТЕСТЫ ПРОЙДЕНЫ!")
            print("\n🌐 Доступные эндпоинты:")
            print("   • Analytics Health:  http://localhost:8004/health")
            print("   • Analytics Docs:    http://localhost:8004/docs")
            print("   • Reports Health:    http://localhost:8005/health") 
            print("   • Reports Docs:      http://localhost:8005/docs")
            
            print(f"\n⏱️  Сервисы будут работать еще 30 секунд для тестирования...")
            await asyncio.sleep(30)
        else:
            print(f"\n⚠️  Есть ошибки в {total - passed} тест(ах)")
        
        return passed == total
        
    except KeyboardInterrupt:
        print("\n\n⚠️ Прервано пользователем")
        return False
    
    finally:
        manager.stop_all()
        print("✅ Все сервисы остановлены")

if __name__ == "__main__":
    success = asyncio.run(main())
    exit(0 if success else 1)