# 🚀 БЫСТРОЕ ИСПРАВЛЕНИЕ НА СЕРВЕРЕ 46.149.71.162

## Выполните эти команды на сервере:

```bash
# 1. Перейдите в проект
cd ~/project

# 2. Исправьте docker-compose.monolith.yml
./fix-docker-compose-server.sh

# 3. Запустите полный монолитный backend
./deploy-full-monolith.sh

# 4. Проверьте результат
curl http://localhost:8000/health
```

## Если нет исправленных файлов:

Создайте исправления вручную:

```bash
cd ~/project/backend

# Добавьте version в начало файла
sed -i '1i version: '"'"'3.8'"'"'\n' docker-compose.monolith.yml

# Исправьте булевые значения
sed -i 's/DEBUG: false/DEBUG: "false"/g' docker-compose.monolith.yml
sed -i 's/LOG_LEVEL: INFO/LOG_LEVEL: "INFO"/g' docker-compose.monolith.yml
sed -i 's/ENVIRONMENT: production/ENVIRONMENT: "production"/g' docker-compose.monolith.yml
sed -i 's/USE_REAL_API: true/USE_REAL_API: "true"/g' docker-compose.monolith.yml
sed -i 's/ADMIN_PASSWORD: admin123/ADMIN_PASSWORD: "admin123"/g' docker-compose.monolith.yml
sed -i 's/MAX_FILE_SIZE: 50MB/MAX_FILE_SIZE: "50MB"/g' docker-compose.monolith.yml
sed -i 's/SUPPORTED_FORMATS: pdf,docx,txt/SUPPORTED_FORMATS: "pdf,docx,txt"/g' docker-compose.monolith.yml

# Исправьте ALLOWED_ORIGINS (добавьте кавычки вокруг всего значения)
sed -i 's/ALLOWED_ORIGINS: http:/ALLOWED_ORIGINS: "http:/g' docker-compose.monolith.yml
sed -i 's/localhost:3001$/localhost:3001"/g' docker-compose.monolith.yml

# Проверьте конфигурацию
docker-compose -f docker-compose.monolith.yml config

# Если ОК, запустите монолит
cd ..
./deploy-full-monolith.sh
```

## Ожидаемый результат:

```bash
curl http://localhost:8000/health
# {"status":"healthy","service":"devassist-pro-monolith","timestamp":"...","version":"1.0.0"}

curl http://localhost:8000/api
# {"service":"DevAssist Pro - КП Анализатор","version":"1.0.0",...}
```

## Все API endpoints должны работать:

- ✅ `/api` - API информация
- ✅ `/api/admin/status` - Статус системы  
- ✅ `/api/analytics/dashboard` - Аналитика
- ✅ `/api/activity` - Лента активности
- ✅ `/api/llm/health` - Здоровье AI

## Проверка:

```bash
./test-remote-backend.sh
```

Или локально:
```bash
curl http://46.149.71.162:8000/api
curl http://46.149.71.162:8000/api/admin/status
```