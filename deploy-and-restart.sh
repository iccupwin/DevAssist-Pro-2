#!/bin/bash

# DevAssist Pro - Скрипт для обновления и перезапуска сервера
# Этот скрипт выполняет полное обновление кода и перезапуск всех сервисов

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

# Главная функция
main() {
    print_status "Начинаем обновление DevAssist Pro..."
    
    # 1. Проверяем что мы в правильной директории
    if [ ! -f "docker-compose.yml" ] && [ ! -f "docker-compose.production.yml" ]; then
        print_error "Не найден docker-compose.yml. Убедитесь что вы находитесь в корневой директории проекта."
        exit 1
    fi
    
    # 2. Останавливаем все запущенные сервисы
    print_status "Останавливаем существующие сервисы..."
    
    # Останавливаем различные конфигурации
    docker-compose down 2>/dev/null || true
    docker-compose -f docker-compose.microservices.yml down 2>/dev/null || true
    docker-compose -f docker-compose.production.yml down 2>/dev/null || true
    docker-compose -f docker-compose.final.yml down 2>/dev/null || true
    docker-compose -f docker-compose.monolith.yml down 2>/dev/null || true
    
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
    
    # 5. Пересобираем образы
    print_status "Пересобираем Docker образы..."
    
    # Определяем какой docker-compose файл использовать
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
    
    docker-compose -f $COMPOSE_FILE build --no-cache
    check_status "Образы пересобраны"
    
    # 6. Обновляем зависимости Frontend (если нужно)
    if [ -d "frontend" ] && [ -f "frontend/package.json" ]; then
        print_status "Обновляем зависимости Frontend..."
        cd frontend
        
        # Проверяем есть ли node_modules
        if [ -d "node_modules" ]; then
            rm -rf node_modules
            print_status "Старые node_modules удалены"
        fi
        
        npm install
        check_status "Зависимости Frontend обновлены"
        
        # Собираем продакшн сборку
        print_status "Собираем Frontend для продакшн..."
        npm run build
        check_status "Frontend собран"
        
        cd ..
    fi
    
    # 7. Обновляем зависимости Backend (если нужно)
    if [ -d "backend" ] && [ -f "backend/requirements.txt" ]; then
        print_status "Проверяем зависимости Backend..."
        # В Docker это будет сделано автоматически при сборке
        print_success "Зависимости Backend будут обновлены в Docker"
    fi
    
    # 8. Проверяем и создаем необходимые директории
    print_status "Создаем необходимые директории..."
    mkdir -p logs
    mkdir -p data/postgres
    mkdir -p data/redis
    check_status "Директории созданы"
    
    # 9. Проверяем переменные окружения
    print_status "Проверяем переменные окружения..."
    if [ ! -f ".env" ]; then
        if [ -f ".env.example" ]; then
            cp .env.example .env
            print_warning "Скопирован .env.example в .env. Проверьте настройки!"
        else
            print_warning "Файл .env не найден. Создайте его на основе .env.example"
        fi
    else
        print_success "Файл .env найден"
    fi
    
    # 10. Запускаем сервисы
    print_status "Запускаем обновленные сервисы..."
    docker-compose -f $COMPOSE_FILE up -d
    check_status "Сервисы запущены"
    
    # 11. Ждем пока сервисы запустятся
    print_status "Ждем запуска сервисов (30 секунд)..."
    sleep 30
    
    # 12. Проверяем статус сервисов
    print_status "Проверяем статус сервисов..."
    docker-compose -f $COMPOSE_FILE ps
    
    # 13. Проверяем здоровье API
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
    
    # 14. Показываем логи (последние 20 строк)
    print_status "Последние логи сервисов:"
    docker-compose -f $COMPOSE_FILE logs --tail=20
    
    # 15. Итоговая информация
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
    print_status "Для просмотра логов: docker-compose -f $COMPOSE_FILE logs -f"
    print_status "Для остановки: docker-compose -f $COMPOSE_FILE down"
    echo ""
    
    # 16. Опционально - показать статус всех сервисов
    if command -v curl >/dev/null 2>&1; then
        print_status "Быстрая проверка сервисов:"
        
        # Проверка основных endpoints
        services=(
            "http://localhost:8000/health|API Gateway"
            "http://localhost:8001/health|Auth Service"
            "http://localhost:8002/health|LLM Service"
            "http://localhost:8003/health|Documents Service"
            "http://localhost:8004/health|Analytics Service"
            "http://localhost:8005/health|Reports Service"
            "http://localhost:8006/health|Dashboard Service"
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
    echo "DevAssist Pro - Скрипт обновления и перезапуска"
    echo ""
    echo "Использование: $0 [опции]"
    echo ""
    echo "Опции:"
    echo "  -h, --help     Показать эту помощь"
    echo "  --no-git       Не обновлять код из Git"
    echo "  --no-build     Не пересобирать Docker образы"
    echo "  --quick        Быстрый перезапуск без пересборки"
    echo ""
    echo "Примеры:"
    echo "  $0                    # Полное обновление"
    echo "  $0 --quick           # Быстрый перезапуск"
    echo "  $0 --no-git          # Обновление без Git pull"
    echo ""
}

# Функция для быстрого перезапуска
quick_restart() {
    print_status "Быстрый перезапуск сервисов..."
    
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
    docker-compose -f $COMPOSE_FILE restart
    check_status "Сервисы перезапущены"
    
    print_success "Быстрый перезапуск завершен"
}

# Обработка аргументов командной строки
NO_GIT=false
NO_BUILD=false
QUICK=false

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
        --no-build)
            NO_BUILD=true
            shift
            ;;
        --quick)
            QUICK=true
            shift
            ;;
        *)
            print_error "Неизвестная опция: $1"
            show_help
            exit 1
            ;;
    esac
done

# Запуск основной функции или быстрого перезапуска
if [ "$QUICK" = true ]; then
    quick_restart
else
    main
fi