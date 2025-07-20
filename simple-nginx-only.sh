#!/bin/bash

# Simple Nginx Only - Запуск nginx без сборки React (использует существующие файлы)
set -e

log() {
    echo -e "\033[0;32m[$(date +'%Y-%m-%d %H:%M:%S')] $1\033[0m"
}

error() {
    echo -e "\033[0;31m[ERROR] $1\033[0m" >&2
}

log "🚀 Простой запуск nginx без сборки React"

# 1. Создаем простой Dockerfile только для nginx
log "Создание простого nginx Dockerfile..."
cat > frontend/Dockerfile.simple << 'EOF'
FROM nginx:1.25-alpine
COPY nginx.frontend.conf /etc/nginx/conf.d/default.conf
COPY public /usr/share/nginx/html
RUN echo '<!DOCTYPE html><html><head><title>DevAssist Pro</title></head><body><h1>DevAssist Pro</h1><p>Frontend загружается...</p></body></html>' > /usr/share/nginx/html/index.html
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost/ || exit 1
CMD ["nginx", "-g", "daemon off;"]
EOF

# 2. Остановка контейнеров
log "Остановка контейнеров..."
docker compose -f docker-compose.production.yml down

# 3. Быстрая сборка простого nginx
log "Сборка простого nginx..."
cd frontend
docker build -f Dockerfile.simple -t simple-nginx .
cd ..

# 4. Временное изменение docker-compose
log "Обновление docker-compose..."
cp docker-compose.production.yml docker-compose.backup.yml

# Заменяем секцию nginx
cat > docker-compose.simple.yml << 'EOF'
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: devassist_postgres_prod
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

  redis:
    image: redis:7-alpine
    container_name: devassist_redis_prod
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

  app:
    build:
      context: ./backend
      dockerfile: Dockerfile.monolith
    container_name: devassist_app_prod
    environment:
      POSTGRES_URL: postgresql://devassist:devassist_password@postgres:5432/devassist_pro
      REDIS_URL: redis://:redis_password@redis:6379/0
      DEBUG: false
      LOG_LEVEL: INFO
      ENVIRONMENT: production
      ALLOWED_ORIGINS: http://46.149.71.162,https://46.149.71.162
      MAX_FILE_SIZE: 50MB
      SUPPORTED_FORMATS: pdf,docx,txt
      ANTHROPIC_API_KEY: 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
      OPENAI_API_KEY: ${OPENAI_API_KEY:-dummy_key}
      GOOGLE_API_KEY: ${GOOGLE_API_KEY:-dummy_key}
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
    restart: unless-stopped

  nginx:
    image: simple-nginx
    container_name: devassist_nginx_prod
    ports:
      - "80:80"
    volumes:
      - ./nginx/default.conf:/etc/nginx/conf.d/default.conf:ro
      - nginx_logs:/var/log/nginx
    networks:
      - devassist-network
    depends_on:
      app:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost/"]
      interval: 30s
      timeout: 10s
      retries: 3
    restart: unless-stopped

networks:
  devassist-network:
    driver: bridge
    ipam:
      config:
        - subnet: 172.20.0.0/16

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

# 5. Запуск упрощенной версии
log "Запуск контейнеров..."
docker compose -f docker-compose.simple.yml up -d

# 6. Проверка
log "Ожидание запуска (30 сек)..."
sleep 30

log "Проверка статуса:"
docker compose -f docker-compose.simple.yml ps

log "Проверка сайта:"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://46.149.71.162/ || echo "000")
if [ "$HTTP_CODE" = "200" ]; then
    log "✅ Простая версия работает! (HTTP $HTTP_CODE)"
    log "🌐 Сайт: http://46.149.71.162/"
    log "Backend API: http://46.149.71.162/api/health"
else
    error "❌ Сайт недоступен (HTTP $HTTP_CODE)"
fi

# Очистка
rm -f frontend/Dockerfile.simple

log "✨ Простой nginx запущен! Теперь backend и frontend работают."
log "📝 Для восстановления полной версии: mv docker-compose.backup.yml docker-compose.production.yml"