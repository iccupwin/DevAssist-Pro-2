#!/bin/bash

echo "🚀 ЗАПУСК FRONTEND ЧЕРЕЗ DOCKER"
echo "==============================="
echo ""

echo "🔍 Проверка статуса..."
echo "📋 Процессы на порту 3000:"
ss -tulpn | grep :3000 2>/dev/null || echo "   Порт 3000 свободен"

echo ""
echo "🐳 Текущие контейнеры:"
docker ps --format "table {{.Names}}\t{{.Image}}\t{{.Status}}\t{{.Ports}}"

echo ""
echo "🛑 Остановка возможных старых frontend контейнеров..."
docker stop devassist-frontend 2>/dev/null || true
docker rm devassist-frontend 2>/dev/null || true

echo ""
echo "🐳 STANDALONE ЗАПУСК FRONTEND"
echo "============================="

echo "📂 Переход в директорию frontend..."
cd frontend

echo "🔨 Сборка frontend образа..."
docker build -t devassist-frontend . --no-cache

if [ $? -eq 0 ]; then
    echo "   ✅ Образ собран успешно"
    
    echo ""
    echo "🚀 Запуск frontend контейнера..."
    docker run -d \
        --name devassist-frontend \
        -p 3000:3000 \
        --restart unless-stopped \
        devassist-frontend
    
    if [ $? -eq 0 ]; then
        echo "   ✅ Контейнер запущен"
    else
        echo "   ❌ Ошибка запуска контейнера"
    fi
else
    echo "   ❌ Ошибка сборки образа"
fi

cd ..

echo ""
echo "⏳ Ожидание запуска frontend (30 секунд)..."
sleep 30

echo ""
echo "🧪 ТЕСТИРОВАНИЕ FRONTEND"
echo "======================="

# Проверяем статус контейнера
echo "🐳 Статус frontend контейнера:"
FRONTEND_CONTAINER=$(docker ps --filter "publish=3000" --format "{{.Names}}")
if [ -n "$FRONTEND_CONTAINER" ]; then
    echo "   ✅ Контейнер запущен: $FRONTEND_CONTAINER"
    docker ps --filter "name=$FRONTEND_CONTAINER" --format "table {{.Names}}\t{{.Image}}\t{{.Status}}\t{{.Ports}}"
    CONTAINER_OK=true
else
    echo "   ❌ Контейнер не найден"
    CONTAINER_OK=false
fi

# Тестируем доступность
echo ""
echo "🔍 Тест доступности:"

# Локальный тест
LOCAL_TEST=$(curl -s --max-time 15 "http://localhost:3000" 2>/dev/null || echo "TIMEOUT")
if echo "$LOCAL_TEST" | grep -qi "html\|doctype\|react\|<title"; then
    echo "   ✅ Frontend доступен локально (localhost:3000)"
    LOCAL_OK=true
else
    echo "   ❌ Frontend не доступен локально"
    echo "   Ответ: $(echo "$LOCAL_TEST" | head -c 50)..."
    LOCAL_OK=false
fi

# Внешний тест
EXT_TEST=$(curl -s --max-time 15 "http://46.149.71.162:3000" 2>/dev/null || echo "TIMEOUT")
if echo "$EXT_TEST" | grep -qi "html\|doctype\|react\|<title"; then
    echo "   ✅ Frontend доступен извне (46.149.71.162:3000)"
    EXT_OK=true
else
    echo "   ❌ Frontend не доступен извне"
    EXT_OK=false
fi

echo ""
echo "📊 Проверка портов:"
ss -tulpn | grep -E ":3000|:8000" 2>/dev/null || echo "   Нет активных соединений на портах 3000/8000"

echo ""
echo "🎯 ИТОГОВЫЙ РЕЗУЛЬТАТ:"
echo "====================="

if [ "$CONTAINER_OK" = true ] && [ "$LOCAL_OK" = true ] && [ "$EXT_OK" = true ]; then
    echo ""
    echo "🎉🎉🎉 FRONTEND ПОЛНОСТЬЮ РАБОТАЕТ! 🎉🎉🎉"
    echo ""
    echo "✅ Контейнер: запущен и здоров"
    echo "✅ Локальный доступ: работает"
    echo "✅ Внешний доступ: работает"
    echo ""
    echo "🌐 ПОЛНАЯ СИСТЕМА DEVASSIST PRO ГОТОВА:"
    echo ""
    echo "   🖥️  Frontend:    http://46.149.71.162:3000"
    echo "   ⚙️  Backend:     http://46.149.71.162:8000"
    echo "   📖 API Docs:    http://46.149.71.162:8000/docs"
    echo "   💓 Health:      http://46.149.71.162:8000/health"
    echo ""
    echo "👤 УЧЕТНЫЕ ДАННЫЕ:"
    echo "   📧 Email:    admin@devassist.pro"
    echo "   🔑 Password: admin123"
    echo ""
    echo "🎊 ВСЕ ГОТОВО К ИСПОЛЬЗОВАНИЮ!"
    
elif [ "$CONTAINER_OK" = true ] && [ "$LOCAL_OK" = true ]; then
    echo "⚠️  FRONTEND РАБОТАЕТ ЛОКАЛЬНО"
    echo ""
    echo "✅ Контейнер: запущен"
    echo "✅ Локально: http://localhost:3000"
    echo "❌ Извне: недоступен"
    
elif [ "$CONTAINER_OK" = true ]; then
    echo "⚠️  КОНТЕЙНЕР ЗАПУЩЕН, НО FRONTEND НЕ ОТВЕЧАЕТ"
    echo ""
    echo "🔧 Диагностика:"
    echo "   docker logs $FRONTEND_CONTAINER"
    
else
    echo "❌ FRONTEND НЕ ЗАПУЩЕН"
    echo ""
    echo "🔧 Для диагностики:"
    echo "   docker ps -a | grep frontend"
    echo "   docker logs devassist-frontend"
fi

echo ""
echo "📋 УПРАВЛЕНИЕ FRONTEND:"
echo "   Статус:      docker ps | grep frontend"
echo "   Логи:        docker logs devassist-frontend"
echo "   Перезапуск:  docker restart devassist-frontend"
echo "   Остановка:   docker stop devassist-frontend"

echo ""
echo "✅ Запуск frontend завершен"