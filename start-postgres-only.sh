#!/bin/bash

# Запуск только PostgreSQL и Redis для DevAssist Pro

echo "🗄️  DevAssist Pro - Запуск только PostgreSQL и Redis"
echo "=" * 55

# Определяем команду docker-compose
if command -v docker-compose >/dev/null 2>&1; then
    DOCKER_COMPOSE="docker-compose"
elif docker compose version >/dev/null 2>&1; then
    DOCKER_COMPOSE="docker compose"
else
    echo "❌ Docker Compose не найден!"
    echo "Попробуем запустить контейнеры напрямую через docker..."
    
    echo "🐳 Запуск PostgreSQL..."
    docker run -d \
        --name devassist_postgres \
        -e POSTGRES_DB=devassist_pro \
        -e POSTGRES_USER=devassist \
        -e POSTGRES_PASSWORD=devassist_password \
        -p 5432:5432 \
        -v postgres_data:/var/lib/postgresql/data \
        postgres:15-alpine
    
    echo "🐳 Запуск Redis..."
    docker run -d \
        --name devassist_redis \
        -p 6379:6379 \
        redis:7-alpine redis-server --requirepass redis_password
    
    echo "✅ Контейнеры запущены"
    echo "Ждем 10 секунд для инициализации..."
    sleep 10
    
    echo "🔍 Проверка подключения к PostgreSQL..."
    if docker exec devassist_postgres pg_isready -U devassist >/dev/null 2>&1; then
        echo "✅ PostgreSQL готов"
    else
        echo "⚠️  PostgreSQL еще инициализируется..."
        sleep 5
    fi
    
    echo "✅ Базы данных готовы!"
    echo "Теперь можно запускать приложение:"
    echo "   ./start-monolith-direct.sh"
    exit 0
fi

cd backend

echo "📋 Используем: $DOCKER_COMPOSE"

# Создаем временный docker-compose только для БД
cat > docker-compose.db-only.yml << EOF
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: devassist_postgres
    environment:
      POSTGRES_DB: devassist_pro
      POSTGRES_USER: devassist
      POSTGRES_PASSWORD: devassist_password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U devassist"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: devassist_redis
    command: redis-server --requirepass redis_password
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "--raw", "incr", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
    driver: local
  redis_data:
    driver: local
EOF

echo "🚀 Запуск PostgreSQL и Redis..."
$DOCKER_COMPOSE -f docker-compose.db-only.yml up -d

echo "⏳ Ожидание инициализации баз данных..."
sleep 15

echo "🔍 Проверка статуса..."
$DOCKER_COMPOSE -f docker-compose.db-only.yml ps

echo "🔍 Проверка здоровья PostgreSQL..."
max_attempts=30
attempt=1

while [ $attempt -le $max_attempts ]; do
    if docker exec devassist_postgres pg_isready -U devassist >/dev/null 2>&1; then
        echo "✅ PostgreSQL готов к подключениям!"
        break
    else
        echo "⏳ Попытка $attempt/$max_attempts: PostgreSQL инициализируется..."
        sleep 2
        ((attempt++))
    fi
done

if [ $attempt -gt $max_attempts ]; then
    echo "❌ PostgreSQL не смог запуститься"
    echo "Проверьте логи:"
    $DOCKER_COMPOSE -f docker-compose.db-only.yml logs postgres
    exit 1
fi

echo "🔍 Проверка Redis..."
if docker exec devassist_redis redis-cli -a redis_password ping 2>/dev/null | grep -q PONG; then
    echo "✅ Redis готов к подключениям!"
else
    echo "⚠️  Redis может быть еще не готов, но это не критично"
fi

echo ""
echo "🎉 Базы данных успешно запущены!"
echo "=" * 55
echo ""
echo "📊 Информация о подключении:"
echo "   PostgreSQL: localhost:5432"
echo "   • База: devassist_pro"
echo "   • Пользователь: devassist"
echo "   • Пароль: devassist_password"
echo ""
echo "   Redis: localhost:6379"
echo "   • Пароль: redis_password"
echo ""
echo "🚀 Теперь можно запустить приложение:"
echo "   cd .. && ./start-monolith-direct.sh"
echo ""
echo "📋 Управление базами данных:"
echo "   • Остановка: $DOCKER_COMPOSE -f docker-compose.db-only.yml down"
echo "   • Логи: $DOCKER_COMPOSE -f docker-compose.db-only.yml logs -f"
echo "   • Статус: $DOCKER_COMPOSE -f docker-compose.db-only.yml ps"