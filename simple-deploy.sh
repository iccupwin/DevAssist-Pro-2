#!/bin/bash

# Simple DevAssist Pro Deployment - Minimal Docker Hub pulls
# Uses existing backend monolith and serves frontend statically

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

log "Starting Simple DevAssist Pro Deployment..."

# Stop any running containers
log "Stopping existing containers..."
docker compose -f docker-compose.production.yml down --remove-orphans 2>/dev/null || true
docker compose -f docker-compose.fixed.yml down --remove-orphans 2>/dev/null || true

# Create minimal compose file that reuses existing backend setup
log "Creating minimal deployment configuration..."
cat > docker-compose.simple.yml << 'EOF'
services:
  # PostgreSQL Database
  postgres:
    image: postgres:15-alpine
    container_name: devassist_postgres_simple
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
    container_name: devassist_redis_simple
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

  # Backend FastAPI Application with Static Files
  app:
    build:
      context: ./backend
      dockerfile: Dockerfile.monolith
    container_name: devassist_app_simple
    ports:
      - "80:8000"
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
      ALLOWED_ORIGINS: http://46.149.71.162,https://46.149.71.162,http://localhost
      
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
      - ./frontend/build:/app/static:ro
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

networks:
  devassist-network:
    driver: bridge

volumes:
  postgres_data:
    driver: local
  redis_data:
    driver: local
  app_data:
    driver: local
EOF

# Build frontend locally if Node.js is available
log "Building frontend locally..."
if command -v npm &> /dev/null; then
    cd frontend
    
    # Set production environment variables
    export NODE_ENV=production
    export GENERATE_SOURCEMAP=false
    export REACT_APP_API_URL=http://46.149.71.162/api
    export REACT_APP_WS_URL=ws://46.149.71.162/ws
    
    log "Installing frontend dependencies..."
    npm install --silent
    
    log "Building React production bundle..."
    npm run build
    
    cd ..
    info "Frontend build completed ✓"
else
    error "Node.js not found. Installing Node.js..."
    
    # Install Node.js
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
    
    # Build frontend
    cd frontend
    export NODE_ENV=production
    export GENERATE_SOURCEMAP=false
    export REACT_APP_API_URL=http://46.149.71.162/api
    export REACT_APP_WS_URL=ws://46.149.71.162/ws
    
    npm install --silent
    npm run build
    cd ..
    info "Frontend build completed ✓"
fi

# Modify backend to serve static files
log "Configuring backend to serve frontend..."
cat > backend/static_files.py << 'EOF'
# Static file serving for frontend
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os

def setup_static_files(app):
    """Setup static file serving for React frontend"""
    
    # Mount static files
    if os.path.exists("/app/static"):
        app.mount("/static", StaticFiles(directory="/app/static/static"), name="static")
        
        # Serve React app
        @app.get("/")
        async def serve_frontend():
            return FileResponse("/app/static/index.html")
        
        # Catch-all for React Router
        @app.get("/{full_path:path}")
        async def serve_frontend_routes(full_path: str):
            # Don't serve static assets or API routes
            if full_path.startswith(("api/", "static/", "health", "docs")):
                raise HTTPException(404, "Not found")
            return FileResponse("/app/static/index.html")
EOF

# Update app.py to include static files
if ! grep -q "static_files" backend/app.py; then
    log "Adding static file serving to backend..."
    cat >> backend/app.py << 'EOF'

# Static file serving
try:
    from static_files import setup_static_files
    setup_static_files(app)
except ImportError:
    pass
EOF
fi

# Build and start services
log "Building backend service..."
docker compose -f docker-compose.simple.yml build --no-cache app

log "Starting all services..."
docker compose -f docker-compose.simple.yml up -d

# Wait for services
log "Waiting for services to start..."
sleep 30

# Health checks
log "Performing health checks..."

# Check containers
log "Checking container status..."
docker compose -f docker-compose.simple.yml ps

# Test frontend/backend
log "Testing application access..."
if curl -f -s "http://localhost/" > /dev/null 2>&1; then
    info "Application health check passed ✓"
else
    warning "Application not responding immediately, checking logs..."
    docker compose -f docker-compose.simple.yml logs app | tail -20
fi

# Test API specifically
if curl -f -s "http://localhost/api/" > /dev/null 2>&1 || curl -f -s "http://localhost/health" > /dev/null 2>&1; then
    info "API health check passed ✓"
else
    warning "API not responding, checking backend logs..."
    docker compose -f docker-compose.simple.yml logs app | tail -20
fi

# Show final status
log "Deployment Status:"
echo
info "🚀 DevAssist Pro simple deployment completed!"
echo
info "📍 Access URLs:"
info "   Application: http://46.149.71.162/"
info "   API:         http://46.149.71.162/api/"
info "   Health:      http://46.149.71.162/health"
echo
info "🐳 Running Services:"
docker compose -f docker-compose.simple.yml ps
echo
info "📊 Resource Usage:"
docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}" 2>/dev/null || echo "Resource stats will be available shortly"
echo
info "🔧 Management Commands:"
info "   View logs:     docker compose -f docker-compose.simple.yml logs -f"
info "   Stop services: docker compose -f docker-compose.simple.yml down"
info "   Restart:       docker compose -f docker-compose.simple.yml restart"
echo

log "🎉 Simple deployment completed!"
info "The application serves both frontend and API from the same container on port 80"
info "If services need more time to initialize, wait a few minutes and try accessing the URLs above"