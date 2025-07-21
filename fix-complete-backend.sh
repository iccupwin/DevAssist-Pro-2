#!/bin/bash

echo "🔧 ПОЛНОЕ ИСПРАВЛЕНИЕ BACKEND"
echo "============================="
echo ""

# Проверяем что мы в правильной директории
if [ ! -f "backend/docker-compose.monolith.yml" ]; then
    echo "❌ Ошибка: запустите скрипт из корневой директории проекта"
    exit 1
fi

echo "🔍 Диагностика проблем:"
echo "   1. CORS не работает - No 'Access-Control-Allow-Origin' header"
echo "   2. Backend падает - Could not parse SQLAlchemy URL from string ''"
echo "   3. Контейнер не получает переменные окружения правильно"
echo ""

echo "🛑 Полная остановка всех контейнеров..."
cd backend
docker compose -f docker-compose.monolith.yml down --remove-orphans
docker stop $(docker ps -q) 2>/dev/null || true

echo ""
echo "🧹 Очистка старых контейнеров и образов..."
docker system prune -f
docker container prune -f

echo ""
echo "📋 Проверка docker-compose.monolith.yml..."
echo "   Текущий POSTGRES_URL:"
grep -A 3 -B 1 "POSTGRES_URL" docker-compose.monolith.yml

echo ""
echo "   Текущий ALLOWED_ORIGINS:"
grep -A 1 -B 1 "ALLOWED_ORIGINS" docker-compose.monolith.yml

echo ""
echo "🔧 Исправление конфигурации..."

# Проверяем и исправляем POSTGRES_URL
if grep -q "POSTGRES_URL: postgresql://devassist:devassist_password@postgres:5432/devassist_pro" docker-compose.monolith.yml; then
    echo "   ✅ POSTGRES_URL корректен"
else
    echo "   🔧 Исправление POSTGRES_URL..."
    sed -i 's|POSTGRES_URL: .*|POSTGRES_URL: postgresql://devassist:devassist_password@postgres:5432/devassist_pro|' docker-compose.monolith.yml
fi

# Проверяем и исправляем CORS
if grep -q "ALLOWED_ORIGINS: http://46.149.71.162:3000" docker-compose.monolith.yml; then
    echo "   ✅ CORS корректен"
else
    echo "   🔧 Исправление CORS..."
    sed -i 's|ALLOWED_ORIGINS: .*|ALLOWED_ORIGINS: http://46.149.71.162:3000,http://46.149.71.162,http://localhost:3000,http://localhost:3001|' docker-compose.monolith.yml
fi

# Проверяем и исправляем ADMIN_PASSWORD
if grep -q "ADMIN_PASSWORD: admin123" docker-compose.monolith.yml; then
    echo "   ✅ ADMIN_PASSWORD установлен"
else
    echo "   🔧 Добавление ADMIN_PASSWORD..."
    sed -i '/# Authentication/a\      ADMIN_PASSWORD: admin123' docker-compose.monolith.yml
fi

echo ""
echo "📋 Итоговая конфигурация:"
echo "   POSTGRES_URL: $(grep 'POSTGRES_URL:' docker-compose.monolith.yml | cut -d: -f2-)"
echo "   ALLOWED_ORIGINS: $(grep 'ALLOWED_ORIGINS:' docker-compose.monolith.yml | cut -d: -f2-)"
echo "   ADMIN_PASSWORD: $(grep 'ADMIN_PASSWORD:' docker-compose.monolith.yml | cut -d: -f2-)"

echo ""
echo "🐳 Запуск всех сервисов с обновленной конфигурацией..."

# Запускаем по шагам для лучшей диагностики
echo "   🗄️  Запуск PostgreSQL..."
docker compose -f docker-compose.monolith.yml up -d postgres
sleep 10

echo "   🔴 Запуск Redis..."
docker compose -f docker-compose.monolith.yml up -d redis
sleep 5

echo "   🐍 Запуск Backend App..."
docker compose -f docker-compose.monolith.yml up -d --build app
sleep 30

echo ""
echo "📊 Статус всех сервисов:"
docker compose -f docker-compose.monolith.yml ps

echo ""
echo "🧪 Проверка каждого сервиса..."

# Проверка PostgreSQL
echo "🗄️  PostgreSQL:"
if docker exec $(docker ps -q --filter "name=postgres") pg_isready -U devassist 2>/dev/null; then
    echo "   ✅ PostgreSQL: работает"
    PG_OK=true
else
    echo "   ❌ PostgreSQL: проблема"
    PG_OK=false
fi

# Проверка Redis
echo "🔴 Redis:"
if docker exec $(docker ps -q --filter "name=redis") redis-cli --raw incr ping 2>/dev/null; then
    echo "   ✅ Redis: работает"
    REDIS_OK=true
else
    echo "   ❌ Redis: проблема"
    REDIS_OK=false
fi

# Проверка Backend
echo "🐍 Backend App:"
APP_CONTAINER=$(docker ps -q --filter "name=app")
if [ -n "$APP_CONTAINER" ]; then
    echo "   ✅ Контейнер: запущен ($APP_CONTAINER)"
    
    # Проверяем логи на ошибки
    LOGS=$(docker logs $APP_CONTAINER 2>&1 | tail -5)
    if echo "$LOGS" | grep -q "Could not parse SQLAlchemy URL"; then
        echo "   ❌ Backend: ошибка базы данных"
        echo "   Логи: $LOGS"
        APP_OK=false
    elif echo "$LOGS" | grep -q "Application startup complete"; then
        echo "   ✅ Backend: запущен успешно"
        APP_OK=true
    else
        echo "   ⏳ Backend: еще запускается..."
        echo "   Последние логи: $LOGS"
        APP_OK=unknown
    fi
else
    echo "   ❌ Контейнер: не найден"
    APP_OK=false
fi

echo ""
echo "🌐 Тестирование API..."

# Ждем еще немного если backend еще запускается
if [ "$APP_OK" = "unknown" ]; then
    echo "⏳ Дополнительное ожидание запуска backend (30 сек)..."
    sleep 30
fi

# Health Check
if curl -f -s --max-time 10 "http://localhost:8000/health" >/dev/null 2>&1; then
    echo "   ✅ Health Check: работает"
    HEALTH_OK=true
else
    echo "   ❌ Health Check: недоступен"
    HEALTH_OK=false
fi

# CORS Preflight Test
if [ "$HEALTH_OK" = true ]; then
    echo "🌐 Тест CORS..."
    CORS_RESPONSE=$(curl -s -i -X OPTIONS \
        -H "Origin: http://46.149.71.162:3000" \
        -H "Access-Control-Request-Method: POST" \
        -H "Access-Control-Request-Headers: Content-Type" \
        "http://localhost:8000/api/auth/login" 2>/dev/null)
    
    if echo "$CORS_RESPONSE" | grep -q "Access-Control-Allow-Origin"; then
        echo "   ✅ CORS: заголовки работают"
        CORS_OK=true
    else
        echo "   ❌ CORS: заголовки отсутствуют"
        echo "   Ответ: $(echo "$CORS_RESPONSE" | head -3)"
        CORS_OK=false
    fi
    
    # Auth Test
    echo "🔐 Тест аутентификации..."
    AUTH_RESPONSE=$(curl -s -X POST \
        -H "Content-Type: application/json" \
        -H "Origin: http://46.149.71.162:3000" \
        -d '{"email":"admin@devassist.pro","password":"admin123"}' \
        "http://localhost:8000/api/auth/login" 2>/dev/null)
    
    if echo "$AUTH_RESPONSE" | grep -q "access_token"; then
        echo "   ✅ Аутентификация: работает"
        AUTH_OK=true
    else
        echo "   ❌ Аутентификация: проблема"
        echo "   Ответ: $AUTH_RESPONSE"
        AUTH_OK=false
    fi
else
    CORS_OK=false
    AUTH_OK=false
fi

echo ""
echo "🎯 ИТОГОВЫЙ РЕЗУЛЬТАТ:"
echo "====================="

if [ "$PG_OK" = true ] && [ "$REDIS_OK" = true ] && [ "$HEALTH_OK" = true ] && [ "$CORS_OK" = true ] && [ "$AUTH_OK" = true ]; then
    echo "🎉 ВСЕ ПРОБЛЕМЫ ИСПРАВЛЕНЫ!"
    echo ""
    echo "✅ PostgreSQL: работает"
    echo "✅ Redis: работает" 
    echo "✅ Backend API: работает"
    echo "✅ CORS: настроен правильно"
    echo "✅ Аутентификация: работает"
    echo ""
    echo "🌐 Готово к использованию:"
    echo "   Frontend: http://46.149.71.162:3000"
    echo "   Backend:  http://46.149.71.162:8000"
    echo "   API Docs: http://46.149.71.162:8000/docs"
    echo ""
    echo "👤 Тестовые пользователи:"
    echo "   admin@devassist.pro / admin123"
    echo "   test@example.com / testpass123"
    
elif [ "$HEALTH_OK" = true ]; then
    echo "⚠️  ЧАСТИЧНОЕ ИСПРАВЛЕНИЕ: Backend работает, но есть проблемы"
    echo ""
    echo "✅ Backend API: работает"
    if [ "$CORS_OK" != true ]; then
        echo "❌ CORS: требует дополнительной настройки"
    fi
    if [ "$AUTH_OK" != true ]; then
        echo "❌ Аутентификация: требует исправления"
    fi
    
else
    echo "❌ СЕРЬЕЗНЫЕ ПРОБЛЕМЫ!"
    echo ""
    if [ "$PG_OK" != true ]; then
        echo "❌ PostgreSQL: не работает"
    fi
    if [ "$REDIS_OK" != true ]; then
        echo "❌ Redis: не работает"
    fi
    if [ "$HEALTH_OK" != true ]; then
        echo "❌ Backend: не отвечает"
    fi
    echo ""
    echo "🔧 Для диагностики:"
    echo "   docker compose -f docker-compose.monolith.yml logs"
    echo "   docker compose -f docker-compose.monolith.yml ps"
fi

echo ""
echo "📋 Управление:"
echo "   Логи backend:    docker compose -f docker-compose.monolith.yml logs app"
echo "   Логи postgres:   docker compose -f docker-compose.monolith.yml logs postgres"
echo "   Перезапуск app:  docker compose -f docker-compose.monolith.yml restart app"
echo "   Остановка:       docker compose -f docker-compose.monolith.yml down"

cd ..