#!/bin/bash

# DevAssist Pro - Простой скрипт для быстрого запуска
# Использует существующие конфигурации без сложной логики

set -e

# Цвета для вывода
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Определяем команду Docker Compose
if command -v "docker" >/dev/null 2>&1 && docker compose version >/dev/null 2>&1; then
    DOCKER_CMD="docker compose"
    print_info "Используем Docker Compose V2"
elif command -v "docker-compose" >/dev/null 2>&1; then
    DOCKER_CMD="docker-compose"
    print_info "Используем Docker Compose V1"
else
    print_error "Docker Compose не найден!"
    exit 1
fi

# Останавливаем существующие контейнеры
print_info "Останавливаем существующие сервисы..."
$DOCKER_CMD down 2>/dev/null || true
$DOCKER_CMD -f docker-compose.final.yml down 2>/dev/null || true
$DOCKER_CMD -f docker-compose.production.yml down 2>/dev/null || true

# Определяем какой файл использовать
COMPOSE_FILE=""
if [ -f "docker-compose.final.yml" ]; then
    COMPOSE_FILE="docker-compose.final.yml"
    print_info "Используем docker-compose.final.yml"
elif [ -f "docker-compose.production.yml" ]; then
    COMPOSE_FILE="docker-compose.production.yml"
    print_info "Используем docker-compose.production.yml"
elif [ -f "docker-compose.monolith.yml" ]; then
    COMPOSE_FILE="docker-compose.monolith.yml"
    print_info "Используем docker-compose.monolith.yml"
else
    COMPOSE_FILE="docker-compose.yml"
    print_info "Используем docker-compose.yml"
fi

# Создаем .env если его нет
if [ ! -f ".env" ]; then
    print_info "Создаем файл .env..."
    cat > .env << 'EOF'
# Database
POSTGRES_PASSWORD=devassist_secure_password_2024
REDIS_PASSWORD=redis_secure_password_2024

# Security  
JWT_SECRET=your_jwt_secret_key_minimum_32_characters_long_random_string

# AI APIs (добавьте ваши ключи)
ANTHROPIC_API_KEY=
OPENAI_API_KEY=
GOOGLE_API_KEY=
EOF
fi

# Создаем необходимые директории
mkdir -p logs data/postgres data/redis

# Запускаем сервисы
print_info "Запускаем сервисы..."
$DOCKER_CMD -f $COMPOSE_FILE up -d

print_success "Сервисы запущены!"
print_info "Frontend: http://localhost"
print_info "Backend API: http://localhost:8000"

# Показываем статус
sleep 5
print_info "Статус сервисов:"
$DOCKER_CMD -f $COMPOSE_FILE ps