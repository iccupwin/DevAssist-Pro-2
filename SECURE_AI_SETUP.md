# 🔐 Безопасная настройка AI интеграции

## ✅ Текущая архитектура (ПРАВИЛЬНАЯ)

### Backend (безопасно)
- API ключи хранятся в `.env` файле на сервере
- Backend читает ключи через переменные окружения
- Клиенты не имеют прямого доступа к API ключам
- Все AI запросы идут через backend API

### Frontend (безопасно) 
- НЕ хранит реальные API ключи
- Использует backend API для всех AI операций
- Отправляет запросы на `http://localhost:8000/api/*`

## 🔧 Настройка переменных окружения

### 1. Backend (.env в корне проекта)
```bash
# AI Provider API Keys
ANTHROPIC_API_KEY=sk-ant-api03-...  # Ваш реальный ключ
OPENAI_API_KEY=sk-proj-...          # Ваш реальный ключ
GOOGLE_API_KEY=AIzaSy...            # Ваш реальный ключ
```

### 2. Frontend (frontend/.env)
```bash
# Backend API URL (НЕ API ключи!)
REACT_APP_API_URL=http://localhost:8000

# Заглушки для API ключей (НЕ реальные!)
REACT_APP_ANTHROPIC_API_KEY=your_anthropic_api_key_here
REACT_APP_OPENAI_API_KEY=your_openai_api_key_here
```

## 📋 Проверка настройки

### 1. Проверить backend переменные:
```bash
docker exec devassist_app_monolith printenv | grep API_KEY
```

### 2. Проверить backend API:
```bash
curl http://localhost:8000/api/llm/providers
```

### 3. Протестировать AI анализ:
```bash
curl -X POST http://localhost:8000/api/kp-analyzer/analyze \
  -H "Content-Type: application/json" \
  -d '{"tz_file": "test.pdf", "kp_file": "proposal.pdf"}'
```

## 🚀 Как работает система

### Frontend → Backend → AI Provider

1. **Frontend** отправляет запрос:
   ```javascript
   fetch('http://localhost:8000/api/kp-analyzer/analyze', {
     method: 'POST',
     body: JSON.stringify({
       tz_file: 'tz.pdf',
       kp_file: 'kp.pdf',
       model: 'claude-3-5-sonnet'
     })
   })
   ```

2. **Backend** получает запрос и использует API ключ:
   ```python
   # backend/services/llm/orchestrator.py
   provider = AnthropicProvider(settings.ANTHROPIC_API_KEY)
   response = await provider.generate(prompt)
   ```

3. **AI Provider** получает запрос с ключом от backend

## ⚠️ Важные правила безопасности

1. **НИКОГДА** не коммитьте реальные API ключи
2. **НИКОГДА** не передавайте API ключи в frontend
3. **ВСЕГДА** используйте backend как прокси для AI
4. **ВСЕГДА** храните ключи в переменных окружения
5. **РЕГУЛЯРНО** ротируйте API ключи

## 🛡️ Дополнительная защита

### 1. Ограничение доступа по IP (production)
```nginx
location /api/llm {
    allow 10.0.0.0/8;  # Внутренняя сеть
    deny all;
}
```

### 2. Rate limiting
```python
# backend/api_gateway/main.py
@app.middleware("http")
async def rate_limit_middleware(request: Request, call_next):
    # Implement rate limiting
    pass
```

### 3. Аудит использования
```python
# backend/services/llm/usage_tracker.py
async def track_usage(user_id, model, tokens, cost):
    # Log usage to database
    pass
```

## 📊 Мониторинг

Следите за использованием API:
- Anthropic Console: https://console.anthropic.com/
- OpenAI Dashboard: https://platform.openai.com/usage
- Google Cloud Console: https://console.cloud.google.com/

## 🔄 Обновление ключей

При необходимости обновить API ключи:

1. Обновите `.env` файл
2. Перезапустите backend:
   ```bash
   docker restart devassist_app_monolith
   ```
3. Проверьте работоспособность