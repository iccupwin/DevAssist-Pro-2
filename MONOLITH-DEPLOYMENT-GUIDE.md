# DevAssist Pro - Руководство по развертыванию монолитного Backend

## Обзор

Данное руководство описывает процесс развертывания DevAssist Pro в монолитном режиме с использованием Docker Compose.

## Требования к серверу

- **OS**: Ubuntu 20.04+ / CentOS 7+ / Debian 10+
- **CPU**: 2+ ядра
- **RAM**: 4GB+ (рекомендуется 8GB)
- **Disk**: 20GB+ свободного места
- **Docker**: версия 20.10+
- **Docker Compose**: версия 1.29+ или встроенный `docker compose`

## Быстрый старт

### 1. Подготовка сервера

```bash
# Клонирование проекта
git clone <repository-url> DevAssist-Pro
cd DevAssist-Pro

# Копирование переменных окружения
cp .env.example .env

# Редактирование конфигурации (ОБЯЗАТЕЛЬНО!)
nano .env
```

### 2. Настройка переменных окружения

Отредактируйте файл `.env` и установите следующие критически важные переменные:

```bash
# AI Provider API Keys (ОБЯЗАТЕЛЬНО для работы анализа)
ANTHROPIC_API_KEY=sk-ant-api03-...
OPENAI_API_KEY=sk-...
GOOGLE_API_KEY=...

# Безопасность (ОБЯЗАТЕЛЬНО в production)
ADMIN_PASSWORD=your_secure_password_here
JWT_SECRET=your-super-secret-jwt-key

# База данных
POSTGRES_PASSWORD=secure_db_password
REDIS_PASSWORD=secure_redis_password

# Разрешенные домены (для CORS)
ALLOWED_ORIGINS=http://your-domain.com:3000,http://your-server-ip:3000
```

⚠️ **ВАЖНО**: Не используйте дефолтные пароли в production!

### 3. Запуск

```bash
# Запуск всех сервисов
./start-monolith-backend.sh
```

### 4. Проверка

```bash
# Проверка статуса
./check-monolith-status.sh

# Или ручная проверка
curl http://localhost:8000/health
```

## Управление сервисами

### Основные команды

```bash
# Запуск
./start-monolith-backend.sh

# Остановка
./stop-monolith-backend.sh

# Проверка статуса
./check-monolith-status.sh

# Просмотр логов
cd backend && docker-compose -f docker-compose.monolith.yml logs -f

# Перезапуск
cd backend && docker-compose -f docker-compose.monolith.yml restart
```

### Makefile команды (альтернатива)

```bash
cd backend

# Запуск через Makefile
make -f Makefile.monolith start

# Остановка
make -f Makefile.monolith stop

# Просмотр логов
make -f Makefile.monolith logs

# Проверка здоровья
make -f Makefile.monolith health
```

## Архитектура развертывания

### Контейнеры

1. **devassist_postgres_monolith** - База данных PostgreSQL
2. **devassist_redis_monolith** - Кеш Redis
3. **devassist_app_monolith** - Основное FastAPI приложение

### Порты

- **8000** - Backend API (основной)
- **5432** - PostgreSQL (внутренний)
- **6379** - Redis (внутренний)

### Volumes

- `postgres_data` - Данные PostgreSQL
- `redis_data` - Данные Redis
- `app_data` - Файлы приложения (загрузки, отчеты)

## API Endpoints

После успешного запуска доступны следующие endpoints:

### Основные
- `GET /` - Главная страница с документацией
- `GET /health` - Проверка здоровья сервиса
- `GET /docs` - Swagger UI документация

### Аутентификация
- `POST /api/auth/register` - Регистрация пользователя
- `POST /api/auth/login` - Вход в систему
- `GET /api/auth/me` - Информация о текущем пользователе

### Документы и анализ
- `POST /api/documents/upload` - Загрузка документа
- `POST /api/documents/{id}/analyze` - Анализ документа
- `POST /api/kp-analyzer/full-analysis` - Полный анализ КП

### Отчеты
- `POST /api/reports/generate/pdf` - Генерация PDF отчета
- `POST /api/reports/generate/excel` - Генерация Excel отчета
- `GET /api/reports/download/{type}/{filename}` - Скачивание отчета

### Административные
- `GET /api/admin/status` - Статус системы
- `GET /api/llm/health` - Статус AI провайдеров

## Мониторинг и диагностика

### Проверка здоровья

```bash
# Проверка основного API
curl http://localhost:8000/health

# Проверка AI провайдеров
curl http://localhost:8000/api/llm/health

# Проверка системного статуса
curl http://localhost:8000/api/admin/status
```

### Просмотр логов

```bash
# Все логи
cd backend && docker-compose -f docker-compose.monolith.yml logs -f

# Только приложение
cd backend && docker-compose -f docker-compose.monolith.yml logs -f app

# Только база данных
cd backend && docker-compose -f docker-compose.monolith.yml logs -f postgres

# Только Redis
cd backend && docker-compose -f docker-compose.monolith.yml logs -f redis
```

### Мониторинг ресурсов

```bash
# Статистика контейнеров
docker stats

# Использование дискового пространства
docker system df

# Просмотр запущенных контейнеров
docker ps --filter "name=devassist_"
```

## Безопасность

### Рекомендации по безопасности

1. **Смените дефолтные пароли** в `.env` файле
2. **Настройте CORS** для вашего домена в `ALLOWED_ORIGINS`
3. **Используйте HTTPS** в production (настройте reverse proxy)
4. **Ограничьте доступ** к портам базы данных (5432, 6379)
5. **Регулярно обновляйте** Docker образы

### Firewall настройки

```bash
# Разрешить только необходимые порты
sudo ufw allow 8000/tcp  # Backend API
sudo ufw allow 3000/tcp  # Frontend (если на том же сервере)
sudo ufw enable
```

## Обновление

### Обновление приложения

```bash
# Остановка сервисов
./stop-monolith-backend.sh

# Получение обновлений
git pull origin main

# Пересборка и запуск
cd backend
docker-compose -f docker-compose.monolith.yml build --no-cache
cd ..
./start-monolith-backend.sh
```

### Резервное копирование

```bash
# Создание бэкапа базы данных
docker exec devassist_postgres_monolith pg_dump -U devassist devassist_pro > backup_$(date +%Y%m%d_%H%M%S).sql

# Бэкап файлов приложения
docker run --rm -v devassist_pro_monolith_app_data:/data -v $(pwd):/backup alpine tar czf /backup/app_data_backup_$(date +%Y%m%d_%H%M%S).tar.gz -C /data .
```

## Устранение неполадок

### Общие проблемы

1. **Контейнеры не запускаются**
   ```bash
   # Проверьте логи
   cd backend && docker-compose -f docker-compose.monolith.yml logs
   
   # Проверьте конфликты портов
   sudo netstat -tulpn | grep :8000
   ```

2. **AI анализ не работает**
   ```bash
   # Проверьте API ключи
   curl http://localhost:8000/api/llm/health
   
   # Проверьте переменные окружения
   grep ANTHROPIC_API_KEY .env
   ```

3. **База данных недоступна**
   ```bash
   # Проверьте статус PostgreSQL
   docker exec devassist_postgres_monolith pg_isready -U devassist
   
   # Проверьте логи базы данных
   cd backend && docker-compose -f docker-compose.monolith.yml logs postgres
   ```

### Очистка и сброс

```bash
# Полная очистка (ОСТОРОЖНО! Удаляет все данные)
cd backend
docker-compose -f docker-compose.monolith.yml down -v
docker system prune -f --volumes

# Пересборка с нуля
docker-compose -f docker-compose.monolith.yml build --no-cache
```

## Интеграция с Frontend

Для полноценной работы необходимо также запустить React frontend:

```bash
# В отдельном терминале
cd frontend
npm install
npm start  # Запустится на http://localhost:3000
```

Frontend автоматически подключится к backend API на порту 8000.

## Поддержка

- **Логи**: Всегда проверяйте логи контейнеров при проблемах
- **API документация**: http://localhost:8000/docs
- **Health check**: http://localhost:8000/health
- **Статус системы**: http://localhost:8000/api/admin/status

---

**Важно**: Данное руководство предназначено для монолитного развертывания. Для production рекомендуется использовать microservices архитектуру с отдельными контейнерами для каждого сервиса.