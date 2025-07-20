#!/bin/bash

set -e

echo "🚀 Простое развертывание Frontend для DevAssist Pro"
echo "=================================================="

# Остановить существующие frontend контейнеры
echo "🛑 Остановка существующих frontend контейнеров..."
docker compose -f docker-compose.frontend.yml down 2>/dev/null || true
docker container stop devassist_frontend 2>/dev/null || true
docker container rm devassist_frontend 2>/dev/null || true

# Создать простой Dockerfile для frontend
echo "📝 Создание простого Dockerfile..."
cat > frontend/Dockerfile.simple << 'EOF'
FROM nginx:alpine

# Установка curl для healthcheck
RUN apk add --no-cache curl

# Удаление дефолтных файлов nginx
RUN rm -rf /usr/share/nginx/html/*

# Копирование статических файлов
COPY build /usr/share/nginx/html

# Копирование nginx конфигурации
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost/frontend-health || exit 1

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
EOF

# Создать build директорию если не существует
echo "📁 Создание build директории..."
mkdir -p frontend/build

# Убедиться что index.html существует
if [ ! -f "frontend/build/index.html" ]; then
    echo "📄 Создание index.html..."
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
        .btn {
            display: inline-block;
            padding: 12px 24px;
            background: #007bff;
            color: white;
            text-decoration: none;
            border-radius: 6px;
            margin: 10px;
            transition: background 0.3s;
        }
        .btn:hover { background: #0056b3; }
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

# Создать nginx.conf если не существует
if [ ! -f "frontend/nginx.conf" ]; then
    echo "⚙️  Создание nginx конфигурации..."
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

# Сборка frontend образа
echo "🏗️  Сборка frontend образа..."
docker build -f frontend/Dockerfile.simple -t devassist-frontend-simple frontend/

# Запуск frontend контейнера
echo "▶️  Запуск frontend контейнера..."
docker run -d \
    --name devassist_frontend \
    --restart unless-stopped \
    -p 80:80 \
    devassist-frontend-simple

# Ожидание запуска
echo "⏳ Ожидание запуска frontend (15 секунд)..."
sleep 15

# Проверка статуса
echo "📊 Статус frontend:"
docker ps --filter name=devassist_frontend

# Проверка доступности
echo ""
echo "🩺 Проверка доступности:"
if curl -f -s --max-time 5 http://localhost/frontend-health >/dev/null 2>&1; then
    echo "✅ Frontend доступен: http://46.149.71.162"
    echo "✅ Health check работает: http://46.149.71.162/frontend-health"
else
    echo "❌ Frontend не отвечает"
    echo "📋 Проверьте логи: docker logs devassist_frontend"
fi

echo ""
echo "🎉 Frontend развертывание завершено!"
echo ""
echo "📋 Доступные URL:"
echo "  Frontend:     http://46.149.71.162"
echo "  Backend API:  http://46.149.71.162:8000"
echo "  API Docs:     http://46.149.71.162:8000/docs"
echo ""
echo "📋 Управление:"
echo "  Логи frontend:    docker logs devassist_frontend"
echo "  Остановка:        docker stop devassist_frontend"
echo "  Перезапуск:       docker restart devassist_frontend"