#!/bin/bash

echo "⚡ Быстрый запуск Frontend в Docker"
echo "=================================="

# Остановка
docker compose -f docker-compose.dev.yml down 2>/dev/null || true

# Сборка без кэша
echo "🏗️  Пересборка без кэша..."
docker compose -f docker-compose.dev.yml build --no-cache frontend-dev

# Запуск
echo "▶️  Запуск..."
docker compose -f docker-compose.dev.yml up -d frontend-dev

# Проверка
echo "⏳ Ожидание (30 сек)..."
sleep 30

echo "📊 Статус:"
docker compose -f docker-compose.dev.yml ps frontend-dev

echo "📋 Логи (последние 20 строк):"
docker compose -f docker-compose.dev.yml logs --tail=20 frontend-dev

echo ""
echo "🌐 Попробуйте: http://46.149.71.162:3000"