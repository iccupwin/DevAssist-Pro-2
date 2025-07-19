#!/bin/bash
# Быстрое исправление порта

echo "🔧 Быстрое исправление конфликта порта 80..."

# Останавливаем текущие контейнеры
docker-compose -f docker-compose.fullstack.yml down

# Меняем порт на 8080 в docker-compose файле
sed -i 's/- "80:80"/- "8080:80"/' docker-compose.fullstack.yml

# Запускаем заново
docker-compose -f docker-compose.fullstack.yml up -d

echo ""
echo "⏳ Ожидаем запуска..."
sleep 10

# Проверяем статус
docker-compose -f docker-compose.fullstack.yml ps

echo ""
echo "✅ Готово! Система теперь доступна на порту 8080:"
echo ""

# Определяем IP
IP=$(curl -s ifconfig.me 2>/dev/null || echo "YOUR_SERVER_IP")

echo "📊 Доступные адреса:"
echo "   • Главная:    http://$IP:8080"
echo "   • Health:     http://$IP:8080/health"  
echo "   • API Docs:   http://$IP:8080/api/docs"
echo ""
echo "🔍 Проверьте: curl http://localhost:8080/health"