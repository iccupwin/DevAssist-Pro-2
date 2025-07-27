# 🚨 СРОЧНОЕ ИСПРАВЛЕНИЕ - Сервер 46.149.71.162

## Проблема: Docker API ошибка
```
docker.errors.DockerException: Error while fetching server API version: Not supported URL scheme http+docker
```

## ✅ РЕШЕНИЕ 1: Исправить Docker (рекомендуется)

```bash
# 1. Проверить и исправить Docker
cd ~/project

# Проверить статус Docker
systemctl status docker

# Если Docker не запущен:
systemctl start docker
systemctl enable docker

# Проверить что Docker работает
docker info
docker --version

# Тест Docker
docker run --rm hello-world

# Если все ОК, повторить запуск монолита
./deploy-full-monolith.sh
```

## ✅ РЕШЕНИЕ 2: Запуск БЕЗ Docker (быстрое решение)

```bash
cd ~/project

# Запустить монолитный backend напрямую через Python
./start-monolith-direct.sh
```

## ✅ РЕШЕНИЕ 3: Ручной запуск

```bash
cd ~/project

# Остановить текущие процессы
pkill -f "python.*app" || true

# Перейти в backend
cd backend

# Установить зависимости
python3 -m pip install fastapi uvicorn python-dotenv anthropic openai

# Создать .env если нет
cd ..
if [ ! -f ".env" ]; then
    cp .env.example .env 2>/dev/null || echo "DEBUG=false
LOG_LEVEL=INFO
ENVIRONMENT=production
ADMIN_PASSWORD=admin123
ANTHROPIC_API_KEY=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" > .env
fi

# Создать директории
mkdir -p data/reports data/uploads data/cache

# Запустить приложение
cd backend
nohup python3 app.py > ../app.log 2>&1 &

# Проверить через 10 секунд
sleep 10
curl http://localhost:8000/health
```

## 🔍 ПРОВЕРКА РЕЗУЛЬТАТА

После любого из способов:

```bash
# Проверить health
curl http://localhost:8000/health
# Должно быть: {"service":"devassist-pro-monolith",...}

# Проверить API endpoints
curl http://localhost:8000/api
curl http://localhost:8000/api/admin/status
curl http://localhost:8000/docs

# Внешняя проверка
curl http://46.149.71.162:8000/health
```

## 📋 УПРАВЛЕНИЕ ПРОЦЕССОМ

```bash
# Просмотр логов
tail -f ~/project/app.log

# Остановка
pkill -f "python.*app"

# Или по PID (если использовали start-monolith-direct.sh)
kill $(cat ~/project/app.pid)

# Статус
curl http://localhost:8000/health
```

## 🚀 ЕСЛИ ВСЕ РАБОТАЕТ

Тогда все API endpoints должны отвечать:
- ✅ `/api` - API информация
- ✅ `/api/admin/status` - Статус системы  
- ✅ `/api/analytics/dashboard` - Аналитика
- ✅ `/api/activity` - Лента активности

И внешний доступ:
- ✅ http://46.149.71.162:8000/
- ✅ http://46.149.71.162:8000/docs

---

**Рекомендация:** Попробуйте сначала РЕШЕНИЕ 2 (start-monolith-direct.sh) - это самый быстрый способ!