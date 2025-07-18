#!/bin/bash

# =============================================================================
# DevAssist Pro - Complete Separate Services Startup
# Запускает frontend и backend раздельно
# =============================================================================

echo "🚀 DevAssist Pro - Separate Services Deployment"
echo "==============================================="

# Останавливаем все существующие контейнеры
echo "🛑 Stopping all existing DevAssist containers..."
docker stop $(docker ps -a -q --filter "name=devassist") 2>/dev/null || true
docker rm $(docker ps -a -q --filter "name=devassist") 2>/dev/null || true

# Проверяем .env файл
if [ ! -f ".env.production" ]; then
    echo "❌ .env.production not found"
    echo "💡 Creating .env.production file..."
    ./create-env-production.sh
    echo ""
    echo "📝 Please edit .env.production with your real API keys:"
    echo "   nano .env.production"
    echo ""
    read -p "Press Enter after editing .env.production to continue..."
fi

echo "✅ Environment file found"

# Запускаем backend
echo ""
echo "🔧 Step 1: Starting Backend Service"
echo "===================================="
chmod +x start-backend-separate.sh
./start-backend-separate.sh

if [ $? -eq 0 ]; then
    echo "✅ Backend started successfully!"
    
    # Ждем немного чтобы backend точно запустился
    echo "⏳ Waiting for backend to stabilize..."
    sleep 5
    
    # Запускаем frontend
    echo ""
    echo "🎨 Step 2: Starting Frontend Service"
    echo "====================================="
    chmod +x start-frontend-separate.sh
    ./start-frontend-separate.sh
    
    echo ""
    echo "🎉 Deployment Summary"
    echo "===================="
    echo "📊 Backend API:  http://46.149.67.122:8000"
    echo "🌐 Frontend:     http://46.149.67.122/"
    echo "📚 API Docs:     http://46.149.67.122:8000/docs"
    echo "🏥 Health:       http://46.149.67.122:8000/health"
    echo ""
    echo "📋 Management Commands:"
    echo "docker logs devassist-backend    # Backend logs"
    echo "docker logs devassist-frontend   # Frontend logs"
    echo "docker restart devassist-backend # Restart backend"
    echo "docker restart devassist-frontend # Restart frontend"
    echo ""
    echo "🔧 Quick Tests:"
    echo "curl http://46.149.67.122:8000/health"
    echo "curl http://46.149.67.122/"
    
else
    echo "❌ Backend startup failed!"
    echo "📋 Check logs: docker logs devassist-backend"
    exit 1
fi