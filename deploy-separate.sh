#!/bin/bash

# DevAssist Pro Раздельное развертывание
# Backend и Frontend запускаются отдельно

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${BLUE}===================================================${NC}"
    echo -e "${BLUE} $1${NC}"
    echo -e "${BLUE}===================================================${NC}"
}

# Function to setup environment
setup_environment() {
    if [ ! -f ".env.production" ]; then
        print_status "Creating .env.production..."
        cp .env.production.example .env.production
        
        # Generate secure passwords
        POSTGRES_PWD=$(openssl rand -base64 32 | tr -d /=+ | cut -c -25)
        REDIS_PWD=$(openssl rand -base64 32 | tr -d /=+ | cut -c -25)
        JWT_SECRET_VAL=$(openssl rand -base64 64 | tr -d /=+ | cut -c -50)
        
        # Update passwords in the file
        sed -i "s/devassist_secure_password_2024_change_me/$POSTGRES_PWD/g" .env.production
        sed -i "s/redis_secure_password_2024_change_me/$REDIS_PWD/g" .env.production
        sed -i "s/your_jwt_secret_key_minimum_32_characters_long_change_me_now/$JWT_SECRET_VAL/g" .env.production
        
        print_status "✅ .env.production created with secure passwords"
    fi
}

# Function to deploy backend
deploy_backend() {
    print_header "DEPLOYING BACKEND"
    
    print_status "Stopping existing backend..."
    docker compose -f docker-compose.backend.yml down 2>/dev/null || true
    
    print_status "Building backend services..."
    docker compose -f docker-compose.backend.yml build --no-cache
    
    print_status "Starting backend services..."
    docker compose -f docker-compose.backend.yml up -d
    
    print_status "Waiting for backend to be ready..."
    sleep 60
    
    # Test backend
    if curl -f -s --max-time 10 http://localhost:8000/health >/dev/null 2>&1; then
        print_status "✅ Backend is running at http://46.149.71.162:8000"
    else
        print_warning "⚠️  Backend health check failed, checking status..."
        docker compose -f docker-compose.backend.yml ps
    fi
}

# Function to deploy frontend
deploy_frontend() {
    print_header "DEPLOYING FRONTEND"
    
    print_status "Stopping existing frontend..."
    docker compose -f docker-compose.frontend.yml down 2>/dev/null || true
    
    # Check if package.json exists
    if [ ! -f "frontend/package.json" ]; then
        print_error "frontend/package.json not found! Cannot build frontend."
        return 1
    fi
    
    print_status "Building frontend services..."
    docker compose -f docker-compose.frontend.yml build --no-cache
    
    print_status "Starting frontend services..."
    docker compose -f docker-compose.frontend.yml up -d
    
    print_status "Waiting for frontend to be ready..."
    sleep 30
    
    # Test frontend
    if curl -f -s --max-time 10 http://localhost/ >/dev/null 2>&1; then
        print_status "✅ Frontend is running at http://46.149.71.162/"
    else
        print_warning "⚠️  Frontend health check failed, checking status..."
        docker compose -f docker-compose.frontend.yml ps
    fi
}

# Function to show status
show_status() {
    print_header "DEPLOYMENT STATUS"
    
    print_status "Backend Services:"
    docker compose -f docker-compose.backend.yml ps
    
    echo ""
    print_status "Frontend Services:"
    docker compose -f docker-compose.frontend.yml ps
    
    echo ""
    print_status "Access URLs:"
    echo "  🌐 Frontend:      http://46.149.71.162/"
    echo "  🔧 Backend API:   http://46.149.71.162:8000/"
    echo "  ❤️  Health Check: http://46.149.71.162:8000/health"
    echo "  📋 API Docs:      http://46.149.71.162:8000/docs"
    
    echo ""
    print_status "Management Commands:"
    echo "  Backend logs:   docker compose -f docker-compose.backend.yml logs -f"
    echo "  Frontend logs:  docker compose -f docker-compose.frontend.yml logs -f"
    echo "  Stop backend:   docker compose -f docker-compose.backend.yml down"
    echo "  Stop frontend:  docker compose -f docker-compose.frontend.yml down"
}

# Function to clean up
cleanup() {
    print_status "Cleaning up old containers..."
    docker compose -f docker-compose.backend.yml down 2>/dev/null || true
    docker compose -f docker-compose.frontend.yml down 2>/dev/null || true
    docker compose -f docker-compose.production.yml down 2>/dev/null || true
    docker container prune -f
}

# Main function
main() {
    print_header "DevAssist Pro Раздельное Развертывание"
    
    case "${1:-all}" in
        "backend")
            setup_environment
            deploy_backend
            show_status
            ;;
        "frontend")
            deploy_frontend
            show_status
            ;;
        "cleanup")
            cleanup
            print_status "Cleanup completed"
            ;;
        "status")
            show_status
            ;;
        "all"|*)
            setup_environment
            cleanup
            deploy_backend
            if [ $? -eq 0 ]; then
                deploy_frontend
            fi
            show_status
            ;;
    esac
}

# Run main function
main "$@"