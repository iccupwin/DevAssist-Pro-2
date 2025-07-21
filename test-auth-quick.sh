#!/bin/bash

echo "🧪 БЫСТРЫЙ ТЕСТ АУТЕНТИФИКАЦИИ"
echo "==============================="

SERVER_IP="46.149.71.162"
BACKEND_URL="http://$SERVER_IP:8000"

echo "📍 Тестируем: $BACKEND_URL"
echo ""

# Проверка доступности backend
echo "1️⃣ Проверка backend..."
if curl -f -s --max-time 5 "$BACKEND_URL/health" >/dev/null 2>&1; then
    echo "   ✅ Backend доступен"
else
    echo "   ❌ Backend недоступен"
    exit 1
fi

# Тест CORS
echo ""
echo "2️⃣ Тест CORS..."
CORS_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" \
    -H "Origin: http://$SERVER_IP:3000" \
    -H "Access-Control-Request-Method: POST" \
    -H "Access-Control-Request-Headers: Content-Type,Authorization" \
    -X OPTIONS \
    "$BACKEND_URL/api/auth/login" 2>/dev/null || echo "000")

if [ "$CORS_RESPONSE" = "200" ] || [ "$CORS_RESPONSE" = "204" ]; then
    echo "   ✅ CORS работает (HTTP $CORS_RESPONSE)"
else
    echo "   ❌ CORS проблема (HTTP $CORS_RESPONSE)"
fi

# Тест регистрации
echo ""
echo "3️⃣ Тест регистрации..."
REGISTER_DATA='{"email":"test@example.com","password":"testpass123","full_name":"Test User","company":"Test Company"}'
REGISTER_RESPONSE=$(curl -s -w "HTTPSTATUS:%{http_code}" \
    -H "Content-Type: application/json" \
    -H "Origin: http://$SERVER_IP:3000" \
    -d "$REGISTER_DATA" \
    -X POST "$BACKEND_URL/api/auth/register" 2>/dev/null || echo "HTTPSTATUS:000")

REGISTER_HTTP_CODE=$(echo "$REGISTER_RESPONSE" | grep -o "HTTPSTATUS:[0-9]*" | cut -d: -f2)
REGISTER_BODY=$(echo "$REGISTER_RESPONSE" | sed -E 's/HTTPSTATUS:[0-9]*$//')

if [ "$REGISTER_HTTP_CODE" = "200" ] || [ "$REGISTER_HTTP_CODE" = "201" ]; then
    echo "   ✅ Регистрация работает (HTTP $REGISTER_HTTP_CODE)"
elif [ "$REGISTER_HTTP_CODE" = "409" ]; then
    echo "   ⚠️  Пользователь уже существует (HTTP $REGISTER_HTTP_CODE)"
else
    echo "   ❌ Регистрация не работает (HTTP $REGISTER_HTTP_CODE)"
    echo "   Ответ: $REGISTER_BODY"
fi

# Тест логина  
echo ""
echo "4️⃣ Тест логина..."
LOGIN_DATA='{"email":"test@example.com","password":"testpass123"}'
LOGIN_RESPONSE=$(curl -s -w "HTTPSTATUS:%{http_code}" \
    -H "Content-Type: application/json" \
    -H "Origin: http://$SERVER_IP:3000" \
    -d "$LOGIN_DATA" \
    -X POST "$BACKEND_URL/api/auth/login" 2>/dev/null || echo "HTTPSTATUS:000")

LOGIN_HTTP_CODE=$(echo "$LOGIN_RESPONSE" | grep -o "HTTPSTATUS:[0-9]*" | cut -d: -f2)
LOGIN_BODY=$(echo "$LOGIN_RESPONSE" | sed -E 's/HTTPSTATUS:[0-9]*$//')

if [ "$LOGIN_HTTP_CODE" = "200" ]; then
    echo "   ✅ Логин работает (HTTP $LOGIN_HTTP_CODE)"
    
    # Проверяем формат ответа
    echo ""
    echo "5️⃣ Анализ ответа логина..."
    echo "   Полный ответ: $LOGIN_BODY"
    
    # Проверяем наличие access_token
    if echo "$LOGIN_BODY" | grep -q '"access_token"'; then
        ACCESS_TOKEN=$(echo "$LOGIN_BODY" | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)
        echo "   ✅ access_token найден: ${ACCESS_TOKEN:0:20}..."
    else
        echo "   ❌ access_token НЕ найден"
    fi
    
    # Проверяем наличие token (старый формат)
    if echo "$LOGIN_BODY" | grep -q '"token"'; then
        TOKEN=$(echo "$LOGIN_BODY" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
        echo "   ✅ token найден: ${TOKEN:0:20}..."
    else
        echo "   ❌ token НЕ найден"
    fi
    
    # Проверяем наличие user
    if echo "$LOGIN_BODY" | grep -q '"user"'; then
        echo "   ✅ user object найден"
    else
        echo "   ❌ user object НЕ найден"
    fi
    
else
    echo "   ❌ Логин не работает (HTTP $LOGIN_HTTP_CODE)"
    echo "   Ответ: $LOGIN_BODY"
fi

echo ""
echo "🎯 ЗАКЛЮЧЕНИЕ:"
echo "=============="

# Проверяем что backend изменения применились
echo ""
echo "🔄 Проверка что исправления применились..."
if curl -s "$BACKEND_URL/api/auth/login" -X POST \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"testpass123"}' | grep -q "access_token"; then
    echo "✅ Исправления backend применились!"
    echo "✅ Аутентификация должна работать!"
    echo ""
    echo "🌐 Попробуйте теперь:"
    echo "   Frontend: http://$SERVER_IP:3000"
    echo "   Логин/регистрация должны работать корректно"
else
    echo "❌ Исправления backend НЕ применились"
    echo "🔧 Нужно перезапустить backend с обновленным кодом"
    echo ""
    echo "Команды для исправления:"
    echo "   docker compose restart"
    echo "   или: ./quick-restart.sh"
fi