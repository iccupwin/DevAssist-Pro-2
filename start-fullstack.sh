#!/bin/bash
# ===========================================
# DevAssist Pro - Fullstack Startup Script
# ===========================================

set -e

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Функция для вывода логов
log() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log "🚀 Starting DevAssist Pro Fullstack Application..."

# Проверяем наличие Docker
if ! command -v docker &> /dev/null; then
    error "Docker не установлен. Установите Docker и попробуйте снова."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    error "Docker Compose не установлен. Установите Docker Compose и попробуйте снова."
    exit 1
fi

# Проверяем наличие .env файла
if [ ! -f ".env" ]; then
    warning ".env файл не найден."
    if [ -f ".env.fullstack.example" ]; then
        log "Копируем .env.fullstack.example в .env..."
        cp .env.fullstack.example .env
        warning "Пожалуйста, отредактируйте .env файл с вашими настройками."
        log "Особенно важно настроить ANTHROPIC_API_KEY для работы AI функций."
    else
        error ".env.fullstack.example файл не найден. Не могу создать .env файл."
        exit 1
    fi
fi

# Проверяем наличие ANTHROPIC_API_KEY
if ! grep -q "ANTHROPIC_API_KEY=sk-ant-" .env; then
    warning "ANTHROPIC_API_KEY не настроен в .env файле."
    warning "AI функции могут не работать без этого ключа."
fi

# Создаем директории для данных
log "Создаем директории для данных..."
mkdir -p data/{postgres,redis,app,logs}
mkdir -p data/app/{uploads,reports,cache}

# Устанавливаем права доступа
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    sudo chown -R 1000:1000 data/
    chmod -R 755 data/
fi

# Останавливаем существующие контейнеры
log "Останавливаем существующие контейнеры..."
docker-compose -f docker-compose.fullstack.yml down --remove-orphans 2>/dev/null || true

# Очищаем старые образы (опционально)
if [ "$1" = "--clean" ]; then
    log "Очищаем старые Docker образы..."
    docker-compose -f docker-compose.fullstack.yml down --volumes --remove-orphans
    docker system prune -f
fi

# Собираем образы
log "Собираем Docker образы..."
if [ "$1" = "--rebuild" ] || [ "$1" = "--clean" ]; then
    docker-compose -f docker-compose.fullstack.yml build --no-cache
else
    docker-compose -f docker-compose.fullstack.yml build
fi

# Запускаем сервисы
log "Запускаем сервисы..."
docker-compose -f docker-compose.fullstack.yml up -d

# Ждем запуска сервисов
log "Ожидаем запуска сервисов..."
sleep 10

# Проверяем состояние сервисов
log "Проверяем состояние сервисов..."

check_service() {
    local service_name=$1
    local url=$2
    local max_attempts=30
    local attempt=1

    while [ $attempt -le $max_attempts ]; do
        if curl -f -s "$url" > /dev/null 2>&1; then
            success "$service_name готов!"
            return 0
        fi
        log "Ожидаем $service_name (попытка $attempt/$max_attempts)..."
        sleep 2
        ((attempt++))
    done

    error "$service_name не запустился в течение ожидаемого времени"
    return 1
}

# Проверяем сервисы
check_service "Fullstack Application" "http://localhost:80/health"

# Показываем статус контейнеров
log "Статус контейнеров:"
docker-compose -f docker-compose.fullstack.yml ps

# Показываем логи
log "Последние логи (нажмите Ctrl+C для выхода):"
echo ""
success "🎉 DevAssist Pro Fullstack Application успешно запущен!"
echo ""
echo "📊 Доступные URL:"
echo "   • Главная страница:    http://localhost:80"
echo "   • API документация:    http://localhost:80/api/docs"
echo "   • Health Check:        http://localhost:80/health"
echo ""
echo "🔧 Управление:"
echo "   • Логи:                docker-compose -f docker-compose.fullstack.yml logs -f"
echo "   • Остановка:           docker-compose -f docker-compose.fullstack.yml down"
echo "   • Перезапуск:          docker-compose -f docker-compose.fullstack.yml restart"
echo ""
echo "📁 Данные сохраняются в: ./data/"
echo ""

# Опционально показываем логи
if [ "$2" = "--logs" ] || [ "$1" = "--logs" ]; then
    docker-compose -f docker-compose.fullstack.yml logs -f
fi