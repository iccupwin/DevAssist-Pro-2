#!/bin/bash

echo "🔐 Тестирование авторизации DevAssist Pro"
echo "============================================"

# Тестовые данные
EMAIL="testuser$(date +%s)@example.com"
PASSWORD="test123"
FULL_NAME="Test User $(date +%H%M)"

echo "📝 Тестовые данные:"
echo "   Email: $EMAIL"
echo "   Password: $PASSWORD" 
echo "   Full Name: $FULL_NAME"
echo ""

# Тестируем регистрацию
echo "1️⃣ Тестируем регистрацию..."
REGISTER_RESULT=$(curl -s -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\",\"full_name\":\"$FULL_NAME\"}")

echo "Ответ backend: $REGISTER_RESULT"

# Извлекаем успех и токен
SUCCESS=$(echo $REGISTER_RESULT | grep -o '"success":[^,]*' | cut -d':' -f2)
TOKEN=$(echo $REGISTER_RESULT | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

if [[ "$SUCCESS" == "true" ]]; then
    echo "✅ Регистрация успешна! Token: $TOKEN"
    
    # Тестируем вход
    echo ""
    echo "2️⃣ Тестируем вход..."
    LOGIN_RESULT=$(curl -s -X POST http://localhost:8000/api/auth/login \
      -H "Content-Type: application/json" \
      -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")
    
    echo "Ответ backend: $LOGIN_RESULT"
    
    LOGIN_SUCCESS=$(echo $LOGIN_RESULT | grep -o '"success":[^,]*' | cut -d':' -f2)
    LOGIN_TOKEN=$(echo $LOGIN_RESULT | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
    
    if [[ "$LOGIN_SUCCESS" == "true" ]]; then
        echo "✅ Вход успешен! Token: $LOGIN_TOKEN"
        
        # Тестируем получение профиля
        echo ""
        echo "3️⃣ Тестируем получение профиля..."
        PROFILE_RESULT=$(curl -s -X GET http://localhost:8000/api/auth/me \
          -H "Authorization: Bearer $LOGIN_TOKEN")
        
        echo "Ответ backend: $PROFILE_RESULT"
        
        if echo "$PROFILE_RESULT" | grep -q "\"email\":\"$EMAIL\""; then
            echo "✅ Профиль получен успешно!"
        else
            echo "❌ Ошибка получения профиля"
        fi
        
        # Тестируем выход
        echo ""
        echo "4️⃣ Тестируем выход..."
        LOGOUT_RESULT=$(curl -s -X POST http://localhost:8000/api/auth/logout \
          -H "Authorization: Bearer $LOGIN_TOKEN")
        
        echo "Ответ backend: $LOGOUT_RESULT"
        echo "✅ Выход выполнен"
        
    else
        echo "❌ Ошибка входа: $LOGIN_RESULT"
    fi
else
    echo "❌ Ошибка регистрации: $REGISTER_RESULT"
fi

echo ""
echo "🏁 Тестирование завершено!"