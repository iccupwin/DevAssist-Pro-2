# 🔧 Руководство по настройке API ключей

## ❌ Текущие проблемы

1. **OpenAI API**: Неправильный формат ключа
2. **Claude API**: Возможная проблема с сетью или CORS

## ✅ Решение проблем

### 1. Исправление OpenAI API ключа

Ваш текущий ключ имеет неправильный формат:
```
Ask-proj-PbiW23BCHveiJfYxBIIn0PUm...
```

**Правильный формат OpenAI ключа:**
```
sk-proj-[остальная часть ключа]
```

#### Как получить правильный ключ:
1. Перейдите на https://platform.openai.com/account/api-keys
2. Войдите в аккаунт
3. Создайте новый API ключ
4. Скопируйте полный ключ (должен начинаться с `sk-`)

### 2. Исправление Claude API (Anthropic)

Ваш ключ правильный, но есть проблема "Failed to fetch". Возможные причины:

#### A. CORS проблема (наиболее вероятно)
- Браузеры блокируют прямые запросы к Anthropic API
- **Решение**: Используйте backend proxy или mock режим

#### B. Неправильная настройка сети
- Проверьте интернет соединение
- Убедитесь что нет корпоративного firewall

## 🛠️ Исправление

### Шаг 1: Обновите OpenAI ключ в .env

Откройте файл `/frontend/.env` и замените:
```env
REACT_APP_OPENAI_API_KEY=your-correct-openai-key-here
```

### Шаг 2: Временно используйте mock режим

В `.env` файле:
```env
REACT_APP_USE_REAL_API=false
```

Это позволит системе работать с mock данными без реальных API вызовов.

### Шаг 3: Перезапустите frontend

```bash
cd frontend
npm start
```

## 🔄 Альтернативные решения

### 1. Backend Proxy (Рекомендуется для production)

Создайте backend endpoint, который будет проксировать запросы к AI API:

```typescript
// backend/proxy-ai.ts
app.post('/api/ai/anthropic', async (req, res) => {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.ANTHROPIC_API_KEY}`,
      'Content-Type': 'application/json',
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify(req.body)
  });
  
  const data = await response.json();
  res.json(data);
});
```

### 2. Environment Variables для Production

```env
# Production настройки
REACT_APP_USE_REAL_API=true
REACT_APP_API_URL=https://your-backend.com/api
```

## 📊 Проверка статуса

После исправления, в Dashboard должно показывать:

✅ **Claude API**: Статус OK  
✅ **ChatGPT API**: Статус OK

## ⚡ Быстрое решение (прямо сейчас)

1. **Получите правильный OpenAI ключ** на https://platform.openai.com/account/api-keys
2. **Обновите .env файл**:
   ```env
   REACT_APP_OPENAI_API_KEY=sk-your-new-key-here
   REACT_APP_USE_REAL_API=false  # Используйте mock режим временно
   ```
3. **Перезапустите приложение**:
   ```bash
   npm start
   ```

## 🔐 Безопасность

⚠️ **ВАЖНО**: Никогда не коммитьте API ключи в git!

Добавьте в `.gitignore`:
```
.env
.env.local
.env.production
```

## 📞 Нужна помощь?

Если проблемы остаются:
1. Проверьте console браузера на ошибки
2. Убедитесь что ключи правильного формата  
3. Попробуйте mock режим для тестирования