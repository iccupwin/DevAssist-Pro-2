#!/bin/bash
# ===========================================
# DevAssist Pro - Исправление конфликта портов
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
log "🔧 Исправление конфликта портов"
echo "========================================"
echo ""

log "Проверяем что занимает порт 80..."
if command -v lsof &> /dev/null; then
    lsof -i :80 || true
else
    netstat -tulpn | grep :80 || true
fi

log "Останавливаем все контейнеры DevAssist..."
docker-compose -f docker-compose.fullstack.yml down 2>/dev/null || true
docker-compose -f docker-compose.simple.yml down 2>/dev/null || true

log "Останавливаем системный nginx если запущен..."
systemctl stop nginx 2>/dev/null || true
systemctl disable nginx 2>/dev/null || true

log "Останавливаем Apache если запущен..."
systemctl stop apache2 2>/dev/null || true
systemctl stop httpd 2>/dev/null || true
systemctl disable apache2 2>/dev/null || true
systemctl disable httpd 2>/dev/null || true

log "Проверяем свободен ли порт 80 теперь..."
if ! netstat -tulpn | grep -q ":80 "; then
    success "✅ Порт 80 свободен!"
else
    warning "⚠️ Порт 80 все еще занят. Пробуем использовать альтернативный порт..."
    
    # Меняем порт на 8080
    log "Настраиваем использование порта 8080..."
    sed -i 's/- "80:80"/- "8080:80"/' docker-compose.fullstack.yml
    sed -i 's/- "80:80"/- "8080:80"/' docker-compose.simple.yml
    
    warning "Система будет доступна на порту 8080 вместо 80"
fi

log "Запускаем DevAssist Pro заново..."
./start-fullstack.sh

echo ""
log "Ожидаем запуска..."
sleep 10

# Проверяем какой порт используется
if netstat -tulpn | grep -q ":80 " && docker-compose -f docker-compose.fullstack.yml ps | grep -q "Up"; then
    PORT=80
elif netstat -tulpn | grep -q ":8080 " && docker-compose -f docker-compose.fullstack.yml ps | grep -q "Up"; then
    PORT=8080
else
    PORT="неизвестен"
fi

if [ "$PORT" != "неизвестен" ]; then
    success "✅ Система запущена на порту $PORT!"
    
    # Определяем внешний IP
    EXTERNAL_IP=$(curl -s ifconfig.me 2>/dev/null || curl -s ipinfo.io/ip 2>/dev/null || echo "YOUR_SERVER_IP")
    
    echo ""
    echo "========================================"
    success "🎉 ПРОБЛЕМА РЕШЕНА!"
    echo "========================================"
    echo ""
    echo "📊 Система доступна по адресам:"
    echo "   • Главная:    http://$EXTERNAL_IP:$PORT"
    echo "   • Health:     http://$EXTERNAL_IP:$PORT/health"
    echo "   • API Docs:   http://$EXTERNAL_IP:$PORT/api/docs"
    echo ""
else
    error "❌ Не удалось запустить систему"
    echo ""
    log "Показываем логи для диагностики:"
    docker-compose -f docker-compose.fullstack.yml logs --tail=20
fi