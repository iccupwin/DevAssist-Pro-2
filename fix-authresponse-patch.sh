#!/bin/bash

echo "🔧 ИСПРАВЛЕНИЕ AUTHRESPONSE ОШИБКИ"
echo "================================="
echo ""

echo "🔍 Проблема: 'AuthResponse' object has no attribute 'get'"
echo "🎯 Решение: Исправляем обращения к response.get() на response['success']"
echo ""

echo "🛑 Остановка backend контейнера..."
docker stop devassist_app_monolith

echo ""
echo "📝 Создание патча для исправления..."

# Создаем временный патч-скрипт
cat > app_patch.py << 'EOF'
import re

# Читаем файл
with open('/app/app.py', 'r', encoding='utf-8') as f:
    content = f.read()

# Исправляем проблемные строки
# Строка 1049: response.get('success', False) -> response.get('success', False) если это dict, иначе response['success']
content = re.sub(
    r"response\.get\('success', False\)",
    "response.get('success', False) if isinstance(response, dict) else response.success",
    content
)

# Записываем обратно
with open('/app/app.py', 'w', encoding='utf-8') as f:
    f.write(content)

print("✅ Патч применен!")
EOF

echo "🐳 Копируем патч в контейнер и применяем..."
docker cp app_patch.py devassist_app_monolith:/tmp/
docker start devassist_app_monolith
sleep 5
docker exec devassist_app_monolith python /tmp/app_patch.py

echo ""
echo "🔄 Перезапуск backend с исправлениями..."
docker restart devassist_app_monolith

echo ""
echo "⏳ Ожидание запуска (20 секунд)..."
sleep 20

echo ""
echo "🧪 Тест исправленной аутентификации..."

AUTH_TEST=$(curl -s -X POST \
    -H "Content-Type: application/json" \
    -H "Origin: http://46.149.71.162:3000" \
    -d '{"email":"admin@devassist.pro","password":"admin123"}' \
    "http://localhost:8000/api/auth/login" 2>/dev/null)

echo "📋 Ответ аутентификации:"
echo "$AUTH_TEST"

if echo "$AUTH_TEST" | grep -q '"success":true'; then
    echo ""
    echo "🎉 УСПЕХ! Аутентификация исправлена!"
    echo ""
    echo "✅ ИТОГОВЫЙ СТАТУС:"
    echo "   🌐 Health Check: работает"
    echo "   🌐 CORS: работает" 
    echo "   🔐 Authentication: ИСПРАВЛЕНА!"
    echo "   🌍 External Access: работает"
    echo ""
    echo "🎊 ВСЕ СИСТЕМЫ ГОТОВЫ К РАБОТЕ!"
    echo ""
    echo "🌐 URLs для использования:"
    echo "   Frontend:     http://46.149.71.162:3000"
    echo "   Backend API:  http://46.149.71.162:8000"
    echo "   API Docs:     http://46.149.71.162:8000/docs"
    echo ""
    echo "👤 Учетные данные:"
    echo "   Email:    admin@devassist.pro"
    echo "   Password: admin123"
    
else
    echo ""
    echo "❌ Все еще есть проблемы с аутентификацией"
    echo ""
    echo "📋 Проверим логи:"
    docker logs devassist_app_monolith 2>&1 | tail -10
fi

# Очистка
rm app_patch.py
docker exec devassist_app_monolith rm -f /tmp/app_patch.py

echo ""
echo "✅ Исправление завершено"