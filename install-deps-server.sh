#!/bin/bash

echo "📦 УСТАНОВКА ЗАВИСИМОСТЕЙ PYTHON"
echo "================================"
echo ""

cd backend

# Проверяем Python
python3 --version || { echo "❌ Python3 не установлен! Установите: sudo apt install python3 python3-pip"; exit 1; }

# Проверяем pip
echo "📋 Проверка pip..."
if ! command -v pip3 &> /dev/null; then
    echo "⚠️  pip3 не установлен, устанавливаем..."
    sudo apt update
    sudo apt install -y python3-pip
fi

# Создаем виртуальное окружение
if [ ! -d "venv" ]; then
    echo "🔨 Создание виртуального окружения..."
    python3 -m venv venv
fi

# Активируем виртуальное окружение
echo "🔄 Активация виртуального окружения..."
source venv/bin/activate

# Обновляем pip
echo "⬆️  Обновление pip..."
pip install --upgrade pip

# Устанавливаем зависимости
echo "📦 Установка зависимостей..."
if [ -f "requirements-monolith.txt" ]; then
    echo "   Устанавливаем из requirements-monolith.txt..."
    pip install -r requirements-monolith.txt
else
    echo "   Устанавливаем базовые зависимости..."
    pip install fastapi uvicorn pydantic python-multipart python-dotenv
    pip install anthropic openai google-generativeai
    pip install sqlalchemy psycopg2-binary alembic
fi

echo ""
echo "✅ Зависимости установлены!"
echo ""
echo "📋 Установленные пакеты:"
pip list | grep -E "(fastapi|uvicorn|pydantic|anthropic|openai)"

echo ""
echo "🚀 Теперь можно запускать backend:"
echo "   ./start-backend-daemon.sh"