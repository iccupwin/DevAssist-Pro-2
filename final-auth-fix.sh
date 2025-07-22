#!/bin/bash

echo "🎯 ФИНАЛЬНОЕ ИСПРАВЛЕНИЕ АУТЕНТИФИКАЦИИ"
echo "======================================="
echo ""

echo "🔧 Исправляем синтаксическую ошибку в backend/app.py"
echo ""

# Создаем корректный патч-файл
cat > fix_auth_final.py << 'EOF'
#!/usr/bin/env python3

# Читаем файл app.py
with open('/app/app.py', 'r', encoding='utf-8') as f:
    content = f.read()

# Исправляем строку 1049 и 1063
lines = content.split('\n')

for i, line in enumerate(lines):
    if 'response.get(\'success\', False) if isinstance(response, dict) else response.success' in line:
        # Исправляем неправильный f-string
        if 'Регистрация пользователя' in line:
            lines[i] = '        success = response.get(\'success\', False) if isinstance(response, dict) else getattr(response, \'success\', False)'
            lines.insert(i+1, '        logger.info(f"Регистрация пользователя {user_data.email}: {\'успешно\' if success else \'неудача\'}")')
        elif 'Вход пользователя' in line:
            lines[i] = '        success = response.get(\'success\', False) if isinstance(response, dict) else getattr(response, \'success\', False)'
            lines.insert(i+1, '        logger.info(f"Вход пользователя {login_data.email}: {\'успешно\' if success else \'неудача\'}")')

# Записываем исправленный файл
with open('/app/app.py', 'w', encoding='utf-8') as f:
    f.write('\n'.join(lines))

print("✅ Синтаксические ошибки исправлены!")
EOF

echo "🛑 Остановка backend..."
docker stop devassist_app_monolith 2>/dev/null || true

echo ""
echo "🔧 Применение исправлений..."
docker cp fix_auth_final.py devassist_app_monolith:/tmp/
docker start devassist_app_monolith
sleep 5
docker exec devassist_app_monolith python /tmp/fix_auth_final.py

echo ""
echo "🔄 Перезапуск backend..."
docker restart devassist_app_monolith

echo ""
echo "⏳ Ожидание запуска (30 секунд)..."
sleep 30

echo ""
echo "🧪 ФИНАЛЬНЫЕ ТЕСТЫ ВСЕХ СИСТЕМ"
echo "=============================="

# 1. Health Check
echo "🔍 1. Health Check Test:"
HEALTH=$(curl -s --max-time 10 "http://localhost:8000/health" 2>/dev/null || echo "TIMEOUT")
if echo "$HEALTH" | grep -q "healthy"; then
    echo "   ✅ Health Check: работает"
    HEALTH_OK=true
else
    echo "   ❌ Health Check: недоступен"
    HEALTH_OK=false
fi

# 2. CORS Test
echo "🌐 2. CORS Preflight Test:"
CORS=$(curl -s -i -X OPTIONS \
    -H "Origin: http://46.149.71.162:3000" \
    -H "Access-Control-Request-Method: POST" \
    -H "Access-Control-Request-Headers: Content-Type" \
    "http://localhost:8000/api/auth/login" 2>/dev/null || echo "TIMEOUT")

if echo "$CORS" | grep -qi "access-control-allow-origin.*46.149.71.162"; then
    echo "   ✅ CORS: работает для frontend"
    CORS_OK=true
else
    echo "   ❌ CORS: проблема"
    CORS_OK=false
fi

# 3. Authentication Test
echo "🔐 3. Authentication Test:"
AUTH=$(curl -s -X POST \
    -H "Content-Type: application/json" \
    -H "Origin: http://46.149.71.162:3000" \
    -d '{"email":"admin@devassist.pro","password":"admin123"}' \
    "http://localhost:8000/api/auth/login" 2>/dev/null || echo "TIMEOUT")

if echo "$AUTH" | grep -q '"success":true' && echo "$AUTH" | grep -q '"token":'; then
    echo "   ✅ Authentication: работает"
    AUTH_OK=true
else
    echo "   ❌ Authentication: проблема"
    echo "   Ответ: $(echo "$AUTH" | head -c 100)..."
    AUTH_OK=false
fi

# 4. Registration Test
echo "👤 4. Registration Test:"
REG=$(curl -s -X POST \
    -H "Content-Type: application/json" \
    -H "Origin: http://46.149.71.162:3000" \
    -d '{"email":"newuser@test.com","password":"test123","full_name":"New User","company":"Test"}' \
    "http://localhost:8000/api/auth/register" 2>/dev/null || echo "TIMEOUT")

if echo "$REG" | grep -q '"success":true'; then
    echo "   ✅ Registration: работает"
    REG_OK=true
else
    echo "   ❌ Registration: проблема"
    REG_OK=false
fi

# 5. External Access Test
echo "🌍 5. External Access Test:"
EXT=$(curl -s --max-time 10 "http://46.149.71.162:8000/health" 2>/dev/null || echo "TIMEOUT")
if echo "$EXT" | grep -q "healthy"; then
    echo "   ✅ External Access: работает"
    EXT_OK=true
else
    echo "   ❌ External Access: недоступен"
    EXT_OK=false
fi

echo ""
echo "🎯 ИТОГОВЫЙ РЕЗУЛЬТАТ:"
echo "====================="

if [ "$HEALTH_OK" = true ] && [ "$CORS_OK" = true ] && [ "$AUTH_OK" = true ] && [ "$REG_OK" = true ] && [ "$EXT_OK" = true ]; then
    echo ""
    echo "🎉🎉🎉 ПОЛНЫЙ УСПЕХ! ВСЕ СИСТЕМЫ РАБОТАЮТ! 🎉🎉🎉"
    echo ""
    echo "✅ Health Check: работает"
    echo "✅ CORS: настроен для frontend" 
    echo "✅ Authentication: полностью функционирует"
    echo "✅ Registration: принимает новых пользователей"
    echo "✅ External Access: доступен извне"
    echo ""
    echo "🌐 ГОТОВО К ПРОИЗВОДСТВЕННОМУ ИСПОЛЬЗОВАНИЮ:"
    echo ""
    echo "   🖥️  Frontend URL:     http://46.149.71.162:3000"
    echo "   🔧 Backend API:      http://46.149.71.162:8000"
    echo "   📚 API Documentation: http://46.149.71.162:8000/docs"
    echo "   💓 Health Check:     http://46.149.71.162:8000/health"
    echo ""
    echo "👤 УЧЕТНЫЕ ДАННЫЕ ДЛЯ ВХОДА:"
    echo "   📧 Email:    admin@devassist.pro"
    echo "   🔑 Password: admin123"
    echo ""
    echo "🚀 ФУНКЦИОНАЛЬНОСТЬ FRONTEND:"
    echo "   ✅ Регистрация новых пользователей"
    echo "   ✅ Авторизация существующих пользователей"
    echo "   ✅ Все API запросы без CORS ошибок"
    echo "   ✅ Полный доступ к DevAssist Pro функциям"
    echo ""
    echo "🎊 ПРОЕКТ ГОТОВ К РАБОТЕ!"
    
elif [ "$HEALTH_OK" = true ]; then
    echo "⚠️  ЧАСТИЧНЫЙ УСПЕХ"
    echo ""
    [ "$CORS_OK" != true ] && echo "❌ CORS: требует внимания"
    [ "$AUTH_OK" != true ] && echo "❌ Authentication: не работает"
    [ "$REG_OK" != true ] && echo "❌ Registration: не работает"
    [ "$EXT_OK" != true ] && echo "❌ External Access: недоступен"
    
else
    echo "❌ КРИТИЧЕСКИЕ ПРОБЛЕМЫ"
    echo "   Backend не отвечает на health check"
fi

echo ""
echo "📋 УПРАВЛЕНИЕ:"
echo "   Просмотр логов:  docker logs devassist_app_monolith"
echo "   Перезапуск:      docker restart devassist_app_monolith"  
echo "   Статус:          docker ps | grep devassist"

# Очистка
rm -f fix_auth_final.py
docker exec devassist_app_monolith rm -f /tmp/fix_auth_final.py 2>/dev/null || true

echo ""
echo "✅ Финальное исправление завершено"