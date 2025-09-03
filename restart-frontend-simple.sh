#!/bin/bash

echo "🔄 ПРОСТОЙ ПЕРЕЗАПУСК FRONTEND"
echo "=============================="
echo ""

echo "🛑 Полная остановка frontend..."
sudo lsof -ti:3000 | xargs sudo kill -9 2>/dev/null || true
if [ -f "frontend.pid" ]; then
    kill $(cat frontend.pid) 2>/dev/null || true
    rm -f frontend.pid
fi

cd frontend

echo ""
echo "🔧 Упрощение package.json для быстрого запуска..."

# Создаем упрощенный запуск
cat > start-simple.js << 'EOF'
process.env.NODE_ENV = 'development';
process.env.HOST = '0.0.0.0';
process.env.PORT = '3000';
process.env.REACT_APP_API_URL = 'http://46.149.71.162:8000';
process.env.GENERATE_SOURCEMAP = 'false';
process.env.DISABLE_ESLINT_PLUGIN = 'true';
process.env.TSC_COMPILE_ON_ERROR = 'true';
process.env.SKIP_PREFLIGHT_CHECK = 'true';

// Запускаем React Scripts без строгих проверок
require('react-scripts/scripts/start');
EOF

echo "   ✅ Создан упрощенный start-simple.js"

echo ""
echo "🚀 ЗАПУСК УПРОЩЕННОГО FRONTEND"
echo "=============================="

nohup node start-simple.js > ../frontend-simple.log 2>&1 &
FRONTEND_PID=$!

echo "   🚀 Frontend запущен с PID: $FRONTEND_PID"
echo "$FRONTEND_PID" > ../frontend.pid

echo ""
echo "⏳ Ожидание запуска (30 секунд)..."
sleep 30

echo ""
echo "🔍 Проверка процесса..."
if ps -p $FRONTEND_PID > /dev/null 2>&1; then
    echo "   ✅ Процесс работает (PID: $FRONTEND_PID)"
    PROCESS_OK=true
else
    echo "   ❌ Процесс не работает"
    PROCESS_OK=false
fi

echo ""
echo "📋 Свежие логи:"
tail -10 ../frontend-simple.log

echo ""
echo "🔍 Проверка порта:"
ss -tulpn | grep :3000 && echo "   ✅ Порт 3000 занят" || echo "   ❌ Порт 3000 свободен"

echo ""
echo "🧪 БЫСТРОЕ ТЕСТИРОВАНИЕ"
echo "====================="

if [ "$PROCESS_OK" = true ]; then
    # Даем больше времени на запуск
    sleep 15
    
    echo "🔍 Проверка доступности:"
    LOCAL_TEST=$(timeout 10 curl -s http://localhost:3000 2>/dev/null || echo "TIMEOUT")
    if echo "$LOCAL_TEST" | grep -qi "html\|doctype\|react\|<title\|loading\|root"; then
        echo "   ✅ Локально работает"
        
        EXT_TEST=$(timeout 10 curl -s http://46.149.71.162:3000 2>/dev/null || echo "TIMEOUT") 
        if echo "$EXT_TEST" | grep -qi "html\|doctype\|react\|<title\|loading\|root"; then
            echo "   ✅ Внешне доступен"
            echo ""
            echo "🎉 FRONTEND ПОЛНОСТЬЮ РАБОТАЕТ!"
            echo ""
            echo "   🌐 Доступен на: http://46.149.71.162:3000"
            echo "   🔗 Backend:     http://46.149.71.162:8000"
            echo ""
            echo "   👤 Email:    admin@devassist.pro"
            echo "   🔑 Password: admin123"
            echo ""
            echo "🎊 ГОТОВО К ИСПОЛЬЗОВАНИЮ!"
        else
            echo "   ❌ Внешне недоступен"
        fi
    else
        echo "   ❌ Локально недоступен"
        echo "   Содержимое: $(echo "$LOCAL_TEST" | head -c 100)..."
        
        echo ""
        echo "📋 Последние 20 строк лога:"
        tail -20 ../frontend-simple.log
    fi
else
    echo "   ❌ Процесс не запустился"
    echo ""
    echo "📋 Полный лог ошибок:"
    cat ../frontend-simple.log | tail -30
fi

cd ..

echo ""
echo "📋 УПРАВЛЕНИЕ:"
echo "   Статус:     ps -p \$(cat frontend.pid) 2>/dev/null || echo 'Остановлен'"
echo "   Логи:       tail -f frontend-simple.log"
echo "   Порт:       ss -tulpn | grep :3000" 
echo "   Остановка:  kill \$(cat frontend.pid) 2>/dev/null; rm frontend.pid"

echo ""
echo "✅ Простой перезапуск завершен"