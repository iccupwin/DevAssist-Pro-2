#!/bin/bash
# Простой запуск backend без Docker и БД

echo "🚀 Запуск Backend в простом режиме"
echo "================================="

# Переходим в директорию backend
cd backend

# Устанавливаем переменные окружения
export DATABASE_AVAILABLE=false
export ALLOWED_ORIGINS="http://46.149.71.162:3000,http://46.149.71.162,http://localhost:3000"
export CORS_ALLOW_CREDENTIALS=true
export ANTHROPIC_API_KEY=$(grep ANTHROPIC_API_KEY ../.env.production | cut -d= -f2)
export OPENAI_API_KEY=$(grep OPENAI_API_KEY ../.env.production | cut -d= -f2)
export USE_REAL_API=true

# Запускаем Python приложение
echo "Запуск app.py..."
python3 app.py