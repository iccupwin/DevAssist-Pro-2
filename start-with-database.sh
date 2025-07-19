#!/bin/bash

# =============================================================================
# DevAssist Pro - Complete Stack with Database
# Запускает backend, frontend и базу данных через docker-compose
# =============================================================================

echo "🚀 DevAssist Pro - Complete Stack Deployment"
echo "==========================================="

# Проверяем .env файл
if [ ! -f ".env.production" ]; then
    echo "❌ .env.production not found"
    echo "💡 Creating .env.production file..."
    ./create-env-production.sh || cat > .env.production << 'EOF'
# DevAssist Pro - Production Environment
ENVIRONMENT=production
DEBUG=False

# Database (будет использоваться из docker-compose)
DATABASE_URL=postgresql://devassist:secure_postgres_password@postgres:5432/devassist_pro
DB_HOST=postgres
DB_PORT=5432
DB_NAME=devassist_pro
DB_USER=devassist
DB_PASSWORD=secure_postgres_password

# Redis (будет использоваться из docker-compose)
REDIS_URL=redis://redis:6379/0
REDIS_HOST=redis
REDIS_PORT=6379

# Security
SECRET_KEY=super-secure-secret-key-change-this-in-production
JWT_SECRET=super-secure-jwt-secret-key-change-this
JWT_ALGORITHM=HS256

# AI API Keys (ЗАМЕНИТЕ НА РЕАЛЬНЫЕ!)
ANTHROPIC_API_KEY=your-anthropic-api-key-here
OPENAI_API_KEY=your-openai-api-key-here
GOOGLE_API_KEY=your-google-api-key-here

# CORS
CORS_ORIGINS=http://localhost,http://46.149.67.122
EOF
    echo "📝 Please edit .env.production with your real API keys"
    read -p "Press Enter after editing to continue..."
fi

echo "✅ Environment file found"

# Останавливаем старые контейнеры
echo "🛑 Stopping existing containers..."
docker-compose -f docker-compose.separate.yml down 2>/dev/null || true
docker stop $(docker ps -a -q --filter "name=devassist") 2>/dev/null || true
docker rm $(docker ps -a -q --filter "name=devassist") 2>/dev/null || true

# Запускаем через docker-compose
echo "🐳 Starting services with docker-compose..."
docker-compose -f docker-compose.separate.yml up -d --build

# Ждем запуска
echo "⏳ Waiting for services to start..."
sleep 20

# Проверяем статус
echo "🔍 Checking service status..."
docker-compose -f docker-compose.separate.yml ps

# Проверяем здоровье сервисов
echo ""
echo "🏥 Health checks:"

# PostgreSQL
if docker exec devassist-postgres pg_isready -U devassist > /dev/null 2>&1; then
    echo "✅ PostgreSQL is ready"
else
    echo "❌ PostgreSQL is not ready"
    echo "Check logs: docker logs devassist-postgres"
fi

# Redis
if docker exec devassist-redis redis-cli ping > /dev/null 2>&1; then
    echo "✅ Redis is ready"
else
    echo "❌ Redis is not ready"
    echo "Check logs: docker logs devassist-redis"
fi

# Backend
if curl -f -s http://localhost:8000/health > /dev/null 2>&1; then
    echo "✅ Backend API is healthy"
else
    echo "❌ Backend API is not responding"
    echo "Check logs: docker logs devassist-backend"
fi

# Frontend
if curl -f -s http://localhost > /dev/null 2>&1; then
    echo "✅ Frontend is running"
else
    echo "❌ Frontend is not responding"
    echo "Check logs: docker logs devassist-frontend"
fi

echo ""
echo "🎉 Deployment Summary"
echo "===================="
echo "🌐 Frontend:     http://46.149.67.122/"
echo "📊 Backend API:  http://46.149.67.122:8000"
echo "📚 API Docs:     http://46.149.67.122:8000/docs"
echo "🏥 Health:       http://46.149.67.122:8000/health"
echo ""
echo "📋 Management Commands:"
echo "docker-compose -f docker-compose.separate.yml logs -f     # View all logs"
echo "docker-compose -f docker-compose.separate.yml logs backend # Backend logs"
echo "docker-compose -f docker-compose.separate.yml restart      # Restart all"
echo "docker-compose -f docker-compose.separate.yml down        # Stop all"
echo ""
echo "🔧 Database access:"
echo "docker exec -it devassist-postgres psql -U devassist -d devassist_pro"
echo ""
echo "⚠️  Troubleshooting:"
echo "If registration still shows 'База данных недоступна':"
echo "1. Check backend logs: docker logs devassist-backend"
echo "2. Check database: docker exec devassist-postgres pg_isready"
echo "3. Restart services: docker-compose -f docker-compose.separate.yml restart"