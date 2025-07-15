#!/bin/bash

# DevAssist Pro Full-Stack Startup Script
# This script initializes and starts the complete DevAssist Pro system

set -e

echo "🚀 Starting DevAssist Pro Full-Stack System..."

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

# Check if Docker is running
check_docker() {
    print_status "Checking Docker..."
    if ! docker info > /dev/null 2>&1; then
        print_error "Docker is not running. Please start Docker and try again."
        exit 1
    fi
    print_success "Docker is running"
}

# Check if Docker Compose is available
check_docker_compose() {
    print_status "Checking Docker Compose..."
    if ! command -v docker-compose > /dev/null 2>&1; then
        print_error "Docker Compose is not installed. Please install Docker Compose and try again."
        exit 1
    fi
    print_success "Docker Compose is available"
}

# Create .env file if it doesn't exist
setup_environment() {
    print_status "Setting up environment configuration..."
    
    if [ ! -f .env ]; then
        print_warning ".env file not found. Creating from .env.example..."
        cp .env.example .env
        print_warning "Please edit .env file with your API keys and configuration before proceeding."
        print_warning "Required API keys:"
        echo "  - ANTHROPIC_API_KEY (for Claude)"
        echo "  - OPENAI_API_KEY (for GPT)"
        echo "  - GOOGLE_API_KEY (for Gemini)"
        echo "  - OAuth credentials for authentication"
        read -p "Press Enter after updating .env file to continue..."
    else
        print_success ".env file exists"
    fi
}

# Validate required environment variables
validate_env() {
    print_status "Validating environment variables..."
    
    source .env
    
    missing_vars=()
    
    if [ -z "$ANTHROPIC_API_KEY" ] || [ "$ANTHROPIC_API_KEY" = "your-anthropic-api-key" ]; then
        missing_vars+=("ANTHROPIC_API_KEY")
    fi
    
    if [ -z "$OPENAI_API_KEY" ] || [ "$OPENAI_API_KEY" = "your-openai-api-key" ]; then
        missing_vars+=("OPENAI_API_KEY")
    fi
    
    if [ ${#missing_vars[@]} -gt 0 ]; then
        print_warning "The following environment variables need to be configured:"
        for var in "${missing_vars[@]}"; do
            echo "  - $var"
        done
        read -p "Continue anyway? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    else
        print_success "Environment variables validated"
    fi
}

# Create required directories
create_directories() {
    print_status "Creating required directories..."
    
    directories=(
        "backend/api_gateway"
        "backend/services/auth"
        "backend/services/llm"
        "backend/services/documents"
        "backend/services/dashboard"
        "backend/database"
        "backend/shared"
        "ssl"
        "logs"
    )
    
    for dir in "${directories[@]}"; do
        mkdir -p "$dir"
    done
    
    print_success "Directories created"
}

# Check if backend services exist
check_backend_services() {
    print_status "Checking backend services..."
    
    services=(
        "backend/api_gateway/Dockerfile"
        "backend/services/auth/Dockerfile"
        "backend/services/llm/Dockerfile"
        "backend/services/documents/Dockerfile"
        "backend/services/dashboard/Dockerfile"
    )
    
    missing_services=()
    
    for service in "${services[@]}"; do
        if [ ! -f "$service" ]; then
            missing_services+=("$service")
        fi
    done
    
    if [ ${#missing_services[@]} -gt 0 ]; then
        print_warning "The following backend services are missing:"
        for service in "${missing_services[@]}"; do
            echo "  - $service"
        done
        print_warning "You'll need to implement these services or use mock implementations."
    else
        print_success "All backend services found"
    fi
}

# Create frontend Dockerfile if missing
create_frontend_dockerfile() {
    if [ ! -f "frontend/Dockerfile" ]; then
        print_status "Creating frontend Dockerfile..."
        
        cat > frontend/Dockerfile << 'EOF'
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build the application
ARG REACT_APP_API_URL
ARG REACT_APP_WS_URL
ARG REACT_APP_GOOGLE_CLIENT_ID
ARG REACT_APP_YANDEX_CLIENT_ID
ARG REACT_APP_MICROSOFT_CLIENT_ID

ENV REACT_APP_API_URL=$REACT_APP_API_URL
ENV REACT_APP_WS_URL=$REACT_APP_WS_URL
ENV REACT_APP_GOOGLE_CLIENT_ID=$REACT_APP_GOOGLE_CLIENT_ID
ENV REACT_APP_YANDEX_CLIENT_ID=$REACT_APP_YANDEX_CLIENT_ID
ENV REACT_APP_MICROSOFT_CLIENT_ID=$REACT_APP_MICROSOFT_CLIENT_ID

RUN npm run build

# Serve the application
FROM nginx:alpine
COPY --from=0 /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 3000

CMD ["nginx", "-g", "daemon off;"]
EOF
        
        print_success "Frontend Dockerfile created"
    fi
}

# Create Streamlit Dockerfile if missing
create_streamlit_dockerfile() {
    if [ ! -f "Dockerfile.streamlit" ]; then
        print_status "Creating Streamlit Dockerfile..."
        
        cat > Dockerfile.streamlit << 'EOF'
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install -r requirements.txt

# Copy application code
COPY . .

# Expose Streamlit port
EXPOSE 8501

# Health check
HEALTHCHECK CMD curl --fail http://localhost:8501/_stcore/health

# Run Streamlit app
CMD ["streamlit", "run", "app.py", "--server.port=8501", "--server.address=0.0.0.0"]
EOF
        
        print_success "Streamlit Dockerfile created"
    fi
}

# Start the system
start_system() {
    print_status "Starting DevAssist Pro system..."
    
    # Build and start all services
    docker-compose -f docker-compose.fullstack.yml up --build -d
    
    print_success "System started successfully!"
    
    echo ""
    echo "🌐 Access points:"
    echo "  • Frontend (React):     http://localhost:3000"
    echo "  • API Gateway:          http://localhost:8000"
    echo "  • Streamlit (Legacy):   http://localhost:8501"
    echo "  • Nginx Proxy:          http://localhost:80"
    echo ""
    echo "📊 Monitoring:"
    echo "  • Docker logs:          docker-compose -f docker-compose.fullstack.yml logs -f"
    echo "  • Service status:       docker-compose -f docker-compose.fullstack.yml ps"
    echo ""
    echo "🛑 To stop the system:"
    echo "  • docker-compose -f docker-compose.fullstack.yml down"
}

# Monitor system startup
monitor_startup() {
    print_status "Monitoring system startup..."
    
    services=("postgres" "redis" "api-gateway" "frontend" "nginx")
    
    for service in "${services[@]}"; do
        print_status "Waiting for $service to be healthy..."
        timeout=60
        elapsed=0
        
        while [ $elapsed -lt $timeout ]; do
            if docker-compose -f docker-compose.fullstack.yml ps "$service" | grep -q "Up"; then
                print_success "$service is running"
                break
            fi
            
            sleep 2
            elapsed=$((elapsed + 2))
        done
        
        if [ $elapsed -ge $timeout ]; then
            print_warning "$service did not start within $timeout seconds"
        fi
    done
}

# Main execution
main() {
    echo "=================================================="
    echo "    DevAssist Pro Full-Stack Startup Script"
    echo "=================================================="
    echo ""
    
    check_docker
    check_docker_compose
    setup_environment
    validate_env
    create_directories
    check_backend_services
    create_frontend_dockerfile
    create_streamlit_dockerfile
    
    echo ""
    print_status "All prerequisites checked. Starting system..."
    echo ""
    
    start_system
    monitor_startup
    
    echo ""
    print_success "DevAssist Pro is now running!"
    print_status "Check the logs if any services failed to start:"
    echo "  docker-compose -f docker-compose.fullstack.yml logs"
}

# Handle script interruption
trap 'echo -e "\n${RED}Script interrupted${NC}"; exit 1' INT

# Run main function
main "$@"