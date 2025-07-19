#!/bin/bash

# =============================================================================
# DevAssist Pro - Deploy on Server
# Команды для выполнения НА СЕРВЕРЕ
# =============================================================================

echo "🚀 DevAssist Pro - Server Deployment"
echo "===================================="

# 1. Остановить системный nginx если он запущен
echo "🛑 Stopping system nginx..."
sudo systemctl stop nginx 2>/dev/null || true
sudo service nginx stop 2>/dev/null || true

# 2. Проверить что освободился порт 80
echo "🔍 Checking port 80..."
if lsof -i :80 > /dev/null 2>&1; then
    echo "⚠️  Port 80 is still in use by:"
    lsof -i :80
    echo "Trying to kill process..."
    sudo fuser -k 80/tcp 2>/dev/null || true
fi

# 3. Проверить запущенные контейнеры
echo "📦 Current Docker containers:"
docker ps

# 4. Остановить старые контейнеры
echo "🛑 Stopping old containers..."
docker stop devassist-frontend 2>/dev/null || true
docker rm devassist-frontend 2>/dev/null || true

# 5. Проверить есть ли образ frontend
echo "🔍 Checking for frontend image..."
if docker images | grep devassist-frontend; then
    echo "✅ Frontend image found"
else
    echo "❌ Frontend image not found!"
    echo "You need to build it first with one of the scripts"
fi

# 6. Запустить frontend контейнер
echo "🚀 Starting frontend container..."
docker run -d \
    --name devassist-frontend \
    --restart unless-stopped \
    -p 80:80 \
    devassist-frontend:latest

# 7. Проверить статус
echo "⏳ Waiting for container to start..."
sleep 5

echo "📋 Container status:"
docker ps | grep devassist-frontend

# 8. Проверить логи
echo "📄 Container logs:"
docker logs devassist-frontend --tail 20

# 9. Проверить доступность
echo "🔍 Testing frontend..."
if curl -f -s http://localhost > /dev/null 2>&1; then
    echo "✅ Frontend is responding!"
else
    echo "❌ Frontend is not responding"
    echo "Check logs: docker logs devassist-frontend"
fi

echo ""
echo "📋 Quick commands:"
echo "docker logs devassist-frontend -f    # Watch logs"
echo "docker restart devassist-frontend    # Restart"
echo "docker exec -it devassist-frontend sh # Shell access"