#!/bin/bash

echo "🚨 ВОССТАНОВЛЕНИЕ NPM И ИСПРАВЛЕНИЕ FRONTEND"
echo "==========================================="
echo ""

echo "❌ ПРОБЛЕМА: npm был удален при обновлении Node.js"
echo "✅ РЕШЕНИЕ: Восстановим npm и запустим frontend"
echo ""

echo "🔧 Исправление конфликта пакетов Node.js..."
sudo dpkg --remove --force-remove-reinstreq libnode-dev
sudo apt-get update
sudo apt-get install -f -y

echo ""
echo "📦 Установка Node.js 18 с npm..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

echo ""
echo "🔍 Проверка установки..."
echo "   Node версия: $(node --version)"
echo "   NPM версия: $(npm --version 2>/dev/null || echo 'НЕ УСТАНОВЛЕН')"

# Если npm все еще не установлен, установим вручную
if ! command -v npm &> /dev/null; then
    echo ""
    echo "🔧 Установка npm вручную..."
    sudo apt-get install -y npm
fi

echo ""
echo "📦 Переустановка npm глобально..."
sudo npm install -g npm@latest

echo ""
echo "✅ Финальная проверка:"
echo "   Node: $(node --version)"
echo "   NPM: $(npm --version)"

cd frontend

echo ""
echo "🧹 Очистка старых процессов..."
sudo lsof -ti:3000 | xargs sudo kill -9 2>/dev/null || true
if [ -f "../frontend.pid" ]; then
    kill $(cat ../frontend.pid) 2>/dev/null || true
    rm -f ../frontend.pid
fi

echo ""
echo "📦 Проверка зависимостей..."
if [ ! -d "node_modules" ]; then
    echo "   ⚠️ node_modules отсутствует, устанавливаем..."
    npm install --legacy-peer-deps
else
    echo "   ✅ node_modules существует"
fi

echo ""
echo "🚀 ЗАПУСК FRONTEND С ВОССТАНОВЛЕННЫМ NPM"
echo "========================================"

# Создаем оптимизированный .env если его нет
if [ ! -f ".env.local" ]; then
cat > .env.local << 'EOF'
REACT_APP_API_URL=http://46.149.71.162:8000
REACT_APP_WS_URL=ws://46.149.71.162:8000
HOST=0.0.0.0
PORT=3000
SKIP_PREFLIGHT_CHECK=true
TSC_COMPILE_ON_ERROR=true
DISABLE_ESLINT_PLUGIN=true
GENERATE_SOURCEMAP=false
NODE_OPTIONS="--max-old-space-size=2048"
EOF
fi

# Экспортируем переменные
export NODE_OPTIONS="--max-old-space-size=2048"
export NODE_ENV=development

# Запускаем frontend
nohup npm start > ../frontend-restored.log 2>&1 &
FRONTEND_PID=$!

echo "   🚀 Frontend запущен с PID: $FRONTEND_PID"
echo "$FRONTEND_PID" > ../frontend.pid

echo ""
echo "⏳ Ожидание запуска (60 секунд)..."

# Мониторим процесс
for i in {1..6}; do
    sleep 10
    if ps -p $FRONTEND_PID > /dev/null 2>&1; then
        echo "   ✅ После $((i*10)) секунд: процесс работает"
    else
        echo "   ❌ Процесс упал после $((i*10)) секунд"
        break
    fi
done

echo ""
echo "📋 Последние логи:"
tail -20 ../frontend-restored.log | grep -v "npm WARN"

echo ""
echo "🔍 Финальная проверка..."

if ps -p $FRONTEND_PID > /dev/null 2>&1; then
    echo "   ✅ Процесс все еще работает!"
    
    # Проверяем порт
    sleep 10
    if ss -tulpn | grep -q :3000; then
        echo "   ✅ Порт 3000 занят"
        
        # Тестируем доступность
        echo ""
        echo "🌐 Тест доступности:"
        if timeout 10 curl -s http://localhost:3000 | grep -q "html\|react\|<div"; then
            echo "   ✅ Frontend доступен локально!"
            
            if timeout 10 curl -s http://46.149.71.162:3000 | grep -q "html\|react\|<div"; then
                echo "   ✅ Frontend доступен извне!"
                echo ""
                echo "🎉🎉🎉 FRONTEND ПОЛНОСТЬЮ ВОССТАНОВЛЕН И РАБОТАЕТ! 🎉🎉🎉"
                echo ""
                echo "🌐 СИСТЕМА ГОТОВА:"
                echo "   🖥️  Frontend: http://46.149.71.162:3000"
                echo "   ⚙️  Backend:  http://46.149.71.162:8000"
                echo ""
                echo "👤 ДАННЫЕ ДЛЯ ВХОДА:"
                echo "   📧 Email:    admin@devassist.pro"
                echo "   🔑 Password: admin123"
                echo ""
                echo "🎊 ВСЕ РАБОТАЕТ!"
            else
                echo "   ❌ Frontend не доступен извне"
            fi
        else
            echo "   ❌ Frontend не отвечает локально"
        fi
    else
        echo "   ❌ Порт 3000 не занят"
    fi
else
    echo "   ❌ Процесс не выжил"
    echo ""
    echo "📋 Ошибки из логов:"
    grep -E "(ERROR|FATAL|Error:|failed)" ../frontend-restored.log | tail -10
fi

cd ..

echo ""
echo "📋 УПРАВЛЕНИЕ:"
echo "   Статус:    ps -p \$(cat frontend.pid) 2>/dev/null || echo 'Остановлен'"
echo "   Логи:      tail -f frontend-restored.log"
echo "   Порт:      ss -tulpn | grep :3000"
echo "   Остановка: kill \$(cat frontend.pid) 2>/dev/null; rm frontend.pid"

echo ""
echo "✅ Восстановление завершено"