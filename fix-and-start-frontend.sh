#!/bin/bash

set -e

echo "🎯 Исправление и запуск React Frontend"
echo "====================================="

echo "🔧 Шаг 1: Исправление TypeScript ошибок..."
./fix-typescript-errors.sh

echo ""
echo "🛑 Шаг 2: Остановка существующих процессов..."
./stop-react-frontend.sh 2>/dev/null || true
docker compose -f docker-compose.dev.yml down 2>/dev/null || true

echo ""
echo "🐳 Шаг 3: Запуск в Docker..."
./start-frontend-docker.sh

echo ""
echo "🎉 Готово! Frontend должен быть доступен на:"
echo "   http://46.149.71.162:3000"