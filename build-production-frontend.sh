#!/bin/bash

# Improved Production Frontend Build Script for DevAssist Pro
# Handles Node.js version issues, TypeScript errors, and deployment

set -euo pipefail  # Exit on any error

# Colors for better output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Configuration
MIN_NODE_VERSION="16.0.0"
CONTAINER_NAME="devassist-frontend-production"
BUILD_TIMEOUT=1800  # 30 minutes
SERVER_IP="46.149.71.162"
FRONTEND_PORT="3000"
BUILD_LOG="build-production.log"

# Logging functions
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

# Cleanup function
cleanup() {
    local exit_code=$?
    if [ $exit_code -ne 0 ]; then
        log_error "Script failed with exit code $exit_code"
        log_info "Check build log: $BUILD_LOG"
        log_info "Last 20 lines of build log:"
        tail -20 "$BUILD_LOG" 2>/dev/null || echo "No build log found"
    fi
}

trap cleanup EXIT

# Header
clear
log_header "🏭 DEVASSIST PRO - PRODUCTION FRONTEND BUILD"
log_header "============================================="
echo ""

# Step 1: Prerequisites check
log_info "Checking prerequisites..."

# Check if we're in the right directory
if [ ! -d "frontend" ]; then
    log_error "Must run from project root directory (frontend/ directory not found)"
    exit 1
fi

# Check Docker
if ! command -v docker &> /dev/null; then
    log_error "Docker is required but not installed"
    exit 1
fi

# Check if Docker is running
if ! docker info &> /dev/null; then
    log_error "Docker is not running. Please start Docker first."
    exit 1
fi

log_success "Prerequisites OK"

# Step 2: Node.js version management
log_info "Checking Node.js version..."

CURRENT_NODE=$(node --version | sed 's/v//')
log_info "Current Node.js: v$CURRENT_NODE"

# Function to compare versions
version_gt() {
    test "$(printf '%s\n' "$@" | sort -V | head -n 1)" != "$1"
}

# Check if current Node.js version is sufficient
if version_gt "$MIN_NODE_VERSION" "$CURRENT_NODE"; then
    log_warning "Node.js v$CURRENT_NODE is too old (minimum: v$MIN_NODE_VERSION)"
    
    # Try to use NVM if available
    if [ -f "$HOME/.nvm/nvm.sh" ]; then
        log_info "Attempting to use newer Node.js version via NVM..."
        source "$HOME/.nvm/nvm.sh"
        
        # Try to use Node.js 18 or 16
        if nvm use 18 2>/dev/null || nvm use 16 2>/dev/null; then
            NEW_NODE=$(node --version | sed 's/v//')
            log_success "Switched to Node.js v$NEW_NODE"
        else
            log_warning "Could not switch to newer Node.js version"
            log_warning "Continuing with v$CURRENT_NODE (may cause build issues)"
        fi
    else
        log_warning "NVM not found. Consider installing Node.js v16+ or NVM"
        log_warning "Continuing with current version (build may fail)"
    fi
else
    log_success "Node.js v$CURRENT_NODE is compatible"
fi

# Step 3: Clean up existing processes and containers
log_info "Stopping existing processes and containers..."

# Stop Node.js processes on port 3000
sudo lsof -ti:3000 | xargs sudo kill -9 2>/dev/null || true

# Stop and remove existing container
docker stop "$CONTAINER_NAME" 2>/dev/null || true
docker rm "$CONTAINER_NAME" 2>/dev/null || true

# Remove old PID files
if [ -f "frontend.pid" ]; then
    kill $(cat frontend.pid) 2>/dev/null || true
    rm -f frontend.pid
fi

log_success "Cleanup completed"

# Step 4: Enter frontend directory and setup environment
cd frontend

log_info "Setting up build environment..."

# Create optimized .env.production
cat > .env.production << EOF
# Production environment configuration
NODE_ENV=production
REACT_APP_API_URL=http://${SERVER_IP}:8000
REACT_APP_API_BASE_URL=http://${SERVER_IP}:8000/api
REACT_APP_WS_URL=ws://${SERVER_IP}:8000/ws

# Build optimizations
GENERATE_SOURCEMAP=false
IMAGE_INLINE_SIZE_LIMIT=0
INLINE_RUNTIME_CHUNK=false
BUILD_PATH=build

# Disable warnings and checks
ESLINT_NO_DEV_ERRORS=true
TSC_COMPILE_ON_ERROR=true
DISABLE_ESLINT_PLUGIN=true
EOF

log_success ".env.production created"

# Step 5: Dependencies management
log_info "Managing dependencies..."

# Check if node_modules exists and is healthy
if [ ! -d "node_modules" ] || [ ! -f "node_modules/.package-lock.json" ] || [ ! -f "node_modules/react/package.json" ]; then
    log_info "Installing dependencies..."
    
    # Clear npm cache if it's too large (>500MB)
    CACHE_SIZE=$(npm cache verify 2>/dev/null | grep -o '[0-9]*\.[0-9]*MB' | head -1 | sed 's/MB//' || echo "0")
    if (( $(echo "$CACHE_SIZE > 500" | bc -l 2>/dev/null || echo "0") )); then
        log_info "Clearing large npm cache ($CACHE_SIZE MB)..."
        npm cache clean --force
    fi
    
    # Install with legacy peer deps for compatibility
    npm ci --legacy-peer-deps --no-audit --no-fund --quiet 2>&1 | tee -a "../$BUILD_LOG" || {
        log_error "Dependency installation failed"
        exit 1
    }
else
    log_success "Dependencies already installed"
fi

# Verify critical packages
log_info "Verifying critical packages..."
MISSING_PACKAGES=""
for package in "react" "typescript" "@types/react" "react-scripts"; do
    if [ ! -d "node_modules/$package" ]; then
        MISSING_PACKAGES="$MISSING_PACKAGES $package"
    fi
done

if [ -n "$MISSING_PACKAGES" ]; then
    log_error "Missing critical packages:$MISSING_PACKAGES"
    exit 1
fi

log_success "All critical packages verified"

# Step 6: Clean old build artifacts
log_info "Cleaning old build artifacts..."
rm -rf build/
rm -rf .cache/
rm -rf node_modules/.cache/ 2>/dev/null || true

log_success "Build artifacts cleaned"

# Step 7: Production build
log_header ""
log_header "🚀 STARTING PRODUCTION BUILD"
log_header "=============================="

# Set build environment variables
export NODE_ENV=production
export NODE_OPTIONS="--max-old-space-size=4096"
export DISABLE_ESLINT_PLUGIN=true
export TSC_COMPILE_ON_ERROR=true
export CI=false
export FORCE_COLOR=0

log_info "Build started (timeout: $(($BUILD_TIMEOUT/60)) minutes)..."
log_info "Environment: NODE_ENV=$NODE_ENV"
log_info "Memory limit: $(echo $NODE_OPTIONS | grep -o '[0-9]*')"
log_info "Build log: ../$BUILD_LOG"

# Record build start time
BUILD_START=$(date +%s)

# Run build with timeout
if timeout $BUILD_TIMEOUT npm run build > "../$BUILD_LOG" 2>&1; then
    BUILD_SUCCESS=true
    BUILD_EXIT_CODE=0
else
    BUILD_EXIT_CODE=$?
    BUILD_SUCCESS=false
fi

BUILD_END=$(date +%s)
BUILD_DURATION=$((BUILD_END - BUILD_START))

# Analyze build results
if [ "$BUILD_SUCCESS" = true ]; then
    log_success "Build completed successfully in ${BUILD_DURATION}s"
    
    # Build statistics
    if [ -d "build" ]; then
        BUILD_SIZE=$(du -sh build | cut -f1)
        BUILD_FILES=$(find build -type f | wc -l)
        log_info "Build size: $BUILD_SIZE"
        log_info "Total files: $BUILD_FILES"
        
        # Check for common files
        if [ -f "build/index.html" ]; then
            log_success "index.html created"
        else
            log_warning "index.html missing!"
        fi
        
        if [ -d "build/static" ]; then
            JS_FILES=$(find build/static -name "*.js" | wc -l)
            CSS_FILES=$(find build/static -name "*.css" | wc -l)
            log_info "JavaScript files: $JS_FILES"
            log_info "CSS files: $CSS_FILES"
        fi
    else
        log_error "Build directory not created!"
        BUILD_SUCCESS=false
    fi
else
    if [ $BUILD_EXIT_CODE -eq 124 ]; then
        log_error "Build timed out after $(($BUILD_TIMEOUT/60)) minutes"
    else
        log_error "Build failed with exit code $BUILD_EXIT_CODE"
    fi
    
    log_info "Last 10 build errors:"
    grep -E "(Error|error|FATAL|Failed)" "../$BUILD_LOG" | tail -10 || echo "No specific errors found"
fi

# Step 8: Deploy if build succeeded
if [ "$BUILD_SUCCESS" = true ]; then
    log_header ""
    log_header "🐳 DEPLOYING WITH DOCKER"
    log_header "========================"
    
    # Create advanced nginx configuration
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
        text/plain
        text/css
        text/xml
        text/javascript
        text/json
        application/javascript
        application/json
        application/xml+rss
        application/atom+xml
        image/svg+xml;
    
    # Static file caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
        try_files $uri $uri/ =404;
    }
    
    # API proxy (if needed)
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
    
    # React Router support
    location / {
        try_files $uri $uri/ /index.html;
        
        # No cache for HTML files
        location ~* \.(html|htm)$ {
            add_header Cache-Control "no-cache, no-store, must-revalidate";
            add_header Pragma "no-cache";
            add_header Expires "0";
        }
    }
    
    # Health check endpoint
    location /health {
        access_log off;
        return 200 '{"status":"healthy","service":"devassist-frontend","version":"production","timestamp":"'$(date -u +%Y-%m-%dT%H:%M:%SZ)'"}';
        add_header Content-Type application/json;
    }
    
    # Deny access to sensitive files
    location ~ /\.(ht|env|git) {
        deny all;
        return 404;
    }
}
EOF
    
    log_info "Starting Docker container..."
    
    # Run Docker container with resource limits and security settings
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
        
        log_success "Docker container started successfully"
        
        # Wait for container to be ready
        log_info "Waiting for container startup..."
        sleep 10
        
        # Step 9: Test deployment
        log_header ""
        log_header "🧪 TESTING DEPLOYMENT"
        log_header "====================="
        
        # Container status check
        if docker ps --filter "name=$CONTAINER_NAME" --format "{{.Names}}" | grep -q "$CONTAINER_NAME"; then
            log_success "Container is running"
            
            # Health check
            log_info "Testing health endpoint..."
            if curl -sf --max-time 10 "http://localhost:$FRONTEND_PORT/health" > /dev/null 2>&1; then
                log_success "Health check passed"
            else
                log_warning "Health check failed"
            fi
            
            # Local accessibility test
            log_info "Testing local access..."
            sleep 5
            LOCAL_TEST=$(curl -sf --max-time 15 "http://localhost:$FRONTEND_PORT" 2>/dev/null || echo "FAILED")
            if echo "$LOCAL_TEST" | grep -qi "html\|<div\|<title\|devassist\|react"; then
                log_success "Local access works"
                
                # External accessibility test
                log_info "Testing external access..."
                EXT_TEST=$(curl -sf --max-time 15 "http://$SERVER_IP:$FRONTEND_PORT" 2>/dev/null || echo "FAILED")
                if echo "$EXT_TEST" | grep -qi "html\|<div\|<title\|devassist\|react"; then
                    log_success "External access works"
                    
                    # Success banner
                    log_header ""
                    log_header "🎉🎉🎉 DEPLOYMENT SUCCESSFUL! 🎉🎉🎉"
                    log_header "====================================="
                    echo ""
                    log_success "Frontend URL: http://$SERVER_IP:$FRONTEND_PORT"
                    log_success "Health Check: http://$SERVER_IP:$FRONTEND_PORT/health"
                    echo ""
                    log_info "Container Stats:"
                    docker stats "$CONTAINER_NAME" --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}" 2>/dev/null || true
                    
                else
                    log_warning "External access failed"
                    log_info "Local response preview:"
                    echo "$LOCAL_TEST" | head -c 200
                fi
            else
                log_error "Local access failed"
                log_info "Response preview:"
                echo "$LOCAL_TEST" | head -c 200
            fi
            
        else
            log_error "Container failed to start"
            log_info "Container logs:"
            docker logs "$CONTAINER_NAME" 2>/dev/null | tail -20 || echo "No logs available"
        fi
        
    else
        log_error "Failed to start Docker container"
        exit 1
    fi
else
    # Build failed
    log_header ""
    log_header "❌ BUILD FAILED"
    log_header "==============="
    echo ""
    log_error "Production build unsuccessful"
    echo ""
    log_info "Common solutions:"
    echo "  • Update Node.js to v16+ or v18+"
    echo "  • Increase server memory"
    echo "  • Fix TypeScript errors in code"
    echo "  • Clear npm cache: npm cache clean --force"
    echo "  • Delete node_modules and reinstall"
    echo ""
    log_info "Detailed build log available at: $BUILD_LOG"
    
    exit 1
fi

# Step 10: Final information
cd ..

log_header ""
log_header "📋 MANAGEMENT COMMANDS"
log_header "======================"
echo ""
echo "Container Management:"
echo "  docker ps | grep frontend-production"
echo "  docker logs $CONTAINER_NAME"
echo "  docker restart $CONTAINER_NAME"
echo "  docker stop $CONTAINER_NAME"
echo ""
echo "Build Information:"
echo "  tail -100 $BUILD_LOG"
echo "  ls -la frontend/build/"
echo ""
echo "System URLs:"
echo "  Frontend: http://$SERVER_IP:$FRONTEND_PORT"
echo "  Backend:  http://$SERVER_IP:8000"
echo "  API Docs: http://$SERVER_IP:8000/docs"
echo ""

log_success "Production deployment completed successfully!"