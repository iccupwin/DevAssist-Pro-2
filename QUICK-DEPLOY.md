# 🚀 DevAssist Pro - Быстрое развертывание

## Одна команда для запуска всей системы

### 📋 Предварительные требования

- Docker 20.10+
- Docker Compose 2.0+
- 4GB+ RAM
- 20GB+ свободного места

### ⚡ Быстрый старт (3 шага)

```bash
# 1. Настройка окружения
cp .env.fullstack.example .env
# Отредактируйте .env файл (особенно ANTHROPIC_API_KEY)

# 2. Запуск системы
./start-fullstack.sh

# 3. Проверка работы
./test-fullstack.sh
```

### 🌟 Готово!

Система доступна по адресу: **http://localhost:80**

---

## 🔧 Управление

```bash
# Запуск
./start-fullstack.sh

# Остановка
./stop-fullstack.sh

# Тестирование
./test-fullstack.sh

# Логи
docker-compose -f docker-compose.fullstack.yml logs -f
```

## 📊 Доступные URL

- **Frontend**: http://localhost:80
- **API Docs**: http://localhost:80/api/docs
- **Health**: http://localhost:80/health

## ⚙️ Важные настройки в .env

```bash
# ОБЯЗАТЕЛЬНО настроить
ANTHROPIC_API_KEY=sk-ant-api03-your-key-here
POSTGRES_PASSWORD=secure_password
REDIS_PASSWORD=secure_password

# РЕКОМЕНДУЕТСЯ настроить
JWT_SECRET_KEY=your-32-char-secret
SESSION_SECRET=your-32-char-secret
```

## 🆘 Troubleshooting

```bash
# Проблемы с запуском
docker-compose -f docker-compose.fullstack.yml logs fullstack

# Полная перезагрузка
./stop-fullstack.sh --clean
./start-fullstack.sh --rebuild

# Проверка статуса
docker-compose -f docker-compose.fullstack.yml ps
```

---
**Полная документация**: `README-FULLSTACK.md`