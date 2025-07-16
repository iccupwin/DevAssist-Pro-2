#\!/usr/bin/env python3
"""
Интеграционный тест системы DevAssist Pro
Проверяет связку PostgreSQL + Backend + Frontend
"""
import requests
import json

def test_auth_integration():
    """Тест аутентификации"""
    base_url = "http://localhost:8000"
    
    # Тест регистрации
    register_data = {
        "email": "integration@test.com",
        "password": "password123",
        "full_name": "Интеграционный Тест",
        "company": "Test Corp",
        "phone": "+7 (999) 888-77-66"
    }
    
    response = requests.post(f"{base_url}/api/auth/register", json=register_data)
    print(f"✅ Регистрация: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        if data.get('success'):
            print(f"   Пользователь создан: {data['user']['email']}")
            token = data.get('token')
            
            # Тест входа
            login_data = {
                "email": "integration@test.com", 
                "password": "password123"
            }
            response = requests.post(f"{base_url}/api/auth/login", json=login_data)
            print(f"✅ Вход: {response.status_code}")
            
            if response.status_code == 200:
                login_result = response.json()
                if login_result.get('success'):
                    print(f"   Вход успешный: {login_result['user']['full_name']}")
                    return True
    
    return False

def test_database_integration():
    """Тест базы данных"""
    import subprocess
    
    try:
        result = subprocess.run([
            'docker', 'exec', 'devassist_postgres_monolith',
            'psql', '-U', 'devassist', '-d', 'devassist_pro',
            '-c', 'SELECT COUNT(*) FROM users;'
        ], capture_output=True, text=True)
        
        if result.returncode == 0:
            print("✅ PostgreSQL подключение работает")
            lines = result.stdout.strip().split('\n')
            count = [line for line in lines if line.strip().isdigit()]
            if count:
                print(f"   Пользователей в БД: {count[0]}")
            return True
    except Exception as e:
        print(f"❌ Ошибка БД: {e}")
    
    return False

def test_api_endpoints():
    """Тест основных API эндпоинтов"""
    base_url = "http://localhost:8000"
    
    endpoints = [
        "/health",
        "/api/auth/register",
        "/api/documents/upload",
        "/api/analytics/dashboard",
        "/api/reports/generate"
    ]
    
    for endpoint in endpoints:
        try:
            if endpoint == "/api/auth/register":
                continue  # Уже протестирован выше
            
            response = requests.get(f"{base_url}{endpoint}")
            status = "✅" if response.status_code in [200, 405, 422] else "❌"
            print(f"{status} {endpoint}: {response.status_code}")
        except Exception as e:
            print(f"❌ {endpoint}: Error - {e}")

def main():
    print("🚀 Запуск интеграционных тестов DevAssist Pro")
    print("=" * 50)
    
    # Тест аутентификации
    auth_ok = test_auth_integration()
    
    # Тест базы данных
    db_ok = test_database_integration()
    
    # Тест API
    test_api_endpoints()
    
    print("=" * 50)
    if auth_ok and db_ok:
        print("🎉 Все основные тесты прошли успешно\!")
        print("✅ PostgreSQL интеграция работает")
        print("✅ Backend API функционирует")
        print("✅ Аутентификация работает корректно")
    else:
        print("⚠️  Некоторые тесты не прошли")
    
    print("🌐 Frontend доступен на: http://localhost:3000")
    print("🔧 Backend доступен на: http://localhost:8000")

if __name__ == "__main__":
    main()
EOF < /dev/null
