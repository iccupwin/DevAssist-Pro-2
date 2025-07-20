#!/bin/bash

# Quick Fix for DevAssist Pro Deployment Issues
set -e

echo "🔧 DevAssist Pro Quick Fix Starting..."

# Clean up existing containers and images
echo "🧹 Cleaning up existing containers..."
docker compose -f docker-compose.production.yml down 2>/dev/null || true
docker compose -f docker-compose.monolith.yml down 2>/dev/null || true
docker container prune -f
docker image prune -f

# Check if required files exist
echo "📋 Checking required files..."
if [ ! -f "docker-compose.production.yml" ]; then
    echo "❌ docker-compose.production.yml not found!"
    exit 1
fi

if [ ! -f ".env.production" ]; then
    echo "📝 Creating .env.production from example..."
    cp .env.production.example .env.production
    
    # Generate secure passwords
    POSTGRES_PWD=$(openssl rand -base64 32 | tr -d /=+ | cut -c -25)
    REDIS_PWD=$(openssl rand -base64 32 | tr -d /=+ | cut -c -25)
    JWT_SECRET_VAL=$(openssl rand -base64 64 | tr -d /=+ | cut -c -50)
    
    # Update passwords in the file
    sed -i "s/devassist_secure_password_2024_change_me/$POSTGRES_PWD/g" .env.production
    sed -i "s/redis_secure_password_2024_change_me/$REDIS_PWD/g" .env.production
    sed -i "s/your_jwt_secret_key_minimum_32_characters_long_change_me_now/$JWT_SECRET_VAL/g" .env.production
    
    echo "✅ .env.production created with secure passwords"
fi

# Check for API keys
if grep -q "your_.*_api_key_here" .env.production; then
    echo "⚠️  Warning: Default API keys detected. Update these in .env.production:"
    grep "your_.*_api_key_here" .env.production
    echo "🔑 For now, deployment will continue with placeholder keys..."
fi

# Build and start services
echo "🏗️  Building services (this may take 5-10 minutes)..."
docker compose -f docker-compose.production.yml build --no-cache

echo "🚀 Starting services..."
docker compose -f docker-compose.production.yml up -d

echo "⏳ Waiting for services to start..."
sleep 60

# Check status
echo "📊 Checking service status..."
docker compose -f docker-compose.production.yml ps

# Health checks
echo "🩺 Performing health checks..."

# Test basic connectivity
if curl -f -s --max-time 10 http://localhost/health >/dev/null 2>&1; then
    echo "✅ Health endpoint: OK"
else
    echo "⚠️  Health endpoint: Not ready (may need more time)"
fi

if curl -f -s --max-time 10 http://localhost/ >/dev/null 2>&1; then
    echo "✅ Frontend: OK"
else
    echo "⚠️  Frontend: Not ready (may need more time)"
fi

# Show final status
echo ""
echo "🎉 Deployment completed!"
echo ""
echo "📍 Access URLs:"
echo "   Frontend:    http://46.149.71.162/"
echo "   API:         http://46.149.71.162/api/"
echo "   Health:      http://46.149.71.162/health"
echo "   API Docs:    http://46.149.71.162/api/docs"
echo ""
echo "📋 Management commands:"
echo "   Status:      docker compose -f docker-compose.production.yml ps"
echo "   Logs:        docker compose -f docker-compose.production.yml logs -f"
echo "   Restart:     docker compose -f docker-compose.production.yml restart"
echo "   Stop:        docker compose -f docker-compose.production.yml down"
echo ""

# Show container status
echo "📦 Current container status:"
docker compose -f docker-compose.production.yml ps

echo ""
echo "🔍 If services show as 'starting' or 'unhealthy', wait a few more minutes and check again."
echo "💡 Use 'docker compose -f docker-compose.production.yml logs -f' to monitor startup."