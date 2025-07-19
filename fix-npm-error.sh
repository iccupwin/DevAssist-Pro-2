#!/bin/bash
# ===========================================
# DevAssist Pro - Быстрое исправление npm ошибки
# ===========================================

set -e

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "${BLUE}[FIX]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

echo ""
echo "========================================"
log "🚨 Исправление npm build ошибки"
echo "========================================"
echo ""

# Проверяем что мы в правильной директории
if [ ! -f "docker-compose.simple.yml" ] || [ ! -f "Dockerfile.fullstack.simple" ]; then
    error "Не найдены упрощенные Docker файлы!"
    error "Убедитесь что вы в директории /opt/devassist-pro"
    exit 1
fi

log "Останавливаем текущие контейнеры..."
./stop-fullstack.sh 2>/dev/null || true

log "Заменяем Docker файлы на упрощенные версии..."

# Создаем бекап текущих файлов
if [ -f "Dockerfile.fullstack" ]; then
    cp Dockerfile.fullstack Dockerfile.fullstack.backup
    log "Создан бекап: Dockerfile.fullstack.backup"
fi

if [ -f "docker-compose.fullstack.yml" ]; then
    cp docker-compose.fullstack.yml docker-compose.fullstack.yml.backup
    log "Создан бекап: docker-compose.fullstack.yml.backup"
fi

# Копируем упрощенные версии
cp Dockerfile.fullstack.simple Dockerfile.fullstack
cp docker-compose.simple.yml docker-compose.fullstack.yml

success "Упрощенные файлы скопированы"

log "Проверяем .env файл..."
if [ ! -f ".env" ]; then
    if [ -f ".env.fullstack.example" ]; then
        cp .env.fullstack.example .env
        warning ".env файл создан из примера. Не забудьте настроить ANTHROPIC_API_KEY!"
    else
        error ".env файл не найден!"
        exit 1
    fi
fi

log "Очищаем Docker кеш..."
docker system prune -f 2>/dev/null || true

log "Запускаем упрощенную версию..."
./start-fullstack.sh --rebuild

echo ""
log "Ожидаем запуска контейнеров..."
sleep 15

log "Проверяем статус..."
if docker-compose -f docker-compose.fullstack.yml ps | grep -q "Up"; then
    success "✅ Контейнеры запущены!"
    
    echo ""
    log "Проверяем health checks..."
    
    # Проверяем основной health check
    if curl -f -s http://localhost:80/health > /dev/null 2>&1; then
        success "✅ HTTP health check прошел"
    else
        warning "⚠️ HTTP health check не прошел (возможно нужно больше времени)"
    fi
    
    # Проверяем API
    if curl -f -s http://localhost:80/api/health > /dev/null 2>&1; then
        success "✅ API health check прошел"
    else
        warning "⚠️ API health check не прошел (возможно нужно больше времени)"
    fi
    
else
    error "❌ Контейнеры не запустились!"
    echo ""
    log "Показываем логи для диагностики:"
    docker-compose -f docker-compose.fullstack.yml logs --tail=20
    exit 1
fi

echo ""
echo "========================================"
success "🎉 ИСПРАВЛЕНИЕ ЗАВЕРШЕНО!"
echo "========================================"
echo ""

# Определяем внешний IP
EXTERNAL_IP=$(curl -s ifconfig.me 2>/dev/null || curl -s ipinfo.io/ip 2>/dev/null || echo "YOUR_SERVER_IP")

echo "📊 Система доступна по адресам:"
echo "   • Главная:    http://$EXTERNAL_IP"
echo "   • Health:     http://$EXTERNAL_IP/health"
echo "   • API Docs:   http://$EXTERNAL_IP/api/docs"
echo ""
echo "🔧 Управление системой:"
echo "   • Статус:     docker-compose -f docker-compose.fullstack.yml ps"
echo "   • Логи:       docker-compose -f docker-compose.fullstack.yml logs -f"
echo "   • Остановка:  ./stop-fullstack.sh"
echo ""
warning "💡 Это упрощенная версия без React frontend"
warning "💡 Полный frontend будет добавлен после исправления npm проблем"
echo ""