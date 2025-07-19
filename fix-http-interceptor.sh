#!/bin/bash

# =============================================================================
# DevAssist Pro - Fix HTTP Interceptor Base URL
# Исправляет hardcoded URL в httpInterceptors.ts
# =============================================================================

echo "🔧 Fixing HTTP Interceptor configuration..."
echo "========================================"

# Создаем патч для httpInterceptors.ts
echo "📝 Creating patch for httpInterceptors.ts..."

# Backup original file
cp frontend/src/services/httpInterceptors.ts frontend/src/services/httpInterceptors.ts.backup

# Replace the problematic lines (431-435)
sed -i '431,435c\
const apiUrl = process.env.REACT_APP_API_URL || "";' frontend/src/services/httpInterceptors.ts

# Also update the constructor to use relative paths by default
sed -i '47c\
    let baseURL = options.baseURL || "";' frontend/src/services/httpInterceptors.ts

echo "✅ httpInterceptors.ts patched"

# Теперь пересобираем frontend
echo "🐳 Rebuilding frontend with corrected interceptor..."

cat > Dockerfile.frontend-final << 'EOF'
# Stage 1: Build React app
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY frontend/package*.json ./
RUN npm install --production=false

# Copy source WITH the patched httpInterceptors.ts
COPY frontend/ .

# Environment for build - empty API URL for relative paths
ENV REACT_APP_API_URL=
ENV REACT_APP_USE_REAL_API=true
ENV ESLINT_NO_DEV_ERRORS=true
ENV DISABLE_ESLINT_PLUGIN=true
ENV GENERATE_SOURCEMAP=false
ENV TSC_COMPILE_ON_ERROR=true
ENV CI=false
ENV NODE_ENV=production

# Build the app
RUN npm run build

# Check that build doesn't contain the bad URL
RUN if grep -r "your-api-domain.com" build/; then \
      echo "ERROR: Build still contains your-api-domain.com!"; \
      exit 1; \
    fi

# Stage 2: Nginx production server
FROM nginx:alpine

# Copy built files
COPY --from=builder /app/build /usr/share/nginx/html

# Enhanced Nginx configuration
RUN cat > /etc/nginx/conf.d/default.conf << 'NGINX_EOF'
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    
    # Enable gzip
    gzip on;
    gzip_vary on;
    gzip_min_length 256;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/json application/xml+rss;
    
    # React SPA routing
    location / {
        try_files $uri $uri/ /index.html;
        expires -1;
        add_header Cache-Control "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0";
    }
    
    # Static assets caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # API proxy - все запросы /api/* идут на backend
    location /api/ {
        # Backend URL
        proxy_pass http://46.149.67.122:8000/api/;
        
        # Proxy headers
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Port $server_port;
        
        # WebSocket support
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        
        # Disable buffering for real-time responses
        proxy_buffering off;
        proxy_cache off;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 300s;
        proxy_read_timeout 300s;
        
        # CORS handling
        if ($request_method = 'OPTIONS') {
            add_header 'Access-Control-Allow-Origin' '$http_origin' always;
            add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
            add_header 'Access-Control-Allow-Headers' 'Authorization, Content-Type, X-Requested-With' always;
            add_header 'Access-Control-Allow-Credentials' 'true' always;
            add_header 'Access-Control-Max-Age' 86400 always;
            add_header 'Content-Type' 'text/plain; charset=utf-8' always;
            add_header 'Content-Length' 0 always;
            return 204;
        }
    }
    
    # Health endpoint proxy
    location = /health {
        proxy_pass http://46.149.67.122:8000/health;
        proxy_set_header Host $host;
        access_log off;
    }
    
    # API documentation proxy
    location /docs {
        proxy_pass http://46.149.67.122:8000/docs;
        proxy_set_header Host $host;
    }
    
    location = /openapi.json {
        proxy_pass http://46.149.67.122:8000/openapi.json;
        proxy_set_header Host $host;
    }
}
NGINX_EOF

EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s \
  CMD wget --no-verbose --tries=1 --spider http://localhost/ || exit 1
EOF

echo "🐳 Building final frontend image..."
docker build -f Dockerfile.frontend-final -t devassist-frontend:latest .

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    
    echo "🛑 Stopping current frontend..."
    docker stop devassist-frontend 2>/dev/null || true
    docker rm devassist-frontend 2>/dev/null || true
    
    echo "🚀 Starting corrected frontend..."
    docker run -d \
        --name devassist-frontend \
        --restart unless-stopped \
        -p 80:80 \
        devassist-frontend:latest
    
    echo "⏳ Waiting for frontend to start..."
    sleep 5
    
    # Verify
    if curl -f -s http://localhost > /dev/null 2>&1; then
        echo "✅ Frontend is running!"
        
        # Check that the container is healthy
        docker ps --filter "name=devassist-frontend" --format "table {{.Names}}\t{{.Status}}"
        
        echo ""
        echo "🎉 Frontend successfully deployed with corrected configuration!"
        echo "🌐 Frontend: http://46.149.67.122/"
        echo ""
        echo "📋 API endpoints теперь работают правильно:"
        echo "  - Все API запросы используют относительные пути"
        echo "  - Nginx проксирует /api/* на backend:8000"
        echo "  - Нет hardcoded URLs типа 'your-api-domain.com'"
        echo ""
        echo "🧪 Для проверки:"
        echo "1. Полностью очистите кеш браузера (Ctrl+Shift+Delete)"
        echo "2. Откройте инкогнито/приватное окно"
        echo "3. Зайдите на http://46.149.67.122/"
        echo "4. В консоли не должно быть запросов к 'your-api-domain.com'"
        echo ""
        echo "📝 Logs:"
        echo "docker logs devassist-frontend"
        
    else
        echo "⚠️  Frontend не отвечает"
        echo "📋 Проверьте: docker logs devassist-frontend"
    fi
else
    echo "❌ Build failed"
    # Restore backup
    mv frontend/src/services/httpInterceptors.ts.backup frontend/src/services/httpInterceptors.ts
    exit 1
fi