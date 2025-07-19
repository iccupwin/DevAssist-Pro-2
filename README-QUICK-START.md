# 🚀 DevAssist Pro - Quick Start Guide

## ⚡ One-Command Setup

```bash
# Убедитесь что Docker запущен, затем:
./start-dev.sh
```

**Результат:** Полностью рабочая среда разработки за 5 минут!

## 🔑 Обязательная Настройка API Ключей

**Перед запуском добавьте ваш Claude API ключ:**

1. **Откройте** `.env` файл
2. **Замените** `ANTHROPIC_API_KEY=sk-ant-api03-...` на ваш реальный ключ
3. **Откройте** `frontend/.env` файл  
4. **Замените** `REACT_APP_ANTHROPIC_API_KEY=sk-ant-api03-...` на тот же ключ

## 📍 Доступные Сервисы

После запуска откройте в браузере:

- **💻 React Frontend:** http://localhost:3000
- **🔧 API Gateway:** http://localhost:8000
- **📚 API Docs:** http://localhost:8000/docs
- **🌊 Streamlit Legacy:** http://localhost:8501

## ✅ Что Проверить

1. **Аутентификация** - Регистрация/вход должны работать
2. **Claude API** - Проверьте Console на ошибки API
3. **КП Анализатор** - Загрузите тестовые файлы
4. **Session Persistence** - Обновите страницу (токены сохранятся)

## 🛑 Остановка

```bash
# Остановить все сервисы
docker-compose -f docker-compose.dev.yml down

# Или просто Ctrl+C в терминале со скриптом
```

## 🔧 Проблемы?

**Посмотрите полный анализ:** `COMPREHENSIVE_ANALYSIS_REPORT.md`

**Частые проблемы:**
- Docker не запущен → `docker --version` 
- API ключи не настроены → Отредактируйте `.env` файлы
- Порты заняты → Остановите другие сервисы

## 📞 Быстрые Команды

```bash
# Просмотр логов
docker-compose -f docker-compose.dev.yml logs -f

# Перезапуск сервиса
docker-compose -f docker-compose.dev.yml restart frontend

# Статус сервисов
docker-compose -f docker-compose.dev.yml ps

# Health check
curl http://localhost:8000/health
```

---

**✨ Готово! DevAssist Pro запущен и готов к разработке.**