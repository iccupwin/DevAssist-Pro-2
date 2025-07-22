#!/bin/bash

echo "🔧 ИСПРАВЛЕНИЕ АУТЕНТИФИКАЦИИ И ПЕРЕЗАПУСК"
echo "=========================================="
echo ""

# Проверяем что мы в правильной директории
if [ ! -f "backend/docker-compose.monolith.yml" ]; then
    echo "❌ Ошибка: запустите скрипт из корневой директории проекта"
    exit 1
fi

echo "📋 Проблема: ADMIN_PASSWORD не была задана в docker-compose"
echo "🔧 Решение: Добавляем ADMIN_PASSWORD=admin123 и перезапускаем"
echo ""

echo "🛑 Остановка backend контейнера..."
docker stop devassist_app_monolith 2>/dev/null || true

echo ""
echo "📦 Проверка ADMIN_PASSWORD в docker-compose..."
if grep -q "ADMIN_PASSWORD: admin123" backend/docker-compose.monolith.yml; then
    echo "   ✅ ADMIN_PASSWORD уже добавлен"
else
    echo "   🔧 Добавление ADMIN_PASSWORD в docker-compose..."
    sed -i '/# CORS/a\      \n      # Authentication\n      ADMIN_PASSWORD: admin123' backend/docker-compose.monolith.yml
fi

echo ""
echo "🧹 Удаление старого контейнера..."
docker rm devassist_app_monolith 2>/dev/null || true

echo ""
echo "🐳 Пересборка и запуск backend контейнера..."
cd backend
docker compose -f docker-compose.monolith.yml up -d --build app

echo ""
echo "⏳ Ожидание запуска backend (30 секунд)..."
sleep 30

echo ""
echo "🧪 Проверка backend..."
if curl -f -s --max-time 10 "http://localhost:8000/health" >/dev/null 2>&1; then
    echo "   ✅ Backend: работает"
    BACKEND_OK=true
else
    echo "   ❌ Backend: недоступен"
    BACKEND_OK=false
fi

echo ""
if [ "$BACKEND_OK" = true ]; then
    echo "🔐 Тест аутентификации с исправленным паролем..."
    
    # Тест логина admin@devassist.pro / admin123
    LOGIN_RESPONSE=$(curl -s -X POST http://localhost:8000/api/auth/login \
        -H "Content-Type: application/json" \
        -H "Origin: http://46.149.71.162:3000" \
        -d '{"email":"admin@devassist.pro","password":"admin123"}' 2>/dev/null)
    
    if echo "$LOGIN_RESPONSE" | grep -q "access_token"; then
        echo "   ✅ Аутентификация admin@devassist.pro: РАБОТАЕТ!"
        echo "   Токен получен: $(echo "$LOGIN_RESPONSE" | cut -c1-50)..."
        AUTH_OK=true
    else
        echo "   ❌ Аутентификация admin@devassist.pro: проблема"
        echo "   Ответ: $LOGIN_RESPONSE"
        AUTH_OK=false
    fi
    
    # Дополнительно тестируем другого пользователя  
    echo ""
    echo "🔐 Тест второго пользователя test@example.com..."
    LOGIN_RESPONSE2=$(curl -s -X POST http://localhost:8000/api/auth/login \
        -H "Content-Type: application/json" \
        -H "Origin: http://46.149.71.162:3000" \
        -d '{"email":"test@example.com","password":"testpass123"}' 2>/dev/null)
    
    if echo "$LOGIN_RESPONSE2" | grep -q "access_token"; then
        echo "   ✅ Аутентификация test@example.com: РАБОТАЕТ!"
    else
        echo "   ❌ Аутентификация test@example.com: не работает (возможно пользователь не создан)"
    fi
    
else
    AUTH_OK=false
fi

echo ""
echo "🎯 РЕЗУЛЬТАТ ИСПРАВЛЕНИЯ:"
echo "========================"

if [ "$BACKEND_OK" = true ] && [ "$AUTH_OK" = true ]; then
    echo "🎉 ПРОБЛЕМА ИСПРАВЛЕНА!"
    echo ""
    echo "✅ Backend запущен и работает"
    echo "✅ Аутентификация восстановлена"  
    echo "✅ Админский пользователь: admin@devassist.pro / admin123"
    echo ""
    echo "🌐 URLs для проверки:"
    echo "   Backend API:    http://46.149.71.162:8000"
    echo "   Health Check:   http://46.149.71.162:8000/health"
    echo "   API Docs:       http://46.149.71.162:8000/docs"
    echo ""
    echo "🔗 Теперь frontend сможет подключиться к backend"
    
elif [ "$BACKEND_OK" = true ]; then
    echo "⚠️  ЧАСТИЧНОЕ ИСПРАВЛЕНИЕ: Backend работает, но аутентификация все еще проблемная"
    echo ""
    echo "🔧 Дополнительная диагностика:"
    echo "   docker compose -f docker-compose.monolith.yml logs app | tail -20"
    
else
    echo "❌ ИСПРАВЛЕНИЕ НЕ УДАЛОСЬ!"
    echo ""
    echo "🔧 Для диагностики:"
    echo "   docker compose -f docker-compose.monolith.yml logs app"
    echo "   docker compose -f docker-compose.monolith.yml ps"
fi

echo ""
echo "📋 Быстрые команды:"
echo "   Статус:     docker compose -f backend/docker-compose.monolith.yml ps"
echo "   Логи:       docker compose -f backend/docker-compose.monolith.yml logs app"
echo "   Перезапуск: docker compose -f backend/docker-compose.monolith.yml restart app"

cd ..