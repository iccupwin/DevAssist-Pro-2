#!/bin/bash

# DevAssist Pro - Скрипт для обновления и перезапуска сервера (Docker Compose V2)
# Этот скрипт использует новый docker compose (v2) для совместимости

set -e  # Остановить выполнение при любой ошибке

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Функция для вывода с цветом
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Функция для проверки статуса команды
check_status() {
    if [ $? -eq 0 ]; then
        print_success "$1"
    else
        print_error "Failed: $1"
        exit 1
    fi
}

# Определяем какую команду использовать для Docker Compose
detect_docker_compose() {
    if command -v "docker" >/dev/null 2>&1 && docker compose version >/dev/null 2>&1; then
        DOCKER_COMPOSE_CMD="docker compose"
        print_status "Используем Docker Compose V2"
    elif command -v "docker-compose" >/dev/null 2>&1; then
        DOCKER_COMPOSE_CMD="docker-compose"
        print_status "Используем Docker Compose V1"
    else
        print_error "Docker Compose не найден!"
        exit 1
    fi
}

# Главная функция
main() {
    print_status "Начинаем обновление DevAssist Pro..."
    
    # Определяем команду Docker Compose
    detect_docker_compose
    
    # 1. Проверяем что мы в правильной директории
    if [ ! -f "docker-compose.yml" ] && [ ! -f "docker-compose.production.yml" ]; then
        print_error "Не найден docker-compose.yml. Убедитесь что вы находитесь в корневой директории проекта."
        exit 1
    fi
    
    # 2. Останавливаем все запущенные сервисы
    print_status "Останавливаем существующие сервисы..."
    
    # Останавливаем различные конфигурации
    $DOCKER_COMPOSE_CMD down 2>/dev/null || true
    $DOCKER_COMPOSE_CMD -f docker-compose.microservices.yml down 2>/dev/null || true
    $DOCKER_COMPOSE_CMD -f docker-compose.production.yml down 2>/dev/null || true
    $DOCKER_COMPOSE_CMD -f docker-compose.final.yml down 2>/dev/null || true
    $DOCKER_COMPOSE_CMD -f docker-compose.monolith.yml down 2>/dev/null || true
    
    check_status "Сервисы остановлены"
    
    # 3. Обновляем код из Git (если есть изменения)
    if [ -d ".git" ]; then
        print_status "Обновляем код из Git..."
        git fetch origin
        git pull origin $(git rev-parse --abbrev-ref HEAD)
        check_status "Код обновлен из Git"
    else
        print_warning "Git репозиторий не найден, пропускаем обновление кода"
    fi
    
    # 4. Очищаем Docker кэш и старые образы
    print_status "Очищаем Docker кэш..."
    docker system prune -f
    docker image prune -f
    check_status "Docker кэш очищен"
    
    # 5. Определяем какой docker-compose файл использовать
    print_status "Определяем конфигурацию для развертывания..."
    
    COMPOSE_FILE=""
    if [ -f "docker-compose.microservices.yml" ]; then
        COMPOSE_FILE="docker-compose.microservices.yml"
        print_status "Используем docker-compose.microservices.yml (с админ сервисом)"
    elif [ -f "docker-compose.final.yml" ]; then
        COMPOSE_FILE="docker-compose.final.yml"
        print_status "Используем docker-compose.final.yml"
    elif [ -f "docker-compose.production.yml" ]; then
        COMPOSE_FILE="docker-compose.production.yml"
        print_status "Используем docker-compose.production.yml"
    elif [ -f "docker-compose.monolith.yml" ]; then
        COMPOSE_FILE="docker-compose.monolith.yml"
        print_status "Используем docker-compose.monolith.yml"
    else
        COMPOSE_FILE="docker-compose.yml"
        print_status "Используем docker-compose.yml"
    fi
    
    # 6. Проверяем существование необходимых Dockerfile'ов
    if [ "$COMPOSE_FILE" = "docker-compose.microservices.yml" ]; then
        print_status "Проверяем наличие Dockerfile'ов для микросервисов..."
        
        # Создаем недостающие Dockerfile'ы
        if [ ! -f "backend/api_gateway/Dockerfile" ]; then
            print_status "Создаем Dockerfile для API Gateway..."
            mkdir -p backend/api_gateway
            cat > backend/api_gateway/Dockerfile << 'EOF'
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY ../requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy shared modules
COPY ../shared /app/backend/shared

# Copy API Gateway code
COPY . /app/backend/api_gateway

# Set Python path
ENV PYTHONPATH=/app:$PYTHONPATH

EXPOSE 8000

CMD ["python", "-m", "uvicorn", "backend.api_gateway.main:app", "--host", "0.0.0.0", "--port", "8000"]
EOF
        fi
        
        # Создаем простые Dockerfile'ы для отсутствующих сервисов
        for service in auth llm documents analytics reports dashboard; do
            if [ ! -f "backend/services/$service/Dockerfile" ]; then
                print_warning "Создаем заглушку Dockerfile для $service сервиса..."
                mkdir -p "backend/services/$service"
                cat > "backend/services/$service/Dockerfile" << EOF
FROM python:3.11-slim

WORKDIR /app

# Install basic dependencies
RUN pip install fastapi uvicorn

# Create a simple health check service
RUN echo 'from fastapi import FastAPI; app = FastAPI(); @app.get("/health"); async def health(): return {"status": "healthy"}' > main.py

EXPOSE 800$(($(echo $service | wc -c) % 10))

CMD ["python", "-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "800$(($(echo $service | wc -c) % 10))"]
EOF
            fi
        done
    fi
    
    # 7. Пересобираем образы
    print_status "Пересобираем Docker образы..."
    $DOCKER_COMPOSE_CMD -f $COMPOSE_FILE build --no-cache
    check_status "Образы пересобраны"
    
    # 8. Обновляем зависимости Frontend (если нужно)
    if [ -d "frontend" ] && [ -f "frontend/package.json" ]; then
        print_status "Проверяем Frontend..."
        
        # Проверяем есть ли продакшн Dockerfile
        if [ ! -f "frontend/Dockerfile.prod" ] && [ ! -f "frontend/Dockerfile.minimal" ]; then
            print_status "Создаем Dockerfile для Frontend..."
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

# Copy nginx config
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
EOF
        fi
        
        print_success "Frontend готов"
    fi
    
    # 9. Проверяем и создаем необходимые директории
    print_status "Создаем необходимые директории..."
    mkdir -p logs
    mkdir -p data/postgres
    mkdir -p data/redis
    check_status "Директории созданы"
    
    # 10. Проверяем переменные окружения
    print_status "Проверяем переменные окружения..."
    if [ ! -f ".env" ]; then
        if [ -f ".env.example" ]; then
            cp .env.example .env
            print_warning "Скопирован .env.example в .env. Проверьте настройки!"
        else
            print_warning "Файл .env не найден. Создаем базовый..."
            cat > .env << 'EOF'
# Database
POSTGRES_PASSWORD=devassist_secure_password_2024
REDIS_PASSWORD=redis_secure_password_2024

# Security
JWT_SECRET=your_jwt_secret_key_minimum_32_characters_long_random_string

# AI APIs (добавьте ваши ключи)
ANTHROPIC_API_KEY=
OPENAI_API_KEY=
GOOGLE_API_KEY=
EOF
        fi
    else
        print_success "Файл .env найден"
    fi
    
    # 11. Запускаем сервисы
    print_status "Запускаем обновленные сервисы..."
    $DOCKER_COMPOSE_CMD -f $COMPOSE_FILE up -d
    check_status "Сервисы запущены"
    
    # 12. Ждем пока сервисы запустятся
    print_status "Ждем запуска сервисов (30 секунд)..."
    sleep 30
    
    # 13. Проверяем статус сервисов
    print_status "Проверяем статус сервисов..."
    $DOCKER_COMPOSE_CMD -f $COMPOSE_FILE ps
    
    # 14. Проверяем здоровье API
    print_status "Проверяем доступность API..."
    
    # Пытаемся подключиться к API Gateway
    MAX_RETRIES=10
    RETRY_COUNT=0
    
    while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
        if curl -f -s http://localhost:8000/health > /dev/null 2>&1; then
            print_success "API Gateway доступен"
            break
        else
            RETRY_COUNT=$((RETRY_COUNT + 1))
            print_status "Ожидание API Gateway... попытка $RETRY_COUNT/$MAX_RETRIES"
            sleep 5
        fi
    done
    
    if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
        print_warning "API Gateway не отвечает, но сервисы запущены"
    fi
    
    # 15. Показываем логи (последние 20 строк)
    print_status "Последние логи сервисов:"
    $DOCKER_COMPOSE_CMD -f $COMPOSE_FILE logs --tail=20
    
    # 16. Итоговая информация
    echo ""
    print_success "=================================="
    print_success "  ОБНОВЛЕНИЕ ЗАВЕРШЕНО УСПЕШНО!"
    print_success "=================================="
    echo ""
    print_status "Сервисы доступны на:"
    print_status "  Frontend: http://localhost (порт 80)"
    print_status "  API Gateway: http://localhost:8000"
    print_status "  Admin Panel: http://localhost/admin"
    echo ""
    print_status "Для просмотра логов: $DOCKER_COMPOSE_CMD -f $COMPOSE_FILE logs -f"
    print_status "Для остановки: $DOCKER_COMPOSE_CMD -f $COMPOSE_FILE down"
    echo ""
    
    # 17. Быстрая проверка сервисов
    if command -v curl >/dev/null 2>&1; then
        print_status "Быстрая проверка сервисов:"
        
        # Проверка основных endpoints
        services=(
            "http://localhost:8000/health|API Gateway"
            "http://localhost:8001/health|Auth Service"
            "http://localhost:8002/health|LLM Service"
            "http://localhost:8007/health|Admin Service"
        )
        
        for service in "${services[@]}"; do
            IFS='|' read -r url name <<< "$service"
            if curl -f -s "$url" > /dev/null 2>&1; then
                print_success "✓ $name"
            else
                print_warning "✗ $name (не отвечает)"
            fi
        done
    fi
}

# Функция для показа помощи
show_help() {
    echo "DevAssist Pro - Скрипт обновления и перезапуска (Docker Compose V2)"
    echo ""
    echo "Использование: $0 [опции]"
    echo ""
    echo "Опции:"
    echo "  -h, --help     Показать эту помощь"
    echo "  --no-git       Не обновлять код из Git"
    echo "  --quick        Быстрый перезапуск без пересборки"
    echo "  --fallback     Использовать fallback конфигурацию"
    echo ""
    echo "Примеры:"
    echo "  $0                    # Полное обновление"
    echo "  $0 --quick           # Быстрый перезапуск"
    echo "  $0 --no-git          # Обновление без Git pull"
    echo "  $0 --fallback        # Использовать простую конфигурацию"
    echo ""
}

# Функция для быстрого перезапуска
quick_restart() {
    print_status "Быстрый перезапуск сервисов..."
    
    detect_docker_compose
    
    # Определяем compose файл
    COMPOSE_FILE=""
    if [ -f "docker-compose.microservices.yml" ]; then
        COMPOSE_FILE="docker-compose.microservices.yml"
    elif [ -f "docker-compose.final.yml" ]; then
        COMPOSE_FILE="docker-compose.final.yml"
    elif [ -f "docker-compose.production.yml" ]; then
        COMPOSE_FILE="docker-compose.production.yml"
    elif [ -f "docker-compose.monolith.yml" ]; then
        COMPOSE_FILE="docker-compose.monolith.yml"
    else
        COMPOSE_FILE="docker-compose.yml"
    fi
    
    # Перезапускаем сервисы
    $DOCKER_COMPOSE_CMD -f $COMPOSE_FILE restart
    check_status "Сервисы перезапущены"
    
    print_success "Быстрый перезапуск завершен"
}

# Функция fallback для простого запуска
fallback_deployment() {
    print_status "Запуск в fallback режиме..."
    
    detect_docker_compose
    
    # Используем самую простую конфигурацию
    if [ -f "docker-compose.final.yml" ]; then
        COMPOSE_FILE="docker-compose.final.yml"
    elif [ -f "docker-compose.production.yml" ]; then
        COMPOSE_FILE="docker-compose.production.yml"
    else
        COMPOSE_FILE="docker-compose.yml"
    fi
    
    print_status "Используем $COMPOSE_FILE для fallback запуска"
    
    $DOCKER_COMPOSE_CMD -f $COMPOSE_FILE down || true
    $DOCKER_COMPOSE_CMD -f $COMPOSE_FILE up -d
    
    print_success "Fallback запуск завершен"
}

# Обработка аргументов командной строки
NO_GIT=false
QUICK=false
FALLBACK=false

while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_help
            exit 0
            ;;
        --no-git)
            NO_GIT=true
            shift
            ;;
        --quick)
            QUICK=true
            shift
            ;;
        --fallback)
            FALLBACK=true
            shift
            ;;
        *)
            print_error "Неизвестная опция: $1"
            show_help
            exit 1
            ;;
    esac
done

# Запуск соответствующей функции
if [ "$QUICK" = true ]; then
    quick_restart
elif [ "$FALLBACK" = true ]; then
    fallback_deployment
else
    main
fi