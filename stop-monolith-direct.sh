#!/bin/bash

# DevAssist Pro - Остановка прямого запуска монолитного backend

echo "🛑 DevAssist Pro - Остановка монолитного backend"

# Остановка по PID файлу
if [ -f "app.pid" ]; then
    PID=$(cat app.pid)
    echo "📋 Найден PID файл: $PID"
    
    if kill -0 $PID 2>/dev/null; then
        echo "🔄 Остановка процесса $PID..."
        kill $PID
        sleep 3
        
        if kill -0 $PID 2>/dev/null; then
            echo "⚡ Принудительная остановка..."
            kill -9 $PID
        fi
        
        echo "✅ Процесс остановлен"
    else
        echo "⚠️  Процесс с PID $PID уже не работает"
    fi
    
    rm -f app.pid
else
    echo "📁 PID файл не найден, останавливаем все процессы Python..."
fi

# Остановка всех процессов app
echo "🔍 Остановка всех процессов DevAssist Pro..."
pkill -f "python.*app.py" 2>/dev/null && echo "✅ Python процессы остановлены" || echo "ℹ️  Нет активных Python процессов"
pkill -f "uvicorn" 2>/dev/null && echo "✅ Uvicorn процессы остановлены" || echo "ℹ️  Нет активных Uvicorn процессов"

# Проверка что все остановлено
echo "🔍 Проверка что все остановлено..."
if curl -s http://localhost:8000/health >/dev/null 2>&1; then
    echo "⚠️  Backend все еще отвечает на порту 8000"
    echo "Возможно, запущен Docker контейнер?"
    echo "Попробуйте: docker ps | grep devassist"
else
    echo "✅ Backend успешно остановлен"
fi

echo ""
echo "📋 Для запуска снова используйте:"
echo "   ./start-monolith-direct.sh"
echo ""