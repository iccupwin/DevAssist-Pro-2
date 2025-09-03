#!/usr/bin/env python3
"""
Простой тест backend без зависимостей
"""
import os

# Устанавливаем переменные окружения
os.environ['DATABASE_AVAILABLE'] = 'false'
os.environ['ALLOWED_ORIGINS'] = 'http://localhost:3000,http://46.149.71.162:3000'

print("🧪 Тестирование базовых импортов...")

try:
    # Тестируем базовые импорты
    print("  - Импорт FastAPI...", end="")
    from fastapi import FastAPI
    print(" ✅")
    
    print("  - Импорт Pydantic...", end="")
    from pydantic import BaseModel
    print(" ✅")
    
    print("  - Импорт стандартных модулей...", end="")
    import json, time, hashlib, datetime
    print(" ✅")
    
    # Создаем простое приложение
    print("\n📦 Создание тестового приложения...")
    app = FastAPI(title="Test Backend")
    
    @app.get("/health")
    def health():
        return {"status": "healthy", "service": "test-backend"}
    
    @app.post("/api/auth/login")
    def login(data: dict):
        return {
            "success": True,
            "user": {"email": data.get("email"), "id": "1"},
            "token": "test_token_123",
            "access_token": "test_token_123"
        }
    
    print("✅ Приложение создано успешно!")
    print("\n🚀 Запуск сервера на порту 8000...")
    
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
    
except ImportError as e:
    print(f" ❌\n\nОшибка импорта: {e}")
    print("\nУстановите зависимости:")
    print("  pip install fastapi uvicorn pydantic")
except Exception as e:
    print(f"\n❌ Ошибка: {e}")