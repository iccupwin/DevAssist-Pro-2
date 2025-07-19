# DevAssist Pro - Unified Fullstack Deployment

🚀 **Единая Docker конфигурация для объединения backend и frontend в deployable систему**

## 🎯 Обзор

DevAssist Pro теперь поддерживает unified deployment, где frontend (React) и backend (FastAPI) работают в едином контейнере с Nginx в качестве reverse proxy. Это обеспечивает:

- **Одна команда запуска**: `./start-fullstack.sh` стартует всю систему
- **Единый endpoint**: Сервер доступен на одном порту (80)
- **Production ready**: Оптимизированная сборка для сервера
- **Полная изоляция**: Все зависимости в контейнере
- **Легкий deployment**: Простое развертывание на любом сервере

## 🏗 Архитектура

```
Docker Container (Port 80):
├── Nginx (Reverse Proxy)
│   ├── Frontend Static Files (/)
│   └── API Proxy (/api → Backend:8000)
├── Backend FastAPI (Port 8000)
├── PostgreSQL Database
└── Redis Cache
```

## 📦 Быстрый старт

### 1. Подготовка окружения

```bash
# Клонируем репозиторий
git clone <repository-url>
cd DevAssist-Pro

# Создаем .env файл из примера
cp .env.fullstack.example .env

# ВАЖНО: Отредактируйте .env файл
nano .env
```

### 2. Настройка .env файла

**Обязательные настройки:**
```bash
# AI Provider API Key (ОБЯЗАТЕЛЬНО)
ANTHROPIC_API_KEY=sk-ant-api03-your-anthropic-api-key-here

# Database Passwords
POSTGRES_PASSWORD=your_secure_postgres_password
REDIS_PASSWORD=your_secure_redis_password

# Security Keys
JWT_SECRET_KEY=your-jwt-secret-key-minimum-32-characters-long
SESSION_SECRET=your-session-secret-key-minimum-32-characters-long
```

### 3. Запуск системы

```bash
# Запуск с автоматической сборкой
./start-fullstack.sh

# Запуск с полной пересборкой (если нужно)
./start-fullstack.sh --rebuild

# Запуск с очисткой старых данных
./start-fullstack.sh --clean
```

### 4. Проверка работы

После запуска система будет доступна по адресам:

- **Главная страница**: http://localhost:80
- **API документация**: http://localhost:80/api/docs  
- **Health Check**: http://localhost:80/health

## 🛠 Управление системой

### Основные команды

```bash
# Запуск системы
./start-fullstack.sh

# Остановка системы
./stop-fullstack.sh

# Остановка с полной очисткой
./stop-fullstack.sh --clean

# Просмотр логов
docker-compose -f docker-compose.fullstack.yml logs -f

# Просмотр статуса контейнеров
docker-compose -f docker-compose.fullstack.yml ps

# Перезапуск отдельного сервиса
docker-compose -f docker-compose.fullstack.yml restart fullstack
```

### Мониторинг

```bash
# Проверка состояния всех сервисов
curl http://localhost:80/health

# Просмотр логов конкретного сервиса
docker-compose -f docker-compose.fullstack.yml logs -f fullstack
docker-compose -f docker-compose.fullstack.yml logs -f postgres
docker-compose -f docker-compose.fullstack.yml logs -f redis

# Мониторинг ресурсов
docker stats
```

## 🔧 Конфигурация

### Структура файлов

```
DevAssist-Pro/
├── Dockerfile.fullstack              # Единый Dockerfile для всей системы
├── docker-compose.fullstack.yml      # Docker Compose конфигурация
├── nginx.fullstack.conf              # Nginx конфигурация для reverse proxy
├── .env.fullstack.example            # Шаблон environment variables
├── start-fullstack.sh                # Скрипт запуска
├── stop-fullstack.sh                 # Скрипт остановки
├── frontend/
│   ├── Dockerfile.production         # Frontend Docker build
│   └── nginx.frontend.conf           # Frontend Nginx config
└── backend/
    ├── app.py                        # Backend application
    └── requirements-monolith.txt     # Python dependencies
```

### Environment Variables

Все переменные окружения настраиваются в `.env` файле:

#### Обязательные настройки:
- `ANTHROPIC_API_KEY` - API ключ для Claude AI
- `POSTGRES_PASSWORD` - Пароль для PostgreSQL
- `REDIS_PASSWORD` - Пароль для Redis
- `JWT_SECRET_KEY` - Секретный ключ для JWT токенов
- `SESSION_SECRET` - Секретный ключ для сессий

#### Опциональные настройки:
- `OPENAI_API_KEY` - API ключ для OpenAI GPT
- `GOOGLE_API_KEY` - API ключ для Google Gemini
- `GOOGLE_CLIENT_ID/SECRET` - OAuth для социальной авторизации
- `SMTP_*` - Настройки email уведомлений
- `SENTRY_DSN` - Error tracking

### Nginx Configuration

Nginx настроен как reverse proxy:

- **Frontend**: Статические файлы на root path (`/`)
- **API**: Проксирование на backend (`/api/*` → `localhost:8000`)
- **WebSocket**: Поддержка WebSocket соединений (`/ws`)
- **Health Check**: Endpoint для мониторинга (`/health`)

## 🔒 Security

### Production настройки

1. **Смена паролей по умолчанию**:
   ```bash
   POSTGRES_PASSWORD=complex_secure_password_here
   REDIS_PASSWORD=another_secure_password_here
   ```

2. **Генерация secure ключей**:
   ```bash
   # Генерируем случайные ключи
   openssl rand -base64 32  # Для JWT_SECRET_KEY
   openssl rand -base64 32  # Для SESSION_SECRET
   ```

3. **CORS настройки**:
   ```bash
   ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
   ```

4. **HTTPS (для production)**:
   - Настройте SSL сертификаты
   - Обновите Nginx конфигурацию
   - Используйте внешний reverse proxy (Cloudflare, Nginx Proxy Manager)

### Security Headers

Nginx автоматически добавляет security headers:
- `X-Frame-Options: SAMEORIGIN`
- `X-Content-Type-Options: nosniff`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`

## 📊 Monitoring & Logs

### Логирование

Все логи сохраняются в стандартизированном формате:

- **Application Logs**: `/var/log/devassist/`
- **Nginx Logs**: `/var/log/nginx/`
- **Supervisor Logs**: `/var/log/supervisor/`

### Health Checks

Система включает комплексные health checks:

- **Application Health**: `http://localhost:80/health`
- **Database Health**: Автоматическая проверка PostgreSQL
- **Cache Health**: Автоматическая проверка Redis
- **Docker Health**: Встроенные Docker healthcheck

### Мониторинг производительности

```bash
# CPU и память
docker stats

# Дисковое пространство
df -h ./data/

# Сетевая активность
docker-compose -f docker-compose.fullstack.yml top
```

## 🚀 Deployment на сервер

### Системные требования

- **OS**: Ubuntu 20.04+ / CentOS 8+ / Debian 11+
- **RAM**: Минимум 4GB, рекомендуется 8GB
- **Storage**: Минимум 20GB свободного места
- **Docker**: 20.10+
- **Docker Compose**: 2.0+

### Deployment процесс

1. **Подготовка сервера**:
   ```bash
   # Установка Docker
   curl -fsSL https://get.docker.com -o get-docker.sh
   sudo sh get-docker.sh
   
   # Установка Docker Compose
   sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
   sudo chmod +x /usr/local/bin/docker-compose
   ```

2. **Загрузка кода**:
   ```bash
   git clone <repository-url>
   cd DevAssist-Pro
   ```

3. **Настройка окружения**:
   ```bash
   cp .env.fullstack.example .env
   # Отредактируйте .env файл с production настройками
   ```

4. **Запуск**:
   ```bash
   ./start-fullstack.sh --rebuild
   ```

5. **Настройка автозапуска** (опционально):
   ```bash
   # Создаем systemd service
   sudo tee /etc/systemd/system/devassist-pro.service << EOF
   [Unit]
   Description=DevAssist Pro Fullstack Application
   Requires=docker.service
   After=docker.service
   
   [Service]
   Type=oneshot
   RemainAfterExit=yes
   WorkingDirectory=/path/to/DevAssist-Pro
   ExecStart=/path/to/DevAssist-Pro/start-fullstack.sh
   ExecStop=/path/to/DevAssist-Pro/stop-fullstack.sh
   
   [Install]
   WantedBy=multi-user.target
   EOF
   
   sudo systemctl enable devassist-pro
   sudo systemctl start devassist-pro
   ```

## 🔄 Development vs Production

### Development режим

Для разработки используйте отдельные контейнеры:

```bash
# Backend разработка
cd backend
docker-compose -f docker-compose.monolith.yml up

# Frontend разработка  
cd frontend
npm start
```

### Production режим

Для production используйте unified deployment:

```bash
# Production запуск
./start-fullstack.sh
```

## 🛠 Troubleshooting

### Частые проблемы

1. **Контейнер не запускается**:
   ```bash
   # Проверяем логи
   docker-compose -f docker-compose.fullstack.yml logs fullstack
   
   # Проверяем .env файл
   grep -v '^#' .env | grep -v '^$'
   ```

2. **База данных не подключается**:
   ```bash
   # Проверяем статус PostgreSQL
   docker-compose -f docker-compose.fullstack.yml logs postgres
   
   # Проверяем доступность
   docker-compose -f docker-compose.fullstack.yml exec postgres pg_isready -U devassist
   ```

3. **Frontend не загружается**:
   ```bash
   # Проверяем Nginx конфигурацию
   docker-compose -f docker-compose.fullstack.yml exec fullstack nginx -t
   
   # Проверяем логи
   docker-compose -f docker-compose.fullstack.yml logs fullstack
   ```

4. **AI функции не работают**:
   ```bash
   # Проверяем API ключ
   grep ANTHROPIC_API_KEY .env
   
   # Тестируем API
   curl -X GET http://localhost:80/api/llm/providers
   ```

### Отладка

```bash
# Войти в контейнер для отладки
docker-compose -f docker-compose.fullstack.yml exec fullstack bash

# Проверить все процессы
docker-compose -f docker-compose.fullstack.yml exec fullstack supervisorctl status

# Перезапустить конкретный сервис
docker-compose -f docker-compose.fullstack.yml exec fullstack supervisorctl restart backend
```

## 📈 Performance Optimization

### Рекомендации для production

1. **Увеличьте ресources**:
   ```yaml
   # В docker-compose.fullstack.yml
   deploy:
     resources:
       limits:
         memory: 4G
         cpus: '2'
   ```

2. **Настройте Nginx кеширование**:
   ```nginx
   # В nginx.fullstack.conf
   location ~* \.(js|css|png|jpg)$ {
       expires 1y;
       add_header Cache-Control "public, immutable";
   }
   ```

3. **Оптимизируйте базу данных**:
   ```bash
   # Увеличьте shared_buffers в PostgreSQL
   POSTGRES_CONFIG_shared_buffers=256MB
   ```

## 📞 Поддержка

Если у вас возникли проблемы:

1. Проверьте логи: `docker-compose -f docker-compose.fullstack.yml logs -f`
2. Убедитесь, что все environment variables настроены
3. Проверьте, что порт 80 не занят другими приложениями
4. Для сложных проблем создайте issue в репозитории

---

**🎉 DevAssist Pro готов к production deployment!**