#!/bin/bash

echo "🎯 ФИНАЛЬНОЕ ИСПРАВЛЕНИЕ СЕРВЕРА"
echo "================================"
echo ""
echo "🔧 Применяем все исправления, протестированные локально:"
echo "   ✅ CORS для IP 46.149.71.162:3000"
echo "   ✅ Правильная конфигурация базы данных"  
echo "   ✅ Исправленная аутентификация"
echo "   ✅ Health checks и зависимости"
echo ""

# Проверяем что мы в правильной директории
if [ ! -f "backend/docker-compose.monolith.yml" ]; then
    echo "❌ Ошибка: запустите скрипт из корневой директории проекта"
    exit 1
fi

echo "🛑 Полная остановка существующих контейнеров..."
cd backend
docker compose -f docker-compose.monolith.yml down --remove-orphans 2>/dev/null || true
docker stop $(docker ps -q) 2>/dev/null || true

echo ""
echo "🧹 Очистка для чистого старта..."
docker system prune -f
docker container prune -f

echo ""
echo "🔧 Проверка конфигурации docker-compose.monolith.yml..."

# Проверяем все критичные настройки
echo "📋 Текущие настройки:"
echo "   POSTGRES_URL: $(grep 'POSTGRES_URL:' docker-compose.monolith.yml | cut -d: -f2-)"
echo "   ALLOWED_ORIGINS: $(grep 'ALLOWED_ORIGINS:' docker-compose.monolith.yml | cut -d: -f2-)"
echo "   ADMIN_PASSWORD: $(grep 'ADMIN_PASSWORD:' docker-compose.monolith.yml | cut -d: -f2-)"

# Проверяем и исправляем POSTGRES_URL
if grep -q "POSTGRES_URL: postgresql://devassist:devassist_password@postgres:5432/devassist_pro" docker-compose.monolith.yml; then
    echo "   ✅ POSTGRES_URL корректен"
else
    echo "   🔧 Исправление POSTGRES_URL..."
    sed -i 's|POSTGRES_URL: .*|POSTGRES_URL: postgresql://devassist:devassist_password@postgres:5432/devassist_pro|' docker-compose.monolith.yml
fi

# Проверяем и исправляем CORS для сервера
if grep -q "http://46.149.71.162:3000" docker-compose.monolith.yml; then
    echo "   ✅ CORS настроен для сервера"
else
    echo "   🔧 Настройка CORS для сервера..."
    sed -i 's|ALLOWED_ORIGINS: .*|ALLOWED_ORIGINS: http://46.149.71.162:3000,http://46.149.71.162,http://localhost:3000,http://localhost:3001|' docker-compose.monolith.yml
fi

# Проверяем и добавляем ADMIN_PASSWORD
if grep -q "ADMIN_PASSWORD: admin123" docker-compose.monolith.yml; then
    echo "   ✅ ADMIN_PASSWORD установлен"
else
    echo "   🔧 Добавление ADMIN_PASSWORD..."
    # Находим строку с # Authentication и добавляем после неё
    sed -i '/# Authentication/a\      ADMIN_PASSWORD: admin123' docker-compose.monolith.yml
fi

# Проверяем health checks
if grep -q "condition: service_healthy" docker-compose.monolith.yml; then
    echo "   ✅ Health checks уже настроены"
else
    echo "   🔧 Добавление health checks..."
    # Это более сложная замена, сделаем её безопасно
    cp docker-compose.monolith.yml docker-compose.monolith.yml.backup
    
    # Добавляем health checks к PostgreSQL
    sed -i '/- "5432:5432"/a\    healthcheck:\n      test: ["CMD-SHELL", "pg_isready -U devassist"]\n      interval: 30s\n      timeout: 10s\n      retries: 3' docker-compose.monolith.yml
    
    # Добавляем health checks к Redis  
    sed -i '/- "6379:6379"/a\    healthcheck:\n      test: ["CMD", "redis-cli", "--raw", "incr", "ping"]\n      interval: 30s\n      timeout: 10s\n      retries: 3' docker-compose.monolith.yml
    
    # Обновляем depends_on в app сервисе
    sed -i 's|depends_on:|depends_on:\n      postgres:\n        condition: service_healthy\n      redis:\n        condition: service_healthy|' docker-compose.monolith.yml
    sed -i '/postgres:/,+1d' docker-compose.monolith.yml  # Удаляем старую строку postgres:
    sed -i '/redis:/,+1d' docker-compose.monolith.yml     # Удаляем старую строку redis:
fi

echo ""
echo "📋 Итоговая конфигурация:"
grep -A 2 -B 1 "POSTGRES_URL\|ALLOWED_ORIGINS\|ADMIN_PASSWORD" docker-compose.monolith.yml

echo ""
echo "🚀 Запуск исправленного монолитного backend..."

# Запускаем поэтапно для лучшего контроля
echo "   🗄️  Запуск PostgreSQL..."
docker compose -f docker-compose.monolith.yml up -d postgres
sleep 15

echo "   🔴 Запуск Redis..."
docker compose -f docker-compose.monolith.yml up -d redis  
sleep 10

echo "   🐍 Сборка и запуск Backend..."
docker compose -f docker-compose.monolith.yml up -d --build app
sleep 45

echo ""
echo "📊 Статус всех сервисов:"
docker compose -f docker-compose.monolith.yml ps

echo ""
echo "🧪 Комплексная проверка..."

# Проверка каждого сервиса
echo "🗄️  PostgreSQL:"
PG_CONTAINER=$(docker ps -q --filter "name=postgres")
if [ -n "$PG_CONTAINER" ] && docker exec $PG_CONTAINER pg_isready -U devassist 2>/dev/null; then
    echo "   ✅ PostgreSQL: работает и принимает соединения"
    PG_OK=true
else
    echo "   ❌ PostgreSQL: проблема"
    PG_OK=false
fi

echo "🔴 Redis:"
REDIS_CONTAINER=$(docker ps -q --filter "name=redis")
if [ -n "$REDIS_CONTAINER" ] && docker exec $REDIS_CONTAINER redis-cli --raw incr ping 2>/dev/null; then
    echo "   ✅ Redis: работает"
    REDIS_OK=true
else
    echo "   ❌ Redis: проблема"
    REDIS_OK=false
fi

echo "🐍 Backend Application:"
APP_CONTAINER=$(docker ps -q --filter "name=app")
if [ -n "$APP_CONTAINER" ]; then
    echo "   ✅ Контейнер: запущен ($APP_CONTAINER)"
    
    # Проверяем логи на ошибки
    APP_LOGS=$(docker logs $APP_CONTAINER 2>&1 | tail -10)
    if echo "$APP_LOGS" | grep -q "Application startup complete"; then
        echo "   ✅ Backend: запущен успешно"
        APP_STARTED=true
    elif echo "$APP_LOGS" | grep -q "Could not parse SQLAlchemy URL\|КРИТИЧЕСКАЯ ОШИБКА"; then
        echo "   ❌ Backend: ошибки при запуске"
        echo "   Последние логи: $(echo "$APP_LOGS" | tail -3)"
        APP_STARTED=false
    else
        echo "   ⏳ Backend: запускается..."
        APP_STARTED=unknown
    fi
else
    echo "   ❌ Контейнер: не запущен"
    APP_STARTED=false
fi

# Дополнительное ожидание если backend еще запускается
if [ "$APP_STARTED" = "unknown" ]; then
    echo ""
    echo "⏳ Дополнительное ожидание запуска backend (30 сек)..."
    sleep 30
fi

echo ""
echo "🌐 Тестирование API Endpoints..."

# Health Check
HEALTH_RESPONSE=$(curl -s --max-time 10 "http://localhost:8000/health" 2>/dev/null || echo "TIMEOUT")
if echo "$HEALTH_RESPONSE" | grep -q "status.*healthy"; then
    echo "   ✅ Health Check: работает"
    echo "      $(echo "$HEALTH_RESPONSE" | cut -c1-60)..."
    HEALTH_OK=true
else
    echo "   ❌ Health Check: недоступен"
    echo "      Ответ: $HEALTH_RESPONSE"
    HEALTH_OK=false
fi

if [ "$HEALTH_OK" = true ]; then
    # CORS Test
    echo "🌐 CORS Test:"
    CORS_RESPONSE=$(curl -s -i -X OPTIONS \
        -H "Origin: http://46.149.71.162:3000" \
        -H "Access-Control-Request-Method: POST" \
        -H "Access-Control-Request-Headers: Content-Type" \
        "http://localhost:8000/api/auth/login" 2>/dev/null || echo "TIMEOUT")
    
    if echo "$CORS_RESPONSE" | grep -qi "access-control-allow-origin.*46.149.71.162"; then
        echo "   ✅ CORS: заголовки настроены правильно"
        CORS_OK=true
    else
        echo "   ❌ CORS: проблема с заголовками"
        echo "      Headers: $(echo "$CORS_RESPONSE" | grep -i "access-control" | head -2)"
        CORS_OK=false
    fi
    
    # Authentication Test
    echo "🔐 Authentication Test:"
    AUTH_RESPONSE=$(curl -s -X POST \
        -H "Content-Type: application/json" \
        -H "Origin: http://46.149.71.162:3000" \
        -d '{"email":"admin@devassist.pro","password":"admin123"}' \
        "http://localhost:8000/api/auth/login" 2>/dev/null || echo "TIMEOUT")
    
    if echo "$AUTH_RESPONSE" | grep -q '"success":true' && echo "$AUTH_RESPONSE" | grep -q '"token":'; then
        echo "   ✅ Authentication: работает"
        echo "      Пользователь: admin@devassist.pro"
        echo "      Токен получен: $(echo "$AUTH_RESPONSE" | grep -o '"token":"[^"]*"' | head -c 25)..."
        AUTH_OK=true
    else
        echo "   ❌ Authentication: проблема"
        echo "      Ответ: $(echo "$AUTH_RESPONSE" | head -c 100)..."
        AUTH_OK=false
    fi
    
    # External Access Test
    echo "🌍 External Access Test:"
    EXT_RESPONSE=$(curl -s --max-time 10 "http://46.149.71.162:8000/health" 2>/dev/null || echo "TIMEOUT")
    if echo "$EXT_RESPONSE" | grep -q "status.*healthy"; then
        echo "   ✅ Внешний доступ: работает"
        EXT_OK=true
    else
        echo "   ❌ Внешний доступ: недоступен"
        EXT_OK=false
    fi
    
else
    CORS_OK=false
    AUTH_OK=false
    EXT_OK=false
fi

echo ""
echo "🎯 ИТОГОВЫЙ РЕЗУЛЬТАТ:"
echo "====================="

if [ "$PG_OK" = true ] && [ "$REDIS_OK" = true ] && [ "$HEALTH_OK" = true ] && [ "$CORS_OK" = true ] && [ "$AUTH_OK" = true ] && [ "$EXT_OK" = true ]; then
    echo "🎉 ПОЛНЫЙ УСПЕХ! ВСЕ РАБОТАЕТ!"
    echo ""
    echo "✅ PostgreSQL: подключен и работает"
    echo "✅ Redis: подключен и работает"
    echo "✅ Backend: запущен и здоров"
    echo "✅ CORS: настроен для frontend"
    echo "✅ Authentication: полностью работает"
    echo "✅ Внешний доступ: доступен"
    echo ""
    echo "🌐 ГОТОВО К ИСПОЛЬЗОВАНИЮ:"
    echo "   Frontend:     http://46.149.71.162:3000"
    echo "   Backend API:  http://46.149.71.162:8000"
    echo "   API Docs:     http://46.149.71.162:8000/docs"
    echo "   Health Check: http://46.149.71.162:8000/health"
    echo ""
    echo "👤 Учетные данные для входа:"
    echo "   Email:    admin@devassist.pro"
    echo "   Password: admin123"
    echo ""
    echo "🎊 FRONTEND ТЕПЕРЬ СМОЖЕТ:"
    echo "   • Регистрировать новых пользователей"
    echo "   • Авторизовывать существующих пользователей"
    echo "   • Делать все API запросы без CORS ошибок"
    echo "   • Использовать полную функциональность приложения"
    
elif [ "$HEALTH_OK" = true ]; then
    echo "⚠️  ЧАСТИЧНЫЙ УСПЕХ: Backend работает, но есть проблемы"
    echo ""
    echo "✅ Backend API: работает"
    if [ "$CORS_OK" != true ]; then
        echo "❌ CORS: требует дополнительной настройки"
    fi
    if [ "$AUTH_OK" != true ]; then
        echo "❌ Authentication: проблемы с входом"
    fi
    if [ "$EXT_OK" != true ]; then
        echo "❌ Внешний доступ: недоступен извне"
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
    echo "🔧 Для диагностики проблем:"
    echo "   docker compose -f docker-compose.monolith.yml logs"
    echo "   docker compose -f docker-compose.monolith.yml logs app | tail -30"
    echo "   docker compose -f docker-compose.monolith.yml ps"
fi

echo ""
echo "📋 УПРАВЛЕНИЕ СЕРВЕРОМ:"
echo "   Логи всех сервисов: docker compose -f docker-compose.monolith.yml logs"
echo "   Логи backend:       docker compose -f docker-compose.monolith.yml logs app"
echo "   Перезапуск:         docker compose -f docker-compose.monolith.yml restart"
echo "   Остановка:          docker compose -f docker-compose.monolith.yml down"
echo "   Статус:             docker compose -f docker-compose.monolith.yml ps"

cd ..