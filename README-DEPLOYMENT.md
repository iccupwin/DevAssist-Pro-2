# DevAssist Pro - Production Deployment Guide

## 🚀 Unified Deployment Configuration

Этот гайд описывает процесс развертывания DevAssist Pro в production с использованием unified Docker конфигурации, которая объединяет backend, frontend и nginx в единое решение.

## 📋 Архитектура Deployment

```
┌─────────────────────────────────────────────────────────────┐
│                    Nginx Reverse Proxy                      │
│                         Port 80                             │
└─────────────┬─────────────────────────────┬─────────────────┘
              │                             │
              ▼                             ▼
    ┌─────────────────┐              ┌─────────────────┐
    │   Frontend      │              │   Backend API   │
    │   (React SPA)   │              │   (FastAPI)     │
    │   Static Files  │              │   Port 8000     │
    └─────────────────┘              └─────────────────┘
                                             │
              ┌──────────────────────────────┼──────────────────────────────┐
              ▼                             ▼                             ▼
    ┌─────────────────┐              ┌─────────────────┐       ┌─────────────────┐
    │   PostgreSQL    │              │     Redis       │       │   File Storage  │
    │   Database      │              │     Cache       │       │   (Volumes)     │
    │   Port 5432     │              │   Port 6379     │       │                 │
    └─────────────────┘              └─────────────────┘       └─────────────────┘
```

## 🎯 Основные компоненты

### **1. Frontend Service**
- **Dockerfile**: `frontend/Dockerfile.production`
- **Build**: Multi-stage build с оптимизацией
- **Nginx**: Статические файлы + SPA routing
- **Environment**: Production-ready настройки

### **2. Backend Service**
- **Base**: Существующий `backend/docker-compose.monolith.yml`
- **API**: FastAPI с микросервисной архитектурой
- **Database**: PostgreSQL + Redis
- **AI Integration**: Anthropic, OpenAI, Google

### **3. Nginx Reverse Proxy**
- **Config**: `nginx/nginx.conf`
- **Routing**: `/` → Frontend, `/api/*` → Backend
- **Features**: CORS, WebSocket, SSL ready, Caching
- **Security**: Rate limiting, headers

## ⚙️ Файлы конфигурации

### **Созданные файлы:**

```
DevAssist-Pro/
├── docker-compose.unified.yml      # Главная конфигурация
├── .env.production                 # Production environment
├── deploy.sh                       # Скрипт развертывания
├── nginx/
│   └── nginx.conf                  # Nginx reverse proxy
├── frontend/
│   ├── Dockerfile.production       # Frontend production build
│   └── nginx.frontend.conf         # Frontend nginx config
└── README-DEPLOYMENT.md            # Этот файл
```

## 🔧 Настройка Environment

### **1. Скопировать и настроить .env**
```bash
cp .env.production .env
```

### **2. Критические переменные для настройки:**
```bash
# AI API Keys (ОБЯЗАТЕЛЬНО!)
ANTHROPIC_API_KEY=your_real_anthropic_api_key_here
OPENAI_API_KEY=your_real_openai_api_key_here
GOOGLE_API_KEY=your_real_google_api_key_here

# Domain (для production)
ALLOWED_HOSTS=localhost,127.0.0.1,your-domain.com
ALLOWED_ORIGINS=http://localhost,https://your-domain.com

# Security
JWT_SECRET=production-super-secret-jwt-key-change-this
SECRET_KEY=production-secret-key-change-this
```

## 🚀 Развертывание

### **Вариант 1: Автоматическое развертывание (Рекомендуется)**
```bash
# Полное развертывание с проверками
./deploy.sh deploy

# Быстрый запуск
./deploy.sh quick
```

### **Вариант 2: Ручное развертывание**
```bash
# 1. Сборка образов
docker-compose -f docker-compose.unified.yml build

# 2. Запуск сервисов
docker-compose -f docker-compose.unified.yml up -d

# 3. Проверка статуса
docker-compose -f docker-compose.unified.yml ps
```

## 🔍 Проверка работоспособности

### **Health Checks:**
```bash
# Общий health check
curl http://localhost/health

# Backend API
curl http://localhost/api/health

# Frontend
curl http://localhost/

# API Documentation
curl http://localhost/api/docs
```

### **Статус сервисов:**
```bash
./deploy.sh status
```

## 📊 Доступные Endpoints

После успешного развертывания:

- **🌐 Frontend**: http://localhost
- **🚀 Backend API**: http://localhost/api
- **📖 API Docs**: http://localhost/api/docs
- **🔍 Health Check**: http://localhost/health
- **📝 Swagger UI**: http://localhost/api/docs
- **🔄 WebSocket**: ws://localhost/ws

## 🛠️ Управление сервисами

### **Основные команды:**
```bash
# Статус
./deploy.sh status

# Логи
./deploy.sh logs
docker-compose -f docker-compose.unified.yml logs -f

# Перезапуск
./deploy.sh restart

# Остановка
./deploy.sh stop

# Полная очистка
./deploy.sh cleanup
```

### **Мониторинг:**
```bash
# Включить мониторинг (Prometheus metrics)
./deploy.sh monitoring

# Метрики доступны на порту 9113
curl http://localhost:9113/metrics
```

## 💾 Backup и Restore

### **Создание Backup:**
```bash
./deploy.sh backup
# Создаст директорию backup_YYYYMMDD_HHMMSS
```

### **Восстановление:**
```bash
./deploy.sh restore backup_20240119_120000
```

## 🔧 Troubleshooting

### **Распространенные проблемы:**

#### **1. Порт 80 занят**
```bash
# Проверить какой процесс использует порт
sudo lsof -i :80

# Остановить конфликтующий сервис
sudo systemctl stop apache2  # или nginx
```

#### **2. API ключи не настроены**
```bash
# Проверить .env файл
grep "API_KEY" .env

# Настроить реальные ключи
nano .env
```

#### **3. Backend не отвечает**
```bash
# Проверить логи backend
docker-compose -f docker-compose.unified.yml logs backend

# Проверить подключение к БД
docker-compose -f docker-compose.unified.yml exec postgres psql -U devassist -d devassist_pro
```

#### **4. Frontend не загружается**
```bash
# Проверить логи nginx
docker-compose -f docker-compose.unified.yml logs nginx

# Проверить build frontend
docker-compose -f docker-compose.unified.yml logs frontend
```

### **Логи по сервисам:**
```bash
# Все логи
docker-compose -f docker-compose.unified.yml logs

# Конкретный сервис
docker-compose -f docker-compose.unified.yml logs nginx
docker-compose -f docker-compose.unified.yml logs backend
docker-compose -f docker-compose.unified.yml logs frontend
docker-compose -f docker-compose.unified.yml logs postgres
```

## 🔒 Security Considerations

### **Production Checklist:**

#### **1. SSL/HTTPS (Рекомендуется для production)**
```bash
# Создать SSL сертификаты
mkdir -p nginx/ssl
# Добавить cert.pem и key.pem

# Обновить nginx.conf для HTTPS
# Раскомментировать SSL настройки в .env.production
```

#### **2. Firewall настройки**
```bash
# Открыть только необходимые порты
ufw allow 80
ufw allow 443
ufw deny 5432  # PostgreSQL только для Docker network
ufw deny 6379  # Redis только для Docker network
```

#### **3. Environment Security**
```bash
# Ограничить права доступа к .env
chmod 600 .env

# Использовать сильные пароли
openssl rand -base64 32  # Для JWT_SECRET
openssl rand -base64 32  # Для SECRET_KEY
```

## 📈 Performance Optimization

### **1. Nginx Caching**
- Статические файлы кэшируются на 1 год
- HTML файлы кэшируются на 5 минут
- API responses кэшируются по настройке

### **2. Database Optimization**
```bash
# Настройка PostgreSQL для production
# Редактировать shared/config.py для connection pooling
```

### **3. Resource Limits**
```yaml
# Добавить в docker-compose.unified.yml для production
deploy:
  resources:
    limits:
      memory: 512M
      cpus: '0.5'
```

## 🌐 Production Server Setup

### **Minimal Server Requirements:**
- **CPU**: 2+ cores
- **RAM**: 4+ GB
- **Storage**: 20+ GB SSD
- **OS**: Ubuntu 20.04+ или CentOS 8+
- **Docker**: 20.10+
- **Docker Compose**: 1.29+

### **Server Preparation:**
```bash
# 1. Обновить систему
sudo apt update && sudo apt upgrade -y

# 2. Установить Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# 3. Установить Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 4. Клонировать проект
git clone <repository-url>
cd DevAssist-Pro

# 5. Развернуть
./deploy.sh deploy
```

## 📞 Support

При возникновении проблем:

1. **Проверить логи**: `./deploy.sh logs`
2. **Проверить статус**: `./deploy.sh status`
3. **Запустить health checks**: `./deploy.sh health`
4. **Обратиться к troubleshooting секции выше**

---

## ✅ Success Criteria

После успешного развертывания у вас должно быть:

- ✅ Frontend доступен на http://localhost
- ✅ Backend API отвечает на http://localhost/api
- ✅ Все health checks проходят
- ✅ API интеграция работает
- ✅ WebSocket connections функционируют
- ✅ Статические файлы загружаются
- ✅ База данных подключена
- ✅ AI сервисы работают (при настроенных ключах)

**Production Ready!** 🎉