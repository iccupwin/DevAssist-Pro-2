#!/bin/bash

# DevAssist Pro - Deployment Test Script
# Скрипт для локального тестирования unified конфигурации

set -e

# Цвета для логов
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() {
    echo -e "${BLUE}[TEST]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[PASS]${NC} $1"
}

log_error() {
    echo -e "${RED}[FAIL]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

# Тест 1: Проверка файлов конфигурации
test_config_files() {
    log_info "Проверка файлов конфигурации..."
    
    files=(
        "docker-compose.unified.yml"
        ".env.production"
        "nginx/nginx.conf" 
        "frontend/Dockerfile.production"
        "frontend/nginx.frontend.conf"
        "deploy.sh"
    )
    
    for file in "${files[@]}"; do
        if [ -f "$file" ]; then
            log_success "Файл $file существует"
        else
            log_error "Файл $file не найден!"
            return 1
        fi
    done
}

# Тест 2: Проверка синтаксиса Docker Compose
test_docker_compose_syntax() {
    log_info "Проверка синтаксиса docker-compose.unified.yml..."
    
    if docker-compose -f docker-compose.unified.yml config > /dev/null 2>&1; then
        log_success "Docker Compose синтаксис корректный"
    else
        log_error "Ошибка в синтаксисе Docker Compose!"
        docker-compose -f docker-compose.unified.yml config
        return 1
    fi
}

# Тест 3: Проверка Nginx конфигурации
test_nginx_config() {
    log_info "Проверка синтаксиса nginx.conf..."
    
    # Тестируем nginx конфигурацию в temporary контейнере
    if docker run --rm -v $(pwd)/nginx/nginx.conf:/etc/nginx/conf.d/default.conf nginx:alpine nginx -t > /dev/null 2>&1; then
        log_success "Nginx конфигурация корректная"
    else
        log_error "Ошибка в конфигурации Nginx!"
        docker run --rm -v $(pwd)/nginx/nginx.conf:/etc/nginx/conf.d/default.conf nginx:alpine nginx -t
        return 1
    fi
}

# Тест 4: Проверка переменных окружения
test_environment_variables() {
    log_info "Проверка переменных окружения..."
    
    if [ ! -f ".env" ]; then
        log_warning ".env файл не найден, копируем из .env.production"
        cp .env.production .env
    fi
    
    # Проверяем критические переменные
    required_vars=(
        "POSTGRES_URL"
        "REDIS_URL"
        "JWT_SECRET"
    )
    
    for var in "${required_vars[@]}"; do
        if grep -q "^$var=" .env; then
            log_success "Переменная $var настроена"
        else
            log_error "Переменная $var не найдена в .env!"
            return 1
        fi
    done
    
    # Проверяем API ключи
    if grep -q "your_real_anthropic_api_key_here" .env; then
        log_warning "ANTHROPIC_API_KEY не настроен (использует placeholder)"
    fi
    
    if grep -q "your_real_openai_api_key_here" .env; then
        log_warning "OPENAI_API_KEY не настроен (использует placeholder)"
    fi
}

# Тест 5: Сборка образов
test_build() {
    log_info "Тестирование сборки образов..."
    
    # Сборка только frontend для быстрого теста
    if docker-compose -f docker-compose.unified.yml build frontend > /dev/null 2>&1; then
        log_success "Frontend образ собран успешно"
    else
        log_error "Ошибка сборки frontend образа!"
        return 1
    fi
}

# Тест 6: Быстрая проверка запуска
test_quick_start() {
    log_info "Тестирование быстрого запуска..."
    
    # Остановка если что-то запущено
    docker-compose -f docker-compose.unified.yml down > /dev/null 2>&1 || true
    
    # Запуск только базовых сервисов
    if docker-compose -f docker-compose.unified.yml up -d postgres redis > /dev/null 2>&1; then
        log_success "Базовые сервисы запущены"
        
        # Ждем готовности
        sleep 10
        
        # Проверка PostgreSQL
        if docker exec devassist_postgres_unified pg_isready -U devassist > /dev/null 2>&1; then
            log_success "PostgreSQL готов"
        else
            log_error "PostgreSQL не готов!"
        fi
        
        # Проверка Redis
        if docker exec devassist_redis_unified redis-cli ping > /dev/null 2>&1; then
            log_success "Redis готов"
        else
            log_error "Redis не готов!"
        fi
        
        # Остановка тестовых сервисов
        docker-compose -f docker-compose.unified.yml down > /dev/null 2>&1
        
    else
        log_error "Не удалось запустить базовые сервисы!"
        return 1
    fi
}

# Тест 7: Проверка портов
test_ports() {
    log_info "Проверка доступности портов..."
    
    ports=(80 443 5432 6379)
    
    for port in "${ports[@]}"; do
        if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
            log_warning "Порт $port уже занят"
        else
            log_success "Порт $port свободен"
        fi
    done
}

# Тест 8: Проверка требований
test_requirements() {
    log_info "Проверка системных требований..."
    
    # Docker
    if command -v docker >/dev/null 2>&1; then
        log_success "Docker установлен: $(docker --version)"
    else
        log_error "Docker не установлен!"
        return 1
    fi
    
    # Docker Compose
    if command -v docker-compose >/dev/null 2>&1; then
        log_success "Docker Compose установлен: $(docker-compose --version)"
    else
        log_error "Docker Compose не установлен!"
        return 1
    fi
    
    # Проверка ресурсов
    total_mem=$(free -m | awk 'NR==2{printf "%.0f", $2/1024}')
    if [ $total_mem -ge 4 ]; then
        log_success "RAM: ${total_mem}GB (достаточно)"
    else
        log_warning "RAM: ${total_mem}GB (рекомендуется 4GB+)"
    fi
    
    # Проверка места на диске
    available_space=$(df -h . | awk 'NR==2 {print $4}')
    log_info "Доступное место на диске: $available_space"
}

# Главная функция тестирования
run_all_tests() {
    log_info "Запуск полного набора тестов DevAssist Pro deployment..."
    echo ""
    
    tests=(
        "test_requirements"
        "test_config_files"
        "test_docker_compose_syntax"
        "test_nginx_config"
        "test_environment_variables"
        "test_ports"
        "test_build"
        "test_quick_start"
    )
    
    passed=0
    total=${#tests[@]}
    
    for test in "${tests[@]}"; do
        if $test; then
            ((passed++))
        else
            log_error "Тест $test не прошел!"
        fi
        echo ""
    done
    
    echo "=================== РЕЗУЛЬТАТЫ ТЕСТИРОВАНИЯ ==================="
    echo -e "Пройдено: ${GREEN}$passed${NC}/$total тестов"
    
    if [ $passed -eq $total ]; then
        log_success "ВСЕ ТЕСТЫ ПРОЙДЕНЫ! Готов к deployment."
        echo ""
        echo "Следующие шаги:"
        echo "1. Настройте реальные API ключи в .env файле"
        echo "2. Запустите: ./deploy.sh deploy"
        echo "3. Проверьте: http://localhost"
        return 0
    else
        log_error "НЕКОТОРЫЕ ТЕСТЫ НЕ ПРОШЛИ! Исправьте ошибки перед deployment."
        return 1
    fi
}

# Дополнительные утилиты
cleanup_test_artifacts() {
    log_info "Очистка тестовых артефактов..."
    docker-compose -f docker-compose.unified.yml down --remove-orphans > /dev/null 2>&1 || true
    docker system prune -f > /dev/null 2>&1
    log_success "Очистка завершена"
}

show_deployment_info() {
    echo ""
    echo "================== DevAssist Pro Deployment Info =================="
    echo ""
    echo "📁 Структура файлов:"
    echo "  ✅ docker-compose.unified.yml  - Главная конфигурация"
    echo "  ✅ .env.production             - Production environment"
    echo "  ✅ deploy.sh                   - Скрипт развертывания"
    echo "  ✅ nginx/nginx.conf            - Reverse proxy config"
    echo "  ✅ frontend/Dockerfile.production - Frontend build"
    echo ""
    echo "🚀 Команды для deployment:"
    echo "  ./deploy.sh deploy     - Полное развертывание"
    echo "  ./deploy.sh quick      - Быстрый запуск"
    echo "  ./deploy.sh status     - Проверить статус"
    echo "  ./deploy.sh logs       - Посмотреть логи"
    echo ""
    echo "🌐 После развертывания доступно:"
    echo "  Frontend:    http://localhost"
    echo "  Backend API: http://localhost/api"
    echo "  API Docs:    http://localhost/api/docs"
    echo "  Health:      http://localhost/health"
    echo ""
}

# Обработка аргументов
case "$1" in
    "all"|"")
        run_all_tests
        ;;
    "config")
        test_config_files && test_docker_compose_syntax && test_nginx_config
        ;;
    "env")
        test_environment_variables
        ;;
    "build")
        test_build
        ;;
    "requirements")
        test_requirements
        ;;
    "cleanup")
        cleanup_test_artifacts
        ;;
    "info")
        show_deployment_info
        ;;
    *)
        echo "DevAssist Pro - Deployment Test Script"
        echo ""
        echo "Использование: $0 [команда]"
        echo ""
        echo "Команды:"
        echo "  all          - Запустить все тесты (по умолчанию)"
        echo "  config       - Тестировать конфигурации"
        echo "  env          - Проверить environment variables"
        echo "  build        - Тестировать сборку образов"
        echo "  requirements - Проверить системные требования"
        echo "  cleanup      - Очистить тестовые артефакты"
        echo "  info         - Показать информацию о deployment"
        echo ""
        ;;
esac