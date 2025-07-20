#!/bin/bash

set -e

echo "🚀 Запуск DevAssist Pro в Development режиме (Docker)"
echo "==================================================="

# Проверка что мы в правильной директории
if [ ! -f "docker-compose.dev.yml" ]; then
    echo "❌ Запустите скрипт из корневой директории проекта"
    exit 1
fi

# Остановить существующие dev контейнеры
echo "🛑 Остановка существующих dev контейнеров..."
docker compose -f docker-compose.dev.yml down 2>/dev/null || true

# Остановить обычные React процессы
echo "🛑 Остановка обычных React процессов..."
sudo pkill -f "npm start" 2>/dev/null || true
sudo fuser -k 3000/tcp 2>/dev/null || true

# Создание .env файла если не существует
if [ ! -f ".env.development" ]; then
    echo "📝 Создание .env.development..."
    cat > .env.development << EOF
# Development Environment для Docker
REACT_APP_API_URL=http://46.149.71.162:8000
REACT_APP_WS_URL=ws://46.149.71.162:8000
REACT_APP_USE_REAL_API=true

# Backend
POSTGRES_PASSWORD=devassist_secure_password_2024
REDIS_PASSWORD=redis_secure_password_2024
JWT_SECRET=your_jwt_secret_key_minimum_32_characters_long_for_development

# API Keys (добавьте ваши)
ANTHROPIC_API_KEY=your_anthropic_api_key_here
OPENAI_API_KEY=your_openai_api_key_here
GOOGLE_API_KEY=your_google_api_key_here
EOF
    echo "✅ Создан .env.development"
fi

# Выбор режима запуска
echo ""
echo "📋 Выберите режим запуска:"
echo "1. Только Frontend (подключается к существующему Backend)"
echo "2. Frontend + Backend (полная разработка)"
echo ""
read -p "Введите номер (1 или 2): " MODE

if [ "$MODE" = "1" ]; then
    echo "🏗️  Сборка и запуск только Frontend..."
    docker compose -f docker-compose.dev.yml build frontend-dev
    docker compose -f docker-compose.dev.yml up -d frontend-dev
    SERVICES="frontend-dev"
elif [ "$MODE" = "2" ]; then
    echo "🏗️  Сборка и запуск Frontend + Backend..."
    docker compose -f docker-compose.dev.yml build
    docker compose -f docker-compose.dev.yml up -d
    SERVICES="frontend-dev backend-dev"
else
    echo "❌ Неверный выбор. Запускаю только Frontend..."
    docker compose -f docker-compose.dev.yml build frontend-dev
    docker compose -f docker-compose.dev.yml up -d frontend-dev
    SERVICES="frontend-dev"
fi

# Ожидание запуска
echo "⏳ Ожидание запуска сервисов (60 секунд)..."
sleep 60

# Проверка статуса
echo ""
echo "📊 Статус сервисов:"
docker compose -f docker-compose.dev.yml ps

# Проверка доступности
echo ""
echo "🩺 Проверка доступности..."

# Проверка Frontend
if curl -f -s --max-time 10 http://localhost:3000 >/dev/null 2>&1; then
    echo "✅ Frontend работает: http://46.149.71.162:3000"
else
    echo "⚠️  Frontend еще запускается или есть проблемы"
    echo "📋 Логи frontend: docker compose -f docker-compose.dev.yml logs frontend-dev"
fi

# Проверка Backend (если запущен)
if echo "$SERVICES" | grep -q "backend-dev"; then
    if curl -f -s --max-time 10 http://localhost:8000/health >/dev/null 2>&1; then
        echo "✅ Backend работает: http://46.149.71.162:8000"
    else
        echo "⚠️  Backend еще запускается или есть проблемы"
        echo "📋 Логи backend: docker compose -f docker-compose.dev.yml logs backend-dev"
    fi
fi

echo ""
echo "🎉 Development среда запущена!"
echo ""
echo "📋 Доступные URL:"
echo "  🌐 Frontend:      http://46.149.71.162:3000"
echo "  🔧 Backend API:   http://46.149.71.162:8000"
echo "  📖 API Docs:      http://46.149.71.162:8000/docs"
echo ""
echo "📋 Управление:"
echo "  Логи всех:        docker compose -f docker-compose.dev.yml logs -f"
echo "  Логи frontend:    docker compose -f docker-compose.dev.yml logs -f frontend-dev"
echo "  Логи backend:     docker compose -f docker-compose.dev.yml logs -f backend-dev"
echo "  Статус:           docker compose -f docker-compose.dev.yml ps"
echo "  Остановка:        docker compose -f docker-compose.dev.yml down"
echo "  Перезапуск:       docker compose -f docker-compose.dev.yml restart"
echo ""
echo "💡 Hot Reload включен - изменения в src/ автоматически перезагружаются!"