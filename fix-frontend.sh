#!/bin/bash

# Fix Frontend для DevAssist Pro
# Исправляет проблему с недоступным frontend

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

log "🔧 Исправление Frontend для DevAssist Pro"

# Проверка статуса контейнеров
log "Проверка статуса контейнеров..."
docker compose ps

# Проверка логов frontend
log "Проверка логов frontend..."
docker compose logs --tail=50 frontend

# Перезапуск frontend
log "Перезапуск frontend контейнера..."
docker compose restart frontend

# Альтернативное решение - запуск frontend с другой командой
log "Пересоздание frontend с исправленной командой..."
docker compose stop frontend
docker compose rm -f frontend

# Обновление docker-compose.yml с рабочей конфигурацией frontend
log "Обновление конфигурации frontend..."
cat > docker-compose-fixed.yml << 'EOF'
services:
  # PostgreSQL
  postgres:
    image: postgres:15-alpine
    container_name: devassist_postgres
    environment:
      POSTGRES_DB: devassist_pro
      POSTGRES_USER: devassist
      POSTGRES_PASSWORD: devassist_password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - devassist-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U devassist"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Redis
  redis:
    image: redis:7-alpine
    container_name: devassist_redis
    command: redis-server --requirepass redis_password
    volumes:
      - redis_data:/data
    networks:
      - devassist-network
    healthcheck:
      test: ["CMD", "redis-cli", "--raw", "incr", "ping"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Backend
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile.monolith
    container_name: devassist_backend
    ports:
      - "8000:8000"
    environment:
      POSTGRES_URL: postgresql://devassist:devassist_password@postgres:5432/devassist_pro
      DATABASE_URL: postgresql://devassist:devassist_password@postgres:5432/devassist_pro
      REDIS_URL: redis://:redis_password@redis:6379/0
      ADMIN_PASSWORD: admin123
      ADMIN_EMAIL: admin@devassist.pro
      DEBUG: false
      LOG_LEVEL: INFO
      ENVIRONMENT: production
      ALLOWED_ORIGINS: "*"
      MAX_FILE_SIZE: 50MB
      SUPPORTED_FORMATS: pdf,docx,txt
      ANTHROPIC_API_KEY: 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
      USE_REAL_API: true
      HOST: 0.0.0.0
      PORT: 8000
    volumes:
      - app_data:/app/data
    networks:
      - devassist-network
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Frontend - Фиксированная версия
  frontend:
    image: node:18-alpine
    container_name: devassist_frontend
    working_dir: /app
    ports:
      - "3000:3000"
    volumes:
      - ./frontend:/app
    environment:
      REACT_APP_API_URL: http://46.149.71.162:8000
      REACT_APP_WS_URL: ws://46.149.71.162:8000/ws
      NODE_ENV: development
      CHOKIDAR_USEPOLLING: true
      HOST: 0.0.0.0
      PORT: 3000
    command: sh -c "npm install --force && npm start"
    networks:
      - devassist-network
    depends_on:
      - backend
    stdin_open: true
    tty: true

  # Nginx - упрощенная версия
  nginx:
    image: nginx:alpine
    container_name: devassist_nginx
    ports:
      - "80:80"
    volumes:
      - ./nginx/fixed.conf:/etc/nginx/conf.d/default.conf:ro
    networks:
      - devassist-network
    depends_on:
      - backend

networks:
  devassist-network:
    driver: bridge

volumes:
  postgres_data:
  redis_data:
  app_data:
EOF

# Создание упрощенной конфигурации Nginx
log "Создание исправленной Nginx конфигурации..."
mkdir -p nginx
cat > nginx/fixed.conf << 'EOF'
server {
    listen 80;
    server_name _;

    # Backend API proxy (основной функционал)
    location / {
        proxy_pass http://backend:8000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Health check
    location /health {
        proxy_pass http://backend:8000/health;
    }

    # API docs
    location /docs {
        proxy_pass http://backend:8000/docs;
    }

    location /openapi.json {
        proxy_pass http://backend:8000/openapi.json;
    }

    location /redoc {
        proxy_pass http://backend:8000/redoc;
    }
}
EOF

# Перезапуск с новой конфигурацией
log "Применение исправленной конфигурации..."
docker compose -f docker-compose-fixed.yml up -d

log "Ожидание запуска сервисов (30 сек)..."
sleep 30

# Проверка статуса
log "Проверка статуса после исправления..."
docker compose -f docker-compose-fixed.yml ps

# Проверка доступности
log "Проверка доступности сервисов..."

if curl -f -s "http://localhost:8000/health" > /dev/null 2>&1; then
    info "✅ Backend API работает на порту 8000!"
else
    warning "⚠️  Backend API не отвечает"
fi

if curl -f -s "http://localhost:3000" > /dev/null 2>&1; then
    info "✅ Frontend работает на порту 3000!"
else
    warning "⚠️  Frontend еще запускается, проверьте через минуту"
fi

if curl -f -s "http://localhost/health" > /dev/null 2>&1; then
    info "✅ Nginx проксирует API на порту 80!"
else
    warning "⚠️  Nginx не работает корректно"
fi

# Итоговая информация
echo
log "🎉 Исправления применены!"
echo
info "📍 Доступ к сервисам:"
info "   🔧 Backend API:   http://46.149.71.162:8000/"
info "   📚 API Docs:      http://46.149.71.162:8000/docs"
info "   ⚛️  Frontend:      http://46.149.71.162:3000/"
info "   🌐 Через Nginx:   http://46.149.71.162/ (API endpoints)"
echo
info "🔑 Учетные данные:"
info "   Email:    admin@devassist.pro"
info "   Password: admin123"
echo
warning "⚠️  Frontend может требовать 1-2 минуты для полного запуска"
warning "   Если не работает сразу, подождите и обновите страницу"
echo
info "💡 Альтернативный доступ:"
info "   - Backend API работает напрямую на порту 8000"
info "   - Frontend (когда запустится) на порту 3000"
info "   - Nginx на порту 80 проксирует на backend"
echo
log "✨ Используйте backend API напрямую или дождитесь запуска frontend!"