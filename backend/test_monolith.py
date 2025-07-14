#!/usr/bin/env python3
"""
Тест монолитного приложения DevAssist Pro
"""
import requests
import json
import time
import os
from pathlib import Path

BASE_URL = "http://localhost:8000"

def test_health():
    """Тест health check"""
    print("🔍 Тест Health Check...")
    try:
        response = requests.get(f"{BASE_URL}/health", timeout=5)
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Health Check: {data['status']}")
            return True
        else:
            print(f"❌ Health Check: HTTP {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Health Check: {e}")
        return False

def test_admin_status():
    """Тест административного API"""
    print("🔍 Тест Admin Status...")
    try:
        response = requests.get(f"{BASE_URL}/api/admin/status", timeout=5)
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Admin Status: {data['status']}")
            return True
        else:
            print(f"❌ Admin Status: HTTP {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Admin Status: {e}")
        return False

def test_analytics():
    """Тест аналитики"""
    print("🔍 Тест Analytics API...")
    try:
        # Тест обработки аналитики
        payload = {
            "data_type": "analyses",
            "aggregation_type": "count",
            "period": "30d"
        }
        response = requests.post(f"{BASE_URL}/api/analytics/process", 
                               json=payload, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            results = data.get('results', {})
            print(f"✅ Analytics: {results.get('total_analyses', 0)} анализов")
            return True
        else:
            print(f"❌ Analytics: HTTP {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Analytics: {e}")
        return False

def test_dashboard():
    """Тест дашборда"""
    print("🔍 Тест Dashboard API...")
    try:
        response = requests.get(f"{BASE_URL}/api/analytics/dashboard?period=30d", 
                              timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            stats = data.get('data', {}).get('overview', {})
            print(f"✅ Dashboard: {stats.get('total_projects', 0)} проектов")
            return True
        else:
            print(f"❌ Dashboard: HTTP {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Dashboard: {e}")
        return False

def test_reports():
    """Тест генерации отчетов"""
    print("🔍 Тест Reports API...")
    try:
        # Тест PDF отчета
        payload = {
            "analysis_id": 12345,
            "report_format": "pdf",
            "template_name": "kp_analysis_default",
            "include_charts": True
        }
        response = requests.post(f"{BASE_URL}/api/reports/generate/pdf", 
                               json=payload, timeout=15)
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ PDF Report: {data.get('download_url', 'generated')}")
            return True
        else:
            print(f"❌ PDF Report: HTTP {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ PDF Report: {e}")
        return False

def test_kp_analyzer():
    """Тест КП анализатора"""
    print("🔍 Тест КП Analyzer API...")
    try:
        # Создаем тестовый файл
        test_file_content = """
        КОММЕРЧЕСКОЕ ПРЕДЛОЖЕНИЕ
        
        Название: Разработка веб-портала
        Сроки: 3 месяца
        Стоимость: 500,000 рублей
        
        Описание проекта:
        Разработка современного веб-портала для управления недвижимостью.
        """
        
        # Сохраняем во временный файл
        test_file_path = Path("test_kp.txt")
        with open(test_file_path, 'w', encoding='utf-8') as f:
            f.write(test_file_content)
        
        # Отправляем файл на анализ
        with open(test_file_path, 'rb') as f:
            files = {'file': ('test_kp.txt', f, 'text/plain')}
            response = requests.post(f"{BASE_URL}/api/kp-analyzer/full-analysis", 
                                   files=files, timeout=30)
        
        # Удаляем тестовый файл
        test_file_path.unlink(missing_ok=True)
        
        if response.status_code == 200:
            data = response.json()
            analysis = data.get('data', {}).get('analysis', {})
            quality_score = analysis.get('results', {}).get('quality_score', 0)
            print(f"✅ КП Analyzer: Качество {quality_score}%")
            return True
        else:
            print(f"❌ КП Analyzer: HTTP {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ КП Analyzer: {e}")
        return False

def main():
    """Главная функция тестирования"""
    print("🎯 DevAssist Pro - Тестирование монолитного приложения")
    print("=" * 60)
    
    # Ждем запуска приложения
    print("⏳ Ожидание запуска приложения...")
    time.sleep(3)
    
    tests = [
        ("Health Check", test_health),
        ("Admin Status", test_admin_status), 
        ("Analytics API", test_analytics),
        ("Dashboard API", test_dashboard),
        ("Reports API", test_reports),
        ("КП Analyzer", test_kp_analyzer)
    ]
    
    results = {}
    passed = 0
    total = len(tests)
    
    print(f"\n🧪 Запуск {total} тестов:")
    print("-" * 40)
    
    for name, test_func in tests:
        try:
            result = test_func()
            results[name] = result
            if result:
                passed += 1
        except Exception as e:
            print(f"❌ {name}: Исключение - {e}")
            results[name] = False
        
        print()  # Пустая строка между тестами
    
    # Итоги
    print("=" * 60)
    print("📊 РЕЗУЛЬТАТЫ ТЕСТИРОВАНИЯ:")
    print("=" * 60)
    
    for test_name, result in results.items():
        status = "✅ ПРОЙДЕН" if result else "❌ ОШИБКА"
        print(f"{test_name:>20}: {status}")
    
    print("-" * 60)
    print(f"ИТОГО: {passed}/{total} тестов пройдено")
    
    if passed == total:
        print("\n🎉 ВСЕ ТЕСТЫ ПРОЙДЕНЫ!")
        print("\n🌐 Доступные эндпоинты:")
        print("   • Главная страница:     http://localhost:8000")
        print("   • API документация:     http://localhost:8000/docs")
        print("   • Health Check:         http://localhost:8000/health")
        print("   • КП Анализатор:        http://localhost:8000/api/kp-analyzer/")
        print("   • Аналитика:            http://localhost:8000/api/analytics/")
        print("   • Отчеты:               http://localhost:8000/api/reports/")
        print("   • Админ панель:         http://localhost:8000/api/admin/")
        
        print("\n✅ DevAssist Pro успешно работает!")
        return True
    else:
        print(f"\n⚠️  {total - passed} тест(ов) завершились ошибкой.")
        print("Проверьте, что приложение запущено: python3 app.py")
        return False

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)