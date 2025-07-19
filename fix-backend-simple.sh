#!/bin/bash
# ===========================================
# DevAssist Pro - Быстрое исправление backend
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

echo ""
echo "========================================"
log "🔧 Исправление backend API"
echo "========================================"
echo ""

log "Копируем упрощенный backend в контейнер..."
docker cp backend/app_simple.py devassist_app_simple:/app/app_simple.py

log "Меняем запуск на упрощенную версию..."
docker exec devassist_app_simple bash -c "supervisorctl stop backend"
docker exec devassist_app_simple bash -c "sed -i 's/python app.py/python app_simple.py/' /etc/supervisor/conf.d/supervisord.conf"
docker exec devassist_app_simple bash -c "supervisorctl reread"
docker exec devassist_app_simple bash -c "supervisorctl update"
docker exec devassist_app_simple bash -c "supervisorctl start backend"

echo ""
log "Ожидаем запуска backend..."
sleep 5

log "Проверяем статус..."
docker exec devassist_app_simple supervisorctl status

echo ""
log "Проверяем доступность API..."

# Определяем IP
IP=$(curl -s ifconfig.me 2>/dev/null || echo "YOUR_SERVER_IP")

# Проверяем эндпоинты
if curl -f -s http://localhost:8080/api/health > /dev/null 2>&1; then
    success "✅ API теперь доступен!"
    echo ""
    echo "📊 API endpoints:"
    echo "   • Health: http://$IP:8080/api/health"
    echo "   • Docs:   http://$IP:8080/api/docs"
    echo "   • KP:     http://$IP:8080/api/kp-analyzer/"
    echo ""
    
    # Показываем ответ health check
    echo "Health check response:"
    curl -s http://localhost:8080/api/health | python3 -m json.tool 2>/dev/null || curl -s http://localhost:8080/api/health
else
    echo "❌ API все еще недоступен"
    echo ""
    echo "Проверяем логи:"
    docker exec devassist_app_simple tail -20 /var/log/devassist/backend.err.log
fi