#!/bin/bash

echo "🔧 БАЗОВОЕ ИСПРАВЛЕНИЕ FRONTEND (попытка #4)"
echo "===========================================" 
echo ""
echo "❌ НЕУДАЧНЫЕ ПОПЫТКИ:"
echo "   1. ❌ Dev server (зависает)"
echo "   2. ❌ Production build (зависает на npm run build)"
echo "   3. ❌ npm ci --only=production (ошибка установки)"
echo ""
echo "🎯 ТЕКУЩАЯ ПОПЫТКА: Базовый npm install"
echo ""

echo "🛑 Очистка..."
docker stop devassist-frontend 2>/dev/null || true
docker rm devassist-frontend 2>/dev/null || true
docker rmi devassist-frontend-basic 2>/dev/null || true

cd frontend

echo ""
echo "🔧 Создание максимально простого Dockerfile..."
cat > Dockerfile.basic << 'EOF'
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

# Базовая установка с таймаутом
RUN npm config set registry https://registry.npmjs.org/ && \
    npm install --timeout=300000

COPY . .

ENV NODE_ENV=development
ENV REACT_APP_API_URL=http://46.149.71.162:8000
ENV HOST=0.0.0.0
ENV PORT=3000

EXPOSE 3000

CMD ["npm", "start"]
EOF

echo "   ✅ Базовый Dockerfile создан"

echo ""
echo "🚀 Базовая сборка (5 минут таймаут)..."
timeout 300 docker build -f Dockerfile.basic -t devassist-frontend-basic . --no-cache

if [ $? -eq 0 ]; then
    echo "   ✅ Базовый образ собран"
    
    echo ""
    echo "🚀 Запуск с большим таймаутом..."
    docker run -d \
        --name devassist-frontend \
        -p 3000:3000 \
        --memory="2g" \
        devassist-frontend-basic
    
    if [ $? -eq 0 ]; then
        echo "   ✅ Контейнер запущен"
        
        echo ""
        echo "⏳ Ожидание 90 секунд..."
        sleep 90
        
        echo ""
        echo "📋 Статус контейнера:"
        docker ps | grep frontend || echo "   Контейнер не найден"
        
        echo ""
        echo "📋 Последние логи:"
        docker logs devassist-frontend --tail 10 2>/dev/null || echo "   Нет логов"
        
        echo ""
        echo "🧪 ТЕСТИРОВАНИЕ:"
        LOCAL=$(curl -s --connect-timeout 5 --max-time 10 http://localhost:3000 2>/dev/null | head -c 20)
        if [ -n "$LOCAL" ]; then
            echo "   ✅ РАБОТАЕТ! Ответ: $LOCAL..."
            echo ""
            echo "🎉 FRONTEND ЗАПУЩЕН:"
            echo "   http://46.149.71.162:3000"
            echo "   http://localhost:3000"
        else
            echo "   ❌ НЕ ОТВЕЧАЕТ"
        fi
        
    else
        echo "   ❌ Ошибка запуска контейнера"
        echo ""
        echo "📋 ОБНОВЛЕННЫЙ ЧЕК-ЛИСТ НЕУДАЧ:"
        echo "   1. ❌ Dev server (зависает)"
        echo "   2. ❌ Production build (зависает)"
        echo "   3. ❌ npm ci --only=production (ошибка)"
        echo "   4. ❌ Базовый npm install (ошибка запуска)"
    fi
    
elif [ $? -eq 124 ]; then
    echo "   ❌ Таймаут сборки (5 минут)"
    echo ""
    echo "📋 ОБНОВЛЕННЫЙ ЧЕК-ЛИСТ НЕУДАЧ:"
    echo "   1. ❌ Dev server (зависает)"
    echo "   2. ❌ Production build (зависает)"
    echo "   3. ❌ npm ci --only=production (ошибка)"
    echo "   4. ❌ Базовый npm install (таймаут сборки)"
else
    echo "   ❌ Ошибка сборки"
    echo ""
    echo "📋 ОБНОВЛЕННЫЙ ЧЕК-ЛИСТ НЕУДАЧ:"
    echo "   1. ❌ Dev server (зависает)"
    echo "   2. ❌ Production build (зависает)"
    echo "   3. ❌ npm ci --only=production (ошибка)"
    echo "   4. ❌ Базовый npm install (ошибка сборки)"
fi

cd ..

echo ""
echo "💡 ЕСЛИ ЭТО НЕ РАБОТАЕТ, ПОПРОБУЕМ:"
echo "   5. Локальный запуск без Docker"
echo "   6. Использование готового образа"
echo "   7. Прямой nginx с готовыми файлами"

echo ""
echo "✅ Базовая попытка завершена"