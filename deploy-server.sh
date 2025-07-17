#!/bin/bash

# DevAssist Pro Server Deployment Script
set -e

echo "🚀 DevAssist Pro Server Deployment"
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
    echo "Server IP: $SERVER_IP"
}

# Setup environment
setup_env() {
    print_status "Setting up environment..."
    
    if [ ! -f ".env" ]; then
        print_warning "Creating .env file from template..."
        cp .env.server .env
        
        # Replace SERVER_IP placeholder
        get_server_ip
        sed -i "s/YOUR_SERVER_IP_HERE/$SERVER_IP/g" .env
        
        print_warning "⚠️  ВАЖНО: Отредактируйте .env файл:"
        print_warning "   - Добавьте ваши AI API ключи"
        print_warning "   - Проверьте настройки базы данных"
        echo
        read -p "Нажмите Enter для продолжения или Ctrl+C для выхода..."
    fi
    
    # Load environment variables
    source .env
    export SERVER_IP
}

# Check prerequisites
check_prereqs() {
    print_status "Checking prerequisites..."
    
    if ! command -v docker &> /dev/null; then
        print_error "Docker не установлен!"
        print_status "Установите Docker: curl -fsSL https://get.docker.com | sh"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose не установлен!"
        print_status "Установите Docker Compose: sudo curl -L https://github.com/docker/compose/releases/latest/download/docker-compose-\$(uname -s)-\$(uname -m) -o /usr/local/bin/docker-compose && sudo chmod +x /usr/local/bin/docker-compose"
        exit 1
    fi
    
    print_success "Prerequisites OK"
}

# Create required directories
create_directories() {
    print_status "Creating directories..."
    mkdir -p data/uploads data/results logs
    print_success "Directories created"
}

# Deploy services
deploy_services() {
    print_status "Deploying services..."
    
    # Stop existing containers
    docker-compose -f docker-compose.server.yml down 2>/dev/null || true
    
    # Build and start services
    docker-compose -f docker-compose.server.yml up -d --build
    
    print_success "Services deployed"
}

# Wait for services
wait_for_services() {
    print_status "Waiting for services to start..."
    
    # Wait for PostgreSQL
    print_status "Waiting for PostgreSQL..."
    timeout=60
    while [ $timeout -gt 0 ]; do
        if docker-compose -f docker-compose.server.yml exec -T postgres pg_isready -U devassist_user > /dev/null 2>&1; then
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
    get_server_ip
    echo "   🌐 Основной сайт (Nginx): http://$SERVER_IP"
    echo "   ⚛️  React Frontend: http://$SERVER_IP:3000"
    echo "   🎯 Streamlit Backend: http://$SERVER_IP:8501"
    echo "   🗄️  PostgreSQL: $SERVER_IP:5432"
    echo
    echo "📊 Статус контейнеров:"
    docker-compose -f docker-compose.server.yml ps
    echo
    echo "📋 Полезные команды:"
    echo "   📜 Логи: docker-compose -f docker-compose.server.yml logs -f"
    echo "   🔄 Перезапуск: docker-compose -f docker-compose.server.yml restart"
    echo "   ⏹️  Остановка: docker-compose -f docker-compose.server.yml down"
    echo "   🧹 Очистка: docker-compose -f docker-compose.server.yml down -v"
    echo
}

# Main function
main() {
    setup_env
    check_prereqs
    create_directories
    deploy_services
    wait_for_services
    show_status
}

# Handle arguments
case "$1" in
    "stop")
        print_status "Остановка сервисов..."
        docker-compose -f docker-compose.server.yml down
        print_success "Сервисы остановлены"
        ;;
    "restart")
        print_status "Перезапуск сервисов..."
        docker-compose -f docker-compose.server.yml restart
        print_success "Сервисы перезапущены"
        ;;
    "logs")
        docker-compose -f docker-compose.server.yml logs -f
        ;;
    "status")
        docker-compose -f docker-compose.server.yml ps
        ;;
    "clean")
        print_warning "Это удалит все данные. Продолжить? (y/N)"
        read -r response
        if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
            docker-compose -f docker-compose.server.yml down -v
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