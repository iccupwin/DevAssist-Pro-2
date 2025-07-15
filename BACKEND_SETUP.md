# Настройка Backend для DevAssist Pro

## Проблема: "Failed to fetch" при регистрации

Если вы получаете ошибку "Failed to fetch" при попытке регистрации, это означает, что backend сервисы не запущены или недоступны.

## Решение

### 1. Запуск Backend сервисов

```bash
# Перейдите в корневую директорию проекта
cd DevAssist-Pro

# Запустите все сервисы через Docker Compose
docker-compose -f docker-compose.fullstack.yml up -d

# Или запустите только backend сервисы
docker-compose -f backend/docker-compose.yml up -d
```

### 2. Проверка статуса сервисов

```bash
# Проверьте, что все контейнеры запущены
docker ps

# Проверьте логи API Gateway
docker logs devassist_api_gateway_full

# Проверьте логи Auth Service
docker logs devassist_auth_service_full
```

### 3. Проверка доступности API

```bash
# Проверьте API Gateway
curl http://localhost:8000/health

# Проверьте Auth Service напрямую
curl http://localhost:8001/health
```

### 4. Настройка переменных окружения

Создайте файл `.env` в корневой директории:

```env
# Database
DATABASE_URL=postgresql://devassist:devassist_secure_password@localhost:5433/devassist_pro

# Redis
REDIS_URL=redis://:redis_password@localhost:6378/0

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# AI Providers (опционально)
ANTHROPIC_API_KEY=your_anthropic_key
OPENAI_API_KEY=your_openai_key
GOOGLE_API_KEY=your_google_key

# OAuth (опционально)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

### 5. Инициализация базы данных

```bash
# Создайте таблицы в базе данных
docker exec -it devassist_postgres_full psql -U devassist -d devassist_pro -f /docker-entrypoint-initdb.d/init.sql
```

### 6. Альтернативное решение - Mock режим

Если backend недоступен, приложение автоматически переключится на mock режим для регистрации. Это позволит тестировать frontend функциональность.

## Диагностика

### Проверка портов

Убедитесь, что следующие порты свободны:
- 8000 (API Gateway)
- 8001 (Auth Service)
- 5433 (PostgreSQL)
- 6378 (Redis)

### Проверка CORS

Если вы получаете CORS ошибки, убедитесь, что в API Gateway настроены правильные origins:

```python
# В backend/api_gateway/main.py
allow_origins=["http://localhost:3000", "http://localhost:3001"]
```

### Логи ошибок

Проверьте логи браузера (F12 → Console) для получения подробной информации об ошибках.

## Быстрый старт

```bash
# 1. Остановите все контейнеры
docker-compose -f docker-compose.fullstack.yml down

# 2. Удалите volumes (если нужно начать с чистой БД)
docker-compose -f docker-compose.fullstack.yml down -v

# 3. Запустите все сервисы
docker-compose -f docker-compose.fullstack.yml up -d

# 4. Подождите 30 секунд для инициализации
sleep 30

# 5. Проверьте статус
curl http://localhost:8000/health
```

После выполнения этих шагов регистрация должна работать корректно. 