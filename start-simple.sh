#!/bin/bash

# DevAssist Pro - Простой запуск без Docker Compose
# Запускает только frontend через npm start

set -e

echo "🚀 Простой запуск DevAssist Pro (только frontend)..."

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
    
    # Проверка Node.js
    if ! command -v node &> /dev/null; then
        error "Node.js не установлен. Установите Node.js для запуска frontend."
        exit 1
    fi
    
    # Проверка npm
    if ! command -v npm &> /dev/null; then
        error "npm не установлен. Установите npm для запуска frontend."
        exit 1
    fi
    
    log "✅ Node.js $(node --version) и npm $(npm --version) установлены"
}

# Остановка сервисов при выходе
cleanup() {
    log "Остановка сервисов..."
    
    # Остановка frontend
    if [[ ! -z "$FRONTEND_PID" ]]; then
        info "Остановка frontend (PID: $FRONTEND_PID)..."
        kill $FRONTEND_PID 2>/dev/null || true
    fi
    
    log "🛑 Frontend остановлен"
    exit 0
}

# Установка обработчика сигналов
trap cleanup SIGINT SIGTERM EXIT

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
    else
        info "Зависимости уже установлены, пропускаем npm install"
    fi
    
    # Запуск frontend
    info "Запуск React development server..."
    log "✅ Frontend запускается на http://localhost:3000"
    
    # Запуск с выводом логов
    npm start
}

# Основная функция
main() {
    log "🚀 DevAssist Pro Simple Startup (Frontend Only)"
    echo
    
    warning "⚠️  Запускается только frontend! Backend нужно запустить отдельно."
    warning "⚠️  Для полного запуска используйте Docker или установите Docker Compose."
    echo
    
    # Проверка зависимостей
    check_dependencies
    
    # Запуск frontend
    start_frontend
}

# Запуск основной функции
main "$@"