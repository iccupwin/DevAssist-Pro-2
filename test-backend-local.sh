#!/bin/bash

echo "🧪 Тестирование Backend локально"
echo "================================"

cd backend

# Запускаем в Docker контейнере с минимальными настройками
docker run --rm \
  -v "$(pwd)":/app \
  -v "$(pwd)/../.env.production":/app/.env.production:ro \
  -w /app \
  -p 8000:8000 \
  -e DATABASE_AVAILABLE=false \
  -e ALLOWED_ORIGINS="http://localhost:3000,http://46.149.71.162:3000" \
  -e CORS_ALLOW_CREDENTIALS=true \
  -e ANTHROPIC_API_KEY="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" \
  -e USE_REAL_API=true \
  -e LOG_LEVEL=INFO \
  python:3.11-slim \
  bash -c "pip install --no-cache-dir -r requirements-monolith.txt && python app.py"