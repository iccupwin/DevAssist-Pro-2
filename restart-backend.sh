#!/bin/bash

echo "🔄 Restarting DevAssist Pro backend services..."

# Останавливаем все контейнеры
docker-compose -f docker-compose.fullstack.yml down

# Удаляем старые контейнеры для чистого перезапуска
docker-compose -f docker-compose.fullstack.yml rm -f

# Запускаем сервисы заново
docker-compose -f docker-compose.fullstack.yml up -d

echo "⏳ Waiting for services to start..."
sleep 30

echo "🔍 Checking service health..."

# Проверяем API Gateway
echo "API Gateway:"
curl -s http://localhost:8000/health | jq '.' || echo "API Gateway not responding"

# Проверяем Auth Service
echo "Auth Service:"
curl -s http://localhost:8001/health | jq '.' || echo "Auth Service not responding"

echo "✅ Backend services restarted with updated CORS settings"
echo "🌐 Frontend should now be able to connect to backend"
echo "📝 Try registering again at http://localhost:3001" 