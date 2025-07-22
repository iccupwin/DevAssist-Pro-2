#!/bin/bash

echo "🛑 Остановка Development Docker среды"
echo "===================================="

# Остановка dev контейнеров
echo "📦 Остановка Docker контейнеров..."
docker compose -f docker-compose.dev.yml down

# Очистка неиспользуемых ресурсов
echo "🧹 Очистка Docker ресурсов..."
docker system prune -f

echo ""
echo "✅ Development среда остановлена"
echo ""
echo "📋 Статус Docker:"
docker ps --filter name=devassist