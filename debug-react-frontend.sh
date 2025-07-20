#!/bin/bash

echo "🔍 Диагностика React Frontend"
echo "============================"

cd frontend

echo "📦 Проверка package.json..."
if [ -f "package.json" ]; then
    echo "✅ package.json найден"
    echo "📋 Scripts:"
    grep -A5 '"scripts"' package.json | head -10
else
    echo "❌ package.json не найден"
    exit 1
fi

echo ""
echo "📁 Проверка зависимостей..."
if [ -d "node_modules" ]; then
    echo "✅ node_modules существует"
    echo "📊 Размер: $(du -sh node_modules | cut -f1)"
else
    echo "❌ node_modules не найден"
    echo "💡 Запустите: npm install"
fi

echo ""
echo "🔧 Проверка Node.js и npm..."
echo "Node.js: $(node --version)"
echo "npm: $(npm --version)"

echo ""
echo "🌐 Проверка переменных окружения..."
echo "PORT: ${PORT:-не установлен}"
echo "HOST: ${HOST:-не установлен}"
echo "REACT_APP_API_URL: ${REACT_APP_API_URL:-не установлен}"

echo ""
echo "🚀 Тестовый запуск React (10 секунд)..."
export PORT=3000
export HOST=0.0.0.0
export REACT_APP_API_URL=http://46.149.71.162:8000
export SKIP_PREFLIGHT_CHECK=true

timeout 10 npm start 2>&1 | tee test-react.log || echo "Процесс завершён или прерван"

echo ""
echo "📋 Результат тестового запуска:"
if [ -f "test-react.log" ]; then
    echo "Последние строки:"
    tail -10 test-react.log
else
    echo "Лог не создан"
fi

echo ""
echo "🔍 Проверка портов..."
ss -tlnp | grep :3000 || echo "Порт 3000 не прослушивается"

echo ""
echo "📁 Файлы в директории frontend:"
ls -la | head -10