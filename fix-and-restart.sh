#!/bin/bash

echo "🔧 Fixing Docker build issues and restarting services..."

# Останавливаем все контейнеры
echo "🛑 Stopping all containers..."
docker-compose -f docker-compose.fullstack.yml down

# Удаляем старые образы для чистого пересборки
echo "🗑️ Removing old images..."
docker system prune -f

# Обновляем CORS настройки в backend
echo "🔧 Updating CORS settings..."

# Обновляем API Gateway CORS
sed -i 's/allow_origins=os.getenv("ALLOWED_ORIGINS", "http:\/\/localhost:3000").split(",")/allow_origins=os.getenv("ALLOWED_ORIGINS", "http:\/\/localhost:3000,http:\/\/localhost:3001").split(",")/' backend/api_gateway/main.py

# Обновляем shared config CORS
sed -i 's/allowed_origins: List\[str\] = \["http:\/\/localhost:3000", "http:\/\/localhost:8000"\]/allowed_origins: List\[str\] = ["http:\/\/localhost:3000", "http:\/\/localhost:3001", "http:\/\/localhost:8000"]/' backend/shared/config.py

echo "✅ CORS settings updated"

# Запускаем сервисы заново
echo "🚀 Starting services with fixed configuration..."
docker-compose -f docker-compose.fullstack.yml up -d --build

echo "⏳ Waiting for services to start..."
sleep 45

echo "🔍 Checking service health..."

# Проверяем API Gateway
echo "API Gateway:"
curl -s http://localhost:8000/health | jq '.' 2>/dev/null || echo "API Gateway not responding"

# Проверяем Auth Service
echo "Auth Service:"
curl -s http://localhost:8001/health | jq '.' 2>/dev/null || echo "Auth Service not responding"

echo "✅ Services restarted with fixed configuration"
echo "🌐 Frontend should now be able to connect to backend"
echo "📝 Try registering again at http://localhost:3001"
echo ""
echo "If you still have issues, check the logs:"
echo "docker-compose -f docker-compose.fullstack.yml logs auth-service"
echo "docker-compose -f docker-compose.fullstack.yml logs api-gateway" 