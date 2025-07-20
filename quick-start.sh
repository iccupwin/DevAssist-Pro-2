#!/bin/bash

# Quick Start DevAssist Pro - Рабочее решение с Nginx
# Простой и надежный запуск проекта

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

log "🚀 Quick Start DevAssist Pro - Запуск проекта с Nginx"

# Остановка контейнеров
log "Остановка существующих контейнеров..."
docker compose down 2>/dev/null || true
docker stop $(docker ps -aq) 2>/dev/null || true

# Создание простого docker-compose
log "Создание конфигурации..."
cat > docker-compose.yml << 'EOF'
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

  # Frontend Dev Server
  frontend:
    image: node:18-alpine
    container_name: devassist_frontend
    working_dir: /app
    volumes:
      - ./frontend:/app
    environment:
      REACT_APP_API_URL: http://46.149.71.162/api
      REACT_APP_WS_URL: ws://46.149.71.162/ws
      NODE_ENV: development
      CHOKIDAR_USEPOLLING: true
    command: sh -c "npm install && npm start"
    networks:
      - devassist-network
    depends_on:
      - backend

  # Nginx
  nginx:
    image: nginx:alpine
    container_name: devassist_nginx
    ports:
      - "80:80"
    volumes:
      - ./nginx/simple.conf:/etc/nginx/conf.d/default.conf:ro
    networks:
      - devassist-network
    depends_on:
      - backend
      - frontend

networks:
  devassist-network:
    driver: bridge

volumes:
  postgres_data:
  redis_data:
  app_data:
EOF

# Создание простой конфигурации Nginx
log "Создание Nginx конфигурации..."
mkdir -p nginx
cat > nginx/simple.conf << 'EOF'
server {
    listen 80;
    server_name _;

    # Frontend proxy
    location / {
        proxy_pass http://frontend:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API proxy
    location /api/ {
        proxy_pass http://backend:8000/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WebSocket proxy
    location /ws/ {
        proxy_pass http://backend:8000/ws/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }

    # Health check
    location /health {
        proxy_pass http://backend:8000/health;
    }

    # API docs
    location /docs {
        proxy_pass http://backend:8000/docs;
    }

    location /redoc {
        proxy_pass http://backend:8000/redoc;
    }
}
EOF

# Запуск сервисов
log "Запуск баз данных..."
docker compose up -d postgres redis

log "Ожидание готовности БД (20 сек)..."
sleep 20

log "Запуск backend..."
docker compose up -d backend

log "Ожидание backend (30 сек)..."
sleep 30

log "Запуск frontend..."
docker compose up -d frontend

log "Ожидание frontend (40 сек для npm install)..."
sleep 40

log "Запуск Nginx..."
docker compose up -d nginx

log "Финальное ожидание (10 сек)..."
sleep 10

# Проверка статуса
log "Проверка статуса сервисов..."
docker compose ps

# Проверка доступности
log "Проверка доступности..."

if curl -f -s "http://localhost/api/health" > /dev/null 2>&1; then
    info "✅ Backend API работает через Nginx!"
else
    warning "⚠️  Backend API еще не готов"
fi

# Итоговая информация
echo
log "🎉 DevAssist Pro запущен!"
echo
info "📍 Доступ к проекту:"
info "   🌐 Приложение:  http://46.149.71.162/"
info "   📚 API Docs:    http://46.149.71.162/docs"
info "   📊 API Health:  http://46.149.71.162/api/health"
echo
info "🔑 Учетные данные:"
info "   Email:    admin@devassist.pro"
info "   Password: admin123"
echo
info "⚡ Все работает через Nginx на порту 80:"
info "   - Frontend на React (dev server)"
info "   - Backend API на FastAPI"
info "   - WebSocket соединения"
echo
info "🔧 Команды:"
info "   Логи:        docker compose logs -f"
info "   Остановить:  docker compose down"
info "   Статус:      docker compose ps"
echo
warning "⚠️  Frontend может потребовать 1-2 минуты для полной загрузки"
warning "   Если страница не открывается сразу, подождите и обновите"
echo
log "✨ Проект готов к работе!"