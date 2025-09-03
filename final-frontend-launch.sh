#!/bin/bash

set -e

echo "🚀 ФИНАЛЬНЫЙ ЗАПУСК FRONTEND"
echo "==========================="

echo "🔧 Исправление TypeScript ошибок..."
./fix-final-typescript-errors.sh

echo ""
echo "🛑 Остановка всех процессов..."
pkill -f "npm start" 2>/dev/null || true
docker compose -f docker-compose.dev.yml down 2>/dev/null || true
fuser -k 3000/tcp 2>/dev/null || true

echo ""
echo "🐳 Запуск Frontend в Docker..."
docker compose -f docker-compose.dev.yml build --no-cache frontend-dev
docker compose -f docker-compose.dev.yml up -d frontend-dev

echo ""
echo "⏳ Ожидание запуска (45 секунд)..."
sleep 45

echo ""
echo "📊 Статус:"
docker compose -f docker-compose.dev.yml ps frontend-dev

echo ""
echo "📋 Последние логи:"
docker compose -f docker-compose.dev.yml logs --tail=20 frontend-dev

echo ""
echo "🩺 Проверка доступности..."
if curl -f -s --max-time 5 http://localhost:3000 >/dev/null 2>&1; then
    echo "✅ Frontend работает!"
    echo ""
    echo "🎉 УСПЕХ! React приложение доступно:"
    echo "   🌐 http://46.149.71.162:3000"
    echo ""
    echo "📋 Команды:"
    echo "   Логи: docker compose -f docker-compose.dev.yml logs -f frontend-dev"
    echo "   Остановка: docker compose -f docker-compose.dev.yml down"
else
    echo "⚠️  Frontend еще запускается..."
    echo "   Проверьте через минуту: curl http://46.149.71.162:3000"
    echo "   Логи: docker compose -f docker-compose.dev.yml logs frontend-dev"
fi