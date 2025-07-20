#!/bin/bash

# DevAssist Pro - Unified Startup Script
# Запускает backend и frontend одновременно

set -e

echo "🚀 Запуск DevAssist Pro..."

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
    
    # Проверка Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        error "Docker Compose не установлен. Установите Docker Compose для продолжения."
        exit 1
    fi
    
    # Проверка Node.js для frontend
    if ! command -v node &> /dev/null; then
        error "Node.js не установлен. Установите Node.js для запуска frontend."
        exit 1
    fi
    
    # Проверка npm
    if ! command -v npm &> /dev/null; then
        error "npm не установлен. Установите npm для запуска frontend."
        exit 1
    fi
    
    log "✅ Все зависимости установлены"
}

# Остановка сервисов при выходе
cleanup() {
    log "Остановка сервисов..."
    
    # Остановка frontend
    if [[ ! -z "$FRONTEND_PID" ]]; then
        info "Остановка frontend (PID: $FRONTEND_PID)..."
        kill $FRONTEND_PID 2>/dev/null || true
    fi
    
    # Остановка backend Docker containers
    info "Остановка backend services..."
    cd backend && docker-compose -f docker-compose.monolith.yml down 2>/dev/null || true
    
    log "🛑 Все сервисы остановлены"
    exit 0
}

# Установка обработчика сигналов
trap cleanup SIGINT SIGTERM EXIT

# Запуск backend
start_backend() {
    log "Запуск backend сервисов..."
    
    cd backend
    
    # Проверка существования docker-compose файла
    if [[ ! -f "docker-compose.monolith.yml" ]]; then
        error "Файл docker-compose.monolith.yml не найден в папке backend"
        exit 1
    fi
    
    # Остановка существующих контейнеров
    info "Остановка существующих контейнеров..."
    docker-compose -f docker-compose.monolith.yml down 2>/dev/null || true
    
    # Сборка и запуск сервисов
    info "Сборка и запуск backend сервисов..."
    docker-compose -f docker-compose.monolith.yml up --build -d
    
    # Ожидание готовности сервисов
    info "Ожидание готовности backend сервисов..."
    sleep 10
    
    # Проверка статуса сервисов
    if docker-compose -f docker-compose.monolith.yml ps | grep -q "Up"; then
        log "✅ Backend сервисы запущены успешно"
        info "Backend доступен по адресу: http://localhost:8000"
    else
        error "Ошибка запуска backend сервисов"
        docker-compose -f docker-compose.monolith.yml logs
        exit 1
    fi
    
    cd ..
}

# Запуск frontend
start_frontend() {
    log "Запуск frontend..."
    
    cd frontend
    
    # Проверка существования package.json
    if [[ ! -f "package.json" ]]; then
        error "Файл package.json не найден в папке frontend"
        exit 1
    fi
    
    # Установка зависимостей если node_modules не существует
    if [[ ! -d "node_modules" ]]; then
        info "Установка зависимостей frontend..."
        npm install
    fi
    
    # Запуск frontend в фоновом режиме
    info "Запуск React development server..."
    npm start &
    FRONTEND_PID=$!
    
    # Ожидание запуска frontend
    info "Ожидание запуска frontend сервера..."
    sleep 15
    
    # Проверка доступности frontend
    if curl -s http://localhost:3000 > /dev/null; then
        log "✅ Frontend запущен успешно"
        info "Frontend доступен по адресу: http://localhost:3000"
    else
        warning "Frontend может всё ещё запускаться. Проверьте http://localhost:3000"
    fi
    
    cd ..
}

# Отображение статуса
show_status() {
    log "📊 Статус сервисов DevAssist Pro:"
    echo
    info "🔧 Backend Services:"
    echo "   • API Gateway: http://localhost:8000"
    echo "   • PostgreSQL: localhost:5432"
    echo "   • Redis: localhost:6379"
    echo
    info "🎨 Frontend:"
    echo "   • React App: http://localhost:3000"
    echo
    info "📖 Полезные команды:"
    echo "   • Логи backend: cd backend && docker-compose -f docker-compose.monolith.yml logs -f"
    echo "   • Остановка: Ctrl+C"
    echo
}

# Основная функция
main() {
    log "🚀 DevAssist Pro Startup Script"
    echo
    
    # Проверка зависимостей
    check_dependencies
    
    # Запуск backend
    start_backend
    
    # Запуск frontend
    start_frontend
    
    # Отображение статуса
    show_status
    
    # Ожидание завершения
    log "✅ Все сервисы запущены! Нажмите Ctrl+C для остановки."
    
    # Мониторинг процессов
    while true; do
        # Проверка backend
        if ! docker-compose -f backend/docker-compose.monolith.yml ps | grep -q "Up"; then
            error "Backend сервисы остановлены!"
            break
        fi
        
        # Проверка frontend
        if [[ ! -z "$FRONTEND_PID" ]] && ! kill -0 $FRONTEND_PID 2>/dev/null; then
            error "Frontend процесс остановлен!"
            break
        fi
        
        sleep 5
    done
}

# Запуск основной функции
main "$@"