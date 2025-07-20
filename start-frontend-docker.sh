#!/bin/bash

set -e

echo "🚀 Запуск React Frontend в Docker"
echo "================================="

# Остановка существующих процессов
echo "🛑 Остановка существующих процессов..."
docker compose -f docker-compose.dev.yml down 2>/dev/null || true
sudo pkill -f "npm start" 2>/dev/null || true
sudo fuser -k 3000/tcp 2>/dev/null || true

# Сборка и запуск только frontend
echo "🏗️  Сборка Frontend контейнера..."
docker compose -f docker-compose.dev.yml build frontend-dev

echo "▶️  Запуск Frontend..."
docker compose -f docker-compose.dev.yml up -d frontend-dev

# Ожидание запуска
echo "⏳ Ожидание запуска (45 секунд)..."
sleep 45

# Проверка статуса
echo ""
echo "📊 Статус контейнера:"
docker compose -f docker-compose.dev.yml ps frontend-dev

# Проверка доступности
echo ""
echo "🩺 Проверка доступности..."
for i in {1..5}; do
    if curl -f -s --max-time 3 http://localhost:3000 >/dev/null 2>&1; then
        echo "✅ React Frontend работает: http://46.149.71.162:3000"
        break
    else
        if [ $i -eq 5 ]; then
            echo "❌ Frontend не отвечает"
            echo "📋 Логи: docker compose -f docker-compose.dev.yml logs frontend-dev"
        else
            echo "⏳ Попытка $i/5..."
            sleep 10
        fi
    fi
done

echo ""
echo "🎉 React Frontend запущен в Docker!"
echo ""
echo "📋 Доступ:"
echo "  Frontend: http://46.149.71.162:3000"
echo "  Backend:  http://46.149.71.162:8000 (если запущен отдельно)"
echo ""
echo "📋 Команды:"
echo "  Логи:     docker compose -f docker-compose.dev.yml logs -f frontend-dev"
echo "  Статус:   docker compose -f docker-compose.dev.yml ps"
echo "  Остановка: docker compose -f docker-compose.dev.yml down"
echo ""
echo "💡 Hot Reload работает - изменения в src/ перезагружаются автоматически!"