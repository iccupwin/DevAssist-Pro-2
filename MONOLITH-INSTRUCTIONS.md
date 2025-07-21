# 🚀 Запуск Монолитного Backend

## Быстрый старт на сервере:

```bash
# 1. Запустить монолит
./start-monolith.sh

# 2. Проверить статус  
./monolith-status.sh

# 3. Остановить (если нужно)
./stop-monolith.sh
```

## Что включает монолит:

- 🐘 **PostgreSQL** - база данных (порт 5432)
- 🔴 **Redis** - кеш (порт 6379) 
- 🐍 **Backend API** - FastAPI приложение (порт 8000)

## Автоматические исправления:

✅ **CORS** - обновляется для IP сервера `46.149.71.162:3000`  
✅ **База данных** - полная PostgreSQL с миграциями  
✅ **Аутентификация** - с JWT токенами  
✅ **AI API** - интеграция с Anthropic Claude  

## Ожидаемый результат:

После запуска `./start-monolith.sh`:

- 🌐 Backend API: http://46.149.71.162:8000
- 📚 API Docs: http://46.149.71.162:8000/docs  
- 🔐 Аутентификация: полностью работает

## Тестовые пользователи:

- `admin@devassist.pro` / `admin123`
- `test@example.com` / `testpass123`

## Управление:

```bash
# Логи backend
docker compose -f backend/docker-compose.monolith.yml logs app

# Перезапуск только backend
docker compose -f backend/docker-compose.monolith.yml restart app

# Полный перезапуск
./stop-monolith.sh && ./start-monolith.sh
```

## Если проблемы:

1. **Проверить логи**: `./monolith-status.sh`
2. **Порты заняты**: `sudo fuser -k 8000/tcp`
3. **Старые контейнеры**: `./stop-monolith.sh`

---

**Преимущества монолита:**
- ✅ Полная функциональность
- ✅ База данных с миграциями  
- ✅ Все AI провайдеры
- ✅ Производственная готовность