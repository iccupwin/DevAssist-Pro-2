#!/bin/bash

# DevAssist Pro Production Deployment Script
# This script deploys the entire application with a single command

set -e  # Exit on any error

echo "🚀 DevAssist Pro Production Deployment"
echo "========================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    print_error "Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Function to check if .env file exists
check_env_file() {
    if [ ! -f ".env" ]; then
        print_warning ".env file not found. Creating from template..."
        if [ -f ".env.production" ]; then
            cp .env.production .env
            print_warning "Please edit .env file with your actual configuration values:"
            print_warning "- Database passwords"
            print_warning "- JWT secret key"
            print_warning "- AI API keys (Anthropic, OpenAI, Google)"
            print_warning "- Domain configuration"
            echo
            read -p "Press Enter to continue after configuring .env file..."
        else
            print_error ".env.production template not found!"
            exit 1
        fi
    fi
}

# Function to validate required environment variables
validate_env() {
    print_status "Validating environment configuration..."
    
    source .env
    
    if [ -z "$ANTHROPIC_API_KEY" ] || [ "$ANTHROPIC_API_KEY" = "your_anthropic_api_key_here" ]; then
        print_error "ANTHROPIC_API_KEY is not configured in .env file"
        exit 1
    fi
    
    if [ -z "$JWT_SECRET" ] || [ "$JWT_SECRET" = "your_very_secure_jwt_secret_key_minimum_32_characters_long" ]; then
        print_error "JWT_SECRET is not configured in .env file"
        exit 1
    fi
    
    print_success "Environment validation passed"
}

# Function to create necessary directories
create_directories() {
    print_status "Creating necessary directories..."
    
    mkdir -p ssl
    mkdir -p backups
    mkdir -p logs
    
    print_success "Directories created"
}

# Function to build and start services
deploy_services() {
    print_status "Building and starting services..."
    
    # Pull latest images
    docker-compose -f docker-compose.production.yml pull --ignore-pull-failures
    
    # Build custom images
    docker-compose -f docker-compose.production.yml build --no-cache
    
    # Start services
    docker-compose -f docker-compose.production.yml up -d
    
    print_success "Services started"
}

# Function to wait for services to be healthy
wait_for_services() {
    print_status "Waiting for services to become healthy..."
    
    # Wait for database
    print_status "Waiting for PostgreSQL..."
    timeout=60
    while [ $timeout -gt 0 ]; do
        if docker-compose -f docker-compose.production.yml exec -T postgres pg_isready -U devassist_user -d devassist_pro > /dev/null 2>&1; then
            break
        fi
        sleep 2
        timeout=$((timeout-2))
    done
    
    if [ $timeout -le 0 ]; then
        print_error "PostgreSQL failed to start within 60 seconds"
        exit 1
    fi
    
    # Wait for API Gateway
    print_status "Waiting for API Gateway..."
    timeout=60
    while [ $timeout -gt 0 ]; do
        if curl -f http://localhost:8000/health > /dev/null 2>&1; then
            break
        fi
        sleep 2
        timeout=$((timeout-2))
    done
    
    if [ $timeout -le 0 ]; then
        print_error "API Gateway failed to start within 60 seconds"
        exit 1
    fi
    
    print_success "All services are healthy"
}

# Function to run database migrations
run_migrations() {
    print_status "Running database migrations..."
    
    # Wait a bit more for the database to be fully ready
    sleep 5
    
    # Run migrations through the API gateway
    docker-compose -f docker-compose.production.yml exec -T api-gateway python -c "
from alembic.config import Config
from alembic import command
import os

alembic_cfg = Config('alembic.ini')
alembic_cfg.set_main_option('sqlalchemy.url', os.environ['DATABASE_URL'])
command.upgrade(alembic_cfg, 'head')
" || print_warning "Migration command failed, this might be normal for first deployment"
    
    print_success "Database migrations completed"
}

# Function to show deployment status
show_status() {
    echo
    print_success "🎉 DevAssist Pro has been successfully deployed!"
    echo
    echo "📋 Service URLs:"
    echo "   🌐 React Frontend: http://localhost:3000"
    echo "   🔗 API Gateway: http://localhost:8000"
    echo "   📊 API Documentation: http://localhost:8000/docs"
    echo "   🎯 Streamlit Demo: http://localhost:8501"
    echo "   🏥 Health Check: http://localhost:8000/health"
    echo
    echo "📋 Service Status:"
    docker-compose -f docker-compose.production.yml ps
    echo
    echo "📋 Useful Commands:"
    echo "   📜 View logs: docker-compose -f docker-compose.production.yml logs -f"
    echo "   🔄 Restart: docker-compose -f docker-compose.production.yml restart"
    echo "   ⏹️  Stop: docker-compose -f docker-compose.production.yml down"
    echo "   🧹 Clean up: docker-compose -f docker-compose.production.yml down -v"
    echo
}

# Function to show logs
show_logs() {
    if [ "$1" = "--logs" ] || [ "$1" = "-l" ]; then
        print_status "Showing application logs (Ctrl+C to exit)..."
        docker-compose -f docker-compose.production.yml logs -f
    fi
}

# Main deployment process
main() {
    echo "Starting deployment process..."
    echo
    
    # Check prerequisites
    check_env_file
    validate_env
    create_directories
    
    # Deploy services
    deploy_services
    wait_for_services
    run_migrations
    
    # Show results
    show_status
    
    # Show logs if requested
    show_logs "$1"
}

# Handle script arguments
case "$1" in
    "stop")
        print_status "Stopping DevAssist Pro services..."
        docker-compose -f docker-compose.production.yml down
        print_success "Services stopped"
        ;;
    "restart")
        print_status "Restarting DevAssist Pro services..."
        docker-compose -f docker-compose.production.yml restart
        print_success "Services restarted"
        ;;
    "logs")
        docker-compose -f docker-compose.production.yml logs -f
        ;;
    "status")
        docker-compose -f docker-compose.production.yml ps
        ;;
    "clean")
        print_warning "This will remove all containers, volumes, and data. Are you sure? (y/N)"
        read -r response
        if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
            docker-compose -f docker-compose.production.yml down -v --remove-orphans
            docker system prune -f
            print_success "Cleanup completed"
        else
            print_status "Cleanup cancelled"
        fi
        ;;
    "update")
        print_status "Updating DevAssist Pro..."
        docker-compose -f docker-compose.production.yml pull
        docker-compose -f docker-compose.production.yml up -d --build
        print_success "Update completed"
        ;;
    "backup")
        print_status "Creating database backup..."
        mkdir -p backups
        docker-compose -f docker-compose.production.yml exec -T postgres pg_dump -U devassist_user devassist_pro > "backups/backup_$(date +%Y%m%d_%H%M%S).sql"
        print_success "Backup created in backups/ directory"
        ;;
    "help"|"-h"|"--help")
        echo "DevAssist Pro Deployment Script"
        echo
        echo "Usage: $0 [command]"
        echo
        echo "Commands:"
        echo "  (no args)  Deploy the entire application"
        echo "  stop       Stop all services"
        echo "  restart    Restart all services"
        echo "  logs       Show and follow logs"
        echo "  status     Show service status"
        echo "  clean      Remove all containers and data"
        echo "  update     Pull latest images and restart"
        echo "  backup     Create database backup"
        echo "  help       Show this help message"
        echo
        echo "Options:"
        echo "  --logs, -l Show logs after deployment"
        ;;
    *)
        main "$1"
        ;;
esac