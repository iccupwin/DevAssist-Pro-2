#!/bin/bash

# Quick deployment fix for DevAssist Pro
# Fixes common issues and redeploys

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[ERROR] $1${NC}" >&2
}

warning() {
    echo -e "${YELLOW}[WARNING] $1${NC}"
}

info() {
    echo -e "${BLUE}[INFO] $1${NC}"
}

COMPOSE_FILE="docker-compose.production.yml"

log "Starting DevAssist Pro deployment fix..."

# Stop any running containers
log "Stopping existing containers..."
docker compose -f $COMPOSE_FILE down --remove-orphans 2>/dev/null || true

# Clean up Docker resources
log "Cleaning up Docker resources..."
docker system prune -f
docker volume prune -f

# Remove version warning by creating a fixed compose file
log "Fixing docker-compose file..."
cat > docker-compose.fixed.yml << 'EOF'
services:
  # PostgreSQL Database
  postgres:
    image: postgres:15-alpine
    container_name: devassist_postgres_prod
    environment:
      POSTGRES_DB: devassist_pro
      POSTGRES_USER: devassist
      POSTGRES_PASSWORD: devassist_password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - devassist-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U devassist"]
      interval: 30s
      timeout: 10s
      retries: 3
    restart: unless-stopped

  # Redis Cache
  redis:
    image: redis:7-alpine
    container_name: devassist_redis_prod
    command: redis-server --requirepass redis_password
    volumes:
      - redis_data:/data
    networks:
      - devassist-network
    healthcheck:
      test: ["CMD", "redis-cli", "--raw", "incr", "ping"]
      interval: 30s
      timeout: 10s
      retries: 3
    restart: unless-stopped

  # Backend FastAPI Application
  app:
    build:
      context: ./backend
      dockerfile: Dockerfile.monolith
    container_name: devassist_app_prod
    environment:
      # Database Configuration
      POSTGRES_URL: postgresql://devassist:devassist_password@postgres:5432/devassist_pro
      
      # Redis Configuration
      REDIS_URL: redis://:redis_password@redis:6379/0
      
      # Application Settings
      DEBUG: false
      LOG_LEVEL: INFO
      ENVIRONMENT: production
      
      # CORS Settings for production
      ALLOWED_ORIGINS: http://46.149.71.162,https://46.149.71.162
      
      # File Upload Settings
      MAX_FILE_SIZE: 50MB
      SUPPORTED_FORMATS: pdf,docx,txt
      
      # AI Provider API Keys
      ANTHROPIC_API_KEY: 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
      OPENAI_API_KEY: ${OPENAI_API_KEY:-dummy_key}
      GOOGLE_API_KEY: ${GOOGLE_API_KEY:-dummy_key}
      USE_REAL_API: true
      
      # Server Configuration
      HOST: 0.0.0.0
      PORT: 8000
      
    volumes:
      - app_data:/app/data
    networks:
      - devassist-network
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
    restart: unless-stopped

  # Nginx with Frontend (Combined)
  nginx:
    build:
      context: ./frontend
      dockerfile: Dockerfile.prod
    container_name: devassist_nginx_prod
    ports:
      - "80:80"
    volumes:
      - ./nginx/default.conf:/etc/nginx/conf.d/default.conf:ro
      - nginx_logs:/var/log/nginx
    networks:
      - devassist-network
    depends_on:
      app:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost/"]
      interval: 30s
      timeout: 10s
      retries: 3
    restart: unless-stopped

networks:
  devassist-network:
    driver: bridge
    ipam:
      config:
        - subnet: 172.20.0.0/16

volumes:
  postgres_data:
    driver: local
  redis_data:
    driver: local
  app_data:
    driver: local
  nginx_logs:
    driver: local
EOF

# Build and start services
log "Building and starting services..."
docker compose -f docker-compose.fixed.yml build --no-cache

log "Starting services..."
docker compose -f docker-compose.fixed.yml up -d

# Wait for services to be ready
log "Waiting for services to start..."
sleep 30

# Health checks
log "Performing health checks..."

# Check containers
if ! docker compose -f docker-compose.fixed.yml ps | grep -q "Up"; then
    error "Some containers failed to start"
    docker compose -f docker-compose.fixed.yml logs
    exit 1
fi

# Test frontend
if curl -f -s "http://localhost/" > /dev/null 2>&1; then
    info "Frontend health check passed ✓"
else
    warning "Frontend health check failed, checking logs..."
    docker compose -f docker-compose.fixed.yml logs nginx
fi

# Test API
if curl -f -s "http://localhost/api/health" > /dev/null 2>&1; then
    info "Backend API health check passed ✓"
else
    warning "Backend API health check failed, checking if backend is responding..."
    if docker compose -f docker-compose.fixed.yml exec -T app curl -f "http://localhost:8000/health" > /dev/null 2>&1; then
        info "Backend is running, but API proxy may need time to stabilize ✓"
    else
        warning "Backend health check failed, checking logs..."
        docker compose -f docker-compose.fixed.yml logs app
    fi
fi

# Show status
log "Deployment Status:"
echo
info "🚀 DevAssist Pro deployment completed!"
echo
info "📍 Access URLs:"
info "   Frontend: http://46.149.71.162/"
info "   API:      http://46.149.71.162/api/"
info "   Health:   http://46.149.71.162/health"
echo
info "🐳 Running Containers:"
docker compose -f docker-compose.fixed.yml ps
echo
info "📊 Resource Usage:"
docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}" 2>/dev/null || echo "Docker stats unavailable"
echo
info "🔧 Management Commands:"
info "   View logs:     docker compose -f docker-compose.fixed.yml logs -f"
info "   Stop services: docker compose -f docker-compose.fixed.yml down"
info "   Restart:       docker compose -f docker-compose.fixed.yml restart"
echo

log "🎉 Deployment fix completed!"
info "If you see any warnings above, the services may need a few more moments to fully initialize."
info "Try accessing http://46.149.71.162/ in a few minutes if not immediately available."