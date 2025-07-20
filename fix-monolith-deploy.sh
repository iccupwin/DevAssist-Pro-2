#!/bin/bash

set -e

echo "🚀 DevAssist Pro - МОНОЛИТНОЕ РАЗВЕРТЫВАНИЕ"
echo "==========================================="
echo "Исправление аутентификации и CORS для монолитной архитектуры"
echo ""

SERVER_IP="46.149.71.162"
LOG_FILE="/tmp/devassist-monolith-$(date +%Y%m%d-%H%M%S).log"

# Функция логирования
log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOG_FILE"
}

log "🔧 Начало монолитного развертывания DevAssist Pro"

echo "📋 Этапы:"
echo "  1. ✅ Проверка и исправление конфигурации"
echo "  2. 🛑 Остановка существующих сервисов"
echo "  3. 🐳 Перезапуск монолитного приложения"
echo "  4. 🧪 Проверка работоспособности"
echo ""

# Этап 1: Проверка конфигурации
log "📊 Этап 1: Проверка конфигурации"

echo "🔍 Обновление CORS в docker-compose.yml..."
if grep -q "http://46.149.71.162:3000" docker-compose.yml; then
    log "✅ CORS в docker-compose.yml уже исправлен"
else
    log "⚠️  Исправление CORS в docker-compose.yml"
    sed -i 's|ALLOWED_ORIGINS:.*|ALLOWED_ORIGINS: http://46.149.71.162:3000,http://46.149.71.162,https://46.149.71.162,http://localhost:80,http://localhost:3000,http://localhost:3001|' docker-compose.yml
fi

echo "🔍 Копирование .env файлов..."
if [ -f ".env.production" ]; then
    cp .env.production .env
    log "✅ Скопирован .env.production -> .env"
else
    log "⚠️  .env.production не найден, используем существующий .env"
fi

# Этап 2: Остановка сервисов
log "🛑 Этап 2: Остановка сервисов"

echo "🛑 Остановка Docker контейнеров..."
docker compose down 2>/dev/null || true

echo "🛑 Остановка процессов на портах..."
sudo fuser -k 3000/tcp 2>/dev/null || true
sudo fuser -k 8000/tcp 2>/dev/null || true
sudo fuser -k 80/tcp 2>/dev/null || true

# Пауза
sleep 5

log "✅ Сервисы остановлены"

# Этап 3: Запуск
log "🐳 Этап 3: Запуск монолитного приложения"

echo "🧹 Очистка Docker..."
docker system prune -f 2>/dev/null || true

echo "🔨 Пересборка образов..."
docker compose build --no-cache

echo "🚀 Запуск сервисов..."
docker compose up -d

echo "⏳ Ожидание запуска (90 секунд)..."
sleep 90

log "✅ Сервисы запущены"

# Этап 4: Проверка
log "📊 Этап 4: Проверка работоспособности"

echo "📊 Состояние контейнеров:"
docker compose ps

echo ""
echo "📊 Проверка доступности:"

# Проверка Frontend
if curl -f -s --max-time 10 "http://$SERVER_IP:3000" >/dev/null 2>&1; then
    echo "  ✅ Frontend (3000): доступен"
    FRONTEND_OK=true
else
    echo "  ❌ Frontend (3000): недоступен"
    FRONTEND_OK=false
fi

# Проверка Backend/Monolith
if curl -f -s --max-time 10 "http://$SERVER_IP:8000/health" >/dev/null 2>&1; then
    echo "  ✅ Backend Monolith (8000): доступен"
    BACKEND_OK=true
elif curl -f -s --max-time 10 "http://$SERVER_IP:80/health" >/dev/null 2>&1; then
    echo "  ✅ Backend Monolith (80): доступен"
    BACKEND_OK=true
    BACKEND_PORT=80
else
    echo "  ❌ Backend Monolith: недоступен на портах 8000 и 80"
    BACKEND_OK=false
    BACKEND_PORT=8000
fi

# Проверка Auth в составе монолита
if [ "$BACKEND_OK" = true ]; then
    AUTH_URL="http://$SERVER_IP:${BACKEND_PORT:-8000}"
    if curl -f -s --max-time 10 "$AUTH_URL/api/auth/login" -X OPTIONS >/dev/null 2>&1; then
        echo "  ✅ Auth Module: доступен"
        AUTH_OK=true
    else
        echo "  ⚠️  Auth Module: возможны проблемы с CORS"
        AUTH_OK=false
    fi
else
    AUTH_OK=false
fi

# Быстрый CORS тест
if [ "$BACKEND_OK" = true ]; then
    echo ""
    echo "🌐 Быстрый CORS тест..."
    CORS_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" \
        -H "Origin: http://$SERVER_IP:3000" \
        -H "Access-Control-Request-Method: POST" \
        -H "Access-Control-Request-Headers: Content-Type,Authorization" \
        -X OPTIONS \
        "http://$SERVER_IP:${BACKEND_PORT:-8000}/api/auth/login" 2>/dev/null || echo "000")
    
    if [ "$CORS_RESPONSE" = "200" ] || [ "$CORS_RESPONSE" = "204" ]; then
        echo "  ✅ CORS: работает (HTTP $CORS_RESPONSE)"
        CORS_OK=true
    else
        echo "  ❌ CORS: проблема (HTTP $CORS_RESPONSE)"
        CORS_OK=false
    fi
else
    CORS_OK=false
fi

# Финальная проверка аутентификации
if [ "$BACKEND_OK" = true ] && [ "$CORS_OK" = true ]; then
    echo ""
    echo "🧪 Запуск полной проверки аутентификации..."
    if [ -f "./auth-verification.sh" ]; then
        if ./auth-verification.sh; then
            AUTH_TEST_OK=true
        else
            AUTH_TEST_OK=false
        fi
    else
        AUTH_TEST_OK=false
    fi
else
    AUTH_TEST_OK=false
fi

# Финальный отчет
echo ""
echo "🎯 ФИНАЛЬНЫЙ ОТЧЕТ"
echo "=================="

if [ "$FRONTEND_OK" = true ] && [ "$BACKEND_OK" = true ] && [ "$CORS_OK" = true ]; then
    echo "🎉 УСПЕШНОЕ РАЗВЕРТЫВАНИЕ!"
    echo ""
    echo "🌐 Доступные URLs:"
    echo "   Frontend: http://$SERVER_IP:3000"
    echo "   Backend:  http://$SERVER_IP:${BACKEND_PORT:-8000}"
    
    if [ "$AUTH_TEST_OK" = true ]; then
        echo "   ✅ Аутентификация: работает полностью"
    else
        echo "   ⚠️  Аутентификация: требует дополнительной проверки"
    fi
    
    echo ""
    echo "✅ Исправления применены:"
    echo "   • CORS конфигурация обновлена для IP $SERVER_IP"
    echo "   • Монолитное приложение перезапущено"
    echo "   • Frontend подключен к backend"
    
    log "🎉 УСПЕШНОЕ МОНОЛИТНОЕ РАЗВЕРТЫВАНИЕ"
    
    echo ""
    echo "📋 Команды для управления:"
    echo "   Остановка: docker compose down"
    echo "   Перезапуск: docker compose restart"
    echo "   Логи: docker compose logs -f"
    echo "   Статус: docker compose ps"
    
    exit 0
    
elif [ "$FRONTEND_OK" = true ] && [ "$BACKEND_OK" = true ]; then
    echo "⚠️  ЧАСТИЧНЫЙ УСПЕХ. Сервисы работают, но есть проблемы с CORS."
    echo ""
    echo "🔧 Для исправления CORS:"
    echo "   1. Проверьте логи: docker compose logs app"
    echo "   2. Убедитесь что в .env есть: ALLOWED_ORIGINS=http://$SERVER_IP:3000"
    echo "   3. Перезапустите: docker compose restart app"
    
    log "⚠️  ЧАСТИЧНЫЙ УСПЕХ - Проблемы с CORS"
    exit 1
    
else
    echo "🚨 ОШИБКА РАЗВЕРТЫВАНИЯ!"
    echo ""
    echo "❌ Проблемы:"
    [ "$FRONTEND_OK" = false ] && echo "   • Frontend недоступен"
    [ "$BACKEND_OK" = false ] && echo "   • Backend недоступен"
    [ "$CORS_OK" = false ] && echo "   • CORS не настроен"
    
    echo ""
    echo "🔧 Действия для исправления:"
    echo "   1. Проверьте логи: docker compose logs"
    echo "   2. Проверьте порты: netstat -tulpn | grep -E ':(3000|8000|80)'"
    echo "   3. Проверьте конфигурацию: cat .env"
    echo "   4. Попробуйте перезапуск: docker compose restart"
    
    echo ""
    echo "📋 Файл лога: $LOG_FILE"
    
    log "🚨 ОШИБКА МОНОЛИТНОГО РАЗВЕРТЫВАНИЯ"
    exit 2
fi