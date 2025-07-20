#!/bin/bash

set -e

echo "🚀 Запуск Frontend для DevAssist Pro"
echo "===================================="

# Проверить что мы в правильной директории
if [ ! -f "docker-compose.frontend.yml" ]; then
    echo "❌ Запустите скрипт из корневой директории проекта"
    exit 1
fi

# Остановить существующие frontend контейнеры
echo "🛑 Остановка существующих frontend контейнеров..."
docker compose -f docker-compose.frontend.yml down 2>/dev/null || true

# Сборка frontend
echo "🏗️  Сборка frontend контейнера..."
docker compose -f docker-compose.frontend.yml build --no-cache

# Запуск frontend
echo "▶️  Запуск frontend сервисов..."
docker compose -f docker-compose.frontend.yml up -d

# Ожидание запуска
echo "⏳ Ожидание запуска frontend (20 секунд)..."
sleep 20

# Проверка статуса
echo ""
echo "📊 Статус frontend сервисов:"
docker compose -f docker-compose.frontend.yml ps

# Проверка здоровья frontend
echo ""
echo "🩺 Проверка здоровья frontend:"
if curl -f -s --max-time 5 http://localhost:3000/frontend-health >/dev/null 2>&1; then
    echo "✅ Frontend контейнер работает (порт 3000)"
    FRONTEND_HEALTH="OK"
else
    echo "❌ Frontend контейнер не отвечает"
    FRONTEND_HEALTH="FAIL"
fi

# Проверка nginx proxy
echo ""
echo "🩺 Проверка nginx proxy:"
if curl -f -s --max-time 5 http://localhost/ >/dev/null 2>&1; then
    echo "✅ Nginx proxy работает (порт 80)"
    NGINX_HEALTH="OK"
else
    echo "❌ Nginx proxy не отвечает"
    NGINX_HEALTH="FAIL"
fi

# Результат
echo ""
echo "🎯 РЕЗУЛЬТАТ РАЗВЕРТЫВАНИЯ:"
echo "================================"
if [ "$FRONTEND_HEALTH" = "OK" ] && [ "$NGINX_HEALTH" = "OK" ]; then
    echo "✅ Frontend успешно развернут!"
    echo ""
    echo "📱 Доступные URL:"
    echo "  🌐 Frontend:     http://46.149.71.162"
    echo "  🔗 Frontend:     http://46.149.71.162:3000 (прямой)"
    echo "  🔧 Backend API:  http://46.149.71.162:8000"
    echo "  📖 API Docs:     http://46.149.71.162:8000/docs"
    echo "  🩺 Health:       http://46.149.71.162:8000/health"
    echo ""
    echo "🎉 Система готова к использованию!"
else
    echo "⚠️  Frontend развернут с проблемами:"
    echo "   Frontend контейнер: $FRONTEND_HEALTH"
    echo "   Nginx proxy: $NGINX_HEALTH"
    echo ""
    echo "📋 Для диагностики:"
    echo "   docker compose -f docker-compose.frontend.yml logs frontend"
    echo "   docker compose -f docker-compose.frontend.yml logs nginx"
fi

echo ""
echo "📋 Команды управления:"
echo "  Логи всех сервисов:  docker compose -f docker-compose.frontend.yml logs -f"
echo "  Логи frontend:       docker compose -f docker-compose.frontend.yml logs -f frontend"
echo "  Логи nginx:          docker compose -f docker-compose.frontend.yml logs -f nginx"
echo "  Статус:              docker compose -f docker-compose.frontend.yml ps"
echo "  Остановка:           docker compose -f docker-compose.frontend.yml down"
echo "  Перезапуск:          docker compose -f docker-compose.frontend.yml restart"
echo "  Пересборка:          docker compose -f docker-compose.frontend.yml build --no-cache"