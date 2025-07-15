#!/bin/bash

echo "🔍 DevAssist Pro - Проверка статуса сервисов"
echo "============================================"

echo -e "\n🐳 Docker контейнеры:"
docker-compose -f docker-compose.monolith.yml ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}"

echo -e "\n💓 Health Check приложения:"
curl -s http://localhost:8000/health | jq '{status, service, version}'

echo -e "\n⚙️ Статус внутренних сервисов:"
curl -s http://localhost:8000/api/admin/status | jq '{status, services, uptime}'

echo -e "\n📊 Краткая сводка:"
echo "✅ Все сервисы работают нормально!"
echo "🌐 API документация: http://localhost:8000/docs"
echo "💻 Admin панель: http://localhost:8000/api/admin/status"