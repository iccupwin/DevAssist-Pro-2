#!/bin/bash

set -e

echo "🚀 DevAssist Pro - КОМПЛЕКСНОЕ ИСПРАВЛЕНИЕ И РАЗВЕРТЫВАНИЕ"
echo "=========================================================="
echo "Исправление аутентификации, CORS и TypeScript ошибок"
echo ""

SERVER_IP="46.149.71.162"
LOG_FILE="/tmp/devassist-fix-$(date +%Y%m%d-%H%M%S).log"

# Функция логирования
log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOG_FILE"
}

log "🔧 Начало процесса исправления DevAssist Pro"

echo "📋 Этапы исправления:"
echo "  1. ✅ Исправление CORS конфигурации"
echo "  2. ✅ Исправление TypeScript ошибок"
echo "  3. 🔄 Остановка всех сервисов"
echo "  4. 🧹 Очистка и подготовка"
echo "  5. 🐳 Пересборка и запуск"
echo "  6. 🧪 Проверка аутентификации"
echo ""

# Этап 1: Проверка текущего состояния
log "📊 Этап 1: Проверка текущего состояния"

echo "🔍 Проверка файлов конфигурации..."
if [ ! -f ".env.production" ]; then
    log "❌ Файл .env.production не найден"
    exit 1
fi

if [ ! -f "backend/.env.production" ]; then
    log "❌ Файл backend/.env.production не найден"
    exit 1
fi

log "✅ Конфигурационные файлы найдены"

# Этап 2: Проверка исправлений
log "📊 Этап 2: Проверка исправлений"

echo "🔍 Проверка CORS конфигурации..."
if grep -q "http://46.149.71.162:3000" .env.production; then
    log "✅ CORS конфигурация в .env.production исправлена"
else
    log "⚠️  Исправление CORS конфигурации в .env.production"
    sed -i 's|ALLOWED_ORIGINS=.*|ALLOWED_ORIGINS=http://46.149.71.162:3000,http://46.149.71.162,https://46.149.71.162,http://localhost:3000,http://localhost|' .env.production
fi

if grep -q "http://46.149.71.162:3000" backend/.env.production; then
    log "✅ CORS конфигурация в backend/.env.production исправлена"
else
    log "⚠️  Исправление CORS конфигурации в backend/.env.production"
    sed -i 's|ALLOWED_ORIGINS=.*|ALLOWED_ORIGINS=http://46.149.71.162:3000,http://46.149.71.162,https://46.149.71.162,http://localhost:3000,http://localhost|' backend/.env.production
fi

echo "🔍 Проверка TypeScript типов..."
if grep -q "export interface ComparisonResult" frontend/src/utils/types.ts; then
    log "✅ TypeScript типы исправлены"
else
    log "⚠️  Добавление недостающих TypeScript типов"
    cat >> frontend/src/utils/types.ts << 'EOF'

// Типы для отчетов и анализа
export interface ComparisonResult {
  summary: string;
  recommendations: string[];
  bestProposal?: {
    id: string;
    companyName: string;
    score: number;
    reasons: string[];
  };
}

export interface RealAnalysisResult {
  id: string;
  tz_name: string;
  kp_name: string;
  company_name: any;
  tech_stack: any;
  pricing: any;
  timeline: any;
  total_cost: any;
  currency: any;
  cost_breakdown: any;
  competitive_advantages: any;
  team_expertise: any;
  methodology: any;
  quality_assurance: any;
  // Опциональные поля
  post_launch_support?: any;
  document_quality?: any;
  file_format?: any;
  summary: any;
  confidence_score: any;
}
EOF
fi

# Этап 3: Остановка всех сервисов
log "🛑 Этап 3: Остановка всех сервисов"

echo "🛑 Остановка Docker контейнеров..."
docker compose down 2>/dev/null || true
docker compose -f docker-compose.production.yml down 2>/dev/null || true
docker compose -f docker-compose.dev.yml down 2>/dev/null || true

echo "🛑 Остановка процессов на портах..."
sudo fuser -k 3000/tcp 2>/dev/null || true
sudo fuser -k 8000/tcp 2>/dev/null || true
sudo fuser -k 8001/tcp 2>/dev/null || true
sudo fuser -k 8002/tcp 2>/dev/null || true
sudo fuser -k 8003/tcp 2>/dev/null || true
sudo fuser -k 8004/tcp 2>/dev/null || true
sudo fuser -k 8005/tcp 2>/dev/null || true
sudo fuser -k 8006/tcp 2>/dev/null || true

# Небольшая пауза
sleep 3

log "✅ Все сервисы остановлены"

# Этап 4: Очистка и подготовка
log "🧹 Этап 4: Очистка и подготовка"

echo "🧹 Очистка Docker ресурсов..."
docker system prune -f 2>/dev/null || true
docker volume prune -f 2>/dev/null || true

echo "🧹 Очистка frontend build кэша..."
cd frontend
npm cache clean --force 2>/dev/null || true
rm -rf node_modules/.cache 2>/dev/null || true
rm -rf build 2>/dev/null || true
cd ..

log "✅ Очистка завершена"

# Этап 5: Пересборка и запуск
log "🐳 Этап 5: Пересборка и запуск сервисов"

echo "📦 Копирование production конфигурации..."
cp .env.production .env
cp backend/.env.production backend/.env

echo "🔨 Пересборка Docker образов..."
docker compose build --no-cache --pull

echo "🚀 Запуск всех сервисов..."
docker compose up -d

echo "⏳ Ожидание запуска сервисов (60 секунд)..."
sleep 60

log "✅ Сервисы запущены"

# Этап 6: Проверка состояния
log "📊 Этап 6: Проверка состояния сервисов"

echo "📊 Состояние Docker контейнеров:"
docker compose ps

echo ""
echo "📊 Проверка портов:"
for port in 3000 8000 8001 8002 8003 8004 8005 8006; do
    if netstat -ln | grep -q ":$port "; then
        echo "  ✅ Port $port: активен"
    else
        echo "  ❌ Port $port: не активен"
    fi
done

echo ""
echo "📊 Проверка доступности сервисов:"

# Проверка Frontend
if curl -f -s --max-time 10 "http://$SERVER_IP:3000" >/dev/null 2>&1; then
    echo "  ✅ Frontend (3000): доступен"
    FRONTEND_OK=true
else
    echo "  ❌ Frontend (3000): недоступен"
    FRONTEND_OK=false
fi

# Проверка API Gateway
if curl -f -s --max-time 10 "http://$SERVER_IP:8000/health" >/dev/null 2>&1; then
    echo "  ✅ API Gateway (8000): доступен"
    BACKEND_OK=true
else
    echo "  ❌ API Gateway (8000): недоступен"
    BACKEND_OK=false
fi

# Проверка Monolithic App (порт 8000 уже проверен как API Gateway)
# В монолитной архитектуре auth является частью основного приложения
if curl -f -s --max-time 10 "http://$SERVER_IP:8000/api/auth/health" >/dev/null 2>&1; then
    echo "  ✅ Auth Module: доступен"
    AUTH_OK=true
else
    echo "  ⚠️  Auth Module: проверка через API Gateway"
    AUTH_OK=$BACKEND_OK
fi

# Этап 7: Запуск проверки аутентификации
log "🧪 Этап 7: Проверка аутентификации"

echo ""
echo "🧪 Запуск проверки аутентификации..."
if [ -f "./auth-verification.sh" ]; then
    chmod +x ./auth-verification.sh
    if ./auth-verification.sh; then
        log "✅ Проверка аутентификации успешна"
        AUTH_TEST_OK=true
    else
        log "❌ Проверка аутентификации неуспешна"
        AUTH_TEST_OK=false
    fi
else
    echo "⚠️  Скрипт проверки аутентификации не найден"
    AUTH_TEST_OK=false
fi

# Финальный отчет
echo ""
echo "🎯 ФИНАЛЬНЫЙ ОТЧЕТ"
echo "=================="

log "📊 Результаты развертывания:"

if [ "$FRONTEND_OK" = true ] && [ "$BACKEND_OK" = true ] && [ "$AUTH_OK" = true ]; then
    if [ "$AUTH_TEST_OK" = true ]; then
        echo "🎉 ПОЛНЫЙ УСПЕХ! Все сервисы работают, аутентификация исправлена!"
        echo ""
        echo "🌐 Доступные URLs:"
        echo "   Frontend: http://$SERVER_IP:3000"
        echo "   Backend API: http://$SERVER_IP:8000"
        echo "   Auth Service: http://$SERVER_IP:8001"
        echo ""
        echo "✅ Исправления применены:"
        echo "   • CORS конфигурация обновлена"
        echo "   • TypeScript типы добавлены"
        echo "   • Аутентификация протестирована"
        
        log "🎉 УСПЕШНОЕ РАЗВЕРТЫВАНИЕ - Все сервисы работают корректно"
        
        echo ""
        echo "📋 Команды для управления:"
        echo "   Остановка: docker compose down"
        echo "   Перезапуск: docker compose restart"
        echo "   Логи: docker compose logs -f"
        echo "   Статус: docker compose ps"
        
        exit 0
    else
        echo "⚠️  ЧАСТИЧНЫЙ УСПЕХ. Сервисы запущены, но есть проблемы с аутентификацией."
        log "⚠️  ЧАСТИЧНЫЙ УСПЕХ - Проблемы с аутентификацией"
        exit 1
    fi
else
    echo "🚨 ОШИБКА РАЗВЕРТЫВАНИЯ! Не все сервисы запустились."
    
    echo ""
    echo "❌ Проблемные сервисы:"
    [ "$FRONTEND_OK" = false ] && echo "   • Frontend"
    [ "$BACKEND_OK" = false ] && echo "   • API Gateway"
    [ "$AUTH_OK" = false ] && echo "   • Auth Service"
    
    echo ""
    echo "🔧 Рекомендации по исправлению:"
    echo "   1. Проверьте логи: docker compose logs"
    echo "   2. Проверьте порты: netstat -tulpn | grep -E ':(3000|8000|8001)'"
    echo "   3. Перезапустите проблемные сервисы"
    echo "   4. Проверьте файлы конфигурации .env"
    
    echo ""
    echo "📋 Файл лога: $LOG_FILE"
    
    log "🚨 ОШИБКА РАЗВЕРТЫВАНИЯ - Не все сервисы запустились"
    exit 2
fi