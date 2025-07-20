#!/bin/bash

set -e

echo "🚀 Запуск React Frontend для DevAssist Pro"
echo "==========================================="

# Проверить что мы в правильной директории
if [ ! -d "frontend" ]; then
    echo "❌ Папка frontend не найдена. Запустите из корневой директории проекта"
    exit 1
fi

cd frontend

# Проверить наличие package.json
if [ ! -f "package.json" ]; then
    echo "❌ package.json не найден в папке frontend"
    exit 1
fi

# Остановить существующие процессы на портах 3000 и 80
echo "🛑 Остановка существующих процессов..."
sudo pkill -f "npm start" 2>/dev/null || true
sudo pkill -f "node.*react-scripts" 2>/dev/null || true
sudo fuser -k 3000/tcp 2>/dev/null || true
sudo fuser -k 80/tcp 2>/dev/null || true

# Остановить Docker контейнеры frontend если запущены
echo "🛑 Остановка Docker frontend контейнеров..."
cd ..
docker compose -f docker-compose.frontend.yml down 2>/dev/null || true
cd frontend

# Проверить установлены ли зависимости
if [ ! -d "node_modules" ]; then
    echo "📦 Установка зависимостей..."
    npm install
else
    echo "✅ Зависимости уже установлены"
fi

# Настройка переменных окружения
echo "⚙️  Настройка переменных окружения..."
export REACT_APP_API_URL=http://46.149.71.162:8000
export REACT_APP_WS_URL=ws://46.149.71.162:8000
export REACT_APP_USE_REAL_API=true
export PORT=3000
export HOST=0.0.0.0
export GENERATE_SOURCEMAP=false
export SKIP_PREFLIGHT_CHECK=true
export WDS_SOCKET_HOST=46.149.71.162
export WDS_SOCKET_PORT=3000

# Создать .env файл для React
cat > .env << EOF
REACT_APP_API_URL=http://46.149.71.162:8000
REACT_APP_WS_URL=ws://46.149.71.162:8000
REACT_APP_USE_REAL_API=true
PORT=3000
HOST=0.0.0.0
GENERATE_SOURCEMAP=false
SKIP_PREFLIGHT_CHECK=true
WDS_SOCKET_HOST=46.149.71.162
WDS_SOCKET_PORT=3000
EOF

echo "✅ Переменные окружения настроены"

# Запуск в фоне
echo "▶️  Запуск React development server..."
echo "📍 Сервер будет доступен на http://46.149.71.162:3000"

# Запуск npm start в фоне с логированием
nohup npm start > react-frontend.log 2>&1 &
REACT_PID=$!

echo "🆔 Process ID: $REACT_PID"
echo "$REACT_PID" > react-frontend.pid
cp react-frontend.pid ../react-frontend.pid 2>/dev/null || true

# Ожидание запуска
echo "⏳ Ожидание запуска React server (30 секунд)..."
sleep 30

# Проверка что процесс все еще работает
if ps -p $REACT_PID > /dev/null; then
    echo "✅ React процесс запущен (PID: $REACT_PID)"
else
    echo "❌ React процесс завершился. Проверьте логи:"
    if [ -f "react-frontend.log" ]; then
        echo "📋 Последние строки лога:"
        tail -20 react-frontend.log
    else
        echo "📋 Лог файл не найден"
    fi
    exit 1
fi

# Проверка доступности
echo ""
echo "🩺 Проверка доступности..."

# Даем дополнительное время для запуска
for i in {1..6}; do
    if curl -f -s --max-time 3 http://localhost:3000 >/dev/null 2>&1; then
        echo "✅ React frontend работает: http://46.149.71.162:3000"
        echo "✅ Development server успешно запущен"
        break
    else
        if [ $i -eq 6 ]; then
            echo "❌ React сервер не отвечает после ожидания"
            echo "📋 Проверьте логи:"
            if [ -f "react-frontend.log" ]; then
                echo "📄 Последние строки лога:"
                tail -15 react-frontend.log
            else
                echo "📄 Лог файл не найден"
            fi
            echo ""
            echo "🔍 Для диагностики запустите: ./debug-react-frontend.sh"
        else
            echo "⏳ Попытка $i/6 - ожидание ответа сервера..."
            sleep 5
        fi
    fi
done

echo ""
echo "🎉 React Frontend запущен!"
echo ""
echo "📋 Информация:"
echo "  URL:           http://46.149.71.162:3000"
echo "  PID:           $REACT_PID"
echo "  Логи:          tail -f frontend/react-frontend.log"
echo "  Backend API:   http://46.149.71.162:8000"
echo ""
echo "📋 Управление:"
echo "  Остановка:     kill $REACT_PID"
echo "  Остановка:     pkill -f 'npm start'"
echo "  Статус:        ps -p $REACT_PID"
echo "  Логи:          tail -f frontend/react-frontend.log"
echo ""
echo "💡 Для остановки также можно использовать:"
echo "   ./stop-react-frontend.sh"