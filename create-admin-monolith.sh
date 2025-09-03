#!/bin/bash

# DevAssist Pro - Создание админа для монолитной архитектуры
# Работает с встроенной базой данных в монолитном backend

# Цвета
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

echo -e "${BLUE}🔐 DevAssist Pro - Создание администратора (Монолит)${NC}"
echo ""

# Параметры администратора
EMAIL="admin@devassist.pro"
PASSWORD="admin123456"
FULL_NAME="System Administrator"

print_info "Создаем администратора:"
print_info "  Email: $EMAIL"
print_info "  Имя: $FULL_NAME"
print_info "  Архитектура: Монолитная"
echo ""

# 1. Проверяем доступность backend API
print_info "1. Проверяем доступность Backend API..."
if curl -f -s http://localhost:8000/health >/dev/null 2>&1; then
    print_success "✓ Backend API доступен"
    
    # Получаем информацию о сервисе
    health_info=$(curl -s http://localhost:8000/health 2>/dev/null)
    echo "   $health_info"
else
    print_error "✗ Backend API недоступен"
    print_info "Попробуйте перезапустить сервисы: docker compose restart"
    exit 1
fi
echo ""

# 2. Пытаемся создать админа через основной API
print_info "2. Создаем администратора через Backend API..."

# Пробуем разные возможные endpoints
endpoints=(
    "/api/admin/users/create-admin"
    "/admin/users/create-admin"
    "/api/auth/create-admin"
    "/auth/create-admin"
    "/api/users/create-admin"
    "/users/create-admin"
)

admin_created=false

for endpoint in "${endpoints[@]}"; do
    print_info "   Пробуем endpoint: $endpoint"
    
    response=$(curl -s -w "%{http_code}" -o /tmp/admin_response.txt \
        -X POST "http://localhost:8000$endpoint" \
        -H "Content-Type: application/json" \
        -d "{
            \"email\": \"$EMAIL\",
            \"password\": \"$PASSWORD\",
            \"full_name\": \"$FULL_NAME\",
            \"company\": \"DevAssist Pro\",
            \"position\": \"System Administrator\"
        }" 2>/dev/null)
    
    http_code="${response: -3}"
    
    if [ "$http_code" = "200" ] || [ "$http_code" = "201" ]; then
        print_success "✓ Администратор создан через $endpoint"
        response_body=$(cat /tmp/admin_response.txt 2>/dev/null)
        echo "   Ответ: $response_body"
        admin_created=true
        break
    elif [ "$http_code" = "400" ]; then
        response_body=$(cat /tmp/admin_response.txt 2>/dev/null)
        if echo "$response_body" | grep -q "already exists\|уже существует"; then
            print_warning "⚠ Пользователь уже существует"
            admin_created=true
            break
        else
            print_warning "⚠ Ошибка 400: $response_body"
        fi
    elif [ "$http_code" = "404" ]; then
        print_info "   404 - endpoint не найден"
    else
        print_warning "   Код ответа: $http_code"
        response_body=$(cat /tmp/admin_response.txt 2>/dev/null)
        if [ -n "$response_body" ]; then
            echo "   Ответ: $response_body"
        fi
    fi
done

rm -f /tmp/admin_response.txt
echo ""

# 3. Если не удалось создать через API, пробуем напрямую в контейнере
if [ "$admin_created" = false ]; then
    print_info "3. Пытаемся создать админа напрямую в backend контейнере..."
    
    # Находим backend контейнер
    BACKEND_CONTAINER=$(docker ps --format "table {{.Names}}" | grep -E "(app|backend|devassist)" | head -1)
    
    if [ -n "$BACKEND_CONTAINER" ]; then
        print_info "   Используем контейнер: $BACKEND_CONTAINER"
        
        # Создаем Python скрипт для создания админа
        cat > /tmp/create_admin.py << EOF
import sys
sys.path.append('/app')

try:
    # Пытаемся импортировать нужные модули
    from sqlalchemy import create_engine, text
    from passlib.context import CryptContext
    import os
    
    print("Модули импортированы успешно")
    
    # Настройка хеширования паролей
    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
    
    # Хешируем пароль
    hashed_password = pwd_context.hash("$PASSWORD")
    print(f"Пароль захеширован")
    
    # Подключение к базе данных
    db_url = os.getenv("DATABASE_URL", "sqlite:///./devassist.db")
    print(f"Database URL: {db_url}")
    
    engine = create_engine(db_url)
    
    # SQL для создания таблицы users если её нет
    create_table_sql = '''
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email VARCHAR(255) UNIQUE NOT NULL,
        hashed_password VARCHAR(255) NOT NULL,
        full_name VARCHAR(255) NOT NULL,
        is_active BOOLEAN DEFAULT 1,
        is_superuser BOOLEAN DEFAULT 0,
        is_verified BOOLEAN DEFAULT 1,
        company VARCHAR(255),
        position VARCHAR(255),
        phone VARCHAR(50),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    '''
    
    # SQL для создания/обновления админа
    upsert_admin_sql = '''
    INSERT OR REPLACE INTO users (
        email, hashed_password, full_name, is_active, is_superuser, is_verified,
        company, position, created_at, updated_at
    ) VALUES (
        '$EMAIL', :hashed_password, '$FULL_NAME', 1, 1, 1,
        'DevAssist Pro', 'System Administrator', 
        datetime('now'), datetime('now')
    );
    '''
    
    with engine.connect() as conn:
        # Создаем таблицу
        conn.execute(text(create_table_sql))
        print("Таблица users создана/проверена")
        
        # Создаем админа
        conn.execute(text(upsert_admin_sql), {"hashed_password": hashed_password})
        conn.commit()
        print("Администратор создан/обновлен")
        
        # Проверяем результат
        result = conn.execute(text("SELECT email, full_name, is_superuser FROM users WHERE email = '$EMAIL'")).fetchone()
        if result:
            print(f"Пользователь найден: {result}")
            print("SUCCESS")
        else:
            print("ERROR: Пользователь не найден после создания")

except Exception as e:
    print(f"ERROR: {str(e)}")
    import traceback
    traceback.print_exc()
EOF
        
        # Выполняем скрипт в контейнере
        if docker exec -i "$BACKEND_CONTAINER" python3 /tmp/create_admin.py > /tmp/admin_output.txt 2>&1; then
            output=$(cat /tmp/admin_output.txt)
            if echo "$output" | grep -q "SUCCESS"; then
                print_success "✓ Администратор создан напрямую в базе данных"
                admin_created=true
            else
                print_warning "⚠ Возможная ошибка при создании:"
                echo "$output"
            fi
        else
            print_error "✗ Не удалось выполнить скрипт в контейнере"
            cat /tmp/admin_output.txt 2>/dev/null
        fi
        
        rm -f /tmp/create_admin.py /tmp/admin_output.txt
    else
        print_error "✗ Backend контейнер не найден"
    fi
fi
echo ""

# 4. Проверяем возможность входа
print_info "4. Проверяем возможность авторизации..."

# Пытаемся авторизоваться
login_response=$(curl -s -w "%{http_code}" -o /tmp/login_response.txt \
    -X POST "http://localhost:8000/api/auth/login" \
    -H "Content-Type: application/x-www-form-urlencoded" \
    -d "username=$EMAIL&password=$PASSWORD" 2>/dev/null)

login_code="${login_response: -3}"

if [ "$login_code" = "200" ]; then
    print_success "✓ Авторизация работает"
    response_body=$(cat /tmp/login_response.txt 2>/dev/null)
    echo "   Получен токен доступа"
elif [ "$login_code" = "400" ] || [ "$login_code" = "401" ]; then
    print_warning "⚠ Неверные учетные данные или неправильный формат запроса"
    
    # Пробуем другой формат
    login_response2=$(curl -s -w "%{http_code}" -o /tmp/login_response2.txt \
        -X POST "http://localhost:8000/api/auth/login" \
        -H "Content-Type: application/json" \
        -d "{\"email\": \"$EMAIL\", \"password\": \"$PASSWORD\"}" 2>/dev/null)
    
    login_code2="${login_response2: -3}"
    
    if [ "$login_code2" = "200" ]; then
        print_success "✓ Авторизация работает (JSON формат)"
    else
        print_warning "⚠ Авторизация пока не работает (коды: $login_code, $login_code2)"
    fi
else
    print_warning "⚠ Неизвестный код ответа: $login_code"
fi

rm -f /tmp/login_response.txt /tmp/login_response2.txt
echo ""

# 5. Итоговая информация
if [ "$admin_created" = true ]; then
    print_success "🎉 АДМИНИСТРАТОР ГОТОВ!"
    echo ""
    print_info "📋 Данные для входа в админ панель:"
    print_info "   🌐 URL: http://46.149.71.162/admin"
    print_info "   📧 Email: $EMAIL"
    print_info "   🔑 Пароль: $PASSWORD"
    echo ""
    print_warning "⚠️  ВАЖНО: Смените пароль после первого входа!"
    echo ""
    print_info "🔍 Если вход не работает:"
    print_info "   1. Проверьте что вы заходите на /admin (не /login)"
    print_info "   2. Попробуйте обновить страницу"
    print_info "   3. Проверьте консоль браузера на ошибки"
    print_info "   4. Перезапустите сервисы: docker compose restart"
else
    print_error "❌ НЕ УДАЛОСЬ СОЗДАТЬ АДМИНИСТРАТОРА"
    echo ""
    print_info "🔧 Попробуйте:"
    print_info "   1. Перезапустить сервисы: docker compose restart"
    print_info "   2. Проверить логи: docker compose logs"
    print_info "   3. Пересобрать проект: ./fix-and-deploy.sh"
fi

echo ""
print_info "📊 Для диагностики запустите: ./debug-admin.sh"