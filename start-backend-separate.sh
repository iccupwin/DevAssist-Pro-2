#!/bin/bash

# =============================================================================
# DevAssist Pro - Separate Backend Startup
# Запускает только backend сервис на порту 8000
# =============================================================================

echo "🚀 Starting DevAssist Pro Backend"
echo "=================================="

# Проверяем .env файл
if [ ! -f ".env.production" ]; then
    echo "❌ .env.production not found"
    echo "💡 Run: ./create-env-production.sh"
    exit 1
fi

echo "✅ Environment file found"

# Создаем Dockerfile только для backend
cat > Dockerfile.backend-only << 'EOF'
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    procps \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY backend/requirements.txt ./backend/
RUN pip install --no-cache-dir -r backend/requirements.txt

# Copy backend application
COPY backend/ ./backend/

# Create directories
RUN mkdir -p /app/logs /app/data

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

EXPOSE 8000

ENV ENVIRONMENT=production
ENV PYTHONPATH=/app/backend

# Start backend directly
CMD ["python", "-m", "uvicorn", "backend.app:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "2"]
EOF

echo "🐳 Building backend Docker image..."
docker build -f Dockerfile.backend-only -t devassist-backend:latest .

if [ $? -eq 0 ]; then
    echo "✅ Backend image built successfully!"
    
    echo "🛑 Stopping existing backend containers..."
    docker stop devassist-backend 2>/dev/null || true
    docker rm devassist-backend 2>/dev/null || true
    
    echo "🚀 Starting backend container..."
    docker run -d \
        --name devassist-backend \
        --restart unless-stopped \
        -p 8000:8000 \
        --env-file .env.production \
        -v $(pwd)/data:/app/data \
        -v $(pwd)/logs:/app/logs \
        devassist-backend:latest
    
    echo "⏳ Waiting for backend to start..."
    sleep 10
    
    echo "🏥 Testing backend health..."
    for i in {1..20}; do
        if curl -f -s http://localhost:8000/health > /dev/null 2>&1; then
            echo "✅ Backend is healthy!"
            echo ""
            echo "🎉 Backend started successfully!"
            echo "🔗 API Gateway: http://46.149.67.122:8000"
            echo "📚 API Docs: http://46.149.67.122:8000/docs"
            echo "🏥 Health: http://46.149.67.122:8000/health"
            echo ""
            echo "📋 Backend management:"
            echo "docker logs devassist-backend         # View logs"
            echo "docker logs devassist-backend -f      # Follow logs"
            echo "docker restart devassist-backend      # Restart"
            echo "docker exec -it devassist-backend bash # Shell access"
            echo ""
            echo "🔧 Test commands:"
            echo "curl http://46.149.67.122:8000/health"
            echo "curl http://46.149.67.122:8000/docs"
            exit 0
        fi
        echo "Health check attempt $i/20..."
        sleep 3
    done
    
    echo "⚠️  Backend started but health check failed"
    echo "📋 Check logs: docker logs devassist-backend"
    
else
    echo "❌ Backend build failed"
    exit 1
fi