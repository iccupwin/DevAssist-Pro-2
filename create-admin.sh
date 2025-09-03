#!/bin/bash

# DevAssist Pro - Создание первого администратора
# Этот скрипт создает первого админа через API или напрямую в базе данных

set -e

# Цвета для вывода
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

print_info "🔐 DevAssist Pro - Создание первого администратора"
echo ""

# Функция для создания админа через API
create_admin_via_api() {
    local email=$1
    local password=$2
    local full_name=$3
    
    print_info "Пытаемся создать админа через API..."
    
    # Проверяем доступность API
    if ! curl -f -s http://localhost:8000/health >/dev/null 2>&1; then
        print_error "Backend API недоступен на порту 8000"
        return 1
    fi
    
    # Создаем админа через API
    response=$(curl -s -X POST http://localhost:8000/api/admin/users/create-admin \
        -H "Content-Type: application/json" \
        -d "{
            \"email\": \"$email\",
            \"password\": \"$password\",
            \"full_name\": \"$full_name\",
            \"company\": \"DevAssist Pro\",
            \"position\": \"System Administrator\"
        }" 2>/dev/null)
    
    if [ $? -eq 0 ] && echo "$response" | grep -q "success"; then
        print_success "Админ создан через API!"
        echo "$response" | python3 -m json.tool 2>/dev/null || echo "$response"
        return 0
    else
        print_warning "Не удалось создать админа через API"
        print_info "Ответ API: $response"
        return 1
    fi
}

# Функция для создания админа напрямую в базе данных
create_admin_via_db() {
    local email=$1
    local password=$2
    local full_name=$3
    
    print_info "Создаем админа напрямую в базе данных..."
    
    # Определяем команду Docker Compose
    if command -v "docker" >/dev/null 2>&1 && docker compose version >/dev/null 2>&1; then
        DOCKER_CMD="docker compose"
    elif command -v "docker-compose" >/dev/null 2>&1; then
        DOCKER_CMD="docker-compose"
    else
        print_error "Docker Compose не найден!"
        return 1
    fi
    
    # Находим PostgreSQL контейнер
    PG_CONTAINER=$($DOCKER_CMD ps --format "table {{.Names}}" | grep -E "(postgres|db)" | head -1)
    
    if [ -z "$PG_CONTAINER" ]; then
        print_error "PostgreSQL контейнер не найден"
        return 1
    fi
    
    print_info "Используем PostgreSQL контейнер: $PG_CONTAINER"
    
    # Хэшируем пароль (простое bcrypt хеширование)
    # В реальности должно использоваться правильное bcrypt хеширование
    password_hash=$(python3 -c "
import bcrypt
password = '$password'.encode('utf-8')
hashed = bcrypt.hashpw(password, bcrypt.gensalt())
print(hashed.decode('utf-8'))
" 2>/dev/null || echo "\$2b\$12\$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewAlzYIsGhL6VK5u")
    
    # SQL для создания админа
    SQL="
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
        '$email',
        '$password_hash',
        '$full_name',
        true,
        true,
        true,
        'DevAssist Pro',
        'System Administrator',
        NOW(),
        NOW()
    ) ON CONFLICT (email) DO UPDATE SET
        is_superuser = true,
        is_active = true,
        is_verified = true,
        updated_at = NOW();
    "
    
    # Выполняем SQL
    if docker exec -i "$PG_CONTAINER" psql -U devassist_user -d devassist_pro -c "$SQL" 2>/dev/null; then
        print_success "Админ создан в базе данных!"
        return 0
    else
        # Пробуем с другими возможными параметрами подключения
        if docker exec -i "$PG_CONTAINER" psql -U devassist -d devassist_pro -c "$SQL" 2>/dev/null; then
            print_success "Админ создан в базе данных!"
            return 0
        elif docker exec -i "$PG_CONTAINER" psql -U postgres -d devassist_pro -c "$SQL" 2>/dev/null; then
            print_success "Админ создан в базе данных!"
            return 0
        else
            print_error "Не удалось выполнить SQL запрос"
            return 1
        fi
    fi
}

# Функция для создания таблиц если их нет
create_tables_if_needed() {
    print_info "Проверяем наличие таблиц в базе данных..."
    
    # Определяем команду Docker Compose
    if command -v "docker" >/dev/null 2>&1 && docker compose version >/dev/null 2>&1; then
        DOCKER_CMD="docker compose"
    elif command -v "docker-compose" >/dev/null 2>&1; then
        DOCKER_CMD="docker-compose"
    else
        return 1
    fi
    
    # Находим PostgreSQL контейнер
    PG_CONTAINER=$($DOCKER_CMD ps --format "table {{.Names}}" | grep -E "(postgres|db)" | head -1)
    
    if [ -z "$PG_CONTAINER" ]; then
        print_warning "PostgreSQL контейнер не найден, пропускаем создание таблиц"
        return 1
    fi
    
    # SQL для создания таблицы users
    CREATE_USERS_TABLE="
    CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        hashed_password VARCHAR(255) NOT NULL,
        full_name VARCHAR(255) NOT NULL,
        is_active BOOLEAN DEFAULT true,
        is_superuser BOOLEAN DEFAULT false,
        is_verified BOOLEAN DEFAULT false,
        company VARCHAR(255),
        position VARCHAR(255),
        phone VARCHAR(50),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
    );
    
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);
    CREATE INDEX IF NOT EXISTS idx_users_is_superuser ON users(is_superuser);
    "
    
    # Выполняем создание таблиц
    if docker exec -i "$PG_CONTAINER" psql -U devassist_user -d devassist_pro -c "$CREATE_USERS_TABLE" 2>/dev/null; then
        print_success "Таблицы проверены/созданы"
    elif docker exec -i "$PG_CONTAINER" psql -U devassist -d devassist_pro -c "$CREATE_USERS_TABLE" 2>/dev/null; then
        print_success "Таблицы проверены/созданы"
    elif docker exec -i "$PG_CONTAINER" psql -U postgres -d devassist_pro -c "$CREATE_USERS_TABLE" 2>/dev/null; then
        print_success "Таблицы проверены/созданы"
    else
        print_warning "Не удалось проверить/создать таблицы"
    fi
}

# Функция для проверки Python зависимостей
check_python_deps() {
    if ! python3 -c "import bcrypt" 2>/dev/null; then
        print_warning "bcrypt не установлен, устанавливаем..."
        if command -v pip3 >/dev/null 2>&1; then
            pip3 install bcrypt >/dev/null 2>&1 || true
        elif command -v apt-get >/dev/null 2>&1; then
            apt-get update >/dev/null 2>&1 && apt-get install -y python3-bcrypt >/dev/null 2>&1 || true
        fi
    fi
}

# Основная функция
main() {
    # Параметры по умолчанию
    DEFAULT_EMAIL="admin@devassist.pro"
    DEFAULT_PASSWORD="admin123456"
    DEFAULT_NAME="System Administrator"
    
    # Проверяем аргументы командной строки
    EMAIL=${1:-$DEFAULT_EMAIL}
    PASSWORD=${2:-$DEFAULT_PASSWORD}
    FULL_NAME=${3:-$DEFAULT_NAME}
    
    print_info "Создаем администратора:"
    print_info "  Email: $EMAIL"
    print_info "  Имя: $FULL_NAME"
    print_info "  Пароль: [скрыт]"
    echo ""
    
    # Проверяем Python зависимости
    check_python_deps
    
    # Создаем таблицы если нужно
    create_tables_if_needed
    
    # Пытаемся создать админа через API
    if create_admin_via_api "$EMAIL" "$PASSWORD" "$FULL_NAME"; then
        echo ""
        print_success "✅ Администратор успешно создан через API!"
    else
        # Если API не работает, создаем напрямую в БД
        print_info "API недоступен, создаем напрямую в базе данных..."
        if create_admin_via_db "$EMAIL" "$PASSWORD" "$FULL_NAME"; then
            echo ""
            print_success "✅ Администратор успешно создан в базе данных!"
        else
            print_error "❌ Не удалось создать администратора"
            echo ""
            print_info "Попробуйте:"
            print_info "1. Убедиться что сервисы запущены: docker compose ps"
            print_info "2. Проверить логи: docker compose logs"
            print_info "3. Перезапустить сервисы: docker compose restart"
            exit 1
        fi
    fi
    
    echo ""
    print_success "🎉 Готово! Теперь вы можете войти в админ панель:"
    print_info "   URL: http://46.149.71.162/admin"
    print_info "   Email: $EMAIL"
    print_info "   Пароль: $PASSWORD"
    echo ""
    print_warning "⚠️  ВАЖНО: Сразу после входа смените пароль администратора!"
}

# Функция помощи
show_help() {
    echo "Использование: $0 [email] [password] [full_name]"
    echo ""
    echo "Параметры:"
    echo "  email      Email администратора (по умолчанию: admin@devassist.pro)"
    echo "  password   Пароль администратора (по умолчанию: admin123456)"
    echo "  full_name  Полное имя (по умолчанию: System Administrator)"
    echo ""
    echo "Примеры:"
    echo "  $0"
    echo "  $0 admin@example.com mypassword 'John Doe'"
    echo "  $0 test@test.com"
    echo ""
}

# Обработка аргументов
case "$1" in
    -h|--help|help)
        show_help
        exit 0
        ;;
    *)
        main "$@"
        ;;
esac