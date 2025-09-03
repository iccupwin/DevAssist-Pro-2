#!/bin/bash

# DevAssist Pro - Проверка статуса монолитного backend'а
# Автор: Claude Code Assistant

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_step() {
    echo -e "${BLUE}[CHECK]${NC} $1"
}

echo "🔍 DevAssist Pro - Диагностика монолитного Backend"
echo "=" * 60

# Определяем команду для docker compose
if command -v docker-compose &> /dev/null; then
    DOCKER_COMPOSE="docker-compose"
elif docker compose version &> /dev/null; then
    DOCKER_COMPOSE="docker compose"
else
    log_error "Docker Compose не найден!"
    exit 1
fi

# Переход в директорию backend
if [ -f "backend/docker-compose.monolith.yml" ]; then
    cd backend
else
    log_error "Файл backend/docker-compose.monolith.yml не найден!"
    exit 1
fi

log_step "Проверка статуса контейнеров..."
$DOCKER_COMPOSE -f docker-compose.monolith.yml ps

echo ""
log_step "Проверка здоровья приложения..."
if curl -s http://localhost:8000/health > /dev/null 2>&1; then
    log_info "✅ Backend доступен на http://localhost:8000"
    
    # Получаем детальную информацию о здоровье
    echo ""
    echo "📊 Статус API:"
    curl -s http://localhost:8000/health | python3 -m json.tool 2>/dev/null || curl -s http://localhost:8000/health
    
    echo ""
    echo "📊 Статус AI провайдеров:"
    curl -s http://localhost:8000/api/llm/health | python3 -m json.tool 2>/dev/null || curl -s http://localhost:8000/api/llm/health
    
    echo ""
    echo "📊 Статус системы:"
    curl -s http://localhost:8000/api/admin/status | python3 -m json.tool 2>/dev/null || curl -s http://localhost:8000/api/admin/status
    
else
    log_error "❌ Backend недоступен на http://localhost:8000"
    echo ""
    log_step "Показ логов последних 50 строк:"
    $DOCKER_COMPOSE -f docker-compose.monolith.yml logs --tail=50
fi

echo ""
log_step "Использование ресурсов:"
docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}" $(docker ps --filter "name=devassist_" --format "{{.Names}}") 2>/dev/null || log_warn "Контейнеры не найдены"

echo ""
echo "🔗 Полезные ссылки:"
echo "   • Главная:      http://localhost:8000/"
echo "   • Health:       http://localhost:8000/health"
echo "   • API Docs:     http://localhost:8000/docs"
echo "   • Admin:        http://localhost:8000/api/admin/status"
echo ""