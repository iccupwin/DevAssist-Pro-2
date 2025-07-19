#!/bin/bash

# DevAssist Pro - Production Deployment Script
# Автоматическое развертывание unified конфигурации

set -e  # Выход при любой ошибке

# Цвета для логов
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Функции для логирования
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Проверка требований
check_requirements() {
    log_info "Проверка системных требований..."
    
    # Проверка Docker
    if ! command -v docker &> /dev/null; then
        log_error "Docker не установлен!"
        exit 1
    fi
    
    # Проверка Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose не установлен!"
        exit 1
    fi
    
    # Проверка доступности портов
    if lsof -Pi :80 -sTCP:LISTEN -t >/dev/null; then
        log_warning "Порт 80 уже занят. Остановите сервис или измените порт."
    fi
    
    log_success "Системные требования выполнены"
}

# Подготовка environment
setup_environment() {
    log_info "Настройка environment..."
    
    # Создание .env если не существует
    if [ ! -f .env ]; then
        if [ -f .env.production ]; then
            log_info "Копирование .env.production в .env"
            cp .env.production .env
        else
            log_error "Не найден .env.production файл!"
            exit 1
        fi
    fi
    
    # Проверка критических переменных
    if ! grep -q "ANTHROPIC_API_KEY=your_real" .env; then
        log_warning "Настройте реальные API ключи в .env файле!"
    fi
    
    # Создание необходимых директорий
    mkdir -p nginx/ssl
    mkdir -p backend/data/uploads
    mkdir -p backend/data/reports
    mkdir -p logs
    
    log_success "Environment настроен"
}

# Сборка образов
build_images() {
    log_info "Сборка Docker образов..."
    
    # Сборка с кэшированием
    docker-compose -f docker-compose.unified.yml build --no-cache
    
    log_success "Образы собраны"
}

# Развертывание сервисов
deploy_services() {
    log_info "Развертывание сервисов..."
    
    # Остановка существующих контейнеров
    docker-compose -f docker-compose.unified.yml down --remove-orphans
    
    # Запуск сервисов
    docker-compose -f docker-compose.unified.yml up -d
    
    log_success "Сервисы развернуты"
}

# Проверка health checks
check_health() {
    log_info "Проверка работоспособности сервисов..."
    
    # Ждем запуска сервисов
    sleep 30
    
    # Проверка каждого сервиса
    services=("postgres" "redis" "backend" "frontend" "nginx")
    
    for service in "${services[@]}"; do
        log_info "Проверка $service..."
        
        if docker-compose -f docker-compose.unified.yml ps "$service" | grep -q "Up"; then
            log_success "$service запущен"
        else
            log_error "$service не запущен!"
            docker-compose -f docker-compose.unified.yml logs "$service"
            exit 1
        fi
    done
    
    # Проверка HTTP endpoints
    log_info "Проверка HTTP endpoints..."
    
    # Nginx health check
    if curl -f http://localhost/health > /dev/null 2>&1; then
        log_success "Nginx health check прошел"
    else
        log_error "Nginx health check не прошел!"
        exit 1
    fi
    
    # Backend API health check
    if curl -f http://localhost/api/health > /dev/null 2>&1; then
        log_success "Backend API health check прошел"
    else
        log_error "Backend API health check не прошел!"
        exit 1
    fi
    
    log_success "Все health checks прошли"
}

# Показ логов
show_logs() {
    log_info "Последние логи сервисов:"
    docker-compose -f docker-compose.unified.yml logs --tail=50
}

# Показ статуса
show_status() {
    log_info "Статус сервисов:"
    docker-compose -f docker-compose.unified.yml ps
    
    echo ""
    log_info "Доступные endpoints:"
    echo "🌐 Frontend: http://localhost"
    echo "🚀 Backend API: http://localhost/api"
    echo "📊 API Docs: http://localhost/api/docs"
    echo "🔍 Health Check: http://localhost/health"
    echo ""
    
    log_info "Управление:"
    echo "📋 Логи: docker-compose -f docker-compose.unified.yml logs -f"
    echo "⏹️  Остановка: docker-compose -f docker-compose.unified.yml down"
    echo "🔄 Перезапуск: docker-compose -f docker-compose.unified.yml restart"
}

# Cleanup функция
cleanup() {
    log_info "Очистка ресурсов..."
    docker-compose -f docker-compose.unified.yml down --remove-orphans
    docker system prune -f
    log_success "Очистка завершена"
}

# Backup функция
backup_data() {
    log_info "Создание backup данных..."
    
    timestamp=$(date +%Y%m%d_%H%M%S)
    backup_dir="backup_$timestamp"
    
    mkdir -p "$backup_dir"
    
    # Backup PostgreSQL
    docker exec devassist_postgres_unified pg_dump -U devassist devassist_pro > "$backup_dir/postgres_backup.sql"
    
    # Backup volumes
    docker run --rm -v devassist_app_data:/data -v $(pwd)/$backup_dir:/backup alpine tar czf /backup/app_data.tar.gz -C /data .
    
    log_success "Backup создан в $backup_dir"
}

# Restore функция
restore_data() {
    if [ -z "$1" ]; then
        log_error "Укажите директорию backup для восстановления"
        exit 1
    fi
    
    backup_dir=$1
    log_info "Восстановление данных из $backup_dir..."
    
    # Restore PostgreSQL
    if [ -f "$backup_dir/postgres_backup.sql" ]; then
        docker exec -i devassist_postgres_unified psql -U devassist devassist_pro < "$backup_dir/postgres_backup.sql"
        log_success "PostgreSQL восстановлен"
    fi
    
    # Restore volumes
    if [ -f "$backup_dir/app_data.tar.gz" ]; then
        docker run --rm -v devassist_app_data:/data -v $(pwd)/$backup_dir:/backup alpine tar xzf /backup/app_data.tar.gz -C /data
        log_success "App data восстановлен"
    fi
}

# Monitoring setup
setup_monitoring() {
    log_info "Настройка мониторинга..."
    docker-compose -f docker-compose.unified.yml --profile monitoring up -d
    log_success "Мониторинг настроен. Метрики доступны на :9113"
}

# Главная функция
main() {
    case "$1" in
        "build")
            check_requirements
            setup_environment
            build_images
            ;;
        "deploy")
            check_requirements
            setup_environment
            build_images
            deploy_services
            check_health
            show_status
            ;;
        "status")
            show_status
            ;;
        "logs")
            show_logs
            ;;
        "health")
            check_health
            ;;
        "cleanup")
            cleanup
            ;;
        "backup")
            backup_data
            ;;
        "restore")
            restore_data "$2"
            ;;
        "monitoring")
            setup_monitoring
            ;;
        "quick")
            # Быстрое развертывание без проверок
            docker-compose -f docker-compose.unified.yml up -d
            ;;
        "stop")
            docker-compose -f docker-compose.unified.yml down
            ;;
        "restart")
            docker-compose -f docker-compose.unified.yml restart
            ;;
        *)
            echo "DevAssist Pro - Production Deployment Script"
            echo ""
            echo "Использование: $0 {команда}"
            echo ""
            echo "Команды:"
            echo "  build      - Только сборка образов"
            echo "  deploy     - Полное развертывание (рекомендуется)"
            echo "  status     - Показать статус сервисов"
            echo "  logs       - Показать логи"
            echo "  health     - Проверить health checks"
            echo "  cleanup    - Очистить ресурсы"
            echo "  backup     - Создать backup данных"
            echo "  restore    - Восстановить из backup"
            echo "  monitoring - Включить мониторинг"
            echo "  quick      - Быстрый запуск"
            echo "  stop       - Остановить сервисы"
            echo "  restart    - Перезапустить сервисы"
            echo ""
            echo "Примеры:"
            echo "  $0 deploy          # Полное развертывание"
            echo "  $0 status          # Проверить статус"
            echo "  $0 backup          # Создать backup"
            echo "  $0 restore backup_20240119_120000  # Восстановить"
            ;;
    esac
}

# Проверка аргументов и запуск
if [ $# -eq 0 ]; then
    main "help"
else
    main "$@"
fi