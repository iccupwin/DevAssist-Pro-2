# DevAssist Pro Backend

Backend микросервисы для AI-powered веб-портала автоматизации для девелоперов недвижимости.

## Структура backend

```
backend/
├── api_gateway/            # API Gateway сервис
├── services/               # Микросервисы
│   ├── auth/               # Сервис авторизации
│   ├── llm/                # LLM оркестрация
│   ├── documents/          # Обработка документов
│   ├── dashboard/          # Dashboard сервис
│   ├── analytics/          # Аналитика (заготовка)
│   └── reports/            # Отчеты (заготовка)
├── shared/                 # Общие компоненты
├── tests/                  # Тесты
├── database/               # Database schemas
├── docker-compose.*.yml    # Docker конфигурации
├── Makefile               # Команды разработки
└── .env                   # Переменные окружения
```

## Быстрый старт

```bash
# Настройка проекта
make setup

# Запуск всех сервисов
make start

# Проверка статуса
make status

# Просмотр логов
make logs
```

## Архитектура

**DevAssist Pro** построен как SaaS веб-портал с модульной архитектурой:

- **Микросервисы Backend**: FastAPI с PostgreSQL и Redis
- **Frontend**: React SPA с модульной структурой
- **AI Integration**: Поддержка OpenAI, Anthropic, Google
- **Первый модуль**: КП Анализатор (Commercial Proposal Analyzer)

## Документация

- **Backend документация**: `backend/README.md`
- **Техническое задание**: `../docs/devassist_tech_spec.md`
- **Подробная документация**: `CLAUDE.md`

## API

- **API Gateway**: http://localhost:8000
- **API Documentation**: http://localhost:8000/api/docs
- **Health Check**: http://localhost:8000/health

## Команды разработки

```bash
make help           # Показать все доступные команды
make start          # Запустить все сервисы
make stop           # Остановить все сервисы
make restart        # Перезапустить сервисы
make logs           # Просмотр логов
make test           # Запустить тесты
make clean          # Очистить все данные
make health         # Проверить здоровье сервисов
```

## Статус разработки

- ✅ Backend микросервисы
- ✅ API Gateway
- ✅ AI интеграция
- ✅ КП Анализатор модуль
- 🚧 Frontend React SPA
- 📋 Планируемые модули: ТЗ Генератор, Оценка проектов, Маркетинг планировщик