# Команды для выполнения НА СЕРВЕРЕ

## 1. Проверка что занимает порт 80

```bash
# Проверить что слушает порт 80
sudo lsof -i :80

# Или
sudo netstat -tlnp | grep :80

# Остановить системный nginx
sudo systemctl stop nginx
sudo systemctl disable nginx
```

## 2. Проверка Docker контейнеров

```bash
# Посмотреть все контейнеры
docker ps -a

# Посмотреть образы
docker images | grep devassist

# Удалить старые контейнеры
docker stop $(docker ps -a -q --filter "name=devassist-frontend")
docker rm $(docker ps -a -q --filter "name=devassist-frontend")
```

## 3. Если нет образа frontend

Если образ `devassist-frontend:latest` не найден, выполните один из скриптов:

```bash
# Вариант 1 - исправить все URL и собрать
./fix-all-api-urls.sh

# Вариант 2 - быстрая сборка с исправлениями
./fix-api-urls.sh

# Вариант 3 - простая сборка
./start-frontend-fixed.sh
```

## 4. Запустить frontend вручную

```bash
# Убедиться что порт 80 свободен
sudo lsof -i :80

# Запустить контейнер
docker run -d \
    --name devassist-frontend \
    --restart unless-stopped \
    -p 80:80 \
    devassist-frontend:latest

# Проверить логи
docker logs devassist-frontend

# Проверить что работает
curl http://localhost
```

## 5. Если все еще показывает "Welcome to nginx"

Это значит что системный nginx перехватывает запросы:

```bash
# Полностью остановить системный nginx
sudo systemctl stop nginx
sudo systemctl disable nginx
sudo killall nginx

# Проверить что nginx процессов нет
ps aux | grep nginx

# Перезапустить Docker контейнер
docker restart devassist-frontend
```

## 6. Проверка работы

```bash
# Должен показать ваш React frontend, не nginx welcome
curl http://46.149.67.122/

# Проверить что API проксируется
curl http://46.149.67.122/health
```

## 7. Если нужно пересобрать все с нуля

```bash
# Остановить все
docker stop $(docker ps -a -q)
docker system prune -a

# Запустить полный стек с БД
./start-with-database.sh
```