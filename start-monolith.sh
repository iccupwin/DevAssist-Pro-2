#!/bin/bash

echo "🚀 ЗАПУСК МОНОЛИТНОГО BACKEND"
echo "============================="
echo ""

# Проверяем что мы в правильной директории
if [ ! -f "backend/docker-compose.monolith.yml" ]; then
    echo "❌ Ошибка: запустите скрипт из корневой директории проекта"
    echo "   Должен быть файл: backend/docker-compose.monolith.yml"
    exit 1
fi

echo "📋 Информация:"
echo "   Compose файл: backend/docker-compose.monolith.yml"
echo "   Backend порт: 8000"
echo "   База данных: PostgreSQL (5432)"
echo "   Кеш: Redis (6379)"
echo ""

# Останавливаем старые процессы и контейнеры
echo "🛑 Остановка старых процессов..."
pkill -f "python.*app" 2>/dev/null || true
sudo fuser -k 8000/tcp 2>/dev/null || true

# Останавливаем возможные старые контейнеры
docker stop devassist_app_monolith devassist_postgres_monolith devassist_redis_monolith 2>/dev/null || true

echo ""
echo "🧹 Очистка старых контейнеров..."
docker compose -f backend/docker-compose.monolith.yml down --remove-orphans

echo ""
echo "📦 Обновление CORS конфигурации..."
# Обновляем CORS в compose файле для сервера
if grep -q "http://46.149.71.162:3000" backend/docker-compose.monolith.yml; then
    echo "   ✅ CORS уже настроен для сервера"
else
    echo "   🔧 Обновление CORS для IP сервера..."
    sed -i 's|ALLOWED_ORIGINS: .*|ALLOWED_ORIGINS: http://46.149.71.162:3000,http://46.149.71.162,http://localhost:3000|' backend/docker-compose.monolith.yml
fi

echo ""
echo "🐳 Запуск монолитного backend..."
cd backend

# Запускаем Docker Compose
docker compose -f docker-compose.monolith.yml up -d --build

echo ""
echo "⏳ Ожидание запуска сервисов (60 секунд)..."
sleep 60

echo ""
echo "📊 Статус контейнеров:"
docker compose -f docker-compose.monolith.yml ps

echo ""
echo "🧪 Проверка сервисов..."

# Проверка PostgreSQL
if docker exec devassist_postgres_monolith pg_isready -U devassist 2>/dev/null; then
    echo "   ✅ PostgreSQL: работает"
else
    echo "   ❌ PostgreSQL: недоступен"
fi

# Проверка Redis
if docker exec devassist_redis_monolith redis-cli --raw incr ping 2>/dev/null; then
    echo "   ✅ Redis: работает"
else
    echo "   ❌ Redis: недоступен"
fi

# Проверка Backend
if curl -f -s --max-time 10 "http://localhost:8000/health" >/dev/null 2>&1; then
    echo "   ✅ Backend: работает"
    BACKEND_OK=true
else
    echo "   ❌ Backend: недоступен"
    BACKEND_OK=false
fi

# Проверка с внешним IP
if curl -f -s --max-time 10 "http://46.149.71.162:8000/health" >/dev/null 2>&1; then
    echo "   ✅ Backend (внешний IP): работает"
    EXTERNAL_OK=true
else
    echo "   ❌ Backend (внешний IP): недоступен"
    EXTERNAL_OK=false
fi

echo ""
if [ "$BACKEND_OK" = true ]; then
    echo "🔐 Тест аутентификации..."
    
    # Тест логина
    LOGIN_RESPONSE=$(curl -s -X POST http://localhost:8000/api/auth/login \
        -H "Content-Type: application/json" \
        -H "Origin: http://46.149.71.162:3000" \
        -d '{"email":"admin@devassist.pro","password":"admin123"}' 2>/dev/null)
    
    if echo "$LOGIN_RESPONSE" | grep -q "access_token"; then
        echo "   ✅ Аутентификация: работает"
        AUTH_OK=true
    else
        echo "   ❌ Аутентификация: проблема"
        echo "   Ответ: $LOGIN_RESPONSE"
        AUTH_OK=false
    fi
else
    AUTH_OK=false
fi

echo ""
echo "🎯 РЕЗУЛЬТАТ:"
echo "============="

if [ "$BACKEND_OK" = true ] && [ "$AUTH_OK" = true ]; then
    echo "🎉 УСПЕШНЫЙ ЗАПУСК!"
    echo ""
    echo "🌐 URLs:"
    echo "   Backend API:    http://46.149.71.162:8000"
    echo "   API Docs:       http://46.149.71.162:8000/docs"
    echo "   Health Check:   http://46.149.71.162:8000/health"
    echo ""
    echo "👤 Тестовые пользователи:"
    echo "   admin@devassist.pro / admin123"
    echo "   test@example.com / testpass123"
    echo ""
    echo "📋 Команды управления:"
    echo "   Остановка:      cd backend && docker compose -f docker-compose.monolith.yml down"
    echo "   Перезапуск:     cd backend && docker compose -f docker-compose.monolith.yml restart"
    echo "   Логи:           cd backend && docker compose -f docker-compose.monolith.yml logs -f app"
    echo "   Статус:         cd backend && docker compose -f docker-compose.monolith.yml ps"
    
elif [ "$BACKEND_OK" = true ]; then
    echo "⚠️  ЧАСТИЧНЫЙ УСПЕХ: Backend работает, но есть проблемы с аутентификацией"
    echo ""
    echo "🔧 Для диагностики:"
    echo "   docker compose -f backend/docker-compose.monolith.yml logs app"
    
else
    echo "❌ ОШИБКА ЗАПУСКА!"
    echo ""
    echo "🔧 Для диагностики:"
    echo "   docker compose -f backend/docker-compose.monolith.yml logs"
    echo "   docker compose -f backend/docker-compose.monolith.yml ps"
fi

cd ..