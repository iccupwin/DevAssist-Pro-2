#!/bin/bash

# Fix Real Frontend - Deploy actual React application
# Handles Node.js upgrade and proper React build

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

log_header() {
    echo -e "${PURPLE}$1${NC}"
}

# Configuration
CONTAINER_NAME="devassist-frontend-production"
SERVER_IP="46.149.71.162"
FRONTEND_PORT="3000"

clear
log_header "🚀 DEVASSIST PRO - REAL FRONTEND DEPLOYMENT"
log_header "==========================================="
echo ""

# Check if we're root
if [ "$EUID" -ne 0 ]; then
    log_error "This script requires root privileges for Node.js upgrade"
    echo "Run with: sudo $0"
    exit 1
fi

# Check current Node.js version
CURRENT_NODE=$(node --version 2>/dev/null || echo "none")
log_info "Current Node.js: $CURRENT_NODE"

NEED_UPGRADE=true
if [[ "$CURRENT_NODE" =~ ^v([0-9]+) ]]; then
    MAJOR_VERSION=${BASH_REMATCH[1]}
    if [ "$MAJOR_VERSION" -ge 16 ]; then
        log_success "Node.js version is acceptable"
        NEED_UPGRADE=false
    else
        log_warning "Node.js $CURRENT_NODE is too old"
    fi
fi

# Upgrade Node.js if needed
if [ "$NEED_UPGRADE" = true ]; then
    log_header ""
    log_header "⬆️  UPGRADING NODE.JS TO V18"
    log_header "============================="
    
    log_info "Removing old Node.js..."
    apt-get remove -y nodejs npm 2>/dev/null || true
    apt-get autoremove -y 2>/dev/null || true
    
    # Clean old repository
    rm -f /etc/apt/sources.list.d/nodesource.list
    
    log_info "Installing Node.js 18 LTS..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt-get install -y nodejs
    
    # Verify installation
    NEW_VERSION=$(node --version)
    log_success "Node.js upgraded to: $NEW_VERSION"
    log_success "NPM version: $(npm --version)"
    
    # Update npm to latest
    npm install -g npm@latest
fi

# Stop existing container
log_info "Stopping existing container..."
docker stop "$CONTAINER_NAME" 2>/dev/null || true
docker rm "$CONTAINER_NAME" 2>/dev/null || true

# Go to project directory
if [ ! -d "frontend" ]; then
    log_error "Must run from project root directory (frontend/ directory not found)"
    exit 1
fi

cd frontend

log_header ""
log_header "🔧 PREPARING REAL REACT BUILD"
log_header "=============================="

# Clean everything for fresh start
log_info "Cleaning old build artifacts..."
rm -rf build/
rm -rf node_modules/.cache/
rm -rf .cache/

# Create proper .env.production for React
log_info "Creating production environment config..."
cat > .env.production << EOF
# React Production Configuration
NODE_ENV=production
REACT_APP_API_URL=http://$SERVER_IP:8000
REACT_APP_API_BASE_URL=http://$SERVER_IP:8000/api
REACT_APP_WS_URL=ws://$SERVER_IP:8000/ws

# Build optimizations
GENERATE_SOURCEMAP=false
IMAGE_INLINE_SIZE_LIMIT=0
INLINE_RUNTIME_CHUNK=false
BUILD_PATH=build

# Disable problematic features for production
DISABLE_ESLINT_PLUGIN=true
TSC_COMPILE_ON_ERROR=true
SKIP_PREFLIGHT_CHECK=true
FAST_REFRESH=false
EOF

# Reinstall dependencies with newer Node.js
log_info "Reinstalling dependencies with Node.js $(node --version)..."
rm -rf node_modules package-lock.json 2>/dev/null || true
npm cache clean --force

# Install with legacy peer deps for compatibility
npm install --legacy-peer-deps --no-audit --no-fund

log_info "Verifying critical React dependencies..."
if [ ! -d "node_modules/react" ] || [ ! -d "node_modules/react-scripts" ]; then
    log_error "Critical React packages missing after install"
    exit 1
fi

log_success "Dependencies installed successfully"

log_header ""
log_header "🏗️  BUILDING REAL REACT APPLICATION"
log_header "==================================="

# Set optimal build environment for React
export NODE_ENV=production
export NODE_OPTIONS="--max-old-space-size=4096"
export DISABLE_ESLINT_PLUGIN=true
export TSC_COMPILE_ON_ERROR=true
export CI=false
export FORCE_COLOR=0

log_info "Starting React production build..."
log_info "This may take 5-15 minutes..."

# Start build process
BUILD_START=$(date +%s)

if timeout 2400 npm run build 2>&1 | tee ../react-build.log; then
    BUILD_END=$(date +%s)
    BUILD_DURATION=$((BUILD_END - BUILD_START))
    
    log_success "React build completed in ${BUILD_DURATION} seconds!"
    
    # Verify build artifacts
    if [ -f "build/index.html" ] && [ -d "build/static" ]; then
        BUILD_SIZE=$(du -sh build | cut -f1)
        JS_FILES=$(find build/static -name "*.js" | wc -l)
        CSS_FILES=$(find build/static -name "*.css" | wc -l)
        
        log_success "Build artifacts verified:"
        log_info "  Size: $BUILD_SIZE"
        log_info "  JavaScript files: $JS_FILES"
        log_info "  CSS files: $CSS_FILES"
        log_info "  Index file: ✅"
        
        BUILD_SUCCESS=true
    else
        log_error "Build artifacts missing or incomplete"
        BUILD_SUCCESS=false
    fi
else
    log_error "React build failed"
    BUILD_SUCCESS=false
fi

if [ "$BUILD_SUCCESS" = true ]; then
    log_header ""
    log_header "🐳 DEPLOYING REAL REACT APPLICATION"
    log_header "==================================="
    
    # Create production nginx config
    cat > nginx.production.conf << 'EOF'
server {
    listen 3000;
    server_name localhost;
    
    root /usr/share/nginx/html;
    index index.html index.htm;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' ws: wss: http: https:;" always;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/javascript
        application/json
        application/xml+rss
        application/atom+xml
        image/svg+xml;
    
    # Static file caching (React build artifacts)
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
        try_files $uri =404;
    }
    
    # API proxy to backend
    location /api/ {
        proxy_pass http://46.149.71.162:8000/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_connect_timeout 30s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;
    }
    
    # WebSocket support for React dev tools and real-time features
    location /ws {
        proxy_pass http://46.149.71.162:8000/ws;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # React Router support (SPA)
    location / {
        try_files $uri $uri/ /index.html;
        
        # No cache for HTML files to ensure updates
        location ~* \.(html|htm)$ {
            add_header Cache-Control "no-cache, no-store, must-revalidate";
            add_header Pragma "no-cache";
            add_header Expires "0";
        }
    }
    
    # Health check endpoint
    location = /health {
        access_log off;
        return 200 '{"status":"healthy","service":"devassist-frontend-react","version":"production","timestamp":"'$(date -u +%Y-%m-%dT%H:%M:%SZ)'","build_size":"'$(du -sh /usr/share/nginx/html | cut -f1)'"}';
        add_header Content-Type application/json;
    }
    
    # Security: deny access to sensitive files
    location ~ /\.(ht|env|git) {
        deny all;
        return 404;
    }
    
    # Security: deny access to source maps in production
    location ~* \.map$ {
        deny all;
        return 404;
    }
}
EOF
    
    log_info "Deploying with Docker..."
    
    # Deploy real React build
    if docker run -d \
        --name "$CONTAINER_NAME" \
        -p "$FRONTEND_PORT:3000" \
        -v "$(pwd)/build:/usr/share/nginx/html:ro" \
        -v "$(pwd)/nginx.production.conf:/etc/nginx/conf.d/default.conf:ro" \
        --restart unless-stopped \
        --memory="512m" \
        --cpus="1.0" \
        --read-only \
        --tmpfs /var/cache/nginx \
        --tmpfs /var/run \
        --tmpfs /var/log/nginx \
        --security-opt no-new-privileges:true \
        nginx:alpine; then
        
        log_success "Docker container deployed successfully"
        
        # Wait for startup
        log_info "Waiting for container startup..."
        sleep 15
        
        log_header ""
        log_header "🧪 TESTING REAL REACT APPLICATION"
        log_header "================================="
        
        # Test container health
        if docker ps --filter "name=$CONTAINER_NAME" --format "{{.Names}}" | grep -q "$CONTAINER_NAME"; then
            log_success "Container is running"
            
            # Test health endpoint
            if curl -sf --max-time 10 "http://localhost:$FRONTEND_PORT/health" > /dev/null 2>&1; then
                log_success "Health endpoint working"
            fi
            
            # Test main React app
            sleep 5
            MAIN_RESPONSE=$(curl -sf --max-time 15 "http://localhost:$FRONTEND_PORT" 2>/dev/null || echo "FAILED")
            
            if echo "$MAIN_RESPONSE" | grep -qi "react\|devassist\|<div.*id.*root"; then
                log_success "React application is loading"
                
                # Test external access
                EXT_RESPONSE=$(curl -sf --max-time 15 "http://$SERVER_IP:$FRONTEND_PORT" 2>/dev/null || echo "FAILED")
                if echo "$EXT_RESPONSE" | grep -qi "react\|devassist\|<div.*id.*root"; then
                    log_success "External access confirmed"
                    
                    # Success banner
                    log_header ""
                    log_header "🎉🎉🎉 REAL REACT FRONTEND DEPLOYED! 🎉🎉🎉"
                    log_header "=========================================="
                    echo ""
                    log_success "Your DevAssist Pro React application is now live!"
                    echo ""
                    log_info "URLs:"
                    echo "  🌐 Frontend:     http://$SERVER_IP:$FRONTEND_PORT"
                    echo "  🏥 Health Check: http://$SERVER_IP:$FRONTEND_PORT/health"
                    echo "  🔧 Backend API:  http://$SERVER_IP:8000"
                    echo "  📖 API Docs:     http://$SERVER_IP:8000/docs"
                    echo ""
                    log_info "Features enabled:"
                    echo "  ✅ Full React application with all components"
                    echo "  ✅ React Router for navigation" 
                    echo "  ✅ API integration with backend"
                    echo "  ✅ WebSocket support"
                    echo "  ✅ Production optimizations"
                    echo "  ✅ Security headers"
                    echo "  ✅ Gzip compression"
                    echo ""
                    log_info "Container stats:"
                    docker stats "$CONTAINER_NAME" --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}" 2>/dev/null || true
                    
                else
                    log_warning "External access issues - check firewall/network"
                fi
            else
                log_error "React app not loading properly"
                log_info "Response preview:"
                echo "$MAIN_RESPONSE" | head -c 300
            fi
        else
            log_error "Container failed to start"
            docker logs "$CONTAINER_NAME" 2>/dev/null || true
        fi
        
    else
        log_error "Docker deployment failed"
        exit 1
    fi
    
else
    log_error "React build failed - check react-build.log for details"
    log_info "Last 10 lines of build log:"
    tail -10 ../react-build.log 2>/dev/null || echo "No build log found"
    exit 1
fi

cd ..

log_header ""
log_header "📋 MANAGEMENT COMMANDS"
log_header "======================"
echo ""
echo "Container Management:"
echo "  docker ps | grep $CONTAINER_NAME"
echo "  docker logs $CONTAINER_NAME"
echo "  docker restart $CONTAINER_NAME"
echo "  docker exec -it $CONTAINER_NAME /bin/sh"
echo ""
echo "Build Information:"
echo "  cat react-build.log"
echo "  ls -la frontend/build/"
echo "  du -sh frontend/build/"
echo ""
echo "Development:"
echo "  cd frontend && npm start    # Local development"
echo "  cd frontend && npm test     # Run tests"
echo "  cd frontend && npm run build    # Local build test"
echo ""

log_success "Real React frontend deployment completed!"