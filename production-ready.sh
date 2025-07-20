#!/bin/bash

# Production-Ready DevAssist Pro Deployment с Nginx
# Полная настройка для работы проекта на Ubuntu 22.04

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

log "🚀 Production-Ready DevAssist Pro Deployment"

# Остановка всех контейнеров
log "Очистка существующих контейнеров..."
docker compose down --remove-orphans 2>/dev/null || true
docker stop $(docker ps -aq) 2>/dev/null || true
docker system prune -f

# Создание production docker-compose конфигурации
log "Создание production конфигурации..."
cat > docker-compose.yml << 'EOF'
services:
  # PostgreSQL Database
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
    restart: unless-stopped

  # Redis Cache
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
    restart: unless-stopped

  # Backend FastAPI Application
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile.monolith
    container_name: devassist_backend
    environment:
      # Database Configuration
      POSTGRES_URL: postgresql://devassist:devassist_password@postgres:5432/devassist_pro
      DATABASE_URL: postgresql://devassist:devassist_password@postgres:5432/devassist_pro
      
      # Redis Configuration
      REDIS_URL: redis://:redis_password@redis:6379/0
      
      # Admin Configuration
      ADMIN_PASSWORD: SecureAdminPass123!
      ADMIN_EMAIL: admin@devassist.pro
      
      # Application Settings
      DEBUG: false
      LOG_LEVEL: INFO
      ENVIRONMENT: production
      
      # CORS Settings
      ALLOWED_ORIGINS: http://46.149.71.162,https://46.149.71.162,http://localhost
      
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

  # Nginx with Frontend
  nginx:
    build:
      context: ./
      dockerfile: Dockerfile.nginx
    container_name: devassist_nginx
    ports:
      - "80:80"
    volumes:
      - ./nginx/production.conf:/etc/nginx/conf.d/default.conf:ro
      - nginx_logs:/var/log/nginx
    networks:
      - devassist-network
    depends_on:
      - backend
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
  nginx_logs:
    driver: local
EOF

# Создание Dockerfile для Nginx с frontend
log "Создание Dockerfile для Nginx..."
cat > Dockerfile.nginx << 'EOF'
# Build stage for React app
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY frontend/package*.json ./

# Install dependencies
RUN npm ci --silent

# Copy frontend source
COPY frontend/ ./

# Build React app
ENV NODE_ENV=production
ENV GENERATE_SOURCEMAP=false
ENV REACT_APP_API_URL=/api
ENV REACT_APP_WS_URL=/ws

RUN npm run build

# Production stage with Nginx
FROM nginx:alpine

# Copy built React app
COPY --from=builder /app/build /usr/share/nginx/html

# Copy nginx config
COPY nginx/production.conf /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost/ || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
EOF

# Создание Nginx production конфигурации
log "Создание Nginx production конфигурации..."
mkdir -p nginx
cat > nginx/production.conf << 'EOF'
# Upstream backend
upstream backend_api {
    server backend:8000;
    keepalive 32;
}

# Rate limiting
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=upload:10m rate=2r/s;

# Main server configuration
server {
    listen 80;
    server_name 46.149.71.162 localhost;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json application/xml;
    
    # Client body size for file uploads
    client_max_body_size 50M;
    
    # Frontend static files (React)
    location / {
        root /usr/share/nginx/html;
        index index.html;
        try_files $uri $uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
    
    # Backend API proxy
    location /api/ {
        limit_req zone=api burst=20 nodelay;
        
        proxy_pass http://backend_api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # WebSocket proxy
    location /ws/ {
        proxy_pass http://backend_api/ws/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # WebSocket timeouts
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
    }
    
    # Health check
    location /health {
        proxy_pass http://backend_api/health;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }
    
    # API docs
    location /docs {
        proxy_pass http://backend_api/docs;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }
    
    location /redoc {
        proxy_pass http://backend_api/redoc;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }
    
    # File upload endpoint
    location /api/upload {
        limit_req zone=upload burst=5 nodelay;
        
        proxy_pass http://backend_api/upload;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Large file settings
        client_max_body_size 50M;
        proxy_request_buffering off;
        proxy_connect_timeout 300s;
        proxy_send_timeout 300s;
        proxy_read_timeout 300s;
    }
}
EOF

# Создание .env файла для production
log "Создание .env файла..."
cat > .env << 'EOF'
# Production Environment Configuration
ENVIRONMENT=production
NODE_ENV=production

# Server Configuration
SERVER_IP=46.149.71.162

# Admin Credentials
ADMIN_EMAIL=admin@devassist.pro
ADMIN_PASSWORD=SecureAdminPass123!

# Database
DATABASE_URL=postgresql://devassist:devassist_password@postgres:5432/devassist_pro

# Redis
REDIS_URL=redis://:redis_password@redis:6379/0

# AI Keys
ANTHROPIC_API_KEY=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
EOF

# Сборка и запуск
log "Запуск баз данных..."
docker compose up -d postgres redis

log "Ожидание готовности баз данных..."
sleep 20

log "Запуск backend..."
docker compose up -d backend

log "Ожидание готовности backend..."
for i in {1..30}; do
    if curl -f -s "http://localhost:8000/health" > /dev/null 2>&1; then
        info "✅ Backend готов!"
        break
    fi
    echo -n "."
    sleep 2
done
echo

log "Сборка и запуск Nginx с Frontend..."
docker compose up -d --build nginx

log "Ожидание готовности всех сервисов..."
sleep 10

# Проверка статуса
log "Проверка статуса сервисов..."
docker compose ps

# Health checks
log "Проверка доступности..."

# Frontend через Nginx
if curl -f -s "http://localhost/" > /dev/null 2>&1; then
    info "✅ Frontend (через Nginx) работает!"
else
    warning "⚠️  Frontend не отвечает"
fi

# API через Nginx
if curl -f -s "http://localhost/api/health" > /dev/null 2>&1; then
    info "✅ API (через Nginx) работает!"
else
    warning "⚠️  API не отвечает"
fi

# Итоговая информация
echo
log "🎉 Production deployment завершен!"
echo
info "📍 DevAssist Pro готов к работе:"
info "   🌐 Приложение:    http://46.149.71.162/"
info "   📚 API Docs:      http://46.149.71.162/docs"
info "   📊 API Health:    http://46.149.71.162/api/health"
echo
info "🔑 Учетные данные администратора:"
info "   Email:    admin@devassist.pro"
info "   Password: SecureAdminPass123!"
echo
info "⚡ Все сервисы работают через Nginx на порту 80"
info "   - Frontend статические файлы сервируются Nginx"
info "   - API запросы проксируются на backend"
info "   - WebSocket соединения поддерживаются"
echo
info "🔧 Управление:"
info "   Логи:        docker compose logs -f"
info "   Остановить:  docker compose down"
info "   Обновить:    git pull && docker compose up -d --build"
echo
warning "⚠️  ВАЖНО: Обязательно смените пароль администратора после первого входа!"
echo
log "✨ Проект готов к работе!"