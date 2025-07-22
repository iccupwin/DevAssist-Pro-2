#!/bin/bash

echo "🖥️  ПРОВЕРКА И ЗАПУСК FRONTEND"
echo "============================="
echo ""

echo "🔍 Проверка статуса frontend..."

# Проверяем какие процессы используют порт 3000
echo "📋 Процессы на порту 3000:"
netstat -tulpn | grep :3000 || echo "   Порт 3000 свободен"

echo ""
echo "🐳 Проверка Docker контейнеров с frontend..."
docker ps | grep frontend || echo "   Нет запущенных frontend контейнеров"

echo ""
echo "📂 Проверка директории frontend..."
if [ -d "frontend" ]; then
    echo "   ✅ Директория frontend существует"
    
    echo ""
    echo "📦 Проверка package.json..."
    if [ -f "frontend/package.json" ]; then
        echo "   ✅ package.json найден"
        echo "   📋 Скрипты:"
        grep -A 5 '"scripts"' frontend/package.json | head -10
    else
        echo "   ❌ package.json не найден"
    fi
    
    echo ""
    echo "🔍 Проверка Dockerfile frontend..."
    if [ -f "frontend/Dockerfile" ]; then
        echo "   ✅ Dockerfile найден"
    else
        echo "   ❌ Dockerfile не найден"
    fi
    
else
    echo "   ❌ Директория frontend не найдена"
fi

echo ""
echo "🔍 Ищем docker-compose файлы с frontend..."
find . -name "docker-compose*.yml" -exec grep -l "frontend\|3000" {} \; 2>/dev/null || echo "   Не найдены docker-compose файлы с frontend"

echo ""
echo "🚀 ЗАПУСК FRONTEND"
echo "=================="

# Проверяем основной docker-compose
if [ -f "docker-compose.yml" ]; then
    echo "📋 Проверка основного docker-compose.yml..."
    if grep -q "frontend\|3000" docker-compose.yml; then
        echo "   ✅ Frontend найден в docker-compose.yml"
        
        echo ""
        echo "🚀 Запуск frontend через docker-compose..."
        docker-compose up -d frontend 2>/dev/null || docker-compose up -d
        
    else
        echo "   ❌ Frontend не найден в docker-compose.yml"
    fi
fi

# Попробуем найти и запустить любой compose с frontend
FRONTEND_COMPOSE=$(find . -name "docker-compose*.yml" -exec grep -l "frontend\|3000" {} \; | head -1)

if [ -n "$FRONTEND_COMPOSE" ]; then
    echo ""
    echo "📋 Найден compose файл с frontend: $FRONTEND_COMPOSE"
    echo "🚀 Запуск frontend..."
    
    COMPOSE_DIR=$(dirname "$FRONTEND_COMPOSE")
    COMPOSE_FILE=$(basename "$FRONTEND_COMPOSE")
    
    cd "$COMPOSE_DIR"
    docker-compose -f "$COMPOSE_FILE" up -d frontend 2>/dev/null || docker-compose -f "$COMPOSE_FILE" up -d
    cd - > /dev/null
    
elif [ -f "frontend/Dockerfile" ]; then
    echo ""
    echo "🐳 Запуск frontend через standalone Docker..."
    
    # Остановим любой контейнер на порту 3000
    EXISTING_CONTAINER=$(docker ps --filter "publish=3000" --format "{{.ID}}")
    if [ -n "$EXISTING_CONTAINER" ]; then
        echo "   🛑 Остановка существующего контейнера на порту 3000..."
        docker stop $EXISTING_CONTAINER
    fi
    
    # Собираем и запускаем frontend
    cd frontend
    docker build -t devassist-frontend .
    docker run -d -p 3000:3000 --name devassist-frontend-standalone devassist-frontend
    cd ..
    
elif [ -f "frontend/package.json" ]; then
    echo ""
    echo "📦 Запуск frontend через npm (локально)..."
    
    # Проверяем установлен ли Node.js
    if command -v npm >/dev/null 2>&1; then
        cd frontend
        
        # Устанавливаем зависимости если нужно
        if [ ! -d "node_modules" ]; then
            echo "   📦 Установка зависимостей..."
            npm install
        fi
        
        # Запускаем в фоне
        echo "   🚀 Запуск npm start в фоне..."
        nohup npm start > ../frontend.log 2>&1 &
        echo $! > ../frontend.pid
        
        cd ..
    else
        echo "   ❌ Node.js/npm не установлен"
    fi
else
    echo "   ❌ Не удалось найти способ запуска frontend"
fi

echo ""
echo "⏳ Ожидание запуска frontend (15 секунд)..."
sleep 15

echo ""
echo "🧪 ПРОВЕРКА FRONTEND"
echo "==================="

# Проверяем доступность frontend
echo "🔍 Тест доступности frontend:"

# Локальный тест
FRONTEND_LOCAL=$(curl -s --max-time 10 "http://localhost:3000" 2>/dev/null || echo "TIMEOUT")
if echo "$FRONTEND_LOCAL" | grep -qi "html\|doctype\|title\|react"; then
    echo "   ✅ Frontend доступен локально (localhost:3000)"
    LOCAL_OK=true
else
    echo "   ❌ Frontend не доступен локально"
    echo "   Ответ: $(echo "$FRONTEND_LOCAL" | head -c 80)..."
    LOCAL_OK=false
fi

# Внешний тест
FRONTEND_EXT=$(curl -s --max-time 10 "http://46.149.71.162:3000" 2>/dev/null || echo "TIMEOUT")
if echo "$FRONTEND_EXT" | grep -qi "html\|doctype\|title\|react"; then
    echo "   ✅ Frontend доступен извне (46.149.71.162:3000)"
    EXT_OK=true
else
    echo "   ❌ Frontend не доступен извне"
    EXT_OK=false
fi

echo ""
echo "📊 Текущий статус портов:"
netstat -tulpn | grep -E ":3000|:8000" || echo "   Порты 3000 и 8000 не заняты"

echo ""
echo "🐳 Статус Docker контейнеров:"
docker ps --format "table {{.Names}}\t{{.Image}}\t{{.Status}}\t{{.Ports}}" | head -10

echo ""
echo "🎯 РЕЗУЛЬТАТ:"
echo "============="

if [ "$LOCAL_OK" = true ] && [ "$EXT_OK" = true ]; then
    echo ""
    echo "🎉 FRONTEND ПОЛНОСТЬЮ РАБОТАЕТ!"
    echo ""
    echo "✅ Локальный доступ: http://localhost:3000"
    echo "✅ Внешний доступ:   http://46.149.71.162:3000"
    echo ""
    echo "🌐 ПОЛНАЯ СИСТЕМА ГОТОВА:"
    echo "   Frontend: http://46.149.71.162:3000"
    echo "   Backend:  http://46.149.71.162:8000"
    echo ""
    echo "🎊 DEVASSIST PRO ГОТОВ К ИСПОЛЬЗОВАНИЮ!"
    
elif [ "$LOCAL_OK" = true ]; then
    echo "⚠️  Frontend работает локально, но не доступен извне"
    echo ""
    echo "✅ Локально: http://localhost:3000"
    echo "❌ Извне: http://46.149.71.162:3000"
    echo ""
    echo "💡 Возможно нужно настроить firewall или binding"
    
else
    echo "❌ FRONTEND НЕ ЗАПУЩЕН"
    echo ""
    echo "🔧 Для диагностики:"
    echo "   - Проверьте логи: tail frontend.log"
    echo "   - Проверьте процессы: ps aux | grep node"
    echo "   - Проверьте порты: netstat -tulpn | grep 3000"
fi

echo ""
echo "📋 УПРАВЛЕНИЕ FRONTEND:"
if [ -f "frontend.pid" ]; then
    echo "   Остановка: kill \$(cat frontend.pid)"
fi
echo "   Логи: tail -f frontend.log"
echo "   Статус: curl http://localhost:3000"

echo ""
echo "✅ Проверка frontend завершена"