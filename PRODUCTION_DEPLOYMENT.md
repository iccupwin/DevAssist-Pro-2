# 🚀 DevAssist Pro - Production Deployment Guide

Полное руководство по развертыванию DevAssist Pro на production сервере `46.149.67.122`.

## 📋 Содержание

1. [Быстрый старт](#быстрый-старт)
2. [Системные требования](#системные-требования)
3. [Настройка окружения](#настройка-окружения)
4. [Развертывание](#развертывание)
5. [Мониторинг](#мониторинг)
6. [Обслуживание](#обслуживание)
7. [Устранение неполадок](#устранение-неполадок)

## 🚀 Быстрый старт

```bash
# 1. Клонировать проект
git clone [your-repo-url] /opt/devassist-pro
cd /opt/devassist-pro

# 2. Настроить окружение
cp .env.production .env
nano .env  # Отредактировать с реальными значениями

# 3. Развернуть
chmod +x deploy-production.sh
./deploy-production.sh

# 4. Проверить
curl http://46.149.67.122/health
```

## 💻 Системные требования

### Минимальные требования:
- **OS**: Ubuntu 20.04+ / CentOS 8+ / Debian 11+
- **RAM**: 4GB (рекомендуется 8GB)
- **CPU**: 2 cores (рекомендуется 4 cores)
- **Диск**: 20GB свободного места
- **Docker**: 20.10+
- **Docker Compose**: 2.0+

### Подготовка сервера:

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

## ⚙️ Настройка окружения

### 1. Конфигурация .env.production

Скопируйте `.env.production` и настройте следующие параметры:

```bash
# 🔑 Обязательные параметры (замените на реальные значения):

# База данных
POSTGRES_PASSWORD=ваш_безопасный_пароль_postgre

# Безопасность  
JWT_SECRET=ваш_супер_секретный_jwt_ключ_минимум_32_символа

# AI провайдеры
OPENAI_API_KEY=ваш_ключ_openai
ANTHROPIC_API_KEY=ваш_ключ_anthropic  
GOOGLE_API_KEY=ваш_ключ_google

# OAuth (опционально)
GOOGLE_CLIENT_ID=ваш_google_client_id
GOOGLE_CLIENT_SECRET=ваш_google_client_secret
```

### 2. Проверка конфигурации

```bash
# Проверить обязательные переменные
source .env.production
echo "Database: ${POSTGRES_PASSWORD:+✓ Configured}"
echo "JWT: ${JWT_SECRET:+✓ Configured}"  
echo "OpenAI: ${OPENAI_API_KEY:+✓ Configured}"
echo "Anthropic: ${ANTHROPIC_API_KEY:+✓ Configured}"
```

## 🐳 Развертывание

### Автоматическое развертывание

```bash
# Запуск автоматического развертывания
./deploy-production.sh
```

Скрипт выполнит:
- ✅ Проверку системных требований
- ✅ Валидацию конфигурации
- ✅ Сборку Docker образа
- ✅ Запуск всех сервисов
- ✅ Health check и проверку endpoints

### Ручное развертывание

```bash
# 1. Сборка образа
docker build -f Dockerfile.production -t devassist-pro:latest .

# 2. Создание директорий
mkdir -p data logs config/production

# 3. Запуск сервисов
docker-compose -f docker-compose.production.yml up -d

# 4. Проверка статуса
docker ps
```

## 📊 Мониторинг

### Health Check

```bash
# Основной health check
curl http://46.149.67.122/health

# Детальная проверка AI провайдеров
curl http://46.149.67.122/api/llm/health

# Проверка всех endpoints
curl http://46.149.67.122/  # Frontend
curl http://46.149.67.122/docs  # API Documentation
```

### Логи

```bash
# Просмотр логов приложения
docker logs -f devassist-pro

# Просмотр логов конкретного сервиса
docker exec devassist-pro tail -f /var/log/supervisor/backend.log
docker exec devassist-pro tail -f /var/log/supervisor/nginx.log

# Проверка состояния процессов
docker exec devassist-pro supervisorctl status
```

### Мониторинг ресурсов

```bash
# Использование ресурсов контейнерами
docker stats

# Дисковое пространство
df -h
docker system df

# Память и CPU
htop
```

## 🔧 Обслуживание

### Обновление приложения

```bash
# Получить обновления
git pull origin main

# Пересобрать и перезапустить
./deploy-production.sh
```

### Резервное копирование

```bash
# Создание backup базы данных
docker exec devassist-postgres pg_dump -U devassist devassist_pro > backup_$(date +%Y%m%d_%H%M%S).sql

# Backup данных приложения
tar -czf data_backup_$(date +%Y%m%d_%H%M%S).tar.gz data/

# Backup конфигурации
tar -czf config_backup_$(date +%Y%m%d_%H%M%S).tar.gz .env.production docker-compose.production.yml
```

### Восстановление

```bash
# Восстановление базы данных
docker exec -i devassist-postgres psql -U devassist devassist_pro < backup_20231220_143022.sql

# Восстановление данных
tar -xzf data_backup_20231220_143022.tar.gz
```

### Масштабирование

```bash
# Увеличение количества worker'ов backend
docker-compose -f docker-compose.production.yml up -d --scale devassist-pro=3

# Мониторинг нагрузки
docker exec devassist-pro curl http://localhost:8080/nginx_status
```

## 🐛 Устранение неполадок

### Частые проблемы

#### 1. Контейнер не запускается

```bash
# Проверить логи
docker logs devassist-pro

# Проверить конфигурацию nginx
docker exec devassist-pro nginx -t

# Перезапустить сервисы
docker exec devassist-pro supervisorctl restart all
```

#### 2. База данных недоступна

```bash
# Проверить состояние PostgreSQL
docker logs devassist-postgres

# Проверить подключение
docker exec devassist-postgres pg_isready -U devassist

# Пересоздать базу данных
docker-compose -f docker-compose.production.yml stop postgres
docker-compose -f docker-compose.production.yml rm postgres
docker-compose -f docker-compose.production.yml up -d postgres
```

#### 3. AI провайдеры не отвечают

```bash
# Проверить API ключи
curl http://46.149.67.122/api/llm/health

# Проверить логи AI сервиса
docker exec devassist-pro tail -f /app/logs/app.log | grep -i "ai\|openai\|anthropic"

# Тестовый запрос к AI
curl -X POST http://46.149.67.122/api/llm/providers \
  -H "Content-Type: application/json"
```

#### 4. Frontend не загружается

```bash
# Проверить nginx статус
docker exec devassist-pro supervisorctl status nginx

# Проверить frontend файлы
docker exec devassist-pro ls -la /app/frontend/build/

# Перезапустить nginx
docker exec devassist-pro supervisorctl restart nginx
```

## 🛡️ Безопасность

### Firewall настройка

```bash
# Настройка UFW
sudo ufw enable
sudo ufw allow 22/tcp   # SSH
sudo ufw allow 80/tcp   # HTTP
sudo ufw allow 443/tcp  # HTTPS (для будущего SSL)
sudo ufw status
```

### SSL/HTTPS (рекомендуется)

```bash
# Установка Certbot
sudo apt install certbot

# Получение сертификата (требует домен)
sudo certbot certonly --standalone -d yourdomain.com

# Обновление nginx конфигурации для HTTPS
# Отредактировать nginx.production.conf
```

### Мониторинг безопасности

```bash
# Проверка открытых портов
sudo netstat -tulpn

# Анализ логов
docker exec devassist-pro tail -f /var/log/nginx/access.log | grep -E "(404|401|403|500)"

# Проверка подозрительной активности
docker exec devassist-pro tail -f /var/log/nginx/access.log | grep -E "(sql|script|hack|exploit)"
```

## 📞 Поддержка

### Полезные команды

```bash
# Перезапуск приложения
docker restart devassist-pro

# Остановка всех сервисов
docker-compose -f docker-compose.production.yml down

# Полная очистка (ОСТОРОЖНО!)
docker-compose -f docker-compose.production.yml down -v
docker system prune -a

# Доступ к shell контейнера
docker exec -it devassist-pro /bin/bash

# Проверка версии
curl http://46.149.67.122/api/status
```

### Контакты

- **Frontend**: http://46.149.67.122/
- **API Docs**: http://46.149.67.122/docs  
- **Health Check**: http://46.149.67.122/health

---

## ✅ Checklist развертывания

- [ ] Сервер подготовлен (Docker, Docker Compose)
- [ ] .env.production настроен с реальными значениями
- [ ] API ключи получены и настроены
- [ ] Firewall настроен
- [ ] Развертывание выполнено: `./deploy-production.sh`
- [ ] Health check проходит: `curl http://46.149.67.122/health`
- [ ] Frontend доступен: http://46.149.67.122/
- [ ] API документация доступна: http://46.149.67.122/docs
- [ ] Настроен мониторинг и алерты
- [ ] Резервное копирование настроено

🎉 **DevAssist Pro готов к работе!**