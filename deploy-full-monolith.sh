#!/bin/bash

# DevAssist Pro - Развертывание ПОЛНОГО монолитного backend'а на сервере
# Переключение с app_simple.py на app.py

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

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

echo "🔄 DevAssist Pro - Переключение на ПОЛНЫЙ монолитный backend"
echo "=" * 70

# Проверка что мы в правильной директории
if [ ! -f "backend/docker-compose.monolith.yml" ]; then
    log_error "Файл backend/docker-compose.monolith.yml не найден!"
    log_error "Запустите скрипт из корневой директории проекта DevAssist-Pro"
    exit 1
fi

# Определяем команду для docker compose
if command -v docker-compose &> /dev/null; then
    DOCKER_COMPOSE="docker-compose"
else
    DOCKER_COMPOSE="docker compose"
fi

log_step "Остановка текущих сервисов..."

# Останавливаем все возможные запущенные сервисы
pkill -f "python.*app" 2>/dev/null || true
pkill -f "uvicorn" 2>/dev/null || true

# Останавливаем Docker контейнеры если есть
cd backend
$DOCKER_COMPOSE down 2>/dev/null || true
$DOCKER_COMPOSE -f docker-compose.dev.yml down 2>/dev/null || true
$DOCKER_COMPOSE -f docker-compose.monolith.yml down 2>/dev/null || true

log_info "✅ Все сервисы остановлены"

log_step "Проверка переменных окружения..."
cd ..

if [ ! -f ".env" ]; then
    log_warn "Файл .env не найден. Создаем из .env.example..."
    if [ -f ".env.example" ]; then
        cp .env.example .env
        log_info "✅ Файл .env создан"
        log_warn "⚠️  ВАЖНО: Настройте API ключи в .env файле!"
    else
        log_error "Файл .env.example не найден!"
        exit 1
    fi
fi

log_step "Проверка конфигурации Docker Compose..."
cd backend

# Проверяем валидность конфигурации
if ! $DOCKER_COMPOSE -f docker-compose.monolith.yml config >/dev/null 2>&1; then
    log_error "❌ Конфигурация docker-compose.monolith.yml невалидна!"
    log_error "Проверьте синтаксис файла"
    exit 1
fi

log_info "✅ Конфигурация Docker Compose валидна"

log_step "Очистка старых данных и образов..."
docker system prune -f >/dev/null 2>&1 || true

log_step "Сборка монолитного образа..."
$DOCKER_COMPOSE -f docker-compose.monolith.yml build --no-cache

log_step "Запуск полного монолитного backend..."
$DOCKER_COMPOSE -f docker-compose.monolith.yml up -d

log_step "Ожидание запуска сервисов..."
sleep 15

log_step "Проверка статуса контейнеров..."
$DOCKER_COMPOSE -f docker-compose.monolith.yml ps

# Проверка здоровья приложения
log_step "Проверка здоровья приложения..."
max_attempts=60
attempt=1

while [ $attempt -le $max_attempts ]; do
    if curl -s http://localhost:8000/health >/dev/null 2>&1; then
        health_response=$(curl -s http://localhost:8000/health)
        if echo "$health_response" | grep -q "devassist-pro-monolith"; then
            log_info "✅ ПОЛНЫЙ монолитный backend успешно запущен!"
            break
        else
            log_warn "Все еще запущена упрощенная версия, ждем..."
        fi
    else
        log_warn "Попытка $attempt/$max_attempts: Backend еще не готов..."
    fi
    sleep 2
    ((attempt++))
done

if [ $attempt -gt $max_attempts ]; then
    log_error "❌ Backend не смог запуститься за разумное время"
    log_error "Проверьте логи: $DOCKER_COMPOSE -f docker-compose.monolith.yml logs"
    exit 1
fi

# Проверяем API endpoints
log_step "Проверка API endpoints..."

test_endpoint() {
    local endpoint="$1"
    local description="$2"
    
    if curl -s "http://localhost:8000$endpoint" >/dev/null 2>&1; then
        log_info "✅ $endpoint - OK"
    else
        log_warn "⚠️  $endpoint - недоступен"
    fi
}

test_endpoint "/health" "Health check"
test_endpoint "/api" "API информация"
test_endpoint "/api/admin/status" "Admin статус"
test_endpoint "/api/llm/providers" "AI провайдеры"
test_endpoint "/api/analytics/dashboard" "Аналитика"

echo ""
log_info "🎉 Развертывание полного монолитного backend завершено!"
echo "=" * 70
echo ""

# Показываем финальную информацию
final_health=$(curl -s http://localhost:8000/health 2>/dev/null || echo '{"service":"unknown"}')
service_name=$(echo "$final_health" | grep -o '"service":"[^"]*"' | cut -d'"' -f4)

if [ "$service_name" = "devassist-pro-monolith" ]; then
    log_info "✅ УСПЕХ: Запущен полный монолитный backend"
else
    log_warn "⚠️  ВНИМАНИЕ: Возможно, запущена не та версия"
    log_warn "   Текущий сервис: $service_name"
    log_warn "   Ожидался: devassist-pro-monolith"
fi

echo ""
echo "🌐 Доступные endpoints:"
echo "   • Главная:      http://localhost:8000/"
echo "   • Health:       http://localhost:8000/health"  
echo "   • API Docs:     http://localhost:8000/docs"
echo "   • Admin:        http://localhost:8000/api/admin/status"
echo "   • AI провайдеры: http://localhost:8000/api/llm/providers"
echo "   • Аналитика:    http://localhost:8000/api/analytics/dashboard"
echo ""

echo "📋 Управление:"
echo "   • Логи:         cd backend && $DOCKER_COMPOSE -f docker-compose.monolith.yml logs -f"
echo "   • Остановка:    cd backend && $DOCKER_COMPOSE -f docker-compose.monolith.yml down"
echo "   • Перезапуск:   cd backend && $DOCKER_COMPOSE -f docker-compose.monolith.yml restart"
echo ""

log_info "✨ Готово! Полный монолитный backend DevAssist Pro запущен!"

# Показываем последние логи
log_step "Последние логи приложения:"
$DOCKER_COMPOSE -f docker-compose.monolith.yml logs --tail=10 app