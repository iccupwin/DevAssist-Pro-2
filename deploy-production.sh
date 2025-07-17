#!/bin/bash

# ==================================================
# DevAssist Pro - Production Deployment Script
# ==================================================

set -e  # Выход при любой ошибке

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Функция для логирования
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
}

# Проверка требований
check_requirements() {
    log "Проверка системных требований..."
    
    # Проверка Docker
    if ! command -v docker &> /dev/null; then
        error "Docker не установлен. Установите Docker перед продолжением."
        exit 1
    fi
    
    # Проверка Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        error "Docker Compose не установлен. Установите Docker Compose перед продолжением."
        exit 1
    fi
    
    # Проверка .env файла
    if [ ! -f ".env" ]; then
        error "Файл .env не найден. Скопируйте .env.production в .env и заполните необходимые значения."
        exit 1
    fi
    
    log "Все требования выполнены ✓"
}

# Проверка переменных окружения
check_env_vars() {
    log "Проверка критических переменных окружения..."
    
    source .env
    
    required_vars=(
        "POSTGRES_PASSWORD"
        "REDIS_PASSWORD" 
        "JWT_SECRET"
        "ANTHROPIC_API_KEY"
        "OPENAI_API_KEY"
    )
    
    for var in "${required_vars[@]}"; do
        if [ -z "${!var}" ] || [ "${!var}" = "YOUR_"* ]; then
            error "Переменная $var не установлена или содержит значение по умолчанию"
            exit 1
        fi
    done
    
    log "Переменные окружения проверены ✓"
}

# Создание бэкапа (если есть запущенные контейнеры)
create_backup() {
    if docker-compose -f docker-compose.prod.yml ps | grep -q "Up"; then
        log "Обнаружены запущенные контейнеры. Создание бэкапа..."
        
        BACKUP_DIR="./backups/$(date +%Y%m%d_%H%M%S)"
        mkdir -p "$BACKUP_DIR"
        
        # Бэкап базы данных
        if docker-compose -f docker-compose.prod.yml ps postgres | grep -q "Up"; then
            log "Создание бэкапа базы данных..."
            docker-compose -f docker-compose.prod.yml exec -T postgres pg_dump -U ${POSTGRES_USER:-devassist} ${POSTGRES_DB:-devassist_pro} > "$BACKUP_DIR/database.sql"
        fi
        
        # Бэкап файлов
        cp .env "$BACKUP_DIR/"
        cp docker-compose.prod.yml "$BACKUP_DIR/"
        
        log "Бэкап создан в $BACKUP_DIR ✓"
    else
        log "Запущенные контейнеры не обнаружены, бэкап не требуется"
    fi
}

# Остановка существующих контейнеров
stop_containers() {
    log "Остановка существующих контейнеров..."
    docker-compose -f docker-compose.prod.yml down --remove-orphans
    log "Контейнеры остановлены ✓"
}

# Очистка старых образов
cleanup_images() {
    log "Очистка старых Docker образов..."
    docker system prune -f
    docker image prune -f
    log "Очистка завершена ✓"
}

# Сборка образов
build_images() {
    log "Сборка Docker образов..."
    docker-compose -f docker-compose.prod.yml build --no-cache --parallel
    log "Сборка завершена ✓"
}

# Запуск сервисов
start_services() {
    log "Запуск production сервисов..."
    docker-compose -f docker-compose.prod.yml up -d
    log "Сервисы запущены ✓"
}

# Ожидание готовности сервисов
wait_for_services() {
    log "Ожидание готовности сервисов..."
    
    # Ожидание базы данных
    for i in {1..30}; do
        if docker-compose -f docker-compose.prod.yml exec -T postgres pg_isready -U ${POSTGRES_USER:-devassist} &>/dev/null; then
            break
        fi
        if [ $i -eq 30 ]; then
            error "База данных не готова после 30 попыток"
            exit 1
        fi
        sleep 2
    done
    
    # Ожидание API Gateway
    for i in {1..60}; do
        if curl -f http://localhost:8000/health &>/dev/null; then
            break
        fi
        if [ $i -eq 60 ]; then
            error "API Gateway не готов после 60 попыток"
            exit 1
        fi
        sleep 2
    done
    
    log "Все сервисы готовы ✓"
}

# Применение миграций базы данных
apply_migrations() {
    log "Применение миграций базы данных..."
    
    # Ожидание готовности API Gateway
    sleep 10
    
    # Применение миграций Alembic
    if docker-compose -f docker-compose.prod.yml exec api-gateway python -c "import alembic" &>/dev/null; then
        docker-compose -f docker-compose.prod.yml exec api-gateway python -m alembic upgrade head
        log "Миграции применены ✓"
    else
        warn "Alembic не обнаружен, пропуск миграций"
    fi
}

# Проверка работоспособности
health_check() {
    log "Проверка работоспособности системы..."
    
    # Проверка API Gateway
    if ! curl -f http://localhost:8000/health &>/dev/null; then
        error "API Gateway не отвечает на health check"
        return 1
    fi
    
    # Проверка Frontend
    if ! curl -f http://localhost:3000/health &>/dev/null; then
        warn "Frontend health check недоступен (это нормально если health endpoint не реализован)"
    fi
    
    # Проверка базы данных
    if ! docker-compose -f docker-compose.prod.yml exec -T postgres pg_isready -U ${POSTGRES_USER:-devassist} &>/dev/null; then
        error "База данных недоступна"
        return 1
    fi
    
    # Проверка Redis
    if ! docker-compose -f docker-compose.prod.yml exec -T redis redis-cli -a ${REDIS_PASSWORD:-redis_secure_password} ping &>/dev/null; then
        error "Redis недоступен"
        return 1
    fi
    
    log "Все компоненты работают корректно ✓"
}

# Показ статуса сервисов
show_status() {
    log "Статус сервисов:"
    docker-compose -f docker-compose.prod.yml ps
    
    echo ""
    log "Использование ресурсов:"
    docker stats --no-stream
    
    echo ""
    log "Приложение доступно по адресам:"
    echo -e "${BLUE}  Frontend: http://localhost:3000${NC}"
    echo -e "${BLUE}  API: http://localhost:8000${NC}"
    echo -e "${BLUE}  API Docs: http://localhost:8000/docs${NC}"
    
    if [ ! -z "${CORS_ORIGINS}" ] && [ "${CORS_ORIGINS}" != "http://localhost:3000,https://yourdomain.com" ]; then
        echo -e "${BLUE}  Production URL: ${CORS_ORIGINS}${NC}"
    fi
}

# Главная функция
main() {
    echo -e "${BLUE}"
    echo "=============================================="
    echo "   DevAssist Pro - Production Deployment    "
    echo "=============================================="
    echo -e "${NC}"
    
    check_requirements
    check_env_vars
    create_backup
    stop_containers
    cleanup_images
    build_images
    start_services
    wait_for_services
    apply_migrations
    
    if health_check; then
        echo ""
        echo -e "${GREEN}🎉 Развертывание успешно завершено!${NC}"
        show_status
    else
        error "Развертывание завершилось с ошибками"
        echo ""
        log "Для диагностики используйте:"
        echo "  docker-compose -f docker-compose.prod.yml logs"
        exit 1
    fi
}

# Обработка сигналов
trap 'error "Развертывание прервано пользователем"; exit 1' INT TERM

# Запуск основной функции
main "$@"