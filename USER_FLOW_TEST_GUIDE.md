# DevAssist Pro User Flow Testing Guide
Руководство по тестированию пользовательских сценариев

## 🎯 Обзор

Этот документ описывает полную систему тестирования user flow для DevAssist Pro, включая backend API тесты, frontend E2E тесты и интеграционные тесты.

## 📋 Структура тестов

### Backend тесты
- **E2E API тесты**: `backend/tests/e2e/test_user_flow.py`
- **Интеграционные тесты**: `backend/tests/integration/test_api_integration.py`
- **Тесты базы данных**: `backend/database_test.py`

### Frontend тесты
- **E2E UI тесты**: `frontend/tests/e2e/userFlow.test.ts`
- **Playwright конфигурация**: `frontend/playwright.config.ts`
- **Глобальная настройка**: `frontend/tests/e2e/global-setup.ts`

### Инструменты
- **Единый тест-раннер**: `test-runner.sh`
- **Мониторинг производительности**: Lighthouse аудит
- **Security тесты**: npm audit, safety

## 🚀 Быстрый старт

### Запуск всех тестов
```bash
./test-runner.sh
```

### Запуск конкретных наборов тестов
```bash
# Только backend тесты
./test-runner.sh --backend

# Только frontend тесты  
./test-runner.sh --frontend

# Только тесты базы данных
./test-runner.sh --database

# Тесты производительности
./test-runner.sh --performance

# Security тесты
./test-runner.sh --security
```

### Установка зависимостей
```bash
# Пропустить установку зависимостей
./test-runner.sh --skip-install

# Установка Playwright браузеров
cd frontend && npx playwright install
```

## 📱 Полный пользовательский сценарий

### 1. Регистрация и вход
- ✅ Регистрация нового пользователя
- ✅ Подтверждение email (опционально)
- ✅ Вход в систему
- ✅ Получение профиля пользователя
- ✅ Обновление профиля

### 2. Создание организации и проекта
- ✅ Создание организации
- ✅ Создание проекта в организации
- ✅ Настройка параметров проекта

### 3. Загрузка документов
- ✅ Загрузка ТЗ документа
- ✅ Загрузка КП документов
- ✅ Проверка формата файлов
- ✅ Извлечение текста из документов

### 4. Анализ КП
- ✅ Запуск анализа КП против ТЗ
- ✅ Мониторинг статуса анализа
- ✅ Получение результатов анализа
- ✅ Просмотр оценок соответствия
- ✅ Просмотр рекомендаций

### 5. Генерация отчетов
- ✅ Создание PDF отчета
- ✅ Создание Excel отчета
- ✅ Скачивание отчетов
- ✅ Просмотр истории отчетов

### 6. Управление данными
- ✅ Просмотр списка проектов
- ✅ Просмотр статистики использования
- ✅ Управление настройками профиля
- ✅ Выход из системы

## 🔧 Конфигурация тестов

### Environment Variables
```bash
# Backend
DATABASE_URL=postgresql://user:pass@localhost:5432/test_db
JWT_SECRET_KEY=test-secret-key
REDIS_URL=redis://localhost:6379/1

# Frontend
REACT_APP_API_URL=http://localhost:8000
REACT_APP_WS_URL=ws://localhost:8000
PLAYWRIGHT_BASE_URL=http://localhost:3000

# AI Services (для интеграционных тестов)
OPENAI_API_KEY=test-key
ANTHROPIC_API_KEY=test-key
GOOGLE_API_KEY=test-key
```

### Playwright конфигурация
```typescript
// playwright.config.ts
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium' },
    { name: 'firefox' },
    { name: 'webkit' },
    { name: 'Mobile Chrome' },
    { name: 'Mobile Safari' }
  ]
});
```

## 📊 Отчеты и метрики

### Coverage отчеты
- **Backend**: `backend/htmlcov/index.html`
- **Frontend**: `frontend/coverage/lcov-report/index.html`

### E2E отчеты
- **Playwright**: `frontend/playwright-report/index.html`
- **Screenshots**: `frontend/test-results/`
- **Videos**: `frontend/test-results/`

### Performance отчеты
- **Lighthouse**: `lighthouse-report.json`
- **API Response Times**: В логах тестов

## 🐛 Отладка тестов

### Backend отладка
```bash
# Запуск конкретного теста
cd backend
python -m pytest tests/e2e/test_user_flow.py::TestUserFlow::test_01_user_registration -v

# Запуск с отладкой
python -m pytest tests/e2e/test_user_flow.py -v -s --tb=long
```

### Frontend отладка
```bash
cd frontend

# Запуск конкретного теста
npx playwright test userFlow.test.ts -g "User can register"

# Запуск в UI режиме
npx playwright test --ui

# Запуск с отладкой
npx playwright test --debug
```

### Логи и трейсы
```bash
# Просмотр трейсов Playwright
npx playwright show-trace test-results/traces/trace.zip

# Просмотр видео
npx playwright show-report
```

## 🔒 Security тестирование

### Проверка зависимостей
```bash
# Frontend vulnerabilities
cd frontend && npm audit

# Backend vulnerabilities  
cd backend && safety check

# Автоматическая проверка
./test-runner.sh --security
```

### Тестирование аутентификации
- ✅ Тест доступа без токена
- ✅ Тест с недействительным токеном
- ✅ Тест истечения токена
- ✅ Тест CORS заголовков
- ✅ Тест rate limiting

## 📈 Performance тестирование

### Lighthouse аудит
```bash
# Запуск Lighthouse
lighthouse http://localhost:3000 --only-categories=performance

# В составе полных тестов
./test-runner.sh --performance
```

### Метрики производительности
- **API Response Time**: < 1 секунда
- **Page Load Time**: < 3 секунды  
- **First Contentful Paint**: < 1.5 секунды
- **Lighthouse Performance Score**: > 90

### Load тестирование
```bash
# Тест параллельных запросов
cd backend
python -m pytest tests/integration/test_api_integration.py::TestPerformanceBaseline::test_concurrent_requests
```

## 🔄 CI/CD интеграция

### GitHub Actions
```yaml
name: E2E Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run tests
        run: ./test-runner.sh
      - name: Upload reports
        uses: actions/upload-artifact@v3
        with:
          name: test-reports
          path: |
            frontend/playwright-report/
            frontend/coverage/
            backend/htmlcov/
```

### Docker тестирование
```bash
# Тестирование в Docker окружении
docker-compose -f docker-compose.test.yml up --build --abort-on-container-exit
```

## 🎯 Best Practices

### Написание тестов
1. **Изоляция**: Каждый тест должен быть независимым
2. **Очистка**: Удалять тестовые данные после каждого теста
3. **Ожидания**: Использовать явные ожидания вместо sleep()
4. **Data-testid**: Использовать стабильные селекторы
5. **Реалистичность**: Тесты должны имитировать реальное поведение пользователей

### Обработка ошибок
```typescript
// Хороший пример
await expect(page.locator('[data-testid="error-message"]'))
  .toContainText('Неверный пароль');

// Плохой пример  
await page.waitForTimeout(5000);
```

### Page Object Model
```typescript
class LoginPage {
  constructor(private page: Page) {}
  
  async login(email: string, password: string) {
    await this.page.fill('[data-testid="email-input"]', email);
    await this.page.fill('[data-testid="password-input"]', password);
    await this.page.click('[data-testid="login-button"]');
  }
}
```

## 🆘 Устранение неполадок

### Частые проблемы

1. **Тайм-ауты тестов**
   ```bash
   # Увеличить тайм-аут в playwright.config.ts
   timeout: 60 * 1000
   ```

2. **Проблемы с WebSocket**
   ```bash
   # Проверить доступность WebSocket endpoint
   curl -i -N -H "Connection: Upgrade" -H "Upgrade: websocket" -H "Sec-WebSocket-Key: test" -H "Sec-WebSocket-Version: 13" http://localhost:8000/ws/test
   ```

3. **База данных недоступна**
   ```bash
   # Проверить PostgreSQL
   pg_isready -h localhost -p 5432
   
   # Запустить базу данных
   docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=test postgres:13
   ```

4. **AI API недоступны**
   ```bash
   # Проверить API ключи в .env
   # Использовать mock AI сервис для тестов
   REACT_APP_USE_MOCK_AI=true
   ```

### Логи отладки
```bash
# Включить verbose логи
DEBUG=true ./test-runner.sh

# Playwright отладка
DEBUG=pw:api npx playwright test

# Python отладка
export PYTHONPATH=$PWD/backend
python -m pytest -v -s --log-cli-level=DEBUG
```

## 📚 Дополнительные ресурсы

- [Playwright Documentation](https://playwright.dev/docs/intro)
- [pytest Documentation](https://docs.pytest.org/)
- [FastAPI Testing](https://fastapi.tiangolo.com/tutorial/testing/)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)

## 🎉 Заключение

Эта система тестирования обеспечивает полное покрытие пользовательских сценариев DevAssist Pro, от регистрации до генерации отчетов. Регулярный запуск этих тестов гарантирует стабильность и качество приложения.

Для вопросов и предложений по улучшению тестов создавайте issues в репозитории проекта.