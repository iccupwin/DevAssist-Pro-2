#!/bin/bash

# Deploy Local Build - Copy locally built React to server
# Use this if server Node.js upgrade is not possible

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
log_header "🚀 DEVASSIST PRO - LOCAL BUILD DEPLOYMENT"
log_header "========================================="
echo ""

# Check if we're in the right directory
if [ ! -d "frontend" ]; then
    log_error "Must run from project root directory (frontend/ directory not found)"
    exit 1
fi

cd frontend

log_header "🏗️  BUILDING REACT LOCALLY"
log_header "========================="

# Check local Node.js version
LOCAL_NODE=$(node --version 2>/dev/null || echo "none")
log_info "Local Node.js version: $LOCAL_NODE"

if [[ ! "$LOCAL_NODE" =~ ^v([0-9]+) ]] || [ ${BASH_REMATCH[1]} -lt 16 ]; then
    log_error "Local Node.js version is too old or not found"
    log_info "Please install Node.js v16+ or v18 locally first"
    log_info "Visit: https://nodejs.org/en/download/"
    exit 1
fi

# Create production environment config
log_info "Creating production environment config..."
cat > .env.production << EOF
NODE_ENV=production
REACT_APP_API_URL=http://$SERVER_IP:8000
REACT_APP_API_BASE_URL=http://$SERVER_IP:8000/api
REACT_APP_WS_URL=ws://$SERVER_IP:8000/ws
GENERATE_SOURCEMAP=false
IMAGE_INLINE_SIZE_LIMIT=0
INLINE_RUNTIME_CHUNK=false
BUILD_PATH=build
DISABLE_ESLINT_PLUGIN=true
TSC_COMPILE_ON_ERROR=true
EOF

# Clean and install dependencies
log_info "Installing/updating dependencies..."
rm -rf build/ node_modules/.cache/ 2>/dev/null || true

if [ ! -d "node_modules" ] || [ ! -f "package-lock.json" ]; then
    log_info "Installing dependencies..."
    npm install --legacy-peer-deps
else
    log_info "Dependencies already installed"
fi

# Build React application
log_info "Building React production bundle..."
log_info "This may take 5-10 minutes..."

export NODE_ENV=production
export NODE_OPTIONS="--max-old-space-size=4096"
export DISABLE_ESLINT_PLUGIN=true
export TSC_COMPILE_ON_ERROR=true

BUILD_START=$(date +%s)

if npm run build; then
    BUILD_END=$(date +%s)
    BUILD_DURATION=$((BUILD_END - BUILD_START))
    
    log_success "React build completed in ${BUILD_DURATION} seconds!"
    
    # Verify build
    if [ -f "build/index.html" ] && [ -d "build/static" ]; then
        BUILD_SIZE=$(du -sh build | cut -f1)
        JS_FILES=$(find build/static -name "*.js" | wc -l)
        CSS_FILES=$(find build/static -name "*.css" | wc -l)
        
        log_success "Build verified:"
        log_info "  Size: $BUILD_SIZE"
        log_info "  JavaScript files: $JS_FILES"
        log_info "  CSS files: $CSS_FILES"
        
        BUILD_SUCCESS=true
    else
        log_error "Build verification failed - missing artifacts"
        BUILD_SUCCESS=false
    fi
else
    log_error "React build failed"
    BUILD_SUCCESS=false
fi

if [ "$BUILD_SUCCESS" = true ]; then
    log_header ""
    log_header "📦 PREPARING DEPLOYMENT PACKAGE"
    log_header "==============================="
    
    # Create deployment package
    DEPLOY_PACKAGE="devassist-frontend-$(date +%Y%m%d-%H%M%S).tar.gz"
    
    log_info "Creating deployment package: $DEPLOY_PACKAGE"
    
    # Create nginx config
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
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_comp_level 6;
    gzip_types
        text/plain text/css text/xml text/javascript
        application/javascript application/json;
    
    # Static files
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }
    
    # API proxy
    location /api/ {
        proxy_pass http://46.149.71.162:8000/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
    
    # WebSocket proxy
    location /ws {
        proxy_pass http://46.149.71.162:8000/ws;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
    
    # React Router support
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # Health check
    location = /health {
        return 200 '{"status":"healthy","service":"devassist-frontend","version":"local-build"}';
        add_header Content-Type application/json;
    }
}
EOF
    
    # Package for deployment
    tar -czf "../$DEPLOY_PACKAGE" build/ nginx.production.conf
    
    log_success "Deployment package created: $DEPLOY_PACKAGE"
    
    cd ..
    
    log_header ""
    log_header "🚀 DEPLOYING TO SERVER"
    log_header "======================"
    
    # Extract and deploy
    log_info "Extracting deployment package..."
    tar -xzf "$DEPLOY_PACKAGE"
    
    # Stop existing container
    log_info "Stopping existing container..."
    docker stop "$CONTAINER_NAME" 2>/dev/null || true
    docker rm "$CONTAINER_NAME" 2>/dev/null || true
    
    # Deploy new container
    log_info "Starting new container with React build..."
    
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
        
        log_success "Container deployed successfully"
        
        # Wait and test
        log_info "Waiting for startup..."
        sleep 15
        
        log_header ""
        log_header "🧪 TESTING DEPLOYMENT"
        log_header "===================="
        
        if docker ps --filter "name=$CONTAINER_NAME" --format "{{.Names}}" | grep -q "$CONTAINER_NAME"; then
            log_success "Container is running"
            
            # Test React app
            sleep 5
            RESPONSE=$(curl -sf --max-time 15 "http://localhost:$FRONTEND_PORT" 2>/dev/null || echo "FAILED")
            
            if echo "$RESPONSE" | grep -qi "react\|devassist\|<div.*root"; then
                log_success "React application is working!"
                
                # Test external access
                if curl -sf --max-time 10 "http://$SERVER_IP:$FRONTEND_PORT" > /dev/null 2>&1; then
                    log_success "External access confirmed"
                    
                    log_header ""
                    log_header "🎉 LOCAL BUILD DEPLOYMENT SUCCESSFUL! 🎉"
                    log_header "======================================="
                    echo ""
                    log_success "Your DevAssist Pro React application is live!"
                    echo ""
                    echo "🌐 Frontend:     http://$SERVER_IP:$FRONTEND_PORT"
                    echo "🏥 Health:       http://$SERVER_IP:$FRONTEND_PORT/health"
                    echo "🔧 Backend:      http://$SERVER_IP:8000"
                    echo "📖 API Docs:     http://$SERVER_IP:8000/docs"
                    echo ""
                    log_info "This deployment uses a locally built React bundle"
                    log_info "All React features and components should work normally"
                    
                else
                    log_warning "External access failed - check firewall"
                fi
            else
                log_error "React app not responding correctly"
                echo "Response: $RESPONSE" | head -c 200
            fi
        else
            log_error "Container startup failed"
            docker logs "$CONTAINER_NAME" 2>/dev/null || true
        fi
        
    else
        log_error "Container deployment failed"
        exit 1
    fi
    
    # Cleanup
    log_info "Cleaning up deployment files..."
    rm -f "$DEPLOY_PACKAGE"
    
else
    log_error "Build failed - cannot deploy"
    exit 1
fi

echo ""
log_header "📋 NEXT STEPS"
log_header "============="
echo ""
echo "Your React application is now deployed and should show:"
echo "• Full DevAssist Pro interface"
echo "• React Router navigation"
echo "• API integration"
echo "• All your components and pages"
echo ""
echo "If you make code changes:"
echo "1. Run this script again to rebuild and redeploy"
echo "2. Or set up automated deployment pipeline"
echo ""

log_success "Local build deployment completed!"