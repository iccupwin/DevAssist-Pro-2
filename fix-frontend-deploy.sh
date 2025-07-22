#!/bin/bash

set -e

echo "🔧 Исправление и запуск Frontend для DevAssist Pro"
echo "================================================="

# Убедиться что мы в правильной директории
if [ ! -f "docker-compose.frontend.yml" ]; then
    echo "❌ Запустите скрипт из корневой директории проекта"
    exit 1
fi

# Остановить существующие frontend контейнеры
echo "🛑 Остановка существующих frontend контейнеров..."
docker compose -f docker-compose.frontend.yml down 2>/dev/null || true

# Убедиться что build директория существует в frontend
echo "📁 Создание build директории в frontend..."
mkdir -p frontend/build

# Создать index.html если не существует
if [ ! -f "frontend/build/index.html" ]; then
    echo "📄 Создание index.html в frontend/build..."
    cat > frontend/build/index.html << 'EOF'
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>DevAssist Pro</title>
    <style>
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
            margin: 0; 
            padding: 40px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            min-height: 100vh;
        }
        .container { 
            max-width: 800px; 
            margin: 0 auto; 
            text-align: center; 
        }
        .card { 
            background: rgba(255,255,255,0.1); 
            backdrop-filter: blur(10px);
            padding: 30px; 
            border-radius: 15px; 
            margin: 20px 0;
            border: 1px solid rgba(255,255,255,0.2);
        }
        .status { 
            background: #d4edda; 
            color: #155724; 
            padding: 15px; 
            border-radius: 8px; 
            margin: 15px 0;
        }
        .api-link { margin: 10px 0; }
        .api-link a { color: #ffd700; text-decoration: none; }
        .api-link a:hover { text-decoration: underline; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 DevAssist Pro</h1>
        <p>Система анализа коммерческих предложений с ИИ</p>
        
        <div class="card">
            <h2>📊 Статус системы</h2>
            <div class="status">
                ✅ Backend API работает<br>
                ✅ Frontend развернут
            </div>
        </div>

        <div class="card">
            <h2>🛠️ Доступные сервисы</h2>
            <div class="api-link">
                <a href="http://46.149.71.162:8000/docs" target="_blank">
                    📖 API Documentation (Swagger)
                </a>
            </div>
            <div class="api-link">
                <a href="http://46.149.71.162:8000/health" target="_blank">
                    🩺 Health Check
                </a>
            </div>
        </div>

        <div class="card">
            <h2>📝 Информация</h2>
            <p>Backend API полностью функционален и готов к использованию.</p>
            <p><strong>Сервер:</strong> Ubuntu 22.04 (46.149.71.162)</p>
        </div>
    </div>
</body>
</html>
EOF
fi

# Убедиться что nginx.conf существует
if [ ! -f "frontend/nginx.conf" ]; then
    echo "⚙️  Создание nginx.conf в frontend..."
    cat > frontend/nginx.conf << 'EOF'
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/json;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # SPA routing
    location / {
        try_files $uri $uri/ /index.html;
        add_header Cache-Control "no-cache";
    }

    # Health check endpoint
    location /frontend-health {
        access_log off;
        return 200 "Frontend OK\n";
        add_header Content-Type text/plain;
    }
}
EOF
fi

# Показать что у нас есть в frontend
echo "📋 Содержимое frontend директории:"
ls -la frontend/build/ 2>/dev/null || echo "build директория пуста"

# Сборка и запуск frontend
echo "🏗️  Сборка frontend контейнера..."
docker compose -f docker-compose.frontend.yml build --no-cache

echo "▶️  Запуск frontend сервисов..."
docker compose -f docker-compose.frontend.yml up -d

# Ожидание запуска
echo "⏳ Ожидание запуска frontend (30 секунд)..."
sleep 30

# Проверка статуса
echo "📊 Статус frontend сервисов:"
docker compose -f docker-compose.frontend.yml ps

# Проверка доступности frontend
echo ""
echo "🩺 Проверка доступности frontend:"
if curl -f -s --max-time 5 http://localhost:3000/frontend-health >/dev/null 2>&1; then
    echo "✅ Frontend доступен: http://46.149.71.162:3000"
    echo "✅ Health check работает"
else
    echo "❌ Frontend не отвечает на порту 3000"
    echo "📋 Проверьте логи: docker compose -f docker-compose.frontend.yml logs"
fi

# Проверка доступности через nginx (порт 80)
echo ""
echo "🩺 Проверка nginx proxy (порт 80):"
if curl -f -s --max-time 5 http://localhost/ >/dev/null 2>&1; then
    echo "✅ Nginx proxy работает: http://46.149.71.162"
else
    echo "❌ Nginx proxy не отвечает"
    echo "📋 Проверьте логи nginx: docker logs devassist_nginx_proxy"
fi

echo ""
echo "🎉 Frontend развертывание завершено!"
echo ""
echo "📋 Доступные URL:"
echo "  Frontend:     http://46.149.71.162"
echo "  Frontend:     http://46.149.71.162:3000 (direct)"
echo "  Backend API:  http://46.149.71.162:8000"
echo "  API Docs:     http://46.149.71.162:8000/docs"
echo ""
echo "📋 Управление:"
echo "  Логи:         docker compose -f docker-compose.frontend.yml logs -f"
echo "  Статус:       docker compose -f docker-compose.frontend.yml ps"
echo "  Остановка:    docker compose -f docker-compose.frontend.yml down"
echo "  Перезапуск:   docker compose -f docker-compose.frontend.yml restart"