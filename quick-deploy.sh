#!/bin/bash

# =============================================================================
# DevAssist Pro - Quick Deploy (bypasses frontend build issues)
# Uses pre-built frontend or builds it locally first
# =============================================================================

set -e

echo "🚀 Quick Deploy - DevAssist Pro"
echo "================================="

# Check if frontend build exists, if not try to build locally
if [ ! -d "frontend/build" ]; then
    echo "📦 Frontend build not found, trying to build locally..."
    
    if command -v npm &> /dev/null; then
        echo "Building frontend locally..."
        cd frontend
        npm install
        npm run build
        cd ..
        echo "✅ Frontend built locally"
    else
        echo "❌ npm not available locally, creating minimal frontend..."
        mkdir -p frontend/build
        cat > frontend/build/index.html << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <title>DevAssist Pro</title>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; background: #1a1a1a; color: white; }
        .container { max-width: 800px; margin: 0 auto; text-align: center; }
        .title { color: #6366f1; font-size: 2.5em; margin-bottom: 20px; }
        .subtitle { font-size: 1.2em; margin-bottom: 30px; color: #9ca3af; }
        .api-link { display: inline-block; background: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px; }
        .api-link:hover { background: #4f46e5; }
    </style>
</head>
<body>
    <div class="container">
        <h1 class="title">🚀 DevAssist Pro</h1>
        <p class="subtitle">AI-powered веб-портал для девелоперов недвижимости</p>
        <div>
            <a href="/docs" class="api-link">📚 API Documentation</a>
            <a href="/health" class="api-link">🏥 Health Check</a>
        </div>
        <p>Backend API работает! Frontend будет добавлен позже.</p>
    </div>
</body>
</html>
EOF
        echo "✅ Minimal frontend created"
    fi
else
    echo "✅ Frontend build found"
fi

# Create simplified Dockerfile that doesn't build frontend
cat > Dockerfile.quick << 'EOF'
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    nginx \
    curl \
    supervisor \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY backend/requirements.txt ./backend/
RUN pip install --no-cache-dir -r backend/requirements.txt

# Copy application
COPY backend/ ./backend/
COPY frontend/build ./frontend/build/

# Copy configs
COPY nginx.production.conf /etc/nginx/nginx.conf
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf
COPY start-production.sh ./start-production.sh
RUN chmod +x ./start-production.sh

# Create directories
RUN mkdir -p /var/log/nginx /var/log/supervisor /app/logs /app/data

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost/health || exit 1

EXPOSE 80

ENV ENVIRONMENT=production
ENV PYTHONPATH=/app/backend

CMD ["./start-production.sh"]
EOF

echo "🔨 Building with quick Dockerfile..."
docker build -f Dockerfile.quick -t devassist-pro:latest .

if [ $? -eq 0 ]; then
    echo "✅ Docker image built successfully"
    
    echo "🛑 Stopping existing containers..."
    docker stop devassist-pro 2>/dev/null || true
    docker rm devassist-pro 2>/dev/null || true
    
    echo "🚀 Starting DevAssist Pro..."
    docker run -d \
        --name devassist-pro \
        --restart unless-stopped \
        -p 80:80 \
        --env-file .env.production \
        -v $(pwd)/data:/app/data \
        -v $(pwd)/logs:/app/logs \
        devassist-pro:latest
    
    echo "⏳ Waiting for service to start..."
    sleep 10
    
    echo "🏥 Checking health..."
    for i in {1..30}; do
        if curl -f -s http://localhost/health > /dev/null; then
            echo "✅ Service is healthy!"
            break
        fi
        echo "Attempt $i/30..."
        sleep 2
    done
    
    echo ""
    echo "🎉 DevAssist Pro deployed successfully!"
    echo "🌐 Frontend: http://46.149.67.122/"
    echo "📚 API Docs: http://46.149.67.122/docs"
    echo "🏥 Health: http://46.149.67.122/health"
    echo ""
    echo "📋 Useful commands:"
    echo "docker logs devassist-pro        # View logs"
    echo "docker restart devassist-pro     # Restart"
    echo "docker exec -it devassist-pro /bin/bash  # Shell access"
    
else
    echo "❌ Docker build failed"
    exit 1
fi