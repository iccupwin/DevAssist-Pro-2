#!/bin/bash

# Быстрое исправление проблемы с ADMIN_PASSWORD

echo "🔧 Исправление проблемы с ADMIN_PASSWORD..."

# Остановить backend
echo "🛑 Остановка backend..."
docker compose -f docker-compose.backend.yml down

# Проверить есть ли .env.production
if [ ! -f ".env.production" ]; then
    echo "📝 Создание .env.production..."
    cp .env.production.example .env.production
fi

# Добавить ADMIN_PASSWORD если его нет
if ! grep -q "ADMIN_PASSWORD=" .env.production; then
    echo "🔑 Добавление ADMIN_PASSWORD..."
    ADMIN_PWD=$(openssl rand -base64 32 | tr -d /=+ | cut -c -25)
    echo "ADMIN_PASSWORD=$ADMIN_PWD" >> .env.production
    echo "✅ ADMIN_PASSWORD добавлен"
else
    echo "✅ ADMIN_PASSWORD уже существует"
fi

# Проверить другие необходимые переменные
if grep -q "change_me" .env.production; then
    echo "🔄 Обновление паролей..."
    POSTGRES_PWD=$(openssl rand -base64 32 | tr -d /=+ | cut -c -25)
    REDIS_PWD=$(openssl rand -base64 32 | tr -d /=+ | cut -c -25)
    JWT_SECRET_VAL=$(openssl rand -base64 64 | tr -d /=+ | cut -c -50)
    
    sed -i "s/devassist_secure_password_2024_change_me/$POSTGRES_PWD/g" .env.production
    sed -i "s/redis_secure_password_2024_change_me/$REDIS_PWD/g" .env.production
    sed -i "s/your_jwt_secret_key_minimum_32_characters_long_change_me_now/$JWT_SECRET_VAL/g" .env.production
    sed -i "s/admin_secure_password_2024_change_me/$ADMIN_PWD/g" .env.production
    
    echo "✅ Все пароли обновлены"
fi

# Показать текущие настройки (без паролей)
echo ""
echo "📋 Текущие настройки:"
grep -E "^(POSTGRES_PASSWORD|REDIS_PASSWORD|JWT_SECRET|ADMIN_PASSWORD)=" .env.production | sed 's/=.*/=***/' || echo "Переменные не найдены"

# Перезапустить backend
echo ""
echo "🚀 Перезапуск backend..."
docker compose -f docker-compose.backend.yml up -d

echo ""
echo "⏳ Ожидание запуска (30 секунд)..."
sleep 30

# Проверить статус
echo ""
echo "📊 Статус сервисов:"
docker compose -f docker-compose.backend.yml ps

# Проверить health
echo ""
echo "🩺 Проверка работоспособности:"
if curl -f -s --max-time 10 http://localhost:8000/health >/dev/null 2>&1; then
    echo "✅ Backend API работает: http://46.149.71.162:8000"
    echo "✅ API Docs доступны: http://46.149.71.162:8000/docs"
else
    echo "❌ Backend API всё ещё не отвечает"
    echo "📋 Проверьте логи: docker compose -f docker-compose.backend.yml logs backend"
fi

echo ""
echo "🎉 Исправление завершено!"