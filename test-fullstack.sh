#!/bin/bash
# ===========================================
# DevAssist Pro - Fullstack Testing Script
# ===========================================

set -e

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log() {
    echo -e "${BLUE}[TEST]${NC} $1"
}

success() {
    echo -e "${GREEN}[PASS]${NC} $1"
}

error() {
    echo -e "${RED}[FAIL]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

# Функция для проверки URL
check_url() {
    local url=$1
    local description=$2
    local expected_status=${3:-200}
    
    log "Проверяем $description: $url"
    
    if response=$(curl -s -w "HTTPSTATUS:%{http_code}" "$url"); then
        http_code=$(echo "$response" | grep -o "HTTPSTATUS:[0-9]*" | cut -d: -f2)
        response_body=$(echo "$response" | sed 's/HTTPSTATUS:[0-9]*$//')
        
        if [ "$http_code" -eq "$expected_status" ]; then
            success "$description работает (HTTP $http_code)"
            return 0
        else
            error "$description вернул неожиданный код: HTTP $http_code"
            return 1
        fi
    else
        error "$description недоступен"
        return 1
    fi
}

# Функция для проверки API endpoint
check_api() {
    local endpoint=$1
    local description=$2
    
    log "Проверяем API: $endpoint"
    
    if response=$(curl -s -f "http://localhost:80$endpoint"); then
        success "API $description работает"
        echo "Response: $(echo "$response" | head -c 100)..."
        return 0
    else
        error "API $description недоступен"
        return 1
    fi
}

log "🧪 Начинаем тестирование DevAssist Pro Fullstack..."

# Проверяем, что система запущена
if ! docker-compose -f docker-compose.fullstack.yml ps | grep -q "Up"; then
    error "Система не запущена. Запустите ./start-fullstack.sh"
    exit 1
fi

# Счетчики тестов
total_tests=0
passed_tests=0

# Функция для учета результатов
test_result() {
    total_tests=$((total_tests + 1))
    if [ $1 -eq 0 ]; then
        passed_tests=$((passed_tests + 1))
    fi
}

echo ""
log "=== Тестирование Frontend ==="

# Frontend проверки
check_url "http://localhost:80" "Главная страница Frontend"
test_result $?

check_url "http://localhost:80/manifest.json" "PWA Manifest"
test_result $?

check_url "http://localhost:80/static/css" "CSS Assets" 404  # Ожидаем 404 т.к. точного файла нет
test_result $?

echo ""
log "=== Тестирование Health Checks ==="

# Health checks
check_url "http://localhost:80/health" "System Health Check"
test_result $?

echo ""
log "=== Тестирование API ==="

# API проверки
check_api "/api/docs" "API Documentation"
test_result $?

check_api "/api/health" "Backend Health"
test_result $?

check_api "/api/llm/providers" "AI Providers Status"
test_result $?

check_api "/api/analytics/dashboard" "Analytics Dashboard"
test_result $?

echo ""
log "=== Тестирование Database ==="

# Database проверки
log "Проверяем подключение к PostgreSQL..."
if docker-compose -f docker-compose.fullstack.yml exec -T postgres pg_isready -U devassist -d devassist_pro > /dev/null 2>&1; then
    success "PostgreSQL подключение работает"
    test_result 0
else
    error "PostgreSQL подключение недоступно"
    test_result 1
fi

echo ""
log "=== Тестирование Redis ==="

# Redis проверки
log "Проверяем подключение к Redis..."
if docker-compose -f docker-compose.fullstack.yml exec -T redis redis-cli ping > /dev/null 2>&1; then
    success "Redis подключение работает"
    test_result 0
else
    error "Redis подключение недоступно"
    test_result 1
fi

echo ""
log "=== Тестирование Docker Containers ==="

# Container health checks
log "Проверяем статус контейнеров..."
containers=$(docker-compose -f docker-compose.fullstack.yml ps --services)

for container in $containers; do
    status=$(docker-compose -f docker-compose.fullstack.yml ps "$container" | tail -n +2 | awk '{print $3}')
    if [[ "$status" == *"Up"* ]]; then
        success "Контейнер $container: $status"
        test_result 0
    else
        error "Контейнер $container: $status"
        test_result 1
    fi
done

echo ""
log "=== Тестирование File Upload ==="

# Создаем тестовый файл
test_file="/tmp/test_upload.txt"
echo "Тестовое коммерческое предложение для проверки загрузки файлов" > "$test_file"

log "Тестируем загрузку файла..."
if response=$(curl -s -X POST -F "file=@$test_file" "http://localhost:80/api/kp-analyzer/full-analysis"); then
    if echo "$response" | grep -q '"success":true'; then
        success "Загрузка и анализ файлов работает"
        test_result 0
    else
        warning "Загрузка файлов работает, но анализ вернул ошибку"
        echo "Response: $(echo "$response" | head -c 200)..."
        test_result 1
    fi
else
    error "Загрузка файлов недоступна"
    test_result 1
fi

# Удаляем тестовый файл
rm -f "$test_file"

echo ""
log "=== Результаты тестирования ==="

echo ""
if [ $passed_tests -eq $total_tests ]; then
    success "🎉 Все тесты пройдены! ($passed_tests/$total_tests)"
    echo ""
    echo "✅ DevAssist Pro Fullstack работает корректно!"
    echo ""
    echo "📊 Доступные URL:"
    echo "   • Главная страница:    http://localhost:80"
    echo "   • API документация:    http://localhost:80/api/docs"
    echo "   • Health Check:        http://localhost:80/health"
    exit 0
else
    failed_tests=$((total_tests - passed_tests))
    error "⚠️  Тесты завершены с ошибками: $passed_tests/$total_tests пройдено, $failed_tests провалено"
    echo ""
    warning "Проверьте логи для диагностики:"
    echo "   docker-compose -f docker-compose.fullstack.yml logs -f"
    echo ""
    exit 1
fi