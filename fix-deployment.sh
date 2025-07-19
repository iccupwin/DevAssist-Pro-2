#!/bin/bash

# DevAssist Pro - Quick Fix для deployment проблем
# Исправляет типичные проблемы с unified deployment

set -e

# Цвета для логов
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() {
    echo -e "${BLUE}[FIX]${NC} $1"
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

# Исправление 1: Остановка сервиса на порту 80
fix_port_conflict() {
    log_info "Исправление конфликта портов..."
    
    # Проверяем что занимает порт 80
    if lsof -Pi :80 -sTCP:LISTEN -t >/dev/null 2>&1; then
        log_warning "Порт 80 занят. Пытаемся остановить сервисы..."
        
        # Попытка остановить Apache
        if systemctl is-active --quiet apache2 2>/dev/null; then
            log_info "Останавливаем Apache2..."
            sudo systemctl stop apache2
            sudo systemctl disable apache2
            log_success "Apache2 остановлен"
        fi
        
        # Попытка остановить Nginx
        if systemctl is-active --quiet nginx 2>/dev/null; then
            log_info "Останавливаем Nginx..."
            sudo systemctl stop nginx
            sudo systemctl disable nginx
            log_success "Nginx остановлен"
        fi
        
        # Проверяем снова
        if lsof -Pi :80 -sTCP:LISTEN -t >/dev/null 2>&1; then
            log_warning "Порт 80 все еще занят. Используем порт 8080."
            log_info "После deployment приложение будет доступно на http://localhost:8080"
        else
            log_success "Порт 80 освобожден"
            # Возвращаем порт 80 в конфигурации
            sed -i 's/"8080:80"/"80:80"/g' docker-compose.unified.yml
        fi
    else
        log_success "Порт 80 свободен"
        # Возвращаем порт 80 в конфигурации
        sed -i 's/"8080:80"/"80:80"/g' docker-compose.unified.yml
    fi
}

# Исправление 2: Очистка кеша Docker
fix_docker_cache() {
    log_info "Очистка Docker кеша..."
    
    # Остановка всех контейнеров проекта
    docker-compose -f docker-compose.unified.yml down --remove-orphans 2>/dev/null || true
    
    # Удаление старых образов
    docker images | grep devassist | awk '{print $3}' | xargs -r docker rmi -f 2>/dev/null || true
    
    # Очистка системы
    docker system prune -f
    
    log_success "Docker кеш очищен"
}

# Исправление 3: Проверка и создание необходимых директорий
fix_directories() {
    log_info "Создание необходимых директорий..."
    
    mkdir -p nginx/ssl
    mkdir -p backend/data/uploads  
    mkdir -p backend/data/reports
    mkdir -p logs
    
    # Проверяем существование backend файлов
    if [ ! -f "backend/Dockerfile.monolith" ]; then
        log_error "Не найден backend/Dockerfile.monolith!"
        return 1
    fi
    
    log_success "Директории созданы"
}

# Исправление 4: Проверка .env файла
fix_environment() {
    log_info "Проверка environment файла..."
    
    if [ ! -f ".env" ]; then
        log_info "Создание .env из .env.production..."
        cp .env.production .env
    fi
    
    # Проверяем критические переменные
    if ! grep -q "^ANTHROPIC_API_KEY=" .env; then
        echo "ANTHROPIC_API_KEY=your_real_anthropic_api_key_here" >> .env
    fi
    
    if ! grep -q "^OPENAI_API_KEY=" .env; then
        echo "OPENAI_API_KEY=your_real_openai_api_key_here" >> .env
    fi
    
    log_success "Environment файл настроен"
}

# Исправление 5: Простой Dockerfile для frontend
fix_frontend_dockerfile() {
    log_info "Создание упрощенного Dockerfile для frontend..."
    
    cat > frontend/Dockerfile.simple << 'EOF'
# Simplified Frontend Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev)
RUN npm install

# Copy source
COPY . .

# Build production
ENV NODE_ENV=production
ENV GENERATE_SOURCEMAP=false
RUN npm run build

# Production stage
FROM nginx:alpine

# Install curl for health checks
RUN apk add --no-cache curl

# Remove default config
RUN rm /etc/nginx/conf.d/default.conf

# Copy build
COPY --from=builder /app/build /usr/share/nginx/html

# Copy nginx config
COPY nginx.frontend.conf /etc/nginx/conf.d/default.conf

# Health check endpoint
RUN echo '{"status":"healthy"}' > /usr/share/nginx/html/health

EXPOSE 80

HEALTHCHECK CMD curl -f http://localhost/health || exit 1

CMD ["nginx", "-g", "daemon off;"]
EOF

    log_success "Упрощенный Dockerfile создан"
}

# Исправление 6: Использование упрощенного Dockerfile
fix_docker_compose() {
    log_info "Обновление docker-compose для использования упрощенного Dockerfile..."
    
    # Заменяем Dockerfile в docker-compose
    sed -i 's/dockerfile: Dockerfile.production/dockerfile: Dockerfile.simple/g' docker-compose.unified.yml
    
    log_success "Docker-compose обновлен"
}

# Исправление 7: Тестовая сборка только frontend
test_frontend_build() {
    log_info "Тестовая сборка frontend..."
    
    cd frontend
    if npm run build; then
        log_success "Frontend собран успешно"
        cd ..
        return 0
    else
        log_error "Ошибка сборки frontend"
        cd ..
        return 1
    fi
}

# Основная функция исправления
main_fix() {
    log_info "Начинаем исправление проблем DevAssist Pro deployment..."
    echo ""
    
    fix_docker_cache
    fix_directories
    fix_environment
    fix_port_conflict
    fix_frontend_dockerfile
    fix_docker_compose
    
    echo ""
    log_info "Тестирование исправлений..."
    
    if test_frontend_build; then
        log_success "ВСЕ ИСПРАВЛЕНИЯ ПРИМЕНЕНЫ УСПЕШНО!"
        echo ""
        echo "Теперь можете запустить:"
        echo "  docker-compose -f docker-compose.unified.yml up -d"
        echo ""
        if grep -q '"8080:80"' docker-compose.unified.yml; then
            echo "Приложение будет доступно на: http://localhost:8080"
        else
            echo "Приложение будет доступно на: http://localhost"
        fi
        return 0
    else
        log_error "Есть проблемы с frontend build. Проверьте логи выше."
        return 1
    fi
}

# Быстрые команды
case "$1" in
    "port")
        fix_port_conflict
        ;;
    "cache") 
        fix_docker_cache
        ;;
    "env")
        fix_environment
        ;;
    "test")
        test_frontend_build
        ;;
    "all"|"")
        main_fix
        ;;
    *)
        echo "DevAssist Pro - Deployment Fix Script"
        echo ""
        echo "Использование: $0 [команда]"
        echo ""
        echo "Команды:"
        echo "  all     - Применить все исправления (по умолчанию)"
        echo "  port    - Исправить конфликт портов"
        echo "  cache   - Очистить Docker кеш"
        echo "  env     - Исправить environment"
        echo "  test    - Тестовая сборка frontend"
        echo ""
        ;;
esac