# 🚨 Быстрое исправление npm build ошибки

## Проблема
На сервере `root@5306863-kq25582:/opt/devassist-pro#` при выполнении `./start-fullstack.sh --rebuild` возникла ошибка:
```
process '/bin/sh -c npm ci --only=production --silent' did not complete successfully: exit code: 1
```

## ✅ РЕШЕНИЕ: Использовать упрощенную версию без frontend build

### Шаг 1: Скопировать упрощенные файлы
```bash
cd /opt/devassist-pro

# Заменяем Docker файлы на упрощенные версии
cp Dockerfile.fullstack.simple Dockerfile.fullstack
cp docker-compose.simple.yml docker-compose.fullstack.yml
```

### Шаг 2: Проверить что файлы скопированы
```bash
# Проверяем что упрощенные файлы на месте
ls -la Dockerfile.fullstack docker-compose.fullstack.yml

# Проверяем содержимое - должно быть без npm build
head -20 Dockerfile.fullstack | grep -i "FROM"
```

### Шаг 3: Запустить упрощенную версию
```bash
# Останавливаем если что-то было запущено
./stop-fullstack.sh

# Запускаем с полной пересборкой
./start-fullstack.sh --rebuild
```

### Шаг 4: Проверить запуск
```bash
# Следим за логами
docker-compose -f docker-compose.fullstack.yml logs -f
```

В другом терминале:
```bash
# Проверяем статус контейнеров
docker-compose -f docker-compose.fullstack.yml ps

# Проверяем health check
curl http://localhost:80/health
curl http://localhost:80/api/docs
```

## 🌐 Что будет работать

После успешного запуска у вас будет:

✅ **Backend API** - полностью функциональный  
✅ **Простой веб-интерфейс** - современная статическая страница  
✅ **PostgreSQL** - база данных  
✅ **Redis** - кеширование  
✅ **Nginx** - веб-сервер и reverse proxy  

### Доступные URL:
- **Главная страница**: http://YOUR_SERVER_IP
- **API документация**: http://YOUR_SERVER_IP/api/docs  
- **Health check**: http://YOUR_SERVER_IP/health
- **КП Analyzer API**: http://YOUR_SERVER_IP/api/kp-analyzer/

## 🔄 Если все равно не работает

### Вариант 1: Полная очистка и пересборка
```bash
cd /opt/devassist-pro

# Останавливаем все
./stop-fullstack.sh

# Удаляем все контейнеры и образы
docker-compose -f docker-compose.fullstack.yml down --volumes --remove-orphans
docker system prune -af

# Пересобираем
./start-fullstack.sh --clean
```

### Вариант 2: Проверить .env файл
```bash
# Проверяем что API ключ настроен
grep ANTHROPIC_API_KEY .env

# Если нет - добавляем
echo "ANTHROPIC_API_KEY=sk-ant-api03-your-real-key-here" >> .env
```

### Вариант 3: Логи для диагностики
```bash
# Подробные логи Docker
docker-compose -f docker-compose.fullstack.yml logs app

# Системные логи
journalctl -f | grep docker

# Свободное место
df -h
```

## 📞 Проверка результата

После успешного запуска выполните:

```bash
# 1. Статус контейнеров
docker-compose -f docker-compose.fullstack.yml ps

# 2. Health checks
curl -s http://localhost:80/health | jq .
curl -s http://localhost:80/api/health | jq .

# 3. Веб-страница
curl -I http://localhost:80

# 4. Внешний доступ (замените на ваш IP)
curl -I http://5306863-kq25582:80
```

## 🎯 Ожидаемый результат

```bash
$ docker-compose -f docker-compose.fullstack.yml ps
NAME                          COMMAND                  SERVICE             STATUS              PORTS
devassist_app_simple          "/usr/local/bin/star…"   app                 running (healthy)   0.0.0.0:80->80/tcp
devassist_postgres_simple     "docker-entrypoint.s…"   postgres            running (healthy)   0.0.0.0:5432->5432/tcp
devassist_redis_simple        "docker-entrypoint.s…"   redis               running (healthy)   0.0.0.0:6379->6379/tcp
```

```bash
$ curl http://localhost:80/health
{"status":"healthy","version":"1.0.0","services":{"database":"connected","redis":"connected"}}
```

Система будет доступна по адресу: **http://YOUR_SERVER_IP**