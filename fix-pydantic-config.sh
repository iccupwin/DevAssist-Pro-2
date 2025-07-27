#!/bin/bash

# Исправление ошибки Pydantic в конфигурации

echo "🔧 Исправление Pydantic конфигурации"

cd backend/shared

# Создаем резервную копию
cp config.py config.py.backup

# Исправляем Config класс для BaseServiceSettings
sed -i '/class Config:/,/case_sensitive = False/ {
    /case_sensitive = False/a\
        extra = "ignore"  # Игнорировать дополнительные поля из env
}' config.py

# Исправляем Config класс для DatabaseSettings
sed -i '/class DatabaseSettings/,/class RedisSettings/ {
    /env_file = ".env"/a\
        extra = "ignore"
}' config.py

# Исправляем Config класс для RedisSettings
sed -i '/class RedisSettings/,/class AISettings/ {
    /env_file = ".env"/a\
        extra = "ignore"
}' config.py

# Исправляем Config класс для AISettings (если есть)
sed -i '/class AISettings/,$ {
    /env_file = ".env"/a\
        extra = "ignore"
}' config.py

echo "✅ Конфигурация исправлена"

# Показываем изменения
echo "📋 Проверим изменения:"
grep -A 3 "class Config:" config.py

echo ""
echo "🔄 Попробуйте запустить приложение снова"