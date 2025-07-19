#!/bin/bash
# ===========================================
# DevAssist Pro - Fullstack Stop Script
# ===========================================

set -e

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log "🛑 Останавливаем DevAssist Pro Fullstack Application..."

# Останавливаем контейнеры
if [ "$1" = "--clean" ]; then
    log "Полная очистка: остановка и удаление всех данных..."
    docker-compose -f docker-compose.fullstack.yml down --volumes --remove-orphans
    docker system prune -f
    rm -rf data/
else
    log "Останавливаем контейнеры..."
    docker-compose -f docker-compose.fullstack.yml down
fi

success "✅ DevAssist Pro Fullstack Application остановлен"