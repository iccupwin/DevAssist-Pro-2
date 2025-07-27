# DevAssist Pro - Исправление развертывания на сервере 46.149.71.162

## 🚨 Проблема

На сервере запущен **упрощенный backend** (`app_simple.py`), а не полный монолитный backend (`app.py`).

Поэтому многие API endpoints недоступны:
- ❌ `/api` - API информация  
- ❌ `/api/admin/status` - Статус системы
- ❌ `/api/llm/health` - Здоровье AI
- ❌ `/api/analytics/dashboard` - Аналитика
- ❌ `/api/activity` - Лента активности

## ✅ Решение

### 1. Исправлены файлы локально

✅ **docker-compose.monolith.yml** - исправлены булевые значения на строки  
✅ **deploy-full-monolith.sh** - скрипт для переключения на полный backend  
✅ **test-remote-backend.sh** - тестирование удаленного сервера

### 2. Команды для сервера

```bash
# Подключитесь к серверу
ssh root@46.149.71.162

# Перейдите в проект
cd ~/project

# Загрузите обновленные файлы (git pull или скопируйте)
git pull origin main

# Остановите текущий упрощенный backend
pkill -f "python.*app_simple"
pkill -f "uvicorn"

# Остановите Docker контейнеры если есть
cd backend
docker-compose down 2>/dev/null || true
docker-compose -f docker-compose.monolith.yml down 2>/dev/null || true

# Вернитесь в корень и запустите полный монолит
cd ..
./deploy-full-monolith.sh
```

### 3. Альтернативный способ (если git недоступен)

Скопируйте исправленные файлы на сервер:

```bash
# Локально отправьте файлы
scp backend/docker-compose.monolith.yml root@46.149.71.162:~/project/backend/
scp deploy-full-monolith.sh root@46.149.71.162:~/project/
scp test-remote-backend.sh root@46.149.71.162:~/project/

# На сервере сделайте исполняемыми
ssh root@46.149.71.162
cd ~/project
chmod +x deploy-full-monolith.sh test-remote-backend.sh

# Запустите полный backend
./deploy-full-monolith.sh
```

### 4. Проверка результата

После развертывания полного backend проверьте:

```bash
# На сервере
curl http://localhost:8000/health

# Ожидаемый результат:
# {"status":"healthy","service":"devassist-pro-monolith","timestamp":"...","version":"1.0.0"}
#                              ^^^^^^^^^^^^^^^^^^^ 
#                              Должно быть именно это!

# Проверьте все endpoints
./test-remote-backend.sh

# Или локально
curl http://46.149.71.162:8000/api
curl http://46.149.71.162:8000/api/admin/status
curl http://46.149.71.162:8000/api/analytics/dashboard
```

## 🔧 Что было исправлено

### docker-compose.monolith.yml
```yaml
# БЫЛО (вызывало ошибку):
DEBUG: false
LOG_LEVEL: INFO

# СТАЛО (правильно):
DEBUG: "false"
LOG_LEVEL: "INFO"
```

### Добавлены скрипты
1. **deploy-full-monolith.sh** - автоматическое развертывание полного backend
2. **test-remote-backend.sh** - тестирование удаленного сервера
3. Обновлены существующие скрипты с поддержкой полного монолита

## 📊 Ожидаемый результат

После правильного развертывания все API endpoints должны работать:

✅ **Основные:**
- `GET /` - Главная страница
- `GET /health` - Health check (`service: "devassist-pro-monolith"`)
- `GET /docs` - API документация

✅ **API endpoints:**
- `GET /api` - API информация  
- `GET /api/admin/status` - Статус системы

✅ **AI/LLM:**
- `GET /api/llm/providers` - AI провайдеры
- `GET /api/llm/health` - Здоровье AI

✅ **Analytics:**
- `GET /api/analytics/dashboard` - Дашборд аналитики

✅ **Activity:**
- `GET /api/activity` - Лента активности

## 🚀 Следующие шаги

1. **Развертывание**: Выполните команды выше на сервере
2. **Настройка .env**: Добавьте API ключи для AI провайдеров
3. **Тестирование**: Запустите `./test-remote-backend.sh` для проверки
4. **Frontend**: При необходимости запустите React frontend

---

**Итог**: После развертывания у вас будет полнофункциональный монолитный backend со всеми API endpoints!