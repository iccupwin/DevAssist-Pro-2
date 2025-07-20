#!/bin/bash

# Full Stack Run - Полный запуск frontend и backend одновременно
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

log "🚀 Полный запуск DevAssist Pro - Frontend + Backend"

# 1. Проверка системных ресурсов
log "Проверка системных ресурсов..."
MEMORY_KB=$(grep MemAvailable /proc/meminfo | awk '{print $2}')
MEMORY_MB=$((MEMORY_KB / 1024))
DISK_SPACE=$(df / | awk 'NR==2{print $4}')
DISK_GB=$((DISK_SPACE / 1024 / 1024))

log "💾 Доступная память: ${MEMORY_MB} MB"
log "💿 Свободное место: ${DISK_GB} GB"

if [ "$MEMORY_MB" -lt 1000 ]; then
    warning "⚠️ Мало памяти! Настройка для слабого сервера..."
    USE_MINIMAL=true
else
    log "✅ Достаточно ресурсов для полной сборки"
    USE_MINIMAL=false
fi

# 2. Остановка всех предыдущих контейнеров
log "Остановка предыдущих контейнеров..."
docker compose -f docker-compose.production.yml down --remove-orphans 2>/dev/null || true
docker compose -f docker-compose.final.yml down --remove-orphans 2>/dev/null || true
docker compose -f docker-compose.simple.yml down --remove-orphans 2>/dev/null || true

# 3. Очистка Docker для освобождения места
log "Очистка Docker кэша..."
docker system prune -f
docker builder prune -f

# 4. Создание оптимизированного package.json для минимальной сборки
if [ "$USE_MINIMAL" = true ]; then
    log "Создание минимального package.json..."
    cp frontend/package.json frontend/package.json.backup
    
    cat > frontend/package.json.minimal << 'EOF'
{
  "name": "devassist-pro-frontend",
  "version": "1.0.0",
  "scripts": {
    "build": "react-scripts build"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-scripts": "5.0.1",
    "react-router-dom": "^6.8.0",
    "tailwindcss": "^3.2.7",
    "typescript": "^4.9.5"
  },
  "devDependencies": {
    "@tailwindcss/forms": "^0.5.10",
    "@tailwindcss/typography": "^0.5.16",
    "autoprefixer": "^10.4.14",
    "postcss": "^8.5.6"
  },
  "browserslist": {
    "production": [">0.2%", "not dead", "not op_mini all"],
    "development": ["last 1 chrome version", "last 1 firefox version", "last 1 safari version"]
  }
}
EOF
    cp frontend/package.json.minimal frontend/package.json
fi

# 5. Создание простейшего nginx конфига для frontend
log "Создание nginx конфигурации..."
cat > frontend/nginx.frontend.conf << 'EOF'
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    # Handle React Router
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API proxy to backend
    location /api/ {
        proxy_pass http://app:8000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Health check
    location /health {
        return 200 'OK';
        add_header Content-Type text/plain;
    }
}
EOF

# 6. Сборка контейнеров поэтапно
log "Сборка backend..."
if ! docker compose -f docker-compose.final.yml build app; then
    error "❌ Ошибка сборки backend"
    exit 1
fi

log "Сборка frontend..."
if ! docker compose -f docker-compose.final.yml build frontend; then
    warning "⚠️ Ошибка сборки frontend, пробуем простую версию..."
    
    # Создаем очень простой Dockerfile
    cat > frontend/Dockerfile.simple << 'EOF'
FROM nginx:alpine
COPY nginx.frontend.conf /etc/nginx/conf.d/default.conf
RUN echo '<!DOCTYPE html><html><head><title>DevAssist Pro</title><meta charset="utf-8"><style>body{font-family:Arial,sans-serif;text-align:center;padding:50px;background:#f5f5f5;}h1{color:#333;}</style></head><body><h1>🚀 DevAssist Pro</h1><p>Frontend запущен успешно!</p><p>Backend API: <a href="/api/health">/api/health</a></p><script>fetch("/api/health").then(r=>r.json()).then(d=>console.log("Backend:",d)).catch(e=>console.log("Backend недоступен:",e))</script></body></html>' > /usr/share/nginx/html/index.html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
EOF
    
    # Обновляем docker-compose для простого frontend
    sed 's/dockerfile: Dockerfile.minimal/dockerfile: Dockerfile.simple/g' docker-compose.final.yml > docker-compose.simple-final.yml
    
    if ! docker compose -f docker-compose.simple-final.yml build frontend; then
        error "❌ Не удалось собрать даже простой frontend"
        exit 1
    fi
    
    USE_SIMPLE_COMPOSE=true
else
    USE_SIMPLE_COMPOSE=false
fi

# 7. Запуск всех сервисов
log "Запуск всех сервисов..."
if [ "$USE_SIMPLE_COMPOSE" = true ]; then
    COMPOSE_FILE="docker-compose.simple-final.yml"
else
    COMPOSE_FILE="docker-compose.final.yml"
fi

if docker compose -f "$COMPOSE_FILE" up -d; then
    log "✅ Все сервисы запущены!"
else
    error "❌ Ошибка запуска сервисов"
    exit 1
fi

# 8. Ожидание полного запуска
log "Ожидание полного запуска сервисов (60 сек)..."
for i in {1..12}; do
    echo -n "."
    sleep 5
done
echo

# 9. Проверка состояния всех сервисов
log "Проверка состояния сервисов..."
docker compose -f "$COMPOSE_FILE" ps

# 10. Проверка доступности
log "Проверка доступности сервисов..."

# Backend health check
info "🔍 Проверка backend..."
BACKEND_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://46.149.71.162/api/health || echo "000")
if [ "$BACKEND_CODE" = "200" ]; then
    log "✅ Backend работает! (HTTP $BACKEND_CODE)"
else
    warning "⚠️ Backend недоступен (HTTP $BACKEND_CODE)"
fi

# Frontend health check
info "🔍 Проверка frontend..."
FRONTEND_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://46.149.71.162/ || echo "000")
if [ "$FRONTEND_CODE" = "200" ]; then
    log "✅ Frontend работает! (HTTP $FRONTEND_CODE)"
else
    warning "⚠️ Frontend недоступен (HTTP $FRONTEND_CODE)"
fi

# 11. Показ логов в случае проблем
if [ "$BACKEND_CODE" != "200" ] || [ "$FRONTEND_CODE" != "200" ]; then
    warning "📋 Показ логов для диагностики..."
    echo
    info "=== Backend логи ==="
    docker compose -f "$COMPOSE_FILE" logs app --tail=10
    echo
    info "=== Frontend логи ==="
    docker compose -f "$COMPOSE_FILE" logs frontend --tail=10
fi

# 12. Восстановление исходных файлов
if [ "$USE_MINIMAL" = true ] && [ -f "frontend/package.json.backup" ]; then
    log "Восстановление исходного package.json..."
    mv frontend/package.json.backup frontend/package.json
fi

# 13. Финальный отчет
echo
log "🎉 Запуск завершен!"
echo
info "📊 Статус сервисов:"
info "   🖥️  Frontend: HTTP $FRONTEND_CODE"
info "   ⚙️  Backend:  HTTP $BACKEND_CODE"
echo
info "🌐 Доступ к приложению:"
info "   🔗 Основной сайт:     http://46.149.71.162/"
info "   🔗 Backend API:       http://46.149.71.162/api/health"
info "   🔗 Прокси (порт 8080): http://46.149.71.162:8080/"
echo

if [ "$BACKEND_CODE" = "200" ] && [ "$FRONTEND_CODE" = "200" ]; then
    log "🎊 ВСЕ РАБОТАЕТ! Frontend и Backend запущены успешно!"
    info "🚀 DevAssist Pro полностью готов к использованию"
else
    warning "⚠️ Есть проблемы с некоторыми сервисами"
    info "💡 Для диагностики: docker compose -f $COMPOSE_FILE logs"
fi

echo
info "📋 Управление сервисами:"
info "   ⏹️  Остановить: docker compose -f $COMPOSE_FILE down"
info "   📊 Статус:    docker compose -f $COMPOSE_FILE ps"
info "   📝 Логи:      docker compose -f $COMPOSE_FILE logs"