#!/bin/bash

# Debug Container - Diagnose and fix container issues

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
log_header "🔍 DEVASSIST PRO - CONTAINER DIAGNOSTICS"
log_header "========================================"
echo ""

log_header "📊 CONTAINER STATUS"
log_header "==================="

# Check if container exists and is running
if docker ps --filter "name=$CONTAINER_NAME" --format "{{.Names}}" | grep -q "$CONTAINER_NAME"; then
    log_success "Container is running"
    
    # Get container stats
    log_info "Container resource usage:"
    docker stats "$CONTAINER_NAME" --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}" 2>/dev/null || true
    
    # Get container details
    log_info "Container details:"
    docker inspect "$CONTAINER_NAME" --format "{{.State.Status}}: {{.State.Health.Status}}" 2>/dev/null || echo "No health status"
    
else
    log_error "Container is not running"
    
    # Check if container exists but stopped
    if docker ps -a --filter "name=$CONTAINER_NAME" --format "{{.Names}}" | grep -q "$CONTAINER_NAME"; then
        log_warning "Container exists but is stopped"
        
        log_info "Container exit code:"
        docker ps -a --filter "name=$CONTAINER_NAME" --format "{{.Status}}"
    else
        log_error "Container does not exist"
    fi
fi

echo ""
log_header "📋 CONTAINER LOGS"
log_header "=================="

if docker ps -a --filter "name=$CONTAINER_NAME" --format "{{.Names}}" | grep -q "$CONTAINER_NAME"; then
    log_info "Last 20 lines of container logs:"
    docker logs "$CONTAINER_NAME" --tail 20 2>&1 || echo "No logs available"
else
    log_warning "No container to check logs for"
fi

echo ""
log_header "🏗️  BUILD ARTIFACTS CHECK"
log_header "========================="

cd frontend 2>/dev/null || {
    log_error "Must run from project root directory"
    exit 1
}

if [ -d "build" ]; then
    BUILD_SIZE=$(du -sh build | cut -f1)
    BUILD_FILES=$(find build -type f | wc -l)
    
    log_success "Build directory exists: $BUILD_SIZE, $BUILD_FILES files"
    
    # Check critical files
    if [ -f "build/index.html" ]; then
        log_success "index.html exists"
        
        # Check if index.html has content
        INDEX_SIZE=$(wc -c < build/index.html)
        if [ "$INDEX_SIZE" -gt 1000 ]; then
            log_success "index.html has good size: ${INDEX_SIZE} bytes"
            
            # Check for React root div
            if grep -q "root\|react" build/index.html; then
                log_success "index.html contains React references"
            else
                log_warning "index.html may not be a proper React build"
                log_info "First 500 chars of index.html:"
                head -c 500 build/index.html
            fi
        else
            log_warning "index.html is too small: ${INDEX_SIZE} bytes"
        fi
    else
        log_error "index.html missing!"
    fi
    
    # Check static directory
    if [ -d "build/static" ]; then
        JS_FILES=$(find build/static -name "*.js" | wc -l)
        CSS_FILES=$(find build/static -name "*.css" | wc -l)
        
        log_success "Static directory exists"
        log_info "JavaScript files: $JS_FILES"
        log_info "CSS files: $CSS_FILES"
        
        if [ "$JS_FILES" -eq 0 ]; then
            log_warning "No JavaScript files found!"
        fi
        
        if [ "$CSS_FILES" -eq 0 ]; then
            log_warning "No CSS files found!"
        fi
    else
        log_error "Static directory missing!"
    fi
    
else
    log_error "Build directory missing!"
    exit 1
fi

echo ""
log_header "🌐 NETWORK CONNECTIVITY"
log_header "======================="

# Test local connectivity
log_info "Testing local connectivity..."

# Test port binding
if ss -tlnp | grep ":$FRONTEND_PORT " > /dev/null; then
    log_success "Port $FRONTEND_PORT is bound"
else
    log_error "Port $FRONTEND_PORT is not bound"
fi

# Test localhost connection
log_info "Testing localhost connection..."
LOCAL_RESPONSE=$(curl -s --max-time 5 "http://localhost:$FRONTEND_PORT" 2>/dev/null || echo "FAILED")

if [ "$LOCAL_RESPONSE" = "FAILED" ]; then
    log_error "Localhost connection failed"
    
    # Test with different approaches
    log_info "Trying alternative connection methods..."
    
    # Try with curl verbose
    log_info "Curl verbose output:"
    curl -v --max-time 5 "http://localhost:$FRONTEND_PORT" 2>&1 | head -10 || echo "Curl failed"
    
    # Try with netcat
    if command -v nc >/dev/null 2>&1; then
        log_info "Testing with netcat:"
        echo -e "GET / HTTP/1.1\r\nHost: localhost\r\n\r\n" | nc -w 3 localhost $FRONTEND_PORT 2>/dev/null | head -5 || echo "Netcat test failed"
    fi
    
else
    log_success "Localhost connection successful"
    
    # Analyze response
    RESPONSE_LENGTH=${#LOCAL_RESPONSE}
    log_info "Response length: $RESPONSE_LENGTH characters"
    
    if [ "$RESPONSE_LENGTH" -gt 100 ]; then
        log_success "Response has good length"
        
        # Check for HTML content
        if echo "$LOCAL_RESPONSE" | grep -qi "html\|DOCTYPE"; then
            log_success "Response contains HTML"
            
            # Check for React indicators
            if echo "$LOCAL_RESPONSE" | grep -qi "react\|<div.*root\|<div.*id.*root"; then
                log_success "Response contains React indicators"
            else
                log_warning "Response may not be from React app"
                log_info "Response preview (first 300 chars):"
                echo "$LOCAL_RESPONSE" | head -c 300
            fi
        else
            log_warning "Response is not HTML"
            log_info "Response content:"
            echo "$LOCAL_RESPONSE" | head -c 200
        fi
    else
        log_warning "Response is too short"
        log_info "Full response:"
        echo "$LOCAL_RESPONSE"
    fi
fi

echo ""
log_header "🔧 NGINX CONFIGURATION"
log_header "======================"

# Check nginx config
if [ -f "nginx.production.conf" ]; then
    log_success "Nginx config file exists"
    
    # Test nginx config syntax
    if docker exec "$CONTAINER_NAME" nginx -t 2>/dev/null; then
        log_success "Nginx configuration is valid"
    else
        log_error "Nginx configuration has errors"
        log_info "Nginx config test output:"
        docker exec "$CONTAINER_NAME" nginx -t 2>&1 || echo "Could not test config"
    fi
    
    # Show nginx config
    log_info "Nginx configuration:"
    cat nginx.production.conf | head -20
    
else
    log_error "Nginx config file missing!"
fi

echo ""
log_header "🚀 RESTART AND TEST"
log_header "==================="

log_info "Attempting to restart container..."

# Stop container
docker stop "$CONTAINER_NAME" 2>/dev/null || true
sleep 2

# Start container again
log_info "Starting container with fresh configuration..."

if docker run -d \
    --name "${CONTAINER_NAME}-new" \
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
    
    log_success "New container started"
    
    # Remove old container
    docker rm "$CONTAINER_NAME" 2>/dev/null || true
    docker rename "${CONTAINER_NAME}-new" "$CONTAINER_NAME"
    
    # Wait for startup
    sleep 10
    
    # Test new container
    log_info "Testing new container..."
    
    NEW_RESPONSE=$(curl -s --max-time 10 "http://localhost:$FRONTEND_PORT" 2>/dev/null || echo "FAILED")
    
    if [ "$NEW_RESPONSE" != "FAILED" ] && echo "$NEW_RESPONSE" | grep -qi "html\|react\|<div"; then
        log_success "New container is working!"
        
        # Test external access
        if curl -s --max-time 10 "http://$SERVER_IP:$FRONTEND_PORT" >/dev/null 2>&1; then
            log_success "External access confirmed!"
            
            log_header ""
            log_header "🎉 SUCCESS! CONTAINER IS NOW WORKING 🎉"
            log_header "======================================="
            echo ""
            log_success "Frontend: http://$SERVER_IP:$FRONTEND_PORT"
            log_success "Health:   http://$SERVER_IP:$FRONTEND_PORT/health"
            echo ""
            log_info "Your React application should now be fully functional!"
            
        else
            log_warning "External access failed - check firewall"
        fi
    else
        log_error "New container still not working"
        log_info "Response: $(echo "$NEW_RESPONSE" | head -c 200)"
    fi
    
else
    log_error "Failed to start new container"
fi

cd ..

echo ""
log_header "📋 TROUBLESHOOTING SUMMARY"
log_header "=========================="
echo ""
echo "If the container is still not working, try:"
echo ""
echo "1. Check firewall settings:"
echo "   sudo ufw status"
echo "   sudo ufw allow $FRONTEND_PORT"
echo ""
echo "2. Rebuild the React app:"
echo "   cd frontend && npm run build"
echo ""
echo "3. Check Docker logs:"
echo "   docker logs $CONTAINER_NAME"
echo ""
echo "4. Test directly with nginx:"
echo "   docker run --rm -p $FRONTEND_PORT:80 -v $(pwd)/frontend/build:/usr/share/nginx/html nginx:alpine"
echo ""
echo "5. Manual container restart:"
echo "   docker restart $CONTAINER_NAME"
echo ""

log_success "Container diagnostic completed!"