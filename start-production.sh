#!/bin/bash

# =============================================================================
# DevAssist Pro - Production Startup Script
# Initializes and starts all services in production mode
# =============================================================================

set -e

echo "🚀 Starting DevAssist Pro in Production Mode..."

# Configuration
export PYTHONPATH="/app/backend"
export ENVIRONMENT="production"
export NODE_ENV="production"

# Create necessary directories
mkdir -p /app/logs /app/data /var/log/nginx /var/log/supervisor

# Fix permissions (in case they're not set correctly)
chown -R appuser:appuser /app/logs /app/data 2>/dev/null || true
chmod 755 /app/logs /app/data 2>/dev/null || true

# Health check function
check_service() {
    local service_name=$1
    local url=$2
    local max_attempts=30
    local attempt=1

    echo "⏳ Waiting for $service_name to be ready..."
    
    while [ $attempt -le $max_attempts ]; do
        if curl -f -s "$url" > /dev/null 2>&1; then
            echo "✅ $service_name is ready!"
            return 0
        fi
        
        echo "   Attempt $attempt/$max_attempts - $service_name not ready yet..."
        sleep 2
        attempt=$((attempt + 1))
    done
    
    echo "❌ $service_name failed to start within expected time"
    return 1
}

# Pre-flight checks
echo "🔍 Running pre-flight checks..."

# Check if backend directory exists
if [ ! -d "/app/backend" ]; then
    echo "❌ Backend directory not found at /app/backend"
    exit 1
fi

# Check if frontend build exists
if [ ! -d "/app/frontend/build" ]; then
    echo "❌ Frontend build not found at /app/frontend/build"
    exit 1
fi

# Check if main backend file exists
if [ ! -f "/app/backend/app.py" ] && [ ! -f "/app/backend/main.py" ]; then
    echo "❌ Backend main file (app.py or main.py) not found"
    exit 1
fi

echo "✅ Pre-flight checks passed"

# Test nginx configuration
echo "🔧 Testing nginx configuration..."
nginx -t -c /etc/nginx/nginx.conf
if [ $? -eq 0 ]; then
    echo "✅ Nginx configuration is valid"
else
    echo "❌ Nginx configuration is invalid"
    exit 1
fi

# Test backend can import
echo "🐍 Testing Python backend imports..."
cd /app/backend
python -c "
try:
    import app
    print('✅ Backend imports successful')
except ImportError as e:
    print(f'❌ Backend import failed: {e}')
    exit(1)
except Exception as e:
    print(f'⚠️  Backend import warning: {e}')
"

# Start services using supervisor
echo "🎬 Starting all services with supervisor..."
exec /usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf