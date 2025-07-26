#!/bin/bash

# Быстрое исправление Pydantic на сервере

echo "🔧 Исправление Pydantic настроек..."

cd backend/shared

# Резервная копия
cp config.py config.py.backup

# Добавляем extra = "ignore" ко всем Config классам
sed -i '/env_file = "\.env"$/a\        extra = "ignore"' config.py

echo "✅ Настройки исправлены"

# Проверяем что исправления применились
if grep -q 'extra = "ignore"' config.py; then
    echo "✅ Настройка extra = \"ignore\" добавлена"
else
    echo "❌ Не удалось добавить настройку"
    echo "Восстанавливаем из резервной копии..."
    mv config.py.backup config.py
    exit 1
fi

echo "🚀 Теперь можно запускать приложение:"
echo "   cd ~/project && ./start-monolith-direct.sh"