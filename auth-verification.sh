#!/bin/bash

set -e

echo "🔐 ПРОВЕРКА АУТЕНТИФИКАЦИИ DevAssist Pro"
echo "========================================"

SERVER_IP="46.149.71.162"
FRONTEND_URL="http://$SERVER_IP:3000"
BACKEND_URL="http://$SERVER_IP:8000"

echo ""
echo "📊 Информация о системе:"
echo "  Server IP: $SERVER_IP"
echo "  Frontend: $FRONTEND_URL"
echo "  Backend:  $BACKEND_URL"

echo ""
echo "🔧 1. Проверка доступности сервисов..."

# Проверка frontend
echo -n "  Frontend (port 3000): "
if curl -f -s --max-time 5 "$FRONTEND_URL" >/dev/null 2>&1; then
    echo "✅ Доступен"
    FRONTEND_OK=true
else
    echo "❌ Недоступен"
    FRONTEND_OK=false
fi

# Проверка backend API Gateway
echo -n "  Backend API Gateway (port 8000): "
if curl -f -s --max-time 5 "$BACKEND_URL/health" >/dev/null 2>&1; then
    echo "✅ Доступен"
    BACKEND_OK=true
else
    echo "❌ Недоступен"
    BACKEND_OK=false
fi

# Проверка Auth Module в монолите
echo -n "  Auth Module (в составе backend): "
if curl -f -s --max-time 5 "$BACKEND_URL/api/auth/login" -X OPTIONS >/dev/null 2>&1; then
    echo "✅ Доступен"
    AUTH_SERVICE_OK=true
else
    echo "⚠️  Частично доступен (проверка через backend)"
    AUTH_SERVICE_OK=$BACKEND_OK
fi

echo ""
echo "🌐 2. Проверка CORS конфигурации..."

# Тест CORS через preflight запрос
echo -n "  CORS Preflight Test: "
CORS_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" \
    -H "Origin: $FRONTEND_URL" \
    -H "Access-Control-Request-Method: POST" \
    -H "Access-Control-Request-Headers: Content-Type,Authorization" \
    -X OPTIONS \
    "$BACKEND_URL/api/auth/login" 2>/dev/null || echo "000")

if [ "$CORS_RESPONSE" = "200" ] || [ "$CORS_RESPONSE" = "204" ]; then
    echo "✅ CORS настроен правильно (HTTP $CORS_RESPONSE)"
    CORS_OK=true
else
    echo "❌ CORS ошибка (HTTP $CORS_RESPONSE)"
    CORS_OK=false
fi

echo ""
echo "🔑 3. Тест аутентификации..."

# Тест регистрации
echo "  Тестирование регистрации..."
REGISTER_DATA='{"email":"test@example.com","password":"testpass123","username":"testuser","full_name":"Test User"}'
REGISTER_RESPONSE=$(curl -s -w "HTTPSTATUS:%{http_code}" \
    -H "Content-Type: application/json" \
    -H "Origin: $FRONTEND_URL" \
    -d "$REGISTER_DATA" \
    -X POST "$BACKEND_URL/api/auth/register" 2>/dev/null || echo "HTTPSTATUS:000")

REGISTER_HTTP_CODE=$(echo "$REGISTER_RESPONSE" | grep -o "HTTPSTATUS:[0-9]*" | cut -d: -f2)
REGISTER_BODY=$(echo "$REGISTER_RESPONSE" | sed -E 's/HTTPSTATUS:[0-9]*$//')

echo -n "    Registration Test: "
if [ "$REGISTER_HTTP_CODE" = "201" ] || [ "$REGISTER_HTTP_CODE" = "200" ]; then
    echo "✅ Успешно (HTTP $REGISTER_HTTP_CODE)"
    REGISTER_OK=true
elif [ "$REGISTER_HTTP_CODE" = "409" ]; then
    echo "⚠️  Пользователь уже существует (HTTP $REGISTER_HTTP_CODE)"
    REGISTER_OK=true
else
    echo "❌ Ошибка (HTTP $REGISTER_HTTP_CODE)"
    echo "    Response: $REGISTER_BODY"
    REGISTER_OK=false
fi

# Тест логина
echo "  Тестирование входа..."
LOGIN_DATA='{"email":"test@example.com","password":"testpass123"}'
LOGIN_RESPONSE=$(curl -s -w "HTTPSTATUS:%{http_code}" \
    -H "Content-Type: application/json" \
    -H "Origin: $FRONTEND_URL" \
    -d "$LOGIN_DATA" \
    -X POST "$BACKEND_URL/api/auth/login" 2>/dev/null || echo "HTTPSTATUS:000")

LOGIN_HTTP_CODE=$(echo "$LOGIN_RESPONSE" | grep -o "HTTPSTATUS:[0-9]*" | cut -d: -f2)
LOGIN_BODY=$(echo "$LOGIN_RESPONSE" | sed -E 's/HTTPSTATUS:[0-9]*$//')

echo -n "    Login Test: "
if [ "$LOGIN_HTTP_CODE" = "200" ]; then
    echo "✅ Успешно (HTTP $LOGIN_HTTP_CODE)"
    LOGIN_OK=true
    
    # Извлекаем токен
    ACCESS_TOKEN=$(echo "$LOGIN_BODY" | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)
    if [ -n "$ACCESS_TOKEN" ]; then
        echo "    ✅ JWT токен получен"
        TOKEN_OK=true
    else
        echo "    ❌ JWT токен не найден"
        TOKEN_OK=false
    fi
else
    echo "❌ Ошибка (HTTP $LOGIN_HTTP_CODE)"
    echo "    Response: $LOGIN_BODY"
    LOGIN_OK=false
    TOKEN_OK=false
fi

echo ""
echo "🧪 4. Тест авторизованных запросов..."

if [ "$TOKEN_OK" = true ]; then
    # Тест защищенного эндпоинта
    echo -n "  Protected Endpoint Test: "
    PROTECTED_RESPONSE=$(curl -s -w "HTTPSTATUS:%{http_code}" \
        -H "Authorization: Bearer $ACCESS_TOKEN" \
        -H "Origin: $FRONTEND_URL" \
        -X GET "$BACKEND_URL/api/auth/me" 2>/dev/null || echo "HTTPSTATUS:000")
    
    PROTECTED_HTTP_CODE=$(echo "$PROTECTED_RESPONSE" | grep -o "HTTPSTATUS:[0-9]*" | cut -d: -f2)
    
    if [ "$PROTECTED_HTTP_CODE" = "200" ]; then
        echo "✅ Авторизация работает (HTTP $PROTECTED_HTTP_CODE)"
        PROTECTED_OK=true
    else
        echo "❌ Ошибка авторизации (HTTP $PROTECTED_HTTP_CODE)"
        PROTECTED_OK=false
    fi
else
    echo "  ❌ Пропущено (нет токена)"
    PROTECTED_OK=false
fi

echo ""
echo "📋 РЕЗУЛЬТАТЫ ПРОВЕРКИ:"
echo "======================"

# Подсчет успешных тестов
TOTAL_TESTS=7
PASSED_TESTS=0

[ "$FRONTEND_OK" = true ] && ((PASSED_TESTS++))
[ "$BACKEND_OK" = true ] && ((PASSED_TESTS++))
[ "$AUTH_SERVICE_OK" = true ] && ((PASSED_TESTS++))
[ "$CORS_OK" = true ] && ((PASSED_TESTS++))
[ "$REGISTER_OK" = true ] && ((PASSED_TESTS++))
[ "$LOGIN_OK" = true ] && ((PASSED_TESTS++))
[ "$PROTECTED_OK" = true ] && ((PASSED_TESTS++))

echo "Пройдено тестов: $PASSED_TESTS/$TOTAL_TESTS"
echo ""

[ "$FRONTEND_OK" = true ] && echo "✅ Frontend доступен" || echo "❌ Frontend недоступен"
[ "$BACKEND_OK" = true ] && echo "✅ Backend доступен" || echo "❌ Backend недоступен"
[ "$AUTH_SERVICE_OK" = true ] && echo "✅ Auth Service работает" || echo "❌ Auth Service не работает"
[ "$CORS_OK" = true ] && echo "✅ CORS настроен правильно" || echo "❌ CORS настроен неправильно"
[ "$REGISTER_OK" = true ] && echo "✅ Регистрация работает" || echo "❌ Регистрация не работает"
[ "$LOGIN_OK" = true ] && echo "✅ Вход работает" || echo "❌ Вход не работает"
[ "$PROTECTED_OK" = true ] && echo "✅ Авторизация работает" || echo "❌ Авторизация не работает"

echo ""
if [ "$PASSED_TESTS" -eq "$TOTAL_TESTS" ]; then
    echo "🎉 ВСЕ ТЕСТЫ ПРОЙДЕНЫ! Аутентификация работает корректно."
    echo ""
    echo "🌐 Можете использовать приложение:"
    echo "   Frontend: $FRONTEND_URL"
    echo "   Backend API: $BACKEND_URL"
    exit 0
elif [ "$PASSED_TESTS" -ge 5 ]; then
    echo "⚠️  ЧАСТИЧНО РАБОТАЕТ. Некоторые функции могут быть недоступны."
    exit 1
else
    echo "🚨 КРИТИЧЕСКИЕ ОШИБКИ! Аутентификация не работает."
    echo ""
    echo "🔧 Рекомендации:"
    [ "$FRONTEND_OK" = false ] && echo "   - Запустите frontend: docker-compose up -d frontend"
    [ "$BACKEND_OK" = false ] && echo "   - Запустите backend: docker-compose up -d api-gateway"
    [ "$AUTH_SERVICE_OK" = false ] && echo "   - Запустите auth service: docker-compose up -d auth-service"
    [ "$CORS_OK" = false ] && echo "   - Проверьте CORS настройки в .env.production"
    [ "$REGISTER_OK" = false ] && echo "   - Проверьте auth service логи"
    [ "$LOGIN_OK" = false ] && echo "   - Проверьте базу данных и auth service"
    exit 2
fi