# DevAssist Pro Backend Makefile

.PHONY: help setup start stop restart logs test clean build

# Цвета для вывода
GREEN=\033[0;32m
YELLOW=\033[1;33m
RED=\033[0;31m
NC=\033[0m # No Color

help: ## Показать справку по командам
	@echo "$(GREEN)DevAssist Pro Backend - Доступные команды:$(NC)"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(YELLOW)%-15s$(NC) %s\n", $$1, $$2}'

setup: ## Первоначальная настройка проекта
	@echo "$(GREEN)Настройка DevAssist Pro...$(NC)"
	@cp .env.example .env 2>/dev/null || true
	@echo "$(YELLOW)✓ Создан файл .env$(NC)"
	@echo "$(GREEN)Проект готов к запуску!$(NC)"

start: ## Запустить все сервисы в режиме разработки
	@echo "$(GREEN)Запуск DevAssist Pro в режиме разработки...$(NC)"
	docker-compose -f docker-compose.dev.yml up -d
	@echo "$(YELLOW)Ожидание запуска сервисов...$(NC)"
	@sleep 5
	@echo "$(GREEN)✓ Сервисы запущены!$(NC)"
	@echo "$(YELLOW)API Gateway: http://localhost:8000$(NC)"
	@echo "$(YELLOW)API Docs: http://localhost:8000/api/docs$(NC)"

stop: ## Остановить все сервисы
	@echo "$(GREEN)Остановка сервисов...$(NC)"
	docker-compose -f docker-compose.dev.yml down
	@echo "$(GREEN)✓ Сервисы остановлены$(NC)"

restart: stop start ## Перезапустить все сервисы

logs: ## Показать логи всех сервисов
	docker-compose -f docker-compose.dev.yml logs -f

logs-api: ## Показать логи API Gateway
	docker-compose -f docker-compose.dev.yml logs -f api_gateway_dev

logs-db: ## Показать логи PostgreSQL
	docker-compose -f docker-compose.dev.yml logs -f postgres

logs-redis: ## Показать логи Redis
	docker-compose -f docker-compose.dev.yml logs -f redis

status: ## Показать статус всех контейнеров
	@echo "$(GREEN)Статус контейнеров DevAssist Pro:$(NC)"
	@docker ps --filter "name=devassist_" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

test: ## Запустить тесты инфраструктуры
	@echo "$(GREEN)Тестирование инфраструктуры...$(NC)"
	python tests/run_all_tests.py

test-auth: ## Запустить тесты системы авторизации
	@echo "$(GREEN)Тестирование системы авторизации...$(NC)"
	python tests/integration/test_auth_system.py

test-all: test test-auth ## Запустить все тесты

clean: ## Очистить все данные (ОСТОРОЖНО!)
	@echo "$(RED)ВНИМАНИЕ: Это удалит ВСЕ данные!$(NC)"
	@read -p "Вы уверены? [y/N] " confirm && [ "$$confirm" = "y" ]
	docker-compose -f docker-compose.dev.yml down -v
	docker system prune -f
	@echo "$(GREEN)✓ Очистка завершена$(NC)"

build: ## Пересобрать Docker образы
	@echo "$(GREEN)Пересборка Docker образов...$(NC)"
	docker-compose -f docker-compose.dev.yml build --no-cache
	@echo "$(GREEN)✓ Образы пересобраны$(NC)"

shell-db: ## Подключиться к PostgreSQL
	docker exec -it devassist_postgres_dev psql -U devassist -d devassist_pro_dev

shell-redis: ## Подключиться к Redis
	docker exec -it devassist_redis_dev redis-cli -a redis_password

shell-api: ## Подключиться к контейнеру API Gateway
	docker exec -it devassist_api_gateway_dev /bin/bash

dev-install: ## Установить зависимости для разработки
	pip install psycopg2-binary redis httpx asyncio

health: ## Проверить здоровье всех сервисов
	@echo "$(GREEN)Проверка здоровья сервисов...$(NC)"
	@curl -s http://localhost:8000/health | python -m json.tool || echo "$(RED)API Gateway недоступен$(NC)"

# Алиасы для удобства
up: start
down: stop
ps: status