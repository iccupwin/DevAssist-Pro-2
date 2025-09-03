#!/bin/bash

# DevAssist Pro - Тестирование API монолитного backend'а
# Автор: Claude Code Assistant

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_test() {
    echo -e "${BLUE}[TEST]${NC} $1"
}

BASE_URL="http://localhost:8000"

echo "🧪 DevAssist Pro - Тестирование API"
echo "=" * 50

# Функция для тестирования endpoint'а
test_endpoint() {
    local method="$1"
    local endpoint="$2"
    local description="$3"
    local expected_status="${4:-200}"
    
    log_test "Тестирование: $description"
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "\n%{http_code}" "$BASE_URL$endpoint")
    else
        response=$(curl -s -w "\n%{http_code}" -X "$method" "$BASE_URL$endpoint")
    fi
    
    http_code=$(echo "$response" | tail -n 1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" = "$expected_status" ]; then
        log_info "✅ $endpoint - OK ($http_code)"
        if [ ${#body} -lt 200 ]; then
            echo "   Ответ: $body"
        else
            echo "   Ответ: $(echo "$body" | head -c 100)..."
        fi
    else
        log_error "❌ $endpoint - FAILED ($http_code)"
        echo "   Ожидался: $expected_status, получен: $http_code"
    fi
    echo ""
}

# Проверка доступности сервера
log_test "Проверка доступности сервера..."
if curl -s "$BASE_URL" > /dev/null; then
    log_info "✅ Сервер доступен"
else
    log_error "❌ Сервер недоступен на $BASE_URL"
    exit 1
fi

echo ""

# Основные endpoints
test_endpoint "GET" "/" "Главная страница"
test_endpoint "GET" "/health" "Health check"
test_endpoint "GET" "/api" "API информация"

# Административные endpoints
test_endpoint "GET" "/api/admin/status" "Статус системы"

# LLM/AI endpoints
test_endpoint "GET" "/api/llm/providers" "AI провайдеры"
test_endpoint "GET" "/api/llm/health" "Здоровье AI"

# Analytics endpoints
test_endpoint "GET" "/api/analytics/dashboard" "Дашборд аналитики"

# Activity endpoints
test_endpoint "GET" "/api/activity" "Лента активности"

echo "🎯 Тестирование завершено!"
echo ""
echo "📊 Дополнительные проверки:"

# Проверка AI провайдеров
log_test "Проверка конфигурации AI..."
ai_health=$(curl -s "$BASE_URL/api/llm/health")
if echo "$ai_health" | grep -q "healthy"; then
    log_info "✅ AI провайдеры настроены"
else
    log_warn "⚠️  AI провайдеры требуют настройки"
fi

# Проверка базы данных через health check
log_test "Проверка подключения к базе данных..."
health_response=$(curl -s "$BASE_URL/health")
if echo "$health_response" | grep -q "healthy"; then
    log_info "✅ Система работает корректно"
else
    log_warn "⚠️  Возможные проблемы с системой"
fi

echo ""
echo "🔗 Полезные ссылки для тестирования:"
echo "   • Swagger UI: $BASE_URL/docs"
echo "   • Redoc:      $BASE_URL/redoc"
echo "   • Health:     $BASE_URL/health"
echo "   • Admin:      $BASE_URL/api/admin/status"
echo ""

log_info "💡 Для полного тестирования используйте Swagger UI: $BASE_URL/docs"