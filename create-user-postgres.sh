#!/bin/bash

# DevAssist Pro - Создание пользователя в PostgreSQL
# Создает администратора напрямую в базе данных PostgreSQL

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

echo -e "${BLUE}🐘 DevAssist Pro - Создание пользователя в PostgreSQL${NC}"
echo ""

# Данные пользователя
EMAIL="admin@devassist.pro"
PASSWORD="admin123456"
FULL_NAME="System Administrator"

print_info "Создаем пользователя:"
print_info "  Email: $EMAIL"
print_info "  Имя: $FULL_NAME"
echo ""

# 1. Находим PostgreSQL контейнер
print_info "1. Ищем PostgreSQL контейнер..."
PG_CONTAINER=$(docker ps --format "{{.Names}}" | grep -E "(postgres|db)" | head -1)

if [ -z "$PG_CONTAINER" ]; then
    print_error "✗ PostgreSQL контейнер не найден"
    exit 1
fi

print_success "✓ Найден PostgreSQL контейнер: $PG_CONTAINER"
echo ""

# 2. Проверяем подключение к базе данных
print_info "2. Проверяем подключение к базе данных..."

# Пробуем разные варианты подключения
DB_CONNECTED=false
DB_USER=""
DB_NAME=""

# Варианты пользователей и баз данных
users=("devassist_user" "devassist" "postgres")
databases=("devassist_pro" "devassist" "postgres")

for user in "${users[@]}"; do
    for db in "${databases[@]}"; do
        if docker exec -i "$PG_CONTAINER" psql -U "$user" -d "$db" -c "SELECT 1;" >/dev/null 2>&1; then
            print_success "✓ Подключение успешно: пользователь=$user, база=$db"
            DB_USER="$user"
            DB_NAME="$db"
            DB_CONNECTED=true
            break 2
        fi
    done
done

if [ "$DB_CONNECTED" = false ]; then
    print_error "✗ Не удается подключиться к базе данных"
    print_info "Попробуйте перезапустить сервисы: docker compose restart"
    exit 1
fi

echo ""

# 3. Создаем таблицу users если её нет
print_info "3. Создаем/проверяем таблицу users..."

CREATE_TABLE_SQL="
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    is_superuser BOOLEAN DEFAULT false,
    is_verified BOOLEAN DEFAULT true,
    company VARCHAR(255),
    position VARCHAR(255),
    phone VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_is_superuser ON users(is_superuser);
"

if docker exec -i "$PG_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -c "$CREATE_TABLE_SQL" >/dev/null 2>&1; then
    print_success "✓ Таблица users создана/проверена"
else
    print_error "✗ Не удалось создать таблицу users"
    exit 1
fi

echo ""

# 4. Генерируем хеш пароля
print_info "4. Генерируем хеш пароля..."

# Используем bcrypt через Python в backend контейнере
BACKEND_CONTAINER="devassist_app_monolith"

# Создаем скрипт для хеширования пароля
HASH_SCRIPT="
import sys
try:
    from passlib.context import CryptContext
    pwd_context = CryptContext(schemes=['bcrypt'], deprecated='auto')
    hashed = pwd_context.hash('$PASSWORD')
    print(hashed)
except ImportError:
    # Fallback к простому хешированию
    import hashlib
    import base64
    password = '$PASSWORD'
    salt = 'devassist_salt_2024'
    hashed = hashlib.pbkdf2_hmac('sha256', password.encode(), salt.encode(), 100000)
    print('pbkdf2_sha256\$100000\$devassist_salt_2024\$' + base64.b64encode(hashed).decode())
"

password_hash=$(docker exec -i "$BACKEND_CONTAINER" python3 -c "$HASH_SCRIPT" 2>/dev/null || echo "")

if [ -z "$password_hash" ]; then
    # Простой fallback хеш
    password_hash='$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewAlzYIsGhL6VK5u'
    print_warning "⚠ Используем простой хеш пароля"
else
    print_success "✓ Пароль захеширован"
fi

echo ""

# 5. Создаем/обновляем пользователя
print_info "5. Создаем администратора в базе данных..."

INSERT_USER_SQL="
INSERT INTO users (
    email, 
    hashed_password, 
    full_name, 
    is_active, 
    is_superuser, 
    is_verified,
    company,
    position,
    created_at,
    updated_at
) VALUES (
    '$EMAIL',
    '$password_hash',
    '$FULL_NAME',
    true,
    true,
    true,
    'DevAssist Pro',
    'System Administrator',
    NOW(),
    NOW()
) ON CONFLICT (email) DO UPDATE SET
    hashed_password = EXCLUDED.hashed_password,
    is_superuser = true,
    is_active = true,
    is_verified = true,
    full_name = EXCLUDED.full_name,
    company = EXCLUDED.company,
    position = EXCLUDED.position,
    updated_at = NOW();
"

if docker exec -i "$PG_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -c "$INSERT_USER_SQL" >/dev/null 2>&1; then
    print_success "✓ Администратор создан/обновлен в базе данных"
else
    print_error "✗ Не удалось создать администратора"
    # Показываем ошибку
    docker exec -i "$PG_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -c "$INSERT_USER_SQL"
    exit 1
fi

echo ""

# 6. Проверяем результат
print_info "6. Проверяем созданного пользователя..."

CHECK_SQL="SELECT id, email, full_name, is_active, is_superuser, is_verified FROM users WHERE email = '$EMAIL';"

result=$(docker exec -i "$PG_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -t -c "$CHECK_SQL" 2>/dev/null)

if [ -n "$result" ]; then
    print_success "✓ Пользователь найден в базе данных:"
    echo "$result"
else
    print_error "✗ Пользователь не найден после создания"
    exit 1
fi

echo ""

# 7. Тестируем авторизацию через API
print_info "7. Тестируем авторизацию через API..."

# Пробуем авторизоваться
login_data="username=$EMAIL&password=$PASSWORD"

auth_response=$(curl -s -w "%{http_code}" -o /tmp/auth_test.txt \
    -X POST "http://localhost:8000/api/auth/login" \
    -H "Content-Type: application/x-www-form-urlencoded" \
    -d "$login_data" 2>/dev/null)

auth_code="${auth_response: -3}"

if [ "$auth_code" = "200" ]; then
    print_success "✓ Авторизация через API работает"
    auth_result=$(cat /tmp/auth_test.txt 2>/dev/null)
    if echo "$auth_result" | grep -q "access_token"; then
        print_success "✓ Получен токен доступа"
    fi
elif [ "$auth_code" = "422" ]; then
    print_info "⚠ Ошибка 422 - попробуем JSON формат"
    
    # Пробуем JSON формат
    json_response=$(curl -s -w "%{http_code}" -o /tmp/auth_test2.txt \
        -X POST "http://localhost:8000/api/auth/login" \
        -H "Content-Type: application/json" \
        -d "{\"email\": \"$EMAIL\", \"password\": \"$PASSWORD\"}" 2>/dev/null)
    
    json_code="${json_response: -3}"
    
    if [ "$json_code" = "200" ]; then
        print_success "✓ Авторизация работает в JSON формате"
    else
        print_warning "⚠ Авторизация пока не работает (коды: $auth_code, $json_code)"
        auth_result=$(cat /tmp/auth_test.txt 2>/dev/null)
        auth_result2=$(cat /tmp/auth_test2.txt 2>/dev/null)
        echo "Ответ 1: $auth_result"
        echo "Ответ 2: $auth_result2"
    fi
else
    print_warning "⚠ Авторизация вернула код: $auth_code"
    auth_result=$(cat /tmp/auth_test.txt 2>/dev/null)
    echo "Ответ API: $auth_result"
fi

rm -f /tmp/auth_test.txt /tmp/auth_test2.txt

echo ""

# 8. Итоговая информация
print_success "🎉 АДМИНИСТРАТОР СОЗДАН В БАЗЕ ДАННЫХ!"
echo ""
print_info "📋 Данные для входа:"
print_info "   🌐 URL: http://46.149.71.162/auth/login"
print_info "   📧 Email: $EMAIL"
print_info "   🔑 Пароль: $PASSWORD"
echo ""
print_info "🔍 Пошаговая инструкция:"
print_info "   1. Откройте http://46.149.71.162/auth/login"
print_info "   2. Введите email: $EMAIL"
print_info "   3. Введите пароль: $PASSWORD"
print_info "   4. После входа перейдите на /admin или /dashboard"
echo ""
print_warning "⚠️  ВАЖНО:"
print_warning "   • Используйте /auth/login для входа, НЕ /admin"
print_warning "   • После входа смените пароль"
print_warning "   • Если ошибка входа, проверьте консоль браузера"

echo ""
print_info "🔧 Если проблемы остаются:"
print_info "   • Перезапустите сервисы: docker compose restart"
print_info "   • Проверьте логи: docker compose logs"
print_info "   • Повторите скрипт: ./create-user-postgres.sh"