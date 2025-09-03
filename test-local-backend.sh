#!/bin/bash

echo "🧪 ЛОКАЛЬНОЕ ТЕСТИРОВАНИЕ BACKEND"
echo "================================="
echo ""

cd backend

echo "🛑 Остановка существующих контейнеров..."
docker compose -f docker-compose.monolith.yml down --remove-orphans 2>/dev/null || true

echo ""
echo "🔧 Тестирование с правильными переменными окружения..."

# Создаем временный docker-compose для тестирования
cat > docker-compose.test.yml << 'EOF'
services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: devassist_pro
      POSTGRES_USER: devassist
      POSTGRES_PASSWORD: devassist_password
    ports:
      - "5432:5432"
    volumes:
      - test_postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U devassist"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    command: redis-server --requirepass redis_password
    ports:
      - "6379:6379"
    volumes:
      - test_redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "--raw", "incr", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  app:
    build:
      context: .
      dockerfile: Dockerfile.monolith
    ports:
      - "8000:8000"
    environment:
      POSTGRES_URL: postgresql://devassist:devassist_password@postgres:5432/devassist_pro
      REDIS_URL: redis://:redis_password@redis:6379/0
      ALLOWED_ORIGINS: http://46.149.71.162:3000,http://46.149.71.162,http://localhost:3000,http://localhost:3001
      ADMIN_PASSWORD: admin123
      DEBUG: false
      ENVIRONMENT: production
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 10s
      timeout: 5s
      retries: 10

volumes:
  test_postgres_data:
  test_redis_data:
EOF

echo "📋 Тестовая конфигурация создана"
echo "   POSTGRES_URL: postgresql://devassist:devassist_password@postgres:5432/devassist_pro"
echo "   ALLOWED_ORIGINS: http://46.149.71.162:3000,http://46.149.71.162,http://localhost:3000,http://localhost:3001"
echo "   ADMIN_PASSWORD: admin123"

echo ""
echo "🚀 Запуск тестового backend..."
docker compose -f docker-compose.test.yml up -d --build

echo ""
echo "⏳ Ожидание запуска (60 секунд)..."
sleep 60

echo ""
echo "📊 Статус тестовых контейнеров:"
docker compose -f docker-compose.test.yml ps

echo ""
echo "🧪 Тестирование API..."

# Health Check
echo "🔍 Health Check:"
HEALTH_RESPONSE=$(curl -s --max-time 10 "http://localhost:8000/health" 2>/dev/null || echo "TIMEOUT")
if echo "$HEALTH_RESPONSE" | grep -q "status"; then
    echo "   ✅ Health Check: работает"
    echo "   Ответ: $HEALTH_RESPONSE"
    HEALTH_OK=true
else
    echo "   ❌ Health Check: недоступен"
    echo "   Ответ: $HEALTH_RESPONSE"
    HEALTH_OK=false
fi

echo ""
if [ "$HEALTH_OK" = true ]; then
    # CORS Preflight Test
    echo "🌐 CORS Preflight Test:"
    CORS_RESPONSE=$(curl -s -i -X OPTIONS \
        -H "Origin: http://46.149.71.162:3000" \
        -H "Access-Control-Request-Method: POST" \
        -H "Access-Control-Request-Headers: Content-Type" \
        "http://localhost:8000/api/auth/login" 2>/dev/null || echo "TIMEOUT")
    
    if echo "$CORS_RESPONSE" | grep -q "Access-Control-Allow-Origin"; then
        echo "   ✅ CORS Preflight: работает"
        echo "   Origin header: $(echo "$CORS_RESPONSE" | grep "Access-Control-Allow-Origin")"
        CORS_OK=true
    else
        echo "   ❌ CORS Preflight: отсутствует заголовок"
        echo "   Headers: $(echo "$CORS_RESPONSE" | head -10)"
        CORS_OK=false
    fi
    
    echo ""
    # Authentication Test
    echo "🔐 Authentication Test:"
    AUTH_RESPONSE=$(curl -s -X POST \
        -H "Content-Type: application/json" \
        -H "Origin: http://46.149.71.162:3000" \
        -d '{"email":"admin@devassist.pro","password":"admin123"}' \
        "http://localhost:8000/api/auth/login" 2>/dev/null || echo "TIMEOUT")
    
    if echo "$AUTH_RESPONSE" | grep -q '"success":true' && echo "$AUTH_RESPONSE" | grep -q '"token":'; then
        echo "   ✅ Authentication: работает"
        echo "   Token: $(echo "$AUTH_RESPONSE" | grep -o '"token":"[^"]*"' | head -c 30)..."
        AUTH_OK=true
    else
        echo "   ❌ Authentication: проблема"
        echo "   Ответ: $AUTH_RESPONSE"
        AUTH_OK=false
    fi
    
    echo ""
    # Registration Test
    echo "👤 Registration Test:"
    REG_RESPONSE=$(curl -s -X POST \
        -H "Content-Type: application/json" \
        -H "Origin: http://46.149.71.162:3000" \
        -d '{"email":"test@example.com","password":"testpass123","full_name":"Test User","company":"Test Co"}' \
        "http://localhost:8000/api/auth/register" 2>/dev/null || echo "TIMEOUT")
    
    if echo "$REG_RESPONSE" | grep -q '"success":true'; then
        echo "   ✅ Registration: работает"
        REG_OK=true
    else
        echo "   ❌ Registration: проблема"
        echo "   Ответ: $REG_RESPONSE"
        REG_OK=false
    fi
    
else
    CORS_OK=false
    AUTH_OK=false
    REG_OK=false
fi

echo ""
echo "📋 Логи для диагностики:"
if [ "$HEALTH_OK" != true ]; then
    echo "Backend logs:"
    docker compose -f docker-compose.test.yml logs app | tail -20
fi

echo ""
echo "🎯 РЕЗУЛЬТАТ ЛОКАЛЬНОГО ТЕСТИРОВАНИЯ:"
echo "==================================="

if [ "$HEALTH_OK" = true ] && [ "$CORS_OK" = true ] && [ "$AUTH_OK" = true ]; then
    echo "🎉 ВСЕ ТЕСТЫ ПРОШЛИ УСПЕШНО!"
    echo ""
    echo "✅ Health Check: работает"
    echo "✅ CORS: заголовки корректны"
    echo "✅ Authentication: работает"
    if [ "$REG_OK" = true ]; then
        echo "✅ Registration: работает"
    fi
    echo ""
    echo "🔧 Конфигурация готова для сервера!"
    TESTS_PASSED=true
    
elif [ "$HEALTH_OK" = true ]; then
    echo "⚠️  ЧАСТИЧНЫЙ УСПЕХ"
    echo ""
    echo "✅ Health Check: работает"
    if [ "$CORS_OK" != true ]; then
        echo "❌ CORS: требует исправления"
    fi
    if [ "$AUTH_OK" != true ]; then
        echo "❌ Authentication: требует исправления"
    fi
    TESTS_PASSED=false
    
else
    echo "❌ КРИТИЧЕСКИЕ ОШИБКИ!"
    echo ""
    echo "❌ Backend не запустился или недоступен"
    TESTS_PASSED=false
fi

echo ""
echo "🧹 Очистка тестовых контейнеров..."
docker compose -f docker-compose.test.yml down -v
rm docker-compose.test.yml

echo ""
if [ "$TESTS_PASSED" = true ]; then
    echo "✅ Локальные тесты прошли - готов создать скрипт для сервера"
else
    echo "❌ Нужны дополнительные исправления перед созданием скрипта"
fi

cd ..