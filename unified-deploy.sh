#!/bin/bash

# Unified DevAssist Pro Deployment - Backend + Frontend
# Запускает и backend API, и frontend одновременно

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

log "🚀 Запуск Unified DevAssist Pro Deployment - Backend + Frontend"

# Остановка существующих контейнеров
log "Остановка существующих контейнеров..."
docker compose down --remove-orphans 2>/dev/null || true
docker stop $(docker ps -aq) 2>/dev/null || true

# Создание unified docker-compose конфигурации
log "Создание unified deployment конфигурации..."
cat > docker-compose.unified.yml << 'EOF'
services:
  # PostgreSQL Database
  postgres:
    image: postgres:15-alpine
    container_name: devassist_postgres_unified
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
    restart: unless-stopped

  # Redis Cache
  redis:
    image: redis:7-alpine
    container_name: devassist_redis_unified
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
    restart: unless-stopped

  # Backend FastAPI Application
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile.monolith
    container_name: devassist_backend_unified
    ports:
      - "8000:8000"  # Backend API на порту 8000
    environment:
      # Database Configuration
      POSTGRES_URL: postgresql://devassist:devassist_password@postgres:5432/devassist_pro
      
      # Redis Configuration
      REDIS_URL: redis://:redis_password@redis:6379/0
      
      # Application Settings
      DEBUG: false
      LOG_LEVEL: INFO
      ENVIRONMENT: production
      
      # CORS Settings - разрешаем frontend на порту 3000
      ALLOWED_ORIGINS: http://46.149.71.162,http://46.149.71.162:3000,http://localhost:3000,http://frontend:3000
      
      # File Upload Settings
      MAX_FILE_SIZE: 50MB
      SUPPORTED_FORMATS: pdf,docx,txt
      
      # AI Provider API Keys
      ANTHROPIC_API_KEY: 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
      OPENAI_API_KEY: ${OPENAI_API_KEY:-dummy_key}
      GOOGLE_API_KEY: ${GOOGLE_API_KEY:-dummy_key}
      USE_REAL_API: true
      
      # Server Configuration
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
    restart: unless-stopped

  # Frontend React Application
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: devassist_frontend_unified
    ports:
      - "3000:3000"  # Frontend на порту 3000
    environment:
      # API URL указывает на backend контейнер
      REACT_APP_API_URL: http://46.149.71.162:8000
      REACT_APP_WS_URL: ws://46.149.71.162:8000/ws
      REACT_APP_ENVIRONMENT: production
      NODE_ENV: development  # Используем development mode для live reload
      CHOKIDAR_USEPOLLING: true
      WATCHPACK_POLLING: true
    volumes:
      - ./frontend/src:/app/src:ro
      - ./frontend/public:/app/public:ro
      - ./frontend/package.json:/app/package.json:ro
    networks:
      - devassist-network
    depends_on:
      - backend
    restart: unless-stopped

  # Nginx для роутинга (опционально)
  nginx:
    image: nginx:alpine
    container_name: devassist_nginx_unified
    ports:
      - "80:80"  # Главный вход через порт 80
    volumes:
      - ./nginx/unified.conf:/etc/nginx/conf.d/default.conf:ro
    networks:
      - devassist-network
    depends_on:
      - backend
      - frontend
    restart: unless-stopped

networks:
  devassist-network:
    driver: bridge

volumes:
  postgres_data:
    driver: local
  redis_data:
    driver: local
  app_data:
    driver: local
EOF

# Создание Nginx конфигурации для unified deployment
log "Создание Nginx конфигурации..."
mkdir -p nginx
cat > nginx/unified.conf << 'EOF'
server {
    listen 80;
    server_name 46.149.71.162 localhost;

    # Frontend - проксируем на React dev server
    location / {
        proxy_pass http://frontend:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Hot reload support
        proxy_read_timeout 86400;
    }

    # Backend API
    location /api/ {
        proxy_pass http://backend:8000/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WebSocket support
    location /ws/ {
        proxy_pass http://backend:8000/ws/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Health check
    location /health {
        proxy_pass http://backend:8000/health;
        proxy_set_header Host $host;
    }
}
EOF

# Создание простого Dockerfile для frontend если его нет
if [ ! -f "./frontend/Dockerfile" ]; then
    log "Создание Dockerfile для frontend..."
    cat > frontend/Dockerfile << 'EOF'
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Expose port
EXPOSE 3000

# Start development server
CMD ["npm", "start"]
EOF
fi

# Сборка и запуск сервисов
log "Сборка и запуск всех сервисов..."

# Сначала запускаем базы данных
log "Запуск баз данных..."
docker compose -f docker-compose.unified.yml up -d postgres redis

# Ждем готовности баз данных
log "Ожидание готовности баз данных..."
sleep 20

# Запускаем backend
log "Запуск backend сервиса..."
docker compose -f docker-compose.unified.yml up -d backend

# Ждем готовности backend
log "Ожидание готовности backend..."
sleep 15

# Запускаем frontend
log "Запуск frontend сервиса..."
docker compose -f docker-compose.unified.yml up -d frontend

# Ждем готовности frontend
log "Ожидание готовности frontend..."
sleep 20

# Запускаем nginx
log "Запуск Nginx reverse proxy..."
docker compose -f docker-compose.unified.yml up -d nginx

# Финальная проверка
log "Финальная проверка сервисов..."
sleep 10

# Проверка контейнеров
log "Статус контейнеров:"
docker compose -f docker-compose.unified.yml ps

# Проверка логов
log "Проверка логов backend:"
docker compose -f docker-compose.unified.yml logs --tail=10 backend

log "Проверка логов frontend:"
docker compose -f docker-compose.unified.yml logs --tail=10 frontend

# Health checks
log "Проверка доступности сервисов..."

# Проверка backend
if curl -f -s "http://localhost:8000/health" > /dev/null 2>&1; then
    info "✅ Backend работает на порту 8000"
else
    warning "⚠️  Backend на порту 8000 не отвечает"
    docker compose -f docker-compose.unified.yml logs backend | tail -5
fi

# Проверка frontend
if curl -f -s "http://localhost:3000" > /dev/null 2>&1; then
    info "✅ Frontend работает на порту 3000"
else
    warning "⚠️  Frontend на порту 3000 не отвечает"
    docker compose -f docker-compose.unified.yml logs frontend | tail -5
fi

# Проверка nginx
if curl -f -s "http://localhost/" > /dev/null 2>&1; then
    info "✅ Nginx работает на порту 80"
else
    warning "⚠️  Nginx на порту 80 не отвечает"
    docker compose -f docker-compose.unified.yml logs nginx | tail -5
fi

# Итоговый статус
log "🎉 Unified Deployment завершен!"
echo
info "📍 Доступ к приложению:"
info "   🌐 Основной сайт:    http://46.149.71.162/      (через Nginx)"
info "   ⚛️  Frontend прямо:   http://46.149.71.162:3000/ (React dev server)"
info "   🔧 Backend API:      http://46.149.71.162:8000/ (FastAPI)"
info "   ❤️  Health check:    http://46.149.71.162:8000/health"
echo
info "🐳 Запущенные сервисы:"
docker compose -f docker-compose.unified.yml ps
echo
info "📊 Использование ресурсов:"
docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}" 2>/dev/null || echo "Статистика будет доступна через несколько секунд"
echo
info "🔧 Команды управления:"
info "   Посмотреть логи:     docker compose -f docker-compose.unified.yml logs -f"
info "   Остановить:          docker compose -f docker-compose.unified.yml down"
info "   Перезапустить:       docker compose -f docker-compose.unified.yml restart"
info "   Пересобрать:         docker compose -f docker-compose.unified.yml up -d --build"
echo

log "✨ Теперь у вас работают И backend И frontend одновременно!"
info "Backend API доступен на http://46.149.71.162:8000"
info "Frontend приложение доступно на http://46.149.71.162:3000"
info "Unified доступ через Nginx на http://46.149.71.162"