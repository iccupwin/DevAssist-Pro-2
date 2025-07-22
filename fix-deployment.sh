#!/bin/bash

# DevAssist Pro Production Deployment Fix
# Use this script to fix the deployment issues

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${BLUE}===================================================${NC}"
    echo -e "${BLUE} $1${NC}"
    echo -e "${BLUE}===================================================${NC}"
}

print_header "DevAssist Pro Production Deployment Fix"

# Stop any running containers
print_status "Stopping any existing containers..."
docker compose -f docker-compose.monolith.yml down 2>/dev/null || true
docker compose -f docker-compose.production.yml down 2>/dev/null || true

# Clean up old containers
print_status "Cleaning up old containers..."
docker ps -a --format "table {{.Names}}" | grep "devassist" | xargs -r docker rm -f || true

# Remove old images to force rebuild
print_status "Removing old images to force rebuild..."
docker images --format "table {{.Repository}}" | grep "devassist" | xargs -r docker rmi -f || true

# Check if the correct files exist
print_status "Checking required files..."

if [ ! -f "docker-compose.production.yml" ]; then
    print_error "docker-compose.production.yml not found!"
    exit 1
fi

if [ ! -f "frontend/Dockerfile.prod" ]; then
    print_error "frontend/Dockerfile.prod not found!"
    exit 1
fi

if [ ! -f ".env.production" ]; then
    print_warning ".env.production not found, creating from example..."
    if [ -f ".env.production.example" ]; then
        cp .env.production.example .env.production
        print_warning "Please update API keys in .env.production"
    else
        print_error ".env.production.example not found!"
        exit 1
    fi
fi

# Check environment variables
print_status "Checking environment configuration..."
if ! grep -q "ANTHROPIC_API_KEY=" .env.production; then
    print_error "ANTHROPIC_API_KEY not found in .env.production"
    exit 1
fi

# Make sure we're using the correct compose file
export COMPOSE_FILE="docker-compose.production.yml"

print_status "Building services (this may take a few minutes)..."
docker compose -f docker-compose.production.yml build --no-cache

print_status "Starting services..."
docker compose -f docker-compose.production.yml up -d

print_status "Waiting for services to be ready..."
sleep 30

print_status "Checking service status..."
docker compose -f docker-compose.production.yml ps

print_status "Testing health endpoints..."

# Test health endpoints
if curl -f -s http://localhost/health >/dev/null; then
    print_status "✅ Main health endpoint: OK"
else
    print_warning "❌ Main health endpoint failed"
fi

if curl -f -s http://localhost/ >/dev/null; then
    print_status "✅ Frontend: OK"
else
    print_warning "❌ Frontend failed"
fi

if curl -f -s http://localhost/api/health >/dev/null; then
    print_status "✅ API endpoint: OK"
else
    print_warning "❌ API endpoint failed"
fi

print_header "DEPLOYMENT STATUS"
print_status "DevAssist Pro deployment completed!"
echo
print_status "Access URLs:"
echo "  🌐 Frontend:      http://46.149.71.162/"
echo "  🔧 API:           http://46.149.71.162/api/"
echo "  📋 API Docs:      http://46.149.71.162/api/docs"
echo "  ❤️  Health Check: http://46.149.71.162/health"
echo

print_status "Container Status:"
docker compose -f docker-compose.production.yml ps

print_status "To view logs: docker compose -f docker-compose.production.yml logs -f"
print_status "To stop: docker compose -f docker-compose.production.yml down"
print_status "To restart: docker compose -f docker-compose.production.yml restart"

print_header "DEPLOYMENT COMPLETED!"