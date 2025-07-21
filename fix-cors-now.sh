#!/bin/bash

echo "🌐 НЕМЕДЛЕННОЕ ИСПРАВЛЕНИЕ CORS"
echo "==============================="
echo ""

# Проверяем что мы в правильной директории
if [ ! -f "backend/docker-compose.monolith.yml" ]; then
    echo "❌ Ошибка: запустите скрипт из корневой директории проекта"
    exit 1
fi

echo "🔍 Диагностика проблемы:"
echo "   Frontend: http://46.149.71.162:3000"
echo "   Backend:  http://46.149.71.162:8000"
echo "   Ошибка:   No 'Access-Control-Allow-Origin' header"
echo ""

echo "🔧 Исправление CORS в docker-compose.monolith.yml..."

# Показываем текущие настройки CORS
echo "📋 Текущие настройки CORS:"
grep -A 1 -B 1 "ALLOWED_ORIGINS" backend/docker-compose.monolith.yml

echo ""
echo "🔄 Обновление CORS для IP сервера..."

# Обновляем CORS конфигурацию
sed -i 's|ALLOWED_ORIGINS: .*|ALLOWED_ORIGINS: http://46.149.71.162:3000,http://46.149.71.162,http://localhost:3000,http://localhost:3001|' backend/docker-compose.monolith.yml

echo ""
echo "✅ Новые настройки CORS:"
grep -A 1 -B 1 "ALLOWED_ORIGINS" backend/docker-compose.monolith.yml

echo ""
echo "🔄 Перезапуск backend контейнера с новыми настройками..."

cd backend

# Останавливаем и удаляем только app контейнер
echo "🛑 Остановка app контейнера..."
docker stop devassist_app_monolith
docker rm devassist_app_monolith

echo ""
echo "🚀 Запуск app контейнера с обновленными CORS настройками..."
docker compose -f docker-compose.monolith.yml up -d --build app

echo ""
echo "⏳ Ожидание запуска (20 секунд)..."
sleep 20

echo ""
echo "🧪 Тестирование CORS..."

# Тест с curl имитирующий browser request
echo "🌐 Тест CORS preflight запроса..."
CORS_TEST=$(curl -s -i -X OPTIONS \
    -H "Origin: http://46.149.71.162:3000" \
    -H "Access-Control-Request-Method: POST" \
    -H "Access-Control-Request-Headers: Content-Type" \
    "http://localhost:8000/api/auth/login" 2>/dev/null)

if echo "$CORS_TEST" | grep -q "Access-Control-Allow-Origin"; then
    echo "   ✅ CORS preflight: работает"
    echo "   Заголовки: $(echo "$CORS_TEST" | grep "Access-Control-Allow-Origin")"
    CORS_OK=true
else
    echo "   ❌ CORS preflight: не работает"
    echo "   Ответ: $(echo "$CORS_TEST" | head -5)"
    CORS_OK=false
fi

echo ""
echo "🔐 Тест полного auth запроса..."
AUTH_TEST=$(curl -s -X POST \
    -H "Content-Type: application/json" \
    -H "Origin: http://46.149.71.162:3000" \
    -d '{"email":"admin@devassist.pro","password":"admin123"}' \
    "http://localhost:8000/api/auth/login" 2>/dev/null)

if echo "$AUTH_TEST" | grep -q "access_token"; then
    echo "   ✅ Аутентификация: работает"
    AUTH_OK=true
else
    echo "   ❌ Аутентификация: проблема"
    echo "   Ответ: $AUTH_TEST"
    AUTH_OK=false
fi

echo ""
echo "🎯 РЕЗУЛЬТАТ ИСПРАВЛЕНИЯ:"
echo "========================"

if [ "$CORS_OK" = true ] && [ "$AUTH_OK" = true ]; then
    echo "🎉 CORS ПОЛНОСТЬЮ ИСПРАВЛЕН!"
    echo ""
    echo "✅ CORS headers настроены правильно"
    echo "✅ Preflight запросы работают"
    echo "✅ POST запросы проходят"
    echo "✅ Аутентификация работает"
    echo ""
    echo "🔗 Frontend теперь может:"
    echo "   • Регистрировать новых пользователей"
    echo "   • Авторизовывать существующих пользователей"
    echo "   • Делать API запросы к backend"
    echo ""
    echo "🌐 Протестируйте в браузере:"
    echo "   Frontend: http://46.149.71.162:3000"
    echo "   Backend:  http://46.149.71.162:8000/docs"
    
elif [ "$CORS_OK" = true ]; then
    echo "⚠️  CORS исправлен, но есть проблемы с аутентификацией"
    echo ""
    echo "✅ CORS headers работают"
    echo "❌ Проблема с логикой аутентификации"
    
else
    echo "❌ CORS все еще не работает!"
    echo ""
    echo "🔧 Дополнительная диагностика:"
    echo "   docker compose -f docker-compose.monolith.yml logs app | grep -i cors"
    echo "   docker compose -f docker-compose.monolith.yml logs app | tail -20"
fi

echo ""
echo "📋 Быстрые команды:"
echo "   Логи backend: docker compose -f docker-compose.monolith.yml logs app"
echo "   Перезапуск:   docker compose -f docker-compose.monolith.yml restart app"
echo "   Проверка:     curl -i http://localhost:8000/health"

cd ..