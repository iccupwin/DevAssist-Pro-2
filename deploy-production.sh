#!/bin/bash

# DevAssist Pro Production Deployment Script
# Ubuntu 22.04 Server Deployment
# Server IP: 46.149.71.162

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="DevAssist Pro"
SERVER_IP="46.149.71.162"
COMPOSE_FILE="docker-compose.production.yml"
ENV_FILE=".env.production"

# Logging function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

# Banner
echo -e "${GREEN}"
echo "================================================================"
echo "          DevAssist Pro Production Deployment"
echo "================================================================"
echo -e "${NC}"
echo "Target Server: $SERVER_IP"
echo "OS: Ubuntu 22.04"
echo "Deployment Mode: Multi-Container Production"
echo "Services: Nginx + Frontend + Backend + PostgreSQL + Redis"
echo ""

# Check environment
check_environment() {
    log "Checking system requirements..."
    
    # Check Ubuntu version
    if ! grep -q "Ubuntu 22.04" /etc/os-release; then
        warning "This script is optimized for Ubuntu 22.04. Current OS:"
        cat /etc/os-release | grep PRETTY_NAME
        read -p "Continue anyway? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        install_docker
    fi
    
    # Check Docker Compose
    if ! docker compose version &> /dev/null; then
        error "Docker Compose not found. Please install Docker Compose v2"
    fi
    
    success "Environment check passed"
}

# Install Docker
install_docker() {
    log "Installing Docker..."
    
    # Update package index
    sudo apt-get update
    
    # Install required packages
    sudo apt-get install -y \
        apt-transport-https \
        ca-certificates \
        curl \
        gnupg \
        lsb-release
    
    # Add Docker's official GPG key
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
    
    # Set up stable repository
    echo \
        "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu \
        $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
    
    # Install Docker Engine
    sudo apt-get update
    sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
    
    # Add current user to docker group
    sudo usermod -aG docker $USER
    
    # Start Docker service
    sudo systemctl start docker
    sudo systemctl enable docker
    
    success "Docker installed successfully"
}

# Setup firewall
setup_firewall() {
    log "Configuring firewall..."
    if command -v ufw &> /dev/null; then
        sudo ufw allow ssh
        sudo ufw allow 80/tcp
        sudo ufw allow 443/tcp
        echo "y" | sudo ufw enable
        success "Firewall configured"
    fi
}

# Create necessary directories
setup_directories() {
    log "Creating application directories..."
    mkdir -p backend/database
    mkdir -p backend/uploads
    mkdir -p backend/reports
    mkdir -p nginx/logs
    success "Directories created"
}

# Create production environment file
create_env_file() {
    log "Creating production environment configuration..."
    if [ ! -f "$ENV_FILE" ]; then
        if [ -f ".env.production.example" ]; then
            cp .env.production.example $ENV_FILE
            
            # Generate secure passwords
            POSTGRES_PWD=$(openssl rand -base64 32 | tr -d /=+ | cut -c -25)
            REDIS_PWD=$(openssl rand -base64 32 | tr -d /=+ | cut -c -25)
            JWT_SECRET_VAL=$(openssl rand -base64 64 | tr -d /=+ | cut -c -50)
            
            # Update passwords in the file
            sed -i "s/devassist_secure_password_2024_change_me/$POSTGRES_PWD/g" "$ENV_FILE"
            sed -i "s/redis_secure_password_2024_change_me/$REDIS_PWD/g" "$ENV_FILE"
            sed -i "s/your_jwt_secret_key_minimum_32_characters_long_change_me_now/$JWT_SECRET_VAL/g" "$ENV_FILE"
            
            success "Environment file created: $ENV_FILE"
        else
            error "Environment example file not found: .env.production.example"
        fi
    else
        success "Environment file already exists: $ENV_FILE"
    fi
    
    # Validate environment file
    if grep -q "your_.*_api_key_here" "$ENV_FILE"; then
        warning "Default API keys detected in $ENV_FILE"
        echo "Please update the following API keys:"
        grep "your_.*_api_key_here" "$ENV_FILE"
        read -p "Continue with default keys? (NOT RECOMMENDED) (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            error "Please update API keys in $ENV_FILE and re-run the script"
        fi
    fi
    
    if grep -q "change_me" "$ENV_FILE"; then
        warning "Some placeholder values still exist in $ENV_FILE"
        echo "Please update all 'change_me' values before deployment"
    fi
}

# Create backend Dockerfile if missing
setup_backend_dockerfile() {
    if [ ! -f "backend/Dockerfile" ]; then
        log "Creating backend Dockerfile..."
        cat > "backend/Dockerfile" << 'EOF'
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create necessary directories
RUN mkdir -p uploads reports

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Expose port
EXPOSE 8000

# Start application
CMD ["python", "api_gateway/main_hybrid.py"]
EOF
        success "Backend Dockerfile created"
    fi
}

# Deploy application
deploy_application() {
    log "Building and starting services..."
    
    # Pull latest images
    docker pull postgres:15-alpine
    docker pull redis:7-alpine
    docker pull nginx:1.25-alpine
    docker pull node:18-alpine
    
    # Stop existing containers
    docker compose -f "$COMPOSE_FILE" down --remove-orphans || true
    
    # Build and start services
    docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d --build
    
    success "Services started"
}

# Health checks
health_check() {
    log "Performing health checks..."
    
    # Wait for services to be ready
    sleep 30
    
    # Check database
    if docker compose -f "$COMPOSE_FILE" exec -T postgres pg_isready -U devassist_user -d devassist_pro; then
        success "Database is healthy"
    else
        warning "Database health check failed - checking container status"
        docker compose -f "$COMPOSE_FILE" ps postgres
    fi
    
    # Check Redis
    if docker compose -f "$COMPOSE_FILE" exec -T redis redis-cli --no-auth-warning ping; then
        success "Redis is healthy"
    else
        warning "Redis health check failed - checking container status"
        docker compose -f "$COMPOSE_FILE" ps redis
    fi
    
    # Check backend
    if curl -f http://localhost/health; then
        success "Backend is healthy"
    else
        error "Backend health check failed"
    fi
    
    # Check frontend
    if curl -f http://localhost/; then
        success "Frontend is healthy"
    else
        error "Frontend health check failed"
    fi
}

# Main deployment function
main_deploy() {
    echo ""
    echo -e "${YELLOW}Deployment Summary:${NC}"
    echo "Project: $PROJECT_NAME"
    echo "Server: $SERVER_IP"
    echo "Compose File: $COMPOSE_FILE"
    echo "Environment: $ENV_FILE"
    echo ""
    
    read -p "Proceed with deployment? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log "Deployment cancelled by user"
        exit 0
    fi
    
    deploy_application
    health_check
    
    # Final status
    echo ""
    echo -e "${GREEN}================================================================${NC}"
    echo -e "${GREEN}           DEPLOYMENT SUCCESSFUL!${NC}"
    echo -e "${GREEN}================================================================${NC}"
    echo ""
    echo "🚀 DevAssist Pro is now running on:"
    echo "   Frontend: http://$SERVER_IP/"
    echo "   API:      http://$SERVER_IP/api/"
    echo "   Health:   http://$SERVER_IP/health"
    echo ""
    echo "📋 Management Commands:"
    echo "   Status:   docker compose -f $COMPOSE_FILE ps"
    echo "   Logs:     docker compose -f $COMPOSE_FILE logs -f"
    echo "   Stop:     docker compose -f $COMPOSE_FILE down"
    echo "   Restart:  docker compose -f $COMPOSE_FILE restart"
    echo ""
    
    # Show container status
    log "Container Status:"
    docker compose -f "$COMPOSE_FILE" ps
    
    success "Deployment completed successfully!"
}

# Show help
show_help() {
    echo "DevAssist Pro Production Deployment Script"
    echo "Ubuntu 22.04 Server Deployment"
    echo ""
    echo "Usage:"
    echo "  $0 [command]"
    echo ""
    echo "Commands:"
    echo "  deploy     Full production deployment"
    echo "  check      Check system readiness"
    echo "  health     Check service health"
    echo "  logs       Show service logs"
    echo "  stop       Stop all services"
    echo "  restart    Restart all services"
    echo "  help       Show this help"
    echo ""
    echo "Examples:"
    echo "  $0 deploy    # Deploy to production"
    echo "  $0 health    # Check service status"
    echo "  $0 logs      # View service logs"
}

# Handle command line arguments
case "${1:-}" in
    "deploy")
        check_environment
        setup_firewall
        create_env_file
        setup_directories
        setup_backend_dockerfile
        main_deploy
        ;;
    "check")
        check_environment
        create_env_file
        success "System ready for deployment"
        ;;
    "health")
        health_check
        ;;
    "logs")
        docker compose -f "$COMPOSE_FILE" logs -f
        ;;
    "stop")
        log "Stopping all services..."
        docker compose -f "$COMPOSE_FILE" down
        success "All services stopped"
        ;;
    "restart")
        log "Restarting all services..."
        docker compose -f "$COMPOSE_FILE" restart
        health_check
        ;;
    "help"|"--help"|"-h"|"")
        show_help
        ;;
    *)
        error "Unknown command: $1"
        show_help
        ;;
esac