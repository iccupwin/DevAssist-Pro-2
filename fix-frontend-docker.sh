#!/bin/bash

echo "🔧 ИСПРАВЛЕНИЕ FRONTEND DOCKER"
echo "============================="
echo ""

echo "🛑 Остановка текущего frontend контейнера..."
docker stop devassist-frontend 2>/dev/null || true
docker rm devassist-frontend 2>/dev/null || true

echo ""
echo "🧹 Удаление старого образа..."
docker rmi devassist-frontend 2>/dev/null || true

echo ""
echo "📂 Переход в директорию frontend..."
cd frontend

echo ""
echo "🔨 Пересборка образа с исправлениями..."
docker build -t devassist-frontend . --no-cache

if [ $? -eq 0 ]; then
    echo "   ✅ Образ пересобран успешно"
    
    echo ""
    echo "🚀 Запуск исправленного контейнера..."
    docker run -d \
        --name devassist-frontend \
        -p 3000:3000 \
        --restart unless-stopped \
        devassist-frontend
    
    if [ $? -eq 0 ]; then
        echo "   ✅ Контейнер запущен"
        
        echo ""
        echo "⏳ Ожидание полного запуска (60 секунд)..."
        sleep 60
        
        echo ""
        echo "🧪 ТЕСТИРОВАНИЕ ИСПРАВЛЕННОГО FRONTEND"
        echo "====================================="
        
        # Проверяем логи
        echo "📋 Последние логи контейнера:"
        docker logs devassist-frontend --tail 10
        
        echo ""
        echo "🔍 Тест доступности:"
        
        # Локальный тест
        LOCAL_TEST=$(curl -s --max-time 20 "http://localhost:3000" 2>/dev/null || echo "TIMEOUT")
        if echo "$LOCAL_TEST" | grep -qi "html\|doctype\|react\|<title"; then
            echo "   ✅ Frontend доступен локально (localhost:3000)"
            LOCAL_OK=true
        else
            echo "   ❌ Frontend не доступен локально"
            echo "   Ответ: $(echo "$LOCAL_TEST" | head -c 50)..."
            LOCAL_OK=false
        fi
        
        # Внешний тест
        EXT_TEST=$(curl -s --max-time 20 "http://46.149.71.162:3000" 2>/dev/null || echo "TIMEOUT")
        if echo "$EXT_TEST" | grep -qi "html\|doctype\|react\|<title"; then
            echo "   ✅ Frontend доступен извне (46.149.71.162:3000)"
            EXT_OK=true
        else
            echo "   ❌ Frontend не доступен извне"
            EXT_OK=false
        fi
        
        echo ""
        echo "🎯 РЕЗУЛЬТАТ ИСПРАВЛЕНИЯ:"
        echo "========================"
        
        if [ "$LOCAL_OK" = true ] && [ "$EXT_OK" = true ]; then
            echo ""
            echo "🎉🎉🎉 FRONTEND ПОЛНОСТЬЮ ИСПРАВЛЕН И РАБОТАЕТ! 🎉🎉🎉"
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
            
        elif [ "$LOCAL_OK" = true ]; then
            echo "⚠️  FRONTEND РАБОТАЕТ ЛОКАЛЬНО"
            echo ""
            echo "✅ Локально: http://localhost:3000"
            echo "❌ Извне: недоступен"
            echo ""
            echo "💡 Возможно нужна настройка firewall"
            
        else
            echo "❌ FRONTEND ВСЕ ЕЩЕ НЕ РАБОТАЕТ"
            echo ""
            echo "🔧 Дополнительная диагностика:"
            echo "   docker logs devassist-frontend"
            echo "   docker exec devassist-frontend ps aux"
        fi
        
    else
        echo "   ❌ Ошибка запуска контейнера"
    fi
else
    echo "   ❌ Ошибка сборки образа"
fi

cd ..

echo ""
echo "📋 УПРАВЛЕНИЕ FRONTEND:"
echo "   Статус:      docker ps | grep frontend"
echo "   Логи:        docker logs devassist-frontend"
echo "   Перезапуск:  docker restart devassist-frontend"
echo "   Остановка:   docker stop devassist-frontend"

echo ""
echo "✅ Исправление frontend завершено"