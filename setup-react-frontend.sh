#!/bin/bash

set -e

echo "📦 Подготовка React Frontend для DevAssist Pro"
echo "=============================================="

# Проверить что мы в правильной директории
if [ ! -d "frontend" ]; then
    echo "❌ Папка frontend не найдена"
    exit 1
fi

cd frontend

echo "🔍 Проверка зависимостей..."

# Удалить node_modules и package-lock если есть проблемы
if [ "$1" = "--clean" ]; then
    echo "🧹 Очистка существующих зависимостей..."
    rm -rf node_modules package-lock.json
fi

# Установка зависимостей
if [ ! -d "node_modules" ] || [ "$1" = "--reinstall" ]; then
    echo "📦 Установка зависимостей..."
    npm install
else
    echo "✅ Зависимости уже установлены"
fi

# Проверка на критические уязвимости
echo "🔒 Проверка безопасности..."
npm audit --audit-level=high || echo "⚠️  Найдены уязвимости, но продолжаем..."

echo ""
echo "✅ Frontend подготовлен к запуску!"
echo ""
echo "📋 Следующие шаги:"
echo "  1. Запуск:     ./start-react-frontend.sh"
echo "  2. Остановка:  ./stop-react-frontend.sh"
echo ""
echo "💡 Флаги для setup:"
echo "  --clean      Удалить node_modules и переустановить"
echo "  --reinstall  Переустановить зависимости"