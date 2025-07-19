#!/bin/bash

# DevAssist Pro Production Deployment Script
# Ubuntu 22.04 Server Deployment (46.149.71.162)
# One-command deployment for complete system

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SERVER_IP="46.149.71.162"
PROJECT_NAME="devassist-pro"
COMPOSE_FILE="docker-compose.production.yml"

# Logging function
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

# Check if running as root
check_root() {
    if [[ $EUID -eq 0 ]]; then
        warning "Running as root. Consider using a non-root user with sudo privileges."
    fi
}

# Check Ubuntu version
check_ubuntu_version() {
    log "Checking Ubuntu version..."
    
    if ! grep -q "Ubuntu 22.04" /etc/os-release; then
        error "This script is designed for Ubuntu 22.04. Current OS:"
        cat /etc/os-release | grep PRETTY_NAME
        exit 1
    fi
    
    info "Ubuntu 22.04 confirmed ✓"
}

# Update system packages
update_system() {
    log "Updating system packages..."
    
    sudo apt-get update -qq
    sudo apt-get upgrade -y -qq
    sudo apt-get autoremove -y -qq
    
    info "System updated ✓"
}

# Install Docker if not present
install_docker() {
    log "Checking Docker installation..."
    
    if command -v docker &> /dev/null; then
        info "Docker already installed: $(docker --version)"
        return 0
    fi
    
    log "Installing Docker..."
    
    # Install dependencies
    sudo apt-get install -y \
        ca-certificates \
        curl \
        gnupg \
        lsb-release
    
    # Add Docker GPG key
    sudo mkdir -p /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    
    # Add Docker repository
    echo \
        "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
        $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
    
    # Install Docker
    sudo apt-get update -qq
    sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
    
    # Add current user to docker group
    sudo usermod -aG docker $USER
    
    # Enable and start Docker
    sudo systemctl enable docker
    sudo systemctl start docker
    
    info "Docker installed successfully ✓"
    info "Note: You may need to log out and back in for Docker group permissions to take effect"
}

# Install Docker Compose if not present
install_docker_compose() {
    log "Checking Docker Compose installation..."
    
    if docker compose version &> /dev/null; then
        info "Docker Compose already installed: $(docker compose version)"
        return 0
    fi
    
    error "Docker Compose not found. Please ensure Docker Compose V2 is installed."
    exit 1
}

# Configure firewall
configure_firewall() {
    log "Configuring UFW firewall..."
    
    # Install UFW if not present
    if ! command -v ufw &> /dev/null; then
        sudo apt-get install -y ufw
    fi
    
    # Reset UFW to defaults
    sudo ufw --force reset
    
    # Default policies
    sudo ufw default deny incoming
    sudo ufw default allow outgoing
    
    # Allow SSH (preserve current connection)
    sudo ufw allow ssh
    
    # Allow HTTP and HTTPS
    sudo ufw allow 80/tcp
    sudo ufw allow 443/tcp
    
    # Enable UFW
    sudo ufw --force enable
    
    info "Firewall configured ✓"
    sudo ufw status
}

# Check system resources
check_system_resources() {
    log "Checking system resources..."
    
    # Check available memory (minimum 2GB recommended)
    MEM_GB=$(free -g | awk '/^Mem:/{print $2}')
    if [ "$MEM_GB" -lt 2 ]; then
        warning "Available memory: ${MEM_GB}GB. Minimum 2GB recommended for production."
    else
        info "Memory check passed: ${MEM_GB}GB available ✓"
    fi
    
    # Check available disk space (minimum 10GB recommended)
    DISK_GB=$(df -BG / | tail -1 | awk '{print $4}' | sed 's/G//')
    if [ "$DISK_GB" -lt 10 ]; then
        warning "Available disk space: ${DISK_GB}GB. Minimum 10GB recommended for production."
    else
        info "Disk space check passed: ${DISK_GB}GB available ✓"
    fi
}

# Create environment file
create_environment() {
    log "Creating production environment configuration..."
    
    cat > .env.production << EOF
# DevAssist Pro Production Environment
# Server: Ubuntu 22.04 (${SERVER_IP})
# Generated: $(date)

# Server Configuration
SERVER_IP=${SERVER_IP}
ENVIRONMENT=production
NODE_ENV=production

# Frontend Configuration
REACT_APP_API_URL=http://${SERVER_IP}/api
REACT_APP_WS_URL=ws://${SERVER_IP}/ws

# Backend Configuration
DEBUG=false
LOG_LEVEL=INFO
HOST=0.0.0.0
PORT=8000

# Database Configuration
POSTGRES_DB=devassist_pro
POSTGRES_USER=devassist
POSTGRES_PASSWORD=devassist_password
POSTGRES_URL=postgresql://devassist:devassist_password@postgres:5432/devassist_pro

# Redis Configuration
REDIS_PASSWORD=redis_password
REDIS_URL=redis://:redis_password@redis:6379/0

# Security Configuration
ALLOWED_ORIGINS=http://${SERVER_IP},https://${SERVER_IP}

# File Upload Configuration
MAX_FILE_SIZE=50MB
SUPPORTED_FORMATS=pdf,docx,txt

# AI Provider Configuration (Add your API keys here)
ANTHROPIC_API_KEY=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
OPENAI_API_KEY=your_openai_key_here
GOOGLE_API_KEY=your_google_key_here
USE_REAL_API=true

# Monitoring
ENABLE_METRICS=true
ENABLE_LOGGING=true
EOF
    
    info "Environment configuration created ✓"
}

# Stop existing containers
stop_existing_containers() {
    log "Stopping existing containers..."
    
    # Stop containers if they exist
    if docker compose -f $COMPOSE_FILE ps -q &> /dev/null; then
        docker compose -f $COMPOSE_FILE down
        info "Existing containers stopped ✓"
    else
        info "No existing containers found ✓"
    fi
}

# Clean up Docker resources
cleanup_docker() {
    log "Cleaning up Docker resources..."
    
    # Remove unused containers, networks, images, and build cache
    docker system prune -f
    
    info "Docker cleanup completed ✓"
}

# Build and deploy application
deploy_application() {
    log "Building and deploying DevAssist Pro..."
    
    # Build images
    log "Building Docker images..."
    docker compose -f $COMPOSE_FILE build --no-cache
    
    # Start services
    log "Starting services..."
    docker compose -f $COMPOSE_FILE up -d
    
    info "Application deployment started ✓"
}

# Health check
health_check() {
    log "Performing health checks..."
    
    # Wait for services to start
    sleep 30
    
    # Check if containers are running
    if ! docker compose -f $COMPOSE_FILE ps | grep -q "Up"; then
        error "Some containers failed to start. Check logs:"
        docker compose -f $COMPOSE_FILE logs
        exit 1
    fi
    
    # Test frontend access
    if curl -f -s "http://localhost/" > /dev/null; then
        info "Frontend health check passed ✓"
    else
        error "Frontend health check failed"
        exit 1
    fi
    
    # Test API access
    if curl -f -s "http://localhost/api/health" > /dev/null; then
        info "Backend API health check passed ✓"
    else
        error "Backend API health check failed"
        exit 1
    fi
    
    # Test database connectivity
    if docker compose -f $COMPOSE_FILE exec -T postgres pg_isready -U devassist > /dev/null; then
        info "Database health check passed ✓"
    else
        error "Database health check failed"
        exit 1
    fi
    
    info "All health checks passed ✓"
}

# Show deployment status
show_status() {
    log "Deployment Status Summary"
    echo
    info "🚀 DevAssist Pro deployed successfully!"
    echo
    info "📍 Access URLs:"
    info "   Frontend: http://${SERVER_IP}/"
    info "   API:      http://${SERVER_IP}/api/"
    info "   Health:   http://${SERVER_IP}/health"
    echo
    info "🐳 Docker Services:"
    docker compose -f $COMPOSE_FILE ps
    echo
    info "📊 System Resources:"
    docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}"
    echo
    info "🔧 Management Commands:"
    info "   View logs:     docker compose -f $COMPOSE_FILE logs -f"
    info "   Stop services: docker compose -f $COMPOSE_FILE down"
    info "   Restart:       docker compose -f $COMPOSE_FILE restart"
    info "   Update:        docker compose -f $COMPOSE_FILE pull && docker compose -f $COMPOSE_FILE up -d"
    echo
}

# Main deployment function
main() {
    log "Starting DevAssist Pro Production Deployment"
    log "Target Server: Ubuntu 22.04 (${SERVER_IP})"
    echo
    
    check_root
    check_ubuntu_version
    update_system
    install_docker
    install_docker_compose
    configure_firewall
    check_system_resources
    create_environment
    stop_existing_containers
    cleanup_docker
    deploy_application
    health_check
    show_status
    
    log "🎉 Deployment completed successfully!"
    info "Your DevAssist Pro application is now running at http://${SERVER_IP}"
}

# Handle script interruption
trap 'error "Deployment interrupted"; exit 1' INT TERM

# Run main function
main "$@"