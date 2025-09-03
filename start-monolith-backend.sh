#!/bin/bash

# DevAssist Pro - Запуск монолитного backend'а
# Автор: Claude Code Assistant
# Дата: $(date +%Y-%m-%d)

set -e  # Остановить выполнение при любой ошибке

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Функция для вывода сообщений
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

# Проверка что скрипт запущен из правильной директории
if [ ! -f "backend/docker-compose.monolith.yml" ]; then
    log_error "Файл backend/docker-compose.monolith.yml не найден!"
    log_error "Запустите скрипт из корневой директории проекта DevAssist-Pro"
    exit 1
fi

log_info "🚀 Запуск DevAssist Pro - Монолитный Backend"
echo "=" * 60

# Проверка наличия Docker
log_step "Проверка Docker..."
if ! command -v docker &> /dev/null; then
    log_error "Docker не установлен! Установите Docker и попробуйте снова."
    exit 1
fi

if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    log_error "Docker Compose не установлен! Установите Docker Compose и попробуйте снова."
    exit 1
fi

# Определяем команду для docker compose
if command -v docker-compose &> /dev/null; then
    DOCKER_COMPOSE="docker-compose"
else
    DOCKER_COMPOSE="docker compose"
fi

log_info "✅ Docker найден: $(docker --version)"
log_info "✅ Docker Compose найден: $($DOCKER_COMPOSE --version)"

# Проверка наличия .env файла
log_step "Проверка конфигурации..."
if [ ! -f ".env" ]; then
    log_warn "Файл .env не найден. Создаем из .env.example..."
    if [ -f ".env.example" ]; then
        cp .env.example .env
        log_info "✅ Файл .env создан из .env.example"
        log_warn "⚠️  ВАЖНО: Настройте переменные окружения в файле .env перед запуском!"
        log_warn "⚠️  Особенно обратите внимание на:"
        log_warn "     - ANTHROPIC_API_KEY (для AI анализа)"
        log_warn "     - OPENAI_API_KEY (для AI анализа)"
        log_warn "     - ADMIN_PASSWORD (пароль администратора)"
    else
        log_error "Файл .env.example не найден! Создайте .env файл вручную."
        exit 1
    fi
fi

# Переход в директорию backend
cd backend

log_step "Остановка существующих контейнеров..."
$DOCKER_COMPOSE -f docker-compose.monolith.yml down 2>/dev/null || true

log_step "Очистка старых данных..."
docker system prune -f --volumes 2>/dev/null || true

log_step "Сборка Docker образов..."
$DOCKER_COMPOSE -f docker-compose.monolith.yml build --no-cache

log_step "Запуск сервисов..."
$DOCKER_COMPOSE -f docker-compose.monolith.yml up -d

# Ожидание запуска сервисов
log_step "Ожидание запуска сервисов..."
sleep 10

# Проверка статуса контейнеров
log_step "Проверка статуса контейнеров..."
$DOCKER_COMPOSE -f docker-compose.monolith.yml ps

# Проверка здоровья приложения
log_step "Проверка здоровья приложения..."
max_attempts=30
attempt=1

while [ $attempt -le $max_attempts ]; do
    if curl -s http://localhost:8000/health >/dev/null 2>&1; then
        log_info "✅ Backend успешно запущен!"
        break
    else
        log_warn "Попытка $attempt/$max_attempts: Backend еще не готов..."
        sleep 2
        ((attempt++))
    fi
done

if [ $attempt -gt $max_attempts ]; then
    log_error "❌ Backend не смог запуститься за разумное время"
    log_error "Проверьте логи: $DOCKER_COMPOSE -f docker-compose.monolith.yml logs"
    exit 1
fi

# Проверка API endpoints
log_step "Проверка API endpoints..."
echo ""
echo "🌐 Доступные endpoints:"
echo "   • Главная страница:    http://localhost:8000/"
echo "   • Health Check:        http://localhost:8000/health"
echo "   • API Documentation:   http://localhost:8000/docs"
echo "   • Admin Status:        http://localhost:8000/api/admin/status"
echo "   • Analytics Dashboard: http://localhost:8000/api/analytics/dashboard"
echo ""

# Показ логов последние 20 строк
log_step "Последние логи приложения:"
$DOCKER_COMPOSE -f docker-compose.monolith.yml logs --tail=20 app

echo ""
log_info "🎉 DevAssist Pro Backend успешно запущен!"
echo "=" * 60
echo ""
echo "📋 Полезные команды:"
echo "   • Просмотр логов:     cd backend && $DOCKER_COMPOSE -f docker-compose.monolith.yml logs -f"
echo "   • Остановка:          cd backend && $DOCKER_COMPOSE -f docker-compose.monolith.yml down"
echo "   • Перезапуск:         cd backend && $DOCKER_COMPOSE -f docker-compose.monolith.yml restart"
echo "   • Статус:             cd backend && $DOCKER_COMPOSE -f docker-compose.monolith.yml ps"
echo ""
echo "🔗 Frontend React приложение должно быть доступно на: http://localhost:3000"
echo "🔗 Backend API доступен на: http://localhost:8000"
echo ""

# Проверка наличия API ключей
log_step "Проверка конфигурации AI провайдеров..."
if curl -s http://localhost:8000/api/llm/health | grep -q "healthy"; then
    log_info "✅ AI провайдеры настроены корректно"
else
    log_warn "⚠️  AI провайдеры требуют настройки. Проверьте API ключи в .env файле"
fi

log_info "✨ Запуск завершен успешно!"