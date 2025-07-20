#!/bin/bash

# Простой запуск только Backend
set -e

echo "🚀 Запуск только Backend сервисов..."

# Остановка всех существующих контейнеров
echo "🛑 Остановка существующих контейнеров..."
docker compose -f docker-compose.backend.yml down 2>/dev/null || true
docker compose -f docker-compose.production.yml down 2>/dev/null || true
docker container prune -f

# Создание .env если не существует
if [ ! -f ".env.production" ]; then
    echo "📝 Создание .env.production..."
    cp .env.production.example .env.production
    
    # Генерация безопасных паролей
    POSTGRES_PWD=$(openssl rand -base64 32 | tr -d /=+ | cut -c -25)
    REDIS_PWD=$(openssl rand -base64 32 | tr -d /=+ | cut -c -25)
    JWT_SECRET_VAL=$(openssl rand -base64 64 | tr -d /=+ | cut -c -50)
    
    # Обновление паролей в файле
    sed -i "s/devassist_secure_password_2024_change_me/$POSTGRES_PWD/g" .env.production
    sed -i "s/redis_secure_password_2024_change_me/$REDIS_PWD/g" .env.production
    sed -i "s/your_jwt_secret_key_minimum_32_characters_long_change_me_now/$JWT_SECRET_VAL/g" .env.production
    
    echo "✅ .env.production создан с безопасными паролями"
fi

# Сборка и запуск backend
echo "🏗️  Сборка backend сервисов..."
docker compose -f docker-compose.backend.yml build --no-cache

echo "▶️  Запуск backend сервисов..."
docker compose -f docker-compose.backend.yml up -d

echo "⏳ Ожидание запуска сервисов (60 секунд)..."
sleep 60

# Проверка статуса
echo "📊 Статус сервисов:"
docker compose -f docker-compose.backend.yml ps

# Проверка health
echo "🩺 Проверка работоспособности:"
if curl -f -s --max-time 10 http://localhost:8000/health >/dev/null 2>&1; then
    echo "✅ Backend API работает: http://46.149.71.162:8000"
    echo "✅ API Docs доступны: http://46.149.71.162:8000/docs"
    echo "✅ Health endpoint: http://46.149.71.162:8000/health"
else
    echo "❌ Backend API не отвечает"
    echo "📋 Проверьте логи: docker compose -f docker-compose.backend.yml logs"
fi

echo ""
echo "🎉 Backend развертывание завершено!"
echo ""
echo "📋 Управление:"
echo "  Логи:     docker compose -f docker-compose.backend.yml logs -f"
echo "  Статус:   docker compose -f docker-compose.backend.yml ps"
echo "  Остановка: docker compose -f docker-compose.backend.yml down"
echo "  Перезапуск: docker compose -f docker-compose.backend.yml restart"