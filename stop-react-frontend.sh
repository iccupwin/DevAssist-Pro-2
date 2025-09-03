#!/bin/bash

echo "🛑 Остановка React Frontend"
echo "==========================="

# Остановка по PID файлу
if [ -f "react-frontend.pid" ]; then
    PID=$(cat react-frontend.pid)
    echo "🔍 Найден PID: $PID"
    
    if ps -p $PID > /dev/null; then
        echo "⏹️  Остановка процесса $PID..."
        kill $PID
        sleep 3
        
        if ps -p $PID > /dev/null; then
            echo "🔨 Принудительная остановка..."
            kill -9 $PID
        fi
        
        echo "✅ Процесс остановлен"
    else
        echo "⚠️  Процесс с PID $PID уже не работает"
    fi
    
    rm -f react-frontend.pid
else
    echo "📂 PID файл не найден"
fi

# Остановка всех npm start процессов
echo "🧹 Очистка всех npm start процессов..."
sudo pkill -f "npm start" 2>/dev/null || true
sudo pkill -f "node.*react-scripts" 2>/dev/null || true

# Освобождение порта 3000
echo "🔓 Освобождение порта 3000..."
sudo fuser -k 3000/tcp 2>/dev/null || true

echo ""
echo "✅ React Frontend остановлен"
echo "📋 Порт 3000 освобожден"