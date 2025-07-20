#!/bin/bash

# DevAssist Pro - Запуск только backend через Docker (без compose)

set -e

echo "🔧 Запуск DevAssist Pro Backend..."

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Функция для логирования
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

# Проверка зависимостей
check_dependencies() {
    log "Проверка зависимостей..."
    
    # Проверка Docker
    if ! command -v docker &> /dev/null; then
        error "Docker не установлен. Установите Docker для продолжения."
        exit 1
    fi
    
    # Проверка что Docker daemon запущен
    if ! docker info &> /dev/null; then
        error "Docker daemon не запущен. Запустите Docker для продолжения."
        exit 1
    fi
    
    log "✅ Docker $(docker --version | cut -d' ' -f3 | tr -d ',') установлен"
}

# Остановка контейнеров при выходе
cleanup() {
    log "Остановка Docker контейнеров..."
    
    # Остановка контейнеров
    docker stop devassist_postgres 2>/dev/null || true
    docker stop devassist_redis 2>/dev/null || true
    docker stop devassist_backend 2>/dev/null || true
    
    # Удаление контейнеров
    docker rm devassist_postgres 2>/dev/null || true
    docker rm devassist_redis 2>/dev/null || true
    docker rm devassist_backend 2>/dev/null || true
    
    log "🛑 Backend контейнеры остановлены"
    exit 0
}

# Установка обработчика сигналов
trap cleanup SIGINT SIGTERM EXIT

# Создание Docker сети
create_network() {
    info "Создание Docker сети..."
    docker network create devassist_network 2>/dev/null || true
}

# Запуск PostgreSQL
start_postgres() {
    info "Запуск PostgreSQL..."
    
    # Остановка и удаление существующего контейнера
    docker stop devassist_postgres 2>/dev/null || true
    docker rm devassist_postgres 2>/dev/null || true
    
    # Запуск PostgreSQL
    docker run -d \
        --name devassist_postgres \
        --network devassist_network \
        -e POSTGRES_DB=devassist_pro \
        -e POSTGRES_USER=devassist \
        -e POSTGRES_PASSWORD=devassist_password \
        -p 5432:5432 \
        -v devassist_postgres_data:/var/lib/postgresql/data \
        postgres:15-alpine
    
    # Ожидание готовности
    info "Ожидание готовности PostgreSQL..."
    sleep 10
    
    # Проверка готовности
    for i in {1..30}; do
        if docker exec devassist_postgres pg_isready -U devassist &>/dev/null; then
            log "✅ PostgreSQL готов"
            return 0
        fi
        sleep 1
    done
    
    error "PostgreSQL не готов после 30 секунд"
    exit 1
}

# Запуск Redis
start_redis() {
    info "Запуск Redis..."
    
    # Остановка и удаление существующего контейнера
    docker stop devassist_redis 2>/dev/null || true
    docker rm devassist_redis 2>/dev/null || true
    
    # Запуск Redis
    docker run -d \
        --name devassist_redis \
        --network devassist_network \
        -p 6379:6379 \
        -v devassist_redis_data:/data \
        redis:7-alpine redis-server --requirepass redis_password
    
    # Ожидание готовности
    info "Ожидание готовности Redis..."
    sleep 5
    
    log "✅ Redis запущен"
}

# Сборка и запуск backend
start_backend() {
    info "Сборка и запуск backend..."
    
    cd backend
    
    # Проверка существования Dockerfile
    if [[ ! -f "Dockerfile.monolith" ]]; then
        error "Файл Dockerfile.monolith не найден в папке backend"
        exit 1
    fi
    
    # Остановка и удаление существующего контейнера
    docker stop devassist_backend 2>/dev/null || true
    docker rm devassist_backend 2>/dev/null || true
    
    # Сборка образа
    info "Сборка backend образа..."
    docker build -t devassist_backend -f Dockerfile.monolith .
    
    # Запуск backend
    info "Запуск backend контейнера..."
    docker run -d \
        --name devassist_backend \
        --network devassist_network \
        -p 8000:8000 \
        -e POSTGRES_URL=postgresql://devassist:devassist_password@devassist_postgres:5432/devassist_pro \
        -e REDIS_URL=redis://:redis_password@devassist_redis:6379/0 \
        -e DEBUG=false \
        -e LOG_LEVEL=INFO \
        -e ENVIRONMENT=production \
        -e ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001 \
        -e MAX_FILE_SIZE=50MB \
        -e SUPPORTED_FORMATS=pdf,docx,txt \
        -e USE_REAL_API=true \
        -v devassist_app_data:/app/data \
        devassist_backend
    
    # Ожидание готовности
    info "Ожидание готовности backend..."
    sleep 15
    
    # Проверка готовности
    for i in {1..30}; do
        if curl -s http://localhost:8000/health &>/dev/null; then
            log "✅ Backend готов"
            return 0
        fi
        sleep 1
    done
    
    warning "Backend может всё ещё запускаться. Проверьте http://localhost:8000"
    
    cd ..
}

# Отображение статуса
show_status() {
    log "📊 Статус Backend сервисов:"
    echo
    info "🔧 Запущенные контейнеры:"
    docker ps --filter "name=devassist_" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
    echo
    info "🌐 Доступные адреса:"
    echo "   • Backend API: http://localhost:8000"
    echo "   • PostgreSQL: localhost:5432"
    echo "   • Redis: localhost:6379"
    echo
    info "📖 Полезные команды:"
    echo "   • Логи backend: docker logs -f devassist_backend"
    echo "   • Логи PostgreSQL: docker logs -f devassist_postgres"
    echo "   • Логи Redis: docker logs -f devassist_redis"
    echo "   • Остановка: Ctrl+C"
    echo
}

# Мониторинг сервисов
monitor_services() {
    log "🔍 Мониторинг backend сервисов..."
    
    while true; do
        # Проверка статуса контейнеров
        if ! docker ps --filter "name=devassist_postgres" --filter "status=running" | grep -q devassist_postgres; then
            error "PostgreSQL контейнер остановлен!"
            break
        fi
        
        if ! docker ps --filter "name=devassist_redis" --filter "status=running" | grep -q devassist_redis; then
            error "Redis контейнер остановлен!"
            break
        fi
        
        if ! docker ps --filter "name=devassist_backend" --filter "status=running" | grep -q devassist_backend; then
            error "Backend контейнер остановлен!"
            break
        fi
        
        sleep 10
    done
}

# Основная функция
main() {
    log "🔧 DevAssist Pro Backend Startup"
    echo
    
    # Проверка зависимостей
    check_dependencies
    
    # Создание сети
    create_network
    
    # Запуск сервисов
    start_postgres
    start_redis
    start_backend
    
    # Отображение статуса
    show_status
    
    # Ожидание завершения
    log "✅ Backend сервисы запущены! Нажмите Ctrl+C для остановки."
    
    # Мониторинг процессов
    monitor_services
}

# Запуск основной функции
main "$@"