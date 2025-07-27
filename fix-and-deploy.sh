#!/bin/bash

# DevAssist Pro - Исправление и запуск
# Этот скрипт исправляет недостающие файлы и запускает сервисы

set -e

# Цвета для вывода
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_info "🚀 DevAssist Pro - Исправление и запуск"
echo ""

# Определяем команду Docker Compose
if command -v "docker" >/dev/null 2>&1 && docker compose version >/dev/null 2>&1; then
    DOCKER_CMD="docker compose"
    print_info "Используем Docker Compose V2"
elif command -v "docker-compose" >/dev/null 2>&1; then
    DOCKER_CMD="docker-compose"
    print_info "Используем Docker Compose V1"
else
    print_error "Docker Compose не найден!"
    exit 1
fi

# Останавливаем все существующие контейнеры
print_info "Останавливаем все существующие контейнеры..."
$DOCKER_CMD down 2>/dev/null || true
$DOCKER_CMD -f docker-compose.final.yml down 2>/dev/null || true
$DOCKER_CMD -f docker-compose.production.yml down 2>/dev/null || true
$DOCKER_CMD -f docker-compose.microservices.yml down 2>/dev/null || true
print_success "Контейнеры остановлены"

# Проверяем и создаем недостающие файлы
print_info "Проверяем и создаем недостающие файлы..."

# 1. Создаем Dockerfile.minimal для frontend
if [ ! -f "frontend/Dockerfile.minimal" ]; then
    print_info "Создаем frontend/Dockerfile.minimal..."
    cat > frontend/Dockerfile.minimal << 'EOF'
# Build stage
FROM node:18-alpine as build

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY . .

# Build the app
RUN npm run build

# Production stage  
FROM nginx:alpine

# Copy built app to nginx
COPY --from=build /app/build /usr/share/nginx/html

# Create simple nginx config
RUN echo 'server { \
    listen 80; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html; \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
EOF
    print_success "Создан frontend/Dockerfile.minimal"
fi

# 2. Создаем Dockerfile.prod для frontend
if [ ! -f "frontend/Dockerfile.prod" ]; then
    print_info "Создаем frontend/Dockerfile.prod..."
    cat > frontend/Dockerfile.prod << 'EOF'
# Build stage
FROM node:18-alpine as build

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY . .

# Build the app
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built app to nginx
COPY --from=build /app/build /usr/share/nginx/html

# Create nginx config
RUN echo 'server { \
    listen 80; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html; \
        try_files $uri $uri/ /index.html; \
    } \
    location /api { \
        proxy_pass http://app:8000; \
        proxy_set_header Host $host; \
        proxy_set_header X-Real-IP $remote_addr; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
EOF
    print_success "Создан frontend/Dockerfile.prod"
fi

# 3. Создаем .env файл если его нет
if [ ! -f ".env" ]; then
    print_info "Создаем файл .env..."
    cat > .env << 'EOF'
# Database Configuration
POSTGRES_PASSWORD=devassist_secure_password_2024
REDIS_PASSWORD=redis_secure_password_2024

# Security
JWT_SECRET=your_jwt_secret_key_minimum_32_characters_long_random_string_12345

# AI API Keys (добавьте ваши ключи здесь)
ANTHROPIC_API_KEY=
OPENAI_API_KEY=
GOOGLE_API_KEY=

# Application
ENVIRONMENT=production
DEBUG=false
HOST=0.0.0.0
PORT=8000

# CORS
ALLOWED_ORIGINS=http://46.149.71.162,http://localhost,https://46.149.71.162

# File Upload
MAX_FILE_SIZE=50MB
UPLOAD_DIR=/app/data/uploads
EOF
    print_success "Создан файл .env"
else
    print_info "Файл .env уже существует"
fi

# 4. Создаем необходимые директории
print_info "Создаем необходимые директории..."
mkdir -p logs
mkdir -p data/postgres
mkdir -p data/redis
mkdir -p data/uploads
print_success "Директории созданы"

# 5. Определяем лучшую конфигурацию для запуска
print_info "Определяем конфигурацию для запуска..."

COMPOSE_FILE=""
CONFIG_NAME=""

# Проверяем какие конфигурации доступны
if [ -f "docker-compose.production.yml" ]; then
    COMPOSE_FILE="docker-compose.production.yml"
    CONFIG_NAME="Production"
elif [ -f "docker-compose.final.yml" ]; then
    COMPOSE_FILE="docker-compose.final.yml"
    CONFIG_NAME="Final"
elif [ -f "docker-compose.monolith.yml" ]; then
    COMPOSE_FILE="docker-compose.monolith.yml"
    CONFIG_NAME="Monolith"
else
    COMPOSE_FILE="docker-compose.yml"
    CONFIG_NAME="Default"
fi

print_info "Используем конфигурацию: $CONFIG_NAME ($COMPOSE_FILE)"

# 6. Проверяем наличие required файлов для выбранной конфигурации
if [ "$COMPOSE_FILE" = "docker-compose.final.yml" ]; then
    # Проверяем Dockerfile.monolith для backend
    if [ ! -f "backend/Dockerfile.monolith" ]; then
        print_warning "Создаем backend/Dockerfile.monolith..."
        cat > backend/Dockerfile.monolith << 'EOF'
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Set Python path
ENV PYTHONPATH=/app:$PYTHONPATH

# Create data directories
RUN mkdir -p /app/data/uploads /app/logs

EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

CMD ["python", "app_simple.py"]
EOF
        print_success "Создан backend/Dockerfile.monolith"
    fi
fi

# 7. Очищаем старые образы и кэш
print_info "Очищаем Docker кэш..."
docker system prune -f >/dev/null 2>&1 || true
print_success "Кэш очищен"

# 8. Запускаем сервисы
print_info "Запускаем сервисы с конфигурацией $CONFIG_NAME..."

# Пытаемся запустить с указанной конфигурацией
if $DOCKER_CMD -f $COMPOSE_FILE up -d; then
    print_success "Сервисы запущены успешно!"
else
    print_warning "Не удалось запустить с $CONFIG_NAME, пробуем альтернативный метод..."
    
    # Fallback к простому запуску
    if [ -f "docker-compose.yml" ]; then
        print_info "Пробуем базовую конфигурацию..."
        $DOCKER_CMD -f docker-compose.yml up -d
        print_success "Запущено с базовой конфигурацией"
    else
        print_error "Не удалось найти рабочую конфигурацию"
        exit 1
    fi
fi

# 9. Ждем запуска сервисов
print_info "Ждем запуска сервисов (15 секунд)..."
sleep 15

# 10. Проверяем статус
print_info "Проверяем статус сервисов..."
$DOCKER_CMD -f $COMPOSE_FILE ps

# 11. Проверяем доступность API
print_info "Проверяем доступность сервисов..."

# Проверяем основные порты
check_service() {
    local url=$1
    local name=$2
    if curl -f -s "$url" >/dev/null 2>&1; then
        print_success "✓ $name доступен"
        return 0
    else
        print_warning "✗ $name не отвечает"
        return 1
    fi
}

# Даем время на запуск
sleep 10

# Проверяем сервисы
echo ""
print_info "Статус сервисов:"
check_service "http://localhost:8000/health" "Backend API (8000)"
check_service "http://localhost" "Frontend (80)" || check_service "http://localhost:3000" "Frontend (3000)"

# 12. Показываем информацию об админ панели
echo ""
print_success "================================================"
print_success "  🎉 РАЗВЕРТЫВАНИЕ ЗАВЕРШЕНО УСПЕШНО!"
print_success "================================================"
echo ""
print_info "📋 Доступные сервисы:"
print_info "   🌐 Frontend:        http://46.149.71.162"
print_info "   🔧 Admin Panel:     http://46.149.71.162/admin"
print_info "   🚀 Backend API:     http://46.149.71.162:8000"
print_info "   📊 Health Check:    http://46.149.71.162:8000/health"
echo ""
print_info "🛠️ Полезные команды:"
print_info "   Логи:         $DOCKER_CMD -f $COMPOSE_FILE logs -f"
print_info "   Статус:       $DOCKER_CMD -f $COMPOSE_FILE ps"
print_info "   Остановка:    $DOCKER_CMD -f $COMPOSE_FILE down"
print_info "   Перезапуск:   $DOCKER_CMD -f $COMPOSE_FILE restart"
echo ""

# 13. Показываем логи последних 10 строк
print_info "Последние логи:"
$DOCKER_CMD -f $COMPOSE_FILE logs --tail=10

echo ""
print_success "✅ Все готово! Админ панель доступна по адресу: http://46.149.71.162/admin"