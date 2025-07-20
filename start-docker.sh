#!/bin/bash

# DevAssist Pro - Docker Unified Startup Script
# Запускает всё приложение через Docker

set -e

echo "🐳 Запуск DevAssist Pro через Docker..."

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
    
    # Проверка что Docker daemon запущен
    if ! docker info &> /dev/null; then
        error "Docker daemon не запущен. Запустите Docker для продолжения."
        exit 1
    fi
    
    log "✅ Все зависимости установлены"
}

# Остановка сервисов при выходе
cleanup() {
    log "Остановка Docker сервисов..."
    docker-compose down 2>/dev/null || true
    log "🛑 Все сервисы остановлены"
    exit 0
}

# Установка обработчика сигналов
trap cleanup SIGINT SIGTERM EXIT

# Создание .env файла если не существует
create_env_file() {
    if [[ ! -f ".env" ]]; then
        info "Создание .env файла..."
        cat > .env << EOF
# AI Provider API Keys
ANTHROPIC_API_KEY=your-anthropic-api-key
OPENAI_API_KEY=your-openai-api-key
GOOGLE_API_KEY=your-google-api-key

# Database
POSTGRES_DB=devassist_pro
POSTGRES_USER=devassist
POSTGRES_PASSWORD=devassist_password

# Redis
REDIS_PASSWORD=redis_password

# Application
DEBUG=false
LOG_LEVEL=INFO
ENVIRONMENT=production
MAX_FILE_SIZE=50MB
SUPPORTED_FORMATS=pdf,docx,txt
EOF
        warning "Создан .env файл с примерами значений. Обновите API ключи перед запуском!"
    fi
}

# Сборка и запуск сервисов
start_services() {
    log "Сборка и запуск Docker сервисов..."
    
    # Остановка существующих контейнеров
    info "Остановка существующих контейнеров..."
    docker-compose down 2>/dev/null || true
    
    # Очистка старых образов (опционально)
    if [[ "$1" == "--clean" ]]; then
        info "Очистка старых образов..."
        docker-compose down --rmi local 2>/dev/null || true
        docker system prune -f 2>/dev/null || true
    fi
    
    # Сборка образов
    info "Сборка образов..."
    docker-compose build --no-cache
    
    # Запуск сервисов
    info "Запуск сервисов..."
    docker-compose up -d
    
    # Ожидание готовности сервисов
    info "Ожидание готовности сервисов..."
    sleep 30
    
    # Проверка статуса сервисов
    if docker-compose ps | grep -q "Up"; then
        log "✅ Все сервисы запущены успешно"
    else
        error "Ошибка запуска сервисов"
        docker-compose logs
        exit 1
    fi
}

# Отображение статуса
show_status() {
    log "📊 Статус Docker сервисов DevAssist Pro:"
    echo
    docker-compose ps
    echo
    info "🌐 Доступные адреса:"
    echo "   • Основное приложение: http://localhost"
    echo "   • Backend API: http://localhost:8000"
    echo "   • PostgreSQL: localhost:5432"
    echo "   • Redis: localhost:6379"
    echo
    info "📖 Полезные команды:"
    echo "   • Логи всех сервисов: docker-compose logs -f"
    echo "   • Логи конкретного сервиса: docker-compose logs -f [service_name]"
    echo "   • Остановка: Ctrl+C или docker-compose down"
    echo "   • Перезапуск: docker-compose restart"
    echo
}

# Мониторинг сервисов
monitor_services() {
    log "🔍 Мониторинг сервисов..."
    
    while true; do
        # Проверка статуса контейнеров
        if ! docker-compose ps | grep -q "Up"; then
            error "Один или несколько сервисов остановлены!"
            docker-compose ps
            break
        fi
        
        sleep 10
    done
}

# Отображение логов
show_logs() {
    log "📋 Отображение логов..."
    docker-compose logs -f
}

# Основная функция
main() {
    log "🐳 DevAssist Pro Docker Startup Script"
    echo
    
    # Проверка аргументов
    case "${1:-}" in
        "logs")
            show_logs
            exit 0
            ;;
        "status")
            docker-compose ps
            exit 0
            ;;
        "stop")
            docker-compose down
            exit 0
            ;;
        "clean")
            docker-compose down --rmi local
            docker system prune -f
            exit 0
            ;;
        "help"|"-h"|"--help")
            echo "Использование: $0 [КОМАНДА]"
            echo
            echo "Команды:"
            echo "  (без аргументов)  Запуск всех сервисов"
            echo "  logs              Показать логи"
            echo "  status            Показать статус"
            echo "  stop              Остановить сервисы"
            echo "  clean             Очистить и остановить"
            echo "  help              Показать эту справку"
            echo
            echo "Опции:"
            echo "  --clean           Очистить образы перед запуском"
            exit 0
            ;;
    esac
    
    # Проверка зависимостей
    check_dependencies
    
    # Создание .env файла
    create_env_file
    
    # Запуск сервисов
    start_services "$@"
    
    # Отображение статуса
    show_status
    
    # Ожидание завершения
    log "✅ Все сервисы запущены! Нажмите Ctrl+C для остановки."
    log "🌐 Откройте http://localhost в браузере"
    
    # Мониторинг процессов
    monitor_services
}

# Запуск основной функции
main "$@"