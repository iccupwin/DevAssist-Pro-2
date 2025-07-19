#!/bin/bash
# ===========================================
# DevAssist Pro - Исправление недоступности API
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
log "🔧 Исправление доступности API"
echo "========================================"
echo ""

log "Проверяем статус контейнеров..."
docker-compose -f docker-compose.fullstack.yml ps

log "Проверяем логи backend сервиса..."
docker-compose -f docker-compose.fullstack.yml logs app | tail -20

log "Проверяем доступность API внутри контейнера..."
docker-compose -f docker-compose.fullstack.yml exec app curl -s http://localhost:8000/health || echo "Backend не отвечает на порту 8000"

log "Проверяем процессы внутри контейнера..."
docker-compose -f docker-compose.fullstack.yml exec app ps aux | grep -E "(python|supervisor|nginx)" || true

log "Перезапускаем backend внутри контейнера..."
docker-compose -f docker-compose.fullstack.yml exec app supervisorctl restart backend || true

echo ""
log "Ждем 10 секунд для запуска backend..."
sleep 10

log "Проверяем API еще раз..."
if curl -f -s http://localhost:8080/api/health > /dev/null 2>&1; then
    success "✅ API теперь доступен!"
    curl -s http://localhost:8080/api/health | python3 -m json.tool 2>/dev/null || curl -s http://localhost:8080/api/health
else
    warning "⚠️ API все еще недоступен. Проверяем подробные логи..."
    
    log "Логи supervisor:"
    docker-compose -f docker-compose.fullstack.yml exec app cat /var/log/supervisor/supervisord.log | tail -20
    
    log "Логи backend:"
    docker-compose -f docker-compose.fullstack.yml exec app cat /var/log/devassist/backend.err.log | tail -20 || true
    docker-compose -f docker-compose.fullstack.yml exec app cat /var/log/devassist/backend.out.log | tail -20 || true
fi

echo ""
echo "========================================"
log "📊 Текущий статус системы:"
echo "========================================"

# Определяем IP
IP=$(curl -s ifconfig.me 2>/dev/null || echo "YOUR_SERVER_IP")

echo ""
echo "🌐 Веб-интерфейс доступен: http://$IP:8080 ✅"
echo ""

# Проверяем все эндпоинты
endpoints=(
    "/health"
    "/api/health"
    "/api/docs"
    "/api/kp-analyzer/"
)

for endpoint in "${endpoints[@]}"; do
    if curl -f -s "http://localhost:8080$endpoint" > /dev/null 2>&1; then
        echo "✅ http://$IP:8080$endpoint - доступен"
    else
        echo "❌ http://$IP:8080$endpoint - недоступен"
    fi
done

echo ""
log "💡 Если API все еще недоступен, попробуйте:"
echo "   1. Проверить .env файл (особенно ANTHROPIC_API_KEY)"
echo "   2. Перезапустить контейнер: docker-compose -f docker-compose.fullstack.yml restart app"
echo "   3. Проверить логи: docker-compose -f docker-compose.fullstack.yml logs -f app"