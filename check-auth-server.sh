#!/bin/bash
# Скрипт для проверки аутентификации на сервере

echo "🧪 ПРОВЕРКА АУТЕНТИФИКАЦИИ НА СЕРВЕРЕ"
echo "===================================="

SERVER_IP="46.149.71.162"

# Проверка backend
echo "1. Backend status:"
curl -s http://$SERVER_IP:8000/health || echo "Backend not available"

echo ""
echo "2. Frontend status:"
curl -s -o /dev/null -w "HTTP %{http_code}\n" http://$SERVER_IP:3000

echo ""
echo "3. Test login:"
curl -s -X POST http://$SERVER_IP:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -H "Origin: http://$SERVER_IP:3000" \
  -d '{"email":"test@example.com","password":"testpass123"}' | python3 -m json.tool 2>/dev/null || echo "Login failed"

echo ""
echo "4. Docker status:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep -E "(devassist|frontend|backend)"