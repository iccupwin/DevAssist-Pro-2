#!/bin/bash

echo "⚡ СУПЕР-БЫСТРЫЙ ПЕРЕЗАПУСК BACKEND"
echo "==================================="
echo "Перезапуск только backend процесса без пересборки Docker"
echo ""

# Перезапускаем supervisor внутри контейнера, который перезапустит Python backend
echo "🔄 Перезапуск backend процесса в контейнере..."
docker exec devassist_app supervisorctl restart backend

echo "⏳ Ожидание запуска (5 секунд)..."
sleep 5

# Проверка
echo ""
echo "🧪 Проверка backend..."
if curl -f -s --max-time 5 "http://46.149.71.162:8000/health" >/dev/null 2>&1; then
    echo "✅ Backend работает!"
    
    # Быстрый тест аутентификации
    echo ""
    echo "🔐 Проверка аутентификации..."
    if curl -s "http://46.149.71.162:8000/api/auth/login" -X POST \
        -H "Content-Type: application/json" \
        -d '{"email":"admin@devassist.pro","password":"admin123"}' | grep -q "access_token"; then
        echo "✅ Исправления применены! Аутентификация работает!"
    else
        echo "❌ Аутентификация еще не работает"
    fi
else
    echo "❌ Backend недоступен"
fi

echo ""
echo "📋 Логи backend:"
docker exec devassist_app tail -n 20 /var/log/supervisor/backend.out.log