# DevAssist Pro - Производственное Развертывание

## Обзор

Данное руководство описывает процесс развертывания DevAssist Pro на производственном сервере с использованием Docker и Docker Compose.

## Архитектура Системы

### Backend Микросервисы
- **API Gateway** (порт 8000) - Центральная точка входа
- **Auth Service** - Аутентификация и авторизация
- **LLM Service** - Оркестратор AI моделей
- **Documents Service** - Обработка документов
- **Dashboard Service** - Сервис панели управления
- **Reports Service** - Генерация отчетов

### Frontend
- **React SPA** - Основной пользовательский интерфейс
- **Nginx** - Статический веб-сервер и reverse proxy

### Инфраструктура
- **PostgreSQL** - Основная база данных
- **Redis** - Кэширование и сессии
- **Nginx** - Reverse proxy и SSL терминация

## Предварительные Требования

### Системные Требования
- **OS**: Ubuntu 20.04+ / CentOS 8+ / Debian 11+
- **RAM**: Минимум 8GB, рекомендуется 16GB+
- **CPU**: Минимум 4 ядра, рекомендуется 8+
- **Диск**: Минимум 50GB свободного места
- **Сеть**: Статический IP адрес и доменное имя

### Программное Обеспечение
- **Docker**: версия 20.10+
- **Docker Compose**: версия 2.0+
- **Git**: для клонирования репозитория

## Подготовка Сервера

### 1. Установка Docker и Docker Compose

```bash
# Обновление системы
sudo apt update && sudo apt upgrade -y

# Установка Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Добавление пользователя в группу docker
sudo usermod -aG docker $USER

# Установка Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Перезагрузка для применения изменений
sudo reboot
```

### 2. Клонирование Репозитория

```bash
# Клонирование проекта
git clone https://github.com/your-username/DevAssist-Pro.git
cd DevAssist-Pro

# Переключение на production ветку (если есть)
git checkout production
```

### 3. Настройка Окружения

```bash
# Копирование шаблона конфигурации
cp .env.production .env

# Редактирование конфигурации
nano .env
```

## Конфигурация Переменных Окружения

### Обязательные Параметры

Отредактируйте `.env` файл и установите следующие параметры:

```bash
# Безопасные пароли (генерируйте случайные)
POSTGRES_PASSWORD=ваш_очень_сложный_пароль_postgres
REDIS_PASSWORD=ваш_очень_сложный_пароль_redis
JWT_SECRET=ваш_супер_секретный_jwt_ключ_минимум_32_символа

# API ключи для AI провайдеров
ANTHROPIC_API_KEY=ваш_anthropic_api_ключ
OPENAI_API_KEY=ваш_openai_api_ключ
GOOGLE_API_KEY=ваш_google_api_ключ

# OAuth настройки
GOOGLE_CLIENT_ID=ваш_google_client_id
GOOGLE_CLIENT_SECRET=ваш_google_client_secret
YANDEX_CLIENT_ID=ваш_yandex_client_id
YANDEX_CLIENT_SECRET=ваш_yandex_client_secret

# Домен приложения
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
REACT_APP_API_URL=https://yourdomain.com/api
REACT_APP_WS_URL=wss://yourdomain.com/ws
```

## SSL Сертификаты

### Получение SSL Сертификатов с Let's Encrypt

```bash
# Установка Certbot
sudo apt install certbot

# Получение сертификата
sudo certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com

# Копирование сертификатов
sudo mkdir -p ./ssl
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem ./ssl/
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem ./ssl/
sudo chown -R $USER:$USER ./ssl/
```

### Обновление Nginx Конфигурации

Обновите `nginx.conf` для включения SSL:

```nginx
server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;
    
    ssl_certificate /etc/nginx/ssl/fullchain.pem;
    ssl_certificate_key /etc/nginx/ssl/privkey.pem;
    
    # Остальная конфигурация...
}

server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$server_name$request_uri;
}
```

## Запуск Приложения

### 1. Сборка и Запуск

```bash
# Сборка всех сервисов
docker-compose -f docker-compose.prod.yml build

# Запуск в production режиме
docker-compose -f docker-compose.prod.yml up -d

# Проверка статуса сервисов
docker-compose -f docker-compose.prod.yml ps
```

### 2. Инициализация Базы Данных

```bash
# Применение миграций (если необходимо)
docker-compose -f docker-compose.prod.yml exec api-gateway python -m alembic upgrade head

# Создание суперпользователя (если необходимо)
docker-compose -f docker-compose.prod.yml exec api-gateway python manage.py create-superuser
```

### 3. Проверка Работоспособности

```bash
# Проверка логов
docker-compose -f docker-compose.prod.yml logs -f

# Проверка здоровья сервисов
curl -f http://localhost:8000/health
curl -f http://localhost:3000/health

# Проверка доступности через домен
curl -f https://yourdomain.com/health
```

## Мониторинг и Логирование

### Просмотр Логов

```bash
# Все сервисы
docker-compose -f docker-compose.prod.yml logs -f

# Конкретный сервис
docker-compose -f docker-compose.prod.yml logs -f api-gateway
docker-compose -f docker-compose.prod.yml logs -f frontend
docker-compose -f docker-compose.prod.yml logs -f postgres
```

### Мониторинг Ресурсов

```bash
# Использование ресурсов контейнерами
docker stats

# Дисковое пространство
docker system df

# Очистка неиспользуемых ресурсов
docker system prune -a
```

## Резервное Копирование

### Создание Бэкапа

```bash
#!/bin/bash
# backup.sh

BACKUP_DIR="/backups/devassist"
DATE=$(date +%Y%m%d_%H%M%S)

# Создание директории для бэкапов
mkdir -p $BACKUP_DIR

# Бэкап базы данных
docker-compose -f docker-compose.prod.yml exec -T postgres pg_dump -U devassist devassist_pro > $BACKUP_DIR/db_backup_$DATE.sql

# Бэкап загруженных файлов
docker run --rm -v devassist_document_uploads:/data -v $BACKUP_DIR:/backup alpine tar czf /backup/uploads_backup_$DATE.tar.gz -C /data .

# Бэкап конфигурации
cp .env $BACKUP_DIR/env_backup_$DATE
cp docker-compose.prod.yml $BACKUP_DIR/compose_backup_$DATE.yml

echo "Бэкап завершен: $BACKUP_DIR"
```

### Восстановление из Бэкапа

```bash
#!/bin/bash
# restore.sh

BACKUP_FILE=$1
if [ -z "$BACKUP_FILE" ]; then
    echo "Использование: ./restore.sh /path/to/backup.sql"
    exit 1
fi

# Восстановление базы данных
docker-compose -f docker-compose.prod.yml exec -T postgres psql -U devassist -d devassist_pro < $BACKUP_FILE

echo "Восстановление завершено"
```

## Обновление Приложения

### Процедура Обновления

```bash
#!/bin/bash
# update.sh

echo "Начинаем обновление DevAssist Pro..."

# Создание бэкапа перед обновлением
./backup.sh

# Получение последних изменений
git pull origin production

# Остановка сервисов
docker-compose -f docker-compose.prod.yml down

# Пересборка образов
docker-compose -f docker-compose.prod.yml build --no-cache

# Запуск обновленных сервисов
docker-compose -f docker-compose.prod.yml up -d

# Применение миграций
docker-compose -f docker-compose.prod.yml exec api-gateway python -m alembic upgrade head

# Проверка работоспособности
sleep 30
curl -f https://yourdomain.com/health

echo "Обновление завершено!"
```

## Безопасность

### Брандмауэр

```bash
# Настройка UFW
sudo ufw enable
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Разрешение портов
sudo ufw allow 22          # SSH
sudo ufw allow 80          # HTTP
sudo ufw allow 443         # HTTPS

# Блокировка прямого доступа к внутренним портам
sudo ufw deny 5432         # PostgreSQL
sudo ufw deny 6379         # Redis
sudo ufw deny 8000         # API Gateway
```

### Автоматические Обновления

```bash
# Добавление в crontab
crontab -e

# Автоматический бэкап каждый день в 2:00
0 2 * * * /path/to/DevAssist-Pro/backup.sh

# Обновление SSL сертификатов
0 3 1 * * certbot renew --quiet && docker-compose -f /path/to/DevAssist-Pro/docker-compose.prod.yml restart nginx
```

## Устранение Неполадок

### Общие Проблемы

1. **Сервисы не запускаются**
   ```bash
   # Проверка логов
   docker-compose -f docker-compose.prod.yml logs
   
   # Проверка портов
   netstat -tlpn | grep -E "(80|443|8000|5432|6379)"
   ```

2. **Проблемы с базой данных**
   ```bash
   # Проверка подключения к PostgreSQL
   docker-compose -f docker-compose.prod.yml exec postgres psql -U devassist -d devassist_pro -c "\l"
   
   # Перезапуск базы данных
   docker-compose -f docker-compose.prod.yml restart postgres
   ```

3. **Проблемы с SSL**
   ```bash
   # Проверка сертификатов
   openssl x509 -in ./ssl/fullchain.pem -text -noout
   
   # Тестирование SSL
   curl -I https://yourdomain.com
   ```

4. **Высокое использование ресурсов**
   ```bash
   # Мониторинг использования
   docker stats
   
   # Ограничение ресурсов в docker-compose.prod.yml
   deploy:
     resources:
       limits:
         memory: 1G
         cpus: '0.5'
   ```

### Контакты для Поддержки

- **Техническая поддержка**: support@devassist.pro
- **Документация**: https://docs.devassist.pro
- **GitHub Issues**: https://github.com/your-username/DevAssist-Pro/issues

## Дополнительные Ресурсы

- [Docker Production Deployment](https://docs.docker.com/compose/production/)
- [Nginx SSL Configuration](https://nginx.org/en/docs/http/configuring_https_servers.html)
- [PostgreSQL Backup and Recovery](https://www.postgresql.org/docs/current/backup.html)
- [Redis Persistence](https://redis.io/topics/persistence)