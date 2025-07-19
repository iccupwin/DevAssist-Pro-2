# 🚀 DevAssist Pro - Quick Start (Unified Deployment)

## ⚡ Быстрый запуск за 5 минут

### **Шаг 1: Подготовка** (1 минута)
```bash
# Клонировать проект (если еще не клонирован)
git clone <repository-url>
cd DevAssist-Pro

# Создать .env файл
cp .env.production .env
```

### **Шаг 2: Настройка API ключей** (2 минуты)
```bash
# Редактировать .env файл
nano .env

# Заменить эти строки на реальные ключи:
ANTHROPIC_API_KEY=your_real_anthropic_api_key_here
OPENAI_API_KEY=your_real_openai_api_key_here
GOOGLE_API_KEY=your_real_google_api_key_here
```

### **Шаг 3: Запуск** (2 минуты)
```bash
# Полный автоматический deployment
./deploy.sh deploy

# ИЛИ быстрый запуск без проверок
./deploy.sh quick
```

## ✅ Проверка работы

После запуска проверьте:

```bash
# Статус сервисов
./deploy.sh status

# Health checks
curl http://localhost/health
curl http://localhost/api/health
```

**Готово!** Откройте http://localhost в браузере.

---

## 🔧 Альтернативный запуск (ручной)

```bash
# 1. Тестирование конфигурации
./test-deployment.sh

# 2. Ручная сборка и запуск
docker-compose -f docker-compose.unified.yml build
docker-compose -f docker-compose.unified.yml up -d

# 3. Проверка логов
docker-compose -f docker-compose.unified.yml logs -f
```

---

## 📊 Доступные сервисы

После успешного запуска:

| Сервис | URL | Описание |
|--------|-----|----------|
| 🌐 **Frontend** | http://localhost | React SPA приложение |
| 🚀 **Backend API** | http://localhost/api | FastAPI backend |
| 📖 **API Docs** | http://localhost/api/docs | Swagger документация |
| 🔍 **Health Check** | http://localhost/health | Проверка работоспособности |

---

## 🛠️ Управление

```bash
# Основные команды
./deploy.sh status    # Статус сервисов
./deploy.sh logs      # Просмотр логов  
./deploy.sh restart   # Перезапуск
./deploy.sh stop      # Остановка
./deploy.sh cleanup   # Полная очистка

# Мониторинг
./deploy.sh monitoring  # Включить метрики
```

---

## 🔧 Troubleshooting

### **Проблема: Порт 80 занят**
```bash
sudo lsof -i :80
sudo systemctl stop apache2  # или nginx
./deploy.sh restart
```

### **Проблема: Backend не отвечает**
```bash
# Проверить логи
./deploy.sh logs

# Перезапустить backend
docker-compose -f docker-compose.unified.yml restart backend
```

### **Проблема: API ключи не работают**
```bash
# Проверить .env
grep "API_KEY" .env

# Перезапустить после изменения .env
./deploy.sh restart
```

---

## 📝 Полная документация

Для подробной информации см. [README-DEPLOYMENT.md](README-DEPLOYMENT.md)

---

**Время запуска**: ~5 минут  
**Системные требования**: Docker + 4GB RAM + 20GB Storage  
**Поддерживаемые ОС**: Linux, macOS, Windows (WSL2)