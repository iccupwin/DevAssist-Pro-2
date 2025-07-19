# 🔥 СРОЧНЫЙ DEPLOY - 2 команды

## ⚡ Если у вас ошибка npm build

**На сервере выполните:**

```bash
cd /opt/devassist-pro
./fix-npm-error.sh
```

**Готово!** Система будет работать через 2-3 минуты.

---

## 🚀 Полная установка с нуля

### На чистом сервере (Ubuntu/CentOS):

```bash
# 1. Автоматическая установка всего
sudo wget -O - https://raw.githubusercontent.com/your-repo/DevAssist-Pro/main/server-install.sh | bash

# 2. Или ручная установка
sudo apt update && sudo apt install -y docker.io docker-compose git
git clone https://github.com/your-repo/DevAssist-Pro.git /opt/devassist-pro
cd /opt/devassist-pro
cp .env.fullstack.example .env
nano .env  # Добавить ANTHROPIC_API_KEY
sudo ./start-fullstack.sh
```

---

## 🆘 Если что-то сломалось

```bash
cd /opt/devassist-pro

# Полная диагностика
./check-system.sh

# Исправление npm ошибки
./fix-npm-error.sh  

# Полная перезагрузка
./stop-fullstack.sh && ./start-fullstack.sh --clean

# Логи для отладки
docker-compose -f docker-compose.fullstack.yml logs -f
```

---

## 📊 Проверка что все работает

```bash
# Быстрая проверка
curl http://localhost:80/health

# Полная проверка  
./check-system.sh

# Веб-интерфейс
# Откройте в браузере: http://YOUR_SERVER_IP
```

---

## 🎯 Что получается в итоге

✅ **Backend API** - полностью работает  
✅ **Веб-интерфейс** - современная страница с доступом к API  
✅ **База данных** - PostgreSQL готова к работе  
✅ **Кеширование** - Redis настроен  
✅ **Автозапуск** - система стартует при перезагрузке  

### Доступные URL:
- **http://YOUR_SERVER_IP** - главная страница
- **http://YOUR_SERVER_IP/api/docs** - API документация  
- **http://YOUR_SERVER_IP/health** - статус системы

---

## 🔧 Управление системой

```bash
# Статус
docker-compose -f docker-compose.fullstack.yml ps

# Остановка
./stop-fullstack.sh

# Запуск
./start-fullstack.sh

# Перезапуск с пересборкой
./start-fullstack.sh --rebuild

# Полная очистка и запуск
./start-fullstack.sh --clean
```

---

**⏱️ Время установки:** 5-10 минут  
**💾 Требования:** 4GB RAM, Ubuntu 20.04+, Docker  
**🔑 Обязательно:** API ключ Anthropic в .env файле  

**🎉 Production ready!**