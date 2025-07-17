# 🏗️ DevAssist Pro - FastAPI Backend Architecture

Обновленная архитектура с микросервисами FastAPI вместо Streamlit.

## 🎯 Правильная архитектура проекта

```
📁 DevAssist-Pro/
├── backend/                    # FastAPI микросервисы
│   ├── api_gateway/           # API Gateway (порт 8000)
│   ├── services/
│   │   ├── auth/             # Сервис аутентификации
│   │   ├── llm/              # LLM сервис (AI)
│   │   ├── documents/        # Обработка документов
│   │   ├── reports/          # Генерация отчетов
│   │   └── dashboard/        # Dashboard API
│   └── shared/               # Общие модели и утилиты
├── frontend/                  # React SPA (порт 3000)
│   └── src/                  # React компоненты
├── demo_app.py               # Streamlit demo (опционально)
└── docker-compose.server.yml # Полная конфигурация
```

## 🔧 Сервисы в архитектуре

### 1. **API Gateway** (порт 8000)
- Главная точка входа для всех API запросов
- Маршрутизация к микросервисам
- Аутентификация и авторизация
- CORS настройки

### 2. **Auth Service**
- Регистрация и логин пользователей
- JWT токены
- OAuth интеграция

### 3. **LLM Service** 
- Интеграция с AI API (OpenAI, Anthropic, Google)
- Обработка запросов к ИИ
- КП анализ

### 4. **Documents Service**
- Загрузка и обработка файлов
- Извлечение текста из PDF/DOCX
- Хранение документов

### 5. **Reports Service**
- Генерация PDF отчетов
- Excel экспорт
- Шаблоны отчетов

### 6. **Dashboard Service**
- Статистика и аналитика
- Метрики использования
- Dashboard данные

## 🚀 Развертывание с FastAPI Backend

### Команды для запуска:

```bash
# Полное развертывание с микросервисами
./deploy-server.sh

# Статус всех сервисов
docker-compose -f docker-compose.server.yml ps

# Логи API Gateway
docker-compose -f docker-compose.server.yml logs -f api-gateway

# Логи конкретного сервиса
docker-compose -f docker-compose.server.yml logs -f llm-service
```

## 🌐 Доступные endpoints:

- **React Frontend**: `http://ваш-IP:3000`
- **API Gateway**: `http://ваш-IP:8000`
- **API Docs**: `http://ваш-IP:8000/docs`
- **Health Check**: `http://ваш-IP:8000/health`
- **Streamlit Demo**: `http://ваш-IP:8501` (опционально)

## 🔍 API Маршруты

### Основные API endpoints:

```bash
# Аутентификация
POST /api/auth/login
POST /api/auth/register
GET  /api/auth/profile

# КП Анализ
POST /api/kp-analyzer/upload
POST /api/kp-analyzer/analyze
GET  /api/kp-analyzer/status/{id}
GET  /api/kp-analyzer/results/{id}

# Документы
POST /api/documents/upload
GET  /api/documents/{id}
DELETE /api/documents/{id}

# Отчеты
POST /api/reports/generate
GET  /api/reports/{id}/download
GET  /api/reports/history

# Dashboard
GET  /api/dashboard/stats
GET  /api/dashboard/analytics
```

## 🛠 Разработка и отладка

### Работа с отдельными сервисами:

```bash
# Перезапуск конкретного сервиса
docker-compose -f docker-compose.server.yml restart llm-service

# Подключение к контейнеру для отладки
docker-compose -f docker-compose.server.yml exec api-gateway bash

# Просмотр логов в реальном времени
docker-compose -f docker-compose.server.yml logs -f

# Проверка здоровья сервисов
curl http://localhost:8000/health
```

### Backend development:

```bash
# Запуск только backend сервисов (без frontend)
docker-compose -f docker-compose.server.yml up -d postgres redis auth-service llm-service api-gateway

# Тестирование API
curl -X GET http://localhost:8000/docs
curl -X GET http://localhost:8000/health
```

## 📊 Мониторинг и логи

### Проверка состояния микросервисов:

```bash
# Проверка всех контейнеров
docker-compose -f docker-compose.server.yml ps

# Использование ресурсов
docker stats

# Логи по сервисам
docker-compose -f docker-compose.server.yml logs auth-service
docker-compose -f docker-compose.server.yml logs llm-service
docker-compose -f docker-compose.server.yml logs documents-service
```

## 🔄 Различия с предыдущей версией

### Было (Streamlit):
- Монолитное приложение на Streamlit
- Один порт (8501)
- Ограниченные возможности API

### Стало (FastAPI):
- Микросервисная архитектура
- Отдельные сервисы для разных задач
- RESTful API
- Лучшая масштабируемость
- Документация API
- Proper аутентификация

## 🎯 Переходы между версиями

### Для React Frontend:
```javascript
// Старый endpoint (Streamlit)
const API_URL = 'http://localhost:8501'

// Новый endpoint (FastAPI)
const API_URL = 'http://localhost:8000/api'
```

### Для API запросов:
```bash
# Старый способ (Streamlit session state)
# Нет прямых API вызовов

# Новый способ (FastAPI REST API)
curl -X POST http://localhost:8000/api/kp-analyzer/analyze \
  -H "Content-Type: application/json" \
  -d '{"tz_file": "file.pdf", "kp_files": ["kp1.pdf"]}'
```

---

**🎉 Теперь у вас полноценная микросервисная архитектура с FastAPI!**