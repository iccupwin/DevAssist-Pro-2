#!/bin/bash

echo "📊 СТАТУС МОНОЛИТНОГО BACKEND"
echo "============================="
echo ""

# Проверяем что мы в правильной директории
if [ ! -f "backend/docker-compose.monolith.yml" ]; then
    echo "❌ Ошибка: запустите скрипт из корневой директории проекта"
    exit 1
fi

cd backend

echo "🐳 Статус контейнеров:"
docker compose -f docker-compose.monolith.yml ps

echo ""
echo "🌐 Проверка доступности:"

# Health check
if curl -f -s --max-time 5 "http://localhost:8000/health" >/dev/null 2>&1; then
    echo "   ✅ Backend health check: OK"
    HEALTH_RESPONSE=$(curl -s "http://localhost:8000/health")
    echo "      $HEALTH_RESPONSE"
else
    echo "   ❌ Backend health check: FAIL"
fi

# Внешний доступ
if curl -f -s --max-time 5 "http://46.149.71.162:8000/health" >/dev/null 2>&1; then
    echo "   ✅ Внешний доступ: OK"
else
    echo "   ❌ Внешний доступ: FAIL"
fi

echo ""
echo "🔐 Тест аутентификации:"
AUTH_RESPONSE=$(curl -s -X POST http://localhost:8000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"admin@devassist.pro","password":"admin123"}' 2>/dev/null)

if echo "$AUTH_RESPONSE" | grep -q "access_token"; then
    echo "   ✅ Аутентификация: работает"
else
    echo "   ❌ Аутентификация: проблема"
    echo "   Ответ: ${AUTH_RESPONSE:0:100}..."
fi

echo ""
echo "📋 Команды:"
echo "   Логи всех сервисов:  docker compose -f docker-compose.monolith.yml logs"
echo "   Логи backend:        docker compose -f docker-compose.monolith.yml logs app"
echo "   Логи PostgreSQL:     docker compose -f docker-compose.monolith.yml logs postgres"
echo "   Логи Redis:          docker compose -f docker-compose.monolith.yml logs redis"
echo ""
echo "   Перезапуск backend:  docker compose -f docker-compose.monolith.yml restart app"
echo "   Остановка:           ../stop-monolith.sh"

cd ..