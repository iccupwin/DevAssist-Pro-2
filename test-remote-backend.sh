#!/bin/bash

# DevAssist Pro - Тестирование удаленного backend'а
# Проверка API на сервере 46.149.71.162

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

SERVER_IP="46.149.71.162"
BASE_URL="http://$SERVER_IP:8000"

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

echo "🧪 DevAssist Pro - Тестирование удаленного backend на $SERVER_IP"
echo "=" * 70

# Функция для тестирования endpoint'а
test_endpoint() {
    local method="$1"
    local endpoint="$2"
    local description="$3"
    local expected_status="${4:-200}"
    
    log_test "$description ($endpoint)"
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "\n%{http_code}" --connect-timeout 10 "$BASE_URL$endpoint" 2>/dev/null)
    else
        response=$(curl -s -w "\n%{http_code}" -X "$method" --connect-timeout 10 "$BASE_URL$endpoint" 2>/dev/null)
    fi
    
    if [ $? -ne 0 ]; then
        log_error "❌ $endpoint - CONNECTION FAILED"
        return 1
    fi
    
    http_code=$(echo "$response" | tail -n 1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" = "$expected_status" ]; then
        log_info "✅ $endpoint - OK ($http_code)"
        
        # Показываем краткий ответ
        if [ ${#body} -lt 150 ]; then
            echo "   Ответ: $body"
        else
            echo "   Ответ: $(echo "$body" | head -c 100)..."
        fi
        
        # Специальная проверка для health endpoint
        if [ "$endpoint" = "/health" ]; then
            service_name=$(echo "$body" | grep -o '"service":"[^"]*"' | cut -d'"' -f4)
            echo "   Сервис: $service_name"
            
            if [ "$service_name" = "devassist-pro-monolith" ]; then
                log_info "   ✅ Запущен ПОЛНЫЙ монолитный backend"
            elif [ "$service_name" = "devassist-simple-backend" ]; then
                log_warn "   ⚠️  Запущен УПРОЩЕННЫЙ backend (app_simple.py)"
            else
                log_warn "   ⚠️  Неизвестный тип backend: $service_name"
            fi
        fi
        
        return 0
    else
        log_error "❌ $endpoint - FAILED ($http_code)"
        echo "   Ожидался: $expected_status, получен: $http_code"
        if [ ${#body} -lt 200 ]; then
            echo "   Ответ: $body"
        fi
        return 1
    fi
}

# Проверка доступности сервера
log_test "Проверка доступности сервера $SERVER_IP..."
if ping -c 1 -W 5 $SERVER_IP >/dev/null 2>&1; then
    log_info "✅ Сервер $SERVER_IP доступен"
else
    log_warn "⚠️  Ping не проходит, но это может быть нормально"
fi

if curl -s --connect-timeout 10 "$BASE_URL" >/dev/null 2>&1; then
    log_info "✅ HTTP сервер на порту 8000 доступен"
else
    log_error "❌ HTTP сервер на $BASE_URL недоступен"
    exit 1
fi

echo ""

# Основные тесты
echo "🔍 Основные endpoints:"
test_endpoint "GET" "/" "Главная страница"
test_endpoint "GET" "/health" "Health check"
test_endpoint "GET" "/docs" "API документация"

echo ""
echo "🔍 API endpoints:"
test_endpoint "GET" "/api" "API информация"
test_endpoint "GET" "/api/admin/status" "Статус системы"

echo ""
echo "🔍 AI/LLM endpoints:"
test_endpoint "GET" "/api/llm/providers" "AI провайдеры"
test_endpoint "GET" "/api/llm/health" "Здоровье AI"

echo ""
echo "🔍 Analytics endpoints:"
test_endpoint "GET" "/api/analytics/dashboard" "Дашборд аналитики"

echo ""
echo "🔍 Activity endpoints:"
test_endpoint "GET" "/api/activity" "Лента активности"

echo ""
echo "📊 Дополнительные проверки:"

# Проверка типа backend
log_test "Определение типа backend..."
health_response=$(curl -s --connect-timeout 10 "$BASE_URL/health" 2>/dev/null)
service_name=$(echo "$health_response" | grep -o '"service":"[^"]*"' | cut -d'"' -f4)

case "$service_name" in
    "devassist-pro-monolith")
        log_info "✅ На сервере запущен ПОЛНЫЙ монолитный backend"
        backend_type="ПОЛНЫЙ"
        ;;
    "devassist-simple-backend")
        log_warn "⚠️  На сервере запущен УПРОЩЕННЫЙ backend"
        log_warn "    Рекомендуется переключиться на полный монолитный backend"
        backend_type="УПРОЩЕННЫЙ"
        ;;
    *)
        log_error "❌ Неизвестный тип backend: $service_name"
        backend_type="НЕИЗВЕСТНЫЙ"
        ;;
esac

# Проверка AI конфигурации
log_test "Проверка конфигурации AI..."
ai_response=$(curl -s --connect-timeout 10 "$BASE_URL/api/llm/providers" 2>/dev/null)
if echo "$ai_response" | grep -q "not_configured"; then
    log_warn "⚠️  AI провайдеры не настроены"
    log_warn "    Настройте API ключи в .env файле"
else
    log_info "✅ AI провайдеры настроены"
fi

echo ""
echo "📋 РЕЗЮМЕ:"
echo "   🖥️  Сервер:         $SERVER_IP:8000"
echo "   🔧 Тип backend:     $backend_type"
echo "   📡 Статус:          $(echo "$health_response" | grep -o '"status":"[^"]*"' | cut -d'"' -f4)"
echo ""

if [ "$backend_type" = "УПРОЩЕННЫЙ" ]; then
    echo "💡 РЕКОМЕНДАЦИИ:"
    echo "   1. Остановите текущий backend"
    echo "   2. Запустите полный монолитный backend:"
    echo "      cd ~/project && ./deploy-full-monolith.sh"
    echo "   3. Повторите тестирование"
    echo ""
fi

echo "🔗 Полезные ссылки:"
echo "   • Главная:      $BASE_URL/"
echo "   • API Docs:     $BASE_URL/docs"
echo "   • Health:       $BASE_URL/health"
echo "   • Admin:        $BASE_URL/api/admin/status"
echo ""

log_info "🏁 Тестирование завершено!"