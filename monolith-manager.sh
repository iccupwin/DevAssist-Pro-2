#!/bin/bash

# DevAssist Pro - Менеджер монолитного backend'а
# Универсальный скрипт для управления

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

show_help() {
    echo "🚀 DevAssist Pro - Менеджер монолитного Backend"
    echo ""
    echo "Использование: $0 [КОМАНДА]"
    echo ""
    echo "Доступные команды:"
    echo "  start     - Запустить backend"
    echo "  stop      - Остановить backend"
    echo "  restart   - Перезапустить backend"
    echo "  status    - Проверить статус"
    echo "  test      - Протестировать API"
    echo "  logs      - Показать логи"
    echo "  clean     - Очистить данные (ОСТОРОЖНО!)"
    echo "  help      - Показать эту справку"
    echo ""
    echo "Примеры:"
    echo "  $0 start"
    echo "  $0 status"
    echo "  $0 test"
}

case "$1" in
    start)
        echo -e "${GREEN}🚀 Запуск DevAssist Pro Backend...${NC}"
        ./start-monolith-backend.sh
        ;;
    stop)
        echo -e "${RED}🛑 Остановка DevAssist Pro Backend...${NC}"
        ./stop-monolith-backend.sh
        ;;
    restart)
        echo -e "${YELLOW}🔄 Перезапуск DevAssist Pro Backend...${NC}"
        ./stop-monolith-backend.sh
        sleep 3
        ./start-monolith-backend.sh
        ;;
    status)
        echo -e "${BLUE}📊 Проверка статуса DevAssist Pro Backend...${NC}"
        ./check-monolith-status.sh
        ;;
    test)
        echo -e "${BLUE}🧪 Тестирование API DevAssist Pro Backend...${NC}"
        ./test-monolith-api.sh
        ;;
    logs)
        echo -e "${BLUE}📋 Просмотр логов DevAssist Pro Backend...${NC}"
        if [ -f "backend/docker-compose.monolith.yml" ]; then
            cd backend
            if command -v docker-compose &> /dev/null; then
                docker-compose -f docker-compose.monolith.yml logs -f
            else
                docker compose -f docker-compose.monolith.yml logs -f
            fi
        else
            echo -e "${RED}Файл docker-compose.monolith.yml не найден!${NC}"
        fi
        ;;
    clean)
        echo -e "${RED}🗑️  ВНИМАНИЕ: Очистка всех данных DevAssist Pro!${NC}"
        read -p "Вы уверены? Это удалит ВСЕ данные! [y/N]: " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            ./stop-monolith-backend.sh
            if [ -f "backend/docker-compose.monolith.yml" ]; then
                cd backend
                if command -v docker-compose &> /dev/null; then
                    docker-compose -f docker-compose.monolith.yml down -v
                else
                    docker compose -f docker-compose.monolith.yml down -v
                fi
                docker system prune -f --volumes
                echo -e "${GREEN}✅ Очистка завершена${NC}"
            fi
        else
            echo "Операция отменена"
        fi
        ;;
    help|--help|-h|"")
        show_help
        ;;
    *)
        echo -e "${RED}❌ Неизвестная команда: $1${NC}"
        echo ""
        show_help
        exit 1
        ;;
esac