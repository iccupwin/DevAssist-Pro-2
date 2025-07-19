# ⚡ DevAssist Pro - Мгновенный deploy на сервер

## 🚀 СУПЕР БЫСТРЫЙ DEPLOY (2 команды)

### Вариант 1: Автоматическая установка

```bash
# 1. Скачать и запустить автоустановку
wget https://raw.githubusercontent.com/your-repo/DevAssist-Pro/main/server-install.sh
sudo bash server-install.sh

# 2. Готово! Система установлена и запущена
```

### Вариант 2: Ручная установка

```bash
# 1. Подготовка (Ubuntu/Debian)
sudo apt update && sudo apt install -y docker.io docker-compose git
sudo systemctl start docker && sudo systemctl enable docker

# 2. Загрузка и запуск
git clone https://github.com/your-repo/DevAssist-Pro.git
cd DevAssist-Pro
cp .env.fullstack.example .env
nano .env  # Настроить ANTHROPIC_API_KEY
sudo ./start-fullstack.sh

# 3. Готово!
```

---

## ⚙️ Минимальные настройки в .env

```bash
# ОБЯЗАТЕЛЬНО изменить:
ANTHROPIC_API_KEY=sk-ant-api03-your-real-key-here
POSTGRES_PASSWORD=your_secure_password
REDIS_PASSWORD=your_secure_password
```

---

## 🌐 Доступ к системе

После установки:
- **Frontend**: http://YOUR_SERVER_IP
- **API Docs**: http://YOUR_SERVER_IP/api/docs
- **Health**: http://YOUR_SERVER_IP/health

---

## 🔧 Управление

```bash
# Статус
sudo systemctl status devassist-pro

# Перезапуск
sudo systemctl restart devassist-pro

# Логи
sudo journalctl -u devassist-pro -f

# Остановка
sudo systemctl stop devassist-pro
```

---

## 🆘 Если что-то не работает

```bash
# Проверить статус Docker
sudo systemctl status docker

# Проверить контейнеры
cd /opt/devassist-pro
sudo docker-compose -f docker-compose.fullstack.yml ps

# Посмотреть логи
sudo docker-compose -f docker-compose.fullstack.yml logs -f

# Полный перезапуск
sudo ./stop-fullstack.sh
sudo ./start-fullstack.sh --rebuild
```

---

**Время установки: 5-10 минут** ⏱️  
**Требования: Ubuntu 20.04+, 4GB RAM, Docker** 📋

**Готово к production использованию!** 🎉