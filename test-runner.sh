#!/bin/bash
# DevAssist Pro Complete Test Runner
# Запуск всех тестов проекта

set -e

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Функции логирования
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Проверка окружения
check_environment() {
    log_info "Проверка окружения..."
    
    # Проверяем Node.js
    if ! command -v node &> /dev/null; then
        log_error "Node.js не установлен!"
        exit 1
    fi
    
    # Проверяем Python
    if ! command -v python3 &> /dev/null; then
        log_error "Python 3 не установлен!"
        exit 1
    fi
    
    # Проверяем Docker
    if ! command -v docker &> /dev/null; then
        log_warning "Docker не установлен. Некоторые тесты могут не работать."
    fi
    
    # Проверяем PostgreSQL доступность
    if ! pg_isready -h localhost -p 5432 2>/dev/null; then
        log_warning "PostgreSQL недоступен. Тесты базы данных будут пропущены."
    fi
    
    log_success "Окружение проверено"
}

# Установка зависимостей
install_dependencies() {
    log_info "Установка зависимостей..."
    
    # Backend зависимости
    if [ -f "backend/requirements.txt" ]; then
        log_info "Установка Python зависимостей..."
        cd backend
        pip install -r requirements.txt
        pip install pytest pytest-asyncio httpx
        cd ..
        log_success "Python зависимости установлены"
    fi
    
    # Frontend зависимости
    if [ -f "frontend/package.json" ]; then
        log_info "Установка Node.js зависимостей..."
        cd frontend
        npm install
        npm install --save-dev @playwright/test
        cd ..
        log_success "Node.js зависимости установлены"
    fi
}

# Запуск тестов базы данных
run_database_tests() {
    log_info "Запуск тестов базы данных..."
    
    if [ -f "backend/database_test.py" ]; then
        cd backend
        python database_test.py
        if [ $? -eq 0 ]; then
            log_success "Тесты базы данных прошли успешно"
        else
            log_error "Тесты базы данных провалились"
            return 1
        fi
        cd ..
    else
        log_warning "Тесты базы данных не найдены"
    fi
}

# Запуск backend тестов
run_backend_tests() {
    log_info "Запуск backend тестов..."
    
    cd backend
    
    # Unit тесты
    if [ -d "tests/unit" ]; then
        log_info "Запуск unit тестов..."
        python -m pytest tests/unit/ -v
        if [ $? -ne 0 ]; then
            log_error "Unit тесты провалились"
            cd ..
            return 1
        fi
    fi
    
    # Интеграционные тесты
    if [ -d "tests/integration" ]; then
        log_info "Запуск интеграционных тестов..."
        python -m pytest tests/integration/ -v
        if [ $? -ne 0 ]; then
            log_error "Интеграционные тесты провалились"
            cd ..
            return 1
        fi
    fi
    
    # E2E тесты
    if [ -d "tests/e2e" ]; then
        log_info "Запуск E2E тестов..."
        python -m pytest tests/e2e/ -v
        if [ $? -ne 0 ]; then
            log_error "E2E тесты провалились"
            cd ..
            return 1
        fi
    fi
    
    cd ..
    log_success "Backend тесты прошли успешно"
}

# Запуск frontend тестов
run_frontend_tests() {
    log_info "Запуск frontend тестов..."
    
    cd frontend
    
    # TypeScript проверка
    log_info "Проверка TypeScript..."
    npm run type-check
    if [ $? -ne 0 ]; then
        log_error "TypeScript проверка провалилась"
        cd ..
        return 1
    fi
    
    # ESLint
    log_info "Запуск ESLint..."
    npm run lint
    if [ $? -ne 0 ]; then
        log_error "ESLint проверка провалилась"
        cd ..
        return 1
    fi
    
    # Unit тесты React
    if [ -f "package.json" ] && grep -q "test" package.json; then
        log_info "Запуск React unit тестов..."
        npm test -- --coverage --watchAll=false
        if [ $? -ne 0 ]; then
            log_error "React unit тесты провалились"
            cd ..
            return 1
        fi
    fi
    
    # Playwright E2E тесты
    if [ -d "tests/e2e" ]; then
        log_info "Установка Playwright браузеров..."
        npx playwright install
        
        log_info "Запуск Playwright E2E тестов..."
        npx playwright test
        if [ $? -ne 0 ]; then
            log_error "Playwright E2E тесты провалились"
            cd ..
            return 1
        fi
    fi
    
    cd ..
    log_success "Frontend тесты прошли успешно"
}

# Запуск тестов производительности
run_performance_tests() {
    log_info "Запуск тестов производительности..."
    
    # Backend performance тесты
    if [ -f "backend/tests/performance/test_performance.py" ]; then
        cd backend
        python -m pytest tests/performance/ -v
        cd ..
    fi
    
    # Frontend performance тесты с Lighthouse
    if command -v lighthouse &> /dev/null; then
        log_info "Запуск Lighthouse аудита..."
        lighthouse http://localhost:3000 --only-categories=performance --chrome-flags="--headless" --output=json --output-path=./lighthouse-report.json
        if [ $? -eq 0 ]; then
            log_success "Lighthouse аудит завершен"
        else
            log_warning "Lighthouse аудит провалился"
        fi
    fi
    
    log_success "Тесты производительности завершены"
}

# Запуск security тестов
run_security_tests() {
    log_info "Запуск security тестов..."
    
    # Проверка зависимостей на уязвимости
    if [ -f "frontend/package.json" ]; then
        cd frontend
        log_info "Проверка npm зависимостей на уязвимости..."
        npm audit --audit-level=high
        cd ..
    fi
    
    if [ -f "backend/requirements.txt" ]; then
        cd backend
        log_info "Проверка Python зависимостей на уязвимости..."
        # Установим safety если его нет
        pip install safety
        safety check
        cd ..
    fi
    
    log_success "Security тесты завершены"
}

# Генерация отчета о покрытии
generate_coverage_report() {
    log_info "Генерация отчета о покрытии кода..."
    
    # Backend coverage
    if [ -d "backend" ]; then
        cd backend
        if command -v coverage &> /dev/null; then
            coverage report
            coverage html
            log_info "Backend coverage отчет: backend/htmlcov/index.html"
        fi
        cd ..
    fi
    
    # Frontend coverage
    if [ -d "frontend/coverage" ]; then
        log_info "Frontend coverage отчет: frontend/coverage/lcov-report/index.html"
    fi
    
    log_success "Отчеты о покрытии созданы"
}

# Очистка после тестов
cleanup() {
    log_info "Очистка временных файлов..."
    
    # Удаляем тестовые файлы
    find . -name "*.pyc" -delete
    find . -name "__pycache__" -type d -exec rm -rf {} + 2>/dev/null || true
    find . -name ".pytest_cache" -type d -exec rm -rf {} + 2>/dev/null || true
    
    # Удаляем тестовые базы данных
    if [ -f "backend/test.db" ]; then
        rm backend/test.db
    fi
    
    log_success "Очистка завершена"
}

# Главная функция
main() {
    echo "🧪 DevAssist Pro Complete Test Suite"
    echo "===================================="
    echo ""
    
    # Парсинг аргументов
    RUN_ALL=true
    RUN_DATABASE=false
    RUN_BACKEND=false
    RUN_FRONTEND=false
    RUN_PERFORMANCE=false
    RUN_SECURITY=false
    SKIP_INSTALL=false
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            --database)
                RUN_ALL=false
                RUN_DATABASE=true
                shift
                ;;
            --backend)
                RUN_ALL=false
                RUN_BACKEND=true
                shift
                ;;
            --frontend)
                RUN_ALL=false
                RUN_FRONTEND=true
                shift
                ;;
            --performance)
                RUN_ALL=false
                RUN_PERFORMANCE=true
                shift
                ;;
            --security)
                RUN_ALL=false
                RUN_SECURITY=true
                shift
                ;;
            --skip-install)
                SKIP_INSTALL=true
                shift
                ;;
            --help)
                echo "Использование: $0 [опции]"
                echo ""
                echo "Опции:"
                echo "  --database      Запустить только тесты базы данных"
                echo "  --backend       Запустить только backend тесты"
                echo "  --frontend      Запустить только frontend тесты"
                echo "  --performance   Запустить только тесты производительности"
                echo "  --security      Запустить только security тесты"
                echo "  --skip-install  Пропустить установку зависимостей"
                echo "  --help          Показать эту справку"
                echo ""
                echo "По умолчанию запускаются все тесты"
                exit 0
                ;;
            *)
                log_error "Неизвестная опция: $1"
                exit 1
                ;;
        esac
    done
    
    # Проверяем окружение
    check_environment
    
    # Устанавливаем зависимости
    if [ "$SKIP_INSTALL" = false ]; then
        install_dependencies
    fi
    
    # Счетчики для отчета
    TOTAL_TESTS=0
    PASSED_TESTS=0
    
    # Запускаем тесты
    if [ "$RUN_ALL" = true ] || [ "$RUN_DATABASE" = true ]; then
        TOTAL_TESTS=$((TOTAL_TESTS + 1))
        if run_database_tests; then
            PASSED_TESTS=$((PASSED_TESTS + 1))
        fi
    fi
    
    if [ "$RUN_ALL" = true ] || [ "$RUN_BACKEND" = true ]; then
        TOTAL_TESTS=$((TOTAL_TESTS + 1))
        if run_backend_tests; then
            PASSED_TESTS=$((PASSED_TESTS + 1))
        fi
    fi
    
    if [ "$RUN_ALL" = true ] || [ "$RUN_FRONTEND" = true ]; then
        TOTAL_TESTS=$((TOTAL_TESTS + 1))
        if run_frontend_tests; then
            PASSED_TESTS=$((PASSED_TESTS + 1))
        fi
    fi
    
    if [ "$RUN_ALL" = true ] || [ "$RUN_PERFORMANCE" = true ]; then
        TOTAL_TESTS=$((TOTAL_TESTS + 1))
        if run_performance_tests; then
            PASSED_TESTS=$((PASSED_TESTS + 1))
        fi
    fi
    
    if [ "$RUN_ALL" = true ] || [ "$RUN_SECURITY" = true ]; then
        TOTAL_TESTS=$((TOTAL_TESTS + 1))
        if run_security_tests; then
            PASSED_TESTS=$((PASSED_TESTS + 1))
        fi
    fi
    
    # Генерируем отчет о покрытии
    if [ "$RUN_ALL" = true ]; then
        generate_coverage_report
    fi
    
    # Очистка
    cleanup
    
    # Итоговый отчет
    echo ""
    echo "======================================"
    echo "🎯 Итоговый отчет тестирования"
    echo "======================================"
    echo "Всего наборов тестов: $TOTAL_TESTS"
    echo "Прошло успешно: $PASSED_TESTS"
    echo "Провалилось: $((TOTAL_TESTS - PASSED_TESTS))"
    
    if [ $PASSED_TESTS -eq $TOTAL_TESTS ]; then
        log_success "🎉 Все тесты прошли успешно!"
        exit 0
    else
        log_error "❌ Некоторые тесты провалились!"
        exit 1
    fi
}

# Запуск
main "$@"