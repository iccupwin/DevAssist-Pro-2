# 🚀 DevAssist Pro - Production Deployment Guide

Полное руководство по развертыванию DevAssist Pro на сервере одной командой.

## 📋 Системные требования

### Минимальные требования:
- **OS**: Ubuntu 20.04+ / CentOS 8+ / Debian 11+
- **RAM**: 4GB (рекомендуется 8GB)
- **CPU**: 2 cores (рекомендуется 4 cores)
- **Диск**: 20GB свободного места
- **Docker**: 20.10+
- **Docker Compose**: 2.0+

### Рекомендуемые требования:
- **RAM**: 16GB
- **CPU**: 8 cores
- **Диск**: 100GB SSD
- **Сеть**: Высокоскоростное подключение для AI API

## 🛠 Быстрое развертывание

### 1. Подготовка сервера

```bash
# Обновление системы
sudo apt update && sudo apt upgrade -y

# Установка Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Установка Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Перезагрузка для применения изменений
sudo reboot
```

### 2. Клонирование проекта

```bash
git clone https://github.com/your-repo/DevAssist-Pro.git
cd DevAssist-Pro
```

### 3. Конфигурация окружения

```bash
# Копирование файла конфигурации
cp .env.production .env

# Редактирование конфигурации
nano .env
```

**Обязательные параметры для настройки:**

```bash
# Безопасные пароли
POSTGRES_PASSWORD=ваш_безопасный_пароль_postgres
REDIS_PASSWORD=ваш_безопасный_пароль_redis
JWT_SECRET=ваш_очень_длинный_секретный_ключ_минимум_32_символа

# API ключи для ИИ (ОБЯЗАТЕЛЬНО!)
ANTHROPIC_API_KEY=ваш_ключ_anthropic
OPENAI_API_KEY=ваш_ключ_openai
GOOGLE_API_KEY=ваш_ключ_google

# Домен вашего сервера
REACT_APP_API_URL=http://ваш-домен.com/api
CORS_ORIGINS=http://ваш-домен.com,https://ваш-домен.com
```

### 4. Развертывание одной командой

```bash
# Полное развертывание
./deploy.sh

# Развертывание с показом логов
./deploy.sh --logs
```

## 🎯 Доступ к приложению

После успешного развертывания приложение будет доступно по следующим адресам:

- **🌐 React Frontend**: http://ваш-сервер:3000
- **🔗 API Gateway**: http://ваш-сервер:8000  
- **📊 API Docs**: http://ваш-сервер:8000/docs
- **🎯 Streamlit Demo**: http://ваш-сервер:8501
- **🏥 Health Check**: http://ваш-сервер:8000/health

## 🔧 Управление сервисами

### Основные команды:

```bash
# Показать статус всех сервисов
./deploy.sh status

# Просмотр логов
./deploy.sh logs

# Перезапуск сервисов
./deploy.sh restart

# Остановка сервисов
./deploy.sh stop

# Обновление до последней версии
./deploy.sh update

# Создание резервной копии базы данных
./deploy.sh backup

# Полная очистка (ОСТОРОЖНО!)
./deploy.sh clean
```

### Docker Compose команды:

```bash
# Просмотр статуса
docker-compose -f docker-compose.production.yml ps

# Просмотр логов конкретного сервиса
docker-compose -f docker-compose.production.yml logs -f frontend

# Перезапуск конкретного сервиса
docker-compose -f docker-compose.production.yml restart api-gateway

# Масштабирование сервиса
docker-compose -f docker-compose.production.yml up -d --scale api-gateway=3
```

## 🔒 Настройка SSL/HTTPS

### 1. Получение SSL сертификата

```bash
# Установка Certbot
sudo apt install certbot

# Получение сертификата
sudo certbot certonly --standalone -d ваш-домен.com
```

### 2. Настройка Nginx

```bash
# Копирование сертификатов
sudo cp /etc/letsencrypt/live/ваш-домен.com/fullchain.pem ssl/cert.pem
sudo cp /etc/letsencrypt/live/ваш-домен.com/privkey.pem ssl/key.pem

# Редактирование конфигурации Nginx
nano nginx.production.conf
```

Раскомментируйте строки SSL в `nginx.production.conf` и перезапустите:

```bash
./deploy.sh restart
```

## 📊 Мониторинг и логирование

### Просмотр метрик системы:

```bash
# Использование ресурсов контейнерами
docker stats

# Использование дискового пространства
docker system df

# Логи конкретного сервиса
docker-compose -f docker-compose.production.yml logs -f --tail=100 api-gateway
```

### Настройка автоматических бэкапов:

```bash
# Добавление в crontab
crontab -e

# Ежедневный бэкап в 2:00
0 2 * * * cd /path/to/DevAssist-Pro && ./deploy.sh backup
```

## 🚨 Устранение неполадок

### Проверка здоровья сервисов:

```bash
# Проверка API Gateway
curl http://localhost:8000/health

# Проверка базы данных
docker-compose -f docker-compose.production.yml exec postgres pg_isready -U devassist_user

# Проверка Redis
docker-compose -f docker-compose.production.yml exec redis redis-cli ping
```

### Общие проблемы:

1. **Сервис не запускается**:
   ```bash
   # Проверка логов
   docker-compose -f docker-compose.production.yml logs сервис-имя
   
   # Пересборка образа
   docker-compose -f docker-compose.production.yml build --no-cache сервис-имя
   ```

2. **Нет доступа к API**:
   - Проверьте настройки CORS в `.env`
   - Убедитесь, что порты открыты в файрволе
   - Проверьте конфигурацию Nginx

3. **Ошибки AI API**:
   - Проверьте корректность API ключей в `.env`
   - Убедитесь, что у вас есть средства на балансе API
   - Проверьте логи LLM сервиса

4. **Проблемы с базой данных**:
   ```bash
   # Восстановление из бэкапа
   docker-compose -f docker-compose.production.yml exec -T postgres psql -U devassist_user devassist_pro < backups/backup_file.sql
   ```

## 🔄 Обновление системы

### Обновление до новой версии:

```bash
# Получение последних изменений
git pull origin main

# Обновление и перезапуск
./deploy.sh update
```

### Откат к предыдущей версии:

```bash
# Остановка текущих сервисов
./deploy.sh stop

# Откат к предыдущему коммиту
git checkout предыдущий-коммит

# Повторное развертывание
./deploy.sh
```

## 📈 Масштабирование

### Горизонтальное масштабирование:

```bash
# Увеличение количества инстансов API Gateway
docker-compose -f docker-compose.production.yml up -d --scale api-gateway=3

# Увеличение количества LLM сервисов
docker-compose -f docker-compose.production.yml up -d --scale llm-service=2
```

### Вертикальное масштабирование:

Отредактируйте `docker-compose.production.yml`, добавив ограничения ресурсов:

```yaml
services:
  api-gateway:
    deploy:
      resources:
        limits:
          cpus: '2.0'
          memory: 4G
        reservations:
          cpus: '1.0'
          memory: 2G
```

## 🛡 Безопасность

### Рекомендации по безопасности:

1. **Смените пароли по умолчанию** в `.env`
2. **Настройте файрвол**:
   ```bash
   sudo ufw allow 22/tcp
   sudo ufw allow 80/tcp
   sudo ufw allow 443/tcp
   sudo ufw enable
   ```
3. **Регулярно обновляйте систему**
4. **Настройте мониторинг логов на подозрительную активность**
5. **Используйте SSL сертификаты**

## 📞 Поддержка

При возникновении проблем:

1. Проверьте логи: `./deploy.sh logs`
2. Проверьте статус: `./deploy.sh status`
3. Создайте резервную копию: `./deploy.sh backup`
4. Обратитесь к разработчикам с полной информацией об ошибке

---

**🎉 Поздравляем! DevAssist Pro успешно развернут и готов к работе.**