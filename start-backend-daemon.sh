#!/bin/bash

echo "🚀 ЗАПУСК BACKEND В ФОНОВОМ РЕЖИМЕ"
echo "=================================="
echo ""

# Проверяем что мы в правильной директории
if [ ! -f "backend/app.py" ]; then
    echo "❌ Ошибка: запустите скрипт из корневой директории проекта"
    exit 1
fi

# Останавливаем старые процессы
echo "🛑 Останавливаем старые процессы..."
pkill -f "python.*app.py" 2>/dev/null || true
sudo fuser -k 8000/tcp 2>/dev/null || true
sleep 2

# Переходим в backend директорию
cd backend

# Настройка переменных окружения
export DATABASE_AVAILABLE=false
export ALLOWED_ORIGINS="http://46.149.71.162:3000,http://46.149.71.162,http://localhost:3000"
export CORS_ALLOW_CREDENTIALS=true

# API ключи
if [ -f "../.env.production" ]; then
    export ANTHROPIC_API_KEY=$(grep ANTHROPIC_API_KEY ../.env.production | cut -d= -f2)
    export OPENAI_API_KEY=$(grep OPENAI_API_KEY ../.env.production | cut -d= -f2)
    export GOOGLE_API_KEY=$(grep GOOGLE_API_KEY ../.env.production | cut -d= -f2)
fi

export USE_REAL_API=true
export LOG_LEVEL=INFO
export ENVIRONMENT=production
export DEBUG=false

# Создаем директории
mkdir -p data/reports data/uploads data/cache logs

# Активируем виртуальное окружение если есть
if [ -d "venv" ]; then
    source venv/bin/activate
fi

# Запускаем в фоновом режиме с логированием
LOG_FILE="logs/backend-$(date +%Y%m%d-%H%M%S).log"
echo "📝 Логи сохраняются в: backend/$LOG_FILE"

nohup python3 app.py > "$LOG_FILE" 2>&1 &
BACKEND_PID=$!

echo "🔄 Backend запущен с PID: $BACKEND_PID"
echo ""

# Ждем запуска
echo "⏳ Ожидание запуска (10 секунд)..."
sleep 10

# Проверяем статус
if kill -0 $BACKEND_PID 2>/dev/null; then
    echo "✅ Backend работает!"
    
    # Проверяем доступность
    if curl -f -s "http://localhost:8000/health" >/dev/null 2>&1; then
        echo "✅ Health check пройден"
        
        # Тест аутентификации
        echo ""
        echo "🔐 Тест аутентификации..."
        RESPONSE=$(curl -s -X POST http://localhost:8000/api/auth/login \
            -H "Content-Type: application/json" \
            -H "Origin: http://46.149.71.162:3000" \
            -d '{"email":"test@example.com","password":"test123"}' | head -50)
        
        if echo "$RESPONSE" | grep -q "access_token"; then
            echo "✅ Аутентификация работает!"
        else
            echo "⚠️  Аутентификация требует проверки"
            echo "Ответ: $RESPONSE"
        fi
    else
        echo "❌ Backend не отвечает на health check"
    fi
    
    echo ""
    echo "📋 Команды управления:"
    echo "   Остановить:    kill $BACKEND_PID"
    echo "   Логи:          tail -f backend/$LOG_FILE"
    echo "   Статус:        ps -p $BACKEND_PID"
    echo ""
    echo "🌐 URLs:"
    echo "   Frontend:      http://46.149.71.162:3000"
    echo "   Backend API:   http://46.149.71.162:8000"
    echo "   API Docs:      http://46.149.71.162:8000/docs"
    
    # Сохраняем PID
    echo $BACKEND_PID > backend/backend.pid
    echo ""
    echo "✅ PID сохранен в backend/backend.pid"
else
    echo "❌ Backend не запустился!"
    echo "📋 Проверьте логи: tail -f backend/$LOG_FILE"
    exit 1
fi