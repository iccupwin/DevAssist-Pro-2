#!/bin/bash

# DevAssist Pro - React Frontend Launcher
# Запускает ваш настоящий React Frontend

echo "🚀 Starting DevAssist Pro React Frontend..."

# Остановить Streamlit если работает
echo "🛑 Stopping Streamlit demo..."
docker stop devassist-frontend-launcher 2>/dev/null || true
docker stop devassist-streamlit-working 2>/dev/null || true

# Проверить что Backend работает
echo "🔍 Checking backend services..."
if ! curl -s http://localhost:8000/health > /dev/null; then
    echo "❌ Backend API не доступен на порту 8000"
    echo "Запустите backend сначала:"
    echo "  docker-compose -f docker-compose.fullstack.yml up postgres redis api-gateway -d"
    exit 1
fi

echo "✅ Backend API доступен"

# Перейти в папку frontend
cd frontend

# Проверить наличие node_modules
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Установить переменные окружения
export REACT_APP_API_URL=http://localhost:8000
export REACT_APP_WS_URL=ws://localhost:8000

echo "🌐 Starting React development server..."
echo "📱 Your React Frontend will be available at: http://localhost:3000"
echo "🔗 Backend API available at: http://localhost:8000"
echo ""
echo "🛑 Press Ctrl+C to stop"

# Запустить React development server
npm start