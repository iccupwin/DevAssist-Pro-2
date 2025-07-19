#!/bin/bash

# DevAssist Pro - Development Environment Startup Script
# Автоматический запуск локальной среды разработки

set -e

echo "🚀 Starting DevAssist Pro Development Environment..."

# Color codes for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
COMPOSE_FILE="docker-compose.dev.yml"
ENV_FILE=".env"
FRONTEND_ENV_FILE="frontend/.env"

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    # Check if Docker is running
    if ! docker info &> /dev/null; then
        print_error "Docker is not running. Please start Docker first."
        exit 1
    fi
    
    print_success "All prerequisites are satisfied"
}

# Check and create environment files
setup_environment() {
    print_status "Setting up environment files..."
    
    # Check main .env file
    if [ ! -f "$ENV_FILE" ]; then
        if [ -f ".env.example" ]; then
            print_warning "Main .env file not found. Copying from .env.example..."
            cp .env.example .env
            print_warning "⚠️  Please edit .env file and add your API keys!"
        else
            print_error "Neither .env nor .env.example found. Please create environment file."
            exit 1
        fi
    fi
    
    # Check frontend .env file
    if [ ! -f "$FRONTEND_ENV_FILE" ]; then
        if [ -f "frontend/.env.example" ]; then
            print_warning "Frontend .env file not found. Copying from .env.example..."
            cp frontend/.env.example frontend/.env
            print_warning "⚠️  Please edit frontend/.env file and add your API keys!"
        else
            print_error "Neither frontend/.env nor frontend/.env.example found."
            exit 1
        fi
    fi
    
    # Check for API keys
    if grep -q "your-api-key\|your_.*_key_here" .env 2>/dev/null; then
        print_warning "⚠️  Some API keys are still using placeholder values in .env"
        print_warning "Please edit .env and add your real API keys for full functionality"
    fi
    
    if grep -q "your-.*-key\|your_.*_key_here" frontend/.env 2>/dev/null; then
        print_warning "⚠️  Some API keys are still using placeholder values in frontend/.env"
        print_warning "Please edit frontend/.env and add your real API keys"
    fi
    
    print_success "Environment files are ready"
}

# Clean up any existing containers
cleanup_containers() {
    print_status "Cleaning up existing containers..."
    
    docker-compose -f $COMPOSE_FILE down --remove-orphans 2>/dev/null || true
    
    # Remove any dangling volumes
    docker volume prune -f &>/dev/null || true
    
    print_success "Cleanup completed"
}

# Build and start services
start_services() {
    print_status "Building and starting services..."
    
    # Build services with progress
    print_status "Building Docker images..."
    docker-compose -f $COMPOSE_FILE build --no-cache
    
    # Start services
    print_status "Starting services in detached mode..."
    docker-compose -f $COMPOSE_FILE up -d
    
    print_success "Services started successfully"
}

# Wait for services to be healthy
wait_for_services() {
    print_status "Waiting for services to become healthy..."
    
    local max_attempts=60
    local attempt=0
    local services=("postgres" "redis" "api-gateway")
    
    for service in "${services[@]}"; do
        print_status "Waiting for $service to be healthy..."
        attempt=0
        
        while [ $attempt -lt $max_attempts ]; do
            if docker-compose -f $COMPOSE_FILE ps "$service" | grep -q "healthy"; then
                print_success "$service is healthy"
                break
            fi
            
            if [ $attempt -eq $((max_attempts - 1)) ]; then
                print_error "$service failed to become healthy within timeout"
                return 1
            fi
            
            sleep 2
            attempt=$((attempt + 1))
            echo -n "."
        done
        echo ""
    done
    
    # Wait a bit more for all services to stabilize
    print_status "Waiting for services to stabilize..."
    sleep 10
    
    print_success "All services are healthy and ready"
}

# Show service status and URLs
show_status() {
    print_status "Services Status:"
    echo ""
    docker-compose -f $COMPOSE_FILE ps
    echo ""
    
    print_success "🎉 DevAssist Pro Development Environment is ready!"
    echo ""
    print_status "Available Services:"
    echo "  📊 React Frontend:        http://localhost:3000"
    echo "  🔧 API Gateway:           http://localhost:8000"
    echo "  📚 API Documentation:     http://localhost:8000/docs"
    echo "  🌊 Streamlit Legacy:      http://localhost:8501"
    echo "  🗄️  PostgreSQL:           localhost:5433"
    echo "  🔴 Redis:                 localhost:6378"
    echo ""
    print_status "Useful Commands:"
    echo "  📋 View logs:             docker-compose -f $COMPOSE_FILE logs -f"
    echo "  🔄 Restart services:      docker-compose -f $COMPOSE_FILE restart"
    echo "  🛑 Stop services:         docker-compose -f $COMPOSE_FILE down"
    echo "  🔧 Shell into container:  docker-compose -f $COMPOSE_FILE exec <service> /bin/bash"
    echo ""
    
    # Check API Gateway health
    print_status "Testing API Gateway health..."
    if curl -s http://localhost:8000/health > /dev/null; then
        print_success "✅ API Gateway is responding"
    else
        print_warning "⚠️  API Gateway is not responding yet (may still be starting)"
    fi
    
    # Check Frontend availability
    print_status "Testing Frontend availability..."
    if curl -s http://localhost:3000 > /dev/null; then
        print_success "✅ Frontend is responding"
    else
        print_warning "⚠️  Frontend is not responding yet (may still be starting)"
    fi
}

# Main execution
main() {
    echo "================================================"
    echo "🏗️  DevAssist Pro Development Environment Setup"
    echo "================================================"
    echo ""
    
    check_prerequisites
    setup_environment
    cleanup_containers
    start_services
    wait_for_services
    show_status
    
    echo ""
    print_success "🚀 Development environment started successfully!"
    print_status "Press Ctrl+C to stop all services, or use: docker-compose -f $COMPOSE_FILE down"
    echo ""
}

# Handle script interruption
trap 'echo -e "\n${YELLOW}[INTERRUPT]${NC} Stopping services..."; docker-compose -f $COMPOSE_FILE down; exit 0' INT

# Run main function
main "$@"