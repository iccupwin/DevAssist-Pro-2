# Node.js v12 → v18 Upgrade Guide

## Проблема
Node.js v12.22.9 слишком старая для современной сборки React. Код ошибки 127 означает, что современные инструменты сборки не работают с такой старой версией.

## Решения (выберите одно)

### ✅ Вариант 1: Обновить Node.js до v18 (Рекомендуется)
```bash
# На сервере выполните:
sudo ./upgrade-nodejs-server.sh

# Затем запустите обычную сборку:
./build-production-frontend.sh
```

### ✅ Вариант 2: Legacy сборка для Node.js v12
```bash
# Если не можете обновить Node.js, используйте legacy скрипт:
./build-frontend-legacy.sh
```

### ✅ Вариант 3: Ручное обновление Node.js
```bash
# Если автоматический скрипт не работает:
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Проверить версию:
node --version  # Должно показать v18.x.x
npm --version   # Должно показать v9.x.x или выше
```

## Что делает каждый скрипт

### `upgrade-nodejs-server.sh`
- ✅ Создает резервную копию текущей установки
- ✅ Безопасно удаляет Node.js v12
- ✅ Устанавливает Node.js v18 LTS
- ✅ Обновляет NPM до последней версии
- ✅ Проверяет работоспособность

### `build-frontend-legacy.sh`
- ✅ Работает с Node.js v12
- ✅ Использует упрощенные настройки сборки
- ✅ Создает минимальную рабочую версию если сборка не удается
- ✅ Развертывает через Docker с nginx

## После обновления Node.js

```bash
# Проверьте версию
node --version   # Должно быть v18.x.x
npm --version    # Должно быть v9.x.x+

# Очистите кэш npm
npm cache clean --force

# Переустановите зависимости
cd frontend
rm -rf node_modules package-lock.json
npm install

# Запустите обычную сборку
cd ..
./build-production-frontend.sh
```

## Проверка результата

После успешного развертывания:
- **Frontend**: http://46.149.71.162:3000
- **Health Check**: http://46.149.71.162:3000/health
- **Backend API**: http://46.149.71.162:8000
- **API Docs**: http://46.149.71.162:8000/docs

## Устранение проблем

### Если обновление Node.js не удалось
```bash
# Восстановить из резервной копии
sudo cp /opt/nodejs-backup/node /usr/bin/node
sudo cp /opt/nodejs-backup/npm /usr/bin/npm

# Использовать legacy сборку
./build-frontend-legacy.sh
```

### Если сборка все еще не работает
```bash
# Проверить логи
tail -50 build-production.log

# Очистить все и переустановить
cd frontend
rm -rf node_modules package-lock.json .cache build
npm cache clean --force
npm install
cd ..
./build-production-frontend.sh
```

### Если Docker контейнер не запускается
```bash
# Проверить логи контейнера
docker logs devassist-frontend-production

# Перезапустить контейнер
docker restart devassist-frontend-production

# Пересоздать контейнер
docker stop devassist-frontend-production
docker rm devassist-frontend-production
./build-production-frontend.sh
```

## Важные моменты

1. **Резервное копирование**: Скрипт обновления создает резервную копию в `/opt/nodejs-backup`
2. **Права доступа**: Для обновления Node.js нужны root права
3. **Legacy режим**: Создает минимально рабочую версию, но без полного функционала React
4. **Совместимость**: Node.js v18 LTS полностью совместим с современным React

## Рекомендация

**Настоятельно рекомендуется обновить Node.js до v18**, так как:
- v12 больше не поддерживается
- Современные инструменты разработки требуют v16+
- Лучшая производительность и безопасность
- Полная совместимость с вашим React кодом