#!/bin/bash

# DevAssist Pro - Quick Deploy без frontend build
# Обходит проблемы с frontend build используя development версию

set -e

# Цвета для логов
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() {
    echo -e "${BLUE}[QUICK]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Создание простого docker-compose без frontend build
create_simple_compose() {
    log_info "Создание упрощенной конфигурации..."
    
    cat > docker-compose.simple.yml << 'EOF'
# DevAssist Pro - Simplified deployment без frontend build

services:
  # База данных PostgreSQL
  postgres:
    image: postgres:15-alpine
    container_name: devassist_postgres_simple
    environment:
      POSTGRES_DB: devassist_pro
      POSTGRES_USER: devassist
      POSTGRES_PASSWORD: devassist_password
    ports:
      - "5433:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U devassist"]
      interval: 30s
      timeout: 10s
      retries: 3
    restart: unless-stopped
    networks:
      - devassist_network

  # Кеш Redis
  redis:
    image: redis:7-alpine
    container_name: devassist_redis_simple
    command: redis-server --requirepass redis_password
    ports:
      - "6380:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "--raw", "incr", "ping"]
      interval: 30s
      timeout: 10s
      retries: 3
    restart: unless-stopped
    networks:
      - devassist_network

  # Backend API
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile.monolith
    container_name: devassist_backend_simple
    ports:
      - "8000:8000"
    environment:
      POSTGRES_URL: postgresql://devassist:devassist_password@postgres:5432/devassist_pro
      REDIS_URL: redis://:redis_password@redis:6379/0
      DEBUG: false
      LOG_LEVEL: INFO
      ENVIRONMENT: production
      ALLOWED_ORIGINS: http://localhost:3000,http://localhost:8080
      MAX_FILE_SIZE: 100MB
      SUPPORTED_FORMATS: pdf,docx,txt
      ANTHROPIC_API_KEY: ${ANTHROPIC_API_KEY:-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}
      OPENAI_API_KEY: ${OPENAI_API_KEY:-your_openai_api_key_here}
      GOOGLE_API_KEY: ${GOOGLE_API_KEY:-your_google_api_key_here}
      USE_REAL_API: true
      HOST: 0.0.0.0
      PORT: 8000
    volumes:
      - app_data:/app/data
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
    restart: unless-stopped
    networks:
      - devassist_network

volumes:
  postgres_data:
    driver: local
  redis_data:
    driver: local
  app_data:
    driver: local

networks:
  devassist_network:
    driver: bridge
EOF

    log_success "Упрощенная конфигурация создана"
}

# Запуск упрощенного backend
deploy_backend_only() {
    log_info "Развертывание только backend сервисов..."
    
    # Остановка существующих контейнеров
    docker-compose -f docker-compose.simple.yml down --remove-orphans 2>/dev/null || true
    
    # Запуск сервисов
    docker-compose -f docker-compose.simple.yml up -d
    
    log_success "Backend сервисы запущены"
}

# Запуск frontend в development режиме
start_frontend_dev() {
    log_info "Запуск frontend в development режиме..."
    
    cd frontend
    
    # Проверка package.json
    if [ ! -f "package.json" ]; then
        log_error "package.json не найден в директории frontend!"
        cd ..
        return 1
    fi
    
    # Установка зависимостей если node_modules отсутствует
    if [ ! -d "node_modules" ]; then
        log_info "Установка зависимостей frontend..."
        npm install
    fi
    
    # Создание .env для frontend
    cat > .env << 'EOF'
REACT_APP_API_URL=http://localhost:8000
REACT_APP_WS_URL=ws://localhost:8000
REACT_APP_ENVIRONMENT=development
REACT_APP_USE_REAL_API=true
EOF

    log_info "Frontend запускается на http://localhost:3000"
    log_info "Backend API доступно на http://localhost:8000"
    log_warning "Запустите в отдельном терминале: cd frontend && npm start"
    
    cd ..
}

# Проверка статуса
check_status() {
    log_info "Проверка статуса сервисов..."
    
    # Проверка backend контейнеров
    echo ""
    echo "=== Backend сервисы ==="
    docker-compose -f docker-compose.simple.yml ps
    
    echo ""
    echo "=== Health checks ==="
    
    # Проверка PostgreSQL
    if docker exec devassist_postgres_simple pg_isready -U devassist > /dev/null 2>&1; then
        log_success "PostgreSQL: готов"
    else
        log_error "PostgreSQL: не готов"
    fi
    
    # Проверка Redis
    if docker exec devassist_redis_simple redis-cli --no-auth-warning -a redis_password ping > /dev/null 2>&1; then
        log_success "Redis: готов"
    else
        log_error "Redis: не готов"
    fi
    
    # Проверка Backend API
    if curl -s http://localhost:8000/health > /dev/null 2>&1; then
        log_success "Backend API: готов"
    else
        log_error "Backend API: не готов"
    fi
    
    echo ""
    echo "=== Доступные сервисы ==="
    echo "🚀 Backend API: http://localhost:8000"
    echo "📖 API Docs: http://localhost:8000/docs"
    echo "🔍 Health: http://localhost:8000/health"
    echo ""
    echo "Для запуска frontend:"
    echo "cd frontend && npm start"
    echo "Frontend будет доступен на http://localhost:3000"
}

# Остановка сервисов
stop_services() {
    log_info "Остановка сервисов..."
    docker-compose -f docker-compose.simple.yml down
    log_success "Сервисы остановлены"
}

# Просмотр логов
show_logs() {
    docker-compose -f docker-compose.simple.yml logs -f
}

# Основная функция
main() {
    case "$1" in
        "deploy")
            create_simple_compose
            deploy_backend_only
            start_frontend_dev
            check_status
            ;;
        "status")
            check_status
            ;;
        "stop")
            stop_services
            ;;
        "logs")
            show_logs
            ;;
        "frontend")
            start_frontend_dev
            ;;
        *)
            echo "DevAssist Pro - Quick Deploy Script"
            echo ""
            echo "Использование: $0 {команда}"
            echo ""
            echo "Команды:"
            echo "  deploy    - Полное развертывание (backend + инструкции для frontend)"
            echo "  status    - Проверить статус сервисов"
            echo "  stop      - Остановить все сервисы"
            echo "  logs      - Показать логи"
            echo "  frontend  - Настроить frontend для development"
            echo ""
            echo "Пример полного запуска:"
            echo "  $0 deploy"
            echo "  cd frontend && npm start  # в отдельном терминале"
            echo ""
            ;;
    esac
}

# Запуск
main "$@"