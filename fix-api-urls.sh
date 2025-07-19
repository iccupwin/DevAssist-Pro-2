#!/bin/bash

# =============================================================================
# DevAssist Pro - Fix API URL Duplication
# Исправляет дублирование /api в URL запросах
# =============================================================================

echo "🔧 Fixing API URL configuration..."
echo "=================================="

# Обновляем frontend environment для правильной работы с proxy
cat > frontend/.env.production << 'EOF'
# DevAssist Pro - Frontend Production Environment
# =============================================

# API Configuration - используем относительные пути для proxy
REACT_APP_API_URL=
REACT_APP_USE_REAL_API=true

# Features
REACT_APP_ENABLE_STREAMING=true
REACT_APP_ENABLE_SOCIAL_LOGIN=true

# File Upload Limits
REACT_APP_MAX_FILE_SIZE=52428800
REACT_APP_SUPPORTED_FORMATS=pdf,docx,doc,txt

# AI Models Configuration
REACT_APP_DEFAULT_ANALYSIS_MODEL=claude-3-5-sonnet-20240620
REACT_APP_DEFAULT_COMPARISON_MODEL=gpt-4o

# Build Settings
ESLINT_NO_DEV_ERRORS=true
DISABLE_ESLINT_PLUGIN=true
GENERATE_SOURCEMAP=false
TSC_COMPILE_ON_ERROR=true
EOF

echo "✅ Environment updated"

# Создаем исправленный Dockerfile
cat > Dockerfile.frontend-fixed-urls << 'EOF'
# Stage 1: Build React app
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY frontend/package*.json ./
RUN npm install --production=false

# Copy source
COPY frontend/ .

# Copy production environment
COPY frontend/.env.production .env.production

# Build environment - пустой REACT_APP_API_URL для использования относительных путей
ENV REACT_APP_API_URL=
ENV REACT_APP_USE_REAL_API=true
ENV ESLINT_NO_DEV_ERRORS=true
ENV DISABLE_ESLINT_PLUGIN=true
ENV GENERATE_SOURCEMAP=false
ENV TSC_COMPILE_ON_ERROR=true
ENV CI=false

# Build the app
RUN npm run build

# Verify API configuration
RUN echo "Checking build for API URLs..." && \
    grep -r "api/auth" build/ | head -5 || echo "API paths will use relative URLs"

# Stage 2: Nginx production server
FROM nginx:alpine

# Copy built files
COPY --from=builder /app/build /usr/share/nginx/html

# Nginx configuration with proper API proxy
RUN cat > /etc/nginx/conf.d/default.conf << 'NGINX_EOF'
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;
    
    # Enable gzip
    gzip on;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/json;
    
    # React app - catch all routes
    location / {
        try_files $uri $uri/ /index.html;
        
        # Security headers
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;
    }
    
    # API proxy - обратите внимание на / в конце proxy_pass
    location /api/ {
        proxy_pass http://46.149.67.122:8000/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Connection "";
        
        # Handle OPTIONS for CORS
        if ($request_method = 'OPTIONS') {
            add_header 'Access-Control-Allow-Origin' '*';
            add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS';
            add_header 'Access-Control-Allow-Headers' 'Authorization, Content-Type';
            add_header 'Access-Control-Max-Age' 1728000;
            add_header 'Content-Type' 'text/plain; charset=utf-8';
            add_header 'Content-Length' 0;
            return 204;
        }
        
        # Timeouts for long operations
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
        proxy_send_timeout 300s;
        
        # Buffer settings
        proxy_buffering off;
        proxy_buffer_size 128k;
        proxy_buffers 4 256k;
        proxy_busy_buffers_size 256k;
    }
    
    # Health check proxy
    location /health {
        proxy_pass http://46.149.67.122:8000/health;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    
    # API docs proxy
    location /docs {
        proxy_pass http://46.149.67.122:8000/docs;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    
    location /openapi.json {
        proxy_pass http://46.149.67.122:8000/openapi.json;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
NGINX_EOF

EXPOSE 80
EOF

echo "🐳 Building frontend with fixed URLs..."
docker build -f Dockerfile.frontend-fixed-urls -t devassist-frontend:latest .

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    
    echo "🛑 Stopping current frontend..."
    docker stop devassist-frontend 2>/dev/null || true
    docker rm devassist-frontend 2>/dev/null || true
    
    echo "🚀 Starting frontend with fixed API URLs..."
    docker run -d \
        --name devassist-frontend \
        --restart unless-stopped \
        -p 80:80 \
        devassist-frontend:latest
    
    echo "⏳ Waiting for frontend..."
    sleep 5
    
    # Test
    if curl -f -s http://localhost > /dev/null 2>&1; then
        echo "✅ Frontend is running!"
        
        echo ""
        echo "🎉 Frontend deployed with fixed API URLs!"
        echo "🌐 Frontend: http://46.149.67.122/"
        echo ""
        echo "📋 API URLs теперь работают правильно:"
        echo "  - Регистрация: /api/auth/register (не /api/api/auth/register)"
        echo "  - Вход: /api/auth/login (не /api/api/auth/login)"
        echo ""
        echo "🧪 Протестируйте:"
        echo "1. Очистите кеш браузера (Ctrl+F5)"
        echo "2. Попробуйте зарегистрироваться снова"
        echo "3. В консоли должны быть правильные URL без дублирования /api"
        
    else
        echo "⚠️  Frontend не отвечает"
        echo "📋 Проверьте: docker logs devassist-frontend"
    fi
else
    echo "❌ Build failed"
    exit 1
fi