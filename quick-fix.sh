#!/bin/bash

# Quick fix для запуска DevAssist Pro
# Исправляет проблемы с ADMIN_PASSWORD и nginx

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

log "🔧 Quick Fix для DevAssist Pro"

# Остановка всех контейнеров
log "Остановка существующих контейнеров..."
docker compose -f docker-compose.unified.yml down 2>/dev/null || true
docker stop $(docker ps -aq) 2>/dev/null || true

# Обновление docker-compose.unified.yml с исправлениями
log "Обновление конфигурации с исправлениями..."
sed -i '/# Server Configuration/a\      # ADMIN PASSWORD - ВАЖНО!\n      ADMIN_PASSWORD: admin_password_123' docker-compose.unified.yml 2>/dev/null || \
echo "      ADMIN_PASSWORD: admin_password_123" >> docker-compose.unified.yml

# Запуск только основных сервисов (без nginx пока)
log "Запуск основных сервисов..."
docker compose -f docker-compose.unified.yml up -d postgres redis

# Ждем готовности БД
log "Ожидание готовности баз данных..."
sleep 15

# Запуск backend с ADMIN_PASSWORD
log "Запуск backend с ADMIN_PASSWORD..."
docker compose -f docker-compose.unified.yml up -d backend

# Проверка backend
log "Проверка backend..."
sleep 10
if docker compose -f docker-compose.unified.yml logs backend | grep -q "Application startup complete"; then
    info "✅ Backend запустился успешно!"
else
    warning "⚠️  Backend может требовать больше времени для запуска"
    docker compose -f docker-compose.unified.yml logs --tail=20 backend
fi

# Запуск frontend
log "Запуск frontend..."
docker compose -f docker-compose.unified.yml up -d frontend

# Проверка статуса
log "Проверка статуса сервисов..."
sleep 10

# Backend health check
if curl -f -s "http://localhost:8000/health" > /dev/null 2>&1; then
    info "✅ Backend API работает на порту 8000"
else
    warning "⚠️  Backend API еще не готов, проверьте через минуту"
fi

# Frontend check
if curl -f -s "http://localhost:3000" > /dev/null 2>&1; then
    info "✅ Frontend работает на порту 3000"
else
    warning "⚠️  Frontend еще не готов, проверьте через минуту"
fi

# Показать статус
log "Текущий статус:"
docker compose -f docker-compose.unified.yml ps

echo
info "🎉 Quick Fix применен!"
echo
info "📍 Доступ к сервисам:"
info "   Frontend:     http://46.149.71.162:3000/"
info "   Backend API:  http://46.149.71.162:8000/"
info "   API Docs:     http://46.149.71.162:8000/docs"
info "   Health:       http://46.149.71.162:8000/health"
echo
info "📝 Учетные данные администратора:"
info "   Email:    admin@devassist.pro"
info "   Password: admin_password_123"
echo
info "⚠️  ВАЖНО: Поменяйте пароль администратора после первого входа!"
echo
info "🔧 Если сервисы еще не готовы, подождите 1-2 минуты и проверьте снова"