#!/bin/bash

echo "🚀 Запуск Frontend для DevAssist Pro"
echo "===================================="

echo "🛑 Остановка существующих контейнеров..."
docker compose -f docker-compose.frontend.yml down

echo "▶️  Запуск frontend сервисов..."
docker compose -f docker-compose.frontend.yml up -d

echo "⏳ Ожидание запуска (15 секунд)..."
sleep 15

echo ""
echo "📊 Статус сервисов:"
docker compose -f docker-compose.frontend.yml ps

echo ""
echo "🩺 Проверка доступности:"
if curl -f -s --max-time 5 http://localhost/ >/dev/null 2>&1; then
    echo "✅ Frontend работает: http://46.149.71.162"
    echo "✅ Frontend (прямой): http://46.149.71.162:3000"
else
    echo "❌ Frontend не отвечает"
fi

echo ""
echo "🎉 Готово! Frontend запущен."
echo ""
echo "📋 Команды:"
echo "  Логи:      docker compose -f docker-compose.frontend.yml logs -f"
echo "  Остановка: docker compose -f docker-compose.frontend.yml down"
echo "  Статус:    docker compose -f docker-compose.frontend.yml ps"