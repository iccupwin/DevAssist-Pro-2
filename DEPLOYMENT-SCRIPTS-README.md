# DevAssist Pro - Скрипты развертывания

## Созданные скрипты для запуска на сервере

### 🚀 Основные скрипты

1. **`start-monolith-backend.sh`** - Основной скрипт запуска
   - Проверяет Docker и зависимости
   - Создает .env из .env.example если нужно
   - Запускает все сервисы через Docker Compose
   - Проверяет здоровье приложения
   - Показывает полезную информацию

2. **`stop-monolith-backend.sh`** - Остановка backend
   - Корректно останавливает все контейнеры
   - Очищает неиспользуемые ресурсы

3. **`check-monolith-status.sh`** - Проверка статуса
   - Показывает статус контейнеров
   - Проверяет здоровье API
   - Показывает использование ресурсов
   - Проверяет AI провайдеров

4. **`test-monolith-api.sh`** - Тестирование API
   - Проверяет все основные endpoints
   - Тестирует доступность сервисов
   - Проверяет конфигурацию AI

5. **`monolith-manager.sh`** - Универсальный менеджер
   - Единый интерфейс для всех операций
   - Команды: start, stop, restart, status, test, logs, clean

### 📋 Документация

6. **`MONOLITH-DEPLOYMENT-GUIDE.md`** - Полное руководство по развертыванию
   - Требования к серверу
   - Пошаговые инструкции
   - Настройка переменных окружения
   - Мониторинг и диагностика
   - Устранение неполадок

## 🎯 Быстрый старт на сервере

```bash
# 1. Клонировать проект
git clone <repository-url> DevAssist-Pro
cd DevAssist-Pro

# 2. Настроить переменные окружения
cp .env.example .env
nano .env  # Установите API ключи и пароли

# 3. Запустить backend
./start-monolith-backend.sh

# 4. Проверить статус
./check-monolith-status.sh

# 5. Протестировать API
./test-monolith-api.sh
```

## 🔧 Управление через универсальный менеджер

```bash
# Запуск
./monolith-manager.sh start

# Статус
./monolith-manager.sh status

# Тестирование
./monolith-manager.sh test

# Логи
./monolith-manager.sh logs

# Остановка
./monolith-manager.sh stop

# Справка
./monolith-manager.sh help
```

## ⚠️ Важные замечания

### Переменные окружения
Обязательно настройте в `.env`:
- `ANTHROPIC_API_KEY` - для AI анализа
- `OPENAI_API_KEY` - для AI анализа
- `ADMIN_PASSWORD` - пароль администратора
- `POSTGRES_PASSWORD` - пароль базы данных
- `REDIS_PASSWORD` - пароль Redis

### Порты
- Backend API: `8000`
- PostgreSQL: `5432` (внутренний)
- Redis: `6379` (внутренний)

### Требования к серверу
- Docker 20.10+
- Docker Compose 1.29+
- 4GB+ RAM
- 20GB+ дискового места

## 🌐 После запуска

Доступные URL:
- **Главная**: http://your-server:8000/
- **API Docs**: http://your-server:8000/docs
- **Health**: http://your-server:8000/health
- **Admin**: http://your-server:8000/api/admin/status

## 🔍 Диагностика

```bash
# Проверка контейнеров
docker ps --filter "name=devassist_"

# Логи
cd backend && docker-compose -f docker-compose.monolith.yml logs -f

# Здоровье API
curl http://localhost:8000/health

# Статус AI
curl http://localhost:8000/api/llm/health
```

## 📁 Структура проекта

```
DevAssist-Pro/
├── start-monolith-backend.sh     # Основной скрипт запуска
├── stop-monolith-backend.sh      # Остановка
├── check-monolith-status.sh      # Проверка статуса
├── test-monolith-api.sh          # Тестирование API
├── monolith-manager.sh           # Универсальный менеджер
├── MONOLITH-DEPLOYMENT-GUIDE.md  # Полное руководство
├── backend/
│   ├── docker-compose.monolith.yml  # Docker Compose конфигурация
│   ├── Dockerfile.monolith          # Dockerfile для монолита
│   ├── app.py                       # Основное приложение
│   └── Makefile.monolith           # Makefile команды
└── .env.example                     # Пример переменных окружения
```

Все скрипты готовы к использованию на сервере! 🎉