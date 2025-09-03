#!/bin/bash

# Исправление Docker на сервере

echo "🔧 DevAssist Pro - Исправление Docker"
echo "=" * 50

# Проверка статуса Docker
echo "📊 Проверка статуса Docker..."
systemctl status docker --no-pager || true

echo ""
echo "🔍 Проверка Docker daemon..."
if ! docker info >/dev/null 2>&1; then
    echo "❌ Docker daemon недоступен"
    
    echo "🚀 Запуск Docker daemon..."
    systemctl start docker
    sleep 3
    
    if docker info >/dev/null 2>&1; then
        echo "✅ Docker daemon запущен"
    else
        echo "❌ Не удалось запустить Docker daemon"
        echo "Попробуем перезапустить..."
        systemctl restart docker
        sleep 5
        
        if docker info >/dev/null 2>&1; then
            echo "✅ Docker daemon успешно перезапущен"
        else
            echo "❌ Docker daemon все еще недоступен"
            echo "Проверим логи Docker:"
            journalctl -u docker --no-pager -l --since "5 minutes ago"
            exit 1
        fi
    fi
else
    echo "✅ Docker daemon работает"
fi

# Проверка версий
echo ""
echo "📋 Информация о Docker:"
echo "Docker версия: $(docker --version)"
echo "Docker Compose версия: $(docker-compose --version)"

# Проверка разрешений
echo ""
echo "👤 Проверка разрешений пользователя..."
if groups | grep -q docker; then
    echo "✅ Пользователь в группе docker"
else
    echo "⚠️  Добавляем пользователя в группу docker..."
    usermod -aG docker $USER
    echo "✅ Пользователь добавлен в группу docker"
    echo "ℹ️  Может потребоваться перелогинивание"
fi

# Тест Docker
echo ""
echo "🧪 Тестирование Docker..."
if docker run --rm hello-world >/dev/null 2>&1; then
    echo "✅ Docker работает корректно"
else
    echo "❌ Docker test failed"
    echo "Попробуем еще раз..."
    docker run --rm hello-world
fi

# Проверка Docker Compose
echo ""
echo "🧪 Тестирование Docker Compose..."
cd ~/project/backend
if docker-compose -f docker-compose.monolith.yml config >/dev/null 2>&1; then
    echo "✅ Docker Compose конфигурация валидна"
else
    echo "❌ Docker Compose конфигурация невалидна"
    echo "Показываем ошибки:"
    docker-compose -f docker-compose.monolith.yml config
fi

echo ""
echo "🎉 Диагностика Docker завершена!"