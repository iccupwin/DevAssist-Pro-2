#!/bin/bash
# Start monolith backend directly without Docker

echo "Starting DevAssist Pro Monolith Backend..."

# Set environment variables
export DATABASE_URL="postgresql://devassist_user:devassist_secure_password@localhost:5432/devassist_pro"
export REDIS_URL="redis://:redis_secure_password@localhost:6379/0"
export ANTHROPIC_API_KEY="${ANTHROPIC_API_KEY}"
export DEBUG=false
export ENVIRONMENT=production

# Navigate to backend directory
cd /mnt/f/DevAssitPro/DevAssist-Pro/backend

# Start with simple app
echo "Starting simple backend on port 8000..."
/mnt/c/Users/Alienrhapsody/AppData/Local/Programs/Python/Python313/python.exe app_simple_start.py