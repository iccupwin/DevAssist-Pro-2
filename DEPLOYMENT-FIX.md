# 🔧 DevAssist Pro - Deployment Troubleshooting

## ⚠️ Проблемы при deployment

Если у вас возникли проблемы при запуске `./deploy.sh deploy`, используйте этот гайд для их решения.

## 🚀 Быстрое исправление (РЕКОМЕНДУЕТСЯ)

```bash
# Запустить автоматическое исправление всех проблем
./fix-deployment.sh

# После исправления попробовать снова
docker-compose -f docker-compose.unified.yml up -d
```

---

## 🔍 Основные проблемы и решения

### **1. Ошибка `npm ci --only=production` в frontend**

**Проблема**: Frontend Dockerfile не может установить зависимости  
**Решение**: Исправлено в упрощенном Dockerfile

```bash
./fix-deployment.sh  # Создаст frontend/Dockerfile.simple
```

### **2. Порт 80 занят**

**Проблема**: `WARNING Порт 80 уже занят`  
**Решение**: Остановить конфликтующие сервисы или использовать другой порт

```bash
# Автоматическое исправление
./fix-deployment.sh port

# ИЛИ ручное решение
sudo systemctl stop apache2
sudo systemctl stop nginx

# Если не помогло - используем порт 8080
# Приложение будет доступно на http://localhost:8080
```

### **3. Версия Docker Compose устарела**

**Проблема**: `WARN the attribute 'version' is obsolete`  
**Решение**: Уже исправлено в docker-compose.unified.yml

### **4. Проблемы с Docker кешем**

**Проблема**: Старые кешированные образы мешают сборке  
**Решение**: Очистка кеша

```bash
./fix-deployment.sh cache
```

---

## 📋 Пошаговое ручное исправление

Если автоматический скрипт не помог:

### **Шаг 1: Остановка всех сервисов**
```bash
# Остановить Docker контейнеры
docker-compose -f docker-compose.unified.yml down --remove-orphans

# Остановить системные веб-серверы
sudo systemctl stop apache2 nginx || true
```

### **Шаг 2: Очистка Docker**
```bash
# Удалить старые образы проекта
docker images | grep devassist | awk '{print $3}' | xargs docker rmi -f || true

# Очистить систему
docker system prune -f
```

### **Шаг 3: Проверка environment**
```bash
# Создать .env если отсутствует
cp .env.production .env

# Проверить критические переменные
grep "API_KEY" .env
```

### **Шаг 4: Создание необходимых директорий**
```bash
mkdir -p nginx/ssl backend/data/uploads backend/data/reports logs
```

### **Шаг 5: Упрощенная сборка**
```bash
# Тестовая сборка frontend
cd frontend && npm install && npm run build && cd ..

# Запуск только базовых сервисов
docker-compose -f docker-compose.unified.yml up -d postgres redis

# Проверка готовности БД
docker exec devassist_postgres_unified pg_isready -U devassist

# Запуск остальных сервисов
docker-compose -f docker-compose.unified.yml up -d
```

---

## 🔍 Диагностика проблем

### **Проверка статуса сервисов:**
```bash
docker-compose -f docker-compose.unified.yml ps
```

### **Просмотр логов:**
```bash
# Все логи
docker-compose -f docker-compose.unified.yml logs

# Конкретный сервис
docker-compose -f docker-compose.unified.yml logs frontend
docker-compose -f docker-compose.unified.yml logs backend
docker-compose -f docker-compose.unified.yml logs nginx
```

### **Проверка портов:**
```bash
# Какие порты заняты
sudo lsof -i :80
sudo lsof -i :8080

# Статус системных сервисов  
sudo systemctl status apache2
sudo systemctl status nginx
```

### **Health checks:**
```bash
# После успешного запуска
curl http://localhost/health         # или :8080 если порт изменен
curl http://localhost/api/health
```

---

## 🎯 Успешный результат

После исправления вы должны увидеть:

```bash
docker-compose -f docker-compose.unified.yml ps
```

```
NAME                        COMMAND                  SERVICE   STATUS    PORTS
devassist_postgres_unified  "docker-entrypoint.s…"  postgres  running   0.0.0.0:5432->5432/tcp
devassist_redis_unified     "docker-entrypoint.s…"  redis     running   0.0.0.0:6379->6379/tcp  
devassist_backend_unified   "python app.py"          backend   running   
devassist_frontend_unified  "/docker-entrypoint.…"  frontend  running   
devassist_nginx_unified     "/docker-entrypoint.…"  nginx     running   0.0.0.0:80->80/tcp
```

**Приложение доступно:**
- Frontend: http://localhost (или :8080)
- Backend API: http://localhost/api
- API Docs: http://localhost/api/docs

---

## 🆘 Если ничего не помогает

### **Альтернативный запуск (упрощенный):**

```bash
# 1. Только backend из существующей конфигурации
cd backend
docker-compose -f docker-compose.monolith.yml up -d

# 2. Frontend отдельно
cd ../frontend  
npm install
npm start
# Доступно на http://localhost:3000
```

### **Проверка системных требований:**
```bash
# Docker
docker --version  # Нужен 20.10+

# Docker Compose  
docker-compose --version  # Нужен 1.29+

# Свободное место
df -h .  # Нужно 5GB+

# RAM
free -h  # Нужно 4GB+
```

### **Сброс к исходному состоянию:**
```bash
# Полная очистка
docker-compose -f docker-compose.unified.yml down -v
docker system prune -a -f
git checkout .  # Если есть изменения в файлах
```

---

## 📞 Дополнительная помощь

Если проблемы сохраняются:

1. **Запустите диагностику**: `./fix-deployment.sh test`
2. **Соберите логи**: `docker-compose -f docker-compose.unified.yml logs > debug.log`
3. **Проверьте системные ресурсы**: `top`, `df -h`, `free -h`

**Наиболее частые проблемы решаются скриптом**: `./fix-deployment.sh`