#!/bin/bash

echo "🔧 УДАЛЕНИЕ ПРОБЛЕМНЫХ СТРОК ЛОГИРОВАНИЯ"
echo "========================================"
echo ""

# Создаем простой патч который удаляет проблемные строки
cat > remove_logging.py << 'EOF'
#!/usr/bin/env python3

# Читаем файл app.py
with open('/app/app.py', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Удаляем проблемные строки с логированием
new_lines = []
skip_next = False

for i, line in enumerate(lines):
    # Пропускаем строки с проблемным логированием
    if ('response.get(\'success\', False)' in line and 
        ('Регистрация пользователя' in line or 'Вход пользователя' in line)):
        print(f"Удаляем проблемную строку {i+1}: {line.strip()}")
        continue
    new_lines.append(line)

# Записываем исправленный файл
with open('/app/app.py', 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

print("✅ Проблемные строки логирования удалены!")
EOF

echo "🛑 Остановка backend..."
docker stop devassist_app_monolith 2>/dev/null || true

echo ""
echo "🔧 Удаление проблемных строк..."
docker cp remove_logging.py devassist_app_monolith:/tmp/
docker start devassist_app_monolith
sleep 5
docker exec devassist_app_monolith python /tmp/remove_logging.py

echo ""
echo "🔄 Перезапуск backend..."
docker restart devassist_app_monolith

echo ""
echo "⏳ Ожидание запуска (20 секунд)..."
sleep 20

echo ""
echo "🧪 ТЕСТ ОСНОВНЫХ ФУНКЦИЙ"
echo "========================"

# Health Check
echo "🔍 Health Check:"
HEALTH=$(curl -s --max-time 10 "http://localhost:8000/health" 2>/dev/null || echo "TIMEOUT")
if echo "$HEALTH" | grep -q "healthy"; then
    echo "   ✅ РАБОТАЕТ"
    HEALTH_OK=true
else
    echo "   ❌ НЕ РАБОТАЕТ"
    HEALTH_OK=false
fi

if [ "$HEALTH_OK" = true ]; then
    # Authentication Test
    echo "🔐 Authentication:"
    AUTH=$(curl -s -X POST \
        -H "Content-Type: application/json" \
        -H "Origin: http://46.149.71.162:3000" \
        -d '{"email":"admin@devassist.pro","password":"admin123"}' \
        "http://localhost:8000/api/auth/login" 2>/dev/null || echo "TIMEOUT")
    
    if echo "$AUTH" | grep -q '"success":true'; then
        echo "   ✅ РАБОТАЕТ"
        AUTH_OK=true
    else
        echo "   ❌ НЕ РАБОТАЕТ"
        echo "   Ответ: $(echo "$AUTH" | head -c 80)..."
        AUTH_OK=false
    fi
    
    # CORS Test
    echo "🌐 CORS:"
    CORS=$(curl -s -i -X OPTIONS \
        -H "Origin: http://46.149.71.162:3000" \
        -H "Access-Control-Request-Method: POST" \
        "http://localhost:8000/api/auth/login" 2>/dev/null || echo "TIMEOUT")
    
    if echo "$CORS" | grep -qi "access-control-allow-origin.*46.149.71.162"; then
        echo "   ✅ РАБОТАЕТ"
        CORS_OK=true
    else
        echo "   ❌ НЕ РАБОТАЕТ"
        CORS_OK=false
    fi
    
    # External Access
    echo "🌍 External Access:"
    EXT=$(curl -s --max-time 10 "http://46.149.71.162:8000/health" 2>/dev/null || echo "TIMEOUT")
    if echo "$EXT" | grep -q "healthy"; then
        echo "   ✅ РАБОТАЕТ"
        EXT_OK=true
    else
        echo "   ❌ НЕ РАБОТАЕТ"
        EXT_OK=false
    fi
else
    AUTH_OK=false
    CORS_OK=false
    EXT_OK=false
fi

echo ""
echo "🎯 ФИНАЛЬНЫЙ РЕЗУЛЬТАТ:"
echo "======================"

if [ "$HEALTH_OK" = true ] && [ "$AUTH_OK" = true ] && [ "$CORS_OK" = true ] && [ "$EXT_OK" = true ]; then
    echo ""
    echo "🎉🎉🎉 ПОЛНЫЙ УСПЕХ! 🎉🎉🎉"
    echo ""
    echo "✅ Health Check: работает"
    echo "✅ Authentication: работает"
    echo "✅ CORS: работает"
    echo "✅ External Access: работает"
    echo ""
    echo "🌐 СИСТЕМА ГОТОВА К РАБОТЕ:"
    echo ""
    echo "   Frontend:     http://46.149.71.162:3000"
    echo "   Backend:      http://46.149.71.162:8000"
    echo "   API Docs:     http://46.149.71.162:8000/docs"
    echo ""
    echo "👤 ДАННЫЕ ДЛЯ ВХОДА:"
    echo "   Email:    admin@devassist.pro"
    echo "   Password: admin123"
    echo ""
    echo "🎊 ВСЕ ГОТОВО ДЛЯ ИСПОЛЬЗОВАНИЯ!"
    
elif [ "$HEALTH_OK" = true ]; then
    echo "⚠️  ЧАСТИЧНО РАБОТАЕТ:"
    echo ""
    echo "✅ Backend: запущен"
    [ "$AUTH_OK" != true ] && echo "❌ Authentication: проблема"
    [ "$CORS_OK" != true ] && echo "❌ CORS: проблема"
    [ "$EXT_OK" != true ] && echo "❌ External Access: проблема"
    
else
    echo "❌ BACKEND НЕ ЗАПУЩЕН"
    echo ""
    echo "Логи для диагностики:"
    docker logs devassist_app_monolith 2>&1 | tail -10
fi

# Очистка
rm -f remove_logging.py
docker exec devassist_app_monolith rm -f /tmp/remove_logging.py 2>/dev/null || true

echo ""
echo "✅ Исправление завершено"