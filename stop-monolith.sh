#!/bin/bash

echo "🛑 ОСТАНОВКА МОНОЛИТНОГО BACKEND"
echo "================================"
echo ""

# Проверяем что мы в правильной директории
if [ ! -f "backend/docker-compose.monolith.yml" ]; then
    echo "❌ Ошибка: запустите скрипт из корневой директории проекта"
    exit 1
fi

cd backend

echo "📊 Текущий статус контейнеров:"
docker compose -f docker-compose.monolith.yml ps

echo ""
echo "🛑 Остановка сервисов..."
docker compose -f docker-compose.monolith.yml down

echo ""
echo "🧹 Очистка (опционально):"
echo "   Удалить volumes: docker compose -f docker-compose.monolith.yml down -v"
echo "   Удалить образы:  docker compose -f docker-compose.monolith.yml down --rmi all"

echo ""
echo "✅ Монолитный backend остановлен"

cd ..