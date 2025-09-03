#!/bin/bash

set -e

echo "⚡ DevAssist Pro - БЫСТРЫЙ ПЕРЕЗАПУСК"
echo "==================================="
echo "Перезапуск без пересборки для применения CORS изменений"
echo ""

SERVER_IP="46.149.71.162"

echo "📋 Этапы:"
echo "  1. 🛑 Остановка сервисов"
echo "  2. 📦 Обновление конфигурации"
echo "  3. 🚀 Запуск без пересборки"
echo "  4. 🧪 Проверка"
echo ""

# Этап 1: Остановка
echo "🛑 Остановка контейнеров..."
docker compose down 2>/dev/null || true

# Этап 2: Обновление конфигурации
echo "📦 Обновление .env..."
if [ -f ".env.production" ]; then
    cp .env.production .env
    echo "✅ .env обновлен"
else
    echo "⚠️  .env.production не найден"
fi

# Этап 3: Запуск
echo "🚀 Запуск контейнеров..."
docker compose up -d

echo "⏳ Ожидание запуска (60 секунд)..."
sleep 60

# Этап 4: Проверка
echo "📊 Проверка статуса:"
docker compose ps

echo ""
echo "🌐 Проверка доступности:"

# Frontend
if curl -f -s --max-time 10 "http://$SERVER_IP:3000" >/dev/null 2>&1; then
    echo "  ✅ Frontend: работает"
else
    echo "  ❌ Frontend: недоступен"
fi

# Backend
if curl -f -s --max-time 10 "http://$SERVER_IP:8000/health" >/dev/null 2>&1; then
    echo "  ✅ Backend: работает"
    BACKEND_OK=true
elif curl -f -s --max-time 10 "http://$SERVER_IP:80/health" >/dev/null 2>&1; then
    echo "  ✅ Backend (через порт 80): работает"
    BACKEND_OK=true
else
    echo "  ❌ Backend: недоступен"
    BACKEND_OK=false
fi

# CORS тест
if [ "$BACKEND_OK" = true ]; then
    echo ""
    echo "🧪 Тест CORS..."
    
    # Определяем рабочий порт
    if curl -f -s --max-time 5 "http://$SERVER_IP:8000/health" >/dev/null 2>&1; then
        BACKEND_PORT=8000
    else
        BACKEND_PORT=80
    fi
    
    CORS_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" \
        -H "Origin: http://$SERVER_IP:3000" \
        -H "Access-Control-Request-Method: POST" \
        -H "Access-Control-Request-Headers: Content-Type,Authorization" \
        -X OPTIONS \
        "http://$SERVER_IP:$BACKEND_PORT/api/auth/login" 2>/dev/null || echo "000")
    
    if [ "$CORS_RESPONSE" = "200" ] || [ "$CORS_RESPONSE" = "204" ]; then
        echo "  ✅ CORS: работает (HTTP $CORS_RESPONSE)"
        
        echo ""
        echo "🧪 Запуск проверки аутентификации..."
        if [ -f "./auth-verification.sh" ]; then
            ./auth-verification.sh
        fi
    else
        echo "  ❌ CORS: проблема (HTTP $CORS_RESPONSE)"
        
        echo ""
        echo "🔧 CORS всё ещё не работает. Попробуйте:"
        echo "   1. Полную пересборку: ./fix-monolith-deploy.sh"
        echo "   2. Проверьте логи: docker compose logs app"
        echo "   3. Проверьте переменные окружения в контейнере"
    fi
else
    echo ""
    echo "❌ Backend недоступен. Попробуйте полную пересборку:"
    echo "   ./fix-monolith-deploy.sh"
fi

echo ""
echo "📋 Управление:"
echo "   Логи: docker compose logs -f"
echo "   Остановка: docker compose down"
echo "   Статус: docker compose ps"