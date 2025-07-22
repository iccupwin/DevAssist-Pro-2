#!/bin/bash

echo "🚀 ЗАПУСК BACKEND НА СЕРВЕРЕ"
echo "============================"
echo ""

# Проверяем что мы в правильной директории
if [ ! -f "backend/app.py" ]; then
    echo "❌ Ошибка: запустите скрипт из корневой директории проекта"
    exit 1
fi

# Останавливаем старые процессы на порту 8000
echo "🛑 Останавливаем процессы на порту 8000..."
sudo fuser -k 8000/tcp 2>/dev/null || true
sleep 2

# Переходим в backend директорию
cd backend

# Проверяем наличие Python
echo "🐍 Проверка Python..."
if ! command -v python3 &> /dev/null; then
    echo "❌ Python3 не установлен!"
    echo "   Установите: sudo apt install python3 python3-pip"
    exit 1
fi

PYTHON_VERSION=$(python3 --version)
echo "   ✅ $PYTHON_VERSION"

# Устанавливаем переменные окружения
echo ""
echo "🔧 Настройка переменных окружения..."
export DATABASE_AVAILABLE=false
export ALLOWED_ORIGINS="http://46.149.71.162:3000,http://46.149.71.162,http://localhost:3000"
export CORS_ALLOW_CREDENTIALS=true

# Читаем API ключи из .env.production
if [ -f "../.env.production" ]; then
    export ANTHROPIC_API_KEY=$(grep ANTHROPIC_API_KEY ../.env.production | cut -d= -f2)
    export OPENAI_API_KEY=$(grep OPENAI_API_KEY ../.env.production | cut -d= -f2)
    export GOOGLE_API_KEY=$(grep GOOGLE_API_KEY ../.env.production | cut -d= -f2)
    echo "   ✅ API ключи загружены из .env.production"
else
    echo "   ⚠️  .env.production не найден, используем тестовые ключи"
    export ANTHROPIC_API_KEY="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"
fi

export USE_REAL_API=true
export LOG_LEVEL=INFO
export ENVIRONMENT=production
export DEBUG=false

# Проверяем и устанавливаем зависимости
echo ""
echo "📦 Проверка зависимостей Python..."
if ! python3 -c "import fastapi" 2>/dev/null; then
    echo "   ⚠️  Зависимости не установлены. Устанавливаем..."
    
    # Создаем виртуальное окружение если его нет
    if [ ! -d "venv" ]; then
        echo "   Создаем виртуальное окружение..."
        python3 -m venv venv
    fi
    
    # Активируем виртуальное окружение
    source venv/bin/activate
    
    # Обновляем pip
    pip install --upgrade pip
    
    # Устанавливаем зависимости
    if [ -f "requirements-monolith.txt" ]; then
        echo "   Устанавливаем из requirements-monolith.txt..."
        pip install -r requirements-monolith.txt
    else
        echo "   Устанавливаем минимальные зависимости..."
        pip install fastapi uvicorn pydantic python-multipart python-dotenv
        pip install anthropic openai google-generativeai
        pip install sqlalchemy psycopg2-binary alembic
    fi
else
    echo "   ✅ Зависимости уже установлены"
    
    # Активируем виртуальное окружение если оно есть
    if [ -d "venv" ]; then
        source venv/bin/activate
    fi
fi

# Создаем необходимые директории
echo ""
echo "📁 Создание директорий..."
mkdir -p data/reports data/uploads data/cache
echo "   ✅ Директории созданы"

# Запускаем приложение
echo ""
echo "🚀 Запуск backend на порту 8000..."
echo "=================================="
echo "   Frontend URL: http://46.149.71.162:3000"
echo "   Backend URL:  http://46.149.71.162:8000"
echo "   API Docs:     http://46.149.71.162:8000/docs"
echo ""
echo "📋 Логи:"
echo ""

# Запускаем Python приложение
python3 app.py

# Если приложение завершилось
echo ""
echo "❌ Backend остановлен"