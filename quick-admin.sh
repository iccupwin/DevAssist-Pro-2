#!/bin/bash

# DevAssist Pro - Быстрое создание администратора
# Простой скрипт для создания первого админа

# Цвета
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}🔐 Создание первого администратора...${NC}"
echo ""

# Параметры по умолчанию
EMAIL="admin@devassist.pro"
PASSWORD="admin123456"
NAME="System Administrator"

# Создаем админа через API
echo -e "${BLUE}Пытаемся создать админа через API...${NC}"

curl -X POST http://localhost:8000/api/admin/users/create-admin \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$EMAIL\",
    \"password\": \"$PASSWORD\",
    \"full_name\": \"$NAME\",
    \"company\": \"DevAssist Pro\",
    \"position\": \"System Administrator\"
  }" \
  2>/dev/null

echo ""
echo ""

# Проверяем результат
if curl -f -s http://localhost:8000/health >/dev/null 2>&1; then
    echo -e "${GREEN}✅ API доступен${NC}"
    echo -e "${GREEN}✅ Администратор создан!${NC}"
    echo ""
    echo -e "${BLUE}Данные для входа:${NC}"
    echo "  URL: http://46.149.71.162/admin"
    echo "  Email: $EMAIL"
    echo "  Пароль: $PASSWORD"
    echo ""
    echo -e "${RED}⚠️  Смените пароль после первого входа!${NC}"
else
    echo -e "${RED}❌ API недоступен. Проверьте что сервисы запущены:${NC}"
    echo "  docker compose ps"
    echo "  docker compose logs"
fi