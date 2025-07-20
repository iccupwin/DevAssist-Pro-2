#!/bin/bash

# Deploy Simple - Простое и надежное развертывание
set -e

log() {
    echo -e "\033[0;32m[$(date +'%H:%M:%S')] $1\033[0m"
}

error() {
    echo -e "\033[0;31m[ERROR] $1\033[0m" >&2
}

warning() {
    echo -e "\033[1;33m[WARNING] $1\033[0m"
}

log "🚀 Простое развертывание DevAssist Pro"

# 1. Остановка всех контейнеров
log "Остановка контейнеров..."
docker stop $(docker ps -aq) 2>/dev/null || true
docker rm $(docker ps -aq) 2>/dev/null || true

# 2. Очистка
log "Очистка Docker..."
docker system prune -af

# 3. Создание простого frontend
log "Создание простого frontend..."
cat > frontend/Dockerfile.ultra-simple << 'EOF'
FROM nginx:alpine
COPY nginx.production.conf /etc/nginx/conf.d/default.conf
RUN apk add --no-cache curl
RUN cat > /usr/share/nginx/html/index.html << 'HTMLEOF'
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>DevAssist Pro</title>
    <style>
        body { 
            font-family: system-ui, -apple-system, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            margin: 0; padding: 20px; min-height: 100vh;
            display: flex; align-items: center; justify-content: center;
            color: white;
        }
        .container { 
            text-align: center; max-width: 600px; 
            background: rgba(255,255,255,0.1);
            padding: 2rem; border-radius: 20px;
            backdrop-filter: blur(10px);
        }
        h1 { font-size: 2.5rem; margin-bottom: 1rem; }
        .status { 
            background: rgba(0,0,0,0.3); 
            padding: 1rem; border-radius: 10px; 
            margin: 1rem 0;
        }
        .btn { 
            background: #4ade80; color: white; 
            padding: 10px 20px; border: none; 
            border-radius: 5px; margin: 5px;
            text-decoration: none; display: inline-block;
        }
        .indicator { 
            display: inline-block; width: 10px; height: 10px; 
            border-radius: 50%; margin-right: 8px;
        }
        .online { background: #4ade80; }
        .offline { background: #f87171; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 DevAssist Pro</h1>
        <p>AI-Powered Real Estate Development Platform</p>
        
        <div class="status">
            <h3>Статус системы</h3>
            <div id="backend-status">
                <span class="indicator offline"></span>
                Backend API: Проверка...
            </div>
            <div>
                <span class="indicator online"></span>
                Frontend: Онлайн
            </div>
        </div>

        <div>
            <a href="/api/health" class="btn">🔗 API Health</a>
            <a href="/health.json" class="btn">📊 Frontend Status</a>
        </div>

        <div style="margin-top: 1rem; opacity: 0.8;">
            DevAssist Pro v1.0 - Готов к работе!
        </div>
    </div>

    <script>
        fetch('/api/health')
            .then(r => r.json())
            .then(d => {
                document.getElementById('backend-status').innerHTML = 
                    '<span class="indicator online"></span>Backend API: Онлайн';
            })
            .catch(e => {
                document.getElementById('backend-status').innerHTML = 
                    '<span class="indicator offline"></span>Backend API: Недоступен';
            });
    </script>
</body>
</html>
HTMLEOF

RUN echo '{"status":"healthy","service":"frontend","version":"1.0"}' > /usr/share/nginx/html/health.json

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
EOF

# 4. Создание минимального docker-compose
log "Создание docker-compose..."
cat > docker-compose.deploy.yml << 'EOF'
services:
  postgres:
    image: postgres:15-alpine
    container_name: devassist_db
    environment:
      POSTGRES_DB: devassist_pro
      POSTGRES_USER: devassist
      POSTGRES_PASSWORD: devassist_password
    volumes:
      - db_data:/var/lib/postgresql/data
    networks:
      - app-net
    restart: unless-stopped
    mem_limit: 512m

  redis:
    image: redis:7-alpine
    container_name: devassist_cache
    command: redis-server --requirepass redis_password --maxmemory 128mb
    volumes:
      - cache_data:/data
    networks:
      - app-net
    restart: unless-stopped
    mem_limit: 128m

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile.monolith
    container_name: devassist_backend
    environment:
      POSTGRES_URL: postgresql://devassist:devassist_password@postgres:5432/devassist_pro
      REDIS_URL: redis://:redis_password@redis:6379/0
      DEBUG: false
      ENVIRONMENT: production
      ALLOWED_ORIGINS: "http://46.149.71.162,http://localhost"
      ANTHROPIC_API_KEY: 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
      HOST: 0.0.0.0
      PORT: 8000
    volumes:
      - app_data:/app/data
    networks:
      - app-net
    depends_on:
      - postgres
      - redis
    restart: unless-stopped
    mem_limit: 1g

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.ultra-simple
    container_name: devassist_frontend
    ports:
      - "80:80"
    networks:
      - app-net
    depends_on:
      - backend
    restart: unless-stopped
    mem_limit: 256m

networks:
  app-net:
    driver: bridge

volumes:
  db_data:
  cache_data:
  app_data:
EOF

# 5. Сборка и запуск
log "Сборка backend..."
if ! docker compose -f docker-compose.deploy.yml build backend; then
    error "Ошибка сборки backend"
    exit 1
fi

log "Сборка frontend..."
if ! docker compose -f docker-compose.deploy.yml build frontend; then
    error "Ошибка сборки frontend"
    exit 1
fi

log "Запуск всех сервисов..."
if ! docker compose -f docker-compose.deploy.yml up -d; then
    error "Ошибка запуска"
    exit 1
fi

# 6. Ожидание и проверка
log "Ожидание запуска (30 сек)..."
sleep 30

log "Проверка сервисов..."
docker compose -f docker-compose.deploy.yml ps

# Проверка доступности
log "Проверка доступности..."
BACKEND=$(curl -s -o /dev/null -w "%{http_code}" http://46.149.71.162/api/health || echo "000")
FRONTEND=$(curl -s -o /dev/null -w "%{http_code}" http://46.149.71.162/ || echo "000")

echo
log "🎯 Результат развертывания:"
log "   Frontend: HTTP $FRONTEND"
log "   Backend:  HTTP $BACKEND"
echo

if [ "$FRONTEND" = "200" ] && [ "$BACKEND" = "200" ]; then
    log "🎊 УСПЕХ! DevAssist Pro полностью работает!"
    echo
    log "🌐 Доступ:"
    log "   Сайт: http://46.149.71.162/"
    log "   API:  http://46.149.71.162/api/health"
    echo
    log "✅ Backend монолит + Frontend готовы к использованию!"
elif [ "$FRONTEND" = "200" ]; then
    log "✅ Frontend работает, backend загружается..."
    log "🔄 Подождите еще минуту для полного запуска backend"
else
    warning "⚠️ Проблемы с запуском"
    log "📋 Логи: docker compose -f docker-compose.deploy.yml logs"
fi

echo
log "📋 Управление:"
log "   Остановить: docker compose -f docker-compose.deploy.yml down"
log "   Перезапуск:  docker compose -f docker-compose.deploy.yml restart"
log "   Логи:       docker compose -f docker-compose.deploy.yml logs"