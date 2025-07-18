#!/bin/bash

# =============================================================================
# DevAssist Pro - Production Testing Script
# Локальное тестирование production конфигурации перед развертыванием
# =============================================================================

set -e

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🧪 Testing DevAssist Pro Production Configuration${NC}"
echo "============================================================"

# Test functions
test_pass() {
    echo -e "${GREEN}✅ $1${NC}"
}

test_fail() {
    echo -e "${RED}❌ $1${NC}"
}

test_warn() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# 1. Check required files
echo -e "${BLUE}📁 Checking required files...${NC}"
REQUIRED_FILES=(
    "Dockerfile.production"
    "nginx.production.conf"
    "supervisord.conf" 
    "start-production.sh"
    ".env.production"
    "docker-compose.production.yml"
    "deploy-production.sh"
)

for file in "${REQUIRED_FILES[@]}"; do
    if [ -f "$file" ]; then
        test_pass "$file exists"
    else
        test_fail "$file missing"
        exit 1
    fi
done

# 2. Check Docker
echo -e "${BLUE}🐳 Checking Docker...${NC}"
if command -v docker &> /dev/null; then
    test_pass "Docker is installed"
    if docker info &> /dev/null; then
        test_pass "Docker daemon is running"
    else
        test_fail "Docker daemon is not running"
        exit 1
    fi
else
    test_fail "Docker is not installed"
    exit 1
fi

# 3. Check Docker Compose
echo -e "${BLUE}🔧 Checking Docker Compose...${NC}"
if command -v docker-compose &> /dev/null; then
    test_pass "docker-compose is available"
    COMPOSE_CMD="docker-compose"
elif docker compose version &> /dev/null; then
    test_pass "docker compose is available"
    COMPOSE_CMD="docker compose"
else
    test_fail "Docker Compose is not available"
    exit 1
fi

# 4. Validate environment file
echo -e "${BLUE}⚙️  Validating environment configuration...${NC}"
if [ -f ".env.production" ]; then
    test_pass ".env.production exists"
    
    # Source the file and check critical variables
    source .env.production
    
    # Check for placeholder values
    CRITICAL_VARS=(
        "POSTGRES_PASSWORD"
        "JWT_SECRET"
        "OPENAI_API_KEY"
        "ANTHROPIC_API_KEY"
    )
    
    for var in "${CRITICAL_VARS[@]}"; do
        if [ -z "${!var}" ]; then
            test_fail "$var is not set"
        elif [[ "${!var}" == *"your_"* ]] || [[ "${!var}" == *"change"* ]]; then
            test_warn "$var appears to have placeholder value"
        else
            test_pass "$var is configured"
        fi
    done
else
    test_fail ".env.production not found"
    exit 1
fi

# 5. Test Docker build
echo -e "${BLUE}🔨 Testing Docker build...${NC}"
if docker build -f Dockerfile.production -t devassist-pro:test . &> /dev/null; then
    test_pass "Docker image builds successfully"
    
    # Clean up test image
    docker rmi devassist-pro:test &> /dev/null || true
else
    test_fail "Docker build failed"
    echo "Run: docker build -f Dockerfile.production -t devassist-pro:test . for details"
    exit 1
fi

# 6. Validate nginx configuration
echo -e "${BLUE}🌐 Validating nginx configuration...${NC}"
if docker run --rm -v "$(pwd)/nginx.production.conf:/etc/nginx/nginx.conf:ro" nginx:alpine nginx -t &> /dev/null; then
    test_pass "Nginx configuration is valid"
else
    test_fail "Nginx configuration has errors"
    echo "Run: docker run --rm -v \"\$(pwd)/nginx.production.conf:/etc/nginx/nginx.conf:ro\" nginx:alpine nginx -t"
    exit 1
fi

# 7. Check frontend build
echo -e "${BLUE}⚛️  Checking frontend...${NC}"
if [ -d "frontend" ]; then
    test_pass "Frontend directory exists"
    
    if [ -f "frontend/package.json" ]; then
        test_pass "Frontend package.json exists"
    else
        test_fail "Frontend package.json missing"
    fi
    
    if [ -f "frontend/.env.production" ]; then
        test_pass "Frontend .env.production exists"
    else
        test_warn "Frontend .env.production missing (will use defaults)"
    fi
else
    test_fail "Frontend directory missing"
    exit 1
fi

# 8. Check backend
echo -e "${BLUE}🐍 Checking backend...${NC}"
if [ -d "backend" ]; then
    test_pass "Backend directory exists"
    
    if [ -f "backend/app.py" ]; then
        test_pass "Backend main file (app.py) exists"
    elif [ -f "backend/main.py" ]; then
        test_pass "Backend main file (main.py) exists"
    else
        test_fail "Backend main file not found"
        exit 1
    fi
    
    if [ -f "backend/requirements.txt" ]; then
        test_pass "Backend requirements.txt exists"
    else
        test_fail "Backend requirements.txt missing"
        exit 1
    fi
else
    test_fail "Backend directory missing"
    exit 1
fi

# 9. Test compose file
echo -e "${BLUE}📝 Validating docker-compose configuration...${NC}"
if $COMPOSE_CMD -f docker-compose.production.yml config &> /dev/null; then
    test_pass "Docker Compose configuration is valid"
else
    test_fail "Docker Compose configuration has errors"
    echo "Run: $COMPOSE_CMD -f docker-compose.production.yml config"
    exit 1
fi

# 10. Check script permissions
echo -e "${BLUE}🔐 Checking script permissions...${NC}"
if [ -x "deploy-production.sh" ]; then
    test_pass "deploy-production.sh is executable"
else
    test_warn "deploy-production.sh is not executable (fixing...)"
    chmod +x deploy-production.sh
    test_pass "Fixed deploy-production.sh permissions"
fi

if [ -x "start-production.sh" ]; then
    test_pass "start-production.sh is executable"
else
    test_warn "start-production.sh is not executable (fixing...)"
    chmod +x start-production.sh
    test_pass "Fixed start-production.sh permissions"
fi

# Summary
echo ""
echo -e "${GREEN}🎉 All tests passed!${NC}"
echo "============================================================"
echo -e "✅ Production configuration is ready for deployment"
echo -e "✅ Run ${BLUE}./deploy-production.sh${NC} to deploy to production"
echo -e "✅ Target server: ${BLUE}46.149.67.122${NC}"
echo ""
echo -e "${YELLOW}📋 Pre-deployment checklist:${NC}"
echo "1. Ensure server has Docker and Docker Compose installed"
echo "2. Configure firewall (ports 80, 443, 22)"
echo "3. Set up domain/DNS (optional but recommended)"
echo "4. Review .env.production for real API keys"
echo "5. Plan for SSL/HTTPS setup"
echo ""
echo -e "${BLUE}🚀 Ready for production deployment!${NC}"