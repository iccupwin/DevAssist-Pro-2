#!/bin/bash
# ===========================================
# DevAssist Pro - Проверка системы
# ===========================================

# Цвета
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo ""
echo "========================================"
echo -e "${BLUE}🔍 DevAssist Pro - Проверка системы${NC}"
echo "========================================"
echo ""

# 1. Проверяем Docker
echo -e "${BLUE}📦 Docker:${NC}"
if command -v docker &> /dev/null; then
    echo -e "  ✅ Docker установлен: $(docker --version | cut -d' ' -f3)"
else
    echo -e "  ❌ Docker не установлен"
fi

if command -v docker-compose &> /dev/null; then
    echo -e "  ✅ Docker Compose установлен: $(docker-compose --version | cut -d' ' -f3)"
else
    echo -e "  ❌ Docker Compose не установлен"
fi
echo ""

# 2. Проверяем файлы проекта
echo -e "${BLUE}📁 Файлы проекта:${NC}"
required_files=(
    "Dockerfile.fullstack"
    "docker-compose.fullstack.yml"
    "start-fullstack.sh"
    "stop-fullstack.sh"
    ".env"
)

for file in "${required_files[@]}"; do
    if [ -f "$file" ]; then
        echo -e "  ✅ $file"
    else
        echo -e "  ❌ $file"
    fi
done
echo ""

# 3. Проверяем контейнеры
echo -e "${BLUE}🐳 Контейнеры:${NC}"
if docker-compose -f docker-compose.fullstack.yml ps | grep -q "Up"; then
    echo -e "  ✅ Контейнеры запущены"
    docker-compose -f docker-compose.fullstack.yml ps
else
    echo -e "  ❌ Контейнеры не запущены"
fi
echo ""

# 4. Проверяем сеть
echo -e "${BLUE}🌐 Сетевые проверки:${NC}"

# HTTP Health Check
if curl -f -s http://localhost:80/health > /dev/null 2>&1; then
    echo -e "  ✅ HTTP Health Check (http://localhost:80/health)"
else
    echo -e "  ❌ HTTP Health Check недоступен"
fi

# API Health Check  
if curl -f -s http://localhost:80/api/health > /dev/null 2>&1; then
    echo -e "  ✅ API Health Check (http://localhost:80/api/health)"
else
    echo -e "  ❌ API Health Check недоступен"
fi

# API Docs
if curl -f -s http://localhost:80/api/docs > /dev/null 2>&1; then
    echo -e "  ✅ API Documentation (http://localhost:80/api/docs)"
else
    echo -e "  ❌ API Documentation недоступна"
fi

# Главная страница
if curl -f -s http://localhost:80/ > /dev/null 2>&1; then
    echo -e "  ✅ Главная страница (http://localhost:80/)"
else
    echo -e "  ❌ Главная страница недоступна"
fi
echo ""

# 5. Проверяем ресурсы
echo -e "${BLUE}💻 Ресурсы системы:${NC}"

# RAM
MEMORY_USAGE=$(free | grep Mem | awk '{printf("%.1f", $3/$2 * 100.0)}')
echo -e "  📊 Использование RAM: ${MEMORY_USAGE}%"

# Диск
DISK_USAGE=$(df . | tail -1 | awk '{print $5}')
echo -e "  💾 Использование диска: $DISK_USAGE"

# Docker stats (если контейнеры запущены)
if docker-compose -f docker-compose.fullstack.yml ps | grep -q "Up"; then
    echo -e "  🐳 Docker статистика:"
    docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}" | head -4
fi
echo ""

# 6. Внешний IP и доступность
echo -e "${BLUE}🌍 Внешний доступ:${NC}"
EXTERNAL_IP=$(curl -s ifconfig.me 2>/dev/null || curl -s ipinfo.io/ip 2>/dev/null || echo "неизвестен")
echo -e "  🌐 Внешний IP: $EXTERNAL_IP"

if [ "$EXTERNAL_IP" != "неизвестен" ]; then
    echo -e "  📊 Доступные URL:"
    echo -e "     • http://$EXTERNAL_IP/"
    echo -e "     • http://$EXTERNAL_IP/health"
    echo -e "     • http://$EXTERNAL_IP/api/docs"
fi
echo ""

# 7. Проверяем логи на ошибки
echo -e "${BLUE}📋 Последние логи (ошибки):${NC}"
if docker-compose -f docker-compose.fullstack.yml ps | grep -q "Up"; then
    ERRORS=$(docker-compose -f docker-compose.fullstack.yml logs --tail=50 2>&1 | grep -i error | tail -3)
    if [ -n "$ERRORS" ]; then
        echo -e "  ⚠️ Найдены ошибки в логах:"
        echo "$ERRORS" | sed 's/^/     /'
    else
        echo -e "  ✅ Критических ошибок в логах не найдено"
    fi
else
    echo -e "  ❌ Контейнеры не запущены, логи недоступны"
fi
echo ""

# 8. Финальная оценка
echo "========================================"
if docker-compose -f docker-compose.fullstack.yml ps | grep -q "Up" && \
   curl -f -s http://localhost:80/health > /dev/null 2>&1; then
    echo -e "${GREEN}🎉 СИСТЕМА РАБОТАЕТ КОРРЕКТНО!${NC}"
    echo -e "${GREEN}   DevAssist Pro готов к использованию${NC}"
else
    echo -e "${RED}⚠️ ОБНАРУЖЕНЫ ПРОБЛЕМЫ${NC}"
    echo -e "${YELLOW}   Рекомендуется запустить: ./fix-npm-error.sh${NC}"
fi
echo "========================================"
echo ""