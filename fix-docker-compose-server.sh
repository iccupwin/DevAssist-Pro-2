#!/bin/bash

# Быстрое исправление docker-compose.monolith.yml на сервере

echo "🔧 Исправление docker-compose.monolith.yml"

cd backend

# Создаем резервную копию
cp docker-compose.monolith.yml docker-compose.monolith.yml.backup

# Исправление 1: Добавление version если отсутствует
if ! grep -q "^version:" docker-compose.monolith.yml; then
    echo "📝 Добавляем version в начало файла..."
    echo -e "version: '3.8'\n\n$(cat docker-compose.monolith.yml)" > docker-compose.monolith.yml.tmp
    mv docker-compose.monolith.yml.tmp docker-compose.monolith.yml
fi

# Исправление 2: Заключение булевых и других значений в кавычки
echo "📝 Исправляем переменные окружения..."

sed -i 's/DEBUG: false/DEBUG: "false"/g' docker-compose.monolith.yml
sed -i 's/DEBUG: true/DEBUG: "true"/g' docker-compose.monolith.yml
sed -i 's/USE_REAL_API: true/USE_REAL_API: "true"/g' docker-compose.monolith.yml
sed -i 's/USE_REAL_API: false/USE_REAL_API: "false"/g' docker-compose.monolith.yml
sed -i 's/LOG_LEVEL: INFO/LOG_LEVEL: "INFO"/g' docker-compose.monolith.yml
sed -i 's/LOG_LEVEL: DEBUG/LOG_LEVEL: "DEBUG"/g' docker-compose.monolith.yml
sed -i 's/ENVIRONMENT: production/ENVIRONMENT: "production"/g' docker-compose.monolith.yml
sed -i 's/ENVIRONMENT: development/ENVIRONMENT: "development"/g' docker-compose.monolith.yml
sed -i 's/ADMIN_PASSWORD: admin123/ADMIN_PASSWORD: "admin123"/g' docker-compose.monolith.yml
sed -i 's/MAX_FILE_SIZE: 50MB/MAX_FILE_SIZE: "50MB"/g' docker-compose.monolith.yml
sed -i 's/SUPPORTED_FORMATS: pdf,docx,txt/SUPPORTED_FORMATS: "pdf,docx,txt"/g' docker-compose.monolith.yml

# Исправление 3: ALLOWED_ORIGINS
sed -i 's/ALLOWED_ORIGINS: http:/ALLOWED_ORIGINS: "http:/g' docker-compose.monolith.yml
sed -i 's/localhost:3001$/localhost:3001"/g' docker-compose.monolith.yml

# Исправление 4: API ключи
sed -i 's/ANTHROPIC_API_KEY: sk-ant/ANTHROPIC_API_KEY: "sk-ant/g' docker-compose.monolith.yml
sed -i 's/-shXPyAAA$/-shXPyAAA"/g' docker-compose.monolith.yml

echo "✅ Исправления применены"

# Проверка синтаксиса
echo "🔍 Проверка синтаксиса..."

if command -v docker-compose >/dev/null 2>&1; then
    DOCKER_COMPOSE="docker-compose"
else
    DOCKER_COMPOSE="docker compose"
fi

if $DOCKER_COMPOSE -f docker-compose.monolith.yml config >/dev/null 2>&1; then
    echo "✅ Конфигурация Docker Compose теперь валидна!"
    rm -f docker-compose.monolith.yml.backup
else
    echo "❌ Все еще есть проблемы с конфигурацией"
    echo "Восстанавливаем из резервной копии..."
    mv docker-compose.monolith.yml.backup docker-compose.monolith.yml
    echo "Показываем ошибки:"
    $DOCKER_COMPOSE -f docker-compose.monolith.yml config
    exit 1
fi

echo "🎉 Файл docker-compose.monolith.yml успешно исправлен!"