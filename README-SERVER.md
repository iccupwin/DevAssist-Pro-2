# 🚀 DevAssist Pro - Server Deployment Guide

Руководство по развертыванию проекта на сервере с правильной архитектурой.

## 📋 Архитектура

- **Backend**: Streamlit (порт 8501)
- **Frontend**: React с npm start (порт 3000)
- **Database**: PostgreSQL (порт 5432)
- **Proxy**: Nginx (порт 80)
- **Контейнеризация**: Docker + Docker Compose

## 🛠 Пошаговое развертывание

### 1. Подготовка сервера

```bash
# Клонирование проекта
git clone https://github.com/your-repo/DevAssist-Pro.git
cd DevAssist-Pro

# Подготовка Ubuntu сервера
./server-setup.sh

# Перезагрузка сервера
sudo reboot
```

### 2. Конфигурация

```bash
# Вход на сервер после перезагрузки
cd DevAssist-Pro

# Копирование шаблона конфигурации
cp .env.server .env

# ОБЯЗАТЕЛЬНО: Редактирование .env
nano .env
```

**Важные настройки в .env:**
```bash
# IP адрес вашего сервера (автоматически определится)
SERVER_IP=YOUR_SERVER_IP_HERE

# Пароль базы данных
POSTGRES_PASSWORD=secure_postgres_password_123

# API ключи (ОБЯЗАТЕЛЬНО!)
ANTHROPIC_API_KEY=ваш_ключ_anthropic
OPENAI_API_KEY=ваш_ключ_openai
GOOGLE_API_KEY=ваш_ключ_google
```

### 3. Развертывание

```bash
# Полное развертывание одной командой
./deploy-server.sh
```

**Что происходит:**
1. Автоматически определяется IP сервера
2. Создаются необходимые директории
3. Запускается PostgreSQL в контейнере
4. Собирается и запускается Streamlit backend
5. Собирается и запускается React frontend
6. Настраивается Nginx reverse proxy

## 🎯 Доступ к приложению

После развертывания доступно:

- **🌐 Основной сайт**: `http://ваш-IP` (через Nginx)
- **⚛️ React Frontend**: `http://ваш-IP:3000`
- **🎯 Streamlit Backend**: `http://ваш-IP:8501`

## 🔧 Управление сервисами

```bash
# Статус сервисов
./deploy-server.sh status

# Просмотр логов
./deploy-server.sh logs

# Перезапуск сервисов
./deploy-server.sh restart

# Остановка сервисов
./deploy-server.sh stop

# Очистка всех данных
./deploy-server.sh clean

# Показать IP сервера
./deploy-server.sh ip
```

## 🔍 Диагностика

### Проверка контейнеров
```bash
docker-compose -f docker-compose.server.yml ps
```

### Логи отдельных сервисов
```bash
# Backend (Streamlit)
docker-compose -f docker-compose.server.yml logs -f backend

# Frontend (React)
docker-compose -f docker-compose.server.yml logs -f frontend

# Database
docker-compose -f docker-compose.server.yml logs -f postgres

# Nginx
docker-compose -f docker-compose.server.yml logs -f nginx
```

### Тестирование подключений
```bash
# Проверка PostgreSQL
docker-compose -f docker-compose.server.yml exec postgres pg_isready -U devassist_user

# Проверка Streamlit
curl http://localhost:8501/_stcore/health

# Проверка React
curl http://localhost:3000
```

## 🔄 Обновление проекта

```bash
# Остановка сервисов
./deploy-server.sh stop

# Обновление кода
git pull origin second

# Пересборка и запуск
./deploy-server.sh
```

## 🚨 Устранение неполадок

### Frontend не запускается
```bash
# Проверить Node.js
node --version
npm --version

# Очистить npm cache
docker-compose -f docker-compose.server.yml exec frontend npm cache clean --force

# Переустановить зависимости
docker-compose -f docker-compose.server.yml exec frontend npm install
```

### Backend недоступен
```bash
# Проверить Python зависимости
docker-compose -f docker-compose.server.yml exec backend pip list

# Проверить Streamlit
docker-compose -f docker-compose.server.yml exec backend streamlit --version
```

### База данных недоступна
```bash
# Проверить подключение
docker-compose -f docker-compose.server.yml exec backend python -c "
import psycopg2
try:
    conn = psycopg2.connect('postgresql://devassist_user:secure_postgres_123@postgres:5432/devassist_pro')
    print('Database connection OK')
except Exception as e:
    print(f'Database error: {e}')
"
```

## 🔐 Безопасность

### Настройка файрвола
```bash
# Разрешить только необходимые порты
sudo ufw deny 5432/tcp  # Закрыть прямой доступ к PostgreSQL
sudo ufw reload
```

### SSL сертификат (опционально)
```bash
# Установка Certbot
sudo apt install certbot

# Получение сертификата
sudo certbot certonly --standalone -d ваш-домен.com

# Настройка SSL в nginx.server.conf
```

## 📊 Мониторинг ресурсов

```bash
# Использование ресурсов контейнерами
docker stats

# Место на диске
df -h
docker system df

# Логи системы
journalctl -f
```

## 🆘 Поддержка

Если возникли проблемы:

1. Проверьте логи: `./deploy-server.sh logs`
2. Проверьте статус: `./deploy-server.sh status`
3. Проверьте подключения: `curl http://localhost:3000` и `curl http://localhost:8501`
4. Обратитесь к разработчикам с полной информацией об ошибке

---

**🎉 DevAssist Pro готов к работе на вашем сервере!**