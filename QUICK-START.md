# ⚡ БЫСТРЫЙ СТАРТ BACKEND

## На сервере выполните по порядку:

### 1. Установите зависимости Python:
```bash
chmod +x install-deps-server.sh
./install-deps-server.sh
```

### 2. Запустите backend:
```bash
chmod +x start-backend-simple.sh
./start-backend-simple.sh
```

## Что должно произойти:

1. ✅ Установятся Python зависимости (FastAPI, uvicorn, etc.)
2. ✅ Запустится backend на порту 8000
3. ✅ CORS будет настроен для frontend
4. ✅ Аутентификация заработает

## Результат:

- 🌐 Frontend: http://46.149.71.162:3000 (уже работает)
- 🔧 Backend: http://46.149.71.162:8000 (запустится)
- 🔐 Логин/регистрация будут работать!

## Проверка:

В другом терминале:
```bash
curl http://46.149.71.162:8000/health
```

Должен вернуть: `{"status":"healthy",...}`

## Остановка:

Нажмите `Ctrl+C` в терминале где запущен backend

---

**Если не работает** - проверьте что Python3 установлен:
```bash
sudo apt update
sudo apt install python3 python3-pip python3-venv
```