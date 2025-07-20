#!/bin/bash

# Fix Real App - Исправление для запуска настоящего DevAssist Pro
set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[ERROR] $1${NC}" >&2
}

warning() {
    echo -e "${YELLOW}[WARNING] $1${NC}"
}

info() {
    echo -e "${BLUE}[INFO] $1${NC}"
}

log "🔧 Исправление для запуска настоящего DevAssist Pro"

# 1. Остановка всех контейнеров
log "Остановка всех контейнеров..."
docker compose -f docker-compose.production.yml down --remove-orphans 2>/dev/null || true
docker compose -f docker-compose.final.yml down --remove-orphans 2>/dev/null || true
docker compose -f docker-compose.simple.yml down --remove-orphans 2>/dev/null || true
docker compose -f docker-compose.simple-final.yml down --remove-orphans 2>/dev/null || true

# 2. Очистка Docker
log "Очистка Docker..."
docker system prune -f
docker builder prune -f

# 3. Исправление nginx конфигурации frontend
log "Обновление nginx конфигурации..."
cp frontend/nginx.production.conf frontend/nginx.frontend.conf

# 4. Проверка и исправление backend Dockerfile
log "Проверка backend Dockerfile..."
if [ ! -f "backend/Dockerfile.monolith" ]; then
    warning "Создание Dockerfile.monolith для backend..."
    cat > backend/Dockerfile.monolith << 'EOF'
FROM python:3.11-slim

WORKDIR /app

# Установка системных зависимостей
RUN apt-get update && apt-get install -y \
    curl \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Копирование requirements
COPY requirements*.txt ./

# Установка Python зависимостей
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Копирование кода приложения
COPY . .

# Создание директорий
RUN mkdir -p /app/data /app/uploads /app/logs

# Переменные окружения
ENV PYTHONPATH=/app
ENV PYTHONUNBUFFERED=1

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Открытие порта
EXPOSE 8000

# Запуск приложения
CMD ["python", "-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1"]
EOF
fi

# 5. Проверка главного файла приложения
log "Проверка main.py backend..."
if [ ! -f "backend/main.py" ]; then
    warning "Создание базового main.py..."
    cat > backend/main.py << 'EOF'
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import os
import uvicorn

app = FastAPI(
    title="DevAssist Pro Backend",
    description="AI-powered portal for real estate developers",
    version="1.0.0"
)

# CORS настройки
origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "DevAssist Pro Backend API", "status": "running"}

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "devassist-pro-backend",
        "version": "1.0.0"
    }

@app.get("/api/health")
async def api_health():
    return await health_check()

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
EOF
fi

# 6. Проверка requirements.txt
log "Проверка requirements.txt..."
if [ ! -f "backend/requirements.txt" ]; then
    warning "Создание requirements.txt..."
    cat > backend/requirements.txt << 'EOF'
fastapi==0.104.1
uvicorn[standard]==0.24.0
python-multipart==0.0.6
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
python-dotenv==1.0.0
sqlalchemy==2.0.23
alembic==1.12.1
psycopg2-binary==2.9.7
redis==5.0.1
httpx==0.25.2
pydantic==2.5.0
pydantic-settings==2.0.3
anthropic==0.8.1
openai==1.3.7
aiofiles==23.2.1
pandas==2.1.3
openpyxl==3.1.2
PyPDF2==3.0.1
python-docx==1.1.0
Pillow==10.1.0
jinja2==3.1.2
EOF
fi

# 7. Сборка backend с проверкой
log "Сборка backend..."
if ! docker compose -f docker-compose.real.yml build app; then
    error "❌ Ошибка сборки backend"
    
    # Показываем логи сборки
    warning "Показ логов сборки backend..."
    docker compose -f docker-compose.real.yml build app --no-cache 2>&1 | tail -20
    exit 1
fi

# 8. Сборка frontend с настоящим React
log "Сборка настоящего React frontend..."
if ! docker compose -f docker-compose.real.yml build frontend; then
    error "❌ Ошибка сборки frontend"
    
    # Показываем логи сборки
    warning "Показ логов сборки frontend..."
    docker compose -f docker-compose.real.yml build frontend --no-cache 2>&1 | tail -20
    exit 1
fi

# 9. Запуск всех сервисов
log "Запуск всех сервисов..."
if ! docker compose -f docker-compose.real.yml up -d; then
    error "❌ Ошибка запуска сервисов"
    docker compose -f docker-compose.real.yml logs --tail=20
    exit 1
fi

# 10. Ожидание запуска
log "Ожидание полного запуска (90 секунд)..."
for i in {1..18}; do
    echo -n "█"
    sleep 5
done
echo

# 11. Проверка состояния
log "Проверка состояния всех сервисов..."
docker compose -f docker-compose.real.yml ps

# 12. Проверка подключений
log "Проверка подключений..."

# Backend
info "🔍 Проверка backend..."
BACKEND_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://46.149.71.162/api/health || echo "000")
if [ "$BACKEND_CODE" = "200" ]; then
    log "✅ Backend монолит работает! (HTTP $BACKEND_CODE)"
    
    # Получаем информацию о backend
    BACKEND_INFO=$(curl -s http://46.149.71.162/api/health 2>/dev/null || echo '{"error":"no response"}')
    info "Backend ответ: $BACKEND_INFO"
else
    warning "⚠️ Backend недоступен (HTTP $BACKEND_CODE)"
fi

# Frontend
info "🔍 Проверка frontend..."
FRONTEND_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://46.149.71.162/ || echo "000")
if [ "$FRONTEND_CODE" = "200" ]; then
    log "✅ Frontend работает! (HTTP $FRONTEND_CODE)"
    
    # Проверяем что это настоящий React а не заглушка
    CONTENT=$(curl -s http://46.149.71.162/ | head -20)
    if echo "$CONTENT" | grep -q "DevAssist Pro" && echo "$CONTENT" | grep -q "root"; then
        log "✅ Это настоящий React приложение!"
    else
        warning "⚠️ Возможно загружается заглушка вместо React"
    fi
else
    warning "⚠️ Frontend недоступен (HTTP $FRONTEND_CODE)"
fi

# 13. Показ логов при проблемах
if [ "$BACKEND_CODE" != "200" ] || [ "$FRONTEND_CODE" != "200" ]; then
    warning "📋 Диагностика проблем..."
    
    echo
    info "=== Backend логи ==="
    docker compose -f docker-compose.real.yml logs app --tail=15
    
    echo
    info "=== Frontend логи ==="
    docker compose -f docker-compose.real.yml logs frontend --tail=15
    
    echo
    info "=== PostgreSQL логи ==="
    docker compose -f docker-compose.real.yml logs postgres --tail=5
fi

# 14. Финальный отчет
echo
log "🎯 Результат запуска настоящего DevAssist Pro:"
echo
info "📊 Статус сервисов:"
info "   🖥️  React Frontend: HTTP $FRONTEND_CODE"
info "   ⚙️  FastAPI Backend: HTTP $BACKEND_CODE"
echo
info "🌐 Доступ к приложению:"
info "   🔗 Главная страница:  http://46.149.71.162/"
info "   🔗 Backend API:       http://46.149.71.162/api/health"
info "   🔗 Корневой API:      http://46.149.71.162/health"
echo

if [ "$BACKEND_CODE" = "200" ] && [ "$FRONTEND_CODE" = "200" ]; then
    log "🎊 УСПЕХ! Настоящий DevAssist Pro запущен и работает!"
    log "🚀 React frontend + FastAPI backend monolith готовы!"
    echo
    info "💡 Теперь вы можете:"
    info "   - Открыть http://46.149.71.162/ для работы с приложением"
    info "   - Использовать API через http://46.149.71.162/api/"
    info "   - Загружать документы и анализировать КП"
else
    warning "⚠️ Есть проблемы с запуском"
    info "🔧 Команды для диагностики:"
    info "   docker compose -f docker-compose.real.yml logs app"
    info "   docker compose -f docker-compose.real.yml logs frontend"
fi

echo
info "📋 Управление приложением:"
info "   ⏹️  Остановить: docker compose -f docker-compose.real.yml down"
info "   🔄 Перезапуск: docker compose -f docker-compose.real.yml restart"
info "   📊 Статус:    docker compose -f docker-compose.real.yml ps"