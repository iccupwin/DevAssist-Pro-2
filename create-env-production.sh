#!/bin/bash

# =============================================================================
# DevAssist Pro - Environment Setup for Production
# Creates .env.production file with minimal required settings
# =============================================================================

echo "🔧 Creating .env.production file..."

cat > .env.production << 'EOF'
# =============================================================================
# DevAssist Pro - Production Environment Configuration
# =============================================================================

# Application Settings
ENVIRONMENT=production
DEBUG=False
NODE_ENV=production

# Server Configuration
API_HOST=0.0.0.0
API_PORT=8000
ALLOWED_ORIGINS=http://46.149.67.122,https://46.149.67.122

# Database Configuration (PostgreSQL)
DATABASE_URL=postgresql://devassist:secure_postgres_password@postgres:5432/devassist_pro
DB_HOST=postgres
DB_PORT=5432
DB_NAME=devassist_pro
DB_USER=devassist
DB_PASSWORD=secure_postgres_password

# For docker-compose compatibility
POSTGRES_DB=devassist_pro
POSTGRES_USER=devassist
POSTGRES_PASSWORD=secure_postgres_password
POSTGRES_HOST=postgres
POSTGRES_PORT=5432

# Redis Configuration
REDIS_URL=redis://redis:6379/0
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_DB=0
REDIS_PASSWORD=

# Security Configuration
SECRET_KEY=super-secure-secret-key-change-this-in-production-32-chars-minimum
JWT_SECRET=super-secure-jwt-secret-key-change-this-in-production-32-chars
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=30
JWT_REFRESH_TOKEN_EXPIRE_DAYS=30

# AI Provider API Keys (REPLACE WITH YOUR REAL KEYS!)
ANTHROPIC_API_KEY=your-anthropic-api-key-here
OPENAI_API_KEY=your-openai-api-key-here
GOOGLE_API_KEY=your-google-api-key-here

# Default AI Configuration
DEFAULT_AI_MODEL=gpt-4
BACKUP_AI_MODEL=claude-3-sonnet
MAX_TOKENS=4000
AI_TEMPERATURE=0.1

# CORS Configuration
CORS_ORIGINS=http://46.149.67.122,https://46.149.67.122
CORS_ALLOW_METHODS=GET,POST,PUT,DELETE,OPTIONS
CORS_ALLOW_HEADERS=*

# File Upload Configuration
MAX_FILE_SIZE_MB=50
ALLOWED_FILE_TYPES=pdf,docx,doc,txt
UPLOAD_DIRECTORY=/app/data/uploads
RESULTS_DIRECTORY=/app/data/results

# Logging Configuration
LOG_LEVEL=INFO
LOG_FILE=/app/logs/app.log

# Performance Settings
UVICORN_WORKERS=2
WORKER_TIMEOUT=120

# Feature Flags
ENABLE_ANALYTICS=true
ENABLE_CACHING=true
ENABLE_RATE_LIMITING=true
EOF

echo "✅ .env.production created successfully!"
echo ""
echo "🔑 IMPORTANT: Edit .env.production and replace the following with real values:"
echo "   - ANTHROPIC_API_KEY=your-real-anthropic-key"
echo "   - OPENAI_API_KEY=your-real-openai-key"
echo "   - GOOGLE_API_KEY=your-real-google-key"
echo "   - SECRET_KEY=generate-a-real-32-character-secret"
echo "   - JWT_SECRET=generate-a-real-32-character-jwt-secret"
echo "   - POSTGRES_PASSWORD=set-a-secure-database-password"
echo ""
echo "📝 To edit: nano .env.production"