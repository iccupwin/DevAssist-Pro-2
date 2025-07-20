#!/bin/bash

# Quick restart Docker containers
set -e

echo "🚀 Перезапуск Docker контейнеров..."

# Остановка контейнеров
docker compose -f docker-compose.production.yml down

# Пересборка только nginx (frontend)
echo "🔧 Пересборка frontend..."
docker compose -f docker-compose.production.yml build nginx --no-cache

# Запуск всех контейнеров
echo "▶️ Запуск контейнеров..."
docker compose -f docker-compose.production.yml up -d

# Проверка статуса
echo "📊 Статус контейнеров:"
sleep 10
docker compose -f docker-compose.production.yml ps

echo "✅ Готово!"