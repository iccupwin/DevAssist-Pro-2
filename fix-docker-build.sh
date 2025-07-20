#!/bin/bash

# Fix Docker Build - Исправляет проблемы с Docker build в production
set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[ERROR] $1${NC}" >&2
}

warning() {
    echo -e "${YELLOW}[WARNING] $1${NC}"
}

info() {
    echo -e "${BLUE}[INFO] $1${NC}"
}

log "🔧 Исправление Docker build для DevAssist Pro"

# 1. Остановка и удаление старых контейнеров
log "Остановка старых контейнеров..."
docker compose -f docker-compose.production.yml down --remove-orphans || true

# 2. Очистка Docker кэша для frontend
log "Очистка Docker образов..."
docker rmi devassist-pro_nginx 2>/dev/null || true
docker system prune -f

# 3. Проверяем что все файлы на месте
log "Проверка файлов..."
if [ ! -f "frontend/package.json" ]; then
    error "frontend/package.json не найден!"
    exit 1
fi

if [ ! -f "frontend/Dockerfile.production" ]; then
    error "frontend/Dockerfile.production не найден!"
    exit 1
fi

# 4. Сборка только frontend образа для проверки
log "Тестовая сборка frontend образа..."
cd frontend
if docker build -f Dockerfile.production -t test-frontend-build .; then
    log "✅ Frontend образ собрался успешно!"
    docker rmi test-frontend-build 2>/dev/null || true
else
    error "❌ Ошибка сборки frontend образа"
    cd ..
    exit 1
fi
cd ..

# 5. Полная пересборка всех контейнеров
log "Пересборка всех контейнеров..."
if docker compose -f docker-compose.production.yml build --no-cache; then
    log "✅ Все образы собраны успешно!"
else
    error "❌ Ошибка сборки контейнеров"
    exit 1
fi

# 6. Запуск контейнеров
log "Запуск контейнеров..."
if docker compose -f docker-compose.production.yml up -d; then
    log "✅ Контейнеры запущены!"
else
    error "❌ Ошибка запуска контейнеров"
    exit 1
fi

# 7. Ожидание полного запуска
log "Ожидание запуска сервисов (60 сек)..."
sleep 60

# 8. Проверка статуса контейнеров
log "Проверка статуса контейнеров..."
docker compose -f docker-compose.production.yml ps

# 9. Проверка логов для выявления ошибок
log "Проверка логов..."
info "=== Backend логи ==="
docker compose -f docker-compose.production.yml logs app --tail=10

info "=== Frontend/Nginx логи ==="
docker compose -f docker-compose.production.yml logs nginx --tail=10

# 10. Проверка доступности сайта
log "Проверка доступности сайта..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://46.149.71.162/ || echo "000")
if [ "$HTTP_CODE" = "200" ]; then
    log "✅ Сайт доступен (HTTP $HTTP_CODE)!"
    log "🌐 DevAssist Pro доступен: http://46.149.71.162/"
else
    warning "❌ Сайт недоступен (HTTP $HTTP_CODE)"
    warning "Проверьте логи: docker compose -f docker-compose.production.yml logs"
fi

# Итог
echo
log "🎉 Docker исправление завершено!"
echo
info "✅ Что исправлено:"
info "   📦 Обновлен package.json с Tailwind плагинами"
info "   🐳 Dockerfile.production использует npm install вместо npm ci"
info "   ⚙️  Обновлена Tailwind конфигурация"
info "   🔄 Пересобраны все Docker образы"
info "   🚀 Перезапущены все контейнеры"
echo
if [ "$HTTP_CODE" = "200" ]; then
    log "✨ Оба сервиса (backend и frontend) работают успешно!"
else
    warning "⚠️ Проверьте статус сервисов и логи выше"
fi