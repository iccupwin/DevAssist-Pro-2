# 🔥 DevAssist Pro - Production Server Deployment

## 🎯 Полный гайд по развертыванию на реальном сервере

### 📋 Системные требования

**Минимальные требования:**
- **OS**: Ubuntu 20.04+ / CentOS 8+ / Debian 11+
- **RAM**: 4GB (рекомендуется 8GB)
- **Storage**: 50GB SSD
- **CPU**: 2+ cores
- **Network**: Статический IP или домен

**Рекомендуемые требования:**
- **RAM**: 8-16GB
- **Storage**: 100GB+ SSD
- **CPU**: 4+ cores
- **Network**: CDN (Cloudflare)

---

## 🛠 ЭТАП 1: Подготовка сервера

### 1.1 Подключение к серверу

```bash
# SSH подключение
ssh root@YOUR_SERVER_IP

# Или через пользователя
ssh username@YOUR_SERVER_IP
sudo su -
```

### 1.2 Обновление системы

```bash
# Ubuntu/Debian
apt update && apt upgrade -y
apt install -y curl wget git nano htop

# CentOS/RHEL
yum update -y
yum install -y curl wget git nano htop

# Или для новых версий
dnf update -y
dnf install -y curl wget git nano htop
```

### 1.3 Установка Docker

```bash
# Автоматическая установка Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Добавляем пользователя в группу docker (если нужно)
sudo usermod -aG docker $USER

# Включаем автозапуск Docker
sudo systemctl enable docker
sudo systemctl start docker

# Проверяем установку
docker --version
```

### 1.4 Установка Docker Compose

```bash
# Устанавливаем последнюю версию Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose

# Делаем исполняемым
sudo chmod +x /usr/local/bin/docker-compose

# Создаем симлинк (опционально)
sudo ln -s /usr/local/bin/docker-compose /usr/bin/docker-compose

# Проверяем установку
docker-compose --version
```

### 1.5 Настройка firewall

```bash
# Ubuntu/Debian (ufw)
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw --force enable

# CentOS/RHEL (firewalld)
sudo firewall-cmd --permanent --add-service=ssh
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload

# Проверяем статус
sudo ufw status  # Ubuntu
sudo firewall-cmd --list-all  # CentOS
```

---

## 📦 ЭТАП 2: Загрузка и настройка проекта

### 2.1 Создание рабочей директории

```bash
# Создаем директорию для проекта
mkdir -p /opt/devassist-pro
cd /opt/devassist-pro

# Создаем пользователя для приложения (рекомендуется)
sudo useradd -r -s /bin/false devassist
sudo chown -R devassist:devassist /opt/devassist-pro
```

### 2.2 Загрузка кода

**Вариант A: Через Git (рекомендуется)**
```bash
# Клонируем репозиторий
git clone https://github.com/your-repo/DevAssist-Pro.git .

# Или если приватный репозиторий
git clone https://username:token@github.com/your-repo/DevAssist-Pro.git .
```

**Вариант B: Загрузка архива**
```bash
# Если нет Git репозитория
wget https://github.com/your-repo/DevAssist-Pro/archive/main.zip
unzip main.zip
mv DevAssist-Pro-main/* .
rm -rf DevAssist-Pro-main main.zip
```

**Вариант C: Копирование с локальной машины**
```bash
# С локальной машины
scp -r ./DevAssist-Pro/ root@YOUR_SERVER_IP:/opt/devassist-pro/
```

### 2.3 Настройка прав доступа

```bash
# Устанавливаем правильные права
sudo chown -R devassist:devassist /opt/devassist-pro
sudo chmod +x /opt/devassist-pro/*.sh

# Создаем директории для данных
mkdir -p /opt/devassist-pro/data/{postgres,redis,app,logs}
mkdir -p /opt/devassist-pro/data/app/{uploads,reports,cache}

# Устанавливаем права на директории данных
sudo chown -R devassist:devassist /opt/devassist-pro/data
sudo chmod -R 755 /opt/devassist-pro/data
```

---

## ⚙️ ЭТАП 3: Конфигурация production

### 3.1 Создание .env файла

```bash
# Копируем пример конфигурации
cp .env.fullstack.example .env

# Редактируем конфигурацию
nano .env
```

### 3.2 Обязательные настройки в .env

```bash
# ===========================================
# PRODUCTION CONFIGURATION
# ===========================================

# ===== APPLICATION SETTINGS =====
ENVIRONMENT=production
DEBUG=false
LOG_LEVEL=INFO
TZ=Europe/Moscow

# ===== DATABASE CONFIGURATION =====
# ВАЖНО: Смените пароли!
POSTGRES_PASSWORD=SuperSecureProductionPassword123!
POSTGRES_PORT=5432

# ===== REDIS CONFIGURATION =====
REDIS_PASSWORD=AnotherSecurePassword456!
REDIS_PORT=6379

# ===== CORS CONFIGURATION =====
# Замените на ваши домены
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com,https://api.yourdomain.com

# ===== AI PROVIDER CONFIGURATION =====
# ОБЯЗАТЕЛЬНО: Ваш реальный API ключ
ANTHROPIC_API_KEY=sk-ant-api03-your-real-anthropic-api-key-here

# ОПЦИОНАЛЬНО: Дополнительные AI провайдеры
OPENAI_API_KEY=sk-your-openai-key-here
GOOGLE_API_KEY=your-google-ai-key-here

# ===== SECURITY SETTINGS =====
# КРИТИЧЕСКИ ВАЖНО: Замените на случайные ключи!
JWT_SECRET_KEY=your-super-secret-jwt-key-32-characters-minimum-length-required
SESSION_SECRET=your-super-secret-session-key-32-characters-minimum-length

# ===== OAUTH CONFIGURATION =====
GOOGLE_CLIENT_ID=your-google-oauth-client-id
GOOGLE_CLIENT_SECRET=your-google-oauth-client-secret

# ===== EMAIL CONFIGURATION =====
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@yourdomain.com
SMTP_PASSWORD=your-app-password

# ===== MONITORING =====
ENABLE_MONITORING=true
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id

# ===== FILE STORAGE =====
DATA_PATH=/opt/devassist-pro/data
```

### 3.3 Генерация безопасных ключей

```bash
# Генерируем случайные secure ключи
echo "JWT_SECRET_KEY=$(openssl rand -base64 32)" >> .env.temp
echo "SESSION_SECRET=$(openssl rand -base64 32)" >> .env.temp
echo "POSTGRES_PASSWORD=$(openssl rand -base64 16)" >> .env.temp
echo "REDIS_PASSWORD=$(openssl rand -base64 16)" >> .env.temp

# Показываем сгенерированные ключи
cat .env.temp

# Копируем их в .env файл вручную
rm .env.temp
```

### 3.4 Настройка домена (если есть)

```bash
# Если у вас есть домен, обновите ALLOWED_ORIGINS
sed -i 's/localhost/yourdomain.com/g' .env
sed -i 's/127.0.0.1/yourdomain.com/g' .env
```

---

## 🚀 ЭТАП 4: Запуск системы

### 4.1 Первый запуск

```bash
# Переходим в директорию проекта
cd /opt/devassist-pro

# Проверяем конфигурацию
./start-fullstack.sh --rebuild

# Или если нужна полная очистка
./start-fullstack.sh --clean
```

### 4.2 Мониторинг запуска

```bash
# Следим за логами запуска
docker-compose -f docker-compose.fullstack.yml logs -f

# В другом терминале проверяем статус
docker-compose -f docker-compose.fullstack.yml ps

# Проверяем health checks
curl http://localhost:80/health
```

### 4.3 Первичная проверка

```bash
# Запускаем тестирование
./test-fullstack.sh

# Проверяем основные URL
curl -I http://localhost:80
curl -I http://localhost:80/api/docs
curl -I http://localhost:80/health
```

---

## 🌐 ЭТАП 5: Настройка веб-сервера (Nginx/Apache)

### 5.1 Вариант A: Прямой доступ (простой)

Если у вас простой сервер, можете использовать прямой доступ:

```bash
# Система уже доступна на порту 80
# Проверяем с внешнего IP
curl http://YOUR_SERVER_IP/health
```

### 5.2 Вариант B: Через внешний Nginx (рекомендуется)

Установка внешнего Nginx для SSL и дополнительной безопасности:

```bash
# Устанавливаем Nginx
sudo apt install nginx -y  # Ubuntu/Debian
# sudo yum install nginx -y  # CentOS

# Создаем конфигурацию
sudo nano /etc/nginx/sites-available/devassist-pro
```

**Конфигурация Nginx (`/etc/nginx/sites-available/devassist-pro`):**

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;
    
    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    
    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    
    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    
    # Proxy to DevAssist Pro
    location / {
        proxy_pass http://127.0.0.1:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # WebSocket support
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
    
    # API rate limiting
    location /api/ {
        limit_req zone=api burst=20 nodelay;
        proxy_pass http://127.0.0.1:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
# Активируем конфигурацию
sudo ln -s /etc/nginx/sites-available/devassist-pro /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 5.3 Настройка SSL с Let's Encrypt

```bash
# Устанавливаем Certbot
sudo apt install certbot python3-certbot-nginx -y

# Получаем SSL сертификат
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Настраиваем автообновление
sudo crontab -e
# Добавляем строку:
# 0 12 * * * /usr/bin/certbot renew --quiet
```

---

## 🔄 ЭТАП 6: Настройка автозапуска

### 6.1 Создание systemd service

```bash
# Создаем systemd service
sudo nano /etc/systemd/system/devassist-pro.service
```

**Содержимое файла:**

```ini
[Unit]
Description=DevAssist Pro Fullstack Application
Documentation=https://github.com/your-repo/DevAssist-Pro
Requires=docker.service
After=docker.service network-online.target
Wants=network-online.target

[Service]
Type=oneshot
RemainAfterExit=yes
User=root
Group=root
WorkingDirectory=/opt/devassist-pro
Environment="PATH=/usr/local/bin:/usr/bin:/bin"

# Команды запуска и остановки
ExecStart=/opt/devassist-pro/start-fullstack.sh
ExecStop=/opt/devassist-pro/stop-fullstack.sh
ExecReload=/bin/bash -c '/opt/devassist-pro/stop-fullstack.sh && /opt/devassist-pro/start-fullstack.sh'

# Настройки перезапуска
TimeoutStartSec=300
TimeoutStopSec=120

# Логирование
StandardOutput=journal
StandardError=journal
SyslogIdentifier=devassist-pro

[Install]
WantedBy=multi-user.target
```

### 6.2 Активация service

```bash
# Перезагружаем systemd
sudo systemctl daemon-reload

# Включаем автозапуск
sudo systemctl enable devassist-pro

# Запускаем service
sudo systemctl start devassist-pro

# Проверяем статус
sudo systemctl status devassist-pro

# Проверяем логи
sudo journalctl -u devassist-pro -f
```

### 6.3 Управление через systemctl

```bash
# Запуск
sudo systemctl start devassist-pro

# Остановка
sudo systemctl stop devassist-pro

# Перезапуск
sudo systemctl restart devassist-pro

# Статус
sudo systemctl status devassist-pro

# Логи
sudo journalctl -u devassist-pro -f --since "1 hour ago"
```

---

## 📊 ЭТАП 7: Мониторинг и обслуживание

### 7.1 Проверка работоспособности

```bash
# Создаем скрипт мониторинга
sudo nano /usr/local/bin/devassist-health-check.sh
```

**Содержимое скрипта:**

```bash
#!/bin/bash
# DevAssist Pro Health Check Script

LOG_FILE="/var/log/devassist-health.log"
DATE=$(date '+%Y-%m-%d %H:%M:%S')

# Функция логирования
log() {
    echo "[$DATE] $1" | tee -a $LOG_FILE
}

# Проверка Docker контейнеров
if ! docker-compose -f /opt/devassist-pro/docker-compose.fullstack.yml ps | grep -q "Up"; then
    log "ERROR: DevAssist Pro containers are not running"
    exit 1
fi

# Проверка HTTP доступности
if ! curl -f -s http://localhost:80/health > /dev/null; then
    log "ERROR: DevAssist Pro HTTP health check failed"
    exit 1
fi

# Проверка API
if ! curl -f -s http://localhost:80/api/health > /dev/null; then
    log "ERROR: DevAssist Pro API health check failed"
    exit 1
fi

# Проверка дискового пространства
DISK_USAGE=$(df /opt/devassist-pro | tail -1 | awk '{print $5}' | sed 's/%//')
if [ $DISK_USAGE -gt 80 ]; then
    log "WARNING: Disk usage is ${DISK_USAGE}%"
fi

# Проверка памяти
MEMORY_USAGE=$(free | grep Mem | awk '{printf("%.0f", $3/$2 * 100.0)}')
if [ $MEMORY_USAGE -gt 85 ]; then
    log "WARNING: Memory usage is ${MEMORY_USAGE}%"
fi

log "SUCCESS: All health checks passed"
```

```bash
# Делаем скрипт исполняемым
sudo chmod +x /usr/local/bin/devassist-health-check.sh

# Добавляем в cron для регулярной проверки
sudo crontab -e
# Добавляем строки:
# */5 * * * * /usr/local/bin/devassist-health-check.sh
# 0 2 * * * docker system prune -f
```

### 7.2 Настройка логирования

```bash
# Настраиваем logrotate для логов
sudo nano /etc/logrotate.d/devassist-pro
```

**Содержимое:**

```
/var/log/devassist-health.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 root root
}

/opt/devassist-pro/data/logs/*.log {
    daily
    missingok
    rotate 7
    compress
    delaycompress
    notifempty
    copytruncate
}
```

### 7.3 Backup скрипт

```bash
# Создаем скрипт бекапа
sudo nano /usr/local/bin/devassist-backup.sh
```

**Содержимое:**

```bash
#!/bin/bash
# DevAssist Pro Backup Script

BACKUP_DIR="/opt/backups/devassist-pro"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="devassist-backup-$DATE.tar.gz"

# Создаем директорию бекапов
mkdir -p $BACKUP_DIR

# Останавливаем систему
cd /opt/devassist-pro
./stop-fullstack.sh

# Создаем бекап
tar -czf "$BACKUP_DIR/$BACKUP_FILE" \
    --exclude='data/postgres' \
    --exclude='data/redis' \
    /opt/devassist-pro/

# Бекап базы данных
docker-compose -f docker-compose.fullstack.yml up -d postgres
sleep 10
docker-compose -f docker-compose.fullstack.yml exec -T postgres pg_dump -U devassist devassist_pro > "$BACKUP_DIR/database-$DATE.sql"

# Запускаем систему обратно
./start-fullstack.sh

# Удаляем старые бекапы (старше 30 дней)
find $BACKUP_DIR -name "devassist-backup-*.tar.gz" -mtime +30 -delete
find $BACKUP_DIR -name "database-*.sql" -mtime +30 -delete

echo "Backup completed: $BACKUP_FILE"
```

```bash
# Делаем исполняемым
sudo chmod +x /usr/local/bin/devassist-backup.sh

# Добавляем в cron (еженедельно)
sudo crontab -e
# Добавляем: 0 3 * * 0 /usr/local/bin/devassist-backup.sh
```

---

## 🔧 ЭТАП 8: Troubleshooting

### 8.1 Частые проблемы и решения

**Проблема: Контейнеры не запускаются**
```bash
# Проверяем логи
docker-compose -f docker-compose.fullstack.yml logs

# Проверяем .env файл
cat .env | grep -v '^#' | grep -v '^$'

# Проверяем права доступа
ls -la /opt/devassist-pro/data/
```

**Проблема: Недостаточно памяти**
```bash
# Проверяем использование памяти
free -h
docker stats

# Увеличиваем swap (если нужно)
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

**Проблема: Нет места на диске**
```bash
# Проверяем использование диска
df -h

# Очищаем Docker
docker system prune -af
docker volume prune -f

# Очищаем логи
sudo journalctl --vacuum-time=7d
```

### 8.2 Команды для диагностики

```bash
# Проверка статуса системы
systemctl status devassist-pro
docker-compose -f /opt/devassist-pro/docker-compose.fullstack.yml ps

# Проверка логов
journalctl -u devassist-pro -f
docker-compose -f /opt/devassist-pro/docker-compose.fullstack.yml logs -f

# Проверка сети
netstat -tulpn | grep :80
curl -I http://localhost:80/health

# Проверка ресурсов
htop
iotop
docker stats
```

---

## ✅ ФИНАЛЬНАЯ ПРОВЕРКА

После завершения всех этапов:

```bash
# 1. Проверяем systemd service
sudo systemctl status devassist-pro

# 2. Проверяем веб-доступность
curl -I http://YOUR_SERVER_IP/
curl -I https://yourdomain.com/  # если настроен SSL

# 3. Запускаем полное тестирование
cd /opt/devassist-pro
./test-fullstack.sh

# 4. Проверяем автозапуск
sudo reboot
# После перезагрузки:
sudo systemctl status devassist-pro
curl -I http://YOUR_SERVER_IP/health
```

---

## 🎉 СИСТЕМА ГОТОВА К РАБОТЕ!

После выполнения всех этапов у вас будет:

✅ **Полностью автоматизированная система**  
✅ **Автозапуск при перезагрузке сервера**  
✅ **SSL сертификаты и безопасность**  
✅ **Мониторинг и логирование**  
✅ **Автоматические бекапы**  
✅ **Production-ready конфигурация**  

**Ваш DevAssist Pro доступен по адресу:**
- **HTTP**: http://YOUR_SERVER_IP
- **HTTPS**: https://yourdomain.com (если настроен домен)

### 📞 Поддержка

Если возникли проблемы:
1. Проверьте логи: `journalctl -u devassist-pro -f`
2. Запустите диагностику: `./test-fullstack.sh`
3. Проверьте статус: `systemctl status devassist-pro`