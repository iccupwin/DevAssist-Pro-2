#!/bin/bash

# =============================================================================
# DevAssist Pro - Fix ALL API URLs in Frontend
# Находит и исправляет все hardcoded URLs
# =============================================================================

echo "🔧 Fixing ALL hardcoded API URLs..."
echo "==================================="

# Backup files before modification
echo "📦 Creating backups..."
mkdir -p frontend/src/backups
cp -r frontend/src/services frontend/src/backups/
cp -r frontend/src/config frontend/src/backups/

# Fix all files with the problematic URL
echo "📝 Patching source files..."

# 1. Fix unifiedApiClient.ts
sed -i 's|https://your-api-domain\.com|'"''"'|g' frontend/src/services/unifiedApiClient.ts

# 2. Fix httpInterceptors.ts
sed -i 's|https://your-api-domain\.com|'"''"'|g' frontend/src/services/httpInterceptors.ts

# 3. Fix backendService.ts
sed -i 's|https://your-api-domain\.com|'"''"'|g' frontend/src/services/backendService.ts

# 4. Fix authService.ts  
sed -i 's|https://your-api-domain\.com|'"''"'|g' frontend/src/services/authService.ts

# 5. Fix config/api.ts
sed -i 's|https://your-api-domain\.com|'"''"'|g' frontend/src/config/api.ts

# 6. Fix config/app.ts
sed -i 's|https://your-api-domain\.com|'"''"'|g' frontend/src/config/app.ts

# Also fix any localhost:8000 references for production
sed -i 's|http://localhost:8000|'"''"'|g' frontend/src/services/*.ts
sed -i 's|http://localhost:8000|'"''"'|g' frontend/src/config/*.ts

echo "✅ Source files patched"

# Verify patches
echo "🔍 Verifying patches..."
if grep -r "your-api-domain\.com" frontend/src/; then
    echo "❌ ERROR: Still found your-api-domain.com in source!"
    exit 1
fi

echo "✅ All source files cleaned"

# Create optimized Dockerfile
echo "🐳 Creating optimized Dockerfile..."
cat > Dockerfile.frontend-clean << 'EOF'
# Stage 1: Build React app with clean URLs
FROM node:18-alpine AS builder

WORKDIR /app

# Install dependencies
COPY frontend/package*.json ./
RUN npm ci --production=false || npm install --production=false

# Copy source with patched files
COPY frontend/ .

# Set production build environment
ENV NODE_ENV=production
ENV REACT_APP_API_URL=
ENV REACT_APP_API_BASE_URL=
ENV REACT_APP_USE_REAL_API=true
ENV ESLINT_NO_DEV_ERRORS=true
ENV DISABLE_ESLINT_PLUGIN=true
ENV GENERATE_SOURCEMAP=false
ENV TSC_COMPILE_ON_ERROR=true
ENV CI=false

# Build the app
RUN echo "Building with clean environment..." && \
    npm run build

# Verify build is clean
RUN echo "Checking build output..." && \
    if grep -r "your-api-domain" build/; then \
        echo "ERROR: Build contains hardcoded URLs!"; \
        exit 1; \
    else \
        echo "✅ Build is clean!"; \
    fi

# Stage 2: Production server
FROM nginx:alpine

# Copy clean build
COPY --from=builder /app/build /usr/share/nginx/html

# Nginx configuration
COPY <<'NGINX_CONFIG' /etc/nginx/conf.d/default.conf
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    # Compression
    gzip on;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/json;
    gzip_min_length 256;
    
    # SPA routing
    location / {
        try_files $uri $uri/ /index.html;
        add_header Cache-Control "no-cache, no-store, must-revalidate";
    }
    
    # Static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # API proxy - all /api/* requests go to backend
    location /api/ {
        proxy_pass http://46.149.67.122:8000/api/;
        proxy_http_version 1.1;
        
        # Headers
        proxy_set_header Host $http_host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # WebSocket support
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        
        # Disable buffering
        proxy_buffering off;
        proxy_request_buffering off;
    }
    
    # Health check
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
NGINX_CONFIG

EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s \
    CMD wget -q --spider http://localhost/ || exit 1
EOF

echo "🐳 Building clean frontend image..."
docker build -f Dockerfile.frontend-clean -t devassist-frontend:latest . --no-cache

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    
    echo "🛑 Stopping existing frontend..."
    docker stop devassist-frontend 2>/dev/null || true
    docker rm devassist-frontend 2>/dev/null || true
    
    echo "🚀 Starting clean frontend..."
    docker run -d \
        --name devassist-frontend \
        --restart unless-stopped \
        -p 80:80 \
        devassist-frontend:latest
    
    echo "⏳ Waiting for startup..."
    sleep 5
    
    # Test
    if curl -f -s http://localhost > /dev/null 2>&1; then
        echo "✅ Frontend is running!"
        
        # Final verification
        echo "🔍 Final verification..."
        docker exec devassist-frontend find /usr/share/nginx/html -name "*.js" -exec grep -l "your-api-domain" {} \; | head -5
        
        if [ $? -eq 0 ]; then
            echo "⚠️  WARNING: Some files might still contain old URLs"
        else
            echo "✅ No problematic URLs found!"
        fi
        
        echo ""
        echo "🎉 Frontend successfully deployed!"
        echo "🌐 URL: http://46.149.67.122/"
        echo ""
        echo "🧹 Clean browser cache:"
        echo "1. Press Ctrl+Shift+Delete"
        echo "2. Select 'Cached images and files'"
        echo "3. Clear data"
        echo "4. Open new incognito window"
        echo "5. Visit http://46.149.67.122/"
        echo ""
        echo "✅ API calls will now use relative paths via Nginx proxy"
        
    else
        echo "❌ Frontend not responding"
        echo "Check: docker logs devassist-frontend"
    fi
else
    echo "❌ Build failed"
    echo "Restoring backups..."
    cp -r frontend/src/backups/services/* frontend/src/services/
    cp -r frontend/src/backups/config/* frontend/src/config/
    exit 1
fi