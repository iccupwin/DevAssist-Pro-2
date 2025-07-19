#!/bin/bash

# =============================================================================
# DevAssist Pro - Fix Frontend Build Errors
# Исправляет синтаксические ошибки и собирает frontend
# =============================================================================

echo "🔧 Fixing Frontend Build Errors"
echo "==============================="

# 1. Исправляем синтаксическую ошибку в api.ts
echo "📝 Fixing syntax errors in api.ts..."
sed -i "s|''''|''|g" frontend/src/config/api.ts

# 2. Также проверим и исправим другие файлы
echo "📝 Fixing other potential syntax errors..."
sed -i "s|''''|''|g" frontend/src/config/app.ts
sed -i "s|''''|''|g" frontend/src/services/unifiedApiClient.ts
sed -i "s|''''|''|g" frontend/src/services/httpInterceptors.ts
sed -i "s|''''|''|g" frontend/src/services/backendService.ts
sed -i "s|''''|''|g" frontend/src/services/authService.ts

# 3. Показываем что получилось в api.ts
echo "📄 Checking api.ts BASE_URL:"
grep -n "BASE_URL" frontend/src/config/api.ts -A 5

# 4. Собираем frontend
echo "🔨 Building frontend..."
cd frontend
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Frontend built successfully!"
    cd ..
    
    # 5. Создаем простой Dockerfile
    echo "🐳 Creating Docker image..."
    cat > Dockerfile.frontend-working << 'EOF'
FROM nginx:alpine

# Удаляем стандартные файлы nginx
RUN rm -rf /usr/share/nginx/html/*

# Копируем собранный frontend
COPY frontend/build/ /usr/share/nginx/html/

# Проверяем что файлы скопировались
RUN ls -la /usr/share/nginx/html/ && \
    if [ ! -f /usr/share/nginx/html/index.html ]; then \
        echo "ERROR: index.html not found!"; \
        exit 1; \
    fi

# Nginx конфигурация
RUN cat > /etc/nginx/conf.d/default.conf << 'NGINX_CONF'
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;
    
    # Gzip
    gzip on;
    gzip_types text/plain text/css text/javascript application/javascript application/json;
    
    # SPA routing
    location / {
        try_files $uri $uri/ /index.html;
        add_header Cache-Control "no-cache";
    }
    
    # API proxy
    location /api/ {
        proxy_pass http://46.149.67.122:8000/api/;
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
    
    # Health endpoint
    location /health {
        proxy_pass http://46.149.67.122:8000/health;
        access_log off;
    }
    
    # API docs
    location /docs {
        proxy_pass http://46.149.67.122:8000/docs;
    }
    
    location /openapi.json {
        proxy_pass http://46.149.67.122:8000/openapi.json;
    }
}
NGINX_CONF

EXPOSE 80
EOF

    # 6. Собираем Docker образ
    docker build -f Dockerfile.frontend-working -t devassist-frontend:working .
    
    if [ $? -eq 0 ]; then
        echo "✅ Docker image built!"
        
        # 7. Останавливаем старый контейнер
        echo "🛑 Stopping old container..."
        docker stop devassist-frontend 2>/dev/null || true
        docker rm devassist-frontend 2>/dev/null || true
        
        # 8. Запускаем новый контейнер
        echo "🚀 Starting new container..."
        docker run -d \
            --name devassist-frontend \
            --restart unless-stopped \
            -p 80:80 \
            devassist-frontend:working
        
        # 9. Ждем запуска
        echo "⏳ Waiting for container to start..."
        sleep 5
        
        # 10. Проверяем
        echo "🔍 Checking deployment..."
        
        # Проверяем что контейнер запущен
        if docker ps | grep devassist-frontend > /dev/null; then
            echo "✅ Container is running"
            
            # Проверяем логи
            echo "📄 Container logs:"
            docker logs devassist-frontend --tail 10
            
            # Проверяем что внутри контейнера
            echo "📂 Files in container:"
            docker exec devassist-frontend ls -la /usr/share/nginx/html/ | head -10
            
            # Проверяем ответ
            echo "🌐 Testing response:"
            curl -s http://localhost | head -20
            
            echo ""
            echo "🎉 Frontend deployed successfully!"
            echo "🌐 Open: http://46.149.67.122/"
            echo ""
            echo "📋 If you still see nginx welcome page:"
            echo "1. Clear browser cache (Ctrl+F5)"
            echo "2. Try incognito mode"
            echo "3. Check: docker exec devassist-frontend cat /usr/share/nginx/html/index.html"
            
        else
            echo "❌ Container failed to start"
            echo "Check: docker logs devassist-frontend"
        fi
        
    else
        echo "❌ Docker build failed"
    fi
    
else
    echo "❌ Frontend build failed"
    echo "Check the errors above"
    cd ..
fi