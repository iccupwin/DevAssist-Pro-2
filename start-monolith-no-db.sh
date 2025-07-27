#!/bin/bash

# DevAssist Pro - Запуск монолитного backend БЕЗ базы данных
# Для случаев когда PostgreSQL недоступен

set -e

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

log_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

echo "🚀 DevAssist Pro - Запуск БЕЗ базы данных"
echo "=" * 60

# Остановка существующих процессов
log_step "Остановка существующих процессов..."
pkill -f "python.*app" 2>/dev/null || true
pkill -f "uvicorn" 2>/dev/null || true
log_info "✅ Процессы остановлены"

# Проверка Python
log_step "Проверка Python..."
if command -v python3 >/dev/null 2>&1; then
    python_cmd="python3"
elif command -v python >/dev/null 2>&1; then
    python_cmd="python"
else
    log_error "❌ Python не найден!"
    exit 1
fi

log_info "✅ Python найден: $($python_cmd --version)"

# Переход в backend
cd backend

# Проверка файла app_simple.py (он работает без БД)
if [ -f "app_simple.py" ]; then
    app_file="app_simple.py"
    log_info "✅ Используем app_simple.py (без базы данных)"
elif [ -f "app.py" ]; then
    app_file="app.py"
    log_warn "⚠️  Используем app.py (может требовать БД)"
else
    log_error "❌ Не найден ни app.py, ни app_simple.py!"
    exit 1
fi

# Установка зависимостей
log_step "Установка зависимостей..."
$python_cmd -m pip install fastapi uvicorn python-dotenv anthropic openai --quiet || true

# Настройка переменных окружения для работы без БД
log_step "Настройка переменных окружения..."
cd ..

# Создаем .env с отключенной БД
cat > .env << EOF
# DevAssist Pro - Конфигурация БЕЗ базы данных
DEBUG=false
LOG_LEVEL=INFO
ENVIRONMENT=development
ADMIN_PASSWORD=admin123
MAX_FILE_SIZE=50MB
SUPPORTED_FORMATS=pdf,docx,txt
USE_REAL_API=true
ALLOWED_ORIGINS=http://46.149.71.162:3000,http://46.149.71.162,http://localhost:3000,http://localhost:3001

# AI API ключи
ANTHROPIC_API_KEY=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

# ОТКЛЮЧАЕМ базу данных для этого запуска
DATABASE_AVAILABLE=false
SKIP_DATABASE=true
NO_DATABASE=true
EOF

log_info "✅ Конфигурация настроена для работы без БД"

# Создание необходимых директорий
log_step "Создание директорий..."
mkdir -p data/reports data/uploads data/cache
log_info "✅ Директории созданы"

# Запуск приложения
log_step "Запуск backend без базы данных..."
cd backend

log_info "🚀 Запускаем $app_file на порту 8000..."
log_info "   Логи будут сохранены в app.log"

# Запуск в фоне с логированием
nohup $python_cmd $app_file > ../app.log 2>&1 &
APP_PID=$!

log_info "✅ Backend запущен с PID: $APP_PID"

# Ожидание запуска
log_step "Ожидание запуска приложения..."
sleep 8

# Проверка статуса
max_attempts=20
attempt=1

while [ $attempt -le $max_attempts ]; do
    if curl -s http://localhost:8000/health >/dev/null 2>&1; then
        health_response=$(curl -s http://localhost:8000/health)
        log_info "✅ Backend успешно запущен!"
        log_info "Ответ health: $health_response"
        break
    else
        log_warn "Попытка $attempt/$max_attempts: Backend еще не готов..."
    fi
    
    # Проверяем, что процесс еще работает
    if ! kill -0 $APP_PID 2>/dev/null; then
        log_error "❌ Процесс backend завершился!"
        log_error "Последние логи:"
        tail -30 ../app.log
        exit 1
    fi
    
    sleep 3
    ((attempt++))
done

if [ $attempt -gt $max_attempts ]; then
    log_error "❌ Backend не смог запуститься за разумное время"
    log_error "Последние логи:"
    tail -30 ../app.log
    exit 1
fi

# Финальная проверка
cd ..
echo ""
log_info "🎉 DevAssist Pro запущен БЕЗ базы данных!"
echo "=" * 60
echo ""

echo "🌐 Доступные endpoints:"
echo "   • Главная:      http://localhost:8000/"
echo "   • Health:       http://localhost:8000/health"
echo "   • API Docs:     http://localhost:8000/docs"
echo ""

# Тестируем доступные endpoints
log_step "Тестирование endpoints..."
endpoints=("/" "/health" "/docs" "/api/llm/providers")

for endpoint in "${endpoints[@]}"; do
    if curl -s "http://localhost:8000$endpoint" >/dev/null 2>&1; then
        log_info "✅ $endpoint - работает"
    else
        log_warn "⚠️  $endpoint - недоступен"
    fi
done

echo ""
echo "📋 Управление:"
echo "   • PID процесса: $APP_PID"
echo "   • Логи:         tail -f ~/project/app.log"
echo "   • Остановка:    kill $APP_PID"
echo "   • Статус:       curl http://localhost:8000/health"
echo ""

# Сохраняем PID для удобства
echo $APP_PID > app.pid
log_info "PID сохранен в файл app.pid"

# Показываем последние логи
log_step "Последние логи приложения:"
tail -10 app.log

echo ""
log_info "✨ Backend работает! (режим без базы данных)"
log_info "🔗 Внешний доступ: http://46.149.71.162:8000/"

echo ""
log_warn "⚠️  ВНИМАНИЕ: Работа без базы данных!"
log_warn "   Некоторые функции могут быть ограничены"
log_warn "   Для полной функциональности запустите PostgreSQL"