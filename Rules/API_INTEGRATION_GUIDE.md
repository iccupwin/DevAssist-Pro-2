# 🔌 API Integration Guide - DevAssist Pro Frontend

## 📋 Обзор

Настроена полная интеграция API для frontend части DevAssist Pro согласно техническому заданию. Система включает:

- ✅ **Централизованная конфигурация API**
- ✅ **HTTP клиент с retry и timeout логикой**
- ✅ **Мониторинг и аналитика запросов**
- ✅ **Rate limiting (клиентская сторона)**
- ✅ **Прогресс трекинг для долгих операций**
- ✅ **Fallback на mock данные**

## 🏗️ Архитектура

```
src/config/api.ts          - Основная конфигурация API
src/services/httpClient.ts - HTTP клиент с расширенными возможностями
src/services/apiWrapper.ts - Интегрированный API wrapper
src/services/apiMonitoring.ts - Мониторинг и аналитика
src/services/apiClient.ts  - Совместимость с существующим кодом
```

## ⚙️ Конфигурация

### Environment Variables (.env)

```bash
# API Configuration
REACT_APP_API_URL=http://localhost:8000
REACT_APP_USE_REAL_API=false

# AI Models
REACT_APP_DEFAULT_ANALYSIS_MODEL=claude-3-5-sonnet-20240620
REACT_APP_DEFAULT_COMPARISON_MODEL=gpt-4o

# Feature Flags
REACT_APP_ENABLE_STREAMING=true
REACT_APP_MAX_FILE_SIZE=10485760
REACT_APP_SUPPORTED_FORMATS=pdf,docx,doc,txt
```

### API Endpoints

| Endpoint | Метод | Описание |
|----------|-------|----------|
| `/api/upload` | POST | Загрузка файлов ТЗ и КП |
| `/api/analyze` | POST | Анализ КП против ТЗ |
| `/api/compare-all` | POST | Сравнение всех КП |
| `/api/generate-report` | POST | Генерация итогового отчета |
| `/api/health` | GET | Проверка состояния backend |
| `/api/models` | GET | Получение доступных AI моделей |
| `/api/usage/stats` | GET | Статистика использования |

## 🔧 Использование

### Базовое использование

```typescript
import { devAssistApi, useDevAssistApi } from './services/apiWrapper';

// В React компоненте
const MyComponent = () => {
  const api = useDevAssistApi();
  
  const handleFileUpload = async (files: File[]) => {
    const result = await api.uploadFiles(
      { kpFiles: files },
      (progress) => console.log('Progress:', progress.percentage)
    );
    
    if (result.success) {
      console.log('Uploaded:', result.data);
    }
  };
};
```

### Анализ с прогрессом

```typescript
const analyzeKP = async () => {
  const result = await devAssistApi.analyzeKP(
    '/path/to/tz.pdf',
    '/path/to/kp.pdf',
    [],
    'claude-3-5-sonnet-20240620',
    (progress) => {
      setAnalysisProgress({
        step: progress.step,
        message: progress.currentOperation,
        percentage: progress.percentage
      });
    }
  );
};
```

### Мониторинг API

```typescript
import { useApiMonitoring } from './services/apiMonitoring';

const ApiDashboard = () => {
  const monitoring = useApiMonitoring();
  
  const metrics = monitoring.getMetrics();
  const errorStats = monitoring.getErrorStats();
  
  return (
    <div>
      <p>Requests: {metrics.requestCount}</p>
      <p>Error Rate: {errorStats.errorRate.toFixed(2)}%</p>
      <p>Avg Response: {metrics.averageResponseTime}ms</p>
    </div>
  );
};
```

## 🔄 Rate Limiting

Настроены лимиты на клиентской стороне:

- **30 запросов/минуту** - общие запросы
- **50 анализов/час** - операции анализа КП
- **100 загрузок/час** - загрузка файлов

```typescript
const rateLimitCheck = apiMonitoring.checkRateLimit();
if (!rateLimitCheck.allowed) {
  console.log('Rate limit exceeded');
}
```

## 📊 Мониторинг

### Метрики

- Количество запросов
- Частота ошибок
- Среднее время отклика
- Статус rate limits
- Логи запросов

### Экспорт аналитики

```typescript
const exportData = apiMonitoring.exportMetrics();
console.log(exportData); // JSON с полной статистикой
```

## 🚨 Обработка ошибок

### Автоматические retry

```typescript
// Настройка в API_CONFIG
REQUEST: {
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // с exponential backoff
}
```

### Graceful fallbacks

```typescript
// При недоступности API используются mock данные
const response = await devAssistApi.getAvailableModels();
// Автоматически fallback к локальным моделям если backend недоступен
```

## 🔒 Безопасность

### Валидация файлов

```typescript
// Автоматическая валидация размера и формата
const validation = fileService.validateFile(file);
if (!validation.isValid) {
  console.error(validation.error);
}
```

### Timeout защита

```typescript
// Все запросы имеют timeout
const response = await httpClient.post('ANALYZE', data, {
  timeout: 120000 // 2 минуты
});
```

## 🎛️ Feature Flags

Управление функциональностью через environment variables:

```typescript
if (API_CONFIG.STREAMING.ENABLED) {
  // Включить streaming обновления
}

if (process.env.REACT_APP_ENABLE_ANALYTICS === 'true') {
  // Отправлять аналитику
}
```

## 🔧 Backend Requirements

⚠️ **Следующие эндпоинты должны быть реализованы в backend:**

1. `POST /api/upload` - загрузка файлов
2. `POST /api/analyze` - анализ КП
3. `POST /api/compare-all` - сравнение КП
4. `POST /api/generate-report` - генерация отчетов
5. `GET /api/health` - health check
6. `GET /api/models` - список доступных моделей
7. `GET /api/usage/stats` - статистика использования

### Ожидаемые форматы ответов

```typescript
// Health check
GET /api/health
Response: { status: "ok", version: "1.0.0", models: ["claude-3-5-sonnet"] }

// File upload
POST /api/upload
Response: {
  tz_file: { filePath: "/uploads/tz.pdf", originalName: "tz.pdf" },
  kp_files: [{ filePath: "/uploads/kp1.pdf", originalName: "kp1.pdf" }],
  additional_files: []
}

// Analysis
POST /api/analyze
Response: AnalysisResult (см. типы в apiClient.ts)
```

## 🚀 Развертывание

### Продакшн конфигурация

```bash
REACT_APP_API_URL=https://api.devassist.pro
REACT_APP_USE_REAL_API=true
REACT_APP_ENABLE_STREAMING=true
REACT_APP_ENABLE_ANALYTICS=true
```

### Staging конфигурация

```bash
REACT_APP_API_URL=https://staging-api.devassist.pro
REACT_APP_USE_REAL_API=true
REACT_APP_ENABLE_ANALYTICS=false
```

---

**✅ API интеграция полностью настроена и готова к работе с backend!**