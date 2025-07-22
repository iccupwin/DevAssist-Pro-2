#!/bin/bash

echo "🛑 ОСТАНОВКА BACKEND"
echo "==================="
echo ""

# Останавливаем по PID если файл существует
if [ -f "backend/backend.pid" ]; then
    PID=$(cat backend/backend.pid)
    echo "📋 Останавливаем процесс PID: $PID"
    
    if kill -0 $PID 2>/dev/null; then
        kill $PID
        sleep 2
        
        if kill -0 $PID 2>/dev/null; then
            echo "⚠️  Принудительная остановка..."
            kill -9 $PID
        fi
        
        echo "✅ Процесс $PID остановлен"
    else
        echo "⚠️  Процесс $PID уже не работает"
    fi
    
    rm -f backend/backend.pid
else
    echo "📋 Поиск процессов backend..."
fi

# Останавливаем все процессы python app.py
pkill -f "python.*app.py" 2>/dev/null && echo "✅ Python процессы остановлены" || echo "⚠️  Python процессы не найдены"

# Освобождаем порт 8000
sudo fuser -k 8000/tcp 2>/dev/null && echo "✅ Порт 8000 освобожден" || echo "⚠️  Порт 8000 уже свободен"

echo ""
echo "✅ Backend остановлен"