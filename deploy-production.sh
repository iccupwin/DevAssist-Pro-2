#!/bin/bash

# =============================================================================
# DevAssist Pro - Production Deployment Script
# Automated deployment to production server: 46.149.67.122
# =============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SERVER_IP="46.149.67.122"
PROJECT_NAME="devassist-pro"
DOCKER_IMAGE="devassist-pro:latest"
CONTAINER_NAME="devassist-pro"
DATA_DIR="/opt/devassist-pro/data"
LOGS_DIR="/opt/devassist-pro/logs"
CONFIG_DIR="/opt/devassist-pro/config"

echo -e "${BLUE}🚀 DevAssist Pro Production Deployment${NC}"
echo "=================================================="
echo "Target Server: $SERVER_IP"
echo "Project: $PROJECT_NAME"
echo "Image: $DOCKER_IMAGE"
echo "=================================================="

# Function to print status
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Pre-deployment checks
echo -e "${BLUE}🔍 Pre-deployment checks...${NC}"

# Check if Docker is available
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed or not in PATH"
    exit 1
fi
print_status "Docker is available"

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null; then
    print_warning "docker-compose not found, using 'docker compose' instead"
    COMPOSE_CMD="docker compose"
else
    COMPOSE_CMD="docker-compose"
fi
print_status "Docker Compose is available"

# Check if required files exist
REQUIRED_FILES=(
    "Dockerfile.production"
    "nginx.production.conf" 
    "supervisord.conf"
    "start-production.sh"
    ".env.production"
    "docker-compose.production.yml"
)

for file in "${REQUIRED_FILES[@]}"; do
    if [ ! -f "$file" ]; then
        print_error "Required file $file not found"
        exit 1
    fi
done
print_status "All required files present"

# Check environment file
if [ ! -f ".env.production" ]; then
    print_error ".env.production file not found"
    print_warning "Copy .env.example to .env.production and configure it"
    exit 1
fi

# Validate critical environment variables
print_status "Validating environment configuration..."
source .env.production

REQUIRED_VARS=(
    "POSTGRES_PASSWORD"
    "JWT_SECRET"
    "OPENAI_API_KEY"
    "ANTHROPIC_API_KEY"
)

for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ] || [ "${!var}" = "your_${var,,}_here" ] || [ "${!var}" = "change-this" ]; then
        print_error "Environment variable $var is not configured properly"
        print_warning "Edit .env.production and set real values"
        exit 1
    fi
done
print_status "Environment variables validated"

# Build the Docker image
echo -e "${BLUE}🔨 Building Docker image...${NC}"
docker build -f Dockerfile.production -t $DOCKER_IMAGE .
if [ $? -eq 0 ]; then
    print_status "Docker image built successfully"
else
    print_error "Docker image build failed"
    exit 1
fi

# Stop existing container if running
echo -e "${BLUE}🛑 Stopping existing containers...${NC}"
if docker ps -q --filter "name=$CONTAINER_NAME" | grep -q .; then
    docker stop $CONTAINER_NAME
    print_status "Stopped existing container"
fi

# Remove existing container
if docker ps -aq --filter "name=$CONTAINER_NAME" | grep -q .; then
    docker rm $CONTAINER_NAME
    print_status "Removed existing container"
fi

# Create necessary directories
echo -e "${BLUE}📁 Creating directories...${NC}"
mkdir -p data logs config/production
print_status "Directories created"

# Start the application
echo -e "${BLUE}🚀 Starting DevAssist Pro...${NC}"
$COMPOSE_CMD -f docker-compose.production.yml up -d

if [ $? -eq 0 ]; then
    print_status "Application started successfully"
else
    print_error "Failed to start application"
    exit 1
fi

# Wait for services to be ready
echo -e "${BLUE}⏳ Waiting for services to be ready...${NC}"
sleep 10

# Health check
echo -e "${BLUE}🏥 Performing health checks...${NC}"
MAX_ATTEMPTS=30
ATTEMPT=1

while [ $ATTEMPT -le $MAX_ATTEMPTS ]; do
    if curl -f -s http://localhost/health > /dev/null 2>&1; then
        print_status "Health check passed"
        break
    fi
    
    echo "Attempt $ATTEMPT/$MAX_ATTEMPTS - waiting for service..."
    sleep 2
    ATTEMPT=$((ATTEMPT + 1))
done

if [ $ATTEMPT -gt $MAX_ATTEMPTS ]; then
    print_error "Health check failed after $MAX_ATTEMPTS attempts"
    echo "Check logs: docker logs $CONTAINER_NAME"
    exit 1
fi

# Verify all endpoints
echo -e "${BLUE}🔍 Verifying endpoints...${NC}"
ENDPOINTS=(
    "http://localhost/health"
    "http://localhost/api/health"
    "http://localhost/"
)

for endpoint in "${ENDPOINTS[@]}"; do
    if curl -f -s "$endpoint" > /dev/null 2>&1; then
        print_status "✓ $endpoint"
    else
        print_warning "✗ $endpoint (may be normal for some endpoints)"
    fi
done

# Display status
echo -e "${BLUE}📊 Deployment Status${NC}"
echo "=================================================="
docker ps --filter "name=$PROJECT_NAME"
echo ""

# Show logs
echo -e "${BLUE}📋 Recent logs:${NC}"
docker logs --tail=20 $CONTAINER_NAME

echo ""
echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
echo "=================================================="
echo -e "Frontend:      ${BLUE}http://$SERVER_IP/${NC}"
echo -e "API Docs:      ${BLUE}http://$SERVER_IP/docs${NC}"
echo -e "Health Check:  ${BLUE}http://$SERVER_IP/health${NC}"
echo -e "Logs:          ${BLUE}docker logs $CONTAINER_NAME${NC}"
echo -e "Stop:          ${BLUE}docker stop $CONTAINER_NAME${NC}"
echo "=================================================="

# Show useful commands
echo -e "${BLUE}💡 Useful commands:${NC}"
echo "View logs:       docker logs -f $CONTAINER_NAME"
echo "Restart:         docker restart $CONTAINER_NAME"
echo "Shell access:    docker exec -it $CONTAINER_NAME /bin/bash"
echo "Update:          ./deploy-production.sh"
echo "Stop all:        $COMPOSE_CMD -f docker-compose.production.yml down"
echo ""

print_status "DevAssist Pro is now running on http://$SERVER_IP/"