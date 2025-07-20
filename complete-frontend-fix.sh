#!/bin/bash

set -e

echo "🎯 ПОЛНОЕ ИСПРАВЛЕНИЕ И ЗАПУСК FRONTEND"
echo "====================================="

echo "🔧 Шаг 1: Исправление всех TypeScript ошибок..."
./fix-all-typescript-errors.sh

echo ""
echo "🛑 Шаг 2: Остановка существующих процессов..."
pkill -f "npm start" 2>/dev/null || true
docker compose -f docker-compose.dev.yml down 2>/dev/null || true
fuser -k 3000/tcp 2>/dev/null || true

echo ""
echo "🐳 Шаг 3: Запуск в Docker режиме..."
echo "🏗️  Сборка образа..."
docker compose -f docker-compose.dev.yml build --no-cache frontend-dev

echo "▶️  Запуск контейнера..."
docker compose -f docker-compose.dev.yml up -d frontend-dev

echo ""
echo "⏳ Ожидание запуска (60 секунд)..."
sleep 60

echo ""
echo "📊 Статус контейнера:"
docker compose -f docker-compose.dev.yml ps frontend-dev

echo ""
echo "📋 Логи последние 15 строк:"
docker compose -f docker-compose.dev.yml logs --tail=15 frontend-dev

echo ""
echo "🩺 Проверка доступности..."
for i in {1..5}; do
    if curl -f -s --max-time 3 http://localhost:3000 >/dev/null 2>&1; then
        echo "✅ Frontend работает: http://46.149.71.162:3000"
        echo "🎉 УСПЕШНО! React приложение запущено в Docker!"
        break
    else
        if [ $i -eq 5 ]; then
            echo "❌ Frontend не отвечает после $i попыток"
            echo "📋 Полные логи: docker compose -f docker-compose.dev.yml logs frontend-dev"
            echo "📋 Проверьте что контейнер запущен: docker compose -f docker-compose.dev.yml ps"
        else
            echo "⏳ Попытка $i/5 - ожидание..."
            sleep 10
        fi
    fi
done

echo ""
echo "📱 ДОСТУПНЫЕ URL:"
echo "  🌐 Frontend:      http://46.149.71.162:3000"
echo "  🔧 Backend API:   http://46.149.71.162:8000"
echo "  📖 API Docs:      http://46.149.71.162:8000/docs"
echo ""
echo "📋 УПРАВЛЕНИЕ:"
echo "  Логи:     docker compose -f docker-compose.dev.yml logs -f frontend-dev"
echo "  Статус:   docker compose -f docker-compose.dev.yml ps"
echo "  Остановка: docker compose -f docker-compose.dev.yml down"
echo "  Перезапуск: docker compose -f docker-compose.dev.yml restart frontend-dev"