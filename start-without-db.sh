#!/bin/bash

echo "🚀 ЗАПУСК БЕЗ БАЗЫ ДАННЫХ (для тестирования)"
echo "==========================================="
echo ""

# Останавливаем все
docker compose down

# Запускаем только frontend из старых контейнеров
echo "🔄 Запуск старого frontend контейнера..."
docker start devassist_frontend_app

# Запускаем backend в standalone режиме
echo "🐍 Запуск backend в локальном режиме..."
cd backend
export DATABASE_AVAILABLE=false
export ANTHROPIC_API_KEY=$(grep ANTHROPIC_API_KEY ../.env.production | cut -d= -f2)
export ALLOWED_ORIGINS="http://46.149.71.162:3000,http://46.149.71.162,http://localhost:3000"
export CORS_ALLOW_CREDENTIALS=true

# Запускаем backend
python app.py &
BACKEND_PID=$!

echo "⏳ Ожидание запуска (10 секунд)..."
sleep 10

# Проверка
echo ""
echo "📊 Статус:"
if curl -f -s "http://localhost:8000/health" >/dev/null 2>&1; then
    echo "✅ Backend работает на порту 8000"
else
    echo "❌ Backend недоступен"
fi

if curl -f -s "http://46.149.71.162:3000" >/dev/null 2>&1; then
    echo "✅ Frontend работает на порту 3000"
else
    echo "❌ Frontend недоступен"
fi

echo ""
echo "🧪 Тест аутентификации..."
curl -s "http://localhost:8000/api/auth/login" -X POST \
    -H "Content-Type: application/json" \
    -H "Origin: http://46.149.71.162:3000" \
    -d '{"email":"test@example.com","password":"test123"}' | head -1

echo ""
echo "📋 Backend PID: $BACKEND_PID"
echo "   Остановить: kill $BACKEND_PID"