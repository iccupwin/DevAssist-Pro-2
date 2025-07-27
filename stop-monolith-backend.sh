#!/bin/bash

# DevAssist Pro - Остановка монолитного backend'а
# Автор: Claude Code Assistant

set -e

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Проверка что скрипт запущен из правильной директории
if [ ! -f "backend/docker-compose.monolith.yml" ]; then
    log_error "Файл backend/docker-compose.monolith.yml не найден!"
    log_error "Запустите скрипт из корневой директории проекта DevAssist-Pro"
    exit 1
fi

log_info "🛑 Остановка DevAssist Pro - Монолитный Backend"

# Определяем команду для docker compose
if command -v docker-compose &> /dev/null; then
    DOCKER_COMPOSE="docker-compose"
else
    DOCKER_COMPOSE="docker compose"
fi

cd backend

log_step "Остановка контейнеров..."
$DOCKER_COMPOSE -f docker-compose.monolith.yml down

log_step "Очистка неиспользуемых ресурсов..."
docker system prune -f

log_info "✅ DevAssist Pro Backend успешно остановлен!"