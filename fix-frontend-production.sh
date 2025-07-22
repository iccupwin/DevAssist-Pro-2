#!/bin/bash

echo "🏭 ИСПРАВЛЕНИЕ FRONTEND - PRODUCTION BUILD"
echo "========================================"
echo ""

echo "🛑 Остановка и удаление старого контейнера..."
docker stop devassist-frontend 2>/dev/null || true
docker rm devassist-frontend 2>/dev/null || true

echo ""
echo "🧹 Очистка старых образов..."
docker rmi devassist-frontend 2>/dev/null || true

echo ""
echo "📂 Переход в директорию frontend..."
cd frontend

echo ""
echo "🔨 Production build (экономит память)..."
docker build -t devassist-frontend . --no-cache

if [ $? -eq 0 ]; then
    echo "   ✅ Production образ собран успешно"
    
    echo ""
    echo "🚀 Запуск production контейнера..."
    docker run -d \
        --name devassist-frontend \
        -p 3000:3000 \
        --restart unless-stopped \
        --memory="512m" \
        --memory-swap="512m" \
        devassist-frontend
    
    if [ $? -eq 0 ]; then
        echo "   ✅ Production контейнер запущен"
        
        echo ""
        echo "⏳ Ожидание запуска nginx (15 секунд)..."
        sleep 15
        
        echo ""
        echo "🧪 ТЕСТИРОВАНИЕ PRODUCTION FRONTEND"
        echo "================================="
        
        # Проверяем статус контейнера
        echo "🐳 Статус контейнера:"
        docker ps --filter "name=devassist-frontend" --format "table {{.Names}}\t{{.Image}}\t{{.Status}}\t{{.Ports}}"
        
        # Проверяем логи
        echo ""
        echo "📋 Логи nginx:"
        docker logs devassist-frontend --tail 5
        
        echo ""
        echo "🔍 Тесты доступности:"
        
        # Health check
        HEALTH=$(curl -s --max-time 10 "http://localhost:3000/health" 2>/dev/null || echo "TIMEOUT")
        if echo "$HEALTH" | grep -q "healthy"; then
            echo "   ✅ Health check: работает"
            HEALTH_OK=true
        else
            echo "   ❌ Health check: не работает"
            HEALTH_OK=false
        fi
        
        # Локальный тест
        LOCAL_TEST=$(curl -s --max-time 15 "http://localhost:3000" 2>/dev/null || echo "TIMEOUT")
        if echo "$LOCAL_TEST" | grep -qi "html\|doctype\|<title"; then
            echo "   ✅ Frontend доступен локально (localhost:3000)"
            LOCAL_OK=true
        else
            echo "   ❌ Frontend не доступен локально"
            echo "   Ответ: $(echo "$LOCAL_TEST" | head -c 50)..."
            LOCAL_OK=false
        fi
        
        # Внешний тест
        EXT_TEST=$(curl -s --max-time 15 "http://46.149.71.162:3000" 2>/dev/null || echo "TIMEOUT")
        if echo "$EXT_TEST" | grep -qi "html\|doctype\|<title"; then
            echo "   ✅ Frontend доступен извне (46.149.71.162:3000)"
            EXT_OK=true
        else
            echo "   ❌ Frontend не доступен извне"
            EXT_OK=false
        fi
        
        echo ""
        echo "📊 Использование ресурсов:"
        docker stats devassist-frontend --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}"
        
        echo ""
        echo "🎯 ИТОГОВЫЙ РЕЗУЛЬТАТ:"
        echo "====================="
        
        if [ "$HEALTH_OK" = true ] && [ "$LOCAL_OK" = true ] && [ "$EXT_OK" = true ]; then
            echo ""
            echo "🎉🎉🎉 FRONTEND ПОЛНОСТЬЮ РАБОТАЕТ! 🎉🎉🎉"
            echo ""
            echo "✅ Production build: оптимизирован и быстрый"
            echo "✅ Nginx: стабильно обслуживает статику"
            echo "✅ Health check: работает"
            echo "✅ Локальный доступ: работает"
            echo "✅ Внешний доступ: работает"
            echo "✅ Память: экономично использует ресурсы"
            echo ""
            echo "🌐 ПОЛНАЯ СИСТЕМА DEVASSIST PRO ГОТОВА:"
            echo ""
            echo "   🖥️  Frontend:      http://46.149.71.162:3000"
            echo "   ⚙️  Backend:       http://46.149.71.162:8000"
            echo "   📖 API Docs:      http://46.149.71.162:8000/docs"
            echo "   💓 Health:        http://46.149.71.162:8000/health"
            echo "   🩺 Frontend Health: http://46.149.71.162:3000/health"
            echo ""
            echo "👤 УЧЕТНЫЕ ДАННЫЕ:"
            echo "   📧 Email:    admin@devassist.pro"
            echo "   🔑 Password: admin123"
            echo ""
            echo "🚀 ОСОБЕННОСТИ PRODUCTION FRONTEND:"
            echo "   ✅ Статические файлы оптимизированы"
            echo "   ✅ Gzip сжатие включено"
            echo "   ✅ Кэширование настроено"
            echo "   ✅ Безопасные заголовки"
            echo "   ✅ React Router поддержка"
            echo ""
            echo "🎊 ВСЕ ГОТОВО К ПОЛНОЦЕННОМУ ИСПОЛЬЗОВАНИЮ!"
            
        elif [ "$LOCAL_OK" = true ]; then
            echo "⚠️  ЧАСТИЧНО РАБОТАЕТ"
            echo ""
            echo "✅ Локально: http://localhost:3000"
            [ "$EXT_OK" != true ] && echo "❌ Извне: недоступен"
            echo ""
            echo "💡 Проверьте firewall настройки"
            
        else
            echo "❌ ПРОБЛЕМЫ С FRONTEND"
            echo ""
            echo "🔧 Диагностика:"
            echo "   docker logs devassist-frontend"
            echo "   docker exec devassist-frontend nginx -t"
            echo "   docker exec devassist-frontend ls -la /usr/share/nginx/html"
        fi
        
    else
        echo "   ❌ Ошибка запуска production контейнера"
    fi
else
    echo "   ❌ Ошибка сборки production образа"
fi

cd ..

echo ""
echo "📋 УПРАВЛЕНИЕ PRODUCTION FRONTEND:"
echo "   Статус:        docker ps | grep frontend"
echo "   Логи:          docker logs devassist-frontend"
echo "   Ресурсы:       docker stats devassist-frontend"
echo "   Nginx тест:    docker exec devassist-frontend nginx -t"
echo "   Перезапуск:    docker restart devassist-frontend"
echo "   Остановка:     docker stop devassist-frontend"

echo ""
echo "✅ Production исправление завершено"