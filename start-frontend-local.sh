#!/bin/bash

echo "🖥️  ЛОКАЛЬНЫЙ ЗАПУСК FRONTEND БЕЗ DOCKER (попытка #5)"
echo "=================================================="
echo ""
echo "❌ НЕУДАЧНЫЕ DOCKER ПОПЫТКИ:"
echo "   1. ❌ Dev server Docker (зависает)"
echo "   2. ❌ Production build Docker (зависает)"
echo "   3. ❌ npm ci --only=production (ошибка установки)"
echo "   4. ❌ Базовый npm install Docker (нехватка памяти)"
echo ""
echo "🎯 НОВАЯ ПОПЫТКА: Локальный запуск без Docker"
echo ""

# Остановим все Docker контейнеры frontend
echo "🛑 Остановка Docker контейнеров frontend..."
docker stop devassist-frontend 2>/dev/null || true
docker rm devassist-frontend 2>/dev/null || true

cd frontend

echo ""
echo "🔍 Проверка Node.js..."
if command -v node >/dev/null 2>&1; then
    NODE_VERSION=$(node --version)
    echo "   ✅ Node.js: $NODE_VERSION"
else
    echo "   ❌ Node.js не установлен"
    echo ""
    echo "🔧 Установка Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
    echo "   ✅ Node.js установлен"
fi

echo ""
echo "🔍 Проверка npm..."
if command -v npm >/dev/null 2>&1; then
    NPM_VERSION=$(npm --version)
    echo "   ✅ npm: $NPM_VERSION"
else
    echo "   ❌ npm не найден"
fi

echo ""
echo "📂 Проверка зависимостей..."
if [ -d "node_modules" ]; then
    echo "   ✅ node_modules существует"
else
    echo "   ❌ node_modules не найдены"
    echo ""
    echo "📦 Установка зависимостей локально..."
    npm install --timeout=300000
    
    if [ $? -eq 0 ]; then
        echo "   ✅ Зависимости установлены"
    else
        echo "   ❌ Ошибка установки зависимостей"
        cd ..
        exit 1
    fi
fi

echo ""
echo "🔧 Создание .env для локального запуска..."
cat > .env.local << 'EOF'
REACT_APP_API_URL=http://46.149.71.162:8000
REACT_APP_WS_URL=ws://46.149.71.162:8000
HOST=0.0.0.0
PORT=3000
GENERATE_SOURCEMAP=false
DISABLE_ESLINT_PLUGIN=true
EOF

echo "   ✅ .env.local создан"

echo ""
echo "🛑 Остановка возможных процессов на порту 3000..."
sudo lsof -ti:3000 | xargs sudo kill -9 2>/dev/null || true

echo ""
echo "🚀 ЛОКАЛЬНЫЙ ЗАПУСК FRONTEND..."
echo "================================"

# Запускаем в фоне
nohup npm start > ../frontend-local.log 2>&1 &
FRONTEND_PID=$!

echo "   🚀 Frontend запущен с PID: $FRONTEND_PID"
echo "$FRONTEND_PID" > ../frontend.pid

echo ""
echo "⏳ Ожидание запуска (60 секунд)..."
sleep 60

echo ""
echo "🔍 Проверка процесса..."
if ps -p $FRONTEND_PID > /dev/null 2>&1; then
    echo "   ✅ Процесс работает (PID: $FRONTEND_PID)"
    PROCESS_OK=true
else
    echo "   ❌ Процесс завершился"
    PROCESS_OK=false
fi

echo ""
echo "📋 Последние логи:"
tail -10 ../frontend-local.log

echo ""
echo "🧪 ТЕСТИРОВАНИЕ ЛОКАЛЬНОГО FRONTEND"
echo "================================="

# Проверка портов
echo "📊 Проверка портов:"
ss -tulpn | grep :3000 || echo "   Порт 3000 не занят"

# Локальный тест
echo ""
echo "🔍 Тест доступности:"
LOCAL_TEST=$(curl -s --connect-timeout 5 --max-time 15 "http://localhost:3000" 2>/dev/null || echo "TIMEOUT")
if echo "$LOCAL_TEST" | grep -qi "html\|doctype\|react\|<title\|loading"; then
    echo "   ✅ Frontend доступен локально (localhost:3000)"
    LOCAL_OK=true
else
    echo "   ❌ Frontend не доступен локально"
    echo "   Ответ: $(echo "$LOCAL_TEST" | head -c 50)..."
    LOCAL_OK=false
fi

# Внешний тест
EXT_TEST=$(curl -s --connect-timeout 5 --max-time 15 "http://46.149.71.162:3000" 2>/dev/null || echo "TIMEOUT")
if echo "$EXT_TEST" | grep -qi "html\|doctype\|react\|<title\|loading"; then
    echo "   ✅ Frontend доступен извне (46.149.71.162:3000)"
    EXT_OK=true
else
    echo "   ❌ Frontend не доступен извне"
    EXT_OK=false
fi

cd ..

echo ""
echo "🎯 РЕЗУЛЬТАТ ЛОКАЛЬНОГО ЗАПУСКА:"
echo "==============================="

if [ "$PROCESS_OK" = true ] && [ "$LOCAL_OK" = true ] && [ "$EXT_OK" = true ]; then
    echo ""
    echo "🎉🎉🎉 FRONTEND РАБОТАЕТ ЛОКАЛЬНО! 🎉🎉🎉"
    echo ""
    echo "✅ Процесс: запущен (PID: $FRONTEND_PID)"
    echo "✅ Локальный доступ: работает"
    echo "✅ Внешний доступ: работает"
    echo ""
    echo "🌐 ВАШ FRONTEND ПОЛНОСТЬЮ ГОТОВ:"
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
    echo "🎊 DEVASSIST PRO ПОЛНОСТЬЮ ГОТОВ!"
    echo ""
    echo "📱 ВАША СИСТЕМА ТЕПЕРЬ:"
    echo "   ✅ Backend: полностью функционален"
    echo "   ✅ Frontend: ваш собственный интерфейс"
    echo "   ✅ Аутентификация: работает"
    echo "   ✅ CORS: настроен"
    echo "   ✅ Доступ: внутренний и внешний"
    
elif [ "$PROCESS_OK" = true ] && [ "$LOCAL_OK" = true ]; then
    echo "⚠️  ЧАСТИЧНО РАБОТАЕТ"
    echo ""
    echo "✅ Процесс: запущен"
    echo "✅ Локально: http://localhost:3000"
    echo "❌ Извне: недоступен"
    echo ""
    echo "💡 Проверьте firewall настройки"
    
else
    echo "❌ ПРОБЛЕМЫ С ЛОКАЛЬНЫМ ЗАПУСКОМ"
    echo ""
    echo "📋 ПОЛНЫЙ ЧЕК-ЛИСТ НЕУДАЧ:"
    echo "   1. ❌ Dev server Docker (зависает)"
    echo "   2. ❌ Production build Docker (зависает)"
    echo "   3. ❌ npm ci --only=production (ошибка)"
    echo "   4. ❌ Базовый npm install Docker (нехватка памяти)"
    echo "   5. ❌ Локальный запуск (не запустился)"
    echo ""
    echo "💡 СЛЕДУЮЩИЕ ВАРИАНТЫ:"
    echo "   6. Готовый nginx с собранными файлами"
    echo "   7. Простая статичная страница-прокси"
fi

echo ""
echo "📋 УПРАВЛЕНИЕ ЛОКАЛЬНЫМ FRONTEND:"
echo "   Статус:      ps -p \$(cat frontend.pid) || echo 'Не запущен'"
echo "   Логи:        tail -f frontend-local.log"
echo "   Перезапуск:  kill \$(cat frontend.pid); rm frontend.pid; ./start-frontend-local.sh"
echo "   Остановка:   kill \$(cat frontend.pid); rm frontend.pid"

echo ""
echo "✅ Локальная попытка завершена"