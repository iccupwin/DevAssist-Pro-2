#!/bin/bash

# DevAssist Pro - Тест всех сервисов
echo "🚀 DevAssist Pro - Проверка сервисов"
echo "======================================"

# Базовые URL сервисов
services=(
    "API Gateway:http://localhost:8000/health"
    "Auth Service:http://localhost:8001/health"
    "LLM Service:http://localhost:8002/health"
    "Documents Service:http://localhost:8003/health"
    "Analytics Service:http://localhost:8004/health"
    "Reports Service:http://localhost:8005/health"
    "Dashboard Service:http://localhost:8006/health"
)

echo ""
echo "📡 Проверка доступности сервисов:"
echo "--------------------------------"

for service in "${services[@]}"; do
    name=$(echo "$service" | cut -d: -f1)
    url=$(echo "$service" | cut -d: -f2-3)
    
    printf "%-20s" "$name"
    
    if curl -f -s "$url" > /dev/null 2>&1; then
        echo "✅ Доступен"
    else
        echo "❌ Недоступен"
    fi
done

echo ""
echo "🔍 Детальная проверка API Gateway:"
echo "--------------------------------"

if curl -f -s http://localhost:8000/health > /dev/null 2>&1; then
    echo "API Gateway запущен. Получение информации:"
    curl -s http://localhost:8000/health | python3 -m json.tool 2>/dev/null || echo "Ответ получен, но не в JSON формате"
else
    echo "❌ API Gateway недоступен на порту 8000"
fi

echo ""
echo "🔗 Базовые эндпоинты:"
echo "--------------------"
echo "• API Gateway:    http://localhost:8000"
echo "• API Docs:       http://localhost:8000/docs"
echo "• Auth Service:   http://localhost:8001"
echo "• LLM Service:    http://localhost:8002"
echo "• Documents:      http://localhost:8003"
echo "• Analytics:      http://localhost:8004"
echo "• Reports:        http://localhost:8005"
echo "• Dashboard:      http://localhost:8006"

echo ""
echo "📝 Для запуска всех сервисов используйте:"
echo "cd backend && make start"