#!/bin/bash

# DevAssist Pro - Прямой запуск монолитного backend без Docker
# На случай проблем с Docker Compose

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

echo "🚀 DevAssist Pro - Прямой запуск монолитного backend"
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

# Проверка файла app.py
if [ ! -f "app.py" ]; then
    log_error "❌ Файл app.py не найден в директории backend!"
    exit 1
fi

log_info "✅ Файл app.py найден"

# Установка зависимостей
log_step "Установка зависимостей..."
if [ -f "requirements.txt" ]; then
    log_info "Устанавливаем зависимости из requirements.txt..."
    $python_cmd -m pip install -r requirements.txt --quiet || true
fi

if [ -f "requirements-monolith.txt" ]; then
    log_info "Устанавливаем зависимости из requirements-monolith.txt..."
    $python_cmd -m pip install -r requirements-monolith.txt --quiet || true
fi

# Основные зависимости
log_info "Устанавливаем основные зависимости..."
$python_cmd -m pip install fastapi uvicorn python-dotenv anthropic openai --quiet || true

# Проверка переменных окружения
log_step "Настройка переменных окружения..."
cd ..

if [ ! -f ".env" ]; then
    if [ -f ".env.example" ]; then
        cp .env.example .env
        log_info "✅ Создан .env из .env.example"
    else
        log_warn "⚠️  Создаем базовый .env файл..."
        cat > .env << EOF
# DevAssist Pro Environment Configuration
DEBUG=false
LOG_LEVEL=INFO
ENVIRONMENT=production
ADMIN_PASSWORD=admin123
MAX_FILE_SIZE=50MB
SUPPORTED_FORMATS=pdf,docx,txt
USE_REAL_API=true
ALLOWED_ORIGINS=http://46.149.71.162:3000,http://46.149.71.162,http://localhost:3000,http://localhost:3001
ANTHROPIC_API_KEY=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
EOF
        log_info "✅ Создан базовый .env файл"
    fi
fi

# Создание необходимых директорий
log_step "Создание директорий..."
mkdir -p data/reports data/uploads data/cache
log_info "✅ Директории созданы"

# Запуск приложения
log_step "Запуск монолитного backend..."
cd backend

log_info "🚀 Запускаем DevAssist Pro на порту 8000..."
log_info "   Логи будут сохранены в app.log"

# Запуск в фоне с логированием
nohup $python_cmd app.py > ../app.log 2>&1 &
APP_PID=$!

log_info "✅ Backend запущен с PID: $APP_PID"

# Ожидание запуска
log_step "Ожидание запуска приложения..."
sleep 5

# Проверка статуса
max_attempts=30
attempt=1

while [ $attempt -le $max_attempts ]; do
    if curl -s http://localhost:8000/health >/dev/null 2>&1; then
        health_response=$(curl -s http://localhost:8000/health)
        service_name=$(echo "$health_response" | grep -o '"service":"[^"]*"' | cut -d'"' -f4)
        
        if [ "$service_name" = "devassist-pro-monolith" ]; then
            log_info "✅ ПОЛНЫЙ монолитный backend успешно запущен!"
            break
        else
            log_warn "Запущен сервис: $service_name"
        fi
    else
        log_warn "Попытка $attempt/$max_attempts: Backend еще не готов..."
    fi
    
    # Проверяем, что процесс еще работает
    if ! kill -0 $APP_PID 2>/dev/null; then
        log_error "❌ Процесс backend завершился!"
        log_error "Логи:"
        tail -20 ../app.log
        exit 1
    fi
    
    sleep 2
    ((attempt++))
done

if [ $attempt -gt $max_attempts ]; then
    log_error "❌ Backend не смог запуститься за разумное время"
    log_error "Последние логи:"
    tail -20 ../app.log
    exit 1
fi

# Финальная проверка
cd ..
echo ""
log_info "🎉 DevAssist Pro успешно запущен!"
echo "=" * 60
echo ""

echo "🌐 Доступные endpoints:"
echo "   • Главная:      http://localhost:8000/"
echo "   • Health:       http://localhost:8000/health"
echo "   • API Docs:     http://localhost:8000/docs"
echo "   • API Info:     http://localhost:8000/api"
echo "   • Admin:        http://localhost:8000/api/admin/status"
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
log_info "✨ Монолитный backend DevAssist Pro работает!"
log_info "🔗 Проверьте: http://46.149.71.162:8000/"