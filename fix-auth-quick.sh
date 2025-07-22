#!/bin/bash

echo "🔐 БЫСТРОЕ ИСПРАВЛЕНИЕ АУТЕНТИФИКАЦИИ"
echo "=================================="
echo ""

echo "🔍 Проверка логов backend для диагностики..."
BACKEND_LOGS=$(docker logs devassist_app_monolith 2>&1 | tail -10)
echo "📋 Последние 10 строк логов backend:"
echo "$BACKEND_LOGS"

echo ""
echo "🧪 Детальный тест аутентификации..."

# Тест 1: Проверяем админа
echo "👤 Тест 1: admin@devassist.pro / admin123"
AUTH_RESPONSE=$(curl -s -X POST \
    -H "Content-Type: application/json" \
    -H "Origin: http://46.149.71.162:3000" \
    -d '{"email":"admin@devassist.pro","password":"admin123"}' \
    "http://localhost:8000/api/auth/login" 2>/dev/null)

echo "   Полный ответ: $AUTH_RESPONSE"

if echo "$AUTH_RESPONSE" | grep -q '"success":true'; then
    echo "   ✅ Администратор: вход успешен"
else
    echo "   ❌ Администратор: ошибка входа"
    
    # Проверим есть ли ошибка с паролем
    if echo "$AUTH_RESPONSE" | grep -q "Неверный пароль"; then
        echo "   🔧 Проблема: неверный пароль"
        echo "   💡 Возможно админский пользователь создался с другим паролем"
    elif echo "$AUTH_RESPONSE" | grep -q "Пользователь не найден"; then
        echo "   🔧 Проблема: админский пользователь не существует"
        echo "   💡 Нужно пересоздать базу данных"
    elif echo "$AUTH_RESPONSE" | grep -q "Внутренняя ошибка"; then
        echo "   🔧 Проблема: внутренняя ошибка сервера"
        echo "   💡 Проверим логи для подробностей"
    fi
fi

echo ""
echo "🧪 Тест 2: Попробуем создать нового пользователя"
REG_RESPONSE=$(curl -s -X POST \
    -H "Content-Type: application/json" \
    -H "Origin: http://46.149.71.162:3000" \
    -d '{"email":"testuser@example.com","password":"testpass123","full_name":"Test User","company":"Test Company"}' \
    "http://localhost:8000/api/auth/register" 2>/dev/null)

echo "   Ответ регистрации: $REG_RESPONSE"

if echo "$REG_RESPONSE" | grep -q '"success":true'; then
    echo "   ✅ Регистрация: работает"
    
    echo ""
    echo "🧪 Тест 3: Вход с новым пользователем"
    LOGIN_NEW=$(curl -s -X POST \
        -H "Content-Type: application/json" \
        -H "Origin: http://46.149.71.162:3000" \
        -d '{"email":"testuser@example.com","password":"testpass123"}' \
        "http://localhost:8000/api/auth/login" 2>/dev/null)
    
    echo "   Ответ входа: $LOGIN_NEW"
    
    if echo "$LOGIN_NEW" | grep -q '"success":true'; then
        echo "   ✅ Новый пользователь: вход работает"
        echo "   💡 Аутентификация работает, проблема только с админом"
    else
        echo "   ❌ Новый пользователь: вход не работает"
    fi
else
    echo "   ❌ Регистрация: не работает"
fi

echo ""
echo "🔧 ПЛАН ИСПРАВЛЕНИЯ:"

if echo "$AUTH_RESPONSE" | grep -q "Неверный пароль"; then
    echo "1. Проблема с паролем админа - сбросим пароль"
    echo "2. Запустим команду сброса пароля в контейнере"
    
    echo ""
    echo "🔄 Сброс пароля администратора..."
    
    # Создаем временный скрипт сброса пароля
    cat > reset_admin_password.py << 'EOF'
import os, sys
sys.path.append('/app')
from shared.database import SessionLocal
from shared.models import User
import bcrypt

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def reset_admin_password():
    db = SessionLocal()
    try:
        admin = db.query(User).filter(User.email == "admin@devassist.pro").first()
        if admin:
            new_password = "admin123"
            admin.hashed_password = hash_password(new_password)
            db.commit()
            print(f"✅ Пароль администратора сброшен на: {new_password}")
        else:
            print("❌ Администратор не найден")
    except Exception as e:
        print(f"❌ Ошибка: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    reset_admin_password()
EOF
    
    echo "   📝 Скрипт сброса создан"
    echo "   🐳 Копируем в контейнер и выполняем..."
    
    docker cp reset_admin_password.py devassist_app_monolith:/tmp/
    docker exec devassist_app_monolith python /tmp/reset_admin_password.py
    
    echo ""
    echo "🧪 Повторный тест аутентификации..."
    AUTH_RESPONSE_2=$(curl -s -X POST \
        -H "Content-Type: application/json" \
        -H "Origin: http://46.149.71.162:3000" \
        -d '{"email":"admin@devassist.pro","password":"admin123"}' \
        "http://localhost:8000/api/auth/login" 2>/dev/null)
    
    echo "   Ответ: $AUTH_RESPONSE_2"
    
    if echo "$AUTH_RESPONSE_2" | grep -q '"success":true'; then
        echo "   🎉 УСПЕХ! Аутентификация исправлена!"
    else
        echo "   ❌ Все еще проблемы"
    fi
    
    rm reset_admin_password.py
    
elif echo "$AUTH_RESPONSE" | grep -q "Пользователь не найден"; then
    echo "1. Админский пользователь не создался"
    echo "2. Нужно пересоздать базу данных"
    echo ""
    echo "🔄 Пересоздание базы данных..."
    
    cd backend
    docker compose -f docker-compose.monolith.yml down -v
    docker compose -f docker-compose.monolith.yml up -d
    cd ..
    
else
    echo "1. Неизвестная ошибка"
    echo "2. Проверим подробные логи"
    echo ""
    echo "📋 Подробные логи backend:"
    docker logs devassist_app_monolith | tail -20
fi

echo ""
echo "✅ Диагностика завершена"