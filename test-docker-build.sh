#!/bin/bash

echo "🔍 Тестирование Docker сборки Frontend"
echo "====================================="

cd frontend

echo "📦 Проверка package.json и .npmrc..."
echo "package.json: $(ls -la package.json 2>/dev/null || echo 'НЕ НАЙДЕН')"
echo ".npmrc: $(ls -la .npmrc 2>/dev/null || echo 'НЕ НАЙДЕН')"

echo ""
echo "📋 Содержимое .npmrc:"
cat .npmrc 2>/dev/null || echo "Файл не найден"

echo ""
echo "🏗️  Тестовая сборка Docker образа..."
docker build -f Dockerfile.dev -t test-frontend-dev . --progress=plain

if [ $? -eq 0 ]; then
    echo "✅ Сборка успешна!"
    echo ""
    echo "🧪 Тестовый запуск контейнера..."
    docker run --rm -d --name test-frontend -p 3001:3000 test-frontend-dev
    
    if [ $? -eq 0 ]; then
        echo "✅ Контейнер запущен на порту 3001"
        sleep 30
        
        echo "🩺 Проверка доступности..."
        if curl -f -s --max-time 5 http://localhost:3001 >/dev/null 2>&1; then
            echo "✅ Frontend работает в Docker!"
        else
            echo "⚠️  Frontend еще запускается или есть проблемы"
        fi
        
        echo "📋 Логи контейнера:"
        docker logs test-frontend | tail -10
        
        echo "🛑 Остановка тестового контейнера..."
        docker stop test-frontend
    else
        echo "❌ Ошибка запуска контейнера"
    fi
else
    echo "❌ Ошибка сборки Docker образа"
fi

cd ..