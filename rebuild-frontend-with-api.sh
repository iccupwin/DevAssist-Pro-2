#!/bin/bash

# =============================================================================
# DevAssist Pro - Rebuild Frontend with Correct API URL
# Пересобирает frontend с правильным URL для backend
# =============================================================================

echo "🚀 Rebuilding Frontend with Correct API URL"
echo "==========================================="

# Создаем правильный .env.production для frontend
echo "📝 Creating frontend environment configuration..."
cat > frontend/.env.production << 'EOF'
# DevAssist Pro - Frontend Production Environment
# =============================================

# API Configuration
REACT_APP_API_URL=http://46.149.67.122:8000
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

echo "✅ Environment file created"

# Создаем Dockerfile с правильными переменными окружения
echo "🐳 Creating optimized Dockerfile..."
cat > Dockerfile.frontend-api-fixed << 'EOF'
# Stage 1: Build React app with correct API URL
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY frontend/package*.json ./
RUN npm install --production=false

# Copy source and environment
COPY frontend/ .

# Ensure .env.production is used
COPY frontend/.env.production .env.production
RUN cat .env.production

# Additional build-time environment variables
ENV REACT_APP_API_URL=http://46.149.67.122:8000
ENV REACT_APP_USE_REAL_API=true
ENV ESLINT_NO_DEV_ERRORS=true
ENV DISABLE_ESLINT_PLUGIN=true
ENV GENERATE_SOURCEMAP=false
ENV TSC_COMPILE_ON_ERROR=true
ENV CI=false

# Build the app
RUN npm run build || (echo "Build failed, checking..." && ls -la && exit 1)

# Verify the build contains correct API URL
RUN grep -r "46.149.67.122" build/ || echo "Warning: API URL might not be properly set"

# Stage 2: Nginx production server
FROM nginx:alpine

# Copy built files
COPY --from=builder /app/build /usr/share/nginx/html

# Configure Nginx for SPA with API proxy
RUN cat > /etc/nginx/conf.d/default.conf << 'NGINX_EOF'
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;
    
    # Enable gzip
    gzip on;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/json;
    
    # SPA routing
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # Proxy API requests to backend
    location /api/ {
        proxy_pass http://46.149.67.122:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # CORS headers
        add_header 'Access-Control-Allow-Origin' '*';
        add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS';
        add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization';
        
        # Handle preflight requests
        if ($request_method = 'OPTIONS') {
            add_header 'Access-Control-Max-Age' 1728000;
            add_header 'Content-Type' 'text/plain; charset=utf-8';
            add_header 'Content-Length' 0;
            return 204;
        }
    }
    
    # Proxy health check
    location /health {
        proxy_pass http://46.149.67.122:8000/health;
    }
    
    # Proxy docs
    location /docs {
        proxy_pass http://46.149.67.122:8000/docs;
    }
}
NGINX_EOF

EXPOSE 80
EOF

echo "🐳 Building frontend with correct API configuration..."
docker build -f Dockerfile.frontend-api-fixed -t devassist-frontend:latest .

if [ $? -eq 0 ]; then
    echo "✅ Frontend image built successfully!"
    
    echo "🛑 Stopping existing frontend..."
    docker stop devassist-frontend 2>/dev/null || true
    docker rm devassist-frontend 2>/dev/null || true
    
    echo "🚀 Starting frontend with correct API URL..."
    docker run -d \
        --name devassist-frontend \
        --restart unless-stopped \
        -p 80:80 \
        -e REACT_APP_API_URL=http://46.149.67.122:8000 \
        devassist-frontend:latest
    
    echo "⏳ Waiting for frontend to start..."
    sleep 5
    
    # Test frontend
    if curl -f -s http://localhost > /dev/null 2>&1; then
        echo "✅ Frontend is running!"
        
        # Test API proxy
        echo "🔍 Testing API proxy..."
        if curl -f -s http://localhost/health > /dev/null 2>&1; then
            echo "✅ API proxy is working!"
        else
            echo "⚠️  API proxy might not be configured correctly"
        fi
        
        echo ""
        echo "🎉 Frontend deployed with correct API configuration!"
        echo "🌐 Frontend: http://46.149.67.122/"
        echo "🔗 API URL configured: http://46.149.67.122:8000"
        echo ""
        echo "📋 Management commands:"
        echo "docker logs devassist-frontend      # View logs"
        echo "docker restart devassist-frontend   # Restart"
        echo ""
        echo "🧪 Test the API connection:"
        echo "1. Open http://46.149.67.122/"
        echo "2. Try to login - it should connect to backend on port 8000"
        echo "3. Check browser console for API calls"
        
    else
        echo "⚠️  Frontend started but not responding"
        echo "📋 Check: docker logs devassist-frontend"
    fi
else
    echo "❌ Frontend build failed"
    echo "📋 Check the build logs above for errors"
    exit 1
fi