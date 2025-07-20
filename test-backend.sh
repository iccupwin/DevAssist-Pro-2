#!/bin/bash

echo "🧪 Тестирование Backend API..."

# Проверка статуса контейнеров
echo "📊 Статус контейнеров:"
docker compose -f docker-compose.backend.yml ps

echo ""
echo "🩺 Тестирование endpoints:"

# Health check
echo -n "Health endpoint: "
if curl -f -s --max-time 5 http://localhost:8000/health >/dev/null 2>&1; then
    echo "✅ OK"
    echo "  Response: $(curl -s http://localhost:8000/health)"
else
    echo "❌ FAILED"
fi

# API docs
echo -n "API docs: "
if curl -f -s --max-time 5 http://localhost:8000/docs >/dev/null 2>&1; then
    echo "✅ OK (http://46.149.71.162:8000/docs)"
else
    echo "❌ FAILED"
fi

# OpenAPI spec
echo -n "OpenAPI spec: "
if curl -f -s --max-time 5 http://localhost:8000/openapi.json >/dev/null 2>&1; then
    echo "✅ OK"
else
    echo "❌ FAILED"
fi

echo ""
echo "🌐 Доступные URL:"
echo "  Backend API: http://46.149.71.162:8000"
echo "  API Docs:    http://46.149.71.162:8000/docs"
echo "  Health:      http://46.149.71.162:8000/health"
echo "  OpenAPI:     http://46.149.71.162:8000/openapi.json"

echo ""
echo "📋 Если все ✅ - backend работает корректно!"