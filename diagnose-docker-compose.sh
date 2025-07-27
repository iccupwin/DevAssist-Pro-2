#!/bin/bash

# Диагностика конфигурации Docker Compose

echo "🔍 DevAssist Pro - Диагностика Docker Compose"
echo "=" * 50

# Переход в backend директорию
if [ ! -f "backend/docker-compose.monolith.yml" ]; then
    echo "❌ Файл backend/docker-compose.monolith.yml не найден!"
    exit 1
fi

cd backend

echo "📁 Проверка файла docker-compose.monolith.yml..."

# Проверка существования файла
if [ -f "docker-compose.monolith.yml" ]; then
    echo "✅ Файл существует"
    echo "📊 Размер файла: $(wc -c < docker-compose.monolith.yml) байт"
    echo "📝 Строк в файле: $(wc -l < docker-compose.monolith.yml)"
else
    echo "❌ Файл не найден!"
    exit 1
fi

echo ""
echo "🔍 Проверка синтаксиса YAML..."

# Проверка с помощью python
if command -v python3 >/dev/null 2>&1; then
    python3 -c "import yaml; yaml.safe_load(open('docker-compose.monolith.yml'))" 2>/dev/null
    if [ $? -eq 0 ]; then
        echo "✅ YAML синтаксис корректен"
    else
        echo "❌ YAML синтаксис некорректен!"
        echo "Ошибка:"
        python3 -c "import yaml; yaml.safe_load(open('docker-compose.monolith.yml'))" 2>&1
    fi
else
    echo "⚠️  Python3 не найден, пропускаем проверку YAML"
fi

echo ""
echo "🐳 Проверка Docker Compose конфигурации..."

# Определяем команду docker-compose
if command -v docker-compose >/dev/null 2>&1; then
    DOCKER_COMPOSE="docker-compose"
elif docker compose version >/dev/null 2>&1; then
    DOCKER_COMPOSE="docker compose"
else
    echo "❌ Docker Compose не найден!"
    exit 1
fi

echo "📦 Используем: $DOCKER_COMPOSE"

# Проверка конфигурации
echo "🔍 Проверка конфигурации..."
$DOCKER_COMPOSE -f docker-compose.monolith.yml config >/dev/null 2>config_error.log

if [ $? -eq 0 ]; then
    echo "✅ Конфигурация Docker Compose валидна!"
    rm -f config_error.log
else
    echo "❌ Конфигурация Docker Compose невалидна!"
    echo ""
    echo "🚨 Ошибки:"
    cat config_error.log
    echo ""
    echo "📋 Первые 50 строк файла:"
    head -50 docker-compose.monolith.yml | cat -n
    rm -f config_error.log
    exit 1
fi

echo ""
echo "✅ Диагностика завершена успешно!"