#!/bin/bash

# Build Diagnostics Script for DevAssist Pro
# Helps diagnose common build issues

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

# Header
log_header "🔍 DEVASSIST PRO - BUILD DIAGNOSTICS"
log_header "===================================="
echo ""

# Check if we're in the right directory
if [ ! -d "frontend" ]; then
    log_error "Must run from project root directory (frontend/ directory not found)"
    exit 1
fi

# System Information
log_header "📊 SYSTEM INFORMATION"
log_header "====================="
echo "Operating System: $(uname -a)"
echo "User: $(whoami)"
echo "Current Directory: $(pwd)"
echo "Available Memory: $(free -h | grep Mem | awk '{print $7}' || echo 'N/A')"
echo "Available Disk Space: $(df -h . | tail -1 | awk '{print $4}')"
echo ""

# Node.js and NPM Information
log_header "🟢 NODE.JS & NPM INFORMATION"
log_header "============================="

if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    log_success "Node.js: $NODE_VERSION"
    
    # Check if version is acceptable
    MAJOR_VERSION=$(echo "$NODE_VERSION" | sed 's/v//' | cut -d'.' -f1)
    if [ "$MAJOR_VERSION" -lt 16 ]; then
        log_error "Node.js $NODE_VERSION is too old (minimum: v16.0.0)"
        echo "  Recommended: Install Node.js v18 LTS"
        echo "  Quick install: ./install-nodejs.sh"
    elif [ "$MAJOR_VERSION" -lt 18 ]; then
        log_warning "Node.js $NODE_VERSION is old but should work"
        echo "  Recommended: Upgrade to v18 LTS for better compatibility"
    else
        log_success "Node.js version is good"
    fi
else
    log_error "Node.js not installed"
    echo "  Install Node.js: ./install-nodejs.sh"
fi

if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    log_success "NPM: v$NPM_VERSION"
else
    log_error "NPM not found"
fi

# Check NVM
if [ -f "$HOME/.nvm/nvm.sh" ]; then
    log_success "NVM is available"
    echo "  Available Node.js versions:"
    source "$HOME/.nvm/nvm.sh" && nvm list 2>/dev/null | head -10 || echo "  No versions installed"
else
    log_info "NVM not installed (optional)"
fi

echo ""

# Docker Information
log_header "🐳 DOCKER INFORMATION"
log_header "====================="

if command -v docker &> /dev/null; then
    log_success "Docker is installed"
    DOCKER_VERSION=$(docker --version)
    echo "  Version: $DOCKER_VERSION"
    
    if docker info &> /dev/null; then
        log_success "Docker is running"
        echo "  Containers: $(docker ps -a | wc -l | awk '{print $1-1}')"
        echo "  Images: $(docker images | wc -l | awk '{print $1-1}')"
        
        # Check existing DevAssist containers
        if docker ps -a --filter "name=devassist" --format "{{.Names}}" | grep -q "devassist"; then
            log_info "Existing DevAssist containers:"
            docker ps -a --filter "name=devassist" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
        fi
    else
        log_error "Docker is not running"
        echo "  Start Docker: sudo systemctl start docker"
    fi
else
    log_error "Docker not installed"
fi

echo ""

# Frontend Directory Analysis
log_header "📁 FRONTEND DIRECTORY ANALYSIS"
log_header "==============================="

cd frontend

# Package.json check
if [ -f "package.json" ]; then
    log_success "package.json exists"
    
    # Check React version
    if command -v jq &> /dev/null; then
        REACT_VERSION=$(jq -r '.dependencies.react // empty' package.json)
        if [ -n "$REACT_VERSION" ]; then
            log_success "React version: $REACT_VERSION"
        else
            log_warning "React version not found in dependencies"
        fi
        
        TYPESCRIPT_VERSION=$(jq -r '.dependencies.typescript // .devDependencies.typescript // empty' package.json)
        if [ -n "$TYPESCRIPT_VERSION" ]; then
            log_success "TypeScript version: $TYPESCRIPT_VERSION"
        else
            log_warning "TypeScript not found in dependencies"
        fi
    else
        log_info "jq not available, cannot parse package.json versions"
    fi
else
    log_error "package.json missing!"
    exit 1
fi

# Node modules check
if [ -d "node_modules" ]; then
    log_success "node_modules directory exists"
    NODE_MODULES_SIZE=$(du -sh node_modules 2>/dev/null | cut -f1)
    echo "  Size: $NODE_MODULES_SIZE"
    
    # Check critical packages
    CRITICAL_PACKAGES=("react" "react-dom" "typescript" "react-scripts" "@types/react")
    MISSING_CRITICAL=""
    
    for package in "${CRITICAL_PACKAGES[@]}"; do
        if [ -d "node_modules/$package" ]; then
            log_success "$package installed"
        else
            log_error "$package missing"
            MISSING_CRITICAL="$MISSING_CRITICAL $package"
        fi
    done
    
    if [ -n "$MISSING_CRITICAL" ]; then
        log_error "Critical packages missing:$MISSING_CRITICAL"
        echo "  Fix: rm -rf node_modules && npm install"
    fi
    
    # Check package-lock integrity
    if [ -f "package-lock.json" ] && [ -f "node_modules/.package-lock.json" ]; then
        log_success "Package lock files present"
    else
        log_warning "Package lock integrity issue"
        echo "  Fix: rm -rf node_modules && npm ci"
    fi
else
    log_error "node_modules missing"
    echo "  Fix: npm install"
fi

# Environment files check
if [ -f ".env" ]; then
    log_success ".env file exists"
else
    log_info ".env file not found (using defaults)"
fi

if [ -f ".env.production" ]; then
    log_success ".env.production exists"
    echo "  API URL: $(grep REACT_APP_API_URL .env.production | cut -d'=' -f2 || echo 'Not set')"
else
    log_info ".env.production will be created during build"
fi

# Build artifacts check
if [ -d "build" ]; then
    BUILD_SIZE=$(du -sh build 2>/dev/null | cut -f1)
    BUILD_FILES=$(find build -type f 2>/dev/null | wc -l)
    log_info "Previous build exists: $BUILD_SIZE, $BUILD_FILES files"
    
    if [ -f "build/index.html" ]; then
        log_success "build/index.html exists"
    else
        log_warning "build/index.html missing in previous build"
    fi
else
    log_info "No previous build directory"
fi

echo ""

# Build log analysis
log_header "📋 BUILD LOG ANALYSIS"
log_header "====================="

cd ..

if [ -f "build-production.log" ]; then
    LOG_SIZE=$(du -sh build-production.log | cut -f1)
    LOG_LINES=$(wc -l build-production.log | awk '{print $1}')
    log_success "Build log exists: $LOG_SIZE, $LOG_LINES lines"
    
    echo ""
    log_info "Last 10 lines of build log:"
    tail -10 build-production.log | sed 's/^/  /'
    
    echo ""
    log_info "Error summary from build log:"
    if grep -i "error\|fail\|fatal" build-production.log | tail -5; then
        echo ""
    else
        echo "  No obvious errors found"
    fi
else
    log_info "No build log found (build not attempted yet)"
fi

echo ""

# Memory and Performance Analysis
log_header "⚡ PERFORMANCE ANALYSIS"
log_header "======================"

# Available memory
if command -v free &> /dev/null; then
    TOTAL_MEM=$(free -m | grep Mem | awk '{print $2}')
    AVAILABLE_MEM=$(free -m | grep Mem | awk '{print $7}')
    echo "Total Memory: ${TOTAL_MEM}MB"
    echo "Available Memory: ${AVAILABLE_MEM}MB"
    
    if [ "$AVAILABLE_MEM" -lt 2048 ]; then
        log_warning "Low available memory (${AVAILABLE_MEM}MB)"
        echo "  Recommendation: Close other applications or add more RAM"
        echo "  Build may fail with out-of-memory errors"
    else
        log_success "Sufficient memory available"
    fi
else
    log_info "Memory information not available"
fi

# CPU information
if command -v nproc &> /dev/null; then
    CPU_CORES=$(nproc)
    echo "CPU Cores: $CPU_CORES"
    if [ "$CPU_CORES" -lt 2 ]; then
        log_warning "Limited CPU cores ($CPU_CORES)"
        echo "  Build may be slow"
    else
        log_success "Good CPU core count"
    fi
fi

echo ""

# Network connectivity check
log_header "🌐 NETWORK CONNECTIVITY"
log_header "=======================" 

log_info "Checking NPM registry connectivity..."
if curl -sf --max-time 10 "https://registry.npmjs.org/" > /dev/null 2>&1; then
    log_success "NPM registry accessible"
else
    log_warning "NPM registry not accessible"
    echo "  This may cause dependency installation issues"
fi

log_info "Checking Docker Hub connectivity..."
if curl -sf --max-time 10 "https://hub.docker.com/" > /dev/null 2>&1; then
    log_success "Docker Hub accessible"
else
    log_warning "Docker Hub not accessible"
    echo "  This may cause Docker image pull issues"
fi

echo ""

# Final recommendations
log_header "💡 RECOMMENDATIONS"
log_header "=================="

ISSUES_FOUND=0

# Node.js version check
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version | sed 's/v//')
    MAJOR_VERSION=$(echo "$NODE_VERSION" | cut -d'.' -f1)
    if [ "$MAJOR_VERSION" -lt 16 ]; then
        echo "🔴 CRITICAL: Upgrade Node.js to v16+ or v18 LTS"
        echo "   Run: ./install-nodejs.sh"
        ISSUES_FOUND=$((ISSUES_FOUND + 1))
    fi
else
    echo "🔴 CRITICAL: Install Node.js"
    echo "   Run: ./install-nodejs.sh"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
fi

# Docker check
if ! command -v docker &> /dev/null; then
    echo "🔴 CRITICAL: Install Docker"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
elif ! docker info &> /dev/null; then
    echo "🟡 WARNING: Start Docker service"
    echo "   Run: sudo systemctl start docker"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
fi

# Dependencies check
if [ ! -d "frontend/node_modules" ]; then
    echo "🟡 WARNING: Install dependencies"
    echo "   Run: cd frontend && npm install"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
fi

# Memory check
if command -v free &> /dev/null; then
    AVAILABLE_MEM=$(free -m | grep Mem | awk '{print $7}')
    if [ "$AVAILABLE_MEM" -lt 2048 ]; then
        echo "🟡 WARNING: Low memory (${AVAILABLE_MEM}MB available)"
        echo "   Consider closing other applications"
        ISSUES_FOUND=$((ISSUES_FOUND + 1))
    fi
fi

if [ "$ISSUES_FOUND" -eq 0 ]; then
    echo ""
    log_success "No critical issues found!"
    echo ""
    echo "Your system appears ready for production build."
    echo "Run: ./build-production-frontend.sh"
else
    echo ""
    log_warning "$ISSUES_FOUND issue(s) found that should be addressed"
    echo ""
    echo "After fixing the issues above, run:"
    echo "  ./build-production-frontend.sh"
fi

echo ""
log_header "📚 USEFUL COMMANDS"
log_header "=================="
echo "Build frontend:     ./build-production-frontend.sh"
echo "Install Node.js:    ./install-nodejs.sh"
echo "Check build log:    tail -50 build-production.log"
echo "Clean node_modules: cd frontend && rm -rf node_modules && npm install"
echo "Docker containers:  docker ps -a | grep devassist"
echo "Docker logs:        docker logs devassist-frontend-production"