#!/bin/bash

echo "🚀 ПРОСТОЙ ЗАПУСК BACKEND"
echo "========================"
echo ""

# Останавливаем старые процессы
pkill -f "python.*app.py" 2>/dev/null || true
sudo fuser -k 8000/tcp 2>/dev/null || true

cd backend

# Активируем виртуальное окружение
if [ -d "venv" ]; then
    echo "🔄 Активация виртуального окружения..."
    source venv/bin/activate
fi

# Проверяем зависимости
if ! python3 -c "import fastapi, uvicorn" 2>/dev/null; then
    echo "❌ Зависимости не установлены!"
    echo ""
    echo "Установите их командой:"
    echo "  ./install-deps-server.sh"
    echo ""
    exit 1
fi

# Настройка переменных окружения
export DATABASE_AVAILABLE=false
export ALLOWED_ORIGINS="http://46.149.71.162:3000,http://46.149.71.162,http://localhost:3000"
export CORS_ALLOW_CREDENTIALS=true
export USE_REAL_API=true
export LOG_LEVEL=INFO
export DEBUG=false

# API ключи
if [ -f "../.env.production" ]; then
    export ANTHROPIC_API_KEY=$(grep ANTHROPIC_API_KEY ../.env.production | cut -d= -f2)
fi

# Создаем директории
mkdir -p data/reports data/uploads data/cache logs

echo "🚀 Запуск backend на порту 8000..."
echo ""
echo "📋 Для остановки нажмите Ctrl+C"
echo ""

# Запускаем
python3 app.py