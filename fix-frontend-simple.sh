#!/bin/bash

echo "⚡ ПРОСТОЕ ИСПРАВЛЕНИЕ FRONTEND"
echo "=============================="
echo ""

echo "🛑 Остановка зависшего build..."
docker buildx prune -f
docker system prune -f

echo ""
echo "🛑 Остановка всех frontend процессов..."
docker stop devassist-frontend 2>/dev/null || true
docker rm devassist-frontend 2>/dev/null || true
docker rmi devassist-frontend 2>/dev/null || true

echo ""
echo "📂 Переход в директорию frontend..."
cd frontend

echo ""
echo "🔧 Создание простого Dockerfile..."
cat > Dockerfile.simple << 'EOF'
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies to save memory
RUN npm ci --only=production --silent

# Copy source code
COPY . .

# Set environment variables
ENV NODE_ENV=development
ENV REACT_APP_API_URL=http://46.149.71.162:8000
ENV REACT_APP_WS_URL=ws://46.149.71.162:8000
ENV HOST=0.0.0.0
ENV PORT=3000
ENV GENERATE_SOURCEMAP=false
ENV DISABLE_ESLINT_PLUGIN=true

# Expose port
EXPOSE 3000

# Start with memory limit
CMD ["node", "--max_old_space_size=2048", "./node_modules/.bin/react-scripts", "start"]
EOF

echo "   ✅ Простой Dockerfile создан"

echo ""
echo "🚀 Быстрая сборка простого образа..."
docker build -f Dockerfile.simple -t devassist-frontend-simple . --no-cache

if [ $? -eq 0 ]; then
    echo "   ✅ Простой образ собран"
    
    echo ""
    echo "🚀 Запуск простого контейнера..."
    docker run -d \
        --name devassist-frontend \
        -p 3000:3000 \
        --memory="1g" \
        --memory-swap="1g" \
        --restart unless-stopped \
        devassist-frontend-simple
    
    if [ $? -eq 0 ]; then
        echo "   ✅ Контейнер запущен"
        
        echo ""
        echo "⏳ Ожидание запуска (45 секунд)..."
        sleep 45
        
        echo ""
        echo "📋 Логи запуска:"
        docker logs devassist-frontend --tail 15
        
        echo ""
        echo "🧪 БЫСТРОЕ ТЕСТИРОВАНИЕ"
        echo "======================"
        
        # Проверяем процессы в контейнере
        echo "🔍 Процессы в контейнере:"
        docker exec devassist-frontend ps aux | head -5
        
        echo ""
        echo "🔍 Тест доступности:"
        
        # Быстрый локальный тест
        LOCAL_TEST=$(curl -s --max-time 10 "http://localhost:3000" 2>/dev/null || echo "TIMEOUT")
        if echo "$LOCAL_TEST" | grep -qi "html\|doctype\|react\|<title\|loading"; then
            echo "   ✅ Frontend отвечает локально"
            LOCAL_OK=true
        else
            echo "   ❌ Frontend не отвечает локально"
            echo "   Ответ: $(echo "$LOCAL_TEST" | head -c 50)..."
            LOCAL_OK=false
        fi
        
        # Внешний тест
        EXT_TEST=$(curl -s --max-time 10 "http://46.149.71.162:3000" 2>/dev/null || echo "TIMEOUT")
        if echo "$EXT_TEST" | grep -qi "html\|doctype\|react\|<title\|loading"; then
            echo "   ✅ Frontend доступен извне"
            EXT_OK=true
        else
            echo "   ❌ Frontend не доступен извне"
            EXT_OK=false
        fi
        
        echo ""
        echo "📊 Статус контейнера:"
        docker ps --filter "name=devassist-frontend" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
        
        echo ""
        echo "🎯 РЕЗУЛЬТАТ:"
        echo "============"
        
        if [ "$LOCAL_OK" = true ] && [ "$EXT_OK" = true ]; then
            echo ""
            echo "🎉 FRONTEND РАБОТАЕТ!"
            echo ""
            echo "✅ Простой dev-server запущен"
            echo "✅ Локальный доступ: работает"  
            echo "✅ Внешний доступ: работает"
            echo ""
            echo "🌐 ВАШ FRONTEND ГОТОВ:"
            echo "   http://46.149.71.162:3000"
            echo ""
            echo "⚙️ BACKEND УЖЕ РАБОТАЕТ:"
            echo "   http://46.149.71.162:8000"
            echo ""
            echo "👤 ДАННЫЕ ДЛЯ ВХОДА:"
            echo "   📧 Email:    admin@devassist.pro"
            echo "   🔑 Password: admin123"
            echo ""
            echo "🎊 ГОТОВО К ИСПОЛЬЗОВАНИЮ!"
            
        elif [ "$LOCAL_OK" = true ]; then
            echo "⚠️  Работает локально, проблемы с внешним доступом"
            echo "   http://localhost:3000 - работает"
            echo "   http://46.149.71.162:3000 - недоступен"
            
        else
            echo "❌ ВСЕ ЕЩЕ ПРОБЛЕМЫ"
            echo ""
            echo "Попробуем увеличить время ожидания..."
            echo "Или проверим логи: docker logs devassist-frontend"
        fi
        
    else
        echo "   ❌ Ошибка запуска контейнера"
    fi
else
    echo "   ❌ Ошибка сборки простого образа"
fi

cd ..

echo ""
echo "📋 УПРАВЛЕНИЕ:"
echo "   Логи:        docker logs devassist-frontend"
echo "   Статус:      docker ps | grep frontend"
echo "   Перезапуск:  docker restart devassist-frontend"
echo "   Остановка:   docker stop devassist-frontend"

echo ""
echo "✅ Простое исправление завершено"