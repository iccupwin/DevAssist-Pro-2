#!/bin/bash

# DevAssist Pro Simple Server Deployment Script
set -e

echo "🚀 DevAssist Pro Simple Deployment"
echo "==================================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() { echo -e "${BLUE}[INFO]${NC} $1"; }
print_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
print_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Get server IP
get_server_ip() {
    SERVER_IP=$(curl -s ifconfig.me 2>/dev/null || curl -s icanhazip.com 2>/dev/null || echo "localhost")
    echo "$SERVER_IP"
}

# Setup environment
setup_env() {
    print_status "Setting up environment..."
    
    if [ ! -f ".env" ]; then
        print_warning "Creating .env file..."
        
        SERVER_IP=$(get_server_ip)
        
        cat > .env << EOF
# Server Configuration
SERVER_IP=$SERVER_IP

# Database Configuration
POSTGRES_PASSWORD=secure_postgres_password_123

# AI Provider API Keys (ОБЯЗАТЕЛЬНО!)
ANTHROPIC_API_KEY=your_anthropic_api_key_here
OPENAI_API_KEY=your_openai_api_key_here
GOOGLE_API_KEY=your_google_api_key_here
EOF
        
        print_warning "⚠️  ВАЖНО: Отредактируйте .env файл:"
        print_warning "   - Добавьте ваши AI API ключи"
        echo
        echo "Хотите отредактировать .env сейчас? (y/n)"
        read -r response
        if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
            nano .env
        fi
    fi
    
    # Load environment variables
    source .env
    export SERVER_IP
}

# Check if required files exist
check_files() {
    print_status "Checking required files..."
    
    if [ ! -f "demo_app.py" ]; then
        print_error "demo_app.py не найден! Убедитесь, что вы находитесь в корне проекта DevAssist-Pro"
        exit 1
    fi
    
    if [ ! -f "Dockerfile.streamlit" ]; then
        print_warning "Dockerfile.streamlit не найден. Создаем..."
        cat > Dockerfile.streamlit << 'EOF'
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create necessary directories
RUN mkdir -p /app/data

# Expose port
EXPOSE 8501

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8501/_stcore/health || exit 1

# Run Streamlit
CMD ["streamlit", "run", "demo_app.py", "--server.address=0.0.0.0", "--server.port=8501", "--server.headless=true"]
EOF
    fi
    
    if [ ! -d "frontend" ]; then
        print_error "Папка frontend не найдена!"
        exit 1
    fi
    
    print_success "Files OK"
}

# Create required directories
create_directories() {
    print_status "Creating directories..."
    mkdir -p data logs
    print_success "Directories created"
}

# Deploy services
deploy_services() {
    print_status "Deploying services..."
    
    # Stop existing containers
    docker-compose -f docker-compose.simple.yml down 2>/dev/null || true
    
    # Build and start services
    docker-compose -f docker-compose.simple.yml up -d --build
    
    print_success "Services deployed"
}

# Wait for services
wait_for_services() {
    print_status "Waiting for services to start..."
    
    # Wait for PostgreSQL
    print_status "Waiting for PostgreSQL..."
    timeout=60
    while [ $timeout -gt 0 ]; do
        if docker-compose -f docker-compose.simple.yml exec -T postgres pg_isready -U devassist_user > /dev/null 2>&1; then
            break
        fi
        sleep 2
        timeout=$((timeout-2))
    done
    
    if [ $timeout -le 0 ]; then
        print_error "PostgreSQL не запустился за 60 секунд"
        exit 1
    fi
    
    # Wait for backend
    print_status "Waiting for Streamlit backend..."
    sleep 20
    
    # Wait for frontend
    print_status "Waiting for React frontend..."
    sleep 10
    
    print_success "All services are running"
}

# Show status
show_status() {
    echo
    print_success "🎉 DevAssist Pro успешно развернут!"
    echo
    echo "📋 Доступ к приложению:"
    SERVER_IP=$(get_server_ip)
    echo "   🌐 Основной сайт (Nginx): http://$SERVER_IP"
    echo "   ⚛️  React Frontend: http://$SERVER_IP:3000"
    echo "   🎯 Streamlit Backend: http://$SERVER_IP:8501"
    echo "   🗄️  PostgreSQL: $SERVER_IP:5432"
    echo
    echo "📊 Статус контейнеров:"
    docker-compose -f docker-compose.simple.yml ps
    echo
    echo "📋 Полезные команды:"
    echo "   📜 Логи: docker-compose -f docker-compose.simple.yml logs -f"
    echo "   🔄 Перезапуск: docker-compose -f docker-compose.simple.yml restart"
    echo "   ⏹️  Остановка: docker-compose -f docker-compose.simple.yml down"
    echo
}

# Main function
main() {
    setup_env
    check_files
    create_directories
    deploy_services
    wait_for_services
    show_status
}

# Handle arguments
case "$1" in
    "stop")
        print_status "Остановка сервисов..."
        docker-compose -f docker-compose.simple.yml down
        print_success "Сервисы остановлены"
        ;;
    "restart")
        print_status "Перезапуск сервисов..."
        docker-compose -f docker-compose.simple.yml restart
        print_success "Сервисы перезапущены"
        ;;
    "logs")
        docker-compose -f docker-compose.simple.yml logs -f
        ;;
    "status")
        docker-compose -f docker-compose.simple.yml ps
        ;;
    "clean")
        print_warning "Это удалит все данные. Продолжить? (y/N)"
        read -r response
        if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
            docker-compose -f docker-compose.simple.yml down -v
            docker system prune -f
            print_success "Очистка завершена"
        fi
        ;;
    "ip")
        get_server_ip
        ;;
    *)
        main
        ;;
esac