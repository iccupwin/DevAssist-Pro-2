#!/bin/bash

# Build Frontend Only - Оптимизированная сборка только frontend с ограничением памяти
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

log "🔧 Оптимизированная сборка frontend только"

# 1. Проверка доступной памяти
log "Проверка системной памяти..."
MEMORY_KB=$(grep MemAvailable /proc/meminfo | awk '{print $2}')
MEMORY_MB=$((MEMORY_KB / 1024))
log "Доступная память: ${MEMORY_MB} MB"

if [ "$MEMORY_MB" -lt 1500 ]; then
    warning "⚠️ Мало памяти ($MEMORY_MB MB). Настройка для ограниченной памяти..."
    MEMORY_LIMIT=512
else
    log "✅ Достаточно памяти для сборки"
    MEMORY_LIMIT=1024
fi

# 2. Остановка контейнеров для освобождения памяти
log "Остановка контейнеров для освобождения памяти..."
docker compose -f docker-compose.production.yml down --remove-orphans || true

# 3. Очистка Docker кэша
log "Очистка Docker кэша..."
docker system prune -f
docker builder prune -f

# 4. Создание специального Dockerfile для низкой памяти
log "Создание оптимизированного Dockerfile..."
cat > frontend/Dockerfile.lowmem << EOF
# Low Memory Dockerfile for DevAssist Pro Frontend
FROM node:18-alpine AS builder

WORKDIR /app

# Ограничение памяти для Node.js
ENV NODE_OPTIONS="--max-old-space-size=${MEMORY_LIMIT}"
ENV CI=true

# Копируем только package files
COPY package*.json ./

# Устанавливаем зависимости с минимальным использованием памяти
RUN npm ci --silent --production=false --no-audit --no-fund

# Копируем исходный код
COPY . .

# Переменные для production
ENV NODE_ENV=production
ENV GENERATE_SOURCEMAP=false
ENV REACT_APP_API_URL=http://46.149.71.162/api
ENV REACT_APP_WS_URL=ws://46.149.71.162/ws

# Сборка с ограничением памяти
RUN npm run build

# Production stage
FROM nginx:1.25-alpine AS production
COPY nginx.frontend.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/build /usr/share/nginx/html
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chmod -R 755 /usr/share/nginx/html
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost/ || exit 1
CMD ["nginx", "-g", "daemon off;"]
EOF

# 5. Сборка с ограничением памяти
log "Сборка frontend с ограничением памяти ($MEMORY_LIMIT MB)..."
cd frontend

if docker build -f Dockerfile.lowmem -t devassist-frontend-lowmem .; then
    log "✅ Frontend собран успешно!"
    
    # 6. Замена в docker-compose временно
    log "Обновление docker-compose для использования нового образа..."
    cd ..
    
    # Создаем временный docker-compose
    cp docker-compose.production.yml docker-compose.production.yml.backup
    
    sed 's|build:|#build:|g; s|context: ./frontend|#context: ./frontend|g; s|dockerfile: Dockerfile.prod|#dockerfile: Dockerfile.prod|g' docker-compose.production.yml > docker-compose.temp.yml
    sed 's|nginx:|nginx:\n    image: devassist-frontend-lowmem|g' docker-compose.temp.yml > docker-compose.production.yml.new
    
    # 7. Запуск с новым образом
    log "Запуск контейнеров..."
    docker compose -f docker-compose.production.yml.new up -d
    
    # 8. Проверка
    sleep 30
    log "Проверка статуса..."
    docker compose -f docker-compose.production.yml.new ps
    
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://46.149.71.162/ || echo "000")
    if [ "$HTTP_CODE" = "200" ]; then
        log "✅ Сайт работает! (HTTP $HTTP_CODE)"
        log "🌐 DevAssist Pro: http://46.149.71.162/"
        
        # Восстанавливаем оригинальный docker-compose
        mv docker-compose.production.yml.backup docker-compose.production.yml
        rm -f docker-compose.production.yml.new docker-compose.temp.yml
        
        log "✨ Frontend успешно собран и работает!"
    else
        error "❌ Сайт недоступен (HTTP $HTTP_CODE)"
        mv docker-compose.production.yml.backup docker-compose.production.yml
        exit 1
    fi
    
else
    error "❌ Ошибка сборки frontend"
    cd ..
    exit 1
fi

# Очистка временных файлов
rm -f frontend/Dockerfile.lowmem

log "🎉 Оптимизированная сборка завершена!"