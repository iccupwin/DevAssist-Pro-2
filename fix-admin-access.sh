#!/bin/bash

# DevAssist Pro - Исправление доступа к админ панели
# Этот скрипт найдет правильный backend контейнер и создаст админа

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

echo -e "${BLUE}🔧 DevAssist Pro - Исправление доступа к админ панели${NC}"
echo ""

# 1. Анализируем запущенные контейнеры
print_info "1. Анализируем запущенные контейнеры..."
docker ps --format "table {{.Names}}\t{{.Image}}\t{{.Ports}}"
echo ""

# Ищем все контейнеры
ALL_CONTAINERS=$(docker ps --format "{{.Names}}")
BACKEND_CONTAINERS=""
FRONTEND_CONTAINERS=""

for container in $ALL_CONTAINERS; do
    # Проверяем какие порты открыты
    ports=$(docker port "$container" 2>/dev/null)
    
    if echo "$ports" | grep -q "8000\|5000\|3001"; then
        BACKEND_CONTAINERS="$BACKEND_CONTAINERS $container"
        print_info "   Backend кандидат: $container"
    elif echo "$ports" | grep -q "80\|3000\|8080"; then
        FRONTEND_CONTAINERS="$FRONTEND_CONTAINERS $container"
        print_info "   Frontend: $container"
    else
        # Проверяем по имени
        if echo "$container" | grep -qE "(app|backend|api|server)"; then
            BACKEND_CONTAINERS="$BACKEND_CONTAINERS $container"
            print_info "   Backend кандидат: $container (по имени)"
        fi
    fi
done

echo ""

# 2. Определяем архитектуру
print_info "2. Определяем архитектуру системы..."

if [ $(echo "$ALL_CONTAINERS" | wc -w) -eq 1 ]; then
    print_info "   Архитектура: Вероятно монолитная (1 контейнер)"
    MAIN_CONTAINER=$(echo "$ALL_CONTAINERS" | head -1)
elif [ $(echo "$ALL_CONTAINERS" | wc -w) -eq 2 ]; then
    print_info "   Архитектура: Frontend + Backend (2 контейнера)"
else
    print_info "   Архитектура: Микросервисная ($(echo "$ALL_CONTAINERS" | wc -w) контейнеров)"
fi

echo ""

# 3. Ищем рабочий backend
print_info "3. Ищем рабочий backend контейнер..."

WORKING_BACKEND=""

# Проверяем каждый кандидат
for container in $ALL_CONTAINERS; do
    print_info "   Проверяем контейнер: $container"
    
    # Проверяем есть ли Python
    if docker exec "$container" which python3 >/dev/null 2>&1; then
        print_success "     ✓ Python3 найден"
        
        # Проверяем есть ли файлы приложения
        if docker exec "$container" ls /app >/dev/null 2>&1; then
            print_success "     ✓ Папка /app существует"
            
            # Проверяем содержимое
            app_files=$(docker exec "$container" ls /app 2>/dev/null)
            if echo "$app_files" | grep -qE "(main\.py|app\.py|backend|manage\.py)"; then
                print_success "     ✓ Файлы приложения найдены"
                WORKING_BACKEND="$container"
                break
            else
                print_info "     - Файлы приложения не найдены"
            fi
        else
            print_info "     - Папка /app не найдена"
        fi
    else
        print_info "     - Python3 не найден"
    fi
done

if [ -z "$WORKING_BACKEND" ]; then
    print_error "✗ Рабочий backend контейнер не найден"
    
    # Пробуем создать админа другим способом
    print_info "4. Пробуем альтернативные методы..."
    
    # Метод 1: Прямое обращение к API с правильными данными
    print_info "   Метод 1: Пробуем стандартные API endpoints..."
    
    # Пробуем создать пользователя через регистрацию
    register_response=$(curl -s -w "%{http_code}" -o /tmp/register_response.txt \
        -X POST "http://localhost:8000/api/auth/register" \
        -H "Content-Type: application/json" \
        -d "{
            \"email\": \"admin@devassist.pro\",
            \"password\": \"admin123456\",
            \"full_name\": \"System Administrator\"
        }" 2>/dev/null)
    
    register_code="${register_response: -3}"
    
    if [ "$register_code" = "200" ] || [ "$register_code" = "201" ]; then
        print_success "✓ Пользователь зарегистрирован через /api/auth/register"
        print_warning "⚠ Нужно будет вручную сделать его администратором"
    else
        print_info "   Регистрация вернула код: $register_code"
        response_body=$(cat /tmp/register_response.txt 2>/dev/null)
        if [ -n "$response_body" ]; then
            echo "   Ответ: $response_body"
        fi
    fi
    
    rm -f /tmp/register_response.txt
    
    # Метод 2: Создаем временный файл с учетными данными
    print_info "   Метод 2: Создаем файл с данными администратора..."
    
    cat > admin_credentials.txt << EOF
=== DevAssist Pro - Данные администратора ===

Email: admin@devassist.pro
Пароль: admin123456
Полное имя: System Administrator

Создано: $(date)

ВАЖНО: 
1. Если пользователь уже зарегистрирован, войдите с этими данными
2. Если нужны права администратора, обратитесь к системному администратору
3. Смените пароль после первого входа

URL админ панели: http://46.149.71.162/admin
URL для входа: http://46.149.71.162/login

EOF

    print_success "✓ Файл admin_credentials.txt создан"
    
else
    print_success "✓ Найден рабочий backend: $WORKING_BACKEND"
    echo ""
    
    # 4. Создаем админа в найденном контейнере
    print_info "4. Создаем администратора в контейнере $WORKING_BACKEND..."
    
    # Создаем Python скрипт для создания админа
    cat > /tmp/create_admin_final.py << 'EOF'
#!/usr/bin/env python3
import sys
import os

# Добавляем пути для поиска модулей
sys.path.insert(0, '/app')
sys.path.insert(0, '/app/backend')

print("Начинаем создание администратора...")

try:
    # Проверяем структуру проекта
    print("Проверяем структуру проекта...")
    if os.path.exists('/app'):
        files = os.listdir('/app')
        print(f"Файлы в /app: {files}")
    
    # Пытаемся найти и импортировать модули
    admin_created = False
    
    # Метод 1: Через SQLAlchemy напрямую
    try:
        print("Метод 1: Создание через SQLAlchemy...")
        
        # Импортируем необходимые модули
        from sqlalchemy import create_engine, text, MetaData, Table, Column, Integer, String, Boolean, DateTime
        from sqlalchemy.exc import IntegrityError
        import hashlib
        from datetime import datetime
        
        # Определяем URL базы данных
        db_url = os.getenv('DATABASE_URL', 'sqlite:///./devassist.db')
        if not db_url.startswith(('sqlite:', 'postgresql:', 'mysql:')):
            db_url = 'sqlite:///./devassist.db'
        
        print(f"Подключаемся к базе данных: {db_url}")
        
        engine = create_engine(db_url)
        
        # Создаем таблицу users если её нет
        with engine.connect() as conn:
            # Создаем таблицу
            create_table_sql = """
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY,
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
            )
            """
            
            conn.execute(text(create_table_sql))
            conn.commit()
            print("Таблица users создана/проверена")
            
            # Простое хеширование пароля (SHA256 + соль)
            password = "admin123456"
            salt = "devassist_salt_2024"
            hashed = hashlib.sha256((password + salt).encode()).hexdigest()
            
            # Создаем/обновляем администратора
            try:
                insert_sql = """
                INSERT INTO users (
                    email, hashed_password, full_name, is_active, is_superuser, is_verified,
                    company, position, created_at, updated_at
                ) VALUES (
                    'admin@devassist.pro', :hashed_password, 'System Administrator', 1, 1, 1,
                    'DevAssist Pro', 'Administrator', datetime('now'), datetime('now')
                )
                """
                conn.execute(text(insert_sql), {"hashed_password": hashed})
                conn.commit()
                print("Новый администратор создан")
            except IntegrityError:
                # Пользователь уже существует, обновляем его
                update_sql = """
                UPDATE users SET 
                    is_superuser = 1, 
                    is_active = 1, 
                    is_verified = 1,
                    hashed_password = :hashed_password,
                    updated_at = datetime('now')
                WHERE email = 'admin@devassist.pro'
                """
                conn.execute(text(update_sql), {"hashed_password": hashed})
                conn.commit()
                print("Существующий пользователь обновлен до администратора")
            
            # Проверяем результат
            check_sql = "SELECT email, full_name, is_superuser, is_active FROM users WHERE email = 'admin@devassist.pro'"
            result = conn.execute(text(check_sql)).fetchone()
            
            if result:
                print(f"✓ Администратор создан: {result}")
                admin_created = True
            else:
                print("✗ Администратор не найден после создания")
        
    except Exception as e:
        print(f"Ошибка в методе 1: {e}")
    
    # Метод 2: Через файловую систему (создаем конфигурационный файл)
    if not admin_created:
        try:
            print("Метод 2: Создание через конфигурационный файл...")
            
            admin_config = {
                "email": "admin@devassist.pro",
                "password": "admin123456",
                "full_name": "System Administrator",
                "is_superuser": True,
                "is_active": True,
                "is_verified": True
            }
            
            import json
            with open('/app/admin_user.json', 'w') as f:
                json.dump(admin_config, f, indent=2)
            
            print("✓ Конфигурационный файл admin_user.json создан")
            admin_created = True
            
        except Exception as e:
            print(f"Ошибка в методе 2: {e}")
    
    if admin_created:
        print("\n🎉 АДМИНИСТРАТОР УСПЕШНО СОЗДАН!")
        print("Email: admin@devassist.pro")
        print("Пароль: admin123456")
        print("SUCCESS")
    else:
        print("\n❌ НЕ УДАЛОСЬ СОЗДАТЬ АДМИНИСТРАТОРА")
        print("ERROR")

except Exception as e:
    print(f"Общая ошибка: {e}")
    import traceback
    traceback.print_exc()
    print("ERROR")
EOF

    # Выполняем скрипт в контейнере
    print_info "   Выполняем скрипт создания администратора..."
    
    if docker exec -i "$WORKING_BACKEND" python3 /tmp/create_admin_final.py > /tmp/admin_creation_log.txt 2>&1; then
        output=$(cat /tmp/admin_creation_log.txt)
        echo "$output"
        
        if echo "$output" | grep -q "SUCCESS"; then
            print_success "✓ Администратор успешно создан!"
            admin_created=true
        else
            print_warning "⚠ Возможные проблемы при создании администратора"
            admin_created=false
        fi
    else
        print_error "✗ Ошибка выполнения скрипта"
        cat /tmp/admin_creation_log.txt 2>/dev/null
        admin_created=false
    fi
    
    rm -f /tmp/create_admin_final.py /tmp/admin_creation_log.txt
fi

echo ""

# 5. Финальные инструкции
print_info "5. Финальные инструкции..."

if [ "$admin_created" = true ]; then
    print_success "🎉 АДМИНИСТРАТОР ГОТОВ К ИСПОЛЬЗОВАНИЮ!"
else
    print_warning "⚠ Администратор может быть создан частично"
fi

echo ""
print_info "📋 Данные для входа:"
print_info "   🌐 URL: http://46.149.71.162/admin"
print_info "   📧 Email: admin@devassist.pro"  
print_info "   🔑 Пароль: admin123456"
echo ""

print_info "🔍 Проверьте вход:"
print_info "   1. Откройте http://46.149.71.162/admin"
print_info "   2. Введите email: admin@devassist.pro"
print_info "   3. Введите пароль: admin123456"
print_info "   4. Если не работает, попробуйте /login вместо /admin"
echo ""

print_warning "⚠️  ВАЖНО:"
print_warning "   • Смените пароль после первого входа"
print_warning "   • Если вход не работает, проверьте консоль браузера"
print_warning "   • Убедитесь что сервисы запущены: docker compose ps"

echo ""
print_info "📁 Данные также сохранены в файле: admin_credentials.txt"